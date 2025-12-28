
"use client";

import Link from "next/link";
import Image from "next/image";

import { useState } from "react";

export default function MithileshKumarPage() {
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
              src="/mithilesh_india.jpeg"
              alt="Mithilesh Kumar"
              width={180}
              height={180}
              className="rounded-full object-cover border-4 border-primary shadow-lg w-40 h-40"
              priority
            />
          </button>
        </div>
        <h1 className="text-4xl font-bold mb-2 text-center">Mithilesh Kumar</h1>
        <p className="mb-4 text-muted-foreground text-center font-medium">GovTech Architect & Founder</p>
        <div className="flex gap-4 mb-4">
          <a
            href="https://www.linkedin.com/in/mithileshk/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline font-medium flex items-center gap-1"
          >
            <span>LinkedIn</span>
          </a>
          <a
            href="https://www.instagram.com/mi.miles.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 hover:underline font-medium flex items-center gap-1"
          >
            <span>Instagram</span>
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
              src="/mithilesh_india.jpeg"
              alt="Mithilesh Kumar Full"
              width={900}
              height={1200}
              className="rounded-xl object-contain max-h-[80vh] max-w-full border-4 border-primary bg-white"
              priority
            />
          </div>
        </div>
      )}

      <div className="prose prose-neutral max-w-none mb-8">
        <p>
          Mithilesh Kumar is a <strong>Product & AI Strategy Leader</strong> with 15+ years of experience building enterprise-grade data platforms for global organizations. He is the Founder and Chief Architect of <strong>CivicOp India</strong>, a platform bridging the gap between citizen engagement and urban governance through technology.
        </p>

        <h3 className="mt-4 font-semibold">The Tech-Civic Intersection</h3>
        <p>
          Leveraging his background in <strong className="font-semibold">Generative AI</strong> and large-scale systems, Mithilesh architected the <strong className="font-semibold">Real-Time Civic Governance Dashboard</strong>, a data-driven tool that translates chaotic citizen grievances into structured, evidence-based insights for policymakers. He believes that the answer to urban complexity lies in <em>"Algorithmic Accountability"</em>—using data to measure and improve public service delivery.
        </p>

        <h3 className="mt-4 font-semibold">Impact & Recognition</h3>
        <p>
          Under his leadership, the movement has mobilized 34,000+ citizens and documented over 500 ground-level infrastructure issues in Bengaluru. His work has been featured in mainstream media, earning him a nomination for the <strong>"Namma Bengalurean of the Year"</strong> award.
        </p>

        <h3 className="mt-4 font-semibold">Endurance & Discipline</h3>
        <p>
          Beyond the boardroom and the streets, Mithilesh is an international ultra-endurance athlete. He has represented India at the <strong className="font-semibold">100 km World Championship</strong> and the <em>IAU 24-Hour Asia–Oceania Championship</em>. He brings the same discipline required to run 100km to his mission of transforming India’s urban governance.
        </p>
      </div>
      <Link href="/" className="text-primary underline">Back to Home</Link>
    </div>
  );
}
