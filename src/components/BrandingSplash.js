import React, { useEffect, useRef, useState } from 'react'

const VIDEO_URL = "https://xuhodkbusnprpwtkazmc.supabase.co/storage/v1/object/public/Loading-video.mp4/Loading-video.mp4"

export default function BrandingSplash({ onComplete }) {
  const videoRef = useRef(null)
  const animRef  = useRef(null)
  const canvasRef = useRef(null)
  // stages: 'video' → 'logo' → 'done'
  const [stage, setStage] = useState('video')
  const [logoAnim, setLogoAnim] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.autoplay = true
    video.playsInline = true
    video.play().catch(() => showLogo())
    video.onended = () => showLogo()
    video.onerror = () => showLogo()
  }, [])

  const showLogo = () => {
    setStage('logo')
    // Trigger animation slightly after mount
    setTimeout(() => setLogoAnim(true), 50)
    // After logo display (3.5s), go to login
    setTimeout(() => {
      setStage('done')
      onComplete && onComplete()
    }, 3500)
  }

  // Particle canvas during logo stage
  useEffect(() => {
    if (stage !== 'logo') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const particles = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3 + 0.5,
      dx: (Math.random() - 0.5) * 0.6,
      dy: (Math.random() - 0.5) * 0.6,
      opacity: Math.random() * 0.7 + 0.1,
      color: Math.random() > 0.5 ? '#c9a227' : '#b0b8c1',
      pulse: Math.random() * Math.PI * 2,
    }))

    // Shooting stars
    const stars = Array.from({ length: 5 }, () => ({
      x: 0, y: 0, len: 0, speed: 0, opacity: 0,
      active: false, timer: Math.random() * 80 + 20,
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Radial gold glow
      const grd = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height) * 0.7
      )
      grd.addColorStop(0, 'rgba(201,162,39,0.1)')
      grd.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Particles
      particles.forEach(p => {
        p.pulse += 0.025
        const a = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.floor(a * 255).toString(16).padStart(2,'0')
        ctx.fill()
        p.x += p.dx; p.y += p.dy
        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
      })

      // Shooting stars
      stars.forEach(s => {
        s.timer--
        if (s.timer <= 0 && !s.active) {
          s.active = true; s.opacity = 1
          s.x = Math.random() * canvas.width
          s.y = Math.random() * canvas.height * 0.5
          s.len = Math.random() * 140 + 60
          s.speed = Math.random() * 5 + 3
        }
        if (s.active) {
          const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.len, s.y + s.len * 0.3)
          grad.addColorStop(0, `rgba(201,162,39,${s.opacity})`)
          grad.addColorStop(1, 'rgba(201,162,39,0)')
          ctx.beginPath()
          ctx.moveTo(s.x, s.y)
          ctx.lineTo(s.x - s.len, s.y + s.len * 0.3)
          ctx.strokeStyle = grad
          ctx.lineWidth = 2
          ctx.stroke()
          s.x += s.speed; s.y += s.speed * 0.3
          s.opacity -= 0.012
          if (s.opacity <= 0) { s.active = false; s.timer = Math.random() * 120 + 40 }
        }
      })

      animRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animRef.current)
  }, [stage])

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'#000' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&display=swap');

        @keyframes logoBurst {
          0%   { opacity:0; transform:scale(0.3); filter:brightness(3) blur(8px) }
          40%  { opacity:1; transform:scale(1.12); filter:brightness(1.6) blur(0px) }
          65%  { transform:scale(0.95) }
          80%  { transform:scale(1.04) }
          100% { transform:scale(1); filter:brightness(1) }
        }
        @keyframes titleSlam {
          0%   { opacity:0; transform:translateY(40px) scaleX(0.7); letter-spacing:-4px }
          60%  { opacity:1; transform:translateY(-4px) scaleX(1.02); letter-spacing:6px }
          100% { transform:translateY(0) scaleX(1); letter-spacing:4px }
        }
        @keyframes tagFade {
          0%   { opacity:0; transform:translateY(10px) }
          100% { opacity:1; transform:translateY(0) }
        }
        @keyframes divExpand {
          0%   { width:0; opacity:0 }
          100% { width:160px; opacity:1 }
        }
        @keyframes shimmer {
          0%   { background-position:-500px 0 }
          100% { background-position:500px 0 }
        }
        @keyframes goldPulse {
          0%,100% { filter: drop-shadow(0 0 30px rgba(201,162,39,0.5)) drop-shadow(0 0 80px rgba(201,162,39,0.2)) }
          50%      { filter: drop-shadow(0 0 60px rgba(201,162,39,0.9)) drop-shadow(0 0 120px rgba(201,162,39,0.4)) }
        }
        @keyframes ringPulse {
          0%   { transform:scale(0.8); opacity:0.8 }
          100% { transform:scale(2.5); opacity:0 }
        }
        .logo-burst  { animation: logoBurst 1s cubic-bezier(0.34,1.3,0.64,1) forwards, goldPulse 2s ease-in-out infinite 1s }
        .title-slam  { animation: titleSlam 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s both }
        .tag-fade    { animation: tagFade 0.6s ease 1.1s both }
        .div-left    { animation: divExpand 0.8s ease 0.9s both }
        .div-right   { animation: divExpand 0.8s ease 0.9s both }
      `}</style>

      {/* ── VIDEO STAGE ── */}
      {stage === 'video' && (
        <video
          ref={videoRef}
          src={VIDEO_URL}
          muted autoPlay playsInline
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
        />
      )}

      {/* ── LOGO STAGE ── */}
      {stage === 'logo' && (
        <>
          {/* Particle background */}
          <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} />

          {/* Shockwave rings */}
          {logoAnim && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              {[0, 0.3, 0.6].map((delay, i) => (
                <div key={i} style={{
                  position:'absolute',
                  width: Math.min(window.innerWidth, window.innerHeight) * 0.7,
                  height: Math.min(window.innerWidth, window.innerHeight) * 0.7,
                  borderRadius:'50%',
                  border:'2px solid rgba(201,162,39,0.4)',
                  animation:`ringPulse 1.5s ease-out ${delay}s forwards`,
                }} />
              ))}
            </div>
          )}

          {/* Logo + text centered */}
          <div style={{
            position:'relative', zIndex:1,
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            height:'100vh', textAlign:'center',
            padding:'0 24px',
          }}>
            {/* BIG logo */}
            {logoAnim && (
              <img
                src="/logo.png"
                alt="Bulls & Wolves"
                className="logo-burst"
                style={{
                  width: Math.min(window.innerWidth * 0.78, 340),
                  height: 'auto',
                  marginBottom: 28,
                }}
                onError={e => e.target.style.display='none'}
              />
            )}

            {/* Brand name */}
            <div className="title-slam" style={{
              fontFamily:'"Cinzel",serif',
              fontSize:'clamp(24px,7vw,52px)',
              fontWeight:900,
              letterSpacing:4,
              marginBottom:10,
              background:'linear-gradient(135deg,#c9a227 0%,#f5e070 35%,#c9a227 55%,#e8c84a 75%,#9a7a1a 100%)',
              backgroundSize:'500px 100%',
              WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent',
              animation:'titleSlam 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s both, shimmer 3s linear infinite 1.5s',
            }}>
              BULLS & WOLVES
            </div>

            {/* Dividers */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:10 }}>
              <div className="div-left" style={{ height:1, background:'linear-gradient(90deg,transparent,#c9a227)' }} />
              <div style={{ width:5, height:5, background:'#c9a227', borderRadius:'50%', opacity:0.9 }} />
              <div className="div-right" style={{ height:1, background:'linear-gradient(90deg,#c9a227,transparent)' }} />
            </div>

            {/* Tagline */}
            <div className="tag-fade" style={{
              fontFamily:'"Cinzel",serif',
              fontSize:'clamp(9px,2.2vw,13px)',
              letterSpacing:'4px',
              color:'#b0b8c1',
              textTransform:'uppercase',
            }}>
              AI Trading · Smarter Predictions · Higher Edge
            </div>
          </div>
        </>
      )}

      {/* Skip — always visible */}
      <button
        onClick={() => onComplete && onComplete()}
        style={{
          position:'absolute', bottom:28, right:20, zIndex:10,
          background:'rgba(0,0,0,0.6)',
          border:'1px solid rgba(201,162,39,0.35)',
          color:'rgba(201,162,39,0.8)', borderRadius:8,
          padding:'9px 20px', fontSize:11, letterSpacing:2,
          fontFamily:'"Cinzel",serif', cursor:'pointer',
          textTransform:'uppercase',
        }}
      >
        SKIP ›
      </button>
    </div>
  )
}
