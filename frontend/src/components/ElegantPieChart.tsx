import { useId, useMemo, useState } from 'react'

export type PieSlice = {
  label: string
  value: number
  color: string
}

export type ChartTheme = 'dark' | 'light'

type Props = {
  title: string
  subtitle?: string
  slices: PieSlice[]
  centerLabel?: string
  centerValue?: string | number
  size?: number
  theme?: ChartTheme
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function wedgePath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  start: number,
  end: number,
) {
  const sweep = end - start
  if (sweep <= 0.01) return ''
  const large = sweep > 180 ? 1 : 0
  const o1 = polar(cx, cy, rOuter, start)
  const o2 = polar(cx, cy, rOuter, end)
  const i1 = polar(cx, cy, rInner, end)
  const i2 = polar(cx, cy, rInner, start)
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${i2.x} ${i2.y}`,
    'Z',
  ].join(' ')
}

export function ElegantPieChart({
  title,
  subtitle,
  slices,
  centerLabel = 'Total',
  centerValue,
  size = 196,
  theme = 'light',
}: Props) {
  const uid = useId()
  const [active, setActive] = useState<number | null>(null)
  const light = theme === 'light'

  const total = useMemo(
    () => slices.reduce((sum, s) => sum + Math.max(0, s.value), 0),
    [slices],
  )

  const segments = useMemo(() => {
    if (total <= 0) return []
    const positive = slices.filter((s) => s.value > 0)
    const gap = light ? 2.5 : 3.5
    const gapTotal = positive.length > 1 ? gap * positive.length : 0
    const usable = 360 - gapTotal
    let cursor = positive.length > 1 ? gap / 2 : 0

    return positive.map((s) => {
      const sweep = (s.value / total) * usable
      const start = cursor
      const end = cursor + Math.min(sweep, 359.99)
      const seg = { ...s, start, end, pct: (s.value / total) * 100 }
      cursor = end + (positive.length > 1 ? gap : 0)
      return seg
    })
  }, [slices, total, light])

  const cx = size / 2
  const cy = size / 2
  const rOuter = size * 0.4
  const rInner = size * 0.26
  const trackR = (rOuter + rInner) / 2
  const trackW = rOuter - rInner

  const centerDefault = light ? '#0a0a0a' : '#ffffff'
  const holeFill = light ? '#ffffff' : '#22222a'
  const trackFill = light ? '#f0ebe3' : '#2e2e38'

  const display =
    active != null && segments[active]
      ? {
          label: segments[active].label,
          value: segments[active].value,
          pct: segments[active].pct,
          color: segments[active].color,
        }
      : {
          label: centerLabel,
          value: centerValue ?? total,
          pct: null as number | null,
          color: centerDefault,
        }

  return (
    <article
      className={
        light
          ? 'flex h-full flex-col rounded-[28px] border border-[#e8e4dc] bg-white p-6 shadow-[0_12px_40px_-20px_rgba(20,20,20,0.12)] md:p-7'
          : 'flex h-full flex-col rounded-[28px] bg-[#22222a] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_48px_-24px_rgba(0,0,0,0.55)] md:p-7'
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-[11px] font-medium tracking-[0.04em] ${
              light ? 'text-[#8a847a]' : 'text-[#7a7a7a]'
            }`}
          >
            {title}
          </p>
          {subtitle && (
            <h3
              className={`mt-1 text-lg font-semibold tracking-tight ${
                light ? 'text-[#0a0a0a]' : 'text-white'
              }`}
            >
              {subtitle}
            </h3>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-medium ${
            light
              ? 'bg-[#f0ebe3] text-[#6b6560]'
              : 'bg-white/[0.06] text-[#a3a3a3]'
          }`}
        >
          Live
        </span>
      </div>

      <div className="mt-6 flex flex-1 flex-col items-center gap-7 sm:flex-row sm:justify-between">
        <div className="relative shrink-0">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label={title}
          >
            <defs>
              <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="0"
                  dy="6"
                  stdDeviation="8"
                  floodColor="#1a1a1a"
                  floodOpacity={light ? 0.12 : 0.35}
                />
              </filter>
              {segments.map((seg) => (
                <linearGradient
                  key={`g-${seg.label}`}
                  id={`${uid}-${seg.label}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={seg.color} stopOpacity="1" />
                  <stop
                    offset="100%"
                    stopColor={seg.color}
                    stopOpacity={light ? 0.72 : 0.82}
                  />
                </linearGradient>
              ))}
            </defs>

            {/* Donut track */}
            <circle
              cx={cx}
              cy={cy}
              r={trackR}
              fill="none"
              stroke={trackFill}
              strokeWidth={trackW}
            />

            <g filter={`url(#${uid}-soft)`}>
              {segments.length === 0 ? null : segments.length === 1 &&
                segments[0].pct >= 99.9 ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={trackR}
                  fill="none"
                  stroke={`url(#${uid}-${segments[0].label})`}
                  strokeWidth={trackW}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setActive(0)}
                  onMouseLeave={() => setActive(null)}
                  filter={!light ? `url(#${uid}-glow)` : undefined}
                />
              ) : (
                segments.map((seg, i) => {
                  const isActive = active === i
                  const dimmed = active != null && !isActive
                  return (
                    <path
                      key={seg.label}
                      d={wedgePath(cx, cy, rOuter, rInner, seg.start, seg.end)}
                      fill={`url(#${uid}-${seg.label})`}
                      opacity={dimmed ? 0.28 : 1}
                      filter={isActive && !light ? `url(#${uid}-glow)` : undefined}
                      style={{
                        cursor: 'pointer',
                        transition: 'opacity 0.25s ease, transform 0.3s ease',
                        transform: isActive ? 'scale(1.035)' : 'scale(1)',
                        transformOrigin: `${cx}px ${cy}px`,
                      }}
                      onMouseEnter={() => setActive(i)}
                      onMouseLeave={() => setActive(null)}
                    />
                  )
                })
              )}
            </g>

            {/* Donut hole */}
            <circle cx={cx} cy={cy} r={rInner - 0.5} fill={holeFill} />
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p
              className={`text-[10px] font-medium tracking-[0.14em] uppercase ${
                light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'
              }`}
            >
              {display.label}
            </p>
            <p
              className="mt-1 text-[1.75rem] font-bold tracking-tight tabular-nums"
              style={{ color: display.color }}
            >
              {display.value}
            </p>
            {display.pct != null && (
              <p
                className={`mt-0.5 text-xs font-medium ${
                  light ? 'text-[#9a9288]' : 'text-[#8a8a8a]'
                }`}
              >
                {display.pct.toFixed(0)}%
              </p>
            )}
          </div>
        </div>

        <ul className="w-full min-w-0 space-y-2 sm:max-w-[200px]">
          {slices.map((s) => {
            const pct = total > 0 ? (s.value / total) * 100 : 0
            const segIdx = segments.findIndex((x) => x.label === s.label)
            const isActive = active != null && segIdx === active
            return (
              <li key={s.label}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                    light
                      ? isActive
                        ? 'bg-[#f6f3ed]'
                        : 'hover:bg-[#faf8f5]'
                      : isActive
                        ? 'bg-white/[0.07]'
                        : 'hover:bg-white/[0.04]'
                  }`}
                  onMouseEnter={() => setActive(segIdx >= 0 ? segIdx : null)}
                  onMouseLeave={() => setActive(null)}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: s.color,
                      boxShadow: light ? 'none' : `0 0 10px ${s.color}66`,
                    }}
                  />
                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${
                      light ? 'text-[#3d3d3d]' : 'text-[#c5c5c5]'
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="shrink-0 text-right">
                    <span
                      className={`block text-sm font-semibold tabular-nums ${
                        light ? 'text-[#0a0a0a]' : 'text-white'
                      }`}
                    >
                      {s.value}
                    </span>
                    <span
                      className={`block text-[10px] tabular-nums ${
                        light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'
                      }`}
                    >
                      {pct.toFixed(0)}%
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </article>
  )
}
