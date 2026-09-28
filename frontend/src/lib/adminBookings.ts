export function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatLongDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateTime(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatMoney(n: number | null) {
  if (n == null) return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

export function typeLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function statusTone(status: string, light: boolean) {
  if (light) {
    switch (status) {
      case 'confirmed':
        return 'bg-[#e8f2dc] text-[#3d6b1f]'
      case 'cancelled':
        return 'bg-[#f8e8e4] text-[#9a3d32]'
      case 'completed':
        return 'bg-[#e4eef8] text-[#1e4f7a]'
      default:
        return 'bg-[#f0ebe3] text-[#6b6560]'
    }
  }
  switch (status) {
    case 'confirmed':
      return 'bg-[#c8f14a]/15 text-[#c8f14a]'
    case 'cancelled':
      return 'bg-[#ff6b6b]/15 text-[#ff8a8a]'
    case 'completed':
      return 'bg-[#4da3ff]/15 text-[#7bb8ff]'
    default:
      return 'bg-white/5 text-[#a3a3a3]'
  }
}
