import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT, getAllProducts } from "../products-data";
import OpenAuthButton from "../components/OpenAuthButton";

export const metadata: Metadata = {
  title: "من نحن",
  description: "تعرف على شركة بيشوي للتجارة والتوريدات — قصتنا وقيمنا ومميزاتنا.",
};

const FEATURES = [
  { icon: "🏆", title: "خبرة في السوق", desc: "سنوات من التعامل المباشر مع التجار والعملاء" },
  { icon: "🔍", title: "انتقاء دقيق", desc: "كل منتج بنختبره ونتأكد من جودته قبل العرض" },
  { icon: "⚖️", title: "سعر عادل", desc: "سعر الجملة للجميع — بدون تعقيد" },
  { icon: "📞", title: "تواصل مباشر", desc: "تليفون وواتساب — ورد سريع على كل استفسار" },
];

export default function AboutPage() {
  const total = getAllProducts().length;
  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
      <div className="text-center">
        <h1 className="text-4xl font-black">من <span className="text-orange-400">نحن</span> 🏢</h1>
        <p className="text-white/50 mt-3">قصة شركة بيشوي للتجارة والتوريدات</p>
      </div>

      <div className="mt-10 rounded-3xl bg-[#101a30] border border-white/10 p-8 leading-relaxed text-white/70">
        <p>
          بدأت <span className="text-orange-400 font-bold">{CONTACT.brand}</span> بفكرة بسيطة: إن كل بيت ومحل في مصر يستاهل
          مستلزمات بجودة عالية بسعر مناسب — من غير لف ودوران. اليوم بنوفر مجموعة متكاملة من
          الموايت والشفاطات والأغلفة الديكور والبلورات والمراوح والضفاير، وبنخدم عملاءنا في كل محافظات مصر.
        </p>
        <p className="mt-4">
          إحنا بنشتغل مباشر — من غير وسيط — عشان نضمن أفضل سعر وأسرع استجابة، وبنوفر أسعار الجملة
          لأعضاء موقعنا بشكل كامل ومعلن.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mt-8">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl bg-[#101a30] border border-white/10 p-6 hover:border-orange-500/40 transition">
            <span className="text-3xl">{f.icon}</span>
            <h3 className="font-extrabold mt-3">{f.title}</h3>
            <p className="text-sm text-white/50 mt-1">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mt-8 text-center">
        {[["6", "أقسام رئيسية"], [`${total}+`, "منتج متاح"], ["27", "محافظة نخدمها"]].map(([n, l]) => (
          <div key={l} className="rounded-2xl bg-[#101a30] border border-white/10 py-6">
            <p className="text-3xl font-black text-orange-400">{n}</p>
            <p className="text-xs text-white/50 mt-1">{l}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-3xl border border-orange-500/30 bg-orange-500/5 p-8 text-center">
        <h2 className="text-2xl font-black">جاهز تتعامل معانا؟ 🤝</h2>
        <p className="text-sm text-white/60 mt-2">سجّل عضويتك المجانية وشوف الأسعار كاملة — أو كلمنا مباشرة</p>
        <div className="flex gap-3 justify-center mt-5 flex-wrap">
          <OpenAuthButton mode="register" className="bg-orange-500 hover:bg-orange-400 px-8 py-3 rounded-xl font-extrabold transition">✨ عضوية مجانية</OpenAuthButton>
          <Link href="/contact" className="border border-white/15 hover:bg-white/5 px-8 py-3 rounded-xl font-bold transition">📞 تواصل معنا</Link>
        </div>
      </div>
    </div>
  );
}