import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Major Updates Coming | CivicOp India',
  description: 'CivicOp India is undergoing major updates. Stay tuned!',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-background px-4">
      <div className="max-w-lg w-full text-center space-y-8">

        {/* Logo */}
        <div className="flex justify-center">
          <img src="/logo.png" alt="CivicOp India" className="h-16 w-auto" />
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Major Updates Coming
          </h1>
          <p className="text-xl text-muted-foreground">
            Stay tuned — something big is on the way.
          </p>
          <p className="text-muted-foreground">
            We&apos;re working hard to bring you a completely new experience.
          </p>
        </div>

        <div className="border-t border-border" />

        {/* CTA to app */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
            Explore our CivicOP India at
          </p>
          <a
            href="https://app.civicopindia.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-colors shadow-md"
          >
            <img
              src="https://app.civicopindia.com/CivicOP_logo.png"
              alt=""
              className="h-6 w-6"
            />
            app.civicopindia.com
          </a>
        </div>

      </div>
    </div>
  )
}
