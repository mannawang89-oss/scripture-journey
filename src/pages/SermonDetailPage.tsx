import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Mic2,
  ScrollText,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { supabase } from '../lib/supabase'

type Sermon = {
  id: string
  title: string
  speaker: string | null
  sermon_date: string | null
  scripture_reference: string | null
  scripture_references: string | null
  summary: string | null
  central_message: string | null
  outline: string | null
  key_quotes: string | null
  tags: string[] | null
  historical_background: string | null
  literary_context: string | null
  original_language: string | null
  christ_centered: string | null
  biblical_connections: string | null
  theological_themes: string[] | null
  speaker_insights: string | null
  audio_path: string | null
  status: string | null
}

type ContentSectionProps = {
  eyebrow: string
  title: string
  content: string | null
  className?: string
}

type AccordionSectionProps = {
  eyebrow: string
  title: string
  content: string | null
  isOpen: boolean
  onToggle: () => void
}

function RenderContent({ content }: { content: string | null }) {
  if (!content) {
    return <p className="sermon-empty-copy">内容待整理。</p>
  }

  return (
    <>
      {content
        .split(/\n+/)
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={`${paragraph}-${index}`}>{paragraph}</p>
        ))}
    </>
  )
}

function ContentSection({
  eyebrow,
  title,
  content,
  className = '',
}: ContentSectionProps) {
  return (
    <section className={`sermon-content-section ${className}`}>
      <p className="sermon-section-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>

      <div className="sermon-rich-copy">
        <RenderContent content={content} />
      </div>
    </section>
  )
}

function AccordionSection({
  eyebrow,
  title,
  content,
  isOpen,
  onToggle,
}: AccordionSectionProps) {
  return (
    <section
      className={`sermon-accordion-section ${
        isOpen ? 'is-open' : ''
      }`}
    >
      <button
        className="sermon-accordion-trigger"
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>
          <small>{eyebrow}</small>
          <strong>{title}</strong>
        </span>

        <ChevronDown
          className="sermon-accordion-chevron"
          size={20}
        />
      </button>

      {isOpen && (
        <div className="sermon-accordion-content">
          <div className="sermon-rich-copy">
            <RenderContent content={content} />
          </div>
        </div>
      )}
    </section>
  )
}

