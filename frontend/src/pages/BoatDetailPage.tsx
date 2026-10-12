import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import dayjs, { type Dayjs } from 'dayjs'
import { AnimatePresence, motion } from 'motion/react'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import AnchorIcon from '@mui/icons-material/Anchor'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import StarOutlineIcon from '@mui/icons-material/StarBorder'
import CheckIcon from '@mui/icons-material/Check'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import MailOutlineIcon from '@mui/icons-material/MailOutlineOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined'
import { useBoat, useBoatSeats, useCreateBoatBooking } from '../api/hooks'
import { BoatTicketModal } from '../components/boating/BoatTicketModal'
import { SeatPicker } from '../components/boating/SeatPicker'
import { useLanguage } from '../i18n/LanguageContext'
import {
  fareGradient,
  formatJourneyDate,
  formatPhoneInput,
  formatTime,
  manifestGradient,
} from '../lib/boating'
import type { BoatBookingResult, BoatTimeSlot } from '../types'

const pickerTheme = createTheme({
  palette: { primary: { main: '#f97316' } },
  typography: { fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif' },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#fff',
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#f97316' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f97316', borderWidth: 2 },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: '0.85rem', fontWeight: 600, '&.Mui-focused': { color: '#f97316' } },
      },
    },
  },
})

const stepLabel = 'pl-1 text-[10px] font-black tracking-widest text-slate-400 uppercase'
const inputClass =
  'w-full rounded-xl border border-transparent bg-slate-50 py-2.5 pr-4 pl-10 text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white'

function Counter({
  label,
  hint,
  price,
  value,
  onDec,
  onInc,
  decDisabled,
  incDisabled,
}: {
  label: string
  hint?: string
  price: number
  value: number
  onDec: () => void
  onInc: () => void
  decDisabled: boolean
  incDisabled: boolean
}) {
  const { t } = useLanguage()
  const btn =
    'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-cyan-500 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-slate-200 disabled:hover:text-slate-600'
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 transition-colors hover:bg-white">
      <div>
        <div className="text-[11px] font-black tracking-tight text-slate-800 uppercase">
          {label}{' '}
          {hint && <span className="text-[9px] font-bold text-slate-400 lowercase italic">({hint})</span>}
        </div>
        <div className="text-[9px] font-bold text-slate-400">
          ₹{price.toLocaleString('en-IN')} / {t('boating.seat')}
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={onDec} disabled={decDisabled} className={btn} aria-label={t('common.decrease')}>
          <RemoveIcon sx={{ fontSize: 14 }} />
        </button>
        <span className="min-w-[18px] text-center text-base font-black text-slate-800 italic tabular-nums">
          {value}
        </span>
        <button type="button" onClick={onInc} disabled={incDisabled} className={btn} aria-label={t('common.increase')}>
          <AddIcon sx={{ fontSize: 14 }} />
        </button>
      </div>
    </div>
  )
}

function SlotTile({
  slot,
  selected,
  onSelect,
}: {
  slot: BoatTimeSlot
  selected: boolean
  onSelect: () => void
}) {
  const { t } = useLanguage()
  const unavailable = slot.availableSeats <= 0
  const status = slot.isDisabled
    ? t('boating.slot.closed')
    : slot.isDeparted
      ? t('boating.slot.departed')
      : unavailable
        ? t('boating.slot.soldOut')
        : t('boating.seatsShort')
  return (
    <button
      type="button"
      disabled={unavailable}
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative w-full cursor-pointer rounded-xl border-2 p-2.5 text-left transition-all duration-300 ${
        selected
          ? 'border-orange-500 bg-orange-50 shadow-md ring-4 ring-orange-100'
          : unavailable
            ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60'
            : 'border-slate-100 bg-white hover:border-orange-200 hover:shadow-sm'
      }`}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`truncate text-[8px] font-black tracking-tighter uppercase ${
              selected ? 'text-orange-600' : 'text-slate-400'
            }`}
          >
            {slot.name || t('boating.standard')}
            {slot.isSeasonal && <span className="ml-1 text-cyan-600">· {t('boating.seasonal')}</span>}
          </span>
          <div className="flex flex-col items-end leading-none">
            <span
              className={`text-base font-black ${
                selected ? 'text-orange-600' : unavailable ? 'text-slate-400' : 'text-slate-700'
              }`}
            >
              {slot.availableSeats}
            </span>
            <span className="text-[7px] font-bold tracking-tighter text-slate-400 uppercase">{status}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-extrabold ${selected ? 'text-orange-700' : 'text-slate-800'}`}>
            {formatTime(slot.startTime)}
          </span>
          <ArrowForwardIcon sx={{ fontSize: 11 }} className={selected ? 'text-orange-400' : 'text-slate-300'} />
          <span className={`text-[11px] font-bold ${selected ? 'text-orange-600' : 'text-slate-500'}`}>
            {formatTime(slot.endTime)}
          </span>
        </div>
      </div>
      {selected && (
        <div className="absolute -top-1.5 -right-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white bg-orange-500 text-white shadow-lg">
          <CheckIcon sx={{ fontSize: 10 }} />
        </div>
      )}
    </button>
  )
}

