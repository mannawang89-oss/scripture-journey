import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const collections = [
  {
    number: 'I',
    title: '浏览圣经',
    to: '/bible',
  },
  {
    number: 'II',
    title: '讲道资料',
    to: '/sermons',
  },
  {
    number: 'III',
    title: '研经阅读',
    to: '/bible',
  },
]

const quickBooks = [
  { name: 'Genesis', secondary: '创世记', chapters: 50 },
  { name: 'Psalms', secondary: '诗篇', chapters: 150 },
  { name: 'Luke', secondary: '路加福音', chapters: 24 },
  { name: 'Romans', secondary: '罗马书', chapters: 16 },
]

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-ornament" aria-hidden="true">✦</span>
            <h1>祢的帐幕在人间</h1>
            <Link className="hero-text-link" to="/bible">
              翻开圣经目录 <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>

      <section className="home-collections" aria-labelledby="collections-title">
        <div className="container">
          <header className="home-section-heading">
            <div>
              <h2 id="collections-title">馆藏与阅读</h2>
            </div>
          </header>

          <div className="collection-index">
            {collections.map((entry) => (
              <Link className="collection-row" to={entry.to} key={entry.number}>
                <span className="collection-number">{entry.number}</span>
                <span className="collection-name">
                  <strong>{entry.title}</strong>
                </span>
                <ArrowRight size={17} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-quick-start" aria-labelledby="quick-start-title">
        <div className="container">
          <div className="home-quick-heading">
            <h2 id="quick-start-title">从一卷书开始</h2>
            <Link className="text-link" to="/bible">
              完整圣经目录 <ArrowRight size={16} />
            </Link>
          </div>

          <div className="home-book-shelf">
            {quickBooks.map((book, index) => (
              <Link
                className="home-book-spine"
                key={book.name}
                to={`/bible/${book.name}/1`}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{book.name}</strong>
                  <small>{book.secondary}</small>
                </div>
                <em>{book.chapters} 章</em>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
