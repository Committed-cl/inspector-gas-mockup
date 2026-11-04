// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest'
import { inlineRemoteImages } from './reportPdf'

afterEach(() => vi.unstubAllGlobals())

function root(srcs: string[]) {
  const el = document.createElement('div')
  el.innerHTML = srcs.map((s) => `<img src="${s}" class="w-full" />`).join('')
  el.querySelectorAll('img').forEach((img) => ((img as HTMLImageElement).decode = () => Promise.resolve()))
  return el
}

describe('inlineRemoteImages', () => {
  it('inlines remote photos as data URLs using a fresh CORS fetch and leaves data URLs alone', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, blob: async () => new Blob(['x'], { type: 'image/jpeg' }) }))
    vi.stubGlobal('fetch', fetchMock)
    const el = root(['https://storage.googleapis.com/b/p1.jpg', 'data:image/png;base64,AAAA'])
    const failed = await inlineRemoteImages(el)
    expect(failed).toBe(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('https://storage.googleapis.com/b/p1.jpg', { mode: 'cors', cache: 'reload' })
    expect([...el.querySelectorAll('img')].every((i) => i.src.startsWith('data:'))).toBe(true)
  })

  it('replaces a photo that cannot be loaded with an explicit note instead of an empty box', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('blocked by CORS') }))
    const el = root(['https://storage.googleapis.com/b/p1.jpg'])
    expect(await inlineRemoteImages(el)).toBe(1)
    expect(el.querySelector('img')).toBeNull()
    expect(el.textContent).toContain('Foto no disponible')
  })
})
