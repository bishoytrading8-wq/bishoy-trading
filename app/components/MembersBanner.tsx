"use client";

import { useAuth } from "../lib/AuthProvider";
import OpenAuthButton from "./OpenAuthButton";

export default function MembersBanner() {
  const { user, loading } = useAuth();
  if (loading || user) return null;

  return (
    <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-bold">🔒 لمعرفة أسعار المنتجات — <span className="text-orange-400">سجّل الدخول مجانًا</span></p>
      <OpenAuthButton mode="register" className="bg-orange-500 hover:bg-orange-400 px-5 py-2 rounded-lg text-sm font-bold transition">حساب جديد</OpenAuthButton>
    </div>
  );
}