interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 pb-1">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  )
}
