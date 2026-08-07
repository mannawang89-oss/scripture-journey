import { useParams } from 'react-router-dom'

export default function SermonDetailPage() {
  const { id } = useParams()

  return (
    <section className="page-section">
      <div className="container">
        <h1>讲道详情</h1>

        <p>讲道 ID：</p>

        <pre>{id}</pre>

        <p>下一步我们会在这里加载：</p>

        <ul>
          <li>🎧 音频播放器</li>
          <li>📖 经文</li>
          <li>📝 摘要</li>
          <li>💡 中心思想</li>
          <li>📋 大纲</li>
          <li>❤️ 个人回应</li>
        </ul>
      </div>
    </section>
  )
}
