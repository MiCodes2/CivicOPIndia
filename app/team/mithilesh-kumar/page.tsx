
import Link from "next/link";
import Image from "next/image";

export default function MithileshKumarPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="flex flex-col items-center mb-8">
        <div className="w-full mb-6">
          <Image
            src="/mithilesh-kumar.jpeg"
            alt="Mithilesh Kumar"
            width={1200}
            height={800}
            className="w-full h-auto rounded-xl object-cover border-4 border-primary shadow-lg"
            priority
          />
        </div>
        <h1 className="text-4xl font-bold mb-2 text-center">Mithilesh Kumar</h1>
        <p className="mb-4 text-muted-foreground text-center font-medium">Founder – Civic Opposition of India</p>
      </div>
      <div className="prose prose-neutral max-w-none mb-8">
        <p><strong>Mithilesh Kumar</strong> is a technology professional, endurance athlete, and civic activist who founded Civic Opposition of India (COI) to strengthen citizen-led engagement on issues of urban governance, mobility, and public accountability.</p>
        <p>Alongside a 15+ year career in advanced technology roles, Mithilesh has worked on large-scale data platforms, artificial intelligence systems, and enterprise-grade digital products across global organizations. His professional background in data science and systems thinking informs his civic work—bringing structure, evidence, and long-term perspective to complex public problems.</p>
        <p>Civic Opposition of India was created as an independent, volunteer-driven platform to document ground realities and encourage informed, constructive dialogue between citizens and civic institutions. Under Mithilesh’s leadership, COI has grown into a recognized citizen movement with tens of thousands of engaged followers, particularly in Bengaluru. The platform focuses on issues such as pedestrian safety, last-mile connectivity, traffic planning, public infrastructure, and governance transparency, often translating citizen experiences into data-backed narratives that resonate with policymakers and the media.</p>
        <p>Mithilesh’s civic efforts have been featured in mainstream media, and he has been nominated for the “Namma Bengalurean of the Year” award in recognition of his sustained contributions to citizen-led urban advocacy. His approach emphasizes persistence, accountability, and respectful engagement rather than confrontation or political alignment.</p>
        <p>In parallel with his professional and civic commitments, Mithilesh is an accomplished endurance athlete. He has represented India at the 100 km World Championship and the IAU 24-Hour Asia–Oceania Championship, competing at the international level in ultra-distance running. These experiences reflect the discipline, resilience, and long-term commitment that also define his work in technology and civic leadership.</p>
        <p>Mithilesh actively engages with students and young professionals through guest lectures and mentoring, sharing insights on technology, leadership, and responsible citizenship. He believes meaningful change—whether in organizations, cities, or communities—comes from sustained effort, informed participation, and the ability to balance ambition with service.</p>
        <p>Through Civic Opposition of India, Mithilesh aims to build a non-partisan, inclusive platform where citizens collaborate, question constructively, and contribute toward better, more accountable cities.</p>
      </div>
      <Link href="/" className="text-primary underline">Back to Home</Link>
    </div>
  );
}
