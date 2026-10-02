import { useMemo, useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { useLanguage } from '../i18n/LanguageContext'
import { usePageTransition } from './PageTransition'
import { TripPlannerCard } from './TripPlannerCard'
import { NumberTicker } from './ui/NumberTicker'

const EASE = [0.22, 1, 0.36, 1] as const

const glass = 'bg-white/70 ring-1 ring-white/80 backdrop-blur-md'

export function CoastShowcase() {
  const { t, locale } = useLanguage()
  const { launchTo } = usePageTransition()
  const isLatin = locale === 'en'
  const reduced = !!useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.25 })

  const stats = useMemo(
    () => [
      { value: 48, suffix: '+', label: t('home.stats.stays') },
      { value: 32, suffix: '+', label: t('home.stats.rides') },
      { value: 12, suffix: '', label: t('home.stats.beaches') },
      { value: 4.8, suffix: '', label: t('home.stats.rating'), decimalPlaces: 1 },
    ],
    [t],
  )

  const reveal = (delay: number) => ({
    initial: reduced ? false : { opacity: 0, y: 20, filter: 'blur(8px)' },
    animate: inView || reduced ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined,
    transition: { delay, duration: 0.85, ease: EASE },
  })

  const smallCaps = isLatin ? 'tracking-[0.22em] uppercase' : 'tracking-wide'

  return (
    <section ref={ref} className="relative overflow-hidden border-b border-sand/60 text-ink">
      <div className="listing-shell-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-6 md:px-10 md:py-24 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-7 lg:px-16 lg:py-12 [@media(min-width:1024px)_and_(max-height:720px)]:py-8">
        <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
          <motion.p {...reveal(0)} className="font-display text-lg text-muted italic md:text-xl">
            {t('hero.eyebrow')}
          </motion.p>
          <motion.h2
            {...reveal(0.08)}
            className="mt-3 font-sans text-4xl font-extrabold tracking-tight sm:text-5xl lg:leading-[1.05] 2xl:text-6xl"
          >
            {t('home.stats.headline')}
          </motion.h2>
          <motion.p
            {...reveal(0.16)}
            className="mt-5 max-w-md text-sm leading-relaxed text-muted md:text-base lg:mt-4"
          >
            {t('home.join')}
          </motion.p>

          <motion.div {...reveal(0.24)} className="mt-8 lg:mt-6">
            <button
              type="button"
              onClick={() => launchTo('/rooms')}
              className={`group inline-flex items-center gap-4 bg-ink py-3.5 pr-6 pl-8 text-[11px] font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-ink/90 hover:shadow-[0_14px_28px_-14px_rgb(12_20_25_/_0.5)] ${
                isLatin ? 'tracking-[0.16em] uppercase' : 'tracking-wide'
              }`}
            >
              {t('nav.getStarted')}
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </button>
          </motion.div>
        </div>

        <motion.dl
          {...reveal(0.32)}
          className={`grid grid-cols-2 overflow-hidden rounded-2xl shadow-[0_16px_40px_-28px_rgb(12_20_25_/_0.5)] max-lg:order-last lg:col-start-1 lg:row-start-2 lg:max-w-lg lg:self-start ${glass}`}
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex flex-col-reverse px-5 py-4 sm:px-6 sm:py-5 lg:py-4 ${i % 2 === 1 ? 'border-l border-sand/60' : ''} ${
                i >= 2 ? 'border-t border-sand/60' : ''
              }`}
            >
              <dt className={`mt-1.5 text-[10px] font-semibold text-muted ${smallCaps}`}>{stat.label}</dt>
              <dd className="font-display text-3xl font-semibold tracking-tight md:text-4xl lg:text-3xl xl:text-4xl">
                <NumberTicker
                  value={stat.value}
                  decimalPlaces={stat.decimalPlaces ?? 0}
                  suffix={stat.suffix}
                  delay={0.15 * i}
                />
              </dd>
            </div>
          ))}
        </motion.dl>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 40 }}
          animate={inView || reduced ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.2, duration: 1, ease: EASE }}
          className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center"
        >
          <TripPlannerCard />
        </motion.div>
      </div>
    </section>
  )
}
