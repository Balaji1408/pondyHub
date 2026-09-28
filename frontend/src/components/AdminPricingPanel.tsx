import { useMemo, useState } from 'react'
import { useAdminCatalog, useUpdateItemPrice } from '../api/hooks'
import type { AdminPriceItem, PriceFields, PriceKind } from '../types'

type FieldKey = keyof PriceFields

type FieldDef = { key: FieldKey; unit: string; allowZero?: boolean }

const COPY: Record<PriceKind, { title: string; fields: FieldDef[] }> = {
  rooms: {
    title: 'Room prices',
    fields: [
      { key: 'price', unit: 'per night' },
      { key: 'extraGuestPrice', unit: 'extra guest', allowZero: true },
    ],
  },
  vehicles: { title: 'Vehicle prices', fields: [{ key: 'price', unit: 'per day' }] },
  boats: { title: 'Boating prices', fields: [{ key: 'price', unit: 'per trip' }] },
}

function formatMoney(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

function parsePrice(value: string, allowZero = false) {
  if (value.trim() === '') return null
  const n = Number(value)
  const min = allowZero ? 0 : Number.MIN_VALUE
  return Number.isFinite(n) && n >= min && n <= 10_000_000 ? n : null
}

export function AdminPricingPanel({
  kind,
  light,
  accent,
  onSaved,
}: {
  kind: PriceKind
  light: boolean
  accent: string
  onSaved: (message: string) => void
}) {
  const catalog = useAdminCatalog()
  const updatePrice = useUpdateItemPrice()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [query, setQuery] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { title, fields } = COPY[kind]

  const items = useMemo(() => {
    const list = catalog.data?.[kind] ?? []
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (i) => i.name.toLowerCase().includes(q) || i.detail.toLowerCase().includes(q)
    )
  }, [catalog.data, kind, query])

  const draftKey = (id: number, field: FieldKey) => `${kind}:${id}:${field}`

  function pendingChanges(item: AdminPriceItem) {
    const changes: PriceFields = {}
    let invalid = false
    for (const f of fields) {
      const raw = drafts[draftKey(item.id, f.key)] ?? ''
      if (raw === '') continue
      const parsed = parsePrice(raw, f.allowZero)
      if (parsed == null) invalid = true
      else if (parsed !== (item[f.key] ?? 0)) changes[f.key] = parsed
    }
    return { changes, invalid }
  }

  async function save(item: AdminPriceItem) {
    const { changes, invalid } = pendingChanges(item)
    if (invalid || Object.keys(changes).length === 0) return
    setError(null)
    setSavingId(item.id)
    try {
      await updatePrice.mutateAsync({ kind, id: item.id, fields: changes })
      setDrafts((d) => {
        const next = { ...d }
        for (const f of fields) delete next[draftKey(item.id, f.key)]
        return next
      })
      const summary = fields
        .filter((f) => changes[f.key] != null)
        .map((f) => `${formatMoney(changes[f.key]!)} ${f.unit}`)
        .join(', ')
      onSaved(`${item.name} updated: ${summary}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSavingId(null)
    }
  }

  const muted = light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'

  return (
    <section
      className={`overflow-hidden rounded-[28px] transition-colors ${
        light
          ? 'border border-[#e8e4dc] bg-white shadow-[0_12px_40px_-24px_rgba(20,20,20,0.12)]'
          : 'bg-[#22222a] shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'
      }`}
    >
      <div
        className={`flex flex-col gap-4 border-b px-5 py-5 md:flex-row md:items-end md:justify-between md:px-7 md:py-6 ${
          light ? 'border-[#efeae2]' : 'border-white/[0.06]'
        }`}
      >
        <div>
          <p className={`text-[12px] font-medium ${light ? 'text-[#8a847a]' : 'text-[#7a7a7a]'}`}>
            Pricing
          </p>
          <h2
            className={`mt-1 text-xl font-semibold tracking-tight ${
              light ? 'text-[#0a0a0a]' : 'text-white'
            }`}
          >
            {title}
          </h2>
          <p className={`mt-1 text-sm ${muted}`}>
            Changes go live on the website as soon as you save.
            {kind === 'rooms' &&
              ' The nightly price covers the included guests; each extra guest adds the extra guest price.'}
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or type"
          className={`rounded-full px-4 py-2.5 text-sm outline-none transition sm:w-56 ${
            light
              ? 'border border-[#e8e4dc] bg-[#faf8f4] text-[#0a0a0a] placeholder:text-[#9a9288] focus:border-[#0a0a0a]'
              : 'border border-white/[0.1] bg-[#1a1a22] text-white placeholder:text-[#5a5a5a] focus:border-[#c8f14a]/40'
          }`}
        />
      </div>

      <div className="px-5 md:px-7">
        {catalog.isLoading && <p className={`py-14 text-center text-sm ${muted}`}>Loading…</p>}

        {catalog.isError && (
          <div className="my-5 rounded-2xl bg-red-500/10 px-5 py-4 text-sm text-red-600">
            {(catalog.error as Error).message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl bg-red-500/10 px-5 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!catalog.isLoading && !catalog.isError && items.length === 0 && (
          <p className={`py-14 text-center text-sm ${muted}`}>No items found.</p>
        )}

        {items.length > 0 && (
          <ul>
            {items.map((item, idx) => {
              const { changes, invalid } = pendingChanges(item)
              const changed = !invalid && Object.keys(changes).length > 0
              const saving = savingId === item.id
              return (
                <li
                  key={item.id}
                  className={`flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between ${
                    idx > 0 ? (light ? 'border-t border-[#f0ebe3]' : 'border-t border-white/[0.05]') : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`font-medium ${light ? 'text-[#0a0a0a]' : 'text-white'}`}>
                      {item.name}
                    </p>
                    <p className={`mt-0.5 text-xs capitalize ${muted}`}>{item.detail}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {fields.map((f) => {
                      const key = draftKey(item.id, f.key)
                      const draft = drafts[key] ?? ''
                      const current = item[f.key] ?? 0
                      const fieldInvalid = draft !== '' && parsePrice(draft, f.allowZero) == null
                      return (
                        <div key={f.key} className="flex items-center gap-2.5">
                          <div className="text-right">
                            <p
                              className={`text-sm font-semibold tabular-nums ${
                                light ? 'text-[#0a0a0a]' : 'text-white'
                              }`}
                            >
                              {formatMoney(current)}
                            </p>
                            <p className={`text-[10px] uppercase tracking-[0.08em] ${muted}`}>
                              {f.unit}
                            </p>
                          </div>
                          <label
                            className={`flex items-center rounded-full pl-3.5 text-sm transition ${
                              fieldInvalid
                                ? 'border border-red-400'
                                : light
                                  ? 'border border-[#e8e4dc] bg-[#faf8f4] focus-within:border-[#0a0a0a]'
                                  : 'border border-white/[0.1] bg-[#1a1a22] focus-within:border-[#c8f14a]/40'
                            }`}
                          >
                            <span className={muted}>₹</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min={f.allowZero ? 0 : 1}
                              step="1"
                              value={draft}
                              placeholder={String(current)}
                              aria-label={`New ${f.unit} price for ${item.name}`}
                              onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && changed) void save(item)
                              }}
                              className={`w-24 bg-transparent py-2 pr-3.5 pl-1.5 tabular-nums outline-none ${
                                light
                                  ? 'text-[#0a0a0a] placeholder:text-[#b5ada2]'
                                  : 'text-white placeholder:text-[#5a5a5a]'
                              }`}
                            />
                          </label>
                        </div>
                      )
                    })}
                    <button
                      type="button"
                      disabled={!changed || saving}
                      onClick={() => void save(item)}
                      className={`rounded-full px-4 py-2 text-[11px] font-bold tracking-[0.1em] uppercase transition disabled:cursor-not-allowed disabled:opacity-30 ${
                        light ? 'bg-[#0a0a0a] text-white hover:bg-black/85' : 'text-black hover:brightness-110'
                      }`}
                      style={light ? undefined : { background: accent }}
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
