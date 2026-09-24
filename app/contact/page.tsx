"use client";

import { useEffect, useState } from "react";
import { getSettings, waLink, DEFAULT_SETTINGS, type SiteSettings } from "../lib/settings";
import Reviews from "../components/Reviews";

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-orange-500/70 transition";
const cardCls = "rounded-2xl bg-[#101a30] border border-white/10 hover:border-orange-500/40 p-6 text-center transition";

export default function ContactPage() {
  const [s, setS] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [form, setForm] = useState({ name: "", phone: "", msg: "" });

  useEffect(() => { getSettings().then(setS); }, []);

  const send = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.msg.trim()) {
      alert("اكتب اسمك ورقمك ورسالتك الأول 🙏");
      return;
    }
    const text = `مرحبًا 👋\nأنا: ${form.name}\nرقم تليفوني: ${form.phone}\n${form.msg}`;
    window.open(waLink(s.whatsapp, text), "_blank");
  };

  const socials = [
    { url: s.facebook, icon: "📘", label: "فيسبوك", cls: "hover:border-blue-500/40 text-blue-400" },
    { url: s.telegram, icon: "✈️", label: "تلجرام", cls: "hover:border-sky-500/40 text-sky-400" },
    { url: s.instagram, icon: "📸", label: "انستجرام", cls: "hover:border-pink-500/40 text-pink-400" },
    { url: s.linkedin, icon: "💼", label: "لينكد إن", cls: "hover:border-blue-400/40 text-blue-300" },
  ].filter((x) => x.url);

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
      {/* ⭐⭐⭐ التقييمات في أعلى الصفحة */}
      <Reviews />

      {/* ===== عنوان التواصل ===== */}
      <div className="text-center mb-12 mt-16">
        <h1 className="text-4xl font-black">تواصل <span className="text-orange-400">معنا</span> 📞</h1>
        <p className="text-white/50 mt-3">فريقنا جاهز يرد عليك ويوفرلك اللي تدور عليه</p>
      </div>

      {/* 🗺️ كارت الخريطة الكبير — يدوس يدخل اللوكيشن علطول */}
      {s.maps_url && (
        <a href={s.maps_url} target="_blank"
          className="group block rounded-3xl border border-orange-500/40 bg-gradient-to-l from-orange-500/15 to-transparent p-8 mb-10 hover:border-orange-500/70 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-5">
            <span className="text-5xl group-hover:scale-110 transition-transform duration-300">🗺️</span>
            <div className="flex-1">
              <h3 className="text-xl font-black">موقعنا على الخريطة</h3>
              <p className="text-white/60 text-sm mt-1">{s.address}</p>
            </div>
            <span className="hidden sm:inline-block bg-orange-500 group-hover:bg-orange-400 rounded-xl px-6 py-3 font-extrabold text-sm transition shadow-lg shadow-orange-500/25">
              افتح اللوكيشن ←
            </span>
          </div>
        </a>
      )}

      {/* ===== كروت التواصل ===== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        <a href={`tel:${s.landline}`} className={cardCls}>
          <span className="text-3xl">☎️</span>
          <h3 className="font-bold mt-3">تليفون أرضي</h3>
          <p className="text-orange-400 text-sm font-bold mt-1" dir="ltr">{s.landline}</p>
          <p className="text-[11px] text-white/40 mt-1">اضغط الرقم للاتصال مباشرة</p>
        </a>

        <a href={`tel:${s.mobile}`} className={cardCls}>
          <span className="text-3xl">📱</span>
          <h3 className="font-bold mt-3">تليفون محمول</h3>
          <p className="text-orange-400 text-sm font-bold mt-1" dir="ltr">{s.mobile}</p>
          <p className="text-[11px] text-white/40 mt-1">متاح طول مواعيد العمل</p>
        </a>

        <a href={waLink(s.whatsapp, "مرحبًا، عايز أستفسر 👋")} target="_blank" className={cardCls + " hover:border-green-500/40"}>
          <span className="text-3xl">💬</span>
          <h3 className="font-bold mt-3">واتساب</h3>
          <p className="text-green-400 text-sm font-bold mt-1" dir="ltr">{s.mobile}</p>
          <p className="text-[11px] text-white/40 mt-1">رد سريع في أي وقت</p>
        </a>

        <div className={cardCls}>
          <span className="text-3xl">📍</span>
          <h3 className="font-bold mt-3">العنوان</h3>
          <p className="text-white/60 text-sm font-bold mt-1 leading-relaxed">{s.address}</p>
        </div>

        <a href={s.website} target="_blank" className={cardCls}>
          <span className="text-3xl">🌐</span>
          <h3 className="font-bold mt-3">موقعنا</h3>
          <p className="text-orange-400 text-xs font-bold mt-1 break-all" dir="ltr">{s.website.replace("https://", "")}</p>
        </a>

        <div className={cardCls}>
          <span className="text-3xl">🕗</span>
          <h3 className="font-bold mt-3">مواعيد العمل</h3>
          <p className="text-white/50 text-sm font-bold mt-1">{s.hours}</p>
        </div>
      </div>

      {/* 🌐 أزرار السوشيال — بتظهر لما اللينك يتحط في الإعدادات */}
      {socials.length > 0 && (
        <div className="flex gap-3 justify-center flex-wrap mb-12">
          {socials.map((soc) => (
            <a key={soc.label} href={soc.url} target="_blank"
              className={`rounded-2xl bg-[#101a30] border border-white/10 ${soc.cls} px-6 py-3 font-bold text-sm transition hover:-translate-y-1`}>
              {soc.icon} {soc.label}
            </a>
          ))}
        </div>
      )}

      {/* ===== فورم الرسالة ===== */}
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