import Link from "next/link"

export const metadata = {
  title: "Privacy Policy — Civic Opposition of India",
  description: "Privacy Policy placeholder for Civic Opposition of India.",
}

export default function PrivacyPolicy() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 prose">
      <h1>Privacy Policy</h1>

      <p>
        Civic Opposition of India ("we", "us", "our") values the privacy of visitors
        and supporters. This Policy explains what information we collect, how it is
        used, with whom it may be shared, and the choices available to users of our
        site. By using our website, you consent to the practices described herein.
      </p>

      <h2>Information We Collect</h2>
      <p>
        We collect information to provide and improve our services. Types of
        information include:
      </p>
      <ul>
        <li><strong>Personal Information:</strong> Name, email address and other details you provide when you contact us, sign up for a newsletter, or donate.</li>
        <li><strong>Usage Data:</strong> Pages visited, time on site, referring pages, and technical data such as browser and device information collected through server logs and analytics.</li>
        <li><strong>Cookies and Similar Technologies:</strong> Small files stored on your device to improve site functionality, remember preferences, and support analytics.</li>
      </ul>

      <h2>How We Use Information</h2>
      <p>
        We use information to respond to inquiries, provide services, process donations,
        send newsletters or updates (with your consent), improve the site, and
        comply with legal obligations.
      </p>

      <h2>Sharing and Disclosure</h2>
      <p>
        We do not sell personal data. We may share information with service providers
        who assist in site hosting, payment processing, analytics, and communications.
        We may also disclose information where required by law, or to protect our
        rights, property, safety, or that of our users.
      </p>

      <h2>Third Party Services</h2>
      <p>
        Our site may contain links to third party websites or services (for example
        payment processors and social platforms). This Policy does not apply to those
        third parties; we encourage users to review their privacy practices.
      </p>

      <h2>Security</h2>
      <p>
        We take reasonable measures to protect personal data from unauthorised
        access, alteration, or disclosure. However, no method of transmission over
        the internet is fully secure and we cannot guarantee absolute security.
      </p>

      <h2>Retention</h2>
      <p>
        We retain personal information only as long as necessary for the purposes
        described, or as required by law. When no longer needed, information is
        deleted or anonymised.
      </p>

      <h2>Children</h2>
      <p>
        Our site is not directed to children under 16. We do not knowingly collect
        personal information from children without parental consent.
      </p>

      <h2>Your Choices</h2>
      <p>
        You may opt out of marketing emails by following the unsubscribe link in
        any email. To access, correct, or delete your personal information, please
        contact us via the Contact page.
      </p>

      <h2>Changes to This Policy</h2>
      <p>
        We may update this Policy from time to time. The effective date will be
        shown at the top of the page. Continued use of the site after changes
        constitutes acceptance of the updated Policy.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about privacy or to exercise your data rights, please visit
        <Link href="/contact" className="text-primary">Contact</Link> or email citizens.east.blr@gmail.com.
      </p>
    </main>
  )
}
