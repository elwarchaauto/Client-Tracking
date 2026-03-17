import React, { useState, useEffect } from 'react'

export default function StagesPage({ stages, onSave }) {
  const [list, setList]   = useState([])
  const [input, setInput] = useState('')
  const [dragIdx, setDragIdx] = useState(null)
  const [saving, setSaving]   = useState(false)

  useEffect(() => { setList(stages.map(s => ({ ...s }))) }, [stages])

  function add() {
    const label = input.trim(); if (!label) return
    setList(l => [...l, { id: null, label }]); setInput('')
  }

  function dragStart(e, i) { setDragIdx(i); e.dataTransfer.effectAllowed = 'move' }
  function dragOver(e, i) {
    e.preventDefault(); if (dragIdx === null || dragIdx === i) return
    const next = [...list]; const [m] = next.splice(dragIdx, 1)
    next.splice(i, 0, m); setDragIdx(i); setList(next)
  }

  async function save() { setSaving(true); await onSave(list); setSaving(false) }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Étapes de livraison</h1>
          <p className="page-sub">Définissez les étapes communes à tous les clients. Glissez-déposez pour réordonner.</p>
        </div>
      </div>
      <div className="stages-wrap">
        <div className="card">
          <div className="stage-add">
            <input className="stage-input" placeholder="Nom de l'étape (ex. En production, Expédié, En douane…)" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} />
            <button className="btn btn-primary" onClick={add}>Ajouter</button>
          </div>
          {list.length === 0 ? (
            <div className="empty" style={{ padding: '2.5rem 0' }}>
              <div className="empty-icon">📋</div>
              <p className="empty-title">Aucune étape pour l'instant</p>
            </div>
          ) : (
            <div className="drag-list">
              {list.map((s, i) => (
                <div key={i} className="drag-row" draggable onDragStart={e => dragStart(e, i)} onDragOver={e => dragOver(e, i)} onDragEnd={() => setDragIdx(null)}>
                  <span className="drag-handle">⠿</span>
                  <span className="drag-num">{i + 1}</span>
                  <span className="drag-label">{s.label}</span>
                  <button className="icon-btn icon-btn--danger" onClick={() => setList(l => l.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-primary btn-full" onClick={save} disabled={saving}>
            {saving ? 'Enregistrement…' : list.length === 0 ? 'Enregistrer (vider les étapes)' : `Enregistrer les ${list.length} étapes`}
          </button>
        </div>
      </div>
    </div>
  )
}