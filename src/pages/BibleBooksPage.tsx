import { ArrowRight, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import SectionHeading from '../components/SectionHeading'
import { supabase } from '../lib/supabase'
import './BibleBooksPage.css'

type BibleBook = {
  id: number
  testament: 'old' | 'new'
  book_order: number
  name_zh: string
  name_en: string | null
  abbreviation: string | null
  chapter_count: number
}

export default function BibleBooksPage() {
  const [books, setBooks] = useState<BibleBook[]>([])
  const [testament, setTestament] = useState<'all' | 'old' | 'new'>(
    'all',
  )
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadBooks() {
      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('bible_books')
        .select(
          'id, testament, book_order, name_zh, name_en, abbreviation, chapter_count',
        )
        .order('book_order', { ascending: true })

      if (error) {
        console.error(error)
        setErrorMessage('书卷读取失败，请稍后刷新页面。')
        setBooks([])
      } else {
        setBooks((data ?? []) as BibleBook[])
      }

      setLoading(false)
    }

    loadBooks()
  }, [])

  const filteredBooks = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return books.filter((book) => {
      const matchesTestament =
        testament === 'all' || book.testament === testament

      const matchesQuery =
        !normalized ||
        book.name_zh.includes(normalized) ||
        (book.name_en ?? '').toLowerCase().includes(normalized) ||
        (book.abbreviation ?? '').toLowerCase().includes(normalized)

      return matchesTestament && matchesQuery
    })
  }, [books, query, testament])

  const oldTestamentBooks = filteredBooks.filter(
    (book) => book.testament === 'old',
  )

  const newTestamentBooks = filteredBooks.filter(
    (book) => book.testament === 'new',
  )

  function renderBookDirectory(
    titleZh: string,
    titleEn: string,
    sectionBooks: BibleBook[],
  ) {
    if (sectionBooks.length === 0) return null

    return (
      <section className="bible-directory-section">
        <header className="bible-directory-section-heading">
          <div>
            <p>{titleEn}</p>
            <h2>{titleZh}</h2>
          </div>

          <span>{sectionBooks.length} 卷</span>
        </header>

        <div className="bible-directory-list">
          {sectionBooks.map((book) => (
            <Link
              className="bible-directory-row"
              key={book.id}
              to={`/bible/${encodeURIComponent(
                book.name_en ??
                  book.abbreviation ??
                  String(book.id),
              )}/1`}
            >
              <span className="bible-directory-number">
                {String(book.book_order).padStart(2, '0')}
              </span>

              <span className="bible-directory-name">
                <strong>{book.name_zh}</strong>
                <small>{book.name_en ?? book.abbreviation}</small>
              </span>

              <span className="bible-directory-dots" />

              <span className="bible-directory-chapters">
                {book.chapter_count} 章
              </span>

              <span className="bible-directory-arrow">
                <ArrowRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="page-section bible-directory-page">
      <div className="container">
        <div className="bible-directory-header">
          <SectionHeading
            eyebrow="66 BOOKS"
            title="圣经目录"
          />

          <label className="bible-directory-search">
            <Search size={17} />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索书卷"
            />
          </label>
        </div>

        <div className="bible-directory-filter">
          {[
            ['all', '全部'],
            ['old', '旧约'],
            ['new', '新约'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={testament === value ? 'active' : ''}
              onClick={() =>
                setTestament(value as 'all' | 'old' | 'new')
              }
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="bible-directory-status">
            正在读取 66 卷圣经……
          </div>
        )}

        {!loading && errorMessage && (
          <div className="bible-directory-status">
            {errorMessage}
          </div>
        )}

        {!loading &&
          !errorMessage &&
          filteredBooks.length === 0 && (
            <div className="bible-directory-status">
              没有找到对应书卷。
            </div>
          )}

        {!loading && !errorMessage && filteredBooks.length > 0 && (
          <div className="bible-directory-content">
            {renderBookDirectory(
              '旧约',
              'OLD TESTAMENT',
              oldTestamentBooks,
            )}

            {renderBookDirectory(
              '新约',
              'NEW TESTAMENT',
              newTestamentBooks,
            )}
          </div>
        )}
      </div>
    </section>
  )
}
