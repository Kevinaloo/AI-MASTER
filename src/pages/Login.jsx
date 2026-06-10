import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Zap, TrendingUp, Shield, Users, ArrowRight } from 'lucide-react'

const FEATURES = [
  { icon: <Zap size={17} color="var(--gold-bright)" />,      title:'AI Trading Bot',       sub:'Crypto & Forex — automated 24/7' },
  { icon: <TrendingUp size={17} color="var(--gold-bright)" />,title:'Smart Predictions',    sub:'Kenyan market intelligence' },
  { icon: <Shield size={17} color="var(--gold-bright)" />,   title:'M-Pesa Integrated',    sub:'Deposit & withdraw instantly' },
  { icon: <Users size={17} color="var(--gold-bright)" />,    title:'10% Lifetime Referral',sub:'Earn from everyone you invite' },
]

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [mode, setMode]         = useState('login')

  const handleSubmit = async () => {
    setLoading(true); setError(''); setSuccess('')
    if (!email || !password) { setError('Please fill in all fields'); setLoading(false); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); setLoading(false); return }
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
        if (data.session) window.location.href = '/'
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
        if (error) throw error
        if (data.user) { setSuccess('Account created! Sign in below.'); setMode('login') }
      }
    } catch (err) { setError(err.message || 'Something went wrong.') }
    setLoading(false)
  }

  return (
    <div className="login-page">

      {/* ── LEFT PANEL ── */}
      <div className="login-left">
        <div className="login-brand">
          <img src="/logo.png" alt="Bulls & Wolves" className="login-brand-logo"
            onError={e => e.target.style.display='none'} />
          <div className="login-brand-name">BULLS & WOLVES</div>
          <div className="login-brand-tag">AI Trading · Smarter Predictions · Higher Edge</div>
        </div>

        <div className="login-features">
          {FEATURES.map((f,i) => (
            <div className="login-feature" key={i}>
              <div className="login-feature-icon">{f.icon}</div>
              <div className="login-feature-text">
                <strong>{f.title}</strong>
                <span>{f.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="login-right">
        <div className="login-form">
          <div className="login-form-title">
            {mode === 'login' ? 'Welcome Back 🐺' : 'Join The Pack 🐂'}
          </div>
          <div className="login-form-sub">
            {mode === 'login' ? 'Sign in to your Bulls & Wolves account' : 'Create your free account today'}
          </div>

          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleSubmit()} />
          </div>

          <div className="form-group" style={{ marginBottom:24 }}>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Minimum 6 characters"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleSubmit()} />
          </div>

          <button className="btn btn-primary btn-lg"
            style={{ width:'100%', marginBottom:4 }}
            onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            {!loading && <ArrowRight size={15} />}
          </button>

          <div className="login-divider"><span>or</span></div>

          <button className="btn btn-outline"
            style={{ width:'100%' }}
            onClick={() => { setMode(mode==='login'?'signup':'login'); setError(''); setSuccess('') }}>
            {mode === 'login' ? "Don't have an account? Join the Pack" : 'Already a member? Sign In'}
          </button>

          <p style={{ textAlign:'center', fontSize:11, color:'var(--text-muted)', marginTop:20, lineHeight:1.6 }}>
            By signing up you agree to our Terms of Service.<br/>
            Your funds are protected by our AI risk management system.
          </p>
        </div>
      </div>
    </div>
  )
}
