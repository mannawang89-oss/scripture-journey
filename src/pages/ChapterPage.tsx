import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Landmark,
  Layers3,
  Search,
  Sparkles,
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
  const [studyMenuOpen, setStudyMenuOpen] = useState(false)
  const [loadingBook, setLoadingBook] = useState(true)
  const [loadingContent, setLoadingContent] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const aiMenuRef = useRef<HTMLDivElement | null>(null)
  const studyMenuRef = useRef<HTMLDivElement | null>(null)

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
    function closeMenus(event: MouseEvent) {
      const target = event.target as Node

      if (
        aiMenuRef.current &&
        !aiMenuRef.current.contains(target)
      ) {
        setAiMenuOpen(false)
      }

      if (
        studyMenuRef.current &&
        !studyMenuRef.current.contains(target)
      ) {
        setStudyMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', closeMenus)

    return () => {
      document.removeEventListener('mousedown', closeMenus)
    }
  }, [])

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
      <main className="chapter-v1-status">
        <p>正在读取圣经内容……</p>
      </main>
    )
  }

  if (!book) {
    return (
      <main className="chapter-v1-status">
        <p>{errorMessage || '没有找到这卷圣经。'}</p>
        <Link to="/bible">返回圣经目录</Link>
      </main>
    )
  }

  return (
    <main className="chapter-v1-page">
      <section className="chapter-v1-toolbar">
        <div className="chapter-v1-toolbar-inner">
          <div className="chapter-v1-select-group">
            <label>
              <span>书卷</span>
              <select
                value={book.name_en ?? book.abbreviation ?? ''}
                onChange={(event) =>
                  navigate(
                    `/bible/${encodeURIComponent(
                      event.target.value,
                    )}/1`,
                  )
                }
              >
                <option
                  value={book.name_en ?? book.abbreviation ?? ''}
                >
                  {book.name_zh}
                </option>
              </select>
            </label>

            <label>
              <span>章节</span>
              <select
                value={chapterNumber}
                onChange={(event) =>
                  goToChapter(Number(event.target.value))
                }
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
            </label>

            <label>
              <span>译本</span>
              <select
                value={translationId}
                onChange={(event) =>
                  setTranslationId(Number(event.target.value))
                }
              >
                {translations.map((translation) => (
                  <option
                    key={translation.id}
                    value={translation.id}
                  >
                    {translation.name_zh}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="chapter-v1-toolbar-actions">
            <button type="button" aria-label="搜索">
              <Search size={18} />
            </button>

            <div
              className="chapter-v1-study-menu"
              ref={studyMenuRef}
            >
              <button
                type="button"
                className="chapter-v1-study-trigger"
                onClick={() =>
                  setStudyMenuOpen((current) => !current)
                }
              >
                研读工具
                <ChevronDown
                  size={16}
                  className={studyMenuOpen ? 'is-open' : ''}
                />
              </button>

              {studyMenuOpen && (
                <div className="chapter-v1-dropdown chapter-v1-study-dropdown">
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
                          setStudyMenuOpen(false)
                        }}
                      >
                        <Icon size={17} />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="chapter-v1-layout">
        <article className="chapter-v1-panel chapter-v1-scripture-panel">
          <header className="chapter-v1-panel-header">
            <span>
              第 {versePage} 页 / 共 {versePageCount} 页
            </span>
            <small>
              {book.name_zh} {chapterNumber} ·{' '}
              {currentTranslation?.name_zh ?? ''}
            </small>
          </header>

          <div className="chapter-v1-panel-body">
            {loadingContent ? (
              <p className="chapter-v1-empty">正在读取经文……</p>
            ) : errorMessage ? (
              <p className="chapter-v1-empty">{errorMessage}</p>
            ) : currentVerses.length === 0 ? (
              <p className="chapter-v1-empty">
                当前页面还没有经文内容。
              </p>
            ) : (
              currentVerses.map((verse) => (
                <p
                  className="chapter-v1-verse"
                  key={verse.id}
                >
                  <sup>{verse.verse_number}</sup>
                  <span>{verse.verse_text}</span>
                </p>
              ))
            )}
          </div>

          <footer className="chapter-v1-pagination">
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

        <article className="chapter-v1-panel chapter-v1-right-panel">
          <header className="chapter-v1-panel-header">
            <div className="chapter-v1-ai-menu" ref={aiMenuRef}>
              <button
                type="button"
                className="chapter-v1-ai-trigger"
                onClick={() =>
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
                <div className="chapter-v1-dropdown chapter-v1-ai-dropdown">
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
              className="chapter-v1-copy-button"
              onClick={copyRightPanel}
              aria-label="复制当前内容"
            >
              <Copy size={17} />
            </button>
          </header>

          <div className="chapter-v1-panel-body chapter-v1-right-body">
            {isAiMode ? (
              currentVerses.map((verse) => (
                <p
                  className="chapter-v1-verse chapter-v1-ai-verse"
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
              <div className="chapter-v1-study-content">
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
              <p className="chapter-v1-empty">
                本栏目内容尚未整理。
              </p>
            )}
          </div>
        </article>
      </section>
    </main>
  )
}
