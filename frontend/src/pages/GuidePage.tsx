import { useEffect, useMemo, useState } from 'react'
import { useGuide } from '../api/hooks'
import type { GuideContact, GuideSection } from '../types'

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, '')
}

function formatPhone(phone: string) {
  const digits = digitsOnly(phone)
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
  }
  return phone
}

function copyValue(phone: string) {
  const digits = digitsOnly(phone)
  const local = digits.startsWith('91') && digits.length > 10 ? digits.slice(2) : digits
  return local || phone.trim()
}

function CopyIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 012-2h10" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ServicesIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 10h16v9a2 2 0 01-2 2H6a2 2 0 01-2-2v-9z" />
      <path d="M8 10V7a4 4 0 018 0v3" strokeLinecap="round" />
      <path d="M9 14h6" strokeLinecap="round" />
    </svg>
  )
}

function PlacesIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  )
}

function RulesIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M8 4h7l3 3v13a1.5 1.5 0 01-1.5 1.5H8A1.5 1.5 0 016.5 20V5.5A1.5 1.5 0 018 4z" />
      <path d="M15 4v3h3M9 12h6M9 16h4" strokeLinecap="round" />
    </svg>
  )
}

function MapIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  )
}

function tabIcon(type: GuideSection['type'], className?: string) {
  if (type === 'contacts') return <ServicesIcon className={className} />
  if (type === 'places') return <PlacesIcon className={className} />
  return <RulesIcon className={className} />
}

function tabShortLabel(section: GuideSection) {
  if (section.type === 'contacts') return 'Services'
  if (section.type === 'places') return 'Places'
  return section.title
}

async function writeClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    const el = document.createElement('textarea')
    el.value = value
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}

