/**
 * The ONLY place that talks to the backend. DHIA ONLY.
 * Pages never call fetch directly: they call the functions in src/api/*.ts.
 */
import type { ApiError } from '@/types/contract'

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api/v1'

/** Error thrown by every api function. `code` comes from the backend error body (section 7). */
export class ApiRequestError extends Error {
  code: string
  status: number
  constructor(code: string, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

type TokenGetter = () => Promise<string | null>
let getToken: TokenGetter = async () => null

/** Called once by AuthProvider so every request carries the Supabase access token. */
export function setTokenGetter(fn: TokenGetter) {
  getToken = fn
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const isForm = body instanceof FormData
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiRequestError('network', 'Cannot reach the server. Check your connection.', 0)
  }

  if (!res.ok) {
    let err: ApiError | null = null
    try {
      err = (await res.json()) as ApiError
    } catch {
      /* body was not JSON */
    }
    throw new ApiRequestError(err?.error.code ?? 'server', err?.error.message ?? `Request failed (${res.status})`, res.status)
  }
  if (res.status === 204) return undefined as T
  const type = res.headers.get('content-type') ?? ''
  return (type.includes('application/json') ? await res.json() : await res.blob()) as T
}

/** Build a query string, skipping empty values. */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
}

/** Fake network delay + deep copy, so mock data behaves like a real response. */
export function mock<T>(data: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), ms))
}

export function mockError(code: string, message: string, status = 400): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new ApiRequestError(code, message, status)), 350))
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}
