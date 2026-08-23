import { CalendarDays, Mic2, Play, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import SectionHeading from '../components/SectionHeading'
import { supabase } from '../lib/supabase'

type Sermon = {
  id: string
  title: string
  speaker: string | null
  sermon_date: string | null
  scripture_reference: string | null
  summary: string | null
  audio_path: string | null
  status: string | null
}

export default function SermonsPage() {
  const [sermons, setSermons] = useState<Sermon[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function loadSermons() {
      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('sermons')
        .select(
          'id, title, speaker, sermon_date, scripture_reference, summary, audio_path, status',
        )
        .eq('status', 'published')
        .order('sermon_date', { ascending: false })

      if (error) {
        console.error(error)
        setErrorMessage('讲道资料读取失败，请稍后刷新页面。')
        setSermons([])
      } else {
        setSermons((data ?? []) as Sermon[])
      }

      setLoading(false)
    }

    loadSermons()
  }, [])

  const filteredSermons = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    if (!normalized) return sermons

    return sermons.filter((sermon) => {
      return [
        sermon.title,
        sermon.speaker,
        sermon.scripture_reference,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalized),
        )
    })
  }, [query, sermons])

  function formatDate(date: string | null) {
    if (!date) return '日期待补充'

    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(`${date}T00:00:00`))
  }

  return (
    <section className="sermons-library-page">
      <div className="sermons-library-hero">
        <div className="container">
          <div className="sermons-library-heading">
            <SectionHeading
              eyebrow="SERMON ARCHIVE"
              title="讲道资源"
            />

            <label className="sermon-search">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标题、讲员或经文"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="container sermons-library-content">
        {loading ? (
          <div className="sermons-status-card">
            <p>正在读取讲道资料……</p>
          </div>
        ) : errorMessage ? (
          <div className="sermons-status-card">
            <p>{errorMessage}</p>
          </div>
        ) : filteredSermons.length === 0 ? (
          <div className="sermons-status-card">
            <div className="sermons-status-icon">
              <Mic2 size={28} />
            </div>
            <h3>没有找到讲道</h3>
            <p>请尝试更换搜索关键词。</p>
          </div>
        ) : (
          <div className="sermon-card-grid">
            {filteredSermons.map((sermon) => (
              <article className="sermon-card" key={sermon.id}>
                <div className="sermon-card-top">
                  <span className="sermon-card-eyebrow">
                    SERMON
                  </span>

                  <div className="sermon-card-play-icon">
                    <Play size={18} fill="currentColor" />
                  </div>
                </div>

                <div className="sermon-card-body">
                  <h2>{sermon.title}</h2>

                  <p className="sermon-card-speaker">
                    {sermon.speaker ?? '讲员待补充'}
                  </p>

                  <div className="sermon-card-meta">
                    <span>
                      <CalendarDays size={15} />
                      {formatDate(sermon.sermon_date)}
                    </span>

                    <span>
                      <Mic2 size={15} />
                      {sermon.scripture_reference ??
                        '经文待补充'}
                    </span>
                  </div>

                  {sermon.summary && (
                    <p className="sermon-card-summary line-clamp-2">
                      {sermon.summary}
                    </p>
                  )}
                </div>

                <div className="sermon-card-footer">
                  <Link
                    to={`/sermons/${sermon.id}`}
                    className="sermon-detail-button"
                  >
                    打开详情
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
