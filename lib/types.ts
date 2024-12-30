// Base interface for common properties
interface BaseContent {
  id: string
  title: string
  description: string
  date: string
}

// Post-specific interfaces
export interface Post extends BaseContent {
  content: string
}

export interface PostMetadata {
  title: string
  date: string
  description: string
}

// Project-specific interface
export interface Project extends BaseContent {
  media: string
}

