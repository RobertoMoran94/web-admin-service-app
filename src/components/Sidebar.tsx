import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useBusinessContext } from '../hooks/useBusinessContext'
import { useNavItems, ICON_PATHS } from '../hooks/useNavItems'

// ── Icon renderer ─────────────────────────────────────────────────────────────
// Renders the SVG path from the ICON_PATHS map so Sidebar stays free of
// hardcoded path data. When nav items come from the BE, this still works.
function NavIcon({ name }: { name: string }) {
  const d = ICON_PATHS[name]
  if (!d) return null
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { userDoc, isAdmin, signOut } = useAuth()
  const { business, allBusinesses, selectBusiness } = useBusinessContext()
  const navItems = useNavItems()
  const navigate  = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">

      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500 shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Business Portal</span>
        </div>
      </div>

      {/* Admin: business switcher */}
      {isAdmin && allBusinesses.length > 0 && (
        <div className="px-3 pt-3">
          <label className="block text-xs font-medium text-gray-400 mb-1 px-2">
            Viewing business
          </label>
          <select
            value={business?.id ?? ''}
            onChange={(e) => {
              const found = allBusinesses.find((b) => b.id === e.target.value)
              if (found) selectBusiness(found)
            }}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5
                       bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {allBusinesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Business owner: show business name */}
      {!isAdmin && business && (
        <div className="px-5 pt-3">
          <p className="text-xs text-gray-400">Your business</p>
          <p className="text-sm font-medium text-gray-700 truncate">{business.name}</p>
        </div>
      )}

      {/* Nav — driven entirely by useNavItems; no role logic here */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <NavIcon name={icon} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          {userDoc?.photoURL ? (
            <img src={userDoc.photoURL} alt=""
              className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center
                            text-brand-600 text-sm font-semibold shrink-0">
              {(userDoc?.displayName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate leading-tight">
              {userDoc?.displayName || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate leading-tight">{userDoc?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500
                     hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )
}
