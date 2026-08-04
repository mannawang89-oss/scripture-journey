import {
  ArrowLeft,
  CalendarDays,
  Copy,
  ExternalLink,
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
  summary: string | null
  central_message: string | null
  outline: string | null
  key_quotes: string | null
  tags: string[] | null
  audio_path: string | null
  status: string | null
}

export default function SermonDetailPage() {
  const { id } = useParams()

  const [sermon, setSermon] = useState<Sermon | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [copyMessage, setCopyMessage] = useState('')

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
          summary,
          central_message,
          outline,
          key_quotes,
          tags,
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

  function renderParagraphs(content: string | null) {
    if (!content) {
      return <p className="sermon-empty-copy">内容待整理。</p>
    }

    return content
      .split(/\n+/)
      .filter(Boolean)
      .map((paragraph, index) => (
        <p key={`${paragraph}-${index}`}>{paragraph}</p>
      ))
  }

  async function copyAiPrompt() {
    if (!sermon) return

    const prompt = `请根据我接下来上传的讲道音频，整理以下内容。

讲道标题：${sermon.title}
讲员：${sermon.speaker ?? '未填写'}
日期：${formatDate(sermon.sermon_date)}
主要经文：${sermon.scripture_reference ?? '未填写'}

请严格根据讲道实际内容整理，不要自行补充讲员没有表达的观点。

请按以下格式输出：

## 讲道摘要
用300—500字概括讲道的论证过程、经文解释和主要结论。

## 中心思想
用一段话准确概括整篇讲道最核心的神学命题。

## 讲道大纲
按照讲道真实结构整理一级和二级标题，不要强行凑成三点式。

## 重要金句
只摘录讲员实际说过、具有代表性的表达。
无法确认原话时请标注“意译”，不要伪造直接引语。

## 引用经文
列出讲道中实际引用或重点解释的经文。

## 主题标签
提供3—8个标签。

整理原则：
1. 尊重经文上下文和第一读者处境。
2. 区分讲员原意、经文原意和整理者概括。
3. 不把应用凌驾于基督和福音之上。
4. 不制造音频中不存在的内容。
5. 不加入“个人回应”模块。`

    try {
      await navigator.clipboard.writeText(prompt)
      setCopyMessage('整理提示词已复制')
      window.setTimeout(() => setCopyMessage(''), 2500)
    } catch (error) {
      console.error(error)
      setCopyMessage('复制失败，请重试')
    }
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

  return (
    <section className="page-section sermon-detail-page">
      <div className="container sermon-detail-container">
        <Link className="sermon-back-link" to="/sermons">
          <ArrowLeft size={17} />
          返回讲道资源
        </Link>

        <header className="sermon-detail-hero">
          <p className="sermon-detail-eyebrow">
            SERMON ARCHIVE
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
              {sermon.scripture_reference ?? '经文待补充'}
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

        <section className="sermon-ai-panel">
          <div>
            <p className="sermon-section-eyebrow">
              AI ASSISTED STUDY
            </p>

            <h2>使用 ChatGPT 整理讲道</h2>

            <p>
              复制已经包含标题、讲员、日期、经文和整理标准的提示词，
              再把讲道音频上传到 ChatGPT。
            </p>

            {copyMessage && (
              <p className="sermon-copy-message">
                {copyMessage}
              </p>
            )}
          </div>

          <div className="sermon-ai-actions">
            <button type="button" onClick={copyAiPrompt}>
              <Copy size={17} />
              复制整理提示词
            </button>

            <a
              href="https://chatgpt.com/"
              target="_blank"
              rel="noreferrer"
            >
              打开 ChatGPT
              <ExternalLink size={16} />
            </a>
          </div>
        </section>

        <div className="sermon-content-grid">
          <main className="sermon-content-main">
            <section className="sermon-content-section">
              <p className="sermon-section-eyebrow">
                OVERVIEW
              </p>

              <h2>讲道摘要</h2>

              <div className="sermon-rich-copy">
                {renderParagraphs(sermon.summary)}
              </div>
            </section>

            <section className="sermon-content-section">
              <p className="sermon-section-eyebrow">
                MAIN THESIS
              </p>

              <h2>中心思想</h2>

              <div className="sermon-rich-copy">
                {renderParagraphs(sermon.central_message)}
              </div>
            </section>

            <section className="sermon-content-section">
              <p className="sermon-section-eyebrow">
                OUTLINE
              </p>

              <h2>讲道大纲</h2>

              <div className="sermon-rich-copy sermon-outline-copy">
                {renderParagraphs(sermon.outline)}
              </div>
            </section>

            <section className="sermon-content-section">
              <p className="sermon-section-eyebrow">
                KEY QUOTES
              </p>

              <h2>重要金句</h2>

              <div className="sermon-rich-copy sermon-quotes-copy">
                {renderParagraphs(sermon.key_quotes)}
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
                <dd>
                  {sermon.scripture_reference ?? '待补充'}
                </dd>
              </div>
            </dl>

            {sermon.tags && sermon.tags.length > 0 && (
              <div className="sermon-tag-list">
                {sermon.tags.map((tag) => (
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
