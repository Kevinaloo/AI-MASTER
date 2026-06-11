import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Target, RefreshCw, Clock, TrendingUp, Trophy, ChevronRight } from 'lucide-react'

const DEMO = [
  {id:'1',question:'Will USD/KES cross 135 before end of month?',question_swahili:'Je, dola itapita 135 mwezi huu?',category:'forex',  option_a:'YES',option_b:'NO',closes_at:new Date(Date.now()+86400000*7).toISOString(), total_staked_kes:245000,resolved:false},
  {id:'2',question:'Will Bitcoin smash $80K this week?',          question_swahili:'Je, Bitcoin itafika $80K wiki hii?',category:'crypto', option_a:'YES',option_b:'NO',closes_at:new Date(Date.now()+86400000*4).toISOString(), total_staked_kes:389000,resolved:false},
  {id:'3',question:'Will Safaricom stock surge after earnings?',  question_swahili:'Je, Safaricom itapanda baada ya matokeo?',category:'stocks', option_a:'YES',option_b:'NO',closes_at:new Date(Date.now()+86400000*14).toISOString(),total_staked_kes:128000,resolved:false},
  {id:'4',question:'Will Kenya beat Ethiopia in next match?',     question_swahili:'Je, Kenya itashinda Ethiopia?',category:'sports', option_a:'YES',option_b:'NO',closes_at:new Date(Date.now()+86400000*5).toISOString(), total_staked_kes:97000, resolved:false},
  {id:'5',question:'Will CBK keep interest rates unchanged?',     question_swahili:'Je, CBK itaacha riba bila mabadiliko?',category:'economics',option_a:'YES',option_b:'NO',closes_at:new Date(Date.now()+86400000*21).toISOString(),total_staked_kes:167000,resolved:false},
  {id:'6',question:'Will fuel prices increase next review?',      question_swahili:'Je, bei ya mafuta itaongezeka?',category:'economics',option_a:'YES',option_b:'NO',closes_at:new Date(Date.now()+86400000*10).toISOString(),total_staked_kes:203000,resolved:false},
]

const CAT_ICON  = {forex:'💱',crypto:'🪙',stocks:'📈',sports:'⚽',economics:'🏦',weather:'🌦️'}
const CAT_COLOR = {forex:'gold',crypto:'gold',stocks:'blue',sports:'green',economics:'silver',weather:'blue'}

