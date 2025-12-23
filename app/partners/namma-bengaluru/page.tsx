import Image from "next/image";
import Link from "next/link";

export default function NammaBengaluruPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
      <Image src="/NBF-Logo-Bold.png" alt="Namma Bengaluru Foundation Logo" width={200} height={80} className="mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-4">Namma Bengaluru Foundation</h1>
      <p className="mb-8">Namma Bengaluru Foundation works to protect Bengaluru’s lakes, environment, and civic spaces through advocacy, legal action, and community engagement.</p>
      <Link href="https://www.namma-bengaluru.org/" target="_blank" className="text-primary underline">Visit Website</Link>
    </div>
  );
}