import { useMemo, useState } from 'react'
import { useRooms } from '../api/hooks'
import { EmptyResults, FadingResults, useFadedFilter } from '../components/FilterBar'
import { RoomFilters, type RoomCategoryFilter } from '../components/RoomFilters'
import { BookingModal } from '../components/BookingModal'
import { FeatureListing, ListingButton, ListingPageShell } from '../components/FeatureListing'
import { GoogleRating } from '../components/GoogleRating'
import type { GalleryImage } from '../components/ImageAccordion'
import { useLanguage } from '../i18n/LanguageContext'
import { extraGuests, formatInr, roomGuestRange, roomPriceForGuests } from '../lib/roomPricing'
import type { Room } from '../types'

/** Fallback HD shots when Google Place Photos are unavailable (no API key). */
const ROOM_GALLERIES: Record<
  string,
  { exterior?: string; bedroom: string; bathroom: string; living: string }
> = {
  'maison-blanche-suite': {
    bedroom: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&q=85',
    bathroom: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&q=85',
    living: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=85',
  },
  'promenade-sea-view': {
    bedroom: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1600&q=85',
    bathroom: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1600&q=85',
    living: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=85',
  },
  'family-villa-auroville': {
    bedroom: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1600&q=85',
    bathroom: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1600&q=85',
    living: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=85',
  },
  'palm-court-family': {
    bedroom: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1600&q=85',
    bathroom: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=85',
    living: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1600&q=85',
  },
  'friends-loft-beach': {
    bedroom: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1600&q=85',
    bathroom: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1600&q=85',
    living: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1600&q=85',
  },
  'backpacker-pods': {
    bedroom: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=85',
    bathroom: 'https://images.unsplash.com/photo-1584622781867-64310d961839?w=1600&q=85',
    living: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=85',
  },
}

const DEFAULT_GALLERY = {
  bedroom: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&q=85',
  bathroom: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&q=85',
  living: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=85',
}

function roomGallery(
  room: Room,
  labels: { exterior: string; bedroom: string; bathroom: string; living: string },
): GalleryImage[] {
  const google = room.photosFromGoogle ? room.images.filter(Boolean) : []
  if (google.length > 0) {
    const pick = (i: number) => google[Math.min(i, google.length - 1)]!
    return [
      { src: pick(0), label: labels.exterior },
      { src: pick(1), label: labels.bedroom },
      { src: pick(2), label: labels.bathroom },
      { src: pick(3), label: labels.living },
    ]
  }

  const shots = ROOM_GALLERIES[room.slug] ?? DEFAULT_GALLERY
  return [
    { src: shots.exterior ?? room.images[0] ?? DEFAULT_GALLERY.living, label: labels.exterior },
    { src: shots.bedroom, label: labels.bedroom },
    { src: shots.bathroom, label: labels.bathroom },
    { src: shots.living, label: labels.living },
  ]
}

function RoomPrice({
  room,
  guests,
  dark,
}: {
  room: Room
  guests: number | null
  dark: boolean
}) {
  const { t } = useLanguage()
  const { min, max } = roomGuestRange(room)
  const count = guests == null ? null : Math.min(max, Math.max(min, guests))
  const amount = count == null ? room.pricePerNight : roomPriceForGuests(room, count)
  const extra = count == null ? 0 : extraGuests(room, count)
  const canAddGuests = room.extraGuestPrice > 0 && max > room.baseGuests

  const note =
    count != null && extra > 0
      ? t('rooms.breakdown', {
          base: formatInr(room.pricePerNight),
          n: extra,
          extra: formatInr(room.extraGuestPrice),
        })
      : canAddGuests
        ? t(room.baseGuests === 1 ? 'rooms.includes1' : 'rooms.includes', {
            n: room.baseGuests,
            extra: formatInr(room.extraGuestPrice),
          })
        : t(room.baseGuests === 1 ? 'rooms.includesOnly1' : 'rooms.includesOnly', {
            n: room.baseGuests,
          })

  return (
    <div className={`min-w-0 border-l-2 pl-4 ${dark ? 'border-white/25' : 'border-lagoon/40'}`}>
      <p
        className={`text-[10px] font-semibold tracking-[0.18em] uppercase ${
          dark ? 'text-white/50' : 'text-muted'
        }`}
      >
        {count == null
          ? t('rooms.from')
          : t(count === 1 ? 'rooms.forGuests1' : 'rooms.forGuests', { n: count })}
      </p>
      <p
        key={amount}
        className={`animate-fade-in mt-1 font-sans text-2xl font-bold tracking-tight tabular-nums md:text-[1.75rem] ${
          dark ? 'text-white' : 'text-ink'
        }`}
      >
        {formatInr(amount)}
        <span className={`ml-1 text-sm font-normal ${dark ? 'text-white/50' : 'text-muted'}`}>
          {t('common.night')}
        </span>
      </p>
      <p className={`mt-1 text-xs ${dark ? 'text-white/55' : 'text-muted'}`}>{note}</p>
    </div>
  )
}

