import { useLanguage } from '../i18n/LanguageContext'
import { FilterBar, FilterDivider, SlidingPills, type PillOption } from './FilterBar'
import { filterIcons as icons } from './filterIcons'

export type RoomCategoryFilter = 'all' | 'couples' | 'family' | 'friends'

const MAX_GUESTS = 12

const stepBtn =
  'flex h-8 w-8 items-center justify-center rounded-lg text-base text-ink transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink'

export function RoomFilters({
  category,
  onCategoryChange,
  members,
  onMembersChange,
}: {
  category: RoomCategoryFilter
  onCategoryChange: (c: RoomCategoryFilter) => void
  members: number | null
  onMembersChange: (n: number | null) => void
}) {
  const { t } = useLanguage()
  const locked = category === 'couples'

  const options: PillOption<RoomCategoryFilter>[] = [
    { id: 'all', label: t('rooms.allStays'), hint: t('rooms.hint.all'), icon: icons.all },
    { id: 'couples', label: t('rooms.couples'), hint: t('rooms.hint.couples'), icon: icons.couples },
    { id: 'family', label: t('rooms.family'), hint: t('rooms.hint.family'), icon: icons.family },
    { id: 'friends', label: t('rooms.friends'), hint: t('rooms.hint.friends'), icon: icons.friends },
  ]

  const bump = (delta: number) => {
    if (members == null) {
      onMembersChange(delta > 0 ? 2 : 1)
      return
    }
    onMembersChange(Math.min(MAX_GUESTS, Math.max(1, members + delta)))
  }

  const caption = locked
    ? t('rooms.hint.couples')
    : members == null
      ? t('rooms.guests')
      : members === 1
        ? t('common.member1')
        : t('common.memberN', { n: members })

  return (
    <FilterBar>
      <SlidingPills
        options={options}
        value={category}
        onChange={onCategoryChange}
        ariaLabel={t('rooms.who')}
      />

      <FilterDivider />

      <div
        role="group"
        aria-label={t('rooms.guests')}
        title={locked ? t('rooms.couplesLocked') : undefined}
        className={`flex h-10 items-center gap-1 rounded-xl px-1 ${locked ? 'bg-mist/70' : 'bg-surface/60'}`}
      >
        <button
          type="button"
          onClick={() => bump(-1)}
          disabled={locked || members === 1}
          aria-label={t('common.decrease')}
          className={stepBtn}
        >
          −
        </button>
        <div className="min-w-[5.5rem] text-center leading-none" aria-live="polite">
          <p
            key={members ?? 'any'}
            className="animate-fade-in flex items-center justify-center gap-1 text-sm font-semibold tabular-nums text-ink"
          >
            {locked && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 text-lagoon" aria-hidden>
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
            )}
            {members ?? t('common.any')}
          </p>
          <p className="mt-1 max-w-[7.5rem] truncate text-[10px] text-muted">{caption}</p>
        </div>
        <button
          type="button"
          onClick={() => bump(1)}
          disabled={locked || members === MAX_GUESTS}
          aria-label={t('common.increase')}
          className={stepBtn}
        >
          +
        </button>
        {!locked && members != null && (
          <button
            type="button"
            onClick={() => onMembersChange(null)}
            aria-label={t('rooms.anySize')}
            title={t('rooms.anySize')}
            className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-ink hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </FilterBar>
  )
}
