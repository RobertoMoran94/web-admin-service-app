import { useEffect, useState, useCallback } from 'react'
import {
  collection, onSnapshot, addDoc,
  updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Employee } from '../types'

export function useEmployees(businessId: string | null) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!businessId) { setLoading(false); return }
    const ref = collection(db, 'businesses', businessId, 'employees')
    const unsub = onSnapshot(ref,
      (snap) => {
        setEmployees(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Employee)))
        setLoading(false)
      },
      (e) => { setError(e.message); setLoading(false) },
    )
    return unsub
  }, [businessId])

  const addEmployee = useCallback(async (data: Omit<Employee, 'id' | 'createdAt'>) => {
    if (!businessId) return
    await addDoc(collection(db, 'businesses', businessId, 'employees'), {
      ...data, createdAt: serverTimestamp(),
    })
  }, [businessId])

  const updateEmployee = useCallback(async (id: string, data: Partial<Employee>) => {
    if (!businessId) return
    await updateDoc(doc(db, 'businesses', businessId, 'employees', id), data)
  }, [businessId])

  const deleteEmployee = useCallback(async (id: string) => {
    if (!businessId) return
    await deleteDoc(doc(db, 'businesses', businessId, 'employees', id))
  }, [businessId])

  return { employees, loading, error, addEmployee, updateEmployee, deleteEmployee }
}
