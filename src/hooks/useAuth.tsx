import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { UserRole, type UserDoc, type UserRoleValue } from '../types'
import { apiGet, apiPost, ApiError } from '../api/client'

// ── BE response type ──────────────────────────────────────────────────────────

interface UserMeResponse {
  uid:         string
  email:       string
  displayName: string
  role:        UserRoleValue
  businessId?: string | null
}

function toUserDoc(fbUid: string, res: UserMeResponse): UserDoc {
  return {
    id:          fbUid,
    email:       res.email,
    displayName: res.displayName,
    role:        res.role,
    createdAt:   Date.now(),
    businessId:  res.businessId ?? undefined,
  }
}

// ── Error helper ──────────────────────────────────────────────────────────────

function toReadableError(err: unknown): string {
  if (!(err instanceof Error)) return 'An unexpected error occurred.'
  const code = (err as { code?: string }).code
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/email-already-in-use':
      return 'This email is already registered.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return ''   // user dismissed — show nothing
    default:
      return err.message
  }
}

// ── Dev mock (VITE_MOCK_AUTH=true only in development) ────────────────────────

const IS_MOCK = import.meta.env.DEV && import.meta.env.VITE_MOCK_AUTH === 'true'

const MOCK_USER_DOC: UserDoc = {
  id:          'mock-admin-uid',
  email:       'admin@demo.com',
  displayName: 'Demo Admin',
  role:        UserRole.ADMIN,
  createdAt:   Date.now(),
}

// Minimal fake Firebase User object — only the fields the app actually reads
const MOCK_FIREBASE_USER = {
  uid:         'mock-admin-uid',
  email:       'admin@demo.com',
  displayName: 'Demo Admin',
  photoURL:    null,
  getIdToken:  async () => 'mock-token',
} as unknown as User

// ── Context shape ─────────────────────────────────────────────────────────────

interface AuthState {
  firebaseUser:     User | null
  userDoc:          UserDoc | null
  loading:          boolean
  isAdmin:          boolean
  error:            string | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail:  (email: string, password: string) => Promise<void>
  signUpWithEmail:  (email: string, password: string, displayName: string) => Promise<void>
  signOut:          () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(IS_MOCK ? MOCK_FIREBASE_USER : null)
  const [userDoc,      setUserDoc]      = useState<UserDoc | null>(IS_MOCK ? MOCK_USER_DOC : null)
  const [loading,      setLoading]      = useState(!IS_MOCK)
  const [error,        setError]        = useState<string | null>(null)

  useEffect(() => {
    // In mock mode skip real Firebase listener entirely
    if (IS_MOCK) return

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      // Set loading=true immediately so UI never shows a stale "access denied"
      // while we're mid-fetch.
      setLoading(true)
      setFirebaseUser(fbUser)

      if (fbUser) {
        try {
          // Fetch current user's profile from MongoDB via BE.
          // This is the single source of truth — no Firestore reads.
          const me = await apiGet<UserMeResponse>('/auth/me')
          setUserDoc(toUserDoc(fbUser.uid, me))
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) {
            // No MongoDB doc yet — this happens when:
            //   a) Brand-new Google sign-in hitting the portal for the first time
            //   b) Account created via old flow before Phase 2 migration
            // Auto-register with role = business_owner (business portal default).
            try {
              const registered = await apiPost<UserMeResponse>('/auth/register', {
                displayName: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'User',
                role:        UserRole.BUSINESS_OWNER,
              })
              setUserDoc(toUserDoc(fbUser.uid, registered))
            } catch (regErr) {
              console.error('useAuth: auto-register failed', regErr)
              setError('Failed to create your account. Please try again.')
              setUserDoc(null)
            }
          } else {
            console.error('useAuth: /auth/me failed', err)
            setError('Failed to load your account. Please try again.')
            setUserDoc(null)
          }
        }
      } else {
        setUserDoc(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  // ── Sign-in methods ──────────────────────────────────────────────────────────

  const signInWithGoogle = async () => {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
      // onAuthStateChanged handles fetching the user doc from BE
    } catch (err) {
      const msg = toReadableError(err)
      if (msg) setError(msg)
    }
  }

  /**
   * Email sign-in. Throws a readable string on failure so LoginPage can
   * display it wherever it wants.
   */
  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // onAuthStateChanged handles fetching the user doc from BE
    } catch (err) {
      throw new Error(toReadableError(err) || 'Sign-in failed.')
    }
  }

  /**
   * Creates a Firebase Auth user then registers the user in MongoDB via the BE.
   *
   * Race-condition fix: `createUserWithEmailAndPassword` signs the user in
   * immediately, firing `onAuthStateChanged` before `apiPost('/auth/register')`
   * has run. That first listener call hits `GET /auth/me` → 404 → auto-registers
   * as a race. We sidestep this by calling register ourselves and manually
   * setting userDoc so the redirect in LoginPage fires without waiting for the
   * second onAuthStateChanged cycle.
   *
   * The register endpoint is idempotent, so a concurrent call from the
   * onAuthStateChanged fallback is harmless.
   */
  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(user, { displayName })

      const response = await apiPost<UserMeResponse>('/auth/register', {
        displayName,
        role: UserRole.BUSINESS_OWNER,
      })
      // Manually set userDoc — don't wait for a second onAuthStateChanged cycle
      setUserDoc(toUserDoc(user.uid, response))
    } catch (err) {
      throw new Error(toReadableError(err) || 'Sign-up failed.')
    }
  }

  const signOut = async () => {
    // In mock mode clear state manually — no real Firebase session to end
    if (IS_MOCK) {
      setFirebaseUser(null)
      setUserDoc(null)
      return
    }
    await firebaseSignOut(auth)
    setUserDoc(null)
  }

  const isAdmin = userDoc?.role === UserRole.ADMIN

  return (
    <AuthContext.Provider
      value={{
        firebaseUser, userDoc, loading, isAdmin, error,
        signInWithGoogle, signInWithEmail, signUpWithEmail, signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
