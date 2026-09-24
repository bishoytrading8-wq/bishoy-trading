"use client";

import { useState } from "react";

export default function ProductGallery({ images, emoji, name }: { images: string[]; emoji?: string | null; name: string }) {
  const [active, setActive] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="relative rounded-3xl bg-[#101a30] border border-white/10 p-10 grid place-items-center overflow-hidden min-h-[320px]">
        <div className="absolute w-52 h-52 rounded-full bg-orange-500/10 blur-3xl" />
        <span className="text-[120px] relative">{emoji ?? "📦"}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="relative rounded-3xl overflow-hidden bg-[#101a30] border border-white/10 min-h-[320px] grid place-items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={name} className="w-full h-full max-h-[420px] object-contain" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              aria-label={`صورة ${i + 1}`}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition ${i === active ? "border-orange-500" : "border-white/10 opacity-60 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}