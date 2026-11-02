import { useEffect, useState } from 'react'
import { ApiError, putFile } from '../lib/api'

export const LOGO_MAX_BYTES = 500 * 1024
export const LOGO_MAX_WIDTH = 1000
export const LOGO_MAX_HEIGHT = 500

function readDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve(null)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

// Friendly pre-checks; the API re-validates everything by the file's bytes.
async function validate(file: File): Promise<string | null> {
  if (file.type !== 'image/png' && file.type !== 'image/jpeg') return 'El archivo debe ser PNG o JPG (no se aceptan SVG ni otros formatos).'
  if (file.size > LOGO_MAX_BYTES) return `El logo pesa ${Math.ceil(file.size / 1024)} KB; el máximo es 500 KB.`
  const dims = await readDimensions(file)
  if (!dims) return 'No se pudo leer la imagen; el archivo parece estar dañado.'
  if (dims.width > LOGO_MAX_WIDTH || dims.height > LOGO_MAX_HEIGHT) {
    return `El logo mide ${dims.width}×${dims.height} px; el máximo es ${LOGO_MAX_WIDTH}×${LOGO_MAX_HEIGHT} px.`
  }
  return null
}

type Props = { companyId: string; onUploaded: () => void; onCancel?: () => void }

export default function LogoUploader({ companyId, onUploaded, onCancel }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!file) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const choose = async (picked: File | undefined) => {
    setError(null)
    setFile(null)
    if (!picked) return
    const problem = await validate(picked)
    if (problem) return setError(problem)
    setFile(picked)
  }

  const upload = async () => {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      await putFile(`/companies/${encodeURIComponent(companyId)}/logo`, file)
      setFile(null)
      onUploaded()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo subir el logo.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 items-start">
      <input
        type="file"
        accept="image/png,image/jpeg"
        aria-label="Archivo del logo"
        onChange={(e) => choose(e.target.files?.[0])}
        className="text-[12.5px] max-w-[220px]"
      />
      <p className="text-[11.5px] text-muted">PNG o JPG, máx. 500 KB y 1000×500 px (fondo transparente recomendado).</p>
      {preview && <img src={preview} alt="Vista previa del logo" className="h-12 max-w-[200px] object-contain border border-hairline rounded p-1 bg-white" />}
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={upload} disabled={!file || uploading} className="text-brand font-semibold text-[12.5px] disabled:opacity-50">
          {uploading ? 'Subiendo...' : 'Subir logo'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-muted text-[12.5px]">
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}
