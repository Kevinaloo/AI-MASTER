import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Zap, RefreshCw, Clock, Info } from 'lucide-react'

export default function Signals() {
  const [signals, setSignals]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [lang, setLang]         = useState('en')
  const [expanded, setExpanded] = useState(null)

  const fetchSignals = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('signals').select('*')
      .neq('market', 'brief')
      .order('created_at', { ascending: false })
      .limit(50)
    setSignals(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSignals()
    const ch = supabase.channel('signals-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'signals' },
        p => setSignals(prev => [p.new, ...prev].slice(0, 50)))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [fetchSignals])

  const filtered = filter === 'all' ? signals
    : signals.filter(s => s.market === filter || s.action === filter.toUpperCase())

  const counts = {
    BUY:  signals.filter(s => s.action === 'BUY').length,
    SELL: signals.filter(s => s.action === 'SELL').length,
    HOLD: signals.filter(s => s.action === 'HOLD').length,
  }

  const confColor = c => c >= 75 ? 'var(--gold-bright)' : c >= 60 ? 'var(--silver)' : 'var(--red)'
  const confClass = c => c >= 75 ? '' : c >= 60 ? 'mid' : 'low'

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="page-header">
        <h1>AI Signals</h1>
        <p>Powered by Groq LLaMA3-70B — real-time crypto & forex analysis</p>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'BUY',  count: counts.BUY,  color: 'var(--green)', bg: 'var(--green-glow)',  border: 'rgba(34,195,122,0.2)' },
          { label: 'SELL', count: counts.SELL, color: 'var(--red)',   bg: 'var(--red-glow)',    border: 'rgba(232,64,96,0.2)' },
          { label: 'HOLD', count: counts.HOLD, color: 'var(--gold-bright)', bg: 'var(--gold-glow)', border: 'var(--gold-border)' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, textAlign: 'center', padding: '12px 8px',
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 12, minWidth: 0,
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(20px,6vw,28px)', fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {['all', 'crypto', 'forex', 'BUY', 'SELL'].map(f => (
            <button key={f}
              style={{
                padding: '7px 12px', fontSize: 11, fontWeight: 600,
                borderRadius: 8, cursor: 'pointer', border: '1px solid',
                fontFamily: 'var(--font-body)', textTransform: 'capitalize',
                background: filter === f ? 'linear-gradient(135deg,var(--gold),var(--gold-bright))' : 'transparent',
                borderColor: filter === f ? 'transparent' : 'var(--border-light)',
                color: filter === f ? '#09080a' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {['en', 'sw'].map(l => (
            <button key={l}
              style={{
                padding: '7px 11px', fontSize: 11, fontWeight: 700,
                borderRadius: 8, cursor: 'pointer', border: '1px solid',
                fontFamily: 'var(--font-body)', textTransform: 'uppercase',
                background: lang === l ? 'linear-gradient(135deg,var(--gold),var(--gold-bright))' : 'transparent',
                borderColor: lang === l ? 'transparent' : 'var(--border-light)',
                color: lang === l ? '#09080a' : 'var(--text-secondary)',
              }}
              onClick={() => setLang(l)}>{l}</button>
          ))}
          <button onClick={fetchSignals}
            style={{ padding: '7px 11px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Signal list */}
      {loading ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Zap size={20} /></div>
          <h3>Analyzing markets...</h3>
          <p>Groq AI is processing signals</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Zap size={20} /></div>
          <h3>No signals yet</h3>
          <p>Deploy the bot to start generating live signals</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(s => {
            const isExp = expanded === s.id
            const reason = lang === 'sw' ? s.reasoning_swahili : s.reasoning_english
            return (
              <div key={s.id} style={{
                background: 'var(--bg-surface)', border: `1px solid ${isExp ? 'var(--gold-border)' : 'var(--border)'}`,
                borderRadius: 14, padding: '15px 16px',
                cursor: 'pointer', transition: 'border-color 0.2s',
                width: '100%', boxSizing: 'border-box',
              }} onClick={() => setExpanded(isExp ? null : s.id)}>

                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span className={`signal-action ${s.action?.toLowerCase()}`}
                    style={{ flexShrink: 0 }}>{s.action}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>{s.symbol}</span>
                      <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 5, fontWeight: 600,
                        background: s.market === 'crypto' ? 'var(--gold-glow)' : 'var(--silver-glow)',
                        color: s.market === 'crypto' ? 'var(--gold-bright)' : 'var(--silver)',
                        border: `1px solid ${s.market === 'crypto' ? 'var(--gold-border)' : 'rgba(200,208,220,0.14)'}` }}>
                        {s.market}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={9} /> {new Date(s.created_at).toLocaleString('en-KE')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: confColor(s.confidence) }}>
                      {s.confidence}%
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>conf</div>
                  </div>
                  <Info size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>

                {/* Expanded */}
                {isExp && (
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
                    <div style={{ display: 'flex', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Entry',   val: s.entry_price,  col: 'var(--text-primary)' },
                        { label: 'Target 🎯', val: s.target_price, col: 'var(--green)' },
                        { label: 'Stop 🛡️',  val: s.stop_loss,    col: 'var(--red)' },
                      ].map(p => (
                        <div key={p.label}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11, marginRight: 5 }}>{p.label}:</span>
                          <strong style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: p.col }}>{p.val}</strong>
                        </div>
                      ))}
                    </div>
                    <div style={{
                      background: 'var(--gold-glow-sm)', border: '1px solid var(--gold-border)',
                      borderRadius: 10, padding: '11px 13px', marginBottom: 10,
                    }}>
                      <div style={{ fontSize: 10, color: 'var(--gold-bright)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 5 }}>
                        🤖 Groq AI Analysis
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{reason}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>Confidence</span>
                      <div className="conf-bar" style={{ flex: 1 }}>
                        <div className={`conf-fill ${confClass(s.confidence)}`} style={{ width: `${s.confidence}%` }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: confColor(s.confidence), flexShrink: 0 }}>
                        {s.confidence}%
                      </span>
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
