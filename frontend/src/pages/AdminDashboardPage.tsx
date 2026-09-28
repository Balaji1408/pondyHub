import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import {
  useAdminBookings,
  useAdminStats,
  useUpdateBookingStatus,
} from '../api/hooks'
import {
  clearAdminSession,
  getAdminUser,
  isAdminLoggedIn,
} from '../auth/session'
import type { AdminBooking, BookingType, PriceKind } from '../types'
import { ElegantPieChart } from '../components/ElegantPieChart'
import { AdminPricingPanel } from '../components/AdminPricingPanel'
import { AdminBookingModal, BookingStatusActions } from '../components/AdminBookingModal'
import { formatDate, formatMoney, statusTone, typeLabel } from '../lib/adminBookings'

type Filter = 'all' | BookingType
type Theme = 'dark' | 'light'
type Tab = 'bookings' | PriceKind

const TABS: { id: Tab; label: string }[] = [
  { id: 'bookings', label: 'Bookings' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'boats', label: 'Boating' },
]

const PAGE_SIZE = 8
const THEME_KEY = 'pondy_admin_theme_v2'

const DARK = {
  lime: '#c8f14a',
  blue: '#4da3ff',
  violet: '#8b7cff',
  coral: '#ff6b6b',
} as const

const LIGHT = {
  lime: '#5a8f2f',
  blue: '#2b6cb0',
  violet: '#6b5ce7',
  coral: '#c45c4a',
} as const

