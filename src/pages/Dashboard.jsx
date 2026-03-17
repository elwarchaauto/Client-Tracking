import React from 'react'
import { formatAmount, formatDate } from '../lib/utils'

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-card__label">{label}</div>
      <div className={`stat-card__value stat-card__value--${color}`}>{value}</div>
      {sub && <div className="stat-card__sub">{sub}</div>}
    </div>
  )
}

function TimelineItem({ stage, status, isLast }) {
  return (
    <div className="tl-item">
      <div className="tl-col">
        <div className={`tl-dot tl-dot--${status}`}>
          {status === 'done' ? '✓' : status === 'active' ? '●' : ''}
        </div>
        {!isLast && <div className="tl-line" />}
      </div>
      <div className="tl-body">
        <span className={`tl-label tl-label--${status}`}>{stage.label}</span>
        {status === 'active' && <span className="badge badge--active">EN COURS</span>}
      </div>
    </div>
  )
}

export default function Dashboard({ car, payments, stages, currentStatus, totalPaid, totalPrice, remaining, percent }) {
  const currency = car?.currency || 'DZD'
  const currentIdx = stages.findIndex(s => s.id === currentStatus?.stage_id)
  const previewStages = stages.slice(0, 6)

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">
          {car ? `${car.brand || ''} ${car.model || ''}`.trim() || 'Mon véhicule' : 'Tableau de bord'}
        </h1>
        <p className="page__sub">
          {car
            ? `${car.year || ''}${car.year && car.color ? ' · ' : ''}${car.color || ''} · ${currency}`
            : 'Configurez votre véhicule dans les paramètres'}
        </p>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Prix total"
          value={formatAmount(totalPrice, currency)}
          sub={currency}
          color="accent"
        />
        <StatCard
          label="Total payé"
          value={formatAmount(totalPaid, currency)}
          sub={`${payments.length} versement${payments.length !== 1 ? 's' : ''}`}
          color="success"
        />
        <StatCard
          label="Reste à payer"
          value={formatAmount(remaining, currency)}
          sub={totalPrice > 0 ? `${(100 - percent).toFixed(1)}% restant` : ''}
          color="warning"
        />
      </div>

      <div className="progress-section">
        <div className="progress-section__header">
          <span className="progress-section__title">Progression du paiement</span>
          <span className="progress-section__pct">{percent.toFixed(1)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${percent}%` }} />
        </div>
        <div className="progress-section__footer">
          <span style={{ color: 'var(--success)' }}>{formatAmount(totalPaid, currency)} payé</span>
          <span style={{ color: 'var(--warning)' }}>{formatAmount(remaining, currency)} restant</span>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Étape actuelle</h2>
            <span className="badge badge--active">
              {currentStatus?.delivery_stages?.label || 'Non démarré'}
            </span>
          </div>
          <div className="timeline">
            {previewStages.length === 0 ? (
              <p className="empty">Aucune étape définie — allez dans Paramètres</p>
            ) : (
              previewStages.map((s, i) => {
                const done = currentIdx >= 0 && i < currentIdx
                const active = i === currentIdx
                return (
                  <TimelineItem
                    key={s.id}
                    stage={s}
                    status={done ? 'done' : active ? 'active' : 'pending'}
                    isLast={i === previewStages.length - 1}
                  />
                )
              })
            )}
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Détails du véhicule</h2>
          </div>
          {!car ? (
            <p className="empty">Aucun véhicule enregistré</p>
          ) : (
            <div className="detail-list">
              {[
                ['Marque', car.brand],
                ['Modèle', car.model],
                ['Année', car.year],
                ['Couleur', car.color],
                ['VIN', car.vin],
                ['Enregistré le', formatDate(car.created_at)],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div className="detail-row" key={k}>
                    <span className="detail-row__key">{k}</span>
                    <span className="detail-row__val">{v}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}