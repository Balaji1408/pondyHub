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
  { to: '/bars', key: 'nav.bars' },
  { to: '/food-street', key: 'nav.foodStreet' },
  { to: '/white-town', key: 'nav.whiteTown' },
] as const

export function Navbar() {
  const { t, locale } = useLanguage()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const { launching, launchTo } = usePageTransition()
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

  const handleGetStarted = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    launchTo('/rooms')
  }

  const handleNavLaunch = (to: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setOpen(false)
    launchTo(to)
  }

  const navCase = isLatin ? 'uppercase tracking-[0.16em]' : 'tracking-wide'

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
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 md:h-[4.25rem] md:px-8">
          <Link
            to="/"
            className="shrink-0 font-sans text-sm font-bold tracking-[0.18em] text-white uppercase md:text-[15px]"
          >
            {t('brand.name')}
          </Link>

          <nav aria-label={t('nav.primary')} className="hidden min-w-0 flex-1 justify-center lg:flex">
            <ul className="flex items-center gap-0.5">
              {links.slice(0, 5).map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    onClick={handleNavLaunch(l.to)}
                    className={({ isActive }) =>
                      `group relative mx-1 px-3 py-2 text-[12.5px] font-semibold transition-colors duration-300 ${navCase} ${
                        isActive ? 'text-white' : 'text-white hover:opacity-90'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {l.label}
                        <span
                          className={`absolute inset-x-3 -bottom-0.5 h-px origin-left bg-white transition-transform duration-300 ease-out ${
                            isActive
                              ? 'scale-x-100'
                              : 'scale-x-0 group-hover:scale-x-100'
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

          <div className="flex items-center gap-2 md:gap-3">
            <LanguageSwitcher />
            <Link
              to="/admin/login"
              className={`hidden text-[12px] font-semibold text-white transition hover:opacity-90 sm:inline ${
                isLatin ? 'tracking-[0.16em] uppercase' : 'tracking-wide'
              }`}
            >
              {t('nav.admin')}
            </Link>
            {isHome && (
              <Link
                to="/rooms"
                onClick={handleGetStarted}
                className={`cta-get-started px-3 py-2.5 text-[10px] font-semibold whitespace-nowrap [text-shadow:none] sm:px-5 sm:text-[11px] ${
                  isLatin ? 'tracking-[0.14em] uppercase' : 'tracking-wide'
                } ${launching ? 'is-launching' : ''}`}
                aria-busy={launching}
              >
                {t('nav.getStarted')}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-10 w-10 items-center justify-center text-white lg:hidden"
              aria-label={t('nav.openMenu')}
              aria-expanded={open}
            >
              <span className="flex w-6 flex-col gap-1.5">
                <span className="block h-[2px] w-full bg-current" />
                <span className="block h-[2px] w-full bg-current" />
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
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 md:px-8">
            <Link
              to="/"
              className="font-sans text-sm font-bold tracking-[0.18em] uppercase"
              onClick={() => setOpen(false)}
            >
              {t('brand.name')}
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center"
                aria-label={t('nav.closeMenu')}
              >
                <span className="relative block h-5 w-5">
                  <span className="absolute top-1/2 left-0 block h-[2px] w-full -translate-y-1/2 rotate-45 bg-white" />
                  <span className="absolute top-1/2 left-0 block h-[2px] w-full -translate-y-1/2 -rotate-45 bg-white" />
                </span>
              </button>
            </div>
          </div>

          <nav className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 pb-16 md:px-8">
            <ul className="space-y-1">
              {links.map((l, i) => (
                <li key={l.to} className="animate-fade-up" style={{ animationDelay: `${0.05 * i}s` }}>
                  <NavLink
                    to={l.to}
                    onClick={handleNavLaunch(l.to)}
                    className={({ isActive }) =>
                      `block font-sans text-4xl font-bold tracking-tight transition hover:opacity-70 sm:text-5xl md:text-6xl ${
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
                  to="/admin/login"
                  onClick={() => setOpen(false)}
                  className="block font-sans text-2xl font-bold tracking-tight text-white/55 transition hover:text-white sm:text-3xl"
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
