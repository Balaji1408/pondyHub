import AnchorIcon from '@mui/icons-material/Anchor'
import EventSeatIcon from '@mui/icons-material/EventSeat'
import { useLanguage } from '../../i18n/LanguageContext'

const SEATS_PER_ROW = 6

function Seat({
  id,
  taken,
  selected,
  onToggle,
}: {
  id: string
  taken: boolean
  selected: boolean
  onToggle: (id: string) => void
}) {
  return (
    <button
      type="button"
      disabled={taken}
      onClick={() => onToggle(id)}
      aria-pressed={selected}
      aria-label={`Seat ${id}`}
      className={`relative flex h-8 w-8 cursor-pointer flex-col items-center justify-center rounded-lg transition-all duration-300 md:h-10 md:w-10 md:rounded-xl ${
        taken
          ? 'cursor-not-allowed border-transparent bg-slate-100 text-slate-300'
          : selected
            ? 'scale-110 border-emerald-600 bg-emerald-500 text-white shadow-lg shadow-emerald-200'
            : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-500'
      }`}
    >
      <EventSeatIcon sx={{ fontSize: 13 }} className={selected ? 'animate-pulse' : ''} />
      <span className="mt-0.5 text-[8px] leading-none font-black md:text-[9px]">{id}</span>
      {selected && (
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-emerald-600 md:-top-1 md:-right-1 md:h-3 md:w-3 md:border-2" />
      )}
    </button>
  )
}

/** Deck layout: rows of three seats, an aisle, then three more, numbered 1…capacity. */
export function SeatPicker({
  capacity,
  takenSeats,
  selectedSeats,
  onToggle,
}: {
  capacity: number
  takenSeats: string[]
  selectedSeats: string[]
  onToggle: (seatId: string) => void
}) {
  const { t } = useLanguage()
  const rows: (string | null)[][] = []
  for (let start = 1; start <= capacity; start += SEATS_PER_ROW) {
    rows.push(
      Array.from({ length: SEATS_PER_ROW }, (_, i) =>
        start + i <= capacity ? String(start + i) : null,
      ),
    )
  }

  const renderSide = (seats: (string | null)[], side: string) => (
    <div className="flex gap-1 md:gap-2">
      {seats.map((id, i) =>
        id ? (
          <Seat
            key={id}
            id={id}
            taken={takenSeats.includes(id)}
            selected={selectedSeats.includes(id)}
            onToggle={onToggle}
          />
        ) : (
          <div key={`${side}-${i}`} className="h-8 w-8 md:h-10 md:w-10" />
        ),
      )}
    </div>
  )

  return (
    <div className="relative overflow-hidden rounded-[60px_60px_30px_30px] border-2 border-slate-200 bg-white px-2 pt-12 pb-8 shadow-2xl md:px-8 md:pt-16 md:pb-10">
      <div className="absolute inset-x-0 top-0 flex h-12 items-center justify-center border-b border-slate-200 bg-slate-100 md:h-16">
        <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase md:text-[10px] md:tracking-[0.3em]">
          <AnchorIcon sx={{ fontSize: 12 }} /> {t('boating.deckLayout')}
        </div>
      </div>
      <div className="absolute top-0 left-0 flex h-2 w-full justify-between px-6 md:px-10">
        <div className="h-2 w-1 rounded-full bg-slate-300 md:h-3" />
        <div className="h-2 w-1 rounded-full bg-slate-300 md:h-3" />
      </div>

      <div className="mt-4 flex w-full flex-col items-center gap-6 md:gap-8">
        <div className="flex gap-3 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-[8px] font-black tracking-widest text-slate-400 uppercase md:gap-6 md:px-4 md:py-2 md:text-[9px]">
          <span className="flex items-center gap-1.5 md:gap-2">
            <span className="h-2.5 w-2.5 rounded-sm border border-slate-200 bg-white md:h-3 md:w-3" />
            {t('boating.seatAvailable')}
          </span>
          <span className="flex items-center gap-1.5 md:gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 md:h-3 md:w-3" />
            {t('boating.seatSelected')}
          </span>
          <span className="flex items-center gap-1.5 md:gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-200 md:h-3 md:w-3" />
            {t('boating.seatBooked')}
          </span>
        </div>

        <div className="grid gap-3 md:gap-5">
          {rows.map((row, r) => (
            <div key={r} className="flex items-center gap-2 md:gap-4">
              {renderSide(row.slice(0, 3), `l${r}`)}
              <div className="flex w-4 items-center justify-center self-stretch md:w-6">
                <div className="relative h-full w-px bg-slate-100">
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 bg-white px-0.5 text-[7px] font-black whitespace-nowrap text-slate-300 uppercase md:px-1 md:text-[8px]">
                    {t('boating.aisle')}
                  </span>
                </div>
              </div>
              {renderSide(row.slice(3), `r${r}`)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
