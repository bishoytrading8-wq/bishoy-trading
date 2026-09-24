"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthProvider";
import AdminNav from "../../components/AdminNav";
import { getSettings, saveSettings, type SiteSettings } from "../../lib/settings";

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-orange-500/70 transition";
const labelCls = "text-xs font-extrabold text-white/70 mb-1.5 block";
const fieldCls = "flex items-start gap-3 rounded-2xl bg-white/[0.03] border border-white/10 p-4";

export default function SettingsPage() {
  const { role, loading } = useAuth();
  const isOwner = role?.kind === "owner";

  const [form, setForm] = useState<SiteSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setForm(await getSettings());
  }, []);

  useEffect(() => { if (isOwner) load(); }, [isOwner, load]);

  const save = async () => {
    if (!form) return;
    setMsg("");
    if (!form.landline.trim() || !form.mobile.trim()) return setMsg("التليفونات مطلوبة");
    if (!/^20\d{10,13}$/.test(form.whatsapp.trim())) return setMsg("الواتساب لازم بصيغة دولية: 20 + الرقم من غير الصفر — مثال: 201220847856");
    if (!form.address.trim()) return setMsg("اكتب العنوان");
    setBusy(true);
    const err = await saveSettings(form);
    setBusy(false);
    if (err) return setMsg("فشل الحفظ: " + err);
    setMsg("✓ تم حفظ الإعدادات — ظهرت في الموقع فورًا 🎉");
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20"><div className="h-40 rounded-3xl bg-white/5 animate-pulse" /></div>;

  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <span className="text-6xl">🔒</span>
        <h1 className="text-2xl font-black mt-4">الإعدادات للمالك بس 👑</h1>
      </div>
    );
  }

  if (!form) return null;

  const set = (k: keyof SiteSettings, v: string) => setForm({ ...form, [k]: v });

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-10">
      <AdminNav />
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-black">⚙️ الإعدادات</h1>
          <p className="text-white/50 text-sm mt-1">تليفونات، عنوان، خريطة، وسائل التواصل — كل حاجة من هنا ومن غير كود</p>
        </div>
        <span className="text-[10px] font-bold text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-full px-2.5 py-1">👑 مالك</span>
      </div>

      {msg && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-bold mb-6 ${msg.startsWith("✓") ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>{msg}</div>
      )}

      {/* ☎️ التليفونات */}
      <div className="rounded-3xl bg-[#101a30] border border-white/10 p-6 space-y-4 mb-6">
        <h2 className="font-black">☎️ التليفونات والمواعيد</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className={fieldCls}>
            <div className="flex-1">
              <label className={labelCls}>تليفون أرضي</label>
              <input dir="ltr" className={inputCls} value={form.landline} onChange={(e) => set("landline", e.target.value)} />
            </div>
          </div>
          <div className={fieldCls}>
            <div className="flex-1">
              <label className={labelCls}>تليفون محمول</label>
              <input dir="ltr" className={inputCls} value={form.mobile} onChange={(e) => set("mobile", e.target.value)} />
            </div>
          </div>
          <div className={fieldCls}>
            <div className="flex-1">
              <label className={labelCls}>واتساب (دولي — 20 + رقم)</label>
              <input dir="ltr" className={inputCls} placeholder="201220847856" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>
        </div>
        <div>
          <label className={labelCls}>مواعيد العمل</label>
          <input className={inputCls} value={form.hours} onChange={(e) => set("hours", e.target.value)} />
        </div>
      </div>

      {/* 📍 العنوان والخريطة */}
      <div className="rounded-3xl bg-[#101a30] border border-white/10 p-6 space-y-4 mb-6">
        <h2 className="font-black">📍 العنوان والخريطة</h2>
        <div>
          <label className={labelCls}>العنوان</label>
          <input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>رابط الموقع على جوجل مابس (يفتح للعميل علطول)</label>
          <div className="flex gap-2">
            <input dir="ltr" className={inputCls} placeholder="https://maps.app.goo.gl/..." value={form.maps_url} onChange={(e) => set("maps_url", e.target.value)} />
            <a href={form.maps_url || "#"} target="_blank" className="shrink-0 grid place-items-center rounded-xl border border-white/15 hover:bg-white/5 px-4 text-sm font-bold transition">👁️ جرّبه</a>
          </div>
          <p className="text-[11px] text-white/40 mt-1.5">💡 افتح جوجل مابس → دوّر على عنوانك → Share → انسخ اللينك والصقه هنا</p>
        </div>
        <div>
          <label className={labelCls}>رابط الموقع (يتحدث لما نشتري الدومين)</label>
          <input dir="ltr" className={inputCls} value={form.website} onChange={(e) => set("website", e.target.value)} />
        </div>
      </div>

      {/* 🌐 وسائل التواصل */}
      <div className="rounded-3xl bg-[#101a30] border border-white/10 p-6 space-y-4 mb-6">
        <h2 className="font-black">🌐 وسائل التواصل</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>فيسبوك</label>
            <input dir="ltr" className={inputCls} placeholder="https://facebook.com/..." value={form.facebook} onChange={(e) => set("facebook", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>تلجرام (لما تجهز)</label>
            <input dir="ltr" className={inputCls} placeholder="https://t.me/..." value={form.telegram} onChange={(e) => set("telegram", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>انستجرام (لما تجهز)</label>
            <input dir="ltr" className={inputCls} placeholder="https://instagram.com/..." value={form.instagram} onChange={(e) => set("instagram", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>لينكد إن (لما تجهز)</label>
            <input dir="ltr" className={inputCls} placeholder="https://linkedin.com/..." value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} />
          </div>
        </div>
        <p className="text-[11px] text-white/40">💡 السيبة فاضية = الأيقونة مش بتظهر في الموقع خالص — املاها وقت ما تجهز وهتظهر لوحدها</p>
      </div>

      <button onClick={save} disabled={busy} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-400 disabled:opacity-60 rounded-xl px-10 py-3.5 font-extrabold transition">
        {busy ? "جاري الحفظ..." : "💾 حفظ الإعدادات"}
      </button>
    </div>
  );
}