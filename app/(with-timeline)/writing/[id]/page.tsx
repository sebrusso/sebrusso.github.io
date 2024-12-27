import { notFound } from 'next/navigation'

interface PageProps {
  params: {
    id: string
  }
}

export default function WritingPage({ params }: PageProps) {
  // In a real app, fetch the writing piece by ID
  // For now, return a simple layout
  if (!params.id) {
    notFound()
  }

  return (
    <article className="prose prose-gray dark:prose-invert max-w-none py-6">
      <h1>Title of Piece</h1>
      <p>Prose of the piece goes here...</p>
      <hr />
      <footer className="text-sm text-muted-foreground">
        <p>End</p>
        <p>Date</p>
      </footer>
    </article>
  )
}

