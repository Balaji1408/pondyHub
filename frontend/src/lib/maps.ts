/** Build a Google Maps search URL for a place name / address. */
export function googleMapsSearchUrl(location: string, regionHint = 'Puducherry'): string {
  const trimmed = location.trim()
  const query =
    /puducherry|pondicherry|pondy/i.test(trimmed) ? trimmed : `${trimmed}, ${regionHint}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
