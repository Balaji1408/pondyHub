const MAX_SIDE = 1600

/** Downscales a picked photo to at most 1600px and re-encodes it as JPEG for upload. */
export async function fileToJpegDataUrl(file: File) {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not process this image')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.85)
  } catch {
    throw new Error('Could not read this image. Try a JPG or PNG photo.')
  } finally {
    URL.revokeObjectURL(url)
  }
}
