import { useState } from "react"
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  UserRound,
  X,
} from "lucide-react"
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { assetUrl } from "../lib/api"
import { Avatar, buttonClass, Loading } from "./ui"

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      className={`brand ${inverse ? "brand-inverse" : ""}`}
      to="/"
      aria-label="RentBrain home"
    >
      <img src="/brand/mark-dark.jpeg" alt="" />
      <span>RentBrain</span>
    </Link>
  )
}

const mainLinks = [
  { to: "/experts", label: "Find experts", icon: Search },
  { to: "/jobs", label: "Browse jobs", icon: BriefcaseBusiness },
]

export function Layout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const close = () => setMenuOpen(false)

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <button
            className="menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
          <nav
            className={menuOpen ? "main-nav is-open" : "main-nav"}
            aria-label="Main navigation"
          >
            {mainLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={close}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <Icon size={17} aria-hidden /> {label}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink to="/dashboard" onClick={close}>
                  <LayoutDashboard size={17} /> My hub
                </NavLink>
                <NavLink to="/bookings" onClick={close}>
                  <CalendarDays size={17} /> Bookings
                </NavLink>
                <NavLink
                  className="icon-link"
                  to="/notifications"
                  onClick={close}
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                </NavLink>
                {user.role === "admin" && (
                  <NavLink className="admin-link" to="/admin" onClick={close}>
                    Admin console
                  </NavLink>
                )}
                <NavLink className="profile-link" to="/profile" onClick={close}>
                  <Avatar
                    src={assetUrl(user.avatarUrl)}
                    name={`${user.firstName} ${user.lastName}`}
                    size="small"
                  />
                  <span>{user.firstName}</span>
                </NavLink>
                <button
                  className="nav-logout"
                  onClick={() => void logout()}
                  title="Sign out"
                >
                  <LogOut size={18} />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <div className="auth-actions">
                <Link
                  className={buttonClass("ghost")}
                  to="/login"
                  state={{ from: location.pathname }}
                  onClick={close}
                >
                  Sign in
                </Link>
                <Link className={buttonClass()} to="/register" onClick={close}>
                  Join RentBrain
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Brand inverse />
            <p>All Experts. One App.</p>
          </div>
          <div>
            <h2>Marketplace</h2>
            <Link to="/experts">Find an expert</Link>
            <Link to="/jobs">Browse jobs</Link>
            <Link to="/jobs/new">Post a job</Link>
          </div>
          <div>
            <h2>Account</h2>
            <Link to="/expert/setup">Become an expert</Link>
            <Link to="/dashboard">My hub</Link>
            <Link to="/contact">Support</Link>
          </div>
          <div>
            <h2>Legal</h2>
            <Link to="/legal/terms">Terms</Link>
            <Link to="/legal/privacy">Privacy</Link>
            <Link to="/legal/cookie">Cookies</Link>
          </div>
        </div>
        <div className="container footer-bottom">
          © {new Date().getFullYear()} RentBrain. Built for trusted expertise.
        </div>
      </footer>
    </div>
  )
}

export function ProtectedRoute({ admin = false }: { admin?: boolean }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading)
    return (
      <div className="container section">
        <Loading label="Restoring your session" />
      </div>
    )
  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (admin && user.role !== "admin")
    return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export function AccountSidebar() {
  return (
    <aside className="account-sidebar">
      <NavLink to="/dashboard">
        <LayoutDashboard size={18} /> Overview
      </NavLink>
      <NavLink to="/profile">
        <UserRound size={18} /> Profile
      </NavLink>
      <NavLink to="/bookings">
        <CalendarDays size={18} /> Bookings
      </NavLink>
      <NavLink to="/jobs/manage">
        <BriefcaseBusiness size={18} /> Jobs & applications
      </NavLink>
      <NavLink to="/expert/setup">
        <span className="nav-glyph">E</span> Expert workspace
      </NavLink>
      <NavLink to="/notifications">
        <Bell size={18} /> Notifications
      </NavLink>
    </aside>
  )
}

export function AccountLayout() {
  return (
    <div className="container account-layout section">
      <AccountSidebar />
      <div className="account-content">
        <Outlet />
      </div>
    </div>
  )
}
