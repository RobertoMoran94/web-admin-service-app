import { useState } from 'react'
import { UserRole, type UserDoc, type UserRoleValue } from '../types'
import RoleBadge from './RoleBadge'

interface Props {
  users:      UserDoc[]
  onRoleChange: (uid: string, role: UserRoleValue) => Promise<void>
}

// Roles an admin can assign — not including "admin" itself (safety)
const ASSIGNABLE_ROLES: { value: UserRoleValue; label: string }[] = [
  { value: UserRole.CUSTOMER,       label: 'Customer'        },
  { value: UserRole.PENDING_OWNER,  label: 'Pending Approval' },
  { value: UserRole.BUSINESS_OWNER, label: 'Business Owner'  },
]

export default function UserTable({ users, onRoleChange }: Props) {
  const [loadingUid, setLoadingUid] = useState<string | null>(null)
  const [toastMsg,   setToastMsg]   = useState<string | null>(null)

  const handleRoleChange = async (uid: string, newRole: UserRoleValue) => {
    setLoadingUid(uid)
    try {
      await onRoleChange(uid, newRole)
      setToastMsg('Role updated successfully')
      setTimeout(() => setToastMsg(null), 3000)
    } catch {
      setToastMsg('Failed to update role — please try again')
      setTimeout(() => setToastMsg(null), 4000)
    } finally {
      setLoadingUid(null)
    }
  }

  return (
    <div className="relative">

      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-gray-900 text-white text-sm rounded-xl shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change role</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {users.map((user) => {
              const isLoading = loadingUid === user.id
              const isAdmin   = user.role === UserRole.ADMIN

              return (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">

                  {/* User info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-medium shrink-0">
                          {(user.displayName || user.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{user.displayName || '—'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role badge */}
                  <td className="px-6 py-4">
                    <RoleBadge role={user.role} />
                  </td>

                  {/* Joined date */}
                  <td className="px-6 py-4 text-gray-500 hidden md:table-cell">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>

                  {/* Role selector */}
                  <td className="px-6 py-4">
                    {isAdmin ? (
                      <span className="text-xs text-gray-400 italic">Admin — cannot be changed</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value={user.role}
                          disabled={isLoading}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRoleValue)}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5
                                     bg-white text-gray-700
                                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {ASSIGNABLE_ROLES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>

                        {isLoading && (
                          <svg className="animate-spin w-4 h-4 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
