import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Target, Clock, TrendingUp, Trophy, RefreshCw, ChevronRight } from 'lucide-react'

const DEMO_PREDICTIONS = [
  { id: '1', question: 'Will USD/KES go above 130 this week?', question_swahili: 'Je, dola itapita shilingi 130 wiki hii?', category: 'forex', option_a: 'YES', option_b: 'NO', closes_at: new Date(Date.now() + 86400000 * 3).toISOString(), total_staked_kes: 45000, resolved: false },
  { id: '2', question: 'Will Safaricom stock rise this week on NSE?', question_swahili: 'Je, hisa za Safaricom zitapanda wiki hii NSE?', category: 'stocks', option_a: 'YES', option_b: 'NO', closes_at: new Date(Date.now() + 86400000 * 7).toISOString(), total_staked_kes: 128000, resolved: false },
  { id: '3', question: 'Will it rain in Nairobi more than 3 days this week?', question_swahili: 'Je, itanyesha Nairobi zaidi ya siku 3 wiki hii?', category: 'weather', option_a: 'YES', option_b: 'NO', closes_at: new Date(Date.now() + 86400000 * 2).toISOString(), total_staked_kes: 22500, resolved: false },
  { id: '4', question: 'Will CBK keep interest rates unchanged next meeting?', question_swahili: 'Je, CBK itaacha riba bila mabadiliko mkutano ujao?', category: 'economics', option_a: 'YES', option_b: 'NO', closes_at: new Date(Date.now() + 86400000 * 14).toISOString(), total_staked_kes: 89000, resolved: false },
  { id: '5', question: 'Will Gor Mahia win their next FKF league match?', question_swahili: 'Je, Gor Mahia watashinda mchezo wao ujao wa FKF?', category: 'sports', option_a: 'YES', option_b: 'NO', closes_at: new Date(Date.now() + 86400000 * 5).toISOString(), total_staked_kes: 67000, resolved: false },
  { id: '6', question: 'Will Bitcoin be above $70,000 by end of this week?', question_swahili: 'Je, Bitcoin itakuwa juu ya $70,000 mwishoni mwa wiki hii?', category: 'crypto', option_a: 'YES', option_b: 'NO', closes_at: new Date(Date.now() + 86400000 * 7).toISOString(), total_staked_kes: 156000, resolved: false },
  { id: '7', question: 'Will Kenya fuel prices increase in the next review?', question_swahili: 'Je, bei ya mafuta Kenya itaongezeka mapitio yajayo?', category: 'economics', option_a: 'YES', option_b: 'NO', closes_at: new Date(Date.now() + 86400000 * 10).toISOString(), total_staked_kes: 203000, resolved: false },
  { id: '8', question: 'Will Harambee Stars score in their next match?', question_swahili: 'Je, Harambee Stars watafunga goli mchezo ujao?', category: 'sports', option_a: 'YES', option_b: 'NO', closes_at: new Date(Date.now() + 86400000 * 4).toISOString(), total_staked_kes: 54000, resolved: false },
]

const CAT_COLORS = { forex: 'yellow', stocks: 'blue', weather: 'green', economics: 'red', sports: 'blue', crypto: 'yellow' }
const CAT_EMOJI = { forex: '💱', stocks: '📈', weather: '🌦️', economics: '🏦', sports: '⚽', crypto: '🪙' }

function timeLeft(dateStr) {
  const diff = new Date(dateStr) - new Date()
  if (diff <= 0) return 'Closed'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `${days}d ${hours}h left`
  return `${hours}h left`
}

