"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../components/CartProvider";
import { useAuth } from "../lib/AuthProvider";
import { waLink } from "../lib/settings";

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-orange-500/70 transition";

const GOVS = ["القاهرة","الجيزة","الإسكندرية","الدقهلية","الشرقية","القليوبية","كفر الشيخ","الغربية","المنوفية","البحيرة","الإسماعيلية","بورسعيد","السويس","المنيا","بني سويف","الفيوم","أسيوط","سوهاج","قنا","الأقصر","أسوان","البحر الأحمر","الوادي الجديد","مطروح","شمال سيناء","جنوب سيناء","دمياط"];

export default function CartPage() {
  const { items, total, totalQty, setQty, remove, clear } = useCart();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gov, setGov] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");

  // 📤 بناء رسالة الفاتورة المنسقة وإرسالها واتساب
  const sendOrder = () => {
    setMsg("");
    if (!name.trim()) return setMsg("اكتب اسمك الأول");
    if (!/^01[0-9]{9}$/.test(phone)) return setMsg("رقم التليفون لازم 11 رقم يبدأ بـ 01");
    if (!gov) return setMsg("اختار محافظتك");

    const lines = [
      "🧾 *طلب جديد من موقع بيشوي*",
      "──────────────────",
      ...items.map((x, i) =>
        `${i + 1}. ${x.emoji} ${x.name}\n   الكمية: ${x.qty} × ${x.price} ج.م = *${x.qty * x.price} ج.م*`
      ),
      "──────────────────",
      `📦 إجمالي القطع: *${totalQty}*`,
      `💰 *الإجمالي: ${total} ج.م*`,
      "──────────────────",
      `👤 الاسم: ${name.trim()}`,
      `📞 التليفون: ${phone}`,
      `📍 المحافظة: ${gov}`,
      ...(notes.trim() ? [`📝 ملاحظات: ${notes.trim()}`] : []),
    ];

    window.open(waLink("201220847856", lines.join("\n")), "_blank");
  };

  // 🛒 سلة فاضية
  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <span className="text-6xl">🛒</span>
        <h1 className="text-2xl font-black mt-4">طلباتك فاضية</h1>
        <p className="text-white/50 text-sm mt-2">اتفرج على المنتجات وحط اللي يعجبك هنا — وبعدين ابعت طلبك في دقيقة</p>
        <Link href="/#categories" className="inline-block mt-6 bg-orange-500 hover:bg-orange-400 px-8 py-3.5 rounded-xl font-extrabold transition shadow-lg shadow-orange-500/25">🛒 تصفح الأقسام</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-black">🧾 طلبك</h1>
          <p className="text-white/50 text-sm mt-1">راجع منتجاتك، ظبط الكميات، وابعت الطلب على واتساب</p>
        </div>
        <button onClick={() => { if (confirm("تفضيت السلة؟")) clear(); }} className="text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg px-4 py-2 transition">🗑️ تفريغ السلة</button>
      </div>

      {msg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 mb-6">{msg}</div>
      )}

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* ═══════════ المنتجات ═══════════ */}
        <div className="lg:col-span-3 space-y-3">
          {items.map((x) => (
            <div key={x.id} className="flex items-center gap-4 rounded-2xl bg-[#101a30] border border-white/10 p-3.5">
              <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-white/5 grid place-items-center">
                {x.image ? (
                  <Image src={x.image} alt={x.name} width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">{x.emoji}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{x.name}</p>
                <p className="text-xs text-white/40 font-bold mt-0.5">{x.price} ج.م × {x.qty} = <span className="text-orange-400">{x.qty * x.price} ج.م</span></p>
              </div>
              {/* ⬆️⬇️ الكمية */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setQty(x.id, x.qty - 1)} aria-label="تقليل" className="w-8 h-8 grid place-items-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 font-black">−</button>
                <input
                  value={x.qty}
                  onChange={(e) => setQty(x.id, Number(e.target.value.replace(/\D/g, "")) || 1)}
                  className="w-12 h-8 text-center rounded-lg bg-white/5 border border-white/10 text-sm font-bold outline-none focus:border-orange-500/70"
                />
                <button onClick={() => setQty(x.id, x.qty + 1)} aria-label="زيادة" className="w-8 h-8 grid place-items-center rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25 font-black">＋</button>
              </div>
              <button onClick={() => remove(x.id)} aria-label="حذف" className="shrink-0 text-red-400 hover:text-red-300 text-lg transition">✕</button>
            </div>
          ))}
        </div>

        {/* ═══════════ ملخص الطلب ═══════════ */}
        <div className="lg:col-span-2 rounded-3xl bg-[#101a30] border border-white/10 p-6 space-y-4 lg:sticky lg:top-24">
          <h2 className="font-black text-lg">بياناتك 📝</h2>
          <div className="space-y-3">
            <input className={inputCls} placeholder="اسمك *" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={inputCls} inputMode="numeric" placeholder="رقم تليفونك (11 رقم) *" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} />
            <select className={inputCls} value={gov} onChange={(e) => setGov(e.target.value)}>
              <option value="" className="bg-[#101a30]">محافظتك *</option>
              {GOVS.map((g) => <option key={g} value={g} className="bg-[#101a30]">{g}</option>)}
            </select>
            <textarea className={inputCls + " min-h-20 resize-none"} placeholder="ملاحظات — منطقتك بالتحديد، موعد التسليم المناسب..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            {!user && (
              <p className="text-[11px] text-white/40 leading-relaxed">
                💡 لو عندك حساب: <Link href="/" className="text-orange-400 font-bold hover:underline">سجّل الدخول</Link> — وبياناتك هتتملى تلقائيًا المرة الجاية
              </p>
            )}
          </div>

          {/* الإجمالي */}
          <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4">
            <div className="flex items-center justify-between text-sm text-white/60">
              <span>إجمالي القطع</span><span className="font-bold">{totalQty}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="font-bold">الإجمالي</span>
              <span className="text-2xl font-black text-orange-400">{total} <span className="text-sm">ج.م</span></span>
            </div>
          </div>

          <button onClick={sendOrder} className="w-full bg-green-500 hover:bg-green-400 text-[#08130b] rounded-xl py-4 font-extrabold transition flex items-center justify-center gap-2.5 shadow-lg shadow-green-500/20">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            ابعت الطلب على واتساب
          </button>
          <p className="text-center text-[11px] text-white/30">هيتفحص الطلب ويتم الاتفاق على التسليم والدفع 🤝</p>
        </div>
      </div>
    </div>
  );
}