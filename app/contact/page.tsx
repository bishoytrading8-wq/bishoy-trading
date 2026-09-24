"use client";

import { useEffect, useState } from "react";
import { getSettings, waLink, DEFAULT_SETTINGS, type SiteSettings } from "../lib/settings";
import Reviews from "../components/Reviews";

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-sm placeholder-white/40 outline-none focus:border-orange-500/70 focus:bg-white/10 transition";

export default function ContactPage() {
  const [s, setS] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [form, setForm] = useState({ name: "", phone: "", msg: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => { getSettings().then(setS); }, []);

  const send = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.msg.trim()) {
      alert("اكتب اسمك ورقمك ورسالتك الأول 🙏");
      return;
    }
    setSending(true);
    const text = `مرحبًا 👋\nأنا: ${form.name}\nرقم تليفوني: ${form.phone}\n${form.msg}`;
    window.open(waLink(s.whatsapp, text), "_blank");
    setTimeout(() => setSending(false), 1200);
  };

  // 🌐 السوشيال — بتظهر بس لما اللينك يكون متحط في ⚙️ الإعدادات
  const socials = [
    { url: s.facebook, label: "فيسبوك", bg: "bg-[#1877F2]", hover: "hover:bg-[#1877F2]/80" },
    { url: s.telegram, label: "تلجرام", bg: "bg-[#229ED9]", hover: "hover:bg-[#229ED9]/80" },
    { url: s.instagram, label: "انستجرام", bg: "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]", hover: "hover:opacity-80" },
    { url: s.linkedin, label: "لينكد إن", bg: "bg-[#0A66C2]", hover: "hover:bg-[#0A66C2]/80" },
  ].filter((x) => x.url);

  // ☎️ كروت التواصل
  const cards = [
    { icon: "☎️", title: "تليفون أرضي", value: s.landline, hint: "اضغط للاتصال مباشرة", href: `tel:${s.landline}`, ring: "from-blue-500/20 to-blue-500/5 text-blue-400", border: "hover:border-blue-500/40" },
    { icon: "📱", title: "تليفون محمول", value: s.mobile, hint: "متاح طول مواعيد العمل", href: `tel:${s.mobile}`, ring: "from-orange-500/20 to-orange-500/5 text-orange-400", border: "hover:border-orange-500/40" },
    { icon: "💬", title: "واتساب", value: s.mobile, hint: "رد سريع في أي وقت", href: waLink(s.whatsapp, "مرحبًا، عايز أستفسر 👋"), ring: "from-green-500/20 to-green-500/5 text-green-400", border: "hover:border-green-500/40" },
    { icon: "📍", title: "العنوان", value: s.address, hint: s.maps_url ? "اضغط كارت الخريطة فوق لفتح اللوكيشن" : "نستقبلك في مواعيد العمل", href: s.maps_url || undefined, ring: "from-violet-500/20 to-violet-500/5 text-violet-400", border: "hover:border-violet-500/40" },
    { icon: "🌐", title: "موقعنا", value: s.website.replace("https://", ""), hint: "تصفح كل أقسامنا أونلاين", href: s.website, ring: "from-sky-500/20 to-sky-500/5 text-sky-400", border: "hover:border-sky-500/40" },
    { icon: "🕗", title: "مواعيد العمل", value: s.hours, hint: "وبرضه الواتساب شغال", href: undefined, ring: "from-amber-500/20 to-amber-500/5 text-amber-400", border: "hover:border-amber-500/40" },
  ];

  return (
    <div className="pb-12">
      {/* ═══════════ الهيرو ═══════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute top-10 -right-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="max-w-5xl mx-auto px-4 lg:px-8 pt-14 pb-10 text-center relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-orange-300 mb-5">
            🤝 إحنا قريبين منك — اختار أنسب طريقة ليك
          </span>
          <h1 className="text-4xl lg:text-5xl font-black leading-tight">
            تواصل <span className="text-orange-400">معانا</span>
          </h1>
          <p className="text-white/50 mt-4 max-w-xl mx-auto leading-relaxed">
            تليفون، واتساب، خريطة، أو رسالة جاهزة — أي طريقة تريحك هتوصلنا فورًا، وفريقنا جاهز يوفرلك اللي تدور عليه
          </p>
          {/* شرائط ثقة */}
          <div className="flex gap-2 justify-center flex-wrap mt-6">
            {["⚡ رد سريع", "🚚 توريد لكل مصر", "🏆 جودة مضمونة"].map((t) => (
              <span key={t} className="rounded-full bg-[#101a30] border border-white/10 px-4 py-1.5 text-xs font-bold text-white/60">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ⭐⭐⭐ التقييمات */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8">
        <Reviews />
      </div>

      {/* ═══════════ كارت الخريطة الكبير ═══════════ */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8 mt-14">
        {s.maps_url && (
          <a href={s.maps_url} target="_blank"
            className="group relative block rounded-3xl border border-orange-500/40 bg-gradient-to-l from-orange-500/15 via-orange-500/5 to-transparent p-7 lg:p-9 hover:border-orange-500/70 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            {/* زخرفة خلفية */}
            <div className="absolute -left-10 -bottom-10 text-[140px] opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-500 select-none">🗺️</div>
            <div className="flex items-center gap-5 relative">
              <span className="text-5xl lg:text-6xl group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">🗺️</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-orange-300 mb-1">🗺️ على جوجل مابس</p>
                <h3 className="text-xl lg:text-2xl font-black">موقعنا على الخريطة</h3>
                <p className="text-white/60 text-sm mt-1.5 leading-relaxed">{s.address}</p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-2 bg-orange-500 group-hover:bg-orange-400 rounded-xl px-6 py-3.5 font-extrabold text-sm transition shadow-lg shadow-orange-500/30 shrink-0">
                افتح اللوكيشن <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span>
              </span>
            </div>
            <span className="sm:hidden mt-4 flex items-center justify-center gap-2 bg-orange-500 rounded-xl py-3 font-extrabold text-sm w-full">افتح اللوكيشن ←</span>
          </a>
        )}
      </div>

      {/* ═══════════ كروت التواصل ═══════════ */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8 mt-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const Tag: any = c.href ? "a" : "div";
            return (
              <Tag
                key={c.title}
                {...(c.href ? { href: c.href, ...(c.href.startsWith("http") ? { target: "_blank" } : {}) } : {})}
                className={`group rounded-3xl bg-[#101a30] border border-white/10 ${c.border} p-6 transition-all duration-300 hover:-translate-y-1.5`}
              >
                <span className={`inline-grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-b ${c.ring} text-2xl ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300`}>
                  {c.icon}
                </span>
                <h3 className="font-extrabold mt-4">{c.title}</h3>
                <p className="text-sm font-bold mt-1.5 break-words" dir={c.title.includes("تليفون") || c.title === "موقعنا" ? "ltr" : undefined}>{c.value}</p>
                <p className="text-[11px] text-white/40 mt-2">{c.hint}</p>
              </Tag>
            );
          })}
        </div>
      </div>

      {/* ═══════════ السوشيال — ألوان البراندات ═══════════ */}
      {socials.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 lg:px-8 mt-10 text-center">
          <p className="text-xs font-bold text-white/40 mb-4">تابعنا على</p>
          <div className="flex gap-3 justify-center flex-wrap">
            {socials.map((soc) => (
              <a key={soc.label} href={soc.url} target="_blank" title={soc.label}
                className={`group flex items-center gap-2.5 rounded-full ${soc.bg} ${soc.hover} px-6 py-3 font-extrabold text-sm text-white transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-black/20`}>
                <span className="text-lg group-hover:scale-110 transition-transform inline-block">{soc.label === "فيسبوك" ? "📘" : soc.label === "تلجرام" ? "✈️" : soc.label === "انستجرام" ? "📸" : "💼"}</span>
                {soc.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ فورم الرسالة ═══════════ */}
      <div className="max-w-2xl mx-auto px-4 lg:px-8 mt-14">
        <div className="relative rounded-3xl bg-[#101a30] border border-white/10 p-7 lg:p-9 overflow-hidden">
          <div className="absolute -top-14 -right-14 w-48 h-48 rounded-full bg-green-500/10 blur-3xl" />
          <div className="text-center relative">
            <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-b from-green-500/20 to-green-500/5 text-2xl ring-1 ring-white/10">💬</span>
            <h2 className="text-2xl font-black mt-4">ابعتلنا رسالة</h2>
            <p className="text-xs text-white/50 mt-2">املأ البيانات — الرسالة هتفتح واتساب جاهزة وتوصلنا فورًا</p>
          </div>
          <div className="mt-6 space-y-3 relative">
            <div className="grid sm:grid-cols-2 gap-3">
              <input className={inputCls} placeholder="اسمك" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className={inputCls} inputMode="numeric" placeholder="رقم تليفونك" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })} />
            </div>
            <textarea className={inputCls + " min-h-32 resize-none"} placeholder="اكتب استفسارك أو طلبك... (المنتج اللي عاجبك، الكمية، منطقتك)" value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} />
            <button onClick={send} disabled={sending}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-60 text-[#08130b] rounded-xl py-4 font-extrabold transition flex items-center justify-center gap-2 shadow-lg shadow-green-500/20">
              {sending ? "جاري الفتح..." : "💬 ابعت على واتساب دلوقتي"}
            </button>
            <p className="text-center text-[11px] text-white/30">مش هنتصل بيك إلا بخصوص طلبك — خصوصيتك محفوظة 🔒</p>
          </div>
        </div>
      </div>
    </div>
  );
}