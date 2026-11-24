import { Link, Navigate } from 'react-router-dom'
import { getCustomerUser, isCustomerLoggedIn } from '../auth/session'
import { OwnerAuthShell } from '../components/OwnerAuthShell'
import { useLanguage } from '../i18n/LanguageContext'

export function OwnerStartPage() {
  const { t } = useLanguage()

  if (isCustomerLoggedIn()) {
    const user = getCustomerUser()
    return (
      <Navigate to={user?.mustChangePassword ? '/owner/change-password' : '/owner'} replace />
    )
  }

  return (
    <OwnerAuthShell
      brandLine={t('owner.members')}
      title={t('owner.joinTitle')}
      subtitle={t('owner.joinSubtitle')}
      footer={
        <p>
          {t('owner.lookingAround')}{' '}
          <Link
            to="/"
            className="font-semibold text-[#0c1419] underline decoration-[#1f4d52]/35 underline-offset-4 transition hover:text-[#1f4d52]"
          >
            {t('owner.backToTheSite')}
          </Link>
        </p>
      }
    >
      <div className="space-y-3">
        <Link
          to="/owner/register"
          className="block rounded-2xl border border-[#0c1419] bg-[#0c1419] px-5 py-4 text-white shadow-[0_16px_36px_-22px_rgba(12,20,25,0.7)] transition hover:bg-[#1a2830]"
        >
          <span className="block text-[11px] font-semibold tracking-[0.14em] uppercase">
            {t('owner.registerAsMember')}
          </span>
          <span className="mt-1.5 block text-sm text-white/75">{t('owner.registerHint')}</span>
        </Link>
        <Link
          to="/owner/login"
          className="block rounded-2xl border border-[#c8d6de] bg-white/80 px-5 py-4 text-[#0c1419] transition hover:border-[#0c1419]/40 hover:bg-white"
        >
          <span className="block text-[11px] font-semibold tracking-[0.14em] uppercase">
            {t('owner.signIn')}
          </span>
          <span className="mt-1.5 block text-sm text-[#5a6a74]">{t('owner.signInHint')}</span>
        </Link>
      </div>
    </OwnerAuthShell>
  )
}
