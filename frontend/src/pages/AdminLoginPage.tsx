import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { isAdminLoggedIn, setAdminSession } from '../auth/session'

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 3l18 18" strokeLinecap="round" />
        <path d="M10.6 10.6a2 2 0 002.8 2.8" strokeLinecap="round" />
        <path
          d="M9.9 5.1A10.5 10.5 0 0112 5c5 0 9.3 3.1 11 7-.5 1.2-1.2 2.3-2.1 3.3M6.1 6.1C4.4 7.3 3.1 8.9 2 12c1.7 3.9 6 7 11 7 1.3 0 2.5-.2 3.7-.6"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAdminLoggedIn()) {
    return <Navigate to="/admin" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await api.adminLogin(username.trim(), password)
      setAdminSession(result.token, result.username, result.role)
      navigate('/admin', {
        replace: true,
        state: {
          loginToast: `Welcome back, ${result.username}${
            result.role === 'super_admin' ? ' (super admin)' : ''
          }`,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-black text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.18), transparent), linear-gradient(180deg, #0a0a0a 0%, #141414 100%)',
        }}
      />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 md:px-8">
        <Link
          to="/"
          className="font-sans text-sm font-bold tracking-[0.18em] uppercase transition hover:opacity-70"
        >
          Pondy Tripora
        </Link>
        <Link
          to="/"
          className="text-[11px] font-medium tracking-[0.16em] text-white/55 uppercase transition hover:text-white"
        >
          Back to site
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 pb-16">
        <div className="animate-fade-up w-full max-w-md">
          <p className="font-display text-lg text-white/55">Admin</p>
          <h1 className="mt-2 font-sans text-3xl font-extrabold tracking-tight sm:text-4xl">
            Sign in to manage bookings
          </h1>
          <p className="mt-3 text-sm text-white/50">
            View reservations across rooms, vehicles, and boats.
          </p>

          <form onSubmit={onSubmit} className="mt-10 space-y-5">
            <label className="block">
              <span className="text-[11px] font-medium tracking-[0.16em] text-white/45 uppercase">
                Username
              </span>
              <input
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 w-full border border-white/15 bg-white/5 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/40"
                placeholder="admin"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-medium tracking-[0.16em] text-white/45 uppercase">
                Password
              </span>
              <div className="relative mt-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-white/15 bg-white/5 py-3.5 pr-12 pl-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/40"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-md p-1 text-white/45 transition hover:text-white"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </label>

            {error && <p className="text-sm text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white px-6 py-3.5 text-[11px] font-semibold tracking-[0.18em] text-black uppercase transition hover:bg-white/90 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
