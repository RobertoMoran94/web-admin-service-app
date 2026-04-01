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

// ── Dev mock ──────────────────────────────────────────────────────────────────
const IS_MOCK = import.meta.env.DEV && import.meta.env.VITE_MOCK_AUTH === 'true'

const MOCK_BUSINESS: Business = {
  id:          'mock-business-id',
  ownerId:     'mock-admin-uid',
  name:        'The Demo Barbershop',
  description: 'Premium cuts, shaves and grooming services in the heart of the city.',
  category:    'Barbershop',
  address:     '123 Main Street, San Francisco, CA 94105',
  phone:       '+1 (415) 555-0123',
  logoUrl:     '',
  coverUrl:    '',
  createdAt:   Date.now(),
  hours: {
    monday:    { open: true,  from: '09:00', to: '18:00' },
    tuesday:   { open: true,  from: '09:00', to: '18:00' },
    wednesday: { open: true,  from: '09:00', to: '18:00' },
    thursday:  { open: true,  from: '09:00', to: '18:00' },
    friday:    { open: true,  from: '09:00', to: '19:00' },
    saturday:  { open: true,  from: '10:00', to: '16:00' },
    sunday:    { open: false, from: '10:00', to: '14:00' },
  },
}

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { firebaseUser, userDoc, isAdmin } = useAuth()

  const [business,      setBusiness]      = useState<Business | null>(IS_MOCK ? MOCK_BUSINESS : null)
  const [allBusinesses, setAllBusinesses] = useState<Business[]>(IS_MOCK ? [MOCK_BUSINESS] : [])
  const [loading,       setLoading]       = useState(!IS_MOCK)
  const [error,         setError]         = useState<string | null>(null)

  useEffect(() => {
    if (IS_MOCK) return   // skip real Firestore in mock mode

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
