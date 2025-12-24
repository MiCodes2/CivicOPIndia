import Link from "next/link"

export const metadata = {
  title: "Terms of Service — Civic Opposition of India",
  description: "Terms of Service placeholder for Civic Opposition of India.",
}

export default function TermsOfService() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 prose">
      <h1>Terms of Service</h1>

      <p>
        These Terms of Service ("Terms") govern your use of the Civic Opposition of
        India website and services. By accessing or using the site, you agree to be
        bound by these Terms. If you do not agree, please do not use the site.
      </p>

      <h2>Use of the Site</h2>
      <p>
        The site is provided for informational and civic engagement purposes. You may
        use the site for lawful purposes only and must not engage in conduct that is
        unlawful, abusive, harassing, fraudulent, or otherwise objectionable.
      </p>

      <h2>User Contributions</h2>
      <p>
        Where users submit comments, stories, or other content, you grant us a
        non exclusive, worldwide, royalty free licence to host, display, and use
        that content in connection with the site. Do not post content that violates
        privacy, intellectual property or other rights of others.
      </p>

      <h2>Intellectual Property</h2>
      <p>
        The site and its original content, features and functionality are the
        intellectual property of Civic Opposition of India and are protected by law.
        You may not reproduce or republish content without express permission.
      </p>

      <h2>Third Party Links</h2>
      <p>
        The site may link to third party resources. Such links do not imply
        endorsement and we are not responsible for the content or practices of
        third party sites.
      </p>

      <h2>Disclaimer of Warranties</h2>
      <p>
        The site is provided "as is" and "as available" without warranties of any
        kind, either express or implied. We do not guarantee accuracy, completeness,
        or fitness for any particular purpose.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        To the extent permitted by law, Civic Opposition of India shall not be
        liable for any indirect, incidental, special or consequential damages
        arising out of your use of the site.
      </p>

      <h2>Termination</h2>
      <p>
        We reserve the right to suspend or terminate access for users who violate
        these Terms or engage in harmful conduct.
      </p>

      <h2>Governing Law</h2>
      <p>
        These Terms are governed by the laws of India. Any dispute arising out of or
        relating to these Terms shall be subject to the courts of competent
        jurisdiction in India.
      </p>

      <h2>Changes to These Terms</h2>
      <p>
        We may revise these Terms from time to time. Continued use after changes
        constitutes acceptance of the revised Terms. The effective date is shown
        on this page.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about these Terms, please visit
        <Link href="/contact" className="text-primary">Contact</Link> or email citizens.east.blr@gmail.com.
      </p>
    </main>
  )
}
