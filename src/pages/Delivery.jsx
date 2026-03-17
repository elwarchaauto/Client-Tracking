import React, { useState } from 'react'

export default function Delivery({ stages, currentStatus, onUpdate }) {
  const [stageId, setStageId] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const currentIdx = stages.findIndex(s => s.id === currentStatus?.stage_id)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!stageId) return
    setSubmitting(true)
    const ok = await onUpdate({ stage_id: stageId, note })
    if (ok) { setStageId(''); setNote('') }
    setSubmitting(false)
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Livraison</h1>
        <p className="page__sub">Suivez l'avancement de la livraison</p>
      </div>

      <div className="delivery-layout">
        {/* Update form */}
        <div className="card">
          <h2 className="card__title" style={{ marginBottom: '1.25rem' }}>Mettre à jour le statut</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="field__label">Étape actuelle *</label>
              <select
                className="field__input"
                value={stageId}
                onChange={e => setStageId(e.target.value)}
                required
              >
                <option value="">— Sélectionnez une étape —</option>
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field__label">Note (optionnel)</label>
              <textarea
                className="field__input field__input--textarea"
                placeholder="Informations supplémentaires sur cette étape…"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
            <button className="btn btn--primary btn--full" type="submit" disabled={submitting || !stageId}>
              {submitting ? 'Mise à jour…' : 'Enregistrer le statut'}
            </button>
          </form>
          {currentStatus && (
            <div className="current-status-info">
              <span className="current-status-info__label">Statut actuel :</span>
              <span className="badge badge--active">{currentStatus.delivery_stages?.label || '—'}</span>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="card">
          <h2 className="card__title" style={{ marginBottom: '1.25rem' }}>Calendrier de livraison</h2>
          {stages.length === 0 ? (
            <p className="empty">Aucune étape définie — allez dans Paramètres</p>
          ) : (
            <div className="timeline">
              {stages.map((s, i) => {
                const done = currentIdx >= 0 && i < currentIdx
                const active = i === currentIdx
                const status = done ? 'done' : active ? 'active' : 'pending'
                const isLast = i === stages.length - 1
                return (
                  <div className="tl-item" key={s.id}>
                    <div className="tl-col">
                      <div className={`tl-dot tl-dot--${status}`}>
                        {status === 'done' ? '✓' : status === 'active' ? '●' : i + 1}
                      </div>
                      {!isLast && <div className="tl-line" />}
                    </div>
                    <div className="tl-body">
                      <span className={`tl-label tl-label--${status}`}>{s.label}</span>
                      {active && <span className="badge badge--active">EN COURS</span>}
                      {active && currentStatus?.note && (
                        <p className="tl-note">{currentStatus.note}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}