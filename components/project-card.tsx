import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import Image from 'next/image'
import Link from 'next/link'

interface ProjectCardProps {
  id: string
  title: string
  description: string
  media: string
  date: string
}

export function ProjectCard({ id, title, description, media, date }: ProjectCardProps) {
  return (
    <Link href={`/projects/${id}`}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">{description}</p>
          {media && (
            <div className="aspect-video relative overflow-hidden rounded-lg h-32">
              <Image
                src={media}
                alt={title}
                fill
                className="object-cover"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

