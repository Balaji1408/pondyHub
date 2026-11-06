import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
export type MapPick = {
  proposedName: string
  proposedAddress: string
  lat: number
  lng: number
  placeId: string | null
  mapUrl: string
}

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (
          el: HTMLElement,
          opts: { center: { lat: number; lng: number }; zoom: number; mapTypeControl?: boolean }
        ) => {
          addListener: (event: string, fn: (e: { latLng: { lat: () => number; lng: () => number } }) => void) => void
          setCenter: (c: { lat: number; lng: number }) => void
        }
        Marker: new (opts: {
          map: unknown
          position: { lat: number; lng: number }
        }) => { setPosition: (p: { lat: number; lng: number }) => void }
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: { fields?: string[]; componentRestrictions?: { country: string } }
          ) => {
            addListener: (event: string, fn: () => void) => void
            getPlace: () => {
              name?: string
              formatted_address?: string
              place_id?: string
              geometry?: { location?: { lat: () => number; lng: () => number } }
            }
          }
        }
        event: { clearInstanceListeners: (obj: unknown) => void }
      }
    }
    __pondyMapsInit?: () => void
  }
}

const PONDY = { lat: 11.9416, lng: 79.8083 }

const PIN_HTML = `
  <span class="map-pin" aria-hidden="true">
    <svg class="map-pin__body" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.5 14 26 14 26s14-16.5 14-26C28 6.268 21.732 0 14 0z" fill="#1f4d52"/>
      <circle cx="14" cy="14" r="5.5" fill="#eef6f4"/>
    </svg>
  </span>
`

function createPinIcon() {
  return L.divIcon({
    className: 'map-pin-icon',
    html: PIN_HTML,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  })
}

function coordsMapUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}

function hasValidCoords(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  )
}

