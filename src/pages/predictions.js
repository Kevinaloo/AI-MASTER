import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Target } from 'lucide-react'

const DEMO_PREDICTIONS = [
  { id: '1', question: 'Will USD/KES go above 130 this week?', question_swahili: 'Je, dola itapita shilingi 130 wiki hii?', category: 'forex', option_a: 'YES', option_b: 'NO', closes_at: new Date(Date.now() + 86400000 * 3).toISOString(), total_staked_kes: 45000, resolved: false },
  { id: '2', question: 'Will Safaricom stock rise this month?', question_swahili: 'Je, hisa za Safaricom zitapanda mwezi huu?', category: 'stocks', option_a: 'YES', option_b: 'NO', closes_at: new Date(Date.now() + 86400000 * 20).toISOString(), total_staked_kes: 128000, resolved: false },
  { id: '3', question: 'Will it rain in Nairobi this weekend?', question_swahili: 'Je, itanyesha Nairobi wikendi hii?', category: 'weather', option_a: 'YES', option_b: 'NO', closes_at: new Date(Date.now() + 86400000 * 2).toISOString(), total_staked_kes: 22500, resolved: false },
  { id: '4', question: 'Will CBK raise interest rates in next meeting?', question_swahili: 'Je, CBK itaongeza riba mkutano ujao?', category: 'economics', option_a: 'YES', option_b: 'NO', closes_at: new Date(Date.now() + 86400000 * 14).toISOString(), total_staked_kes: 89000, resolved: false },
  { id: '5', question: 'Will Harambee Stars win next match?', question_swahili: 'Je, Harambee Stars watashinda mchezo ujao?', category: 'sports', option_a: 'YES', option_b: 'NO', closes_at: new Date(Date.now() + 86400000 * 5).toISOString(), total_staked_kes: 67000, resolved: false },
  { id: '6', question: 'Will fuel prices increase next review?', question_swahili: 'Je, bei ya mafuta itaongezeka mapitio yajayo?', category: 'economics', option_a: 'YES', option_b: 'NO', closes_at: new Date(Date.now() + 86400000 * 10).toISOString(), total_staked_kes: 156000, resolved: false },
]

const catColor = { forex: 'yellow', stocks: 'blue', weather: 'green', economics: 'red', sports: 'blue' }

export default function Predictions({ session }) {
  const [predictions, setPredictions] = useState([])
  const [stakes, setStakes] = useState({})
  const [selected, setSelected] = useState({})
  const [stakeAmount, setStakeAmount] = useState({})
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState('en')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: p } = await supabase.from('predictions').select('*').eq('resolved', false).order('created_at', { ascending: false })
    const { data: s } = await supabase.from('stakes').select('*').eq('user_id', session.user.id)
    setPredictions(p?.length ? p : DEMO_PREDICTIONS)
    const stakeMap = {}
    s?.forEach(stake => { stakeMap[stake.prediction_id] = stake })
    setStakes(stakeMap)
    setLoading(false)
  }

  const handleStake = async (predId) => {
    const choice = selected[predId]
    const amount = parseFloat(stakeAmount[predId])
    if (!choice || !amount || amount < 50) return alert('Select an option and enter at least KSh 50')
    const { error } = await supabase.from('stakes').insert({ user_id: session.user.id, prediction_id: predId, choice, amount_kes: amount })
    if (!error) {
      alert(`Stake placed! KSh ${amount} on ${choice}`)
      fetchData()
    } else alert('Error placing stake: ' + error.message)
  }

  const daysLeft = (date) => {
    const diff = new Date(date) - new Date()
    const days = Math.floor(diff / 86400000)
    return days <= 0 ? 'Closes today' : `${days} day${days > 1 ? 's' : ''} left`
  }

  return (
    <div>
      <div className="page-header">
        <h1>Prediction Markets</h1>
        <p>Predict Kenyan market outcomes and win — powered by AI</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <div className="card" style={{ flex: 1, padding: '14px 16px', display: 'flex', gap: 20 }}>
          <div><div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Total Staked Today</div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--accent)' }}>KSh {(predictions.reduce((a, p) => a + (p.total_staked_kes || 0), 0)).toLocaleString()}</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Open Markets</div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>{predictions.length}</div></div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className={`btn ${lang === 'en' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setLang('en')}>EN</button>
            <button className={`btn ${lang === 'sw' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setLang('sw')}>SW</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><Target size={32} /><h3>Loading predictions...</h3></div>
      ) : (
        <div className="prediction-grid">
          {predictions.map(p => {
            const userStake = stakes[p.id]
            const question = lang === 'en' ? p.question : (p.question_swahili || p.question)
            return (
              <div key={p.id} className="prediction-card">
                <div className="prediction-category">
                  <span className={`tag ${catColor[p.category] || 'blue'}`}>{p.category}</span>
                  <span style={{ marginLeft: 8 }}>{daysLeft(p.closes_at)}</span>
                </div>
                <div className="prediction-question">{question}</div>

                {userStake ? (
                  <div style={{ background: 'var(--accent-glow)', border: '1px solid rgba(0,229,160,0.3)', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                    ✅ You staked <strong>KSh {userStake.amount_kes}</strong> on <strong>{userStake.choice}</strong>
                  </div>
                ) : (
                  <>
                    <div className="prediction-options">
                      {[p.option_a, p.option_b].map(opt => (
                        <div key={opt} className={`pred-opt ${selected[p.id] === opt ? 'selected' : ''}`} onClick={() => setSelected(s => ({ ...s, [p.id]: opt }))}>
                          {opt}
                        </div>
                      ))}
                    </div>
                    {selected[p.id] && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <input className="form-input" placeholder="Stake amount (KSh)" type="number" min="50"
                          value={stakeAmount[p.id] || ''} onChange={e => setStakeAmount(s => ({ ...s, [p.id]: e.target.value }))}
                          style={{ fontSize: 13, padding: '8px 12px' }} />
                        <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13, whiteSpace: 'nowrap' }} onClick={() => handleStake(p.id)}>
                          Stake
                        </button>
                      </div>
                    )}
                  </>
                )}

                <div className="prediction-meta">
                  <span>Pool: <strong>KSh {p.total_staked_kes?.toLocaleString()}</strong></span>
                  <span>Closes: {new Date(p.closes_at).toLocaleDateString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
