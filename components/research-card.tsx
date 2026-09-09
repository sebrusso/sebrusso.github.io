'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FaChevronDown } from 'react-icons/fa'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import type { ResearchEntry } from '../lib/research'

const linkClass =
  'font-medium text-primary underline decoration-brand decoration-2 underline-offset-4 hover:text-primary/80'

interface ResearchCardProps {
  entry: ResearchEntry
  /**
   * Citation count resolved at build time by the server component. Passed in
   * rather than fetched here because this is a client component.
   */
  citations?: number | null
}

/**
 * A research entry.
 *
 * Two shapes, decided by whether the entry actually has anything to reveal:
 *
 *   expandable  — has body paragraphs and/or a figure. Renders a chevron, and
 *                 the header is a button that opens the extra content in
 *                 place. Links live inside the expanded panel.
 *   static      — nothing to reveal. No chevron, no button, no hover state;
 *                 the links render inline since there's no panel to hide them
 *                 in.
 *
 * The affordance is the chevron alone — no "Read more" label.
 */
export function ResearchCard({ entry, citations }: ResearchCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const isExpandable = entry.body.length > 0 || Boolean(entry.figure)
  const panelId = `${entry.id}-panel`
  const meta = citations ? `${entry.meta} · ${citations} citations` : entry.meta

  // Title, meta, authors and the two-sentence summary. Always visible, in both
  // shapes — shared here so the two branches below can't drift apart.
  const head = (
    <>
      <CardHeader className="gap-1.5">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg leading-snug">{entry.title}</CardTitle>
          {isExpandable && (
            <FaChevronDown
              aria-hidden="true"
              className={`mt-1 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground">{meta}</p>
        {entry.authors && (
          <p className="text-sm text-muted-foreground">
            {entry.authors.map((name, i) => (
              <span key={name}>
                {i > 0 && ', '}
                {/* Seb's own name gets full contrast so it's findable in the
                    author list at a glance. */}
                <span className={name === 'Sebastian Russo' ? 'text-foreground' : undefined}>
                  {name}
                </span>
              </span>
            ))}
          </p>
        )}
      </CardHeader>

      {/* pb-0: the links block below supplies the card's bottom padding, so
          the two don't stack into a double gap. */}
      <CardContent className="pb-0">
        <p className="text-sm leading-relaxed">{entry.summary}</p>
      </CardContent>
    </>
  )

  const links = (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {entry.links.map(({ label, href }) => (
        <Link
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {label}
        </Link>
      ))}
    </div>
  )

  if (!isExpandable) {
    return (
      <Card>
        {head}
        <CardContent className="pt-4">{links}</CardContent>
      </Card>
    )
  }

  return (
    <Card className="transition-colors hover:border-brand/60">
      {/* The head is the click target so the hit area matches what looks
          pressable. A <button> for keyboard and screen-reader support; the
          chevron is decoration and carries the open/closed state visually.
          The links can't live inside it — anchors nested in a button are
          invalid and unreachable by keyboard — so they sit below. */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="w-full text-left"
      >
        {head}
      </button>

      {/* Plain conditional render rather than a CSS max-height animation: the
          figure makes the natural height vary a lot between entries, and any
          fixed max-height either clips the tall card or makes the short one
          slide for too long. */}
      {isExpanded && (
        <CardContent id={panelId} className="grid gap-4 pt-4">
          {entry.body.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="text-sm leading-relaxed">
              {paragraph}
            </p>
          ))}

          {entry.figure && (
            <figure>
              <Image
                src={entry.figure.src}
                alt={entry.figure.alt}
                width={entry.figure.width}
                height={entry.figure.height}
                sizes="(min-width: 768px) 830px, 100vw"
                className="w-full rounded-md border"
              />
              <figcaption className="mt-2 text-sm text-muted-foreground">
                {entry.figure.caption}
              </figcaption>
            </figure>
          )}
        </CardContent>
      )}

      {/* Links stay the card's footer in both states: last thing when
          collapsed, still last once the panel is open above them. */}
      <CardContent className="pt-4">{links}</CardContent>
    </Card>
  )
}
