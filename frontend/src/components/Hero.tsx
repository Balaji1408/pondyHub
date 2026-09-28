import { useEffect, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { usePageTransition } from './PageTransition'
import { TextReveal } from './ui/TextReveal'

const HD = 'auto=format&fit=crop&q=90&w=3840'

const SLIDES = [
  {
    id: 'heritage',
    alt: 'Pondicherry temple gopuram glowing at dusk',
    src: `https://images.unsplash.com/photo-1582510003544-4d00b7f74220?${HD}`,
  },
  {
    id: 'beaches',
    alt: 'Wide coastal beach along the Bay of Bengal',
    src: `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?${HD}`,
  },
  {
    id: 'boating',
    alt: 'Boats on calm turquoise coastal water',
    src: `https://images.unsplash.com/photo-1544551763-46a013bb70d5?${HD}`,
  },
  {
    id: 'white-town',
    alt: 'Sunlit colonial lanes of White Town',
    src: `https://images.unsplash.com/photo-1555881400-74d7acaacd8b?${HD}`,
  },
  {
    id: 'cafes',
    alt: 'Open-air café terrace near the sea',
    src: `https://images.unsplash.com/photo-1554118811-1e0d58224f24?${HD}`,
  },
] as const

export function Hero() {
  const { t, locale } = useLanguage()
  const [active, setActive] = useState(0)
  const isLatin = locale === 'en'
  const { launching, launchTo } = usePageTransition()

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length)
    }, 5500)
    return () => window.clearInterval(id)
  }, [])

  const handleGetStarted = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    launchTo('/rooms')
  }

  return (
    <section className="premium-grain relative flex h-dvh w-full items-center justify-center overflow-hidden bg-[#1a1512]">
      <div className="absolute inset-0">
        {SLIDES.map((slide, index) => {
          const isActive = active === index
          return (
            <img
              key={slide.id}
              src={slide.src}
              alt={slide.alt}
              width={3840}
              height={2560}
              decoding="async"
              fetchPriority={index === 0 ? 'high' : 'low'}
              className={`hero-slide absolute inset-0 h-full w-full object-cover object-center brightness-[1.08] contrast-[1.04] saturate-[1.06] transition-opacity duration-1000 ease-out ${
                isActive ? 'opacity-100' : 'opacity-0'
              } ${isActive ? 'hero-kenburns' : ''}`}
            />
          )
        })}
      </div>

      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25" />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center text-white">
        <TextReveal
          text={t('hero.eyebrow')}
          startOnView={false}
          stagger={0.04}
          className="font-display text-lg text-white/90 drop-shadow-sm md:text-xl"
        />
        <h1 className="mt-3 font-sans text-4xl leading-[1.15] font-extrabold tracking-tight text-white drop-shadow-md sm:text-5xl md:text-7xl md:leading-[1.05]">
          <TextReveal
            text={t('hero.titleLine1')}
            startOnView={false}
            stagger={0.06}
            maxDuration={1.4}
            className="block"
          />
          <TextReveal
            text={t('hero.titleLine2')}
            startOnView={false}
            stagger={0.06}
            maxDuration={1.5}
            className="mt-1 block"
          />
        </h1>
        <Link
          to="/rooms"
          onClick={handleGetStarted}
          className={`cta-get-started animate-fade-up-delay-2 mt-8 inline-flex px-8 py-3.5 text-xs font-semibold md:mt-10 ${
            isLatin ? 'tracking-[0.18em] uppercase' : 'tracking-wide'
          } ${launching ? 'is-launching' : ''}`}
          aria-busy={launching}
        >
          {t('hero.cta')}
        </Link>
        <TextReveal
          text={t('hero.sub')}
          startOnView={false}
          stagger={0.03}
          maxDuration={2}
          className="mt-5 block max-w-xl text-sm text-white/80 drop-shadow-sm md:text-base"
        />
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={t('hero.showSlide', { n: index + 1 })}
            aria-current={active === index}
            onClick={() => setActive(index)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              active === index ? 'w-8 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
