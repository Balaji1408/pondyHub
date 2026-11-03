import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useCustomerLogin } from '../api/hooks'
import { isCustomerLoggedIn, setCustomerSession, getCustomerUser } from '../auth/session'
import {
  OwnerAuthShell,
  ownerAuthFieldClass,
  ownerAuthLabelClass,
} from '../components/OwnerAuthShell'

export function OwnerLoginPage() {
  const navigate = useNavigate()
  const login = useCustomerLogin()
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (isCustomerLoggedIn()) {
    const user = getCustomerUser()
    return (
      <Navigate to={user?.mustChangePassword ? '/owner/change-password' : '/owner'} replace />
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const result = await login.mutateAsync({ mobile, password })
      setCustomerSession(result.token, {
        id: result.customer.id,
        name: result.customer.name,
        mobile: result.customer.mobile,
        mustChangePassword: result.customer.mustChangePassword,
      })
      navigate(result.customer.mustChangePassword ? '/owner/change-password' : '/owner', {
        replace: true,
      })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <OwnerAuthShell
      compact
      brandLine="Room owner"
      title="Sign in"
      subtitle="Manage your stay listing after admin approval."
      footer={
        <p>
          New owner?{' '}
          <Link
            to="/owner/register"
            className="font-semibold text-[#0c1419] underline decoration-[#1f4d52]/35 underline-offset-4 transition hover:text-[#1f4d52]"
          >
            Register
          </Link>
        </p>
      }
    >
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#1f4d52]/12 bg-[#1f4d52]/06 px-3 py-2.5">
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1f4d52]/15 text-[#1f4d52]"
          aria-hidden
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 8V6a3 3 0 116 0v3H9z" />
          </svg>
        </span>
        <p className="text-[13px] leading-snug text-[#3d555c]">
          First login uses <span className="font-semibold text-[#0c1419]">Pondy@123</span> — then
          change it.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3.5">
        <label className="block">
          <span className={ownerAuthLabelClass}>Mobile</span>
          <input
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            inputMode="numeric"
            autoComplete="tel"
            required
            placeholder="10-digit mobile number"
            className={ownerAuthFieldClass}
          />
        </label>
        <label className="block">
          <span className={ownerAuthLabelClass}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className={ownerAuthFieldClass}
          />
        </label>
        {error && (
          <p className="rounded-lg bg-[#fdeeee] px-3 py-2 text-[13px] text-[#9b2c2c]">{error}</p>
        )}
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full rounded-full bg-[#0c1419] py-3 text-[11px] font-bold tracking-[0.16em] text-white uppercase transition hover:bg-[#1a2830] disabled:opacity-50"
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </OwnerAuthShell>
  )
}
