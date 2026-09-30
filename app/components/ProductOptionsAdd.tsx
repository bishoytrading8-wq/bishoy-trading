"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { priceForSize, type DbProduct } from "../lib/catalog";

export default function ProductOptionsAdd({ product }: { product: DbProduct }) {
  const { add } = useCart();
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [added, setAdded] = useState(false);

  const sizes = product.sizes ?? [];
  const sizePrices = product.size_prices ?? [];
  const sizeSpecs = product.size_specs ?? [];
  const colors = product.colors ?? [];
  const unavailable = product.stock_status === "unavailable";
  const needSize = sizes.length > 0 && !size;
  const needColor = colors.length > 0 && !color;
  const blocked = unavailable || needSize || needColor;

  // 💰 السعر حسب المقاس المختار — مع القديم المشطوب لو فيه خصم
  const info = priceForSize(product, size);
  const final = info.final;
  const oldPrice = info.hasDiscount ? info.base : null;

  // 🔧 المواصفات المعروضة: لو مقاس مختار وعنده مواصفات خاصة → بتاعته، وإلا العامة
  const selectedSizeSpecs = size ? sizeSpecs.find((x) => x.size === size)?.specs : null;
  const shownSpecs = selectedSizeSpecs && selectedSizeSpecs.length > 0
    ? selectedSizeSpecs
    : product.specs ?? [];

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

      {/* 💰 صندوق السعر: القديم مشطوب + الجديد بعد الخصم */}
      <div className={`rounded-2xl p-5 border transition-all duration-300 ${blocked ? "border-dashed border-orange-500/40 bg-orange-500/5" : "bg-gradient-to-l from-green-500/15 to-transparent border-green-500/30"}`}>
        <p className="text-xs text-white/50 font-bold">
          {blocked
            ? "أكمل اختياراتك لمعرفة السعر النهائي"
            : oldPrice != null
            ? "السعر بعد الخصم 🔥"
            : priceChanged
            ? `سعر المقاس المختار (${size})`
            : "السعر"}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {/* 💔 القديم — مشطوب أحمر */}
          {oldPrice != null && (
            <span className="text-2xl font-bold text-red-400 line-through decoration-2">{oldPrice} ج.م</span>
          )}
          {/* ✅ الجديد بعد الخصم */}
          <span className={`text-4xl font-black ${blocked ? "text-orange-400" : "text-green-400"}`}>
            {blocked ? "؟؟؟" : `${final}`} <span className="text-lg">ج.م</span>
          </span>
        </div>
        {oldPrice != null && !blocked && (
          <p className="text-xs text-white/40 mt-1">وفّر {oldPrice - final} ج.م مع العرض الحالي</p>
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

      {/* 🔧 المواصفات — خاصة بالمقاس المختار أو العامة */}
      {shownSpecs.length > 0 && (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <h3 className="bg-white/5 px-5 py-3 font-black text-sm">
            🔧 {size && selectedSizeSpecs && selectedSizeSpecs.length > 0 ? `مواصفات المقاس المختار (${size})` : "المواصفات الفنية"}
          </h3>
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
      )}
    </div>
  );
}