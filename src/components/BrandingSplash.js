import React, { useEffect, useRef, useState } from 'react'

const VIDEO_URL = "https://xuhodkbusnprpwtkazmc.supabase.co/storage/v1/object/public/Loading-video.mp4/Loading-video.mp4"

export default function BrandingSplash({ onComplete }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const [fallback, setFallback] = useState(false)
  const [phase, setPhase]       = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Autoplay muted — works on ALL browsers/phones
    video.muted   = true
    video.autoplay = true
    video.playsInline = true

    video.play().catch(() => {
      // If autoplay still fails, show animated fallback
      triggerFallback()
    })

    video.onended = () => onComplete && onComplete()
    video.onerror = () => triggerFallback()
  }, [])

  const triggerFallback = () => {
    setFallback(true)
    setTimeout(() => setPhase(1), 100)
    setTimeout(() => setPhase(2), 500)
    setTimeout(() => setPhase(3), 900)
    setTimeout(() => onComplete && onComplete(), 3500)
  }

  // Fallback particles
  useEffect(() => {
    if (!fallback || phase < 1) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.6 + 0.1,
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
        ctx.fillStyle = p.color + Math.floor(a * 255).toString(16).padStart(2,'0')
        ctx.fill()
        p.x += p.dx; p.y += p.dy
        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
      })
      animRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animRef.current)
  }, [fallback, phase])

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'#000' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&display=swap');
        @keyframes logoIn  { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
        @keyframes titleIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes loadBar { from{width:0%} to{width:100%} }
      `}</style>

      {/* ── AUTOPLAY MUTED VIDEO ── */}
      {!fallback && (
        <video
          ref={videoRef}
          src={VIDEO_URL}
          muted
          autoPlay
          playsInline
          style={{
            position:'absolute', inset:0,
            width:'100%', height:'100%',
            objectFit:'cover',
          }}
        />
      )}

      {/* ── ANIMATED FALLBACK ── */}
      {fallback && (
        <>
          <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.5 }} />
          <div style={{ position:'relative', zIndex:1, textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh' }}>
            {phase >= 1 && (
              <img src="/logo.png" alt="Bulls & Wolves" style={{
                width: Math.min(200, window.innerWidth * 0.5), marginBottom:24,
                animation:'logoIn 0.8s cubic-bezier(0.34,1.4,0.64,1) forwards',
                filter:'drop-shadow(0 0 40px rgba(201,162,39,0.5))',
              }} />
            )}
            {phase >= 2 && (
              <div style={{
                fontFamily:'"Cinzel",serif', fontSize:'clamp(20px,5vw,42px)',
                fontWeight:900, letterSpacing:4, marginBottom:8,
                background:'linear-gradient(135deg,#c9a227,#f0d060,#c9a227)',
                backgroundSize:'400px 100%',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                animation:'titleIn 0.7s ease forwards, shimmer 3s linear infinite 0.7s',
              }}>BULLS & WOLVES</div>
            )}
            {phase >= 3 && (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ height:1, width:120, background:'linear-gradient(90deg,transparent,#c9a227)' }} />
                  <div style={{ width:4, height:4, background:'#c9a227', borderRadius:'50%' }} />
                  <div style={{ height:1, width:120, background:'linear-gradient(90deg,#c9a227,transparent)' }} />
                </div>
                <div style={{ fontFamily:'"Cinzel",serif', fontSize:10, letterSpacing:'3px', color:'#b0b8c1', textTransform:'uppercase', marginBottom:36 }}>
                  AI Trading · Smarter Predictions · Higher Edge
                </div>
                <div style={{ width:160 }}>
                  <div style={{ height:2, background:'rgba(255,255,255,0.08)', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'linear-gradient(90deg,#c9a227,#f0d060)', borderRadius:99, animation:'loadBar 2s ease forwards' }} />
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Skip — always visible */}
      <button
        onClick={() => onComplete && onComplete()}
        style={{
          position:'absolute', bottom:28, right:20, zIndex:10,
          background:'rgba(0,0,0,0.5)',
          border:'1px solid rgba(201,162,39,0.4)',
          color:'rgba(201,162,39,0.9)', borderRadius:8,
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
