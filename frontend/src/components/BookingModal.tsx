import { useEffect, useId, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import { useCreateBooking } from '../api/hooks'
import { useLanguage } from '../i18n/LanguageContext'
import type { BookingType } from '../types'

type Props = {
  open: boolean
  onClose: () => void
  type: BookingType
  itemId: number
  title: string
  price: number
  priceLabel: string
  minGuests?: number
  maxGuests?: number
  initialGuests?: number
  /** When set, the shown price and booked total follow the guest count. */
  priceForGuests?: (guests: number) => number
  priceNote?: (guests: number) => string | null
  slots?: string[]
  routesSummary?: string
  extras?: Record<string, unknown>
}

const labelClass = (isLatin: boolean) =>
  `block text-[10px] font-semibold text-muted ${isLatin ? 'tracking-[0.18em] uppercase' : 'tracking-wide'}`

const fieldClass =
  'mt-2 block h-10 w-full border-0 border-b border-sand-deep/70 bg-transparent px-0 text-sm text-ink outline-none transition placeholder:text-muted/45 focus:border-ink'

export function BookingModal({
  open,
  onClose,
  type,
  itemId,
  title,
  price,
  priceLabel,
  minGuests = 1,
  maxGuests = 4,
  initialGuests,
  priceForGuests,
  priceNote,
  slots,
  routesSummary,
  extras,
}: Props) {
  const { t, locale } = useLanguage()
  const formId = useId()
  const clampGuests = (n: number) => Math.min(maxGuests, Math.max(minGuests, n))
  const [date, setDate] = useState('')
  const [guests, setGuests] = useState(() => clampGuests(initialGuests ?? minGuests))
  const [slot, setSlot] = useState(slots?.[0] ?? '')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const booking = useCreateBooking()
  const isLatin = locale === 'en'

  useEffect(() => {
    if (open) {
      const next = new Date()
      next.setDate(next.getDate() + 1)
      setDate(next.toISOString().slice(0, 10))
      setSlot(slots?.[0] ?? '')
      setGuests(clampGuests(initialGuests ?? minGuests))
      setName('')
      setPhone('')
      booking.reset()
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, itemId])

  if (!open) return null

  const confirmed = booking.data
  const bumpGuests = (delta: number) => {
    setGuests((g) => clampGuests(g + delta))
  }
  const total = priceForGuests ? priceForGuests(guests) : price
  const note = priceNote?.(guests) ?? null

  return (
    <div className="animate-fade-in fixed inset-0 z-[70] flex items-center justify-center overflow-hidden p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-ink/55 backdrop-blur-[6px]"
        aria-label={t('booking.close')}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-title`}
        className="animate-listing-reveal relative z-10 w-full max-w-[640px] overflow-hidden bg-[#f7fafb] shadow-[0_32px_80px_-28px_rgb(12_20_25_/_0.55)]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lagoon/40 to-transparent" />

        {confirmed ? (
          <div className="relative px-6 py-8 text-center sm:px-10 sm:py-10">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 flex h-9 w-9 cursor-pointer items-center justify-center text-muted transition hover:text-ink"
              aria-label={t('booking.close')}
            >
              <span className="relative block h-3.5 w-3.5">
                <span className="absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 rotate-45 bg-current" />
                <span className="absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 -rotate-45 bg-current" />
              </span>
            </button>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-lagoon/25 bg-mist">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  stroke="#1f4d52"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="mt-4 font-display text-2xl font-semibold text-ink">{t('booking.youreBooked')}</p>
            <p className="mt-2 text-sm text-muted">{confirmed.message}</p>
            <div className="mx-auto mt-5 max-w-sm border border-sand/80 bg-white/70 px-4 py-3">
              <p className={labelClass(isLatin)}>{t('booking.confirmation')}</p>
              <p className="mt-1.5 font-mono text-base font-semibold tracking-wide text-ink">
                {confirmed.confirmationId}
              </p>
            </div>
            <p className="mt-2 text-xs text-muted">{t('booking.saveId')}</p>
            <button
              type="button"
              onClick={onClose}
              className={`mt-6 w-full max-w-sm cursor-pointer bg-ink py-3 text-[11px] font-semibold text-white transition hover:bg-ink/90 ${
                isLatin ? 'tracking-[0.16em] uppercase' : 'tracking-wide'
              }`}
            >
              {t('booking.done')}
            </button>
          </div>
        ) : (
          <form
            className="relative"
            onSubmit={(e) => {
              e.preventDefault()
              booking.mutate({
                type,
                itemId,
                date,
                slot: slot || undefined,
                guests,
                guestName: name || undefined,
                guestPhone: phone || undefined,
                totalAmount: total,
                extras,
              })
            }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-sand/50 px-6 py-5 sm:px-8">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className={`text-[10px] font-semibold text-lagoon ${isLatin ? 'tracking-[0.22em] uppercase' : 'tracking-wide'}`}>
                    {t('booking.book')}
                  </p>
                  <span className="hidden h-3 w-px bg-sand-deep/60 sm:block" aria-hidden />
                  <p className="text-sm text-muted">
                    <span className="font-semibold text-ink">₹{total.toLocaleString('en-IN')}</span>
                    <span className="ml-1">{priceLabel}</span>
                  </p>
                </div>
                <h3
                  id={`${formId}-title`}
                  className="mt-1.5 font-display text-xl leading-tight font-semibold tracking-tight text-ink sm:text-2xl"
                >
                  {title}
                </h3>
                {routesSummary && (
                  <p className="mt-1.5 truncate text-xs text-muted">
                    <span className="font-medium text-ink/70">{t('booking.routeLabel')}:</span> {routesSummary}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="group flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center text-muted transition hover:text-ink"
                aria-label={t('booking.close')}
              >
                <span className="relative block h-3.5 w-3.5">
                  <span className="absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 rotate-45 bg-current transition group-hover:scale-110" />
                  <span className="absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 -rotate-45 bg-current transition group-hover:scale-110" />
                </span>
              </button>
            </div>

            <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-7">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-x-10">
                <div className="min-w-0">
                  <p className={labelClass(isLatin)}>{t('booking.date')}</p>
                  <DatePicker
                    value={date ? dayjs(date) : null}
                    onChange={(value: Dayjs | null) => {
                      setDate(value && value.isValid() ? value.format('YYYY-MM-DD') : '')
                    }}
                    minDate={dayjs().startOf('day')}
                    format="DD-MM-YYYY"
                    slots={{
                      openPickerIcon: CalendarMonthOutlinedIcon,
                    }}
                    slotProps={{
                      textField: {
                        required: true,
                        fullWidth: true,
                        variant: 'standard',
                        sx: {
                          mt: 1,
                          '& .MuiInputBase-root': {
                            height: 40,
                            fontSize: '0.875rem',
                            color: '#0c1419',
                            fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif',
                            '&:before': {
                              borderBottomColor: 'rgb(159 179 191 / 0.7)',
                            },
                            '&:hover:not(.Mui-disabled):before': {
                              borderBottomColor: '#0c1419',
                            },
                            '&:after': {
                              borderBottomColor: '#0c1419',
                              borderBottomWidth: 1,
                            },
                          },
                          '& .MuiInputBase-input': {
                            padding: '8px 0',
                            cursor: 'pointer',
                          },
                          '& .MuiInputAdornment-root': {
                            marginLeft: 0,
                          },
                          '& .MuiIconButton-root': {
                            color: '#4f616c',
                            padding: '4px',
                            '&:hover': {
                              color: '#0c1419',
                              backgroundColor: 'transparent',
                            },
                          },
                        },
                      },
                      openPickerButton: {
                        disableRipple: true,
                      },
                      desktopPaper: {
                        sx: {
                          borderRadius: 0,
                          border: '1px solid #d2dde4',
                          boxShadow: '0 20px 48px -20px rgb(12 20 25 / 0.35)',
                          mt: 1,
                        },
                      },
                      day: {
                        sx: {
                          borderRadius: 0,
                          fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif',
                          '&.Mui-selected': {
                            backgroundColor: '#0c1419',
                            '&:hover': {
                              backgroundColor: '#0c1419',
                            },
                            '&:focus': {
                              backgroundColor: '#0c1419',
                            },
                          },
                          '&.MuiPickersDay-today': {
                            borderColor: '#1f4d52',
                          },
                        },
                      },
                      calendarHeader: {
                        sx: {
                          fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif',
                          '& .MuiPickersCalendarHeader-label': {
                            fontWeight: 600,
                          },
                        },
                      },
                    }}
                  />
                </div>

                <div className="min-w-0">
                  <p className={labelClass(isLatin)}>{t('booking.guestsSeats')}</p>
                  <div className="mt-2 flex h-10 items-center justify-between gap-3 border-b border-sand-deep/70">
                    <div className="inline-flex items-center">
                      <button
                        type="button"
                        onClick={() => bumpGuests(-1)}
                        disabled={guests <= minGuests}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center text-muted transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label={t('common.decrease')}
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-ink">
                        {guests}
                      </span>
                      <button
                        type="button"
                        onClick={() => bumpGuests(1)}
                        disabled={guests >= maxGuests}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center text-muted transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label={t('common.increase')}
                      >
                        +
                      </button>
                    </div>
                    <span className="shrink-0 text-xs text-muted">
                      {t('booking.maxGuests', { n: maxGuests })}
                    </span>
                  </div>
                </div>
              </div>

              {priceForGuests && (
                <div className="flex items-center justify-between gap-4 bg-mist/80 px-4 py-3 ring-1 ring-sand/60">
                  <div className="min-w-0">
                    <p className={labelClass(isLatin)}>{t('booking.total')}</p>
                    {note && <p className="mt-1 text-xs text-muted">{note}</p>}
                  </div>
                  <p
                    key={total}
                    className="animate-fade-in shrink-0 font-display text-2xl font-semibold tabular-nums text-ink"
                  >
                    ₹{total.toLocaleString('en-IN')}
                  </p>
                </div>
              )}

              {slots && slots.length > 0 && (
                <div>
                  <p className={labelClass(isLatin)}>{t('booking.slot')}</p>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {slots.map((s) => {
                      const active = slot === s
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSlot(s)}
                          aria-pressed={active}
                          className={`min-w-[4.5rem] cursor-pointer px-4 py-2 text-sm font-medium tabular-nums transition duration-300 ${
                            active
                              ? 'bg-ink text-white shadow-[0_8px_20px_-12px_rgb(12_20_25_/_0.5)]'
                              : 'bg-white text-muted ring-1 ring-sand/80 hover:bg-mist hover:text-ink'
                          }`}
                        >
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-x-10">
                <label className="block min-w-0">
                  <span className={labelClass(isLatin)}>{t('booking.name')}</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="—"
                    className={fieldClass}
                  />
                </label>

                <label className="block min-w-0">
                  <span className={labelClass(isLatin)}>{t('booking.phone')}</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="—"
                    inputMode="tel"
                    className={fieldClass}
                  />
                </label>
              </div>

              {booking.isError && (
                <p className="text-sm text-red-600">{(booking.error as Error).message}</p>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-sand/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8">
              <p className="text-[11px] leading-relaxed text-muted sm:max-w-[260px]">
                {t('booking.noPayment')}
              </p>
              <button
                type="submit"
                disabled={booking.isPending}
                className={`shrink-0 cursor-pointer bg-ink px-8 py-3 text-[11px] font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-ink/90 hover:shadow-[0_14px_28px_-14px_rgb(12_20_25_/_0.5)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:shadow-none ${
                  isLatin ? 'tracking-[0.16em] uppercase' : 'tracking-wide'
                }`}
              >
                {booking.isPending ? t('booking.submitting') : t('booking.submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
