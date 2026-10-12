import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import WavesIcon from '@mui/icons-material/Waves'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useBoats } from '../api/hooks'
import { filterIcons } from '../components/filterIcons'
import { useLanguage } from '../i18n/LanguageContext'
import { boatGradient, formatTime } from '../lib/boating'
import type { Boat, BoatTimeSlot, BoatType } from '../types'

type TypeFilter = 'all' | Exclude<BoatType, 'ferry'>

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1600&q=80'

function slotState(slot: BoatTimeSlot) {
  if (slot.isDisabled) return 'closed'
  if (slot.isDeparted) return 'departed'
  if (slot.availableSeats <= 0) return 'soldOut'
  return 'open'
}

function SlotChip({ slot, index, onPick }: { slot: BoatTimeSlot; index: number; onPick: () => void }) {
  const { t } = useLanguage()
  const state = slotState(slot)
  const open = state === 'open'
  return (
    <button
      type="button"
      disabled={!open}
      onClick={onPick}
      className={`group/slot relative flex cursor-pointer flex-col items-center justify-center rounded-xl border px-2 py-2 text-center shadow-sm transition-all duration-300 ${
        open
          ? 'border-slate-100 bg-white hover:border-cyan-300 hover:bg-cyan-50/20 hover:shadow-md'
          : 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60'
      }`}
    >
      {open && (
        <span className="absolute top-1 right-1.5 h-1 w-1 animate-pulse rounded-full bg-cyan-500" />
      )}
      <span className="mb-0.5 w-full truncate px-1 text-[8px] font-black tracking-tighter text-cyan-600 uppercase">
        {slot.name || t('boating.slotN', { n: index + 1 })}
      </span>
      <span
        className={`text-xs font-extrabold transition-colors ${
          open ? 'text-slate-900 group-hover/slot:text-cyan-700' : 'text-slate-400 line-through'
        }`}
      >
        {formatTime(slot.startTime)}
      </span>
      <span className="mt-0.5 text-[8px] font-bold tracking-tight text-slate-400 uppercase">
        {open ? t('boating.seatsLeft', { n: slot.availableSeats }) : t(`boating.slot.${state}`)}
      </span>
    </button>
  )
}

