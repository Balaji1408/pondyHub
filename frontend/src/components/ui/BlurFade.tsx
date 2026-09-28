import { useRef, type ReactNode } from 'react'
import { motion, useInView, useReducedMotion, type Variants } from 'motion/react'
import { cn } from '../../lib/cn'

type BlurFadeProps = {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  yOffset?: number
  blur?: string
  inView?: boolean
  once?: boolean
}

/** Scroll blur-fade — adapted from 21st / Magic UI Blur Fade (dillionverma, MIT). */
export function BlurFade({
  children,
  className,
  delay = 0,
  duration = 0.45,
  yOffset = 12,
  blur = '8px',
  inView = true,
  once = true,
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once, amount: 0.25 })
  const reduced = useReducedMotion()
  const show = !inView || isInView

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: yOffset,
      filter: `blur(${blur})`,
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
    },
  }

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : 'hidden'}
      animate={reduced || show ? 'visible' : 'hidden'}
      variants={variants}
      transition={{
        delay: Math.max(0, delay),
        duration: reduced ? 0 : duration,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
