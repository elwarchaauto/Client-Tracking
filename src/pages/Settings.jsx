import React, { useState, useEffect } from 'react'

const CURRENCIES = [
  { value: 'DZD', label: 'DZD — Dinar algérien' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'USD', label: 'USD — Dollar américain' },
]

export default function Settings({ car, stages, onSaveCar, onSaveStages }) {
  const [carForm, setCarForm] = useState({
    brand: '', model: '', year: '', color: '', vin: '', total_price: '', currency: 'DZD',
  })
  const [tempStages, setTempStages] = useState([])
  const [newStage, setNewStage] = useState('')
  const [dragIdx, setDragIdx] = useState(null)
  const [savingCar, setSavingCar] = useState(false)
  const [savingStages, setSavingStages] = useState(false)

  useEffect(() => {
    if (car) {
      setCarForm({
        brand: car.brand || '',
        model: car.model || '',
        year: car.year || '',
        color: car.color || '',
        vin: car.vin || '',
        total_price: car.total_price || '',
        currency: car.currency || 'DZD',
      })
    }
  }, [car])

  useEffect(() => {
    setTempStages(stages.map(s => ({ ...s })))
  }, [stages])

  async function handleCarSubmit(e) {
    e.preventDefault()
    setSavingCar(true)
    await onSaveCar({
      brand: carForm.brand,
      model: carForm.model,
      year: parseInt(carForm.year) || null,
      color: carForm.color,
      vin: carForm.vin || null,
      total_price: parseFloat(carForm.total_price) || 0,
      currency: carForm.currency,
    })
    setSavingCar(false)
  }

  function addStage() {
    const label = newStage.trim()
    if (!label) return
    setTempStages(s => [...s, { id: null, label, stage_order: s.length }])
    setNewStage('')
  }

  function removeStage(i) {
    setTempStages(s => s.filter((_, idx) => idx !== i))
  }

  function handleDragStart(e, i) {
    setDragIdx(i)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e, i) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) return
    const updated = [...tempStages]
    const [moved] = updated.splice(dragIdx, 1)
    updated.splice(i, 0, moved)
    setDragIdx(i)
    setTempStages(updated)
  }

  async function handleSaveStages() {
    setSavingStages(true)
    await onSaveStages(tempStages)
    setSavingStages(false)
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Paramètres</h1>
        <p className="page__sub">Configurez votre véhicule et les étapes de livraison</p>
      </div>

      <div className="settings-layout">
        {/* Car form */}
        <div className="card">
          <h2 className="card__title" style={{ marginBottom: '1.25rem' }}>Informations du véhicule</h2>
          <form onSubmit={handleCarSubmit} noValidate>
            <div className="form-row-2">
              <div className="field">
                <label className="field__label">Marque</label>
                <input className="field__input" placeholder="ex. Toyota" value={carForm.brand}
                  onChange={e => setCarForm(f => ({ ...f, brand: e.target.value }))} />
              </div>
              <div className="field">
                <label className="field__label">Modèle</label>
                <input className="field__input" placeholder="ex. Corolla" value={carForm.model}
                  onChange={e => setCarForm(f => ({ ...f, model: e.target.value }))} />
              </div>
              <div className="field">
                <label className="field__label">Année</label>
                <input className="field__input" type="number" placeholder="2024" value={carForm.year}
                  onChange={e => setCarForm(f => ({ ...f, year: e.target.value }))} />
              </div>
              <div className="field">
                <label className="field__label">Couleur</label>
                <input className="field__input" placeholder="ex. Blanc" value={carForm.color}
                  onChange={e => setCarForm(f => ({ ...f, color: e.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label className="field__label">Numéro VIN (optionnel)</label>
              <input className="field__input" placeholder="Numéro d'identification du véhicule" value={carForm.vin}
                onChange={e => setCarForm(f => ({ ...f, vin: e.target.value }))} />
            </div>
            <div className="form-row-2">
              <div className="field">
                <label className="field__label">Prix total</label>
                <input className="field__input" type="number" step="0.01" min="0" placeholder="0.00"
                  value={carForm.total_price}
                  onChange={e => setCarForm(f => ({ ...f, total_price: e.target.value }))} />
              </div>
              <div className="field">
                <label className="field__label">Devise</label>
                <select className="field__input" value={carForm.currency}
                  onChange={e => setCarForm(f => ({ ...f, currency: e.target.value }))}>
                  {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn--primary btn--full" type="submit" disabled={savingCar}>
              {savingCar ? 'Enregistrement…' : 'Enregistrer le véhicule'}
            </button>
          </form>
        </div>

        {/* Stages */}
        <div className="card">
          <h2 className="card__title" style={{ marginBottom: '0.5rem' }}>Étapes de livraison</h2>
          <p className="card__sub" style={{ marginBottom: '1rem' }}>
            Définissez et réorganisez vos étapes par glisser-déposer.
          </p>
          <div className="stage-add-row">
            <input
              className="field__input"
              placeholder="Nom de l'étape…"
              value={newStage}
              onChange={e => setNewStage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStage())}
            />
            <button className="btn btn--secondary" type="button" onClick={addStage}>+ Ajouter</button>
          </div>

          <div className="drag-list">
            {tempStages.length === 0 ? (
              <p className="empty" style={{ padding: '1.5rem 0' }}>Aucune étape — ajoutez-en une ci-dessus</p>
            ) : (
              tempStages.map((s, i) => (
                <div
                  key={i}
                  className="drag-item"
                  draggable
                  onDragStart={e => handleDragStart(e, i)}
                  onDragOver={e => handleDragOver(e, i)}
                  onDragEnd={() => setDragIdx(null)}
                >
                  <span className="drag-item__handle">⋮⋮</span>
                  <span className="drag-item__label">{s.label}</span>
                  <span className="drag-item__order">#{i + 1}</span>
                  <button
                    className="btn btn--danger btn--sm"
                    type="button"
                    onClick={() => removeStage(i)}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            className="btn btn--primary btn--full"
            type="button"
            onClick={handleSaveStages}
            disabled={savingStages}
          >
            {savingStages ? 'Enregistrement…' : 'Enregistrer les étapes'}
          </button>
        </div>
      </div>
    </div>
  )
}