import dayjs from 'dayjs'

/** "16:00" → "4:00 PM" */
export function formatTime(hhmm: string | null | undefined) {
  if (!hhmm) return '--:--'
  const [h, m] = hhmm.split(':')
  const hour = Number(h)
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
}

export function formatJourneyDate(date: string) {
  return dayjs(date).format('DD MMM YYYY')
}

/** Phone input shown as "98765 43210". */
export function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  return digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits
}

export const boatGradient = 'linear-gradient(135deg, #0284c7, #06b6d4)'
export const manifestGradient = 'linear-gradient(135deg, #06b6d4, #0891b2)'
export const fareGradient = 'linear-gradient(135deg, #083344, #155e75)'
