import { useMemo, useState } from 'react'
import { usePlaces } from '../api/hooks'
import { CategoryChips } from '../components/CategoryChips'
import { FeatureListing, ListingPageShell } from '../components/FeatureListing'
import { GoogleRating } from '../components/GoogleRating'
import { useLanguage } from '../i18n/LanguageContext'
import type { Place } from '../types'

function formatTime(t: string | null) {
  if (!t) return null
  return t.slice(0, 5)
}

export function CafesPage() {
  const { t } = useLanguage()
  const [cat, setCat] = useState('all')
  const [openOnly, setOpenOnly] = useState(false)

  const chips = useMemo(
    () => [
      { id: 'all', label: t('common.all') },
      { id: 'cafe', label: t('cafes.cafe') },
      { id: 'restaurant', label: t('cafes.restaurant') },
      { id: 'roadside', label: t('cafes.roadside') },
    ],
    [t],
  )

  const query = useMemo(() => {
    const q: Record<string, string> = {
      kind: cat === 'all' ? 'cafe,restaurant,roadside' : cat,
    }
    if (openOnly) q.openNow = 'true'
    return q
  }, [cat, openOnly])

  const { data, isLoading, isError, error } = usePlaces(query)

  return (
    <ListingPageShell
      eyebrow={t('common.explore')}
      title={t('cafes.title')}
      description={t('cafes.desc')}
      filters={
        <>
          <CategoryChips chips={chips} active={cat} onChange={setCat} />
          <label className="flex h-9 shrink-0 items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => setOpenOnly(e.target.checked)}
              className="size-4 accent-accent"
            />
            {t('cafes.openNow')}
          </label>
        </>
      }
    >
      {isLoading && <p className="px-6 py-16 text-muted md:px-16">{t('common.loading')}</p>}
      {isError && <p className="px-6 py-16 text-red-600 md:px-16">{(error as Error).message}</p>}
      <PlaceListings places={data} showHours showOpenBadge />
    </ListingPageShell>
  )
}

