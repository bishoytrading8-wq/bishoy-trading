"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/AuthProvider";
import AdminNav from "../../components/AdminNav";
import Link from "next/link";

type OrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_gov: string;
  total: number;
  items_count: number;
  status: string;
  created_at: string;
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("ar-EG", { day: "numeric", month: "long" }) : "—";

function StatCard({ icon, label, value, sub, color, gradient }: { icon: string; label: string; value: number | string; sub?: string; color: string; gradient: string }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl p-[1.5px] bg-gradient-to-bl ${gradient}`}>
      <div className="rounded-[calc(1.5rem_-_1.5px)] bg-[#101a30] p-5 relative">
        <div className="flex items-center gap-3">
          <span className={`inline-grid place-items-center w-12 h-12 rounded-2xl ${color} text-xl shrink-0`}>{icon}</span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-white/50">{label}</p>
            <p className="text-3xl font-black text-white leading-tight">{value}</p>
          </div>
        </div>
        {sub && <p className="text-[11px] text-white/40 mt-3 pt-3 border-t border-white/5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { role, loading } = useAuth();
  const isOwner = role?.kind === "owner";
  const canView = isOwner || !!role?.perms.viewClients;

  const [stats, setStats] = useState({
    products: 0, noImages: 0, discounted: 0,
    clients: 0, clientsToday: 0, clientsWeek: 0,
    staffActive: 0, staffTotal: 0,
    reviews: 0, reviewsAvg: 0,
    orders: 0, ordersToday: 0, revenue: 0, revenueToday: 0, pending: 0,
    brands: 0, cats: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);

  const load = useCallback(async () => {
    if (!canView) return;
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [productsRes, clientsRes, staffRes, reviewsRes, ordersRes, brandsRes, catsRes] = await Promise.all([
      supabase.from("products").select("images, discount_percent, discount_amount"),
      supabase.from("profiles").select("created_at"),
      supabase.from("staff_members").select("is_active"),
      supabase.from("reviews").select("stars, created_at"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("brands").select("id", { count: "exact", head: true }),
      supabase.from("categories").select("id", { count: "exact", head: true }),
    ]);

    const products = (productsRes.data ?? []) as { images: string[] | null; discount_percent: number | null; discount_amount: number | null }[];
    const clients = (clientsRes.data ?? []) as { created_at: string }[];
    const staff = (staffRes.data ?? []) as { is_active: boolean }[];
    const reviews = (reviewsRes.data ?? []) as { stars: number; created_at: string }[];
    const orders = (ordersRes.data ?? []) as OrderRow[];

    setStats({
      products: products.length,
      noImages: products.filter((p) => !p.images || p.images.length === 0).length,
      discounted: products.filter((p) => p.discount_percent != null || p.discount_amount != null).length,
      clients: clients.length,
      clientsToday: clients.filter((c) => c.created_at?.slice(0, 10) === today).length,
      clientsWeek: clients.filter((c) => c.created_at >= weekAgo).length,
      staffActive: staff.filter((x) => x.is_active).length,
      staffTotal: staff.length,
      reviews: reviews.length,
      reviewsAvg: reviews.length ? reviews.reduce((s, r) => s + Number(r.stars), 0) / reviews.length : 0,
      orders: orders.length,
      ordersToday: orders.filter((o) => o.created_at?.slice(0, 10) === today).length,
      revenue: orders.reduce((s, o) => s + Number(o.total), 0),
      revenueToday: orders.filter((o) => o.created_at?.slice(0, 10) === today).reduce((s, o) => s + Number(o.total), 0),
      pending: orders.filter((o) => o.status === "new").length,
      brands: brandsRes.count ?? 0,
      cats: catsRes.count ?? 0,
    });
    setRecentOrders(orders.slice(0, 5));
  }, [canView]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20"><div className="h-40 rounded-3xl bg-white/5 animate-pulse" /></div>;

  if (!canView) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <span className="text-6xl">🔒</span>
        <h1 className="text-2xl font-black mt-4">لوحة الإدارة محمية</h1>
        <p className="text-white/50 text-sm mt-2">محتاج صلاحية عرض العملاء أو تكون مالك</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
      <AdminNav />

      {/* الهيدر + زرار المعاينة */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-black">📊 لوحة الإدارة</h1>
          <p className="text-white/50 text-sm mt-1">نظرة شاملة على أداء موقعك</p>
        </div>
        <PreviewToggle />
      </div>

      {/* 💰 المبيعات والطلبات — البطلة */}
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <StatCard
          icon="💰" label="إجمالي المبيعات المسجلة" value={`${stats.revenue} ج.م`}
          sub={`النهاردة: ${stats.revenueToday} ج.م • عدد الطلبات: ${stats.orders}`}
          color="bg-green-500/15 text-green-400" gradient="from-green-500 via-green-500/40 to-transparent"
        />
        <StatCard
          icon="🧾" label="الطلبات" value={stats.orders}
          sub={`النهاردة: ${stats.ordersToday} • في انتظار التنفيذ: ${stats.pending}`}
          color="bg-orange-500/15 text-orange-400" gradient="from-orange-500 via-orange-500/40 to-transparent"
        />
      </div>

      {/* باقي الإحصائيات */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <StatCard icon="📦" label="المنتجات" value={stats.products}
          sub={`بخصومات 🔥: ${stats.discounted} • ناقصة صور: ${stats.noImages}`}
          color="bg-orange-500/15 text-orange-400" gradient="from-orange-500/60 via-orange-500/20 to-transparent" />
        <StatCard icon="👥" label="العملاء" value={stats.clients}
          sub={`النهاردة: ${stats.clientsToday} • آخر 7 أيام: ${stats.clientsWeek}`}
          color="bg-blue-500/15 text-blue-400" gradient="from-blue-500/60 via-blue-500/20 to-transparent" />
        <StatCard icon="⭐" label="التقييمات" value={stats.reviews}
          sub={stats.reviews > 0 ? `المتوسط: ${stats.reviewsAvg.toFixed(1)} / 5` : "لسه مفيش"}
          color="bg-yellow-500/15 text-yellow-400" gradient="from-yellow-500/60 via-yellow-500/20 to-transparent" />
        <StatCard icon="🧑‍💼" label="فريق العمل" value={stats.staffActive}
          sub={`إجمالي: ${stats.staffTotal} • موقوفين: ${stats.staffTotal - stats.staffActive}`}
          color="bg-green-500/15 text-green-400" gradient="from-green-500/60 via-green-500/20 to-transparent" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <StatCard icon="🗂️" label="الأقسام" value={stats.cats} color="bg-violet-500/15 text-violet-400" gradient="from-violet-500/50 via-violet-500/15 to-transparent" />
        <StatCard icon="🏷️" label="الماركات" value={stats.brands} color="bg-pink-500/15 text-pink-400" gradient="from-pink-500/50 via-pink-500/15 to-transparent" />
      </div>

      {/* 🧾 آخر الطلبات */}
      <section>
        <h2 className="text-xl font-black mb-4">🧾 آخر الطلبات الواردة</h2>
        {recentOrders.length === 0 ? (
          <p className="text-center text-sm text-white/40 py-10 rounded-3xl border border-dashed border-white/10">
            لسه مفيش طلبات مسجلة — أول ما عميل يأكد طلب هيتسجل هنا تلقائيًا 📥
          </p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-4 rounded-2xl bg-[#101a30] border border-white/10 p-4">
                <span className="inline-grid place-items-center w-11 h-11 rounded-xl bg-orange-500/15 text-orange-400 text-lg shrink-0">🧾</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{o.customer_name} <span className="text-[10px] text-white/30 font-normal">• {fmtDate(o.created_at)}</span></p>
                  <p className="text-xs text-white/50 mt-0.5" dir="ltr">{o.customer_phone}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-orange-400">{o.total} ج.م</p>
                  <p className="text-[11px] text-white/40">{o.items_count} قطعة • {o.customer_gov}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link href="/admin/clients" className="inline-flex items-center gap-2 text-sm font-bold text-orange-400 hover:underline mt-4">عرض كل العملاء ←</Link>
      </section>
    </div>
  );
}

/* 👁️ زرار المعاينة — نفس عمل مفتاح ViewToggle بس نسخة نصية للوحة */
function PreviewToggle() {
  const { previewMode, togglePreview } = useAuth();
  return (
    <button
      onClick={togglePreview}
      className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 border ${
        previewMode
          ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30"
          : "bg-orange-500/15 border-orange-500/40 text-orange-300 hover:bg-orange-500/25"
      }`}
      title={previewMode ? "ارجع لوضع الإدارة" : "شوف الموقع بعين عميل عادي"}
    >
      {previewMode ? "👑 رجوع لوضع الإدارة" : "👁️ معاينة كعميل"}
    </button>
  );
}