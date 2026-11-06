import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { LanguageSwitcher } from './LanguageSwitcher'
import { usePageTransition } from './PageTransition'

const linkDefs = [
  { to: '/rooms', key: 'nav.rooms' },
  { to: '/vehicles', key: 'nav.vehicles' },
  { to: '/boating', key: 'nav.boating' },
  { to: '/cafes', key: 'nav.cafes' },
  { to: '/beaches', key: 'nav.beaches' },
  { to: '/temples', key: 'nav.temples' },
  // Guide stays at /guide for admins; hidden from public nav for now.
  { to: '/bars', key: 'nav.bars' },
  { to: '/others', key: 'nav.others' },
  { to: '/food-street', key: 'nav.foodStreet' },
  { to: '/white-town', key: 'nav.whiteTown' },
] as const

export function Navbar() {
  const { t, locale } = useLanguage()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const { launchTo } = usePageTransition()
  const isHome = pathname === '/'
  const isLatin = locale === 'en'

  const links = useMemo(
    () => linkDefs.map((l) => ({ to: l.to, label: t(l.key) })),
    [t],
  )

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const solid = !isHome || scrolled || open

  const handleNavLaunch = (to: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setOpen(false)
    launchTo(to)
  }

  const navCase = isLatin ? 'uppercase tracking-[0.14em]' : 'tracking-wide'
  const tabCase = isLatin ? 'uppercase tracking-[0.11em]' : 'tracking-wide'

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,box-shadow] duration-500 ${
          solid
            ? 'bg-ink/95 text-white shadow-[0_12px_40px_-24px_rgb(0_0_0_/_0.55)] backdrop-blur-md'
            : 'bg-transparent text-white [text-shadow:0_1px_2px_rgb(0_0_0_/_0.6),0_2px_14px_rgb(0_0_0_/_0.5)]'
        }`}
      >
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-28 bg-gradient-to-b from-black/60 via-black/25 to-transparent transition-opacity duration-500 ${
            solid ? 'opacity-0' : 'opacity-100'
          }`}
        />
        <div className="mx-auto flex h-14 w-full max-w-[100rem] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:h-[4.25rem] lg:gap-6 lg:px-8">
          <Link
            to="/"
            className="min-w-0 truncate font-sans text-[12px] font-bold tracking-[0.16em] text-white uppercase sm:text-[13px] sm:tracking-[0.2em]"
          >
            {t('brand.name')}
          </Link>

          <nav aria-label={t('nav.primary')} className="hidden min-w-0 flex-1 lg:block">
            <ul className="flex items-center justify-center gap-x-4 xl:gap-x-6">
              {links.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    onClick={handleNavLaunch(l.to)}
                    className={({ isActive }) =>
                      `group relative block py-2 text-[11px] font-medium whitespace-nowrap transition-colors duration-300 xl:text-[12px] ${tabCase} ${
                        isActive ? 'text-white' : 'text-white/70 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {l.label}
                        <span
                          className={`absolute -bottom-0.5 left-1/2 h-px w-3.5 -translate-x-1/2 bg-white transition-opacity duration-300 ${
                            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                          }`}
                          aria-hidden
                        />
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex h-10 shrink-0 items-center gap-0.5 sm:gap-3">
            <LanguageSwitcher compact />
            <Link
              to="/owner/login"
              className={`hidden text-[11px] font-medium text-white/75 transition hover:text-white lg:inline ${navCase}`}
            >
              {t('nav.members')}
            </Link>
            <Link
              to="/admin/login"
              className={`hidden text-[11px] font-medium text-white/75 transition hover:text-white lg:inline ${navCase}`}
            >
              {t('nav.admin')}
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center text-white lg:hidden"
              aria-label={t('nav.openMenu')}
              aria-expanded={open}
            >
              <span className="flex w-[18px] flex-col gap-[5px]">
                <span className="block h-px w-full bg-current" />
                <span className="block h-px w-full bg-current" />
                <span className="block h-px w-3/5 bg-current" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          className="animate-fade-in fixed inset-0 z-[60] flex flex-col bg-ink text-white"
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.siteMenu')}
        >
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6">
            <Link
              to="/"
              className="min-w-0 truncate font-sans text-[12px] font-bold tracking-[0.16em] uppercase sm:text-[13px] sm:tracking-[0.2em]"
              onClick={() => setOpen(false)}
            >
              {t('brand.name')}
            </Link>
            <div className="flex h-10 shrink-0 items-center">
              <LanguageSwitcher compact />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center"
                aria-label={t('nav.closeMenu')}
              >
                <span className="relative block h-5 w-5">
                  <span className="absolute top-1/2 left-0 block h-[2px] w-full -translate-y-1/2 rotate-45 bg-white" />
                  <span className="absolute top-1/2 left-0 block h-[2px] w-full -translate-y-1/2 -rotate-45 bg-white" />
                </span>
              </button>
            </div>
          </div>

          <nav className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center overflow-y-auto px-5 pb-16 md:px-8">
            <ul className="grid grid-cols-1 gap-x-12 sm:grid-cols-2">
              {links.map((l, i) => (
                <li key={l.to} className="animate-fade-up border-b border-white/10" style={{ animationDelay: `${0.04 * i}s` }}>
                  <NavLink
                    to={l.to}
                    onClick={handleNavLaunch(l.to)}
                    className={({ isActive }) =>
                      `block py-3 font-sans text-3xl font-bold tracking-tight transition hover:opacity-70 sm:py-4 sm:text-4xl ${
                        isActive ? 'text-white' : 'text-white/75'
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
              <li
                className="animate-fade-up pt-6"
                style={{ animationDelay: `${0.05 * links.length}s` }}
              >
                <Link
                  to="/owner/login"
                  onClick={() => setOpen(false)}
                  className="block font-sans text-2xl font-bold tracking-tight text-white/55 transition hover:text-white sm:text-3xl"
                >
                  {t('nav.members')}
                </Link>
                <Link
                  to="/admin/login"
                  onClick={() => setOpen(false)}
                  className="mt-3 block font-sans text-2xl font-bold tracking-tight text-white/55 transition hover:text-white sm:text-3xl"
                >
                  {t('nav.admin')}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  )
}
