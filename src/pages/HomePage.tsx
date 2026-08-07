import { ArrowRight, BookMarked, BookOpen, Mic2, NotebookPen } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionHeading from '../components/SectionHeading'
import { isSupabaseConfigured } from '../lib/supabase'

const entries = [
  {
    icon: BookOpen,
    title: '阅读圣经',
    text: '从书卷、章节、背景与结构进入经文。',
    to: '/bible',
  },
  {
    icon: Mic2,
    title: '讲道资源',
    text: '保存讲道音频、摘要、中心思想与回应。',
    to: '/sermons',
  },
  {
    icon: NotebookPen,
    title: '我的笔记',
    text: '把理解、疑问和祷告整理成长期记录。',
    to: '/bible',
  },
  {
    icon: BookMarked,
    title: '学习计划',
    text: '按书卷和主题建立持续阅读节奏。',
    to: '/bible',
  },
]

const quickBooks = [
  { name: '创世记', english: 'Genesis', chapters: 50 },
  { name: '诗篇', english: 'Psalms', chapters: 150 },
  { name: '路加福音', english: 'Luke', chapters: 24 },
  { name: '罗马书', english: 'Romans', chapters: 16 },
]

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">SCRIPTURE JOURNEY</span>
            <h1>让圣经学习，成为一条可以长期行走的路。</h1>
            <p>
              一个安静、清晰、可积累的数字神学院空间。阅读经文，理解背景，整理讲道，也留下自己的回应。
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/bible">
                开始阅读 <ArrowRight size={17} />
              </Link>
              <Link className="button button-secondary" to="/sermons">
                查看讲道
              </Link>
            </div>
            {!isSupabaseConfigured && (
              <div className="setup-note">
                项目已创建，下一步只需填入 Supabase 连接信息。
              </div>
            )}
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="paper-card paper-back"></div>
            <div className="paper-card paper-front">
              <span>LUKE</span>
              <h3>“要叫你知道所学之道，都是确实的。”</h3>
              <p>路加福音 1:4</p>
              <div className="paper-rule"></div>
              <small>READ · STUDY · REMEMBER</small>
            </div>
          </div>
        </div>
      </section>

      <section className="home-quick-start" aria-labelledby="quick-start-title">
        <div className="container">
          <div className="home-quick-heading">
            <div>
              <span className="eyebrow">OPEN A BOOK</span>
              <h2 id="quick-start-title">从经文本身开始</h2>
            </div>
            <Link className="text-link" to="/bible">
              完整圣经目录 <ArrowRight size={16} />
            </Link>
          </div>

          <div className="home-book-shelf">
            {quickBooks.map((book, index) => (
              <Link
                className="home-book-spine"
                key={book.english}
                to={`/bible/${book.english}/1`}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{book.name}</strong>
                  <small>{book.english.toUpperCase()}</small>
                </div>
                <em>{book.chapters} 章</em>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="container">
          <SectionHeading
            eyebrow="CONTINUE"
            title="继续学习"
            description="你的阅读进度、最近章节和讲道记录将从 Supabase 自动出现。"
          />
          <div className="continue-card">
            <div>
              <span className="eyebrow">尚未开始</span>
              <h3>从一卷书开始，而不是从功能开始。</h3>
              <p>第一阶段建议从《路加福音》开始建立完整内容。</p>
            </div>
            <Link className="text-link" to="/bible">
              浏览书卷 <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="content-section muted-section">
        <div className="container">
          <SectionHeading
            eyebrow="CORE"
            title="四个核心入口"
            description="第一版只保留真正重要的内容，不再把所有功能同时堆在首页。"
          />
          <div className="entry-grid">
            {entries.map(({ icon: Icon, title, text, to }) => (
              <Link className="entry-card" to={to} key={title}>
                <Icon size={22} />
                <h3>{title}</h3>
                <p>{text}</p>
                <span>进入 <ArrowRight size={15} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
