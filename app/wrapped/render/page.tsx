"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import WrappedContainer from "@/frontend/components/wrapped/WrappedContainer";
import { RelationshipData, AISummary } from "@/shared/types/wrapped";

function RenderPageContent() {
  const searchParams = useSearchParams();
  const theme = searchParams.get("theme") || "storybook";
  const rawData = searchParams.get("data");

  const [decoded, setDecoded] = useState<{
    data: RelationshipData;
    aiSummary: AISummary;
  } | null>(null);

  useEffect(() => {
    if (!rawData) return;
    try {
      // Decode base64
      const decodedString = atob(rawData);
      const parsed = JSON.parse(decodedString);
      setDecoded(parsed);
    } catch (err) {
      console.error("Failed to decode raw wrapped data:", err);
    }
  }, [rawData]);

  if (!decoded) {
    return (
      <div className="w-[1080px] h-[1920px] bg-slate-900 text-white flex flex-col items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <p className="text-4xl font-bold">PokeUs Wrapped</p>
          <p className="text-xl text-slate-400">Loading template details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Explicitly load Google Fonts required for themes */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background-color: transparent;
        }
      `}</style>
      <WrappedContainer
        data={decoded.data}
        aiSummary={decoded.aiSummary}
        theme={theme}
        isExportMode={true}
      />
    </>
  );
}

export default function RenderPage() {
  return (
    <Suspense fallback={
      <div className="w-[1080px] h-[1920px] bg-slate-900 text-white flex items-center justify-center font-sans">
        <p className="text-3xl font-bold">Initializing canvas...</p>
      </div>
    }>
      <RenderPageContent />
    </Suspense>
  );
}
