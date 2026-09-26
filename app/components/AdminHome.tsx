"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthProvider";
import { getCategories, getCategoryCounts, type DbCategory } from "../lib/catalog";

type OrderRow = {
  id: string; customer_name: string; customer_phone: string; customer_gov: string;
  total: number; items_count: number; status: string; created_at: string;
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("ar-EG", { day: "numeric", month: "long" }) : "—";

// 📊 كرت إحصائية — بيدعم href: لو موجود الكرت كله زرار يودي للتفاصيل
function StatCard({ icon, label, value, sub, color, gradient, href }: { icon: string; label: string; value: number | string; sub?: string; color: string; gradient: string; href?: string }) {
  const inner = (
    <div className="rounded-[calc(1.5rem_-_1.5px)] bg-[#101a30] p-5 relative h-full">
      <div className="flex items-center gap-3">
        <span className={`inline-grid place-items-center w-12 h-12 rounded-2xl ${color} text-xl shrink-0`}>{icon}</span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-white/50">{label}</p>
          <p className="text-3xl font-black text-white leading-tight">{value}</p>
        </div>
      </div>
      {sub && <p className="text-[11px] text-white/40 mt-3 pt-3 border-t border-white/5">{sub}</p>}
      {href && <p className="text-[11px] font-bold text-orange-400 mt-3">عرض التفاصيل ←</p>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={`relative overflow-hidden rounded-3xl p-[1.5px] bg-gradient-to-bl ${gradient} hover:scale-[1.02] transition-transform duration-300 block`}>
        {inner}
      </Link>
    );
  }
  return (
    <div className={`relative overflow-hidden rounded-3xl p-[1.5px] bg-gradient-to-bl ${gradient}`}>
      {inner}
    </div>
  );
}

function QuickAction({ href, icon, title, desc, color }: { href: string; icon: string; title: string; desc: string; color: string }) {
  return (
    <Link href={href} className="group rounded-3xl bg-[#101a30] border border-white/10 hover:border-white/25 p-5 transition-all duration-300 hover:-translate-y-1 block">
      <span className={`inline-grid place-items-center w-12 h-12 rounded-2xl ${color} text-xl group-hover:scale-110 transition-transform`}>{icon}</span>
      <h3 className="font-extrabold mt-3">{title}</h3>
      <p className="text-xs text-white/40 mt-1">{desc}</p>
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 mt-3">افتح <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span></span>
    </Link>
  );
}

export default function AdminHome() {
  const { role } = useAuth();
  const isOwner = role?.kind === "owner";

  const [stats, setStats] = useState({
    products: 0, noImages: 0, discounted: 0,
    clients: 0, clientsToday: 0, clientsWeek: 0,
    staffActive: 0, staffTotal: 0,
    reviews: 0, reviewsAvg: 0, reviewsNew: 0,
    orders: 0, ordersToday: 0, revenue: 0, revenueToday: 0, pending: 0,
    brands: 0, cats: 0,
  });
  const [cats, setCats] = useState<DbCategory[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const load = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [productsRes, clientsRes, staffRes, reviewsRes, ordersRes, brandsRes, catsData, countsData] = await Promise.all([
      supabase.from("products").select("images, discount_percent, discount_amount, name").order("created_at", { ascending: false }),
      supabase.from("profiles").select("created_at"),
      supabase.from("staff_members").select("is_active"),
      supabase.from("reviews").select("stars, created_at"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("brands").select("id", { count: "exact", head: true }),
      getCategories(false),
      getCategoryCounts(),
    ]);

    const products = (productsRes.data ?? []) as { images: string[] | null; discount_percent: number | null; discount_amount: number | null; name: string }[];
    const clients = (clientsRes.data ?? []) as { created_at: string }[];
    const staff = (staffRes.data ?? []) as { is_active: boolean }[];
    const reviews = (reviewsRes.data ?? []) as { stars: number; created_at: string }[];
    const ordersList = (ordersRes.data ?? []) as OrderRow[];

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
      reviewsNew: reviews.filter((r) => r.created_at >= weekAgo).length,
      orders: ordersList.length,
      ordersToday: ordersList.filter((o) => o.created_at?.slice(0, 10) === today).length,
      revenue: ordersList.reduce((s, o) => s + Number(o.total), 0),
      revenueToday: ordersList.filter((o) => o.created_at?.slice(0, 10) === today).reduce((s, o) => s + Number(o.total), 0),
      pending: ordersList.filter((o) => o.status === "new").length,
      brands: brandsRes.count ?? 0,
      cats: catsData.length,
    });
    setCats(catsData);
    setCounts(countsData);
    setOrders(ordersList.slice(0, 6));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      {/* الترحيب الإداري */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black">👑 مركز <span className="text-orange-400">القيادة</span></h1>
          <p className="text-white/50 text-sm mt-2">كل حاجة في موقعك — منتجات، عملاء، طلبات، فريق، أرقام — في شاشة واحدة</p>
        </div>
        <span className="text-[10px] font-bold text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1.5">
          {isOwner ? "👑 مالك الموقع" : "🧑‍💼 من فريق الإدارة"}
        </span>
      </div>

      {/* 💰 الإحصائيات الكبرى — كل كرت بيفتح تفاصيله */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard icon="💰" label="إجمالي المبيعات" value={`${stats.revenue} ج.م`}
          sub={`النهاردة: ${stats.revenueToday} ج.م`} color="bg-green-500/15 text-green-400" gradient="from-green-500 via-green-500/40 to-transparent"
          href="/admin/stats?type=sales" />
        <StatCard icon="🧾" label="الطلبات" value={stats.orders}
          sub={`النهاردة: ${stats.ordersToday} • معلقة: ${stats.pending}`} color="bg-orange-500/15 text-orange-400" gradient="from-orange-500 via-orange-500/40 to-transparent"
          href="/admin/stats?type=sales" />
        <StatCard icon="👥" label="العملاء" value={stats.clients}
          sub={`النهاردة: ${stats.clientsToday} • آخر أسبوع: ${stats.clientsWeek}`} color="bg-blue-500/15 text-blue-400" gradient="from-blue-500 via-blue-500/40 to-transparent"
          href="/admin/stats?type=clients" />
        <StatCard icon="⭐" label="التقييمات" value={stats.reviews}
          sub={stats.reviews > 0 ? `المتوسط: ${stats.reviewsAvg.toFixed(1)}/5 • جديد: ${stats.reviewsNew}` : "لسه مفيش"} color="bg-yellow-500/15 text-yellow-400" gradient="from-yellow-500 via-yellow-500/40 to-transparent"
          href="/admin/stats?type=reviews" />
      </section>

      {/* ⚡ الإجراءات السريعة */}
      <section className="mb-8">
        <h2 className="text-lg font-black mb-4">⚡ إجراءات سريعة</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction href="/admin" icon="📦" title="إضافة منتج جديد" desc="اسم + سعر + خصم + صور + ماركة" color="bg-orange-500/15 text-orange-400" />
          <QuickAction href="/admin/clients" icon="➕" title="إضافة عميل يدوي" desc="عميل اتصل فيك — سجل بياناته" color="bg-blue-500/15 text-blue-400" />
          {isOwner && (
            <QuickAction href="/admin/staff" icon="🧑‍💼" title="إضافة موظف" desc="إيميل + اسم + تليفون + صلاحيات" color="bg-green-500/15 text-green-400" />
          )}
          <QuickAction href="/admin/categories" icon="🗂️" title="إدارة الأقسام" desc="اسم، إيموجي، صورة، ترتيب، إخفاء" color="bg-violet-500/15 text-violet-400" />
          <QuickAction href="/admin/analytics" icon="📊" title="الإحصائيات التفصيلية" desc="لوحة الأرقام الكاملة" color="bg-pink-500/15 text-pink-400" />
          {isOwner && (
            <QuickAction href="/admin/settings" icon="⚙️" title="إعدادات الموقع" desc="تليفونات، عنوان، خريطة، سوشيال" color="bg-amber-500/15 text-amber-400" />
          )}
        </div>
      </section>

      {/* 🗂️ الأقسام — عدادات حية */}
      <section className="mb-8">
        <h2 className="text-lg font-black mb-4">🗂️ أقسامك ({cats.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="group flex items-center gap-3 rounded-2xl bg-[#101a30] border border-white/10 hover:border-orange-500/40 p-4 transition">
              {c.image ? (
                <span className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                </span>
              ) : (
                <span className="text-3xl shrink-0">{c.emoji}</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold group-hover:text-orange-400 transition truncate">{c.name}</p>
                <p className="text-[11px] text-white/40">{counts[c.slug] ?? 0} منتج</p>
              </div>
              <span className="text-white/30 group-hover:text-orange-400 group-hover:-translate-x-1 transition-all">←</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 🧾 آخر الطلبات */}
      <section className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h2 className="text-lg font-black">🧾 آخر الطلبات الواردة</h2>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1">معلقة: {stats.pending}</span>
            <Link href="/admin/stats?type=sales" className="text-xs font-bold text-orange-400 hover:underline">عرض كل الطلبات ←</Link>
          </div>
        </div>
        {orders.length === 0 ? (
          <p className="text-center text-sm text-white/40 py-8 rounded-3xl border border-dashed border-white/10">لسه مفيش طلبات — أول ما عميل يأكد طلب هيظهر هنا 📥</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center gap-4 rounded-2xl bg-[#101a30] border border-white/10 p-4">
                <span className="inline-grid place-items-center w-11 h-11 rounded-xl bg-orange-500/15 text-orange-400 shrink-0">🧾</span>
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
      </section>
    </div>
  );
}