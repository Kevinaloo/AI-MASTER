import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, Zap, Shield, Users } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mode, setMode] = useState('login')

  // Clear any auth errors from URL on mount
  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('error')) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    if (!email || !password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://aitrademaster.netlify.app'
        }
      })
      if (error) {
        setError(error.message)
      } else if (data?.user?.identities?.length === 0) {
        setError('Email already registered. Please sign in instead.')
      } else {
        setSuccess('Account created! You can now sign in directly.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="logo-mark">A</div>
          <h1>AkiliTrade</h1>
          <p>Akili ya Kenya, Faida ya Kweli</p>
        </div>
        <div className="login-features">
          <div className="login-feature">
            <div className="feature-icon"><Zap size={18} color="var(--accent)" /></div>
            <div className="feature-text">
              <strong>AI Trading Bot</strong>
              <span>Crypto & Forex automated 24/7</span>
            </div>
          </div>
          <div className="login-feature">
            <div className="feature-icon"><TrendingUp size={18} color="var(--accent)" /></div>
            <div className="feature-text">
              <strong>Smart Predictions</strong>
              <span>Kenyan market intelligence</span>
            </div>
          </div>
          <div className="login-feature">
            <div className="feature-icon"><Shield size={18} color="var(--accent)" /></div>
            <div className="feature-text">
              <strong>M-Pesa Integrated</strong>
              <span>Deposit & withdraw instantly</span>
            </div>
          </div>
          <div className="login-feature">
            <div className="feature-icon"><Users size={18} color="var(--accent)" /></div>
            <div className="feature-text">
              <strong>Chama Pools</strong>
              <span>Trade together, win together</span>
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-wrap">
          <h2>{mode === 'login' ? 'Karibu Tena 👋' : 'Jiunge Sasa 🚀'}</h2>
          <p>{mode === 'login' ? 'Sign in to your AkiliTrade account' : 'Create your free AkiliTrade account'}</p>

          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <div className="login-divider"><span>or</span></div>

          <button
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
          >
            {mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  )
}
