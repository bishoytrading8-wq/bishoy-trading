"use client";

import Link from "next/link";
import { useAuth } from "../lib/AuthProvider";
import OpenAuthButton from "./OpenAuthButton";

export default function MembersCTA() {
  const { user, loading, role } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <section className="max-w-5xl mx-auto px-4 pb-8 pt-10">
        <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-l from-orange-500 via-orange-500/30 to-transparent">
          <div className="rounded-[calc(1.5rem_-_1.5px)] bg-[#0d1526] px-8 py-12 text-center relative overflow-hidden">
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 bg-orange-500/10 blur-3xl rounded-full" />
            <h2 className="text-3xl font-black relative">عايز تعرف <span className="text-orange-400">أسعارنا</span>؟ 👇</h2>
            <p className="text-white/60 mt-3 max-w-lg mx-auto relative text-sm leading-relaxed">
              لمعرفة سعر المنتجات يرجى تسجيل الدخول — التسجيل مجاني وبياخد أقل من دقيقة
            </p>
            <div className="flex gap-3 justify-center mt-6 flex-wrap relative">
              <OpenAuthButton mode="register" className="bg-orange-500 hover:bg-orange-400 px-8 py-3.5 rounded-xl font-extrabold shadow-lg shadow-orange-500/25 transition">✨ حساب جديد مجاني</OpenAuthButton>
              <OpenAuthButton mode="login" className="border border-white/15 hover:bg-white/5 px-8 py-3.5 rounded-xl font-bold transition">تسجيل الدخول</OpenAuthButton>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-4 pb-8 pt-10">
      <div className="rounded-3xl border border-green-500/30 bg-green-500/5 px-8 py-10 text-center relative overflow-hidden">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 bg-green-500/10 blur-3xl rounded-full" />
        <h2 className="text-3xl font-black relative">أهلاً بيك عندنا <span className="text-green-400">🎉</span></h2>
        <p className="text-white/60 mt-3 max-w-lg mx-auto relative text-sm leading-relaxed">
          الأسعار ظاهرة لك دلوقتي في كل المنتجات — اتفرج واختار اللي يعجبك، ولو محتاج أي حاجة إحنا على واتساب طول الوقت
        </p>
        <div className="flex gap-3 justify-center mt-6 flex-wrap relative">
          <Link href="/#categories" className="bg-orange-500 hover:bg-orange-400 px-8 py-3.5 rounded-xl font-extrabold transition shadow-lg shadow-orange-500/25">🛒 اتفرج على المنتجات</Link>
          {role?.kind !== "customer" && (
            <Link href="/admin" className="border border-orange-500/40 text-orange-300 hover:bg-orange-500/10 px-8 py-3.5 rounded-xl font-bold transition">⚙️ لوحة التحكم</Link>
          )}
        </div>
      </div>
    </section>
  );
}