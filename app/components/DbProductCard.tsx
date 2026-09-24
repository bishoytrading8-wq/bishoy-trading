"use client";

import Link from "next/link";
import type { DbProduct } from "../lib/catalog";
import { priceInfo } from "../lib/catalog";
import PriceGate from "./PriceGate";

export default function DbProductCard({ product }: { product: DbProduct }) {
  const { final, hasDiscount, percentOff } = priceInfo(product);
  const img = product.images?.[0];

  return (
    <Link href={`/product/${product.id}`} className="group rounded-2xl bg-[#101a30] border border-white/10 hover:border-orange-500/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <div className="relative h-44 grid place-items-center bg-gradient-to-b from-white/5 to-transparent overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <span className="text-6xl group-hover:scale-110 transition-transform duration-300">{product.emoji ?? "📦"}</span>
        )}
        {hasDiscount && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black rounded-full px-2.5 py-1 shadow-lg">🔥 خصم {percentOff}%</span>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-bold group-hover:text-orange-400 transition">{product.name}</h3>
        {product.brand?.name && <p className="text-[11px] text-white/40 font-bold">🏷️ {product.brand.name}</p>}
        {product.description && <p className="text-xs text-white/50 line-clamp-2">{product.description}</p>}
        <div className="flex items-center justify-between pt-1">
          <PriceGate price={final} compact />
          <span className="text-xs text-white/40 group-hover:text-orange-400 transition font-bold">التفاصيل ←</span>
        </div>
      </div>
    </Link>
  );
}