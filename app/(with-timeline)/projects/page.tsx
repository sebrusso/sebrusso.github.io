import { ProjectCard } from '@/components/project-card'
import { CONTENT_GAP } from '@/lib/constants'
import { Timeline } from '@/components/timeline'

const projects = [
  {
    id: '1',
    title: 'Neural Interface Project',
    description: 'A brain-computer interface for controlling robotic prosthetics using machine learning algorithms.',
    media: '/placeholder.svg?height=400&width=600',
    date: 'December 2024'
  },
  {
    id: '2',
    title: 'Economic Data Visualization',
    description: 'Interactive platform for visualizing complex economic data and market trends.',
    media: '/placeholder.svg?height=400&width=600',
    date: 'November 2024'
  },
  {
    id: '3',
    title: 'Quantum Algorithm Simulator',
    description: 'Web-based simulator for testing and visualizing quantum computing algorithms.',
    media: '/placeholder.svg?height=400&width=600',
    date: 'October 2024'
  },
  {
    id: '4',
    title: 'Sustainable Energy Dashboard',
    description: 'Real-time monitoring system for renewable energy production and consumption.',
    media: '/placeholder.svg?height=400&width=600',
    date: 'September 2024'
  },
  {
    id: '5',
    title: 'AI-Powered Language Tutor',
    description: 'Personalized language learning application using natural language processing.',
    media: '/placeholder.svg?height=400&width=600',
    date: 'August 2024'
  },
  {
    id: '6',
    title: 'Blockchain Voting System',
    description: 'Secure and transparent electronic voting platform using blockchain technology.',
    media: '/placeholder.svg?height=400&width=600',
    date: 'July 2024'
  },
  {
    id: '7',
    title: 'Augmented Reality Navigation',
    description: 'AR-based indoor navigation system for large complex buildings.',
    media: '/placeholder.svg?height=400&width=600',
    date: 'June 2024'
  },
  {
    id: '8',
    title: 'Predictive Healthcare Analytics',
    description: 'Machine learning model for predicting patient outcomes and optimizing treatment plans.',
    media: '/placeholder.svg?height=400&width=600',
    date: 'May 2024'
  }
]

export default function ProjectsPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-6">
      <Timeline dates={projects.map(p => p.date)} />
      <div className={`grid ${CONTENT_GAP}`}>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}

export function generateMetadata() {
  return {
    title: 'Projects | Sebastian Russo',
  }
}

