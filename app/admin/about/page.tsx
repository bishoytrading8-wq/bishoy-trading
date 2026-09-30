"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/AuthProvider";
import AdminNav from "../../components/AdminNav";

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-orange-500/70 transition";
const labelCls = "text-xs font-extrabold text-white/70 mb-1.5 block";

type AboutValue = { icon: string; title: string; desc: string };

export default function AboutAdminPage() {
  const { role, loading } = useAuth();
  const isOwner = role?.kind === "owner";

  const [title, setTitle] = useState("من نحن");
  const [intro, setIntro] = useState("");
  const [story, setStory] = useState("");
  const [values, setValues] = useState<AboutValue[]>([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("about_content").select("*").eq("id", 1).maybeSingle();
    if (data) {
      setTitle(data.title ?? "من نحن");
      setIntro(data.intro ?? "");
      setStory(data.story ?? "");
      setValues((data.values_json as AboutValue[]) ?? []);
      setPdfUrl(data.pdf_url ?? "");
    }
  }, []);

  useEffect(() => { if (isOwner) load(); }, [isOwner, load]);

  // 📎 رفع ملف PDF لملف الشركة
  const uploadPdf = async (file: File) => {
    setUploading(true);
    const path = `about/company-profile-${Date.now()}.pdf`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    setUploading(false);
    if (error) { setMsg("فشل رفع الملف — اتأكد إنه PDF وحجمه معقول"); return; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setPdfUrl(data.publicUrl);
    setMsg("✓ اترفع الملف — اضغط حفظ لتثبيته");
  };

  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("about_content")
      .upsert({
        id: 1,
        title: title.trim() || "من نحن",
        intro: intro.trim(),
        story: story.trim(),
        values_json: values,
        pdf_url: pdfUrl,
        updated_at: new Date().toISOString(),
      });
    setBusy(false);
    setMsg(error ? "فشل الحفظ: " + error.message : "✓ تم حفظ صفحة من نحن — ظهرت في الموقع فورًا 🎉");
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20"><div className="h-40 rounded-3xl bg-white/5 animate-pulse" /></div>;

  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <span className="text-6xl">🔒</span>
        <h1 className="text-2xl font-black mt-4">صفحة من نحن — للمالك بس 👑</h1>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-10">
      <AdminNav />

      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-black">📄 صفحة من نحن</h1>
          <p className="text-white/50 text-sm mt-1">عدّل كل كلمة وملف في الصفحة — من هنا ومن غير كود</p>
        </div>
        <span className="text-[10px] font-bold text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-full px-2.5 py-1">👑 مالك</span>
      </div>

      {msg && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-bold mb-6 ${msg.startsWith("✓") ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>{msg}</div>
      )}

      <div className="space-y-4">
        {/* العنوان والمقدمة */}
        <div className="rounded-3xl bg-[#101a30] border border-white/10 p-6 space-y-4">
          <h2 className="font-black">✏️ العنوان والمقدمة</h2>
          <div>
            <label className={labelCls}>عنوان الصفحة</label>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>جملة المقدمة (تظهر تحت العنوان)</label>
            <input className={inputCls} placeholder="قصة شركة بيشوي للتجارة والتوريدات" value={intro} onChange={(e) => setIntro(e.target.value)} />
          </div>
        </div>

        {/* القصة */}
        <div className="rounded-3xl bg-[#101a30] border border-white/10 p-6 space-y-4">
          <h2 className="font-black">📖 قصة الشركة</h2>
          <textarea className={inputCls + " min-h-40 resize-none leading-relaxed"} placeholder="اكتب قصة شركتك... البداية، الرؤية، إيه اللي بيتميزكم..." value={story} onChange={(e) => setStory(e.target.value)} />
        </div>

        {/* المميزات */}
        <div className="rounded-3xl bg-[#101a30] border border-white/10 p-6 space-y-4">
          <h2 className="font-black">✨ المميزات (حتى 4 بطاقات)</h2>
          {values.map((v, i) => (
            <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-white/60">بطاقة {i + 1}</p>
                <button onClick={() => setValues(values.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-xs font-black">✕ حذف</button>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <input className={inputCls} placeholder="أيقونة (إيموجي)" value={v.icon} onChange={(e) => { const nv = [...values]; nv[i] = { ...v, icon: e.target.value }; setValues(nv); }} />
                <input className={inputCls} placeholder="العنوان" value={v.title} onChange={(e) => { const nv = [...values]; nv[i] = { ...v, title: e.target.value }; setValues(nv); }} />
                <input className={inputCls} placeholder="الوصف القصير" value={v.desc} onChange={(e) => { const nv = [...values]; nv[i] = { ...v, desc: e.target.value }; setValues(nv); }} />
              </div>
            </div>
          ))}
          {values.length < 4 && (
            <button onClick={() => setValues([...values, { icon: "⭐", title: "", desc: "" }])} className="text-xs font-bold text-orange-400 hover:underline">＋ إضافة بطاقة</button>
          )}
        </div>

        {/* 📎 ملف الشركة PDF */}
        <div className="rounded-3xl bg-[#101a30] border border-white/10 p-6 space-y-4">
          <h2 className="font-black">📎 ملف الشركة (PDF)</h2>
          <p className="text-xs text-white/40">بيظهر كزرار "تحميل" في صفحة من نحن — ممتاز للعملاء الجملة</p>
          {pdfUrl && (
            <div className="flex items-center gap-3 text-xs text-white/60 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex-wrap">
              📎 ملف مرفوع حاليًا
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-orange-400 font-bold hover:underline">معاينة</a>
              <button onClick={() => setPdfUrl("")} className="text-red-400 font-black hover:text-red-300">✕ إزالة</button>
            </div>
          )}
          <label className="block rounded-2xl border-2 border-dashed border-white/15 hover:border-orange-500/50 hover:bg-orange-500/5 transition p-5 text-center cursor-pointer">
            <span className="text-2xl">📎</span>
            <p className="text-sm font-bold mt-1">{uploading ? "جارٍ الرفع..." : "اضغط واختار ملف PDF من جهازك"}</p>
            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPdf(f); e.currentTarget.value = ""; }} />
          </label>
        </div>

        <button onClick={save} disabled={busy} className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 rounded-xl py-4 font-black transition shadow-lg shadow-orange-500/25">
          {busy ? "جارٍ الحفظ..." : "💾 حفظ صفحة من نحن"}
        </button>
      </div>
    </div>
  );
}