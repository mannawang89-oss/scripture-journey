import { BookOpen, Menu, Mic2, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: '首页' },
  { to: '/bible', label: '圣经' },
  { to: '/sermons', label: '讲道' },
]

export default function Layout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <NavLink to="/" className="brand" onClick={() => setOpen(false)}>
            <span className="brand-mark"><BookOpen size={19} /></span>
            <span>
              <strong>Scripture Journey</strong>
              <small>Digital Seminary</small>
            </span>
          </NavLink>

          <nav className="desktop-nav" aria-label="主导航">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.to === '/'}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <button className="menu-button" onClick={() => setOpen((value) => !value)} aria-label="打开导航">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <nav className="mobile-nav" aria-label="移动端导航">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={() => setOpen(false)}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <strong>Scripture Journey</strong>
          </div>
          <div className="footer-icon"><Mic2 size={18} /></div>
        </div>
      </footer>
    </div>
  )
}
