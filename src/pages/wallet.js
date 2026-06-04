import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react'

export default function Wallet({ session }) {
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [depositAmount, setDepositAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [depositing, setDepositing] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    let { data: w } = await supabase.from('wallets').select('*').eq('user_id', session.user.id).single()
    if (!w) {
      const { data: newW } = await supabase.from('wallets').insert({ user_id: session.user.id, balance_kes: 0 }).select().single()
      w = newW
    }
    const { data: t } = await supabase.from('transactions').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(20)
    setWallet(w)
    setTransactions(t || [])
    setLoading(false)
  }

  const handleDeposit = async () => {
    if (!depositAmount || !phone) return setMsg({ type: 'error', text: 'Enter amount and M-Pesa number' })
    if (parseFloat(depositAmount) < 100) return setMsg({ type: 'error', text: 'Minimum deposit is KSh 100' })
    setDepositing(true)
    setMsg({ type: '', text: '' })
    // Log pending transaction
    await supabase.from('transactions').insert({
      user_id: session.user.id,
      type: 'deposit',
      amount_kes: parseFloat(depositAmount),
      status: 'pending',
      notes: `M-Pesa deposit from ${phone}`
    })
    // In production, this triggers M-Pesa STK push via Africa's Talking
    setMsg({ type: 'success', text: `M-Pesa prompt sent to ${phone}. Enter your PIN to complete deposit of KSh ${depositAmount}.` })
    setDepositing(false)
    setDepositAmount('')
    fetchData()
  }

  const balanceKes = wallet?.balance_kes || 0
  const balanceUsd = (balanceKes / 129.45).toFixed(2)

  const typeIcon = (type) => type === 'deposit' ? <ArrowDownLeft size={14} color="var(--accent)" /> : <ArrowUpRight size={14} color="var(--red)" />
  const typeColor = (type) => ['deposit', 'profit'].includes(type) ? 'var(--accent)' : 'var(--red)'

  return (
    <div>
      <div className="page-header">
        <h1>Wallet</h1>
        <p>Manage your funds — deposit and withdraw via M-Pesa</p>
      </div>

      {/* Balance Card */}
      <div className="wallet-balance-card">
        <div className="wallet-label">Available Balance</div>
        <div className="wallet-amount">KSh {balanceKes.toLocaleString()}</div>
        <div className="wallet-usd">≈ ${balanceUsd} USD</div>
        <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Total Deposited</div>
            <div style={{ fontWeight: 700, marginTop: 2 }}>KSh {wallet?.total_deposited?.toLocaleString() || 0}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Total Profit</div>
            <div style={{ fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>KSh {wallet?.total_profit?.toLocaleString() || 0}</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Deposit */}
        <div className="card">
          <div className="card-title">Deposit via M-Pesa</div>
          {msg.text && <div className={msg.type === 'error' ? 'error-msg' : 'success-msg'}>{msg.text}</div>}
          <div className="form-group">
            <label className="form-label">M-Pesa Phone Number</label>
            <input className="form-input" placeholder="e.g. 0712345678" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (KSh)</label>
            <input className="form-input" type="number" placeholder="Minimum KSh 100" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
          </div>
          {/* Quick amounts */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[500, 1000, 2500, 5000].map(amt => (
              <button key={amt} className="btn btn-outline" style={{ flex: 1, padding: '7px', fontSize: 12 }} onClick={() => setDepositAmount(String(amt))}>
                {amt}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleDeposit} disabled={depositing}>
            {depositing ? 'Processing...' : '📱 Send M-Pesa Prompt'}
          </button>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 10, textAlign: 'center' }}>
            You'll receive a prompt on your phone. Enter your M-Pesa PIN to confirm.
          </p>
        </div>

        {/* Withdraw */}
        <div className="card">
          <div className="card-title">Withdraw to M-Pesa</div>
          <div style={{ background: 'rgba(255,192,68,0.1)', border: '1px solid rgba(255,192,68,0.3)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: 'var(--yellow)' }}>
            ⚠️ Minimum withdrawal is KSh 500. Processing time: 1–5 minutes.
          </div>
          <div className="form-group">
            <label className="form-label">M-Pesa Phone Number</label>
            <input className="form-input" placeholder="e.g. 0712345678" />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (KSh)</label>
            <input className="form-input" type="number" placeholder="Minimum KSh 500" />
          </div>
          <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
            💸 Withdraw Funds
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">Transaction History</div>
          <button className="btn btn-outline" style={{ padding: '5px 10px', fontSize: 12 }} onClick={fetchData}><RefreshCw size={13} /></button>
        </div>
        {loading ? (
          <div className="empty-state"><WalletIcon size={32} /><h3>Loading...</h3></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <WalletIcon size={32} />
            <h3>No transactions yet</h3>
            <p>Make your first deposit to get started</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Type</th><th>Amount</th><th>Reference</th><th>Notes</th><th>Status</th></tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--text2)', fontSize: 12 }}>{new Date(t.created_at).toLocaleString()}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, textTransform: 'capitalize' }}>
                      {typeIcon(t.type)}{t.type}
                    </span>
                  </td>
                  <td style={{ color: typeColor(t.type), fontWeight: 700 }}>
                    {['deposit', 'profit'].includes(t.type) ? '+' : '-'}KSh {t.amount_kes?.toLocaleString()}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>{t.mpesa_ref || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>{t.notes || '—'}</td>
                  <td><span className={`tag ${t.status === 'completed' ? 'green' : t.status === 'pending' ? 'yellow' : 'red'}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
