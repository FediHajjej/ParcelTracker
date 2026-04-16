import { useState } from 'react'
import './App.css'

const CARRIER_LABELS: Record<string, string> = {
  dhl: 'DHL',
  dpd: 'DPD',
  hermes: 'Hermes',
  gls: 'GLS',
  ups: 'UPS',
  fedex: 'FedEx',
  amazon: 'Amazon Logistics',
  dpost: 'Deutsche Post',
}

const STATUS_COLORS: Record<string, string> = {
  in_transit: '#3b82f6',
  delivered: '#22c55e',
  out_for_delivery: '#f59e0b',
  exception: '#ef4444',
  pending: '#8b5cf6',
  unknown: '#6b7280',
}

export default function App() {
  const [input, setInput] = useState('')
  const [carrier, setCarrier] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function detect(value: string) {
    if (!value.trim()) return
    const res = await fetch(`http://localhost:3001/detect/${value.trim()}`)
    const data = await res.json()
    setCarrier(data.carrier)
  }

  async function track() {
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`http://localhost:3001/track/${input.trim()}`)
      const data = await res.json()
      if (data.error) setError(data.error)
      else setResult(data)
    } catch {
      setError('Could not reach the API')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px' }}>

        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>ParcelTracker</h1>
        <p style={{ color: '#94a3b8', marginBottom: 32 }}>Track any German & EU parcel in one place</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={input}
            onChange={e => { setInput(e.target.value); detect(e.target.value) }}
            onKeyDown={e => e.key === 'Enter' && track()}
            placeholder="Enter tracking number..."
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid #334155',
              background: '#1e293b', color: '#f1f5f9', fontSize: 15, outline: 'none'
            }}
          />
          <button
            onClick={track}
            style={{
              padding: '12px 24px', borderRadius: 10, border: 'none',
              background: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer'
            }}
          >
            Track
          </button>
        </div>

        {carrier && (
          <div style={{ marginBottom: 24 }}>
            <span style={{
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: 20, padding: '4px 12px', fontSize: 13, color: '#94a3b8'
            }}>
              Detected carrier: <strong style={{ color: '#f1f5f9' }}>{CARRIER_LABELS[carrier] ?? carrier}</strong>
            </span>
          </div>
        )}

        {loading && <p style={{ color: '#94a3b8' }}>Fetching tracking info...</p>}
        {error && (
          <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 10, padding: 16, color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Tracking number</div>
                <div style={{ fontWeight: 600 }}>{result.trackingNumber}</div>
              </div>
              <span style={{
                background: STATUS_COLORS[result.status] + '22',
                color: STATUS_COLORS[result.status],
                border: `1px solid ${STATUS_COLORS[result.status]}44`,
                borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 600
              }}>
                {result.status.replace(/_/g, ' ')}
              </span>
            </div>

            {result.estimatedDelivery && (
              <div style={{ marginBottom: 20, padding: 12, background: '#0f172a', borderRadius: 8 }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>Estimated delivery: </span>
                <span style={{ fontWeight: 600 }}>{new Date(result.estimatedDelivery).toLocaleDateString('de-DE')}</span>
              </div>
            )}

            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>Timeline</div>
            {result.events.map((ev: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? '#3b82f6' : '#334155', marginTop: 3 }} />
                  {i < result.events.length - 1 && <div style={{ width: 1, flex: 1, background: '#334155', marginTop: 4 }} />}
                </div>
                <div style={{ paddingBottom: 8 }}>
                  <div style={{ fontWeight: 500 }}>{ev.description}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {ev.location && `${ev.location} · `}{new Date(ev.timestamp).toLocaleString('de-DE')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}