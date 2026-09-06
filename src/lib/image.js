const MAX_EDGE = 1000
const QUALITY = 0.82

/**
 * Reads a File and returns a downscaled JPEG data URL. Browser storage is only
 * a few MB, so full-size camera images have to be shrunk before they are saved.
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('That file is not an image.'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not decode that image.'))
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
        const width = Math.round(img.width * scale)
        const height = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', QUALITY))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export const approxSize = (dataUrl) => {
  if (!dataUrl || !dataUrl.startsWith('data:')) return 0
  return Math.round((dataUrl.length * 3) / 4 / 1024)
}
