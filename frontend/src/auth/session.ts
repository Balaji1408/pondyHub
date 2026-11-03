const ADMIN_TOKEN_KEY = 'pondy_admin_token'
const ADMIN_USER_KEY = 'pondy_admin_user'
const CUSTOMER_TOKEN_KEY = 'pondy_customer_token'
const CUSTOMER_USER_KEY = 'pondy_customer_user'

export type AdminRole = 'super_admin' | 'admin'

export type AdminSessionUser = {
  username: string
  role: AdminRole
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function getAdminUser(): string | null {
  const stored = getAdminSessionUser()
  return stored?.username ?? localStorage.getItem(ADMIN_USER_KEY)
}

export function getAdminSessionUser(): AdminSessionUser | null {
  const raw = localStorage.getItem(ADMIN_USER_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AdminSessionUser | string
    if (typeof parsed === 'string') {
      return { username: parsed, role: 'admin' }
    }
    if (parsed && typeof parsed.username === 'string') {
      return {
        username: parsed.username,
        role: parsed.role === 'super_admin' ? 'super_admin' : 'admin',
      }
    }
  } catch {
    // Legacy: plain username string
    return { username: raw, role: 'admin' }
  }
  return null
}

export function setAdminSession(token: string, username: string, role: AdminRole = 'admin') {
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify({ username, role }))
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_USER_KEY)
}

export function isAdminLoggedIn() {
  return Boolean(getAdminToken())
}

export function isSuperAdmin() {
  return getAdminSessionUser()?.role === 'super_admin'
}

export type CustomerSessionUser = {
  id: number
  name: string
  mobile: string
  mustChangePassword: boolean
}

export function getCustomerToken(): string | null {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY)
}

export function getCustomerUser(): CustomerSessionUser | null {
  const raw = localStorage.getItem(CUSTOMER_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CustomerSessionUser
  } catch {
    return null
  }
}

export function setCustomerSession(token: string, user: CustomerSessionUser) {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token)
  localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(user))
}

export function clearCustomerSession() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY)
  localStorage.removeItem(CUSTOMER_USER_KEY)
}

export function isCustomerLoggedIn() {
  return Boolean(getCustomerToken())
}
