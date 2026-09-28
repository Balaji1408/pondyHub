import { useCallback, useEffect, useRef, useState } from 'react'

export type GalleryImage = {
  src: string
  label: string
}

type ImageAccordionProps = {
  images: GalleryImage[]
  alt: string
}

const AUTO_MS = 3000

export function ImageAccordion({ images, alt }: ImageAccordionProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [inView, setInView] = useState(false)
  const [paused, setPaused] = useState(false)

  const select = useCallback((index: number) => {
    setActive(index)
  }, [])

  useEffect(() => {
    const el = rootRef.current
    if (!el || images.length <= 1) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only the room you're currently looking at should animate.
        setInView(entry.isIntersecting && entry.intersectionRatio >= 0.45)
      },
      { threshold: [0, 0.45, 0.6, 1] },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [images.length])

  useEffect(() => {
    if (images.length <= 1 || !inView || paused) return

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % images.length)
    }, AUTO_MS)

    return () => window.clearInterval(id)
  }, [images.length, inView, paused, active])

  if (images.length === 0) return null

  if (images.length === 1) {
    return (
      <img
        src={images[0].src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
    )
  }

  return (
    <div
      ref={rootRef}
      className="absolute inset-0"
      role="group"
      aria-label={alt}
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false)
        }
      }}
    >
      {images.map((img, i) => {
        const isActive = i === active
        return (
          <img
            key={`${img.src}-${img.label}`}
            src={img.src}
            alt={`${alt} — ${img.label}`}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isActive
                ? 'z-[1] scale-100 opacity-100'
                : 'z-0 scale-105 opacity-0'
            }`}
            loading={i === 0 ? 'eager' : 'lazy'}
            aria-hidden={!isActive}
          />
        )
      })}

      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-ink/50 via-transparent to-transparent"
        aria-hidden
      />

      <div className="absolute inset-x-0 bottom-0 z-[3] flex flex-wrap items-end gap-1.5 p-4 sm:gap-2 sm:p-5 md:p-6">
        {images.map((img, i) => {
          const isActive = i === active
          return (
            <button
              key={`tab-${img.label}`}
              type="button"
              aria-pressed={isActive}
              onClick={() => select(i)}
              className={`pointer-events-auto origin-bottom rounded-sm px-3 py-2 text-[10px] font-semibold tracking-[0.18em] uppercase transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:text-[11px] ${
                isActive
                  ? 'bg-white text-ink shadow-[0_10px_28px_-12px_rgb(0_0_0_/_0.55)]'
                  : 'bg-white/15 text-white/85 ring-1 ring-white/25 backdrop-blur-sm hover:bg-white/25 hover:text-white'
              }`}
            >
              {img.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
