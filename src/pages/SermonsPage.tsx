import { Mic2, Plus, Upload } from 'lucide-react'
import SectionHeading from '../components/SectionHeading'

export default function SermonsPage() {
  return (
    <section className="page-section">
      <div className="container">
        <div className="page-heading-row">
          <SectionHeading
            eyebrow="SERMONS"
            title="讲道资源"
            description="保存音频、总结、中心思想、大纲、经文与个人回应。"
          />
          <button className="button button-primary">
            <Plus size={17} /> 新建讲道
          </button>
        </div>

        <div className="empty-state">
          <div className="empty-icon"><Mic2 size={27} /></div>
          <h3>这里还没有讲道</h3>
          <p>下一步接通 Supabase 后，你上传的录音和讲道资料会永久保存在这里。</p>
          <button className="button button-secondary">
            <Upload size={17} /> 上传第一篇讲道
          </button>
        </div>
      </div>
    </section>
  )
}
