import Image from "next/image";
import Link from "next/link";

export default function CitizenMattersPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
      <Image src="/CITIZEN-MATTERS-Logo.jpg" alt="Citizen Matters Logo" width={200} height={80} className="mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-4">Citizen Matters</h1>
      <p className="mb-8">Citizen Matters is an independent news platform covering urban issues, governance, and citizen engagement in Indian cities.</p>
      <Link href="https://citizenmatters.in/" target="_blank" className="text-primary underline">Visit Website</Link>
    </div>
  );
}