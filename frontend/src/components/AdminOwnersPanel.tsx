import { useEffect, useMemo, useState } from 'react'
import {
  useAdminCustomers,
  useAdminPendingRooms,
  useDeleteCustomer,
  useResetCustomerPassword,
  useUpdateCustomerStatus,
  useUpdateRoomListingStatus,
} from '../api/hooks'
import type { AdminCustomer, CustomerStatus } from '../types'

function ownerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

function statusTone(status: CustomerStatus, light: boolean) {
  if (status === 'approved') {
    return light ? 'bg-[#e8f5e4] text-[#2d5a28]' : 'bg-[#2d5a28]/25 text-[#9fd89a]'
  }
  if (status === 'rejected') {
    return 'bg-red-500/10 text-red-600'
  }
  return light ? 'bg-[#fff4d6] text-[#8a6a12]' : 'bg-[#8a6a12]/25 text-[#f0d48a]'
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M7.2 3.8h2.6l1.2 3.2-1.5 1.1a12.4 12.4 0 005.6 5.6l1.1-1.5 3.2 1.2v2.6c0 .9-.7 1.7-1.6 1.8C10.4 18.5 5.5 13.6 4 5.4c-.1-.9.7-1.6 1.6-1.6z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14L19 5" strokeLinecap="round" />
      <path d="M17 13.5V18a1.5 1.5 0 01-1.5 1.5h-10A1.5 1.5 0 014 18V8A1.5 1.5 0 015.5 6.5H10" strokeLinecap="round" />
    </svg>
  )
}

