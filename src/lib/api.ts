const BASE_URL = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'ig_token'

export type SupervisorConflict = { projectId: string; projectName: string; supervisorId: string; supervisorName: string }

export class ApiError extends Error {
  status: number
  // Present on a 409 when a project already has a supervisor (see AdminUsuarios).
  conflicts?: SupervisorConflict[]
  constructor(status: number, message: string, conflicts?: SupervisorConflict[]) {
    super(message)
    this.status = status
    this.conflicts = conflicts
  }
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// A plain function reference (not a direct import of the auth context) so
// api.ts stays free of any dependency on auth.tsx — AuthProvider registers
// its logout as this handler on mount, avoiding a circular import between
// the two modules.
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn
}

// Same decoupling as onUnauthorized: fired when an admin reset the password
// while this session was open (API answers 403 PASSWORD_CHANGE_REQUIRED).
let onPasswordChangeRequired: (() => void) | null = null
export function setPasswordChangeRequiredHandler(fn: () => void) {
  onPasswordChangeRequired = fn
}

// Build id (commit hash) injected by Vite; lets the API know which client version a user runs.
const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-App-Version': APP_VERSION,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (res.status === 401) {
    onUnauthorized?.()
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    if (res.status === 403 && body.code === 'PASSWORD_CHANGE_REQUIRED') onPasswordChangeRequired?.()
    throw new ApiError(res.status, body.error ?? `Request failed: ${res.status}`, body.conflicts)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// Authenticated binary download (e.g. a report PDF): report URLs are never
// public, so the bearer token has to travel with the request.
export async function fetchBlob(path: string): Promise<Blob> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, { headers: { 'X-App-Version': APP_VERSION, ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
  if (res.status === 401) onUnauthorized?.()
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error ?? `Request failed: ${res.status}`)
  }
  return res.blob()
}

// Authenticated raw-bytes upload (company logo): the body is the file itself,
// not JSON; the API validates it by its bytes.
export async function putFile(path: string, file: Blob): Promise<void> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-App-Version': APP_VERSION, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: file,
  })
  if (res.status === 401) onUnauthorized?.()
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error ?? `Request failed: ${res.status}`)
  }
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T,>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T,>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),
}
