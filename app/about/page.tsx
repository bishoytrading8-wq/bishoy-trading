import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { countProducts } from "../lib/catalog";
import OpenAuthButton from "../components/OpenAuthButton";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "من نحن",
  description: "تعرف على شركة بيشوي للتجارة والتوريدات — قصتنا وقيمنا وملف شركتنا.",
};

type AboutValue = { icon: string; title: string; desc: string };

export default async function AboutPage() {
  const { data: about } = await supabase.from("about_content").select("*").eq("id", 1).maybeSingle();
  const total = await countProducts();

  const title = about?.title ?? "من نحن";
  const intro = about?.intro ?? "قصة شركة بيشوي للتجارة والتوريدات";
  const story = about?.story ?? "";
  const values = ((about?.values_json ?? []) as AboutValue[]).filter((v) => v.title);
  const pdfUrl = about?.pdf_url ?? "";

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
      <div className="text-center">
        <h1 className="text-4xl font-black">{title.split(" ")[0]} <span className="text-orange-400">{title.split(" ").slice(1).join(" ")}</span> 🏢</h1>
        <p className="text-white/50 mt-3">{intro}</p>
      </div>

      {story && (
        <div className="mt-10 rounded-3xl bg-[#101a30] border border-white/10 p-8 leading-relaxed text-white/70 whitespace-pre-line">
          {story}
        </div>
      )}

      {/* 📎 ملف الشركة */}
      {pdfUrl && (
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
          className="mt-8 group flex items-center gap-5 rounded-3xl border border-orange-500/40 bg-gradient-to-l from-orange-500/15 to-transparent p-6 hover:border-orange-500/70 transition-all duration-300 hover:-translate-y-1">
          <span className="text-4xl">📎</span>
          <div className="flex-1">
            <h3 className="font-black">ملف الشركة التعريفي</h3>
            <p className="text-white/50 text-sm mt-0.5">حمّل ملف PDF كامل بكل تفاصيل الشركة ومنتجاتنا</p>
          </div>
          <span className="hidden sm:inline-block bg-orange-500 group-hover:bg-orange-400 rounded-xl px-5 py-2.5 font-extrabold text-sm transition text-white">تحميل ↓</span>
        </a>
      )}

      {values.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 mt-8">
          {values.map((f) => (
            <div key={f.title} className="rounded-2xl bg-[#101a30] border border-white/10 p-6 hover:border-orange-500/40 transition">
              <span className="text-3xl">{f.icon || "⭐"}</span>
              <h3 className="font-extrabold mt-3">{f.title}</h3>
              <p className="text-sm text-white/50 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      )}

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
        <p className="text-sm text-white/60 mt-2">أنشئ حسابك المجاني لتنفيذ عمليات الشراء — أو كلمنا مباشرة</p>
        <div className="flex gap-3 justify-center mt-5 flex-wrap">
          <OpenAuthButton mode="register" className="bg-orange-500 hover:bg-orange-400 px-8 py-3 rounded-xl font-extrabold transition">✨ حساب جديد مجاني</OpenAuthButton>
          <Link href="/contact" className="border border-white/15 hover:bg-white/5 px-8 py-3 rounded-xl font-bold transition">📞 تواصل معنا</Link>
        </div>
      </div>
    </div>
  );
}