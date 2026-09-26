"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Cat = {
  slug: string;
  name: string;
  emoji: string;
  image: string;
  tagline: string;
};

export default function CatsGrid({
  cats,
  counts,
}: {
  cats: Cat[];
  counts: Record<string, number>;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cats.map((c, i) => (
        <Link
          key={c.slug}
          href={`/category/${c.slug}`}
          className={`group rounded-3xl bg-[#101a30] border border-white/10 hover:border-orange-500/50 p-6 transition-all duration-300 hover:-translate-y-1.5 ${mounted ? "animate-rise-in" : "opacity-0"}`}
          style={{ animationDelay: `${i * 120}ms` }}
        >
          <div className="flex items-start justify-between">
            {c.image ? (
              <span className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-orange-500/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
              </span>
            ) : (
              <span className="text-5xl inline-block group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">{c.emoji}</span>
            )}
            <span className="text-xs bg-orange-500/10 text-orange-300 border border-orange-500/20 rounded-full px-3 py-1 font-bold">
              {counts[c.slug] ?? 0} منتجات
            </span>
          </div>
          <h3 className="text-xl font-extrabold mt-4 group-hover:text-orange-400 transition">{c.name}</h3>
          <p className="text-sm text-white/50 mt-1">{c.tagline}</p>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-orange-400 mt-4">
            استعرض القسم <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span>
          </span>
        </Link>
      ))}
    </div>
  );
}