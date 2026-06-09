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
    <div style={{
      minHeight: '100vh',
      background: '#080806',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: '"DM Sans", sans-serif',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes logoGlow {
          0%,100% { filter: drop-shadow(0 0 20px rgba(201,162,39,0.4)) drop-shadow(0 0 60px rgba(201,162,39,0.1)) }
          50%      { filter: drop-shadow(0 0 35px rgba(201,162,39,0.7)) drop-shadow(0 0 80px rgba(201,162,39,0.25)) }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes shimmer {
          0%   { background-position:-400px 0 }
          100% { background-position:400px 0 }
        }
        .login-card-input:focus { border-color:#c9a227 !important; outline:none; }
        .login-card-input::placeholder { color:#4a3f28; }
        .submit-btn:hover { background:linear-gradient(135deg,#b8911f,#d4b840) !important; transform:translateY(-1px); }
        .submit-btn:active { transform:translateY(0); }
        .switch-btn:hover { border-color:rgba(201,162,39,0.5) !important; color:rgba(201,162,39,0.9) !important; }
      `}</style>

      {/* ── LOGO (always visible on all screens) ── */}
      <div style={{ textAlign:'center', marginBottom:28, animation:'fadeUp 0.7s ease forwards' }}>
        <img
          src="/logo.png"
          alt="Bulls & Wolves"
          style={{
            width: Math.min(160, window.innerWidth * 0.42),
            height: 'auto',
            animation: 'logoGlow 3s ease-in-out infinite',
            marginBottom: 14,
          }}
          onError={e => { e.target.style.display = 'none' }}
        />
        <div style={{
          fontFamily: '"Cinzel",serif',
          fontSize: 'clamp(18px,5vw,26px)',
          fontWeight: 900,
          letterSpacing: 3,
          background: 'linear-gradient(135deg,#c9a227,#f0d060,#c9a227)',
          backgroundSize: '400px 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'shimmer 4s linear infinite',
          marginBottom: 4,
        }}>
          BULLS & WOLVES
        </div>
        <div style={{
          fontFamily: '"Cinzel",serif',
          fontSize: 9,
          letterSpacing: '3px',
          color: '#8a7d5a',
          textTransform: 'uppercase',
        }}>
          AI Trading · Smarter Predictions · Higher Edge
        </div>
      </div>

      {/* ── LOGIN CARD ── */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#0f0e0a',
        border: '1px solid #2a2518',
        borderRadius: 16,
        padding: '28px 24px',
        animation: 'fadeUp 0.7s ease 0.2s both',
      }}>
        <h2 style={{
          fontFamily: '"Cinzel",serif',
          fontSize: 18, fontWeight: 900,
          letterSpacing: 1, marginBottom: 4,
          color: '#c9a227',
        }}>
          {mode === 'login' ? 'Welcome Back 🐺' : 'Join The Pack 🐂'}
        </h2>
        <p style={{ color:'#8a7d5a', fontSize:13, marginBottom:22 }}>
          {mode === 'login' ? 'Sign in to your account' : 'Create your free account'}
        </p>

        {error && (
          <div style={{ background:'rgba(255,75,110,0.1)', border:'1px solid rgba(255,75,110,0.3)', color:'#ff4b6e', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background:'rgba(201,162,39,0.1)', border:'1px solid rgba(201,162,39,0.3)', color:'#c9a227', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>
            {success}
          </div>
        )}

        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#8a7d5a', marginBottom:6, textTransform:'uppercase', letterSpacing:0.8 }}>
            Email Address
          </label>
          <input
            className="login-card-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{ width:'100%', padding:'11px 14px', background:'#161410', border:'1px solid #2a2518', borderRadius:8, color:'#f0ead6', fontSize:14, transition:'border-color 0.15s', boxSizing:'border-box' }}
          />
        </div>

        <div style={{ marginBottom:22 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#8a7d5a', marginBottom:6, textTransform:'uppercase', letterSpacing:0.8 }}>
            Password
          </label>
          <input
            className="login-card-input"
            type="password"
            placeholder="Min 6 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{ width:'100%', padding:'11px 14px', background:'#161410', border:'1px solid #2a2518', borderRadius:8, color:'#f0ead6', fontSize:14, transition:'border-color 0.15s', boxSizing:'border-box' }}
          />
        </div>

        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width:'100%', padding:'13px',
            background:'linear-gradient(135deg,#c9a227,#f0d060)',
            border:'none', borderRadius:9,
            color:'#080806', fontSize:14, fontWeight:700,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition:'all 0.15s',
            opacity: loading ? 0.7 : 1,
            fontFamily:'"DM Sans",sans-serif',
            letterSpacing:0.5,
          }}>
          {loading ? 'Please wait...' : mode === 'login' ? '🐺 Sign In' : '🐂 Create Account'}
        </button>

        <div style={{ textAlign:'center', color:'#4a3f28', fontSize:12, margin:'16px 0', position:'relative' }}>
          <div style={{ position:'absolute', top:'50%', left:0, right:0, height:1, background:'#2a2518' }} />
          <span style={{ background:'#0f0e0a', padding:'0 12px', position:'relative' }}>or</span>
        </div>

        <button
          className="switch-btn"
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
          style={{
            width:'100%', padding:'11px',
            background:'transparent',
            border:'1px solid #2a2518',
            borderRadius:9, color:'#8a7d5a',
            fontSize:13, fontWeight:600,
            cursor:'pointer', transition:'all 0.15s',
            fontFamily:'"DM Sans",sans-serif',
          }}>
          {mode === 'login' ? "Don't have an account? Join the Pack" : 'Already a member? Sign In'}
        </button>
      </div>

      {/* Features row */}
      <div style={{
        display:'flex', gap:12, flexWrap:'wrap',
        justifyContent:'center', marginTop:24,
        maxWidth:420,
        animation:'fadeUp 0.7s ease 0.4s both',
      }}>
        {[
          { icon:'⚡', text:'AI Trading Bot' },
          { icon:'🎯', text:'Predictions' },
          { icon:'📱', text:'M-Pesa' },
          { icon:'👥', text:'10% Referral' },
        ].map((f,i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'7px 12px',
            background:'rgba(201,162,39,0.05)',
            border:'1px solid rgba(201,162,39,0.1)',
            borderRadius:20,
            fontSize:12, color:'#8a7d5a',
          }}>
            <span>{f.icon}</span> {f.text}
          </div>
        ))}
      </div>
    </div>
  )
}
