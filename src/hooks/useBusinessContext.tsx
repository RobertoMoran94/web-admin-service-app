import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './useAuth'
import { UserRole, type Business } from '../types'

interface BusinessContextValue {
  /** The currently selected/active business */
  business:        Business | null
  /** All businesses — only populated for admins */
  allBusinesses:   Business[]
  loading:         boolean
  error:           string | null
  /** Admin only: switch the viewed business */
  selectBusiness:  (b: Business) => void
}

const BusinessContext = createContext<BusinessContextValue | null>(null)

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { firebaseUser, userDoc, isAdmin } = useAuth()

  const [business,      setBusiness]      = useState<Business | null>(null)
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)

  useEffect(() => {
    if (!firebaseUser || !userDoc) {
      setLoading(false)
      return
    }

    setLoading(true)

    if (isAdmin) {
      // Admins: load all businesses
      getDocs(collection(db, 'businesses'))
        .then((snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Business))
          setAllBusinesses(list)
          if (list.length > 0 && !business) setBusiness(list[0])
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false))
    } else if (userDoc.role === UserRole.BUSINESS_OWNER) {
      // Business owner: subscribe to their own business document
      const q = query(
        collection(db, 'businesses'),
        where('ownerId', '==', firebaseUser.uid),
      )
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            setBusiness({ id: snap.docs[0].id, ...snap.docs[0].data() } as Business)
          }
          setLoading(false)
        },
        (e) => { setError(e.message); setLoading(false) },
      )
      return unsub
    } else {
      setLoading(false)
    }
  }, [firebaseUser, userDoc, isAdmin]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectBusiness = (b: Business) => setBusiness(b)

  return (
    <BusinessContext.Provider
      value={{ business, allBusinesses, loading, error, selectBusiness }}
    >
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusinessContext(): BusinessContextValue {
  const ctx = useContext(BusinessContext)
  if (!ctx) throw new Error('useBusinessContext must be used inside <BusinessProvider>')
  return ctx
}
