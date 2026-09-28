import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

export type PillOption<T extends string> = {
  id: T
  label: string
  hint?: string
  icon?: ReactNode
}

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex max-w-full flex-wrap items-center gap-1.5 rounded-2xl bg-white/70 p-1.5 shadow-[0_16px_40px_-28px_rgb(12_20_25_/_0.5)] ring-1 ring-white/80 backdrop-blur-md">
      {children}
    </div>
  )
}

export function FilterDivider() {
  return <span className="mx-1 hidden h-7 w-px bg-sand/80 sm:block" aria-hidden />
}

/** Segmented control whose dark highlight slides to the selected option. */
export function SlidingPills<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: PillOption<T>[]
  value: T
  onChange: (id: T) => void
  ariaLabel: string
}) {
  const { locale } = useLanguage()
  const groupRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Partial<Record<T, HTMLButtonElement | null>>>({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })

  useLayoutEffect(() => {
    const measure = () => {
      const btn = buttonRefs.current[value]
      if (!btn) return
      setIndicator((prev) => ({
        left: btn.offsetLeft,
        width: btn.offsetWidth,
        ready: prev.width > 0,
      }))
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (groupRef.current) observer.observe(groupRef.current)
    return () => observer.disconnect()
  }, [value, locale, options.length])

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className="relative flex max-w-full gap-1 overflow-x-auto"
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute top-0 left-0 h-10 rounded-xl bg-ink shadow-[0_10px_22px_-12px_rgb(12_20_25_/_0.7)] motion-reduce:transition-none ${
          indicator.ready
            ? 'transition-[translate,width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]'
            : ''
        }`}
        style={{ width: indicator.width, translate: `${indicator.left}px 0` }}
      />
      {options.map((o) => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            ref={(el) => {
              buttonRefs.current[o.id] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.hint}
            onClick={() => onChange(o.id)}
            className={`relative z-10 inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-300 [&>svg]:h-4 [&>svg]:w-4 ${
              active ? 'text-white' : 'text-muted hover:bg-white/70 hover:text-ink'
            }`}
          >
            {o.icon}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

const LIST_FADE_MS = 180

/**
 * `filter` updates immediately (drives the filter bar); `listFilter` follows after the
 * results have faded out, so the list never swaps content while visible.
 */
export function useFadedFilter<F>(initial: F) {
  const [filter, setFilter] = useState(initial)
  const [listFilter, setListFilter] = useState(initial)
  const [fading, setFading] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const apply = (next: F) => {
    setFilter(next)
    setFading(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setListFilter(next)
      setFading(false)
    }, LIST_FADE_MS)
  }

  return { filter, listFilter, fading, apply }
}

/** Keep modals outside this wrapper: its transform would break `position: fixed`. */
export function FadingResults({ fading, children }: { fading: boolean; children: ReactNode }) {
  return (
    <div
      className={`flex flex-col transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-none ${
        fading ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      {children}
    </div>
  )
}

export function EmptyResults({ children }: { children: ReactNode }) {
  return (
    <p className="animate-fade-in px-6 py-20 text-center text-muted md:px-16">{children}</p>
  )
}
