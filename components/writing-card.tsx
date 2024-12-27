import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Writing } from '@/lib/types'
import Link from 'next/link'

interface WritingCardProps {
  writing: Writing
}

export function WritingCard({ writing }: WritingCardProps) {
  return (
    <Link href={`/writing/${writing.id}`}>
      <Card className="hover:bg-muted/50 transition-colors w-full md:w-2/3">
        <CardHeader>
          <CardTitle>{writing.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{writing.description}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