type RoomFilterState = { category: RoomCategoryFilter; members: number | null }

function matchesFilter(room: Room, { category, members }: RoomFilterState) {
  if (category !== 'all' && room.category !== category) return false
  if (members == null) return true
  const { min, max } = roomGuestRange(room)
  return members >= min && members <= max
}

export function RoomsPage() {
  const { t } = useLanguage()
  const {
    filter,
    listFilter,
    fading,
    apply: applyFilter,
  } = useFadedFilter<RoomFilterState>({ category: 'all', members: null })
  const [bookRoom, setBookRoom] = useState<Room | null>(null)
  const { category, members } = filter

  const changeCategory = (next: RoomCategoryFilter) => {
    if (next === category) return
    const nextMembers =
      next === 'couples' ? 2 : category === 'couples' ? null : members
    applyFilter({ category: next, members: nextMembers })
  }

  const changeMembers = (next: number | null) => {
    if (next === members) return
    applyFilter({ category, members: next })
  }

  const galleryLabels = useMemo(
    () => ({
      exterior: t('rooms.gallery.exterior'),
      bedroom: t('rooms.gallery.bedroom'),
      bathroom: t('rooms.gallery.bathroom'),
      living: t('rooms.gallery.living'),
    }),
    [t],
  )

  const { data, isLoading, isError, error } = useRooms()
  const rooms = useMemo(
    () => (data ?? []).filter((r) => matchesFilter(r, listFilter)),
    [data, listFilter],
  )
  const listMembers = listFilter.members
  const bookRange = bookRoom ? roomGuestRange(bookRoom) : null

  return (
    <ListingPageShell
      compact
      eyebrow={t('common.explore')}
      title={t('rooms.title')}
      description={t('rooms.desc')}
      filters={
        <RoomFilters
          category={category}
          onCategoryChange={changeCategory}
          members={members}
          onMembersChange={changeMembers}
        />
      }
    >
      {isLoading && <p className="px-6 py-16 text-muted md:px-16">{t('rooms.loading')}</p>}
      {isError && <p className="px-6 py-16 text-red-600 md:px-16">{(error as Error).message}</p>}

      <FadingResults fading={fading}>
        {data && rooms.length === 0 && <EmptyResults>{t('rooms.empty')}</EmptyResults>}
        {rooms.map((r, i) => {
          const dark = i % 3 === 1
          const warm = i % 3 === 2
          const range = roomGuestRange(r)
          return (
            <FeatureListing
              key={r.id}
              images={roomGallery(r, galleryLabels)}
              imageAlt={r.name}
              eyebrow={r.category}
              title={r.name}
              meta={`${r.roomType} · ${
                range.min === range.max ? range.min : `${range.min}–${range.max}`
              } ${t('common.guests')}`}
              location={r.location}
              description={r.description}
              reverse={i % 2 === 1}
              tone={dark ? 'dark' : warm ? 'warm' : 'light'}
              ratingSlot={
                r.rating ? (
                  <GoogleRating
                    rating={r.rating}
                    reviewCount={r.reviewCount}
                    snippet={r.reviewSnippet}
                    href={r.googleReviewsUrl}
                    dark={dark}
                  />
                ) : undefined
              }
              tags={
                <div className="flex flex-wrap gap-2">
                  {r.amenities?.slice(0, 5).map((a) => (
                    <span
                      key={a}
                      className={`rounded-sm px-2.5 py-1 text-[11px] tracking-wide ${
                        dark ? 'bg-white/10 text-white/80' : 'bg-sand/50 text-muted'
                      }`}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              }
              actions={
                <>
                  <RoomPrice room={r} guests={listMembers} dark={dark} />
                  <ListingButton onClick={() => setBookRoom(r)} dark={dark}>
                    {t('common.book')}
                  </ListingButton>
                </>
              }
            />
          )
        })}
      </FadingResults>

      {bookRoom && bookRange && (
        <BookingModal
          open={!!bookRoom}
          onClose={() => setBookRoom(null)}
          type="room"
          itemId={bookRoom.id}
          title={bookRoom.name}
          price={bookRoom.pricePerNight}
          priceLabel={t('common.night')}
          minGuests={bookRange.min}
          maxGuests={bookRange.max}
          initialGuests={listMembers ?? bookRoom.baseGuests}
          priceForGuests={(g) => roomPriceForGuests(bookRoom, g)}
          priceNote={(g) => {
            const extra = extraGuests(bookRoom, g)
            return extra > 0
              ? t('booking.extraGuests', { n: extra, extra: formatInr(bookRoom.extraGuestPrice) })
              : null
          }}
        />
      )}
    </ListingPageShell>
  )
}
