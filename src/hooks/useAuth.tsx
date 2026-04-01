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
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'
import { UserRole, type UserDoc } from '../types'

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
      // while we're mid-fetch of the Firestore user doc.
      setLoading(true)
      setFirebaseUser(fbUser)

      if (fbUser) {
        try {
          const snap = await getDoc(doc(db, 'users', fbUser.uid))
          if (snap.exists()) {
            setUserDoc({ id: fbUser.uid, ...snap.data() } as UserDoc)
          } else {
            setUserDoc(null)
          }
        } catch (err) {
          console.error('useAuth: failed to fetch user doc', err)
          setUserDoc(null)
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
      // onAuthStateChanged handles the rest
    } catch (err) {
      const msg = toReadableError(err)
      if (msg) setError(msg)
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      const msg = toReadableError(err)
      setError(msg || 'Sign-in failed.')
      throw err
    }
  }

  /**
   * Creates a Firebase Auth user + Firestore doc with role = business_owner.
   * Since this is the Business Portal, anyone self-registering is a business owner.
   * Admin accounts must be set manually in Firestore.
   */
  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    setError(null)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(user, { displayName })
      await setDoc(doc(db, 'users', user.uid), {
        email:       user.email ?? email,
        displayName,
        role:        UserRole.BUSINESS_OWNER,
        createdAt:   serverTimestamp(),
      })
      // onAuthStateChanged fires, fetches the new doc, and loading goes false
    } catch (err) {
      const msg = toReadableError(err)
      setError(msg || 'Sign-up failed.')
      throw err
    }
  }

  const signOut = async () => {
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
