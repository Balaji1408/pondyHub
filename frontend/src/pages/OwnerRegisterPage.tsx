import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import { useCustomerRegister, useRooms } from '../api/hooks'
import { MapPicker, type MapPick } from '../components/MapPicker'
import {
  OwnerAuthShell,
  ownerAuthFieldClass,
  ownerAuthLabelClass,
} from '../components/OwnerAuthShell'
import { useLanguage } from '../i18n/LanguageContext'
import type { Room } from '../types'

function normalizeMobileInput(raw: string) {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('91') && digits.length > 10) digits = digits.slice(-10)
  return digits.slice(0, 10)
}

function isValidMobile(mobile: string) {
  return /^[6-9]\d{9}$/.test(mobile)
}

const backButtonClass =
  'inline-flex items-center rounded-full border border-[#0c1419] bg-[#0c1419] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-white uppercase shadow-[0_8px_18px_-12px_rgba(12,20,25,0.55)] transition hover:bg-[#1a2830]'

function StepDots({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-5 flex items-center gap-2" aria-label={`Step ${step} of 3`}>
      {([1, 2, 3] as const).map((n) => (
        <div key={n} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#d5e0e6]">
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-[#0c1419] transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              width: n <= step ? '100%' : '0%',
              transitionDelay: n <= step ? `${(n - 1) * 100}ms` : `${(3 - n) * 70}ms`,
            }}
          />
        </div>
      ))}
    </div>
  )
}

