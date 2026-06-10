import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { X, Copy, Check, Users, TrendingUp, Zap, Star } from 'lucide-react'

export default function ReferralPopup({ session, onClose }) {
  const [copied, setCopied]         = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [stats, setStats]           = useState({ referrals:0, earned:0, pending:0 })
  const [animStep, setAnimStep]     = useState(0)
  const canvasRef = useRef(null)
  const animRef   = useRef(null)

  const referralLink = `https://aitrademaster.netlify.app?ref=${referralCode}`

  useEffect(() => {
    fetchReferralData()
    setTimeout(() => setAnimStep(1), 100)
    setTimeout(() => setAnimStep(2), 350)
    setTimeout(() => setAnimStep(3), 600)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || animStep < 1) return
    const ctx = canvas.getContext('2d')
    canvas.width  = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.5 ? '#c9a227' : '#b0b8c1',
      pulse: Math.random() * Math.PI * 2,
    }))
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.pulse += 0.02
        const a = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.floor(a*255).toString(16).padStart(2,'0')
        ctx.fill()
        p.x += p.dx; p.y += p.dy
        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
      })
      animRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animRef.current)
  }, [animStep])

  const fetchReferralData = async () => {
    const { data: user } = await supabase.from('users').select('referral_code').eq('id', session.user.id).single()
    if (user?.referral_code) {
      setReferralCode(user.referral_code)
    } else {
      const code = session.user.email.split('@')[0].slice(0,6).toUpperCase() +
        Math.random().toString(36).slice(2,5).toUpperCase()
      await supabase.from('users').upsert({ id: session.user.id, email: session.user.email, referral_code: code })
      setReferralCode(code)
    }
    const { data: refs } = await supabase.from('referrals').select('*').eq('referrer_id', session.user.id)
    if (refs) {
      const earned  = refs.reduce((a,r) => a + (r.commission_kes||0), 0)
      const pending = refs.filter(r => !r.paid).reduce((a,r) => a + (r.commission_kes||0), 0)
      setStats({ referrals: refs.length, earned, pending })
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(
      `🐺 Jiunge Bulls & Wolves — Kenya's #1 AI Trading Platform!\n\n` +
      `💰 AI inafanya trade kwa niaba yako 24/7\n` +
      `📊 Crypto, Forex & Prediction Markets\n` +
      `💸 Deposit & withdraw via M-Pesa\n\n` +
      `Jiunge kupitia link yangu:\n${referralLink}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(0,0,0,0.8)',
      backdropFilter:'blur(6px)',
      padding:'16px',
      animation:'fadeIn 0.25s ease',
    }}>
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes shimmer { 0%{background-position:-300px 0} 100%{background-position:300px 0} }
        @keyframes glow    { 0%,100%{box-shadow:0 0 16px rgba(201,162,39,0.25)} 50%{box-shadow:0 0 32px rgba(201,162,39,0.5)} }
      `}</style>

      <div style={{
        width:'100%', maxWidth:420,
        maxHeight:'90vh',
        overflowY:'auto',
        background:'linear-gradient(145deg,#110f12,#0d0b0e)',
        border:'1px solid rgba(201,162,39,0.2)',
        borderRadius:20,
        position:'relative',
        animation:'slideUp 0.4s cubic-bezier(0.34,1.4,0.64,1) forwards',
      }}>
        <canvas ref={canvasRef} style={{
          position:'absolute', inset:0, width:'100%', height:'100%',
          borderRadius:20, opacity:0.35, pointerEvents:'none',
        }}/>

        {/* Close button — big and obvious */}
        <button onClick={onClose} style={{
          position:'sticky', top:12,
          float:'right', marginRight:12,
          zIndex:10,
          background:'rgba(255,255,255,0.1)',
          border:'1px solid rgba(255,255,255,0.15)',
          color:'#fff', cursor:'pointer',
          width:34, height:34, borderRadius:'50%',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all 0.2s', flexShrink:0,
        }}>
          <X size={16} />
        </button>

        <div style={{ position:'relative', zIndex:1, padding:'24px 22px 22px' }}>
          {/* Title */}
          <div style={{ textAlign:'center', marginBottom:18 }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🎁</div>
            <h2 style={{
              fontFamily:'"Cinzel",serif', fontSize:'clamp(18px,5vw,22px)',
              fontWeight:900, marginBottom:6,
              background:'linear-gradient(90deg,#c9a227,#f0d060,#c9a227)',
              backgroundSize:'300px 100%',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              animation:'shimmer 3s linear infinite',
            }}>Earn Forever</h2>
            <p style={{ color:'#8a7d5a', fontSize:13, lineHeight:1.5 }}>
              Invite friends & earn <strong style={{color:'#c9a227'}}>10% commission</strong> on every trade they make. <strong style={{color:'#f0d060'}}>For life.</strong>
            </p>
          </div>

          {/* Stats */}
          {animStep >= 2 && (
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {[
                { icon:<Users size={14}/>,      val:stats.referrals,                   label:'Invited',  color:'#4f8ef7' },
                { icon:<TrendingUp size={14}/>,  val:`KSh ${stats.earned.toLocaleString()}`, label:'Earned',   color:'#c9a227' },
                { icon:<Zap size={14}/>,         val:`KSh ${stats.pending.toLocaleString()}`,label:'Pending',  color:'#f0c14b' },
              ].map((s,i) => (
                <div key={i} style={{
                  flex:1, background:'rgba(255,255,255,0.04)',
                  border:'1px solid rgba(255,255,255,0.07)',
                  borderRadius:10, padding:'10px 6px', textAlign:'center',
                }}>
                  <div style={{color:s.color, marginBottom:3}}>{s.icon}</div>
                  <div style={{fontFamily:'"JetBrains Mono",monospace', fontWeight:700, fontSize:13, color:s.color}}>{s.val}</div>
                  <div style={{fontSize:9, color:'#4a4358', textTransform:'uppercase', letterSpacing:0.8}}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* How it works */}
          {animStep >= 3 && (
            <div style={{
              background:'rgba(201,162,39,0.06)',
              border:'1px solid rgba(201,162,39,0.15)',
              borderRadius:10, padding:'12px 14px', marginBottom:14,
            }}>
              <div style={{fontSize:10, fontWeight:700, color:'#c9a227', textTransform:'uppercase', letterSpacing:1, marginBottom:8}}>
                ⚡ How it works
              </div>
              {[
                { n:'1', t:'Share your link below', c:'#4f8ef7' },
                { n:'2', t:'Friend signs up & deposits via M-Pesa', c:'#f0c14b' },
                { n:'3', t:'You earn 10% of every trade they make', c:'#c9a227' },
                { n:'4', t:'Paid to wallet automatically. Forever! 🔥', c:'#e84060' },
              ].map(item => (
                <div key={item.n} style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
                  <div style={{
                    width:20, height:20, borderRadius:'50%', flexShrink:0,
                    background:item.c+'22', border:`1px solid ${item.c}44`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:10, fontWeight:800, color:item.c,
                  }}>{item.n}</div>
                  <span style={{fontSize:12, color:'#8a7d5a'}}>{item.t}</span>
                </div>
              ))}
            </div>
          )}

          {/* Referral link */}
          {animStep >= 3 && (
            <>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10, color:'#4a4358', textTransform:'uppercase', letterSpacing:0.8, marginBottom:5}}>Your Referral Link</div>
                <div style={{
                  display:'flex', gap:7, alignItems:'center',
                  background:'rgba(255,255,255,0.04)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:9, padding:'9px 12px',
                }}>
                  <span style={{flex:1, fontSize:11, color:'#8a7d5a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                    {referralLink}
                  </span>
                  <button onClick={copyLink} style={{
                    background: copied ? '#c9a227' : 'rgba(201,162,39,0.12)',
                    border:`1px solid ${copied?'#c9a227':'rgba(201,162,39,0.25)'}`,
                    color: copied ? '#09080a' : '#c9a227',
                    borderRadius:6, padding:'5px 10px', cursor:'pointer',
                    fontSize:11, fontWeight:700,
                    display:'flex', alignItems:'center', gap:4,
                    transition:'all 0.2s', flexShrink:0,
                  }}>
                    {copied ? <><Check size={11}/> Copied!</> : <><Copy size={11}/> Copy</>}
                  </button>
                </div>
              </div>

              <div style={{textAlign:'center', marginBottom:12}}>
                <span style={{fontSize:11, color:'#4a4358'}}>Your code: </span>
                <span style={{fontFamily:'"Cinzel",serif', fontWeight:900, fontSize:16, color:'#c9a227', letterSpacing:2}}>
                  {referralCode}
                </span>
                <Star size={12} style={{color:'#f0c14b', marginLeft:5, verticalAlign:'middle'}}/>
              </div>

              <div style={{display:'flex', gap:8}}>
                <button onClick={shareWhatsApp} style={{
                  flex:2, padding:'12px',
                  background:'linear-gradient(135deg,#25D366,#128C7E)',
                  border:'none', borderRadius:10, color:'#fff',
                  fontSize:13, fontWeight:700, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  animation:'glow 2s ease-in-out infinite',
                }}>
                  📱 Share on WhatsApp
                </button>
                <button onClick={copyLink} style={{
                  flex:1, padding:'12px',
                  background:'rgba(201,162,39,0.08)',
                  border:'1px solid rgba(201,162,39,0.25)',
                  borderRadius:10, color:'#c9a227',
                  fontSize:12, fontWeight:700, cursor:'pointer',
                }}>
                  Copy
                </button>
              </div>

              <button onClick={onClose} style={{
                width:'100%', marginTop:10, padding:'8px',
                background:'transparent', border:'none',
                color:'#4a4358', fontSize:12, cursor:'pointer',
              }}>
                Maybe later
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
