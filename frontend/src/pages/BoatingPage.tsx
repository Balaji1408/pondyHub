import { useMemo, useState } from 'react'
import { useBoats } from '../api/hooks'
import { BookingModal } from '../components/BookingModal'
import {
  EmptyResults,
  FadingResults,
  FilterBar,
  SlidingPills,
  useFadedFilter,
  type PillOption,
} from '../components/FilterBar'
import { filterIcons } from '../components/filterIcons'
import {
  FeatureListing,
  ListingButton,
  ListingPageShell,
  ListingPrice,
} from '../components/FeatureListing'
import { useLanguage } from '../i18n/LanguageContext'
import type { Boat, BoatType } from '../types'

type TypeFilter = 'all' | Exclude<BoatType, 'ferry'>

function BoatDetails({ boat, dark }: { boat: Boat; dark: boolean }) {
  const { t } = useLanguage()
  const label = `text-[10px] font-semibold tracking-[0.18em] uppercase ${
    dark ? 'text-white/45' : 'text-muted'
  }`
  return (
    <div className="space-y-5">
      <div>
        <p className={label}>{t('boating.slots')}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {boat.slots.map((s) => (
            <span
              key={s}
              className={`px-3 py-1.5 text-xs ${
                dark ? 'bg-white/10 text-white' : 'bg-black/5 text-ink'
              }`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className={label}>{t('boating.routes')}</p>
        <div className="mt-2 space-y-2">
          {boat.routes.map((r) => (
            <div key={r.name} className={`text-sm ${dark ? 'text-white/70' : 'text-ink/70'}`}>
              <span className={dark ? 'text-white' : 'text-ink'}>
                {r.name} · {r.duration}
              </span>
              {r.stops?.length ? (
                <span className="mt-0.5 block text-xs opacity-70">{r.stops.join(' → ')}</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function BoatingPage() {
  const { t } = useLanguage()
  const { filter, listFilter, fading, apply } = useFadedFilter<TypeFilter>('all')
  const [book, setBook] = useState<Boat | null>(null)

  const options: PillOption<TypeFilter>[] = [
    { id: 'all', label: t('common.all'), icon: filterIcons.all },
    { id: 'yacht', label: t('boating.yacht'), icon: filterIcons.yacht },
    { id: 'paddle', label: t('boating.paddle'), icon: filterIcons.paddle },
    { id: 'kayak', label: t('boating.kayak'), icon: filterIcons.kayak },
    { id: 'catamaran', label: t('boating.catamaran'), icon: filterIcons.catamaran },
  ]

  const { data, isLoading, isError, error } = useBoats()
  const boats = useMemo(
    () => (data ?? []).filter((b) => listFilter === 'all' || b.type === listFilter),
    [data, listFilter],
  )

  return (
    <ListingPageShell
      compact
      eyebrow={t('common.explore')}
      title={t('boating.title')}
      description={t('boating.desc')}
      filters={
        <FilterBar>
          <SlidingPills
            options={options}
            value={filter}
            onChange={(type) => type !== filter && apply(type)}
            ariaLabel={t('boating.title')}
          />
        </FilterBar>
      }
    >
      {isLoading && <p className="px-6 py-16 text-muted md:px-16">{t('boating.loading')}</p>}
      {isError && <p className="px-6 py-16 text-red-600 md:px-16">{(error as Error).message}</p>}

      <FadingResults fading={fading}>
        {data && boats.length === 0 && <EmptyResults>{t('common.noMatch')}</EmptyResults>}
        {boats.map((b, i) => {
          const dark = i % 3 === 1
          const warm = i % 3 === 2
          return (
            <FeatureListing
              key={b.id}
              image={b.images[0]}
              imageAlt={b.name}
              eyebrow={b.type}
              title={b.name}
              meta={`${t('vehicles.seats', { n: b.seats })} · ★ ${b.rating}`}
              location={b.routes[0]?.stops?.[0] ?? t('boating.departureLocation')}
              description={b.description}
              reverse={i % 2 === 1}
              tone={dark ? 'dark' : warm ? 'warm' : 'light'}
              tags={<BoatDetails boat={b} dark={dark} />}
              actions={
                <>
                  <ListingPrice amount={b.price} suffix={t('boating.perTrip')} dark={dark} />
                  <ListingButton onClick={() => setBook(b)} dark={dark}>
                    {t('boating.bookSlot')}
                  </ListingButton>
                </>
              }
            />
          )
        })}
      </FadingResults>

      {book && (
        <BookingModal
          open={!!book}
          onClose={() => setBook(null)}
          type="boat"
          itemId={book.id}
          title={book.name}
          price={book.price}
          priceLabel={t('boating.perTrip')}
          maxGuests={book.seats}
          slots={book.slots}
          routesSummary={book.routes.map((r) => `${r.name} (${r.duration})`).join('; ')}
        />
      )}
    </ListingPageShell>
  )
}
