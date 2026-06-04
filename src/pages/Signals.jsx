import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Zap, RefreshCw } from 'lucide-react'

const DEMO_SIGNALS = [
  { id: 1, symbol: 'BTC/USDT', market: 'crypto', action: 'BUY', confidence: 84, entry_price: 67200, target_price: 69500, stop_loss: 65800, reasoning_english: 'Strong bullish momentum detected. RSI oversold recovery + positive sentiment on social media.', reasoning_swahili: 'BTC inaonyesha nguvu ya kupanda. Ishara za kiufundi zinaonyesha wakati mzuri wa kununua.', created_at: new Date().toISOString() },
  { id: 2, symbol: 'EUR/USD', market: 'forex', action: 'SELL', confidence: 71, entry_price: 1.0842, target_price: 1.0780, stop_loss: 1.0890, reasoning_english: 'USD strengthening on Fed hawkish signals. EUR facing resistance at 1.085.', reasoning_swahili: 'Dola inaimarika. EUR inakabiliwa na upinzani mkubwa. Fikiria kuuza.', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, symbol: 'XAU/USD', market: 'commodities', action: 'BUY', confidence: 78, entry_price: 2341, target_price: 2380, stop_loss: 2310, reasoning_english: 'Gold safe haven demand rising. Geopolitical tensions and inflation fears supporting price.', reasoning_swahili: 'Dhahabu inapanda kwa sababu ya wasiwasi wa kiuchumi duniani. Wakati mzuri wa kununua.', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 4, symbol: 'ETH/USDT', market: 'crypto', action: 'HOLD', confidence: 55, entry_price: 3521, target_price: 3600, stop_loss: 3400, reasoning_english: 'Market consolidating. Wait for clear breakout above 3600 before entering.', reasoning_swahili: 'Soko liko imara sasa. Subiri ishara wazi kabla ya kuingia.', created_at: new Date(Date.now() - 10800000).toISOString() },
  { id: 5, symbol: 'GBP/USD', market: 'forex', action: 'BUY', confidence: 67, entry_price: 1.2651, target_price: 1.2720, stop_loss: 1.2600, reasoning_english: 'UK inflation data better than expected. GBP showing strength against USD.', reasoning_swahili: 'Pauni inaonyesha nguvu. Takwimu za uchumi wa Uingereza ni nzuri.', created_at: new Date(Date.now() - 14400000).toISOString() },
]

export default function Signals() {
  const [signals, setSignals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [lang, setLang] = useState('en')

  useEffect(() => {
    fetchSignals()
    const channel = supabase.channel('signals-page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'signals' }, payload => {
        setSignals(prev => [payload.new, ...prev])
      }).subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const fetchSignals = async () => {
    setLoading(true)
    const { data } = await supabase.from('signals').select('*').order('created_at', { ascending: false }).limit(50)
    setSignals(data?.length ? data : DEMO_SIGNALS)
    setLoading(false)
  }

  const filtered = filter === 'all' ? signals : signals.filter(s => s.market === filter || s.action === filter.toUpperCase())

  const confClass = (c) => c >= 75 ? '' : c >= 55 ? 'mid' : 'low'

  return (
    <div>
      <div className="page-header">
        <h1>AI Signals</h1>
        <p>Real-time trading signals powered by AkiliTrade AI engine</p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'crypto', 'forex', 'commodities', 'BUY', 'SELL'].map(f => (
          <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '7px 14px', fontSize: 12, textTransform: 'capitalize' }}
            onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className={`btn ${lang === 'en' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => setLang('en')}>English</button>
          <button className={`btn ${lang === 'sw' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => setLang('sw')}>Kiswahili</button>
          <button className="btn btn-outline" style={{ padding: '7px 12px', fontSize: 12 }} onClick={fetchSignals}><RefreshCw size={13} /></button>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {['BUY', 'SELL', 'HOLD'].map(action => {
          const count = signals.filter(s => s.action === action).length
          const color = action === 'BUY' ? 'var(--accent)' : action === 'SELL' ? 'var(--red)' : 'var(--yellow)'
          return (
            <div key={action} className="card" style={{ flex: 1, textAlign: 'center', padding: '14px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color }}>{count}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{action} Signals</div>
            </div>
          )
        })}
      </div>

      {/* Signal cards */}
      {loading ? (
        <div className="empty-state"><Zap size={32} /><h3>Loading signals...</h3></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><Zap size={32} /><h3>No signals found</h3><p>Try a different filter</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(s => (
            <div key={s.id} className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span className={`signal-badge ${s.action?.toLowerCase()}`} style={{ marginTop: 2 }}>{s.action}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17 }}>{s.symbol}</span>
                    <span className={`tag ${s.market === 'crypto' ? 'blue' : s.market === 'forex' ? 'yellow' : 'green'}`}>{s.market}</span>
                    <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 'auto' }}>{new Date(s.created_at).toLocaleTimeString()}</span>
                  </div>

                  {/* AI Reasoning */}
                  <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.5 }}>
                    {lang === 'en' ? s.reasoning_english : s.reasoning_swahili}
                  </p>

                  {/* Price targets */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                    {[
                      { label: 'Entry', val: s.entry_price, color: 'var(--text)' },
                      { label: 'Target 🎯', val: s.target_price, color: 'var(--accent)' },
                      { label: 'Stop Loss 🛡️', val: s.stop_loss, color: 'var(--red)' },
                    ].map(p => (
                      <div key={p.label} style={{ fontSize: 12 }}>
                        <span style={{ color: 'var(--text2)', marginRight: 4 }}>{p.label}:</span>
                        <span style={{ color: p.color, fontWeight: 700 }}>{p.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Confidence bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--text2)', width: 90 }}>AI Confidence</div>
                    <div className="conf-bar" style={{ flex: 1 }}>
                      <div className={`conf-fill ${confClass(s.confidence)}`} style={{ width: `${s.confidence}%` }}></div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', width: 40, textAlign: 'right' }}>{s.confidence}%</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
