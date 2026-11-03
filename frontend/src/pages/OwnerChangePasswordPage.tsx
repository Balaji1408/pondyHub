import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useCustomerChangePassword } from '../api/hooks'
import {
  clearCustomerSession,
  getCustomerUser,
  isCustomerLoggedIn,
  setCustomerSession,
  getCustomerToken,
} from '../auth/session'

export function OwnerChangePasswordPage() {
  const navigate = useNavigate()
  const change = useCustomerChangePassword()
  const user = getCustomerUser()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isCustomerLoggedIn()) return <Navigate to="/owner/login" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (newPassword !== confirm) {
      setError('New passwords do not match')
      return
    }
    try {
      await change.mutateAsync({
        currentPassword: user?.mustChangePassword ? currentPassword || 'Pondy@123' : currentPassword,
        newPassword,
      })
      const token = getCustomerToken()
      if (token && user) {
        setCustomerSession(token, { ...user, mustChangePassword: false })
      }
      navigate('/owner', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#d9e4ea] px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-[#c5d3db] bg-white p-8">
        <h1 className="font-display text-3xl text-[#0c1419]">Set your password</h1>
        <p className="mt-2 text-sm text-[#5a6a74]">
          {user?.mustChangePassword
            ? 'Admin reset your password (or this is your first login). Choose a new password now.'
            : 'Update your owner account password.'}
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-[11px] font-semibold tracking-[0.14em] text-[#5a6a74] uppercase">
              Current password
            </span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={user?.mustChangePassword ? 'Pondy@123' : undefined}
              required={!user?.mustChangePassword}
              className="mt-1.5 w-full rounded-xl border border-[#b4c4ce] bg-[#f4f7f9] px-3 py-2.5 text-sm outline-none focus:border-[#0c1419]"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold tracking-[0.14em] text-[#5a6a74] uppercase">
              New password
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1.5 w-full rounded-xl border border-[#b4c4ce] bg-[#f4f7f9] px-3 py-2.5 text-sm outline-none focus:border-[#0c1419]"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold tracking-[0.14em] text-[#5a6a74] uppercase">
              Confirm new password
            </span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="mt-1.5 w-full rounded-xl border border-[#b4c4ce] bg-[#f4f7f9] px-3 py-2.5 text-sm outline-none focus:border-[#0c1419]"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={change.isPending}
            className="w-full rounded-full bg-[#0c1419] py-3 text-[12px] font-bold tracking-[0.16em] text-white uppercase disabled:opacity-50"
          >
            {change.isPending ? 'Saving…' : 'Save password'}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            clearCustomerSession()
            navigate('/owner/login')
          }}
          className="mt-4 w-full text-sm text-[#5a6a74]"
        >
          Sign out
        </button>
        <p className="mt-2 text-center text-sm">
          <Link to="/" className="text-[#5a6a74]">
            Back to site
          </Link>
        </p>
      </div>
    </div>
  )
}
