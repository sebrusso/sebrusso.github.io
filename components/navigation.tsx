'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../lib/utils'
import { navigationConfig } from '../config/navigationConfig'
import { ThemeToggle } from './theme-toggle'

const links = [
  { href: '/', label: 'about' },
  ...(navigationConfig.showWritingTab ? [{ href: '/writing', label: 'writing' }] : []),
  ...(navigationConfig.showResearchTab ? [{ href: '/research', label: 'research' }] : []),
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b my-2 bg-muted/20">
      <div className="container mx-auto max-w-[60rem] flex h-10 items-center justify-between px-4 md:px-8">
        <div className="flex gap-6">
          {links.map(({ href, label }) => {
            // /writing/<slug> should keep the writing tab lit.
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'text-sm transition-colors hover:text-foreground/80',
                  active
                    ? 'text-foreground underline decoration-brand decoration-2 underline-offset-8'
                    : 'text-foreground/60'
                )}
              >
                {label}
              </Link>
            )
          })}
        </div>
        <ThemeToggle />
      </div>
    </nav>
  )
}
