import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-[#c8d6de] bg-white/85 px-3.5 py-2.5 text-sm text-[#0c1419] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition placeholder:text-[#8a9aa4] focus:border-[#1f4d52]/50 focus:ring-4 focus:ring-[#1f4d52]/12'

const labelClass = 'text-[10px] font-semibold tracking-[0.16em] text-[#5a6a74] uppercase'

export const ownerAuthFieldClass = fieldClass
export const ownerAuthLabelClass = labelClass

export function OwnerAuthShell({
  brandLine,
  title,
  subtitle,
  children,
  footer,
  wide = false,
  compact = false,
}: {
  brandLine: string
  title: string
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
  compact?: boolean
}) {
  return (
    <div
      className={`relative flex h-dvh flex-col overflow-x-hidden text-[#0c1419] ${
        compact ? 'overflow-y-hidden' : 'owner-auth-scroll overflow-y-auto'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 55% at 8% 12%, rgb(31 77 82 / 0.16), transparent 58%), radial-gradient(ellipse 55% 45% at 92% 8%, rgb(148 190 205 / 0.45), transparent 52%), radial-gradient(ellipse 60% 40% at 70% 95%, rgb(170 200 188 / 0.35), transparent 55%)',
        }}
      />
      <div
        className="pointer-events-none absolute -top-24 right-[-10%] h-56 w-56 rounded-full bg-[#1f4d52]/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[-12%] left-[-8%] h-64 w-64 rounded-full bg-[#94becd]/25 blur-3xl"
        aria-hidden
      />

      <header
        className={`relative z-10 mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between px-5 md:px-8 ${
          compact ? 'py-4' : 'py-5'
        }`}
      >
        <Link
          to="/"
          className={`font-display tracking-tight text-[#0c1419] transition hover:text-[#1f4d52] ${
            compact ? 'text-lg' : 'text-xl sm:text-2xl'
          }`}
        >
          Pondy Tripora
        </Link>
        <Link
          to="/"
          className="text-[10px] font-semibold tracking-[0.16em] text-[#5a6a74] uppercase transition hover:text-[#0c1419]"
        >
          Back to site
        </Link>
      </header>

      <main
        className={`relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-8 md:px-8 ${
          compact ? 'justify-center py-2' : 'pb-12'
        }`}
      >
        <div
          className={`mx-auto w-full animate-fade-up ${wide ? 'max-w-2xl' : 'max-w-[380px]'}`}
        >
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[#1f4d52] uppercase">
            {brandLine}
          </p>
          <h1
            className={`mt-1.5 font-display leading-[1.12] tracking-tight text-[#0c1419] ${
              compact
                ? 'text-[1.85rem] sm:text-[2.1rem]'
                : 'text-[2.1rem] sm:text-4xl'
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <div className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-[#5a6a74] animate-fade-up-delay">
              {subtitle}
            </div>
          )}

          <div
            className={`animate-fade-up-delay-2 overflow-hidden border border-white/70 bg-white/75 shadow-[0_24px_60px_-40px_rgba(12,20,25,0.5)] backdrop-blur-xl ${
              compact
                ? 'mt-5 rounded-2xl p-5'
                : 'mt-6 rounded-[24px] p-5 sm:p-7'
            }`}
          >
            {children}
          </div>

          {footer && (
            <div className={`text-center text-[13px] text-[#5a6a74] ${compact ? 'mt-4' : 'mt-5'}`}>
              {footer}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
