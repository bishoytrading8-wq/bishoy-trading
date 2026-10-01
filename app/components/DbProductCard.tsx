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
  const sizes = product.sizes ?? [];

  return (
    <Link href={`/product/${product.id}`} className="group relative rounded-3xl bg-[#101a30] border border-white/10 hover:border-orange-500/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/15 transition-all duration-500 overflow-hidden flex flex-col">
      {/* 🖼️ صورة الغلاف */}
      <div className="relative h-48 overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={smallImg(img)}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent grid place-items-center">
            <span className="text-6xl group-hover:scale-110 transition-transform duration-300">{product.emoji ?? "📦"}</span>
          </div>
        )}

        {/* شارات فوق الصورة */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          {hasDiscount && (
            <span className="bg-red-500 text-white text-[10px] font-black rounded-full px-2.5 py-1 shadow-lg shadow-red-500/40">🔥 خصم {percentOff}%</span>
          )}
          {unavailable && (
            <span className="bg-black/80 backdrop-blur text-white text-[10px] font-black rounded-full px-2.5 py-1">🚫 غير متاح</span>
          )}
        </div>

        {/* شريط المقاسات — يظهر عند المرور */}
        {sizes.length > 0 && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 flex gap-1.5 flex-wrap opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            {sizes.slice(0, 4).map((s) => (
              <span key={s} className="text-[10px] font-bold bg-white/15 backdrop-blur text-white rounded-full px-2 py-0.5">📏 {s}</span>
            ))}
            {sizes.length > 4 && <span className="text-[10px] font-bold bg-white/15 backdrop-blur text-white rounded-full px-2 py-0.5">+{sizes.length - 4}</span>}
          </div>
        )}
      </div>

      {/* 📋 المحتوى */}
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-extrabold group-hover:text-orange-400 transition line-clamp-1">{product.name}</h3>
          {product.brand?.name && (
            <span className="shrink-0 text-[10px] font-bold text-white/40 border border-white/10 rounded-full px-2 py-0.5">{product.brand.name}</span>
          )}
        </div>
        {product.description && <p className="text-xs text-white/50 line-clamp-2 leading-relaxed flex-1">{product.description}</p>}

        {/* 💰 السعر المزدوج */}
        <div className="flex items-end justify-between pt-1">
          <PriceGate price={final} base={base} compact />
          <span className="text-[11px] text-white/30 group-hover:text-orange-400 transition font-bold">التفاصيل ←</span>
        </div>
        <AddToCartButton item={{ id: product.id, name: product.name, price: final, emoji: product.emoji ?? "📦", image: product.images?.[0] }} />
      </div>
    </Link>
  );
}