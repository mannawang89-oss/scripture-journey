import {
  Bookmark,
  BookOpen,
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

export default function ChapterPage() {
  const { book = 'Luke', chapter = '1' } = useParams()
  const navigate = useNavigate()

  const decodedBook = decodeURIComponent(book)
  const currentChapter = Math.max(1, Number(chapter) || 1)

  const [bookData, setBookData] = useState<BibleBook | null>(null)
  const [allBooks, setAllBooks] = useState<BibleBook[]>([])
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadPage() {
      setLoading(true)
      setErrorMessage('')

      const { data: currentBook, error: currentBookError } = await supabase
        .from('bible_books')
        .select(
          'id, name_zh, name_en, abbreviation, chapter_count, testament',
        )
        .or(`name_en.eq.${decodedBook},abbreviation.eq.${decodedBook}`)
        .maybeSingle()

      if (currentBookError || !currentBook) {
        console.error(currentBookError)
        setErrorMessage('没有找到这卷圣经。')
        setBookData(null)
        setVerses([])
        setLoading(false)
        return
      }

      const safeChapter = Math.min(
        currentChapter,
        currentBook.chapter_count,
      )

      const [
        { data: books, error: booksError },
        { data: verseRows, error: versesError },
      ] = await Promise.all([
        supabase
          .from('bible_books')
          .select(
            'id, name_zh, name_en, abbreviation, chapter_count, testament',
          )
          .order('book_order', { ascending: true }),

        supabase
          .from('bible_verses')
          .select('id, verse_number, verse_text')
          .eq('translation_id', 1)
          .eq('book_id', currentBook.id)
          .eq('chapter_number', safeChapter)
          .order('verse_number', { ascending: true }),
      ])

      if (booksError || versesError) {
        console.error(booksError ?? versesError)
        setErrorMessage('章节内容读取失败，请稍后刷新。')
        setBookData(currentBook as BibleBook)
        setAllBooks((books ?? []) as BibleBook[])
        setVerses([])
      } else {
        setBookData(currentBook as BibleBook)
        setAllBooks((books ?? []) as BibleBook[])
        setVerses((verseRows ?? []) as BibleVerse[])
      }

      setLoading(false)
    }

    loadPage()
  }, [decodedBook, currentChapter])

  const safeChapter = useMemo(() => {
    if (!bookData) return 1
    return Math.min(currentChapter, bookData.chapter_count)
  }, [bookData, currentChapter])

  function goToBook(nameEn: string) {
    navigate(`/bible/${encodeURIComponent(nameEn)}/1`)
  }

  function goToChapter(chapterNumber: number) {
    if (!bookData) return
    navigate(
      `/bible/${encodeURIComponent(bookData.name_en)}/${chapterNumber}`,
    )
  }

  if (loading) {
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
                onChange={(event) => goToBook(event.target.value)}
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
                  <option key={chapterNumber} value={chapterNumber}>
                    第 {chapterNumber} 章
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="reader-tools">
            <button type="button">
              <Languages size={17} />
              <span>和合本</span>
            </button>
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
            <p className="reader-book-en">{bookData.name_en}</p>

            <div className="reader-chapter-line">
              <span>第 {safeChapter} 章</span>
              <i />
              <span>共 {bookData.chapter_count} 章</span>
            </div>
          </header>

          <section className="scripture-reading">
            {verses.length > 0 ? (
              verses.map((verse) => (
                <p className="scripture-verse" key={verse.id}>
                  <sup>{verse.verse_number}</sup>
                  {verse.verse_text}
                </p>
              ))
            ) : (
              <div className="reader-scripture-placeholder">
                <div className="reader-placeholder-icon">
                  <BookOpen size={24} />
                </div>

                <div>
                  <p className="reader-placeholder-label">
                    SCRIPTURE TEXT
                  </p>
                  <h2>本章尚未导入经文</h2>
                  <p>
                    当前已经进入《{bookData.name_zh}》第 {safeChapter} 章，
                    但数据库中还没有这一章的和合本经文。
                  </p>
                </div>
              </div>
            )}
          </section>

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

            <Link className="reader-back-link" to="/bible">
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
                  chapterNumber === safeChapter ? 'active' : ''
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
