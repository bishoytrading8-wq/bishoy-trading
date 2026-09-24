"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CATEGORIES, CONTACT } from "../products-data";
import { useAuth } from "../lib/AuthProvider";

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/about", label: "من نحن" },
  { href: "/contact", label: "تواصل معنا" },
];

export default function Header() {
  const pathname = usePathname();
  const { user, loading, role, openAuth, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setOpen(false); setCatsOpen(false); }, [pathname]);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const linkCls = (href: string) =>
    `px-4 py-2 rounded-lg text-sm font-bold transition ${isActive(href) ? "text-orange-400 bg-orange-500/10" : "text-white/80 hover:text-white hover:bg-white/5"}`;

  // 🏷️ شارة الدور — بتظهر جنب الإيميل
  const roleBadge =
    role?.kind === "owner" ? "👑 مالك" :
    role?.kind === "staff" ? "🧑‍💼 موظف" : null;

  return (
    <header className={`sticky top-0 z-50 border-b border-white/10 transition-all ${scrolled ? "bg-[#0b1220]/95 backdrop-blur-lg shadow-lg shadow-black/40" : "bg-[#0b1220]/70 backdrop-blur"}`}>
      {/* الشريط العلوي */}
      <div className="hidden md:flex items-center justify-between text-xs text-white/50 border-b border-white/5 px-4 lg:px-8 py-1.5 max-w-7xl mx-auto">
        <p>📞 <span dir="ltr">{CONTACT.phones.join(" - ")}</span></p>
        <p>🕗 {CONTACT.hours}</p>
      </div>

      <div className="flex items-center justify-between gap-4 px-4 lg:px-8 py-3 max-w-7xl mx-auto">
        {/* اللوجو */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <Image src="/logo.jpeg" alt="شعار شركة بيشوي للتجارة والتوريدات" width={48} height={48} className="rounded-full ring-2 ring-orange-500/70 group-hover:ring-orange-400 transition" />
          <span className="leading-tight">
            <span className="block font-extrabold text-lg">شركة بيشوي</span>
            <span className="block text-[11px] text-orange-400 font-bold">للتجارة والتوريدات</span>
          </span>
        </Link>

        {/* نافيجيشن ديسكتوب */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((l) => <Link key={l.href} href={l.href} className={linkCls(l.href)}>{l.label}</Link>)}
          <div className="relative" onMouseEnter={() => setCatsOpen(true)} onMouseLeave={() => setCatsOpen(false)}>
            <button className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold transition ${pathname.startsWith("/category") ? "text-orange-400 bg-orange-500/10" : "text-white/80 hover:text-white hover:bg-white/5"}`}>
              الأقسام <span className={`inline-block text-[10px] transition ${catsOpen ? "rotate-180" : ""}`}>▼</span>
            </button>
            {catsOpen && (
              <div className="absolute top-full right-0 pt-2 w-56">
                <div className="rounded-2xl bg-[#101a30] border border-white/10 shadow-2xl overflow-hidden p-2">
                  {CATEGORIES.map((c) => (
                    <Link key={c.slug} href={`/category/${c.slug}`} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${pathname === `/category/${c.slug}` ? "text-orange-400 bg-orange-500/10" : "text-white/80 hover:bg-white/5"}`}>
                      <span className="text-lg">{c.emoji}</span> {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* الدخول — ديسكتوب */}
        <div className="hidden lg:flex items-center gap-2">
          {loading ? <span className="w-24 h-9 rounded-lg bg-white/5 animate-pulse" />
            : user ? (<>
              {/* ⚙️ زرار الإدارة — بيظهر للمالك والموظفين بس */}
              {role && role.kind !== "customer" && (
                <Link href="/admin" className="px-4 py-2 rounded-lg bg-orange-500/15 border border-orange-500/40 text-orange-300 hover:bg-orange-500/25 text-sm font-bold transition">
                  ⚙️ الإدارة
                </Link>
              )}
              <span className="text-xs text-white/60 max-w-[140px] truncate" dir="ltr">{user.email}</span>
              {roleBadge && (
                <span className="text-[10px] font-bold text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-full px-2.5 py-1">{roleBadge}</span>
              )}
              <button onClick={signOut} className="px-4 py-2 rounded-lg border border-white/15 hover:bg-white/5 text-sm font-bold transition">خروج</button>
            </>) : (<>
              <button onClick={() => openAuth("register")} className="px-4 py-2 rounded-lg border border-orange-500/50 text-orange-400 hover:bg-orange-500/10 text-sm font-bold transition">حساب جديد</button>
              <button onClick={() => openAuth("login")} className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-sm font-extrabold transition">دخول</button>
            </>)}
        </div>

        {/* زرار الموبايل ☰ */}
        <button onClick={() => setOpen(!open)} aria-label="القائمة" className="lg:hidden w-10 h-10 grid place-items-center rounded-lg border border-white/10 bg-white/5">
          <div className="space-y-1.5">
            <span className={`block w-5 h-0.5 bg-white transition ${open ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition ${open ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition ${open ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button>
      </div>

      {/* قايمة الموبايل */}
      {open && (
        <div className="lg:hidden border-t border-white/10 bg-[#0b1220]/95 backdrop-blur-lg px-4 py-4 max-h-[70vh] overflow-y-auto">
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} className={`block px-4 py-3 rounded-xl font-bold transition ${isActive(l.href) ? "text-orange-400 bg-orange-500/10" : "text-white/80 hover:bg-white/5"}`}>{l.label}</Link>
          ))}
          <p className="text-xs text-white/40 font-bold pt-4 pb-1 px-4">الأقسام</p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition ${pathname === `/category/${c.slug}` ? "text-orange-400 bg-orange-500/10" : "text-white/80 bg-white/5 hover:bg-white/10"}`}>
                <span>{c.emoji}</span> {c.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 border-t border-white/10 mt-4 space-y-2">
            {loading ? null : user ? (<>
              {role && role.kind !== "customer" && (
                <Link href="/admin" className="block text-center bg-orange-500/15 border border-orange-500/40 text-orange-300 rounded-lg py-2.5 font-bold text-sm">⚙️ لوحة التحكم</Link>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-white/60 truncate" dir="ltr">{user.email} {roleBadge && `• ${roleBadge}`}</span>
                <button onClick={signOut} className="text-sm border border-white/15 rounded-lg px-4 py-2 font-bold shrink-0">خروج</button>
              </div>
            </>) : (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => openAuth("login")} className="bg-orange-500 rounded-lg py-2.5 font-bold text-sm">دخول</button>
                <button onClick={() => openAuth("register")} className="border border-orange-500/50 text-orange-400 rounded-lg py-2.5 font-bold text-sm">حساب جديد</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}