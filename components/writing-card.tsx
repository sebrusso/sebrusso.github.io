import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import Link from 'next/link'
import { formatPostDate } from '../lib/dates'
import type { PostImage } from '../lib/types'

interface WritingCardProps {
  id: string
  title: string
  description: string
  date: string
  image?: PostImage
}

export function WritingCard({ id, title, description, date, image }: WritingCardProps) {
  return (
    <Card className="transition-colors hover:border-brand">
      <CardHeader>
        <CardTitle>
          {/* Only the title is the link. Wrapping the whole card makes the
              accessible name the title and description run together. */}
          <Link
            href={`/writing/${id}`}
            className="underline decoration-brand/40 decoration-2 underline-offset-4 transition-colors hover:decoration-brand"
          >
            {title}
          </Link>
        </CardTitle>
        {date && (
          <p className="text-sm text-muted-foreground">
            <time dateTime={date}>{formatPostDate(date)}</time>
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground">{description}</p>
        {image && (
          // Decorative duplicate of the title link: hidden from the tab order and screen readers.
          <Link href={`/writing/${id}`} tabIndex={-1} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, images are unoptimized */}
            <img
              src={image.src}
              alt=""
              width={image.width}
              height={image.height}
              loading="lazy"
              className="h-auto w-full rounded-md border"
            />
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
