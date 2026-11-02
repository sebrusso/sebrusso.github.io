import Link from 'next/link'
import { WritingCard } from '../../components/writing-card'
import { getWritingIndex } from '../../lib/posts'

export default function WritingPage() {
  const posts = getWritingIndex()

  return (
    <div className="py-6">
      <div className="flex flex-col gap-6">
        {posts.map((post) => (
          <WritingCard key={post.id} {...post} />
        ))}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        See my{' '}
        <Link
          href="https://sebrusso.substack.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline decoration-brand decoration-2 underline-offset-4 hover:text-primary/80"
        >
          Substack
        </Link>
        .
      </p>
    </div>
  )
}

export function generateMetadata() {
  return {
    title: 'Writing',
    description:
      'Essays on suburbia, cars, family, and the parts of American life that only look normal until you leave.',
  }
}
