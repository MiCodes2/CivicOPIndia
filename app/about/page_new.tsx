import Link from "next/link"

export const metadata = {
  title: "About — Civic Opposition of India",
  description:
    "From grassroots activism to India's first GovTech Operations platform. Learn how we're transforming urban governance through data and operations.",
}

const schema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Civic Opposition of India",
  url: "https://civicopindia.com",
  founder: {
    "@type": "Person",
    name: "Mithilesh Kumar",
    jobTitle: "Founder",
    description:
      "Founder of Civic Opposition of India. Technology professional and civic architect focused on operational governance, data systems, and urban transformation.",
  },
}

export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <h1 className="text-4xl font-bold mb-6">About CivicOp: From Potholes to Platforms</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">The Origin Story</h2>
        <p className="mb-4 text-muted-foreground">
          In the summer of 2021, our founder, <strong>Mithilesh Kumar</strong>, was involved in a minor road accident in East Bengaluru. Forced off the road by a tractor, his vehicle hit a massive pothole, causing significant damage. His initial reaction was to blame the other driver.
        </p>
        <p className="mb-4 text-muted-foreground">
          However, he quickly realized the root cause wasn't the driver—it was the <strong>system</strong>. Years of administrative neglect, poor urban planning, and a lack of accountability had created the dangerous infrastructure that caused the accident. That moment of realization shifted his trajectory from a passive observer to an active civic architect.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">The Evolution</h2>
        <p className="mb-4 text-muted-foreground">
          What started as a small group of neighbors fighting for better roads has evolved into <strong>CivicOp</strong>, India's first GovTech Operations platform. We realized that protests alone don't fix cities; <strong>data and operations do.</strong>
        </p>
        <p className="mb-4 text-muted-foreground">
          We allied with lake activists, partnered with the Bengaluru Police, and used data to hold officials accountable. Today, we don't just complain about problems; we build the digital infrastructure to solve them.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Our Track Record</h2>
        <p className="mb-4 text-muted-foreground">We have driven measurable impact across Bengaluru's most critical sectors:</p>

        <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
          <li>
            <strong>Ecological Restoration:</strong>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
              <li>Partnered with Captain Santhosh to revive <strong>36 interlinked lakes</strong> and remove illegal encroachments.</li>
              <li>Recovered <strong>100,000+ sq. ft.</strong> of land at Gattahalli Lake through persistent legal and administrative advocacy.</li>
            </ul>
          </li>
          <li>
            <strong>Public Safety & Emergency Response:</strong>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
              <li>Collaborated with Bengaluru Police to form an <strong>Emergency Response Team (ERT)</strong> to tackle nocturnal assaults.</li>
              <li>Result: Police assembled 11 special teams and apprehended culprits within <strong>24 hours</strong>.</li>
            </ul>
          </li>
          <li>
            <strong>Anti-Corruption & Transparency:</strong>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
              <li>Facilitated <strong>110+ Khata transfers</strong> without a single rupee paid in bribes.</li>
              <li><strong>Impact:</strong> Saved citizens over <strong>₹14 Lakhs</strong> in potential bribes through transparent process auditing.</li>
            </ul>
          </li>
          <li>
            <strong>Urban Mobility:</strong>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
              <li>Established a <strong>Quick Action Team</strong> to manage traffic flow on the choked Sarjapur Road corridor, reducing peak-hour congestion times.</li>
            </ul>
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Why We Exist</h2>
        <p className="mb-4 text-muted-foreground">
          CivicOp exists to bridge the gap between <strong>Citizen Grievance</strong> and <strong>Government Action</strong>. We are moving beyond "activism" to <strong>"Operational Governance."</strong> By combining on-ground community pressure with high-tech monitoring tools, we are building a future where Indian cities are managed with transparency, efficiency, and data.
        </p>
      </section>

      <footer className="mt-10 text-center border-t pt-8">
        <p className="mb-6 text-lg font-semibold">Join the movement. Build the future.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/donate" className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
            Support Us
          </Link>
          <Link href="/contact" className="px-6 py-3 rounded-md border border-input hover:bg-accent hover:text-accent-foreground transition-colors">
            Get In Touch
          </Link>
        </div>
      </footer>
    </main>
  )
}
