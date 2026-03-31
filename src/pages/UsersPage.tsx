import { useState, useMemo, useCallback } from 'react'

const PAGE_SIZE = 20
import UserTable from '../components/UserTable'
import { useUsers } from '../hooks/useUsers'
import { UserRole, type UserRoleValue } from '../types'

type FilterValue = UserRoleValue | 'all'

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: 'All',             value: 'all'                   },
  { label: 'Customers',       value: UserRole.CUSTOMER       },
  { label: 'Business Owners', value: UserRole.BUSINESS_OWNER },
  { label: 'Admins',          value: UserRole.ADMIN          },
]

export default function UsersPage() {
  const { users, loading, error, updateRole, refresh } = useUsers()
  const [filter, setFilter] = useState<FilterValue>('all')
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)

  // Reset to page 1 when filter/search changes
  const handleFilter = useCallback((v: FilterValue) => { setFilter(v); setPage(1) }, [])
  const handleSearch = useCallback((v: string)      => { setSearch(v); setPage(1) }, [])

  const filtered = useMemo(() => {
    let list = filter === 'all' ? users : users.filter((u) => u.role === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (u) => u.email.toLowerCase().includes(q) || (u.displayName || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [users, filter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage roles for all registered accounts</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total users',     count: users.length,                                              color: 'bg-gray-100   text-gray-700'   },
          { label: 'Customers',       count: users.filter((u) => u.role === UserRole.CUSTOMER).length,  color: 'bg-blue-50    text-blue-700'   },
          { label: 'Business owners', count: users.filter((u) => u.role === UserRole.BUSINESS_OWNER).length, color: 'bg-green-50 text-green-700' },
          { label: 'Admins',          count: users.filter((u) => u.role === UserRole.ADMIN).length,     color: 'bg-purple-50  text-purple-700' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-xl p-4 ${color}`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" placeholder="Search by name or email…" value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === value ? 'bg-brand-500 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {loading && !users.length ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Loading users…
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">No users match your filter.</div>
      ) : (
        <UserTable users={visible} onRoleChange={updateRole} />
      )}

      {/* Pagination */}
      {!loading && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} users
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-xs text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === p ? 'bg-brand-500 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
