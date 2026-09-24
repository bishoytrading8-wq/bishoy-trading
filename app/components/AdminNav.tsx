"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "📦 المنتجات" },
  { href: "/admin/categories", label: "🗂️ الأقسام" },
  { href: "/admin/staff", label: "🧑‍💼 الموظفين" },
  { href: "/admin/clients", label: "📇 العملاء" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="flex gap-2 flex-wrap mb-8 rounded-2xl bg-[#101a30] border border-white/10 p-2">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition ${
            pathname === l.href
              ? "bg-orange-500 text-white"
              : "text-white/70 hover:bg-white/5"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}