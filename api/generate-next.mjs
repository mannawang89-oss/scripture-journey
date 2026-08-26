import { generateText } from 'ai'

export const config = { maxDuration: 300 }

const DEFAULT_BATCH_SIZE = 24
const MAX_BATCH_SIZE = 30
const EXECUTION_BUDGET_MS = 240_000

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const model = 'openai/gpt-5.4-mini-fast'
const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

async function db(path, options = {}) {
  const result = await fetch(`${url}/rest/v1/${path}`, { ...options, headers: { ...headers, ...options.headers } })
  if (!result.ok) throw new Error(`Supabase ${result.status}: ${await result.text()}`)
  const text = await result.text()
  return text ? JSON.parse(text) : null
}

async function generateJson(prompt) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const result = await generateText({ model, prompt })
      const json = result.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '')
      return JSON.parse(json)
    } catch (error) {
      lastError = error
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 3000))
    }
  }
  throw lastError
}

function versePrompt(book, chapter, verses) {
  return `根据以下 World English Bible 经文生成严谨的简体中文学习内容。每节返回 literal_zh（贴近原句）、natural_zh（自然现代中文）、source_language_notes_zh（谨慎解释希伯来文或希腊文；不确定时说明限度）、first_readers_zh（最初读者可能的理解）。不虚构事实。只输出合法 JSON 数组，节号必须完全一致：\n${verses.map(v => `${v.verse_number}. ${v.verse_text}`).join('\n')}\n结构：[${JSON.stringify({ verse_number: verses[0].verse_number, literal_zh: '', natural_zh: '', source_language_notes_zh: '', first_readers_zh: '' })}]\n书卷：${book.name_en}（${book.name_zh}）第${chapter}章`
}

function studyPrompt(book, chapter, verses) {
  return `根据以下 World English Bible 经文，为${book.name_en}（${book.name_zh}）第${chapter}章生成严谨的简体中文研读。四项各180–350中文字，不虚构作者、年代或历史结论，有争议处使用审慎措辞。只输出合法 JSON：{"overview_zh":"","structure_zh":"","historical_background_zh":"","theological_themes_zh":""}\n${verses.map(v => `${v.verse_number}. ${v.verse_text}`).join('\n')}`
}

function chapterPrompt(book, chapter, verses) {
  return `根据以下 World English Bible 经文，为${book.name_en}（${book.name_zh}）第${chapter}章生成完整的简体中文多译本与章节研读。每节必须返回 literal_zh（贴近原句）、natural_zh（自然现代中文）、source_language_notes_zh（谨慎且简洁地解释确有帮助的原文）、first_readers_zh（简洁说明最初读者可能的理解）。不添加经文没有表达的事实；各字段控制在一至两句。章节研读四项各180–350中文字。只输出合法 JSON，节号与数量必须完全一致：{"verses":[{"verse_number":1,"literal_zh":"","natural_zh":"","source_language_notes_zh":"","first_readers_zh":""}],"study":{"overview_zh":"","structure_zh":"","historical_background_zh":"","theological_themes_zh":""}}\n${verses.map(v => `${v.verse_number}. ${v.verse_text}`).join('\n')}`
}

async function findNextChapter(translationId, books) {
  for (const book of books) {
    for (let chapter = 1; chapter <= book.chapter_count; chapter += 1) {
      const [rows, studies, verses] = await Promise.all([
        db(`bible_ai_verse_content?translation_id=eq.${translationId}&book_id=eq.${book.id}&chapter_number=eq.${chapter}&select=verse_number`),
        db(`bible_ai_chapter_studies?translation_id=eq.${translationId}&book_id=eq.${book.id}&chapter_number=eq.${chapter}&select=chapter_number`),
        db(`bible_verses?translation_id=eq.${translationId}&book_id=eq.${book.id}&chapter_number=eq.${chapter}&select=verse_number,verse_text&order=verse_number`),
      ])
      if (verses.length && (rows.length < verses.length || !studies.length)) {
        return { book, chapter, verses, existingRows: rows, hasStudy: studies.length > 0 }
      }
    }
  }
  return null
}

