import { useEffect, useRef, useState } from 'react'
import { useAdminGuide, useSaveGuide } from '../api/hooks'
import type {
  GuideContactGroup,
  GuideContent,
  GuidePlaceGroup,
  GuidePolicyBlock,
  GuideSection,
} from '../types'

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function fieldClass(light: boolean) {
  return `w-full rounded-xl border px-3.5 py-3 text-[15px] font-medium leading-snug outline-none transition ${
    light
      ? 'border-[#e4ddd3] bg-white text-[#1a1a12] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:font-normal placeholder:text-[#b0a89e] focus:border-[#0a0a0a]/35 focus:ring-4 focus:ring-[#0a0a0a]/05'
      : 'border-white/12 bg-[#16161c] text-[#f2f2f2] placeholder:font-normal placeholder:text-[#5a5a5a] focus:border-white/30 focus:ring-4 focus:ring-white/5'
  }`
}

function labelClass(light: boolean) {
  return `text-[10px] font-semibold tracking-[0.16em] uppercase ${
    light ? 'text-[#8a7f72]' : 'text-[#8a8a8a]'
  }`
}

function RemoveFieldButton({
  onClick,
  label = 'Remove',
}: {
  onClick: () => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-red-500/25 px-3 text-[11px] font-semibold tracking-[0.08em] text-red-600 uppercase transition hover:bg-red-500/10"
    >
      Remove
    </button>
  )
}

