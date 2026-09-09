import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getMarkdownContent, getAllPosts } from '../../../lib/posts'
import { formatPostDate } from '../../../lib/dates'
import { PROSE_WIDTH } from '../../../lib/constants'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function WritingPage({ params }: PageProps) {
  const { id } = await params
  const post = await getMarkdownContent(id)

  if (!post) {
    notFound()
  }

  return (
    // The shell is wider than an essay wants to be; hold the measure here.
    <article className={`py-6 mx-auto ${PROSE_WIDTH}`}>
      <h1 className="text-3xl font-bold tracking-tight">{post.metadata.title}</h1>
      {post.metadata.date && (
        <p className="mt-2 mb-8 text-sm text-muted-foreground">
          <time dateTime={post.metadata.date}>{formatPostDate(post.metadata.date)}</time>
        </p>
      )}

      {/* No `prose` classes here: @tailwindcss/typography was never installed,
          so they have always been no-ops. Every element is styled explicitly
          below. react-markdown v9 also dropped the `className` prop. */}
      <div className="text-base leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ ...props }) => (
              <a
                className="font-medium text-primary underline decoration-brand decoration-2 underline-offset-4 hover:text-primary/80"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              />
            ),
            h1: ({ ...props }) => <h2 className="text-2xl font-bold mt-8 mb-4" {...props} />,
            h2: ({ ...props }) => <h2 className="text-xl font-bold mt-6 mb-3" {...props} />,
            h3: ({ ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
            h4: ({ ...props }) => <h4 className="text-base font-semibold mt-3 mb-2" {...props} />,
            p: ({ ...props }) => <p className="mb-4" {...props} />,
            ul: ({ ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
            ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
            blockquote: ({ ...props }) => (
              <blockquote className="border-l-4 border-brand pl-4 italic my-4" {...props} />
            ),
            hr: ({ ...props }) => <hr className="my-8 border-border" {...props} />,
            code: ({ ...props }) => (
              <code className="bg-muted rounded px-1 py-0.5" {...props} />
            ),
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      <p className="mt-10 border-t pt-6 text-sm">
        <Link
          href="/writing"
          className="font-medium text-primary underline decoration-brand decoration-2 underline-offset-4 hover:text-primary/80"
        >
          ← All essays
        </Link>
      </p>
    </article>
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const post = await getMarkdownContent(id)

  if (!post) return {}

  return {
    title: post.metadata.title,
    description: post.metadata.description,
    alternates: { canonical: `/writing/${id}` },
    openGraph: {
      type: 'article',
      title: post.metadata.title,
      description: post.metadata.description,
      url: `/writing/${id}`,
      publishedTime: post.metadata.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metadata.title,
      description: post.metadata.description,
    },
  }
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map(post => ({
    id: post.id,
  }))
}
