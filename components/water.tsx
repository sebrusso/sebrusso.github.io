'use client'

import { useEffect, useRef } from 'react'

const SCALE = 8
const FRAME_MS = 50

// The caustics take the theme's highlight hue: pastel orange on light, neon
// blue on dark. Dark needs a little more alpha to read against near-black.
const LIGHT_TINT = { rgb: [246, 158, 79], alpha: 9 }
const DARK_TINT = { rgb: [66, 180, 255], alpha: 7 }

export function Water() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = 0
    let w = 0
    let h = 0
    let img: ImageData
    let tint = LIGHT_TINT

    const readTint = () =>
      document.documentElement.classList.contains('dark') ? DARK_TINT : LIGHT_TINT

    const paintTint = () => {
      if (!img) return
      const d = img.data
      const [r, g, b] = tint.rgb
      for (let i = 0; i < d.length; i += 4) {
        d[i] = r
        d[i + 1] = g
        d[i + 2] = b
      }
    }

    const resize = () => {
      w = Math.max(1, Math.ceil(window.innerWidth / SCALE))
      h = Math.max(1, Math.ceil(window.innerHeight / SCALE))
      canvas.width = w
      canvas.height = h
      img = ctx.createImageData(w, h)
      paintTint()
    }

    const render = (ms: number) => {
      const t = ms * 0.00007
      const d = img.data
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let px = x * 0.22
          let py = y * 0.22
          px += 0.9 * Math.sin(py * 0.5 + t * 3.1)
          py += 0.9 * Math.cos(px * 0.45 - t * 2.3)
          px += 0.5 * Math.sin(py * 1.1 - t * 4.7)
          py += 0.5 * Math.cos(px * 0.9 + t * 3.7)
          const s = Math.sin(px) * Math.sin(py)
          const ridge = Math.pow(1 - Math.abs(s), 6)
          d[(y * w + x) * 4 + 3] = ridge * tint.alpha
        }
      }
      ctx.putImageData(img, 0, 0)
    }

    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop)
      if (ms - last < FRAME_MS) return
      last = ms
      render(ms)
    }

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    tint = readTint()
    resize()
    const onResize = () => {
      resize()
      if (still) render(performance.now())
    }
    window.addEventListener('resize', onResize)

    // Repaint the tint when the theme toggle flips the class on <html>.
    const observer = new MutationObserver(() => {
      const next = readTint()
      if (next === tint) return
      tint = next
      paintTint()
      if (still) render(performance.now())
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    if (still) {
      render(performance.now())
    } else {
      raf = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      observer.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ filter: 'blur(2px)', transform: 'scale(1.03)' }}
    />
  )
}