function MetricCard({
  label,
  value,
  hint,
  accent,
  light,
}: {
  label: string
  value: string | number
  hint?: string
  accent: string
  light: boolean
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[24px] p-5 md:p-6 ${
        light
          ? 'border border-[#e8e4dc] bg-white shadow-[0_12px_32px_-20px_rgba(20,20,20,0.12)]'
          : 'bg-[#22222a] shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'
      }`}
    >
      <div
        className={`pointer-events-none absolute -top-10 -right-8 h-28 w-28 rounded-full blur-2xl ${
          light ? 'opacity-20' : 'opacity-30'
        }`}
        style={{ background: accent }}
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[12px] font-medium ${light ? 'text-[#8a847a]' : 'text-[#7a7a7a]'}`}>
            {label}
          </p>
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: accent,
              boxShadow: light ? 'none' : `0 0 12px ${accent}`,
            }}
          />
        </div>
        <p
          className={`mt-3 text-[1.75rem] font-bold tracking-tight tabular-nums md:text-[2rem] ${
            light ? 'text-[#0a0a0a]' : 'text-white'
          }`}
        >
          {value}
        </p>
        {hint && (
          <span
            className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
              light ? 'bg-[#f0ebe3] text-[#6b6560]' : 'bg-white/[0.06] text-[#a3a3a3]'
            }`}
          >
            {hint}
          </span>
        )}
      </div>
    </div>
  )
}

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme
  onToggle: () => void
}) {
  const light = theme === 'light'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'}
      title={light ? 'Dark mode' : 'Light mode'}
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase transition ${
        light
          ? 'border border-[#e0d9ce] bg-white text-[#0a0a0a] hover:bg-[#f6f3ed]'
          : 'border border-white/10 bg-white/[0.06] text-[#d4d4d4] hover:bg-white/[0.1]'
      }`}
    >
      {light ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
          Dark
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          Light
        </>
      )}
    </button>
  )
}

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('bookings')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const closeDetails = useCallback(() => setSelectedId(null), [])
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY)
      return saved === 'light' || saved === 'dark' ? saved : 'light'
    } catch {
      return 'dark'
    }
  })
  const loggedIn = isAdminLoggedIn()
  const bookings = useAdminBookings()
  const stats = useAdminStats()
  const updateStatus = useUpdateBookingStatus()
  const light = theme === 'light'
  const accents = light ? LIGHT : DARK

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  useEffect(() => {
    const msg = (location.state as { loginToast?: string } | null)?.loginToast
    if (!msg) return
    setToast(msg)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])

  const filtered = useMemo(() => {
    const list = bookings.data ?? []
    return list.filter((b) => {
      if (filter !== 'all' && b.type !== filter) return false
      if (!query.trim()) return true
      const q = query.trim().toLowerCase()
      return (
        b.confirmationId.toLowerCase().includes(q) ||
        (b.guestName ?? '').toLowerCase().includes(q) ||
        (b.guestPhone ?? '').toLowerCase().includes(q)
      )
    })
  }, [bookings.data, filter, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  useEffect(() => {
    setPage(1)
  }, [filter, query])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const typeColors = {
    room: accents.lime,
    vehicle: accents.blue,
    boat: accents.violet,
  } as const

  const selected = useMemo(
    () => bookings.data?.find((b) => b.confirmationId === selectedId) ?? null,
    [bookings.data, selectedId]
  )

  const statusSlices = useMemo(() => {
    const list = bookings.data ?? []
    const counts = { confirmed: 0, completed: 0, cancelled: 0, other: 0 }
    for (const b of list) {
      if (b.status === 'confirmed') counts.confirmed++
      else if (b.status === 'completed') counts.completed++
      else if (b.status === 'cancelled') counts.cancelled++
      else counts.other++
    }
    return [
      { label: 'Confirmed', value: counts.confirmed, color: accents.lime },
      { label: 'Completed', value: counts.completed, color: accents.blue },
      { label: 'Cancelled', value: counts.cancelled, color: accents.coral },
      ...(counts.other > 0
        ? [{ label: 'Other', value: counts.other, color: light ? '#9a9288' : '#6b6b6b' }]
        : []),
    ]
  }, [bookings.data, accents.lime, accents.blue, accents.coral, light])

  if (!loggedIn) {
    return <Navigate to="/admin/login" replace />
  }

  const username = getAdminUser() ?? 'admin'
  const s = stats.data

  function logout() {
    clearAdminSession()
    navigate('/admin/login', { replace: true })
  }

  async function setStatus(b: AdminBooking, status: string) {
    try {
      await updateStatus.mutateAsync({ confirmationId: b.confirmationId, status })
    } catch {
      // handled by mutation state
    }
  }

  const typeSlices = [
    { label: 'Rooms', value: s?.rooms ?? 0, color: typeColors.room },
    { label: 'Vehicles', value: s?.vehicles ?? 0, color: typeColors.vehicle },
    { label: 'Boats', value: s?.boats ?? 0, color: typeColors.boat },
  ]

  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length)

  return (
    <div
      className={`min-h-dvh transition-colors duration-300 ${
        light ? 'bg-[#f6f3ed] text-[#0a0a0a]' : 'bg-[#16161c] text-[#f5f5f5]'
      }`}
    >
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${
          light
            ? 'border-[#e8e4dc] bg-[#faf8f4]/90'
            : 'border-white/[0.08] bg-[#16161c]/92'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 md:h-[4.5rem] md:px-8">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className={`text-sm font-bold tracking-[0.16em] uppercase ${
                light ? 'text-[#0a0a0a]' : 'text-white'
              }`}
            >
              Pondy Hub
            </Link>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase ${
                light
                  ? 'bg-[#0a0a0a] text-white'
                  : 'bg-[#c8f14a]/15 text-[#c8f14a]'
              }`}
            >
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle
              theme={theme}
              onToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            />
            <span
              className={`hidden text-sm sm:inline ${light ? 'text-[#6b6560]' : 'text-[#7a7a7a]'}`}
            >
              {username}
            </span>
            <button
              type="button"
              onClick={logout}
              className={`rounded-full px-4 py-2.5 text-[11px] font-bold tracking-[0.1em] uppercase transition sm:px-5 ${
                light
                  ? 'bg-[#0a0a0a] text-white hover:bg-black/85'
                  : 'bg-[#c8f14a] text-black hover:brightness-110'
              }`}
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
        <div className="animate-fade-up mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={`text-sm ${light ? 'text-[#8a847a]' : 'text-[#7a7a7a]'}`}>Overview</p>
            <h1
              className={`mt-1 text-3xl font-bold tracking-tight md:text-4xl ${
                light ? 'text-[#0a0a0a]' : 'text-white'
              }`}
            >
              {tab === 'bookings' ? 'Bookings dashboard' : 'Pricing'}
            </h1>
          </div>
          <p className={`text-sm ${light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'}`}>
            Rooms · rides · boats — one place
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Admin sections"
          className={`mb-6 inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1 ${
            light ? 'border border-[#e8e4dc] bg-white' : 'bg-[#22222a]'
          }`}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase transition sm:px-5 ${
                tab === t.id
                  ? light
                    ? 'bg-[#0a0a0a] text-white'
                    : 'bg-[#c8f14a] text-black'
                  : light
                    ? 'text-[#8a847a] hover:text-[#0a0a0a]'
                    : 'text-[#7a7a7a] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab !== 'bookings' ? (
          <AdminPricingPanel
            kind={tab}
            light={light}
            accent={
              tab === 'rooms' ? accents.lime : tab === 'vehicles' ? accents.blue : accents.violet
            }
            onSaved={setToast}
          />
        ) : (
        <>
        <div className="animate-fade-up-delay grid gap-4 lg:grid-cols-2">
          <ElegantPieChart
            theme={theme}
            title="Allocation"
            subtitle="By category"
            slices={typeSlices}
            centerLabel="Total"
            centerValue={s?.total ?? 0}
          />
          <ElegantPieChart
            theme={theme}
            title="Pipeline"
            subtitle="By status"
            slices={statusSlices}
            centerLabel="Live"
            centerValue={
              statusSlices.find((x) => x.label === 'Confirmed')?.value ?? 0
            }
          />
        </div>

        <div className="animate-fade-up-delay-2 mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            light={light}
            label="Total bookings"
            value={s?.total ?? '—'}
            hint="All time"
            accent={accents.lime}
          />
          <MetricCard
            light={light}
            label="Confirmed"
            value={s?.confirmed ?? '—'}
            hint="Active"
            accent={accents.blue}
          />
          <MetricCard
            light={light}
            label="Vehicles"
            value={s?.vehicles ?? '—'}
            hint="Category"
            accent={accents.violet}
          />
          <MetricCard
            light={light}
            label="Est. revenue"
            value={s ? formatMoney(s.revenue) : '—'}
            hint="Demo"
            accent={accents.coral}
          />
        </div>

        <section
          className={`mt-6 overflow-hidden rounded-[28px] transition-colors ${
            light
              ? 'border border-[#e8e4dc] bg-white shadow-[0_12px_40px_-24px_rgba(20,20,20,0.12)]'
              : 'bg-[#22222a] shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'
          }`}
        >
          <div
            className={`flex flex-col gap-4 border-b px-5 py-5 md:flex-row md:items-end md:justify-between md:px-7 md:py-6 ${
              light ? 'border-[#efeae2]' : 'border-white/[0.06]'
            }`}
          >
            <div>
              <p
                className={`text-[12px] font-medium ${light ? 'text-[#8a847a]' : 'text-[#7a7a7a]'}`}
              >
                Reservations
              </p>
              <h2
                className={`mt-1 text-xl font-semibold tracking-tight ${
                  light ? 'text-[#0a0a0a]' : 'text-white'
                }`}
              >
                All bookings
              </h2>
              <p className={`mt-1 text-sm ${light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'}`}>
                {filtered.length === 0
                  ? '0 bookings'
                  : `Showing ${rangeStart}–${rangeEnd} of ${filtered.length}`}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div
                className={`flex gap-1 rounded-full p-1 ${
                  light ? 'bg-[#f0ebe3]' : 'bg-[#1a1a22]'
                }`}
              >
                {(['all', 'room', 'vehicle', 'boat'] as Filter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-3.5 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase transition ${
                      filter === f
                        ? light
                          ? 'bg-[#0a0a0a] text-white'
                          : 'bg-[#c8f14a] text-black'
                        : light
                          ? 'text-[#8a847a] hover:text-[#0a0a0a]'
                          : 'text-[#7a7a7a] hover:text-white'
                    }`}
                  >
                    {f === 'all' ? 'All' : typeLabel(f)}
                  </button>
                ))}
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ID, name, phone"
                className={`rounded-full px-4 py-2.5 text-sm outline-none transition sm:w-56 ${
                  light
                    ? 'border border-[#e8e4dc] bg-[#faf8f4] text-[#0a0a0a] placeholder:text-[#9a9288] focus:border-[#0a0a0a]'
                    : 'border border-white/[0.1] bg-[#1a1a22] text-white placeholder:text-[#5a5a5a] focus:border-[#c8f14a]/40'
                }`}
              />
            </div>
          </div>

          <div className="px-5 md:px-7">
            {bookings.isLoading && (
              <p
                className={`py-14 text-center text-sm ${light ? 'text-[#9a9288]' : 'text-[#7a7a7a]'}`}
              >
                Loading…
              </p>
            )}

            {bookings.isError && (
              <div className="my-5 rounded-2xl bg-red-500/10 px-5 py-4 text-sm text-red-600">
                {(bookings.error as Error).message}
                {(bookings.error as Error).message.toLowerCase().includes('login') ||
                (bookings.error as Error).message.toLowerCase().includes('session') ? (
                  <button type="button" className="ml-3 underline" onClick={logout}>
                    Sign in again
                  </button>
                ) : null}
              </div>
            )}

            {!bookings.isLoading && !bookings.isError && filtered.length === 0 && (
              <div
                className={`my-8 rounded-2xl border border-dashed px-6 py-14 text-center ${
                  light ? 'border-[#e8e4dc]' : 'border-white/10'
                }`}
              >
                <p
                  className={`text-lg font-medium ${light ? 'text-[#6b6560]' : 'text-[#a3a3a3]'}`}
                >
                  No bookings yet
                </p>
                <p className={`mt-2 text-sm ${light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'}`}>
                  New reservations from the site will appear here.
                </p>
              </div>
            )}

            {pageItems.length > 0 && (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                    <thead>
                      <tr
                        className={`text-[11px] tracking-[0.08em] uppercase ${
                          light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'
                        }`}
                      >
                        <th className="py-4 pr-4 font-medium">Confirmation</th>
                        <th className="py-4 pr-4 font-medium">Type</th>
                        <th className="py-4 pr-4 font-medium">Guest</th>
                        <th className="py-4 pr-4 font-medium">Date</th>
                        <th className="py-4 pr-4 font-medium">Guests</th>
                        <th className="py-4 pr-4 font-medium">Amount</th>
                        <th className="py-4 pr-4 font-medium">Status</th>
                        <th className="py-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((b) => (
                        <tr
                          key={b.id}
                          tabIndex={0}
                          aria-label={`View booking ${b.confirmationId}`}
                          onClick={() => setSelectedId(b.confirmationId)}
                          onKeyDown={(e) => {
                            if (e.target !== e.currentTarget) return
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setSelectedId(b.confirmationId)
                            }
                          }}
                          className={`cursor-pointer border-t transition outline-none ${
                            light
                              ? 'border-[#f0ebe3] hover:bg-[#faf8f5] focus-visible:bg-[#faf8f5]'
                              : 'border-white/[0.05] hover:bg-white/[0.03] focus-visible:bg-white/[0.03]'
                          }`}
                        >
                          <td
                            className={`py-4 pr-4 font-mono text-xs font-semibold ${
                              light ? 'text-[#0a0a0a]' : 'text-white'
                            }`}
                          >
                            {b.confirmationId}
                          </td>
                          <td className="py-4 pr-4">
                            <span
                              className={`inline-flex items-center gap-2 ${
                                light ? 'text-[#3d3d3d]' : 'text-[#d4d4d4]'
                              }`}
                            >
                              <span
                                className={`h-2.5 w-2.5 ${light ? 'rounded-sm' : 'rounded-full'}`}
                                style={{
                                  backgroundColor:
                                    typeColors[b.type as keyof typeof typeColors] ?? '#999',
                                  boxShadow: light
                                    ? 'none'
                                    : `0 0 8px ${
                                        typeColors[b.type as keyof typeof typeColors] ?? '#999'
                                      }88`,
                                }}
                              />
                              {typeLabel(b.type)}
                            </span>
                          </td>
                          <td className="py-4 pr-4">
                            <div
                              className={`font-medium ${light ? 'text-[#0a0a0a]' : 'text-white'}`}
                            >
                              {b.guestName || '—'}
                            </div>
                            {b.guestPhone && (
                              <div
                                className={`text-xs ${light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'}`}
                              >
                                {b.guestPhone}
                              </div>
                            )}
                          </td>
                          <td
                            className={`py-4 pr-4 ${light ? 'text-[#3d3d3d]' : 'text-[#d4d4d4]'}`}
                          >
                            <div>{formatDate(String(b.date))}</div>
                            {b.slot && (
                              <div
                                className={`text-xs ${light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'}`}
                              >
                                {b.slot}
                              </div>
                            )}
                          </td>
                          <td
                            className={`py-4 pr-4 tabular-nums ${
                              light ? 'text-[#3d3d3d]' : 'text-[#d4d4d4]'
                            }`}
                          >
                            {b.guests}
                          </td>
                          <td
                            className={`py-4 pr-4 font-semibold tabular-nums ${
                              light ? 'text-[#0a0a0a]' : 'text-white'
                            }`}
                          >
                            {formatMoney(b.totalAmount)}
                          </td>
                          <td className="py-4 pr-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase ${statusTone(b.status, light)}`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-4" onClick={(e) => e.stopPropagation()}>
                            <BookingStatusActions
                              booking={b}
                              light={light}
                              disabled={updateStatus.isPending}
                              onChange={(status) => void setStatus(b, status)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="space-y-3 py-4 lg:hidden">
                  {pageItems.map((b) => (
                    <li
                      key={b.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`View booking ${b.confirmationId}`}
                      onClick={() => setSelectedId(b.confirmationId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedId(b.confirmationId)
                        }
                      }}
                      className={`cursor-pointer rounded-2xl px-4 py-4 transition active:scale-[0.99] ${
                        light
                          ? 'border border-[#efeae2] bg-[#faf8f4] hover:border-[#e0d9ce]'
                          : 'bg-[#1a1a22] shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:bg-[#1e1e26]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p
                            className={`font-mono text-xs font-semibold ${
                              light ? 'text-[#0a0a0a]' : 'text-white'
                            }`}
                          >
                            {b.confirmationId}
                          </p>
                          <p
                            className={`mt-1 text-sm font-medium ${
                              light ? 'text-[#3d3d3d]' : 'text-[#d4d4d4]'
                            }`}
                          >
                            {typeLabel(b.type)} · {formatDate(String(b.date))}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase ${statusTone(b.status, light)}`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt
                            className={`text-[10px] uppercase ${
                              light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'
                            }`}
                          >
                            Guest
                          </dt>
                          <dd className={`mt-0.5 ${light ? 'text-[#0a0a0a]' : 'text-white'}`}>
                            {b.guestName || '—'}
                          </dd>
                        </div>
                        <div>
                          <dt
                            className={`text-[10px] uppercase ${
                              light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'
                            }`}
                          >
                            Amount
                          </dt>
                          <dd className={`mt-0.5 ${light ? 'text-[#0a0a0a]' : 'text-white'}`}>
                            {formatMoney(b.totalAmount)}
                          </dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {filtered.length > 0 && (
            <div
              className={`flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-7 ${
                light ? 'border-[#efeae2]' : 'border-white/[0.06]'
              }`}
            >
              <p className={`text-sm ${light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'}`}>
                Page {page} of {totalPages}
                <span className={`mx-2 ${light ? 'text-[#e0d9ce]' : 'text-[#333]'}`}>·</span>
                {PAGE_SIZE} / page
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`rounded-full border px-4 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase transition disabled:cursor-not-allowed disabled:opacity-30 ${
                    light
                      ? 'border-[#e8e4dc] text-[#3d3d3d] hover:border-[#0a0a0a]'
                      : 'border-white/10 text-[#c5c5c5] hover:border-white/25 hover:text-white'
                  }`}
                >
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (totalPages <= 5) return true
                      return Math.abs(p - page) <= 1 || p === 1 || p === totalPages
                    })
                    .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, i) =>
                      p === '…' ? (
                        <span
                          key={`e-${i}`}
                          className={`px-1 ${light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'}`}
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          className={`min-w-9 rounded-full px-2.5 py-2 text-sm font-semibold tabular-nums transition ${
                            page === p
                              ? light
                                ? 'bg-[#0a0a0a] text-white'
                                : 'bg-[#c8f14a] text-black'
                              : light
                                ? 'text-[#6b6560] hover:bg-[#f0ebe3]'
                                : 'text-[#7a7a7a] hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                </div>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={`rounded-full border px-4 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase transition disabled:cursor-not-allowed disabled:opacity-30 ${
                    light
                      ? 'border-[#e8e4dc] text-[#3d3d3d] hover:border-[#0a0a0a]'
                      : 'border-white/10 text-[#c5c5c5] hover:border-white/25 hover:text-white'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
        </>
        )}
      </main>

      <AdminBookingModal
        booking={selected}
        light={light}
        accent={selected ? typeColors[selected.type] : accents.lime}
        pending={updateStatus.isPending}
        onStatusChange={(b, status) => void setStatus(b, status)}
        onClose={closeDetails}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast(null)}
          severity="success"
          variant="filled"
          sx={{
            width: '100%',
            borderRadius: 0,
            bgcolor: light ? '#0a0a0a' : '#c8f14a',
            color: light ? '#ffffff' : '#0a0a0a',
            fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif',
            fontWeight: 600,
            alignItems: 'center',
            '& .MuiAlert-icon': {
              color: light ? '#c8f14a' : '#0a0a0a',
            },
          }}
        >
          {toast}
        </Alert>
      </Snackbar>
    </div>
  )
}
