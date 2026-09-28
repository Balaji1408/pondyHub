import { useMemo } from 'react'
import { Hero } from '../components/Hero'
import { TemplateCarousel, type TemplateSlide } from '../components/TemplateCarousel'
import { BlurFade } from '../components/ui/BlurFade'
import { Marquee } from '../components/ui/Marquee'
import { NumberTicker } from '../components/ui/NumberTicker'
import { useLanguage } from '../i18n/LanguageContext'
import { usePageTransition } from '../components/PageTransition'
import { useStartingPrices } from '../api/hooks'

function fromPrice(amount: number | null | undefined, fallback: number) {
  return `₹${(amount ?? fallback).toLocaleString('en-IN')}`
}

export function HomePage() {
  const { t, locale } = useLanguage()
  const { launchTo } = usePageTransition()
  const isLatin = locale === 'en'
  const prices = useStartingPrices().data

  const templateSlides = useMemo(
    () => [
      {
        to: '/rooms',
        label: t('nav.rooms'),
        tagline: t('home.slide.rooms'),
        kicker: 'White Town / Goubert',
        layout: 'agency',
        image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1400&q=85',
        gallery: [
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
        ],
        galleryLabels: [t('rooms.couples'), t('rooms.family'), t('rooms.friends')],
        stats: [
          { value: '48+', label: t('home.stats.stays') },
          { value: '4.8★', label: t('home.stats.rating') },
          { value: fromPrice(prices?.room, 1800), label: t('common.night') },
        ],
      },
      {
        to: '/beaches',
        label: t('nav.beaches'),
        tagline: t('home.slide.beaches'),
        kicker: 'Promenade · Paradise · Serenity',
        layout: 'editorial',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=85',
        gallery: [
          'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=700&q=80',
          'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=700&q=80',
          'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=700&q=80',
        ],
      },
      {
        to: '/boating',
        label: t('nav.boating'),
        tagline: t('home.slide.boating'),
        kicker: 'Chunnambar Backwaters',
        layout: 'poster',
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1400&q=85',
        gallery: [
          'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=700&q=80',
          'https://images.unsplash.com/photo-1468413253725-0d5181091126?w=700&q=80',
        ],
        galleryLabels: [t('boating.yacht'), t('boating.catamaran')],
        stats: [
          { value: fromPrice(prices?.boat, 600), label: t('boating.perTrip') },
          { value: '4.9★', label: t('home.stats.rating') },
        ],
      },
      {
        to: '/vehicles',
        label: t('nav.vehicles'),
        tagline: t('home.slide.vehicles'),
        kicker: 'East Coast Road',
        layout: 'agency',
        image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1400&q=85',
        gallery: [
          'https://images.unsplash.com/photo-1694956792421-e946fff94564?w=900&q=80',
          'https://upload.wikimedia.org/wikipedia/commons/f/f3/Suzuki_Access_125.jpg',
          'https://images.unsplash.com/photo-1748215210950-536c6621629a?w=900&q=80',
        ],
        galleryLabels: [t('vehicles.bikes'), t('vehicles.scooters'), t('vehicles.cars')],
        stats: [
          { value: '32+', label: t('home.stats.rides') },
          { value: '4.9★', label: t('home.stats.rating') },
          { value: fromPrice(prices?.vehicle, 400), label: t('common.day') },
        ],
      },
      {
        to: '/white-town',
        label: t('nav.whiteTown'),
        tagline: t('home.slide.whiteTown'),
        kicker: 'Rue Suffren · Rue Dumas',
        layout: 'poster',
        image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1400&q=85',
        gallery: [
          'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=700&q=80',
          'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=700&q=80',
        ],
        galleryLabels: ['French Quarter', 'Raj Niwas'],
        stats: [
          { value: '4.9★', label: t('home.stats.rating') },
          { value: '4–6 PM', label: 'Golden hour' },
        ],
      },
      {
        to: '/cafes',
        label: t('nav.cafes'),
        tagline: t('home.slide.cafes'),
        kicker: 'Open now · Near every stay',
        layout: 'botanica',
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1400&q=85',
        gallery: [
          'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900&q=80',
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80',
        ],
      },
    ] satisfies TemplateSlide[],
    [t, prices],
  )

  const marqueeItems = useMemo(
    () => t('home.marquee').split('·').map((s) => s.trim()).filter(Boolean),
    [t],
  )

  const stats = useMemo(
    () => [
      { value: 48, suffix: '+', label: t('home.stats.stays') },
      { value: 32, suffix: '+', label: t('home.stats.rides') },
      { value: 12, suffix: '', label: t('home.stats.beaches') },
      { value: 4.8, suffix: '', label: t('home.stats.rating'), decimalPlaces: 1 },
    ],
    [t],
  )

  return (
    <>
      <Hero />

      <section className="relative border-y border-white/10 bg-ink py-4 text-white">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink to-transparent md:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink to-transparent md:w-28" />
        <Marquee pauseOnHover className="[--duration:36s]">
          {marqueeItems.map((item) => (
            <span
              key={item}
              className={`mx-2 inline-flex items-center gap-3 text-sm text-white/55 ${
                isLatin ? 'tracking-[0.18em] uppercase' : 'tracking-wide'
              }`}
            >
              <span className="size-1 rounded-full bg-white/35" aria-hidden />
              {item}
            </span>
          ))}
        </Marquee>
      </section>

      <section className="relative overflow-hidden bg-[#0c1419] text-white">
        <div
          className="pointer-events-none absolute -right-24 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(31_77_82_/_0.35)_0%,transparent_68%)]"
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1.05fr_1.35fr] md:items-end md:gap-16 md:px-10 md:py-24 lg:px-16">
          <BlurFade className="max-w-md">
            <p className="font-display text-lg italic text-white/55 md:text-xl">{t('hero.eyebrow')}</p>
            <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              {t('home.stats.headline')}
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-white/60 md:text-base">{t('home.join')}</p>
            <button
              type="button"
              onClick={() => launchTo('/rooms')}
              className={`group mt-8 inline-flex items-center gap-3 border-b border-white/35 pb-1 text-[11px] font-semibold text-white transition hover:border-white ${
                isLatin ? 'tracking-[0.18em] uppercase' : 'tracking-wide'
              }`}
            >
              {t('nav.getStarted')}
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </button>
          </BlurFade>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:gap-x-10 lg:grid-cols-4 lg:gap-0">
            {stats.map((stat, i) => (
              <BlurFade key={stat.label} delay={0.1 + i * 0.08}>
                <div
                  className={`relative flex flex-col ${
                    i > 0 ? 'lg:border-l lg:border-white/12 lg:pl-8' : ''
                  }`}
                >
                  <p className="font-display text-4xl font-semibold tracking-tight text-white md:text-5xl">
                    <NumberTicker
                      value={stat.value}
                      decimalPlaces={stat.decimalPlaces ?? 0}
                      suffix={stat.suffix}
                      delay={0.12 * i}
                    />
                  </p>
                  <p
                    className={`mt-3 text-[10px] font-semibold text-white/45 ${
                      isLatin ? 'tracking-[0.2em] uppercase' : 'tracking-wide'
                    }`}
                  >
                    {stat.label}
                  </p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      <TemplateCarousel slides={templateSlides} />
    </>
  )
}
