"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function CaptSanthoshPage() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="flex flex-col items-center mb-8">
        <div className="mb-6">
          <button
            type="button"
            className="focus:outline-none"
            onClick={() => setModalOpen(true)}
            aria-label="Enlarge image"
          >
            <Image
              src="/Capt_Santhosh_portrait.jpg"
              alt="Capt Santhosh"
              width={180}
              height={180}
              className="rounded-full object-cover border-4 border-primary shadow-lg w-40 h-40"
              priority
            />
          </button>
        </div>
        <h1 className="text-4xl font-bold mb-2 text-center">Capt Santhosh Kumar</h1>
        <p className="mb-4 text-muted-foreground text-center font-medium">Advisor</p>
        <div className="flex gap-4 mb-4">
          <a
            href="https://x.com/captsanthoshkc"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline font-medium flex items-center gap-1"
          >
            <span>X (Twitter)</span>
          </a>
        </div>
      </div>
      {/* Modal for enlarged image */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setModalOpen(false)}>
          <div className="relative bg-transparent p-4" onClick={e => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 text-white text-2xl font-bold z-10"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <Image
              src="/Capt_Santhosh_large.jpg"
              alt="Capt Santhosh Full"
              width={900}
              height={1200}
              className="rounded-xl object-contain max-h-[80vh] max-w-full border-4 border-primary bg-white"
              priority
            />
          </div>
        </div>
      )}
      <div className="prose prose-neutral max-w-none mb-8">
        <p><strong>Captain Santhosh Kumar</strong> is a retired Indian Army intelligence officer who has emerged as a determined environmental and civic activist in the Bengaluru Urban region, particularly in Anekal taluk. After serving in the Indian Army from 2000 to 2008, Santhosh shifted his focus to protecting natural resources and community livelihoods threatened by rapid urbanisation and environmental degradation.</p>
        <p>Born and raised in a farming family with deep ties to the land and local lakes, he was alarmed by the rampant encroachments, pollution, and over-extraction of groundwater that followed Bengaluru’s expansion. Rather than accept official indifference, he began to compile rigorous data on lakes, illegal land activity, borewells, and stormwater drains, transforming anecdotal concerns into evidence-based advocacy.</p>
        <p>Santhosh’s activism has focused on multiple fronts: documenting illegal borewell drilling that was pumping millions of litres of water daily from lake beds, advocating for surveys and removal of encroachments on water bodies, and drawing official attention to environmental violations. His letters to government authorities, including the then Chief Minister of Karnataka and the Bengaluru Urban Deputy Commissioner, have helped prompt lake surveys and actions to reclaim several water bodies.</p>
        <p>Beyond legal complaints and data collection, Captain Santhosh has also been hands-on in environmental restoration efforts. He has worked on reviving dried-up lakes and restoring stormwater drains to improve groundwater recharge and prevent flooding, collaborating with local farmers and citizens to reinvigorate historic water systems in Anekal.</p>
        <p>His work reflects a blend of disciplined research, grassroots engagement, and resilience in the face of challenges, including threats for his activism. Santhosh exemplifies a shift from military service to civic stewardship, advocating for sustainable water governance and environmental justice in one of India’s fastest-growing urban regions.</p>
      </div>
      <Link href="/" className="text-primary underline">Back to Home</Link>
    </div>
  );
}
