import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'

export default function Trades({ session }) {
  const [trades, setTrades]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  useEffect(() => { fetchTrades() }, [])

  const fetchTrades = async () => {
    setLoading(true)
    const { data } = await supabase.from('trades').select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    setTrades(data || [])
    setLoading(false)
  }

  const filtered = filter === 'all' ? trades : trades.filter(t => t.status === filter)
  const totalProfit = trades.reduce((a, t) => a + (t.profit_kes || 0), 0)
  const wins = trades.filter(t => (t.profit_kes || 0) > 0).length
  const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(0) : 0

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="page-header">
        <h1>My Trades</h1>
        <p>All trades executed by your AI bot</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Profit', val: `KSh ${totalProfit.toLocaleString()}`, col: totalProfit >= 0 ? 'var(--green)' : 'var(--red)', accent: totalProfit >= 0 ? 'var(--green)' : 'var(--red)' },
          { label: 'Win Rate',     val: `${winRate}%`,                          col: 'var(--gold-bright)', accent: 'var(--gold)' },
          { label: 'Total Trades', val: trades.length,                          col: 'var(--blue)', accent: 'var(--blue)' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '16px', position: 'relative', overflow: 'hidden', minWidth: 0,
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: s.accent }} />
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(16px,4vw,22px)', fontWeight: 700, color: s.col }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'open', 'closed', 'cancelled'].map(f => (
          <button key={f}
            style={{
              padding: '7px 13px', fontSize: 11, fontWeight: 600,
              borderRadius: 8, cursor: 'pointer', border: '1px solid',
              fontFamily: 'var(--font-body)', textTransform: 'capitalize',
              background: filter === f ? 'linear-gradient(135deg,var(--gold),var(--gold-bright))' : 'transparent',
              borderColor: filter === f ? 'transparent' : 'var(--border-light)',
              color: filter === f ? '#09080a' : 'var(--text-secondary)',
            }}
            onClick={() => setFilter(f)}>{f}</button>
        ))}
        <button onClick={fetchTrades}
          style={{ marginLeft: 'auto', padding: '7px 10px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Trade cards — cards instead of table for mobile */}
      {loading ? (
        <div className="empty-state">
          <div className="empty-state-icon"><TrendingUp size={20} /></div>
          <h3>Loading trades...</h3>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><TrendingUp size={20} /></div>
          <h3>No trades yet</h3>
          <p>Fund your wallet and the AI bot will start trading</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {filtered.map(t => {
            const isUp = (t.profit_kes || 0) >= 0
            return (
              <div key={t.id} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '14px 16px',
                width: '100%', boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}>
                {/* Row 1: symbol + status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: isUp ? 'rgba(34,195,122,0.1)' : 'rgba(232,64,96,0.1)',
                      border: `1px solid ${isUp ? 'rgba(34,195,122,0.2)' : 'rgba(232,64,96,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                      {t.market === 'crypto' ? '🪙' : t.market === 'forex' ? '💱' : '📊'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{t.symbol}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{new Date(t.created_at).toLocaleDateString('en-KE')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                      background: t.trade_type === 'BUY' ? 'rgba(34,195,122,0.12)' : 'rgba(232,64,96,0.12)',
                      color: t.trade_type === 'BUY' ? 'var(--green)' : 'var(--red)' }}>
                      {t.trade_type}
                    </span>
                    <span className={`tag ${t.status === 'open' ? 'gold' : t.status === 'closed' ? 'silver' : 'red'}`}>
                      {t.status}
                    </span>
                  </div>
                </div>

                {/* Row 2: price info */}
                <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  {[
                    { label: 'Amount',  val: `KSh ${(t.amount_kes||0).toLocaleString()}`,   col: 'var(--text-primary)' },
                    { label: 'Entry',   val: t.entry_price || '—',                            col: 'var(--text-secondary)' },
                    { label: 'Profit',  val: `${isUp?'+':''}KSh ${(t.profit_kes||0).toLocaleString()}`, col: isUp?'var(--green)':'var(--red)' },
                  ].map((item, i) => (
                    <div key={i} style={{ flex: 1, textAlign: i === 2 ? 'right' : i === 1 ? 'center' : 'left' }}>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{item.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: item.col }}>{item.val}</div>
                    </div>
                  ))}
                </div>

                {/* Confidence bar */}
                {t.ai_confidence && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span>AI Confidence</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-bright)' }}>{t.ai_confidence}%</span>
                    </div>
                    <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${t.ai_confidence}%`, height: '100%', background: 'linear-gradient(90deg,var(--gold),var(--gold-bright))', borderRadius: 99 }} />
                    </div>
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
