import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { LanguageSwitcher } from './LanguageSwitcher'
import { usePageTransition } from './PageTransition'
import { BlurFade } from './ui/BlurFade'
import { SunsetMark } from './ui/SunsetMark'

type InternalLink = { to: string; key: string }

const COLUMNS: { heading: string; links: InternalLink[] }[] = [
  {
    heading: 'footer.book',
    links: [
      { to: '/rooms', key: 'nav.rooms' },
      { to: '/vehicles', key: 'nav.vehicles' },
      { to: '/boating', key: 'nav.boating' },
    ],
  },
  {
    heading: 'footer.explore',
    links: [
      { to: '/beaches', key: 'nav.beaches' },
      { to: '/cafes', key: 'nav.cafes' },
      { to: '/white-town', key: 'nav.whiteTown' },
      { to: '/bars', key: 'nav.bars' },
      { to: '/food-street', key: 'nav.foodStreet' },
    ],
  },
  {
    heading: 'brand.name',
    links: [
      { to: '/', key: 'footer.home' },
      { to: '/rooms', key: 'nav.getStarted' },
      { to: '/admin/login', key: 'nav.admin' },
    ],
  },
]

const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/' },
  { label: 'YouTube', href: 'https://www.youtube.com/' },
  { label: 'Facebook', href: 'https://www.facebook.com/' },
  { label: 'X', href: 'https://x.com/' },
]

const headingClass = 'text-[15px] font-semibold text-white md:text-base'
const linkClass =
  'text-[15px] text-white/60 transition-colors duration-200 hover:text-white md:text-base'

export function Footer() {
  const { t } = useLanguage()
  const { launchTo } = usePageTransition()
  const year = new Date().getFullYear()

  const go = (to: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    launchTo(to)
  }

  return (
    <footer className="relative bg-black text-white">
      <div className="w-full px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid gap-14 pt-16 pb-12 md:pt-24 md:pb-16 lg:grid-cols-12 lg:gap-10">
          <BlurFade className="flex flex-col justify-between gap-12 lg:col-span-5">
            <div>
              <Link to="/" onClick={go('/')} aria-label={t('brand.name')} className="inline-flex">
                <SunsetMark className="size-10 text-white" />
              </Link>
              <p className="mt-6 max-w-md font-sans text-[32px] leading-[1.12] font-medium tracking-tight text-white sm:text-[40px] xl:text-[44px]">
                {t('footer.tagline')}
              </p>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/55">
                {t('footer.blurb')}
              </p>
            </div>

            <div className="flex max-w-sm items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/20">
                <SunsetMark className="size-5 text-white/80" />
              </span>
              <p className="text-[13px] leading-snug text-white/60">{t('footer.demo')}</p>
            </div>
          </BlurFade>

          <BlurFade delay={0.1} className="lg:col-span-7">
            <nav
              aria-label={t('brand.name')}
              className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4"
            >
              {COLUMNS.map((col) => (
                <div key={col.heading}>
                  <h2 className={headingClass}>{t(col.heading)}</h2>
                  <ul className="mt-5 space-y-3">
                    {col.links.map((l) => (
                      <li key={l.key}>
                        <Link to={l.to} onClick={go(l.to)} className={linkClass}>
                          {t(l.key)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div>
                <h2 className={headingClass}>{t('footer.follow')}</h2>
                <ul className="mt-5 space-y-3">
                  {SOCIALS.map((s) => (
                    <li key={s.label}>
                      <a href={s.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </BlurFade>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/15 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <LanguageSwitcher compact placement="up" size="md" />
            <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold tracking-[0.12em] text-white">
              ₹ INR
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/50">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="cursor-pointer transition-colors hover:text-white"
            >
              {t('footer.top')} ↑
            </button>
            <span>{t('footer.rights', { year })}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
