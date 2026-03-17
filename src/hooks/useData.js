import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

/* ─── helpers ───────────────────────────────────────────────── */

async function fetchAllClients() {
  const { data: clientsData } = await supabase
    .from('clients').select('*').order('created_at', { ascending: false })

  if (!clientsData?.length) return []

  const clientIds = clientsData.map(c => c.id)
  const { data: carsData } = await supabase
    .from('cars').select('*').in('client_id', clientIds)

  const carIds = (carsData || []).map(c => c.id)
  const [{ data: pays }, { data: statuses }] = await Promise.all([
    carIds.length
      ? supabase.from('payments').select('car_id, amount').in('car_id', carIds)
      : Promise.resolve({ data: [] }),
    carIds.length
      ? supabase.from('delivery_status')
          .select('car_id, stage_id, delivery_stages(label)')
          .in('car_id', carIds).order('updated_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const paysByCarId = {}
  for (const p of (pays || [])) {
    paysByCarId[p.car_id] = (paysByCarId[p.car_id] || 0) + Number(p.amount)
  }
  const statusByCarId = {}
  for (const s of (statuses || [])) {
    if (!statusByCarId[s.car_id]) statusByCarId[s.car_id] = s
  }

  return clientsData.map(c => {
    const car        = (carsData || []).find(v => v.client_id === c.id) || null
    const totalPaid  = car ? (paysByCarId[car.id] || 0) : 0
    const totalPrice = Number(car?.total_price) || 0
    const remaining  = Math.max(0, totalPrice - totalPaid)
    const percent    = totalPrice > 0 ? Math.min(100, (totalPaid / totalPrice) * 100) : 0
    const currentStage = car ? statusByCarId[car.id]?.delivery_stages?.label || null : null
    return { ...c, car, totalPaid, totalPrice, remaining, percent, currentStage }
  })
}

async function fetchAllStages() {
  const { data } = await supabase.from('delivery_stages').select('*').order('stage_order')
  return data || []
}

/* ─── useAdmin ──────────────────────────────────────────────── */

export function useAdmin() {
  const [clients, setClients] = useState([])
  const [stages, setStages]   = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState(null)

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3200)
  }, [])

  const refreshClients = useCallback(async () => {
    const data = await fetchAllClients()
    setClients([...data])           // new array ref → always triggers re-render
  }, [])

  const refreshStages = useCallback(async () => {
    const data = await fetchAllStages()
    setStages([...data])
  }, [])

  useEffect(() => {
    Promise.all([refreshClients(), refreshStages()]).then(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Client CRUD ── */
  const createClient = useCallback(async (clientData, carData) => {
    try {
      const { data: c, error: e1 } = await supabase.from('clients').insert(clientData).select().single()
      if (e1) throw e1
      const { error: e2 } = await supabase.from('cars').insert({ ...carData, client_id: c.id })
      if (e2) throw e2
      await refreshClients()
      notify('Client créé avec succès')
      return c.id
    } catch (e) { notify(e.message, 'error'); return null }
  }, [refreshClients, notify])

  const updateClient = useCallback(async (clientId, carId, clientData, carData) => {
    try {
      const { error: e1 } = await supabase.from('clients').update(clientData).eq('id', clientId)
      if (e1) throw e1
      if (carId) {
        const { error: e2 } = await supabase.from('cars').update(carData).eq('id', carId)
        if (e2) throw e2
      } else {
        const { error: e2 } = await supabase.from('cars').insert({ ...carData, client_id: clientId })
        if (e2) throw e2
      }
      await refreshClients()
      notify('Informations mises à jour')
      return true
    } catch (e) { notify(e.message, 'error'); return false }
  }, [refreshClients, notify])

  const deleteClient = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
      await refreshClients()
      notify('Client supprimé')
    } catch (e) { notify(e.message, 'error') }
  }, [refreshClients, notify])

  /* ── Stages ──
     FIX: delete ALL rows unconditionally (no .in() filter),
     then re-insert. This handles the "delete all" case correctly.        */
  const saveStages = useCallback(async (newStages) => {
    try {
      // delete every row — neq trick satisfies PostgREST "must have filter" requirement
      const { error: delErr } = await supabase
        .from('delivery_stages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (delErr) throw delErr

      if (newStages.length) {
        const { error: insErr } = await supabase
          .from('delivery_stages')
          .insert(newStages.map((s, i) => ({ label: s.label, stage_order: i })))
        if (insErr) throw insErr
      }

      await refreshStages()
      notify('Étapes enregistrées')
      return true
    } catch (e) { notify(e.message, 'error'); return false }
  }, [refreshStages, notify])   // no longer depends on stale `stages` state

  return { clients, stages, loading, toast, createClient, updateClient, deleteClient, saveStages, reload: refreshClients }
}

/* ─── useClientDetail ───────────────────────────────────────── */

export function useClientDetail(clientId) {
  const [client, setClient]     = useState(null)
  const [car, setCar]           = useState(null)
  const [payments, setPayments] = useState([])
  const [stages, setStages]     = useState([])
  const [status, setStatus]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState(null)

  // keep a ref to car so mutations always see the latest value
  const carRef = useRef(null)

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3200)
  }, [])

  const load = useCallback(async () => {
    if (!clientId) return

    const [{ data: c }, { data: stgs }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('delivery_stages').select('*').order('stage_order'),
    ])

    setClient(c)
    setStages([...(stgs || [])])

    if (c) {
      const { data: v } = await supabase.from('cars').select('*').eq('client_id', c.id).maybeSingle()
      setCar(v)
      carRef.current = v   // keep ref in sync

      if (v) {
        const [{ data: pays }, { data: stat }] = await Promise.all([
          supabase.from('payments').select('*').eq('car_id', v.id).order('paid_at', { ascending: false }),
          supabase.from('delivery_status')
            .select('*, delivery_stages(*)')
            .eq('car_id', v.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])
        setPayments([...(pays || [])])   // new array ref → always re-renders
        setStatus(stat ?? null)
      } else {
        setPayments([])
        setStatus(null)
      }
    }

    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  /* ── Payments ── */
  const addPayment = useCallback(async ({ amount, paid_at, note, file }) => {
    const currentCar = carRef.current
    if (!currentCar) return false

    let receipt_image_url = null
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `receipts/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('receipts').upload(path, file)
      if (upErr) { notify('Erreur upload : ' + upErr.message, 'error'); return false }
      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(path)
      receipt_image_url = publicUrl
    }

    try {
      const { error } = await supabase.from('payments').insert({
        car_id: currentCar.id, amount, paid_at, note: note || null, receipt_image_url,
      })
      if (error) throw error
      await load()
      notify('Versement ajouté')
      return true
    } catch (e) { notify(e.message, 'error'); return false }
  }, [load, notify])   // no longer depends on stale `car` state

  const deletePayment = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('payments').delete().eq('id', id)
      if (error) throw error
      await load()
      notify('Versement supprimé')
    } catch (e) { notify(e.message, 'error') }
  }, [load, notify])

  /* ── Delivery ── */
  const updateDelivery = useCallback(async ({ stage_id, note }) => {
    const currentCar = carRef.current
    if (!currentCar) return false
    try {
      const { error } = await supabase.from('delivery_status').insert({
        car_id: currentCar.id, stage_id, note: note || null,
      })
      if (error) throw error
      await load()
      notify('Statut mis à jour')
      return true
    } catch (e) { notify(e.message, 'error'); return false }
  }, [load, notify])   // no longer depends on stale `car` state

  const totalPaid  = payments.reduce((s, p) => s + Number(p.amount), 0)
  const totalPrice = Number(car?.total_price) || 0
  const remaining  = Math.max(0, totalPrice - totalPaid)
  const percent    = totalPrice > 0 ? Math.min(100, (totalPaid / totalPrice) * 100) : 0

  return { client, car, payments, stages, status, loading, toast, totalPaid, totalPrice, remaining, percent, addPayment, deletePayment, updateDelivery }
}