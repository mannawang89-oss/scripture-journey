import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const collections = [
  {
    number: 'I',
    english: 'Scripture',
    title: '浏览圣经',
    text: '从创世记到启示录，按书卷与章节安静阅读。',
    to: '/bible',
  },
  {
    number: 'II',
    english: 'Sermon Archive',
    title: '讲道资料',
    text: '聆听讲道，并阅读经文脉络、摘要与研经整理。',
    to: '/sermons',
  },
  {
    number: 'III',
    english: 'Study',
    title: '研经阅读',
    text: '在译文、历史背景与整本圣经的连接中继续学习。',
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
            <p className="hero-volume">Scripture Journey · Digital Seminary</p>
            <span className="hero-ornament" aria-hidden="true">✦</span>
            <h1>在这里，慢慢读完整本圣经。</h1>
            <p className="hero-intro">
              经文、讲道与研经资料，安静地收录在同一座数字书房。
            </p>
            <Link className="hero-text-link" to="/bible">
              翻开圣经目录 <ArrowRight size={16} />
            </Link>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="paper-card paper-back" />
            <div className="paper-card paper-front">
              <span>THE GOSPEL ACCORDING TO LUKE</span>
              <div className="paper-emblem">SJ</div>
              <h2>“要叫你知道所学之道，都是确实的。”</h2>
              <p>路加福音 1:4</p>
              <div className="paper-rule" />
              <small>READ · STUDY · UNDERSTAND</small>
            </div>
          </div>
        </div>
      </section>

      <section className="home-collections" aria-labelledby="collections-title">
        <div className="container">
          <header className="home-section-heading">
            <div>
              <p>THE COLLECTIONS</p>
              <h2 id="collections-title">馆藏目录</h2>
            </div>
            <span>Scripture · Sermons · Study</span>
          </header>

          <div className="collection-index">
            {collections.map((entry) => (
              <Link className="collection-row" to={entry.to} key={entry.number}>
                <span className="collection-number">{entry.number}</span>
                <span className="collection-name">
                  <small>{entry.english}</small>
                  <strong>{entry.title}</strong>
                </span>
                <span className="collection-description">{entry.text}</span>
                <ArrowRight size={17} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-quick-start" aria-labelledby="quick-start-title">
        <div className="container">
          <div className="home-quick-heading">
            <div>
              <span className="eyebrow">OPEN A BOOK</span>
              <h2 id="quick-start-title">从一卷书开始</h2>
            </div>
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
                <em>{book.chapters} chapters</em>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
