import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import Link from 'next/link'

interface WritingCardProps {
  id: string
  title: string
  description: string
  date: string
}

export function WritingCard({ id, title, description }: WritingCardProps) {
  return (
    <Link href={`/writing/${id}`}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

