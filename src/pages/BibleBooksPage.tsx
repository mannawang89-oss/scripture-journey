import { ArrowRight, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import SectionHeading from '../components/SectionHeading'
import { supabase } from '../lib/supabase'

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
  const [testament, setTestament] = useState<'all' | 'old' | 'new'>('all')
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

  const filtered = useMemo(() => {
    return books.filter((book) => {
      const matchTestament =
        testament === 'all' || book.testament === testament

      const normalized = query.trim().toLowerCase()

      const matchQuery =
        !normalized ||
        book.name_zh.includes(normalized) ||
        (book.name_en ?? '').toLowerCase().includes(normalized) ||
        (book.abbreviation ?? '').toLowerCase().includes(normalized)

      return matchTestament && matchQuery
    })
  }, [books, testament, query])

  return (
    <section className="page-section">
      <div className="container">
        <SectionHeading
          eyebrow="66 BOOKS"
          title="圣经书卷"
          description="按书卷进入，而不是在首页一次看完所有信息。"
        />

        <div className="toolbar">
          <div className="segmented">
            {[
              ['all', '全部'],
              ['old', '旧约'],
              ['new', '新约'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={testament === value ? 'active' : ''}
                onClick={() =>
                  setTestament(value as 'all' | 'old' | 'new')
                }
              >
                {label}
              </button>
            ))}
          </div>

          <label className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索书卷"
            />
          </label>
        </div>

        {loading && <p>正在读取 66 卷圣经……</p>}

        {!loading && errorMessage && <p>{errorMessage}</p>}

        {!loading && !errorMessage && (
          <div className="book-grid">
            {filtered.map((book) => (
              <article className="book-card" key={book.id}>
                <span>
                  {book.testament === 'old'
                    ? 'OLD TESTAMENT'
                    : 'NEW TESTAMENT'}
                </span>

                <h3>{book.name_zh}</h3>

                <p className="book-en">{book.name_en}</p>

                <div className="book-meta">
                  <small>{book.chapter_count} 章</small>

                  <Link
                    to={`/bible/${encodeURIComponent(
                      book.name_en ?? book.abbreviation ?? String(book.id),
                    )}/1`}
                  >
                    进入 <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
