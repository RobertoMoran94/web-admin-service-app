import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { UserRole } from '../types'

interface Props {
  children: React.ReactNode
}

/**
 * Allows admin AND business_owner roles.
 * Guests and plain customers are rejected.
 *
 * Note: in VITE_MOCK_AUTH=true dev mode, useAuth injects a real-looking
 * firebaseUser + userDoc into state, so this component needs no special
 * handling — it just works as in production.
 */
export default function ProtectedRoute({ children }: Props) {
  const { firebaseUser, userDoc, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="animate-spin w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    )
  }

  // Not authenticated at all → send to login
  if (!firebaseUser) return <Navigate to="/login" replace />

  // Authenticated but wrong role → show access denied
  const hasAccess =
    userDoc?.role === UserRole.ADMIN ||
    userDoc?.role === UserRole.BUSINESS_OWNER

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Access denied</h2>
          <p className="mt-2 text-sm text-gray-500">
            This portal is for business owners and admins only.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="mt-6 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-xl
                       hover:bg-brand-600 transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
