import { useParams } from 'react-router-dom'

export default function SermonDetailPage() {
  const { id } = useParams()

  return (
    <section className="page-section">
      <div className="container">
        <h1>讲道详情</h1>
        <p>讲道 ID：</p>
        <pre>{id}</pre>
      </div>
    </section>
  )
}
