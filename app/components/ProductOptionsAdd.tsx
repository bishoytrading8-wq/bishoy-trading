"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import type { DbProduct } from "../lib/catalog";
import { priceInfo } from "../lib/catalog";

export default function ProductOptionsAdd({ product }: { product: DbProduct }) {
  const { add } = useCart();
  const { final } = priceInfo(product);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [added, setAdded] = useState(false);

  const sizes = product.sizes ?? [];
  const colors = product.colors ?? [];
  const needSize = sizes.length > 0 && !size;
  const needColor = colors.length > 0 && !color;

  const onAdd = () => {
    if (needSize || needColor) return;
    const nameWith = [product.name, size && `(${size})`, color && `- ${color}`].filter(Boolean).join(" ");
    add({ id: `${product.id}|${size}|${color}`, name: nameWith, price: final, emoji: product.emoji ?? "📦", image: product.images?.[0] });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="space-y-4">
      {/* 📏 المقاسات */}
      {sizes.length > 0 && (
        <div>
          <p className="text-xs font-extrabold text-white/70 mb-2">📏 المقاسات المتاحة — اختر مقاسك:</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold border transition-all duration-200 ${size === s ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/25" : "bg-white/5 border-white/10 text-white/70 hover:border-orange-500/40"}`}
              >
                📏 {s}
              </button>
            ))}
          </div>
          {needSize && <p className="text-[11px] text-orange-300 mt-2">⚠️ اختر المقاس أولاً</p>}
        </div>
      )}

      {/* 🎨 الألوان */}
      {colors.length > 0 && (
        <div>
          <p className="text-xs font-extrabold text-white/70 mb-2">🎨 الألوان المتاحة — اختر لونك:</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold border transition-all duration-200 ${color === c ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/25" : "bg-white/5 border-white/10 text-white/70 hover:border-orange-500/40"}`}
              >
                🎨 {c}
              </button>
            ))}
          </div>
          {needColor && <p className="text-[11px] text-orange-300 mt-2">⚠️ اختر اللون أولاً</p>}
        </div>
      )}

      {/* 🛒 زرار الإضافة — بيظهر بتحذير لو ناقص اختيار */}
      <button
        onClick={onAdd}
        disabled={needSize || needColor}
        className={`w-full rounded-xl py-4 font-extrabold transition-all duration-300 flex items-center justify-center gap-2 ${
          needSize || needColor
            ? "bg-white/5 border border-dashed border-orange-500/40 text-orange-300 cursor-not-allowed"
            : added
            ? "bg-green-500 text-white"
            : "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/25"
        }`}
      >
        {needSize || needColor
          ? (sizes.length > 0 && !size ? "📏 اختر المقاس أولاً" : "🎨 اختر اللون أولاً")
          : added
          ? "✓ أُضيف للطلب"
          : "🛒 أضف للطلب"}
      </button>
    </div>
  );
}