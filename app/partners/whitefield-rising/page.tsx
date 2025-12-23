import Image from "next/image";
import Link from "next/link";

export default function WhitefieldRisingPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
      <Image src="/wrising.jpg" alt="Whitefield Rising Logo" width={200} height={80} className="mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-4">Whitefield Rising</h1>
      <p className="mb-8">Whitefield Rising is a citizen-driven movement focused on improving civic amenities, environment, and quality of life in the Whitefield area of Bengaluru.</p>
      <Link href="https://whitefieldrising.org/" target="_blank" className="text-primary underline">Visit Website</Link>
    </div>
  );
}