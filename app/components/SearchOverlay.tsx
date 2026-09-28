"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { priceInfo } from "../lib/catalog";

type Result = {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  images: string[];
  price: number;
  discount_percent: number | null;
  discount_amount: number | null;
  brand_name: string | null;
};

function smallImg(url: string, width = 200) {
  if (url.includes("supabase.co")) {
    return `${url}${url.includes("?") ? "&" : "?"}width=${width}&quality=70`;
  }
  return url;
}

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🔒 منع تمرير الخلفية + فокус تلقائي
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setActive(-1);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ⎋ ESC يقفل
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // 🔍 البحث اللحظي — اسم + وصف + ماركة
  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const term = `%${q.trim()}%`;
    const { data } = await supabase
      .from("products")
      .select("id, name, description, emoji, images, price, discount_percent, discount_amount, brand:brands(name)")
      .or(`name.ilike.${term},description.ilike.${term},brands.name.ilike.${term}`)
      .limit(12);
    setResults(
      ((data ?? []) as any[]).map((p) => ({
        id: p.id, name: p.name, description: p.description, emoji: p.emoji,
        images: p.images ?? [], price: p.price,
        discount_percent: p.discount_percent, discount_amount: p.discount_amount,
        brand_name: p.brand?.name ?? null,
      }))
    );
    setSearching(false);
    setActive(-1);
  }, []);

  // ⏲️ Debounce — بعد 300ms من آخر كتابة
  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  // ⌨️ تنقل بالأسهم + Enter
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    if (e.key === "Enter" && active >= 0 && results[active]) {
      router.push(`/product/${results[active].id}`);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-[#0b1220]/90 backdrop-blur-sm" onClick={onClose}>
      <div className="max-w-2xl mx-auto mt-[8vh] px-4" onClick={(e) => e.stopPropagation()}>
        {/* 📝 خانة البحث */}
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="ابحث عن منتج، ماركة، أو وصف..."
            className="w-full rounded-2xl bg-[#101a30] border border-white/15 focus:border-orange-500/70 px-12 py-4 text-white placeholder-white/40 outline-none shadow-2xl text-base"
          />
          <button onClick={onClose} aria-label="إغلاق البحث" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xl">✕</button>
        </div>

        {/* 📋 النتائج */}
        <div className="mt-3 rounded-2xl bg-[#101a30] border border-white/15 shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto">
          {searching && (
            <div className="p-5 text-center text-sm text-white/50 flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-orange-400 animate-spin" />
              جاري البحث...
            </div>
          )}

          {!searching && query.trim().length < 2 && (
            <div className="p-6 text-center text-sm text-white/40">
              🔍 اكتب حرفين على الأقل — مثال: "شفاط" أو "تورنيدو"
            </div>
          )}

          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm text-white/50">مفيش نتايج لـ "{query}"</p>
              <Link href="/contact" onClick={onClose} className="inline-block mt-2 text-xs font-bold text-orange-400 hover:underline">
                مش لاقي اللي بتدور عليه؟ كلمنا ونوفره لك ←
              </Link>
            </div>
          )}

          {!searching && results.map((r, i) => {
            const { final, hasDiscount } = priceInfo(r as any);
            const img = r.images?.[0];
            return (
              <Link
                key={r.id}
                href={`/product/${r.id}`}
                onClick={onClose}
                onMouseEnter={() => setActive(i)}
                className={`flex items-center gap-4 px-4 py-3 transition border-b border-white/5 last:border-0 ${active === i ? "bg-orange-500/10" : "hover:bg-white/5"}`}
              >
                {/* الصورة أو الإيموجي */}
                <span className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-white/5 grid place-items-center">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={smallImg(img)} alt={r.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{r.emoji ?? "📦"}</span>
                  )}
                </span>
                {/* البيانات */}
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-sm truncate text-white">{r.name}</span>
                  {r.brand_name && <span className="block text-[11px] text-white/40">🏷️ {r.brand_name}</span>}
                </span>
                {/* السعر */}
                <span className="shrink-0 text-left">
                  <span className="block font-black text-orange-400 text-sm">{final} ج.م</span>
                  {hasDiscount && <span className="block text-[10px] text-white/30 line-through">{r.price} ج.م</span>}
                </span>
              </Link>
            );
          })}

          {!searching && results.length > 0 && (
            <div className="px-4 py-2 text-[10px] text-white/30 border-t border-white/5 bg-black/20">
              ⌨️ تنقل بالأسهم ↑↓ واضغط Enter للفتح
            </div>
          )}
        </div>
      </div>
    </div>
  );
}