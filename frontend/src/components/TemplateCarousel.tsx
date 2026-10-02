import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLanguage } from '../i18n/LanguageContext'
import { usePageTransition } from './PageTransition'
import { BlurFade } from './ui/BlurFade'
import { TextReveal } from './ui/TextReveal'

export type TemplateLayout = 'agency' | 'editorial' | 'poster' | 'botanica'

export type TemplateSlide = {
  to: string
  label: string
  tagline: string
  image: string
  /** Extra shots shown as tiles / thumbnails, depending on layout. */
  gallery?: string[]
  galleryLabels?: string[]
  stats?: { value: string; label: string }[]
  kicker?: string
  layout?: TemplateLayout
}

const AUTO_MS = 4200
const EASE = [0.22, 1, 0.36, 1] as const
const LAYOUTS: TemplateLayout[] = ['agency', 'editorial', 'poster', 'botanica']

function circularOffset(i: number, index: number, n: number) {
  let d = i - index
  if (d > n / 2) d -= n
  if (d <= -n / 2) d += n
  return d
}

type MiniProps = {
  slide: TemplateSlide
  brand: string
  links: string[]
  cta: string
  upper: boolean
}

function MiniNav({
  brand,
  links,
  cta,
  upper,
  className = '',
}: Omit<MiniProps, 'slide'> & { className?: string }) {
  const caps = upper ? 'uppercase tracking-[0.14em]' : ''
  return (
    <div
      className={`flex items-center justify-between px-[2.2cqw] py-[1.4cqw] text-[clamp(5px,0.95cqw,10px)] font-semibold ${caps} ${className}`}
    >
      <span>{brand}</span>
      <span className="flex items-center gap-[2.2cqw] opacity-80">
        {links.map((l) => (
          <span key={l} className="hidden sm:inline">
            {l}
          </span>
        ))}
        <span className="rounded-full border border-current px-[1cqw] py-[0.35cqw] opacity-100">
          {cta} ↗
        </span>
      </span>
    </div>
  )
}

