"use client";

import { useEffect, useState } from "react";
import { getSettings, waLink, DEFAULT_SETTINGS, type SiteSettings } from "../lib/settings";
import Reviews from "../components/Reviews";

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-sm placeholder-white/40 outline-none focus:border-orange-500/70 focus:bg-white/10 transition";

/* ═══════════════════════════════════════════
   أيقونات SVG حقيقية بألوان البراندات
   ═══════════════════════════════════════════ */

function FacebookIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function TelegramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function LinkedinIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

/* أيقونات الكروت — خطية أنيقة */
const CardIcons = {
  landline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  mobile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  ),
  address: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  website: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  hours: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  map: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
};

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

  // 🌐 السوشيال — بألوان البراندات الحقيقية
  const socials = [
    { url: s.facebook, label: "فيسبوك", icon: <FacebookIcon className="w-5 h-5" />, style: { backgroundColor: "#1877F2" }, hover: "hover:brightness-110" },
    { url: s.telegram, label: "تلجرام", icon: <TelegramIcon className="w-5 h-5" />, style: { backgroundColor: "#229ED9" }, hover: "hover:brightness-110" },
    { url: s.instagram, label: "انستجرام", icon: <InstagramIcon className="w-5 h-5" />, style: { background: "linear-gradient(45deg,#F58529 0%,#DD2A7B 50%,#8134AF 100%)" }, hover: "hover:brightness-110" },
    { url: s.linkedin, label: "لينكد إن", icon: <LinkedinIcon className="w-5 h-5" />, style: { backgroundColor: "#0A66C2" }, hover: "hover:brightness-110" },
  ].filter((x) => x.url);

  // ☎️ كروت التواصل
  const cards = [
    { icon: CardIcons.landline, title: "تليفون أرضي", value: s.landline, hint: "اضغط للاتصال مباشرة", href: `tel:${s.landline}`, color: "text-blue-400", bg: "bg-blue-500/10" },
    { icon: CardIcons.mobile, title: "تليفون محمول", value: s.mobile, hint: "متاح طول مواعيد العمل", href: `tel:${s.mobile}`, color: "text-orange-400", bg: "bg-orange-500/10" },
    { icon: CardIcons.whatsapp, title: "واتساب", value: s.mobile, hint: "رد سريع في أي وقت", href: waLink(s.whatsapp, "مرحبًا، عايز أستفسر 👋"), color: "text-green-400", bg: "bg-green-500/10" },
    { icon: CardIcons.address, title: "العنوان", value: s.address, hint: "اضغط لفتح اللوكيشن على الخريطة", href: s.maps_url || undefined, color: "text-violet-400", bg: "bg-violet-500/10" },
    { icon: CardIcons.website, title: "موقعنا", value: s.website.replace("https://", ""), hint: "تصفح كل أقسامنا أونلاين", href: s.website, color: "text-sky-400", bg: "bg-sky-500/10" },
    { icon: CardIcons.hours, title: "مواعيد العمل", value: s.hours, hint: "والواتساب شغال دايمًا", href: undefined, color: "text-amber-400", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="pb-12">
      {/* ═══════════ الهيرو ═══════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute top-10 -right-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="max-w-5xl mx-auto px-4 lg:px-8 pt-14 pb-12 text-center relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-orange-300 mb-5">
            إحنا قريبين منك — اختار أنسب طريقة ليك
          </span>
          <h1 className="text-4xl lg:text-5xl font-black leading-tight">
            تواصل <span className="text-orange-400">معانا</span>
          </h1>
          <p className="text-white/50 mt-4 max-w-xl mx-auto leading-relaxed">
            تليفون، واتساب، خريطة، أو رسالة جاهزة — أي طريقة تريحك هتوصلنا فورًا
          </p>
          <div className="flex gap-2 justify-center flex-wrap mt-6">
            {["رد سريع", "توريد لكل مصر", "جودة مضمونة"].map((t) => (
              <span key={t} className="rounded-full bg-[#101a30] border border-white/10 px-4 py-1.5 text-xs font-bold text-white/60">✓ {t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ كارت الخريطة الكبير ═══════════ */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8">
        {s.maps_url && (
          <a href={s.maps_url} target="_blank"
            className="group relative block rounded-3xl border border-orange-500/40 bg-gradient-to-l from-orange-500/15 via-orange-500/5 to-transparent p-7 lg:p-9 hover:border-orange-500/70 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="flex items-center gap-5 lg:gap-7 relative">
              <span className={`inline-grid place-items-center w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shrink-0`}>
                {CardIcons.map}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-orange-300 mb-1">Google Maps</p>
                <h3 className="text-xl lg:text-2xl font-black">موقعنا على الخريطة</h3>
                <p className="text-white/60 text-sm mt-1.5 leading-relaxed">{s.address}</p>
              </div>
              <span className="hidden md:inline-flex items-center gap-2 bg-orange-500 group-hover:bg-orange-400 rounded-xl px-6 py-3.5 font-extrabold text-sm transition shadow-lg shadow-orange-500/30 shrink-0 text-white">
                افتح اللوكيشن <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span>
              </span>
            </div>
            <span className="md:hidden mt-4 flex items-center justify-center gap-2 bg-orange-500 rounded-xl py-3 font-extrabold text-sm w-full text-white">افتح اللوكيشن ←</span>
          </a>
        )}
      </div>

      {/* ═══════════ كروت التواصل ═══════════ */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8 mt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const Tag: any = c.href ? "a" : "div";
            return (
              <Tag
                key={c.title}
                {...(c.href ? { href: c.href, ...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {}) } : {})}
                className="group rounded-2xl bg-[#101a30] border border-white/10 hover:border-white/25 p-6 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  <span className={`inline-grid place-items-center w-12 h-12 rounded-xl ${c.bg} ${c.color} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                    {c.icon}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-white/60">{c.title}</h3>
                    <p className="font-bold mt-0.5 break-words" dir={c.title.includes("تليفون") || c.title === "موقعنا" ? "ltr" : undefined}>{c.value}</p>
                  </div>
                </div>
                <p className="text-[11px] text-white/40 mt-3 pt-3 border-t border-white/5">{c.hint}</p>
              </Tag>
            );
          })}
        </div>
      </div>

      {/* ═══════════ السوشيال — أيقونات دائرية بألوان البراندات ═══════════ */}
      {socials.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 lg:px-8 mt-10 text-center">
          <p className="text-xs font-bold text-white/40 mb-4 uppercase tracking-widest">تابعنا على</p>
          <div className="flex gap-3.5 justify-center">
            {socials.map((soc) => (
              <a key={soc.label} href={soc.url} target="_blank" rel="noopener noreferrer" title={soc.label} aria-label={soc.label}
                className={`w-12 h-12 lg:w-14 lg:h-14 grid place-items-center rounded-full text-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${soc.hover}`}
                style={soc.style}>
                {soc.icon}
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
            <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-green-500/10 text-green-400 ring-1 ring-green-500/20">
              {CardIcons.message}
            </span>
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
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-60 text-[#08130b] rounded-xl py-4 font-extrabold transition flex items-center justify-center gap-2.5 shadow-lg shadow-green-500/20">
              <span className="w-5 h-5">{CardIcons.whatsapp}</span>
              {sending ? "جاري الفتح..." : "ابعت على واتساب دلوقتي"}
            </button>
            <p className="text-center text-[11px] text-white/30">مش هنتصل بيك إلا بخصوص طلبك — خصوصيتك محفوظة</p>
          </div>
        </div>
      </div>

      {/* ⭐⭐⭐ التقييمات — آخر حاجة في الصفحة */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8 mt-16">
        <Reviews />
      </div>
    </div>
  );
}