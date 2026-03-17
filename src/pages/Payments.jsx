import React, { useState, useRef } from 'react'
import { formatAmount, formatDate, today } from '../lib/utils'

export default function Payments({ car, payments, totalPaid, totalPrice, remaining, percent, onAdd, onDelete }) {
  const currency = car?.currency || 'DZD'
  const [form, setForm] = useState({ amount: '', paid_at: today(), note: '' })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef()

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(f)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || !form.paid_at) return
    setSubmitting(true)
    const ok = await onAdd({ amount: parseFloat(form.amount), paid_at: form.paid_at, note: form.note, file })
    if (ok) {
      setForm({ amount: '', paid_at: today(), note: '' })
      setFile(null)
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
    }
    setSubmitting(false)
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Paiements</h1>
        <p className="page__sub">Historique complet des versements</p>
      </div>

      <div className="pay-layout">
        {/* Form */}
        <div className="card">
          <h2 className="card__title" style={{ marginBottom: '1.25rem' }}>Ajouter un versement</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row-2">
              <div className="field">
                <label className="field__label">Montant *</label>
                <input
                  className="field__input"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <label className="field__label">Date *</label>
                <input
                  className="field__input"
                  type="date"
                  value={form.paid_at}
                  onChange={e => setForm(f => ({ ...f, paid_at: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label className="field__label">Note (optionnel)</label>
              <input
                className="field__input"
                type="text"
                placeholder="ex. Premier acompte"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              />
            </div>
            <div className="field">
              <label className="field__label">Reçu (image)</label>
              <div
                className="upload-zone"
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                {preview ? (
                  <img src={preview} alt="Aperçu reçu" className="upload-zone__preview" />
                ) : (
                  <>
                    <span className="upload-zone__icon">🧾</span>
                    <span className="upload-zone__text">Cliquez pour ajouter un reçu</span>
                  </>
                )}
              </div>
            </div>
            <button className="btn btn--primary btn--full" type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement…' : 'Ajouter le versement'}
            </button>
          </form>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <h2 className="card__title" style={{ marginBottom: '1rem' }}>Récapitulatif</h2>
            <div className="summary-row">
              <span className="summary-row__label">Prix total</span>
              <span className="summary-row__val">{formatAmount(totalPrice, currency)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-row__label">Payé</span>
              <span className="summary-row__val summary-row__val--success">{formatAmount(totalPaid, currency)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-row__label">Restant</span>
              <span className="summary-row__val summary-row__val--warning">{formatAmount(remaining, currency)}</span>
            </div>
            <div className="progress-bar" style={{ marginTop: '1rem' }}>
              <div className="progress-bar__fill" style={{ width: `${percent}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '12px', color: 'var(--muted)' }}>
              <span>{percent.toFixed(1)}% payé</span>
              <span>{(100 - percent).toFixed(1)}% restant</span>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <h2 className="section-title" style={{ marginTop: '2rem', marginBottom: '1rem' }}>
        Historique des versements
      </h2>
      {payments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🧾</div>
          <div>Aucun versement enregistré</div>
        </div>
      ) : (
        <div className="payments-list">
          {payments.map(p => (
            <div className="payment-item" key={p.id}>
              <div className="payment-item__receipt">
                {p.receipt_image_url
                  ? <img src={p.receipt_image_url} alt="Reçu" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  : '🧾'}
              </div>
              <div className="payment-item__info">
                <div className="payment-item__amount">{formatAmount(p.amount, currency)}</div>
                <div className="payment-item__date">{formatDate(p.paid_at)}</div>
                {p.note && <div className="payment-item__note">{p.note}</div>}
              </div>
              <div className="payment-item__actions">
                <span className="badge badge--currency">{currency}</span>
                <button
                  className="btn btn--danger btn--sm"
                  onClick={() => {
                    if (window.confirm('Supprimer ce versement ?')) onDelete(p.id)
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}