export function AdminOwnersPanel({
  light,
  accent,
  onSaved,
}: {
  light: boolean
  accent: string
  onSaved: (message: string) => void
}) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const customers = useAdminCustomers(debouncedSearch)
  const pendingRooms = useAdminPendingRooms()
  const updateStatus = useUpdateCustomerStatus()
  const resetPassword = useResetCustomerPassword()
  const deleteCustomer = useDeleteCustomer()
  const updateListing = useUpdateRoomListingStatus()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminCustomer | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!deleteTarget) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDeleteTarget(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [deleteTarget])

  const muted = light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'
  const strong = light ? 'text-[#0a0a0a]' : 'text-white'
  const card = light
    ? 'border border-[#e8e4dc] bg-white'
    : 'bg-[#22222a] shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'

  const ownerList = useMemo(() => {
    const list = [...(customers.data?.items ?? [])]
    const rank: Record<CustomerStatus, number> = { pending: 0, approved: 1, rejected: 2 }
    return list.sort((a, b) => rank[a.status] - rank[b.status] || a.name.localeCompare(b.name))
  }, [customers.data])

  const counts = customers.data?.counts ?? {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  }
  const searching = customers.isFetching
  const waitingDebounce = search.trim() !== debouncedSearch

  async function decide(c: AdminCustomer, status: 'approved' | 'rejected') {
    setBusyId(`c-${c.id}-${status}`)
    setError(null)
    try {
      await updateStatus.mutateAsync({ id: c.id, status })
      onSaved(
        status === 'approved'
          ? `${c.name} approved — they can sign in with mobile + Pondy@123`
          : `${c.name} rejected`
      )
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  async function reset(c: AdminCustomer) {
    setBusyId(`c-${c.id}-reset`)
    setError(null)
    try {
      await resetPassword.mutateAsync(c.id)
      onSaved(`${c.name}: password reset to Pondy@123 — they must set a new password on next login`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const c = deleteTarget
    setBusyId(`c-${c.id}-delete`)
    setError(null)
    try {
      const result = await deleteCustomer.mutateAsync(c.id)
      onSaved(result.message || `${c.name} deleted`)
      setDeleteTarget(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  async function listing(id: number, name: string, status: 'published' | 'rejected') {
    setBusyId(`r-${id}-${status}`)
    setError(null)
    try {
      await updateListing.mutateAsync({ id, status })
      onSaved(
        status === 'published' ? `${name} is now public` : `${name} listing rejected`
      )
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className={`overflow-hidden rounded-[28px] ${card}`}>
        <div
          className={`border-b px-5 py-5 md:px-7 md:py-6 ${
            light ? 'border-[#efeae2]' : 'border-white/[0.06]'
          }`}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className={`text-[12px] font-medium ${light ? 'text-[#8a847a]' : 'text-[#7a7a7a]'}`}>
                Approvals
              </p>
              <h2 className={`mt-1 text-xl font-semibold tracking-tight ${strong}`}>Room owners</h2>
              <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>
                Accept registrations, then share that they sign in with their mobile and default
                password <span className={strong}>Pondy@123</span>. Reset forces a new password on
                next login.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { label: 'Pending', value: counts.pending },
                  { label: 'Approved', value: counts.approved },
                  { label: 'Rejected', value: counts.rejected },
                ] as const
              ).map((stat) => (
                <div
                  key={stat.label}
                  className={`min-w-[5.5rem] rounded-2xl px-3.5 py-2.5 ${
                    light ? 'bg-[#f7f4ef]' : 'bg-[#1a1a22]'
                  }`}
                >
                  <p className={`text-[10px] font-semibold tracking-[0.12em] uppercase ${muted}`}>
                    {stat.label}
                  </p>
                  <p className={`mt-0.5 text-lg font-semibold tabular-nums tracking-tight ${strong}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-5 md:px-7">
          <div className="mb-5">
            <label className="relative block">
              <span className="sr-only">Search owners</span>
              <span
                className={`pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 ${muted}`}
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="M16.5 16.5L21 21" strokeLinecap="round" />
                </svg>
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, mobile, stay, or status…"
                className={`w-full rounded-2xl border py-3 pr-11 pl-10 text-sm outline-none transition ${
                  light
                    ? 'border-[#e8e4dc] bg-[#faf8f4] text-[#0a0a0a] placeholder:text-[#9a9288] focus:border-[#0a0a0a]/35'
                    : 'border-white/10 bg-[#1a1a22] text-white placeholder:text-[#6b6b6b] focus:border-white/25'
                }`}
              />
              <span className="absolute top-1/2 right-3.5 -translate-y-1/2">
                {(searching || waitingDebounce) && (
                  <span
                    className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent ${muted}`}
                    aria-label="Searching"
                  />
                )}
                {!(searching || waitingDebounce) && search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className={`text-xs font-semibold tracking-[0.08em] uppercase transition ${
                      light
                        ? 'text-[#9a9288] hover:text-[#0a0a0a]'
                        : 'text-[#6b6b6b] hover:text-white'
                    }`}
                  >
                    Clear
                  </button>
                )}
              </span>
            </label>
            {debouncedSearch && !customers.isLoading && (
              <p className={`mt-2 text-xs ${muted}`}>
                {ownerList.length} result{ownerList.length === 1 ? '' : 's'} for “{debouncedSearch}”
              </p>
            )}
          </div>

          {customers.isLoading && !customers.data && (
            <div className="flex flex-col items-center justify-center gap-3 py-14">
              <span
                className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-r-transparent ${muted}`}
                aria-hidden
              />
              <p className={`text-sm ${muted}`}>Loading owners…</p>
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {!customers.isLoading && ownerList.length === 0 && (
            <div
              className={`rounded-[22px] px-6 py-12 text-center ${
                light ? 'bg-[#faf8f4]' : 'bg-[#1a1a22]'
              }`}
            >
              <p className={`text-sm font-medium ${strong}`}>
                {debouncedSearch ? 'No owners match that search' : 'No owner registrations yet'}
              </p>
              <p className={`mt-1 text-sm ${muted}`}>
                {debouncedSearch
                  ? 'Try another name, mobile number, or stay.'
                  : 'New hosts appear here when they register from the owner portal.'}
              </p>
            </div>
          )}

          <ul className={`space-y-4 ${searching && customers.data ? 'opacity-60 transition-opacity' : ''}`}>
            {ownerList.map((c) => {
              const app = c.application
              const stayName =
                app?.claimType === 'existing'
                  ? app.roomName || (app.roomId != null ? `Room #${app.roomId}` : 'Listed room')
                  : app?.proposedName || 'Proposed stay'
              const stayKind = app?.claimType === 'existing' ? 'Claimed listing' : 'New on map'
              return (
                <li
                  key={c.id}
                  className={`overflow-hidden rounded-[24px] transition ${
                    light
                      ? 'border border-[#efeae2] bg-[#faf8f4] shadow-[0_10px_30px_-24px_rgba(20,20,20,0.35)]'
                      : 'bg-[#1a1a22] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]'
                  }`}
                >
                  <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3.5">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold tracking-[0.04em] ${strong}`}
                        style={{
                          background: light ? `${accent}55` : `${accent}33`,
                          color: light ? '#1a1a12' : accent,
                        }}
                        aria-hidden
                      >
                        {ownerInitials(c.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`truncate text-[1.05rem] font-semibold tracking-tight ${strong}`}>
                            {c.name}
                          </h3>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] uppercase ${statusTone(
                              c.status,
                              light
                            )}`}
                          >
                            {c.status}
                          </span>
                          {c.status === 'approved' && c.mustChangePassword && (
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase ${
                                light ? 'bg-[#fff4d6] text-[#8a6a12]' : 'bg-[#8a6a12]/25 text-[#f0d48a]'
                              }`}
                            >
                              Password reset
                            </span>
                          )}
                        </div>
                        <p className={`mt-1.5 inline-flex items-center gap-1.5 text-sm ${muted}`}>
                          <span className="opacity-70">
                            <PhoneIcon />
                          </span>
                          <span className={`tabular-nums ${strong}`}>{c.mobile}</span>
                        </p>
                        <p className={`mt-1 text-[11px] ${muted}`}>
                          Registered{' '}
                          {new Date(c.createdAt).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {c.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            disabled={busyId !== null}
                            onClick={() => void decide(c, 'approved')}
                            className="cursor-pointer rounded-full px-3.5 py-2 text-[11px] font-bold tracking-[0.1em] text-black uppercase disabled:opacity-50"
                            style={{ background: accent }}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={busyId !== null}
                            onClick={() => void decide(c, 'rejected')}
                            className={`cursor-pointer rounded-full border px-3.5 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase disabled:opacity-50 ${
                              light
                                ? 'border-[#e8e4dc] text-[#3d3d3d]'
                                : 'border-white/10 text-[#c5c5c5]'
                            }`}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {c.status === 'approved' && (
                        <>
                          <button
                            type="button"
                            disabled={busyId !== null}
                            onClick={() => void reset(c)}
                            className={`cursor-pointer rounded-full border px-3.5 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase disabled:opacity-50 ${
                              light
                                ? 'border-[#e8e4dc] bg-white text-[#3d3d3d]'
                                : 'border-white/10 text-[#c5c5c5]'
                            }`}
                          >
                            Reset password
                          </button>
                          <button
                            type="button"
                            disabled={busyId !== null}
                            onClick={() => setDeleteTarget(c)}
                            className="cursor-pointer rounded-full border border-red-500/35 px-3.5 py-2 text-[11px] font-semibold tracking-[0.08em] text-red-500 uppercase disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {app && (
                    <div
                      className={`mx-4 mb-4 rounded-[18px] px-4 py-3.5 sm:mx-5 sm:mb-5 ${
                        light ? 'bg-white' : 'bg-[#22222a]'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.1em] uppercase ${
                                light ? 'bg-[#f0ebe3] text-[#6b6560]' : 'bg-white/8 text-[#a3a3a3]'
                              }`}
                            >
                              {stayKind}
                            </span>
                          </div>
                          <p className={`mt-2 text-[15px] font-semibold tracking-tight ${strong}`}>
                            {stayName}
                          </p>
                          {app.claimType === 'new_map' && app.proposedAddress && (
                            <p className={`mt-1.5 flex items-start gap-1.5 text-sm leading-snug ${muted}`}>
                              <span className="mt-0.5 shrink-0 opacity-70">
                                <MapPinIcon />
                              </span>
                              <span>{app.proposedAddress}</span>
                            </p>
                          )}
                          {app.note && (
                            <p className={`mt-2 text-sm italic ${muted}`}>“{app.note}”</p>
                          )}
                        </div>
                        {app.mapUrl && (
                          <a
                            href={app.mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase transition ${
                              light
                                ? 'bg-[#0a0a0a] text-white hover:bg-black/85'
                                : 'bg-white/10 text-white hover:bg-white/15'
                            }`}
                          >
                            Maps
                            <ExternalLinkIcon />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-owner-title"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className={`w-full max-w-md rounded-[24px] p-6 shadow-2xl ${
              light ? 'bg-white text-[#0a0a0a]' : 'bg-[#22222a] text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <p
              className={`text-[12px] font-medium tracking-[0.12em] uppercase ${
                light ? 'text-[#8a847a]' : 'text-[#7a7a7a]'
              }`}
            >
              Confirm delete
            </p>
            <h3 id="delete-owner-title" className="mt-2 text-xl font-semibold tracking-tight">
              Delete {deleteTarget.name}?
            </h3>
            <p className={`mt-2 text-sm ${light ? 'text-[#6b6560]' : 'text-[#a3a3a3]'}`}>
              This permanently removes the owner account for{' '}
              <span className="font-medium">{deleteTarget.mobile}</span>. Their rooms stay on the
              site but will no longer be linked to this owner. This cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={busyId !== null}
                onClick={() => setDeleteTarget(null)}
                className={`cursor-pointer rounded-full border px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase ${
                  light ? 'border-[#e8e4dc] text-[#3d3d3d]' : 'border-white/10 text-[#c5c5c5]'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId !== null}
                onClick={() => void confirmDelete()}
                className="cursor-pointer rounded-full bg-red-500 px-4 py-2 text-[11px] font-bold tracking-[0.1em] text-white uppercase disabled:opacity-50"
              >
                {busyId === `c-${deleteTarget.id}-delete` ? 'Deleting…' : 'Delete owner'}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className={`overflow-hidden rounded-[28px] ${card}`}>
        <div
          className={`border-b px-5 py-5 md:px-7 md:py-6 ${
            light ? 'border-[#efeae2]' : 'border-white/[0.06]'
          }`}
        >
          <p className={`text-[12px] font-medium ${light ? 'text-[#8a847a]' : 'text-[#7a7a7a]'}`}>
            Listings
          </p>
          <h2 className={`mt-1 text-xl font-semibold tracking-tight ${strong}`}>
            Rooms awaiting publish
          </h2>
          <p className={`mt-1 text-sm ${muted}`}>
            Owner-created or claimed rooms stay hidden until you publish them.
          </p>
        </div>
        <div className="px-5 py-5 md:px-7">
          {pendingRooms.isLoading && (
            <p className={`py-10 text-center text-sm ${muted}`}>Loading…</p>
          )}
          {!pendingRooms.isLoading && (pendingRooms.data?.length ?? 0) === 0 && (
            <p className={`py-10 text-center text-sm ${muted}`}>No pending rooms.</p>
          )}
          <ul className="space-y-3">
            {(pendingRooms.data ?? []).map((room) => (
              <li
                key={room.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 ${
                  light ? 'border border-[#efeae2] bg-[#faf8f4]' : 'bg-[#1a1a22]'
                }`}
              >
                <div>
                  <p className={`font-medium ${strong}`}>{room.name}</p>
                  <p className={`text-xs ${muted}`}>
                    ₹{room.pricePerNight}/night · {room.location}
                    {room.ownerName ? ` · ${room.ownerName}` : ''}
                    {room.ownerMobile ? ` (${room.ownerMobile})` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void listing(room.id, room.name, 'published')}
                    className="rounded-full px-3 py-2 text-[11px] font-bold tracking-[0.1em] text-black uppercase"
                    style={{ background: accent }}
                  >
                    Publish
                  </button>
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void listing(room.id, room.name, 'rejected')}
                    className={`rounded-full border px-3 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase ${
                      light ? 'border-[#e8e4dc]' : 'border-white/10 text-[#c5c5c5]'
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
