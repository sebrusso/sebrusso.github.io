import { CONTENT_PADDING, MAX_CONTENT_WIDTH } from '@/lib/constants'

export default function WithTimelineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`container mx-auto ${CONTENT_PADDING} ${MAX_CONTENT_WIDTH}`}>
      {children}
    </div>
  )
}

