import { useState } from 'react'
import { useBusinessContext } from '../hooks/useBusinessContext'
import { useEmployees } from '../hooks/useEmployees'
import ImageUpload from '../components/ImageUpload'
import type { Employee } from '../types'

const EMPTY_FORM = { name: '', role: '', avatarUrl: '', isActive: true }

export default function TeamPage() {
  const { business } = useBusinessContext()
  const { employees, loading, addEmployee, updateEmployee, deleteEmployee } = useEmployees(business?.id ?? null)

  const [showForm,   setShowForm]   = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [deleteId,   setDeleteId]   = useState<string | null>(null)

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setShowForm(true) }
  const openEdit = (e: Employee) => {
    setEditTarget(e)
    setForm({ name: e.name, role: e.role, avatarUrl: e.avatarUrl, isActive: e.isActive })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      editTarget ? await updateEmployee(editTarget.id, form) : await addEmployee(form)
      setShowForm(false)
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">{employees.length} team members</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add member
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-400 text-sm">Loading…</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-400 text-sm">No team members yet.</p>
          <button onClick={openAdd} className="mt-3 text-brand-500 text-sm font-medium hover:underline">
            Add your first team member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
              {emp.avatarUrl ? (
                <img src={emp.avatarUrl} alt={emp.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xl font-bold shrink-0">
                  {emp.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.role || 'No role set'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${emp.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {emp.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(emp)} className="flex-1 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Edit</button>
                  <button onClick={() => setDeleteId(emp.id)} className="flex-1 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{editTarget ? 'Edit member' : 'Add member'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {[
                { label: 'Full name',    key: 'name', placeholder: 'Mike Johnson'    },
                { label: 'Role / title', key: 'role', placeholder: 'Senior Stylist'  },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="text"
                    value={(form as Record<string, unknown>)[key] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              ))}

              <ImageUpload
                label="Profile photo"
                value={form.avatarUrl}
                onChange={(url) => setForm((f) => ({ ...f, avatarUrl: url }))}
                storagePath={`businesses/${business?.id ?? 'unknown'}/employees`}
                shape="circle"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-brand-500" />
                <span className="text-sm text-gray-700">Active (available for bookings)</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 py-2.5 text-sm font-medium bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="font-semibold text-gray-900 mb-2">Remove team member?</p>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={() => { deleteEmployee(deleteId); setDeleteId(null) }} className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
