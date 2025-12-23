import Image from "next/image";
import Link from "next/link";

export default function WRIIndiaPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
      <Image src="/wri-india.png" alt="WRI India Logo" width={200} height={80} className="mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-4">WRI India</h1>
      <p className="mb-8">WRI India is a research organization that works on sustainable cities, climate, energy, and environment, providing data-driven solutions for India’s development.</p>
      <Link href="https://wri-india.org/" target="_blank" className="text-primary underline">Visit Website</Link>
    </div>
  );
}