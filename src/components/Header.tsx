import { useAuth } from '../hooks/useAuth'

export default function Header() {
  const { userDoc, firebaseUser, signOut } = useAuth()

  const displayName = userDoc?.displayName || firebaseUser?.displayName || 'Admin'
  const email       = userDoc?.email       || firebaseUser?.email       || ''
  const photoURL    = userDoc?.photoURL    || firebaseUser?.photoURL    || undefined

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900">Admin Portal</span>
        </div>

        {/* User menu */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {photoURL ? (
              <img src={photoURL} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-sm font-medium">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900 leading-tight">{displayName}</p>
              <p className="text-xs text-gray-500 leading-tight">{email}</p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