function AgencyCard({ slide, upper, ...nav }: MiniProps) {
  const tiles = [slide.image, ...(slide.gallery ?? [])].slice(-3)
  while (tiles.length < 3) tiles.push(slide.image)
  return (
    <div className="flex h-full flex-col bg-[#14110e] text-[#f3eee6]">
      <MiniNav {...nav} upper={upper} />
      <p
        className={`overflow-hidden px-[2cqw] font-sans text-[12.5cqw] leading-[0.86] font-black tracking-[-0.045em] whitespace-nowrap ${
          upper ? 'uppercase' : ''
        }`}
      >
        {slide.label}
      </p>
      <div className="mt-[2cqw] grid grid-cols-[1.5fr_repeat(3,1fr)] items-end gap-[1.6cqw] border-t border-white/12 px-[2.2cqw] pt-[1.6cqw]">
        <div>
          {slide.kicker && (
            <p
              className={`text-[clamp(5px,0.9cqw,10px)] font-bold text-[#d9b98a] ${
                upper ? 'uppercase tracking-[0.16em]' : ''
              }`}
            >
              {slide.kicker}
            </p>
          )}
          <p className="mt-[0.6cqw] text-[clamp(6px,1.1cqw,12px)] leading-snug text-white/65">
            {slide.tagline}
          </p>
        </div>
        {(slide.stats ?? []).slice(0, 3).map((s) => (
          <div key={s.label} className="border-l border-white/15 pl-[1.3cqw]">
            <p className="font-display text-[3cqw] leading-none font-medium">{s.value}</p>
            <p
              className={`mt-[0.5cqw] truncate text-[clamp(5px,0.8cqw,9px)] font-semibold text-white/50 ${
                upper ? 'uppercase tracking-[0.12em]' : ''
              }`}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-auto grid h-[44%] grid-cols-3 gap-[0.5cqw] p-[0.5cqw]">
        {tiles.map((src, i) => (
          <div key={i} className="relative overflow-hidden">
            <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/45" />
            <div className="absolute inset-x-0 top-0 flex justify-between p-[0.9cqw] text-[clamp(5px,0.85cqw,9px)] font-semibold uppercase tracking-[0.12em]">
              <span>0{i + 1}</span>
              <span>{nav.cta} ↗</span>
            </div>
            {slide.galleryLabels?.[i] && (
              <p className="absolute bottom-[0.9cqw] left-[0.9cqw] font-display text-[clamp(7px,1.7cqw,18px)] leading-none">
                {slide.galleryLabels[i]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function EditorialCard({ slide, upper, ...nav }: MiniProps) {
  const thumbs = (slide.gallery ?? []).slice(0, 3)
  const captions = slide.kicker?.split('·').map((s) => s.trim()) ?? []
  return (
    <div className="flex h-full flex-col bg-[#e9dfcf] text-[#1f1a15]">
      <MiniNav {...nav} upper={upper} className="border-b border-black/10" />
      <div className="grid flex-1 grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col px-[2.4cqw] pt-[2.4cqw] pb-[2.4cqw]">
          <p
            className={`font-display text-[7.2cqw] leading-[0.95] font-normal tracking-[-0.02em] ${
              upper ? 'uppercase' : ''
            }`}
          >
            {slide.label}
          </p>
          {slide.kicker && (
            <p
              className={`mt-[3cqw] text-[clamp(5px,0.9cqw,10px)] font-semibold text-black/60 ${
                upper ? 'uppercase tracking-[0.16em]' : ''
              }`}
            >
              {slide.kicker}
            </p>
          )}
          {thumbs.length > 0 && (
            <div className="mt-[2.4cqw] grid grid-cols-3 gap-[0.9cqw]">
              {thumbs.map((src, i) => (
                <figure key={src}>
                  <div className="aspect-[4/5] overflow-hidden shadow-[0_14px_30px_-20px_rgb(0_0_0_/_0.55)]">
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  {captions[i] && (
                    <figcaption
                      className={`mt-[0.7cqw] flex justify-between text-[clamp(5px,0.85cqw,9px)] font-semibold text-black/60 ${
                        upper ? 'uppercase tracking-[0.12em]' : ''
                      }`}
                    >
                      <span className="truncate">{captions[i]}</span>
                      <span aria-hidden>0{i + 1}</span>
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
          <p className="mt-auto max-w-[30cqw] text-[clamp(6px,1.15cqw,12px)] leading-snug text-black/70">
            {slide.tagline}
          </p>
        </div>
        <div className="relative overflow-hidden">
          <img src={slide.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        </div>
      </div>
    </div>
  )
}

function PosterCard({ slide, upper, ...nav }: MiniProps) {
  return (
    <div className="relative h-full overflow-hidden bg-black text-white">
      <img src={slide.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/55" />
      <MiniNav {...nav} upper={upper} className="relative" />
      <p
        className={`relative mt-[3cqw] px-[2cqw] text-center font-display text-[10.5cqw] leading-[0.9] font-medium tracking-[-0.03em] ${
          upper ? 'uppercase' : ''
        }`}
      >
        {slide.label}
      </p>
      {slide.kicker && (
        <p
          className={`relative mt-[1.6cqw] text-center text-[clamp(5px,0.95cqw,10px)] font-semibold text-white/80 ${
            upper ? 'uppercase tracking-[0.2em]' : ''
          }`}
        >
          {slide.kicker}
        </p>
      )}
      {slide.stats?.length ? (
        <div className="absolute bottom-[6.6cqw] left-[2.2cqw] flex bg-white/10 ring-1 ring-white/25 backdrop-blur-md">
          {slide.stats.slice(0, 3).map((s, i) => (
            <div key={s.label} className={`px-[1.6cqw] py-[1.1cqw] ${i > 0 ? 'border-l border-white/20' : ''}`}>
              <p className="font-display text-[2.6cqw] leading-none font-medium">{s.value}</p>
              <p
                className={`mt-[0.5cqw] text-[clamp(5px,0.8cqw,9px)] font-semibold text-white/70 ${
                  upper ? 'uppercase tracking-[0.12em]' : ''
                }`}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {slide.gallery?.length ? (
        <div className="absolute right-[2.2cqw] bottom-[6.6cqw] flex gap-[1cqw]">
          {slide.gallery.slice(0, 2).map((src, i) => (
            <figure key={src} className="w-[11.5cqw]">
              <div className="aspect-[4/5] overflow-hidden ring-1 ring-white/60 shadow-[0_18px_40px_-18px_rgb(0_0_0_/_0.8)]">
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </div>
              {slide.galleryLabels?.[i] && (
                <figcaption
                  className={`mt-[0.6cqw] flex justify-between text-[clamp(5px,0.8cqw,9px)] font-semibold text-white/85 ${
                    upper ? 'uppercase tracking-[0.12em]' : ''
                  }`}
                >
                  <span className="truncate">{slide.galleryLabels[i]}</span>
                  <span aria-hidden>0{i + 1}</span>
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 grid grid-cols-2 border-t border-white/25 bg-black/25 text-[clamp(6px,1.05cqw,11px)] backdrop-blur-sm">
        <span className="flex items-center justify-between border-r border-white/25 px-[2cqw] py-[1.3cqw]">
          <span className="truncate">{slide.tagline}</span>
          <span aria-hidden>→</span>
        </span>
        <span className="flex items-center justify-between px-[2cqw] py-[1.3cqw]">
          <span className={upper ? 'uppercase tracking-[0.14em]' : ''}>{nav.cta}</span>
          <span aria-hidden>↗</span>
        </span>
      </div>
    </div>
  )
}

function BotanicaCard({ slide, upper, ...nav }: MiniProps) {
  const [left, right] = slide.gallery ?? []
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#efe4d2] text-[#2a2018]">
      <MiniNav {...nav} upper={upper} />
      <p
        className={`relative -mx-[1cqw] overflow-hidden text-center font-display text-[15cqw] leading-[0.8] font-light tracking-[-0.03em] whitespace-nowrap ${
          upper ? 'uppercase' : ''
        }`}
      >
        {slide.label}
      </p>
      <div className="absolute bottom-[10%] left-1/2 z-10 h-[62%] w-[30%] -translate-x-1/2 overflow-hidden shadow-[0_24px_50px_-24px_rgb(0_0_0_/_0.55)]">
        <img src={slide.image} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>
      {left && (
        <div className="absolute bottom-[14%] left-[5%] h-[34%] w-[22%] overflow-hidden shadow-[0_18px_40px_-22px_rgb(0_0_0_/_0.5)]">
          <img src={left} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
      )}
      {right && (
        <div className="absolute right-[5%] bottom-[14%] h-[34%] w-[22%] overflow-hidden shadow-[0_18px_40px_-22px_rgb(0_0_0_/_0.5)]">
          <img src={right} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
      )}
      <p
        className={`absolute left-[5%] max-w-[24%] text-[clamp(6px,1.1cqw,12px)] leading-snug ${
          left ? 'top-[40%]' : 'top-[58%]'
        }`}
      >
        {slide.tagline}
      </p>
      {slide.kicker && (
        <p
          className={`absolute right-[5%] max-w-[22%] text-right text-[clamp(5px,0.95cqw,10px)] font-semibold ${
            right ? 'top-[40%]' : 'top-[58%]'
          } ${upper ? 'uppercase tracking-[0.14em]' : ''}`}
        >
          {slide.kicker}
        </p>
      )}
      <div className="mt-auto grid grid-cols-2 border-t border-black/15 text-[clamp(6px,1.05cqw,11px)]">
        <span className="flex justify-between border-r border-black/15 px-[2cqw] py-[1.3cqw]">
          <span>{slide.label}</span>
          <span aria-hidden>→</span>
        </span>
        <span className="flex justify-between px-[2cqw] py-[1.3cqw]">
          <span className={upper ? 'uppercase tracking-[0.14em]' : ''}>{nav.cta}</span>
          <span aria-hidden>→</span>
        </span>
      </div>
    </div>
  )
}

const CARD_BY_LAYOUT: Record<TemplateLayout, (p: MiniProps) => ReactNode> = {
  agency: AgencyCard,
  editorial: EditorialCard,
  poster: PosterCard,
  botanica: BotanicaCard,
}

export function TemplateCarousel({ slides }: { slides: TemplateSlide[] }) {
  const { t, locale } = useLanguage()
  const { launchTo } = usePageTransition()
  const reduceMotion = useReducedMotion()
  const upper = locale === 'en'
  const n = slides.length

  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [stageW, setStageW] = useState(1200)
  const [viewportH, setViewportH] = useState(() => window.innerHeight)
  const stageRef = useRef<HTMLDivElement>(null)
  const prevOffsets = useRef<number[]>([])
  const dragX = useRef<number | null>(null)

  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setStageW(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const go = useCallback((dir: number) => setIndex((i) => (i + dir + n) % n), [n])

  useEffect(() => {
    if (!playing || hovered || reduceMotion) return
    const id = window.setInterval(() => go(1), AUTO_MS)
    return () => window.clearInterval(id)
  }, [go, playing, hovered, reduceMotion])

  const offsets = slides.map((_, i) => circularOffset(i, index, n))
  useEffect(() => {
    prevOffsets.current = offsets
  })

  const mobile = stageW < 768
  const fitH = Math.max(250, viewportH - 350)
  const cardW = mobile ? stageW * 0.84 : Math.min(stageW * 0.58, 940, fitH / 0.62)
  const cardH = cardW * 0.62
  const spacing = cardW * 0.94 + (mobile ? 14 : 28)

  const miniLinks = [t('nav.rooms'), t('nav.boating'), t('nav.cafes')]
  const active = slides[index]

  return (
    <section className="premium-grain relative overflow-hidden bg-black py-16 text-white md:py-24 lg:py-10">
      <AnimatePresence initial={false}>
        <motion.div
          key={active.image}
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: EASE }}
          aria-hidden
        >
          <img
            src={active.image}
            alt=""
            className="h-full w-full scale-125 object-cover opacity-45 blur-3xl saturate-125"
          />
        </motion.div>
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-black" aria-hidden />

      <BlurFade className="relative mx-auto mb-10 max-w-3xl px-6 text-center md:mb-14 lg:mb-7">
        <TextReveal text={t('home.explore')} className="font-display text-lg text-white/70 md:text-xl" />
        <TextReveal
          text={t('home.curated')}
          as="h2"
          stagger={0.05}
          className="mt-2 font-sans text-3xl font-bold tracking-tight md:text-4xl 2xl:text-5xl"
        />
      </BlurFade>

      <div
        ref={stageRef}
        className="relative w-full touch-pan-y select-none"
        style={{ height: cardH + 24, perspective: mobile ? 1100 : 1900 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onPointerDown={(e) => {
          dragX.current = e.clientX
        }}
        onPointerUp={(e) => {
          if (dragX.current === null) return
          const dx = e.clientX - dragX.current
          dragX.current = null
          if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1)
          if (e.key === 'ArrowLeft') go(-1)
        }}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={t('home.curated')}
      >
        {slides.map((s, i) => {
          const d = offsets[i]
          const abs = Math.abs(d)
          const isActive = d === 0
          const prev = prevOffsets.current[i]
          const wrapped = prev !== undefined && Math.abs(prev - d) > 1
          const layout = s.layout ?? LAYOUTS[i % LAYOUTS.length]
          const Card = CARD_BY_LAYOUT[layout]

          return (
            <motion.button
              key={s.to}
              type="button"
              aria-label={s.label}
              aria-current={isActive}
              tabIndex={isActive ? 0 : -1}
              className="absolute top-0 left-1/2 cursor-pointer overflow-hidden rounded-[6px] text-left [container-type:inline-size] [transform-style:preserve-3d]"
              style={{
                width: cardW,
                height: cardH,
                marginLeft: -cardW / 2,
                zIndex: 10 - abs,
                boxShadow: isActive
                  ? '0 50px 120px -40px rgb(0 0 0 / 0.9), 0 0 0 1px rgb(255 255 255 / 0.08)'
                  : '0 30px 80px -40px rgb(0 0 0 / 0.8)',
              }}
              initial={false}
              animate={{
                x: d * spacing,
                rotateY: d === 0 ? 0 : d < 0 ? 16 : -16,
                z: abs === 0 ? 0 : -90 * abs,
                scale: isActive ? 1 : 0.95,
                opacity: abs <= 1 ? 1 : 0,
              }}
              transition={
                wrapped || reduceMotion ? { duration: 0 } : { duration: 0.95, ease: EASE }
              }
              whileHover={isActive ? { y: -6 } : undefined}
              onClick={() => (isActive ? launchTo(s.to) : setIndex(i))}
            >
              <Card slide={s} brand={t('brand.name')} links={miniLinks} cta={t('home.exploreArrow')} upper={upper} />
              <motion.div
                className="pointer-events-none absolute inset-0 bg-black"
                initial={false}
                animate={{ opacity: isActive ? 0 : 0.38 }}
                transition={{ duration: 0.6, ease: EASE }}
              />
            </motion.button>
          )
        })}
      </div>

      <div className="relative mt-10 flex items-center justify-center gap-5 lg:mt-5">
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={t('home.goToSlide', { n: i + 1 })}
              onClick={() => setIndex(i)}
              className="relative h-1.5 cursor-pointer overflow-hidden rounded-full bg-white/25 transition-all duration-500 hover:bg-white/45"
              style={{ width: i === index ? 36 : 6 }}
            >
              {i === index && (
                <motion.span
                  key={`${index}-${playing && !hovered}`}
                  className="absolute inset-y-0 left-0 bg-white"
                  initial={{ width: playing && !hovered && !reduceMotion ? '0%' : '100%' }}
                  animate={{ width: '100%' }}
                  transition={{
                    duration: playing && !hovered && !reduceMotion ? AUTO_MS / 1000 : 0,
                    ease: 'linear',
                  }}
                />
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause' : 'Play'}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/30 text-white transition hover:border-white hover:bg-white hover:text-black"
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
              <rect x="2" y="1.5" width="2.6" height="9" rx="0.6" />
              <rect x="7.4" y="1.5" width="2.6" height="9" rx="0.6" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
              <path d="M3 1.8v8.4a.6.6 0 0 0 .9.5l6.6-4.2a.6.6 0 0 0 0-1L3.9 1.3a.6.6 0 0 0-.9.5z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label={t('home.nextSlide')}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  )
}
