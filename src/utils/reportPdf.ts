import html2pdf from 'html2pdf.js'

// Renders the print-only visit report (hidden on screen) into a PDF and returns it as base64.
export async function visitReportToPdfBase64(source: HTMLElement): Promise<string> {
  const clone = source.cloneNode(true) as HTMLElement
  clone.classList.remove('hidden')
  clone.classList.add('block')
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:720px;background:#fff'
  host.appendChild(clone)
  document.body.appendChild(host)
  try {
    const dataUri: string = await html2pdf()
      .set({
        margin: 10,
        image: { type: 'jpeg', quality: 0.9 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(clone)
      .outputPdf('datauristring')
    return dataUri.slice(dataUri.indexOf('base64,') + 'base64,'.length)
  } finally {
    host.remove()
  }
}
