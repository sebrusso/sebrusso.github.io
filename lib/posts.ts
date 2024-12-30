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