import { WritingCard } from '@/components/writing-card'
import { CONTENT_GAP } from '@/lib/constants'
import { Timeline } from '@/components/timeline'

const writings = [
  {
    id: '1',
    title: 'Understanding Neural Networks',
    description: 'An exploration of deep learning architectures and their applications in modern AI systems...',
    date: 'December 2024',
    content: '...'
  },
  {
    id: '2',
    title: 'The Economics of Open Source',
    description: 'Analyzing the sustainability and economic impacts of open source software development...',
    date: 'November 2024',
    content: '...'
  },
  {
    id: '3',
    title: 'Cognitive Science and UI Design',
    description: 'How understanding human cognition can lead to better user interface design principles...',
    date: 'October 2024',
    content: '...'
  },
  {
    id: '4',
    title: 'The Future of Computing',
    description: 'Exploring emerging trends in quantum computing and their potential impact on society...',
    date: 'September 2024',
    content: '...'
  },
  {
    id: '5',
    title: 'Blockchain and Decentralized Finance',
    description: 'Examining the potential of blockchain technology to revolutionize financial systems...',
    date: 'August 2024',
    content: '...'
  },
  {
    id: '6',
    title: 'The Ethics of Artificial Intelligence',
    description: 'Discussing the moral implications and societal impacts of advanced AI systems...',
    date: 'July 2024',
    content: '...'
  },
  {
    id: '7',
    title: 'Quantum Cryptography',
    description: 'Exploring the intersection of quantum mechanics and information security...',
    date: 'June 2024',
    content: '...'
  },
  {
    id: '8',
    title: 'The Psychology of User Experience',
    description: 'Analyzing how cognitive psychology principles can enhance digital product design...',
    date: 'May 2024',
    content: '...'
  }
]

export default function WritingPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-6">
      <Timeline dates={writings.map(w => w.date)} />
      <div className={`space-y-${CONTENT_GAP}`}>
        {writings.map((writing) => (
          <WritingCard key={writing.id} writing={writing} />
        ))}
      </div>
    </div>
  )
}

export function generateMetadata() {
  return {
    title: 'Writing | Sebastian Russo',
  }
}

