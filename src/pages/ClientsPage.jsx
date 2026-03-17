import React, { useState } from 'react'
import { fmt, fmtDate, initials } from '../lib/utils'

export default function ClientsPage({ clients, onSelect, onNew, onEdit, onDelete }) {
  const [q, setQ] = useState('')

  const list = clients.filter(c =>
    !q || c.full_name?.toLowerCase().includes(q.toLowerCase()) ||
    c.phone?.includes(q) || c.email?.toLowerCase().includes(q.toLowerCase())
  )

  const totalClients = clients.length
  const totalRevenue = clients.reduce((s, c) => s + c.totalPaid, 0)
  const pending = clients.filter(c => c.remaining > 0).length

  return (
    <div className="page">
      {/* KPI strip */}
      <div className="kpi-row">
        <div className="kpi">
          <span className="kpi-val">{totalClients}</span>
          <span className="kpi-label">Clients</span>
        </div>
        <div className="kpi-div" />
        <div className="kpi">
          <span className="kpi-val kpi-val--blue">{pending}</span>
          <span className="kpi-label">En cours</span>
        </div>
        <div className="kpi-div" />
        <div className="kpi">
          <span className="kpi-val kpi-val--green">{totalClients - pending}</span>
          <span className="kpi-label">Soldés</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Rechercher un client…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={onNew}>+ Nouveau client</button>
      </div>

      {/* Table */}
      {list.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">👥</div>
          <p className="empty-title">{q ? 'Aucun résultat' : 'Aucun client enregistré'}</p>
          {!q && <button className="btn btn-primary" onClick={onNew}>Créer le premier client</button>}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Véhicule</th>
                <th>Prix total</th>
                <th>Payé</th>
                <th>Restant</th>
                <th>Progression</th>
                <th>Statut livraison</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map(c => {
                const pct = c.percent
                return (
                  <tr key={c.id} className="table-row" onClick={() => onSelect(c.id)}>
                    <td>
                      <div className="cell-client">
                        <div className="avatar">{initials(c.full_name)}</div>
                        <div>
                          <div className="cell-name">{c.full_name}</div>
                          <div className="cell-sub">{c.phone || c.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {c.car
                        ? <span className="cell-car">{c.car.brand} {c.car.model}{c.car.year ? ` · ${c.car.year}` : ''}</span>
                        : <span className="cell-na">—</span>}
                    </td>
                    <td className="cell-num">{fmt(c.totalPrice, c.car?.currency)}</td>
                    <td className="cell-num cell-green">{fmt(c.totalPaid, c.car?.currency)}</td>
                    <td className="cell-num cell-orange">{fmt(c.remaining, c.car?.currency)}</td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="progress-pct">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td>
                      {c.currentStage
                        ? <span className="stage-badge">{c.currentStage}</span>
                        : <span className="cell-na">Non démarré</span>}
                    </td>
                    <td>
                      <div className="row-actions" onClick={e => e.stopPropagation()}>
                        <button className="icon-btn" title="Modifier" onClick={() => onEdit(c.id)}>✎</button>
                        <button className="icon-btn icon-btn--danger" title="Supprimer" onClick={() => { if (window.confirm(`Supprimer ${c.full_name} ?`)) onDelete(c.id) }}>✕</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}