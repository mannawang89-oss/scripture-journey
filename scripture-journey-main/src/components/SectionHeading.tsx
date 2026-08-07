type Props = {
  eyebrow?: string
  title: string
  description?: string
}

export default function SectionHeading({ eyebrow, title, description }: Props) {
  return (
    <div className="section-heading">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  )
}
