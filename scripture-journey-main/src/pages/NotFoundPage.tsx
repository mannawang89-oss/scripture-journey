import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="page-section">
      <div className="container empty-state">
        <h1>页面不存在</h1>
        <Link className="button button-primary" to="/">返回首页</Link>
      </div>
    </section>
  )
}
