"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../components/CartProvider";
import { useAuth } from "../lib/AuthProvider";
import OpenAuthButton from "../components/OpenAuthButton";
import { supabase } from "../lib/supabase";

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-orange-500/70 transition";

const GOVS = ["القاهرة","الجيزة","الإسكندرية","الدقهلية","الشرقية","القليوبية","كفر الشيخ","الغربية","المنوفية","البحيرة","الإسماعيلية","بورسعيد","السويس","المنيا","بني سويف","الفيوم","أسيوط","سوهاج","قنا","الأقصر","أسوان","البحر الأحمر","الوادي الجديد","مطروح","شمال سيناء","جنوب سيناء","دمياط"];

function getDeliveryDays() {
  const days = [];
  const start = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      label: d.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" }),
      value: d.toISOString().slice(0, 10),
    });
  }
  return days;
}

const TIME_SLOTS = [
  { label: "من 12 ظهرًا حتى 2 عصرًا", value: "12:00-14:00" },
  { label: "من 2 عصرًا حتى 4 عصرًا", value: "14:00-16:00" },
  { label: "من 4 عصرًا حتى 6 مساءً", value: "16:00-18:00" },
];

async function notifyAdminByEmail(params: Record<string, string>) {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  if (!serviceId || !templateId || !publicKey) return;
  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: params,
      }),
    });
  } catch {}
}

