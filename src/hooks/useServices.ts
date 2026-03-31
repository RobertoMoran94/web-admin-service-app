import { useEffect, useState, useCallback } from 'react'
import {
  collection, onSnapshot, addDoc,
  updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Service } from '../types'

export function useServices(businessId: string | null) {
  const [services, setServices] = useState<Service[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    if (!businessId) { setLoading(false); return }
    const ref = collection(db, 'businesses', businessId, 'services')
    const unsub = onSnapshot(ref,
      (snap) => {
        setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Service)))
        setLoading(false)
      },
      (e) => { setError(e.message); setLoading(false) },
    )
    return unsub
  }, [businessId])

  const addService = useCallback(async (data: Omit<Service, 'id' | 'createdAt'>) => {
    if (!businessId) return
    await addDoc(collection(db, 'businesses', businessId, 'services'), {
      ...data, createdAt: serverTimestamp(),
    })
  }, [businessId])

  const updateService = useCallback(async (id: string, data: Partial<Service>) => {
    if (!businessId) return
    await updateDoc(doc(db, 'businesses', businessId, 'services', id), data)
  }, [businessId])

  const deleteService = useCallback(async (id: string) => {
    if (!businessId) return
    await deleteDoc(doc(db, 'businesses', businessId, 'services', id))
  }, [businessId])

  return { services, loading, error, addService, updateService, deleteService }
}
