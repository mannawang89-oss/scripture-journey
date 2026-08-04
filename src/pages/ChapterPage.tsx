import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Languages,
  NotebookPen,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { supabase } from '../lib/supabase'

type BibleBook = {
  id: number
  name_zh: string
  name_en: string
  abbreviation: string | null
  chapter_count: number
  testament: 'old' | 'new'
}

type BibleVerse = {
  id: number
  verse_number: number
  verse_text: string
}

type BibleTranslation = {
  id: number
  code: string
  name_zh: string
  name_original: string
  language_code: string
}

export default function ChapterPage() {
  const { book = 'Luke', chapter = '1' } = useParams()
  const navigate = useNavigate()

  const decodedBook = decodeURIComponent(book)
  const currentChapter = Math.max(1, Number(chapter) || 1)

  const [bookData, setBookData] = useState<BibleBook | null>(null)
  const [allBooks, setAllBooks] = useState<BibleBook[]>([])
  const [translations, setTranslations] = useState<BibleTranslation[]>([])
  const [selectedTranslationId, setSelectedTranslationId] = useState(1)
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [loadingPage, setLoadingPage] = useState(true)
  const [loadingVerses, setLoadingVerses] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadBaseData() {
      setLoadingPage(true)
      setErrorMessage('')

      const [
        { data: currentBook, error: currentBookError },
        { data: books, error: booksError },
        { data: translationRows, error: translationsError },
      ] = await Promise.all([
        supabase
          .from('bible_books')
          .select(
            'id, name_zh, name_en, abbreviation, chapter_count, testament',
          )
          .or(
            `name_en.eq.${decodedBook},abbreviation.eq.${decodedBook}`,
          )
          .maybeSingle(),

        supabase
          .from('bible_books')
          .select(
            'id, name_zh, name_en, abbreviation, chapter_count, testament',
          )
          .order('book_order', { ascending: true }),

        supabase
          .from('bible_translations')
          .select(
            'id, code, name_zh, name_original, language_code',
          )
          .order('id', { ascending: true }),
      ])

      if (
        currentBookError ||
        booksError ||
        translationsError ||
        !currentBook
      ) {
        console.error(
          currentBookError ?? booksError ?? translationsError,
        )
        setErrorMessage('书卷资料读取失败，请稍后刷新页面。')
        setBookData(null)
        setAllBooks([])
        setTranslations([])
      } else {
        setBookData(currentBook as BibleBook)
        setAllBooks((books ?? []) as BibleBook[])
        setTranslations(
          (translationRows ?? []) as BibleTranslation[],
        )
      }

      setLoadingPage(false)
    }

    loadBaseData()
  }, [decodedBook])

  const safeChapter = useMemo(() => {
    if (!bookData) return 1
    return Math.min(currentChapter, bookData.chapter_count)
  }, [bookData, currentChapter])

  useEffect(() => {
    async function loadVerses() {
      if (!bookData) return

      setLoadingVerses(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('bible_verses')
        .select('id, verse_number, verse_text')
        .eq('translation_id', selectedTranslationId)
        .eq('book_id', bookData.id)
        .eq('chapter_number', safeChapter)
        .order('verse_number', { ascending: true })

      if (error) {
        console.error(error)
        setErrorMessage('本章经文读取失败，请稍后刷新。')
        setVerses([])
      } else {
        setVerses((data ?? []) as BibleVerse[])
      }

      setLoadingVerses(false)
    }

    loadVerses()
  }, [bookData, safeChapter, selectedTranslationId])

  function goToBook(nameEn: string) {
    navigate(`/bible/${encodeURIComponent(nameEn)}/1`)
  }

  function goToChapter(chapterNumber: number) {
    if (!bookData) return

    navigate(
      `/bible/${encodeURIComponent(
        bookData.name_en,
      )}/${chapterNumber}`,
    )
  }

  if (loadingPage) {
    return (
      <section className="reader-status-page">
        <div className="container">
          <p>正在读取章节内容……</p>
        </div>
      </section>
    )
  }

  if (!bookData) {
    return (
      <section className="reader-status-page">
        <div className="container reader-error">
          <p>{errorMessage}</p>
          <Link to="/bible">返回圣经书卷</Link>
        </div>
      </section>
    )
  }

  const selectedTranslation =
    translations.find(
      (item) => item.id === selectedTranslationId,
    ) ?? null

  const hasPrevious = safeChapter > 1
  const hasNext = safeChapter < bookData.chapter_count

  return (
    <section className="reader-page">
      <div className="reader-topbar">
        <div className="container reader-topbar-inner">
          <div className="reader-selects">
            <label>
              <span>书卷</span>

              <select
                value={bookData.name_en}
                onChange={(event) =>
                  goToBook(event.target.value)
                }
              >
                {allBooks.map((item) => (
                  <option key={item.id} value={item.name_en}>
                    {item.name_zh} · {item.name_en}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>章节</span>

              <select
                value={safeChapter}
                onChange={(event) =>
                  goToChapter(Number(event.target.value))
                }
              >
                {Array.from(
                  { length: bookData.chapter_count },
                  (_, index) => index + 1,
                ).map((chapterNumber) => (
                  <option
                    key={chapterNumber}
                    value={chapterNumber}
                  >
                    第 {chapterNumber} 章
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="reader-tools">
            <label className="translation-select">
              <Languages size={17} />

              <select
                value={selectedTranslationId}
                onChange={(event) =>
                  setSelectedTranslationId(
                    Number(event.target.value),
                  )
                }
                aria-label="切换圣经译本"
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

            <button type="button">
              <Bookmark size={17} />
              <span>收藏</span>
            </button>

            <button type="button">
              <NotebookPen size={17} />
              <span>笔记</span>
            </button>

            <button type="button">
              <Sparkles size={17} />
              <span>AI</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container reader-shell">
        <article className="reader-main">
          <header className="reader-header">
            <p className="reader-kicker">
              {bookData.testament === 'old'
                ? 'OLD TESTAMENT'
                : 'NEW TESTAMENT'}
            </p>

            <h1>{bookData.name_zh}</h1>

            <p className="reader-book-en">
              {bookData.name_en}
            </p>

            <div className="reader-chapter-line">
              <span>第 {safeChapter} 章</span>
              <i />
              <span>共 {bookData.chapter_count} 章</span>

              {selectedTranslation && (
                <>
                  <i />
                  <span>{selectedTranslation.name_zh}</span>
                </>
              )}
            </div>
          </header>

          <section className="scripture-reading">
            {loadingVerses ? (
              <p className="reader-loading-copy">
                正在切换译本……
              </p>
            ) : verses.length > 0 ? (
              verses.map((verse) => (
                <p
                  className="scripture-verse"
                  key={verse.id}
                >
                  <sup>{verse.verse_number}</sup>
                  {verse.verse_text}
                </p>
              ))
            ) : (
              <div className="translation-empty-state">
                <p className="reader-placeholder-label">
                  TRANSLATION NOT IMPORTED
                </p>

                <h2>这一译本尚未导入本章经文</h2>

                <p>
                  当前选择的是「
                  {selectedTranslation?.name_zh ?? '未知译本'}
                  」。数据库中暂时没有《
                  {bookData.name_zh}》第 {safeChapter}{' '}
                  章的内容。
                </p>
              </div>
            )}
          </section>

          {errorMessage && (
            <p className="reader-inline-error">
              {errorMessage}
            </p>
          )}

          <nav className="reader-bottom-nav">
            {hasPrevious ? (
              <Link
                to={`/bible/${encodeURIComponent(
                  bookData.name_en,
                )}/${safeChapter - 1}`}
              >
                <ChevronLeft size={17} />

                <span>
                  <small>上一章</small>
                  第 {safeChapter - 1} 章
                </span>
              </Link>
            ) : (
              <span />
            )}

            <Link
              className="reader-back-link"
              to="/bible"
            >
              返回书卷目录
            </Link>

            {hasNext ? (
              <Link
                className="reader-next-link"
                to={`/bible/${encodeURIComponent(
                  bookData.name_en,
                )}/${safeChapter + 1}`}
              >
                <span>
                  <small>下一章</small>
                  第 {safeChapter + 1} 章
                </span>

                <ChevronRight size={17} />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </article>

        <aside className="reader-sidebar">
          <div className="reader-sidebar-heading">
            <span>CHAPTERS</span>
            <strong>章节目录</strong>
          </div>

          <div className="reader-chapter-grid">
            {Array.from(
              { length: bookData.chapter_count },
              (_, index) => index + 1,
            ).map((chapterNumber) => (
              <Link
                key={chapterNumber}
                className={
                  chapterNumber === safeChapter
                    ? 'active'
                    : ''
                }
                to={`/bible/${encodeURIComponent(
                  bookData.name_en,
                )}/${chapterNumber}`}
              >
                {chapterNumber}
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}
