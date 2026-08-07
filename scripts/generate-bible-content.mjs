import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseKey = serviceRoleKey ?? process.env.SUPABASE_ANON_KEY
const ollamaUrl = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434'
const model = process.env.OLLAMA_MODEL ?? 'qwen3:4b'
const selectedBooks = (process.env.BOOKS ?? process.env.BOOK ?? '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean)
const onlyChapter = Number(process.env.CHAPTER ?? 0)
const limit = Number(process.env.LIMIT ?? 0)
const progressPath = path.resolve('.generation-progress.json')
const outputDirectory = path.resolve(process.env.OUTPUT_DIR ?? 'work/generated-bible-content')

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY are required.')
}

const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
}

async function supabase(pathname, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  })
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

async function loadProgress() {
  try { return JSON.parse(await readFile(progressPath, 'utf8')) } catch { return { completed: [] } }
}

async function saveProgress(progress) {
  await writeFile(progressPath, `${JSON.stringify(progress, null, 2)}\n`)
}

function promptFor(book, chapter, verses) {
  const passage = verses.map((verse) => `${verse.verse_number}. ${verse.verse_text}`).join('\n')
  return `你是一名严谨的圣经翻译与释经编辑。根据下列 World English Bible 经文，生成简体中文学习内容。

要求：
1. 不添加经文没有表达的事实；有争议处使用审慎措辞。
2. literal_zh 忠实保留原句结构；natural_zh 使用自然现代中文。
3. source_language_notes_zh 只解释确有帮助的希伯来文或希腊文表达；无法可靠判断时说明限度。
4. first_readers_zh 说明最初听众可能如何理解，不把现代应用冒充原意。
5. 四类章节研读各 180–350 个中文字，结构清晰，不虚构年代或作者结论。
6. 每一节都必须返回，verse_number 必须与输入完全一致。
7. 只输出合法 JSON，不要 Markdown。

书卷：${book.name_en}（${book.name_zh}）
章节：${chapter}
WEB 经文：
${passage}

JSON 结构：
{"verses":[{"verse_number":1,"literal_zh":"","natural_zh":"","source_language_notes_zh":"","first_readers_zh":""}],"study":{"overview_zh":"","structure_zh":"","historical_background_zh":"","theological_themes_zh":""}}`
}

async function generate(book, chapter, verses) {
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      format: 'json',
      options: { temperature: 0.2, num_ctx: 16384 },
      messages: [{ role: 'user', content: promptFor(book, chapter, verses) }],
    }),
  })
  if (!response.ok) throw new Error(`Ollama ${response.status}: ${await response.text()}`)
  const payload = await response.json()
  return JSON.parse(payload.message.content)
}

function validate(result, verses) {
  if (!result?.study || !Array.isArray(result.verses)) throw new Error('Invalid JSON shape')
  const expected = verses.map((verse) => verse.verse_number)
  const actual = result.verses.map((verse) => Number(verse.verse_number))
  if (expected.length !== actual.length || expected.some((value, index) => value !== actual[index])) {
    throw new Error(`Verse mismatch: expected ${expected.join(',')}; received ${actual.join(',')}`)
  }
  for (const verse of result.verses) {
    for (const key of ['literal_zh', 'natural_zh', 'source_language_notes_zh', 'first_readers_zh']) {
      if (!String(verse[key] ?? '').trim()) throw new Error(`Missing ${key} for verse ${verse.verse_number}`)
    }
  }
}

async function upsertChapter(translationId, book, chapter, result) {
  if (!serviceRoleKey) {
    const filename = `${String(book.book_order).padStart(2, '0')}-${String(book.name_en).toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}-${String(chapter).padStart(3, '0')}.json`
    await mkdir(outputDirectory, { recursive: true })
    await writeFile(
      path.join(outputDirectory, filename),
      `${JSON.stringify({ translationId, book, chapter, model, ...result }, null, 2)}\n`,
    )
    return
  }

  const verseRows = result.verses.map((verse) => ({
    translation_id: translationId,
    book_id: book.id,
    chapter_number: chapter,
    verse_number: verse.verse_number,
    literal_zh: verse.literal_zh,
    natural_zh: verse.natural_zh,
    source_language_notes_zh: verse.source_language_notes_zh,
    first_readers_zh: verse.first_readers_zh,
    model,
  }))
  await supabase('bible_ai_verse_content?on_conflict=translation_id,book_id,chapter_number,verse_number', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(verseRows),
  })
  await supabase('bible_ai_chapter_studies?on_conflict=translation_id,book_id,chapter_number', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      translation_id: translationId,
      book_id: book.id,
      chapter_number: chapter,
      ...result.study,
      model,
    }),
  })
}

await mkdir(path.dirname(progressPath), { recursive: true })
const [translation] = await supabase('bible_translations?code=eq.WEB&select=id&limit=1')
if (!translation) throw new Error('WEB translation not found')
const books = await supabase('bible_books?select=id,name_zh,name_en,chapter_count,book_order&order=book_order.asc')
const progress = await loadProgress()
let processed = 0

for (const book of books) {
  const bookKeys = [book.name_en, book.name_zh, String(book.id)]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())
  if (selectedBooks.length && !selectedBooks.some((value) => bookKeys.includes(value))) continue
  for (let chapter = 1; chapter <= book.chapter_count; chapter += 1) {
    if (onlyChapter && chapter !== onlyChapter) continue
    const key = `${book.id}:${chapter}`
    if (progress.completed.includes(key)) continue
    const verses = await supabase(`bible_verses?translation_id=eq.${translation.id}&book_id=eq.${book.id}&chapter_number=eq.${chapter}&select=verse_number,verse_text&order=verse_number.asc`)
    if (!verses.length) throw new Error(`No WEB verses for ${book.name_en} ${chapter}`)

    let lastError
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        console.log(`Generating ${book.name_en} ${chapter} (${attempt}/3)…`)
        const result = await generate(book, chapter, verses)
        validate(result, verses)
        await upsertChapter(translation.id, book, chapter, result)
        progress.completed.push(key)
        progress.lastCompleted = `${book.name_en} ${chapter}`
        await saveProgress(progress)
        lastError = null
        break
      } catch (error) {
        lastError = error
        console.error(error.message)
      }
    }
    if (lastError) throw lastError
    processed += 1
    if (limit && processed >= limit) process.exit(0)
  }
}
