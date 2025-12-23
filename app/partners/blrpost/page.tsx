import Image from "next/image";
import Link from "next/link";

export default function BLRPostPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
      <Image src="/blrpost.jpg" alt="BLR Post Logo" width={200} height={80} className="mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-4">BLR Post</h1>
      <p className="mb-8">BLR Post is a digital news platform providing updates, stories, and analysis on Bengaluru’s civic, political, and social landscape.</p>
      <Link href="https://blrpost.com/" target="_blank" className="text-primary underline">Visit Website</Link>
    </div>
  );
}