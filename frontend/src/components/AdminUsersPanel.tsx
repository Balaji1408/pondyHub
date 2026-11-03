import { useState, type FormEvent } from 'react'
import { useAdminUsers, useCreateAdminUser, useUpdateAdminUser } from '../api/hooks'

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

function PasswordInput({
  value,
  onChange,
  placeholder,
  light,
  required,
  minLength,
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  light: boolean
  required?: boolean
  minLength?: number
  className?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className={`relative ${className}`}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className={`w-full rounded-xl border py-2.5 pr-10 pl-3 text-sm outline-none ${
          light
            ? 'border-[#e8e4dc] bg-[#faf8f4] text-[#0a0a0a]'
            : 'border-white/10 bg-[#1a1a22] text-white'
        }`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className={`absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-md p-1 transition ${
          light ? 'text-[#8a847a] hover:text-[#0a0a0a]' : 'text-[#7a7a7a] hover:text-white'
        }`}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  )
}

export function AdminUsersPanel({
  light,
  accent,
  onSaved,
}: {
  light: boolean
  accent: string
  onSaved: (message: string) => void
}) {
  const users = useAdminUsers()
  const createUser = useCreateAdminUser()
  const updateUser = useUpdateAdminUser()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [resetId, setResetId] = useState<number | null>(null)
  const [resetPassword, setResetPassword] = useState('')

  const muted = light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'
  const strong = light ? 'text-[#0a0a0a]' : 'text-white'
  const card = light
    ? 'border border-[#e8e4dc] bg-white'
    : 'bg-[#22222a] shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusyId('create')
    try {
      await createUser.mutateAsync({ username: username.trim(), password })
      onSaved(`Admin “${username.trim()}” created`)
      setUsername('')
      setPassword('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  async function toggleActive(id: number, usernameLabel: string, next: boolean) {
    setBusyId(`active-${id}`)
    setError(null)
    try {
      await updateUser.mutateAsync({ id, fields: { isActive: next } })
      onSaved(`${usernameLabel} ${next ? 'activated' : 'deactivated'}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  async function onReset(id: number, usernameLabel: string) {
    if (resetPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    setBusyId(`reset-${id}`)
    setError(null)
    try {
      await updateUser.mutateAsync({ id, fields: { password: resetPassword } })
      onSaved(`Password updated for ${usernameLabel}`)
      setResetId(null)
      setResetPassword('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className={`overflow-hidden rounded-[28px] ${card}`}>
        <div
          className={`border-b px-5 py-5 md:px-7 md:py-6 ${
            light ? 'border-[#efeae2]' : 'border-white/[0.06]'
          }`}
        >
          <p className={`text-[12px] font-medium ${light ? 'text-[#8a847a]' : 'text-[#7a7a7a]'}`}>
            Access
          </p>
          <h2 className={`mt-1 text-xl font-semibold tracking-tight ${strong}`}>Admin users</h2>
          <p className={`mt-1 text-sm ${muted}`}>
            Only super admins can create staff logins. New accounts sign in at /admin/login.
          </p>
        </div>

        <form onSubmit={onCreate} className="space-y-3 border-b px-5 py-5 md:px-7" style={{
          borderColor: light ? '#efeae2' : 'rgba(255,255,255,0.06)',
        }}>
          <p className={`text-[11px] font-semibold tracking-[0.12em] uppercase ${muted}`}>
            Create admin
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              minLength={3}
              className={`rounded-xl border px-3 py-2.5 text-sm outline-none ${
                light
                  ? 'border-[#e8e4dc] bg-[#faf8f4] text-[#0a0a0a]'
                  : 'border-white/10 bg-[#1a1a22] text-white'
              }`}
            />
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="Password (min 6)"
              light={light}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={busyId !== null}
            className="cursor-pointer rounded-full px-4 py-2 text-[11px] font-bold tracking-[0.1em] text-black uppercase disabled:opacity-40"
            style={{ background: accent }}
          >
            {busyId === 'create' ? 'Creating…' : 'Create admin'}
          </button>
        </form>

        <div className="px-5 py-5 md:px-7">
          {error && (
            <div className="mb-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {users.isLoading && <p className={`py-8 text-center text-sm ${muted}`}>Loading…</p>}
          <ul className="space-y-3">
            {(users.data ?? []).map((u) => (
              <li
                key={u.id}
                className={`rounded-2xl px-4 py-3 ${
                  light ? 'border border-[#efeae2] bg-[#faf8f4]' : 'bg-[#1a1a22]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={`font-medium ${strong}`}>{u.username}</p>
                    <p className={`mt-0.5 text-xs ${muted}`}>
                      {u.role === 'super_admin' ? 'Super admin' : 'Admin'}
                      {u.createdByUsername ? ` · created by ${u.createdByUsername}` : ''}
                      {!u.isActive ? ' · inactive' : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {u.role !== 'super_admin' && (
                      <>
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => void toggleActive(u.id, u.username, !u.isActive)}
                          className={`cursor-pointer rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase disabled:opacity-40 ${
                            light ? 'border-[#e8e4dc] text-[#3d3d3d]' : 'border-white/10 text-[#c5c5c5]'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => {
                            setResetId(resetId === u.id ? null : u.id)
                            setResetPassword('')
                            setError(null)
                          }}
                          className={`cursor-pointer rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase disabled:opacity-40 ${
                            light ? 'border-[#e8e4dc] text-[#3d3d3d]' : 'border-white/10 text-[#c5c5c5]'
                          }`}
                        >
                          Set password
                        </button>
                      </>
                    )}
                    {u.role === 'super_admin' && (
                      <span
                        className="rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.08em] text-black uppercase"
                        style={{ background: accent }}
                      >
                        Super
                      </span>
                    )}
                  </div>
                </div>
                {resetId === u.id && (
                  <div className="mt-3 flex flex-col gap-2 border-t pt-3 sm:flex-row" style={{
                    borderColor: light ? '#efeae2' : 'rgba(255,255,255,0.06)',
                  }}>
                    <PasswordInput
                      value={resetPassword}
                      onChange={setResetPassword}
                      placeholder="New password"
                      light={light}
                      minLength={6}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => void onReset(u.id, u.username)}
                      className="cursor-pointer rounded-full px-4 py-2 text-[11px] font-bold tracking-[0.1em] text-black uppercase disabled:opacity-40"
                      style={{ background: accent }}
                    >
                      Save password
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
