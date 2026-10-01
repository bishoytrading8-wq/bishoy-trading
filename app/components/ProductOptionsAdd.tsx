"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { priceForSize, listPrice, type DbProduct } from "../lib/catalog";

export default function ProductOptionsAdd({ product }: { product: DbProduct }) {
  const { add } = useCart();
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [added, setAdded] = useState(false);

  const sizes = product.sizes ?? [];
  const sizeSpecs = product.size_specs ?? [];
  const colors = product.colors ?? [];
  const unavailable = product.stock_status === "unavailable";
  const needSize = sizes.length > 0 && !size;
  const blocked = unavailable || needSize;

  // 💰 السعر المعروض: المقاس المختار → سعره بعد خصمه — أو "يبدأ من" الأرخص
  const info = size ? priceForSize(product, size) : listPrice(product);
  const final = info.final;
  const hasDiscount = info.hasDiscount;

  // 🔧 المواصفات: المقاس المختار → مواصفاته هو — وإلا العامة
  const selectedSizeSpecs = size ? sizeSpecs.find((x) => x.size === size)?.specs : null;
  const shownSpecs = selectedSizeSpecs && selectedSizeSpecs.length > 0
    ? selectedSizeSpecs
    : product.specs ?? [];
  const specTitle = size && selectedSizeSpecs && selectedSizeSpecs.length > 0
    ? `المواصفات الفنية — ${size}`
    : "المواصفات الفنية";

  return (
    <div className="space-y-4">
      {product.sku && (
        <p className="text-xs text-white/40 font-bold">
          كود المنتج: <span dir="ltr" className="text-white/60">{product.sku}</span>
        </p>
      )}

      {/* 📏 المقاسات — كل مقاس سعره النهائي (بعد خصمه) تحته */}
      {sizes.length > 0 && (
        <div>
          <p className="text-xs font-extrabold text-white/70 mb-2">📏 المقاسات المتاحة — اختر مقاسك:</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const pInfo = priceForSize(product, s);
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
                  <span className={`block text-[11px] font-black ${isSelected ? "text-white" : "text-orange-400"}`}>
                    {pInfo.hasDiscount ? `${pInfo.final} ج.م 🔥` : `${pInfo.final} ج.م`}
                  </span>
                </button>
              );
            })}
          </div>
          {needSize && <p className="text-[11px] text-orange-300 mt-2">⚠️ اختر المقاس أولًا لعرض سعره</p>}
        </div>
      )}

      {/* 🎨 الألوان — اختيارية */}
      {colors.length > 0 && (
        <div>
          <p className="text-xs font-extrabold text-white/70 mb-2">🎨 الألوان (اختياري):</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(color === c ? "" : c)}
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
        </div>
      )}

      {/* 💰 صندوق السعر */}
      <div className="rounded-2xl border border-green-500/30 bg-gradient-to-l from-green-500/15 to-transparent p-5">
        <p className="text-xs text-white/50 font-bold">
          {hasDiscount ? "السعر بعد الخصم 🔥" : sizes.length > 1 && !size ? "يبدأ السعر من" : "السعر"}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {hasDiscount && (
            <span className="text-2xl font-bold text-red-400 line-through decoration-2">{info.base} ج.م</span>
          )}
          <span className="text-4xl font-black text-green-400">
            {final} <span className="text-lg">ج.م</span>
          </span>
          {info.percentOff > 0 && (
            <span className="text-[11px] font-black text-white bg-red-500 rounded-full px-2.5 py-1">خصم {info.percentOff}%</span>
          )}
        </div>
        {sizes.length > 1 && !size && <p className="text-[11px] text-white/40 mt-1">اختر مقاسًا لعرض سعره النهائي</p>}
      </div>

      {/* 🛒 زر الإضافة */}
      <button
        onClick={() => {
          if (blocked) return;
          const nameWith = [product.name, size && `(${size})`, color && `- ${color}`].filter(Boolean).join(" ");
          add({ id: `${product.id}|${size}|${color}`, name: nameWith, price: final, emoji: product.emoji ?? "📦", image: product.images?.[0] });
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
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
          : needSize
          ? "📏 اختر المقاس أولًا"
          : added
          ? "✓ أُضيف للطلب"
          : "🛒 أضف للطلب"}
      </button>

      {/* 🔧 المواصفات — قايمة منسدلة أنيقة بتاعة المقاس المختار */}
      {shownSpecs.length > 0 && (
        <details className="rounded-2xl border border-white/10 overflow-hidden group">
          <summary className="flex items-center justify-between gap-2 px-5 py-3.5 cursor-pointer list-none select-none hover:bg-white/5 transition">
            <span className="font-black text-sm flex items-center gap-2">🔧 {specTitle}</span>
            <span className="text-white/40 text-xs group-open:rotate-180 transition-transform duration-300">▼</span>
          </summary>
          <div className="border-t border-white/5">
            <table className="w-full text-sm">
              <tbody>
                {shownSpecs.map((sp, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white/[0.02]" : ""}>
                    <td className="px-5 py-2.5 font-bold text-white/70 w-1/3">{sp.k}</td>
                    <td className="px-5 py-2.5 text-white/60">{sp.v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}