import { useState, useEffect } from 'react'
import {
  collection, getDocs, doc, deleteDoc,
  setDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useUsers } from '../hooks/useUsers'
import { UserRole, defaultHours, type UserDoc, type Business, type UserRoleValue } from '../types'
import ImageUpload from '../components/ImageUpload'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BusinessOwnerRow {
  user:     UserDoc
  business: Business | null
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BusinessPage() {
  const { users, loading: usersLoading, updateRole, refresh } = useUsers()
  const [businesses,    setBusinesses]    = useState<Business[]>([])
  const [bizLoading,    setBizLoading]    = useState(true)
  const [selected,      setSelected]      = useState<BusinessOwnerRow | null>(null)
  const [deleteTarget,  setDeleteTarget]  = useState<BusinessOwnerRow | null>(null)
  const [search,        setSearch]        = useState('')

  // Fetch all businesses
  useEffect(() => {
    getDocs(collection(db, 'businesses'))
      .then((snap) => setBusinesses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Business))))
      .catch(console.error)
      .finally(() => setBizLoading(false))
  }, [])

  const loading = usersLoading || bizLoading

  // Merge: business owners + their business doc
  const owners: BusinessOwnerRow[] = users
    .filter((u) => u.role === UserRole.BUSINESS_OWNER || u.role === UserRole.ADMIN)
    .map((u) => ({
      user:     u,
      business: businesses.find((b) => b.ownerId === u.id) ?? null,
    }))
    .filter((row) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        row.user.email.toLowerCase().includes(q) ||
        (row.user.displayName || '').toLowerCase().includes(q) ||
        (row.business?.name || '').toLowerCase().includes(q)
      )
    })

  const handleDelete = async (row: BusinessOwnerRow) => {
    // Demote user to customer + delete their business doc
    await updateRole(row.user.id, UserRole.CUSTOMER as UserRoleValue)
    if (row.business) {
      await deleteDoc(doc(db, 'businesses', row.business.id))
      setBusinesses((prev) => prev.filter((b) => b.id !== row.business!.id))
    }
    setDeleteTarget(null)
    setSelected(null)
    refresh()
  }

  if (selected) {
    return (
      <BusinessDetail
        row={selected}
        onBack={() => setSelected(null)}
        onDelete={() => setDeleteTarget(selected)}
        onSaved={(updated) => {
          setBusinesses((prev) =>
            prev.map((b) => (b.id === updated.id ? updated : b))
          )
          setSelected((r) => r ? { ...r, business: updated } : r)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{owners.length} business owner{owners.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={refresh} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Search by owner or business name…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-400 text-sm gap-2">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Loading…
        </div>
      ) : owners.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">No business owners yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {owners.map((row) => (
            <div key={row.user.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">

              {/* Cover */}
              {row.business?.coverUrl ? (
                <img src={row.business.coverUrl} alt="" className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 bg-gradient-to-br from-brand-100 to-brand-200" />
              )}

              <div className="p-4">
                {/* Logo + name */}
                <div className="flex items-start gap-3 -mt-8 mb-3">
                  {row.business?.logoUrl ? (
                    <img src={row.business.logoUrl} alt="" className="w-14 h-14 rounded-xl border-2 border-white object-cover shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl border-2 border-white bg-brand-500 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm">
                      {(row.business?.name || row.user.displayName || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="pt-6 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {row.business?.name || <span className="text-gray-400 italic">No business set up</span>}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{row.business?.category || ''}</p>
                  </div>
                </div>

                {/* Owner */}
                <div className="flex items-center gap-2 mb-4">
                  {row.user.photoURL ? (
                    <img src={row.user.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-medium">
                      {row.user.displayName?.charAt(0) ?? '?'}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 truncate">{row.user.email}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => setSelected(row)}
                    className="flex-1 py-1.5 text-xs font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
                    View / Edit
                  </button>
                  <button onClick={() => setDeleteTarget(row)}
                    className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">Delete this business?</p>
            <p className="text-sm text-gray-500 mb-1">
              <strong>{deleteTarget.business?.name || deleteTarget.user.email}</strong>
            </p>
            <p className="text-xs text-gray-400 mb-6">
              The owner account will be demoted to Customer. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteTarget)} className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Business detail / edit ────────────────────────────────────────────────────

interface DetailProps {
  row:     BusinessOwnerRow
  onBack:  () => void
  onDelete: () => void
  onSaved: (b: Business) => void
}

const CATEGORIES = ['Barbershop','Hair Salon','Nail Salon','Spa','Tattoo','Beauty','Fitness','Other']
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const
const DAY_LABELS: Record<string, string> = {
  monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu',
  friday:'Fri', saturday:'Sat', sunday:'Sun',
}

function BusinessDetail({ row, onBack, onDelete, onSaved }: DetailProps) {
  const biz = row.business

  const [form, setForm] = useState({
    name:        biz?.name        ?? '',
    description: biz?.description ?? '',
    category:    biz?.category    ?? 'Barbershop',
    address:     biz?.address     ?? '',
    phone:       biz?.phone       ?? '',
    logoUrl:     biz?.logoUrl     ?? '',
    coverUrl:    biz?.coverUrl    ?? '',
  })
  const [hours,  setHours]  = useState(biz?.hours ?? defaultHours())
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const id = biz?.id ?? row.user.id
      const updated: Business = {
        id,
        ownerId:   row.user.id,
        ...form,
        hours,
        createdAt: biz?.createdAt ?? Date.now(),
      }
      await setDoc(doc(db, 'businesses', id), { ...updated, updatedAt: serverTimestamp() }, { merge: true })
      onSaved(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally { setSaving(false) }
  }

  const setDay = (day: string, patch: Partial<{ open: boolean; from: string; to: string }>) => {
    setHours((h) => ({ ...h, [day]: { ...h[day as keyof typeof h], ...patch } }))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All businesses
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">{form.name || row.user.email}</span>
      </div>

      {/* Owner info banner */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
        {row.user.photoURL ? (
          <img src={row.user.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold">
            {row.user.displayName?.charAt(0) ?? '?'}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-900">{row.user.displayName || '—'}</p>
          <p className="text-xs text-gray-500">{row.user.email}</p>
        </div>
        <button onClick={onDelete} className="ml-auto px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
          Delete account
        </button>
      </div>

      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Basic information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Elite Barbershop"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+1 (555) 000-0000"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="123 Main St, New York"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2} placeholder="About this business…"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900">Photos</h2>
        <ImageUpload label="Logo" value={form.logoUrl}
          onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
          storagePath={`businesses/${biz?.id ?? row.user.id}`} shape="circle" />
        <ImageUpload label="Cover photo" value={form.coverUrl}
          onChange={(url) => setForm((f) => ({ ...f, coverUrl: url }))}
          storagePath={`businesses/${biz?.id ?? row.user.id}`} shape="rect" />
      </div>

      {/* Hours */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Opening hours</h2>
        <div className="space-y-3">
          {DAYS.map((day) => {
            const dh = hours[day]
            return (
              <div key={day} className="flex items-center gap-4">
                <label className="flex items-center gap-2 w-24 shrink-0 cursor-pointer">
                  <input type="checkbox" checked={dh.open} onChange={(e) => setDay(day, { open: e.target.checked })} className="w-4 h-4 accent-brand-500" />
                  <span className="text-sm font-medium text-gray-700">{DAY_LABELS[day]}</span>
                </label>
                {dh.open ? (
                  <div className="flex items-center gap-2">
                    <input type="time" value={dh.from} onChange={(e) => setDay(day, { from: e.target.value })}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    <span className="text-gray-400 text-sm">to</span>
                    <input type="time" value={dh.to} onChange={(e) => setDay(day, { to: e.target.value })}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Closed</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving || !form.name}
          className="px-6 py-2.5 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
      </div>
    </div>
  )
}
