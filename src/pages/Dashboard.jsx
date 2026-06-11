import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
  Zap, Target, ChevronRight, Activity, Gift, Clock
} from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'
import ReferralPopup from '../components/ReferralPopup'

const CHART_DATA = [
  {t:'6h',v:11200},{t:'5h',v:11800},{t:'4h',v:11400},
  {t:'3h',v:12600},{t:'2h',v:12200},{t:'1h',v:13400},{t:'Now',v:13900},
]
const DEMO_TRADES = [
  {symbol:'BTC/USDT',type:'BUY', profit:4820, pct:7.2, market:'crypto',confidence:88},
  {symbol:'ETH/USDT',type:'BUY', profit:2140, pct:5.1, market:'crypto',confidence:82},
  {symbol:'XAU/USD', type:'BUY', profit:1360, pct:3.8, market:'forex', confidence:76},
  {symbol:'EUR/USD', type:'SELL',profit:890,  pct:2.4, market:'forex', confidence:71},
  {symbol:'SOL/USDT',type:'BUY', profit:-340, pct:-1.2,market:'crypto',confidence:62},
]
const DEMO_PREDS = [
  {question:'Will USD/KES cross 135 before end of month?',category:'forex',  yespct:68,pool:245000,hot:true},
  {question:'Will Bitcoin smash $80K this week?',          category:'crypto', yespct:41,pool:389000,hot:true},
  {question:'Will Safaricom stock surge after earnings?',  category:'stocks', yespct:73,pool:128000,hot:false},
  {question:'Will Kenya beat Ethiopia in next match?',     category:'sports', yespct:55,pool:97000, hot:true},
]
const CAT_ICON  = {forex:'💱',crypto:'🪙',stocks:'📈',sports:'⚽',economics:'🏦',weather:'🌦️'}
const MARKET_ICON = {crypto:'🪙',forex:'💱',stocks:'📊'}

