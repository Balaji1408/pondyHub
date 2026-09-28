import { useEffect, useId, useState, type ReactNode } from 'react'
import type { AdminBooking } from '../types'
import {
  formatDateTime,
  formatLongDate,
  formatMoney,
  statusTone,
  typeLabel,
} from '../lib/adminBookings'

const STATUS_ACTIONS = [
  {
    status: 'completed',
    label: 'Complete',
    light: 'hover:bg-[#e4eef8] hover:text-[#1e4f7a]',
    dark: 'hover:bg-[#4da3ff]/20 hover:text-[#7bb8ff]',
  },
  {
    status: 'cancelled',
    label: 'Cancel',
    light: 'hover:bg-[#f8e8e4] hover:text-[#9a3d32]',
    dark: 'hover:bg-[#ff6b6b]/15 hover:text-[#ff8a8a]',
  },
  {
    status: 'confirmed',
    label: 'Restore',
    light: 'hover:bg-[#e8f2dc] hover:text-[#3d6b1f]',
    dark: 'hover:bg-[#c8f14a]/15 hover:text-[#c8f14a]',
  },
] as const

export function BookingStatusActions({
  booking,
  light,
  disabled,
  onChange,
  size = 'sm',
}: {
  booking: AdminBooking
  light: boolean
  disabled: boolean
  onChange: (status: string) => void
  size?: 'sm' | 'md'
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_ACTIONS.filter((a) => a.status !== booking.status).map((a) => (
        <button
          key={a.status}
          type="button"
          disabled={disabled}
          onClick={() => onChange(a.status)}
          className={`rounded-full font-semibold tracking-[0.08em] uppercase transition disabled:opacity-50 ${
            size === 'md' ? 'px-4 py-2.5 text-[11px]' : 'px-3 py-1.5 text-[10px]'
          } ${
            light
              ? `bg-[#f0ebe3] text-[#3d3d3d] ${a.light}`
              : `bg-white/[0.06] text-[#c5c5c5] ${a.dark}`
          }`}
        >
          {a.label}
        </button>
      ))}
    </div>
  )
}

function humanizeKey(key: string) {
  const words = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase()
}

function formatExtra(value: unknown) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value == null || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function AdminBookingModal({
  booking,
  light,
  accent,
  pending,
  onStatusChange,
  onClose,
}: {
  booking: AdminBooking | null
  light: boolean
  accent: string
  pending: boolean
  onStatusChange: (booking: AdminBooking, status: string) => void
  onClose: () => void
}) {
  const titleId = useId()
  const [copied, setCopied] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const open = booking != null

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    setCopied(false)
    setImageFailed(false)
  }, [booking?.confirmationId])

  if (!booking) return null

  const muted = light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'
  const strong = light ? 'text-[#0a0a0a]' : 'text-white'
  const image = !imageFailed ? booking.item?.image : null
  const title = booking.item?.name ?? `${typeLabel(booking.type)} #${booking.itemId}`
  // The driver option is already part of the vehicle's detail line.
  const extras = Object.entries(booking.extras ?? {}).filter(([key]) => key !== 'withDriver')

  async function copyId() {
    try {
      await navigator.clipboard.writeText(booking!.confirmationId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard unavailable
    }
  }

  const details: { label: string; value: ReactNode }[] = [
    { label: 'Guest', value: booking.guestName || '—' },
    {
      label: 'Phone',
      value: booking.guestPhone ? (
        <a
          href={`tel:${booking.guestPhone}`}
          className="underline-offset-4 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {booking.guestPhone}
        </a>
      ) : (
        '—'
      ),
    },
    { label: 'Date', value: formatLongDate(String(booking.date)) },
    ...(booking.slot ? [{ label: 'Time slot', value: booking.slot }] : []),
    { label: 'Guests', value: booking.guests },
    { label: 'Booked on', value: formatDateTime(String(booking.createdAt)) },
    ...extras.map(([key, value]) => ({ label: humanizeKey(key), value: formatExtra(value) })),
  ]

  return (
    <div className="animate-fade-in fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className={`absolute inset-0 cursor-pointer backdrop-blur-[6px] ${
          light ? 'bg-[#0a0a0a]/45' : 'bg-black/65'
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`animate-listing-reveal relative z-10 flex max-h-full w-full max-w-[560px] flex-col overflow-hidden rounded-[28px] ${
          light
            ? 'bg-white shadow-[0_32px_80px_-28px_rgba(20,20,20,0.45)]'
            : 'bg-[#22222a] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_32px_80px_-28px_rgba(0,0,0,0.8)]'
        }`}
      >
        <div className="relative shrink-0">
          {image ? (
            <div className="relative h-40 overflow-hidden sm:h-44">
              <img
                src={image}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setImageFailed(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            </div>
          ) : (
            <div
              className="h-20"
              style={{
                background: `radial-gradient(120% 140% at 0% 0%, ${accent}40, transparent 60%)`,
              }}
            />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className={`absolute top-4 right-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full backdrop-blur-md transition ${
              image
                ? 'bg-black/35 text-white hover:bg-black/55'
                : light
                  ? 'bg-[#f0ebe3] text-[#3d3d3d] hover:bg-[#e8e4dc]'
                  : 'bg-white/[0.08] text-[#d4d4d4] hover:bg-white/[0.14]'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto">
          <div className={`px-6 sm:px-7 ${image ? 'pt-5' : 'pt-1'}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  light ? 'bg-[#f6f3ed] text-[#3d3d3d]' : 'bg-white/[0.06] text-[#d4d4d4]'
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
                {typeLabel(booking.type)} booking
              </span>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase ${statusTone(booking.status, light)}`}
              >
                {booking.status}
              </span>
            </div>
            <h3 id={titleId} className={`mt-3 text-2xl font-bold tracking-tight ${strong}`}>
              {title}
            </h3>
            {booking.item?.detail && <p className={`mt-1 text-sm ${muted}`}>{booking.item.detail}</p>}

            <div
              className={`mt-5 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${
                light ? 'bg-[#faf8f4] ring-1 ring-[#efeae2]' : 'bg-[#1a1a22] ring-1 ring-white/[0.06]'
              }`}
            >
              <div className="min-w-0">
                <p className={`text-[11px] font-medium tracking-[0.08em] uppercase ${muted}`}>
                  Confirmation
                </p>
                <p className={`mt-1 truncate font-mono text-sm font-semibold ${strong}`}>
                  {booking.confirmationId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void copyId()}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase transition ${
                  light
                    ? 'bg-white text-[#3d3d3d] ring-1 ring-[#e8e4dc] hover:ring-[#0a0a0a]'
                    : 'bg-white/[0.06] text-[#c5c5c5] hover:bg-white/[0.12]'
                }`}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
              {details.map((d) => (
                <div key={d.label} className="min-w-0">
                  <dt className={`text-[11px] font-medium tracking-[0.08em] uppercase ${muted}`}>
                    {d.label}
                  </dt>
                  <dd className={`mt-1 truncate text-sm font-medium ${strong}`}>{d.value}</dd>
                </div>
              ))}
            </dl>

            <div
              className={`mt-6 flex items-end justify-between gap-4 border-t pt-4 ${
                light ? 'border-[#efeae2]' : 'border-white/[0.06]'
              }`}
            >
              <p className={`text-[11px] font-medium tracking-[0.08em] uppercase ${muted}`}>
                Total amount
              </p>
              <p className={`text-2xl font-bold tracking-tight tabular-nums ${strong}`}>
                {formatMoney(booking.totalAmount)}
              </p>
            </div>
          </div>

          <div
            className={`mt-5 flex flex-col-reverse gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 ${
              light ? 'border-[#efeae2] bg-[#faf8f4]' : 'border-white/[0.06] bg-[#1e1e26]'
            }`}
          >
            <BookingStatusActions
              booking={booking}
              light={light}
              disabled={pending}
              onChange={(status) => onStatusChange(booking, status)}
              size="md"
            />
            <button
              type="button"
              onClick={onClose}
              className={`rounded-full px-5 py-2.5 text-[11px] font-bold tracking-[0.1em] uppercase transition ${
                light
                  ? 'bg-[#0a0a0a] text-white hover:bg-black/85'
                  : 'bg-[#c8f14a] text-black hover:brightness-110'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
