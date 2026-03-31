// ── User roles ────────────────────────────────────────────────────────────────
export const UserRole = {
  CUSTOMER:       'customer',
  BUSINESS_OWNER: 'business_owner',
  ADMIN:          'admin',
} as const

export type UserRoleValue = typeof UserRole[keyof typeof UserRole]

// ── Firestore user document ───────────────────────────────────────────────────
export interface UserDoc {
  id:          string
  email:       string
  displayName: string
  role:        UserRoleValue
  createdAt:   number
  photoURL?:   string
  businessId?: string   // set once a business is created for this owner
}

// ── Business ──────────────────────────────────────────────────────────────────
export interface Business {
  id:          string
  ownerId:     string
  name:        string
  description: string
  category:    string
  address:     string
  phone:       string
  logoUrl:     string
  coverUrl:    string
  createdAt:   number
  hours:       BusinessHours
}

export interface BusinessHours {
  monday:    DayHours
  tuesday:   DayHours
  wednesday: DayHours
  thursday:  DayHours
  friday:    DayHours
  saturday:  DayHours
  sunday:    DayHours
}

export interface DayHours {
  open:  boolean
  from:  string   // "09:00"
  to:    string   // "18:00"
}

export const defaultHours = (): BusinessHours => ({
  monday:    { open: true,  from: '09:00', to: '18:00' },
  tuesday:   { open: true,  from: '09:00', to: '18:00' },
  wednesday: { open: true,  from: '09:00', to: '18:00' },
  thursday:  { open: true,  from: '09:00', to: '18:00' },
  friday:    { open: true,  from: '09:00', to: '18:00' },
  saturday:  { open: true,  from: '10:00', to: '15:00' },
  sunday:    { open: false, from: '10:00', to: '15:00' },
})

// ── Service ───────────────────────────────────────────────────────────────────
export interface Service {
  id:              string
  name:            string
  description:     string
  price:           number
  durationMinutes: number
  imageUrl:        string
  isActive:        boolean
  createdAt:       number
}

// ── Employee ──────────────────────────────────────────────────────────────────
export interface Employee {
  id:        string
  name:      string
  role:      string
  avatarUrl: string
  isActive:  boolean
  createdAt: number
}

// ── Metrics (mock until backend is live) ─────────────────────────────────────
export interface DailyRevenue {
  date:    string   // "Apr 1"
  revenue: number
}

export interface ServiceStat {
  name:     string
  bookings: number
}

export interface UpcomingBooking {
  id:          string
  customerName: string
  service:     string
  employee:    string
  date:        string
  time:        string
  price:       number
  status:      'confirmed' | 'pending' | 'cancelled'
}
