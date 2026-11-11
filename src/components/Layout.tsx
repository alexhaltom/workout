import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useStore } from '../store'
import { ThemeToggle } from './ThemeToggle'

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="nav__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function Layout() {
  const { activeSession } = useStore()

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          SET<span className="brand__dot">.</span>
        </NavLink>
        <div className="topbar__end">
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end>
              <NavIcon>
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 9.5V21h14V9.5" />
              </NavIcon>
              Home
            </NavLink>
            <NavLink to="/routines">
              <NavIcon>
                <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
              </NavIcon>
              Routines
            </NavLink>
            <NavLink to="/coach">
              <NavIcon>
                <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9Z" />
                <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z" />
              </NavIcon>
              Coach
            </NavLink>
            <NavLink to="/stats">
              <NavIcon>
                <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
              </NavIcon>
              Stats
            </NavLink>
            {activeSession && (
              <NavLink to="/workout" className="nav__live">
                <NavIcon>
                  <circle cx="12" cy="13" r="8" />
                  <path d="M12 9v4l2.5 2.5M10 2h4" />
                </NavIcon>
                <span className="nav__live-dot" aria-hidden />
                Live
              </NavLink>
            )}
          </nav>
          <ThemeToggle />
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
