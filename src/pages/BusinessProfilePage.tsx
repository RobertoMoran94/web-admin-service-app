import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useBusinessContext } from '../hooks/useBusinessContext'
import { useServices } from '../hooks/useServices'
import { useEmployees } from '../hooks/useEmployees'
import { defaultHours, type Business, type BusinessHours, type DayHours, type Service, type Employee } from '../types'
import ImageUpload from '../components/ImageUpload'
import { apiPut } from '../api/client'

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

// TODO (Phase 12): fetch from GET /api/v1/categories
const CATEGORIES = ['Barbershop','Hair Salon','Nail Salon','Spa','Tattoo','Beauty','Fitness','Other']

// ── Shared small components ────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors
        ${checked ? 'bg-brand-500' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform
        ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

// ── Profile Preview ───────────────────────────────────────────────────────────

function ProfilePreview({
  business,
  services,
  employees,
  onEdit,
}: {
  business: Partial<Business> & { name: string }
  services: Service[]
  employees: Employee[]
  onEdit: () => void
}) {
  const navigate = useNavigate()

  const infoRows = [
    {
      icon: (
        <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Business Hours',
      value: business.hours
        ? (() => {
            const open = DAYS.filter((d) => business.hours![d].open)
            if (open.length === 0) return 'Closed all week'
            const first = business.hours![open[0]]
            return `${DAY_SHORT[open[0]]}–${DAY_SHORT[open[open.length - 1]]}: ${first.from} – ${first.to}`
          })()
        : 'Not set',
    },
    {
      icon: (
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      label: 'Phone Number',
      value: business.phone || 'Not set',
    },
    {
      icon: (
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Email',
      value: 'Not set',
    },
    {
      icon: (
        <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: 'Address',
      value: business.address || 'Not set',
    },
  ]

  return (
    <div className="max-w-2xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">How your profile looks in the app</p>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
                     bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit profile
        </button>
      </div>

      {/* ── Card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Cover photo */}
        <div className="relative h-44 bg-gradient-to-br from-brand-400 to-brand-600 overflow-hidden">
          {business.coverUrl && (
            <img src={business.coverUrl} alt="Cover" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/15" />
          {/* OPEN badge */}
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-semibold shadow">
            OPEN
          </div>
        </div>

        {/* Logo + name */}
        <div className="px-5 pb-1">
          <div className="flex items-end justify-between -mt-8 mb-3">
            <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white shrink-0">
              {business.logoUrl
                ? <img src={business.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-100">
                    <svg className="w-7 h-7 text-brand-500" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )
              }
            </div>
            {/* Instagram icon placeholder */}
            <div className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900">{business.name || 'Your Business'}</h2>
          {business.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{business.description}</p>
          )}

          {/* Rating row */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map((s) => (
                <svg key={s} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-900">4.9</span>
            <span className="text-sm text-gray-400">(127 reviews)</span>
          </div>

          {/* Address */}
          {business.address && (
            <div className="flex items-center gap-1.5 mt-1.5 mb-4">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-gray-500">{business.address}</p>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 border-t border-b border-gray-100 mx-0">
          {[
            { value: '127', label: 'Reviews', color: 'text-brand-500' },
            { value: '850+', label: 'Bookings', color: 'text-gray-900' },
            { value: `${services.length}`, label: 'Services', color: 'text-orange-400' },
          ].map((stat, i) => (
            <div key={i} className={`py-4 text-center ${i < 2 ? 'border-r border-gray-100' : ''}`}>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-3 px-5 py-4 border-b border-gray-100">
          {[
            {
              label: 'Add Service', path: '/services',
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              ),
              primary: true,
            },
            {
              label: 'Employees', path: '/team',
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
            },
            {
              label: 'Schedule', path: '/calendar',
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
            },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => navigate(btn.path)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-colors
                ${btn.primary
                  ? 'bg-brand-500 text-white hover:bg-brand-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {btn.icon}
              {btn.label}
            </button>
          ))}
        </div>

        {/* Current Services */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">Current Services</p>
            <button
              onClick={() => navigate('/services')}
              className="text-xs text-brand-500 font-medium hover:text-brand-600 transition-colors"
            >
              Manage All
            </button>
          </div>

          {services.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No services added yet.</p>
          ) : (
            <div className="space-y-3">
              {services.slice(0, 4).map((svc) => (
                <div key={svc.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {svc.imageUrl
                      ? <img src={svc.imageUrl} alt={svc.name} className="w-full h-full object-cover" />
                      : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{svc.name}</p>
                    <p className="text-xs text-gray-400 truncate">{svc.description}</p>
                    <p className="text-xs font-semibold text-brand-500 mt-0.5">
                      ${svc.price} · {svc.durationMinutes} min
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => navigate('/services')}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center
                      ${svc.isActive !== false ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <div className={`w-2 h-2 rounded-full ${svc.isActive !== false ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                  </div>
                </div>
              ))}
              {services.length > 4 && (
                <button
                  onClick={() => navigate('/services')}
                  className="text-xs text-brand-500 font-medium hover:text-brand-600 transition-colors"
                >
                  +{services.length - 4} more services
                </button>
              )}
            </div>
          )}
        </div>

        {/* Team Members */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">Team Members</p>
            <button
              onClick={() => navigate('/team')}
              className="text-xs text-brand-500 font-medium hover:text-brand-600 transition-colors"
            >
              Add Employee
            </button>
          </div>

          {employees.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No team members added yet.</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-1">
              {employees.map((emp) => (
                <div key={emp.id} className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100">
                    {emp.avatarUrl
                      ? <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" />
                      : (
                        <div className="w-full h-full flex items-center justify-center bg-brand-100">
                          <span className="text-brand-600 font-semibold text-lg">
                            {emp.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )
                    }
                  </div>
                  <p className="text-xs font-medium text-gray-900 text-center max-w-[60px] leading-tight">{emp.name}</p>
                  <p className="text-xs text-gray-400 text-center">{emp.role}</p>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-xs text-gray-400">Available</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Business Information */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">Business Information</p>
            <button
              onClick={onEdit}
              className="text-xs text-brand-500 font-medium hover:text-brand-600 transition-colors"
            >
              Edit
            </button>
          </div>

          <div className="space-y-0 divide-y divide-gray-50">
            {infoRows.map((row) => (
              <button
                key={row.label}
                onClick={onEdit}
                className="w-full flex items-center gap-3 py-3 text-left hover:bg-gray-50 -mx-2 px-2 rounded-xl transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  {row.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{row.label}</p>
                  <p className="text-xs text-gray-500 truncate">{row.value}</p>
                </div>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!business.coverUrl && !business.logoUrl && !business.description && (
        <p className="text-center text-sm text-gray-400 mt-4">
          Click <strong>Edit profile</strong> to add your cover photo, logo and description.
        </p>
      )}
    </div>
  )
}

// ── Profile Editor ────────────────────────────────────────────────────────────

// Converts the web app's BusinessHours object to the BE's DayHoursDto list
function toBeHours(hours: BusinessHours) {
  return DAYS.map((day) => ({
    day,
    displayName: DAY_LABELS[day],
    isOpen:      hours[day as keyof BusinessHours].open,
    openTime:    hours[day as keyof BusinessHours].from,
    closeTime:   hours[day as keyof BusinessHours].to,
  }))
}

function ProfileEditor({
  initial,
  businessId,
  onSaved,
  onCancel,
}: {
  initial: {
    name: string; description: string; category: string
    address: string; phone: string; logoUrl: string; coverUrl: string
    hours: BusinessHours
  }
  businessId: string
  onSaved: () => void
  onCancel: () => void
}) {
  const [form,   setForm]   = useState(initial)
  const [hours,  setHours]  = useState<BusinessHours>(initial.hours)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const patch = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const setDay = (day: string, delta: Partial<DayHours>) =>
    setHours((h) => ({ ...h, [day]: { ...h[day as keyof BusinessHours], ...delta } }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Business name is required.'); return }
    setError(null)
    setSaving(true)
    try {
      // Business always exists (created automatically on registration) — always PUT
      await apiPut(`/edit-business-profile/${businessId}`, {
        name:                 form.name,
        categories:           [form.category],
        description:          form.description,
        address:              form.address,
        phone:                form.phone,
        logoUrl:              form.logoUrl,
        coverPhotoUrl:        form.coverUrl,
        email:                '',
        website:              '',
        instagramUrl:         '',
        city:                 '',
        state:                '',
        zipCode:              '',
        hours:                toBeHours(hours),
        onlineBookingEnabled: true,
        instantConfirmation:  true,
        smsNotifications:     false,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
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
          <ImageUpload label="Logo" shape="circle"
            value={form.logoUrl} onChange={(url) => patch('logoUrl', url)}
            storagePath={`businesses/${businessId}/logo`} />
          <ImageUpload label="Cover photo" shape="rect"
            value={form.coverUrl} onChange={(url) => patch('coverUrl', url)}
            storagePath={`businesses/${businessId}/cover`} />
        </div>
      </div>

      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Basic information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Business name *</label>
            <input type="text" value={form.name} onChange={(e) => patch('name', e.target.value)}
              placeholder="Elite Barbershop"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={(e) => patch('category', e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => patch('phone', e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input type="text" value={form.address} onChange={(e) => patch('address', e.target.value)}
              placeholder="123 Main St, New York, NY 10001"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => patch('description', e.target.value)}
              rows={3} placeholder="Tell customers about your business…"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
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
                <Toggle checked={dh.open} onChange={(v) => setDay(day, { open: v })} />
                <span className={`text-sm font-medium w-24 shrink-0 ${dh.open ? 'text-gray-700' : 'text-gray-400'}`}>
                  {DAY_LABELS[day]}
                </span>
                {dh.open ? (
                  <div className="flex items-center gap-2">
                    <input type="time" value={dh.from}
                      onChange={(e) => setDay(day, { from: e.target.value })}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    <span className="text-gray-400 text-sm">–</span>
                    <input type="time" value={dh.to}
                      onChange={(e) => setDay(day, { to: e.target.value })}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-brand-500" />
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
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2.5 bg-brand-500 text-white text-sm font-medium rounded-xl
                     hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm
                     flex items-center gap-2">
          {saving && <Spinner />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button onClick={onCancel} disabled={saving}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300
                     rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BusinessProfilePage() {
  const { firebaseUser }          = useAuth()
  const { business, refresh }     = useBusinessContext()
  const { services }              = useServices(business?.id ?? null)
  const { employees }             = useEmployees(business?.id ?? null)

  const [mode, setMode] = useState<'preview' | 'edit'>('preview')

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

  if (!firebaseUser || !business) return null

  if (mode === 'edit') {
    return (
      <ProfileEditor
        initial={initialForm}
        businessId={business.id}
        onSaved={() => { refresh(); setMode('preview') }}
        onCancel={() => setMode('preview')}
      />
    )
  }

  return (
    <ProfilePreview
      business={{ ...initialForm, id: business?.id ?? '', ownerId: business?.ownerId ?? firebaseUser.uid }}
      services={services}
      employees={employees}
      onEdit={() => setMode('edit')}
    />
  )
}
