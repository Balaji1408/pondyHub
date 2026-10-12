import { useMemo, useState } from 'react'
import { useRooms } from '../api/hooks'
import { EmptyResults, FadingResults, useFadedFilter } from '../components/FilterBar'
import { RoomFilters, type RoomCategoryFilter } from '../components/RoomFilters'
import { BookingModal } from '../components/BookingModal'
import { FeatureListing, ListingButton, ListingPageShell } from '../components/FeatureListing'
import { GoogleRating } from '../components/GoogleRating'
import type { GalleryImage } from '../components/ImageAccordion'
import { useLanguage } from '../i18n/LanguageContext'
import { GALLERY_SLOTS, roomGallerySources } from '../lib/roomGallery'
import { extraGuests, formatInr, roomGuestRange, roomPriceForGuests } from '../lib/roomPricing'
import type { GallerySlot, Room } from '../types'

function roomGallery(room: Room, labels: Record<GallerySlot, string>): GalleryImage[] {
  const sources = roomGallerySources(room)
  return GALLERY_SLOTS.map((slot) => ({ src: sources[slot], label: labels[slot] }))
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
