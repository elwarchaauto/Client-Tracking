import React, { useState, useRef } from 'react'
import { useClientDetail } from '../hooks/useData'
import { fmt, fmtDate, initials, today } from '../lib/utils'
import Toast from '../components/Toast'

function Lightbox({ src, onClose }) {
  if (!src) return null
  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>✕</button>
      <img src={src} alt="Reçu" className="lightbox-img" onClick={e => e.stopPropagation()} />
    </div>
  )
}

function ProgressRing({ pct, size = 80 }) {
  const r = 34, c = 40
  const circ = 2 * Math.PI * r
  const filled = (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx={c} cy={c} r={r} fill="none" stroke="#f0f4f8" strokeWidth="7"/>
      <circle cx={c} cy={c} r={r} fill="none" stroke="#2563eb" strokeWidth="7"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dasharray .8s ease' }} />
      <text x="40" y="37" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">{pct.toFixed(0)}%</text>
      <text x="40" y="50" textAnchor="middle" fontSize="9" fill="#94a3b8">payé</text>
    </svg>
  )
}

export default function ClientDetail({ clientId, onBack }) {
  const d = useClientDetail(clientId)
  const [tab, setTab]       = useState('overview')
  const [pf, setPf]         = useState({ amount: '', paid_at: today(), note: '' })
  const [file, setFile]     = useState(null)
  const [preview, setPreview] = useState(null)
  const [ds, setDs]         = useState('')
  const [dn, setDn]         = useState('')
  const [busy, setBusy]     = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const fileRef = useRef()

  if (d.loading) return <div className="loading"><div className="spinner" /></div>
  if (!d.client) return <div className="page"><p>Client introuvable.</p></div>

  const { client, car, payments, stages, status, totalPaid, totalPrice, remaining, percent } = d
  const currency   = car?.currency || 'DZD'
  const currentIdx = stages.findIndex(s => s.id === status?.stage_id)

  async function submitPay(e) {
    e.preventDefault()
    if (!pf.amount) return
    setBusy(true)
    const ok = await d.addPayment({ amount: parseFloat(pf.amount), paid_at: pf.paid_at, note: pf.note, file })
    if (ok) { setPf({ amount: '', paid_at: today(), note: '' }); setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = '' }
    setBusy(false)
  }

  async function submitDel(e) {
    e.preventDefault()
    if (!ds) return
    setBusy(true)
    const ok = await d.updateDelivery({ stage_id: ds, note: dn })
    if (ok) { setDs(''); setDn('') }
    setBusy(false)
  }

  const TABS = [['overview','Aperçu'], ['payments','Paiements'], ['delivery','Livraison']]

  return (
    <div className="detail-view">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Retour aux clients
        </button>
        <div className="detail-identity">
          <div className="avatar avatar-lg">{initials(client.full_name)}</div>
          <div>
            <h1 className="detail-name">{client.full_name}</h1>
            <div className="detail-meta">
              {client.phone && <span>{client.phone}</span>}
              {client.email && <span>{client.email}</span>}
              {car && <span>🚗 {car.brand} {car.model}{car.year ? ` ${car.year}` : ''}</span>}
            </div>
          </div>
        </div>
        <div className="detail-tabs">
          {TABS.map(([id, label]) => (
            <button key={id} className={`detail-tab ${tab === id ? 'detail-tab--active' : ''}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="detail-body">

        {/* ── OVERVIEW ──────────────────────────────── */}
        {tab === 'overview' && (
          <div className="ov-grid">
            {/* Payment summary card */}
            <div className="card card-span2">
              <div className="ov-finance">
                <ProgressRing pct={percent} />
                <div className="ov-stats">
                  <div className="ov-stat">
                    <span className="ov-stat-label">Prix total</span>
                    <span className="ov-stat-val">{fmt(totalPrice, currency)}</span>
                  </div>
                  <div className="ov-stat">
                    <span className="ov-stat-label">Total payé</span>
                    <span className="ov-stat-val ov-stat-val--green">{fmt(totalPaid, currency)}</span>
                  </div>
                  <div className="ov-stat">
                    <span className="ov-stat-label">Reste à payer</span>
                    <span className="ov-stat-val ov-stat-val--orange">{fmt(remaining, currency)}</span>
                  </div>
                  <div className="ov-stat">
                    <span className="ov-stat-label">Versements</span>
                    <span className="ov-stat-val">{payments.length}</span>
                  </div>
                </div>
                <div className="ov-bar-wrap">
                  <div className="ov-bar-track"><div className="ov-bar-fill" style={{ width: `${percent}%` }} /></div>
                  <div className="ov-bar-labels">
                    <span style={{ color: '#2563eb', fontWeight: 600 }}>{percent.toFixed(1)}% payé</span>
                    <span style={{ color: '#f59e0b' }}>{(100 - percent).toFixed(1)}% restant</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Car info */}
            <div className="card">
              <h3 className="card-title">Véhicule</h3>
              {!car ? <p className="muted-text">Aucun véhicule enregistré</p> : (
                <dl className="dl">
                  {[['Marque', car.brand], ['Modèle', car.model], ['Année', car.year], ['Couleur', car.color], ['VIN', car.vin], ['Prix', fmt(car.total_price, currency)], ['Devise', currency]].filter(([,v]) => v).map(([k, v]) => (
                    <div key={k} className="dl-row"><dt>{k}</dt><dd>{v}</dd></div>
                  ))}
                </dl>
              )}
            </div>

            {/* Client info */}
            <div className="card">
              <h3 className="card-title">Informations client</h3>
              <dl className="dl">
                {[['Nom', client.full_name], ['Téléphone', client.phone], ['Email', client.email], ['Depuis', fmtDate(client.created_at)]].filter(([,v]) => v).map(([k,v]) => (
                  <div key={k} className="dl-row"><dt>{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
              {client.notes && (
                <div className="note-block">
                  <div className="note-block-label">Notes internes</div>
                  <p>{client.notes}</p>
                </div>
              )}
            </div>

            {/* Delivery mini */}
            <div className="card">
              <h3 className="card-title">Livraison</h3>
              <div className="current-stage-label">{status?.delivery_stages?.label || <span className="muted-text">Non démarré</span>}</div>
              <div className="timeline-sm">
                {stages.slice(0, 6).map((s, i) => {
                  const done = currentIdx >= 0 && i < currentIdx
                  const active = i === currentIdx
                  const isLast = i === Math.min(stages.length, 6) - 1
                  return (
                    <div className="tl-item" key={s.id}>
                      <div className="tl-left">
                        <div className={`tl-dot ${done ? 'tl-done' : active ? 'tl-active' : 'tl-pending'}`}>{done ? '✓' : ''}</div>
                        {!isLast && <div className="tl-line" />}
                      </div>
                      <span className={`tl-text ${active ? 'tl-text--active' : !done ? 'tl-text--pending' : ''}`}>
                        {s.label}{active && <span className="badge-active">EN COURS</span>}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── PAYMENTS ──────────────────────────────── */}
        {tab === 'payments' && (
          <div className="pay-grid">
            <div className="card">
              <h3 className="card-title">Ajouter un versement</h3>
              <form onSubmit={submitPay}>
                <div className="grid-2">
                  <div className="field"><label>Montant *</label><input type="number" step="0.01" min="0" placeholder="0.00" value={pf.amount} onChange={e => setPf(p => ({ ...p, amount: e.target.value }))} required /></div>
                  <div className="field"><label>Date *</label><input type="date" value={pf.paid_at} onChange={e => setPf(p => ({ ...p, paid_at: e.target.value }))} required /></div>
                </div>
                <div className="field"><label>Note (optionnel)</label><input placeholder="ex. 1er acompte" value={pf.note} onChange={e => setPf(p => ({ ...p, note: e.target.value }))} /></div>
                <div className="field">
                  <label>Reçu (image)</label>
                  <div className="upload-box" onClick={() => fileRef.current?.click()}>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (!f) return; setFile(f); const r = new FileReader(); r.onload = ev => setPreview(ev.target.result); r.readAsDataURL(f) }} />
                    {preview ? <img src={preview} alt="" className="upload-preview" /> : <><div className="upload-icon">📎</div><div className="upload-hint">Cliquez pour ajouter un reçu</div></>}
                  </div>
                </div>
                <button className="btn btn-primary btn-full" type="submit" disabled={busy}>{busy ? 'Enregistrement…' : 'Ajouter le versement'}</button>
              </form>
            </div>
            <div>
              <div className="pay-summary-card">
                <div className="ps-item"><span>Payé</span><strong className="ps-green">{fmt(totalPaid, currency)}</strong></div>
                <div className="ps-div" />
                <div className="ps-item"><span>Restant</span><strong className="ps-orange">{fmt(remaining, currency)}</strong></div>
                <div className="ps-div" />
                <div className="ps-item"><span>Total</span><strong>{fmt(totalPrice, currency)}</strong></div>
              </div>
              <div className="pay-bar-track" style={{ margin: '0 0 20px' }}><div className="pay-bar-fill" style={{ width: `${percent}%` }} /></div>
              <div className="pay-list">
                {payments.length === 0 ? (
                  <div className="empty"><div className="empty-icon">🧾</div><p className="empty-title">Aucun versement</p></div>
                ) : payments.map(p => (
                  <div className="pay-item" key={p.id}>
                    <div
                      className={`pay-receipt ${p.receipt_image_url ? 'pay-receipt--clickable' : ''}`}
                      onClick={() => p.receipt_image_url && setLightbox(p.receipt_image_url)}
                      title={p.receipt_image_url ? 'Cliquez pour agrandir' : ''}
                    >
                      {p.receipt_image_url ? <img src={p.receipt_image_url} alt="Reçu" /> : '🧾'}
                    </div>
                    <div className="pay-info">
                      <div className="pay-amount">{fmt(p.amount, currency)}</div>
                      <div className="pay-date">{fmtDate(p.paid_at)}</div>
                      {p.note && <div className="pay-note">{p.note}</div>}
                    </div>
                    <button className="icon-btn icon-btn--danger" onClick={() => window.confirm('Supprimer ce versement ?') && d.deletePayment(p.id)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DELIVERY ──────────────────────────────── */}
        {tab === 'delivery' && (
          <div className="del-grid">
            <div className="card">
              <h3 className="card-title">Mettre à jour le statut</h3>
              <form onSubmit={submitDel}>
                <div className="field">
                  <label>Étape actuelle *</label>
                  <select value={ds} onChange={e => setDs(e.target.value)} required>
                    <option value="">— Sélectionnez une étape —</option>
                    {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div className="field"><label>Note (optionnel)</label><textarea placeholder="Détails sur cette étape…" value={dn} onChange={e => setDn(e.target.value)} /></div>
                <button className="btn btn-primary btn-full" type="submit" disabled={busy || !ds}>{busy ? 'Mise à jour…' : 'Enregistrer'}</button>
              </form>
              {status && (
                <div className="current-status-box">
                  <span className="csb-label">Statut actuel</span>
                  <span className="csb-val">{status.delivery_stages?.label || '—'}</span>
                  {status.note && <span className="csb-note">{status.note}</span>}
                </div>
              )}
            </div>
            <div className="card">
              <h3 className="card-title">Calendrier de livraison</h3>
              {stages.length === 0 ? <p className="muted-text">Aucune étape — configurez-les dans Paramètres.</p> : (
                <div className="timeline-full">
                  {stages.map((s, i) => {
                    const done = currentIdx >= 0 && i < currentIdx
                    const active = i === currentIdx
                    const isLast = i === stages.length - 1
                    return (
                      <div className="tl-item" key={s.id}>
                        <div className="tl-left">
                          <div className={`tl-dot tl-dot-lg ${done ? 'tl-done' : active ? 'tl-active' : 'tl-pending'}`}>{done ? '✓' : i + 1}</div>
                          {!isLast && <div className="tl-line" />}
                        </div>
                        <div className="tl-right">
                          <span className={`tl-text ${active ? 'tl-text--active' : !done ? 'tl-text--pending' : ''}`}>
                            {s.label}{active && <span className="badge-active">EN COURS</span>}
                          </span>
                          {active && status?.note && <p className="tl-note">{status.note}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
      <Toast toast={d.toast} />
    </div>
  )
}