export function SunsetMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <path d="M8 19a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16 6.5v2.5M7.2 10.2l1.8 1.8M24.8 10.2 23 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M4 23c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
