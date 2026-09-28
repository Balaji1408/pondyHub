import { Link } from 'react-router-dom'
import { useEffect, useRef, useState, type ReactNode } from 'react'

export function CardCarousel({
  title,
  subtitle,
  viewAllTo,
  children,
}: {
  title: string
  subtitle?: string
  viewAllTo?: string
  children: ReactNode
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  const update = () => {
    const el = scrollerRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 8)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [children])

  const scrollBy = (dir: number) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(360, el.clientWidth * 0.7), behavior: 'smooth' })
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-4xl">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-muted md:text-base">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {viewAllTo && (
            <Link
              to={viewAllTo}
              className="mr-2 hidden text-xs font-semibold tracking-[0.14em] text-ink uppercase hover:opacity-70 sm:inline"
            >
              See all
            </Link>
          )}
          <button
            type="button"
            aria-label="Previous"
            disabled={!canPrev}
            onClick={() => scrollBy(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 bg-surface text-ink transition enabled:hover:bg-ink enabled:hover:text-white disabled:opacity-30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M19 12H5M11 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next"
            disabled={!canNext}
            onClick={() => scrollBy(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 bg-surface text-ink transition enabled:hover:bg-ink enabled:hover:text-white disabled:opacity-30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 md:mx-0 md:gap-5 md:px-0"
      >
        {children}
      </div>
    </section>
  )
}

export function PosterCard({
  to,
  image,
  title,
  meta,
  price,
  badge,
  index = 0,
}: {
  to: string
  image: string
  title: string
  meta?: string
  price?: string
  badge?: string
  index?: number
}) {
  return (
    <Link
      to={to}
      className="animate-card-rise card-lift group w-[170px] shrink-0 snap-start sm:w-[200px] md:w-[220px]"
      style={{ animationDelay: `${Math.min(index, 8) * 0.06}s` }}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-sand shadow-sm">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        {badge && (
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-ink uppercase backdrop-blur">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-semibold text-ink">{title}</p>
      {meta && <p className="mt-0.5 text-xs text-muted">{meta}</p>}
      {price && <p className="mt-1 text-sm font-semibold text-ink">{price}</p>}
    </Link>
  )
}
