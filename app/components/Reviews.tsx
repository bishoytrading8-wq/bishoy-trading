"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthProvider";

type Review = { id: string; name: string; stars: number; note: string; created_at: string };

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-orange-500/70 transition";

export default function Reviews() {
  const { role } = useAuth();
  // حذف التقييمات: للمالك أو موظف بصلاحية عرض العملاء
  const isAdmin = role?.kind === "owner" || !!role?.perms.viewClients;

  const [items, setItems] = useState<Review[]>([]);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [stars, setStars] = useState(5);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(24);
    setItems((data as Review[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ⭐ متوسط التقييم
  const avg = items.length ? items.reduce((s, r) => s + Number(r.stars), 0) / items.length : 0;

  const submit = async () => {
    setMsg("");
    if (!name.trim()) return setMsg("اكتب اسمك الأول 🙏");
    if (!note.trim()) return setMsg("اكتب ملاحظتك — حتى لو سطر واحد");
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({
      name: name.trim(),
      stars,
      note: note.trim(),
    });
    setBusy(false);
    if (error) return setMsg("حصل خطأ — جرّب تاني");
    setMsg("✓ شكرًا من القلب! تقييمك ظهر على الموقع 🎉");
    setName(""); setNote(""); setStars(5);
    load();
  };

  const removeReview = async (id: string) => {
    if (!confirm("تحذف التقييم ده؟")) return;
    await supabase.from("reviews").delete().eq("id", id);
    load();
  };

  return (
    <section>
      {/* العنوان + المتوسط */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black">قيّم <span className="text-orange-400">تجربتك</span> ⭐</h1>
        <p className="text-white/50 mt-3">رأيك بيساعدنا نتحسن — وبيساعد غيرك يعرفنا</p>

        {items.length > 0 && (
          <div className="inline-flex items-center gap-3 mt-4 rounded-full border border-yellow-500/30 bg-yellow-500/5 px-5 py-2">
            <span className="text-2xl font-black text-yellow-400">{avg.toFixed(1)}</span>
            <span className="text-xl" style={{ color: "#fbbf24" }}>
              {"★".repeat(Math.round(avg))}{"☆".repeat(5 - Math.round(avg))}
            </span>
            <span className="text-xs text-white/50 font-bold">({items.length} تقييم)</span>
          </div>
        )}
      </div>

      {/* فورم التقييم */}
      <div className="max-w-xl mx-auto rounded-3xl bg-[#101a30] border border-white/10 p-6 space-y-4">
        {/* النجوم — بتتكبّر لما تحط الماوس عليها */}
        <div className="flex justify-center gap-1" dir="ltr">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setStars(n)}
              aria-label={`${n} نجوم`}
              className={`text-4xl transition-transform duration-150 hover:scale-125 ${(hover || stars) >= n ? "text-yellow-400" : "text-white/15"}`}
            >
              ★
            </button>
          ))}
        </div>
        <input className={inputCls} placeholder="اسمك" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea className={inputCls + " min-h-20 resize-none"} placeholder="ملاحظتك على الموقع أو التعامل..." value={note} onChange={(e) => setNote(e.target.value)} />
        {msg && (
          <p className={`text-xs font-bold rounded-xl px-4 py-3 text-center ${msg.startsWith("✓") ? "text-green-400 bg-green-500/10 border border-green-500/30" : "text-red-400 bg-red-500/10 border border-red-500/20"}`}>
            {msg}
          </p>
        )}
        <button onClick={submit} disabled={busy} className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 rounded-xl py-3.5 font-extrabold transition">
          {busy ? "جاري الإرسال..." : "⭐ ابعت التقييم"}
        </button>
      </div>

      {/* التقييمات اللي نزلت */}
      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 mt-8">
          {items.map((r) => (
            <div key={r.id} className="rounded-2xl bg-[#101a30] border border-white/10 p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">{r.name}</p>
                <span className="text-sm" style={{ color: "#fbbf24" }}>
                  {"★".repeat(Number(r.stars))}{"☆".repeat(5 - Number(r.stars))}
                </span>
              </div>
              {r.note && <p className="text-sm text-white/60 mt-2 leading-relaxed">"{r.note}"</p>}
              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] text-white/30">🗓️ {fmtDate(r.created_at)}</span>
                {isAdmin && (
                  <button onClick={() => removeReview(r.id)} className="text-[11px] font-bold text-red-400 hover:text-red-300">
                    🗑️ حذف
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}