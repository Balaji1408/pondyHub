import { useEffect, useRef, useState } from 'react'
import { useInView, useMotionValue, useSpring } from 'motion/react'
import { cn } from '../../lib/cn'

type NumberTickerProps = {
  value: number
  direction?: 'up' | 'down'
  delay?: number
  className?: string
  decimalPlaces?: number
  suffix?: string
  prefix?: string
}

/** Animated number ticker — adapted from 21st / Magic UI Number Ticker pattern (MIT). */
export function NumberTicker({
  value,
  direction = 'up',
  delay = 0,
  className,
  decimalPlaces = 0,
  suffix = '',
  prefix = '',
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === 'down' ? value : 0)
  const springValue = useSpring(motionValue, { damping: 40, stiffness: 120 })
  const isInView = useInView(ref, { once: true, amount: 0.4 })
  const [display, setDisplay] = useState(
    `${prefix}${(direction === 'down' ? value : 0).toFixed(decimalPlaces)}${suffix}`,
  )

  useEffect(() => {
    if (!isInView) return
    const timeout = window.setTimeout(() => {
      motionValue.set(direction === 'down' ? 0 : value)
    }, delay * 1000)
    return () => window.clearTimeout(timeout)
  }, [isInView, delay, value, direction, motionValue])

  useEffect(() => {
    const unsub = springValue.on('change', (latest) => {
      setDisplay(
        `${prefix}${Number(latest).toLocaleString('en-IN', {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        })}${suffix}`,
      )
    })
    return unsub
  }, [springValue, decimalPlaces, prefix, suffix])

  return (
    <span ref={ref} className={cn('inline-block tabular-nums tracking-tight', className)}>
      {display}
    </span>
  )
}
