import { useEffect, useRef, useState, type PointerEvent } from 'react'
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import { useLanguage } from '../i18n/LanguageContext'
import { usePageTransition } from './PageTransition'
import { SunsetMark } from './ui/SunsetMark'

const EASE = [0.22, 1, 0.36, 1] as const
const CARD_BG = '#050709'

const unsplash = (id: string, w = 600) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80`

const IMG = {
  beach: unsplash('1507525428034-b723cf961d3e', 900),
  room: unsplash('1611892440504-42a792e24d32'),
  scooter: unsplash('1694956792421-e946fff94564', 300),
  boat: unsplash('1468413253725-0d5181091126', 300),
  cafe: unsplash('1554118811-1e0d58224f24', 300),
}

type SceneId = 'ask1' | 'answer' | 'preview' | 'ask2' | 'chips' | 'plan'

const SCENES: { id: SceneId; ms: number }[] = [
  { id: 'ask1', ms: 1900 },
  { id: 'answer', ms: 2100 },
  { id: 'preview', ms: 2400 },
  { id: 'ask2', ms: 1900 },
  { id: 'chips', ms: 3000 },
  { id: 'plan', ms: 4800 },
]

const ASK_WHERE = 'Where do you want to wake up?'
const ANSWER = 'Paradise Beach'
const ASK_WHAT = 'What should we line up?'
const CHIPS = ['Sea-view stay', 'Scooter · 2 days', 'Backwater boat', 'Café hopping', 'Sunset dinner']

const THEMES = [
  { bg: '#16262b', panel: '#20363d', ink: '#e9f0f2', accent: '#e8925f' },
  { bg: '#ece4d5', panel: '#f7f1e6', ink: '#1d1a17', accent: '#9c2f3a' },
  { bg: '#3b0f1b', panel: '#4e1726', ink: '#f6e8ea', accent: '#f0a36f' },
]

function useSceneLoop(paused: boolean) {
  const [scene, setScene] = useState(0)
  const [loop, setLoop] = useState(0)

  useEffect(() => {
    if (paused) return
    const id = window.setTimeout(() => {
      if (scene === SCENES.length - 1) {
        setScene(0)
        setLoop((l) => l + 1)
      } else {
        setScene(scene + 1)
      }
    }, SCENES[scene].ms)
    return () => window.clearTimeout(id)
  }, [scene, paused])

  return { scene: SCENES[scene].id, key: `${loop}-${scene}` }
}

function useTypewriter(text: string, duration: number, delay = 250) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let i = 0
    let interval: number | undefined
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        i += 1
        setCount(i)
        if (i >= text.length) window.clearInterval(interval)
      }, duration / text.length)
    }, delay)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(interval)
    }
  }, [text, duration, delay])

  return text.slice(0, count)
}

function Caret({ className }: { className: string }) {
  return (
    <motion.span
      aria-hidden
      className={`inline-block w-[2px] rounded-full bg-sky-400 ${className}`}
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 0.9, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
    />
  )
}

function Bubbles({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="9" cy="10" r="6" fill="currentColor" />
      <circle cx="18.5" cy="17.5" r="3.5" fill="currentColor" opacity="0.75" />
    </svg>
  )
}

function PromptPill({ text, size, typeMs }: { text: string; size: 'sm' | 'lg'; typeMs: number }) {
  const typed = useTypewriter(text, typeMs)
  const lg = size === 'lg'
  return (
    <div
      className={`inline-flex items-center rounded-full bg-gradient-to-r from-white/[0.15] via-white/[0.07] to-white/[0.02] whitespace-nowrap text-white shadow-[inset_0_1px_0_rgb(255_255_255_/_0.1),0_20px_40px_-20px_rgb(0_0_0_/_0.8)] ring-1 ring-white/10 ${
        lg ? 'min-w-[110%] gap-4 py-4 pr-28 pl-6 text-3xl sm:text-[40px]' : 'gap-2.5 py-2.5 pr-6 pl-4 text-sm sm:text-base'
      }`}
    >
      <Bubbles className={`shrink-0 ${lg ? 'size-8 sm:size-9' : 'size-4'}`} />
      <span className="grid">
        <span className="invisible col-start-1 row-start-1">{text}</span>
        <span className="col-start-1 row-start-1">
          {typed}
          <Caret className={lg ? 'ml-1 h-[0.9em] translate-y-[0.12em]' : 'ml-0.5 h-[1em] translate-y-[0.15em]'} />
        </span>
      </span>
    </div>
  )
}

function Bars({ widths, className = '' }: { widths: string[]; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {widths.map((w, i) => (
        <span key={i} className="block h-1 rounded-full bg-current opacity-20" style={{ width: w }} />
      ))}
    </div>
  )
}

function AskScene({ text, exitUp = false }: { text: string; exitUp?: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center px-6"
      initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={
        exitUp
          ? { opacity: 0, y: -40, filter: 'blur(8px)', transition: { duration: 0.5, ease: EASE } }
          : { opacity: 0, scale: 1.35, filter: 'blur(10px)', transition: { duration: 0.55, ease: EASE } }
      }
      transition={{ duration: 0.6, ease: EASE }}
    >
      <PromptPill text={text} size="sm" typeMs={1000} />
    </motion.div>
  )
}

function AnswerScene() {
  return (
    <motion.div
      className="absolute inset-0 flex origin-left items-center pl-[9%]"
      initial={{ opacity: 0, scale: 0.72, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', x: '-10%' }}
      exit={{ opacity: 0, x: '-55%', filter: 'blur(6px)', transition: { duration: 0.6, ease: EASE } }}
      transition={{ default: { duration: 0.6, ease: EASE }, x: { duration: 2.1, ease: 'linear' } }}
    >
      <PromptPill text={ANSWER} size="lg" typeMs={900} />
    </motion.div>
  )
}

function PreviewScene() {
  return (
    <motion.div
      className="absolute inset-0 pt-[76px] pl-[12%]"
      initial={{ opacity: 0, x: 70, filter: 'blur(10px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.97, filter: 'blur(12px)', transition: { duration: 0.55 } }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <motion.div
        className="relative h-[80%] overflow-hidden rounded-l-xl bg-[#1b2a30] text-white ring-1 ring-white/5"
        animate={{ y: [0, -14] }}
        transition={{ duration: 2.4, ease: 'linear' }}
      >
        <p className="absolute top-[7%] left-[26%] font-display text-4xl whitespace-nowrap text-white/85 sm:text-5xl">
          {ANSWER}
        </p>
        <motion.img
          src={IMG.beach}
          alt=""
          className="absolute top-[38%] left-[6%] h-[53%] w-[36%] rounded-sm object-cover shadow-[0_20px_40px_-20px_rgb(0_0_0_/_0.8)]"
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.9, ease: EASE }}
        />
        <div className="absolute top-[42%] right-6 left-[48%]">
          <p className="font-display text-[11px] text-white/70">Golden hour · 4–6 PM</p>
          <Bars widths={['96%', '88%', '92%', '64%']} className="mt-3" />
        </div>
      </motion.div>
    </motion.div>
  )
}

function Check() {
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/90 text-black">
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
        <path d="m4 8.5 2.5 2.5L12 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function ChipsScene() {
  return (
    <motion.div
      className="absolute inset-0 flex justify-center overflow-hidden pt-[76px] [mask-image:linear-gradient(to_bottom,transparent_40px,black_76px,black_62%,transparent_92%)]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96, filter: 'blur(10px)', transition: { duration: 0.55 } }}
    >
      <motion.ul
        className="flex flex-col gap-4 sm:gap-5"
        animate={{ y: ['0rem', '0rem', '-10rem'] }}
        transition={{ duration: 3, times: [0, 0.35, 1], ease: 'easeInOut' }}
      >
        {CHIPS.map((chip, i) => (
          <motion.li
            key={chip}
            className={i % 2 ? 'ml-10' : ''}
            initial={{ opacity: 0, x: 90, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.12 + i * 0.14, duration: 0.7, ease: EASE }}
          >
            <span className="inline-flex w-[15.5rem] items-center gap-3 rounded-full bg-gradient-to-r from-white/[0.16] to-white/[0.03] px-5 py-3.5 text-lg text-white/90 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)] ring-1 ring-white/10 sm:w-[20rem] sm:gap-4 sm:px-6 sm:py-4 sm:text-2xl">
              <Check />
              {chip}
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  )
}

function PlanScene({ still }: { still: boolean }) {
  const [themeIndex, setThemeIndex] = useState(0)
  const th = THEMES[themeIndex]

  useEffect(() => {
    if (still) return
    const id = window.setInterval(() => setThemeIndex((i) => (i + 1) % THEMES.length), 1600)
    return () => window.clearInterval(id)
  }, [still])

  const rows = [
    { img: IMG.scooter, label: 'Scooter · 2 days', price: '₹800' },
    { img: IMG.boat, label: 'Backwater boat', price: '₹600' },
    { img: IMG.cafe, label: 'Café trail', price: 'Free' },
  ]

  return (
    <motion.div
      className="absolute inset-x-4 top-[72px] bottom-0 overflow-hidden rounded-t-xl sm:inset-x-[7%] shadow-[0_30px_60px_-30px_rgb(0_0_0_/_0.9)]"
      initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.94, filter: 'blur(16px)', transition: { duration: 0.7 } }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ backgroundColor: th.bg, color: th.ink }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        <motion.div
          className="p-4"
          animate={still ? undefined : { y: ['0%', '0%', '-46%'] }}
          transition={{ duration: 4.6, times: [0, 0.18, 1], ease: 'easeInOut' }}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-sm">Your Pondy weekend</span>
            <span className="hidden gap-3 text-[8px] opacity-60 sm:flex">
              <span>Stay</span>
              <span>Ride</span>
              <span>Sail</span>
            </span>
            <motion.span
              className="rounded-full px-2.5 py-1 text-[8px] font-semibold text-white"
              animate={{ backgroundColor: th.accent }}
              transition={{ duration: 0.4 }}
            >
              Book
            </motion.span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <img src={IMG.beach} alt="" className="aspect-[4/3] w-full rounded-sm object-cover" />
            <div>
              <p className="font-display text-2xl leading-[1.05] sm:text-3xl">{ANSWER}</p>
              <Bars widths={['100%', '86%', '70%']} className="mt-3" />
            </div>
          </div>

          <motion.div
            className="mt-4 grid grid-cols-[1fr_1.15fr] items-center gap-3 rounded-md p-3"
            animate={{ backgroundColor: th.panel }}
            transition={{ duration: 0.4 }}
          >
            <div>
              <p className="text-[8px] tracking-[0.2em] uppercase opacity-60">Your stay</p>
              <p className="mt-1 font-display text-xl leading-tight">Sea-view suite</p>
              <p className="mt-1 text-[10px] opacity-70">₹3,200 / night</p>
            </div>
            <img src={IMG.room} alt="" className="aspect-[4/3] w-full rounded-sm object-cover" />
          </motion.div>

          <motion.div
            className="mt-4 rounded-md p-3"
            animate={{ backgroundColor: th.panel }}
            transition={{ duration: 0.4 }}
          >
            <p className="font-display text-xl">Ride &amp; sail</p>
            <ul className="mt-2.5 space-y-2">
              {rows.map((row) => (
                <li key={row.label} className="flex items-center gap-2.5">
                  <img src={row.img} alt="" className="size-8 rounded-sm object-cover" />
                  <span className="flex-1 text-[10px]">{row.label}</span>
                  <span className="text-[10px] opacity-70">{row.price}</span>
                  <motion.span
                    className="rounded-full px-2 py-0.5 text-[8px] font-semibold text-white"
                    animate={{ backgroundColor: th.accent }}
                    transition={{ duration: 0.4 }}
                  >
                    Book
                  </motion.span>
                </li>
              ))}
            </ul>
          </motion.div>

          <p className="mt-5 font-display text-4xl opacity-30">Pondy Hub</p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

function Scene({ id, still }: { id: SceneId; still: boolean }) {
  switch (id) {
    case 'ask1':
      return <AskScene text={ASK_WHERE} />
    case 'answer':
      return <AnswerScene />
    case 'preview':
      return <PreviewScene />
    case 'ask2':
      return <AskScene text={ASK_WHAT} exitUp />
    case 'chips':
      return <ChipsScene />
    case 'plan':
      return <PlanScene still={still} />
  }
}

export function TripPlannerCard() {
  const { t } = useLanguage()
  const { launchTo } = usePageTransition()
  const reduced = !!useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref, { amount: 0.3 })
  const [started, setStarted] = useState(false)
  const { scene, key } = useSceneLoop(!visible || reduced)

  useEffect(() => {
    if (visible) setStarted(true)
  }, [visible])

  useEffect(() => {
    for (const src of Object.values(IMG)) new Image().src = src
  }, [])

  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const spring = { stiffness: 140, damping: 18, mass: 0.6 }
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), spring)
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), spring)

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width - 0.5)
    py.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onPointerLeave = () => {
    px.set(0)
    py.set(0)
  }

  const shown: SceneId = reduced ? 'plan' : scene

  return (
    <div
      ref={ref}
      className="w-full [perspective:1400px] lg:ml-auto lg:max-w-[500px] xl:max-w-[520px]"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <motion.div
        style={{ rotateX, rotateY, backgroundColor: CARD_BG }}
        className="relative flex h-[540px] flex-col overflow-hidden rounded-2xl text-white shadow-[0_40px_80px_-40px_rgb(12_20_25_/_0.7)] ring-1 ring-black/30 sm:h-[600px] lg:h-[clamp(420px,calc(100svh_-_10.5rem),540px)] lg:rounded-[22px]"
      >
        <div className="relative flex-1 overflow-hidden">
          {started && (
            <AnimatePresence>
              <Scene key={reduced ? 'still' : key} id={shown} still={reduced} />
            </AnimatePresence>
          )}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24"
            style={{ background: `linear-gradient(to top, ${CARD_BG}, transparent)` }}
          />
        </div>

        <div className="absolute top-4 left-4 z-20 grid size-11 place-items-center rounded-xl bg-white/[0.08] ring-1 ring-white/10 backdrop-blur">
          <SunsetMark className="size-6 text-white" />
        </div>

        <div className="relative z-20 px-6 pt-2 pb-7 text-center">
          <p className="text-[12px] font-semibold text-white/90">{t('planner.label')}</p>
          <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-white/50">{t('planner.body')}</p>
          <button
            type="button"
            onClick={() => launchTo('/rooms')}
            className="group mt-4 inline-flex cursor-pointer items-center gap-2 text-lg font-semibold text-white transition hover:opacity-90"
          >
            {t('planner.cta')}
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}
