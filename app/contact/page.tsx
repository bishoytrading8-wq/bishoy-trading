"use client";

import { useState } from "react";
import { CONTACT, WHATSAPP_LINK } from "../products-data";
import Reviews from "../components/Reviews";

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-orange-500/70 transition";
const cardCls = "rounded-2xl bg-[#101a30] border border-white/10 hover:border-orange-500/40 p-6 text-center transition";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", msg: "" });

  const send = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.msg.trim()) {
      alert("اكتب اسمك ورقمك ورسالتك الأول 🙏");
      return;
    }
    const text = `مرحبًا 👋\nأنا: ${form.name}\nرقم تليفوني: ${form.phone}\n${form.msg}`;
    window.open(WHATSAPP_LINK(text), "_blank");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
      {/* ⭐⭐⭐ التقييمات في أعلى الصفحة — أول حاجة الزائر يشوفها */}
      <Reviews />

      {/* ===== عنوان التواصل ===== */}
      <div className="text-center mb-12 mt-16">
        <h1 className="text-4xl font-black">تواصل <span className="text-orange-400">معنا</span> 📞</h1>
        <p className="text-white/50 mt-3">فريقنا جاهز يرد عليك ويوفرلك اللي تدور عليه</p>
      </div>

      {/* ===== 6 كروت تواصل ===== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-12">

        {/* ☎️ التليفون الأرضي */}
        <a href={`tel:${CONTACT.landline}`} className={cardCls}>
          <span className="text-3xl">☎️</span>
          <h3 className="font-bold mt-3">تليفون أرضي</h3>
          <p className="text-orange-400 text-sm font-bold mt-1" dir="ltr">{CONTACT.landline}</p>
          <p className="text-[11px] text-white/40 mt-1">اضغط الرقم للاتصال مباشرة</p>
        </a>

        {/* 📱 التليفون المحمول */}
        <a href={`tel:${CONTACT.mobile}`} className={cardCls}>
          <span className="text-3xl">📱</span>
          <h3 className="font-bold mt-3">تليفون محمول</h3>
          <p className="text-orange-400 text-sm font-bold mt-1" dir="ltr">{CONTACT.mobile}</p>
          <p className="text-[11px] text-white/40 mt-1">متاح طول مواعيد العمل</p>
        </a>

        {/* 💬 واتساب */}
        <a href={WHATSAPP_LINK("مرحبًا، عايز أستفسر 👋")} target="_blank" className={cardCls + " hover:border-green-500/40"}>
          <span className="text-3xl">💬</span>
          <h3 className="font-bold mt-3">واتساب</h3>
          <p className="text-green-400 text-sm font-bold mt-1" dir="ltr">{CONTACT.mobile}</p>
          <p className="text-[11px] text-white/40 mt-1">رد سريع في أي وقت</p>
        </a>

        {/* 📍 العنوان */}
        <div className={cardCls}>
          <span className="text-3xl">📍</span>
          <h3 className="font-bold mt-3">العنوان</h3>
          <p className="text-white/60 text-sm font-bold mt-1 leading-relaxed">{CONTACT.address}</p>
        </div>

        {/* 🌐 الموقع */}
        <a href={CONTACT.website} target="_blank" className={cardCls}>
          <span className="text-3xl">🌐</span>
          <h3 className="font-bold mt-3">موقعنا</h3>
          <p className="text-orange-400 text-xs font-bold mt-1 break-all" dir="ltr">{CONTACT.website.replace("https://", "")}</p>
        </a>

        {/* 🕗 مواعيد العمل */}
        <div className={cardCls}>
          <span className="text-3xl">🕗</span>
          <h3 className="font-bold mt-3">مواعيد العمل</h3>
          <p className="text-white/50 text-sm font-bold mt-1">{CONTACT.hours}</p>
        </div>
      </div>

      {/* ===== فورم الرسالة — بيفتح واتساب ===== */}
      <div className="max-w-xl mx-auto rounded-3xl bg-[#101a30] border border-white/10 p-7">
        <h2 className="text-xl font-black text-center">ابعتلنا رسالة 💬</h2>
        <p className="text-center text-xs text-white/50 mt-1">الرسالة بتفتح واتساب جاهزة — بتوصلنا فورًا</p>
        <div className="mt-5 space-y-3">
          <input className={inputCls} placeholder="اسمك" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={inputCls} inputMode="numeric" placeholder="رقم تليفونك" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })} />
          <textarea className={inputCls + " min-h-28 resize-none"} placeholder="اكتب استفسارك أو طلبك..." value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} />
          <button onClick={send} className="w-full bg-green-500 hover:bg-green-400 text-[#08130b] rounded-xl py-3.5 font-extrabold transition">💬 ابعت على واتساب</button>
        </div>
      </div>
    </div>
  );
}