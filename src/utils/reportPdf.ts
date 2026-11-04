import html2pdf from 'html2pdf.js'

// html2pdf's own `avoid` does not work for table rows (margins on <tr> are ignored), so rows cut mid-text at page
// boundaries. We paginate ourselves: every unbreakable block that would cross a page boundary is pushed to the next page.
const PAGE_MARGIN_MM = [10, 10, 14, 10]
const PAGE_W_MM = 210
const PAGE_H_MM = 297
export const PDF_PAGEBREAK = { mode: [] as string[] }
const AVOID_SELECTOR = 'tr, p, li, h2, h3, [data-testid="report-photos"]'

// Extra room a block needs below itself so it is not left stranded (headings need their first content row).
function keepWithNext(el: Element): number {
  if (el.matches('h2, h3')) return 130
  if (el.closest('thead')) return 70
  return 0
}

// How far (px) to push a block starting at `top` with `height` so it does not straddle a page boundary; 0 if it fits
// or is taller than a page (then it must be split anyway).
export function pageBreakShift(top: number, height: number, pageH: number): number {
  if (height >= pageH) return 0
  const page = Math.floor(top / pageH)
  return Math.floor((top + height - 0.5) / pageH) > page ? (page + 1) * pageH - top : 0
}

function paginate(root: HTMLElement) {
  const contentW = PAGE_W_MM - PAGE_MARGIN_MM[1] - PAGE_MARGIN_MM[3]
  const pageH = (PAGE_H_MM - PAGE_MARGIN_MM[0] - PAGE_MARGIN_MM[2]) * (root.getBoundingClientRect().width / contentW)
  // Only outermost blocks: rows already contain their own paragraphs and photo grids.
  const blocks = [...root.querySelectorAll(AVOID_SELECTOR)].filter((el) => !el.parentElement?.closest('tr, li, p'))
  for (const el of blocks) {
    const rootTop = root.getBoundingClientRect().top
    const r = el.getBoundingClientRect()
    const shift = pageBreakShift(r.top - rootTop, r.height + keepWithNext(el), pageH)
    if (!shift) continue
    if (el.tagName === 'TR') {
      const cols = el.children.length
      const spacer = document.createElement('tr')
      spacer.innerHTML = `<td colspan="${cols}" style="padding:0;border:0;height:${shift}px"></td>`
      el.parentElement!.insertBefore(spacer, el)
    } else {
      const h = el as HTMLElement
      h.style.paddingTop = `${(parseFloat(getComputedStyle(h).paddingTop) || 0) + shift}px`
    }
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

// Photos live in a cross-origin bucket in production. html2canvas silently skips images it cannot read (leaving empty
// boxes), so every remote image is fetched with CORS and inlined as a data URL first. `cache: 'reload'` avoids reusing
// the non-CORS response the browser cached when the <img> was shown on screen. A photo that cannot be loaded is replaced
// by an explicit note instead of an empty box.
export async function inlineRemoteImages(root: HTMLElement): Promise<number> {
  const imgs = [...root.querySelectorAll('img')].filter((img) => img.getAttribute('src') && !img.src.startsWith('data:'))
  const results = await Promise.all(
    imgs.map(async (img) => {
      try {
        const res = await fetch(img.src, { mode: 'cors', cache: 'reload' })
        if (!res.ok) throw new Error(String(res.status))
        img.src = await blobToDataUrl(await res.blob())
        await img.decode()
        return true
      } catch {
        const note = document.createElement('div')
        note.className = `${img.className} flex items-center justify-center text-center text-muted`
        note.textContent = 'Foto no disponible'
        img.replaceWith(note)
        return false
      }
    }),
  )
  return results.filter((ok) => !ok).length
}

// Renders the print-only visit report (hidden on screen) into a jsPDF document with footer and page numbering.
async function renderVisitReport<T>(source: HTMLElement, visitId: string, run: (pdf: any) => T): Promise<T> {
  const clone = source.cloneNode(true) as HTMLElement
  clone.classList.remove('hidden')
  clone.classList.add('block')
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:720px;background:#fff'
  host.appendChild(clone)
  document.body.appendChild(host)
  try {
    await inlineRemoteImages(clone)
    await Promise.all([...clone.querySelectorAll('img')].map((img) => img.decode().catch(() => undefined)))
    paginate(clone)
    // `pagebreak` is supported by html2pdf.js but missing from its typings.
    const options = {
      margin: PAGE_MARGIN_MM,
      image: { type: 'jpeg', quality: 0.9 },
      html2canvas: { scale: 2, useCORS: true },
      pagebreak: PDF_PAGEBREAK,
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }
    const worker = html2pdf().set(options as never).from(clone)
    const pdf = await worker.toPdf().get('pdf')
    const total: number = pdf.internal.getNumberOfPages()
    const width: number = pdf.internal.pageSize.getWidth()
    const height: number = pdf.internal.pageSize.getHeight()
    pdf.setFontSize(8)
    pdf.setTextColor(120)
    for (let page = 1; page <= total; page++) {
      pdf.setPage(page)
      pdf.text(`Informe generado automáticamente por Supervisa360 al enviar la visita · ID ${visitId}`, 10, height - 6)
      pdf.text(`Página ${page} de ${total}`, width - 10, height - 6, { align: 'right' })
    }
    return await run(pdf)
  } finally {
    host.remove()
  }
}

export function visitReportToPdfBase64(source: HTMLElement, visitId: string): Promise<string> {
  return renderVisitReport(source, visitId, (pdf) => {
    const dataUri: string = pdf.output('datauristring')
    return dataUri.slice(dataUri.indexOf('base64,') + 'base64,'.length)
  })
}

export async function downloadVisitReportPdf(source: HTMLElement, visitId: string): Promise<void> {
  await renderVisitReport(source, visitId, (pdf) => pdf.save(`informe-${visitId}.pdf`))
}
