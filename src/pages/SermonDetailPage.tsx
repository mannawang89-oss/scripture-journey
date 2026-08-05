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
        {content ? (
          content
            .split(/\n+/)
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={`${title}-${index}`}>{paragraph}</p>
            ))
        ) : (
          <p className="sermon-empty-copy">内容待整理。</p>
        )}
      </div>
    </section>
  )
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

  async function copyAiPrompt() {
    if (!sermon) return

    const prompt = `请根据我接下来上传的讲道音频或文字稿，严格依据实际内容完成 Scripture Journey Analysis。

讲道标题：${sermon.title}
讲员：${sermon.speaker ?? '未填写'}
日期：${formatDate(sermon.sermon_date)}
主要经文：${sermon.scripture_reference ?? '未填写'}

请输出以下栏目：

## 讲道摘要
300—500字，说明讲员如何解释经文、如何推进论证，以及最终结论。

## 中心思想
用一段话准确概括整篇讲道最核心的神学命题。

## 讲道大纲
按照讲道真实结构整理一级和二级标题，不要强行凑成三点式。

## 重要金句
只保留能够确认是讲员实际表达过的内容。无法确认原话时标注“意译”。

## 引用经文
列出讲道中实际引用或重点解释的经文。

## 历史背景
只补充与该段经文理解直接相关的历史处境。

## 文学上下文
说明该段经文在整章、整卷书中的位置和作用。

## 原文重点
只整理讲道实际涉及或有助于理解经文的希伯来文、希腊文重点。

## 基督中心
说明经文如何在整本圣经中指向基督与福音，避免脱离上下文。

## 整本圣经连接
列出与讲道主题直接相关的互文和交叉经文。

## 神学主题
提供3—8个主题。

## 讲员特色
只根据这篇讲道可观察到的表达与释经特点进行概括，不进行宗派猜测。

整理原则：
1. 不制造音频或文字稿中不存在的内容。
2. 区分讲员原意、经文原意和整理者概括。
3. 尊重经文上下文与第一读者处境。
4. 不加入个人回应模块。`

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

  const displayedScripture =
    sermon.scripture_references ||
    sermon.scripture_reference ||
    '经文待补充'

  const allTags = [
    ...(sermon.tags ?? []),
    ...(sermon.theological_themes ?? []),
  ]

  const uniqueTags = Array.from(new Set(allTags))

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

        <section className="sermon-ai-panel">
          <div>
            <p className="sermon-section-eyebrow">
              AI ASSISTED STUDY
            </p>

            <h2>使用 ChatGPT 整理讲道</h2>

            <p>
              复制 Scripture Journey 分析提示词，再把讲道音频、
              摘要或转写稿上传到 ChatGPT。
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
              eyebrow="KEY QUOTES"
              title="重要金句"
              content={sermon.key_quotes}
              className="sermon-quotes-copy"
            />

            <ContentSection
              eyebrow="HISTORICAL BACKGROUND"
              title="历史背景"
              content={sermon.historical_background}
            />

            <ContentSection
              eyebrow="LITERARY CONTEXT"
              title="文学上下文"
              content={sermon.literary_context}
            />

            <ContentSection
              eyebrow="ORIGINAL LANGUAGE"
              title="原文重点"
              content={sermon.original_language}
            />

            <ContentSection
              eyebrow="CHRIST-CENTERED READING"
              title="基督中心"
              content={sermon.christ_centered}
            />

            <ContentSection
              eyebrow="BIBLICAL CONNECTIONS"
              title="整本圣经连接"
              content={sermon.biblical_connections}
            />

            <ContentSection
              eyebrow="SPEAKER INSIGHTS"
              title="讲员特色"
              content={sermon.speaker_insights}
            />
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