export function AdminGuidePanel({
  light,
  onSaved,
}: {
  light: boolean
  accent: string
  onSaved: (message: string) => void
}) {
  const guideQuery = useAdminGuide()
  const saveGuide = useSaveGuide()
  const [draft, setDraft] = useState<GuideContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const pendingScrollId = useRef<string | null>(null)

  useEffect(() => {
    if (guideQuery.data) setDraft(structuredClone(guideQuery.data))
  }, [guideQuery.data])

  useEffect(() => {
    const id = pendingScrollId.current
    if (!id || !draft?.sections.some((s) => s.id === id)) return
    pendingScrollId.current = null
    // Wait a frame so the new expanded section is in the DOM.
    requestAnimationFrame(() => {
      document.getElementById(`guide-admin-section-${id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [draft?.sections, openId])

  const muted = light ? 'text-[#9a9288]' : 'text-[#6b6b6b]'
  const strong = light ? 'text-[#0a0a0a]' : 'text-white'
  const label = labelClass(light)
  const card = light
    ? 'border border-[#e8e4dc] bg-white'
    : 'bg-[#22222a] shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'
  const nested = light ? 'border border-[#efeae2] bg-[#f7f4ef]' : 'bg-[#1a1a22]'

  async function onSave() {
    if (!draft) return
    setError(null)
    try {
      await saveGuide.mutateAsync(draft)
      onSaved('Guide saved — live on /guide')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function updateSection(id: string, next: GuideSection) {
    setDraft((d) =>
      d ? { ...d, sections: d.sections.map((s) => (s.id === id ? next : s)) } : d
    )
  }

  function removeSection(id: string) {
    setDraft((d) => (d ? { ...d, sections: d.sections.filter((s) => s.id !== id) } : d))
  }

  function addSection(type: GuideSection['type']) {
    const id = newId(type)
    const base =
      type === 'contacts'
        ? ({
            id,
            type: 'contacts',
            title: 'New contacts section',
            intro: '',
            groups: [{ title: 'Group', subtitle: '', contacts: [{ label: '', phone: '' }] }],
          } satisfies GuideSection)
        : type === 'places'
          ? ({
              id,
              type: 'places',
              title: 'New places section',
              intro: '',
              groups: [
                {
                  title: 'Group',
                  places: [{ name: '', description: '', mapUrl: '' }],
                },
              ],
            } satisfies GuideSection)
          : ({
              id,
              type: 'policy',
              title: 'New policy section',
              intro: '',
              highlights: [{ label: '', value: '' }],
              blocks: [{ title: 'Rules', bullets: [''] }],
            } satisfies GuideSection)
    pendingScrollId.current = id
    setDraft((d) => (d ? { ...d, sections: [...d.sections, base] } : d))
    setOpenId(id)
  }

  if (guideQuery.isLoading || !draft) {
    return (
      <div className={`rounded-[28px] px-6 py-16 text-center ${card}`}>
        <span
          className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-r-transparent ${muted}`}
        />
        <p className={`mt-3 text-sm ${muted}`}>Loading guide…</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section className={`overflow-hidden rounded-[28px] ${card}`}>
        <div
          className={`flex flex-col gap-4 border-b px-5 py-5 md:flex-row md:items-end md:justify-between md:px-7 ${
            light ? 'border-[#efeae2]' : 'border-white/[0.06]'
          }`}
        >
          <div className="max-w-xl">
            <p className={`text-[12px] font-medium ${light ? 'text-[#8a847a]' : 'text-[#7a7a7a]'}`}>
              Public page
            </p>
            <h2 className={`mt-1 text-xl font-semibold tracking-tight ${strong}`}>Guest guide</h2>
            <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>
              Edit the content shown at <span className={strong}>/guide</span>. Only super admins can
              save changes.
            </p>
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={saveGuide.isPending}
            className={`rounded-full px-5 py-2.5 text-[11px] font-semibold tracking-[0.12em] uppercase transition disabled:opacity-50 ${
              light ? 'bg-[#0a0a0a] text-white' : 'bg-[#c8f14a] text-black'
            }`}
          >
            {saveGuide.isPending ? 'Saving…' : 'Save guide'}
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 md:px-7">
          {error && (
            <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <label className="block">
            <span className={label}>Title</span>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className={`mt-2 ${fieldClass(light)}`}
            />
          </label>
          <label className="block">
            <span className={label}>Subtitle</span>
            <textarea
              value={draft.subtitle}
              onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              rows={2}
              className={`mt-2 ${fieldClass(light)}`}
            />
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => addSection('contacts')}
              className={`rounded-full border px-3.5 py-2 text-[10px] font-semibold tracking-[0.1em] uppercase ${
                light ? 'border-[#e8e4dc] text-[#0a0a0a]' : 'border-white/15 text-white'
              }`}
            >
              + Contacts
            </button>
            <button
              type="button"
              onClick={() => addSection('places')}
              className={`rounded-full border px-3.5 py-2 text-[10px] font-semibold tracking-[0.1em] uppercase ${
                light ? 'border-[#e8e4dc] text-[#0a0a0a]' : 'border-white/15 text-white'
              }`}
            >
              + Places
            </button>
            <button
              type="button"
              onClick={() => addSection('policy')}
              className={`rounded-full border px-3.5 py-2 text-[10px] font-semibold tracking-[0.1em] uppercase ${
                light ? 'border-[#e8e4dc] text-[#0a0a0a]' : 'border-white/15 text-white'
              }`}
            >
              + Policy
            </button>
          </div>
        </div>
      </section>

      {draft.sections.map((section) => {
        const open = openId === section.id
        return (
          <section
            key={section.id}
            id={`guide-admin-section-${section.id}`}
            className={`scroll-mt-24 overflow-hidden rounded-[24px] ${card}`}
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : section.id)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left md:px-6"
            >
              <div>
                <p className={label}>{section.type}</p>
                <p className={`mt-1 text-base font-semibold tracking-tight ${strong}`}>
                  {section.title || 'Untitled'}
                </p>
              </div>
              <span className={`text-xs ${muted}`}>{open ? 'Hide' : 'Edit'}</span>
            </button>

            {open && (
              <div
                className={`space-y-4 border-t px-5 py-5 md:px-6 ${
                  light ? 'border-[#efeae2]' : 'border-white/[0.06]'
                }`}
              >
                <label className="block">
                  <span className={label}>Section title</span>
                  <input
                    value={section.title}
                    onChange={(e) => updateSection(section.id, { ...section, title: e.target.value })}
                    className={`mt-2 ${fieldClass(light)}`}
                  />
                </label>
                <label className="block">
                  <span className={label}>Intro</span>
                  <textarea
                    value={section.intro ?? ''}
                    onChange={(e) => updateSection(section.id, { ...section, intro: e.target.value })}
                    rows={2}
                    className={`mt-2 ${fieldClass(light)}`}
                  />
                </label>

                {section.type === 'contacts' && (
                  <ContactsEditor
                    light={light}
                    groups={section.groups}
                    onChange={(groups) => updateSection(section.id, { ...section, groups })}
                    fieldClass={fieldClass(light)}
                    nested={nested}
                    muted={muted}
                  />
                )}
                {section.type === 'places' && (
                  <PlacesEditor
                    light={light}
                    groups={section.groups}
                    onChange={(groups) => updateSection(section.id, { ...section, groups })}
                    fieldClass={fieldClass(light)}
                    nested={nested}
                    muted={muted}
                  />
                )}
                {section.type === 'policy' && (
                  <PolicyEditor
                    section={section}
                    onChange={(next) => updateSection(section.id, next)}
                    fieldClass={fieldClass(light)}
                    nested={nested}
                    muted={muted}
                  />
                )}

                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  className="rounded-full border border-red-500/30 px-3.5 py-2 text-[10px] font-semibold tracking-[0.1em] text-red-600 uppercase"
                >
                  Delete section
                </button>
              </div>
            )}
          </section>
        )
      })}

      <section className={`rounded-[24px] px-5 py-5 md:px-6 ${card}`}>
        <p className={label}>Footer</p>
        <label className="mt-3 block">
          <span className={label}>Closing line</span>
          <input
            value={draft.footer.thanks}
            onChange={(e) =>
              setDraft({ ...draft, footer: { ...draft.footer, thanks: e.target.value } })
            }
            className={`mt-2 ${fieldClass(light)}`}
          />
        </label>
        <label className="mt-3 block">
          <span className={label}>Address</span>
          <input
            value={draft.footer.address}
            onChange={(e) =>
              setDraft({ ...draft, footer: { ...draft.footer, address: e.target.value } })
            }
            className={`mt-2 ${fieldClass(light)}`}
          />
        </label>
        <div className="mt-3 space-y-2">
          {draft.footer.phones.map((p, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <input
                  value={p.label}
                  onChange={(e) => {
                    const phones = draft.footer.phones.map((x, idx) =>
                      idx === i ? { ...x, label: e.target.value } : x
                    )
                    setDraft({ ...draft, footer: { ...draft.footer, phones } })
                  }}
                  placeholder="Label"
                  className={fieldClass(light)}
                />
                <input
                  value={p.phone}
                  onChange={(e) => {
                    const phones = draft.footer.phones.map((x, idx) =>
                      idx === i ? { ...x, phone: e.target.value } : x
                    )
                    setDraft({ ...draft, footer: { ...draft.footer, phones } })
                  }}
                  placeholder="Phone"
                  className={fieldClass(light)}
                />
              </div>
              <RemoveFieldButton
                label="Remove phone"
                onClick={() =>
                  setDraft({
                    ...draft,
                    footer: {
                      ...draft.footer,
                      phones: draft.footer.phones.filter((_, idx) => idx !== i),
                    },
                  })
                }
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setDraft({
                ...draft,
                footer: {
                  ...draft.footer,
                  phones: [...draft.footer.phones, { label: '', phone: '' }],
                },
              })
            }
            className={`text-[11px] font-semibold ${strong}`}
          >
            + Footer phone
          </button>
        </div>
      </section>
    </div>
  )
}

function ContactsEditor({
  groups,
  onChange,
  fieldClass,
  nested,
  muted,
}: {
  light: boolean
  groups: GuideContactGroup[]
  onChange: (groups: GuideContactGroup[]) => void
  fieldClass: string
  nested: string
  muted: string
}) {
  return (
    <div className="space-y-4">
      {groups.map((g, gi) => (
        <div key={gi} className={`rounded-2xl p-4 ${nested}`}>
          <div className="flex items-start gap-2">
            <input
              value={g.title}
              onChange={(e) => {
                const next = groups.map((x, i) => (i === gi ? { ...x, title: e.target.value } : x))
                onChange(next)
              }}
              placeholder="Group title"
              className={`min-w-0 flex-1 ${fieldClass}`}
            />
            <RemoveFieldButton
              label="Remove contact group"
              onClick={() => onChange(groups.filter((_, i) => i !== gi))}
            />
          </div>
          <input
            value={g.subtitle ?? ''}
            onChange={(e) => {
              const next = groups.map((x, i) => (i === gi ? { ...x, subtitle: e.target.value } : x))
              onChange(next)
            }}
            placeholder="Subtitle"
            className={`mt-2 ${fieldClass}`}
          />
          <div className="mt-3 space-y-2">
            {g.contacts.map((c, ci) => (
              <div key={ci} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  <input
                    value={c.label}
                    onChange={(e) => {
                      const contacts = g.contacts.map((x, i) =>
                        i === ci ? { ...x, label: e.target.value } : x
                      )
                      onChange(groups.map((x, i) => (i === gi ? { ...x, contacts } : x)))
                    }}
                    placeholder="Label"
                    className={fieldClass}
                  />
                  <input
                    value={c.phone}
                    onChange={(e) => {
                      const contacts = g.contacts.map((x, i) =>
                        i === ci ? { ...x, phone: e.target.value } : x
                      )
                      onChange(groups.map((x, i) => (i === gi ? { ...x, contacts } : x)))
                    }}
                    placeholder="Phone"
                    className={fieldClass}
                  />
                </div>
                <RemoveFieldButton
                  label="Remove contact"
                  onClick={() => {
                    const contacts = g.contacts.filter((_, i) => i !== ci)
                    onChange(groups.map((x, i) => (i === gi ? { ...x, contacts } : x)))
                  }}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const contacts = [...g.contacts, { label: '', phone: '' }]
              onChange(groups.map((x, i) => (i === gi ? { ...x, contacts } : x)))
            }}
            className={`mt-2 text-[11px] font-semibold ${muted}`}
          >
            + Contact
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...groups, { title: 'New group', subtitle: '', contacts: [{ label: '', phone: '' }] }])
        }
        className={`text-[11px] font-semibold ${muted}`}
      >
        + Contact group
      </button>
    </div>
  )
}

function PlacesEditor({
  groups,
  onChange,
  fieldClass,
  nested,
  muted,
}: {
  light: boolean
  groups: GuidePlaceGroup[]
  onChange: (groups: GuidePlaceGroup[]) => void
  fieldClass: string
  nested: string
  muted: string
}) {
  return (
    <div className="space-y-4">
      {groups.map((g, gi) => (
        <div key={gi} className={`rounded-2xl p-4 ${nested}`}>
          <div className="flex items-start gap-2">
            <input
              value={g.title}
              onChange={(e) => {
                onChange(groups.map((x, i) => (i === gi ? { ...x, title: e.target.value } : x)))
              }}
              placeholder="Group title"
              className={`min-w-0 flex-1 ${fieldClass}`}
            />
            <RemoveFieldButton
              label="Remove place group"
              onClick={() => onChange(groups.filter((_, i) => i !== gi))}
            />
          </div>
          <div className="mt-3 space-y-3">
            {g.places.map((p, pi) => (
              <div key={pi} className="space-y-2 rounded-xl border border-black/5 p-3">
                <div className="flex items-start justify-between gap-2">
                  <input
                    value={p.name}
                    onChange={(e) => {
                      const places = g.places.map((x, i) =>
                        i === pi ? { ...x, name: e.target.value } : x
                      )
                      onChange(groups.map((x, i) => (i === gi ? { ...x, places } : x)))
                    }}
                    placeholder="Place name"
                    className={`min-w-0 flex-1 ${fieldClass}`}
                  />
                  <RemoveFieldButton
                    label="Remove place"
                    onClick={() => {
                      const places = g.places.filter((_, i) => i !== pi)
                      onChange(groups.map((x, i) => (i === gi ? { ...x, places } : x)))
                    }}
                  />
                </div>
                <textarea
                  value={p.description}
                  onChange={(e) => {
                    const places = g.places.map((x, i) =>
                      i === pi ? { ...x, description: e.target.value } : x
                    )
                    onChange(groups.map((x, i) => (i === gi ? { ...x, places } : x)))
                  }}
                  placeholder="Description"
                  rows={2}
                  className={fieldClass}
                />
                <input
                  value={p.mapUrl}
                  onChange={(e) => {
                    const places = g.places.map((x, i) =>
                      i === pi ? { ...x, mapUrl: e.target.value } : x
                    )
                    onChange(groups.map((x, i) => (i === gi ? { ...x, places } : x)))
                  }}
                  placeholder="Google Maps URL"
                  className={fieldClass}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const places = [...g.places, { name: '', description: '', mapUrl: '' }]
              onChange(groups.map((x, i) => (i === gi ? { ...x, places } : x)))
            }}
            className={`mt-2 text-[11px] font-semibold ${muted}`}
          >
            + Place
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...groups,
            { title: 'New group', places: [{ name: '', description: '', mapUrl: '' }] },
          ])
        }
        className={`text-[11px] font-semibold ${muted}`}
      >
        + Place group
      </button>
    </div>
  )
}

function PolicyEditor({
  section,
  onChange,
  fieldClass,
  nested,
  muted,
}: {
  section: Extract<GuideSection, { type: 'policy' }>
  onChange: (section: Extract<GuideSection, { type: 'policy' }>) => void
  fieldClass: string
  nested: string
  muted: string
}) {
  return (
    <div className="space-y-4">
      <div className={`rounded-2xl p-4 ${nested}`}>
        <p className={`text-[10px] font-semibold tracking-[0.16em] uppercase ${muted}`}>
          Highlights
        </p>
        <div className="mt-2 space-y-2">
          {section.highlights.map((h, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <input
                  value={h.label}
                  onChange={(e) => {
                    const highlights = section.highlights.map((x, idx) =>
                      idx === i ? { ...x, label: e.target.value } : x
                    )
                    onChange({ ...section, highlights })
                  }}
                  placeholder="Label"
                  className={fieldClass}
                />
                <input
                  value={h.value}
                  onChange={(e) => {
                    const highlights = section.highlights.map((x, idx) =>
                      idx === i ? { ...x, value: e.target.value } : x
                    )
                    onChange({ ...section, highlights })
                  }}
                  placeholder="Value"
                  className={fieldClass}
                />
              </div>
              <RemoveFieldButton
                label="Remove highlight"
                onClick={() =>
                  onChange({
                    ...section,
                    highlights: section.highlights.filter((_, idx) => idx !== i),
                  })
                }
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...section,
              highlights: [...section.highlights, { label: '', value: '' }],
            })
          }
          className={`mt-2 text-[11px] font-semibold ${muted}`}
        >
          + Highlight
        </button>
      </div>

      {section.blocks.map((block: GuidePolicyBlock, bi) => (
        <div key={bi} className={`rounded-2xl p-4 ${nested}`}>
          <div className="flex items-start gap-2">
            <input
              value={block.title}
              onChange={(e) => {
                const blocks = section.blocks.map((x, i) =>
                  i === bi ? { ...x, title: e.target.value } : x
                )
                onChange({ ...section, blocks })
              }}
              placeholder="Block title"
              className={`min-w-0 flex-1 ${fieldClass}`}
            />
            <RemoveFieldButton
              label="Remove policy block"
              onClick={() =>
                onChange({
                  ...section,
                  blocks: section.blocks.filter((_, i) => i !== bi),
                })
              }
            />
          </div>
          <textarea
            value={block.bullets.join('\n')}
            onChange={(e) => {
              const bullets = e.target.value.split('\n')
              const blocks = section.blocks.map((x, i) => (i === bi ? { ...x, bullets } : x))
              onChange({ ...section, blocks })
            }}
            rows={4}
            placeholder="One bullet per line"
            className={`mt-2 ${fieldClass}`}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...section,
            blocks: [...section.blocks, { title: 'New block', bullets: [''] }],
          })
        }
        className={`text-[11px] font-semibold ${muted}`}
      >
        + Policy block
      </button>
    </div>
  )
}
