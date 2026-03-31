// ── User roles ────────────────────────────────────────────────────────────────
// These must match the strings stored in Firestore /users/{uid}.role
// and in the KMP mobile app's UserRole.kt

export const UserRole = {
  CUSTOMER:       'customer',
  BUSINESS_OWNER: 'business_owner',
  PENDING_OWNER:  'pending_owner',
  ADMIN:          'admin',
} as const

export type UserRoleValue = typeof UserRole[keyof typeof UserRole]

// ── Firestore user document ───────────────────────────────────────────────────

export interface UserDoc {
  id:           string
  email:        string
  displayName:  string
  role:         UserRoleValue
  createdAt:    number   // epoch ms
  photoURL?:    string
}
