"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/AuthProvider";
import AdminNav from "../../components/AdminNav";
import { WHATSAPP_LINK } from "../../products-data";
import { exportCSV } from "../../lib/export-csv";

const GOVS = ["القاهرة","الجيزة","الإسكندرية","الدقهلية","الشرقية","القليوبية","كفر الشيخ","الغربية","المنوفية","البحيرة","الإسماعيلية","بورسعيد","السويس","المنيا","بني سويف","الفيوم","أسيوط","سوهاج","قنا","الأقصر","أسوان","البحر الأحمر","الوادي الجديد","مطروح","شمال سيناء","جنوب سيناء","دمياط"];

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-orange-500/70 transition";

type ProfileRow = {
  id: string; first_name: string | null; last_name: string | null;
  phone: string | null; whatsapp: string | null; governorate: string | null;
  email: string | null; created_at: string | null;
};

type ManualClient = {
  id: string; name: string; phone: string; whatsapp: string | null;
  governorate: string | null; notes: string | null; created_at: string;
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }) : "—";

export default function ClientsPage() {
  const { role, loading } = useAuth();
  const canView = !!role?.perms.viewClients;
  const canAdd = !!role?.perms.addClients;
  const isOwner = role?.kind === "owner";

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [manuals, setManuals] = useState<ManualClient[]>([]);
  const [tab, setTab] = useState<"registered" | "manual">("registered");
  const [msg, setMsg] = useState("");

  // فورم الإضافة اليدوية
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [gov, setGov] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  // التعديل
  const [editReg, setEditReg] = useState<ProfileRow | null>(null);
  const [editMan, setEditMan] = useState<ManualClient | null>(null);

  const load = useCallback(async () => {
    if (canView) {
      const p = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setProfiles((p.data as ProfileRow[]) ?? []);
      const m = await supabase.from("manual_clients").select("*").order("created_at", { ascending: false });
      setManuals((m.data as ManualClient[]) ?? []);
    }
  }, [canView]);

  useEffect(() => { load(); }, [load]);

  const addManual = async () => {
    setMsg("");
    if (!name.trim()) return setMsg("اكتب اسم العميل");
    if (!/^01[0-9]{9}$/.test(phone)) return setMsg("رقم التليفون لازم 11 رقم يبدأ بـ 01");
    setBusy(true);
    const { error } = await supabase.from("manual_clients").insert({
      name: name.trim(), phone,
      whatsapp: whatsapp || phone,
      governorate: gov, notes: notes.trim(),
    });
    setBusy(false);
    if (error) return setMsg("فشل الإضافة — اتأكد إن صلاحية إضافة العملاء مفعّلة لحسابك");
    setMsg("✓ اتضاف العميل بنجاح");
    setName(""); setPhone(""); setWhatsapp(""); setGov(""); setNotes("");
    load();
  };

  // ⚙️ حفظ تعديل عميل مسجّل
  const saveReg = async () => {
    if (!editReg) return;
    setMsg("");
    const { error } = await supabase.from("profiles").update({
      first_name: (editReg.first_name ?? "").trim(),
      last_name: (editReg.last_name ?? "").trim(),
      phone: editReg.phone ?? "",
      whatsapp: editReg.whatsapp ?? "",
      governorate: editReg.governorate ?? "",
    }).eq("id", editReg.id);
    if (error) { setMsg("فشل التعديل: " + error.message); return; }
    setMsg("✓ تم تحديث بيانات العميل");
    setEditReg(null);
    load();
  };

  // ⚙️ حفظ تعديل عميل يدوي
  const saveMan = async () => {
    if (!editMan) return;
    setMsg("");
    const { error } = await supabase.from("manual_clients").update({
      name: editMan.name.trim(),
      phone: editMan.phone,
      whatsapp: editMan.whatsapp ?? "",
      governorate: editMan.governorate ?? "",
      notes: editMan.notes ?? "",
    }).eq("id", editMan.id);
    if (error) { setMsg("فشل التعديل: " + error.message); return; }
    setMsg("✓ تم تحديث بيانات العميل");
    setEditMan(null);
    load();
  };

  // 🔄 إعادة تعيين كلمة سر عميل مسجل — لينك على إيميله
  const resetClientPassword = async (c: ProfileRow) => {
    if (!c.email) { setMsg("العميل ده مفيهوش إيميل مسجل"); return; }
    if (!confirm(`تبعت لينك تغيير كلمة السر لـ ${c.email}؟`)) return;
    const { error } = await supabase.auth.resetPasswordForEmail(c.email, { redirectTo: window.location.origin + "/reset-password" });
    if (error) { setMsg("فشل الإرسال: " + error.message); return; }
    setMsg(`✓ اتبعت لينك تغيير كلمة السر على ${c.email}`);
  };

  const deleteManual = async (c: ManualClient) => {
    if (!confirm(`تشيل "${c.name}" من العملاء؟`)) return;
    await supabase.from("manual_clients").delete().eq("id", c.id);
    load();
  };

  // 📥 التصدير
  const exportRegistered = () => {
    exportCSV("clients-registered.csv",
      ["الاسم","الإيميل","التليفون","واتساب","المحافظة","تاريخ التسجيل"],
      profiles.map((c) => [
        ((c.first_name || "") + " " + (c.last_name || "")).trim() || "بدون اسم",
        c.email ?? "", c.phone ?? "", c.whatsapp ?? "", c.governorate ?? "",
        fmtDate(c.created_at),
      ])
    );
  };

  const exportManual = () => {
    exportCSV("clients-manual.csv",
      ["الاسم","التليفون","واتساب","المحافظة","ملاحظات","تاريخ الإضافة"],
      manuals.map((c) => [
        c.name, c.phone, c.whatsapp ?? "", c.governorate ?? "", c.notes ?? "",
        fmtDate(c.created_at),
      ])
    );
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20"><div className="h-40 rounded-3xl bg-white/5 animate-pulse" /></div>;

  if (!canView && !canAdd) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <span className="text-6xl">🔒</span>
        <h1 className="text-2xl font-black mt-4">بند العملاء محمي</h1>
        <p className="text-white/50 text-sm mt-2">محتاج صلاحية "عرض العملاء" أو "إضافة عملاء"</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-10">
      <AdminNav />
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-black">📇 العملاء</h1>
          <p className="text-white/50 text-sm mt-1">كل اللي سجلوا في الموقع + اللي بتضيفهم بنفسك</p>
        </div>
        {isOwner && <span className="text-[10px] font-bold text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-full px-2.5 py-1">👑 مالك</span>}
      </div>

      {/* التبويبات */}
      {canView && (
        <div className="flex gap-2 mb-6 flex-wrap items-center">
          <div className="rounded-2xl bg-[#101a30] border border-white/10 p-2 flex gap-2">
            <button onClick={() => setTab("registered")} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition ${tab === "registered" ? "bg-orange-500" : "text-white/70 hover:bg-white/5"}`}>
              🌐 سجلوا بنفسهم ({profiles.length})
            </button>
            <button onClick={() => setTab("manual")} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition ${tab === "manual" ? "bg-orange-500" : "text-white/70 hover:bg-white/5"}`}>
              ✍️ ضفتهم يدوي ({manuals.length})
            </button>
          </div>
          {tab === "registered" && profiles.length > 0 && (
            <button onClick={exportRegistered} className="text-xs font-bold border border-white/15 hover:bg-white/5 rounded-xl px-4 py-2.5 transition">📥 تصدير Excel</button>
          )}
          {tab === "manual" && manuals.length > 0 && (
            <button onClick={exportManual} className="text-xs font-bold border border-white/15 hover:bg-white/5 rounded-xl px-4 py-2.5 transition">📥 تصدير Excel</button>
          )}
        </div>
      )}

      {msg && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-bold mb-6 ${msg.startsWith("✓") ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>{msg}</div>
      )}

      {/* فورم الإضافة اليدوية — يظهر في تبويب اليدوي بس */}
      {canAdd && tab === "manual" && (
        <div className="rounded-3xl bg-[#101a30] border border-white/10 p-6 mb-8 space-y-4">
          <h2 className="font-black">➕ إضافة عميل يدوي</h2>
          <p className="text-xs text-white/40 -mt-2">عميل اتصل فيك ومش عايز يسجل بنفسه؟ سجّل بياناته هنا</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <input className={inputCls} placeholder="اسم العميل *" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={inputCls} inputMode="numeric" placeholder="رقم التليفون (11 رقم) *" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} />
            <input className={inputCls} inputMode="numeric" placeholder="واتساب — لو مختلف (اختياري)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 11))} />
            <select className={inputCls} value={gov} onChange={(e) => setGov(e.target.value)}>
              <option value="" className="bg-[#101a30]">المحافظة (اختياري)</option>
              {GOVS.map((g) => <option key={g} value={g} className="bg-[#101a30]">{g}</option>)}
            </select>
          </div>
          <textarea className={inputCls + " min-h-20 resize-none"} placeholder="ملاحظات — طلباته، المنتج اللي مهتم بيه..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button onClick={addManual} disabled={busy} className="bg-orange-500 hover:bg-orange-400 disabled:opacity-60 rounded-xl px-8 py-3 font-extrabold transition">
            {busy ? "جاري الحفظ..." : "＋ حفظ العميل"}
          </button>
        </div>
      )}

      {/* ===== قائمة المسجلين بأنفسهم ===== */}
      {canView && tab === "registered" && (
        <div className="space-y-3">
          {profiles.map((c) => {
            const wa = c.whatsapp || c.phone;
            const editing = editReg?.id === c.id;
            return (
              <div key={c.id} className="rounded-2xl bg-[#101a30] border border-white/10 p-4">
                {editing ? (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-orange-400">⚙️ تعديل بيانات: {c.email}</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <input className={inputCls} placeholder="الاسم الأول" value={editReg.first_name ?? ""} onChange={(e) => setEditReg({ ...editReg, first_name: e.target.value })} />
                      <input className={inputCls} placeholder="اسم العيلة" value={editReg.last_name ?? ""} onChange={(e) => setEditReg({ ...editReg, last_name: e.target.value })} />
                      <input className={inputCls} inputMode="numeric" dir="ltr" placeholder="التليفون" value={editReg.phone ?? ""} onChange={(e) => setEditReg({ ...editReg, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })} />
                      <input className={inputCls} inputMode="numeric" dir="ltr" placeholder="واتساب" value={editReg.whatsapp ?? ""} onChange={(e) => setEditReg({ ...editReg, whatsapp: e.target.value.replace(/\D/g, "").slice(0, 11) })} />
                      <select className={inputCls} value={editReg.governorate ?? ""} onChange={(e) => setEditReg({ ...editReg, governorate: e.target.value })}>
                        <option value="" className="bg-[#101a30]">المحافظة</option>
                        {GOVS.map((g) => <option key={g} value={g} className="bg-[#101a30]">{g}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveReg} className="bg-green-500/20 border border-green-500/40 text-green-300 rounded-lg px-6 py-2 text-sm font-bold transition">💾 حفظ</button>
                      <button onClick={() => setEditReg(null)} className="border border-white/15 hover:bg-white/5 rounded-lg px-6 py-2 text-sm font-bold transition">إلغاء</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-bold">{((c.first_name || "") + " " + (c.last_name || "")).trim() || "بدون اسم"}</p>
                      <p className="text-xs text-white/40 mt-0.5" dir="ltr">{c.email}</p>
                      <p className="text-xs text-white/50 mt-1">
                        {c.phone && <>📞 <span dir="ltr">{c.phone}</span> • </>}
                        {c.governorate && <>📍 {c.governorate} • </>}
                        🗓️ {fmtDate(c.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      {wa && (
                        <a href={WHATSAPP_LINK(`مرحبًا ${c.first_name ?? ""} 👋`)} target="_blank" className="text-xs font-bold text-green-400 border border-green-500/30 hover:bg-green-500/10 rounded-lg px-4 py-2 transition">💬 واتساب</a>
                      )}
                      <button onClick={() => { setEditReg(c); setMsg(""); }} className="text-xs font-bold border border-white/15 hover:bg-white/5 rounded-lg px-4 py-2 transition">⚙️ تعديل</button>
                      {c.email && (
                        <button onClick={() => resetClientPassword(c)} className="text-xs font-bold text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 rounded-lg px-4 py-2 transition">🔄 كلمة السر</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {profiles.length === 0 && <p className="text-center text-sm text-white/40 py-10 rounded-2xl border border-dashed border-white/10">لسه محدش سجل — أول تسجيل هيظهر هنا تلقائيًا ✨</p>}
        </div>
      )}

      {/* ===== قائمة اليدويين ===== */}
      {canView && tab === "manual" && (
        <div className="space-y-3">
          {manuals.map((c) => {
            const editing = editMan?.id === c.id;
            return (
              <div key={c.id} className="rounded-2xl bg-[#101a30] border border-white/10 p-4">
                {editing ? (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-orange-400">⚙️ تعديل بيانات العميل</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <input className={inputCls} placeholder="الاسم" value={editMan.name} onChange={(e) => setEditMan({ ...editMan, name: e.target.value })} />
                      <input className={inputCls} inputMode="numeric" dir="ltr" placeholder="التليفون" value={editMan.phone} onChange={(e) => setEditMan({ ...editMan, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })} />
                      <input className={inputCls} inputMode="numeric" dir="ltr" placeholder="واتساب" value={editMan.whatsapp ?? ""} onChange={(e) => setEditMan({ ...editMan, whatsapp: e.target.value.replace(/\D/g, "").slice(0, 11) })} />
                      <select className={inputCls} value={editMan.governorate ?? ""} onChange={(e) => setEditMan({ ...editMan, governorate: e.target.value })}>
                        <option value="" className="bg-[#101a30]">المحافظة</option>
                        {GOVS.map((g) => <option key={g} value={g} className="bg-[#101a30]">{g}</option>)}
                      </select>
                    </div>
                    <textarea className={inputCls + " min-h-16 resize-none"} placeholder="ملاحظات" value={editMan.notes ?? ""} onChange={(e) => setEditMan({ ...editMan, notes: e.target.value })} />
                    <div className="flex gap-2">
                      <button onClick={saveMan} className="bg-green-500/20 border border-green-500/40 text-green-300 rounded-lg px-6 py-2 text-sm font-bold transition">💾 حفظ</button>
                      <button onClick={() => setEditMan(null)} className="border border-white/15 hover:bg-white/5 rounded-lg px-6 py-2 text-sm font-bold transition">إلغاء</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-bold">{c.name} <span className="text-[10px] text-white/40 font-normal">• {fmtDate(c.created_at)}</span></p>
                      <p className="text-xs text-white/50 mt-1">
                        📞 <span dir="ltr">{c.phone}</span>
                        {c.governorate && <> • 📍 {c.governorate}</>}
                      </p>
                      {c.notes && <p className="text-xs text-white/40 mt-1">📝 {c.notes}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <a href={WHATSAPP_LINK(`مرحبًا ${c.name} 👋`)} target="_blank" className="text-xs font-bold text-green-400 border border-green-500/30 hover:bg-green-500/10 rounded-lg px-4 py-2 transition">💬 واتساب</a>
                      <button onClick={() => { setEditMan(c); setMsg(""); }} className="text-xs font-bold border border-white/15 hover:bg-white/5 rounded-lg px-4 py-2 transition">⚙️ تعديل</button>
                      {isOwner && (
                        <button onClick={() => deleteManual(c)} className="text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg px-4 py-2 transition">🗑️</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {manuals.length === 0 && <p className="text-center text-sm text-white/40 py-10 rounded-2xl border border-dashed border-white/10">لسه مفيش عملاء يدويين — ضيف أول واحد من الفورم فوق 👆</p>}
        </div>
      )}
    </div>
  );
}