import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp } from 'lucide-react'

export default function Trades({ session }) {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchTrades() }, [])

  const fetchTrades = async () => {
    setLoading(true)
    const { data } = await supabase.from('trades').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    setTrades(data || [])
    setLoading(false)
  }

  const filtered = filter === 'all' ? trades : trades.filter(t => t.status === filter)
  const totalProfit = trades.reduce((a, t) => a + (t.profit_kes || 0), 0)
  const wins = trades.filter(t => t.profit_kes > 0).length
  const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(0) : 0

  return (
    <div>
      <div className="page-header">
        <h1>My Trades</h1>
        <p>All trades executed by your AI bot</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card green">
          <div className="stat-label">Total Profit</div>
          <div className="stat-value green">KSh {totalProfit.toLocaleString()}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Win Rate</div>
          <div className="stat-value blue">{winRate}%</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Total Trades</div>
          <div className="stat-value yellow">{trades.length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'open', 'closed', 'cancelled'].map(f => (
          <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '7px 14px', fontSize: 12, textTransform: 'capitalize' }} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><TrendingUp size={32} /><h3>Loading trades...</h3></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <TrendingUp size={32} />
            <h3>No trades yet</h3>
            <p>Fund your wallet and the AI bot will start trading automatically.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Symbol</th><th>Market</th><th>Type</th><th>Amount</th><th>Entry</th><th>Exit</th><th>Profit</th><th>Confidence</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--text2)', fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 700 }}>{t.symbol}</td>
                  <td><span className={`tag ${t.market === 'crypto' ? 'blue' : t.market === 'forex' ? 'yellow' : 'green'}`}>{t.market}</span></td>
                  <td><span className={`tag ${t.trade_type === 'BUY' ? 'green' : 'red'}`}>{t.trade_type}</span></td>
                  <td>KSh {t.amount_kes?.toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--font-display)' }}>{t.entry_price}</td>
                  <td style={{ fontFamily: 'var(--font-display)' }}>{t.exit_price || '—'}</td>
                  <td style={{ color: t.profit_kes >= 0 ? 'var(--accent)' : 'var(--red)', fontWeight: 700 }}>
                    {t.profit_kes != null ? `${t.profit_kes >= 0 ? '+' : ''}KSh ${t.profit_kes}` : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="conf-bar" style={{ width: 60 }}>
                        <div className="conf-fill" style={{ width: `${t.ai_confidence}%` }}></div>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{t.ai_confidence}%</span>
                    </div>
                  </td>
                  <td><span className={`tag ${t.status === 'open' ? 'green' : t.status === 'closed' ? 'blue' : 'yellow'}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
