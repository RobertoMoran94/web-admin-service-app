import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { fetchAndActivate, getBoolean } from 'firebase/remote-config'
import { remoteConfig } from '../lib/firebase'

// ── Flag keys — keep in sync with Firebase Remote Config console ──────────────

export const FLAG_ANALYTICS_ENABLED            = 'analytics_enabled'
export const FLAG_BOOKING_CANCELLATION_ENABLED = 'booking_cancellation_enabled'

// ── Safe in-app defaults (used before fetch completes or on error) ────────────

const FLAG_DEFAULTS = {
  [FLAG_ANALYTICS_ENABLED]:            true,
  [FLAG_BOOKING_CANCELLATION_ENABLED]: true,
} as const

// Apply defaults to the SDK instance so getBoolean() is safe before the first
// fetch. Must be set before fetchAndActivate() is called.
remoteConfig.defaultConfig = FLAG_DEFAULTS

// In dev: fetch on every reload (no cache) for instant flag testing.
// In production: respect Firebase's 1-hour minimum to avoid throttling.
remoteConfig.settings.minimumFetchIntervalMillis = import.meta.env.DEV ? 0 : 3_600_000

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FeatureFlags {
  [FLAG_ANALYTICS_ENABLED]:            boolean
  [FLAG_BOOKING_CANCELLATION_ENABLED]: boolean
}

interface FeatureFlagsState {
  flags:   FeatureFlags
  loading: boolean
  error:   string | null
}

// ── Context ───────────────────────────────────────────────────────────────────

const DEFAULT_STATE: FeatureFlagsState = {
  flags:   { ...FLAG_DEFAULTS },
  loading: true,
  error:   null,
}

const FeatureFlagsContext = createContext<FeatureFlagsState>(DEFAULT_STATE)

// ── Provider ──────────────────────────────────────────────────────────────────

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags,   setFlags]   = useState<FeatureFlags>({ ...FLAG_DEFAULTS })
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    fetchAndActivate(remoteConfig)
      .then(() => {
        setFlags({
          [FLAG_ANALYTICS_ENABLED]:            getBoolean(remoteConfig, FLAG_ANALYTICS_ENABLED),
          [FLAG_BOOKING_CANCELLATION_ENABLED]: getBoolean(remoteConfig, FLAG_BOOKING_CANCELLATION_ENABLED),
        })
        setError(null)
      })
      .catch((err: unknown) => {
        // Non-fatal: safe defaults remain active. Log for debugging but don't
        // block the UI — the portal should work normally even if Remote Config
        // is unreachable.
        const msg = err instanceof Error ? err.message : String(err)
        console.warn('FeatureFlags: fetch failed, using safe defaults.', msg)
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, error }}>
      {children}
    </FeatureFlagsContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns the current feature flags, loading state, and any fetch error.
 *
 * Usage:
 * ```tsx
 * const { flags } = useFeatureFlags()
 * if (!flags.analytics_enabled) return <DisabledBanner />
 * ```
 */
export function useFeatureFlags(): FeatureFlagsState {
  return useContext(FeatureFlagsContext)
}
