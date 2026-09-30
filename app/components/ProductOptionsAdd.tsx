"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import type { DbProduct } from "../lib/catalog";

export default function ProductOptionsAdd({ product }: { product: DbProduct }) {
  const { add } = useCart();
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [added, setAdded] = useState(false);

  const sizes = product.sizes ?? [];
  const sizePrices = product.size_prices ?? [];
  const colors = product.colors ?? [];
  const unavailable = product.stock_status === "unavailable";
  const needSize = sizes.length > 0 && !size;
  const needColor = colors.length > 0 && !color;
  const blocked = unavailable || needSize || needColor;

  // 💰 السعر النهائي = سعر المقاس المختار، أو السعر الأساسي
  const sizePrice = sizePrices.find((sp) => sp.size === size)?.price;
  const final = sizePrice ?? Number(product.price);
  const basePrice = Number(product.price);
  const priceChanged = sizePrice != null && sizePrice !== basePrice;

  const onAdd = () => {
    if (blocked) return;
    const nameWith = [product.name, size && `(${size})`, color && `- ${color}`].filter(Boolean).join(" ");
    add({ id: `${product.id}|${size}|${color}`, name: nameWith, price: final, emoji: product.emoji ?? "📦", image: product.images?.[0] });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="space-y-4">
      {/* 🔢 SKU */}
      {product.sku && (
        <p className="text-xs text-white/40 font-bold">
          كود المنتج: <span dir="ltr" className="text-white/60">{product.sku}</span>
        </p>
      )}

      {/* 📏 المقاسات — كل مقاس سعره تحته */}
      {sizes.length > 0 && (
        <div>
          <p className="text-xs font-extrabold text-white/70 mb-2">📏 المقاسات المتاحة — اختر مقاسك:</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const sp = sizePrices.find((x) => x.size === s)?.price;
              const isSelected = size === s;
              return (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`rounded-xl px-4 py-2.5 border transition-all duration-200 ${
                    isSelected
                      ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/25"
                      : "bg-white/5 border-white/10 text-white/70 hover:border-orange-500/40"
                  }`}
                >
                  <span className="block text-sm font-bold">📏 {s}</span>
                  {sp != null && (
                    <span className={`block text-[11px] font-black ${isSelected ? "text-white" : "text-orange-400"}`}>
                      {sp} ج.م
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {needSize && <p className="text-[11px] text-orange-300 mt-2">⚠️ اختر المقاس أولًا</p>}
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
                className={`rounded-xl px-4 py-2.5 text-sm font-bold border transition-all duration-200 ${
                  color === c
                    ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/25"
                    : "bg-white/5 border-white/10 text-white/70 hover:border-orange-500/40"
                }`}
              >
                🎨 {c}
              </button>
            ))}
          </div>
          {needColor && <p className="text-[11px] text-orange-300 mt-2">⚠️ اختر اللون أولًا</p>}
        </div>
      )}

      {/* 💰 صندوق السعر الديناميكي */}
      <div className={`rounded-2xl p-5 border transition-all duration-300 ${blocked ? "border-dashed border-orange-500/40 bg-orange-500/5" : "bg-gradient-to-l from-green-500/15 to-transparent border-green-500/30"}`}>
        <p className="text-xs text-white/50 font-bold">
          {blocked
            ? "أكمل اختياراتك لمعرفة السعر النهائي"
            : priceChanged
            ? `سعر المقاس المختار (${size})`
            : "السعر"}
        </p>
        <p className={`text-4xl font-black mt-1 ${blocked ? "text-orange-400" : "text-green-400"}`}>
          {blocked ? "؟؟؟" : `${final}`} <span className="text-lg">ج.م</span>
        </p>
        {priceChanged && !blocked && (
          <p className="text-xs text-white/40 mt-1">السعر الأساسي: <span className="line-through">{basePrice} ج.م</span> — حسب المقاس المختار</p>
        )}
      </div>

      {/* 🛒 زر الإضافة */}
      <button
        onClick={onAdd}
        disabled={blocked}
        className={`w-full rounded-xl py-4 font-extrabold transition-all duration-300 flex items-center justify-center gap-2 ${
          blocked
            ? "bg-white/5 border border-dashed border-orange-500/40 text-orange-300 cursor-not-allowed"
            : added
            ? "bg-green-500 text-white"
            : "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/25"
        }`}
      >
        {unavailable
          ? "🚫 غير متاح حاليًا"
          : needSize || needColor
          ? sizes.length > 0 && !size
            ? "📏 اختر المقاس أولًا"
            : "🎨 اختر اللون أولًا"
          : added
          ? "✓ أُضيف للطلب"
          : "🛒 أضف للطلب"}
      </button>

      {/* 🔧 المواصفات */}
      {product.specs && product.specs.length > 0 && (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <h3 className="bg-white/5 px-5 py-3 font-black text-sm">🔧 المواصفات الفنية</h3>
          <table className="w-full text-sm">
            <tbody>
              {product.specs.map((sp, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white/[0.02]" : ""}>
                  <td className="px-5 py-2.5 font-bold text-white/70 w-1/3">{sp.k}</td>
                  <td className="px-5 py-2.5 text-white/60">{sp.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}