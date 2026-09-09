import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import Link from 'next/link'
import { formatPostDate } from '../lib/dates'

interface WritingCardProps {
  id: string
  title: string
  description: string
  date: string
}

export function WritingCard({ id, title, description, date }: WritingCardProps) {
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
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
