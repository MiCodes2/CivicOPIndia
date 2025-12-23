"use client";

import Link from "next/link";
import Image from "next/image";

export default function DrAnsihaPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="flex flex-col items-center mb-8">
        <div className="mb-6">
          <Image
            src="/dr-ansiha.jpeg"
            alt="Dr. Anisha"
            width={180}
            height={180}
            className="rounded-full object-cover border-4 border-primary shadow-lg w-40 h-40"
            priority
          />
        </div>
        <h1 className="text-4xl font-bold mb-2 text-center">Dr. Anisha</h1>
        <p className="mb-4 text-muted-foreground text-center font-medium">Co-founder</p>
        <div className="flex gap-4 mb-4">
          <a
            href="https://www.linkedin.com/in/dr-anisha/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline font-medium flex items-center gap-1"
          >
            <span>LinkedIn</span>
          </a>
          <a
            href="https://dranisha.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-700 hover:underline font-medium flex items-center gap-1"
          >
            <span>Website</span>
          </a>
        </div>
      </div>
      <div className="prose prose-neutral max-w-none mb-8">
        <p><strong>Dr. Anisha</strong> is the co-founder of Civic Opposition of India, where she plays a key role in shaping the organisation’s policy advocacy and citizen-centric reform agenda. She brings a grounded, people-first perspective to civic action, working closely on policy research, public awareness initiatives, and advocacy strategies aimed at improving transparency, accountability, and democratic participation in India. Her work bridges grassroots concerns with structured policy engagement, ensuring that citizen voices are articulated clearly and responsibly in public discourse.</p>
        <p>Alongside her civic work, Dr. Anisha is an accomplished homeopathic physician with over a decade of clinical experience. Her medical practice is rooted in holistic and compassionate care, focusing on understanding root causes rather than treating symptoms alone. This background has deeply influenced her civic approach—combining analytical thinking, empathy, and long-term problem solving.</p>
        <p>Through Civic Opposition of India, Dr. Anisha represents a rare blend of healthcare professionalism and civic leadership. Her work reflects a belief that sustainable governance reform, much like good healthcare, requires patience, evidence, integrity, and a deep respect for people’s lived realities.</p>
      </div>
      <Link href="/" className="text-primary underline">Back to Home</Link>
    </div>
  );
}
