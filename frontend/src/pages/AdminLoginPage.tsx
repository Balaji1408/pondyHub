import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { isAdminLoggedIn, setAdminSession } from '../auth/session'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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
      setAdminSession(result.token, result.username)
      navigate('/admin', {
        replace: true,
        state: { loginToast: `Welcome back, ${result.username}` },
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
          Pondy Hub
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
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full border border-white/15 bg-white/5 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/40"
                placeholder="••••••••"
              />
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
