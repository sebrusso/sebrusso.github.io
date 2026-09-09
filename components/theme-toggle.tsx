'use client'

import { useEffect, useState } from 'react'
import { FaMoon, FaSun } from 'react-icons/fa'

export function ThemeToggle() {
  // Starts undefined so the button renders inert on the server and on the
  // first client pass; ThemeScript has already set the class by then, we just
  // read it back once mounted.
  const [isDark, setIsDark] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  // Follow the OS while the visitor hasn't made an explicit choice.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => {
      if (localStorage.getItem('theme')) return
      document.documentElement.classList.toggle('dark', event.matches)
      setIsDark(event.matches)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // Non-fatal: the theme just won't persist across visits.
    }
    setIsDark(next)
  }

  const label =
    isDark === undefined
      ? 'Toggle theme'
      : isDark
        ? 'Switch to light theme'
        : 'Switch to dark theme'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="rounded-md p-1.5 text-foreground/60 transition-colors hover:bg-brand-soft hover:text-primary"
    >
      {isDark ? <FaSun className="h-4 w-4" /> : <FaMoon className="h-4 w-4" />}
    </button>
  )
}
