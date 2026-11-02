'use client'

// Minimal Supabase client over fetch (auth, PostgREST, storage), so the static
// site needs no extra dependency. Project: "sebrusso".
//
// Access model (Seb's call): name-only login. Each person has a Supabase Auth
// account whose password ships here, so typing the name signs in. The database
// still requires a signed-in member for every read (row-level security); this
// keeps the data away from anonymous API calls, not from someone who reads this
// file. Don't store anything here you wouldn't put on the public site.

import type { Person } from '../notebook/types'

export const SUPABASE_URL = 'https://usedwbpdrbgymxlniudt.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_nU50rlROEa5zYkz_oMC44A_8yrjR2sh'

const ACCOUNTS: Record<Person, { email: string; password: string }> = {
  seb: { email: 'seb@evalnb.sebrusso.local', password: 'aH5btLqw7hH-Jv0LBtzHCrbbDF-uIDoQ' },
  daniel: { email: 'daniel@evalnb.sebrusso.local', password: '-W20WUMTjpSNC7qidJcawt_LRGDPd9D7' },
}

const SESSION_KEY = 'evalnb-sb-session'

interface Session {
  who: Person
  accessToken: string
  refreshToken: string
  expiresAt: number // epoch seconds
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function writeSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // Storage blocked: the session lasts for this page view.
  }
  memo = s
}

let memo: Session | null = null
let pending: Promise<Session> | null = null

async function tokenRequest(grant: 'password' | 'refresh_token', body: object, who: Person): Promise<Session> {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=${grant}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`Sign-in failed (${r.status})`)
  const d = await r.json()
  const s: Session = { who, accessToken: d.access_token, refreshToken: d.refresh_token, expiresAt: Math.floor(Date.now() / 1000) + d.expires_in }
  writeSession(s)
  return s
}

export function signIn(who: Person): Promise<Session> {
  const a = ACCOUNTS[who]
  pending = tokenRequest('password', { email: a.email, password: a.password }, who).finally(() => (pending = null))
  return pending
}

export function signOut() {
  writeSession(null)
}

/** A valid session for `who`, signing in or refreshing as needed. */
export async function session(who: Person): Promise<Session> {
  if (pending) return pending
  const s = memo ?? readSession()
  if (!s || s.who !== who) return signIn(who)
  if (s.expiresAt - 60 > Date.now() / 1000) return (memo = s)
  pending = tokenRequest('refresh_token', { refresh_token: s.refreshToken }, who)
    .catch(() => signIn(who))
    .finally(() => (pending = null))
  return pending
}

async function authed(who: Person, path: string, init: RequestInit = {}): Promise<Response> {
  const s = await session(who)
  const headers = new Headers(init.headers)
  headers.set('apikey', SUPABASE_KEY)
  headers.set('Authorization', `Bearer ${s.accessToken}`)
  const r = await fetch(`${SUPABASE_URL}${path}`, { ...init, headers })
  if (r.status === 401) {
    // Token revoked or expired early: sign in again once.
    await signIn(who)
    return authed(who, path, init)
  }
  return r
}

/** PostgREST call; throws with the server's message on failure. */
export async function rest<T>(who: Person, path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init
  const headers = new Headers(rest.headers)
  if (json !== undefined) headers.set('Content-Type', 'application/json')
  const r = await authed(who, `/rest/v1/${path}`, { ...rest, headers, body: json !== undefined ? JSON.stringify(json) : rest.body })
  if (!r.ok) throw new Error((await r.text()).slice(0, 300) || `Request failed (${r.status})`)
  const text = await r.text()
  return (text ? JSON.parse(text) : null) as T
}

/** Download a private storage object (signed-in members only). */
export async function download(who: Person, bucket: string, path: string): Promise<Response> {
  const r = await authed(who, `/storage/v1/object/authenticated/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`)
  if (!r.ok) throw new Error(`Couldn’t load ${path} (${r.status})`)
  return r
}
