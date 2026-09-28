type Chip = { id: string; label: string }



export function CategoryChips({

  chips,

  active,

  onChange,

}: {

  chips: Chip[]

  active: string

  onChange: (id: string) => void

}) {

  return (

    <div role="tablist" className="flex w-fit max-w-full items-center gap-1.5 self-start overflow-x-auto">

      {chips.map((c) => {

        const isActive = active === c.id

        return (

          <button

            key={c.id}

            type="button"

            role="tab"

            aria-selected={isActive}

            onClick={() => onChange(c.id)}

            className={`inline-flex h-9 shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium whitespace-nowrap transition duration-300 ${

              isActive

                ? 'bg-ink text-white shadow-[0_8px_20px_-10px_rgb(12_20_25_/_0.55)]'

                : 'bg-surface/90 text-muted ring-1 ring-sand/80 hover:bg-mist hover:text-ink'

            }`}

          >

            {c.label}

          </button>

        )

      })}

    </div>

  )

}

