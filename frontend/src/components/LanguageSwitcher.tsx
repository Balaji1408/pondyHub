import { useEffect, useId, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT, type Locale } from '../i18n/locales'

export function LanguageSwitcher({
  compact = false,
  placement = 'down',
  size = 'sm',
  tone = 'dark',
}: {
  compact?: boolean
  placement?: 'down' | 'up'
  size?: 'sm' | 'md'
  tone?: 'dark' | 'light'
}) {
  const { locale, setLocale, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const light = tone === 'light'

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (next: Locale) => {
    setLocale(next)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative z-[80]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t('nav.language')}
        className={`inline-flex h-10 cursor-pointer items-center gap-1.5 font-semibold tracking-[0.12em] uppercase transition ${
          size === 'md' ? 'text-[13px]' : 'text-[11px]'
        } ${
          light
            ? `rounded-full border border-[#c8d6de] bg-white px-2.5 text-[#0c1419] shadow-[0_8px_18px_-14px_rgba(12,20,25,0.45)] hover:border-[#0c1419]/40 ${
                compact ? '' : 'sm:px-3'
              }`
            : `text-white hover:opacity-90 ${compact ? 'px-2' : 'px-2.5'}`
        }`}
      >
        {light ? (
          <>
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0c1419] text-[9px] font-bold tracking-wide text-white">
              {LOCALE_SHORT[locale]}
            </span>
            <span className="hidden sm:inline">{t('nav.language')}</span>
            <span className="text-[9px] text-[#5a6a74]" aria-hidden>
              {open ? '▴' : '▾'}
            </span>
          </>
        ) : (
          <>
            <span className="uppercase">Lang</span>
            <span className="text-[9px] opacity-60" aria-hidden>
              ▾
            </span>
          </>
        )}
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('nav.language')}
          className={`animate-fade-in absolute z-[90] min-w-[11rem] overflow-hidden py-1.5 shadow-[0_18px_40px_-18px_rgba(12,20,25,0.55)] ${
            placement === 'up' ? 'bottom-full left-0 mb-2' : 'top-full right-0 mt-2'
          } ${
            light
              ? 'rounded-2xl border border-[#c8d6de] bg-white'
              : 'border border-white/10 bg-ink'
          }`}
        >
          {LOCALES.map((code) => {
            const active = code === locale
            return (
              <li key={code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    pick(code)
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm transition ${
                    light
                      ? active
                        ? 'bg-[#0c1419] text-white'
                        : 'text-[#3d4c55] hover:bg-[#f4f8fa] hover:text-[#0c1419]'
                      : active
                        ? 'bg-white/10 text-white'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{LOCALE_LABELS[code]}</span>
                  <span
                    className={`text-[10px] tracking-wide uppercase ${
                      light ? (active ? 'text-white/55' : 'text-[#8a9aa4]') : 'text-white/40'
                    }`}
                  >
                    {LOCALE_SHORT[code]}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