async function generateChapter(translationId, target) {
  const existingVerseNumbers = new Set(target.existingRows.map(row => row.verse_number))
  const missingVerses = target.verses.filter(verse => !existingVerseNumbers.has(verse.verse_number))

  if (missingVerses.length === target.verses.length && !target.hasStudy) {
    const chapter = await generateJson(chapterPrompt(target.book, target.chapter, target.verses))
    const expectedNumbers = target.verses.map(verse => verse.verse_number)
    const actualNumbers = chapter?.verses?.map(verse => Number(verse.verse_number)) ?? []
    if (!chapter?.study || expectedNumbers.length !== actualNumbers.length || expectedNumbers.some((number, index) => number !== actualNumbers[index])) {
      throw new Error('Complete chapter response mismatch')
    }
    await db('bible_ai_verse_content?on_conflict=translation_id,book_id,chapter_number,verse_number', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(chapter.verses.map(verse => ({
        translation_id: translationId,
        book_id: target.book.id,
        chapter_number: target.chapter,
        ...verse,
        model,
      }))),
    })
    await db('bible_ai_chapter_studies?on_conflict=translation_id,book_id,chapter_number', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({
        translation_id: translationId,
        book_id: target.book.id,
        chapter_number: target.chapter,
        ...chapter.study,
        model,
      }),
    })
    return chapter.verses.length
  }

  const chunks = []
  for (let index = 0; index < missingVerses.length; index += 10) {
    chunks.push(missingVerses.slice(index, index + 10))
  }

  const generatedChunks = []
  for (const chunk of chunks) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const result = await generateJson(versePrompt(target.book, target.chapter, chunk))
      if (Array.isArray(result) && result.length === chunk.length) {
        generatedChunks.push(result)
        break
      }
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 3000))
      else throw new Error('Verse count mismatch')
    }
  }
  const generated = generatedChunks.flat()

  if (generated.length) {
    await db('bible_ai_verse_content?on_conflict=translation_id,book_id,chapter_number,verse_number', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(generated.map(v => ({
        translation_id: translationId,
        book_id: target.book.id,
        chapter_number: target.chapter,
        ...v,
        model,
      }))),
    })
  }

  if (!target.hasStudy) {
    const study = await generateJson(studyPrompt(target.book, target.chapter, target.verses))
    await db('bible_ai_chapter_studies?on_conflict=translation_id,book_id,chapter_number', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({
        translation_id: translationId,
        book_id: target.book.id,
        chapter_number: target.chapter,
        ...study,
        model,
      }),
    })
  }

  return generated.length
}

export default async function handler(request, response) {
  if (!url || !serviceKey) return response.status(503).json({ error: 'Missing server configuration' })
  const authorization = request.headers.authorization
  const cronSecret = process.env.CRON_SECRET
  const authorizedCron = request.method === 'GET' && Boolean(cronSecret) && authorization === `Bearer ${cronSecret}`
  const authorizedManual = request.method === 'POST' && Boolean(cronSecret) && authorization === `Bearer ${cronSecret}`
  if (!authorizedCron && !authorizedManual) return response.status(401).json({ error: 'Unauthorized' })
  try {
    const startedAt = Date.now()
    const requestedBatchSize = Number(request.query?.batch ?? DEFAULT_BATCH_SIZE)
    const batchSize = Math.min(MAX_BATCH_SIZE, Math.max(1, Number.isFinite(requestedBatchSize) ? requestedBatchSize : DEFAULT_BATCH_SIZE))
    const [translation] = await db('bible_translations?code=eq.WEB&select=id&limit=1')
    if (!translation) throw new Error('WEB translation not found')
    const books = await db('bible_books?name_en=in.(Luke,Genesis,Exodus,Leviticus,Numbers,Deuteronomy)&select=id,name_en,name_zh,chapter_count,book_order')
    const generationOrder = ['Luke', 'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy']
    books.sort((left, right) => generationOrder.indexOf(left.name_en) - generationOrder.indexOf(right.name_en))
    const generatedChapters = []

    while (generatedChapters.length < batchSize && Date.now() - startedAt < EXECUTION_BUDGET_MS) {
      const target = await findNextChapter(translation.id, books)
      if (!target) return response.status(200).json({ complete: true, generatedChapters })
      const verses = await generateChapter(translation.id, target)
      generatedChapters.push({ book: target.book.name_en, chapter: target.chapter, verses })
    }

    return response.status(200).json({ complete: false, generatedChapters })
  } catch (error) {
    console.error('Bible generation failed:', error)
    return response.status(500).json({ error: error.message })
  }
}
