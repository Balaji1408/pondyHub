const TOKEN_KEY = 'pondy_admin_token'
const USER_KEY = 'pondy_admin_user'

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getAdminUser(): string | null {
  return localStorage.getItem(USER_KEY)
}

export function setAdminSession(token: string, username: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, username)
}

export function clearAdminSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isAdminLoggedIn() {
  return Boolean(getAdminToken())
}
