import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  collection,
  getDocs,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './useAuth'
import { UserRole, type Business, type BusinessHours } from '../types'
import { apiGet } from '../api/client'
import { defaultHours } from '../types'

// ── BE response types ─────────────────────────────────────────────────────────

interface BeHoursEntry {
  day:         string    // "monday", "tuesday", ...
  displayName: string
  isOpen:      boolean
  openTime:    string    // "09:00"
  closeTime:   string    // "18:00"
}

interface BeBusinessProfile {
  businessId:    string
  ownerId:       string
  name:          string
  categories:    string[]
  description:   string
  address:       string
  phone:         string
  logoUrl:       string
  coverPhotoUrl: string
  hours:         BeHoursEntry[]
}

function beProfileToBusiness(profile: BeBusinessProfile): Business {
  const hoursObj = defaultHours()
  for (const h of profile.hours) {
    const day = h.day as keyof BusinessHours
    if (day in hoursObj) {
      hoursObj[day] = { open: h.isOpen, from: h.openTime, to: h.closeTime }
    }
  }
  return {
    id:          profile.businessId,
    ownerId:     profile.ownerId,
    name:        profile.name,
    description: profile.description,
    category:    profile.categories[0] ?? '',
    address:     profile.address,
    phone:       profile.phone,
    logoUrl:     profile.logoUrl,
    coverUrl:    profile.coverPhotoUrl,
    createdAt:   Date.now(),
    hours:       hoursObj,
  }
}

interface BusinessContextValue {
  /** The currently selected/active business */
  business:        Business | null
  /** All businesses — only populated for admins */
  allBusinesses:   Business[]
  loading:         boolean
  error:           string | null
  /** Admin only: switch the viewed business */
  selectBusiness:  (b: Business) => void
  /** Re-fetches the business from the BE — call after create/save */
  refresh:         () => void
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
  // Incrementing this triggers a re-fetch without changing any other dep
  const [refreshKey,    setRefreshKey]    = useState(0)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    if (IS_MOCK) return   // skip real fetch in mock mode

    if (!firebaseUser || !userDoc) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    if (isAdmin) {
      // TODO (Phase 4): replace with GET /api/v1/admin/businesses once BE admin
      //                 endpoints are implemented. For now admins still read from
      //                 Firestore so existing businesses remain visible.
      getDocs(collection(db, 'businesses'))
        .then((snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Business))
          setAllBusinesses(list)
          if (list.length > 0 && !business) setBusiness(list[0])
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false))
    } else if (userDoc.role === UserRole.BUSINESS_OWNER) {
      // Business owner: fetch own business from MongoDB via BE.
      // Every business owner has a business from registration — 404 should not occur
      // in normal operation, so all errors are surfaced the same way.
      apiGet<BeBusinessProfile>(`/business/profile/${firebaseUser.uid}`)
        .then((profile) => setBusiness(beProfileToBusiness(profile)))
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load business.'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, userDoc, isAdmin, refreshKey])

  const selectBusiness = (b: Business) => setBusiness(b)

  return (
    <BusinessContext.Provider
      value={{ business, allBusinesses, loading, error, selectBusiness, refresh }}
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
