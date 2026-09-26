"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/AuthProvider";
import AdminNav from "../../components/AdminNav";

type OrderRow = {
  id: string; customer_name: string; customer_phone: string; customer_gov: string;
  customer_address: string; total: number; items_count: number; status: string;
  delivery_day: string; delivery_slot: string; notes: string; created_at: string;
  items_json: { name: string; qty: number; price: number }[];
};

const fmtDateTime = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("ar-EG", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }) : "—";

const FILTERS = [
  { key: "new", label: "🆕 جديدة" },
  { key: "done", label: "✅ منفذة" },
  { key: "all", label: "📋 الكل" },
] as const;

export default function OrdersPage() {
  const { role, loading } = useAuth();
  const canView = role?.kind === "owner" || !!role?.perms.viewClients;

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("new");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canView) return;
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(300);
    setOrders((data as OrderRow[]) ?? []);
  }, [canView]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const markDone = async (o: OrderRow) => {
    await supabase.from("orders").update({ status: "done" }).eq("id", o.id);
    load();
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20"><div className="h-40 rounded-3xl bg-white/5 animate-pulse" /></div>;

  if (!canView) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <span className="text-6xl">🔒</span>
        <h1 className="text-2xl font-black mt-4">الطلبات محمية</h1>
      </div>
    );
  }

  const newCount = orders.filter((o) => o.status === "new").length;
  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-10">
      <AdminNav />

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-black">🧾 الطلبات الواردة</h1>
          <p className="text-white/50 text-sm mt-1">بتظهر هنا لحظيًا أول ما عميل يأكد — تواصل معاه على رقمه وعلّمها منفذة</p>
        </div>
        {newCount > 0 && (
          <span className="text-xs font-black text-white bg-red-500 rounded-full px-4 py-2 shadow-lg shadow-red-500/30 animate-pulse">🔴 {newCount} طلب جديد</span>
        )}
      </div>

      <div className="flex gap-2 mb-6 rounded-2xl bg-[#101a30] border border-white/10 p-2 w-fit">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${filter === f.key ? "bg-orange-500 text-white" : "text-white/70 hover:bg-white/5"}`}>
            {f.label} {f.key === "new" && newCount > 0 && `(${newCount})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.map((o) => {
          const open = openId === o.id;
          return (
            <div key={o.id} className="rounded-2xl bg-[#101a30] border border-white/10 overflow-hidden">
              <button onClick={() => setOpenId(open ? null : o.id)} className="w-full text-right flex items-center gap-4 p-4 hover:bg-white/[0.02] transition">
                <span className={`inline-grid place-items-center w-11 h-11 rounded-xl shrink-0 ${o.status === "new" ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400"}`}>🧾</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{o.customer_name} <span className={`text-[10px] rounded-full px-2 py-0.5 ml-1 ${o.status === "new" ? "bg-yellow-500/15 text-yellow-300" : "bg-green-500/15 text-green-300"}`}>{o.status === "new" ? "🆕 جديد" : "✅ منفذ"}</span></p>
                  <p className="text-xs text-white/50 mt-0.5"><span dir="ltr">{o.customer_phone}</span> • {fmtDateTime(o.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-orange-400">{o.total} ج.م</p>
                  <p className="text-[11px] text-white/40">{o.items_count} قطعة</p>
                </div>
              </button>

              {open && (
                <div className="border-t border-white/5 p-4 space-y-3">
                  <div className="space-y-1.5">
                    {(o.items_json ?? []).map((x, i) => (
                      <p key={i} className="text-xs text-white/60">• {x.name} — الكمية: {x.qty} × {x.price} = {x.qty * x.price} ج.م</p>
                    ))}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs text-white/50 rounded-xl bg-white/[0.03] p-3">
                    <p>📍 {o.customer_gov} — {o.customer_address}</p>
                    <p>📅 {o.delivery_day} • ⏰ {o.delivery_slot}</p>
                    {o.notes && <p className="sm:col-span-2">📝 {o.notes}</p>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <a href={`tel:${o.customer_phone}`} className="bg-orange-500 hover:bg-orange-400 text-white rounded-lg px-5 py-2 text-xs font-bold transition">📞 اتصل بالعميل</a>
                    {o.status === "new" && (
                      <button onClick={() => markDone(o)} className="bg-green-500/15 border border-green-500/40 text-green-300 rounded-lg px-5 py-2 text-xs font-bold transition hover:bg-green-500/25">✓ تم التنفيذ</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {shown.length === 0 && (
          <p className="text-center text-sm text-white/40 py-12 rounded-3xl border border-dashed border-white/10">
            {filter === "new" ? "مفيش طلبات جديدة — كل حاجة منفذة ✅" : "مفيش طلبات في الفلتر ده"}
          </p>
        )}
      </div>
    </div>
  );
}