function SmoothHeight({ children }: { children: ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | undefined>(undefined)
  const [animate, setAnimate] = useState(false)

  useLayoutEffect(() => {
    const el = innerRef.current
    if (!el) return

    const measure = () => {
      const next = Math.ceil(el.getBoundingClientRect().height)
      setHeight((prev) => (prev === next ? prev : next))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    const id = requestAnimationFrame(() => setAnimate(true))
    return () => {
      cancelAnimationFrame(id)
      ro.disconnect()
    }
  }, [])

  useLayoutEffect(() => {
    const el = innerRef.current
    if (!el) return
    const next = Math.ceil(el.getBoundingClientRect().height)
    setHeight((prev) => (prev === next ? prev : next))
  })

  return (
    <div
      className={
        animate
          ? 'overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]'
          : 'overflow-hidden'
      }
      style={height === undefined ? undefined : { height }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  )
}

function RoomSearchPicker({
  rooms,
  roomId,
  onSelect,
  loading,
}: {
  rooms: Room[]
  roomId: string
  onSelect: (id: string) => void
  loading: boolean
}) {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rooms
    return rooms.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.location || '').toLowerCase().includes(q)
    )
  }, [rooms, query])

  const selected = rooms.find((r) => String(r.id) === roomId)

  return (
    <div className="space-y-2.5">
      <label className="block">
        <span className={ownerAuthLabelClass}>{t('owner.findStay')}</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={loading ? t('owner.loadingStays') : t('owner.typeStayName')}
          className={ownerAuthFieldClass}
        />
      </label>
      {selected && (
        <p className="rounded-xl border border-[#1f4d52]/15 bg-[#1f4d52]/06 px-3 py-2 text-sm text-[#3d555c]">
          {t('owner.selected')}:{' '}
          <span className="font-semibold text-[#0c1419]">
            {selected.name} — {selected.location}
          </span>
        </p>
      )}
      <div className="max-h-56 overflow-y-auto rounded-2xl border border-[#c8d6de] bg-white/80">
        {loading ? (
          <p className="px-3.5 py-4 text-sm text-[#5a6a74]">{t('owner.loadingStays')}</p>
        ) : filtered.length === 0 ? (
          <p className="px-3.5 py-4 text-sm text-[#5a6a74]">{t('owner.noMatches')}</p>
        ) : (
          <ul className="divide-y divide-[#e4ecf0]">
            {filtered.map((r) => {
              const active = String(r.id) === roomId
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(String(r.id))}
                    className={`w-full px-3.5 py-3 text-left transition ${
                      active
                        ? 'bg-[#0c1419] text-white'
                        : 'hover:bg-[#f4f8fa] text-[#0c1419]'
                    }`}
                  >
                    <span className="block text-sm font-medium">{r.name}</span>
                    <span
                      className={`mt-0.5 block text-xs ${
                        active ? 'text-white/70' : 'text-[#5a6a74]'
                      }`}
                    >
                      {r.location}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export function OwnerRegisterPage() {
  const { t } = useLanguage()
  const rooms = useRooms()
  const register = useCustomerRegister()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [mode, setMode] = useState<'existing' | 'new_map'>('new_map')
  const [roomId, setRoomId] = useState('')
  const [mapPick, setMapPick] = useState<MapPick | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const selectedRoom = (rooms.data ?? []).find((r) => String(r.id) === roomId)

  function goNextFromYou() {
    setError(null)
    if (name.trim().length < 2) {
      setError(t('owner.enterName'))
      return
    }
    if (!isValidMobile(mobile)) {
      setError(t('owner.enterMobile'))
      return
    }
    setStep(2)
  }

  function goNextFromStay() {
    setError(null)
    if (mode === 'existing' && !roomId) {
      setError(t('owner.selectStay'))
      return
    }
    if (mode === 'new_map' && !mapPick) {
      setError(t('owner.placePinMap'))
      return
    }
    setStep(3)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setDone(null)
    if (mode === 'existing' && !roomId) {
      setError(t('owner.selectStay'))
      return
    }
    if (mode === 'new_map' && !mapPick) {
      setError(t('owner.placePinFirst'))
      return
    }
    try {
      const result = await register.mutateAsync(
        mode === 'existing'
          ? {
              name: name.trim(),
              mobile,
              claimType: 'existing',
              roomId: Number(roomId),
            }
          : {
              name: name.trim(),
              mobile,
              claimType: 'new_map',
              proposedName: mapPick?.proposedName,
              proposedAddress: mapPick?.proposedAddress,
              lat: mapPick?.lat,
              lng: mapPick?.lng,
              placeId: mapPick?.placeId,
              mapUrl: mapPick?.mapUrl,
            }
      )
      setDone(result.message)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <OwnerAuthShell
      wide
      brandLine={t('owner.roomOwner')}
      title={t('owner.registerTitle')}
      subtitle={t('owner.registerSubtitle')}
      footer={
        <p>
          {t('owner.alreadyApproved')}{' '}
          <Link
            to="/owner/login"
            className="font-semibold text-[#0c1419] underline decoration-[#1f4d52]/35 underline-offset-4 transition hover:text-[#1f4d52]"
          >
            {t('owner.signIn')}
          </Link>
          {' · '}
          <Link
            to="/owner/start"
            className="font-semibold text-[#0c1419] underline decoration-[#1f4d52]/35 underline-offset-4 transition hover:text-[#1f4d52]"
          >
            {t('owner.membersHome')}
          </Link>
        </p>
      }
    >
      <SmoothHeight>
      {done ? (
        <div className="animate-step-in rounded-[22px] border border-[#cfe6c8] bg-gradient-to-br from-[#f3faf0] to-[#e8f5e4] px-5 py-6">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#2d5a28] uppercase">
            {t('owner.requestSent')}
          </p>
          <p className="mt-2 font-display text-2xl tracking-tight text-[#0c1419]">{t('owner.onTheList')}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#3d5a38]">{done}</p>
          <ol className="mt-4 space-y-2 rounded-2xl border border-[#1f4d52]/10 bg-white/70 px-4 py-3 text-sm text-[#3d555c]">
            <li>{t('owner.next1')}</li>
            <li>{t('owner.next2')}</li>
            <li>{t('owner.next3', { password: 'Pondy@123' })}</li>
          </ol>
          <Link
            to="/owner/login"
            className="mt-6 inline-flex rounded-full bg-[#0c1419] px-5 py-3 text-[11px] font-bold tracking-[0.16em] text-white uppercase transition hover:bg-[#1a2830]"
          >
            {t('owner.goSignIn')}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <StepDots step={step} />

          {step === 1 && (
            <div key="step-1" className="animate-step-in space-y-5">
              <p className="text-sm font-medium text-[#0c1419]">{t('owner.step1')}</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-1">
                  <span className={ownerAuthLabelClass}>{t('owner.fullName')}</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder={t('owner.yourName')}
                    className={ownerAuthFieldClass}
                  />
                </label>
                <label className="block sm:col-span-1">
                  <span className={ownerAuthLabelClass}>{t('owner.mobileNumber')}</span>
                  <input
                    value={mobile}
                    onChange={(e) => setMobile(normalizeMobileInput(e.target.value))}
                    inputMode="numeric"
                    required
                    placeholder={t('owner.mobilePlaceholder')}
                    className={ownerAuthFieldClass}
                  />
                  <span className="mt-1.5 block text-xs text-[#6a7c86]">{t('owner.mobileHint')}</span>
                </label>
              </div>
              {error && (
                <p className="rounded-xl bg-[#fdeeee] px-3.5 py-2.5 text-sm text-[#9b2c2c]">{error}</p>
              )}
              <button
                type="button"
                onClick={goNextFromYou}
                className="w-full rounded-full bg-[#0c1419] py-3.5 text-[12px] font-bold tracking-[0.16em] text-white uppercase transition hover:bg-[#1a2830]"
              >
                {t('owner.next')}
              </button>
            </div>
          )}

          {step === 2 && (
            <div key="step-2" className="animate-step-in space-y-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#0c1419]">{t('owner.step2')}</p>
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    setStep(1)
                  }}
                  className={backButtonClass}
                >
                  {t('owner.back')}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('new_map')
                    setError(null)
                  }}
                  className={`rounded-2xl border px-4 py-3.5 text-left transition ${
                    mode === 'new_map'
                      ? 'border-[#0c1419] bg-[#0c1419] text-white shadow-[0_12px_28px_-18px_rgba(12,20,25,0.7)]'
                      : 'border-[#c8d6de] bg-white/70 text-[#5a6a74] hover:border-[#0c1419]/35 hover:text-[#0c1419]'
                  }`}
                >
                  <span className="block text-[11px] font-semibold tracking-[0.12em] uppercase">
                    {t('owner.notListedYet')}
                  </span>
                  <span
                    className={`mt-1 block text-sm ${
                      mode === 'new_map' ? 'text-white/75' : 'text-[#7a8b95]'
                    }`}
                  >
                    {t('owner.notListedHint')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('existing')
                    setError(null)
                  }}
                  className={`rounded-2xl border px-4 py-3.5 text-left transition ${
                    mode === 'existing'
                      ? 'border-[#0c1419] bg-[#0c1419] text-white shadow-[0_12px_28px_-18px_rgba(12,20,25,0.7)]'
                      : 'border-[#c8d6de] bg-white/70 text-[#5a6a74] hover:border-[#0c1419]/35 hover:text-[#0c1419]'
                  }`}
                >
                  <span className="block text-[11px] font-semibold tracking-[0.12em] uppercase">
                    {t('owner.alreadyListed')}
                  </span>
                  <span
                    className={`mt-1 block text-sm ${
                      mode === 'existing' ? 'text-white/75' : 'text-[#7a8b95]'
                    }`}
                  >
                    {t('owner.alreadyListedHint')}
                  </span>
                </button>
              </div>

              {mode === 'existing' ? (
                <RoomSearchPicker
                  rooms={rooms.data ?? []}
                  roomId={roomId}
                  onSelect={setRoomId}
                  loading={rooms.isLoading}
                />
              ) : (
                <MapPicker value={mapPick} onChange={setMapPick} />
              )}

              {error && (
                <p className="rounded-xl bg-[#fdeeee] px-3.5 py-2.5 text-sm text-[#9b2c2c]">{error}</p>
              )}
              <button
                type="button"
                onClick={goNextFromStay}
                disabled={mode === 'new_map' && !mapPick}
                className="w-full rounded-full bg-[#0c1419] py-3.5 text-[12px] font-bold tracking-[0.16em] text-white uppercase transition hover:bg-[#1a2830] disabled:opacity-50"
              >
                {mode === 'new_map' && !mapPick ? t('owner.placePinFirst') : t('owner.next')}
              </button>
            </div>
          )}

          {step === 3 && (
            <div key="step-3" className="animate-step-in space-y-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#0c1419]">{t('owner.step3')}</p>
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    setStep(2)
                  }}
                  className={backButtonClass}
                >
                  {t('owner.back')}
                </button>
              </div>

              <div className="rounded-2xl border border-[#c8d6de] bg-white/70 px-4 py-3 text-sm text-[#3d555c]">
                <p>
                  <span className="font-semibold text-[#0c1419]">{name.trim()}</span>
                  {' · '}
                  {mobile}
                </p>
                <p className="mt-1">
                  {mode === 'existing'
                    ? selectedRoom
                      ? `${selectedRoom.name} — ${selectedRoom.location}`
                      : t('owner.listedStaySelected')
                    : mapPick
                      ? `${mapPick.proposedName} — ${mapPick.proposedAddress}`
                      : t('owner.newStay')}
                </p>
              </div>

              <div className="rounded-2xl border border-[#1f4d52]/12 bg-[#1f4d52]/06 px-4 py-3 text-sm text-[#3d555c]">
                {t('owner.afterApproval', { password: 'Pondy@123' })}
              </div>

              {error && (
                <p className="rounded-xl bg-[#fdeeee] px-3.5 py-2.5 text-sm text-[#9b2c2c]">{error}</p>
              )}
              <button
                type="submit"
                disabled={register.isPending || (mode === 'new_map' && !mapPick)}
                className="w-full rounded-full bg-[#0c1419] py-3.5 text-[12px] font-bold tracking-[0.16em] text-white uppercase transition hover:bg-[#1a2830] disabled:opacity-50"
              >
                {register.isPending ? t('owner.submitting') : t('owner.submit')}
              </button>
            </div>
          )}
        </form>
      )}
      </SmoothHeight>
    </OwnerAuthShell>
  )
}
