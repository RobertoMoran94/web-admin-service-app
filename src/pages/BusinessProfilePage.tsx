import { useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useBusinessContext } from '../hooks/useBusinessContext'
import { defaultHours, type Business, type BusinessHours, type DayHours } from '../types'
import ImageUpload from '../components/ImageUpload'

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const
const DAY_LABELS: Record<string, string> = {
  monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday',
  friday:'Friday', saturday:'Saturday', sunday:'Sunday',
}
const DAY_SHORT: Record<string, string> = {
  monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu',
  friday:'Fri', saturday:'Sat', sunday:'Sun',
}

// TODO (Phase 12): fetch categories from GET /api/v1/categories
const CATEGORIES = ['Barbershop','Hair Salon','Nail Salon','Spa','Tattoo','Beauty','Fitness','Other']

// ── Small components ──────────────────────────────────────────────────────────

/** Pill toggle switch */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors
        ${checked ? 'bg-brand-500' : 'bg-gray-200'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform
          ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
      />
    </button>
  )
}

/** Opening hours in preview (read-only) */
function HoursPreview({ hours }: { hours: BusinessHours }) {
  return (
    <div className="space-y-1.5">
      {DAYS.map((day) => {
        const dh = hours[day]
        return (
          <div key={day} className="flex items-center justify-between text-sm">
            <span className="text-gray-500 w-20 shrink-0">{DAY_SHORT[day]}</span>
            {dh.open
              ? <span className="text-gray-700 font-medium">{dh.from} – {dh.to}</span>
              : <span className="text-red-400 font-medium">Closed</span>
            }
          </div>
        )
      })}
    </div>
  )
}

/** Category pill */
function CategoryPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-600 border border-brand-100">
      {label}
    </span>
  )
}

// ── Profile preview ───────────────────────────────────────────────────────────
// Mirrors how the business profile looks in the mobile app.

