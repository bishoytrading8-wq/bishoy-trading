import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "./products-data";
import { countProducts } from "./lib/catalog";
import MembersCTA from "./components/MembersCTA";

const WHY = [
  { icon: "✅", title: "جودة مضمونة", desc: "منتجات مختارة بعناية قبل ما توصلك" },
  { icon: "💰", title: "أسعار منافسة", desc: "أسعار تناسب البيت والمحل" },
  { icon: "🚚", title: "توريد لكل مصر", desc: "لبيتك ومحلك في أي محافظة" },
  { icon: "🤝", title: "تعامل مباشر", desc: "واتساب وتليفون — بدون وسيط" },
];

export default async function Home() {
  const total = await countProducts();
  return (
    <>
      {/* ===== الهيرو ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center relative">
          <div className="text-center lg:text-right space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-orange-300">✨ جودة مضمونة • أسعار منافسة • توريد لكل مصر</span>
            <h1 className="text-4xl lg:text-6xl font-black leading-[1.25]">
              كل <span className="text-orange-400">مستلزمات بيتك</span> ومحلك<br />تحت سقف واحد
            </h1>
            <p className="text-white/60 leading-relaxed max-w-xl mx-auto lg:mx-0">
              موايت • شفاطات مطابخ • أغلفة ديكور • بلورات • مراوح • ضفاير — جودة عالية وأسعار منافسة لكل بيت ومحل في مصر.
            </p>
            <div className="flex gap-3 justify-center lg:justify-start flex-wrap">
              <a href="#categories" className="bg-orange-500 hover:bg-orange-400 px-8 py-3.5 rounded-xl font-extrabold transition shadow-lg shadow-orange-500/25">🛒 تصفح الأقسام</a>
              <Link href="/contact" className="border border-white/15 hover:bg-white/5 px-8 py-3.5 rounded-xl font-bold transition">📞 تواصل معنا</Link>
            </div>
            <div className="flex gap-8 justify-center lg:justify-start pt-4">
              {[["6", "أقسام رئيسية"], [`${total}+`, "منتج متاح"], ["27", "محافظة نخدمها"]].map(([n, l]) => (
                <div key={l}>
                  <p className="text-3xl font-black text-orange-400">{n}</p>
                  <p className="text-xs text-white/50 mt-1">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* الشعار بحلقات ضوئية */}
          <div className="relative hidden lg:block h-[420px]">
            <div className="absolute inset-0 m-auto w-80 h-80 rounded-full bg-orange-500/20 blur-3xl animate-pulse-glow" />
            <div className="absolute inset-0 m-auto w-96 h-96 rounded-full border border-white/10" />
            <div className="absolute inset-0 m-auto w-80 h-80 rounded-full border border-orange-500/20" />
            <Image src="/logo.jpeg" alt="شعار شركة بيشوي للتجارة والتوريدات" width={230} height={230} className="absolute inset-0 m-auto rounded-full ring-4 ring-orange-500/50 shadow-2xl" />
            <span className="absolute top-6 right-4 animate-float rounded-full bg-[#101a30] border border-white/10 px-4 py-2 text-sm font-bold shadow-xl">🌀 شفاطات مطابخ</span>
            <span className="absolute top-24 left-0 animate-float-slow rounded-full bg-[#101a30] border border-white/10 px-4 py-2 text-sm font-bold shadow-xl">💎 بلورات</span>
            <span className="absolute bottom-24 right-0 animate-float-slow rounded-full bg-[#101a30] border border-white/10 px-4 py-2 text-sm font-bold shadow-xl">🌬️ مراوح</span>
            <span className="absolute bottom-6 left-8 animate-float rounded-full bg-[#101a30] border border-white/10 px-4 py-2 text-sm font-bold shadow-xl">💧 موايت</span>
          </div>
        </div>
      </section>

      {/* ===== الأقسام ===== */}
      <section id="categories" className="max-w-7xl mx-auto px-4 lg:px-8 py-16 scroll-mt-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-black">أقسامنا <span className="text-orange-400">الرئيسية</span></h2>
          <p className="text-white/50 mt-3">اختار القسم واستعرض منتجاتنا</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="group rounded-3xl bg-[#101a30] border border-white/10 hover:border-orange-500/50 p-6 transition-all duration-300 hover:-translate-y-1.5">
              <div className="flex items-start justify-between">
                <span className="text-5xl">{c.emoji}</span>
                <span className="text-xs bg-orange-500/10 text-orange-300 border border-orange-500/20 rounded-full px-3 py-1 font-bold">{c.products.length} منتجات</span>
              </div>
              <h3 className="text-xl font-extrabold mt-4 group-hover:text-orange-400 transition">{c.name}</h3>
              <p className="text-sm text-white/50 mt-1">{c.tagline}</p>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-orange-400 mt-4">استعرض القسم <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span></span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== ليه تشتري مننا ===== */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <h2 className="text-center text-3xl font-black mb-10">ليه تشتري من <span className="text-orange-400">بيشوي</span>؟</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((t) => (
            <div key={t.title} className="rounded-2xl bg-[#101a30] border border-white/10 p-6 text-center hover:border-orange-500/40 transition">
              <span className="text-4xl">{t.icon}</span>
              <h3 className="font-extrabold mt-3">{t.title}</h3>
              <p className="text-xs text-white/50 mt-1">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== الدعوة الذكية (زائر: تسجيل / مسجل: ترحيب) ===== */}
      <MembersCTA />
    </>
  );
}