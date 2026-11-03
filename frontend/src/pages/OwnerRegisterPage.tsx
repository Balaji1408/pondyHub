import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCustomerRegister, useRooms } from '../api/hooks'
import { MapPicker, type MapPick } from '../components/MapPicker'
import {
  OwnerAuthShell,
  ownerAuthFieldClass,
  ownerAuthLabelClass,
} from '../components/OwnerAuthShell'

export function OwnerRegisterPage() {
  const rooms = useRooms()
  const register = useCustomerRegister()
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [note, setNote] = useState('')
  const [mode, setMode] = useState<'existing' | 'new_map'>('existing')
  const [roomId, setRoomId] = useState('')
  const [mapPick, setMapPick] = useState<MapPick | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setDone(null)
    try {
      const result = await register.mutateAsync(
        mode === 'existing'
          ? {
              name,
              mobile,
              note: note || undefined,
              claimType: 'existing',
              roomId: Number(roomId),
            }
          : {
              name,
              mobile,
              note: note || undefined,
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
      brandLine="Room owner"
      title="Register"
      subtitle="Tell us who you are and which stay you manage. An admin will review your request."
      footer={
        <p>
          Already approved?{' '}
          <Link
            to="/owner/login"
            className="font-semibold text-[#0c1419] underline decoration-[#1f4d52]/35 underline-offset-4 transition hover:text-[#1f4d52]"
          >
            Sign in
          </Link>
        </p>
      }
    >
      {done ? (
        <div className="rounded-[22px] border border-[#cfe6c8] bg-gradient-to-br from-[#f3faf0] to-[#e8f5e4] px-5 py-6">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#2d5a28] uppercase">
            Request sent
          </p>
          <p className="mt-2 font-display text-2xl tracking-tight text-[#0c1419]">You’re on the list</p>
          <p className="mt-2 text-sm leading-relaxed text-[#3d5a38]">{done}</p>
          <div className="mt-4 rounded-2xl border border-[#1f4d52]/10 bg-white/70 px-4 py-3 text-sm text-[#3d555c]">
            After approval, sign in with your mobile and default password{' '}
            <span className="font-semibold text-[#0c1419]">Pondy@123</span>.
          </div>
          <Link
            to="/owner/login"
            className="mt-6 inline-flex rounded-full bg-[#0c1419] px-5 py-3 text-[11px] font-bold tracking-[0.16em] text-white uppercase transition hover:bg-[#1a2830]"
          >
            Go to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-1">
              <span className={ownerAuthLabelClass}>Full name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
                className={ownerAuthFieldClass}
              />
            </label>
            <label className="block sm:col-span-1">
              <span className={ownerAuthLabelClass}>Mobile number</span>
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                inputMode="numeric"
                required
                placeholder="10-digit mobile number"
                className={ownerAuthFieldClass}
              />
            </label>
          </div>

          <div>
            <p className={ownerAuthLabelClass}>Your room</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`rounded-2xl border px-4 py-3.5 text-left transition ${
                  mode === 'existing'
                    ? 'border-[#0c1419] bg-[#0c1419] text-white shadow-[0_12px_28px_-18px_rgba(12,20,25,0.7)]'
                    : 'border-[#c8d6de] bg-white/70 text-[#5a6a74] hover:border-[#0c1419]/35 hover:text-[#0c1419]'
                }`}
              >
                <span className="block text-[11px] font-semibold tracking-[0.12em] uppercase">
                  Listed stay
                </span>
                <span className={`mt-1 block text-sm ${mode === 'existing' ? 'text-white/75' : 'text-[#7a8b95]'}`}>
                  Already on Pondy Tripora
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode('new_map')}
                className={`rounded-2xl border px-4 py-3.5 text-left transition ${
                  mode === 'new_map'
                    ? 'border-[#0c1419] bg-[#0c1419] text-white shadow-[0_12px_28px_-18px_rgba(12,20,25,0.7)]'
                    : 'border-[#c8d6de] bg-white/70 text-[#5a6a74] hover:border-[#0c1419]/35 hover:text-[#0c1419]'
                }`}
              >
                <span className="block text-[11px] font-semibold tracking-[0.12em] uppercase">
                  New stay
                </span>
                <span className={`mt-1 block text-sm ${mode === 'new_map' ? 'text-white/75' : 'text-[#7a8b95]'}`}>
                  Pick location on the map
                </span>
              </button>
            </div>
          </div>

          {mode === 'existing' ? (
            <label className="block">
              <span className={ownerAuthLabelClass}>Select room</span>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
                className={ownerAuthFieldClass}
              >
                <option value="">Choose a room</option>
                {(rooms.data ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.location}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <MapPicker value={mapPick} onChange={setMapPick} />
          )}

          <label className="block">
            <span className={ownerAuthLabelClass}>Note for admin (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Anything that helps verify your stay…"
              className={`${ownerAuthFieldClass} resize-y`}
            />
          </label>

          <div className="rounded-2xl border border-[#1f4d52]/12 bg-[#1f4d52]/06 px-4 py-3 text-sm text-[#3d555c]">
            After approval, sign in with your mobile and default password{' '}
            <span className="font-semibold text-[#0c1419]">Pondy@123</span>.
          </div>

          {error && (
            <p className="rounded-xl bg-[#fdeeee] px-3.5 py-2.5 text-sm text-[#9b2c2c]">{error}</p>
          )}
          <button
            type="submit"
            disabled={register.isPending || (mode === 'new_map' && !mapPick)}
            className="w-full rounded-full bg-[#0c1419] py-3.5 text-[12px] font-bold tracking-[0.16em] text-white uppercase transition hover:bg-[#1a2830] disabled:opacity-50"
          >
            {register.isPending ? 'Submitting…' : 'Submit for approval'}
          </button>
        </form>
      )}
    </OwnerAuthShell>
  )
}
