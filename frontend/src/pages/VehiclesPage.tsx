import { useMemo, useState } from 'react'
import { useVehicles } from '../api/hooks'
import { BookingModal } from '../components/BookingModal'
import {
  EmptyResults,
  FadingResults,
  FilterBar,
  FilterDivider,
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
import type { Vehicle, VehicleType } from '../types'

type TypeFilter = 'all' | VehicleType
type DriverFilter = 'all' | 'self' | 'driver'
type VehicleFilterState = { type: TypeFilter; driver: DriverFilter }

function matchesFilter(v: Vehicle, { type, driver }: VehicleFilterState) {
  if (type !== 'all' && v.type !== type) return false
  if (driver === 'self' && v.withDriver) return false
  if (driver === 'driver' && !v.withDriver) return false
  return true
}

export function VehiclesPage() {
  const { t } = useLanguage()
  const { filter, listFilter, fading, apply } = useFadedFilter<VehicleFilterState>({
    type: 'all',
    driver: 'all',
  })
  const [book, setBook] = useState<Vehicle | null>(null)

  const typeOptions: PillOption<TypeFilter>[] = [
    { id: 'all', label: t('common.all'), icon: filterIcons.all },
    { id: 'bike', label: t('vehicles.bikes'), icon: filterIcons.bike },
    { id: 'scooter', label: t('vehicles.scooters'), icon: filterIcons.scooter },
    { id: 'car', label: t('vehicles.cars'), icon: filterIcons.car },
  ]

  const driverOptions: PillOption<DriverFilter>[] = [
    { id: 'all', label: t('vehicles.anyDriver'), icon: filterIcons.anyDriver },
    { id: 'self', label: t('vehicles.selfDrive'), icon: filterIcons.selfDrive },
    { id: 'driver', label: t('vehicles.withDriver'), icon: filterIcons.withDriver },
  ]

  const { data, isLoading, isError, error } = useVehicles()
  const vehicles = useMemo(
    () => (data ?? []).filter((v) => matchesFilter(v, listFilter)),
    [data, listFilter],
  )

  return (
    <ListingPageShell
      compact
      eyebrow={t('common.explore')}
      title={t('vehicles.title')}
      description={t('vehicles.desc')}
      filters={
        <FilterBar>
          <SlidingPills
            options={typeOptions}
            value={filter.type}
            onChange={(type) => type !== filter.type && apply({ ...filter, type })}
            ariaLabel={t('vehicles.title')}
          />
          <FilterDivider />
          <SlidingPills
            options={driverOptions}
            value={filter.driver}
            onChange={(driver) => driver !== filter.driver && apply({ ...filter, driver })}
            ariaLabel={t('vehicles.anyDriver')}
          />
        </FilterBar>
      }
    >
      {isLoading && <p className="px-6 py-16 text-muted md:px-16">{t('vehicles.loading')}</p>}
      {isError && <p className="px-6 py-16 text-red-600 md:px-16">{(error as Error).message}</p>}

      <FadingResults fading={fading}>
        {data && vehicles.length === 0 && <EmptyResults>{t('common.noMatch')}</EmptyResults>}
        {vehicles.map((v, i) => {
          const dark = i % 3 === 1
          const warm = i % 3 === 2
          return (
            <FeatureListing
              key={v.id}
              image={v.images[0]}
              imageAlt={v.name}
              eyebrow={v.type}
              title={v.name}
              meta={`${v.withDriver ? t('vehicles.withDriver') : t('vehicles.selfDrive')} · ${t('vehicles.seats', { n: v.seats })}`}
              location={t('vehicles.pickupLocation')}
              description={v.description}
              reverse={i % 2 === 1}
              tone={dark ? 'dark' : warm ? 'warm' : 'light'}
              actions={
                <>
                  <ListingPrice amount={v.pricePerDay} suffix={t('common.day')} dark={dark} />
                  <ListingButton onClick={() => setBook(v)} dark={dark}>
                    {t('vehicles.rent')}
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
          type="vehicle"
          itemId={book.id}
          title={book.name}
          price={book.pricePerDay}
          priceLabel={t('common.day')}
          maxGuests={book.seats}
          extras={{ withDriver: book.withDriver }}
        />
      )}
    </ListingPageShell>
  )
}
