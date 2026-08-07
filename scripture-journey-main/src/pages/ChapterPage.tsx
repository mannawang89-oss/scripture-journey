import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Landmark,
  Layers3,
  Menu,
  Moon,
  Sparkles,
  Sun,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { supabase } from '../lib/supabase'

type BibleBook = {
  id: number
  name_zh: string
  name_en: string | null
  abbreviation: string | null
  chapter_count: number
  book_order: number
}

type BibleTranslation = {
  id: number
  code: string
  name_zh: string
  name_original: string | null
  language_code: string
}

type BibleVerse = {
  id: number
  verse_number: number
  verse_text: string
  paragraph_start: boolean | null
}

type BibleChapterStudy = {
  id: number
  overview: string | null
  historical_background: string | null
  structure: string | null
  themes: string | null
}

type RightPanelMode =
  | 'ai_literal'
  | 'ai_natural'
  | 'ai_hebrew'
  | 'ai_first_reader'
  | 'study_overview'
  | 'study_structure'
  | 'study_history'
  | 'study_themes'

const VERSES_PER_PAGE = 10

const aiModes: Array<{
  id: RightPanelMode
  label: string
}> = [
  { id: 'ai_literal', label: '直译' },
  { id: 'ai_natural', label: '意译' },
  { id: 'ai_hebrew', label: '希伯来表达' },
  { id: 'ai_first_reader', label: '第一读者理解' },
]

const studyModes: Array<{
  id: RightPanelMode
  label: string
  icon: typeof BookOpen
}> = [
  { id: 'study_overview', label: '章节概览', icon: BookOpen },
  { id: 'study_structure', label: '文学结构', icon: Layers3 },
  { id: 'study_history', label: '历史背景', icon: Landmark },
  { id: 'study_themes', label: '神学主题', icon: Sparkles },
]

