import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getMarkdownContent } from '@/lib/posts'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function WritingPage({ params }: PageProps) {
  const { id } = await params
  const post = getMarkdownContent(id)

  if (!post) {
    notFound()
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="pl-6 pr-6">
        <article className="prose prose-gray dark:prose-invert max-w-none py-6">
          <h1 className="text-3xl font-bold">{post.metadata.title}</h1>
          <div className="text-sm text-muted-foreground mb-8">
            {post.metadata.date && (
              <time dateTime={new Date(post.metadata.date).toISOString()}>
                {new Date(post.metadata.date).toLocaleDateString()}
              </time>
            )}
          </div>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            className="prose prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base dark:prose-invert"
            components={{
              h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-8 mb-4" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-6 mb-3" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
              h4: ({node, ...props}) => <h4 className="text-base font-semibold mt-3 mb-2" {...props} />,
              p: ({node, ...props}) => <p className="mb-4" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic my-4" {...props} />,
              code: ({node, inline, ...props}) => 
                inline ? 
                  <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5" {...props} /> :
                  <code className="block bg-gray-100 dark:bg-gray-800 rounded p-4 my-4 overflow-x-auto" {...props} />
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  )
}

