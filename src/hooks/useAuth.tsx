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
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'
import { UserRole, type UserDoc } from '../types'

// ── Context shape ─────────────────────────────────────────────────────────────

interface AuthState {
  /** Firebase Auth user, null while loading or signed out */
  firebaseUser: User | null
  /** Firestore user doc — populated after sign-in and admin check */
  userDoc:      UserDoc | null
  /** True while we are resolving auth state on mount */
  loading:      boolean
  /** True when the signed-in user has role = "admin" */
  isAdmin:      boolean
  /** Error message if sign-in or role-fetch failed */
  error:        string | null
  signInWithGoogle: () => Promise<void>
  signOut:          () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [userDoc,      setUserDoc]      = useState<UserDoc | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)

      if (fbUser) {
        try {
          const snap = await getDoc(doc(db, 'users', fbUser.uid))
          if (snap.exists()) {
            setUserDoc({ id: fbUser.uid, ...snap.data() } as UserDoc)
          } else {
            // User exists in Auth but not in Firestore — not an admin
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

  const signInWithGoogle = async () => {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
      // onAuthStateChanged above will handle fetching the Firestore doc
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign-in failed'
      setError(message)
    }
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setUserDoc(null)
  }

  const isAdmin = userDoc?.role === UserRole.ADMIN

  return (
    <AuthContext.Provider
      value={{ firebaseUser, userDoc, loading, isAdmin, error, signInWithGoogle, signOut }}
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
