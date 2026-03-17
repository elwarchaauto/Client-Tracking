import React, { useState } from 'react'
import { useAdmin } from './hooks/useData'
import ClientsPage from './pages/ClientsPage'
import ClientDetail from './pages/ClientDetail'
import StagesPage from './pages/StagesPage'
import ClientForm from './components/ClientForm'
import Toast from './components/Toast'

export default function App() {
  const admin = useAdmin()
  const [nav, setNav]           = useState('clients')
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState(null)
  const [mobileOpen, setMobile] = useState(false)

  if (admin.loading) return (
    <div className="loading"><div className="spinner" /><span>Chargement…</span></div>
  )

  if (selected) return (
    <ClientDetail clientId={selected} onBack={() => setSelected(null)} />
  )

  const editData = editId ? admin.clients.find(c => c.id === editId) : null

  async function handleSave(clientData, carData) {
    if (editId) {
      const c = admin.clients.find(c => c.id === editId)
      await admin.updateClient(editId, c?.car?.id, clientData, carData)
    } else {
      await admin.createClient(clientData, carData)
    }
    setShowForm(false); setEditId(null)
  }

  const NAV = [
    { id: 'clients', label: 'Clients', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: 'stages',  label: 'Étapes',  icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  ]

  return (
    <div className="shell">
      {/* Mobile topbar */}
      <header className="topbar">
        <div className="topbar-brand">
          <img src="/logo.png" alt="El Warcha Auto" className="brand-logo" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
          <div className="brand-mark brand-mark--fallback" style={{ display: 'none' }}>E</div>
          <span className="brand-name">El Warcha Auto</span>
        </div>
        <button className="burger" onClick={() => setMobile(o => !o)}>{mobileOpen ? '✕' : '☰'}</button>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo.png" alt="El Warcha Auto" className="brand-logo" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
          <div className="brand-mark brand-mark--fallback" style={{ display: 'none' }}>E</div>
          <div className="brand-text">
            <div className="brand-name">El Warcha Auto</div>
            <div className="brand-sub">Administration</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(n => (
            <button key={n.id} className={`nav-btn ${nav === n.id ? 'nav-btn--active' : ''}`}
              onClick={() => { setNav(n.id); setMobile(false) }}>
              {n.icon}
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-stats">
          <div className="ss-item"><div className="ss-val">{admin.clients.length}</div><div className="ss-label">clients</div></div>
          <div className="ss-sep" />
          <div className="ss-item"><div className="ss-val">{admin.stages.length}</div><div className="ss-label">étapes</div></div>
        </div>
      </aside>

      {mobileOpen && <div className="overlay" onClick={() => setMobile(false)} />}

      <main className="main">
        {nav === 'clients' && (
          <ClientsPage clients={admin.clients} onSelect={setSelected}
            onNew={() => { setEditId(null); setShowForm(true) }}
            onEdit={id => { setEditId(id); setShowForm(true) }}
            onDelete={admin.deleteClient} />
        )}
        {nav === 'stages' && <StagesPage stages={admin.stages} onSave={admin.saveStages} />}
      </main>

      {showForm && (
        <ClientForm initial={editData} onSave={handleSave} onClose={() => { setShowForm(false); setEditId(null) }} />
      )}

      <Toast toast={admin.toast} />
    </div>
  )
}