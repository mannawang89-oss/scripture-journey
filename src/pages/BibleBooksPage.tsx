import { ArrowRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SectionHeading from '../components/SectionHeading'

const books = [
  { zh: '创世记', en: 'Genesis', chapters: 50, testament: 'old', intro: '起初、创造、堕落、应许与族长的故事。' },
  { zh: '出埃及记', en: 'Exodus', chapters: 40, testament: 'old', intro: '神拯救祂的百姓，并与他们立约。' },
  { zh: '诗篇', en: 'Psalms', chapters: 150, testament: 'old', intro: '在敬拜、哀歌、盼望与君王中祷告。' },
  { zh: '以赛亚书', en: 'Isaiah', chapters: 66, testament: 'old', intro: '审判、安慰、仆人与将来的荣耀。' },
  { zh: '马太福音', en: 'Matthew', chapters: 28, testament: 'new', intro: '耶稣是应许中的君王与弥赛亚。' },
  { zh: '马可福音', en: 'Mark', chapters: 16, testament: 'new', intro: '以行动和十字架呈现神子的福音。' },
  { zh: '路加福音', en: 'Luke', chapters: 24, testament: 'new', intro: '确实、有序地见证耶稣与神国。' },
  { zh: '约翰福音', en: 'John', chapters: 21, testament: 'new', intro: '叫人信耶稣是基督，并因信得生命。' },
]

export default function BibleBooksPage() {
  const [testament, setTestament] = useState<'all' | 'old' | 'new'>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    return books.filter((book) => {
      const matchTestament = testament === 'all' || book.testament === testament
      const normalized = query.trim().toLowerCase()
      const matchQuery = !normalized || book.zh.includes(normalized) || book.en.toLowerCase().includes(normalized)
      return matchTestament && matchQuery
    })
  }, [testament, query])

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
                onClick={() => setTestament(value as 'all' | 'old' | 'new')}
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

        <div className="book-grid">
          {filtered.map((book) => (
            <article className="book-card" key={book.en}>
              <span>{book.testament === 'old' ? 'OLD TESTAMENT' : 'NEW TESTAMENT'}</span>
              <h3>{book.zh}</h3>
              <p className="book-en">{book.en}</p>
              <p>{book.intro}</p>
              <div className="book-meta">
                <small>{book.chapters} 章</small>
                <Link to={`/bible/${book.en.toLowerCase()}/1`}>
                  进入 <ArrowRight size={15} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
