import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard, TrendingUp, Zap,
  Target, Wallet, LogOut, Bell,
  Settings, ChevronRight
} from 'lucide-react'

const NAV = [
  { to: '/',            label: 'Dashboard',   icon: LayoutDashboard, end: true },
  { to: '/signals',     label: 'AI Signals',  icon: Zap,             badge: 'LIVE' },
  { to: '/trades',      label: 'My Trades',   icon: TrendingUp },
  { to: '/predictions', label: 'Predictions', icon: Target },
  { to: '/wallet',      label: 'Wallet',      icon: Wallet },
]

const TICKER = [
  { sym:'BTC/USDT', px:'67,432', chg:'+2.4%', up:true },
  { sym:'ETH/USDT', px:'3,521',  chg:'+1.8%', up:true },
  { sym:'EUR/USD',  px:'1.0842', chg:'-0.3%', up:false },
  { sym:'USD/KES',  px:'129.45', chg:'-0.2%', up:false },
  { sym:'XAU/USD',  px:'2,341',  chg:'+0.9%', up:true },
  { sym:'BNB/USDT', px:'412.30', chg:'+3.1%', up:true },
  { sym:'SOL/USDT', px:'178.90', chg:'+4.2%', up:true },
  { sym:'GBP/USD',  px:'1.2651', chg:'+0.5%', up:true },
]

export default function Layout({ session }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const email     = session?.user?.email || ''
  const initials  = email.slice(0,2).toUpperCase()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const currentPage = NAV.find(n => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))

  return (
    <div className="layout">

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-logo">
          <div className="sidebar-brand-icon">
            <img src="/logo.png" alt="Bulls & Wolves"
              onError={e => { e.target.parentElement.style.background='var(--gold-glow)'; e.target.style.display='none' }} />
          </div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">BULLS & WOLVES</div>
            <div className="sidebar-brand-sub">AI Trading</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
          <div className="nav-section-label">Main Menu</div>
          {NAV.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={15} />
              {label}
              {badge && <span className="nav-badge">{badge}</span>}
            </NavLink>
          ))}

          <div className="sidebar-divider" style={{ margin:'12px 18px' }} />
          <div className="nav-section-label">Account</div>

          <button className="nav-item" style={{ width:'100%', border:'none', background:'none', cursor:'pointer', textAlign:'left' }}
            onClick={() => {}}>
            <Bell size={15} />
            Notifications
          </button>
          <button className="nav-item" style={{ width:'100%', border:'none', background:'none', cursor:'pointer', textAlign:'left' }}
            onClick={() => {}}>
            <Settings size={15} />
            Settings
          </button>
        </div>

        {/* User */}
        <div className="sidebar-bottom">
          <div className="user-card" onClick={handleLogout} title="Click to logout">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{email}</div>
              <div className="user-role">🐺 Pack Member</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-content">

        {/* Top bar */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">
              {currentPage?.label || 'Dashboard'}
            </div>
            <ChevronRight size={13} style={{ color:'var(--text-muted)' }} />
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-KE', { weekday:'short', month:'short', day:'numeric' })}
            </span>
          </div>
          <div className="topbar-right">
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px',
              background:'var(--bg-raised)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-sm)', fontSize:11, color:'var(--text-muted)' }}>
              <span className="live-dot" />
              Markets Open
            </div>
            <button className="btn-icon btn-ghost">
              <Bell size={15} />
            </button>
          </div>
        </div>

        {/* Ticker */}
        <div className="ticker-bar">
          <div className="ticker-inner">
            {[...TICKER,...TICKER,...TICKER].map((t,i) => (
              <div className="ticker-item" key={i}>
                <span className="ticker-sym">{t.sym}</span>
                <span className="ticker-px">{t.px}</span>
                <span className={`ticker-chg ${t.up?'up':'down'}`}>{t.chg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Page content */}
        <div className="page-body">
          <Outlet />
        </div>
      </main>

      {/* ── MOBILE NAV ── */}
      <nav className="mobile-nav">
        <div className="mobile-nav-items">
          {NAV.map(({ to, label, icon: Icon, end }) => {
            const active = end ? location.pathname === to : location.pathname.startsWith(to)
            return (
              <button key={to} className={`mobile-nav-item ${active?'active':''}`}
                onClick={() => navigate(to)}>
                <Icon size={18} />
                {label.split(' ')[0]}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
