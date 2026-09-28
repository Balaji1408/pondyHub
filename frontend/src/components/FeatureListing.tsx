import type { ReactNode } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { googleMapsSearchUrl } from '../lib/maps'
import { ImageAccordion, type GalleryImage } from './ImageAccordion'
import { BlurFade } from './ui/BlurFade'
import { ShimmerButton } from './ui/ShimmerButton'
import { TextReveal } from './ui/TextReveal'

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  )
}

export function LocationLink({
  location,
  dark = false,
  className = '',
}: {
  location: string
  dark?: boolean
  className?: string
}) {
  const { t } = useLanguage()
  const href = googleMapsSearchUrl(location)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={t('common.viewOnMap')}
      aria-label={`${t('common.viewOnMap')}: ${location}`}
      className={`inline-flex max-w-full items-center gap-1.5 underline-offset-4 transition hover:underline ${
        dark ? 'text-white/70 hover:text-white' : 'text-muted hover:text-ink'
      } ${className}`}
    >
      <MapPinIcon
        className={`h-3.5 w-3.5 shrink-0 ${dark ? 'text-red-400' : 'text-red-600'}`}
      />
      <span className="truncate">{location}</span>
    </a>
  )
}

export function ListingPageShell({
  eyebrow = 'Explore',
  title,
  description,
  filters,
  compact = false,
  children,
}: {
  eyebrow?: string
  title: string
  description: string
  filters?: ReactNode
  /** Short header with filters beside the title, so listings show above the fold. */
  compact?: boolean
  children: ReactNode
}) {
  if (compact) {
    return (
      <div className="pt-16 md:pt-[4.25rem]">
        <header className="listing-shell-bg border-b border-sand/60 px-6 py-5 md:px-10 md:py-6 lg:px-16">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between xl:gap-8">
            <div className="min-w-0">
              <p className="animate-listing-reveal font-display text-sm italic text-muted md:text-base">
                {eyebrow}
              </p>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <TextReveal
                  text={title}
                  as="h1"
                  stagger={0.05}
                  className="block font-sans text-3xl font-extrabold tracking-tight text-ink md:text-4xl lg:text-5xl"
                />
                <p
                  className="animate-listing-reveal text-sm text-muted"
                  style={{ animationDelay: '0.16s' }}
                >
                  {description}
                </p>
              </div>
            </div>
            {filters && (
              <div className="animate-listing-reveal min-w-0" style={{ animationDelay: '0.24s' }}>
                {filters}
              </div>
            )}
          </div>
        </header>
        <div className="flex flex-col">{children}</div>
      </div>
    )
  }

  return (
    <div className="pt-20 md:pt-24">
      <header className="listing-shell-bg border-b border-sand/60 px-6 pb-12 pt-12 md:px-10 md:pb-16 md:pt-16 lg:px-16">
        <p className="animate-listing-reveal font-display text-lg italic text-muted md:text-xl">
          {eyebrow}
        </p>
        <TextReveal
          text={title}
          as="h1"
          stagger={0.05}
          className="mt-3 block font-sans text-4xl font-extrabold tracking-tight text-ink sm:text-5xl md:text-6xl lg:text-7xl"
        />
        <p
          className="animate-listing-reveal mt-5 max-w-xl text-sm leading-relaxed text-muted md:text-base"
          style={{ animationDelay: '0.16s' }}
        >
          {description}
        </p>
        {filters && (
          <div
            className="animate-listing-reveal mt-9 flex flex-col items-start gap-4"
            style={{ animationDelay: '0.24s' }}
          >
            {filters}
          </div>
        )}
      </header>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

export function FeatureListing({
  image,
  images,
  imageAlt,
  eyebrow,
  title,
  meta,
  location,
  description,
  ratingSlot,
  tags,
  actions,
  reverse = false,
  tone = 'light',
}: {
  image?: string
  images?: GalleryImage[]
  imageAlt: string
  eyebrow?: string
  title: string
  meta?: string
  location?: string | null
  description?: string
  ratingSlot?: ReactNode
  tags?: ReactNode
  actions?: ReactNode
  reverse?: boolean
  tone?: 'light' | 'warm' | 'dark'
}) {
  const panel =
    tone === 'dark'
      ? 'bg-ink text-white'
      : tone === 'warm'
        ? 'bg-[#dce6e4] text-ink'
        : 'bg-surface/80 text-ink backdrop-blur-[2px]'

  const muted = tone === 'dark' ? 'text-white/55' : 'text-muted'
  const body = tone === 'dark' ? 'text-white/75' : 'text-ink/70'
  const dark = tone === 'dark'
  const hasMetaRow = Boolean(meta || location)
  const gallery =
    images && images.length > 0
      ? images
      : image
        ? [{ src: image, label: imageAlt }]
        : []

  return (
    <article className="group grid w-full grid-cols-1 overflow-hidden lg:min-h-[70vh] lg:grid-cols-2">
      <div
        className={`relative min-h-[300px] overflow-hidden sm:min-h-[400px] lg:min-h-full ${
          reverse ? 'lg:order-2' : 'lg:order-1'
        }`}
      >
        <ImageAccordion images={gallery} alt={imageAlt} />
        {gallery.length <= 1 && (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/20 via-transparent to-transparent opacity-60 lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-ink/10"
            aria-hidden
          />
        )}
      </div>

      <div
        className={`flex flex-col justify-center px-6 py-14 sm:px-10 md:px-14 md:py-20 lg:px-16 xl:px-24 ${panel} ${
          reverse ? 'lg:order-1' : 'lg:order-2'
        }`}
      >
        {eyebrow && (
          <p className={`text-[11px] font-semibold tracking-[0.22em] uppercase ${muted}`}>{eyebrow}</p>
        )}
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl md:leading-[1.08]">
          <BlurFade yOffset={16} delay={0.05}>
            {title}
          </BlurFade>
        </h2>
        {ratingSlot && <div className="mt-4">{ratingSlot}</div>}
        {hasMetaRow && (
          <p className={`mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm md:text-base ${muted}`}>
            {meta && <span>{meta}</span>}
            {meta && location && <span aria-hidden>·</span>}
            {location && <LocationLink location={location} dark={dark} />}
          </p>
        )}
        {description && (
          <p className={`mt-5 max-w-md text-sm leading-relaxed md:text-base ${body}`}>{description}</p>
        )}
        {tags && <div className="mt-8">{tags}</div>}
        {actions && <div className="mt-10 flex flex-wrap items-center gap-5">{actions}</div>}
      </div>
    </article>
  )
}

export function ListingPrice({
  amount,
  suffix,
  dark = false,
}: {
  amount: number
  suffix: string
  dark?: boolean
}) {
  return (
    <p className={`font-sans text-xl font-bold tracking-tight md:text-2xl ${dark ? 'text-white' : 'text-ink'}`}>
      ₹{amount.toLocaleString('en-IN')}
      <span className={`ml-1 text-sm font-normal ${dark ? 'text-white/50' : 'text-muted'}`}>{suffix}</span>
    </p>
  )
}

export function ListingButton({
  onClick,
  children,
  dark = false,
}: {
  onClick: () => void
  children: ReactNode
  dark?: boolean
}) {
  return (
    <ShimmerButton
      onClick={onClick}
      background={dark ? 'rgba(255,255,255,1)' : 'rgba(12,20,25,1)'}
      shimmerColor={dark ? 'rgba(12,20,25,0.35)' : '#ffffff'}
      className={`px-6 py-3 text-[11px] font-semibold tracking-[0.16em] uppercase ${
        dark
          ? 'border-ink/15 !text-ink [&_span]:!text-ink'
          : 'border-white/10 !text-white [&_span]:!text-white'
      }`}
    >
      {children}
    </ShimmerButton>
  )
}
