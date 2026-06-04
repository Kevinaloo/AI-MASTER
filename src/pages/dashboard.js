import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, TrendingDown, Zap, Target, ArrowUpRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'

const TICKER_DATA = [
  { symbol: 'BTC/USDT', price: '67,432.10', change: '+2.4%', up: true },
  { symbol: 'ETH/USDT', price: '3,521.80', change: '+1.8%', up: true },
  { symbol: 'EUR/USD', price: '1.0842', change: '-0.3%', up: false },
  { symbol: 'GBP/USD', price: '1.2651', change: '+0.5%', up: true },
  { symbol: 'USD/KES', price: '129.45', change: '-0.2%', up: false },
  { symbol: 'XAU/USD', price: '2,341.50', change: '+0.9%', up: true },
  { symbol: 'BNB/USDT', price: '412.30', change: '+3.1%', up: true },
  { symbol: 'SOL/USDT', price: '178.90', change: '+4.2%', up: true },
]

const MOCK_CHART = [
  { time: '00:00', value: 12400 }, { time: '04:00', value: 13100 },
  { time: '08:00', value: 12800 }, { time: '12:00', value: 14200 },
  { time: '16:00', value: 13900 }, { time: '20:00', value: 15100 },
  { time: 'Now', value: 15800 },
]

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 8 }}>
        <div style={{ color: 'var(--accent)', fontWeight: 700 }}>KSh {payload[0].value.toLocaleString()}</div>
      </div>
    )
  }
  return null
}

export default function Dashboard({ session }) {
  const [signals, setSignals] = useState([])
  const [trades, setTrades] = useState([])
  const [wallet, setWallet] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('signals')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'signals' }, payload => {
        setSignals(prev => [payload.new, ...prev].slice(0, 5))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const fetchData = async () => {
    const { data: s } = await supabase.from('signals').select('*').order('created_at', { ascending: false }).limit(5)
    const { data: t } = await supabase.from('trades').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(5)
    const { data: w } = await supabase.from('wallets').select('*').eq('user_id', session.user.id).single()
    if (s) setSignals(s)
    if (t) setTrades(t)
    if (w) setWallet(w)
  }

  const balanceKes = wallet?.balance_kes || 0
  const totalProfit = wallet?.total_profit || 0
  const profitPct = wallet?.total_deposited > 0 ? ((totalProfit / wallet.total_deposited) * 100).toFixed(1) : 0

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Habari za masoko ya leo — {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker">
          {[...TICKER_DATA, ...TICKER_DATA].map((t, i) => (
            <div className="ticker-item" key={i}>
              <span className="ticker-symbol">{t.symbol}</span>
              <span className="ticker-price">{t.price}</span>
              <span className={`ticker-change ${t.up ? 'up' : 'down'}`}>{t.change}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-label">Wallet Balance</div>
          <div className="stat-value green">KSh {balanceKes.toLocaleString()}</div>
          <div className="stat-change">Total funds available</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Total Profit</div>
          <div className="stat-value blue">KSh {totalProfit.toLocaleString()}</div>
          <div className={`stat-change ${totalProfit >= 0 ? 'up' : 'down'}`}>
            {totalProfit >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {profitPct}% all time
          </div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Active Trades</div>
          <div className="stat-value yellow">{trades.filter(t => t.status === 'open').length}</div>
          <div className="stat-change">Running right now</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">AI Signals Today</div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{signals.length}</div>
          <div className="stat-change"><span className="live-dot" style={{ marginRight: 4 }}></span> Live updating</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Chart */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Portfolio Performance</div>
            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>+27.4% this week</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MOCK_CHART}>
              <XAxis dataKey="time" tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Live Signals */}
        <div className="card">
          <div className="section-header">
            <div className="section-title"><span className="live-dot"></span> Live AI Signals</div>
            <button className="btn btn-outline" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => navigate('/signals')}>
              View All <ArrowUpRight size={12} />
            </button>
          </div>
          {signals.length === 0 ? (
            <div className="empty-state">
              <Zap size={32} />
              <h3>No signals yet</h3>
              <p>AI is analyzing markets. Signals will appear here.</p>
            </div>
          ) : (
            <div className="signal-list">
              {signals.map(s => (
                <div className="signal-card" key={s.id}>
                  <span className={`signal-badge ${s.action?.toLowerCase()}`}>{s.action}</span>
                  <div className="signal-info">
                    <div className="signal-symbol">{s.symbol}</div>
                    <div className="signal-detail">{s.market} · {new Date(s.created_at).toLocaleTimeString()}</div>
                  </div>
                  <div className="signal-confidence">
                    <div className="confidence-val">{s.confidence}%</div>
                    <div className="confidence-label">confidence</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Trades */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">Recent Trades</div>
          <button className="btn btn-outline" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => navigate('/trades')}>
            View All <ArrowUpRight size={12} />
          </button>
        </div>
        {trades.length === 0 ? (
          <div className="empty-state">
            <Target size={32} />
            <h3>No trades yet</h3>
            <p>Your AI bot will execute trades automatically once funded.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th><th>Type</th><th>Market</th>
                <th>Amount (KSh)</th><th>Profit</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 700 }}>{t.symbol}</td>
                  <td><span className={`tag ${t.trade_type === 'BUY' ? 'green' : 'red'}`}>{t.trade_type}</span></td>
                  <td><span className="tag blue">{t.market}</span></td>
                  <td>KSh {t.amount_kes?.toLocaleString()}</td>
                  <td style={{ color: t.profit_kes >= 0 ? 'var(--accent)' : 'var(--red)', fontWeight: 600 }}>
                    {t.profit_kes >= 0 ? '+' : ''}KSh {t.profit_kes?.toLocaleString()}
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
