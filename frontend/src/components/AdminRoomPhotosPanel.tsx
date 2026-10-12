import { useMemo, useState } from 'react'
import { useRooms, useUpdateRoomPhoto } from '../api/hooks'
import { GALLERY_SLOTS, roomGallerySources } from '../lib/roomGallery'
import type { GallerySlot, Room } from '../types'

const SLOT_LABELS: Record<GallerySlot, string> = {
  exterior: 'Exterior',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  living: 'Living',
}

const MAX_SIDE = 1600

/** Downscales a picked photo to at most 1600px and re-encodes it as JPEG for upload. */
async function fileToJpegDataUrl(file: File) {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not process this image')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.85)
  } catch {
    throw new Error('Could not read this image. Try a JPG or PNG photo.')
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function AdminRoomPhotosPanel({
  light,
  accent,
  onSaved,
}: {
  light: boolean
  accent: string
  onSaved: (message: string) => void
}) {
  const rooms = useRooms()
  const updatePhoto = useUpdateRoomPhoto()
  const [query, setQuery] = useState('')
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const items = useMemo(() => {
    const list = rooms.data ?? []
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.roomType.toLowerCase().includes(q)
    )
  }, [rooms.data, query])

  async function change(room: Room, slot: GallerySlot, file: File | null) {
    setError(null)
    setBusyKey(`${room.id}:${slot}`)
    try {
      const image = file ? await fileToJpegDataUrl(file) : null
      await updatePhoto.mutateAsync({ id: room.id, slot, image })
      onSaved(
        file
          ? `${room.name}: ${SLOT_LABELS[slot].toLowerCase()} photo updated`
          : `${room.name}: ${SLOT_LABELS[slot].toLowerCase()} photo reset to default`
      )
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyKey(null)
    }
  }

  const muted = light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'
  const strong = light ? 'text-[#0a0a0a]' : 'text-white'

  return (
    <section
      className={`overflow-hidden rounded-[28px] transition-colors ${
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
          <p className={`text-[12px] font-medium ${light ? 'text-[#8a847a]' : 'text-[#7a7a7a]'}`}>
            Gallery
          </p>
          <h2 className={`mt-1 text-xl font-semibold tracking-tight ${strong}`}>Room photos</h2>
          <p className={`mt-1 text-sm ${muted}`}>
            Replace the exterior, bedroom, bathroom and living photos for each room. New photos go
            live on the website as soon as they upload.
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search room"
          className={`rounded-full px-4 py-2.5 text-sm outline-none transition sm:w-56 ${
            light
              ? 'border border-[#e8e4dc] bg-[#faf8f4] text-[#0a0a0a] placeholder:text-[#9a9288] focus:border-[#0a0a0a]'
              : 'border border-white/[0.1] bg-[#1a1a22] text-white placeholder:text-[#5a5a5a] focus:border-[#c8f14a]/40'
          }`}
        />
      </div>

      <div className="px-5 md:px-7">
        {rooms.isLoading && <p className={`py-14 text-center text-sm ${muted}`}>Loading…</p>}

        {rooms.isError && (
          <div className="my-5 rounded-2xl bg-red-500/10 px-5 py-4 text-sm text-red-600">
            {(rooms.error as Error).message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl bg-red-500/10 px-5 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!rooms.isLoading && !rooms.isError && items.length === 0 && (
          <p className={`py-14 text-center text-sm ${muted}`}>No rooms found.</p>
        )}

        {items.length > 0 && (
          <ul>
            {items.map((room, idx) => {
              const sources = roomGallerySources(room)
              return (
                <li
                  key={room.id}
                  className={`py-5 ${
                    idx > 0 ? (light ? 'border-t border-[#f0ebe3]' : 'border-t border-white/[0.05]') : ''
                  }`}
                >
                  <p className={`font-medium ${strong}`}>{room.name}</p>
                  <p className={`mt-0.5 text-xs capitalize ${muted}`}>
                    {room.category} · {room.roomType}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {GALLERY_SLOTS.map((slot) => {
                      const custom = Boolean(room.gallery?.[slot])
                      const busy = busyKey === `${room.id}:${slot}`
                      const inputId = `room-photo-${room.id}-${slot}`
                      return (
                        <div
                          key={slot}
                          className={`overflow-hidden rounded-2xl ${
                            light ? 'border border-[#efeae2] bg-[#faf8f4]' : 'bg-[#1a1a22]'
                          }`}
                        >
                          <div className="relative aspect-[4/3] bg-black/10">
                            <img
                              src={sources[slot]}
                              alt={`${room.name} ${SLOT_LABELS[slot]}`}
                              loading="lazy"
                              className={`h-full w-full object-cover transition ${busy ? 'opacity-40' : ''}`}
                            />
                            <span className="absolute top-2 left-2 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-white uppercase">
                              {SLOT_LABELS[slot]}
                            </span>
                            {custom && (
                              <span
                                className="absolute top-2 right-2 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-black uppercase"
                                style={{ background: light ? '#c8f14a' : accent }}
                              >
                                Custom
                              </span>
                            )}
                            {busy && (
                              <span
                                className={`absolute inset-0 flex items-center justify-center text-xs font-semibold ${strong}`}
                              >
                                Uploading…
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 p-2.5">
                            <input
                              id={inputId}
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              disabled={busyKey !== null}
                              onChange={(e) => {
                                const file = e.target.files?.[0] ?? null
                                e.target.value = ''
                                if (file) void change(room, slot, file)
                              }}
                            />
                            <label
                              htmlFor={inputId}
                              aria-disabled={busyKey !== null}
                              className={`flex-1 cursor-pointer rounded-full px-3 py-2 text-center text-[11px] font-bold tracking-[0.1em] uppercase transition aria-disabled:cursor-not-allowed aria-disabled:opacity-30 ${
                                light
                                  ? 'bg-[#0a0a0a] text-white hover:bg-black/85'
                                  : 'text-black hover:brightness-110'
                              }`}
                              style={light ? undefined : { background: accent }}
                            >
                              Change
                            </label>
                            {custom && (
                              <button
                                type="button"
                                disabled={busyKey !== null}
                                onClick={() => void change(room, slot, null)}
                                title="Go back to the default photo"
                                className={`rounded-full border px-3 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase transition disabled:cursor-not-allowed disabled:opacity-30 ${
                                  light
                                    ? 'border-[#e8e4dc] text-[#3d3d3d] hover:border-[#0a0a0a]'
                                    : 'border-white/10 text-[#c5c5c5] hover:border-white/25 hover:text-white'
                                }`}
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
