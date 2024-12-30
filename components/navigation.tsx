'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../lib/utils'
import { navigationConfig } from '../config/navigationConfig'

const links = [
  { href: '/', label: 'about' },
  ...(navigationConfig.showWritingTab ? [{ href: '/writing', label: 'writing' }] : []),
  ...(navigationConfig.showProjectsTab ? [{ href: '/projects', label: 'projects' }] : [])
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b my-2 bg-muted/20">
      <div className="container mx-auto max-w-2xl flex h-10 items-center px-4 md:px-0">
        <div className="flex gap-6">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'text-sm transition-colors hover:text-foreground/80',
                pathname === href ? 'text-foreground' : 'text-foreground/60'
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

