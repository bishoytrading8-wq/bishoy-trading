"use client";

import { useAuth } from "../lib/AuthProvider";
import OpenAuthButton from "./OpenAuthButton";

export default function PriceGate({ price, base, compact = false }: { price: number; base?: number; compact?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-6 w-24 rounded bg-white/10 animate-pulse" />;

  const showOld = base != null && base > price;

  // ✅ الكارت المصغّر: القديم مشطوب + الجديد جنبه
  if (compact) {
    return (
      <span className="flex items-center gap-1.5">
        {showOld && <span className="text-[11px] font-bold text-red-400 line-through decoration-2">{base}</span>}
        <p className="text-orange-400 font-extrabold">{price} ج.م</p>
      </span>
    );
  }

  if (user) {
    return (
      <div className="rounded-2xl bg-gradient-to-l from-green-500/15 to-transparent border border-green-500/30 p-5">
        <p className="text-xs text-white/50 font-bold">{showOld ? "السعر بعد الخصم 🔥" : "السعر"}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {showOld && <span className="text-2xl font-bold text-red-400 line-through decoration-2">{base} ج.م</span>}
          <p className="text-4xl font-black text-green-400">{price} <span className="text-lg">ج.م</span></p>
        </div>
        <p className="text-xs text-white/50 mt-2">جاهز للطلب؟ اتصل بنا أو كلمنا واتساب — وهننفذ عملية الشراء فورًا 👇</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-l from-orange-500/15 to-transparent border border-orange-500/30 p-5">
      <p className="text-xs text-white/50 font-bold">{showOld ? "السعر بعد الخصم 🔥" : "السعر"}</p>
      <div className="flex items-center gap-3 mt-1 flex-wrap">
        {showOld && <span className="text-2xl font-bold text-red-400 line-through decoration-2">{base} ج.م</span>}
        <p className="text-4xl font-black text-orange-400">{price} <span className="text-lg">ج.م</span></p>
      </div>
      <p className="text-xs text-white/60 mt-2">جاهز تشتري؟ سجّل الدخول لتنفيذ عملية الشراء — والتسجيل مجاني</p>
      <div className="flex gap-3 justify-center mt-4 flex-wrap">
        <OpenAuthButton mode="register" className="bg-orange-500 hover:bg-orange-400 px-6 py-2.5 rounded-xl font-bold text-sm transition">سجّل لتنفيذ عملية الشراء</OpenAuthButton>
        <OpenAuthButton mode="login" className="border border-white/15 hover:bg-white/5 px-6 py-2.5 rounded-xl font-bold text-sm transition">تسجيل الدخول</OpenAuthButton>
      </div>
    </div>
  );
}