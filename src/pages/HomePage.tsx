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
    </>
  )
}
