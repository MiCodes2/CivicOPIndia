import Link from "next/link";

export default function ArifMudgalPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-4xl font-bold mb-4">ARIF MUDGAL</h1>
      <p className="mb-8 text-muted-foreground">Member</p>
      <div className="mb-8">
        {/* Content to be provided */}
        <p>Profile content coming soon.</p>
      </div>
      <Link href="/" className="text-primary underline">Back to Home</Link>
    </div>
  );
}
