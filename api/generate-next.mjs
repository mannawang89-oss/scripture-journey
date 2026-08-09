export const config = { maxDuration: 300 }

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const geminiKey = process.env.GEMINI_API_KEY
const model = process.env.GEMINI_MODEL ?? 'gemini-3.6-flash'
const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

async function db(path, options = {}) {
  const result = await fetch(`${url}/rest/v1/${path}`, { ...options, headers: { ...headers, ...options.headers } })
  if (!result.ok) throw new Error(`Supabase ${result.status}: ${await result.text()}`)
  const text = await result.text()
  return text ? JSON.parse(text) : null
}

async function gemini(prompt) {
  const result = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } }),
  })
  if (!result.ok) throw new Error(`Gemini ${result.status}: ${await result.text()}`)
  const body = await result.json()
  return JSON.parse(body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '')
}

function versePrompt(book, chapter, verses) {
  return `根据以下 World English Bible 经文生成严谨的简体中文学习内容。每节返回 literal_zh（贴近原句）、natural_zh（自然现代中文）、source_language_notes_zh（谨慎解释希伯来文或希腊文；不确定时说明限度）、first_readers_zh（最初读者可能的理解）。不虚构事实。只输出合法 JSON 数组，节号必须完全一致：\n${verses.map(v => `${v.verse_number}. ${v.verse_text}`).join('\n')}\n结构：[${JSON.stringify({ verse_number: verses[0].verse_number, literal_zh: '', natural_zh: '', source_language_notes_zh: '', first_readers_zh: '' })}]\n书卷：${book.name_en}（${book.name_zh}）第${chapter}章`
}

function studyPrompt(book, chapter, verses) {
  return `根据以下 World English Bible 经文，为${book.name_en}（${book.name_zh}）第${chapter}章生成严谨的简体中文研读。四项各180–350中文字，不虚构作者、年代或历史结论，有争议处使用审慎措辞。只输出合法 JSON：{"overview_zh":"","structure_zh":"","historical_background_zh":"","theological_themes_zh":""}\n${verses.map(v => `${v.verse_number}. ${v.verse_text}`).join('\n')}`
}

export default async function handler(request, response) {
  if (!url || !serviceKey || !geminiKey) return response.status(503).json({ error: 'Missing server configuration' })
  const authorization = request.headers.authorization
  const cronSecret = process.env.CRON_SECRET
  const authorizedCron = request.method === 'GET' && Boolean(cronSecret) && authorization === `Bearer ${cronSecret}`
  const authorizedManual = request.method === 'POST' && authorization === `Bearer ${geminiKey}`
  if (!authorizedCron && !authorizedManual) return response.status(401).json({ error: 'Unauthorized' })
  try {
    const [translation] = await db('bible_translations?code=eq.WEB&select=id&limit=1')
    const books = await db('bible_books?name_en=in.(Genesis,Luke)&select=id,name_en,name_zh,chapter_count,book_order&order=book_order')
    let target
    for (const book of books) {
      for (let chapter = 1; chapter <= book.chapter_count; chapter += 1) {
        const rows = await db(`bible_ai_verse_content?translation_id=eq.${translation.id}&book_id=eq.${book.id}&chapter_number=eq.${chapter}&select=verse_number`)
        const studies = await db(`bible_ai_chapter_studies?translation_id=eq.${translation.id}&book_id=eq.${book.id}&chapter_number=eq.${chapter}&select=chapter_number`)
        const verses = await db(`bible_verses?translation_id=eq.${translation.id}&book_id=eq.${book.id}&chapter_number=eq.${chapter}&select=verse_number,verse_text&order=verse_number`)
        if (rows.length < verses.length || !studies.length) { target = { book, chapter, verses }; break }
      }
      if (target) break
    }
    if (!target) return response.status(200).json({ complete: true })
    const generated = []
    for (let index = 0; index < target.verses.length; index += 10) {
      const chunk = target.verses.slice(index, index + 10)
      const result = await gemini(versePrompt(target.book, target.chapter, chunk))
      if (!Array.isArray(result) || result.length !== chunk.length) throw new Error('Gemini verse count mismatch')
      generated.push(...result)
    }
    await db('bible_ai_verse_content?on_conflict=translation_id,book_id,chapter_number,verse_number', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(generated.map(v => ({ translation_id: translation.id, book_id: target.book.id, chapter_number: target.chapter, ...v, model }))) })
    const study = await gemini(studyPrompt(target.book, target.chapter, target.verses))
    await db('bible_ai_chapter_studies?on_conflict=translation_id,book_id,chapter_number', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ translation_id: translation.id, book_id: target.book.id, chapter_number: target.chapter, ...study, model }) })
    return response.status(200).json({ complete: false, generated: `${target.book.name_en} ${target.chapter}`, verses: generated.length })
  } catch (error) {
    return response.status(500).json({ error: error.message })
  }
}
