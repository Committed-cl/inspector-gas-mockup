// No file storage backend exists yet — photos are downscaled/compressed in
// the browser and kept inline as a data: URL, stored as part of the chat
// message / evidence record itself. Keeps entries comfortably within
// Datastore's ~1MiB entity cap without provisioning new infra. See the
// AI-chat implementation notes for why this tradeoff was chosen.
const MAX_DIMENSION = 1024
const JPEG_QUALITY = 0.7

export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
      const width = Math.round(img.width * scale)
      const height = Math.round(img.height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      URL.revokeObjectURL(objectUrl)

      if (!ctx) {
        reject(new Error('No se pudo procesar la imagen.'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('No se pudo leer la imagen.'))
    }

    img.src = objectUrl
  })
}