function AnimNumber({value,prefix='',suffix=''}) {
  const [disp,setDisp] = useState(0)
  const raf = useRef()
  useEffect(() => {
    if (!value && value !== 0) return
    const start = Date.now(), end = value, dur = 1400
    const tick = () => {
      const p = Math.min((Date.now()-start)/dur,1)
      const e = 1-Math.pow(1-p,4)
      setDisp(Math.round(end*e))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  },[value])
  return <>{prefix}{disp.toLocaleString()}{suffix}</>
}

const Tip = ({active,payload}) => active && payload?.length ? (
  <div style={{background:'#1a1508',border:'1px solid rgba(201,149,42,0.3)',padding:'7px 11px',borderRadius:8}}>
    <span style={{fontFamily:'var(--font-mono)',color:'var(--gold-bright)',fontWeight:700,fontSize:13}}>
      KSh {payload[0].value.toLocaleString()}
    </span>
  </div>
) : null

export default function Dashboard({session}) {
  const [wallet,setWallet]         = useState(null)
  const [signals,setSignals]       = useState([])
  const [trades,setTrades]         = useState(DEMO_TRADES)
  const [preds,setPreds]           = useState(DEMO_PREDS)
  const [loaded,setLoaded]         = useState(false)
  const [showRef,setShowRef]       = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    fetchData()
    const key = `ref_shown_${session.user.id}`
    if (!localStorage.getItem(key)) {
      const diff = (new Date() - new Date(session.user.created_at))/60000
      if (diff < 5) { setTimeout(()=>setShowRef(true),2000); localStorage.setItem(key,'1') }
    }
    const ch = supabase.channel('dash-live')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'signals'},
        p=>setSignals(prev=>[p.new,...prev].slice(0,6)))
      .subscribe()
    return () => supabase.removeChannel(ch)
  },[])

  const fetchData = async () => {
    const [{data:w},{data:s},{data:t},{data:p}] = await Promise.all([
      supabase.from('wallets').select('*').eq('user_id',session.user.id).single(),
      supabase.from('signals').select('*').neq('market','brief').order('created_at',{ascending:false}).limit(6),
      supabase.from('trades').select('*').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(5),
      supabase.from('predictions').select('*').eq('resolved',false).order('total_staked_kes',{ascending:false}).limit(4),
    ])
    setWallet(w); setLoaded(true)
    if (s?.length) setSignals(s)
    if (t?.length) setTrades(t)
    if (p?.length) setPreds(p)
  }

  const bal    = wallet?.balance_kes    || 0
  const profit = wallet?.total_profit   || 0
  const dep    = wallet?.total_deposited || 0
  const pct    = dep>0 ? ((profit/dep)*100).toFixed(1) : '0.0'

  return (
    <div style={{maxWidth:1200}}>
      {showRef && <ReferralPopup session={session} onClose={()=>setShowRef(false)}/>}

      <style>{`
        @keyframes fadeUp  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes hotBlink{0%,100%{opacity:1}50%{opacity:0.55}}
        @keyframes earnPulse{0%,100%{box-shadow:0 0 0 0 rgba(201,149,42,0.3)}50%{box-shadow:0 0 0 6px rgba(201,149,42,0)}}
        .hw-row:hover{background:var(--bg-hover)!important;border-color:var(--gold-border)!important;}
        .pred-row:hover{background:var(--bg-hover)!important;border-color:rgba(79,142,247,0.3)!important;}
        .sig-chip:hover{border-color:var(--gold-border)!important;}
        .dep-btn:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(201,149,42,0.5)!important;}
        .wd-btn:hover{background:var(--gold-glow)!important;transform:translateY(-2px);}
      `}</style>

      {/* ══ TOP BAR: Greeting + EARN FOREVER ══ */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        flexWrap:'wrap',gap:12,marginBottom:20,
        animation:'fadeUp 0.5s ease forwards'}}>
        <div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(18px,3vw,24px)',
            fontWeight:700,letterSpacing:'1px',
            background:'linear-gradient(135deg,var(--gold-bright),var(--gold))',
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
            marginBottom:2}}>
            Welcome back 🐺
          </h1>
          <p style={{color:'var(--text-muted)',fontSize:12,letterSpacing:'0.3px'}}>
            {new Date().toLocaleDateString('en-KE',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
          </p>
        </div>

        {/* EARN FOREVER button */}
        <button onClick={()=>setShowRef(true)} style={{
          display:'flex',alignItems:'center',gap:8,
          padding:'10px 18px',
          background:'linear-gradient(135deg,rgba(201,149,42,0.18),rgba(201,149,42,0.08))',
          border:'1px solid rgba(201,149,42,0.4)',
          borderRadius:12,cursor:'pointer',
          animation:'earnPulse 2.5s ease-in-out infinite',
          fontFamily:'var(--font-display)',
          transition:'all 0.2s',
        }}>
          <Gift size={15} color="var(--gold-bright)"/>
          <span style={{fontSize:12,fontWeight:700,letterSpacing:'1.5px',
            color:'var(--gold-bright)',textTransform:'uppercase'}}>
            Earn Forever
          </span>
          <span style={{background:'var(--gold)',color:'#09080a',
            fontSize:10,fontWeight:800,padding:'2px 7px',
            borderRadius:99,letterSpacing:'0.5px'}}>10%</span>
        </button>
      </div>

      {/* ══ BALANCE HERO ══ */}
      <div style={{
        background:'linear-gradient(135deg,#141008 0%,#1e1a0a 50%,#0f0c07 100%)',
        border:'1px solid rgba(201,149,42,0.25)',
        borderRadius:20,padding:'24px',marginBottom:16,
        position:'relative',overflow:'hidden',
        animation:'fadeUp 0.5s ease 0.1s both',
        boxShadow:'0 8px 40px rgba(0,0,0,0.4)',
      }}>
        <div style={{position:'absolute',top:-100,right:-60,width:280,height:280,
          background:'radial-gradient(circle,rgba(201,149,42,0.12) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:-60,left:-30,width:200,height:200,
          background:'radial-gradient(circle,rgba(79,142,247,0.06) 0%,transparent 70%)',pointerEvents:'none'}}/>

        <div style={{position:'relative',zIndex:1}}>
          {/* Balance + profit row */}
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',
            flexWrap:'wrap',gap:16,marginBottom:16}}>
            <div>
              <div style={{fontSize:10,fontWeight:600,letterSpacing:'2px',
                textTransform:'uppercase',color:'rgba(201,149,42,0.6)',marginBottom:6}}>
                Total Balance
              </div>
              <div style={{fontFamily:'var(--font-mono)',
                fontSize:'clamp(30px,6vw,46px)',fontWeight:700,
                letterSpacing:'-1.5px',lineHeight:1,
                background:'linear-gradient(135deg,#f0c14b 0%,#c9952a 60%,#f5d060 100%)',
                WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                {loaded ? <AnimNumber value={bal} prefix="KSh " /> : 'KSh —'}
              </div>
              <div style={{fontFamily:'var(--font-mono)',fontSize:13,
                color:'var(--text-muted)',marginTop:5}}>
                ≈ ${loaded?(bal/129.45).toFixed(2):'—'} USD
              </div>
            </div>

            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {[
                {label:'Total Profit',val:`${profit>=0?'+':''}KSh ${profit.toLocaleString()}`,
                 col:profit>=0?'var(--green)':'var(--red)',
                 bg:profit>=0?'rgba(34,195,122,0.08)':'rgba(232,64,96,0.08)',
                 border:profit>=0?'rgba(34,195,122,0.2)':'rgba(232,64,96,0.2)',
                 sub:`${pct}% return`},
                {label:'Deposited',val:`KSh ${dep.toLocaleString()}`,
                 col:'var(--text-primary)',bg:'rgba(255,255,255,0.04)',
                 border:'rgba(255,255,255,0.08)',sub:'Total invested'},
              ].map((s,i)=>(
                <div key={i} style={{background:s.bg,border:`1px solid ${s.border}`,
                  borderRadius:12,padding:'12px 16px',minWidth:130}}>
                  <div style={{fontSize:10,color:'var(--text-muted)',letterSpacing:'1px',
                    textTransform:'uppercase',marginBottom:4}}>{s.label}</div>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:15,
                    fontWeight:700,color:s.col}}>{s.val}</div>
                  <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini chart */}
          <div style={{height:56,marginBottom:18,opacity:0.85}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{top:2,bottom:2}}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#c9952a" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#c9952a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide/>
                <Tooltip content={<Tip/>}/>
                <Area type="monotone" dataKey="v" stroke="#c9952a"
                  strokeWidth={2} fill="url(#g1)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Action buttons */}
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button className="dep-btn" onClick={()=>nav('/wallet')} style={{
              display:'flex',alignItems:'center',gap:8,
              padding:'12px 24px',
              background:'linear-gradient(135deg,#c9952a,#f0c14b)',
              border:'none',borderRadius:11,
              color:'#09080a',fontSize:14,fontWeight:700,
              cursor:'pointer',transition:'all 0.2s',
              boxShadow:'0 4px 20px rgba(201,149,42,0.4)',
              fontFamily:'var(--font-body)',letterSpacing:'0.3px',
            }}>
              <ArrowDownLeft size={16}/> Deposit via M-Pesa
            </button>
            <button className="wd-btn" onClick={()=>nav('/wallet')} style={{
              display:'flex',alignItems:'center',gap:8,
              padding:'12px 24px',
              background:'transparent',
              border:'1px solid rgba(201,149,42,0.35)',
              borderRadius:11,color:'var(--gold-bright)',
              fontSize:14,fontWeight:700,cursor:'pointer',
              transition:'all 0.2s',
              fontFamily:'var(--font-body)',letterSpacing:'0.3px',
            }}>
              <ArrowUpRight size={16}/> Withdraw
            </button>
            <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,
              padding:'8px 14px',background:'rgba(34,195,122,0.08)',
              border:'1px solid rgba(34,195,122,0.2)',borderRadius:10}}>
              <span className="live-dot"/>
              <span style={{fontSize:11,color:'var(--green)',fontWeight:600,letterSpacing:'0.5px'}}>
                Markets Live
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ TRADES + PREDICTIONS ══ */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>

        {/* LEFT: TOP TRADES */}
        <div style={{background:'var(--bg-surface)',border:'1px solid var(--border)',
          borderRadius:16,overflow:'hidden',cursor:'pointer',
          transition:'border-color 0.2s',animation:'fadeUp 0.5s ease 0.2s both'}}
          onClick={()=>nav('/trades')}
          onMouseEnter={e=>e.currentTarget.style.borderColor='var(--gold-border)'}
          onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
          {/* Header */}
          <div style={{padding:'15px 18px',
            background:'linear-gradient(135deg,#141008,#1c1a0e)',
            borderBottom:'1px solid var(--border)',
            display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:34,height:34,borderRadius:9,
                background:'rgba(201,149,42,0.12)',border:'1px solid rgba(201,149,42,0.25)',
                display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Activity size={16} color="var(--gold-bright)"/>
              </div>
              <div>
                <div style={{fontFamily:'var(--font-display)',fontSize:13,fontWeight:700,
                  letterSpacing:'0.8px',color:'var(--text-primary)'}}>Top Trades</div>
                <div style={{fontSize:10,color:'var(--text-muted)',marginTop:1}}>AI signal performance</div>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,
              fontSize:11,fontWeight:600,color:'var(--gold-bright)'}}>
              View all <ChevronRight size={13}/>
            </div>
          </div>

          {/* Rows */}
          <div style={{padding:'6px 8px'}}>
            {trades.slice(0,5).map((t,i)=>{
              const isUp = (t.profit||t.profit_kes||0) >= 0
              const sym  = t.symbol
              const typ  = t.type||t.trade_type||'BUY'
              const prof = Math.abs(t.profit||t.profit_kes||0)
              const p    = t.pct||0
              const conf = t.confidence||t.ai_confidence||75
              return (
                <div key={i} className="hw-row" style={{
                  display:'flex',alignItems:'center',gap:10,
                  padding:'9px 10px',borderRadius:9,
                  border:'1px solid transparent',
                  transition:'all 0.15s',marginBottom:2,
                  animation:`fadeUp 0.4s ease ${0.05*i}s both`,
                }}>
                  <div style={{width:32,height:32,borderRadius:8,flexShrink:0,
                    background:isUp?'rgba(34,195,122,0.1)':'rgba(232,64,96,0.1)',
                    border:`1px solid ${isUp?'rgba(34,195,122,0.2)':'rgba(232,64,96,0.2)'}`,
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>
                    {MARKET_ICON[t.market]||'📊'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                      <span style={{fontFamily:'var(--font-mono)',fontSize:12,
                        fontWeight:600,color:'var(--text-primary)'}}>{sym}</span>
                      <span style={{fontSize:9,fontWeight:700,padding:'1px 5px',
                        borderRadius:4,letterSpacing:'0.5px',
                        background:typ==='BUY'?'rgba(34,195,122,0.12)':'rgba(232,64,96,0.12)',
                        color:typ==='BUY'?'var(--green)':'var(--red)'}}>{typ}</span>
                    </div>
                    <div style={{height:3,background:'var(--border)',
                      borderRadius:99,overflow:'hidden'}}>
                      <div style={{width:`${conf}%`,height:'100%',borderRadius:99,
                        background:isUp?'linear-gradient(90deg,#22c37a,#4ade80)':'linear-gradient(90deg,#e84060,#f87171)',
                        transition:'width 0.8s ease'}}/>
                    </div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontFamily:'var(--font-mono)',fontSize:13,fontWeight:700,
                      color:isUp?'var(--green)':'var(--red)'}}>
                      {isUp?'+':'−'}KSh {prof.toLocaleString()}
                    </div>
                    <div style={{fontSize:10,color:isUp?'var(--green)':'var(--red)',
                      display:'flex',alignItems:'center',gap:2,justifyContent:'flex-end',marginTop:1}}>
                      {isUp?<TrendingUp size={9}/>:<TrendingDown size={9}/>}
                      {isUp?'+':''}{p}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{padding:'10px 18px',borderTop:'1px solid var(--border)',
            background:'var(--bg-raised)',display:'flex',
            alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:11,color:'var(--text-muted)'}}>
              {trades.filter(t=>t.status==='open'||!t.status).length} active positions
            </span>
            <span style={{fontSize:11,fontWeight:700,color:'var(--gold-bright)',
              display:'flex',alignItems:'center',gap:3}}>
              Full history <ArrowUpRight size={11}/>
            </span>
          </div>
        </div>

        {/* RIGHT: PREDICTIONS */}
        <div style={{background:'var(--bg-surface)',border:'1px solid var(--border)',
          borderRadius:16,overflow:'hidden',cursor:'pointer',
          transition:'border-color 0.2s',animation:'fadeUp 0.5s ease 0.25s both'}}
          onClick={()=>nav('/predictions')}
          onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(79,142,247,0.35)'}
          onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
          {/* Header */}
          <div style={{padding:'15px 18px',
            background:'linear-gradient(135deg,#0d1018,#101520)',
            borderBottom:'1px solid var(--border)',
            display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:34,height:34,borderRadius:9,
                background:'rgba(79,142,247,0.12)',border:'1px solid rgba(79,142,247,0.25)',
                display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Target size={16} color="var(--blue)"/>
              </div>
              <div>
                <div style={{fontFamily:'var(--font-display)',fontSize:13,fontWeight:700,
                  letterSpacing:'0.8px',color:'var(--text-primary)'}}>Predictions</div>
                <div style={{fontSize:10,color:'var(--text-muted)',marginTop:1}}>Stake KSh on outcomes</div>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:9,fontWeight:800,padding:'3px 8px',
                background:'rgba(232,64,96,0.15)',color:'#ff6b6b',
                border:'1px solid rgba(232,64,96,0.3)',borderRadius:99,
                animation:'hotBlink 1.5s infinite',letterSpacing:'1px'}}>🔥 HOT</span>
              <span style={{fontSize:11,fontWeight:600,color:'var(--blue)',
                display:'flex',alignItems:'center',gap:3}}>
                View all <ChevronRight size={13}/>
              </span>
            </div>
          </div>

          {/* Prediction rows */}
          <div style={{padding:'8px'}}>
            {preds.slice(0,4).map((p,i)=>{
              const yes  = p.yespct ?? Math.floor(Math.random()*40+35)
              const no   = 100-yes
              const pool = p.pool ?? p.total_staked_kes ?? 0
              const cat  = p.category||'forex'
              return (
                <div key={i} className="pred-row" style={{
                  padding:'10px 12px',marginBottom:6,
                  background:'var(--bg-raised)',
                  border:'1px solid var(--border)',
                  borderRadius:10,transition:'all 0.15s',
                  animation:`fadeUp 0.4s ease ${0.06*i}s both`,
                }}>
                  <div style={{display:'flex',alignItems:'center',
                    justifyContent:'space-between',marginBottom:5}}>
                    <span style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}>
                      <span>{CAT_ICON[cat]||'🎯'}</span>
                      <span style={{fontWeight:600,color:'var(--text-secondary)',
                        textTransform:'uppercase',letterSpacing:'0.8px',fontSize:9}}>{cat}</span>
                    </span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:10,
                      color:'var(--text-muted)'}}>
                      🏆 KSh {(pool/1000).toFixed(0)}K
                    </span>
                  </div>
                  <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',
                    lineHeight:1.4,marginBottom:8}}>{p.question}</div>
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',
                      fontSize:10,fontWeight:700,marginBottom:4}}>
                      <span style={{color:'var(--green)'}}>YES {yes}%</span>
                      <span style={{color:'var(--red)'}}>NO {no}%</span>
                    </div>
                    <div style={{height:5,background:'var(--border)',
                      borderRadius:99,overflow:'hidden',display:'flex'}}>
                      <div style={{width:`${yes}%`,background:'var(--green)',
                        borderRadius:'99px 0 0 99px',transition:'width 0.7s ease'}}/>
                      <div style={{width:`${no}%`,background:'var(--red)',
                        borderRadius:'0 99px 99px 0',transition:'width 0.7s ease'}}/>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{padding:'10px 18px',borderTop:'1px solid var(--border)',
            background:'var(--bg-raised)',display:'flex',
            alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:11,color:'var(--text-muted)'}}>
              {preds.length} markets open now
            </span>
            <span style={{fontSize:11,fontWeight:700,color:'var(--blue)',
              display:'flex',alignItems:'center',gap:3}}>
              All markets <ArrowUpRight size={11}/>
            </span>
          </div>
        </div>
      </div>

      {/* ══ AI SIGNALS STRIP ══ */}
      <div style={{background:'var(--bg-surface)',border:'1px solid var(--border)',
        borderRadius:16,overflow:'hidden',cursor:'pointer',
        transition:'border-color 0.2s',animation:'fadeUp 0.5s ease 0.3s both'}}
        onClick={()=>nav('/signals')}
        onMouseEnter={e=>e.currentTarget.style.borderColor='var(--gold-border)'}
        onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>

        <div style={{padding:'14px 18px',borderBottom:signals.length?'1px solid var(--border)':'none',
          display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,
              background:'rgba(201,149,42,0.1)',border:'1px solid rgba(201,149,42,0.2)',
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Zap size={15} color="var(--gold-bright)"/>
            </div>
            <div>
              <div style={{fontFamily:'var(--font-display)',fontSize:13,fontWeight:700,
                letterSpacing:'0.8px',display:'flex',alignItems:'center',gap:7}}>
                <span className="live-dot"/>
                Live AI Signals
              </div>
              <div style={{fontSize:10,color:'var(--text-muted)',marginTop:1}}>
                Groq LLaMA3 · Every 30 min
              </div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:4,
            fontSize:11,fontWeight:700,color:'var(--gold-bright)'}}>
            View all <ChevronRight size={13}/>
          </div>
        </div>

        {signals.length > 0 ? (
          <div style={{display:'flex',overflowX:'auto',gap:10,
            padding:'12px 16px 14px',scrollbarWidth:'none'}}>
            {signals.map((s,i)=>(
              <div key={i} className="sig-chip" style={{
                flexShrink:0,width:158,
                background:'var(--bg-raised)',
                border:'1px solid var(--border)',
                borderRadius:11,padding:'12px',
                transition:'border-color 0.15s',
                animation:`fadeUp 0.4s ease ${0.05*i}s both`,
              }}>
                <div style={{display:'flex',alignItems:'center',
                  justifyContent:'space-between',marginBottom:7}}>
                  <span className={`signal-action ${s.action?.toLowerCase()}`}
                    style={{fontSize:9,padding:'2px 7px'}}>
                    {s.action}
                  </span>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:12,
                    fontWeight:700,color:'var(--gold-bright)'}}>
                    {s.confidence}%
                  </span>
                </div>
                <div style={{fontFamily:'var(--font-mono)',fontSize:12,
                  fontWeight:600,color:'var(--text-primary)',marginBottom:2}}>
                  {s.symbol}
                </div>
                <div style={{fontSize:10,color:'var(--text-muted)',
                  display:'flex',alignItems:'center',gap:4}}>
                  <Clock size={9}/>
                  {new Date(s.created_at).toLocaleTimeString('en-KE',
                    {hour:'2-digit',minute:'2-digit'})}
                </div>
                <div style={{marginTop:7,height:3,background:'var(--border)',
                  borderRadius:99,overflow:'hidden'}}>
                  <div style={{width:`${s.confidence}%`,height:'100%',
                    background:'linear-gradient(90deg,var(--gold),var(--gold-bright))',
                    borderRadius:99}}/>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{padding:'18px',display:'flex',alignItems:'center',
            gap:10,color:'var(--text-muted)',fontSize:13}}>
            <Zap size={15} style={{opacity:0.3}}/>
            Groq AI analyzing markets — signals appear here every 30 minutes
          </div>
        )}
      </div>
    </div>
  )
}