export default function CartPage() {
  const { items, total, totalQty, setQty, remove, clear } = useCart();
  const { user, loading } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gov, setGov] = useState("");
  const [address, setAddress] = useState("");
  const [day, setDay] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ ref: string; day: string; slot: string; total: number } | null>(null);

  const deliveryDays = getDeliveryDays();

  const sendOrder = async () => {
    setMsg("");
    if (!name.trim()) return setMsg("اكتب اسمك الأول");
    if (!/^01[0-9]{9}$/.test(phone)) return setMsg("رقم التليفون لازم 11 رقم يبدأ بـ 01");
    if (!gov) return setMsg("اختار محافظتك");
    if (!address.trim()) return setMsg("اكتب العنوان بالتفصيل");
    if (!day) return setMsg("اختار يوم الاستلام");
    if (!timeSlot) return setMsg("اختار الوقت المفضل للاستلام");

    setSending(true);

    const dayLabel = deliveryDays.find((d) => d.value === day)?.label ?? "";
    const slotLabel = TIME_SLOTS.find((t) => t.value === timeSlot)?.label ?? "";

    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        customer_name: name.trim(),
        customer_phone: phone,
        customer_gov: gov,
        customer_address: address.trim(),
        items_json: items.map((x) => ({ name: x.name, qty: x.qty, price: x.price })),
        items_count: totalQty,
        total,
        delivery_day: dayLabel,
        delivery_slot: slotLabel,
        notes: notes.trim(),
      })
      .select("id")
      .single();

    const orderRef = data?.id ? `#${String(data.id).slice(0, 8).toUpperCase()}` : "";

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    await notifyAdminByEmail({
      order_details: items.map((x, i) => `${i + 1}) ${x.name} — الكمية: ${x.qty} × ${x.price} ج.م`).join("\n"),
      total: String(total),
      customer_name: name.trim(),
      customer_phone: phone,
      customer_gov: gov,
      customer_address: address.trim(),
      delivery_day: dayLabel,
      delivery_slot: slotLabel,
      orders_link: `${origin}/admin/orders`,
    });

    setSending(false);

    if (error) {
      setMsg("حصل خطأ في تسجيل الطلب — جرّب تاني");
      return;
    }

    setDone({ ref: orderRef, day: dayLabel, slot: slotLabel, total });
    clear();
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <span className="text-6xl">🎉</span>
        <h1 className="text-3xl font-black mt-4">تم استلام طلبك!</h1>
        {done.ref && <p className="text-sm font-bold text-orange-400 mt-2">رقم الطلب: {done.ref}</p>}
        <div className="mt-6 rounded-3xl bg-[#101a30] border border-white/10 p-6 text-right space-y-2">
          <p className="text-sm text-white/70">📅 يوم الاستلام: <span className="font-bold text-white">{done.day}</span></p>
          <p className="text-sm text-white/70">⏰ الوقت المفضل: <span className="font-bold text-white">{done.slot}</span></p>
          <p className="text-sm text-white/70">💰 الإجمالي: <span className="font-bold text-white">{done.total} ج.م</span></p>
        </div>
        <p className="text-white/50 text-sm mt-5 leading-relaxed">✅ هنتواصل معاك على التليفون لتأكيد الطلب والاتفاق على التفاصيل</p>
        <div className="flex gap-3 justify-center mt-6 flex-wrap">
          <Link href="/" className="bg-orange-500 hover:bg-orange-400 px-6 py-3 rounded-xl font-bold transition">🏠 الرئيسية</Link>
          <Link href="/my-orders" className="border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 px-6 py-3 rounded-xl font-bold transition">🧾 شوف طلباتك</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <span className="text-6xl">🛒</span>
        <h1 className="text-2xl font-black mt-4">طلباتك فاضية</h1>
        <p className="text-white/50 text-sm mt-2">اتفرج على المنتجات وحط اللي يعجبك هنا</p>
        <Link href="/#categories" className="inline-block mt-6 bg-orange-500 hover:bg-orange-400 px-8 py-3.5 rounded-xl font-extrabold transition shadow-lg shadow-orange-500/25">🛒 تصفح الأقسام</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-black">🧾 طلبك</h1>
          <p className="text-white/50 text-sm mt-1">راجع منتجاتك، ظبط الكميات، وأكد الطلب — هنتواصل معاك للتأكيد</p>
        </div>
        <button onClick={() => { if (confirm("تفضيت السلة؟")) clear(); }} className="text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg px-4 py-2 transition">🗑️ تفريغ السلة</button>
      </div>

      {msg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 mb-6">{msg}</div>
      )}

      <div className="grid lg:grid-cols-5 gap-6 items-start">
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

        <div className="lg:col-span-2 rounded-3xl bg-[#101a30] border border-white/10 p-6 space-y-4 lg:sticky lg:top-24">
          <h2 className="font-black text-lg">
            {user ? "بياناتك 📝" : "تأكيد الطلب 🔒"}
          </h2>

          {loading ? (
            <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
          ) : !user ? (
            <div className="rounded-2xl border border-dashed border-orange-500/40 bg-orange-500/5 p-5 text-center">
              <span className="text-3xl">🔒</span>
              <p className="text-sm font-bold mt-2">لمعرفة تفاصيل الطلب يرجى تسجيل الدخول</p>
              <p className="text-[11px] text-white/40 mt-1">السلة محفوظة عندك — أول ما تسجل هتكمل عادي</p>
              <div className="flex gap-2 justify-center mt-4 flex-wrap">
                <OpenAuthButton mode="login" className="bg-orange-500 hover:bg-orange-400 px-5 py-2.5 rounded-xl font-bold text-sm transition">تسجيل الدخول</OpenAuthButton>
                <OpenAuthButton mode="register" className="border border-white/15 hover:bg-white/5 px-5 py-2.5 rounded-xl font-bold text-sm transition">حساب جديد</OpenAuthButton>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <input className={inputCls} placeholder="اسمك *" value={name} onChange={(e) => setName(e.target.value)} />
                <input className={inputCls} inputMode="numeric" placeholder="رقم تليفونك (11 رقم) *" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} />
                <select className={inputCls} value={gov} onChange={(e) => setGov(e.target.value)}>
                  <option value="" className="bg-[#101a30]">محافظتك *</option>
                  {GOVS.map((g) => <option key={g} value={g} className="bg-[#101a30]">{g}</option>)}
                </select>
                <textarea className={inputCls + " min-h-20 resize-none"} placeholder="العنوان بالتفصيل * — الشارع، رقم العمارة، الدور، الشقة، علامة مميزة" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
                <p className="text-xs font-extrabold text-blue-300">📅 مواعيد الاستلام — بعد الطلب بيوم (24 ساعة)</p>
                <p className="text-[11px] text-white/40 leading-relaxed">الاستلام متاح من الساعة 12 ظهرًا حتى 6 مساءً — اختار اليوم والوقت المناسب ليك:</p>
                <select className={inputCls} value={day} onChange={(e) => setDay(e.target.value)}>
                  <option value="" className="bg-[#101a30]">يوم الاستلام *</option>
                  {deliveryDays.map((d) => <option key={d.value} value={d.value} className="bg-[#101a30]">{d.label}</option>)}
                </select>
                <select className={inputCls} value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
                  <option value="" className="bg-[#101a30]">الوقت المفضل للاستلام *</option>
                  {TIME_SLOTS.map((t) => <option key={t.value} value={t.value} className="bg-[#101a30]">{t.label}</option>)}
                </select>
              </div>

              <textarea className={inputCls + " min-h-16 resize-none"} placeholder="ملاحظات إضافية (اختياري)" value={notes} onChange={(e) => setNotes(e.target.value)} />

              <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4">
                <div className="flex items-center justify-between text-sm text-white/60">
                  <span>إجمالي القطع</span><span className="font-bold">{totalQty}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold">الإجمالي</span>
                  <span className="text-2xl font-black text-orange-400">{total} <span className="text-sm">ج.م</span></span>
                </div>
              </div>

              <button onClick={sendOrder} disabled={sending} className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-60 text-[#08130b] rounded-xl py-4 font-extrabold transition shadow-lg shadow-green-500/20">
                {sending ? "جاري تأكيد الطلب..." : "✅ تأكيد الطلب"}
              </button>
              <p className="text-center text-[11px] text-white/30">بعد التأكيد هنتواصل معاك لتأكيد الطلب والاتفاق على الدفع 🤝</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}