const styles = `
.chapter-reader-page {
  --paper: #f7f2ea;
  --paper-deep: #eee5d7;
  --ink: #302923;
  --muted: #776e66;
  --line: #ddd2c3;
  --accent: #784936;
  --font-scale: 1;
  --line-height: 1.9;
  min-height: 100vh;
  background: var(--paper);
  color: var(--ink);
}
.chapter-reader-page.is-night {
  --paper: #1f1b18;
  --paper-deep: #2a2420;
  --ink: #ece2d4;
  --muted: #b4a89c;
  --line: #443a33;
  --accent: #c08a6d;
}
.chapter-reader-status {
  min-height: 60vh;
  display: grid;
  place-items: center;
  padding: 60px 20px;
  background: #f7f2ea;
  color: #302923;
}
.chapter-reader-toolbar {
  position: sticky;
  top: 76px;
  z-index: 20;
  border-bottom: 1px solid var(--line);
  background: var(--paper);
}
.chapter-reader-toolbar-inner {
  width: min(1360px, calc(100% - 48px));
  min-height: 58px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
}
.chapter-reader-select {
  appearance: none;
  border: 0;
  outline: 0;
  background:
    linear-gradient(45deg, transparent 50%, var(--muted) 50%)
      calc(100% - 12px) 52% / 5px 5px no-repeat,
    linear-gradient(135deg, var(--muted) 50%, transparent 50%)
      calc(100% - 7px) 52% / 5px 5px no-repeat;
  color: var(--ink);
  padding: 12px 24px 12px 0;
  font: inherit;
  font-weight: 600;
}
.chapter-reader-book-select { justify-self: start; }
.chapter-reader-chapter-select { justify-self: center; }
.chapter-reader-menu-button {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  justify-self: end;
  border: 0;
  background: transparent;
  color: var(--ink);
}
.chapter-reader-layout {
  width: min(1360px, calc(100% - 48px));
  margin: 0 auto;
  padding: 24px 0 48px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
}
.chapter-reader-panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  background: var(--paper);
}
.chapter-reader-panel-header {
  min-height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 22px;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
}
.chapter-reader-panel-body {
  flex: 1;
  min-height: 690px;
  padding: 12px 24px 8px;
}
.chapter-reader-verse {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  margin: 0;
  padding: 20px 0;
  border-bottom: 1px solid var(--line);
  font-family: 'Noto Serif SC', serif;
  font-size: calc(19px * var(--font-scale));
  line-height: var(--line-height);
}
.chapter-reader-verse:last-child { border-bottom: 0; }
.chapter-reader-verse sup {
  top: .2em;
  color: var(--accent);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 11px;
  font-weight: 600;
}
.chapter-reader-ai-verse {
  font-size: calc(16px * var(--font-scale));
}
.chapter-reader-pagination {
  min-height: 74px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 18px;
  padding: 0 22px;
  border-top: 1px solid var(--line);
}
.chapter-reader-pagination button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  background: transparent;
  color: var(--accent);
  padding: 10px 0;
}
.chapter-reader-pagination button:last-child { justify-self: end; }
.chapter-reader-pagination button:disabled {
  opacity: .3;
  cursor: not-allowed;
}
.chapter-reader-pagination > span {
  color: var(--muted);
  font-size: 13px;
}
.chapter-reader-ai-menu { position: relative; }
.chapter-reader-ai-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: var(--ink);
  padding: 8px 0;
  font-size: 17px;
  font-weight: 600;
}
.chapter-reader-ai-trigger svg {
  transition: transform .2s ease;
}
.chapter-reader-ai-trigger svg.is-open {
  transform: rotate(180deg);
}
.chapter-reader-copy-button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--muted);
}
.chapter-reader-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  z-index: 30;
  min-width: 190px;
  padding: 8px;
  border: 1px solid var(--line);
  background: var(--paper);
  box-shadow: 0 18px 44px rgba(31, 24, 19, .14);
}
.chapter-reader-dropdown button {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 0;
  background: transparent;
  color: var(--muted);
  padding: 0 12px;
  text-align: left;
}
.chapter-reader-dropdown button:hover,
.chapter-reader-dropdown button.active {
  background: var(--paper-deep);
  color: var(--accent);
}
.chapter-reader-study-content {
  padding: 22px 8px;
  font-family: 'Noto Serif SC', serif;
  font-size: calc(19px * var(--font-scale));
  line-height: var(--line-height);
}
.chapter-reader-study-content p { margin: 0 0 20px; }
.chapter-reader-empty {
  margin: 0;
  padding: 48px 8px;
  color: var(--muted);
  text-align: center;
}
.chapter-reader-settings-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  border: 0;
  background: rgba(27, 22, 18, .28);
}
.chapter-reader-settings-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 60;
  width: min(360px, 92vw);
  overflow-y: auto;
  border-left: 1px solid var(--line);
  background: var(--paper);
  color: var(--ink);
  box-shadow: -24px 0 60px rgba(31, 24, 19, .16);
}
.chapter-reader-settings-panel > header {
  min-height: 94px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 24px;
  border-bottom: 1px solid var(--line);
}
.chapter-reader-settings-panel > header p {
  margin: 0 0 6px;
  color: var(--accent);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .2em;
}
.chapter-reader-settings-panel > header h2 {
  margin: 0;
  font-family: 'Noto Serif SC', serif;
  font-size: 25px;
}
.chapter-reader-settings-panel > header button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--ink);
}
.chapter-reader-settings-section {
  padding: 26px 24px;
  border-bottom: 1px solid var(--line);
}
.chapter-reader-settings-section h3 {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .12em;
}
.chapter-reader-translation-list,
.chapter-reader-study-list {
  display: grid;
  gap: 4px;
}
.chapter-reader-translation-list label,
.chapter-reader-study-list button {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  color: var(--ink);
  padding: 0;
  text-align: left;
}
.chapter-reader-translation-list input {
  accent-color: var(--accent);
}
.chapter-reader-study-list button.active {
  color: var(--accent);
}
.chapter-reader-setting-row {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.chapter-reader-setting-row > div {
  display: grid;
  grid-template-columns: 34px 54px 34px;
  align-items: center;
  text-align: center;
}
.chapter-reader-setting-row button {
  width: 34px;
  height: 34px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
}
.chapter-reader-setting-row strong {
  color: var(--muted);
  font-size: 12px;
}
.chapter-reader-night-toggle {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  color: var(--ink);
  padding: 0;
}
.chapter-reader-settings-panel > footer {
  padding: 22px 24px;
  color: var(--muted);
  font-size: 12px;
}
@media (max-width: 980px) {
  .chapter-reader-toolbar { top: 66px; }
  .chapter-reader-layout { grid-template-columns: 1fr; }
  .chapter-reader-panel-body { min-height: 0; }
}
@media (max-width: 680px) {
  .chapter-reader-toolbar-inner,
  .chapter-reader-layout {
    width: min(100% - 24px, 1360px);
  }
  .chapter-reader-toolbar-inner { gap: 12px; }
  .chapter-reader-select { max-width: 120px; }
  .chapter-reader-panel-header {
    min-height: 56px;
    padding: 0 16px;
  }
  .chapter-reader-panel-body {
    padding-right: 18px;
    padding-left: 18px;
  }
  .chapter-reader-verse {
    font-size: calc(17px * var(--font-scale));
  }
  .chapter-reader-pagination {
    grid-template-columns: 1fr 1fr;
    padding-top: 12px;
    padding-bottom: 12px;
  }
  .chapter-reader-pagination > span {
    grid-column: 1 / -1;
    grid-row: 1;
    text-align: center;
  }
}
`

