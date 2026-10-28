import html2pdf from 'html2pdf.js'

// Renders the print-only visit report (hidden on screen) into a PDF and returns it as base64.
export async function visitReportToPdfBase64(source: HTMLElement, visitId: string): Promise<string> {
  const clone = source.cloneNode(true) as HTMLElement
  clone.classList.remove('hidden')
  clone.classList.add('block')
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:720px;background:#fff'
  host.appendChild(clone)
  document.body.appendChild(host)
  try {
    const worker = html2pdf()
      .set({
        margin: [10, 10, 14, 10],
        image: { type: 'jpeg', quality: 0.9 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(clone)
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
    const dataUri: string = pdf.output('datauristring')
    return dataUri.slice(dataUri.indexOf('base64,') + 'base64,'.length)
  } finally {
    host.remove()
  }
}
