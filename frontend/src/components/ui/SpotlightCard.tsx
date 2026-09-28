import { useRef, type MouseEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type SpotlightCardProps = {
  children: ReactNode
  className?: string
  spotlightColor?: string
}

/** Hover spotlight card — adapted from 21st Spotlight Card patterns (MIT-style). */
export function SpotlightCard({
  children,
  className,
  spotlightColor = 'rgba(238, 244, 247, 0.14)',
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={cn(
        'group/spot relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]',
        'before:pointer-events-none before:absolute before:inset-0 before:z-[1] before:opacity-0 before:transition-opacity before:duration-500',
        'before:bg-[radial-gradient(420px_circle_at_var(--spot-x,_50%)_var(--spot-y,_50%),var(--spot-color),transparent_55%)]',
        'hover:before:opacity-100',
        className,
      )}
      style={{ ['--spot-color' as string]: spotlightColor }}
    >
      <div className="relative z-[2]">{children}</div>
    </div>
  )
}