export function BeachesPage() {
  const { t } = useLanguage()
  const { data, isLoading, isError, error } = usePlaces({ kind: 'beach' })
  const seafood = usePlaces({ seafood: 'true' })

  return (
    <ListingPageShell
      eyebrow={t('common.explore')}
      title={t('beaches.title')}
      description={t('beaches.desc')}
    >
      {isLoading && <p className="px-6 py-16 text-muted md:px-16">{t('beaches.loading')}</p>}
      {isError && <p className="px-6 py-16 text-red-600 md:px-16">{(error as Error).message}</p>}

      {data?.map((beach, i) => {
        const dark = i % 3 === 1
        const warm = i % 3 === 2
        const nearby = seafood.data?.filter((s) => s.nearBeachId === beach.id) ?? []
        return (
          <FeatureListing
            key={beach.id}
            image={beach.images[0]}
            imageAlt={beach.name}
            eyebrow={t('beaches.beach')}
            title={beach.name}
            location={beach.location}
            description={beach.description ?? undefined}
            reverse={i % 2 === 1}
            tone={dark ? 'dark' : warm ? 'warm' : 'light'}
            tags={
              <div className="space-y-4">
                {beach.bestVisitTime && (
                  <p className={`text-sm ${dark ? 'text-white/80' : 'text-accent'}`}>
                    {t('beaches.bestTime', { time: beach.bestVisitTime })}
                  </p>
                )}
                <div>
                  <p
                    className={`text-[10px] font-semibold tracking-[0.18em] uppercase ${
                      dark ? 'text-white/45' : 'text-muted'
                    }`}
                  >
                    {t('beaches.seafoodSpots')}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {nearby.map((s) => (
                      <span
                        key={s.id}
                        className={`px-3 py-1 text-xs ${
                          dark ? 'bg-white/10 text-white' : 'bg-black/5 text-ink'
                        }`}
                      >
                        {s.name}
                        {s.openNow ? ` · ${t('common.open')}` : ''}
                      </span>
                    ))}
                    {nearby.length === 0 && (
                      <span className={`text-xs ${dark ? 'text-white/50' : 'text-muted'}`}>
                        {t('beaches.seeCafes')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            }
          />
        )
      })}
    </ListingPageShell>
  )
}

export function BarsPage() {
  const { t } = useLanguage()
  const { data, isLoading, isError, error } = usePlaces({ kind: 'bar' })

  return (
    <ListingPageShell eyebrow={t('common.explore')} title={t('bars.title')} description={t('bars.desc')}>
      {isLoading && <p className="px-6 py-16 text-muted md:px-16">{t('common.loading')}</p>}
      {isError && <p className="px-6 py-16 text-red-600 md:px-16">{(error as Error).message}</p>}
      <PlaceListings places={data} showHours showOpenBadge />
    </ListingPageShell>
  )
}

export function FoodStreetPage() {
  const { t } = useLanguage()
  const { data, isLoading, isError, error } = usePlaces({ kind: 'foodstreet' })

  return (
    <ListingPageShell
      eyebrow={t('common.explore')}
      title={t('foodStreet.title')}
      description={t('foodStreet.desc')}
    >
      {isLoading && <p className="px-6 py-16 text-muted md:px-16">{t('common.loading')}</p>}
      {isError && <p className="px-6 py-16 text-red-600 md:px-16">{(error as Error).message}</p>}
      <GalleryPlaces places={data} />
    </ListingPageShell>
  )
}

export function WhiteTownPage() {
  const { t } = useLanguage()
  const { data, isLoading, isError, error } = usePlaces({ kind: 'whitetown' })

  return (
    <ListingPageShell
      eyebrow={t('common.explore')}
      title={t('whiteTown.title')}
      description={t('whiteTown.desc')}
    >
      {isLoading && <p className="px-6 py-16 text-muted md:px-16">{t('common.loading')}</p>}
      {isError && <p className="px-6 py-16 text-red-600 md:px-16">{(error as Error).message}</p>}
      <GalleryPlaces places={data} />
    </ListingPageShell>
  )
}

function PlaceListings({
  places,
  showHours,
  showOpenBadge,
}: {
  places?: Place[]
  showHours?: boolean
  showOpenBadge?: boolean
}) {
  const { t } = useLanguage()

  return (
    <>
      {places?.map((p, i) => {
        const dark = i % 3 === 1
        const warm = i % 3 === 2
        return (
          <FeatureListing
            key={p.id}
            image={p.images[0]}
            imageAlt={p.name}
            eyebrow={
              showOpenBadge && p.opensAt
                ? p.openNow
                  ? `${p.kind} · ${t('common.openNow')}`
                  : `${p.kind} · ${t('common.closed')}`
                : p.kind
            }
            title={p.name}
            location={p.location}
            description={p.description ?? undefined}
            reverse={i % 2 === 1}
            tone={dark ? 'dark' : warm ? 'warm' : 'light'}
            ratingSlot={
              p.rating ? (
                <GoogleRating
                  rating={p.rating}
                  reviewCount={p.reviewCount}
                  snippet={p.reviewSnippet}
                  href={p.googleReviewsUrl}
                  dark={dark}
                />
              ) : undefined
            }
            tags={
              <div className="space-y-3">
                {showHours && p.opensAt && p.closesAt && (
                  <p className={`text-sm ${dark ? 'text-white/70' : 'text-accent'}`}>
                    {formatTime(p.opensAt)} – {formatTime(p.closesAt)}
                  </p>
                )}
                {p.isSeafoodSpot && (
                  <span
                    className={`inline-block px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase ${
                      dark ? 'bg-white/10 text-white' : 'bg-black/5 text-ink'
                    }`}
                  >
                    {t('common.seafood')}
                  </span>
                )}
              </div>
            }
          />
        )
      })}
    </>
  )
}

function GalleryPlaces({ places }: { places?: Place[] }) {
  const { t } = useLanguage()

  return (
    <>
      {places?.map((p, i) => {
        const dark = i % 3 === 1
        const warm = i % 3 === 2
        return (
          <FeatureListing
            key={p.id}
            image={p.images[0]}
            imageAlt={p.name}
            eyebrow={t('hero.eyebrow')}
            title={p.name}
            meta={
              [
                p.bestVisitTime ? t('common.bestTime', { time: p.bestVisitTime }) : null,
                p.opensAt && p.closesAt
                  ? `${formatTime(p.opensAt)} – ${formatTime(p.closesAt)}${p.openNow ? ` · ${t('common.openNow')}` : ''}`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ') || undefined
            }
            description={p.description ?? undefined}
            reverse={i % 2 === 1}
            tone={dark ? 'dark' : warm ? 'warm' : 'light'}
          />
        )
      })}
    </>
  )
}