function getStudyContent(
  study: BibleChapterStudy | null,
  mode: RightPanelMode,
) {
  if (!study) return null

  switch (mode) {
    case 'study_overview':
      return study.overview
    case 'study_structure':
      return study.structure
    case 'study_history':
      return study.historical_background
    case 'study_themes':
      return study.themes
    default:
      return null
  }
}

function getPanelTitle(mode: RightPanelMode) {
  const aiMode = aiModes.find((item) => item.id === mode)
  if (aiMode) return `AI译文（${aiMode.label}）`

  return studyModes.find((item) => item.id === mode)?.label ?? '研读工具'
}

function getFallbackTranslation(
  mode: RightPanelMode,
  verseNumber: number,
  sourceText: string,
) {
  if (mode === 'ai_literal') {
    if (verseNumber === 1) return '起初，上帝创造了天地。'
    return sourceText
  }

  if (mode === 'ai_natural') {
    if (verseNumber === 1) return '在一切开始的时候，上帝创造了整个宇宙。'
    return `第${verseNumber}节的意译内容尚未生成。`
  }

  if (mode === 'ai_hebrew') {
    if (verseNumber === 1) {
      return '“天地”是希伯来人的整体表达，指向整个受造界。'
    }
    return `第${verseNumber}节的希伯来表达说明尚未生成。`
  }

  if (mode === 'ai_first_reader') {
    if (verseNumber === 1) {
      return '对刚离开埃及的以色列人而言，这节经文宣告：万物都不是神，耶和华才是创造一切的主。'
    }
    return `第${verseNumber}节的第一读者理解尚未生成。`
  }

  return sourceText
}

