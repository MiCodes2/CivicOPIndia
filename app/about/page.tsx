import Link from "next/link"

export const metadata = {
  title: "About — Civic Opposition of India",
  description:
    "Our story: how a moment on a broken road became a citizen movement for safer, fairer cities.",
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
      "Founder of Civic Opposition of India. Technology professional and civic activist focused on urban governance, open data and community engagement.",
  },
}

export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <h1 className="text-4xl font-bold mb-6 text-center">About Civic Opposition of India</h1>

      <section className="prose dark:prose-invert mx-auto mb-8">
        <p>
          Our founder Mithilesh Kumar recalls the summer of the year 2021. While
          traversing a narrow lane in East Bengaluru, a tractor did approach from the
          opposite way. With no room to yield, he was forced aside and struck a great
          pothole. The shock harmed the lower body of his carriage. In the first heat
          of passion he rebuked the driver, who made apology and departed. Yet the
          ire did not long endure.
        </p>

        <p>
          When calm returned, he perceived that a fellow soul had been blamed in error.
          The true malefactor was the system: long years of apathy, ruined
          infrastructure and neglect had begotten the mischief. That revelation did
          alter his course.
        </p>

        <p>
          He sought out a few like minded neighbours and together they set in motion a
          citizen movement in East Bengaluru. They allied with lake activists to reclaim
          encroached waters, pursued officials, penned entreaties, and did appear where
          needed even when public fervour did wane. The press took note and the
          fellowship increased. They would not suffer that vital labour be forsaken.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">What we stood up for</h2>
        <p className="mb-4">Over the years they tackled many woes that do affect daily life in the city:</p>

        <ol className="list-decimal list-inside space-y-3 prose dark:prose-invert">
          <li>
            With Captain Santhosh they did help to revive thirty six interlinked lakes,
            removing illegal encroachments about the rajakaluves. They did recover
            over one lakh square feet of Gattahalli Lake land after many months of
            persistent, oft perilous labour across sundry offices of government.
          </li>
          <li>
            They did partner with the Bengaluru Police to meet a tide of eve teasing and
            nocturnal assaults, and did assist in the forming of an Emergency Response
            Team; in one case the captains of law did assemble eleven teams and did
            seize the culprits within four and twenty hours, to the gratitude of the
            neighbourhood.
          </li>
          <li>
            They aided in the processing of one hundred and ten Khata transfers without
            bribes, thereby saving more than ₹14 lakh to the public coffers by honest
            and transparent means.
          </li>
          <li>
            With civic volunteers they eased the traffic upon Sarjapur Road and did
            establish a Quick Action Team which yet doth labour to this day.
          </li>
          <li>
            They penned many letters to the Chief Minister’s office, demanding the
            common blessings of basic infrastructure for East Bengaluru, and did press
            until effect was had.
          </li>
        </ol>
      </section>

      <section className="mb-8 prose dark:prose-invert">
        <h2 className="text-2xl font-semibold">Why we keep going</h2>
        <p>
          The labour hath demanded sacrifice. He did place time, safety and the
          conveniences of household above less oft than was meet, and hath at times
          endured threats. Yet a small company remained, for progress was held dearer
          than ease. For cities are of men and women, and small, steadfast endeavour
          may alter the fortunes of many.
        </p>
        <p>
          Civic Opposition of India was founded to turn vexation into measured and
          useful endeavour: to record truth, to render the unseen seen, and to fashion
          practicable paths whereby citizens and the instruments of governance may
          work in concord.
        </p>
      </section>

      <footer className="mt-10 text-center">
        <p className="mb-4">Join the fellowship: volunteer, relate a tale, or succour the cause.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/donate" className="px-4 py-2 rounded bg-blue-600 text-white">Support</Link>
          <Link href="/contact" className="px-4 py-2 rounded border">Contact</Link>
        </div>
      </footer>
    </main>
  )
}
