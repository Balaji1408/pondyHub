import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  useClaimOwnerRoom,
  useCreateOwnerRoom,
  useCustomerMe,
  useOwnerRooms,
  useUpdateOwnerRoomPhoto,
} from '../api/hooks'
import {
  clearCustomerSession,
  getCustomerUser,
  isCustomerLoggedIn,
} from '../auth/session'
import { LocationLink } from '../components/FeatureListing'
import { ImageAccordion, type GalleryImage } from '../components/ImageAccordion'
import { fileToJpegDataUrl } from '../lib/imageCompress'
import { GALLERY_SLOTS, roomGallerySources } from '../lib/roomGallery'
import { formatInr, roomGuestRange } from '../lib/roomPricing'
import type { GallerySlot, Room, RoomCategory } from '../types'

const GALLERY_LABELS: Record<GallerySlot, string> = {
  exterior: 'Exterior',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  living: 'Living',
}

function ownerGallery(room: Room): GalleryImage[] {
  const sources = roomGallerySources(room)
  return GALLERY_SLOTS.map((slot) => ({ src: sources[slot], label: GALLERY_LABELS[slot] }))
}

function statusTone(status: string | undefined) {
  if (status === 'published') return 'bg-[#e8f5e4] text-[#2d5a28]'
  if (status === 'rejected') return 'bg-red-500/10 text-red-700'
  return 'bg-[#fff4d6] text-[#8a6a12]'
}

function statusHint(status: string | undefined) {
  if (status === 'published') return 'Live on the website'
  if (status === 'rejected') return 'Rejected — update photos or details'
  return 'Pending admin approval'
}

