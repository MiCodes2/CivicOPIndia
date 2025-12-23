import Image from "next/image";
import Link from "next/link";

export default function BAFPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
      <Image src="/baf.jpg" alt="BAF Logo" width={200} height={80} className="mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-4">Bangalore Apartments’ Federation (BAF)</h1>
      <p className="mb-8">BAF is a collective of apartment communities in Bengaluru, working to address urban challenges, promote sustainability, and represent residents’ interests.</p>
      <Link href="https://baf.org.in/" target="_blank" className="text-primary underline">Visit Website</Link>
    </div>
  );
}