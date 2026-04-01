/**
 * useNavItems
 * ============
 * Single source of truth for sidebar navigation.
 *
 * Architecture:
 *  - The backend is the authority on which sections a user can access.
 *  - This hook exposes the nav items as a plain array; the Sidebar just
 *    renders whatever it receives — no role checks in the component.
 *
 * TODO (Phase 12): replace the mock implementation below with a real call:
 *   const { data } = await apiGet<NavItemDto[]>('/me/nav')
 *   The Spring Boot endpoint reads the user's role from Firestore/JWT and
 *   returns only the items that role is allowed to see.
 *
 * NavItemDto (matches contract.ts, add there when wiring BE):
 *   { id: string; path: string; label: string; icon: string }
 *   `icon` is a key into the ICONS map below so the frontend stays pure TSX.
 */

import { useAuth } from './useAuth'
import { UserRole } from '../types'

export interface NavItem {
  path:  string
  label: string
  icon:  string   // key into ICON_PATHS below
}

/**
 * SVG path data keyed by icon name.
 * Keeping paths here (not in JSX) lets them be serialised and sent from the BE
 * if we ever want to drive icons server-side too.
 */
export const ICON_PATHS: Record<string, string> = {
  overview:  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  calendar:  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  services:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  team:      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  profile:   'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  business:  'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  users:     'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
}

// Items every authenticated user (business_owner + admin) can see
const BASE_ITEMS: NavItem[] = [
  { path: '/overview',  label: 'Overview',         icon: 'overview'  },
  { path: '/calendar',  label: 'Calendar',          icon: 'calendar'  },
  { path: '/services',  label: 'Services',          icon: 'services'  },
  { path: '/team',      label: 'Team',              icon: 'team'      },
  { path: '/profile',   label: 'Business Profile',  icon: 'profile'   },
]

// Extra items only admins can see — returned by the BE for admin role
const ADMIN_ONLY_ITEMS: NavItem[] = [
  { path: '/business',  label: 'Businesses',  icon: 'business' },
  { path: '/users',     label: 'Users',       icon: 'users'    },
]

/**
 * Returns the nav items the current user is allowed to see.
 *
 * RIGHT NOW  — derived from userDoc.role in the frontend (temporary).
 * PHASE 12   — replace body with: return useQuery('/me/nav') result.
 */
export function useNavItems(): NavItem[] {
  const { userDoc } = useAuth()

  // TODO (Phase 12): call apiGet<NavItem[]>('/me/nav') here instead
  if (userDoc?.role === UserRole.ADMIN) {
    return [...BASE_ITEMS, ...ADMIN_ONLY_ITEMS]
  }
  return BASE_ITEMS
}
