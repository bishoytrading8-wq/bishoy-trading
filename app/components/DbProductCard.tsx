"use client";

import Link from "next/link";
import type { DbProduct } from "../lib/catalog";
import { priceInfo } from "../lib/catalog";
import PriceGate from "./PriceGate";
import AddToCartButton from "./AddToCartButton";

function smallImg(url: string, width = 500) {
  if (url.includes("supabase.co")) {
    return `${url}${url.includes("?") ? "&" : "?"}width=${width}&quality=70`;
  }
  return url;
}

export default function DbProductCard({ product }: { product: DbProduct }) {
  const { base, final, hasDiscount, percentOff } = priceInfo(product);
  const img = product.images?.[0];
  const unavailable = product.stock_status === "unavailable";

  return (
    <Link href={`/product/${product.id}`} className="group rounded-3xl bg-[#101a30] border border-white/10 hover:border-orange-500/50 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative h-44 grid place-items-center bg-gradient-to-b from-white/5 to-transparent overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={smallImg(img)}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="text-6xl group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">{product.emoji ?? "📦"}</span>
        )}
        {hasDiscount && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black rounded-full px-2.5 py-1 shadow-lg shadow-red-500/40">🔥 خصم {percentOff}%</span>
        )}
        {unavailable && (
          <span className="absolute top-3 left-3 bg-black/70 text-white text-[10px] font-black rounded-full px-2.5 py-1 backdrop-blur">🚫 غير متاح</span>
        )}
      </div>
      <div className="p-4 space-y-2.5 flex-1 flex flex-col">
        <h3 className="font-extrabold group-hover:text-orange-400 transition line-clamp-1">{product.name}</h3>
        {product.brand?.name && <p className="text-[11px] text-white/40 font-bold">🏷️ {product.brand.name}</p>}
        {product.description && <p className="text-xs text-white/50 line-clamp-2 leading-relaxed flex-1">{product.description}</p>}
        <div className="flex items-center justify-between pt-1">
          <PriceGate price={final} base={base} compact />
          <span className="text-xs text-white/40 group-hover:text-orange-400 transition font-bold">التفاصيل ←</span>
        </div>
        <AddToCartButton item={{ id: product.id, name: product.name, price: final, emoji: product.emoji ?? "📦", image: product.images?.[0] }} />
      </div>
    </Link>
  );
}