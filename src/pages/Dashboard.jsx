import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
  Zap, Target, ChevronRight, Activity, Globe, Clock
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'
import ReferralPopup from '../components/ReferralPopup'

// ── Mock chart data ───────────────────────────────────────────
const CHART_DATA = [
  { t:'6h ago', v:11200 }, { t:'5h ago', v:11800 },
  { t:'4h ago', v:11400 }, { t:'3h ago', v:12600 },
  { t:'2h ago', v:12200 }, { t:'1h ago', v:13400 },
  { t:'Now',    v:13900 },
]

// ── Demo top trades ───────────────────────────────────────────
const DEMO_TRADES = [
  { symbol:'BTC/USDT', type:'BUY',  profit:+4820, pct:+7.2, market:'crypto', confidence:88 },
  { symbol:'ETH/USDT', type:'BUY',  profit:+2140, pct:+5.1, market:'crypto', confidence:82 },
  { symbol:'XAU/USD',  type:'BUY',  profit:+1360, pct:+3.8, market:'forex',  confidence:76 },
  { symbol:'EUR/USD',  type:'SELL', profit:+890,  pct:+2.4, market:'forex',  confidence:71 },
  { symbol:'SOL/USDT', type:'BUY',  profit:-340,  pct:-1.2, market:'crypto', confidence:62 },
]

// ── Demo predictions ──────────────────────────────────────────
const DEMO_PREDICTIONS = [
  { question:'Will USD/KES cross 135 before end of month?', question_swahili:'Je, dola itapita 135 mwezi huu?', category:'forex',      yespct:68, pool:245000, hot:true  },
  { question:'Will Bitcoin hit $80K this week?',            question_swahili:'Je, Bitcoin itafika $80K wiki hii?', category:'crypto',    yespct:41, pool:389000, hot:true  },
  { question:'Will Safaricom stock rise after earnings?',   question_swahili:'Je, Safaricom itapanda baada ya matokeo?', category:'stocks', yespct:73, pool:128000, hot:false },
  { question:'Will Kenya beat Ethiopia in next match?',     question_swahili:'Je, Kenya itashinda Ethiopia?', category:'sports',        yespct:55, pool:97000,  hot:true  },
]

const CAT_ICON = { forex:'💱', crypto:'🪙', stocks:'📈', sports:'⚽', economics:'🏦', weather:'🌦️' }
const CAT_COLOR = { forex:'gold', crypto:'gold', stocks:'blue', sports:'green', economics:'silver', weather:'blue' }

// ── Animated number ───────────────────────────────────────────
function AnimNumber({ value, prefix='', decimals=0 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    if (!value) return
    let start = 0
    const end = value
    const duration = 1200
    const startTime = performance.now()
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 4)
      setDisplay(start + (end - start) * ease)
      if (progress < 1) ref.current = requestAnimationFrame(step)
    }
    ref.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(ref.current)
  }, [value])
  return <>{prefix}{display.toLocaleString('en-KE', { maximumFractionDigits: decimals })}</>
}

// ── Chart tooltip ─────────────────────────────────────────────
const ChartTip = ({ active, payload }) => active && payload?.length ? (
  <div style={{ background:'var(--bg-raised)', border:'1px solid var(--gold-border)', padding:'8px 12px', borderRadius:8 }}>
    <div style={{ color:'var(--gold-bright)', fontFamily:'var(--font-mono)', fontWeight:700, fontSize:13 }}>
      KSh {payload[0].value.toLocaleString()}
    </div>
  </div>
) : null

