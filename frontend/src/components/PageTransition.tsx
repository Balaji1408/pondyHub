import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

type LaunchPhase = 'idle' | 'covering' | 'holding' | 'revealing'

type PageTransitionContextValue = {
  launching: boolean
  launchTo: (path: string) => void
}

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null)

const COVER_MS = 860
const HOLD_MS = 480
const REVEAL_MS = 820

const PATH_LABEL_KEYS: Record<string, string> = {
  '/': 'brand.name',
  '/rooms': 'nav.rooms',
  '/vehicles': 'nav.vehicles',
  '/boating': 'nav.boating',
  '/cafes': 'nav.cafes',
  '/beaches': 'nav.beaches',
  '/bars': 'nav.bars',
  '/food-street': 'nav.foodStreet',
  '/white-town': 'nav.whiteTown',
}

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useLanguage()
  const [phase, setPhase] = useState<LaunchPhase>('idle')
  const [destLabel, setDestLabel] = useState('')
  const timers = useRef<number[]>([])
  const pathRef = useRef('/')
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  useEffect(() => {
    if (phase === 'idle') {
      document.body.classList.remove('page-transit-lock')
      return
    }
    document.body.classList.add('page-transit-lock')
    return () => document.body.classList.remove('page-transit-lock')
  }, [phase])

  const launchTo = useCallback(
    (path: string) => {
      const next = path.startsWith('/') ? path : `/${path}`
      if (phase !== 'idle') return
      if (pathnameRef.current === next) return

      clearTimers()
      pathRef.current = next
      const labelKey = PATH_LABEL_KEYS[next] ?? 'common.explore'
      setDestLabel(t(labelKey))
      setPhase('covering')

      const coverId = window.setTimeout(() => {
        navigate(pathRef.current)
        setPhase('holding')

        const holdId = window.setTimeout(() => {
          setPhase('revealing')
          const revealId = window.setTimeout(() => {
            setPhase('idle')
          }, REVEAL_MS)
          timers.current.push(revealId)
        }, HOLD_MS)
        timers.current.push(holdId)
      }, COVER_MS)
      timers.current.push(coverId)
    },
    [phase, navigate, clearTimers, t],
  )

  const value = useMemo(
    () => ({ launching: phase !== 'idle', launchTo }),
    [phase, launchTo],
  )

  return (
    <PageTransitionContext.Provider value={value}>
      {children}
      {phase !== 'idle' && (
        <div
          className={`page-transit page-transit--${phase}`}
          aria-hidden
          aria-busy={phase === 'covering' || phase === 'holding'}
        >
          <div className="page-transit__silk page-transit__silk--top" />
          <div className="page-transit__silk page-transit__silk--bottom" />
          <div className="page-transit__glow" />
          <div className="page-transit__center">
            <p className="page-transit__eyebrow">{t('hero.eyebrow')}</p>
            <p className="page-transit__brand">{t('brand.name')}</p>
            <span className="page-transit__rule" />
            <p className="page-transit__hint">{destLabel}</p>
          </div>
        </div>
      )}
    </PageTransitionContext.Provider>
  )
}

export function usePageTransition() {
  const ctx = useContext(PageTransitionContext)
  if (!ctx) throw new Error('usePageTransition must be used within PageTransitionProvider')
  return ctx
}