export function BoatDetailPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { id: idParam } = useParams()
  const boatId = Number(idParam)
  const [params, setParams] = useSearchParams()
  const today = dayjs().format('YYYY-MM-DD')
  const dateParam = params.get('date')
  const journeyDate = dateParam && dayjs(dateParam).isValid() && dateParam >= today ? dateParam : null
  const slotParam = Number(params.get('slot')) || null

  const { data: boat, isLoading, isError, error, isFetching } = useBoat(boatId, journeyDate ?? undefined)
  const boatForDate = boat && journeyDate && boat.date === journeyDate ? boat : null
  const slots = boatForDate?.timeSlots ?? []
  const selectedSlot = slots.find((s) => s.id === slotParam) ?? null

  const [adultSeats, setAdultSeats] = useState(1)
  const [childSeats, setChildSeats] = useState(0)
  const [seatSelection, setSeatSelection] = useState<{ key: string; seats: string[] }>({ key: '', seats: [] })
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [forceExpand, setForceExpand] = useState(false)
  const [ticket, setTicket] = useState<BoatBookingResult | null>(null)
  const [heroIndex, setHeroIndex] = useState(0)
  const contactRef = useRef<HTMLDivElement>(null)
  const booking = useCreateBoatBooking()

  const seatsQuery = useBoatSeats(boatId, journeyDate, selectedSlot?.id ?? null)
  const takenSeats = useMemo(() => seatsQuery.data?.takenSeats ?? [], [seatsQuery.data])
  const selectionKey = `${journeyDate}:${selectedSlot?.id}`
  const selectedSeats = (seatSelection.key === selectionKey ? seatSelection.seats : []).filter(
    (s) => !takenSeats.includes(s),
  )
  const requested = adultSeats + childSeats
  const maxSeats = selectedSlot?.availableSeats || boat?.seats || 1

  const updateParams = (next: { date?: string | null; slot?: number | null }) => {
    const p = new URLSearchParams(params)
    if (next.date !== undefined) {
      if (next.date) p.set('date', next.date)
      else p.delete('date')
    }
    if (next.slot !== undefined) {
      if (next.slot) p.set('slot', String(next.slot))
      else p.delete('slot')
    }
    setParams(p, { replace: true })
  }

  // Keep a bookable slot selected whenever the date's slots change.
  useEffect(() => {
    if (!boatForDate) return
    const current = boatForDate.timeSlots.find((s) => s.id === slotParam)
    if (current && current.availableSeats > 0) return
    const firstOpen = boatForDate.timeSlots.find((s) => s.availableSeats > 0)
    if ((firstOpen?.id ?? null) !== slotParam) updateParams({ slot: firstOpen?.id ?? null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boatForDate])

  useEffect(() => {
    if (requested > 0 && selectedSeats.length === requested) {
      const timer = window.setTimeout(
        () => contactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        600,
      )
      return () => window.clearTimeout(timer)
    }
  }, [selectedSeats.length, requested])

  const setSeats = (seats: string[]) => setSeatSelection({ key: selectionKey, seats })

  const changeCount = (kind: 'adult' | 'child', delta: number) => {
    const nextAdults = kind === 'adult' ? Math.max(1, adultSeats + delta) : adultSeats
    const nextChildren = kind === 'child' ? Math.max(0, childSeats + delta) : childSeats
    if (nextAdults + nextChildren > maxSeats) return
    setAdultSeats(nextAdults)
    setChildSeats(nextChildren)
    if (selectedSeats.length > nextAdults + nextChildren) {
      setSeats(selectedSeats.slice(0, nextAdults + nextChildren))
    }
  }

  const toggleSeat = (seatId: string) => {
    setFormError(null)
    if (selectedSeats.includes(seatId)) setSeats(selectedSeats.filter((s) => s !== seatId))
    else if (selectedSeats.length < requested) setSeats([...selectedSeats, seatId])
    else setFormError(t('boating.seatLimit', { n: requested }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!boat) return
    if (!journeyDate) return setFormError(t('boating.errDate'))
    if (!selectedSlot) return setFormError(t('boating.errSlot'))
    if (!guestName.trim()) return setFormError(t('boating.errName'))
    if (guestPhone.replace(/\D/g, '').length !== 10) return setFormError(t('boating.errPhone'))
    booking.mutate(
      {
        type: 'boat',
        itemId: boat.id,
        slotId: selectedSlot.id,
        date: journeyDate,
        adultSeats,
        childSeats,
        selectedSeats,
        guestName: guestName.trim(),
        guestPhone: guestPhone.replace(/\D/g, ''),
        guestEmail: guestEmail.trim() || undefined,
      },
      {
        onSuccess: (result) => {
          setTicket(result)
          setSeats([])
        },
        onError: (err) => setFormError((err as Error).message),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 pt-16">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
      </div>
    )
  }

  if (isError || !boat) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 pt-16">
        <p className="text-lg font-bold text-red-600">{(error as Error | null)?.message ?? t('boating.notFound')}</p>
        <Link to="/boating" className="text-xs font-black tracking-widest text-cyan-700 uppercase">
          {t('boating.backToFleet')}
        </Link>
      </div>
    )
  }

  const priceAdult = selectedSlot?.priceAdult ?? boat.price
  const priceChild = selectedSlot?.priceChild ?? boat.priceChild
  const total = priceAdult * adultSeats + priceChild * childSeats
  const heroImage = boat.images[heroIndex] ?? boat.images[0]
  const collapsed = Boolean(journeyDate && selectedSlot && !forceExpand)
  const route = boat.routes[0]

  return (
    <ThemeProvider theme={pickerTheme}>
      <div
        className="min-h-screen pt-16 font-sans md:pt-[4.25rem]"
        style={{
          background: 'linear-gradient(180deg, #fffbeb 0%, #fef3c7 20%, #fff7ed 40%, #f0fdf4 70%, #ecfeff 100%)',
        }}
      >
        <div className="mx-auto max-w-6xl px-6 pt-6 pb-2 md:hidden">
          <Link
            to="/boating"
            className="mb-3 inline-flex items-center gap-1 text-[10px] font-black tracking-widest text-slate-500 uppercase"
          >
            <ArrowBackIcon sx={{ fontSize: 13 }} /> {t('boating.backToFleet')}
          </Link>
          <div className="mb-2 flex">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-3 py-1 text-[9px] font-black tracking-[0.2em] text-white uppercase shadow-sm">
              <AnchorIcon sx={{ fontSize: 12 }} /> {boat.coachType ?? boat.type}
            </span>
          </div>
          <h1 className="text-2xl leading-none font-black tracking-tighter text-slate-900 uppercase italic">
            {boat.name}
          </h1>
        </div>

        <div className="relative hidden h-[40vh] overflow-hidden md:block md:h-[45vh]">
          {heroImage ? (
            <img src={heroImage} alt={boat.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-cyan-600 to-sky-800" />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 100%)',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl p-6 md:p-10">
            <Link
              to="/boating"
              className="mb-4 inline-flex items-center gap-1 text-[10px] font-black tracking-widest text-white/80 uppercase transition hover:text-white"
            >
              <ArrowBackIcon sx={{ fontSize: 13 }} /> {t('boating.backToFleet')}
            </Link>
            <div className="mb-3 flex">
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-bold tracking-widest text-white uppercase shadow-lg">
                <AnchorIcon sx={{ fontSize: 14 }} /> {boat.coachType ?? boat.type}
              </span>
            </div>
            <h1 className="mb-2 font-['Georgia',serif] text-3xl font-bold text-white drop-shadow-xl md:text-5xl">
              {boat.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/90">
              <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
                <GroupsOutlinedIcon sx={{ fontSize: 15 }} />
                <span className="font-semibold">{t('boating.passengers', { n: boat.seats })}</span>
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
                <PlaceOutlinedIcon sx={{ fontSize: 15 }} />
                <span className="font-semibold">{boat.departurePoint ?? t('boating.puducherry')}</span>
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
                <StarOutlineIcon sx={{ fontSize: 15 }} />
                <span className="font-semibold">{boat.rating.toFixed(1)}</span>
              </span>
            </div>
          </div>
        </div>
        {boat.images.length > 1 && (
          <div className="relative z-10 mx-auto -mt-8 hidden max-w-6xl px-4 md:block md:px-6">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {boat.images.slice(0, 5).map((img, i) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setHeroIndex(i)}
                  className={`h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl border-[3px] shadow-md transition-all md:h-24 md:w-24 ${
                    heroIndex === i
                      ? 'scale-105 border-orange-500 ring-2 ring-orange-300'
                      : 'border-white/80 opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
          <div className="mb-6 max-w-4xl">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <span className="text-[9px] font-black tracking-[0.3em] text-orange-600 uppercase">
                {t('boating.theExperience')}
              </span>
            </div>
            <p className="text-[13px] leading-relaxed font-medium text-slate-600 italic">{boat.description}</p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="space-y-8 lg:col-span-3">
              <section className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="pointer-events-none absolute top-0 right-0 p-6 opacity-[0.03]">
                  <CalendarMonthOutlinedIcon sx={{ fontSize: 100 }} />
                </div>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="flex items-center gap-2.5 text-lg font-black text-slate-800">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10">
                      <CalendarMonthOutlinedIcon sx={{ fontSize: 17 }} className="text-orange-600" />
                    </span>
                    {t('boating.planVoyage')}
                  </h2>
                  {journeyDate && selectedSlot && (
                    <button
                      type="button"
                      onClick={() => setForceExpand((v) => !v)}
                      className="cursor-pointer rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-[10px] font-black tracking-widest text-orange-600 uppercase md:hidden"
                    >
                      {forceExpand ? t('boating.collapse') : t('boating.editSelection')}
                    </button>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {collapsed && selectedSlot && journeyDate && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 md:hidden"
                    >
                      <div className="flex gap-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">
                            {t('booking.date')}
                          </span>
                          <span className="text-xs font-black text-slate-700">{formatJourneyDate(journeyDate)}</span>
                        </div>
                        <div className="h-8 w-px bg-slate-200" />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">
                            {t('booking.slot')}
                          </span>
                          <span className="text-xs font-black text-slate-700">{formatTime(selectedSlot.startTime)}</span>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-emerald-600">
                        <CheckIcon sx={{ fontSize: 12 }} />
                        <span className="text-[9px] font-black uppercase">{t('boating.seatSelected')}</span>
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={`mt-2 space-y-8 ${collapsed ? 'hidden md:block' : 'block'}`}>
                  <div className="max-w-xs">
                    <div className={`mb-3 ${stepLabel}`}>{t('boating.step1')}</div>
                    <DatePicker
                      label={t('boating.journeyDate')}
                      value={journeyDate ? dayjs(journeyDate) : null}
                      onChange={(value: Dayjs | null) => {
                        if (value && value.isValid()) {
                          updateParams({ date: value.format('YYYY-MM-DD') })
                          setForceExpand(false)
                        }
                      }}
                      minDate={dayjs().startOf('day')}
                      format="DD MMM YYYY"
                      slotProps={{ textField: { fullWidth: true, size: 'small', required: true } }}
                    />
                  </div>

                  <div className="relative min-h-[100px]">
                    <div className="mb-4 flex items-center justify-between">
                      <div className={`${stepLabel} transition-opacity ${journeyDate ? '' : 'opacity-30'}`}>
                        {t('boating.step2')}
                      </div>
                      {isFetching && journeyDate && (
                        <span className="flex items-center gap-2 text-[10px] font-bold tracking-tighter text-orange-500 uppercase">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
                          {t('boating.updatingSlots')}
                        </span>
                      )}
                    </div>

                    {journeyDate ? (
                      <div
                        className={`grid grid-cols-1 gap-3 transition-opacity duration-300 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
                          boatForDate ? 'opacity-100' : 'pointer-events-none opacity-40'
                        }`}
                      >
                        {slots.length > 0 ? (
                          slots.map((slot) => (
                            <SlotTile
                              key={slot.id}
                              slot={slot}
                              selected={selectedSlot?.id === slot.id}
                              onSelect={() => {
                                updateParams({ slot: slot.id })
                                setForceExpand(false)
                              }}
                            />
                          ))
                        ) : (
                          <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 p-4 text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {t('boating.noSlotsDay')}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/30 p-5 text-center opacity-60 grayscale">
                        <AccessTimeIcon sx={{ fontSize: 18 }} className="mb-2 text-slate-300" />
                        <div className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                          {t('boating.selectDateFirst')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:block">
                <h2 className="mb-5 flex items-center gap-2.5 text-lg font-black text-slate-800">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10">
                    <AccessTimeIcon sx={{ fontSize: 17 }} className="text-cyan-600" />
                  </span>
                  {t('boating.expeditionSchedule')}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { label: t('boating.reporting'), value: selectedSlot?.reportingTime, color: '#8b5cf6', bg: '#f5f3ff' },
                    { label: t('boating.departure'), value: selectedSlot?.startTime, color: '#10b981', bg: '#f0fdf4' },
                    { label: t('boating.return'), value: selectedSlot?.endTime, color: '#f97316', bg: '#fff7ed' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-50 p-4 shadow-sm transition-all hover:scale-[1.02]"
                      style={{ background: item.bg }}
                    >
                      <div
                        className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: `${item.color}20`, color: item.color }}
                      >
                        <AccessTimeIcon sx={{ fontSize: 17 }} />
                      </div>
                      <div className="mb-0.5 text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        {item.label}
                      </div>
                      <div className="text-base font-black text-slate-800 italic">{formatTime(item.value)}</div>
                    </div>
                  ))}
                </div>
                {route && (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <RouteOutlinedIcon sx={{ fontSize: 18 }} className="mt-0.5 text-cyan-600" />
                    <div className="min-w-0">
                      <div className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        {t('boating.routes')} · {route.duration}
                      </div>
                      <div className="text-sm font-bold text-slate-800">{route.name}</div>
                      {route.stops?.length > 0 && (
                        <div className="mt-0.5 text-xs text-slate-500">{route.stops.join(' → ')}</div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              <div className="hidden grid-cols-3 gap-3 md:grid">
                {[
                  { icon: <ShieldOutlinedIcon sx={{ fontSize: 19 }} />, label: t('boating.badgeSafe'), color: '#10b981' },
                  { icon: <StarOutlineIcon sx={{ fontSize: 19 }} />, label: t('boating.badgePremium'), color: '#f59e0b' },
                  { icon: <GroupsOutlinedIcon sx={{ fontSize: 19 }} />, label: t('boating.badgeFamily'), color: '#8b5cf6' },
                ].map((badge) => (
                  <div
                    key={badge.label}
                    className="rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="mx-auto mb-1.5 flex justify-center" style={{ color: badge.color }}>
                      {badge.icon}
                    </div>
                    <div className="text-[9px] font-black tracking-widest text-slate-500 uppercase">{badge.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24">
                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
                  <div className="relative overflow-hidden px-4 py-6 text-center" style={{ background: manifestGradient }}>
                    <AnchorIcon sx={{ fontSize: 22 }} className="absolute -top-1 -left-1 rotate-12 text-white/20" />
                    <div className="mb-1 text-[9px] font-black tracking-[0.4em] text-cyan-50 uppercase opacity-80">
                      {t('boating.finalizeBooking')}
                    </div>
                    <h3 className="text-xl font-black tracking-widest text-white uppercase italic">
                      {t('boating.guestManifest')}
                    </h3>
                  </div>

                  <div className="space-y-5 p-6">
                    {boatForDate?.isDisabled ? (
                      <div className="space-y-4 px-6 py-12 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                          <ShieldOutlinedIcon sx={{ fontSize: 32 }} className="text-slate-400" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-800 uppercase italic">
                            {t('boating.unscheduled')}
                          </h4>
                          <p className="mx-auto mt-2 max-w-[220px] text-xs leading-relaxed font-medium text-slate-500">
                            {t('boating.unscheduledSub')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateParams({ date: null, slot: null })}
                          className="cursor-pointer text-[10px] font-black tracking-widest text-cyan-600 uppercase transition-colors hover:text-cyan-700"
                        >
                          {t('boating.tryAnotherDate')}
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-5">
                        {selectedSlot && (
                          <div className="mb-2 flex items-center justify-between rounded-2xl border border-cyan-100/50 bg-cyan-50/50 p-3 md:hidden">
                            {[
                              { label: t('boating.reporting'), value: selectedSlot.reportingTime, tone: 'text-cyan-600' },
                              { label: t('boating.departure'), value: selectedSlot.startTime, tone: 'text-emerald-600' },
                              { label: t('boating.return'), value: selectedSlot.endTime, tone: 'text-orange-600' },
                            ].map((item, i) => (
                              <div key={item.label} className="flex items-center gap-3">
                                {i > 0 && <div className="h-6 w-px bg-cyan-200/50" />}
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className={`text-[7px] font-black tracking-widest uppercase ${item.tone}`}>
                                    {item.label}
                                  </span>
                                  <span className="text-[11px] font-black text-slate-800 italic">
                                    {formatTime(item.value)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className={stepLabel}>{t('boating.step3')}</div>
                          <div className="space-y-2.5">
                            <Counter
                              label={t('boating.adults')}
                              price={priceAdult}
                              value={adultSeats}
                              onDec={() => changeCount('adult', -1)}
                              onInc={() => changeCount('adult', 1)}
                              decDisabled={adultSeats <= 1}
                              incDisabled={requested >= maxSeats}
                            />
                            <Counter
                              label={t('boating.children')}
                              hint={t('boating.childAge')}
                              price={priceChild}
                              value={childSeats}
                              onDec={() => changeCount('child', -1)}
                              onInc={() => changeCount('child', 1)}
                              decDisabled={childSeats <= 0}
                              incDisabled={requested >= maxSeats}
                            />
                          </div>
                        </div>

                        {journeyDate && selectedSlot && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className={stepLabel}>{t('boating.step4')}</div>
                              <span className="text-[10px] font-bold text-slate-400">
                                {selectedSeats.length}/{requested}
                              </span>
                            </div>
                            <SeatPicker
                              capacity={selectedSlot.capacity}
                              takenSeats={takenSeats}
                              selectedSeats={selectedSeats}
                              onToggle={toggleSeat}
                            />
                            <p className="pl-1 text-[10px] text-slate-400">{t('boating.autoAssignHint')}</p>
                          </div>
                        )}

                        <div className="space-y-2.5" ref={contactRef}>
                          <div className={stepLabel}>{t('boating.primaryContact')}</div>
                          <div className="space-y-1.5">
                            <label className="relative block">
                              <PersonOutlineIcon
                                sx={{ fontSize: 15 }}
                                className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
                              />
                              <input
                                type="text"
                                placeholder={t('boating.fullName')}
                                required
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                className={inputClass}
                              />
                            </label>
                            <label className="relative block">
                              <MailOutlineIcon
                                sx={{ fontSize: 15 }}
                                className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
                              />
                              <input
                                type="email"
                                placeholder={t('boating.emailOptional')}
                                value={guestEmail}
                                onChange={(e) => setGuestEmail(e.target.value)}
                                className={inputClass}
                              />
                            </label>
                            <label className="relative block">
                              <PhoneOutlinedIcon
                                sx={{ fontSize: 15 }}
                                className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
                              />
                              <input
                                type="tel"
                                inputMode="numeric"
                                placeholder="98765 43210"
                                required
                                value={guestPhone}
                                onChange={(e) => setGuestPhone(formatPhoneInput(e.target.value))}
                                className={inputClass}
                              />
                            </label>
                          </div>
                        </div>

                        <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl" style={{ background: fareGradient }}>
                          <ReceiptLongOutlinedIcon
                            sx={{ fontSize: 80 }}
                            className="absolute -right-4 -bottom-4 text-white opacity-10"
                          />
                          <div className="relative z-10">
                            <div className="mb-3 flex items-center gap-2 opacity-70">
                              <ReceiptLongOutlinedIcon sx={{ fontSize: 13 }} />
                              <span className="text-[9px] font-black tracking-[0.3em] uppercase">
                                {t('boating.checkoutSummary')}
                              </span>
                            </div>
                            <div className="mb-4 space-y-2.5 border-b border-white/10 pb-4">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-cyan-100/70">
                                  {t('boating.adultSeatsN', { n: adultSeats })}
                                </span>
                                <span className="text-sm font-black tracking-wider italic">
                                  ₹{(priceAdult * adultSeats).toLocaleString('en-IN')}
                                </span>
                              </div>
                              {childSeats > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-cyan-100/70">
                                    {t('boating.childSeatsN', { n: childSeats })}
                                  </span>
                                  <span className="text-sm font-black tracking-wider italic">
                                    ₹{(priceChild * childSeats).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              )}
                              {selectedSeats.length > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-cyan-100/70">{t('boating.seats')}</span>
                                  <span className="text-xs font-black tracking-wider">
                                    {[...selectedSeats].sort((a, b) => Number(a) - Number(b)).join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-end justify-between">
                              <div>
                                <div className="mb-1.5 pl-0.5 text-[8px] font-black tracking-widest text-cyan-400 uppercase">
                                  {t('boating.totalPayable')}
                                </div>
                                <div className="text-3xl leading-none font-black tracking-tighter italic">
                                  ₹{total.toLocaleString('en-IN')}
                                </div>
                              </div>
                              <div className="pb-0.5 text-right">
                                <div className="text-[7px] leading-tight font-bold text-cyan-200/50 uppercase">
                                  {t('boating.inclFees')}
                                </div>
                                <div className="mt-1 flex items-center gap-1 text-[9px] font-black tracking-tighter text-emerald-400 uppercase">
                                  <ShieldOutlinedIcon sx={{ fontSize: 10 }} /> {t('boating.bestFare')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {formError && (
                          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                            {formError}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={booking.isPending || !selectedSlot}
                          className="group/btn relative w-full cursor-pointer overflow-hidden rounded-2xl py-3.5 shadow-[0_12px_30px_-8px_rgba(8,145,178,0.4)] transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_20px_40px_-12px_rgba(8,145,178,0.5)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                          style={{ background: manifestGradient }}
                        >
                          <div className="absolute inset-0 bg-white opacity-0 transition-opacity group-hover/btn:opacity-10" />
                          <div className="relative flex items-center justify-center gap-2.5">
                            {booking.isPending ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            ) : (
                              <>
                                <span className="pl-1 text-[13px] font-black tracking-[0.3em] text-white uppercase">
                                  {t('boating.confirmBooking')}
                                </span>
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 transition-transform group-hover/btn:translate-x-1">
                                  <ArrowForwardIcon sx={{ fontSize: 13 }} className="text-white" />
                                </span>
                              </>
                            )}
                          </div>
                        </button>
                        <p className="text-center text-[10px] text-slate-400">{t('booking.noPayment')}</p>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {ticket && (
          <BoatTicketModal
            booking={ticket}
            onClose={() => {
              setTicket(null)
              navigate('/boating')
            }}
          />
        )}
      </div>
    </ThemeProvider>
  )
}
