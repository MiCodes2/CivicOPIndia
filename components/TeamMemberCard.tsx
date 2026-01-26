"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

interface TeamMemberCardProps {
  name: string;
  role: string;
  description: React.ReactNode;
  imageSrc: string;
  initials: string;
}

export default function TeamMemberCard({ 
  name, 
  role, 
  description, 
  imageSrc, 
  initials 
}: TeamMemberCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card className="mx-auto text-center transition-shadow hover:shadow-lg" style={{ maxWidth: '20rem' }}>
      <CardContent className="pt-6">
        <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
          {!imageError ? (
            <Image
              src={imageSrc}
              alt={name}
              width={128}
              height={128}
              className="h-full w-full object-cover object-center"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-primary">
              {initials}
            </div>
          )}
        </div>
        <h3 className="text-xl font-bold">{name}</h3>
        <p className="mt-1 text-sm font-bold text-primary">{role}</p>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
