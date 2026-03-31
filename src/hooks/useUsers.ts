import { useEffect, useState, useCallback } from 'react'
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { type UserDoc, type UserRoleValue } from '../types'

interface UseUsersResult {
  users:       UserDoc[]
  loading:     boolean
  error:       string | null
  /** Update a user's role in Firestore */
  updateRole:  (uid: string, role: UserRoleValue) => Promise<void>
  /** Re-fetch the users list */
  refresh:     () => Promise<void>
}

export function useUsers(): UseUsersResult {
  const [users,   setUsers]   = useState<UserDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const q    = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserDoc))
      setUsers(docs)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const updateRole = async (uid: string, role: UserRoleValue) => {
    // Optimistic update in UI
    setUsers((prev) =>
      prev.map((u) => (u.id === uid ? { ...u, role } : u))
    )
    try {
      await updateDoc(doc(db, 'users', uid), { role })
    } catch (err: unknown) {
      // Roll back on failure
      await fetchUsers()
      const message = err instanceof Error ? err.message : 'Failed to update role'
      throw new Error(message)
    }
  }

  return { users, loading, error, updateRole, refresh: fetchUsers }
}
