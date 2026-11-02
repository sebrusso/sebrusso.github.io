export type TocItem = { id: string; title: string }
export type TocSection = TocItem & { children?: TocItem[] }

const link =
  'text-foreground underline decoration-brand/40 underline-offset-4 transition-colors hover:text-primary hover:decoration-brand'

export function TableOfContents({ sections }: { sections: TocSection[] }) {
  return (
    <nav aria-label="Contents" className="my-8 rounded-lg border bg-card px-4 py-4 sm:px-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Contents</p>
      <ol className="gap-x-8 text-sm leading-snug sm:columns-2">
        {sections.map((s) => (
          <li key={s.id} className="mb-2.5 break-inside-avoid">
            <a href={`#${s.id}`} className={`font-medium ${link}`}>
              {s.title}
            </a>
            {s.children && s.children.length > 0 && (
              <ul className="mt-1.5 space-y-1 border-l pl-3 text-muted-foreground">
                {s.children.map((c) => (
                  <li key={c.id}>
                    <a href={`#${c.id}`} className={`text-muted-foreground ${link}`}>
                      {c.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
