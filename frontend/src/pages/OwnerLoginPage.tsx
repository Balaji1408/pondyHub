import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useCustomerLogin } from '../api/hooks'
import { isCustomerLoggedIn, setCustomerSession, getCustomerUser } from '../auth/session'
import {
  OwnerAuthShell,
  ownerAuthFieldClass,
  ownerAuthLabelClass,
} from '../components/OwnerAuthShell'
import { useLanguage } from '../i18n/LanguageContext'

export function OwnerLoginPage() {
  const { t } = useLanguage()
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
      brandLine={t('owner.roomOwner')}
      title={t('owner.signIn')}
      subtitle={t('owner.manageSubtitle')}
      footer={
        <p>
          {t('owner.notApprovedYet')}{' '}
          <Link
            to="/owner/start"
            className="font-semibold text-[#0c1419] underline decoration-[#1f4d52]/35 underline-offset-4 transition hover:text-[#1f4d52]"
          >
            {t('owner.membersHome')}
          </Link>
        </p>
      }
    >
      <Link
        to="/owner/register"
        className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#0c1419]/15 bg-[#0c1419] px-3.5 py-3 text-white transition hover:bg-[#1a2830]"
      >
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15" aria-hidden>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </span>
        <span>
          <span className="block text-[11px] font-semibold tracking-[0.14em] uppercase">
            {t('owner.newMemberRegister')}
          </span>
          <span className="mt-0.5 block text-[12px] text-white/75">{t('owner.newMemberHint')}</span>
        </span>
      </Link>

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
          {t('owner.firstLoginHint', { password: 'Pondy@123' })
            .split('Pondy@123')
            .map((part, i, arr) =>
              i < arr.length - 1 ? (
                <span key={i}>
                  {part}
                  <span className="font-semibold text-[#0c1419]">Pondy@123</span>
                </span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3.5">
        <label className="block">
          <span className={ownerAuthLabelClass}>{t('owner.mobile')}</span>
          <input
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            inputMode="numeric"
            autoComplete="tel"
            required
            placeholder={t('owner.mobileLoginPlaceholder')}
            className={ownerAuthFieldClass}
          />
        </label>
        <label className="block">
          <span className={ownerAuthLabelClass}>{t('owner.password')}</span>
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
          {login.isPending ? t('owner.signingIn') : t('owner.signIn')}
        </button>
      </form>
    </OwnerAuthShell>
  )
}
