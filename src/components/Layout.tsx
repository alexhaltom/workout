import { NavLink, Outlet } from 'react-router-dom'
import { useStore } from '../store'

export function Layout() {
  const { activeSession } = useStore()

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          SET<span className="brand__dot">.</span>
        </NavLink>
        <nav className="nav">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/routines">Routines</NavLink>
          <NavLink to="/stats">Stats</NavLink>
          {activeSession && (
            <NavLink to="/workout" className="nav__live">
              Live
            </NavLink>
          )}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
