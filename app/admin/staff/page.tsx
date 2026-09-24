"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/AuthProvider";
import AdminNav from "../../components/AdminNav";
import { exportCSV } from "../../lib/export-csv";

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-orange-500/70 transition";

type Staff = {
  email: string;
  name: string;
  can_manage_products: boolean;
  can_view_clients: boolean;
  can_add_clients: boolean;
  is_active: boolean;
  created_at: string;
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }) : "—";

export default function StaffPage() {
  const { role, loading } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [perms, setPerms] = useState({ products: true, viewClients: true, addClients: true });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [editEmail, setEditEmail] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const isOwner = role?.kind === "owner";

  const load = useCallback(async () => {
    const { data } = await supabase.from("staff_members").select("*").order("created_at");
    setStaff((data as Staff[]) ?? []);
  }, []);

  useEffect(() => { if (isOwner) load(); }, [isOwner, load]);

  const addStaff = async () => {
    setMsg("");
    const em = email.trim().toLowerCase();
    if (!em.includes("@")) return setMsg("اكتب إيميل صحيح");
    setBusy(true);
    const { error } = await supabase.from("staff_members").insert({
      email: em,
      name: name.trim(),
      can_manage_products: perms.products,
      can_view_clients: perms.viewClients,
      can_add_clients: perms.addClients,
    });
    setBusy(false);
    if (error) return setMsg(error.message.includes("duplicate") ? "الإيميل ده مضاف قبل كده — عدّل صلاحياته من الجدول تحت" : "حصل خطأ — جرّب تاني");
    setMsg(`✓ اتضاف الموظف — يقدر يسجل دخول بالموقع بإيميل ${em} وهيلاقي صلاحياته فورًا`);
    setEmail(""); setName(""); setPerms({ products: true, viewClients: true, addClients: true });
    load();
  };

  const toggle = async (s: Staff, field: keyof Staff) => {
    await supabase.from("staff_members").update({ [field]: !s[field] }).eq("email", s.email);
    load();
  };

  // 🔄 إعادة تعيين كلمة السر — اللينك بيفتح صفحة كلمة السر الجديدة
  const resetPassword = async (s: Staff) => {
    if (!confirm(`تبعت لينك تغيير كلمة السر لـ ${s.email}؟`)) return;
    const { error } = await supabase.auth.resetPasswordForEmail(s.email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) { setMsg("فشل الإرسال: " + error.message); return; }
    setMsg(`✓ اتبعت لينك تغيير كلمة السر على ${s.email} — هيفتح إيميله ويختار كلمة جديدة`);
  };

  // ⚙️ حفظ اسم الموظف بعد التعديل
  const saveName = async (s: Staff) => {
    const { error } = await supabase.from("staff_members").update({ name: editName.trim() }).eq("email", s.email);
    if (error) { setMsg("فشل التعديل: " + error.message); return; }
    setMsg("✓ تم تحديث بيانات الموظف");
    setEditEmail(null);
    load();
  };

  const removeStaff = async (s: Staff) => {
    if (!confirm(`تشيل ${s.name || s.email} من الموظفين؟`)) return;
    await supabase.from("staff_members").delete().eq("email", s.email);
    load();
  };

  // 📥 تصدير Excel
  const exportStaff = () => {
    exportCSV("staff.csv",
      ["الاسم","الإيميل","إدارة المنتجات","عرض العملاء","إضافة عملاء","الحالة","تاريخ الإضافة"],
      staff.map((s) => [
        s.name || "", s.email,
        s.can_manage_products ? "نعم" : "لا",
        s.can_view_clients ? "نعم" : "لا",
        s.can_add_clients ? "نعم" : "لا",
        s.is_active ? "نشط" : "موقوف",
        fmtDate(s.created_at),
      ])
    );
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20"><div className="h-40 rounded-3xl bg-white/5 animate-pulse" /></div>;

  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <span className="text-6xl">🔒</span>
        <h1 className="text-2xl font-black mt-4">بند الموظفين للمالك بس 👑</h1>
        <p className="text-white/50 text-sm mt-2">الصلاحيات بتتحدد من مالك الموقع فقط</p>
      </div>
    );
  }

  const permLabel = (s: Staff) => {
    const p = [];
    if (s.can_manage_products) p.push("منتجات");
    if (s.can_view_clients) p.push("عرض العملاء");
    if (s.can_add_clients) p.push("إضافة عملاء");
    return p.length ? p.join(" • ") : "بدون صلاحيات";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-10">
      <AdminNav />
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-black">🧑‍💼 الموظفين</h1>
          <p className="text-white/50 text-sm mt-1">ضيف إيميل الموظف واختار صلاحياته — هيلاقيها مستنياها أول ما يسجل دخول</p>
        </div>
        <div className="flex items-center gap-2">
          {staff.length > 0 && (
            <button onClick={exportStaff} className="text-xs font-bold border border-white/15 hover:bg-white/5 rounded-xl px-4 py-2.5 transition">📥 تصدير Excel</button>
          )}
          <span className="text-[10px] font-bold text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-full px-2.5 py-1">👑 مالك</span>
        </div>
      </div>

      {msg && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-bold mb-6 ${msg.startsWith("✓") ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>{msg}</div>
      )}

      {/* فورم الإضافة */}
      <div className="rounded-3xl bg-[#101a30] border border-white/10 p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-extrabold text-white/70 mb-1.5 block">إيميل الموظف</label>
            <input dir="ltr" className={inputCls} placeholder="employee@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-extrabold text-white/70 mb-1.5 block">اسمه (اختياري)</label>
            <input className={inputCls} placeholder="مثال: محمود" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-xs font-extrabold text-white/70 mb-2 block">الصلاحيات</label>
          <div className="flex flex-wrap gap-3">
            {([
              ["products", "📦 إدارة المنتجات"],
              ["viewClients", "👁️ عرض العملاء"],
              ["addClients", "➕ إضافة عميل يدوي"],
            ] as const).map(([key, label]) => (
              <button key={key} onClick={() => setPerms({ ...perms, [key]: !perms[key] })}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold border transition ${perms[key] ? "bg-green-500/15 border-green-500/40 text-green-300" : "bg-white/5 border-white/10 text-white/40"}`}>
                {perms[key] ? "✓ " : "✕ "}{label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={addStaff} disabled={busy} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-400 disabled:opacity-60 rounded-xl px-8 py-3 font-extrabold transition">
          {busy ? "جاري الإضافة..." : "＋ إضافة الموظف"}
        </button>
      </div>

      {/* القائمة */}
      <div className="mt-8 space-y-3">
        {staff.map((s) => {
          const editing = editEmail === s.email;
          return (
            <div key={s.email} className="rounded-2xl bg-[#101a30] border border-white/10 p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  {editing ? (
                    <div className="flex gap-2 items-center">
                      <input className={inputCls + " max-w-56"} placeholder="اسم الموظف" value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveName(s)} />
                      <button onClick={() => saveName(s)} className="shrink-0 bg-green-500/20 border border-green-500/40 text-green-300 rounded-lg px-4 py-2 text-xs font-bold transition">💾 حفظ</button>
                      <button onClick={() => setEditEmail(null)} className="shrink-0 border border-white/15 hover:bg-white/5 rounded-lg px-4 py-2 text-xs font-bold transition">إلغاء</button>
                    </div>
                  ) : (
                    <>
                      <p className="font-bold">
                        {s.name || "بدون اسم"}{" "}
                        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 mr-1 ${s.is_active ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"}`}>
                          {s.is_active ? "نشط" : "موقوف"}
                        </span>
                      </p>
                      <p className="text-xs text-white/40 mt-0.5" dir="ltr">{s.email}</p>
                      <p className="text-xs text-white/50 mt-1">{permLabel(s)} • 🗓️ {fmtDate(s.created_at)}</p>
                    </>
                  )}
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                  {!editing && (
                    <button onClick={() => { setEditEmail(s.email); setEditName(s.name); }} className="text-xs font-bold border border-white/15 hover:bg-white/5 rounded-lg px-4 py-2 transition">⚙️ تعديل</button>
                  )}
                  <button onClick={() => resetPassword(s)} className="text-xs font-bold text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 rounded-lg px-4 py-2 transition">🔄 كلمة السر</button>
                  <button onClick={() => toggle(s, "is_active")} className={`text-xs font-bold rounded-lg px-4 py-2 border transition ${s.is_active ? "border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10" : "border-green-500/40 text-green-400 hover:bg-green-500/10"}`}>
                    {s.is_active ? "⏸️ إيقاف" : "▶️ تشغيل"}
                  </button>
                  <button onClick={() => removeStaff(s)} className="text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg px-4 py-2 transition">🗑️ حذف</button>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-white/5">
                {([["can_manage_products", "منتجات"], ["can_view_clients", "عرض العملاء"], ["can_add_clients", "إضافة عملاء"]] as const).map(([f, l]) => (
                  <button key={f} onClick={() => toggle(s, f)}
                    className={`text-xs font-bold rounded-full px-3 py-1.5 border transition ${s[f] ? "bg-green-500/15 border-green-500/30 text-green-300" : "bg-white/5 border-white/10 text-white/40"}`}>
                    {s[f] ? "✓" : "✕"} {l}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {staff.length === 0 && (
          <p className="text-center text-sm text-white/40 py-10 rounded-2xl border border-dashed border-white/10">لسه مفيش موظفين — ضيف أول واحد من الفورم فوق 👆</p>
        )}
      </div>
    </div>
  );
}