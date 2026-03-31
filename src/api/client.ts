/**
 * API Client — Spring Boot backend
 * ==================================
 * Thin wrapper around fetch that:
 *  1. Injects the Firebase ID token as Bearer in every request
 *  2. Unwraps the ApiResponse<T> envelope
 *  3. Throws a readable error on non-2xx or success=false
 *
 * TODO (Phase 12): Replace BASE_URL with the deployed Cloud Run URL.
 *   Set VITE_API_BASE_URL in .env.production once Cloud Run is up.
 *
 * Usage:
 *   const data = await apiGet<AnalyticsOverviewDto>(
 *     `/analytics/overview?businessId=${id}`
 *   )
 */

import { auth } from '../lib/firebase'
import type { ApiResponse } from './contract'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

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
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${text}`)
  }

  const envelope: ApiResponse<T> = await res.json()

  if (!envelope.success) {
    throw new Error(envelope.error ?? 'Unknown API error')
  }

  return envelope.data
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
