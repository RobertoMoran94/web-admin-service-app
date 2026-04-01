/**
 * API Client — Spring Boot backend
 * ==================================
 * Thin wrapper around fetch that:
 *  1. Injects the Firebase ID token as Bearer in every request
 *  2. Converts snake_case JSON keys → camelCase (BE uses Jackson SNAKE_CASE globally)
 *  3. Throws a readable error on non-2xx responses
 *
 * The Spring Boot backend returns DTOs directly (ResponseEntity.ok(dto)) —
 * there is no ApiResponse<T> envelope wrapper.
 *
 * Set VITE_API_BASE_URL in .env.local (local) or Firebase Hosting env (prod).
 * Defaults to localhost:8080 for local development.
 *
 * Usage:
 *   const data = await apiGet<AnalyticsOverviewDto>(
 *     `/analytics/overview?businessId=${id}`
 *   )
 */

import { auth } from '../lib/firebase'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

// ---------------------------------------------------------------------------
// snake_case → camelCase deep transformer
// ---------------------------------------------------------------------------

function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

function deepCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(deepCamel)
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [toCamel(k), deepCamel(v)])
    )
  }
  return obj
}

// ---------------------------------------------------------------------------
// Token helper
// ---------------------------------------------------------------------------

async function getBearerToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getBearerToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `HTTP ${res.status}: ${res.statusText}`)
  }

  const json = await res.json()
  return deepCamel(json) as T
}

// ---------------------------------------------------------------------------
// Convenience methods
// ---------------------------------------------------------------------------

export const apiGet = <T>(path: string) =>
  request<T>(path)

export const apiPost = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) })

export const apiPut = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body) })

export const apiPatch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })

export const apiDelete = <T>(path: string) =>
  request<T>(path, { method: 'DELETE' })
