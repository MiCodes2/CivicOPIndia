import Link from "next/link";

export default function ConsciousCommunitiesPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
      <img src="https://lzpyfvqdimkrkioxrzbf.supabase.co/storage/v1/object/public/CivicOPI/ConsciousCommunities.PNG" alt="Conscious Communities Logo" className="mx-auto mb-6 h-20 w-auto" />
      <h1 className="text-3xl font-bold mb-4">Conscious Communities</h1>
      <p className="mb-8">Conscious Communities is dedicated to fostering sustainable and inclusive urban development through community engagement and innovative solutions.</p>
      <Link href="https://www.consciouscommunities.in/" target="_blank" className="text-primary underline">Visit Website</Link>
    </div>
  );
}