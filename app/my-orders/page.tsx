"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthProvider";
import OpenAuthButton from "../components/OpenAuthButton";

type OrderRow = {
  id: string;
  total: number;
  items_count: number;
  status: string;
  delivery_day: string;
  delivery_slot: string;
  created_at: string;
  items_json: { name: string; qty: number; price: number }[];
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }) : "—";

export default function MyOrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setOrders((data as OrderRow[]) ?? []);
    setLoadingData(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (!loading && !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <span className="text-6xl">🔐</span>
        <h1 className="text-2xl font-black mt-4">طلباتك محفوظة بحسابك</h1>
        <p className="text-white/50 text-sm mt-2">سجّل الدخول لتشوف طلباتك السابقة وحالتها</p>
        <div className="mt-6">
          <OpenAuthButton mode="login" className="bg-orange-500 hover:bg-orange-400 px-6 py-3 rounded-xl font-bold transition">تسجيل الدخول</OpenAuthButton>
        </div>
      </div>
    );
  }

  if (loading || loadingData) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)}
      </div>
    );
  }

  const newCount = orders.filter((o) => o.status === "new").length;

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-10">
      <h1 className="text-3xl font-black">🧾 طلباتي</h1>
      <p className="text-white/50 text-sm mt-2 mb-8">
        {orders.length > 0 ? `${orders.length} طلب — منهم ${newCount} تحت التنفيذ` : "لسه مفيش طلبات"}
      </p>

      {orders.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed border-white/15">
          <span className="text-5xl">🛒</span>
          <Link href="/#categories" className="inline-block mt-5 bg-orange-500 hover:bg-orange-400 px-8 py-3 rounded-xl font-extrabold transition">🛒 تصفح الأقسام</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const isNew = o.status === "new";
            return (
              <details key={o.id} className="rounded-2xl bg-[#101a30] border border-white/10 group">
                <summary className="flex items-center gap-4 p-4 cursor-pointer list-none">
                  <span className={`inline-grid place-items-center w-12 h-12 rounded-2xl shrink-0 ${isNew ? "bg-yellow-500/15 text-yellow-400" : "bg-green-500/15 text-green-400"}`}>
                    {isNew ? "⏳" : "✅"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold">طلب {fmtDate(o.created_at)}</p>
                    <p className="text-xs text-white/50 mt-0.5">{o.items_count} قطعة • 📅 {o.delivery_day}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-orange-400">{o.total} ج.م</p>
                    <span className={`text-[10px] rounded-full px-2 py-0.5 ${isNew ? "bg-yellow-500/15 text-yellow-300" : "bg-green-500/15 text-green-300"}`}>
                      {isNew ? "⏳ تحت التنفيذ" : "✅ تم"}
                    </span>
                  </div>
                </summary>
                <div className="border-t border-white/5 p-4 space-y-1.5">
                  {(o.items_json ?? []).map((x, i) => (
                    <p key={i} className="text-xs text-white/60">• {x.name} — {x.qty} × {x.price} = {x.qty * x.price} ج.م</p>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}