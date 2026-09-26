"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthProvider";

const LINKS = [
  { href: "/admin/analytics", label: "📊 الإحصائيات" },
  { href: "/admin", label: "📦 المنتجات" },
  { href: "/admin/orders", label: "🧾 الطلبات" },
  { href: "/admin/categories", label: "🗂️ الأقسام" },
  { href: "/admin/staff", label: "🧑‍💼 الموظفين" },
  { href: "/admin/clients", label: "📇 العملاء" },
  { href: "/admin/settings", label: "⚙️ الإعدادات" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const { role } = useAuth();
  const [newOrders, setNewOrders] = useState(0);

  const loadCount = useCallback(async () => {
    if (!role) return;
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");
    setNewOrders(count ?? 0);
  }, [role]);

  useEffect(() => {
    loadCount();
    const channel = supabase
      .channel("orders-count-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadCount())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadCount]);

  return (
    <div className="flex gap-2 flex-wrap mb-8 rounded-2xl bg-[#101a30] border border-white/10 p-2">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition ${
            pathname === l.href ? "bg-orange-500 text-white" : "text-white/70 hover:bg-white/5"
          }`}
        >
          {l.label}
          {l.href === "/admin/orders" && newOrders > 0 && (
            <span className="absolute -top-1.5 -left-1.5 min-w-5 h-5 px-1 grid place-items-center rounded-full bg-red-500 text-white text-[10px] font-black shadow-lg shadow-red-500/40">
              {newOrders}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}