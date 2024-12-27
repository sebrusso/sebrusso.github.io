import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Project } from '@/lib/types'
import Image from 'next/image'
import Link from 'next/link'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:bg-muted/50 transition-colors w-full md:w-2/3">
        <CardHeader>
          <CardTitle className="text-lg">{project.title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">{project.description}</p>
          {project.media && (
            <div className="aspect-video relative overflow-hidden rounded-lg h-32">
              <Image
                src={project.media}
                alt={project.title}
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

