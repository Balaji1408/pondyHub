import { useEffect, useRef, useState, type ReactNode } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { toPng } from 'html-to-image'
import AnchorIcon from '@mui/icons-material/Anchor'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined'
import EventSeatIcon from '@mui/icons-material/EventSeat'
import DownloadIcon from '@mui/icons-material/Download'
import CloseIcon from '@mui/icons-material/Close'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatJourneyDate, formatTime } from '../../lib/boating'
import type { BoatBookingResult } from '../../types'
import { SunsetMark } from '../ui/SunsetMark'

function Detail({
  icon,
  tone,
  label,
  value,
}: {
  icon: ReactNode
  tone: string
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="mb-0.5 text-[8px] leading-none font-black tracking-widest text-slate-400 uppercase">
          {label}
        </div>
        <div className="truncate text-xs leading-tight font-black text-slate-800 uppercase">
          {value}
        </div>
      </div>
    </div>
  )
}

export function BoatTicketModal({
  booking,
  onClose,
}: {
  booking: BoatBookingResult
  onClose: () => void
}) {
  const { t } = useLanguage()
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const qrValue = JSON.stringify({
    pnr: booking.pnr,
    ref: booking.confirmationId,
    boat: booking.boat.name,
    date: booking.date,
    slot: booking.timeSlot.name ?? booking.timeSlot.startTime,
    guest: booking.guestName,
    seats: booking.guests,
    seat_numbers: booking.seats.join(', '),
  })

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, backgroundColor: '#ffffff' })
      const fileName = `PondyTripora-Boating-${booking.pnr}.png`
      // Android WebViews ignore <a download>; the Pondy Tripora app exposes a native saver instead.
      if (window.PondyHubApp?.saveImage) {
        window.PondyHubApp.saveImage(dataUrl, fileName)
        return
      }
      const link = document.createElement('a')
      link.download = fileName
      link.href = dataUrl
      link.click()
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('boating.bookingConfirmed')}
        className="no-scrollbar relative max-h-[95vh] w-full max-w-sm overflow-y-auto rounded-[2rem] bg-white shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('booking.close')}
          className="absolute top-4 right-4 z-10 flex cursor-pointer rounded-full bg-slate-100 p-2 text-slate-400 transition-all hover:bg-slate-200 hover:text-slate-600"
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </button>

        <div ref={cardRef} className="bg-white p-8">
          <div className="mb-6 text-center">
            <div className="mb-4 flex items-center justify-center gap-2 text-slate-900">
              <SunsetMark className="h-9 w-9" />
              <span className="text-sm font-black tracking-[0.3em] uppercase">Pondy Tripora</span>
            </div>
            <h2 className="text-2xl font-black tracking-tighter text-slate-800 uppercase italic">
              {t('boating.bookingConfirmed')}
            </h2>
            <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              PNR: {booking.pnr}
            </p>
            <p className="mt-0.5 text-[9px] font-bold tracking-widest text-slate-300 uppercase">
              {t('booking.confirmation')}: {booking.confirmationId}
            </p>
          </div>

          <div className="relative mb-6 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-6">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <QRCodeSVG value={qrValue} size={150} level="H" />
            </div>
            <div className="absolute top-1/2 -left-3 hidden h-6 w-6 -translate-y-1/2 rounded-full border-r-2 border-dashed border-slate-200 bg-white sm:block" />
            <div className="absolute top-1/2 -right-3 hidden h-6 w-6 -translate-y-1/2 rounded-full border-l-2 border-dashed border-slate-200 bg-white sm:block" />
            <p className="mt-4 text-[9px] font-black tracking-[0.3em] text-slate-400 uppercase">
              {t('boating.scanToValidate')}
            </p>
          </div>

          <div className="space-y-4">
            <Detail
              icon={<AnchorIcon sx={{ fontSize: 16 }} />}
              tone="bg-orange-100 text-orange-600"
              label={t('boating.vessel')}
              value={booking.boat.name}
            />
            <div className="grid grid-cols-2 gap-4">
              <Detail
                icon={<CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />}
                tone="bg-cyan-100 text-cyan-600"
                label={t('booking.date')}
                value={formatJourneyDate(booking.date)}
              />
              <Detail
                icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
                tone="bg-indigo-100 text-indigo-600"
                label={t('booking.slot')}
                value={`${booking.timeSlot.name ?? ''} ${formatTime(booking.timeSlot.startTime)}`.trim()}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Detail
                icon={<ConfirmationNumberOutlinedIcon sx={{ fontSize: 16 }} />}
                tone="bg-emerald-100 text-emerald-600"
                label={t('boating.tickets')}
                value={`${booking.adultSeats}A${booking.childSeats > 0 ? ` + ${booking.childSeats}C` : ''}`}
              />
              <Detail
                icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
                tone="bg-amber-100 text-amber-600"
                label={t('boating.reporting')}
                value={formatTime(booking.timeSlot.reportingTime ?? booking.timeSlot.startTime)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Detail
                icon={<PersonOutlineIcon sx={{ fontSize: 16 }} />}
                tone="bg-slate-100 text-slate-600"
                label={t('boating.fullName')}
                value={booking.guestName}
              />
              <Detail
                icon={<EventSeatIcon sx={{ fontSize: 16 }} />}
                tone="bg-purple-100 text-purple-600"
                label={t('boating.seats')}
                value={booking.seats.join(', ')}
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                {t('boating.totalPayable')}
              </span>
              <span className="text-lg font-black tracking-tight text-slate-900 italic">
                ₹{booking.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 bg-slate-50 p-6">
          {booking.autoAssignedSeats.length > 0 && (
            <p className="text-center text-[11px] font-semibold text-slate-500">
              {t('boating.autoAssigned', { seats: booking.autoAssignedSeats.join(', ') })}
            </p>
          )}
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={downloading}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-cyan-600 py-4 text-[12px] font-black tracking-widest text-white uppercase shadow-lg shadow-cyan-200 transition-all hover:bg-cyan-700 active:scale-[0.98] disabled:opacity-60"
          >
            <DownloadIcon sx={{ fontSize: 18 }} /> {t('boating.downloadTicket')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white py-4 text-[12px] font-black tracking-widest text-slate-600 uppercase transition-all hover:bg-slate-50 active:scale-[0.98]"
          >
            {t('boating.backToFleet')}
          </button>
          <p className="text-center text-[10px] text-slate-400">{t('booking.noPayment')}</p>
        </div>
      </div>
    </div>
  )
}