function timeLeft(d) {
  const diff = new Date(d) - new Date()
  if (diff <= 0) return 'Closed'
  const days  = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `${days}d ${hours}h`
  return `${hours}h left`
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

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: p } = await supabase.from('predictions').select('*').eq('resolved', false).order('total_staked_kes', { ascending: false })
    const { data: s } = await supabase.from('stakes').select('*').eq('user_id', session.user.id)
    setPreds(p?.length ? p : DEMO)
    const map = {}
    s?.forEach(st => { map[st.prediction_id] = st })
    setMyStakes(map)
    setLoading(false)
  }, [session])

  useEffect(() => { fetchData() }, [fetchData])

  const handleStake = async (predId) => {
    const choice = selected[predId]
    const amount = parseFloat(amounts[predId])
    if (!choice) return setMsgs(m => ({ ...m, [predId]: { type: 'error', text: 'Choose YES or NO first' } }))
    if (!amount || amount < 50) return setMsgs(m => ({ ...m, [predId]: { type: 'error', text: 'Minimum stake KSh 50' } }))
    setStaking(s => ({ ...s, [predId]: true }))
    const { error } = await supabase.from('stakes').insert({ user_id: session.user.id, prediction_id: predId, choice, amount_kes: amount })
    if (!error) {
      const pred = preds.find(p => p.id === predId)
      if (pred) await supabase.from('predictions').update({ total_staked_kes: (pred.total_staked_kes || 0) + amount }).eq('id', predId)
      setMsgs(m => ({ ...m, [predId]: { type: 'success', text: `✅ Staked KSh ${amount} on ${choice}!` } }))
      setSelected(s => ({ ...s, [predId]: null }))
      setAmounts(a => ({ ...a, [predId]: '' }))
      fetchData()
    } else {
      setMsgs(m => ({ ...m, [predId]: { type: 'error', text: error.message } }))
    }
    setStaking(s => ({ ...s, [predId]: false }))
  }

  const totalPool = preds.reduce((a, p) => a + (p.total_staked_kes || 0), 0)
  const filtered  = filter === 'all' ? preds : preds.filter(p => p.category === filter)

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="page-header">
        <h1>Predictions</h1>
        <p>Stake KSh on Kenyan market outcomes — powered by AI</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total Pool',   val: `KSh ${(totalPool/1000).toFixed(0)}K`, icon: '💰', col: 'var(--gold-bright)' },
          { label: 'Open Markets', val: preds.length,                           icon: '🎯', col: 'var(--blue)' },
          { label: 'My Stakes',    val: Object.keys(myStakes).length,           icon: '🏆', col: 'var(--green)' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '12px 10px', textAlign: 'center', minWidth: 0,
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(14px,4vw,20px)', fontWeight: 700, color: s.col }}>{s.val}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {['all', 'forex', 'crypto', 'economics', 'sports'].map(f => (
            <button key={f}
              style={{
                padding: '6px 11px', fontSize: 11, fontWeight: 600,
                borderRadius: 8, cursor: 'pointer', border: '1px solid',
                fontFamily: 'var(--font-body)', textTransform: 'capitalize',
                background: filter === f ? 'linear-gradient(135deg,var(--gold),var(--gold-bright))' : 'transparent',
                borderColor: filter === f ? 'transparent' : 'var(--border-light)',
                color: filter === f ? '#09080a' : 'var(--text-secondary)',
              }}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {['en', 'sw'].map(l => (
            <button key={l}
              style={{
                padding: '6px 10px', fontSize: 11, fontWeight: 700,
                borderRadius: 8, cursor: 'pointer', border: '1px solid',
                fontFamily: 'var(--font-body)', textTransform: 'uppercase',
                background: lang === l ? 'linear-gradient(135deg,var(--gold),var(--gold-bright))' : 'transparent',
                borderColor: lang === l ? 'transparent' : 'var(--border-light)',
                color: lang === l ? '#09080a' : 'var(--text-secondary)',
              }}
              onClick={() => setLang(l)}>{l}</button>
          ))}
          <button onClick={fetchData}
            style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Prediction cards */}
      {loading ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Target size={20} /></div>
          <h3>Loading predictions...</h3>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Target size={20} /></div>
          <h3>No predictions found</h3>
          <p>Try a different filter</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(p => {
            const myStake  = myStakes[p.id]
            const q        = lang === 'sw' && p.question_swahili ? p.question_swahili : p.question
            const cat      = p.category || 'forex'
            const tLeft    = timeLeft(p.closes_at)
            const isUrgent = tLeft.includes('h') && !tLeft.includes('d')
            const pool     = p.total_staked_kes || 0
            const yesPct   = 58 // default visual split
            const noPct    = 42
            const msg      = msgs[p.id]

            return (
              <div key={p.id} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 16, overflow: 'hidden',
                width: '100%', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}>
                {/* Card header */}
                <div style={{ padding: '14px 16px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9, gap: 8 }}>
                    <span className={`tag ${CAT_COLOR[cat] || 'gold'}`}>
                      {CAT_ICON[cat]} {cat}
                    </span>
                    <span style={{ fontSize: 11, color: isUrgent ? 'var(--red)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <Clock size={11} /> {tLeft}
                    </span>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 10 }}>{q}</div>

                  {/* Odds bar */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>
                      <span style={{ color: 'var(--green)' }}>YES {yesPct}%</span>
                      <span style={{ color: 'var(--red)' }}>NO {noPct}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${yesPct}%`, background: 'var(--green)', borderRadius: '99px 0 0 99px' }} />
                      <div style={{ width: `${noPct}%`, background: 'var(--red)', borderRadius: '0 99px 99px 0' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>Pool: <strong style={{ color: 'var(--gold-bright)', fontFamily: 'var(--font-mono)' }}>KSh {pool.toLocaleString()}</strong></span>
                    <span>Closes {new Date(p.closes_at).toLocaleDateString('en-KE')}</span>
                  </div>
                </div>

                {/* Stake area */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
                  {myStake ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 12px', borderRadius: 10,
                      background: 'var(--green-glow)', border: '1px solid rgba(34,195,122,0.25)',
                    }}>
                      <Trophy size={14} color="var(--green)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'var(--green)' }}>
                        You staked <strong>KSh {myStake.amount_kes}</strong> on <strong>{myStake.choice}</strong>
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* YES/NO buttons */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        {[p.option_a, p.option_b].map(opt => {
                          const isYes = opt === p.option_a
                          const isSel = selected[p.id] === opt
                          return (
                            <button key={opt}
                              style={{
                                flex: 1, padding: '10px 8px', borderRadius: 9,
                                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                border: `1px solid ${isSel ? (isYes ? 'rgba(34,195,122,0.5)' : 'rgba(232,64,96,0.5)') : 'var(--border-light)'}`,
                                background: isSel ? (isYes ? 'var(--green-glow)' : 'var(--red-glow)') : 'var(--bg-raised)',
                                color: isSel ? (isYes ? 'var(--green)' : 'var(--red)') : 'var(--text-secondary)',
                                transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                              }}
                              onClick={e => { e.stopPropagation(); setSelected(s => ({ ...s, [p.id]: opt })) }}>
                              {isYes ? '✅' : '❌'} {opt}
                            </button>
                          )
                        })}
                      </div>

                      {/* Amount input */}
                      {selected[p.id] && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                            {[100, 500, 1000, 2000].map(amt => (
                              <button key={amt}
                                style={{
                                  flex: 1, padding: '6px 2px', fontSize: 11, fontWeight: 600,
                                  borderRadius: 7, cursor: 'pointer', border: '1px solid var(--border-light)',
                                  background: 'transparent', color: 'var(--text-secondary)',
                                  fontFamily: 'var(--font-body)',
                                  minWidth: 0,
                                }}
                                onClick={e => { e.stopPropagation(); setAmounts(a => ({ ...a, [p.id]: String(amt) })) }}>
                                {amt}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                            <input
                              style={{
                                flex: 1, padding: '10px 12px', fontSize: 13,
                                background: 'var(--bg-raised)', border: '1px solid var(--border-light)',
                                borderRadius: 9, color: 'var(--text-primary)', outline: 'none',
                                fontFamily: 'var(--font-body)', minWidth: 0,
                              }}
                              type="number" placeholder="KSh amount"
                              value={amounts[p.id] || ''}
                              onChange={e => setAmounts(a => ({ ...a, [p.id]: e.target.value }))}
                            />
                            <button
                              style={{
                                padding: '10px 16px', flexShrink: 0,
                                background: 'linear-gradient(135deg,var(--gold),var(--gold-bright))',
                                border: 'none', borderRadius: 9,
                                color: '#09080a', fontSize: 13, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'var(--font-body)',
                                display: 'flex', alignItems: 'center', gap: 5,
                              }}
                              disabled={staking[p.id]}
                              onClick={e => { e.stopPropagation(); handleStake(p.id) }}>
                              {staking[p.id] ? '...' : <>Stake <ChevronRight size={13} /></>}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {msg && (
                    <div style={{
                      marginTop: 8, padding: '8px 12px', borderRadius: 8, fontSize: 12,
                      background: msg.type === 'error' ? 'var(--red-glow)' : 'var(--green-glow)',
                      color: msg.type === 'error' ? 'var(--red)' : 'var(--green)',
                      border: `1px solid ${msg.type === 'error' ? 'rgba(232,64,96,0.25)' : 'rgba(34,195,122,0.25)'}`,
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
