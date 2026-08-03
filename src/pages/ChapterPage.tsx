import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import SectionHeading from '../components/SectionHeading'
import { supabase } from '../lib/supabase'

type BibleBook = {
  id: number
  name_zh: string
  name_en: string
  abbreviation: string | null
  chapter_count: number
  testament: 'old' | 'new'
}

export default function ChapterPage() {
  const { book = 'Luke', chapter = '1' } = useParams()

  const decodedBook = decodeURIComponent(book)
  const currentChapter = Math.max(1, Number(chapter) || 1)

  const [bookData, setBookData] = useState<BibleBook | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadBook() {
      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('bible_books')
        .select(
          'id, name_zh, name_en, abbreviation, chapter_count, testament',
        )
        .or(
          `name_en.eq.${decodedBook},abbreviation.eq.${decodedBook}`,
        )
        .maybeSingle()

      if (error) {
        console.error(error)
        setErrorMessage('书卷资料读取失败，请稍后刷新页面。')
        setBookData(null)
      } else if (!data) {
        setErrorMessage('没有找到这卷圣经。')
        setBookData(null)
      } else {
        setBookData(data as BibleBook)
      }

      setLoading(false)
    }

    loadBook()
  }, [decodedBook])

  if (loading) {
    return (
      <section className="page-section">
        <div className="container">
          <p>正在读取书卷资料……</p>
        </div>
      </section>
    )
  }

  if (!bookData || errorMessage) {
    return (
      <section className="page-section">
        <div className="container">
          <p>{errorMessage}</p>
          <Link to="/bible">返回圣经书卷</Link>
        </div>
      </section>
    )
  }

  const safeChapter = Math.min(currentChapter, bookData.chapter_count)
  const hasPrevious = safeChapter > 1
  const hasNext = safeChapter < bookData.chapter_count

  return (
    <section className="page-section reading-page">
      <div className="container reading-layout">
        <article className="reading-main">
          <SectionHeading
            eyebrow={`${bookData.name_en.toUpperCase()} · ${safeChapter}`}
            title={`${bookData.name_zh} 第 ${safeChapter} 章`}
            description={`${bookData.name_en} · 共 ${bookData.chapter_count} 章`}
          />

          <div className="chapter-intro">
            <strong>章节内容正在建设中</strong>
            <p>
              当前已经正确进入《{bookData.name_zh}》第 {safeChapter} 章。
              下一步将加入经文、多译本切换、查经内容和个人笔记。
            </p>
          </div>

          <div className="chapter-navigation">
            {hasPrevious ? (
              <Link
                to={`/bible/${encodeURIComponent(
                  bookData.name_en,
                )}/${safeChapter - 1}`}
              >
                <ChevronLeft size={17} />
                上一章
              </Link>
            ) : (
              <span />
            )}

            <Link to="/bible">返回书卷目录</Link>

            {hasNext ? (
              <Link
                to={`/bible/${encodeURIComponent(
                  bookData.name_en,
                )}/${safeChapter + 1}`}
              >
                下一章
                <ChevronRight size={17} />
              </Link>
            ) : (
              <span />
            )}
          </div>
        </article>

        <aside className="reading-sidebar">
          <p className="sidebar-label">章节目录</p>

          <div className="chapter-grid">
            {Array.from(
              { length: bookData.chapter_count },
              (_, index) => index + 1,
            ).map((chapterNumber) => (
              <Link
                key={chapterNumber}
                className={
                  chapterNumber === safeChapter ? 'active' : ''
                }
                to={`/bible/${encodeURIComponent(
                  bookData.name_en,
                )}/${chapterNumber}`}
              >
                {chapterNumber}
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}
