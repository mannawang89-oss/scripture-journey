import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

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

type BookGroup = {
  title: string
  subtitle: string
  books: BibleBook[]
}

const oldTestamentGroups = [
  { title: '律法书', subtitle: 'THE PENTATEUCH', range: [1, 5] },
  { title: '历史书', subtitle: 'HISTORICAL BOOKS', range: [6, 17] },
  { title: '诗歌智慧书', subtitle: 'POETRY & WISDOM', range: [18, 22] },
  { title: '大先知书', subtitle: 'MAJOR PROPHETS', range: [23, 27] },
  { title: '小先知书', subtitle: 'MINOR PROPHETS', range: [28, 39] },
]

const newTestamentGroups = [
  { title: '四福音', subtitle: 'THE GOSPELS', range: [40, 43] },
  { title: '教会历史', subtitle: 'CHURCH HISTORY', range: [44, 44] },
  { title: '保罗书信', subtitle: 'PAULINE EPISTLES', range: [45, 57] },
  { title: '普通书信', subtitle: 'GENERAL EPISTLES', range: [58, 65] },
  { title: '启示文学', subtitle: 'APOCALYPSE', range: [66, 66] },
]

function toRomanNumeral(value: number) {
  const numerals: Array<[number, string]> = [
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ]

  let current = value
  let result = ''

  numerals.forEach(([number, numeral]) => {
    while (current >= number) {
      result += numeral
      current -= number
    }
  })

  return result
}

function groupBooks(
  books: BibleBook[],
  definitions: Array<{
    title: string
    subtitle: string
    range: number[]
  }>,
): BookGroup[] {
  return definitions
    .map((definition) => ({
      title: definition.title,
      subtitle: definition.subtitle,
      books: books.filter(
        (book) =>
          book.book_order >= definition.range[0] &&
          book.book_order <= definition.range[1],
      ),
    }))
    .filter((group) => group.books.length > 0)
}

export default function BibleBooksPage() {
  const [books, setBooks] = useState<BibleBook[]>([])
  const [query, setQuery] = useState('')
  const [testament, setTestament] = useState<'all' | 'old' | 'new'>(
    'all',
  )
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
        setBooks([])
        setErrorMessage('圣经书卷读取失败，请稍后刷新页面。')
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
      const testamentMatches =
        testament === 'all' || book.testament === testament

      const queryMatches =
        !normalized ||
        [book.name_zh, book.name_en, book.abbreviation]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalized),
          )

      return testamentMatches && queryMatches
    })
  }, [books, query, testament])

  const oldBooks = filteredBooks.filter(
    (book) => book.testament === 'old',
  )

  const newBooks = filteredBooks.filter(
    (book) => book.testament === 'new',
  )

  const oldGroups = groupBooks(oldBooks, oldTestamentGroups)
  const newGroups = groupBooks(newBooks, newTestamentGroups)

  return (
    <main className="bible-library-page">
      <section className="bible-library-hero">
        <div className="bible-library-shell">
          <p className="bible-library-kicker">SCRIPTURE</p>
          <h1>浏览圣经</h1>
          <p className="bible-library-intro">
            从创世记到启示录，按书卷进入经文。
          </p>
        </div>
      </section>

      <section className="bible-library-controls">
        <div className="bible-library-shell bible-library-controls-inner">
          <label className="bible-library-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索书卷"
            />
          </label>

          <div className="bible-library-tabs">
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
        </div>
      </section>

      <section className="bible-library-content">
        <div className="bible-library-shell">
          {loading ? (
            <div className="bible-library-status">
              正在读取圣经书卷……
            </div>
          ) : errorMessage ? (
            <div className="bible-library-status">
              {errorMessage}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="bible-library-status">
              没有找到符合条件的书卷。
            </div>
          ) : (
            <>
              {testament !== 'new' && oldGroups.length > 0 && (
                <TestamentSection
                  eyebrow="OLD TESTAMENT"
                  title="旧约"
                  description="律法、历史、诗歌与先知。"
                  groups={oldGroups}
                />
              )}

              {testament !== 'old' && newGroups.length > 0 && (
                <TestamentSection
                  eyebrow="NEW TESTAMENT"
                  title="新约"
                  description="福音、教会、书信与启示。"
                  groups={newGroups}
                />
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}

function TestamentSection({
  eyebrow,
  title,
  description,
  groups,
}: {
  eyebrow: string
  title: string
  description: string
  groups: BookGroup[]
}) {
  return (
    <section className="testament-section">
      <header className="testament-heading">
        <p>{eyebrow}</p>
        <h2>{title}</h2>
        <span>{description}</span>
      </header>

      {groups.map((group) => (
        <section className="book-group" key={group.title}>
          <header className="book-group-heading">
            <div>
              <p>{group.subtitle}</p>
              <h3>{group.title}</h3>
            </div>
            <span>{group.books.length} 卷</span>
          </header>

          <div className="book-library-grid">
            {group.books.map((book) => {
              const routeBookKey =
                book.name_en ?? book.abbreviation ?? String(book.id)

              return (
                <Link
                  className="book-library-card"
                  key={book.id}
                  to={`/bible/${encodeURIComponent(routeBookKey)}/1`}
                >
                  <span className="book-library-number">
                    {toRomanNumeral(book.book_order)}
                  </span>

                  <div className="book-library-copy">
                    <p>{book.name_en ?? book.abbreviation ?? ''}</p>
                    <h4>{book.name_zh}</h4>
                  </div>

                  <span className="book-library-chapters">
                    {book.chapter_count} 章
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </section>
  )
}
