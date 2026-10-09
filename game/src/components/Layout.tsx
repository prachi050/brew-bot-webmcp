import { Link, NavLink, Outlet } from 'react-router-dom'

const LINKS = [
  { to: '/play', label: 'Play', icon: '🎮' },
  { to: '/help', label: 'Help', icon: '❓' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
  { to: '/about', label: 'About', icon: 'ℹ️' },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-base-200 text-base-content">
      <header className="navbar bg-base-100 shadow-sm px-2 sm:px-4 gap-2">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl gap-1 px-2">
            <span aria-hidden>🦠</span> Germ Buster
          </Link>
        </div>
        <nav aria-label="Main">
          <ul className="menu menu-horizontal gap-1 px-0">
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) => (isActive ? 'menu-active' : '')}
                  title={l.label}
                >
                  <span aria-hidden>{l.icon}</span>
                  <span className="hidden sm:inline">{l.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="footer footer-center p-4 text-sm text-base-content/60">
        Made with React, TypeScript and daisyUI.
      </footer>
    </div>
  )
}