function OwnerRoomCard({
  room,
  editing,
  onToggleEdit,
  onSaved,
  onError,
}: {
  room: Room
  editing: boolean
  onToggleEdit: () => void
  onSaved: (msg: string) => void
  onError: (msg: string) => void
}) {
  const updatePhoto = useUpdateOwnerRoomPhoto()
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const sources = roomGallerySources(room)
  const range = roomGuestRange(room)
  const status = room.listingStatus || 'pending'

  async function change(slot: GallerySlot, file: File | null) {
    setBusyKey(`${room.id}:${slot}`)
    try {
      const image = file ? await fileToJpegDataUrl(file) : null
      await updatePhoto.mutateAsync({ id: room.id, slot, image })
      onSaved(
        file
          ? `${room.name}: ${GALLERY_LABELS[slot].toLowerCase()} photo updated`
          : `${room.name}: ${GALLERY_LABELS[slot].toLowerCase()} photo reset`
      )
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-sand/70 bg-white shadow-[0_8px_24px_-18px_rgba(12,20,25,0.35)]">
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="relative min-h-[180px] md:min-h-full">
          <ImageAccordion images={ownerGallery(room)} alt={room.name} />
        </div>
        <div className="flex flex-col justify-between gap-3 p-4 md:p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-muted uppercase">
                {room.category}
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] uppercase ${statusTone(status)}`}
              >
                {status}
              </span>
            </div>
            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink md:text-2xl">
              {room.name}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {room.roomType} ·{' '}
              {range.min === range.max ? range.min : `${range.min}–${range.max}`} guests
              {room.location ? (
                <>
                  {' '}
                  · <LocationLink location={room.location} className="align-baseline text-sm" />
                </>
              ) : null}
            </p>
            {room.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/70">
                {room.description}
              </p>
            )}
            <p className="mt-2 text-xs text-muted">{statusHint(status)}</p>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">From</p>
              <p className="font-sans text-lg font-bold tracking-tight tabular-nums">
                {formatInr(room.pricePerNight)}
                <span className="ml-1 text-sm font-normal text-muted">/ night</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleEdit}
              className={`cursor-pointer rounded-full px-4 py-2 text-[11px] font-bold tracking-[0.12em] uppercase ${
                editing
                  ? 'border border-ink/20 text-ink'
                  : 'bg-ink text-white'
              }`}
            >
              {editing ? 'Close edit' : 'Edit photos'}
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <div className="border-t border-sand/60 bg-[#f7fafb] px-4 py-4 md:px-5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            Gallery slots
          </p>
          <p className="mt-1 text-xs text-muted">
            Replace exterior, bedroom, bathroom and living photos. Changes show on the website once
            the room is live.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {GALLERY_SLOTS.map((slot) => {
              const custom = Boolean(room.gallery?.[slot])
              const busy = busyKey === `${room.id}:${slot}`
              const inputId = `owner-photo-${room.id}-${slot}`
              return (
                <div
                  key={slot}
                  className="overflow-hidden rounded-xl border border-sand/70 bg-white"
                >
                  <div className="relative aspect-[4/3] bg-black/5">
                    <img
                      src={sources[slot]}
                      alt={`${room.name} ${GALLERY_LABELS[slot]}`}
                      className={`h-full w-full object-cover ${busy ? 'opacity-40' : ''}`}
                    />
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-black/65 px-2 py-0.5 text-[9px] font-semibold tracking-[0.08em] text-white uppercase">
                      {GALLERY_LABELS[slot]}
                    </span>
                    {custom && (
                      <span className="absolute top-1.5 right-1.5 rounded-full bg-[#c8f14a] px-2 py-0.5 text-[9px] font-bold tracking-[0.08em] text-black uppercase">
                        Custom
                      </span>
                    )}
                    {busy && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-ink">
                        Uploading…
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 p-2">
                    <input
                      id={inputId}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={busyKey !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null
                        e.target.value = ''
                        if (file) void change(slot, file)
                      }}
                    />
                    <label
                      htmlFor={inputId}
                      aria-disabled={busyKey !== null}
                      className="flex-1 cursor-pointer rounded-full bg-ink px-2.5 py-1.5 text-center text-[10px] font-bold tracking-[0.1em] text-white uppercase aria-disabled:cursor-not-allowed aria-disabled:opacity-30"
                    >
                      Change
                    </label>
                    {custom && (
                      <button
                        type="button"
                        disabled={busyKey !== null}
                        onClick={() => void change(slot, null)}
                        className="cursor-pointer rounded-full border border-sand-deep/60 px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.08em] text-muted uppercase disabled:opacity-30"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </article>
  )
}

export function OwnerPortalPage() {
  const navigate = useNavigate()
  const user = getCustomerUser()
  const me = useCustomerMe()
  const roomsQuery = useOwnerRooms()
  const createRoom = useCreateOwnerRoom()
  const claimRoom = useClaimOwnerRoom()

  const [panel, setPanel] = useState<'dashboard' | 'manage'>('dashboard')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [claimId, setClaimId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<RoomCategory>('couples')
  const [roomType, setRoomType] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [minMembers, setMinMembers] = useState(1)
  const [maxMembers, setMaxMembers] = useState(2)
  const [pricePerNight, setPricePerNight] = useState(2000)
  const [baseGuests, setBaseGuests] = useState(2)
  const [extraGuestPrice, setExtraGuestPrice] = useState(400)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const mine = roomsQuery.data?.mine ?? me.data?.rooms ?? []
  const catalog = useMemo(() => {
    const owned = new Set(mine.map((r) => r.id))
    return (roomsQuery.data?.catalog ?? []).filter((r) => !owned.has(r.id) && !r.ownerCustomerId)
  }, [roomsQuery.data?.catalog, mine])

  const stats = useMemo(() => {
    const published = mine.filter((r) => r.listingStatus === 'published').length
    const pending = mine.filter((r) => !r.listingStatus || r.listingStatus === 'pending').length
    const rejected = mine.filter((r) => r.listingStatus === 'rejected').length
    return { published, pending, rejected, total: mine.length }
  }, [mine])

  if (!isCustomerLoggedIn()) return <Navigate to="/owner/login" replace />
  if (user?.mustChangePassword) return <Navigate to="/owner/change-password" replace />

  async function onPickImages(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    setError(null)
    try {
      const next: string[] = [...images]
      for (const file of Array.from(files).slice(0, 6 - next.length)) {
        next.push(await fileToJpegDataUrl(file))
      }
      setImages(next)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    try {
      await createRoom.mutateAsync({
        name,
        category,
        roomType,
        location,
        description,
        minMembers,
        maxMembers,
        pricePerNight,
        baseGuests,
        extraGuestPrice,
        images,
      })
      setMessage('Room submitted. It stays hidden until an admin approves it.')
      setShowCreate(false)
      setName('')
      setRoomType('')
      setLocation('')
      setDescription('')
      setImages([])
      setPanel('dashboard')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function onClaim() {
    setError(null)
    setMessage(null)
    try {
      await claimRoom.mutateAsync(Number(claimId))
      setMessage('Room claimed. It is pending admin approval before it shows publicly again.')
      setClaimId('')
      setPanel('dashboard')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="border-b border-sand/60 bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-white/50 uppercase">
              Owner dashboard
            </p>
            <h1 className="font-display text-xl text-white md:text-2xl">
              {me.data?.name || user?.name || 'Your stays'}
            </h1>
            <p className="text-xs text-white/55">{me.data?.mobile || user?.mobile}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPanel('dashboard')}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase ${
                panel === 'dashboard' ? 'bg-white text-ink' : 'border border-white/25 text-white/80'
              }`}
            >
              My rooms
            </button>
            <button
              type="button"
              onClick={() => setPanel('manage')}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase ${
                panel === 'manage' ? 'bg-white text-ink' : 'border border-white/25 text-white/80'
              }`}
            >
              Add / claim
            </button>
            <Link
              to="/owner/change-password"
              className="cursor-pointer rounded-full border border-white/25 px-3 py-1.5 text-[10px] font-semibold tracking-[0.1em] text-white/80 uppercase"
            >
              Password
            </Link>
            <button
              type="button"
              onClick={() => {
                clearCustomerSession()
                navigate('/owner/login')
              }}
              className="cursor-pointer rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold tracking-[0.1em] text-white uppercase"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {(message || error) && (
        <div className="mx-auto max-w-6xl px-4 pt-3 md:px-6">
          {message && (
            <div className="rounded-xl bg-[#e8f5e4] px-3 py-2 text-sm text-[#2d5a28]">{message}</div>
          )}
          {error && (
            <div className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div>
          )}
        </div>
      )}

      {panel === 'dashboard' && (
        <div className="mx-auto max-w-6xl px-4 py-4 md:px-6 md:py-5">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'Total', value: stats.total, className: 'text-ink' },
              { label: 'Live', value: stats.published, className: 'text-[#2d5a28]' },
              { label: 'Pending', value: stats.pending, className: 'text-[#8a6a12]' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-sand/70 bg-white px-3 py-2.5 sm:px-4"
              >
                <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                  {s.label}
                </p>
                <p className={`mt-0.5 text-xl font-bold tabular-nums ${s.className}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
              Your listings
            </p>
            <h2 className="mt-0.5 font-display text-2xl font-semibold tracking-tight text-ink">
              My rooms
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Preview your stays and edit exterior, bedroom, bathroom and living photos.
            </p>
          </div>

          {roomsQuery.isLoading && <p className="py-10 text-sm text-muted">Loading your rooms…</p>}
          {roomsQuery.isError && (
            <p className="py-10 text-sm text-red-600">{(roomsQuery.error as Error).message}</p>
          )}
          {!roomsQuery.isLoading && mine.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm text-muted">No rooms yet.</p>
              <button
                type="button"
                onClick={() => setPanel('manage')}
                className="mt-3 cursor-pointer rounded-full bg-ink px-4 py-2 text-[11px] font-bold tracking-[0.12em] text-white uppercase"
              >
                Add your first room
              </button>
            </div>
          )}

          <div className="mt-4 space-y-4">
            {mine.map((room) => (
              <OwnerRoomCard
                key={room.id}
                room={room}
                editing={editingId === room.id}
                onToggleEdit={() =>
                  setEditingId((id) => (id === room.id ? null : room.id))
                }
                onSaved={(msg) => {
                  setError(null)
                  setMessage(msg)
                }}
                onError={(msg) => {
                  setMessage(null)
                  setError(msg)
                }}
              />
            ))}
          </div>
        </div>
      )}

      {panel === 'manage' && (
        <div className="mx-auto max-w-3xl px-4 py-5 md:px-6">
          <section className="rounded-2xl border border-sand/70 bg-white p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-ink">Create a room</h2>
                <p className="mt-0.5 text-sm text-muted">
                  New listings stay pending until an admin publishes them.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate((v) => !v)}
                className="cursor-pointer rounded-full bg-ink px-3.5 py-1.5 text-[10px] font-bold tracking-[0.12em] text-white uppercase"
              >
                {showCreate ? 'Cancel' : 'Create room'}
              </button>
            </div>

            {showCreate && (
              <form onSubmit={onCreate} className="mt-4 space-y-3 border-t border-sand/60 pt-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                      Room name
                    </span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="mt-1 w-full rounded-xl border border-sand-deep/50 bg-surface px-3 py-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                      Category
                    </span>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as RoomCategory)}
                      className="mt-1 w-full rounded-xl border border-sand-deep/50 bg-surface px-3 py-2 text-sm outline-none"
                    >
                      <option value="couples">Couples</option>
                      <option value="family">Family</option>
                      <option value="friends">Friends</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                      Room type
                    </span>
                    <input
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                      required
                      className="mt-1 w-full rounded-xl border border-sand-deep/50 bg-surface px-3 py-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                      Location
                    </span>
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                      className="mt-1 w-full rounded-xl border border-sand-deep/50 bg-surface px-3 py-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                      Description
                    </span>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-sand-deep/50 bg-surface px-3 py-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                      Price / night (₹)
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={pricePerNight}
                      onChange={(e) => setPricePerNight(Number(e.target.value))}
                      required
                      className="mt-1 w-full rounded-xl border border-sand-deep/50 bg-surface px-3 py-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                      Extra guest / night (₹)
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={extraGuestPrice}
                      onChange={(e) => setExtraGuestPrice(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-sand-deep/50 bg-surface px-3 py-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                      Min guests
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={minMembers}
                      onChange={(e) => setMinMembers(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-sand-deep/50 bg-surface px-3 py-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                      Max guests
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={maxMembers}
                      onChange={(e) => setMaxMembers(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-sand-deep/50 bg-surface px-3 py-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                      Base guests
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={baseGuests}
                      onChange={(e) => setBaseGuests(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-sand-deep/50 bg-surface px-3 py-2 text-sm outline-none"
                    />
                  </label>
                </div>

                <div>
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                    Cover photos (up to 6)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploading || images.length >= 6}
                    onChange={(e) => {
                      void onPickImages(e.target.files)
                      e.target.value = ''
                    }}
                    className="mt-1.5 block w-full text-sm"
                  />
                  {images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {images.map((src, i) => (
                        <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg">
                          <img src={src} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-0.5 right-0.5 cursor-pointer rounded-full bg-black/70 px-1 text-[9px] text-white"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={createRoom.isPending || uploading || images.length === 0}
                  className="cursor-pointer rounded-full bg-ink px-5 py-2 text-[11px] font-bold tracking-[0.12em] text-white uppercase disabled:opacity-50"
                >
                  {createRoom.isPending ? 'Submitting…' : 'Submit for approval'}
                </button>
              </form>
            )}
          </section>

          <section className="mt-4 rounded-2xl border border-sand/70 bg-white p-4 md:p-5">
            <h2 className="text-base font-semibold text-ink">Claim a listed room</h2>
            <p className="mt-0.5 text-sm text-muted">
              Link yourself as owner of a stay already on the site.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <select
                value={claimId}
                onChange={(e) => setClaimId(e.target.value)}
                className="flex-1 rounded-xl border border-sand-deep/50 bg-surface px-3 py-2 text-sm outline-none"
              >
                <option value="">Choose a room</option>
                {catalog.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!claimId || claimRoom.isPending}
                onClick={() => void onClaim()}
                className="cursor-pointer rounded-full border border-ink px-4 py-2 text-[11px] font-bold tracking-[0.12em] text-ink uppercase disabled:opacity-40"
              >
                Claim
              </button>
            </div>
          </section>

          <p className="mt-5 text-center text-sm">
            <button
              type="button"
              onClick={() => setPanel('dashboard')}
              className="cursor-pointer text-muted hover:text-ink"
            >
              ← Back to my rooms
            </button>
          </p>
        </div>
      )}

      <p className="px-4 pb-6 text-center text-sm md:px-6">
        <Link to="/" className="text-muted hover:text-ink">
          ← Back to Pondy Tripora
        </Link>
      </p>
    </div>
  )
}
