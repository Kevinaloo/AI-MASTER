import React, { useEffect, useState, useRef } from 'react'

const VIDEO_URL = "https://drive.google.com/uc?export=download&id=1U_VYC56ibzUIkE3MifIBi2XTYJPs80_I"
const EMBED_URL = "https://drive.google.com/file/d/1U_VYC56ibzUIkE3MifIBi2XTYJPs80_I/preview"

export default function BrandingSplash({ onComplete }) {
  const videoRef  = useRef(null)
  const iframeRef = useRef(null)
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const [mode, setMode]   = useState('video')  // 'video' | 'iframe' | 'fallback'
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    // Try direct video first
    const video = videoRef.current
    if (!video) return

    video.onloadeddata = () => {
      video.play().catch(() => switchToIframe())
    }
    video.onerror = () => switchToIframe()

    // Safety timeout — if nothing works in 5s, show fallback
    const timeout = setTimeout(() => {
      if (mode === 'video') switchToIframe()
    }, 5000)

    return () => clearTimeout(timeout)
  }, [])

  const switchToIframe = () => {
    setMode('iframe')
    // Iframe plays for ~duration of video then completes
    // We use a timeout matching typical intro video length (8 seconds)
    setTimeout(() => onComplete && onComplete(), 8000)
  }

  const startFallback = () => {
    setMode('fallback')
    setTimeout(() => setPhase(1), 100)
    setTimeout(() => setPhase(2), 500)
    setTimeout(() => setPhase(3), 900)
    setTimeout(() => setPhase(4), 2500)
    setTimeout(() => onComplete && onComplete(), 3500)
  }

  // Fallback particle canvas
  useEffect(() => {
    if (mode !== 'fallback' || phase < 1) return
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
      const grd = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, 500
      )
      grd.addColorStop(0, 'rgba(201,162,39,0.06)')
      grd.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        p.pulse += 0.02
        const alpha = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0')
        ctx.fill()
        p.x += p.dx; p.y += p.dy
        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
      })
      animRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animRef.current)
  }, [mode, phase])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&display=swap');
        @keyframes logoIn  { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
        @keyframes titleIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tagIn   { from{opacity:0} to{opacity:1} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes loadBar { from{width:0%} to{width:100%} }
      `}</style>

      {/* ── MODE 1: Direct video ── */}
      {mode === 'video' && (
        <video
          ref={videoRef}
          src={VIDEO_URL}
          muted
          playsInline
          autoPlay
          onEnded={() => onComplete && onComplete()}
          onError={() => switchToIframe()}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
        />
      )}

      {/* ── MODE 2: Google Drive iframe embed ── */}
      {mode === 'iframe' && (
        <iframe
          ref={iframeRef}
          src={EMBED_URL}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            border: 'none',
          }}
          allow="autoplay"
          allowFullScreen
        />
      )}

      {/* ── MODE 3: Animated fallback ── */}
      {mode === 'fallback' && (
        <>
          <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.5 }} />
          <div style={{ position:'relative', zIndex:1, textAlign:'center' }}>
            {phase >= 1 && (
              <img src="/logo.png" alt="Bulls & Wolves" style={{
                width: Math.min(220, window.innerWidth * 0.5),
                marginBottom: 28,
                animation: 'logoIn 0.8s cubic-bezier(0.34,1.4,0.64,1) forwards',
                filter: 'drop-shadow(0 0 40px rgba(201,162,39,0.5))',
              }} />
            )}
            {phase >= 2 && (
              <div style={{
                fontFamily: '"Cinzel",serif',
                fontSize: 'clamp(22px,5vw,44px)',
                fontWeight: 900, letterSpacing: 4, marginBottom: 8,
                background: 'linear-gradient(135deg,#c9a227,#f0d060,#c9a227)',
                backgroundSize: '400px 100%',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                animation: 'titleIn 0.7s ease forwards, shimmer 3s linear infinite 0.7s',
              }}>BULLS & WOLVES</div>
            )}
            {phase >= 3 && (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:10 }}>
                  <div style={{ height:1, width:140, background:'linear-gradient(90deg,transparent,#c9a227)' }} />
                  <div style={{ width:4, height:4, background:'#c9a227', borderRadius:'50%' }} />
                  <div style={{ height:1, width:140, background:'linear-gradient(90deg,#c9a227,transparent)' }} />
                </div>
                <div style={{
                  fontFamily: '"Cinzel",serif', fontSize:'clamp(8px,1.5vw,11px)',
                  letterSpacing:'3px', color:'#b0b8c1',
                  textTransform:'uppercase', marginBottom:40,
                }}>
                  AI Trading · Smarter Predictions · Higher Edge
                </div>
                <div style={{ width:180, margin:'0 auto' }}>
                  <div style={{ height:2, background:'rgba(255,255,255,0.08)', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'linear-gradient(90deg,#c9a227,#f0d060)', borderRadius:99, animation:'loadBar 2s ease forwards' }} />
                  </div>
                  <div style={{ marginTop:10, fontFamily:'"Cinzel",serif', fontSize:9, letterSpacing:3, color:'rgba(201,162,39,0.5)' }}>LOADING</div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Skip button — always visible */}
      <button
        onClick={() => onComplete && onComplete()}
        style={{
          position:'absolute', bottom:28, right:28,
          background:'rgba(201,162,39,0.1)',
          border:'1px solid rgba(201,162,39,0.3)',
          color:'rgba(201,162,39,0.8)', borderRadius:8,
          padding:'8px 18px', fontSize:11, letterSpacing:2,
          fontFamily:'"Cinzel",serif', cursor:'pointer',
          textTransform:'uppercase', zIndex:10,
        }}
      >
        Skip ›
      </button>
    </div>
  )
}
