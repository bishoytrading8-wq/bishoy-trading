"use client";

import { useAuth } from "../lib/AuthProvider";
import OpenAuthButton from "./OpenAuthButton";

export default function PriceGate({ price, compact = false }: { price: number; compact?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-6 w-24 rounded bg-white/10 animate-pulse" />;

  // ✅ مسجّل دخول — السعر ظاهر
  if (user) {
    if (compact) return <p className="text-orange-400 font-extrabold">{price} ج.م</p>;
    return (
      <div className="rounded-2xl bg-gradient-to-l from-orange-500/15 to-transparent border border-orange-500/30 p-5">
        <p className="text-xs text-white/50 font-bold">السعر</p>
        <p className="text-4xl font-black text-orange-400 mt-1">{price} <span className="text-lg">ج.م</span></p>
        <p className="text-xs text-white/50 mt-2">عاجبك؟ اتصل بنا أو كلمنا واتساب 👇</p>
      </div>
    );
  }

  // 🔒 زائر — كارت مصغّر (في كروت المنتجات)
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-white/50 font-bold bg-white/5 border border-white/10 rounded-full px-3 py-1">
        🔒 الدخول لمعرفة السعر
      </span>
    );
  }

  // 🔒 زائر — بلوك السعر في صفحة المنتج
  return (
    <div className="rounded-2xl border border-dashed border-orange-500/40 bg-orange-500/5 p-6 text-center">
      <span className="text-4xl">🔒</span>
      <h3 className="font-extrabold text-lg mt-2">لمعرفة سعر المنتجات يرجى تسجيل الدخول</h3>
      <p className="text-sm text-white/60 mt-1">التسجيل مجاني — وبياخد أقل من دقيقة</p>
      <div className="flex gap-3 justify-center mt-4 flex-wrap">
        <OpenAuthButton mode="register" className="bg-orange-500 hover:bg-orange-400 px-6 py-2.5 rounded-xl font-bold text-sm transition">حساب جديد مجاني</OpenAuthButton>
        <OpenAuthButton mode="login" className="border border-white/15 hover:bg-white/5 px-6 py-2.5 rounded-xl font-bold text-sm transition">تسجيل الدخول</OpenAuthButton>
      </div>
    </div>
  );
}