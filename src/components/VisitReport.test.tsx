// @vitest-environment jsdom
import { describe, expect, it, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { ReportPhotos } from './VisitReport'
import { PDF_PAGEBREAK } from '../utils/reportPdf'

afterEach(cleanup)

const photos = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, previewUrl: `data:image/png;base64,${i}` }))

describe('ReportPhotos', () => {
  it('renders nothing for 0 photos', () => {
    const { container } = render(<ReportPhotos photos={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders 1 photo as a single image', () => {
    const { container } = render(<ReportPhotos photos={photos(1)} />)
    expect(container.querySelectorAll('img')).toHaveLength(1)
  })

  it.each([2, 3, 4])('renders %i photos in an unbreakable uniform grid, uncropped', (n) => {
    const { getByTestId, container } = render(<ReportPhotos photos={photos(n)} />)
    expect(getByTestId('report-photos').className).toContain('break-inside-avoid')
    const imgs = [...container.querySelectorAll('img')]
    expect(imgs).toHaveLength(n)
    imgs.forEach((i) => {
      expect(i.className).toContain('aspect-[4/3]')
      expect(i.className).toContain('object-contain')
      expect(i.className).not.toContain('object-cover')
    })
  })

  it('never renders more than 4 photos', () => {
    const { container } = render(<ReportPhotos photos={photos(6)} />)
    expect(container.querySelectorAll('img')).toHaveLength(4)
  })
})

describe('PDF page breaks', () => {
  it('avoids splitting rows and photo grids across pages', () => {
    expect(PDF_PAGEBREAK.avoid).toEqual(expect.arrayContaining(['tr', 'img']))
  })
})