function ProfilePreview({
  business,
  onEdit,
}: {
  business: Partial<Business> & { name: string }
  onEdit: () => void
}) {
  return (
    <div className="max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">How your profile looks in the app</p>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500
                     rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit profile
        </button>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Cover photo */}
        <div className="relative h-44 bg-gradient-to-br from-brand-400 to-brand-600 overflow-hidden">
          {business.coverUrl && (
            <img
              src={business.coverUrl}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Logo + name row */}
        <div className="px-5 pb-4">
          {/* Logo overlaps the cover */}
          <div className="flex items-end justify-between -mt-8 mb-3">
            <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white shrink-0">
              {business.logoUrl
                ? <img src={business.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-100">
                    <svg className="w-7 h-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )
              }
            </div>
            {business.category && <CategoryPill label={business.category} />}
          </div>

          <h2 className="text-xl font-bold text-gray-900">{business.name}</h2>

          {/* Address */}
          {business.address && (
            <div className="flex items-start gap-1.5 mt-1.5">
              <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-gray-500">{business.address}</p>
            </div>
          )}

          {/* Phone */}
          {business.phone && (
            <div className="flex items-center gap-1.5 mt-1">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <p className="text-sm text-gray-500">{business.phone}</p>
            </div>
          )}
        </div>

        {/* Description */}
        {business.description && (
          <>
            <div className="h-px bg-gray-100 mx-5" />
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">About</p>
              <p className="text-sm text-gray-600 leading-relaxed">{business.description}</p>
            </div>
          </>
        )}

        {/* Hours */}
        {business.hours && (
          <>
            <div className="h-px bg-gray-100 mx-5" />
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Opening hours</p>
              <HoursPreview hours={business.hours} />
            </div>
          </>
        )}
      </div>

      {/* Empty state hint */}
      {!business.coverUrl && !business.logoUrl && !business.description && (
        <p className="text-center text-sm text-gray-400 mt-4">
          Click <strong>Edit profile</strong> to add your cover photo, logo and description.
        </p>
      )}
    </div>
  )
}

// ── Profile editor ────────────────────────────────────────────────────────────

function ProfileEditor({
  initial,
  businessId,
  ownerId,
  onSaved,
  onCancel,
}: {
  initial: {
    name: string; description: string; category: string
    address: string; phone: string; logoUrl: string; coverUrl: string
    hours: BusinessHours
  }
  businessId: string
  ownerId: string
  onSaved: () => void
  onCancel: () => void
}) {
  const [form,   setForm]   = useState(initial)
  const [hours,  setHours]  = useState<BusinessHours>(initial.hours)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const patch = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const setDay = (day: string, delta: Partial<DayHours>) => {
    setHours((h) => ({ ...h, [day]: { ...h[day as keyof BusinessHours], ...delta } }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Business name is required.'); return }
    setError(null)
    setSaving(true)
    try {
      await setDoc(doc(db, 'businesses', businessId), {
        ...form,
        hours,
        ownerId,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">Changes appear in the mobile app immediately</p>
        </div>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancel
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {/* Photos */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        <h2 className="text-sm font-semibold text-gray-900">Photos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ImageUpload
            label="Logo"
            shape="circle"
            value={form.logoUrl}
            onChange={(url) => patch('logoUrl', url)}
            storagePath={`businesses/${businessId}/logo`}
          />
          <ImageUpload
            label="Cover photo"
            shape="rect"
            value={form.coverUrl}
            onChange={(url) => patch('coverUrl', url)}
            storagePath={`businesses/${businessId}/cover`}
          />
        </div>
      </div>

      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Basic information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Business name *</label>
            <input
              type="text" value={form.name}
              onChange={(e) => patch('name', e.target.value)}
              placeholder="Elite Barbershop"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            {/* TODO (Phase 12): populate from GET /api/v1/categories */}
            <select
              value={form.category}
              onChange={(e) => patch('category', e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel" value={form.phone}
              onChange={(e) => patch('phone', e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text" value={form.address}
              onChange={(e) => patch('address', e.target.value)}
              placeholder="123 Main St, New York, NY 10001"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => patch('description', e.target.value)}
              rows={3} placeholder="Tell customers about your business…"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Opening hours */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Opening hours</h2>
        <div className="space-y-3">
          {DAYS.map((day) => {
            const dh = hours[day]
            return (
              <div key={day} className="flex items-center gap-3 py-1">
                {/* Toggle */}
                <Toggle checked={dh.open} onChange={(v) => setDay(day, { open: v })} />

                {/* Day label */}
                <span className={`text-sm font-medium w-24 shrink-0 ${dh.open ? 'text-gray-700' : 'text-gray-400'}`}>
                  {DAY_LABELS[day]}
                </span>

                {/* Time inputs or closed label */}
                {dh.open ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time" value={dh.from}
                      onChange={(e) => setDay(day, { from: e.target.value })}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="text-gray-400 text-sm">–</span>
                    <input
                      type="time" value={dh.to}
                      onChange={(e) => setDay(day, { to: e.target.value })}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-red-400 font-medium">Closed</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Save / Cancel */}
      <div className="flex items-center gap-3 pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-brand-500 text-white text-sm font-medium rounded-xl
                     hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm
                     flex items-center gap-2"
        >
          {saving && (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          )}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300
                     rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BusinessProfilePage() {
  const { firebaseUser } = useAuth()
  const { business }     = useBusinessContext()

  const [mode, setMode] = useState<'preview' | 'edit'>('preview')

  // Derive the form initial values from the loaded business doc
  const initialForm = {
    name:        business?.name        ?? '',
    description: business?.description ?? '',
    category:    business?.category    ?? 'Barbershop',
    address:     business?.address     ?? '',
    phone:       business?.phone       ?? '',
    logoUrl:     business?.logoUrl     ?? '',
    coverUrl:    business?.coverUrl    ?? '',
    hours:       business?.hours       ?? defaultHours(),
  }

  // If no business loaded yet, show preview with empty state
  const previewData = {
    ...initialForm,
    id:      business?.id ?? '',
    ownerId: business?.ownerId ?? firebaseUser?.uid ?? '',
  }

  if (!firebaseUser) return null

  const businessId = business?.id ?? firebaseUser.uid

  if (mode === 'edit') {
    return (
      <ProfileEditor
        initial={initialForm}
        businessId={businessId}
        ownerId={firebaseUser.uid}
        onSaved={() => setMode('preview')}
        onCancel={() => setMode('preview')}
      />
    )
  }

  return (
    <ProfilePreview
      business={previewData}
      onEdit={() => setMode('edit')}
    />
  )
}
