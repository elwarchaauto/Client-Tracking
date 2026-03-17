import React from 'react'

export default function Toast({ toast }) {
  return (
    <div className={`toast ${toast ? 'toast--show' : ''} ${toast?.type === 'error' ? 'toast--error' : ''}`}>
      <span className="toast__icon">{toast?.type === 'error' ? '✕' : '✓'}</span>
      {toast?.message}
    </div>
  )
}