import React, { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard, TrendingUp, Zap,
  Target, Wallet, LogOut, Bell,
  Menu, X, ChevronRight
} from 'lucide-react'

const NAV = [
  { to:'/',            label:'Dashboard',   icon:LayoutDashboard, end:true },
  { to:'/signals',     label:'AI Signals',  icon:Zap,             badge:'LIVE' },
  { to:'/trades',      label:'My Trades',   icon:TrendingUp },
  { to:'/predictions', label:'Predictions', icon:Target },
  { to:'/wallet',      label:'Wallet',      icon:Wallet },
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
  const navigate      = useNavigate()
  const location      = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const email    = session?.user?.email || ''
  const initials = email.slice(0,2).toUpperCase()

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  // Close sidebar on outside click
  useEffect(() => {
    if (!sidebarOpen) return
    const handler = (e) => {
      if (!e.target.closest('.sidebar') && !e.target.closest('.menu-btn')) {
        setSidebarOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [sidebarOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const currentPage = NAV.find(n =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
  )

  return (
    <div className="layout">
      <style>{`
        @media (max-width: 900px) {
          .sidebar { transform: translateX(-240px) !important; }
          .sidebar.open { transform: translateX(0) !important; }
          .sidebar-overlay { display: block !important; }
        }
        .sidebar-overlay {
          display: none;
          position: fixed; inset: 0; z-index: 199;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(2px);
        }
      `}</style>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-logo">
          <div className="sidebar-brand-icon">
            <img src="/logo.png" alt="Bulls & Wolves"
              onError={e => {
                e.target.parentElement.style.background = 'var(--gold-glow)'
                e.target.style.display = 'none'
              }} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="sidebar-brand-name">BULLS & WOLVES</div>
            <div className="sidebar-brand-sub">AI Trading</div>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              display:'none', background:'none', border:'none',
              color:'var(--text-muted)', cursor:'pointer', padding:4,
              borderRadius:6, flexShrink:0,
            }}
            className="sidebar-close-btn">
            <X size={16}/>
          </button>
        </div>

        {/* Nav links */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'8px 0' }}>
          <div className="nav-section-label">Main Menu</div>
          {NAV.map(({ to, label, icon:Icon, end, badge }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={15} />
              {label}
              {badge && <span className="nav-badge">{badge}</span>}
            </NavLink>
          ))}

          <div className="sidebar-divider" style={{ margin:'12px 18px' }}/>
          <div className="nav-section-label">Account</div>

          <button className="nav-item" onClick={() => {}}>
            <Bell size={15}/> Notifications
          </button>
        </div>

        {/* User card */}
        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{email}</div>
              <div className="user-role">🐺 Pack Member</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={14}/>
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-content">

        {/* Topbar */}
        <div className="topbar">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Hamburger — mobile only */}
            <button
              className="menu-btn"
              onClick={() => setSidebarOpen(s => !s)}
              style={{
                display:'none',
                background:'none', border:'1px solid var(--border)',
                color:'var(--text-secondary)', cursor:'pointer',
                padding:'6px 8px', borderRadius:8,
                alignItems:'center', justifyContent:'center',
              }}>
              <Menu size={17}/>
            </button>

            <div className="topbar-title">{currentPage?.label || 'Dashboard'}</div>
            <ChevronRight size={13} style={{ color:'var(--text-muted)', flexShrink:0 }}/>
            <span style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
              {new Date().toLocaleDateString('en-KE',{weekday:'short',month:'short',day:'numeric'})}
            </span>
          </div>

          <div className="topbar-right">
            <div style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'5px 10px',
              background:'var(--bg-raised)', border:'1px solid var(--border)',
              borderRadius:6, fontSize:11, color:'var(--text-muted)',
              whiteSpace:'nowrap',
            }}>
              <span className="live-dot"/>
              Markets Live
            </div>
            <button className="btn-icon btn-ghost">
              <Bell size={15}/>
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
          <Outlet/>
        </div>
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="mobile-nav">
        <div className="mobile-nav-items">
          {NAV.map(({ to, label, icon:Icon, end }) => {
            const active = end
              ? location.pathname === to
              : location.pathname.startsWith(to)
            return (
              <button key={to}
                className={`mobile-nav-item ${active?'active':''}`}
                onClick={() => navigate(to)}>
                <Icon size={18}/>
                {label.split(' ')[0]}
              </button>
            )
          })}
        </div>
      </nav>

      {/* CSS to show hamburger + sidebar close on mobile */}
      <style>{`
        @media (max-width: 900px) {
          .menu-btn { display: flex !important; }
          .sidebar-close-btn { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