function CopyNumberRow({ phone, label }: { phone: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    await writeClipboard(copyValue(phone))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center gap-3 border-b border-[#0c1419]/08 py-3.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        {label && (
          <p className="text-[11px] font-medium tracking-[0.08em] text-[#7a8b95] uppercase">
            {label}
          </p>
        )}
        <p className="mt-1 font-semibold tabular-nums tracking-wide text-[#1f4d52] sm:text-lg">
          {formatPhone(phone)}
        </p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? 'Copied' : `Copy ${label || formatPhone(phone)}`}
        title={copied ? 'Copied' : 'Copy number'}
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
          copied
            ? 'bg-[#1f4d52] text-white'
            : 'bg-[#1f4d52]/10 text-[#1f4d52] hover:bg-[#1f4d52] hover:text-white'
        }`}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    </div>
  )
}

function ServicesPanel({
  section,
  query,
  onQueryChange,
}: {
  section: Extract<GuideSection, { type: 'contacts' }>
  query: string
  onQueryChange: (value: string) => void
}) {
  const [groupIndex, setGroupIndex] = useState(0)
  const q = query.trim().toLowerCase()

  const groups = useMemo(() => {
    if (!q) return section.groups
    return section.groups
      .map((g) => ({
        ...g,
        contacts: g.contacts.filter(
          (c) =>
            c.label.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            g.title.toLowerCase().includes(q) ||
            (g.subtitle ?? '').toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.contacts.length > 0)
  }, [section.groups, q])

  useEffect(() => {
    setGroupIndex(0)
  }, [query, section.id])

  const safeIndex = groups.length ? Math.min(groupIndex, groups.length - 1) : 0
  const current = groups[safeIndex]

  return (
    <div className="animate-fade-up">
      <div className="flex flex-col gap-4 border-b border-[#0c1419]/08 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[#1f4d52] uppercase">
            Directory
          </p>
          <h2 className="mt-1 font-display text-3xl text-[#0c1419]">{section.title}</h2>
          {section.intro && (
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#5a6a74]">{section.intro}</p>
          )}
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Search numbers</span>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Find a service or number"
            className="w-full rounded-xl border border-[#c5d3db] bg-white/80 px-3.5 py-2.5 text-sm text-[#0c1419] outline-none transition placeholder:text-[#8a9aa4] focus:border-[#1f4d52]/5"
          />
        </label>
      </div>

      {groups.length > 0 ? (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            {groups.map((g, i) => (
              <button
                key={`${g.title}-${i}`}
                type="button"
                onClick={() => setGroupIndex(i)}
                className={`rounded-lg px-3.5 py-2 text-left text-[12px] font-semibold transition ${
                  i === safeIndex
                    ? 'bg-[#0c1419] text-white'
                    : 'bg-white/70 text-[#5a6a74] ring-1 ring-[#c5d3db] hover:text-[#0c1419]'
                }`}
              >
                {g.title}
              </button>
            ))}
          </div>

          {current && (
            <div className="mt-6 rounded-[22px] bg-white/75 px-4 py-2 ring-1 ring-[#d5e0e6] sm:px-5">
              <div className="border-b border-[#0c1419]/06 py-3">
                <p className="font-semibold text-[#0c1419]">{current.title}</p>
                {current.subtitle && (
                  <p className="mt-0.5 text-sm text-[#5a6a74]">{current.subtitle}</p>
                )}
              </div>
              {current.contacts.map((c, i) => (
                <CopyNumberRow key={`${c.phone}-${i}`} phone={c.phone} label={c.label} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="mt-8 rounded-[22px] bg-white/70 px-5 py-10 text-center ring-1 ring-[#d5e0e6]">
          <p className="font-medium text-[#0c1419]">No matches for “{query}”</p>
          <p className="mt-1 text-sm text-[#5a6a74]">Try another service name or digits.</p>
        </div>
      )}
    </div>
  )
}

function PlacesPanel({ section }: { section: Extract<GuideSection, { type: 'places' }> }) {
  return (
    <div className="animate-fade-up">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-[#1f4d52] uppercase">Explore</p>
      <h2 className="mt-1 font-display text-3xl text-[#0c1419]">{section.title}</h2>
      {section.intro && (
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#5a6a74]">{section.intro}</p>
      )}

      <div className="mt-8 space-y-8">
        {section.groups.map((group, gi) => (
          <div key={`${group.title}-${gi}`}>
            <h3 className="flex items-center gap-2 font-display text-xl text-[#0c1419]">
              <PlacesIcon className="h-4 w-4 text-[#1f4d52]" />
              {group.title}
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {group.places.map((place, pi) => (
                <a
                  key={`${place.name}-${pi}`}
                  href={place.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col justify-between rounded-[20px] bg-white/75 p-4 ring-1 ring-[#d5e0e6] transition hover:ring-[#1f4d52]/35"
                >
                  <div>
                    <p className="font-semibold text-[#0c1419]">{place.name}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#5a6a74]">
                      {place.description}
                    </p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] text-[#1f4d52] uppercase">
                    <MapIcon className="h-3.5 w-3.5" />
                    Open map
                  </span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PolicyPanel({ section }: { section: Extract<GuideSection, { type: 'policy' }> }) {
  const [open, setOpen] = useState(0)
  const cols =
    section.highlights.length <= 1
      ? 'grid-cols-1'
      : section.highlights.length === 2
        ? 'grid-cols-2'
        : section.highlights.length === 3
          ? 'grid-cols-1 sm:grid-cols-3'
          : 'grid-cols-2 sm:grid-cols-4'

  return (
    <div className="animate-fade-up">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-[#1f4d52] uppercase">
        Stay notes
      </p>
      <h2 className="mt-1 font-display text-3xl text-[#0c1419]">{section.title}</h2>
      {section.intro && (
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#5a6a74]">{section.intro}</p>
      )}

      {section.highlights.length > 0 && (
        <div className={`mt-6 grid gap-3 ${cols}`}>
          {section.highlights.map((h, i) => (
            <div
              key={`${h.label}-${i}`}
              className="rounded-2xl bg-[#0c1419] px-4 py-4 text-white"
            >
              <p className="text-[10px] font-semibold tracking-[0.14em] text-white/50 uppercase">
                {h.label}
              </p>
              <p className="mt-1.5 text-sm font-semibold">{h.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-2">
        {section.blocks.map((block, bi) => {
          const isOpen = open === bi
          return (
            <div
              key={`${block.title}-${bi}`}
              className="overflow-hidden rounded-2xl bg-white/75 ring-1 ring-[#d5e0e6]"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : bi)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
              >
                <span className="font-semibold text-[#0c1419]">{block.title}</span>
                <span className="text-[11px] font-semibold tracking-[0.12em] text-[#5a6a74] uppercase">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <ul className="space-y-2 border-t border-[#e6eef2] px-4 py-4 sm:px-5">
                  {block.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-[#5a6a74]">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#1f4d52]" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function GuidePage() {
  const guide = useGuide()
  const [tabId, setTabId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!guide.data?.sections.length) return
    const hash = window.location.hash.replace('#', '')
    const match = guide.data.sections.find((s) => s.id === hash)
    setTabId(match?.id ?? guide.data.sections[0].id)
  }, [guide.data])

  function selectTab(id: string) {
    setTabId(id)
    setQuery('')
    window.history.replaceState(null, '', `#${id}`)
  }

  if (guide.isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center pt-24">
        <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-[#1f4d52]/25 border-r-[#1f4d52]" />
      </div>
    )
  }

  if (guide.isError || !guide.data) {
    return (
      <div className="mx-auto max-w-lg px-5 pt-28 text-center">
        <p className="font-display text-2xl text-[#0c1419]">Guide unavailable</p>
        <p className="mt-2 text-sm text-[#5a6a74]">Please try again in a moment.</p>
      </div>
    )
  }

  const data = guide.data
  const active = data.sections.find((s) => s.id === tabId) ?? data.sections[0]
  const hostPhones: GuideContact[] = data.footer.phones.filter((p) => digitsOnly(p.phone).length >= 10)

  return (
    <div className="relative min-h-dvh pb-16">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 50% at 0% 0%, rgb(31 77 82 / 0.12), transparent 55%), radial-gradient(ellipse 55% 40% at 100% 10%, rgb(148 190 205 / 0.35), transparent 50%), linear-gradient(180deg, #e7eef2 0%, #d9e4ea 45%, #e4ece8 100%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 pt-20 md:px-8 md:pt-24">
        {/* Brand masthead — light coastal, not dark hero */}
        <header className="animate-fade-up grid items-center gap-4 border-b border-[#0c1419]/10 pb-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-8">
          <div>
            <p className="font-display text-[1.75rem] leading-none tracking-tight text-[#0c1419] sm:text-3xl">
              Pondy Tripora
            </p>
            <p className="mt-2 text-[10px] font-semibold tracking-[0.2em] text-[#1f4d52] uppercase">
              Guest guide
            </p>
            <h1 className="mt-1 max-w-md font-sans text-xl font-bold tracking-tight text-[#0c1419] sm:text-2xl">
              Your stay, sorted.
            </h1>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-[#5a6a74] lg:justify-self-end lg:text-right">
            {data.subtitle ||
              'Copy service numbers, open places on the map, and read stay notes — all in one guide.'}
          </p>
        </header>

        {/* Primary tabs — switch panels, no long-page scroll between sections */}
        <div
          role="tablist"
          aria-label="Guide sections"
          className="animate-fade-up-delay mt-6 flex flex-wrap gap-2"
        >
          {data.sections.map((section) => {
            const selected = section.id === active.id
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => selectTab(section.id)}
                className={`inline-flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  selected
                    ? 'bg-[#0c1419] text-white shadow-[0_16px_36px_-22px_rgba(12,20,25,0.7)]'
                    : 'bg-white/65 text-[#5a6a74] ring-1 ring-[#c5d3db] hover:text-[#0c1419]'
                }`}
              >
                <span className={selected ? 'text-[#c8f14a]' : 'text-[#1f4d52]'}>
                  {tabIcon(section.type, 'h-4 w-4')}
                </span>
                {tabShortLabel(section)}
              </button>
            )
          })}
        </div>

        <div
          role="tabpanel"
          className="animate-fade-up-delay-2 mt-8 min-h-[28rem] rounded-[28px] border border-white/70 bg-white/45 p-5 shadow-[0_30px_80px_-48px_rgba(12,20,25,0.45)] backdrop-blur-md sm:p-7 md:p-8"
        >
          {active.type === 'contacts' && (
            <ServicesPanel section={active} query={query} onQueryChange={setQuery} />
          )}
          {active.type === 'places' && <PlacesPanel section={active} />}
          {active.type === 'policy' && <PolicyPanel section={active} />}
        </div>

        {/* Quiet footer strip */}
        <footer className="mt-10 flex flex-col gap-6 border-t border-[#0c1419]/08 pt-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-xl text-[#0c1419]">{data.footer.thanks}</p>
            {data.footer.address && (
              <p className="mt-1 text-sm text-[#5a6a74]">{data.footer.address}</p>
            )}
          </div>
          {hostPhones.length > 0 && (
            <div className="w-full max-w-sm rounded-[20px] bg-white/70 px-4 py-2 ring-1 ring-[#d5e0e6]">
              <p className="pt-3 text-[10px] font-semibold tracking-[0.16em] text-[#1f4d52] uppercase">
                Host desk
              </p>
              {hostPhones.map((p, i) => (
                <CopyNumberRow key={`${p.phone}-${i}`} phone={p.phone} label={p.label} />
              ))}
            </div>
          )}
        </footer>
      </div>
    </div>
  )
}
