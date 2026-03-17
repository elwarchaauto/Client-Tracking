import React, { useState, useEffect } from 'react'
import { CURRENCIES } from '../lib/utils'

const EC = { full_name: '', phone: '', email: '', notes: '' }
const EV = { brand: '', model: '', year: '', color: '', vin: '', total_price: '', currency: 'DZD' }

export default function ClientForm({ initial, onSave, onClose }) {
  const [tab, setTab]     = useState('client')
  const [cl, setCl]       = useState(EC)
  const [car, setCar]     = useState(EV)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) {
      setCl({ full_name: initial.full_name || '', phone: initial.phone || '', email: initial.email || '', notes: initial.notes || '' })
      if (initial.car) setCar({ brand: initial.car.brand || '', model: initial.car.model || '', year: initial.car.year || '', color: initial.car.color || '', vin: initial.car.vin || '', total_price: initial.car.total_price || '', currency: initial.car.currency || 'DZD' })
    }
  }, [initial])

  const f = (k, v) => setCl(p => ({ ...p, [k]: v }))
  const g = (k, v) => setCar(p => ({ ...p, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    if (!cl.full_name.trim()) { setTab('client'); return }
    setSaving(true)
    await onSave(
      { full_name: cl.full_name, phone: cl.phone || null, email: cl.email || null, notes: cl.notes || null },
      { brand: car.brand || null, model: car.model || null, year: parseInt(car.year) || null, color: car.color || null, vin: car.vin || null, total_price: parseFloat(car.total_price) || 0, currency: car.currency }
    )
    setSaving(false)
  }

  return (
    <div className="backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{initial ? 'Modifier le client' : 'Nouveau client'}</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-tabs">
          <button className={`modal-tab ${tab === 'client' ? 'active' : ''}`} onClick={() => setTab('client')}>Client</button>
          <button className={`modal-tab ${tab === 'car' ? 'active' : ''}`} onClick={() => setTab('car')}>Véhicule</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {tab === 'client' && <>
              <div className="field">
                <label>Nom complet *</label>
                <input placeholder="Ahmed Benali" required value={cl.full_name} onChange={e => f('full_name', e.target.value)} />
              </div>
              <div className="grid-2">
                <div className="field"><label>Téléphone</label><input placeholder="0555 000 000" value={cl.phone} onChange={e => f('phone', e.target.value)} /></div>
                <div className="field"><label>Email</label><input type="email" placeholder="email@exemple.com" value={cl.email} onChange={e => f('email', e.target.value)} /></div>
              </div>
              <div className="field"><label>Notes internes</label><textarea placeholder="Observations, remarques…" value={cl.notes} onChange={e => f('notes', e.target.value)} /></div>
            </>}
            {tab === 'car' && <>
              <div className="grid-2">
                <div className="field"><label>Marque</label><input placeholder="Toyota" value={car.brand} onChange={e => g('brand', e.target.value)} /></div>
                <div className="field"><label>Modèle</label><input placeholder="Corolla" value={car.model} onChange={e => g('model', e.target.value)} /></div>
                <div className="field"><label>Année</label><input type="number" placeholder="2024" value={car.year} onChange={e => g('year', e.target.value)} /></div>
                <div className="field"><label>Couleur</label><input placeholder="Blanc" value={car.color} onChange={e => g('color', e.target.value)} /></div>
              </div>
              <div className="field"><label>Numéro VIN (optionnel)</label><input placeholder="Identifiant du véhicule" value={car.vin} onChange={e => g('vin', e.target.value)} /></div>
              <div className="grid-2">
                <div className="field"><label>Prix total</label><input type="number" step="0.01" min="0" placeholder="0.00" value={car.total_price} onChange={e => g('total_price', e.target.value)} /></div>
                <div className="field"><label>Devise</label>
                  <select value={car.currency} onChange={e => g('currency', e.target.value)}>
                    {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
            </>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement…' : initial ? 'Mettre à jour' : 'Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}