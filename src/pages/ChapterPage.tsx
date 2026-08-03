import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import SectionHeading from '../components/SectionHeading'

const demoParagraphs = [
  '提阿非罗大人哪，有好些人提笔作书，述说在我们中间所成就的事，是照传道的人从起初亲眼看见又传给我们的。',
  '这些事我既从起头都详细考察了，就定意要按着次序写给你，使你知道所学之道都是确实的。',
  '当犹太王希律的时候，亚比雅班里有一个祭司，名叫撒迦利亚；他妻子是亚伦的后人，名叫伊利莎白。',
]

export default function ChapterPage() {
  const { book = 'luke', chapter = '1' } = useParams()

  return (
    <section className="page-section reading-page">
      <div className="container reading-layout">
        <article className="reading-main">
          <SectionHeading eyebrow={book.toUpperCase()} title={`路加福音 第 ${chapter} 章`} />
          <div className="chapter-intro">
            <strong>本章中心</strong>
            <p>神在沉默之后重新说话，并在人的历史中预备救恩的道路。</p>
          </div>

          <div className="scripture-text">
            {demoParagraphs.map((text, index) => (
              <p key={text}>
                <sup>{index + 1}</sup>
                {text}
              </p>
            ))}
          </div>

          <div className="chapter-nav">
            <button disabled><ChevronLeft size={17} /> 上一章</button>
            <Link to="/bible">返回书卷</Link>
            <button>下一章 <ChevronRight size={17} /></button>
          </div>
        </article>

        <aside className="reading-aside">
          <div>
            <span className="eyebrow">STUDY</span>
            <h3>章节学习</h3>
          </div>
          <button className="aside-item active">章节摘要</button>
          <button className="aside-item">历史背景</button>
          <button className="aside-item">文学结构</button>
          <button className="aside-item">神学主题</button>
          <button className="aside-item">旧约引用与互文</button>
          <button className="aside-item">反思问题</button>
        </aside>
      </div>
    </section>
  )
}
