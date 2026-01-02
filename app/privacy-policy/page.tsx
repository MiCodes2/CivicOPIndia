import Link from "next/link"

export const metadata = {
  title: "Privacy Policy — CivicOp",
  description: "Learn how CivicOp collects, uses, and protects your data while powering AI-driven civic governance.",
}

export default function PrivacyPolicy() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 prose prose-slate dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-muted-foreground"><strong>Last Updated:</strong> January 1, 2026</p>

      <p>
        CivicOp ("we", "us", "our") operates the CivicOp Governance Platform and related services. We value the privacy of our users ("Citizens") and are committed to protecting your data while ensuring transparency in civic governance.
      </p>

      <h2>1. Information We Collect</h2>
      <p>
        We collect information to verify civic issues and power our AI-driven governance tools.
      </p>

      <h3>A. Data You Provide</h3>
      <ul>
        <li><strong>Account Data:</strong> Name, email address, and phone number (for authentication).</li>
        <li><strong>Civic Reports:</strong> Titles, descriptions, and categories of issues you report.</li>
        <li><strong>Media:</strong> Photos and videos uploaded to verify infrastructure failures.</li>
      </ul>

      <h3>B. Data We Collect Automatically</h3>
      <ul>
        <li><strong>Geolocation Data:</strong> Precise location data (GPS/Latitude-Longitude) is required to tag civic issues accurately on the map.</li>
        <li><strong>Device Metadata:</strong> Browser type, IP address, and timestamps to prevent spam and secure the platform.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li><strong>AI Verification:</strong> We use Computer Vision models to analyze your uploaded images (e.g., detecting potholes or garbage) to validate reports automatically.</li>
        <li><strong>Governance Intelligence:</strong> To generate "Ward Analytics" and "Heatmaps" for municipal authorities.</li>
        <li><strong>Public Transparency:</strong> To display verified issues on the public-facing dashboard (Personal identifiers like email/phone are NEVER displayed publicly).</li>
      </ul>

      <h2>3. Data Sharing & Disclosure</h2>
      <ul>
        <li><strong>Municipal Authorities:</strong> We share <strong>anonymized and aggregated data</strong> with Government agencies (BBMP, Municipal Corporations) to facilitate repairs.</li>
        <li><strong>Public Dashboard:</strong> The location, photo, and status of reported issues are public records.</li>
        <li><strong>Service Providers:</strong> We use trusted third-party vendors for cloud hosting (Supabase/Vercel) and AI processing.</li>
      </ul>

      <h2>4. User-Generated Content</h2>
      <p>
        By submitting a report, you acknowledge that the text and images provided may be visible to the public. Please do not upload images that contain sensitive personal information (e.g., faces of bystanders, private vehicle plates) unless relevant to the issue. Our AI automatically attempts to blur faces/plates, but this is not guaranteed.
      </p>

      <h2>5. Security</h2>
      <p>
        We employ enterprise-grade encryption and Row Level Security (RLS) protocols to protect your account data. However, no digital transmission is completely secure.
      </p>

      <h2>6. Contact Us</h2>
      <p>
        For data deletion requests or privacy inquiries, please contact us via our{" "}
        <Link href="/contact" className="text-primary hover:underline">
          Contact page
        </Link>
        .
      </p>
    </main>
  )
}
