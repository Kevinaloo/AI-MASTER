import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Target, RefreshCw, Clock, Trophy, ChevronRight, TrendingUp, Zap } from 'lucide-react'

const CAT_ICON  = {forex:'💱',crypto:'🪙',stocks:'📈',sports:'⚽',economics:'🏦',weather:'🌦️',politics:'🏛️',technology:'📱',social:'👥',entertainment:'🎵'}
const CAT_COLOR = {forex:'gold',crypto:'gold',stocks:'blue',sports:'green',economics:'silver',politics:'red',technology:'blue',social:'silver',weather:'blue',entertainment:'gold'}
const CATEGORIES = ['all','politics','economics','sports','crypto','forex','technology','social','weather']

function timeLeft(d) {
  const diff = new Date(d) - new Date()
  if (diff <= 0) return 'Closed'
  const days  = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `${days}d ${hours}h`
  return `${hours}h left`
}

function calcPayout(stakeAmount, choice, yesPool, noPool, platformFee = 0.05) {
  if (!stakeAmount || stakeAmount <= 0) return null
  const totalPool  = yesPool + noPool + stakeAmount
  const winPool    = choice === 'A' ? yesPool + stakeAmount : noPool + stakeAmount
  const losePool   = choice === 'A' ? noPool : yesPool
  const afterFee   = losePool * (1 - platformFee)
  const myShare    = stakeAmount / winPool
  const payout     = stakeAmount + (afterFee * myShare)
  const multiplier = payout / stakeAmount
  return {
    payout:     Math.round(payout),
    multiplier: multiplier.toFixed(2),
    profit:     Math.round(payout - stakeAmount),
    odds:       multiplier.toFixed(2) + 'x',
  }
}