function loadMapsScript(apiKey: string) {
  if (window.google?.maps?.places) return Promise.resolve()
  const existing = document.querySelector<HTMLScriptElement>('script[data-pondy-maps]')
  if (existing) {
    return new Promise<void>((resolve, reject) => {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Maps failed to load')))
    })
  }
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`
    script.async = true
    script.dataset.pondyMaps = '1'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Maps failed to load'))
    document.head.appendChild(script)
  })
}

function ManualMapFallback({
  value,
  onChange,
}: {
  value: MapPick | null
  onChange: (pick: MapPick) => void
}) {
  const mapElRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const layersRef = useRef<{
    street: L.TileLayer
    satellite: L.TileLayer
    roads: L.TileLayer
    places: L.TileLayer
  } | null>(null)
  const [basemap, setBasemap] = useState<'street' | 'satellite'>('street')
  const [manualName, setManualName] = useState(value?.proposedName || '')
  const [manualAddress, setManualAddress] = useState(value?.proposedAddress || '')
  const [error, setError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [pinSet, setPinSet] = useState(() => !!(value && hasValidCoords(value.lat, value.lng)))
  const lookupSeq = useRef(0)

  const draftRef = useRef({ name: manualName, address: manualAddress, value })
  draftRef.current = { name: manualName, address: manualAddress, value }

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return

    const start = value && hasValidCoords(value.lat, value.lng) ? value : PONDY
    const map = L.map(mapElRef.current, {
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: true,
    }).setView([start.lat, start.lng], 14)

    L.control.zoom({ position: 'topright' }).addTo(map)

    const street = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19,
      }
    ).addTo(map)
    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Imagery &copy; Esri',
        maxZoom: 19,
      }
    )
    const roads = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: '' }
    )
    const places = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: '' }
    )
    layersRef.current = { street, satellite, roads, places }

    const marker = L.marker([start.lat, start.lng], {
      draggable: true,
      icon: createPinIcon(),
      opacity: value && hasValidCoords(value.lat, value.lng) ? 1 : 0.55,
    }).addTo(map)
    mapRef.current = map
    markerRef.current = marker

    function commitPick(lat: number, lng: number) {
      const seq = ++lookupSeq.current
      const { name, address, value: current } = draftRef.current
      const proposedName = name.trim() || current?.proposedName || 'Selected location'
      const fallbackAddress =
        address.trim() || current?.proposedAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setError(null)
      setPinSet(true)
      setLookingUp(true)
      marker.setOpacity(1)
      // Replay drop animation on each place.
      marker.setIcon(createPinIcon())
      onChange({
        proposedName,
        proposedAddress: fallbackAddress,
        lat,
        lng,
        placeId: null,
        mapUrl: coordsMapUrl(lat, lng),
      })

      void fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`,
        { headers: { Accept: 'application/json' } }
      )
        .then(async (res) => {
          if (!res.ok) return null
          const data = (await res.json()) as { display_name?: string }
          return data.display_name?.trim() || null
        })
        .then((found) => {
          if (lookupSeq.current !== seq) return
          setLookingUp(false)
          if (!found) return
          setManualAddress(found)
          draftRef.current.address = found
          onChange({
            proposedName,
            proposedAddress: found,
            lat,
            lng,
            placeId: null,
            mapUrl: coordsMapUrl(lat, lng),
          })
        })
        .catch(() => {
          if (lookupSeq.current === seq) setLookingUp(false)
        })
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      commitPick(e.latlng.lat, e.latlng.lng)
    })
    marker.on('dragstart', () => {
      const el = marker.getElement()?.querySelector('.map-pin')
      el?.classList.add('is-dragging')
    })
    marker.on('dragend', () => {
      const el = marker.getElement()?.querySelector('.map-pin')
      el?.classList.remove('is-dragging')
      const pos = marker.getLatLng()
      commitPick(pos.lat, pos.lng)
    })

    requestAnimationFrame(() => map.invalidateSize())

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
      layersRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function findAddressOnMap() {
    const address = manualAddress.trim()
    if (!manualName.trim() || !address) {
      setError('Enter the stay name and address first')
      return
    }
    setError(null)
    setSearching(true)
    try {
      const q = /puducherry|pondicherry|pondy/i.test(address)
        ? address
        : `${address}, Puducherry`
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { Accept: 'application/json' } }
      )
      if (!res.ok) throw new Error('Address lookup failed')
      const results = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>
      const hit = results[0]
      if (!hit) {
        setError('Address not found — tap the map to place the pin')
        return
      }
      const lat = Number(hit.lat)
      const lng = Number(hit.lon)
      mapRef.current?.flyTo([lat, lng], 18, { duration: 0.85 })
      markerRef.current?.setLatLng([lat, lng])
      markerRef.current?.setOpacity(1)
      markerRef.current?.setIcon(createPinIcon())
      setPinSet(true)
      onChange({
        proposedName: manualName.trim(),
        proposedAddress: manualAddress.trim() || hit.display_name,
        lat,
        lng,
        placeId: null,
        mapUrl: coordsMapUrl(lat, lng),
      })
    } catch {
      setError('Could not look up the address — tap the map to place the pin')
    } finally {
      setSearching(false)
    }
  }

  function showBasemap(next: 'street' | 'satellite') {
    const map = mapRef.current
    const layers = layersRef.current
    if (!map || !layers) return
    const { street, satellite, roads, places } = layers
    const photo = next === 'satellite'
    if (photo) {
      if (map.hasLayer(street)) map.removeLayer(street)
      if (!map.hasLayer(satellite)) satellite.addTo(map)
      if (!map.hasLayer(roads)) roads.addTo(map)
      if (!map.hasLayer(places)) places.addTo(map)
      if (map.getZoom() < 17) map.setZoom(17)
    } else {
      if (map.hasLayer(places)) map.removeLayer(places)
      if (map.hasLayer(roads)) map.removeLayer(roads)
      if (map.hasLayer(satellite)) map.removeLayer(satellite)
      if (!map.hasLayer(street)) street.addTo(map)
    }
    setBasemap(next)
  }

  const mapsHref = value && hasValidCoords(value.lat, value.lng) ? value.mapUrl : null

  const fieldClass =
    'w-full rounded-2xl border border-[#cdd9e0] bg-white/90 px-3.5 py-3 text-sm text-[#0c1419] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition placeholder:text-[#8a9aa4] focus:border-[#1f4d52]/45 focus:ring-4 focus:ring-[#1f4d52]/10'

  return (
    <div className="map-picker-shell overflow-hidden rounded-[24px] border border-[#c5d3db] bg-gradient-to-b from-[#f7fafb] to-[#eef4f7] shadow-[0_18px_40px_-28px_rgba(12,20,25,0.45)]">
      <div className="space-y-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#5a6a74] uppercase">
            Stay location
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#5a6a74]">
            Type the stay name and address, then tap Find address. Switch to Satellite to see the building with street names, then tap or drag the pin. The address fills in from that spot.
          </p>
        </div>

        <div className="grid gap-2.5">
          <label className="block">
            <span className="sr-only">Stay name</span>
            <input
              value={manualName}
              onChange={(e) => {
                const next = e.target.value
                setManualName(next)
                setError(null)
                if (value && hasValidCoords(value.lat, value.lng) && next.trim()) {
                  onChange({ ...value, proposedName: next.trim() })
                }
              }}
              placeholder="Stay / room name"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="sr-only">Address</span>
            <input
              value={manualAddress}
              onChange={(e) => {
                const next = e.target.value
                setManualAddress(next)
                setError(null)
                if (value && hasValidCoords(value.lat, value.lng) && next.trim()) {
                  onChange({
                    ...value,
                    proposedAddress: next.trim(),
                    mapUrl: coordsMapUrl(value.lat, value.lng),
                  })
                }
              }}
              placeholder="Full address"
              className={fieldClass}
            />
          </label>
        </div>

        {error && (
          <p className="rounded-xl bg-[#fdeeee] px-3 py-2 text-sm text-[#9b2c2c]">{error}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={findAddressOnMap}
            disabled={searching}
            className="rounded-full bg-[#0c1419] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase transition hover:bg-[#1a2830] disabled:opacity-60"
          >
            {searching ? 'Finding…' : 'Find address'}
          </button>
          {mapsHref && (
            <a
              href={mapsHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-[#b9c8d1] bg-white/80 px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-[#5a6a74] uppercase transition hover:border-[#0c1419]/35 hover:bg-white hover:text-[#0c1419]"
            >
              Preview pin
            </a>
          )}
        </div>
        <p className="text-xs leading-relaxed text-[#6a7c86]">
          {lookingUp
            ? 'Reading the address from the pin…'
            : pinSet
              ? 'Pin saved on this page. Drag it if the spot is slightly off — the address updates with it. Preview pin only opens Google Maps and does not change this form.'
              : 'Stay on this page. Find address places the pin here. Do not leave this form to set the address.'}
        </p>
      </div>

      <div className="relative mt-4">
        <div
          ref={mapElRef}
          className="h-[280px] w-full overflow-hidden border-y border-[#d5e0e6] bg-[#dce6eb] sm:h-[320px]"
        />

        <div className="absolute top-3 left-3 z-[500] flex overflow-hidden rounded-full border border-white/80 bg-white/95 shadow-[0_10px_24px_-16px_rgba(12,20,25,0.7)]">
          {(
            [
              ['street', 'Street'],
              ['satellite', 'Satellite'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => showBasemap(id)}
              aria-pressed={basemap === id}
              className={`px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase transition sm:px-3 ${
                basemap === id ? 'bg-[#0c1419] text-white' : 'text-[#3d4c55] hover:bg-[#f3f7f8]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {!pinSet && (
          <div className="pointer-events-none absolute inset-x-0 top-14 flex justify-center px-4">
            <span className="rounded-full border border-white/70 bg-[#0c1419]/78 px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-white shadow-[0_10px_24px_-12px_rgba(12,20,25,0.55)] backdrop-blur-md">
              Tap the map to drop your pin
            </span>
          </div>
        )}

        {value && hasValidCoords(value.lat, value.lng) && (
          <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4">
            <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/92 px-3.5 py-3 shadow-[0_16px_36px_-20px_rgba(12,20,25,0.55)] backdrop-blur-md">
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1f4d52]/12 text-[#1f4d52]"
                aria-hidden
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#0c1419]">{value.proposedName}</p>
                <p className="truncate text-xs text-[#5a6a74]">{value.proposedAddress}</p>
                <p className="mt-1 font-mono text-[10px] tracking-wide text-[#7a8b95]">
                  {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
                </p>
              </div>
              <p className="shrink-0 self-center text-[10px] font-semibold tracking-[0.12em] text-[#1f4d52] uppercase">
                Selected
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="px-4 py-3 text-xs text-[#6a7c86] sm:px-5">
        Tap or drag the pin to set the stay. The address field fills from that spot.
      </p>
    </div>
  )
}

export function MapPicker({
  value,
  onChange,
}: {
  value: MapPick | null
  onChange: (pick: MapPick) => void
}) {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() || ''
  const mapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const markerRef = useRef<{ setPosition: (p: { lat: number; lng: number }) => void } | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!apiKey) return
    let cancelled = false
    loadMapsScript(apiKey)
      .then(() => {
        if (cancelled || !mapRef.current || !inputRef.current || !window.google) return
        const map = new window.google.maps.Map(mapRef.current, {
          center: value && hasValidCoords(value.lat, value.lng) ? { lat: value.lat, lng: value.lng } : PONDY,
          zoom: 14,
          mapTypeControl: false,
        })
        const marker = new window.google.maps.Marker({
          map,
          position:
            value && hasValidCoords(value.lat, value.lng)
              ? { lat: value.lat, lng: value.lng }
              : PONDY,
        })
        markerRef.current = marker

        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ['name', 'formatted_address', 'geometry', 'place_id'],
          componentRestrictions: { country: 'in' },
        })
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          const loc = place.geometry?.location
          if (!loc) return
          const lat = loc.lat()
          const lng = loc.lng()
          map.setCenter({ lat, lng })
          marker.setPosition({ lat, lng })
          onChange({
            proposedName: place.name || place.formatted_address || 'Selected place',
            proposedAddress: place.formatted_address || place.name || `${lat}, ${lng}`,
            lat,
            lng,
            placeId: place.place_id || null,
            mapUrl: coordsMapUrl(lat, lng),
          })
        })

        map.addListener('click', (e) => {
          const lat = e.latLng.lat()
          const lng = e.latLng.lng()
          marker.setPosition({ lat, lng })
          onChange({
            proposedName: value?.proposedName || 'Selected location',
            proposedAddress: value?.proposedAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            lat,
            lng,
            placeId: value?.placeId || null,
            mapUrl: coordsMapUrl(lat, lng),
          })
        })

        setReady(true)
      })
      .catch((err) => setError((err as Error).message))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

  if (!apiKey) {
    return <ManualMapFallback value={value} onChange={onChange} />
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        placeholder="Search stay or address on Google Maps"
        className="w-full rounded-xl border border-[#b4c4ce] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0c1419]"
      />
      <div ref={mapRef} className="h-64 w-full overflow-hidden rounded-2xl border border-[#d5e0e6] bg-[#e8eef2]" />
      {!ready && !error && <p className="text-sm text-[#5a6a74]">Loading map…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {value && hasValidCoords(value.lat, value.lng) && (
        <div className="rounded-xl bg-[#f4f7f9] px-3 py-2 text-sm text-[#0c1419]">
          <p className="font-medium">{value.proposedName}</p>
          <p className="text-[#5a6a74]">{value.proposedAddress}</p>
          <p className="mt-1 text-xs text-[#5a6a74]">
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </p>
        </div>
      )}
    </div>
  )
}
