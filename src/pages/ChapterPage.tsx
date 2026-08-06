import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { supabase } from '../lib/supabase'

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

type StudyTab =
  | 'overview'
  | 'historical_background'
  | 'structure'
  | 'themes'

const studyTabs: Array<{
  id: StudyTab
  label: string
  eyebrow: string
  title: string
}> = [
  {
    id: 'overview',
    label: '章节概览',
    eyebrow: 'OVERVIEW',
    title: '章节概览',
  },
  {
    id: 'historical_background',
    label: '历史背景',
    eyebrow: 'HISTORICAL BACKGROUND',
    title: '历史背景',
  },
  {
    id: 'structure',
    label: '文学结构',
    eyebrow: 'LITERARY STRUCTURE',
    title: '文学结构',
  },
  {
    id: 'themes',
    label: '神学主题',
    eyebrow: 'THEOLOGICAL THEMES',
    title: '神学主题',
  },
]

function renderStudyText(content: string | null) {
  if (!content) {
    return <p>本栏目内容尚未整理。</p>
  }

  return content
    .split(/\n+/)
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={`${paragraph}-${index}`}>{paragraph}</p>
    ))
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
  const [activeStudyTab, setActiveStudyTab] =
    useState<StudyTab>('overview')
  const [loadingBook, setLoadingBook] = useState(true)
  const [loadingContent, setLoadingContent] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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
        setErrorMessage('译本资料读取失败。')
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
        const firstStudy =
          (studyData?.[0] as BibleChapterStudy | undefined) ?? null
        setStudy(firstStudy)
      }

      setLoadingContent(false)
    }

    loadChapterContent()
  }, [book, chapterNumber, translationId])

  const currentTranslation = useMemo(
    () =>
      translations.find(
        (translation) => translation.id === translationId,
      ),
    [translationId, translations],
  )

  const activeStudyConfig = studyTabs.find(
    (tab) => tab.id === activeStudyTab,
  )!

  const activeStudyContent = study
    ? study[activeStudyTab]
    : null

  function goToChapter(nextChapter: number) {
    if (!book) return

    const routeBookKey =
      book.name_en ?? book.abbreviation ?? String(book.id)

    navigate(
      `/bible/${encodeURIComponent(routeBookKey)}/${nextChapter}`,
    )
  }

  if (loadingBook && !book) {
    return (
      <main className="reader-status-page">
        <div className="container">
          <p>正在读取圣经内容……</p>
        </div>
      </main>
    )
  }

  if (errorMessage && !book) {
    return (
      <main className="reader-status-page reader-error">
        <div className="container">
          <p>{errorMessage}</p>
          <Link to="/bible">返回圣经目录</Link>
        </div>
      </main>
    )
  }

  if (!book) return null

  return (
    <main className="reader-page">
      <div className="reader-topbar">
        <div className="container reader-topbar-inner">
          <div className="reader-selects">
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

          <div className="reader-tools">
            <Link to="/bible">
              <BookOpen size={17} />
              <span>圣经目录</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container reader-shell">
        <article className="reader-main">
          <header className="reader-header">
            <p className="reader-kicker">
              {currentTranslation?.code ?? 'BIBLE'}
            </p>

            <h1>
              {book.name_zh} {chapterNumber}
            </h1>

            <p className="reader-book-en">{book.name_en}</p>

            <div className="reader-chapter-line">
              <span>第 {chapterNumber} 章</span>
              <i />
              <span>
                {currentTranslation?.name_zh ?? '和合本'}
              </span>
            </div>
          </header>

          {loadingContent ? (
            <section className="scripture-reading">
              <p>正在读取经文……</p>
            </section>
          ) : errorMessage ? (
            <section className="scripture-reading">
              <p>{errorMessage}</p>
            </section>
          ) : verses.length === 0 ? (
            <section className="reader-scripture-placeholder">
              <div className="reader-placeholder-icon">
                <BookOpen size={22} />
              </div>

              <div>
                <p className="reader-placeholder-label">
                  SCRIPTURE
                </p>
                <h2>本章经文尚未导入</h2>
                <p>
                  当前译本的这一章还没有经文内容，请先在
                  Supabase 中完成导入。
                </p>
              </div>
            </section>
          ) : (
            <section className="scripture-reading">
              {verses.map((verse) => (
                <p
                  className="scripture-verse"
                  key={verse.id}
                >
                  <sup>{verse.verse_number}</sup>
                  {verse.verse_text}
                </p>
              ))}
            </section>
          )}

          <section className="reader-study-panel">
            <div className="reader-study-tabs">
              {studyTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={
                    activeStudyTab === tab.id ? 'active' : ''
                  }
                  onClick={() => setActiveStudyTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="reader-study-content">
              <div className="reader-study-symbol">
                <BookOpen size={21} />
              </div>

              <div>
                <p className="reader-placeholder-label">
                  {activeStudyConfig.eyebrow}
                </p>

                <h3>{activeStudyConfig.title}</h3>

                <div className="reader-study-copy">
                  {renderStudyText(activeStudyContent)}
                </div>
              </div>
            </div>
          </section>

          <nav className="reader-bottom-nav">
            {chapterNumber > 1 ? (
              <button
                type="button"
                onClick={() =>
                  goToChapter(chapterNumber - 1)
                }
              >
                <ChevronLeft size={18} />
                <span>
                  <small>上一章</small>
                  第 {chapterNumber - 1} 章
                </span>
              </button>
            ) : (
              <span />
            )}

            <Link className="reader-back-link" to="/bible">
              <ArrowLeft size={15} />
              返回目录
            </Link>

            {chapterNumber < book.chapter_count ? (
              <button
                type="button"
                className="reader-next-link"
                onClick={() =>
                  goToChapter(chapterNumber + 1)
                }
              >
                <span>
                  <small>下一章</small>
                  第 {chapterNumber + 1} 章
                </span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <span />
            )}
          </nav>
        </article>

        <aside className="reader-sidebar">
          <div className="reader-sidebar-heading">
            <span>CHAPTERS</span>
            <strong>{book.name_zh}</strong>
          </div>

          <div className="reader-chapter-grid">
            {Array.from(
              { length: book.chapter_count },
              (_, index) => index + 1,
            ).map((chapter) => {
              const routeBookKey =
                book.name_en ??
                book.abbreviation ??
                String(book.id)

              return (
                <Link
                  className={
                    chapter === chapterNumber ? 'active' : ''
                  }
                  key={chapter}
                  to={`/bible/${encodeURIComponent(
                    routeBookKey,
                  )}/${chapter}`}
                >
                  {chapter}
                </Link>
              )
            })}
          </div>
        </aside>
      </div>
    </main>
  )
}