function OddsBar({ yesStake, noStake }) {
  const total = yesStake + noStake
  const yesPct = total > 0 ? Math.round((yesStake / total) * 100) : 50
  const noPct = 100 - yesPct
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>
        <span style={{ color: 'var(--accent)' }}>YES {yesPct}%</span>
        <span style={{ color: 'var(--red)' }}>NO {noPct}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${yesPct}%`, background: 'var(--accent)', borderRadius: '99px 0 0 99px', transition: 'width 0.5s' }} />
        <div style={{ width: `${noPct}%`, background: 'var(--red)', borderRadius: '0 99px 99px 0', transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

export default function Predictions({ session }) {
  const [predictions, setPredictions] = useState([])
  const [myStakes, setMyStakes] = useState({})
  const [selected, setSelected] = useState({})
  const [stakeAmount, setStakeAmount] = useState({})
  const [loading, setLoading] = useState(true)
  const [staking, setStaking] = useState({})
  const [lang, setLang] = useState('en')
  const [filter, setFilter] = useState('all')
  const [msg, setMsg] = useState({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: p } = await supabase.from('predictions').select('*').eq('resolved', false).order('total_staked_kes', { ascending: false })
    const { data: s } = await supabase.from('stakes').select('*').eq('user_id', session.user.id)
    setPredictions(p?.length ? p : DEMO_PREDICTIONS)
    const map = {}
    s?.forEach(stake => { map[stake.prediction_id] = stake })
    setMyStakes(map)
    setLoading(false)
  }, [session])

  useEffect(() => {
    fetchData()
    const channel = supabase.channel('predictions-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, fetchData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stakes' }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchData])

  const handleStake = async (predId) => {
    const choice = selected[predId]
    const amount = parseFloat(stakeAmount[predId])
    if (!choice) return setMsg({ [predId]: { type: 'error', text: 'Choose YES or NO first' } })
    if (!amount || amount < 50) return setMsg({ [predId]: { type: 'error', text: 'Minimum stake is KSh 50' } })

    setStaking(s => ({ ...s, [predId]: true }))
    setMsg({})

    const { error } = await supabase.from('stakes').insert({
      user_id: session.user.id,
      prediction_id: predId,
      choice,
      amount_kes: amount
    })

    if (!error) {
      // Update total staked
      const pred = predictions.find(p => p.id === predId)
      if (pred) {
        await supabase.from('predictions').update({
          total_staked_kes: (pred.total_staked_kes || 0) + amount
        }).eq('id', predId)
      }
      setMsg({ [predId]: { type: 'success', text: `✅ KSh ${amount} staked on ${choice}!` } })
      setSelected(s => ({ ...s, [predId]: null }))
      setStakeAmount(s => ({ ...s, [predId]: '' }))
      fetchData()
    } else {
      setMsg({ [predId]: { type: 'error', text: error.message } })
    }
    setStaking(s => ({ ...s, [predId]: false }))
  }

  const filtered = filter === 'all' ? predictions : predictions.filter(p => p.category === filter)
  const totalPool = predictions.reduce((a, p) => a + (p.total_staked_kes || 0), 0)
  const myStakeCount = Object.keys(myStakes).length

  return (
    <div>
      <div className="page-header">
        <h1>Prediction Markets</h1>
        <p>Predict Kenyan outcomes and earn — powered by AI auto-resolution</p>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Pool', value: `KSh ${(totalPool/1000).toFixed(0)}K`, color: 'var(--accent)', icon: '💰' },
          { label: 'Open Markets', value: predictions.length, color: 'var(--blue)', icon: '🎯' },
          { label: 'My Stakes', value: myStakeCount, color: 'var(--yellow)', icon: '🏆' },
        ].map(s => (
          <div key={s.label} className="card" style={{ flex: 1, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'forex', 'crypto', 'economics', 'stocks', 'sports', 'weather'].map(f => (
          <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '7px 12px', fontSize: 12, textTransform: 'capitalize' }}
            onClick={() => setFilter(f)}>
            {CAT_EMOJI[f] || '🌍'} {f}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className={`btn ${lang === 'en' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '7px 10px', fontSize: 12 }} onClick={() => setLang('en')}>EN</button>
          <button className={`btn ${lang === 'sw' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '7px 10px', fontSize: 12 }} onClick={() => setLang('sw')}>SW</button>
          <button className="btn btn-outline" style={{ padding: '7px 10px', fontSize: 12 }} onClick={fetchData}><RefreshCw size={13} /></button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><Target size={32} /><h3>Loading predictions...</h3></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><Target size={32} /><h3>No predictions in this category</h3></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {filtered.map(p => {
            const myStake = myStakes[p.id]
            const question = lang === 'sw' && p.question_swahili ? p.question_swahili : p.question
            const timeStr = timeLeft(p.closes_at)
            const isUrgent = timeStr.includes('h') && !timeStr.includes('d')
            const m = msg[p.id]

            return (
              <div key={p.id} className="card" style={{ padding: '18px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span className={`tag ${CAT_COLORS[p.category] || 'blue'}`}>
                    {CAT_EMOJI[p.category]} {p.category}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: isUrgent ? 'var(--red)' : 'var(--text2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} />{timeStr}
                  </span>
                </div>

                {/* Question */}
                <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4, marginBottom: 12 }}>{question}</div>

                {/* Odds bar */}
                <OddsBar yesStake={p.total_staked_kes * 0.55} noStake={p.total_staked_kes * 0.45} />

                {/* Pool */}
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TrendingUp size={12} />
                  Pool: <strong style={{ color: 'var(--accent)', marginLeft: 3 }}>KSh {p.total_staked_kes?.toLocaleString()}</strong>
                </div>

                {/* Already staked */}
                {myStake ? (
                  <div style={{ background: 'var(--accent-glow)', border: '1px solid rgba(0,229,160,0.3)', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                    <Trophy size={13} style={{ marginRight: 6, color: 'var(--accent)' }} />
                    You staked <strong>KSh {myStake.amount_kes}</strong> on <strong style={{ color: 'var(--accent)' }}>{myStake.choice}</strong>
                  </div>
                ) : (
                  <>
                    {/* Option buttons */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      {[p.option_a, p.option_b].map(opt => (
                        <button key={opt}
                          className={`btn ${selected[p.id] === opt ? 'btn-primary' : 'btn-outline'}`}
                          style={{ flex: 1, justifyContent: 'center', padding: '9px', fontSize: 13 }}
                          onClick={() => setSelected(s => ({ ...s, [p.id]: opt }))}>
                          {opt === p.option_a ? '✅' : '❌'} {opt}
                        </button>
                      ))}
                    </div>

                    {/* Stake amount */}
                    {selected[p.id] && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                          {[100, 500, 1000, 2000].map(amt => (
                            <button key={amt} className="btn btn-outline"
                              style={{ flex: 1, padding: '5px', fontSize: 11 }}
                              onClick={() => setStakeAmount(s => ({ ...s, [p.id]: String(amt) }))}>
                              {amt}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input className="form-input" type="number" placeholder="KSh amount"
                            value={stakeAmount[p.id] || ''}
                            onChange={e => setStakeAmount(s => ({ ...s, [p.id]: e.target.value }))}
                            style={{ fontSize: 13, padding: '8px 12px' }} />
                          <button className="btn btn-primary"
                            style={{ padding: '8px 14px', fontSize: 13, whiteSpace: 'nowrap' }}
                            onClick={() => handleStake(p.id)}
                            disabled={staking[p.id]}>
                            {staking[p.id] ? '...' : 'Stake'} <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Message */}
                {m && (
                  <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, fontSize: 12,
                    background: m.type === 'error' ? 'var(--red-glow)' : 'var(--accent-glow)',
                    color: m.type === 'error' ? 'var(--red)' : 'var(--accent)',
                    border: `1px solid ${m.type === 'error' ? 'rgba(255,75,110,0.3)' : 'rgba(0,229,160,0.3)'}` }}>
                    {m.text}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