export default function Dashboard({ session }) {
  const [wallet, setWallet]             = useState(null)
  const [signals, setSignals]           = useState([])
  const [trades, setTrades]             = useState([])
  const [predictions, setPredictions]   = useState([])
  const [showReferral, setShowReferral] = useState(false)
  const [walletLoaded, setWalletLoaded] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
    // Show referral only on first signup
    const key = `referral_shown_${session.user.id}`
    if (!localStorage.getItem(key)) {
      const created = new Date(session.user.created_at)
      const diff = (new Date() - created) / 1000 / 60
      if (diff < 5) {
        setTimeout(() => setShowReferral(true), 2000)
        localStorage.setItem(key, 'true')
      }
    }
    const ch = supabase.channel('dash')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'signals' },
        p => setSignals(prev => [p.new, ...prev].slice(0,5)))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const fetchData = async () => {
    const [{ data:w }, { data:s }, { data:t }, { data:p }] = await Promise.all([
      supabase.from('wallets').select('*').eq('user_id', session.user.id).single(),
      supabase.from('signals').select('*').neq('market','brief').order('created_at',{ascending:false}).limit(5),
      supabase.from('trades').select('*').eq('user_id', session.user.id).order('created_at',{ascending:false}).limit(5),
      supabase.from('predictions').select('*').eq('resolved',false).order('total_staked_kes',{ascending:false}).limit(4),
    ])
    setWallet(w)
    setWalletLoaded(true)
    if (s) setSignals(s)
    if (t) setTrades(t.length ? t : DEMO_TRADES)
    if (p) setPredictions(p.length ? p : DEMO_PREDICTIONS)
  }

  const bal    = wallet?.balance_kes    || 0
  const profit = wallet?.total_profit   || 0
  const dep    = wallet?.total_deposited || 0
  const profPct = dep > 0 ? ((profit / dep) * 100).toFixed(1) : '0.0'

  return (
    <div>
      {showReferral && <ReferralPopup session={session} onClose={() => setShowReferral(false)} />}

      <style>{`
        @keyframes earnGlow {
          0%,100% { box-shadow:0 0 0 0 rgba(201,162,39,0.15) }
          50%      { box-shadow:0 0 20px rgba(201,162,39,0.35) }
        }
        @keyframes balanceIn {
          from { opacity:0; transform:translateY(12px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(16px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes hotPulse {
          0%,100% { opacity:1 }
          50%      { opacity:0.6 }
        }
        .trade-row:hover  { border-color:var(--gold-border) !important; transform:translateX(3px); }
        .pred-card:hover  { border-color:var(--gold-border) !important; transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,0.35); }
        .section-card:hover .section-arrow { color:var(--gold-bright) !important; transform:translateX(4px); }
        .section-arrow { transition:all 0.2s; color:var(--text-muted); }
      `}</style>

      {/* ══════════════════════════════════════════════
          BALANCE HERO
      ══════════════════════════════════════════════ */}
      <div style={{
        background:'linear-gradient(135deg,#13100a 0%,#1c1508 45%,#0f0d08 100%)',
        border:'1px solid var(--gold-border)',
        borderRadius:20,
        padding:'24px 24px 20px',
        marginBottom:18,
        position:'relative',
        overflow:'hidden',
        animation:'balanceIn 0.6s ease forwards',
      }}>
        {/* Background glow blobs */}
        <div style={{ position:'absolute', top:-120, right:-80, width:320, height:320,
          background:'radial-gradient(circle,rgba(201,149,42,0.1) 0%,transparent 70%)',
          pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-80, left:-40, width:220, height:220,
          background:'radial-gradient(circle,rgba(79,142,247,0.05) 0%,transparent 70%)',
          pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1 }}>
          {/* Top row */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:18 }}>
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase',
                color:'var(--gold-dim)', marginBottom:6 }}>
                Total Balance
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'clamp(28px,6vw,42px)',
                fontWeight:700, letterSpacing:-1, lineHeight:1,
                background:'linear-gradient(135deg,var(--gold-bright),var(--gold))',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              }}>
                {walletLoaded ? (
                  <>KSh <AnimNumber value={bal} decimals={0} /></>
                ) : 'KSh —'}
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:13,
                color:'var(--text-muted)', marginTop:4 }}>
                ≈ ${walletLoaded ? (bal/129.45).toFixed(2) : '—'} USD
              </div>
            </div>

            {/* Profit badge */}
            <div style={{
              background: profit >= 0 ? 'rgba(34,195,122,0.1)' : 'rgba(232,64,96,0.1)',
              border:`1px solid ${profit>=0?'rgba(34,195,122,0.25)':'rgba(232,64,96,0.25)'}`,
              borderRadius:12, padding:'10px 16px', textAlign:'right',
            }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', letterSpacing:1,
                textTransform:'uppercase', marginBottom:3 }}>Total Profit</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:700,
                color: profit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {profit >= 0 ? '+' : ''}KSh {profit.toLocaleString()}
              </div>
              <div style={{ fontSize:11, color: profit>=0?'var(--green)':'var(--red)',
                display:'flex', alignItems:'center', gap:3, justifyContent:'flex-end', marginTop:2 }}>
                {profit >= 0 ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                {profPct}% all time
              </div>
            </div>
          </div>

          {/* Mini chart */}
          <div style={{ height:60, marginBottom:18 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#c9952a" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#c9952a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis hide />
                <YAxis hide />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="v" stroke="var(--gold)" strokeWidth={2}
                  fill="url(#goldGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Action buttons + quick stats */}
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <button
              onClick={() => navigate('/wallet')}
              style={{
                display:'flex', alignItems:'center', gap:7,
                padding:'11px 20px',
                background:'linear-gradient(135deg,var(--gold),var(--gold-bright))',
                border:'none', borderRadius:10,
                color:'#09080a', fontSize:13, fontWeight:700,
                cursor:'pointer', transition:'all 0.2s',
                boxShadow:'0 4px 16px rgba(201,149,42,0.35)',
              }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
            >
              <ArrowDownLeft size={15}/> Deposit
            </button>

            <button
              onClick={() => navigate('/wallet')}
              style={{
                display:'flex', alignItems:'center', gap:7,
                padding:'11px 20px',
                background:'transparent',
                border:'1px solid var(--gold-border)',
                borderRadius:10,
                color:'var(--gold-bright)', fontSize:13, fontWeight:700,
                cursor:'pointer', transition:'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='var(--gold-glow)'; e.currentTarget.style.transform='translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.transform='translateY(0)' }}
            >
              <ArrowUpRight size={15}/> Withdraw
            </button>

            <div style={{ marginLeft:'auto', display:'flex', gap:18, flexWrap:'wrap' }}>
              {[
                { label:'Deposited', val:`KSh ${dep.toLocaleString()}` },
                { label:'Active Trades', val:trades.filter(t=>t.status==='open').length },
                { label:'AI Signals', val:signals.length },
              ].map((s,i) => (
                <div key={i} style={{ textAlign:'right' }}>
                  <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:600, color:'var(--text-primary)', marginTop:1 }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          TRADES + PREDICTIONS (side by side)
      ══════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>

        {/* ── LEFT: TOP TRADES ── */}
        <div className="card section-card" style={{ padding:0, overflow:'hidden', cursor:'pointer' }}
          onClick={() => navigate('/trades')}>
          {/* Header */}
          <div style={{
            padding:'16px 18px 12px',
            background:'linear-gradient(135deg,#13100a,#1a1408)',
            borderBottom:'1px solid var(--border)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:9,
                background:'rgba(201,149,42,0.12)', border:'1px solid var(--gold-border)',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Activity size={15} color="var(--gold-bright)" />
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700,
                  color:'var(--text-primary)', letterSpacing:0.5 }}>Top Trades</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>AI-powered signals</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span className="live-dot" />
              <ChevronRight size={14} className="section-arrow" />
            </div>
          </div>

          {/* Trade rows */}
          <div style={{ padding:'8px 0' }}>
            {(trades.length ? trades : DEMO_TRADES).slice(0,5).map((t,i) => {
              const pct   = t.pct   ?? (t.profit_kes > 0 ? +3.2 : -1.4)
              const prof  = t.profit ?? t.profit_kes ?? 0
              const conf  = t.confidence ?? t.ai_confidence ?? 75
              const isUp  = prof >= 0
              return (
                <div key={i} className="trade-row" style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'9px 16px', margin:'2px 8px',
                  borderRadius:9,
                  border:'1px solid transparent',
                  transition:'all 0.15s',
                  animation:`cardIn 0.4s ease ${i*0.07}s both`,
                }}>
                  {/* Symbol icon */}
                  <div style={{
                    width:34, height:34, borderRadius:9, flexShrink:0,
                    background: isUp ? 'rgba(34,195,122,0.1)' : 'rgba(232,64,96,0.1)',
                    border:`1px solid ${isUp?'rgba(34,195,122,0.2)':'rgba(232,64,96,0.2)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:14,
                  }}>
                    {t.market==='crypto'?'🪙':t.market==='forex'?'💱':'📊'}
                  </div>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:12,
                        fontWeight:600, color:'var(--text-primary)' }}>{t.symbol}</span>
                      <span style={{
                        fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:4,
                        background: (t.type||t.trade_type)==='BUY'?'rgba(34,195,122,0.12)':'rgba(232,64,96,0.12)',
                        color: (t.type||t.trade_type)==='BUY'?'var(--green)':'var(--red)',
                      }}>{t.type||t.trade_type}</span>
                    </div>
                    {/* Confidence bar */}
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
                      <div style={{ flex:1, height:3, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ width:`${conf}%`, height:'100%', borderRadius:99,
                          background:`linear-gradient(90deg,${isUp?'var(--green)':'var(--red)'},${isUp?'#4ade80':'#f87171'})` }} />
                      </div>
                      <span style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'var(--font-mono)', flexShrink:0 }}>{conf}%</span>
                    </div>
                  </div>

                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700,
                      color: isUp?'var(--green)':'var(--red)' }}>
                      {isUp?'+':''}KSh {Math.abs(prof).toLocaleString()}
                    </div>
                    <div style={{ fontSize:10, color: isUp?'var(--green)':'var(--red)',
                      display:'flex', alignItems:'center', gap:2, justifyContent:'flex-end' }}>
                      {isUp?<TrendingUp size={9}/>:<TrendingDown size={9}/>}
                      {isUp?'+':''}{pct}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer CTA */}
          <div style={{
            padding:'10px 18px',
            borderTop:'1px solid var(--border)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            background:'var(--bg-raised)',
          }}>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>View all trades & history</span>
            <div style={{ display:'flex', alignItems:'center', gap:4,
              fontSize:11, fontWeight:700, color:'var(--gold-bright)' }}>
              Open Trades <ArrowUpRight size={11}/>
            </div>
          </div>
        </div>

        {/* ── RIGHT: PREDICTIONS ── */}
        <div className="card section-card" style={{ padding:0, overflow:'hidden', cursor:'pointer' }}
          onClick={() => navigate('/predictions')}>
          {/* Header */}
          <div style={{
            padding:'16px 18px 12px',
            background:'linear-gradient(135deg,#0d1018,#101520)',
            borderBottom:'1px solid var(--border)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:9,
                background:'rgba(79,142,247,0.12)', border:'1px solid rgba(79,142,247,0.2)',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Target size={15} color="var(--blue)" />
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700,
                  color:'var(--text-primary)', letterSpacing:0.5 }}>Predictions</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>Stake & earn on outcomes</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px',
                background:'rgba(232,64,96,0.15)', color:'var(--red)',
                border:'1px solid rgba(232,64,96,0.25)', borderRadius:99,
                animation:'hotPulse 1.5s infinite', letterSpacing:0.5 }}>🔥 HOT</span>
              <ChevronRight size={14} className="section-arrow" />
            </div>
          </div>

          {/* Prediction cards */}
          <div style={{ padding:'8px' }}>
            {(predictions.length ? predictions : DEMO_PREDICTIONS).slice(0,4).map((p,i) => {
              const yesPct = p.yespct ?? Math.floor(Math.random()*40+30)
              const noPct  = 100 - yesPct
              const pool   = p.pool ?? p.total_staked_kes ?? 0
              const q      = p.question
              const cat    = p.category || 'forex'
              return (
                <div key={i} className="pred-card" style={{
                  padding:'11px 12px',
                  background:'var(--bg-raised)',
                  border:'1px solid var(--border)',
                  borderRadius:10, marginBottom:6,
                  transition:'all 0.2s',
                  animation:`cardIn 0.4s ease ${i*0.08}s both`,
                }}>
                  {/* Category + pool */}
                  <div style={{ display:'flex', alignItems:'center',
                    justifyContent:'space-between', marginBottom:6 }}>
                    <span className={`tag ${CAT_COLOR[cat]||'gold'}`}>
                      {CAT_ICON[cat]} {cat}
                    </span>
                    <span style={{ fontSize:10, fontFamily:'var(--font-mono)',
                      color:'var(--text-muted)' }}>
                      🏆 KSh {(pool/1000).toFixed(0)}K pool
                    </span>
                  </div>

                  {/* Question */}
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)',
                    lineHeight:1.4, marginBottom:8 }}>{q}</div>

                  {/* Odds bar */}
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between',
                      fontSize:10, fontWeight:700, marginBottom:4 }}>
                      <span style={{ color:'var(--green)' }}>YES {yesPct}%</span>
                      <span style={{ color:'var(--red)' }}>NO {noPct}%</span>
                    </div>
                    <div style={{ height:5, background:'var(--border)',
                      borderRadius:99, overflow:'hidden', display:'flex' }}>
                      <div style={{ width:`${yesPct}%`, background:'var(--green)',
                        borderRadius:'99px 0 0 99px', transition:'width 0.6s' }} />
                      <div style={{ width:`${noPct}%`, background:'var(--red)',
                        borderRadius:'0 99px 99px 0', transition:'width 0.6s' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer CTA */}
          <div style={{
            padding:'10px 18px',
            borderTop:'1px solid var(--border)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            background:'var(--bg-raised)',
          }}>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>Tap to stake on any prediction</span>
            <div style={{ display:'flex', alignItems:'center', gap:4,
              fontSize:11, fontWeight:700, color:'var(--blue)' }}>
              All Markets <ArrowUpRight size={11}/>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          LIVE AI SIGNALS STRIP
      ══════════════════════════════════════════════ */}
      <div className="card" style={{ padding:0, overflow:'hidden', cursor:'pointer' }}
        onClick={() => navigate('/signals')}>
        <div style={{
          padding:'14px 18px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          borderBottom: signals.length ? '1px solid var(--border)' : 'none',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:8,
              background:'rgba(201,149,42,0.1)', border:'1px solid var(--gold-border)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={14} color="var(--gold-bright)" />
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700,
                letterSpacing:0.5, display:'flex', alignItems:'center', gap:6 }}>
                <span className="live-dot" /> Live AI Signals
              </div>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>
                Powered by Groq LLaMA3 · Updates every 30 min
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6,
            fontSize:11, fontWeight:700, color:'var(--gold-bright)' }}>
            View All <ChevronRight size={13} className="section-arrow" />
          </div>
        </div>

        {signals.length > 0 ? (
          <div style={{ display:'flex', overflowX:'auto', gap:10, padding:'12px 16px',
            scrollbarWidth:'none' }}>
            {signals.map((s,i) => (
              <div key={i} style={{
                flexShrink:0, width:160,
                background:'var(--bg-raised)',
                border:'1px solid var(--border)',
                borderRadius:10, padding:'12px',
                animation:`cardIn 0.4s ease ${i*0.06}s both`,
              }}>
                <div style={{ display:'flex', alignItems:'center',
                  justifyContent:'space-between', marginBottom:7 }}>
                  <span className={`signal-action ${s.action?.toLowerCase()}`}
                    style={{ fontSize:9 }}>{s.action}</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:11,
                    color:'var(--gold-bright)', fontWeight:700 }}>{s.confidence}%</span>
                </div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:12,
                  fontWeight:600, marginBottom:3 }}>{s.symbol}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>
                  {s.market} · {new Date(s.created_at).toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'})}
                </div>
                <div style={{ marginTop:7, height:3, background:'var(--border)',
                  borderRadius:99, overflow:'hidden' }}>
                  <div style={{ width:`${s.confidence}%`, height:'100%',
                    background:'linear-gradient(90deg,var(--gold),var(--gold-bright))',
                    borderRadius:99 }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding:'20px 18px', display:'flex', alignItems:'center',
            gap:10, color:'var(--text-muted)', fontSize:13 }}>
            <Globe size={16} style={{ opacity:0.4 }} />
            AI is analyzing markets — signals appear here every 30 minutes
          </div>
        )}
      </div>
    </div>
  )
}
