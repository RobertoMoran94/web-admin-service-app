import { useState, useEffect } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useBusinessContext } from '../hooks/useBusinessContext'
import { defaultHours, type BusinessHours, type DayHours } from '../types'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const
const DAY_LABELS: Record<string, string> = {
  monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu',
  friday:'Fri', saturday:'Sat', sunday:'Sun',
}

const CATEGORIES = ['Barbershop','Hair Salon','Nail Salon','Spa','Tattoo','Beauty','Fitness','Other']

export default function BusinessProfilePage() {
  const { firebaseUser } = useAuth()
  const { business } = useBusinessContext()

  const [form, setForm] = useState({
    name: '', description: '', category: 'Barbershop',
    address: '', phone: '', logoUrl: '', coverUrl: '',
  })
  const [hours,   setHours]   = useState<BusinessHours>(defaultHours())
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  // Populate form when business loads
  useEffect(() => {
    if (!business) return
    setForm({
      name:        business.name        || '',
      description: business.description || '',
      category:    business.category    || 'Barbershop',
      address:     business.address     || '',
      phone:       business.phone       || '',
      logoUrl:     business.logoUrl     || '',
      coverUrl:    business.coverUrl    || '',
    })
    if (business.hours) setHours(business.hours)
  }, [business])

  const handleSave = async () => {
    if (!firebaseUser) return
    setSaving(true)
    try {
      const id = business?.id ?? firebaseUser.uid
      await setDoc(doc(db, 'businesses', id), {
        ...form,
        hours,
        ownerId:   firebaseUser.uid,
        updatedAt: serverTimestamp(),
        ...(business ? {} : { createdAt: serverTimestamp() }),
      }, { merge: true })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally { setSaving(false) }
  }

  const setDay = (day: string, patch: Partial<DayHours>) => {
    setHours((h) => ({
      ...h,
      [day]: { ...h[day as keyof BusinessHours], ...patch },
    }))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">This information appears in the mobile app</p>
      </div>

      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Basic information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
            <input
              type="text" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Elite Barbershop"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel" value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+1 (555) 000-0000"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text" value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="123 Main St, New York, NY 10001"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3} placeholder="Tell customers about your business…"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Photos</h2>
        {[
          { label: 'Logo URL',       key: 'logoUrl',  placeholder: 'https://…/logo.png',  preview: form.logoUrl,  round: true },
          { label: 'Cover photo URL',key: 'coverUrl', placeholder: 'https://…/cover.jpg', preview: form.coverUrl, round: false },
        ].map(({ label, key, placeholder, preview, round }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="flex items-center gap-3">
              {preview ? (
                <img src={preview} alt="" className={`w-12 h-12 object-cover shrink-0 ${round ? 'rounded-full' : 'rounded-lg'}`} />
              ) : (
                <div className={`w-12 h-12 bg-gray-100 shrink-0 ${round ? 'rounded-full' : 'rounded-lg'}`} />
              )}
              <input
                type="text" value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        ))}
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
                  <input
                    type="checkbox" checked={dh.open}
                    onChange={(e) => setDay(day, { open: e.target.checked })}
                    className="w-4 h-4 accent-brand-500"
                  />
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

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving || !form.name}
          className="px-6 py-2.5 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
      </div>
    </div>
  )
}
