"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/AuthProvider";
import AdminNav from "../../components/AdminNav";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type OrderRow = {
  id: string; customer_name: string; customer_phone: string; customer_gov: string;
  customer_address: string; total: number; items_count: number; status: string;
  delivery_day: string; delivery_slot: string; created_at: string;
  items_json: { name: string; qty: number; price: number }[];
};

type ClientRow = { id: string; first_name: string | null; last_name: string | null; email: string | null; phone: string | null; governorate: string | null; created_at: string };
type ReviewRow = { id: string; name: string; stars: number; note: string; created_at: string };
type StaffRow = { email: string; name: string; is_active: boolean; created_at: string };

// ⏳ الفلاتر الزمنية
const PERIODS = [
  { key: "today", label: "النهاردة" },
  { key: "week", label: "آخر 7 أيام" },
  { key: "month", label: "الشهر الحالي" },
  { key: "lastMonth", label: "الشهر اللي فات" },
  { key: "all", label: "كل الفترات" },
] as const;

type PeriodKey = (typeof PERIODS)[number]["key"];

function periodRange(p: PeriodKey): { from: string; to: string } {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  const day = (d: Date) => d.toISOString().slice(0, 10);

  switch (p) {
    case "today":
      return { from: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate())), to: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)) };
    case "week":
      return { from: iso(new Date(Date.now() - 7 * 864e5)), to: iso(now) };
    case "month":
      return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) };
    case "lastMonth":
      return { from: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: iso(new Date(now.getFullYear(), now.getMonth(), 1)) };
    default:
      return { from: "1970-01-01", to: iso(now) };
  }
}

const TABS = [
  { key: "sales", label: "💰 المبيعات والطلبات" },
  { key: "clients", label: "👥 العملاء" },
  { key: "reviews", label: "⭐ التقييمات" },
  { key: "staff", label: "🧑‍💼 الموظفين" },
];

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }) : "—";
}
function fmtTime(d: string | null) {
  return d ? new Date(d).toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" }) : "";
}

