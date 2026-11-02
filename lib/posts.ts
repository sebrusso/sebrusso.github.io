import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { Post, PostMetadata } from './types'

const POSTS_DIRECTORY = path.join(process.cwd(), 'content/posts')

export async function getMarkdownContent(id: string) {
  try {
    const fullPath = path.join(POSTS_DIRECTORY, `${id}.md`)
    const fileContents = await fs.promises.readFile(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    
    return {
      metadata: data as PostMetadata,
      content,
    }
  } catch (error) {
    console.error(`Error reading markdown file ${id}:`, error)
    return null
  }
}

export function getAllPosts(): Post[] {
  try {
    const fileNames = fs.readdirSync(POSTS_DIRECTORY)
    
    return fileNames
      .filter(fileName => fileName.endsWith('.md'))
      .map(fileName => {
        const id = fileName.replace(/\.md$/, '')
        const fullPath = path.join(POSTS_DIRECTORY, fileName)
        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const { data } = matter(fileContents)
        
        return {
          id,
          title: data.title,
          description: data.description,
          date: data.date,
          content: '...'
        }
      })
      .sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime()))
  } catch (error) {
    console.error('Error reading posts directory:', error)
    return []
  }
} 
/**
 * Essays written as TSX pages (app/writing/<id>/page.tsx) instead of markdown,
 * because they need components react-markdown can't render. Listed in the
 * writing index and sitemap, but kept out of getAllPosts() so /writing/[id]'s
 * generateStaticParams never emits a path a static route already owns.
 */
export const PAGE_POSTS: Post[] = [
  {
    id: 'tqs-learnings',
    title: 'Teaching a model to score the quality of code RL tasks',
    description:
      'Fine-tuning Qwen3-8B to predict how human reviewers rate SWE-bench tasks, and what it learned about vague issues and tests that reject correct fixes.',
    date: '2026-11-02',
    content: '',
    image: {
      src: '/images/tqs-learnings-card.webp',
      alt: 'Architecture diagram: a task\'s tokens pass through Qwen3-8B with LoRA adapters into three rating heads and a quality-score head.',
      width: 1836,
      height: 734,
    },
  },
]

/** Markdown posts plus TSX essays, newest first. For index pages and the sitemap. */
export function getWritingIndex(): Post[] {
  return [...getAllPosts(), ...PAGE_POSTS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}
