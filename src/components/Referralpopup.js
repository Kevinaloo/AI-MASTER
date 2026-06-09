import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { X, Copy, Check, Gift, Users, TrendingUp, Zap, Star } from 'lucide-react'

const COMMISSION_RATE = 10 // 10% lifetime commission

export default function ReferralPopup({ session, onClose }) {
  const [copied, setCopied] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [stats, setStats] = useState({ referrals: 0, earned: 0, pending: 0 })
  const [animStep, setAnimStep] = useState(0)
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  const referralLink = `https://aitrademaster.netlify.app?ref=${referralCode}`

  useEffect(() => {
    fetchReferralData()
    // Stagger animations
    setTimeout(() => setAnimStep(1), 100)
    setTimeout(() => setAnimStep(2), 400)
    setTimeout(() => setAnimStep(3), 700)
    setTimeout(() => setAnimStep(4), 1000)
  }, [])

  // Particle canvas animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * 0.6,
      dy: (Math.random() - 0.5) * 0.6,
      opacity: Math.random() * 0.5 + 0.1,
      color: ['#00e5a0', '#4d9fff', '#ffc044', '#ff4b6e'][Math.floor(Math.random() * 4)]
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0')
        ctx.fill()
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
      })
      animRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const fetchReferralData = async () => {
    // Get or create user referral code
    const { data: user } = await supabase
      .from('users')
      .select('referral_code')
      .eq('id', session.user.id)
      .single()

    if (user?.referral_code) {
      setReferralCode(user.referral_code)
    } else {
      // Create user record if not exists
      const code = session.user.email.split('@')[0].slice(0, 6).toUpperCase() +
        Math.random().toString(36).slice(2, 5).toUpperCase()
      await supabase.from('users').upsert({
        id: session.user.id,
        email: session.user.email,
        referral_code: code
      })
      setReferralCode(code)
    }

    // Get referral stats
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', session.user.id)

    if (referrals) {
      const earned = referrals.reduce((a, r) => a + (r.commission_kes || 0), 0)
      const pending = referrals.filter(r => !r.paid).reduce((a, r) => a + (r.commission_kes || 0), 0)
      setStats({ referrals: referrals.length, earned, pending })
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(
      `🚀 Jiunge AkiliTrade - Kenya's #1 AI Trading Platform!\n\n` +
      `💰 AI inafanya trade kwa niaba yako 24/7\n` +
      `📊 Crypto, Forex & Prediction Markets\n` +
      `💸 Deposit & withdraw via M-Pesa\n\n` +
      `Jiunge kupitia link yangu upate bonus:\n${referralLink}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.3s ease'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.95) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.05) } }
        @keyframes shimmer { 0% { background-position: -200% center } 100% { background-position: 200% center } }
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @keyframes countUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 20px rgba(0,229,160,0.3) } 50% { box-shadow: 0 0 40px rgba(0,229,160,0.6), 0 0 80px rgba(0,229,160,0.2) } }
        .ref-card { animation: slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards }
        .ref-icon { animation: float 3s ease-in-out infinite }
        .copy-btn:hover { transform: scale(1.02) }
        .wa-btn:hover { transform: scale(1.02) }
        .stat-item { animation: countUp 0.5s ease forwards }
        .glow-btn { animation: glow 2s ease-in-out infinite }
        .shimmer-text {
          background: linear-gradient(90deg, #00e5a0, #4d9fff, #ffc044, #00e5a0);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      <div className="ref-card" style={{
        width: '100%', maxWidth: 480,
        background: 'linear-gradient(145deg, #0e1419 0%, #0a1628 50%, #0e1a14 100%)',
        border: '1px solid rgba(0,229,160,0.2)',
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        margin: '16px'
      }}>
        {/* Particle canvas background */}
        <canvas ref={canvasRef} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          opacity: 0.4, pointerEvents: 'none'
        }} />

        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, zIndex: 10,
          background: 'rgba(255,255,255,0.08)', border: 'none',
          color: 'var(--text2)', cursor: 'pointer',
          width: 32, height: 32, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s'
        }}>
          <X size={16} />
        </button>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '32px 28px 28px' }}>

          {/* Icon + Title */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="ref-icon" style={{
              width: 72, height: 72, margin: '0 auto 16px',
              background: 'linear-gradient(135deg, rgba(0,229,160,0.2), rgba(77,159,255,0.2))',
              border: '2px solid rgba(0,229,160,0.4)',
              borderRadius: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32
            }}>
              🎁
            </div>

            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26, fontWeight: 800,
              marginBottom: 6, letterSpacing: -0.5
            }}>
              <span className="shimmer-text">Earn Forever</span>
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.5 }}>
              Invite friends to AkiliTrade and earn{' '}
              <strong style={{ color: 'var(--accent)' }}>{COMMISSION_RATE}% commission</strong>{' '}
              every time they stake or trade. <strong style={{ color: 'var(--yellow)' }}>For life.</strong>
            </p>
          </div>

          {/* Stats row */}
          {animStep >= 2 && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {[
                { icon: <Users size={16} />, value: stats.referrals, label: 'Invited', color: 'var(--blue)' },
                { icon: <TrendingUp size={16} />, value: `KSh ${stats.earned.toLocaleString()}`, label: 'Earned', color: 'var(--accent)' },
                { icon: <Zap size={16} />, value: `KSh ${stats.pending.toLocaleString()}`, label: 'Pending', color: 'var(--yellow)' },
              ].map((s, i) => (
                <div key={i} className="stat-item" style={{
                  flex: 1, background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '12px 8px', textAlign: 'center',
                  animationDelay: `${i * 0.1}s`
                }}>
                  <div style={{ color: s.color, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* How it works */}
          {animStep >= 3 && (
            <div style={{
              background: 'rgba(0,229,160,0.06)',
              border: '1px solid rgba(0,229,160,0.15)',
              borderRadius: 12, padding: '14px 16px', marginBottom: 20
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                ⚡ How it works
              </div>
              {[
                { step: '1', text: 'Share your unique link below', color: 'var(--blue)' },
                { step: '2', text: 'Friend signs up and deposits via M-Pesa', color: 'var(--yellow)' },
                { step: '3', text: `You earn ${COMMISSION_RATE}% of every trade/stake they make`, color: 'var(--accent)' },
                { step: '4', text: 'Paid to your wallet automatically. Forever! 🔥', color: 'var(--red)' },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: item.color + '22',
                    border: `1px solid ${item.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: item.color, flexShrink: 0
                  }}>{item.step}</div>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>{item.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Referral link */}
          {animStep >= 4 && (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                  Your Referral Link
                </div>
                <div style={{
                  display: 'flex', gap: 8, alignItems: 'center',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '10px 14px'
                }}>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {referralLink}
                  </span>
                  <button className="copy-btn" onClick={copyLink} style={{
                    background: copied ? 'var(--accent)' : 'rgba(0,229,160,0.15)',
                    border: `1px solid ${copied ? 'var(--accent)' : 'rgba(0,229,160,0.3)'}`,
                    color: copied ? 'var(--bg)' : 'var(--accent)',
                    borderRadius: 7, padding: '5px 12px', cursor: 'pointer',
                    fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.2s', flexShrink: 0
                  }}>
                    {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                  </button>
                </div>
              </div>

              {/* Your code badge */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: 'var(--text2)' }}>Your code: </span>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: 18, color: 'var(--accent)', letterSpacing: 2
                }}>{referralCode}</span>
                <Star size={14} style={{ color: 'var(--yellow)', marginLeft: 6, verticalAlign: 'middle' }} />
              </div>

              {/* Share buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="wa-btn glow-btn" onClick={shareWhatsApp} style={{
                  flex: 2, padding: '13px',
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  border: 'none', borderRadius: 12, color: '#fff',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'transform 0.15s'
                }}>
                  📱 Share on WhatsApp
                </button>
                <button onClick={copyLink} style={{
                  flex: 1, padding: '13px',
                  background: 'rgba(0,229,160,0.1)',
                  border: '1px solid rgba(0,229,160,0.3)',
                  borderRadius: 12, color: 'var(--accent)',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  transition: 'transform 0.15s'
                }}>
                  <Copy size={14} /> Copy Link
                </button>
              </div>

              <button onClick={onClose} style={{
                width: '100%', marginTop: 12, padding: '10px',
                background: 'transparent', border: 'none',
                color: 'var(--text3)', fontSize: 12, cursor: 'pointer'
              }}>
                Maybe later — go to dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
