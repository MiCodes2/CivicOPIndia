import Link from "next/link"

export const metadata = {
  title: "Terms of Service — CivicOp",
  description: "Terms governing your use of CivicOp Civic Governance Platform and related services.",
}

export default function TermsOfService() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 prose prose-slate dark:prose-invert">
      <h1>Terms of Service</h1>
      <p className="text-sm text-muted-foreground"><strong>Last Updated:</strong> January 1, 2026</p>

      <p>
        Welcome to CivicOp ("Platform"), operated by Civic Opposition of India. These Terms govern your access to our Civic Governance Dashboard, Mobile App, and related services. By accessing the Platform, you agree to be bound by these Terms.
      </p>

      <h2>1. Nature of Service</h2>
      <p>
        CivicOp is a <strong>Civic Intelligence & Operations Platform</strong>. We provide:
      </p>
      <ul>
        <li><strong>For Citizens:</strong> Tools to report, track, and verify civic infrastructure issues (e.g., potholes, garbage).</li>
        <li><strong>For Governments:</strong> A Command Center to visualize data, manage workflows, and optimize resource allocation.</li>
      </ul>
      <p>
        <strong>Disclaimer:</strong> CivicOp is a technology provider, not a government agency. While we facilitate issue resolution, we do not guarantee that every reported issue will be fixed by the municipal authorities.
      </p>

      <h2>2. User Responsibilities</h2>
      <p>You agree NOT to:</p>
      <ul>
        <li>Submit false or misleading reports (e.g., photos of potholes from other cities).</li>
        <li>Abuse the "Emergency" tag for non-critical issues.</li>
        <li>Reverse-engineer our AI models or scrape data from the dashboard without permission.</li>
        <li>Harass municipal officials or other users through the platform's communication tools.</li>
      </ul>

      <h2>3. AI & Data Accuracy</h2>
      <p>
        Our platform uses <strong>Artificial Intelligence (Computer Vision)</strong> to verify reports.
      </p>
      <ul>
        <li><strong>No Guarantee:</strong> AI predictions (e.g., "95% Confidence Pothole") are for informational purposes only. We do not guarantee 100% accuracy.</li>
        <li><strong>Human Review:</strong> Critical decisions should always be verified by a human operator. We are not liable for operational errors resulting from AI misclassification.</li>
      </ul>

      <h2>4. Intellectual Property</h2>
      <ul>
        <li><strong>Your Content:</strong> You retain ownership of photos you upload but grant us a perpetual, worldwide license to use them for training our AI models and improving governance algorithms.</li>
        <li><strong>Our Content:</strong> The CivicOp dashboard design, code, maps, and analytics engines are the exclusive property of Civic Opposition of India.</li>
      </ul>

      <h2>5. Limitation of Liability</h2>
      <p>To the fullest extent permitted by law, CivicOp shall not be liable for:</p>
      <ul>
        <li>Any physical injury or damages resulting from unfixed civic issues (we report them; we do not physically repair them).</li>
        <li>Decisions made by government officials based on our data.</li>
        <li>Service interruptions or data loss.</li>
      </ul>

      <h2>6. Termination</h2>
      <p>
        We reserve the right to suspend accounts that consistently upload fake data ("Spamming") or misuse the platform to spread misinformation.
      </p>

      <h2>7. Governing Law</h2>
      <p>
        These Terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.
      </p>

      <h2>Contact</h2>
      <p>
        For legal inquiries, please contact us via our{" "}
        <Link href="/contact" className="text-primary hover:underline">
          Contact page
        </Link>
        .
      </p>
    </main>
  )
}