function StatsContent() {
  const params = useSearchParams();
  const initialType = params.get("type") ?? "sales";

  const [tab, setTab] = useState(initialType);
  const [period, setPeriod] = useState<PeriodKey>("all");

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const { role } = useAuth();
  const canView = role?.kind === "owner" || !!role?.perms.viewClients;

  const load = useCallback(async () => {
    if (!canView) return;
    setLoadingData(true);
    const [o, c, r, s] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("staff_members").select("*").order("created_at", { ascending: false }),
    ]);
    setOrders((o.data as OrderRow[]) ?? []);
    setClients((c.data as ClientRow[]) ?? []);
    setReviews((r.data as ReviewRow[]) ?? []);
    setStaff((s.data as StaffRow[]) ?? []);
    setLoadingData(false);
  }, [canView]);

  useEffect(() => { load(); }, [load]);

  // 🔍 فلترة زمنية
  const { from, to } = useMemo(() => periodRange(period), [period]);
  const inPeriod = (dateStr: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr).toISOString();
    return d >= from && d < to;
  };

  const fOrders = useMemo(() => orders.filter((o) => inPeriod(o.created_at)), [orders, from, to]);
  const fClients = useMemo(() => clients.filter((c) => inPeriod(c.created_at)), [clients, from, to]);
  const fReviews = useMemo(() => reviews.filter((r) => inPeriod(r.created_at)), [reviews, from, to]);
  const fStaff = useMemo(() => staff.filter((s) => inPeriod(s.created_at)), [staff, from, to]);

  const revenue = fOrders.reduce((s, o) => s + Number(o.total), 0);
  const avgOrder = fOrders.length ? revenue / fOrders.length : 0;
  const pendingCount = fOrders.filter((o) => o.status === "new").length;

  if (!canView) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <span className="text-6xl">🔒</span>
        <h1 className="text-2xl font-black mt-4">الإحصائيات محمية</h1>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
      <AdminNav />

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-black">📊 التفاصيل الكاملة</h1>
          <p className="text-white/50 text-sm mt-1">كل الأرقام مفصلة — وفلترة زمنية على راحتك</p>
        </div>
        <Link href="/admin/analytics" className="text-sm font-bold text-orange-400 hover:underline">← رجوع للنظرة العامة</Link>
      </div>

      {/* الفلاتر الزمنية */}
      <div className="flex gap-2 flex-wrap mb-6 rounded-2xl bg-[#101a30] border border-white/10 p-2 w-fit">
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${period === p.key ? "bg-orange-500 text-white" : "text-white/70 hover:bg-white/5"}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* التبويبات */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition ${tab === t.key ? "bg-orange-500 border-orange-500 text-white" : "bg-[#101a30] border-white/10 text-white/70 hover:bg-white/5"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loadingData ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}</div>
      ) : (
        <>
          {/* ═══════════ 💰 المبيعات ═══════════ */}
          {tab === "sales" && (
            <>
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                {[
                  { icon: "💰", label: "إجمالي المبيعات", value: `${revenue} ج.م`, color: "text-green-400 bg-green-500/15" },
                  { icon: "🧾", label: "عدد الطلبات", value: fOrders.length, sub: pendingCount > 0 ? `معلقة: ${pendingCount}` : undefined, color: "text-orange-400 bg-orange-500/15" },
                  { icon: "📊", label: "متوسط قيمة الطلب", value: `${Math.round(avgOrder)} ج.م`, color: "text-blue-400 bg-blue-500/15" },
                ].map((c) => (
                  <div key={c.label} className="rounded-3xl bg-[#101a30] border border-white/10 p-5">
                    <span className={`inline-grid place-items-center w-11 h-11 rounded-xl ${c.color} text-xl mb-3`}>{c.icon}</span>
                    <p className="text-[11px] font-bold text-white/50">{c.label}</p>
                    <p className="text-2xl font-black">{c.value}</p>
                    {c.sub && <p className="text-[11px] text-white/40 mt-1">{c.sub}</p>}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {fOrders.map((o) => (
                  <details key={o.id} className="rounded-2xl bg-[#101a30] border border-white/10 p-4 group">
                    <summary className="flex items-center gap-4 cursor-pointer list-none">
                      <span className="inline-grid place-items-center w-11 h-11 rounded-xl bg-orange-500/15 text-orange-400 shrink-0">🧾</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold">{o.customer_name} <span className={`text-[10px] rounded-full px-2 py-0.5 ml-1 ${o.status === "new" ? "bg-yellow-500/15 text-yellow-300" : "bg-green-500/15 text-green-300"}`}>{o.status === "new" ? "جديد" : "منفذ"}</span></p>
                        <p className="text-xs text-white/50 mt-0.5" dir="ltr">{o.customer_phone} • {fmtDate(o.created_at)} {fmtTime(o.created_at)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-orange-400">{o.total} ج.م</p>
                        <p className="text-[11px] text-white/40">{o.items_count} قطعة</p>
                      </div>
                    </summary>
                    {/* التفاصيل — بتتفتح لما تدوس على الطلب */}
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5">
                      {(o.items_json ?? []).map((x, i) => (
                        <p key={i} className="text-xs text-white/60">• {x.name} — الكمية: {x.qty} × {x.price} = {x.qty * x.price} ج.م</p>
                      ))}
                      <div className="grid sm:grid-cols-2 gap-2 mt-3 text-xs text-white/50">
                        <p>📍 {o.customer_gov} — {o.customer_address}</p>
                        <p>📅 {o.delivery_day} — {o.delivery_slot}</p>
                      </div>
                    </div>
                  </details>
                ))}
                {fOrders.length === 0 && <p className="text-center text-sm text-white/40 py-10 rounded-3xl border border-dashed border-white/10">مفيش طلبات في الفترة المختارة</p>}
              </div>
            </>
          )}

          {/* ═══════════ 👥 العملاء ═══════════ */}
          {tab === "clients" && (
            <>
              <div className="rounded-3xl bg-[#101a30] border border-white/10 p-5 mb-6 flex items-center gap-3">
                <span className="text-2xl">👥</span>
                <p className="font-bold">{fClients.length} عميل مسجل في <span className="text-orange-400">{PERIODS.find((p) => p.key === period)?.label}</span></p>
              </div>
              <div className="space-y-3">
                {fClients.map((c) => (
                  <div key={c.id} className="flex items-center gap-4 rounded-2xl bg-[#101a30] border border-white/10 p-4">
                    <span className="inline-grid place-items-center w-11 h-11 rounded-xl bg-blue-500/15 text-blue-400 shrink-0">👤</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold">{((c.first_name || "") + " " + (c.last_name || "")).trim() || "بدون اسم"}</p>
                      <p className="text-xs text-white/40" dir="ltr">{c.email}</p>
                    </div>
                    <div className="text-right text-xs text-white/50 shrink-0">
                      {c.phone && <p dir="ltr">📞 {c.phone}</p>}
                      <p className="text-white/30 mt-0.5">{fmtDate(c.created_at)}</p>
                    </div>
                  </div>
                ))}
                {fClients.length === 0 && <p className="text-center text-sm text-white/40 py-10 rounded-3xl border border-dashed border-white/10">مفيش عملاء جداد في الفترة المختارة</p>}
              </div>
            </>
          )}

          {/* ═══════════ ⭐ التقييمات ═══════════ */}
          {tab === "reviews" && (
            <>
              <div className="rounded-3xl bg-[#101a30] border border-white/10 p-5 mb-6 flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                <p className="font-bold">{fReviews.length} تقييم — متوسط: <span className="text-yellow-400">{fReviews.length ? (fReviews.reduce((s, r) => s + r.stars, 0) / fReviews.length).toFixed(1) : 0}/5</span></p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {fReviews.map((r) => (
                  <div key={r.id} className="rounded-2xl bg-[#101a30] border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-bold">{r.name}</p>
                      <span className="text-sm text-yellow-400">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</span>
                    </div>
                    {r.note && <p className="text-xs text-white/60 mt-2">"{r.note}"</p>}
                    <p className="text-[10px] text-white/30 mt-2">{fmtDate(r.created_at)}</p>
                  </div>
                ))}
                {fReviews.length === 0 && <p className="text-center text-sm text-white/40 py-10 rounded-3xl border border-dashed border-white/10 sm:col-span-2">مفيش تقييمات في الفترة المختارة</p>}
              </div>
            </>
          )}

          {/* ═══════════ 🧑‍💼 الموظفين ═══════════ */}
          {tab === "staff" && (
            <>
              <div className="rounded-3xl bg-[#101a30] border border-white/10 p-5 mb-6 flex items-center gap-3">
                <span className="text-2xl">🧑‍💼</span>
                <p className="font-bold">{fStaff.length} موظف أُضيف في <span className="text-orange-400">{PERIODS.find((p) => p.key === period)?.label}</span></p>
              </div>
              <div className="space-y-3">
                {fStaff.map((s) => (
                  <div key={s.email} className="flex items-center gap-4 rounded-2xl bg-[#101a30] border border-white/10 p-4">
                    <span className="inline-grid place-items-center w-11 h-11 rounded-xl bg-green-500/15 text-green-400 shrink-0">🧑‍💼</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold">{s.name || "بدون اسم"} <span className={`text-[10px] rounded-full px-2 py-0.5 ${s.is_active ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"}`}>{s.is_active ? "نشط" : "موقوف"}</span></p>
                      <p className="text-xs text-white/40" dir="ltr">{s.email}</p>
                    </div>
                    <p className="text-xs text-white/30 shrink-0">{fmtDate(s.created_at)}</p>
                  </div>
                ))}
                {fStaff.length === 0 && <p className="text-center text-sm text-white/40 py-10 rounded-3xl border border-dashed border-white/10">مفيش موظفين أضيفوا في الفترة المختارة</p>}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-20"><div className="h-40 rounded-3xl bg-white/5 animate-pulse" /></div>}>
      <StatsContent />
    </Suspense>
  );
}