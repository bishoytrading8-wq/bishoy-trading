import Image from "next/image";
import Link from "next/link";
import { getCategories, getCategoryCounts, countProducts } from "./lib/catalog";
import HomeCTA from "./components/HomeCTA";
import CatsGrid from "./components/CatsGrid";

export const revalidate = 0;

const WHY = [
  { icon: "✅", title: "جودة مضمونة", desc: "منتجات مختارة بعناية قبل ما توصلك" },
  { icon: "💰", title: "أسعار منافسة", desc: "أسعار تناسب البيت والمحل" },
  { icon: "🚚", title: "توريد لكل مصر", desc: "لبيتك ومحلك في أي محافظة" },
  { icon: "🤝", title: "تعامل مباشر", desc: "واتساب وتليفون — بدون وسيط" },
];

// 🎈 توزيع رياضي على محيط دايرة حوالين اللوجو
function orbitPosition(index: number, total: number) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radiusX = 36;
  const radiusY = 45;
  const x = 50 + radiusX * Math.cos(angle);
  const y = 50 + radiusY * Math.sin(angle);
  return { left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" };
}

export default async function Home() {
  const [cats, counts, total] = await Promise.all([
    getCategories(),
    getCategoryCounts(),
    countProducts(),
  ]);

  return (
    <>
      {/* ═══════════ الهيرو المتحرك ═══════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-orange-500/15 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14 lg:py-20 grid lg:grid-cols-2 gap-10 items-center relative">
          <div className="text-center lg:text-right space-y-6">
            <span className="animate-rise-in inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-orange-300">✨ جودة مضمونة • أسعار منافسة • توريد لكل مصر</span>
            <h1 className="text-4xl lg:text-6xl font-black leading-[1.25] animate-rise-in" style={{ animationDelay: "120ms" }}>
              كل <span className="text-orange-400 animate-glow-text">مستلزمات بيتك</span> ومحلك<br />تحت سقف واحد
            </h1>
            <p className="text-white/60 leading-relaxed max-w-xl mx-auto lg:mx-0 animate-rise-in" style={{ animationDelay: "240ms" }}>
              {cats.map((c) => c.name).join(" • ")} — جودة عالية وأسعار منافسة لكل بيت ومحل في مصر.
            </p>
            <div className="flex gap-3 justify-center lg:justify-start flex-wrap animate-rise-in" style={{ animationDelay: "360ms" }}>
              <a href="#categories" className="bg-orange-500 hover:bg-orange-400 px-8 py-3.5 rounded-xl font-extrabold transition shadow-lg shadow-orange-500/25">🛒 تصفح الأقسام</a>
              <Link href="/contact" className="border border-white/15 hover:bg-white/5 px-8 py-3.5 rounded-xl font-bold transition">📞 تواصل معنا</Link>
            </div>
            <div className="flex gap-8 justify-center lg:justify-start pt-4 animate-rise-in" style={{ animationDelay: "480ms" }}>
              <div>
                <p className="text-3xl font-black text-orange-400">{cats.length}</p>
                <p className="text-xs text-white/50 mt-1">أقسام رئيسية</p>
              </div>
              <div>
                <p className="text-3xl font-black text-orange-400">{total}+</p>
                <p className="text-xs text-white/50 mt-1">منتج متاح</p>
              </div>
              <div>
                <p className="text-3xl font-black text-orange-400">27</p>
                <p className="text-xs text-white/50 mt-1">محافظة نخدمها</p>
              </div>
            </div>
          </div>

          {/* 🎈 اللوجو + الحلقات + شارات الأقسام — توزيع رياضي مضمون */}
          <div className="relative h-[380px] sm:h-[460px]">
            <div className="absolute inset-0 m-auto w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-orange-500/20 blur-3xl animate-pulse-glow" />
            <div className="absolute inset-0 m-auto w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-dashed border-white/10 animate-spin-slow" />
            <div className="absolute inset-0 m-auto w-60 h-60 sm:w-80 sm:h-80 rounded-full border-2 border-orange-500/30 animate-spin-slower" />
            <div className="absolute inset-0 m-auto w-44 h-44 sm:w-64 sm:h-64 rounded-full bg-white ring-4 ring-orange-500/60 shadow-2xl animate-float overflow-hidden">
              <Image src="/logo.jpeg" alt="شعار شركة بيشوي للتجارة والتوريدات" width={256} height={256} className="w-full h-full object-cover rounded-full" />
            </div>

            {/* 🏷️ شارات الأقسام — موزعة رياضيًا على الدايرة */}
            {cats.map((c, i) => {
              const pos = orbitPosition(i, cats.length);
              return (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="absolute animate-float-slow animate-rise-in rounded-full bg-white text-[#0f172a] shadow-lg hover:shadow-xl border border-orange-500/30 hover:border-orange-500/70 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-extrabold hover:scale-110 hover:z-10 transition-all duration-300 whitespace-nowrap"
                  style={{ ...pos, animationDelay: `${600 + i * 150}ms`, animationDuration: `${6 + (i % 3)}s` }}
                  title={`روح لقسم ${c.name}`}
                >
                  <span className="mr-1">{c.emoji}</span> {c.name}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ الأقسام — ظهور متدرج ═══════════ */}
      <section id="categories" className="max-w-7xl mx-auto px-4 lg:px-8 py-16 scroll-mt-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-black">أقسامنا <span className="text-orange-400">الرئيسية</span></h2>
          <p className="text-white/50 mt-3">اختار القسم واستعرض منتجاتنا</p>
        </div>
        <CatsGrid cats={cats} counts={counts} />
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

      {/* ===== الدعوة الذكية ===== */}
      <HomeCTA />
    </>
  );
}