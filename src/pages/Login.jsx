import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, Zap, Shield, Users } from 'lucide-react'

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
        if (data.user) { setSuccess('Account created! You can now sign in.'); setMode('login') }
      }
    } catch (err) { setError(err.message || 'Something went wrong. Try again.') }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <img src="/logo.png" alt="Bulls & Wolves" />
          <h1>BULLS & WOLVES</h1>
          <p>AI Trading · Smarter Predictions · Higher Edge</p>
        </div>
        <div className="login-features">
          {[
            { icon: <Zap size={17} color="var(--accent)" />, title: 'AI Trading Bot', sub: 'Crypto & Forex — automated 24/7' },
            { icon: <TrendingUp size={17} color="var(--accent)" />, title: 'Smart Predictions', sub: 'Kenyan market intelligence' },
            { icon: <Shield size={17} color="var(--accent)" />, title: 'M-Pesa Integrated', sub: 'Deposit & withdraw instantly' },
            { icon: <Users size={17} color="var(--accent)" />, title: 'Pack Referral Program', sub: '10% lifetime commission' },
          ].map((f, i) => (
            <div className="login-feature" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-text"><strong>{f.title}</strong><span>{f.sub}</span></div>
            </div>
          ))}
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-wrap">
          <h2>{mode === 'login' ? 'Welcome Back 🐺' : 'Join The Pack 🐂'}</h2>
          <p>{mode === 'login' ? 'Sign in to Bulls & Wolves' : 'Create your free account today'}</p>

          {error   && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min 6 characters"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          <button className="btn btn-primary"
            style={{ width:'100%', justifyContent:'center', padding:'13px', fontSize:14 }}
            onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? '🐺 Sign In' : '🐂 Create Account'}
          </button>

          <div className="login-divider"><span>or</span></div>

          <button className="btn btn-outline"
            style={{ width:'100%', justifyContent:'center' }}
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}>
            {mode === 'login' ? "Don't have an account? Join the Pack" : 'Already a member? Sign In'}
          </button>
        </div>
      </div>
    </div>
  )
}
