import { ArrowRight, Search } from 'lucide-react'
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

type TestamentFilter = 'all' | 'old' | 'new'

type GroupDefinition = {
  titleZh: string
  titleEn: string
  start: number
  end: number
}

type BookGroup = GroupDefinition & {
  books: BibleBook[]
}

const OLD_TESTAMENT_GROUPS: GroupDefinition[] = [
  {
    titleZh: 'Pentateuch',
    titleEn: 'THE PENTATEUCH',
    start: 1,
    end: 5,
  },
  {
    titleZh: 'Historical Books',
    titleEn: 'HISTORICAL BOOKS',
    start: 6,
    end: 17,
  },
  {
    titleZh: 'Poetry & Wisdom',
    titleEn: 'POETRY & WISDOM',
    start: 18,
    end: 22,
  },
  {
    titleZh: 'Major Prophets',
    titleEn: 'MAJOR PROPHETS',
    start: 23,
    end: 27,
  },
  {
    titleZh: 'Minor Prophets',
    titleEn: 'MINOR PROPHETS',
    start: 28,
    end: 39,
  },
]

const NEW_TESTAMENT_GROUPS: GroupDefinition[] = [
  {
    titleZh: 'The Gospels',
    titleEn: 'THE GOSPELS',
    start: 40,
    end: 43,
  },
  {
    titleZh: 'Church History',
    titleEn: 'CHURCH HISTORY',
    start: 44,
    end: 44,
  },
  {
    titleZh: 'Pauline Epistles',
    titleEn: 'PAULINE EPISTLES',
    start: 45,
    end: 57,
  },
  {
    titleZh: 'General Epistles',
    titleEn: 'GENERAL EPISTLES',
    start: 58,
    end: 65,
  },
  {
    titleZh: 'Apocalypse',
    titleEn: 'APOCALYPSE',
    start: 66,
    end: 66,
  },
]

function buildGroups(
  books: BibleBook[],
  definitions: GroupDefinition[],
): BookGroup[] {
  return definitions
    .map((definition) => ({
      ...definition,
      books: books.filter(
        (book) =>
          book.book_order >= definition.start &&
          book.book_order <= definition.end,
      ),
    }))
    .filter((group) => group.books.length > 0)
}

function formatBookNumber(bookOrder: number) {
  return String(bookOrder).padStart(2, '0')
}

export default function BibleBooksPage() {
  const [books, setBooks] = useState<BibleBook[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<TestamentFilter>('all')
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
        setErrorMessage('Unable to load Bible books. Please refresh and try again.')
      } else {
        setBooks((data ?? []) as BibleBook[])
      }

      setLoading(false)
    }

    loadBooks()
  }, [])

  const filteredBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return books.filter((book) => {
      const matchesFilter =
        filter === 'all' || book.testament === filter

      const matchesQuery =
        !normalizedQuery ||
        [book.name_zh, book.name_en, book.abbreviation]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedQuery),
          )

      return matchesFilter && matchesQuery
    })
  }, [books, filter, query])

  const oldGroups = useMemo(
    () =>
      buildGroups(
        filteredBooks.filter((book) => book.testament === 'old'),
        OLD_TESTAMENT_GROUPS,
      ),
    [filteredBooks],
  )

  const newGroups = useMemo(
    () =>
      buildGroups(
        filteredBooks.filter((book) => book.testament === 'new'),
        NEW_TESTAMENT_GROUPS,
      ),
    [filteredBooks],
  )

  return (
    <main className="scripture-directory-page">
      <section className="scripture-directory-header">
        <div className="scripture-directory-shell">
          <p className="scripture-directory-eyebrow">THE HOLY BIBLE</p>
          <h1>Bible</h1>
          <div className="scripture-directory-intro">
            <p>Sixty-six books. One story—from creation and redemption to new creation.</p>
            {!loading && !errorMessage && (
              <span>{books.length} books · 39 Old Testament · 27 New Testament</span>
            )}
          </div>
        </div>
      </section>

      <section className="scripture-directory-controls">
        <div className="scripture-directory-shell scripture-directory-controls-inner">
          <label className="scripture-directory-search">
            <Search size={17} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search books"
              aria-label="Search Bible books"
            />
          </label>

          <div
            className="scripture-directory-filter"
            aria-label="筛选旧约或新约"
          >
            {[
              ['all', 'All'],
              ['old', 'Old Testament'],
              ['new', 'New Testament'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filter === value ? 'active' : ''}
                onClick={() =>
                  setFilter(value as TestamentFilter)
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="scripture-directory-content">
        <div className="scripture-directory-shell">
          {loading ? (
            <div className="scripture-directory-status">
              Loading Bible books…
            </div>
          ) : errorMessage ? (
            <div className="scripture-directory-status">
              {errorMessage}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="scripture-directory-status">
              <div>
                <p>No books match your search.</p>
                <button type="button" onClick={() => setQuery('')}>
                  Clear search
                </button>
              </div>
            </div>
          ) : (
            <>
              {filter !== 'new' && oldGroups.length > 0 && (
                <TestamentDirectory
                  titleZh="Old Testament"
                  titleEn="OLD TESTAMENT"
                  groups={oldGroups}
                />
              )}

              {filter !== 'old' && newGroups.length > 0 && (
                <TestamentDirectory
                  titleZh="New Testament"
                  titleEn="NEW TESTAMENT"
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

function TestamentDirectory({
  titleZh,
  titleEn,
  groups,
}: {
  titleZh: string
  titleEn: string
  groups: BookGroup[]
}) {
  return (
    <section className="testament-directory">
      <header className="testament-directory-heading">
        <p>{titleEn}</p>
        <h2>{titleZh}</h2>
      </header>

      {groups.map((group) => (
        <section
          className="scripture-book-group"
          key={group.titleEn}
        >
          <header className="scripture-book-group-heading">
            <p>{group.titleEn}</p>
            <h3>{group.titleZh}</h3>
          </header>

          <div className="scripture-directory-list">
            {group.books.map((book) => {
              const routeBookKey =
                book.name_en ??
                book.abbreviation ??
                String(book.id)

              return (
                <Link
                  className="scripture-directory-row"
                  key={book.id}
                  to={`/bible/${encodeURIComponent(routeBookKey)}/1`}
                >
                  <span className="scripture-directory-number">
                    {formatBookNumber(book.book_order)}
                  </span>

                  <strong className="scripture-directory-name-zh">
                    {book.name_en ?? book.abbreviation ?? book.name_zh}
                  </strong>

                  <span className="scripture-directory-name-en">
                    {book.name_zh}
                  </span>

                  <span className="scripture-directory-chapters">
                    {book.chapter_count} chapters
                  </span>

                  <ArrowRight
                    className="scripture-directory-arrow"
                    size={16}
                  />
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </section>
  )
}
