import { useEffect, useId, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT, type Locale } from '../i18n/locales'

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (next: Locale) => {
    setLocale(next)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t('nav.language')}
        className={`inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-medium tracking-[0.12em] text-white/70 transition hover:text-white ${
          compact ? 'px-1 py-1' : 'px-2 py-1.5'
        }`}
      >
        <span className="font-sans text-[10px] font-semibold tracking-normal opacity-90" aria-hidden>
          Aa
        </span>
        <span className="uppercase">{LOCALE_SHORT[locale]}</span>
        <span className="text-[9px] opacity-60" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('nav.language')}
          className="animate-fade-in absolute top-full right-0 z-[70] mt-2 min-w-[9.5rem] overflow-hidden border border-white/10 bg-ink py-1 shadow-[0_16px_40px_-16px_rgb(0_0_0_/_0.65)]"
        >
          {LOCALES.map((code) => {
            const active = code === locale
            return (
              <li key={code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => pick(code)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${
                    active
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{LOCALE_LABELS[code]}</span>
                  <span className="text-[10px] tracking-wide text-white/40 uppercase">
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
