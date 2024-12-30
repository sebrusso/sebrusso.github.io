import { ProjectCard } from '@/components/project-card'
import type { Project } from '@/lib/types'

const projects: Project[] = [
  {
    id: 'neural-interface',
    title: 'Neural Interface Project',
    description: 'A brain-computer interface for controlling robotic prosthetics using machine learning algorithms.',
    media: '/placeholder.svg?height=400&width=600',
    date: 'December 2024'
  },
  {
    id: 'economic-data',
    title: 'Economic Data Visualization',
    description: 'Interactive platform for visualizing complex economic data and market trends.',
    media: '/placeholder.svg?height=400&width=600',
    date: 'November 2024'
  },
  {
    id: 'quantum-sim',
    title: 'Quantum Algorithm Simulator',
    description: 'Web-based simulator for testing and visualizing quantum computing algorithms.',
    media: '/placeholder.svg?height=400&width=600',
    date: 'October 2024'
  },
  {
    id: 'energy-dashboard',
    title: 'Sustainable Energy Dashboard',
    description: 'Real-time monitoring system for renewable energy production and consumption.',
    media: '/placeholder.svg?height=400&width=600',
    date: 'September 2024'
  },
  {
    id: 'ai-tutor',
    title: 'AI-Powered Language Tutor',
    description: 'Personalized language learning application using natural language processing.',
    media: '/placeholder.svg?height=400&width=600',
    date: 'August 2024'
  },
  {
    id: 'blockchain-voting',
    title: 'Blockchain Voting System',
    description: 'Secure and transparent electronic voting platform using blockchain technology.',
    media: '/placeholder.svg?height=400&width=600',
    date: 'July 2024'
  }
]

export default function ProjectsPage() {
  return (
    <div className="container mx-auto max-w-2xl">
      <div className="pl-6">
        <div className="grid gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function generateMetadata() {
  return {
    title: 'Projects',
    description: 'My portfolio of projects and experiments.',
  }
}

