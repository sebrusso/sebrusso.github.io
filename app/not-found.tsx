import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="pt-16 pb-16 text-center">
      <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
      <p className="text-muted-foreground mb-8">
        Sorry, the page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="font-medium text-primary underline decoration-brand decoration-2 underline-offset-4 transition-colors hover:text-primary/80"
      >
        Go back home
      </Link>
    </div>
  )
}
