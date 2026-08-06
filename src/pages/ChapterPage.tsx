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
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { supabase } from '../lib/supabase'
import './ChapterPage.css'

type BibleBook = {
  id: number
  name_zh: string
  name_en: string | null
  abbreviation: string | null
  chapter_count: number
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
  {
    id: 'study_overview',
    label: '章节概览',
    icon: BookOpen,
  },
  {
    id: 'study_structure',
    label: '文学结构',
    icon: Layers3,
  },
  {
    id: 'study_history',
    label: '历史背景',
    icon: Landmark,
  },
  {
    id: 'study_themes',
    label: '神学主题',
    icon: Sparkles,
  },
]

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

  const chapterParam =
    params.chapterNumber ??
    params.chapter ??
    params.chapterId ??
    '1'

  const chapterNumber = Number(chapterParam) || 1

  const [book, setBook] = useState<BibleBook | null>(null)
  const [translations, setTranslations] = useState<
    BibleTranslation[]
  >([])
  const [translationId, setTranslationId] = useState(1)
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
    const savedTranslationId = Number(
      window.localStorage.getItem('sj-translation-id'),
    )
    const savedFontScale = Number(
      window.localStorage.getItem('sj-font-scale'),
    )
    const savedLineHeight = Number(
      window.localStorage.getItem('sj-line-height'),
    )
    const savedNightMode =
      window.localStorage.getItem('sj-night-mode') === 'true'

    if (savedTranslationId) setTranslationId(savedTranslationId)
    if (savedFontScale) setFontScale(savedFontScale)
    if (savedLineHeight) setLineHeight(savedLineHeight)
    setNightMode(savedNightMode)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(
      'sj-translation-id',
      String(translationId),
    )
  }, [translationId])

  useEffect(() => {
    window.localStorage.setItem(
      'sj-font-scale',
      String(fontScale),
    )
  }, [fontScale])

  useEffect(() => {
    window.localStorage.setItem(
      'sj-line-height',
      String(lineHeight),
    )
  }, [lineHeight])

  useEffect(() => {
    window.localStorage.setItem(
      'sj-night-mode',
      String(nightMode),
    )
  }, [nightMode])

  useEffect(() => {
    async function loadBookAndTranslations() {
      setLoadingBook(true)
      setErrorMessage('')

      const decodedBookKey = decodeURIComponent(bookKey)

      const { data: bookData, error: bookError } = await supabase
        .from('bible_books')
        .select(
          'id, name_zh, name_en, abbreviation, chapter_count',
        )
        .or(
          [
            `name_en.eq.${decodedBookKey}`,
            `name_zh.eq.${decodedBookKey}`,
            `abbreviation.eq.${decodedBookKey}`,
          ].join(','),
        )
        .maybeSingle()

      if (bookError || !bookData) {
        console.error(bookError)
        setErrorMessage('没有找到这卷圣经。')
        setBook(null)
        setLoadingBook(false)
        return
      }

      const { data: translationData, error: translationError } =
        await supabase
          .from('bible_translations')
          .select(
            'id, code, name_zh, name_original, language_code',
          )
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

      if (translationError) {
        console.error(translationError)
        setTranslations([])
      } else {
        const loadedTranslations =
          (translationData ?? []) as BibleTranslation[]
        setTranslations(loadedTranslations)

        if (
          loadedTranslations.length > 0 &&
          !loadedTranslations.some(
            (translation) => translation.id === translationId,
          )
        ) {
          setTranslationId(loadedTranslations[0].id)
        }
      }

      setBook(bookData as BibleBook)
      setLoadingBook(false)
    }

    loadBookAndTranslations()
  }, [bookKey])

  useEffect(() => {
    async function loadChapterContent() {
      if (!book) return

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
          .eq('translation_id', translationId)
          .eq('book_id', book.id)
          .eq('chapter_number', chapterNumber)
          .order('verse_number', { ascending: true }),

        supabase
          .from('bible_chapter_studies')
          .select(
            'id, overview, historical_background, structure, themes',
          )
          .eq('translation_id', translationId)
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
  }, [book, chapterNumber, translationId])

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

    return () => {
      document.removeEventListener('mousedown', closeAiMenu)
    }
  }, [])

  useEffect(() => {
    if (!settingsOpen) return

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setSettingsOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [settingsOpen])

  const currentTranslation = useMemo(
    () =>
      translations.find(
        (translation) => translation.id === translationId,
      ),
    [translationId, translations],
  )

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

  function goToChapter(nextChapter: number) {
    if (!book) return

    const routeBookKey =
      book.name_en ?? book.abbreviation ?? String(book.id)

    navigate(
      `/bible/${encodeURIComponent(routeBookKey)}/${nextChapter}`,
    )
  }

  function goToVersePage(nextPage: number) {
    if (nextPage < 1 || nextPage > versePageCount) return
    setVersePage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

    try {
      await navigator.clipboard.writeText(copyText)
    } catch (error) {
      console.error('复制失败', error)
    }
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

  return (
    <main
      className={`chapter-reader-page ${
        nightMode ? 'is-night' : ''
      }`}
      style={
        {
          '--reader-font-scale': fontScale,
          '--reader-line-height': lineHeight,
        } as React.CSSProperties
      }
    >
      <section className="chapter-reader-toolbar">
        <div className="chapter-reader-toolbar-inner">
          <select
            className="chapter-reader-book-select"
            value={book.name_en ?? book.abbreviation ?? ''}
            onChange={(event) =>
              navigate(
                `/bible/${encodeURIComponent(
                  event.target.value,
                )}/1`,
              )
            }
            aria-label="选择书卷"
          >
            <option
              value={book.name_en ?? book.abbreviation ?? ''}
            >
              {book.name_zh}
            </option>
          </select>

          <select
            className="chapter-reader-chapter-select"
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
              第 {versePage} 页 / 共 {versePageCount} 页
            </span>
          </header>

          <div className="chapter-reader-panel-body">
            {loadingContent ? (
              <p className="chapter-reader-empty">
                正在读取经文……
              </p>
            ) : errorMessage ? (
              <p className="chapter-reader-empty">
                {errorMessage}
              </p>
            ) : currentVerses.length === 0 ? (
              <p className="chapter-reader-empty">
                当前页面还没有经文内容。
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
              onClick={() => goToVersePage(versePage - 1)}
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
              onClick={() => goToVersePage(versePage + 1)}
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
                  isAiMode &&
                  setAiMenuOpen((current) => !current)
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
                      {rightPanelMode === item.id && (
                        <strong>✓</strong>
                      )}
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

          <aside
            className="chapter-reader-settings-panel"
            aria-label="阅读设置"
          >
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
              <h3>译本</h3>

              <div className="chapter-reader-translation-list">
                {translations.map((translation) => (
                  <label key={translation.id}>
                    <input
                      type="radio"
                      name="translation"
                      checked={translationId === translation.id}
                      onChange={() =>
                        setTranslationId(translation.id)
                      }
                    />
                    <span>{translation.name_zh}</span>
                  </label>
                ))}
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
                onClick={() =>
                  setNightMode((current) => !current)
                }
              >
                {nightMode ? <Sun size={17} /> : <Moon size={17} />}
                <span>{nightMode ? '日间模式' : '夜间模式'}</span>
              </button>
            </section>

            <footer>
              <span>
                当前译本：{currentTranslation?.name_zh ?? ''}
              </span>
            </footer>
          </aside>
        </>
      )}
    </main>
  )
}
