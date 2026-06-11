import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Clock } from 'lucide-react'

export default function Wallet({ session }) {
  const [wallet, setWallet]           = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [depositAmt, setDepositAmt]   = useState('')
  const [phone, setPhone]             = useState('')
  const [withdrawAmt, setWithdrawAmt] = useState('')
  const [wPhone, setWPhone]           = useState('')
  const [depositing, setDepositing]   = useState(false)
  const [msg, setMsg]                 = useState({ type: '', text: '' })
  const [tab, setTab]                 = useState('deposit')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    let { data: w } = await supabase.from('wallets').select('*').eq('user_id', session.user.id).single()
    if (!w) {
      const { data: nw } = await supabase.from('wallets').insert({ user_id: session.user.id, balance_kes: 0 }).select().single()
      w = nw
    }
    const { data: t } = await supabase.from('transactions').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(20)
    setWallet(w)
    setTransactions(t || [])
    setLoading(false)
  }

  const handleDeposit = async () => {
    if (!depositAmt || !phone) return setMsg({ type: 'error', text: 'Enter amount and M-Pesa number' })
    if (parseFloat(depositAmt) < 100) return setMsg({ type: 'error', text: 'Minimum deposit is KSh 100' })
    setDepositing(true); setMsg({ type: '', text: '' })
    await supabase.from('transactions').insert({
      user_id: session.user.id, type: 'deposit',
      amount_kes: parseFloat(depositAmt),
      status: 'pending', notes: `M-Pesa deposit from ${phone}`
    })
    setMsg({ type: 'success', text: `📱 M-Pesa prompt sent to ${phone}. Enter your PIN to complete.` })
    setDepositing(false); setDepositAmt(''); fetchData()
  }

  const bal    = wallet?.balance_kes    || 0
  const profit = wallet?.total_profit   || 0
  const dep    = wallet?.total_deposited || 0

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="page-header">
        <h1>Wallet</h1>
        <p>Manage your funds via M-Pesa</p>
      </div>

      {/* Balance hero */}
      <div style={{
        background: 'linear-gradient(135deg,#141008,#1e1a0a,#0f0c07)',
        border: '1px solid var(--gold-border)',
        borderRadius: 18, padding: '22px',
        marginBottom: 16, position: 'relative', overflow: 'hidden',
        width: '100%', boxSizing: 'border-box',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -50, width: 220, height: 220, background: 'radial-gradient(circle,rgba(201,149,42,0.1) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 10, color: 'rgba(201,149,42,0.6)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 5 }}>
            Available Balance
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(28px,8vw,42px)', fontWeight: 700, letterSpacing: '-1px', background: 'linear-gradient(135deg,#f0c14b,#c9952a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, marginBottom: 4 }}>
            KSh {bal.toLocaleString()}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            ≈ ${(bal / 129.45).toFixed(2)} USD
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Deposited', val: `KSh ${dep.toLocaleString()}`, col: 'var(--text-primary)', bg: 'rgba(255,255,255,0.04)', bd: 'rgba(255,255,255,0.07)' },
              { label: 'Total Profit',    val: `KSh ${profit.toLocaleString()}`, col: profit >= 0 ? 'var(--green)' : 'var(--red)', bg: profit >= 0 ? 'rgba(34,195,122,0.08)' : 'rgba(232,64,96,0.08)', bd: profit >= 0 ? 'rgba(34,195,122,0.2)' : 'rgba(232,64,96,0.2)' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, minWidth: 120, background: s.bg, border: `1px solid ${s.bd}`, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: s.col }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs: Deposit / Withdraw */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 14, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 4 }}>
        {[
          { id: 'deposit',  label: '📥 Deposit',  icon: ArrowDownLeft },
          { id: 'withdraw', label: '📤 Withdraw', icon: ArrowUpRight },
        ].map(t => (
          <button key={t.id}
            style={{
              flex: 1, padding: '10px', fontSize: 13, fontWeight: 700,
              borderRadius: 9, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', transition: 'all 0.15s',
              background: tab === t.id ? 'linear-gradient(135deg,var(--gold),var(--gold-bright))' : 'transparent',
              color: tab === t.id ? '#09080a' : 'var(--text-secondary)',
            }}
            onClick={() => { setTab(t.id); setMsg({ type: '', text: '' }) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Deposit form */}
      {tab === 'deposit' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px', marginBottom: 14, width: '100%', boxSizing: 'border-box' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.5px', marginBottom: 14 }}>
            Deposit via M-Pesa
          </div>

          {msg.text && (
            <div style={{ padding: '10px 13px', borderRadius: 9, fontSize: 13, marginBottom: 14, background: msg.type === 'error' ? 'var(--red-glow)' : 'var(--green-glow)', color: msg.type === 'error' ? 'var(--red)' : 'var(--green)', border: `1px solid ${msg.type === 'error' ? 'rgba(232,64,96,0.25)' : 'rgba(34,195,122,0.25)'}` }}>
              {msg.text}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">M-Pesa Number</label>
            <input className="form-input" type="tel" placeholder="e.g. 0712345678"
              value={phone} onChange={e => setPhone(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Amount (KSh)</label>
            <input className="form-input" type="number" placeholder="Minimum KSh 100"
              value={depositAmt} onChange={e => setDepositAmt(e.target.value)} />
          </div>

          {/* Quick amounts */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[500, 1000, 2500, 5000].map(amt => (
              <button key={amt}
                style={{
                  flex: 1, padding: '9px 4px', fontSize: 12, fontWeight: 600,
                  borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border-light)',
                  background: 'transparent', color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)', minWidth: 0, transition: 'all 0.15s',
                }}
                onClick={() => setDepositAmt(String(amt))}>
                {amt.toLocaleString()}
              </button>
            ))}
          </div>

          <button
            style={{
              width: '100%', padding: '13px',
              background: 'linear-gradient(135deg,var(--gold),var(--gold-bright))',
              border: 'none', borderRadius: 11,
              color: '#09080a', fontSize: 14, fontWeight: 700,
              cursor: depositing ? 'not-allowed' : 'pointer',
              opacity: depositing ? 0.7 : 1,
              fontFamily: 'var(--font-body)',
              boxShadow: '0 4px 16px rgba(201,149,42,0.4)',
            }}
            onClick={handleDeposit} disabled={depositing}>
            {depositing ? 'Processing...' : '📱 Send M-Pesa Prompt'}
          </button>

          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, textAlign: 'center', lineHeight: 1.5 }}>
            You'll receive a prompt on your phone.<br />Enter your M-Pesa PIN to confirm.
          </p>
        </div>
      )}

      {/* Withdraw form */}
      {tab === 'withdraw' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px', marginBottom: 14, width: '100%', boxSizing: 'border-box' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.5px', marginBottom: 14 }}>
            Withdraw to M-Pesa
          </div>

          <div style={{ padding: '10px 13px', background: 'rgba(240,124,40,0.1)', border: '1px solid rgba(240,124,40,0.25)', borderRadius: 9, fontSize: 12, color: 'var(--orange)', marginBottom: 14 }}>
            ⚠️ Minimum withdrawal KSh 500 · Processing 1–5 minutes
          </div>

          <div className="form-group">
            <label className="form-label">M-Pesa Number</label>
            <input className="form-input" type="tel" placeholder="e.g. 0712345678"
              value={wPhone} onChange={e => setWPhone(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Amount (KSh)</label>
            <input className="form-input" type="number" placeholder="Minimum KSh 500"
              value={withdrawAmt} onChange={e => setWithdrawAmt(e.target.value)} />
          </div>

          <button style={{
            width: '100%', padding: '13px',
            background: 'transparent', border: '1px solid var(--gold-border)',
            borderRadius: 11, color: 'var(--gold-bright)',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}>
            💸 Withdraw Funds
          </button>
        </div>
      )}

      {/* Transaction history */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.5px' }}>Transaction History</div>
          <button onClick={fetchData} style={{ background: 'transparent', border: '1px solid var(--border-light)', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={12} />
          </button>
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <div className="empty-state-icon"><Clock size={18} /></div>
            <h3>Loading...</h3>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <div className="empty-state-icon"><Clock size={18} /></div>
            <h3>No transactions yet</h3>
            <p>Make your first deposit to get started</p>
          </div>
        ) : (
          <div style={{ padding: '6px 0' }}>
            {transactions.map(t => {
              const isIn = ['deposit', 'profit'].includes(t.type)
              return (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  minWidth: 0,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: isIn ? 'var(--green-glow)' : 'var(--red-glow)',
                    border: `1px solid ${isIn ? 'rgba(34,195,122,0.2)' : 'rgba(232,64,96,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isIn ? <ArrowDownLeft size={15} color="var(--green)" /> : <ArrowUpRight size={15} color="var(--red)" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{t.type}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {new Date(t.created_at).toLocaleString('en-KE')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: isIn ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap' }}>
                      {isIn ? '+' : '-'}KSh {(t.amount_kes || 0).toLocaleString()}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 5, marginTop: 3, display: 'inline-block',
                      background: t.status === 'completed' ? 'var(--green-glow)' : t.status === 'pending' ? 'var(--gold-glow)' : 'var(--red-glow)',
                      color: t.status === 'completed' ? 'var(--green)' : t.status === 'pending' ? 'var(--gold-bright)' : 'var(--red)' }}>
                      {t.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
