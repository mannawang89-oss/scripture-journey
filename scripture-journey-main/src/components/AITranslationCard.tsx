import { ChevronDown } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import './AITranslationCard.css'

export type AITranslationMode =
  | 'literal'
  | 'natural'
  | 'hebrew'
  | 'first_reader'

type TranslationContent = Record<AITranslationMode, string>

type AITranslationCardProps = {
  reference: string
  content?: Partial<TranslationContent>
}

const modes: Array<{
  id: AITranslationMode
  label: string
}> = [
  { id: 'literal', label: '直译' },
  { id: 'natural', label: '意译' },
  { id: 'hebrew', label: '希伯来表达' },
  { id: 'first_reader', label: '第一读者理解' },
]

const defaultContent: TranslationContent = {
  literal: '起初，上帝创造了天地。',
  natural: '在一切开始的时候，上帝创造了整个宇宙。',
  hebrew:
    '“天地”是希伯来人的整体表达，指向整个受造界，而不只是天空和土地两个部分。',
  first_reader:
    '对刚离开埃及的以色列人而言，这节经文首先宣告：太阳、月亮、海洋和万物都不是神；耶和华才是创造一切、唯一配得敬拜的主。',
}

export default function AITranslationCard({
  reference,
  content,
}: AITranslationCardProps) {
  const [mode, setMode] = useState<AITranslationMode>(() => {
    const savedMode = window.localStorage.getItem(
      'scripture-journey-ai-translation-mode',
    )

    return modes.some((item) => item.id === savedMode)
      ? (savedMode as AITranslationMode)
      : 'literal'
  })
  const [open, setOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)

  const mergedContent = useMemo(
    () => ({
      ...defaultContent,
      ...content,
    }),
    [content],
  )

  const currentMode = modes.find((item) => item.id === mode)!

  useEffect(() => {
    window.localStorage.setItem(
      'scripture-journey-ai-translation-mode',
      mode,
    )
  }, [mode])

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (
        cardRef.current &&
        !cardRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
    }
  }, [])

  return (
    <section className="ai-translation-card" ref={cardRef}>
      <div className="ai-translation-heading">
        <div>
          <p>AI TRANSLATION</p>
          <span>{reference}</span>
        </div>

        <div className="ai-translation-selector">
          <button
            type="button"
            className="ai-translation-trigger"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            AI译文（{currentMode.label}）
            <ChevronDown
              size={17}
              className={open ? 'is-open' : ''}
            />
          </button>

          {open && (
            <div className="ai-translation-menu">
              {modes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={mode === item.id ? 'active' : ''}
                  onClick={() => {
                    setMode(item.id)
                    setOpen(false)
                  }}
                >
                  <span>{item.label}</span>
                  {mode === item.id && <strong>✓</strong>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="ai-translation-copy">
        {mergedContent[mode]
          .split(/\n+/)
          .filter(Boolean)
          .map((paragraph, index) => (
            <p key={`${mode}-${index}`}>{paragraph}</p>
          ))}
      </div>

      <p className="ai-translation-note">
        AI生成内容仅供研经辅助，不代表正式圣经译本。
      </p>
    </section>
  )
}
