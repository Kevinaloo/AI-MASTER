import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard, TrendingUp, Zap,
  Target, Wallet, LogOut
} from 'lucide-react'

export default function Layout({ session }) {
  const navigate = useNavigate()
  const email = session?.user?.email || ''
  const initials = email.slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">A</div>
          <span>AkiliTrade</span>
        </div>

        <nav>
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink to="/signals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Zap size={16} /> AI Signals
          </NavLink>
          <NavLink to="/trades" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <TrendingUp size={16} /> My Trades
          </NavLink>
          <NavLink to="/predictions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Target size={16} /> Predictions
          </NavLink>
          <NavLink to="/wallet" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Wallet size={16} /> Wallet
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-pill">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{email}</div>
              <div className="user-role">Trader</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
