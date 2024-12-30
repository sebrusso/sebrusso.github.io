import { WritingCard } from '@/components/writing-card'
import { getAllPosts } from '@/lib/posts'

export default function WritingPage() {
  const posts = getAllPosts()

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="pl-6">
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <WritingCard key={post.id} {...post} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function generateMetadata() {
  return {
    title: 'Writing',
    description: 'My thoughts on technology, software development, and more.',
  }
}