function PayoutPreview({ amount, choice, yesPool, noPool }) {
  const result = calcPayout(parseFloat(amount), choice, yesPool || 1000, noPool || 800)
  if (!result || !amount || parseFloat(amount) < 50) return null
  return (
    <div style={{
      padding: '10px 12px', marginTop: 8,
      background: 'linear-gradient(135deg,rgba(201,149,42,0.08),rgba(201,149,42,0.04))',
      border: '1px solid var(--gold-border)',
      borderRadius: 10,
      animation: 'fadeUp 0.2s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Expected Payout
        </span>
        <span style={{ fontSize: 11, color: 'var(--gold-bright)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          {result.odds} odds
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>
            KSh {result.payout.toLocaleString()}
          </span>
          <span style={{ fontSize: 11, color: 'var(--green)', marginLeft: 6 }}>
            +KSh {result.profit.toLocaleString()} profit
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>if {choice === 'A' ? 'YES' : 'NO'} wins</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>5% platform fee applied</div>
        </div>
      </div>
    </div>
  )
}

export default function Predictions({ session }) {
  const [preds, setPreds]       = useState([])
  const [myStakes, setMyStakes] = useState({})
  const [selected, setSelected] = useState({})
  const [amounts, setAmounts]   = useState({})
  const [loading, setLoading]   = useState(true)
  const [staking, setStaking]   = useState({})
  const [msgs, setMsgs]         = useState({})
  const [lang, setLang]         = useState('en')
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [sortBy, setSortBy]     = useState('pool') // pool | new | closing

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: p } = await supabase
      .from('predictions').select('*')
      .eq('resolved', false)
      .order('total_staked_kes', { ascending: false })
      .limit(100)
    const { data: s } = await supabase
      .from('stakes').select('*')
      .eq('user_id', session.user.id)
    setPreds(p || [])
    const map = {}
    s?.forEach(st => { map[st.prediction_id] = st })
    setMyStakes(map)
    setLoading(false)
  }, [session])

  useEffect(() => {
    fetchData()
    // Live updates when anyone stakes
    const ch = supabase.channel('preds-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'predictions' },
        payload => setPreds(prev => prev.map(p => p.id === payload.new.id ? payload.new : p)))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'predictions' },
        () => fetchData())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [fetchData])

  const handleStake = async (predId) => {
    const choice = selected[predId]
    const amount = parseFloat(amounts[predId])
    if (!choice) return setMsgs(m => ({ ...m, [predId]: { type: 'error', text: 'Choose YES or NO first' } }))
    if (!amount || amount < 50) return setMsgs(m => ({ ...m, [predId]: { type: 'error', text: 'Minimum stake is KSh 50' } }))

    setStaking(s => ({ ...s, [predId]: true }))
    setMsgs(m => ({ ...m, [predId]: null }))

    const { error } = await supabase.from('stakes').insert({
      user_id: session.user.id,
      prediction_id: predId,
      choice,
      amount_kes: amount
    })

    if (!error) {
      setMsgs(m => ({ ...m, [predId]: { type: 'success', text: `✅ KSh ${amount.toLocaleString()} staked on ${choice === 'A' ? 'YES' : 'NO'}!` } }))
      setSelected(s => ({ ...s, [predId]: null }))
      setAmounts(a => ({ ...a, [predId]: '' }))
      fetchData()
    } else {
      setMsgs(m => ({ ...m, [predId]: { type: 'error', text: error.message } }))
    }
    setStaking(s => ({ ...s, [predId]: false }))
  }

  // Filter + sort
  let displayed = [...preds]
  if (filter !== 'all') displayed = displayed.filter(p => p.category === filter)
  if (search) displayed = displayed.filter(p =>
    p.question?.toLowerCase().includes(search.toLowerCase()) ||
    p.question_swahili?.toLowerCase().includes(search.toLowerCase())
  )
  if (sortBy === 'new')     displayed.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
  if (sortBy === 'closing') displayed.sort((a,b) => new Date(a.closes_at) - new Date(b.closes_at))
  if (sortBy === 'pool')    displayed.sort((a,b) => (b.total_staked_kes||0) - (a.total_staked_kes||0))

  const totalPool = preds.reduce((a,p) => a + (p.total_staked_kes||0), 0)

  return (
    <div style={{ width:'100%', maxWidth:'100%', overflowX:'hidden' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes hotBlink{0%,100%{opacity:1}50%{opacity:0.5}}
        .pred-card:hover{border-color:var(--gold-border)!important;}
        .opt-btn:hover{border-color:var(--gold-border)!important;color:var(--gold-bright)!important;}
      `}</style>

      <div className="page-header">
        <h1>Predictions</h1>
        <p>Stake KSh on Kenyan outcomes — live odds update with every bet</p>
      </div>

      {/* Stats */}
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        {[
          { icon:'💰', label:'Total Pool',   val:`KSh ${(totalPool/1000).toFixed(0)}K`, col:'var(--gold-bright)' },
          { icon:'🎯', label:'Open Markets', val:preds.length,                           col:'var(--blue)' },
          { icon:'🏆', label:'My Stakes',    val:Object.keys(myStakes).length,           col:'var(--green)' },
        ].map((s,i) => (
          <div key={i} style={{
            flex:1, background:'var(--bg-surface)', border:'1px solid var(--border)',
            borderRadius:12, padding:'12px 8px', textAlign:'center', minWidth:0,
          }}>
            <div style={{ fontSize:18, marginBottom:3 }}>{s.icon}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:'clamp(13px,4vw,20px)', fontWeight:700, color:s.col }}>{s.val}</div>
            <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom:12 }}>
        <input
          style={{
            width:'100%', padding:'11px 14px', fontSize:13,
            background:'var(--bg-surface)', border:'1px solid var(--border)',
            borderRadius:10, color:'var(--text-primary)', outline:'none',
            fontFamily:'var(--font-body)', boxSizing:'border-box',
            transition:'border-color 0.15s',
          }}
          placeholder="🔍 Search predictions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={e => e.target.style.borderColor='var(--gold)'}
          onBlur={e => e.target.style.borderColor='var(--border)'}
        />
      </div>

      {/* Filters + Sort */}
      <div style={{ display:'flex', gap:7, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', flex:1, minWidth:0 }}>
          {CATEGORIES.slice(0,6).map(f => (
            <button key={f}
              style={{
                padding:'6px 11px', fontSize:11, fontWeight:600,
                borderRadius:8, cursor:'pointer', border:'1px solid',
                fontFamily:'var(--font-body)', textTransform:'capitalize',
                background: filter===f ? 'linear-gradient(135deg,var(--gold),var(--gold-bright))' : 'transparent',
                borderColor: filter===f ? 'transparent' : 'var(--border-light)',
                color: filter===f ? '#09080a' : 'var(--text-secondary)',
                transition:'all 0.15s', whiteSpace:'nowrap',
              }}
              onClick={() => setFilter(f)}>
              {CAT_ICON[f] || ''} {f}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:5, flexShrink:0 }}>
          {[
            { id:'pool',    label:'🔥 Hot' },
            { id:'new',     label:'🆕 New' },
            { id:'closing', label:'⏰ Closing' },
          ].map(s => (
            <button key={s.id}
              style={{
                padding:'6px 10px', fontSize:10, fontWeight:700,
                borderRadius:8, cursor:'pointer', border:'1px solid',
                fontFamily:'var(--font-body)',
                background: sortBy===s.id ? 'var(--gold-glow)' : 'transparent',
                borderColor: sortBy===s.id ? 'var(--gold-border)' : 'var(--border-light)',
                color: sortBy===s.id ? 'var(--gold-bright)' : 'var(--text-muted)',
                whiteSpace:'nowrap',
              }}
              onClick={() => setSortBy(s.id)}>{s.label}</button>
          ))}
          <div style={{ display:'flex', gap:5 }}>
            {['en','sw'].map(l => (
              <button key={l}
                style={{
                  padding:'6px 9px', fontSize:10, fontWeight:700,
                  borderRadius:8, cursor:'pointer', border:'1px solid',
                  fontFamily:'var(--font-body)', textTransform:'uppercase',
                  background: lang===l ? 'linear-gradient(135deg,var(--gold),var(--gold-bright))' : 'transparent',
                  borderColor: lang===l ? 'transparent' : 'var(--border-light)',
                  color: lang===l ? '#09080a' : 'var(--text-secondary)',
                }}
                onClick={() => setLang(l)}>{l}</button>
            ))}
          </div>
          <button onClick={fetchData}
            style={{ padding:'6px 9px', background:'transparent', border:'1px solid var(--border-light)', borderRadius:8, cursor:'pointer', color:'var(--text-secondary)', display:'flex', alignItems:'center' }}>
            <RefreshCw size={12}/>
          </button>
        </div>
      </div>

      {/* Count */}
      <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
        Showing <strong style={{ color:'var(--gold-bright)' }}>{displayed.length}</strong> of {preds.length} predictions
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Target size={20}/></div>
          <h3>Loading predictions...</h3>
        </div>
      ) : displayed.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Target size={20}/></div>
          <h3>No predictions found</h3>
          <p>Try a different filter or search term</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {displayed.map((p, idx) => {
            const myStake   = myStakes[p.id]
            const q         = lang==='sw' && p.question_swahili ? p.question_swahili : p.question
            const cat       = p.category || 'general'
            const tLeft     = timeLeft(p.closes_at)
            const isUrgent  = tLeft.includes('h') && !tLeft.includes('d')
            const pool      = p.total_staked_kes || 0
            const yesPool   = p.yes_pool || Math.round(pool * 0.55)
            const noPool    = p.no_pool  || Math.round(pool * 0.45)
            const totalBets = yesPool + noPool
            const yesPct    = totalBets > 0 ? Math.round((yesPool / totalBets) * 100) : 55
            const noPct     = 100 - yesPct
            const msg       = msgs[p.id]
            const amt       = parseFloat(amounts[p.id] || 0)
            const sel       = selected[p.id]
            const isHot     = (p.hot || pool > 50000)

            return (
              <div key={p.id} className="pred-card" style={{
                background:'var(--bg-surface)', border:'1px solid var(--border)',
                borderRadius:16, overflow:'hidden',
                width:'100%', boxSizing:'border-box',
                transition:'border-color 0.2s',
                animation:`fadeUp 0.4s ease ${Math.min(idx*0.03,0.3)}s both`,
              }}>
                {/* Header */}
                <div style={{ padding:'14px 16px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, gap:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
                      <span className={`tag ${CAT_COLOR[cat]||'gold'}`}>
                        {CAT_ICON[cat]||'🎯'} {cat}
                      </span>
                      {isHot && (
                        <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px',
                          background:'rgba(232,64,96,0.15)', color:'#ff6b6b',
                          border:'1px solid rgba(232,64,96,0.3)', borderRadius:99,
                          animation:'hotBlink 1.5s infinite', letterSpacing:'1px' }}>
                          🔥 HOT
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize:11, color:isUrgent?'var(--red)':'var(--text-muted)',
                      display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                      <Clock size={11}/> {tLeft}
                    </span>
                  </div>

                  {/* Question */}
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', lineHeight:1.4, marginBottom:10 }}>{q}</div>

                  {/* Live odds bar */}
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:700, marginBottom:5 }}>
                      <span style={{ color:'var(--green)', display:'flex', alignItems:'center', gap:4 }}>
                        <TrendingUp size={10}/> YES {yesPct}%
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', fontWeight:400 }}>
                          KSh {yesPool.toLocaleString()}
                        </span>
                      </span>
                      <span style={{ color:'var(--red)', display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', fontWeight:400 }}>
                          KSh {noPool.toLocaleString()}
                        </span>
                        NO {noPct}%
                      </span>
                    </div>
                    <div style={{ height:8, background:'var(--border)', borderRadius:99, overflow:'hidden', display:'flex', position:'relative' }}>
                      <div style={{ width:`${yesPct}%`, background:'linear-gradient(90deg,#22c37a,#4ade80)', borderRadius:'99px 0 0 99px', transition:'width 0.5s ease' }}/>
                      <div style={{ width:`${noPct}%`, background:'linear-gradient(90deg,#e84060,#f87171)', borderRadius:'0 99px 99px 0', transition:'width 0.5s ease' }}/>
                    </div>
                    {/* Live indicator */}
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5 }}>
                      <span className="live-dot" style={{ width:5, height:5 }}/>
                      <span style={{ fontSize:10, color:'var(--text-muted)' }}>
                        Total pool: <strong style={{ color:'var(--gold-bright)', fontFamily:'var(--font-mono)' }}>KSh {pool.toLocaleString()}</strong>
                        {' · '}Closes {new Date(p.closes_at).toLocaleDateString('en-KE')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stake area */}
                <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--bg-raised)' }}>
                  {myStake ? (
                    <div style={{
                      display:'flex', alignItems:'center', gap:8,
                      padding:'10px 12px', borderRadius:10,
                      background:'var(--green-glow)', border:'1px solid rgba(34,195,122,0.25)',
                    }}>
                      <Trophy size={14} color="var(--green)" style={{ flexShrink:0 }}/>
                      <div>
                        <div style={{ fontSize:13, color:'var(--green)', fontWeight:600 }}>
                          You staked <strong>KSh {myStake.amount_kes?.toLocaleString()}</strong> on <strong>{myStake.choice==='A'?'YES':'NO'}</strong>
                        </div>
                        {myStake.choice && (
                          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                            Potential: KSh {calcPayout(myStake.amount_kes, myStake.choice, yesPool, noPool)?.payout.toLocaleString() || '—'}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* YES/NO buttons */}
                      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                        {[
                          { opt:'A', label:'✅ YES', col:'var(--green)',  bg:'var(--green-glow)',  bd:'rgba(34,195,122,0.4)' },
                          { opt:'B', label:'❌ NO',  col:'var(--red)',    bg:'var(--red-glow)',    bd:'rgba(232,64,96,0.4)' },
                        ].map(o => {
                          const isSel = sel === o.opt
                          return (
                            <button key={o.opt} className="opt-btn"
                              style={{
                                flex:1, padding:'11px 8px', borderRadius:9,
                                fontSize:13, fontWeight:700, cursor:'pointer',
                                border:`1px solid ${isSel ? o.bd : 'var(--border-light)'}`,
                                background: isSel ? o.bg : 'transparent',
                                color: isSel ? o.col : 'var(--text-secondary)',
                                transition:'all 0.15s', fontFamily:'var(--font-body)',
                              }}
                              onClick={e => { e.stopPropagation(); setSelected(s => ({...s,[p.id]:o.opt})) }}>
                              {o.label}
                              {totalBets > 0 && (
                                <div style={{ fontSize:10, marginTop:2, opacity:0.7 }}>
                                  {o.opt==='A' ? yesPct : noPct}% · {(o.opt==='A' ? (totalBets/Math.max(yesPool+1,1)) : (totalBets/Math.max(noPool+1,1))).toFixed(2)}x
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {/* Amount input — only show after selection */}
                      {sel && (
                        <>
                          {/* Quick amounts */}
                          <div style={{ display:'flex', gap:6, marginBottom:8 }}>
                            {[50, 100, 500, 1000, 5000].map(a => (
                              <button key={a}
                                style={{
                                  flex:1, padding:'6px 2px', fontSize:10, fontWeight:600,
                                  borderRadius:7, cursor:'pointer', border:'1px solid var(--border-light)',
                                  background: parseFloat(amounts[p.id])===a ? 'var(--gold-glow)' : 'transparent',
                                  borderColor: parseFloat(amounts[p.id])===a ? 'var(--gold-border)' : 'var(--border-light)',
                                  color: parseFloat(amounts[p.id])===a ? 'var(--gold-bright)' : 'var(--text-secondary)',
                                  fontFamily:'var(--font-body)', minWidth:0, transition:'all 0.15s',
                                }}
                                onClick={e => { e.stopPropagation(); setAmounts(a2=>({...a2,[p.id]:String(a)})) }}>
                                {a >= 1000 ? `${a/1000}K` : a}
                              </button>
                            ))}
                          </div>

                          <div style={{ display:'flex', gap:8 }} onClick={e=>e.stopPropagation()}>
                            <input
                              style={{
                                flex:1, padding:'11px 12px', fontSize:13,
                                background:'var(--bg-surface)', border:'1px solid var(--border-light)',
                                borderRadius:9, color:'var(--text-primary)', outline:'none',
                                fontFamily:'var(--font-mono)', minWidth:0, transition:'border-color 0.15s',
                              }}
                              type="number" placeholder="Enter KSh amount"
                              value={amounts[p.id]||''}
                              onChange={e=>setAmounts(a=>({...a,[p.id]:e.target.value}))}
                              onFocus={e=>e.target.style.borderColor='var(--gold)'}
                              onBlur={e=>e.target.style.borderColor='var(--border-light)'}
                            />
                            <button
                              style={{
                                padding:'11px 18px', flexShrink:0,
                                background:'linear-gradient(135deg,var(--gold),var(--gold-bright))',
                                border:'none', borderRadius:9,
                                color:'#09080a', fontSize:13, fontWeight:700,
                                cursor: staking[p.id] ? 'not-allowed' : 'pointer',
                                fontFamily:'var(--font-body)',
                                display:'flex', alignItems:'center', gap:5,
                                opacity: staking[p.id] ? 0.7 : 1,
                                boxShadow:'0 3px 12px rgba(201,149,42,0.3)',
                              }}
                              disabled={staking[p.id]}
                              onClick={e=>{e.stopPropagation();handleStake(p.id)}}>
                              {staking[p.id] ? <Zap size={13}/> : <>Stake <ChevronRight size={13}/></>}
                            </button>
                          </div>

                          {/* Live payout preview */}
                          <PayoutPreview
                            amount={amounts[p.id]}
                            choice={sel}
                            yesPool={yesPool}
                            noPool={noPool}
                          />
                        </>
                      )}
                    </>
                  )}

                  {msg && (
                    <div style={{
                      marginTop:8, padding:'9px 12px', borderRadius:8, fontSize:12,
                      background: msg.type==='error' ? 'var(--red-glow)' : 'var(--green-glow)',
                      color: msg.type==='error' ? 'var(--red)' : 'var(--green)',
                      border:`1px solid ${msg.type==='error'?'rgba(232,64,96,0.25)':'rgba(34,195,122,0.25)'}`,
                    }}>{msg.text}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