export default function SermonDetailPage() {
  const { id } = useParams()

  const [sermon, setSermon] = useState<Sermon | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [openSections, setOpenSections] = useState<
    Record<string, boolean>
  >({})

  useEffect(() => {
    async function loadSermon() {
      if (!id) {
        setErrorMessage('讲道地址无效。')
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('sermons')
        .select(`
          id,
          title,
          speaker,
          sermon_date,
          scripture_reference,
          scripture_references,
          summary,
          central_message,
          outline,
          key_quotes,
          tags,
          historical_background,
          literary_context,
          original_language,
          christ_centered,
          biblical_connections,
          theological_themes,
          speaker_insights,
          audio_path,
          status
        `)
        .eq('id', id)
        .eq('status', 'published')
        .maybeSingle()

      if (error) {
        console.error(error)
        setErrorMessage('讲道资料读取失败，请稍后刷新。')
        setSermon(null)
      } else if (!data) {
        setErrorMessage('没有找到这篇讲道。')
        setSermon(null)
      } else {
        setSermon(data as Sermon)
      }

      setLoading(false)
    }

    loadSermon()
  }, [id])

  const audioUrl = useMemo(() => {
    if (!sermon?.audio_path) return ''

    const { data } = supabase.storage
      .from('sermon-audio')
      .getPublicUrl(sermon.audio_path)

    return data.publicUrl
  }, [sermon?.audio_path])

  function formatDate(date: string | null) {
    if (!date) return '日期待补充'

    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(`${date}T00:00:00`))
  }

  function toggleSection(sectionName: string) {
    setOpenSections((current) => ({
      ...current,
      [sectionName]: !current[sectionName],
    }))
  }

  if (loading) {
    return (
      <section className="page-section sermon-detail-page">
        <div className="container">
          <p>正在读取讲道内容……</p>
        </div>
      </section>
    )
  }

  if (!sermon) {
    return (
      <section className="page-section sermon-detail-page">
        <div className="container">
          <Link className="sermon-back-link" to="/sermons">
            <ArrowLeft size={17} />
            返回讲道资源
          </Link>

          <div className="sermon-detail-error">
            <h1>无法打开讲道</h1>
            <p>{errorMessage}</p>
          </div>
        </div>
      </section>
    )
  }

  const displayedScripture =
    sermon.scripture_references ||
    sermon.scripture_reference ||
    '经文待补充'

  const allTags = [
    ...(sermon.tags ?? []),
    ...(sermon.theological_themes ?? []),
  ]

  const uniqueTags = Array.from(new Set(allTags))

  const studySections = [
    {
      id: 'historical-background',
      eyebrow: 'HISTORICAL BACKGROUND',
      title: '历史背景',
      content: sermon.historical_background,
    },
    {
      id: 'literary-context',
      eyebrow: 'LITERARY CONTEXT',
      title: '文学上下文',
      content: sermon.literary_context,
    },
    {
      id: 'original-language',
      eyebrow: 'ORIGINAL LANGUAGE',
      title: '原文重点',
      content: sermon.original_language,
    },
    {
      id: 'christ-centered',
      eyebrow: 'CHRIST-CENTERED READING',
      title: '基督中心',
      content: sermon.christ_centered,
    },
    {
      id: 'biblical-connections',
      eyebrow: 'BIBLICAL CONNECTIONS',
      title: '整本圣经连接',
      content: sermon.biblical_connections,
    },
    {
      id: 'speaker-insights',
      eyebrow: 'SPEAKER INSIGHTS',
      title: '讲员特色',
      content: sermon.speaker_insights,
    },
  ]

  return (
    <section className="page-section sermon-detail-page">
      <div className="container sermon-detail-container">
        <Link className="sermon-back-link" to="/sermons">
          <ArrowLeft size={17} />
          返回讲道资源
        </Link>

        <header className="sermon-detail-hero">
          <p className="sermon-detail-eyebrow">
            SCRIPTURE JOURNEY STUDY
          </p>

          <h1>{sermon.title}</h1>

          <p className="sermon-detail-speaker">
            {sermon.speaker ?? '讲员待补充'}
          </p>

          <div className="sermon-detail-meta">
            <span>
              <CalendarDays size={17} />
              {formatDate(sermon.sermon_date)}
            </span>

            <span>
              <ScrollText size={17} />
              {displayedScripture}
            </span>
          </div>
        </header>

        <section className="sermon-player-panel">
          <div className="sermon-player-heading">
            <span className="sermon-player-icon">
              <Mic2 size={20} />
            </span>

            <div>
              <p>LISTEN TO SERMON</p>
              <h2>播放讲道</h2>
            </div>
          </div>

          {audioUrl ? (
            <audio
              className="sermon-audio-player"
              controls
              preload="metadata"
              src={audioUrl}
            >
              当前浏览器不支持音频播放。
            </audio>
          ) : (
            <p className="sermon-empty-copy">
              这篇讲道尚未关联音频文件。
            </p>
          )}
        </section>

        <div className="sermon-content-grid">
          <main className="sermon-content-main">
            <ContentSection
              eyebrow="OVERVIEW"
              title="讲道摘要"
              content={sermon.summary}
            />

            <ContentSection
              eyebrow="MAIN THESIS"
              title="中心思想"
              content={sermon.central_message}
            />

            <ContentSection
              eyebrow="OUTLINE"
              title="讲道大纲"
              content={sermon.outline}
              className="sermon-outline-copy"
            />

            <ContentSection
              eyebrow="KEY INSIGHTS"
              title="要点摘要"
              content={sermon.key_quotes}
              className="sermon-quotes-copy"
            />

            <section className="sermon-study-notes">
              <div className="sermon-study-notes-heading">
                <p className="sermon-section-eyebrow">
                  STUDY NOTES
                </p>
                <h2>深入研读</h2>
                <p>
                  点击各栏目展开历史、原文、互文与基督中心分析。
                </p>
              </div>

              <div className="sermon-accordion-list">
                {studySections.map((section) => (
                  <AccordionSection
                    key={section.id}
                    eyebrow={section.eyebrow}
                    title={section.title}
                    content={section.content}
                    isOpen={Boolean(
                      openSections[section.id],
                    )}
                    onToggle={() =>
                      toggleSection(section.id)
                    }
                  />
                ))}
              </div>
            </section>
          </main>

          <aside className="sermon-detail-sidebar">
            <p className="sermon-section-eyebrow">
              DETAILS
            </p>

            <h2>讲道信息</h2>

            <dl>
              <div>
                <dt>讲员</dt>
                <dd>{sermon.speaker ?? '待补充'}</dd>
              </div>

              <div>
                <dt>日期</dt>
                <dd>{formatDate(sermon.sermon_date)}</dd>
              </div>

              <div>
                <dt>经文</dt>
                <dd>{displayedScripture}</dd>
              </div>
            </dl>

            {uniqueTags.length > 0 && (
              <div className="sermon-tag-list">
                {uniqueTags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  )
}