export default function ChapterPage() {
  const params = useParams()
  const navigate = useNavigate()

  const bookKey =
    params.bookKey ??
    params.book ??
    params.bookName ??
    params.slug ??
    ''

  const chapterNumber =
    Number(
      params.chapterNumber ??
        params.chapter ??
        params.chapterId ??
        '1',
    ) || 1

  const [allBooks, setAllBooks] = useState<BibleBook[]>([])
  const [book, setBook] = useState<BibleBook | null>(null)
  const [webTranslationId, setWebTranslationId] = useState<
    number | null
  >(null)
  const [webTranslationName, setWebTranslationName] = useState(
    'World English Bible',
  )
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [study, setStudy] = useState<BibleChapterStudy | null>(null)
  const [versePage, setVersePage] = useState(1)
  const [rightPanelMode, setRightPanelMode] =
    useState<RightPanelMode>('ai_literal')
  const [aiMenuOpen, setAiMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [fontScale, setFontScale] = useState(1)
  const [lineHeight, setLineHeight] = useState(1.9)
  const [nightMode, setNightMode] = useState(false)
  const [loadingBook, setLoadingBook] = useState(true)
  const [loadingContent, setLoadingContent] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const aiMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const savedFontScale = Number(
      window.localStorage.getItem('sj-font-scale'),
    )
    const savedLineHeight = Number(
      window.localStorage.getItem('sj-line-height'),
    )
    const savedNightMode =
      window.localStorage.getItem('sj-night-mode') === 'true'

    if (savedFontScale) setFontScale(savedFontScale)
    if (savedLineHeight) setLineHeight(savedLineHeight)
    setNightMode(savedNightMode)
  }, [])

  useEffect(() => {
    window.localStorage.setItem('sj-font-scale', String(fontScale))
  }, [fontScale])

  useEffect(() => {
    window.localStorage.setItem('sj-line-height', String(lineHeight))
  }, [lineHeight])

  useEffect(() => {
    window.localStorage.setItem('sj-night-mode', String(nightMode))
  }, [nightMode])

  useEffect(() => {
    async function loadBookAndWebTranslation() {
      setLoadingBook(true)
      setErrorMessage('')

      const decodedBookKey = decodeURIComponent(bookKey)

      const [
        { data: booksData, error: booksError },
        { data: webData, error: webError },
      ] = await Promise.all([
        supabase
          .from('bible_books')
          .select(
            'id, name_zh, name_en, abbreviation, chapter_count, book_order',
          )
          .order('book_order', { ascending: true }),

        supabase
          .from('bible_translations')
          .select(
            'id, code, name_zh, name_original, language_code',
          )
          .eq('code', 'WEB')
          .maybeSingle(),
      ])

      if (booksError) {
        console.error(booksError)
        setErrorMessage('圣经书卷读取失败。')
        setLoadingBook(false)
        return
      }

      const loadedBooks = (booksData ?? []) as BibleBook[]
      setAllBooks(loadedBooks)

      const matchedBook = loadedBooks.find(
        (item) =>
          item.name_en === decodedBookKey ||
          item.name_zh === decodedBookKey ||
          item.abbreviation === decodedBookKey,
      )

      if (!matchedBook) {
        setBook(null)
        setErrorMessage('没有找到这卷圣经。')
        setLoadingBook(false)
        return
      }

      if (webError || !webData) {
        console.error(webError)
        setWebTranslationId(null)
        setErrorMessage(
          '没有找到 WEB 译本，请确认 bible_translations 中存在 code=WEB。',
        )
        setBook(matchedBook)
        setLoadingBook(false)
        return
      }

      const webTranslation = webData as BibleTranslation
      setWebTranslationId(webTranslation.id)
      setWebTranslationName(
        webTranslation.name_original ??
          webTranslation.name_zh ??
          'World English Bible',
      )

      setBook(matchedBook)
      setLoadingBook(false)
    }

    loadBookAndWebTranslation()
  }, [bookKey])

  useEffect(() => {
    async function loadChapterContent() {
      if (!book || !webTranslationId) return

      setLoadingContent(true)
      setErrorMessage('')
      setVersePage(1)

      const [
        { data: verseData, error: verseError },
        { data: studyData, error: studyError },
      ] = await Promise.all([
        supabase
          .from('bible_verses')
          .select(
            'id, verse_number, verse_text, paragraph_start',
          )
          .eq('translation_id', webTranslationId)
          .eq('book_id', book.id)
          .eq('chapter_number', chapterNumber)
          .order('verse_number', { ascending: true }),

        supabase
          .from('bible_chapter_studies')
          .select(
            'id, overview, historical_background, structure, themes',
          )
          .eq('book_id', book.id)
          .eq('chapter_number', chapterNumber)
          .order('id', { ascending: false })
          .limit(1),
      ])

      if (verseError) {
        console.error(verseError)
        setErrorMessage('经文读取失败，请稍后刷新页面。')
        setVerses([])
      } else {
        setVerses((verseData ?? []) as BibleVerse[])
      }

      if (studyError) {
        console.error(studyError)
        setStudy(null)
      } else {
        setStudy(
          (studyData?.[0] as BibleChapterStudy | undefined) ?? null,
        )
      }

      setLoadingContent(false)
    }

    loadChapterContent()
  }, [book, chapterNumber, webTranslationId])

  useEffect(() => {
    function closeAiMenu(event: MouseEvent) {
      if (
        aiMenuRef.current &&
        !aiMenuRef.current.contains(event.target as Node)
      ) {
        setAiMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', closeAiMenu)
    return () => document.removeEventListener('mousedown', closeAiMenu)
  }, [])

  const versePageCount = Math.max(
    1,
    Math.ceil(verses.length / VERSES_PER_PAGE),
  )

  const currentVerses = useMemo(() => {
    const start = (versePage - 1) * VERSES_PER_PAGE
    return verses.slice(start, start + VERSES_PER_PAGE)
  }, [versePage, verses])

  const isAiMode = rightPanelMode.startsWith('ai_')
  const studyContent = getStudyContent(study, rightPanelMode)

  function goToBook(routeBookKey: string) {
    navigate(`/bible/${encodeURIComponent(routeBookKey)}/1`)
  }

  function goToChapter(nextChapter: number) {
    if (!book) return

    const routeBookKey =
      book.name_en ?? book.abbreviation ?? String(book.id)

    navigate(
      `/bible/${encodeURIComponent(routeBookKey)}/${nextChapter}`,
    )
  }

  async function copyRightPanel() {
    const copyText = isAiMode
      ? currentVerses
          .map(
            (verse) =>
              `${verse.verse_number} ${getFallbackTranslation(
                rightPanelMode,
                verse.verse_number,
                verse.verse_text,
              )}`,
          )
          .join('\n')
      : studyContent ?? ''

    if (!copyText) return
    await navigator.clipboard.writeText(copyText)
  }

  if (loadingBook && !book) {
    return (
      <main className="chapter-reader-status">
        <p>正在读取圣经内容……</p>
      </main>
    )
  }

  if (!book) {
    return (
      <main className="chapter-reader-status">
        <p>{errorMessage || '没有找到这卷圣经。'}</p>
        <Link to="/bible">返回圣经目录</Link>
      </main>
    )
  }

  const pageStyle = {
    '--font-scale': fontScale,
    '--line-height': lineHeight,
  } as CSSProperties

  return (
    <main
      className={`chapter-reader-page ${
        nightMode ? 'is-night' : ''
      }`}
      style={pageStyle}
    >
      <style>{styles}</style>

      <section className="chapter-reader-toolbar">
        <div className="chapter-reader-toolbar-inner">
          <select
            className="chapter-reader-select chapter-reader-book-select"
            value={book.name_en ?? book.abbreviation ?? ''}
            onChange={(event) => goToBook(event.target.value)}
            aria-label="选择书卷"
          >
            {allBooks.map((item) => (
              <option
                key={item.id}
                value={item.name_en ?? item.abbreviation ?? String(item.id)}
              >
                {item.name_zh}
              </option>
            ))}
          </select>

          <select
            className="chapter-reader-select chapter-reader-chapter-select"
            value={chapterNumber}
            onChange={(event) =>
              goToChapter(Number(event.target.value))
            }
            aria-label="选择章节"
          >
            {Array.from(
              { length: book.chapter_count },
              (_, index) => index + 1,
            ).map((chapter) => (
              <option key={chapter} value={chapter}>
                第 {chapter} 章
              </option>
            ))}
          </select>

          <button
            type="button"
            className="chapter-reader-menu-button"
            onClick={() => setSettingsOpen(true)}
            aria-label="打开阅读设置"
          >
            <Menu size={21} />
          </button>
        </div>
      </section>

      <section className="chapter-reader-layout">
        <article className="chapter-reader-panel">
          <header className="chapter-reader-panel-header">
            <span>
              WEB · 第 {versePage} 页 / 共 {versePageCount} 页
            </span>
          </header>

          <div className="chapter-reader-panel-body">
            {loadingContent ? (
              <p className="chapter-reader-empty">正在读取经文……</p>
            ) : errorMessage ? (
              <p className="chapter-reader-empty">{errorMessage}</p>
            ) : currentVerses.length === 0 ? (
              <p className="chapter-reader-empty">
                WEB 数据库中没有找到这一章的经文。
              </p>
            ) : (
              currentVerses.map((verse) => (
                <p className="chapter-reader-verse" key={verse.id}>
                  <sup>{verse.verse_number}</sup>
                  <span>{verse.verse_text}</span>
                </p>
              ))
            )}
          </div>

          <footer className="chapter-reader-pagination">
            <button
              type="button"
              disabled={versePage === 1}
              onClick={() => setVersePage((page) => page - 1)}
            >
              <ChevronLeft size={17} />
              上一页
            </button>

            <span>
              第 {versePage} 页 / 共 {versePageCount} 页
            </span>

            <button
              type="button"
              disabled={versePage === versePageCount}
              onClick={() => setVersePage((page) => page + 1)}
            >
              下一页
              <ChevronRight size={17} />
            </button>
          </footer>
        </article>

        <article className="chapter-reader-panel">
          <header className="chapter-reader-panel-header">
            <div className="chapter-reader-ai-menu" ref={aiMenuRef}>
              <button
                type="button"
                className="chapter-reader-ai-trigger"
                onClick={() =>
                  isAiMode && setAiMenuOpen((current) => !current)
                }
              >
                {getPanelTitle(rightPanelMode)}
                {isAiMode && (
                  <ChevronDown
                    size={16}
                    className={aiMenuOpen ? 'is-open' : ''}
                  />
                )}
              </button>

              {isAiMode && aiMenuOpen && (
                <div className="chapter-reader-dropdown">
                  {aiModes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={
                        rightPanelMode === item.id ? 'active' : ''
                      }
                      onClick={() => {
                        setRightPanelMode(item.id)
                        setAiMenuOpen(false)
                      }}
                    >
                      <span>{item.label}</span>
                      {rightPanelMode === item.id && <strong>✓</strong>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="chapter-reader-copy-button"
              onClick={copyRightPanel}
              aria-label="复制当前内容"
            >
              <Copy size={17} />
            </button>
          </header>

          <div className="chapter-reader-panel-body">
            {isAiMode ? (
              currentVerses.map((verse) => (
                <p
                  className="chapter-reader-verse chapter-reader-ai-verse"
                  key={`${rightPanelMode}-${verse.id}`}
                >
                  <sup>{verse.verse_number}</sup>
                  <span>
                    {getFallbackTranslation(
                      rightPanelMode,
                      verse.verse_number,
                      verse.verse_text,
                    )}
                  </span>
                </p>
              ))
            ) : studyContent ? (
              <div className="chapter-reader-study-content">
                {studyContent
                  .split(/\n+/)
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={`${rightPanelMode}-${index}`}>
                      {paragraph}
                    </p>
                  ))}
              </div>
            ) : (
              <p className="chapter-reader-empty">
                本栏目内容尚未整理。
              </p>
            )}
          </div>
        </article>
      </section>

      {settingsOpen && (
        <>
          <button
            type="button"
            className="chapter-reader-settings-backdrop"
            aria-label="关闭阅读设置"
            onClick={() => setSettingsOpen(false)}
          />

          <aside className="chapter-reader-settings-panel">
            <header>
              <div>
                <p>READING SETTINGS</p>
                <h2>阅读设置</h2>
              </div>

              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                aria-label="关闭阅读设置"
              >
                <X size={21} />
              </button>
            </header>

            <section className="chapter-reader-settings-section">
              <h3>经文版本</h3>

              <div className="chapter-reader-translation-list">
                <label>
                  <input type="radio" checked readOnly />
                  <span>{webTranslationName}（WEB）</span>
                </label>
              </div>
            </section>

            <section className="chapter-reader-settings-section">
              <h3>研读工具</h3>

              <div className="chapter-reader-study-list">
                {studyModes.map((item) => {
                  const Icon = item.icon

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={
                        rightPanelMode === item.id ? 'active' : ''
                      }
                      onClick={() => {
                        setRightPanelMode(item.id)
                        setSettingsOpen(false)
                      }}
                    >
                      <Icon size={17} />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="chapter-reader-settings-section">
              <h3>排版</h3>

              <div className="chapter-reader-setting-row">
                <span>字体大小</span>
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setFontScale((value) =>
                        Math.max(.85, Number((value - .05).toFixed(2))),
                      )
                    }
                  >
                    −
                  </button>
                  <strong>{Math.round(fontScale * 100)}%</strong>
                  <button
                    type="button"
                    onClick={() =>
                      setFontScale((value) =>
                        Math.min(1.25, Number((value + .05).toFixed(2))),
                      )
                    }
                  >
                    ＋
                  </button>
                </div>
              </div>

              <div className="chapter-reader-setting-row">
                <span>行距</span>
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setLineHeight((value) =>
                        Math.max(1.55, Number((value - .1).toFixed(2))),
                      )
                    }
                  >
                    −
                  </button>
                  <strong>{lineHeight.toFixed(1)}</strong>
                  <button
                    type="button"
                    onClick={() =>
                      setLineHeight((value) =>
                        Math.min(2.3, Number((value + .1).toFixed(2))),
                      )
                    }
                  >
                    ＋
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="chapter-reader-night-toggle"
                onClick={() => setNightMode((current) => !current)}
              >
                {nightMode ? <Sun size={17} /> : <Moon size={17} />}
                <span>{nightMode ? '日间模式' : '夜间模式'}</span>
              </button>
            </section>

            <footer>
              当前译本：{webTranslationName}（WEB）
            </footer>
          </aside>
        </>
      )}
    </main>
  )
}
