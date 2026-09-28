import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { usePageTransition } from './PageTransition'
import { TextReveal } from './ui/TextReveal'

const linkDefs = [
  { to: '/rooms', key: 'nav.rooms' },
  { to: '/vehicles', key: 'nav.vehicles' },
  { to: '/boating', key: 'nav.boating' },
  { to: '/beaches', key: 'nav.beaches' },
  { to: '/cafes', key: 'nav.cafes' },
  { to: '/white-town', key: 'nav.whiteTown' },
] as const

export function Footer() {
  const { t, locale } = useLanguage()
  const { launchTo } = usePageTransition()
  const isLatin = locale === 'en'

  return (
    <footer className="premium-grain relative overflow-hidden bg-black text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-5 py-14 md:flex-row md:items-end md:justify-between md:px-8 md:py-16">
        <div className="max-w-md">
          <TextReveal
            text={t('brand.name')}
            className="font-sans text-sm font-bold tracking-[0.22em] uppercase"
          />
          <TextReveal
            text={t('footer.blurb')}
            stagger={0.03}
            maxDuration={2.2}
            className="mt-4 block text-sm leading-relaxed text-white/55"
          />
        </div>
        <div
          className={`flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-white/65 ${
            isLatin ? 'tracking-[0.14em] uppercase' : 'tracking-wide'
          }`}
        >
          {linkDefs.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={(e) => {
                e.preventDefault()
                launchTo(l.to)
              }}
              className="relative transition hover:text-white after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-white/70 after:transition-transform after:duration-300 hover:after:scale-x-100"
            >
              {t(l.key)}
            </Link>
          ))}
        </div>
      </div>
      <div
        className={`relative border-t border-white/10 py-4 text-center text-[11px] text-white/35 ${
          isLatin ? 'tracking-[0.14em] uppercase' : 'tracking-wide'
        }`}
      >
        {t('footer.copy', { year: new Date().getFullYear() })}
      </div>
    </footer>
  )
}