function BoatCard({ boat, index, date }: { boat: Boat; index: number; date: string }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [imgFailed, setImgFailed] = useState(false)
  const reverse = index % 2 === 1
  const detailUrl = (slotId?: number) =>
    `/boating/${boat.id}?date=${date}${slotId ? `&slot=${slotId}` : ''}`

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-xl"
    >
      <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
        <div className="relative overflow-hidden md:w-5/12">
          {boat.images[0] && !imgFailed ? (
            <img
              src={boat.images[0]}
              alt={boat.name}
              onError={() => setImgFailed(true)}
              className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-105 md:h-full"
            />
          ) : (
            <div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-cyan-100 to-sky-200 md:h-full">
              <WavesIcon sx={{ fontSize: 56 }} className="text-cyan-500/50" />
            </div>
          )}
          <div
            className="pointer-events-none absolute inset-0 hidden md:block"
            style={{
              background: `linear-gradient(to ${reverse ? 'left' : 'right'}, transparent 60%, rgba(255,255,255,0.95))`,
            }}
          />
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 shadow-md backdrop-blur-sm">
            <GroupsOutlinedIcon sx={{ fontSize: 14 }} className="text-cyan-600" />
            <span className="text-xs font-bold text-slate-800">
              {t('boating.pax', { n: boat.seats })}
            </span>
          </div>
        </div>

        <div className="relative z-10 flex flex-col justify-center bg-white p-6 md:w-7/12 md:bg-transparent md:p-8">
          <span className="mb-0.5 text-[10px] font-bold tracking-[0.15em] text-cyan-600 uppercase">
            {boat.coachType ?? boat.type}
          </span>
          <h2 className="mb-2 font-['Georgia',serif] text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            {boat.name}
          </h2>
          <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-slate-600">
            {boat.description}
          </p>

          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-0.5 w-6 rounded-full bg-cyan-600" />
              <span className="pl-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                {t('boating.availableSlots')}
              </span>
            </div>
            {boat.isDisabled ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-3 text-center">
                <span className="text-xs font-medium text-slate-400 italic">
                  {t('boating.unscheduledShort')}
                </span>
              </div>
            ) : boat.timeSlots.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {boat.timeSlots.map((slot, i) => (
                  <SlotChip
                    key={slot.id}
                    slot={slot}
                    index={i}
                    onPick={() => navigate(detailUrl(slot.id))}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-3 text-center">
                <span className="text-xs font-medium text-slate-400 italic">
                  {t('boating.noSlotsDay')}
                </span>
              </div>
            )}
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="flex min-w-0 items-start gap-2.5 pl-1">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 shadow-sm transition-transform duration-500 group-hover:scale-110">
                <GroupsOutlinedIcon sx={{ fontSize: 17 }} className="text-orange-600" />
              </div>
              <div className="min-w-0">
                <div className="mb-0.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  {t('boating.capacity')}
                </div>
                <div className="truncate text-[13px] font-extrabold text-slate-800">
                  {t('vehicles.seats', { n: boat.seats })}
                </div>
                <div className="mt-0.5 truncate text-[9px] font-medium tracking-tighter text-orange-500 uppercase">
                  {t('boating.safeComfortable')}
                </div>
              </div>
            </div>
            <div className="flex min-w-0 items-start gap-2.5 pl-1">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 shadow-sm transition-transform duration-500 group-hover:scale-110">
                <PlaceOutlinedIcon sx={{ fontSize: 17 }} className="text-cyan-600" />
              </div>
              <div className="min-w-0">
                <div className="mb-0.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  {t('boating.departure')}
                </div>
                <div className="truncate text-[13px] font-extrabold text-slate-800">
                  {boat.departurePoint ?? t('boating.departureLocation')}
                </div>
                <div className="mt-0.5 truncate text-[9px] font-medium tracking-tighter text-cyan-500 uppercase">
                  {boat.routes[0]?.duration ?? t('boating.puducherry')}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
            <div className="flex items-baseline gap-3">
              <div>
                <span className="text-2xl font-bold text-slate-900">
                  ₹{boat.price.toLocaleString('en-IN')}
                </span>
                <span className="ml-1 text-xs font-medium text-slate-500">{t('boating.perAdult')}</span>
              </div>
              {boat.priceChild > 0 && (
                <div className="text-slate-600">
                  <span className="text-base font-semibold text-slate-700">
                    ₹{boat.priceChild.toLocaleString('en-IN')}
                  </span>
                  <span className="ml-1 text-xs font-medium text-slate-400">
                    {t('boating.perChild')}
                  </span>
                </div>
              )}
            </div>
            <Link
              to={detailUrl()}
              className="group/btn inline-flex items-center gap-1.5 rounded-full px-6 py-2.5 text-xs font-bold tracking-wider text-white uppercase shadow-lg transition-all duration-300 hover:shadow-cyan-500/40"
              style={{ background: boatGradient }}
            >
              {t('boating.bookNow')}
              <ArrowForwardIcon
                sx={{ fontSize: 15 }}
                className="transition-transform group-hover/btn:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

export function BoatingPage() {
  const { t } = useLanguage()
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 500], [0, 150])
  const [type, setType] = useState<TypeFilter>('all')
  const [date, setDate] = useState(() => dayjs().format('YYYY-MM-DD'))

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => dayjs().startOf('day').add(i, 'day')),
    [],
  )

  const options: { id: TypeFilter; label: string }[] = [
    { id: 'all', label: t('common.all') },
    { id: 'yacht', label: t('boating.yacht') },
    { id: 'paddle', label: t('boating.paddle') },
    { id: 'kayak', label: t('boating.kayak') },
    { id: 'catamaran', label: t('boating.catamaran') },
  ]

  const { data, isLoading, isError, error } = useBoats({ date })
  const boats = useMemo(
    () => (data ?? []).filter((b) => type === 'all' || b.type === type),
    [data, type],
  )

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 pt-16 font-sans md:pt-[4.25rem]">
      <div className="relative overflow-hidden pt-8 pb-20">
        <motion.div style={reduce ? undefined : { y: heroY }} className="absolute inset-0 z-0 scale-110">
          <img src={HERO_IMAGE} alt="" className="h-full w-full object-cover opacity-60" />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(248,250,252,0.6), rgba(248,250,252,1))',
            }}
          />
        </motion.div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 mx-auto max-w-6xl px-4 py-12 text-center md:py-16"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-5 py-2">
            <WavesIcon sx={{ fontSize: 16 }} className="text-cyan-600" />
            <span className="text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase">
              {t('boating.premiumFleet')}
            </span>
          </div>
          <h1 className="mb-5 font-['Georgia',serif] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            {t('boating.heroOur')}{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #0284c7, #06b6d4, #0891b2)' }}
            >
              {t('boating.heroExclusive')}
            </span>{' '}
            {t('boating.heroFleet')}
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed font-light text-slate-600 md:text-lg">
            {t('boating.heroSub')}
          </p>

          <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-3">
            <div className="no-scrollbar flex max-w-full gap-2 overflow-x-auto px-1 py-1">
              {days.map((d, i) => {
                const value = d.format('YYYY-MM-DD')
                const active = value === date
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDate(value)}
                    aria-pressed={active}
                    className={`flex min-w-[4.25rem] shrink-0 cursor-pointer flex-col items-center rounded-2xl border px-3 py-2 transition-all duration-300 ${
                      active
                        ? 'border-orange-500 bg-orange-50 shadow-md ring-4 ring-orange-100'
                        : 'border-slate-200 bg-white/90 hover:border-orange-200'
                    }`}
                  >
                    <span
                      className={`text-[9px] font-black tracking-widest uppercase ${
                        active ? 'text-orange-600' : 'text-slate-400'
                      }`}
                    >
                      {i === 0 ? t('boating.today') : i === 1 ? t('boating.tomorrow') : d.format('ddd')}
                    </span>
                    <span
                      className={`text-lg leading-tight font-black ${active ? 'text-orange-700' : 'text-slate-800'}`}
                    >
                      {d.format('D')}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{d.format('MMM')}</span>
                  </button>
                )
              })}
            </div>
            <div
              role="radiogroup"
              aria-label={t('boating.title')}
              className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto rounded-full border border-slate-200 bg-white/80 p-1.5 shadow-sm backdrop-blur"
            >
              {options.map((o) => {
                const active = type === o.id
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setType(o.id)}
                    className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold tracking-wider whitespace-nowrap uppercase transition-all [&>svg]:h-4 [&>svg]:w-4 ${
                      active ? 'text-white shadow-md' : 'text-slate-500 hover:bg-cyan-50 hover:text-cyan-700'
                    }`}
                    style={active ? { background: boatGradient } : undefined}
                  >
                    {filterIcons[o.id]}
                    {o.label}
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative z-20 mx-auto -mt-8 max-w-6xl space-y-8 px-4 pb-16">
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-500" />
          </div>
        )}
        {isError && (
          <p className="py-16 text-center font-medium text-red-500">{(error as Error).message}</p>
        )}
        {data && boats.length === 0 && (
          <div className="space-y-4 rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 px-6 py-24 text-center backdrop-blur-sm">
            <WavesIcon sx={{ fontSize: 48 }} className="text-slate-300" />
            <div>
              <h3 className="text-xl font-bold text-slate-800">{t('boating.noVessels')}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500 italic">
                {t('boating.noVesselsSub')}
              </p>
            </div>
          </div>
        )}
        {boats.map((b, i) => (
          <BoatCard key={b.id} boat={b} index={i} date={date} />
        ))}
      </div>
    </div>
  )
}
