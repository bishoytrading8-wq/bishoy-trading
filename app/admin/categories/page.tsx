"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/AuthProvider";
import AdminNav from "../../components/AdminNav";
import { getCategories, type DbCategory } from "../../lib/catalog";

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-orange-500/70 transition";

type FormState = {
  slug: string;
  name: string;
  emoji: string;
  tagline: string;
  sort_order: string;
  image: string;
};

const emptyForm: FormState = { slug: "", name: "", emoji: "📦", tagline: "", sort_order: "0", image: "" };

export default function CategoriesAdminPage() {
  const { role, loading } = useAuth();
  const canManage = !!role?.perms.manageProducts;

  const [cats, setCats] = useState<DbCategory[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  // إضافة قسم جديد
  const [showAdd, setShowAdd] = useState(false);
  const [add, setAdd] = useState<FormState>(emptyForm);

  // تعديل قسم
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState<FormState>(emptyForm);
  const [editOrigSlug, setEditOrigSlug] = useState("");

  const load = useCallback(async () => {
    if (!canManage) return;
    setCats(await getCategories(false)); // الكل — حتى المقعّدة
  }, [canManage]);

  useEffect(() => { load(); }, [load]);

  // 🖼️ رفع صورة القسم
  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `cat-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    setUploading(false);
    if (error) { setMsg("فشل رفع الصورة — جرّب تاني"); return null; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const slugOk = (s: string) => /^[a-z0-9-]+$/.test(s);

  const addCategory = async () => {
    setMsg("");
    if (!add.name.trim()) return setMsg("اكتب اسم القسم");
    if (!slugOk(add.slug.trim())) return setMsg("الرابط (slug): حروف إنجليزية صغيرة وأرقام وشرطات بس — مثال: kitchen-extractors");
    setBusy(true);
    const { error } = await supabase.from("categories").insert({
      slug: add.slug.trim(),
      name: add.name.trim(),
      emoji: add.emoji || "📦",
      tagline: add.tagline.trim(),
      sort_order: Number(add.sort_order) || 0,
      image: add.image,
    });
    setBusy(false);
    if (error) return setMsg(error.message.includes("duplicate") ? "الرابط ده مستخدم لقسم تاني — اختار slug مختلف" : "فشل الإضافة — جرّب تاني");
    setMsg("✓ اتضاف القسم — ظهر في الموقع فورًا 🎉");
    setAdd(emptyForm);
    setShowAdd(false);
    load();
  };

  const startEdit = (c: DbCategory) => {
    setEditId(c.id);
    setEditOrigSlug(c.slug);
    setEdit({ slug: c.slug, name: c.name, emoji: c.emoji ?? "📦", tagline: c.tagline ?? "", sort_order: String(c.sort_order ?? 0), image: c.image ?? "" });
    setMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveEdit = async () => {
    if (!editId) return;
    setMsg("");
    if (!edit.name.trim()) return setMsg("اكتب اسم القسم");
    if (!slugOk(edit.slug.trim())) return setMsg("الرابط: حروف إنجليزية صغيرة وأرقام وشرطات بس");
    setBusy(true);
    const { error } = await supabase.from("categories").update({
      slug: edit.slug.trim(),
      name: edit.name.trim(),
      emoji: edit.emoji || "📦",
      tagline: edit.tagline.trim(),
      sort_order: Number(edit.sort_order) || 0,
      image: edit.image,
    }).eq("id", editId);
    // لو الرابط اتغير — منتجات القسم بتتنقل معاه تلقائيًا
    if (!error && edit.slug.trim() !== editOrigSlug) {
      await supabase.from("products").update({ category_slug: edit.slug.trim() }).eq("category_slug", editOrigSlug);
    }
    setBusy(false);
    if (error) return setMsg("فشل الحفظ: " + error.message);
    setMsg("✓ تم تحديث القسم" + (edit.slug.trim() !== editOrigSlug ? " — ومنتجاته اتنقلت للرابط الجديد تلقائيًا ✅" : ""));
    setEditId(null);
    load();
  };

  const toggleActive = async (c: DbCategory) => {
    await supabase.from("categories").update({ is_active: !c.is_active }).eq("id", c.id);
    load();
  };

  const removeCategory = async (c: DbCategory) => {
    if (!confirm(`امسح قسم "${c.name}"؟ ⚠️ المنتجات اللي فيه هتفضل في قاعدة البيانات بس مش هتظهر في قسم — انقلها لقسم تاني الأول`)) return;
    await supabase.from("categories").delete().eq("id", c.id);
    setEditId(null);
    load();
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20"><div className="h-40 rounded-3xl bg-white/5 animate-pulse" /></div>;

  if (!canManage) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <span className="text-6xl">🔒</span>
        <h1 className="text-2xl font-black mt-4">الأقسام لفريق الإدارة بس</h1>
      </div>
    );
  }

  // 🖼️ حقل الصور (مكرر في الفورمين)
  const ImageField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div>
      <label className="text-xs font-extrabold text-white/70 mb-1.5 block">صورة القسم (اختياري — لو فاضية هيظهر الإيموجي)</label>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10 grid place-items-center">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="صورة القسم" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">🖼️</span>
          )}
        </div>
        <label className="flex-1 rounded-xl border-2 border-dashed border-white/15 hover:border-orange-500/50 hover:bg-orange-500/5 transition px-4 py-3 text-center text-xs font-bold cursor-pointer">
          {uploading ? "جاري الرفع..." : "اضغط واختار صورة"}
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) {
              const url = await uploadImage(f);
              if (url) onChange(url);
            }
            e.currentTarget.value = "";
          }} />
        </label>
        {value && (
          <button onClick={() => onChange("")} className="shrink-0 text-xs font-bold text-red-400 hover:text-red-300" aria-label="إزالة الصورة">✕</button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-10">
      <AdminNav />
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-black">🗂️ الأقسام</h1>
          <p className="text-white/50 text-sm mt-1">اسم، صورة، إيموجي، وصف، ترتيب — كل حاجة بتتحكم فيها من هنا</p>
        </div>
        <button onClick={() => { setShowAdd(!showAdd); setMsg(""); }} className="bg-orange-500 hover:bg-orange-400 rounded-xl px-6 py-2.5 font-bold text-sm transition">
          {showAdd ? "✕ إلغاء" : "＋ قسم جديد"}
        </button>
      </div>

      {msg && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-bold mb-6 ${msg.startsWith("✓") ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>{msg}</div>
      )}

      {/* فورم الإضافة */}
      {showAdd && (
        <div className="rounded-3xl bg-[#101a30] border border-white/10 p-6 space-y-4 mb-8">
          <h2 className="font-black">➕ قسم جديد</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-white/70 mb-1.5 block">اسم القسم *</label>
              <input className={inputCls} placeholder="مثال: سخانات مياه" value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-extrabold text-white/70 mb-1.5 block">الرابط slug * (إنجليزي — ثابت)</label>
              <input dir="ltr" className={inputCls} placeholder="water-heaters" value={add.slug} onChange={(e) => setAdd({ ...add, slug: e.target.value.toLowerCase() })} />
            </div>
            <div>
              <label className="text-xs font-extrabold text-white/70 mb-1.5 block">الإيموجي</label>
              <input className={inputCls} placeholder="🔥" value={add.emoji} onChange={(e) => setAdd({ ...add, emoji: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-extrabold text-white/70 mb-1.5 block">ترتيب الظهور (1 = الأول)</label>
              <input className={inputCls} inputMode="numeric" value={add.sort_order} onChange={(e) => setAdd({ ...add, sort_order: e.target.value.replace(/\D/g, "") })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-extrabold text-white/70 mb-1.5 block">وصف القسم (يظهر تحت الاسم في الكارت)</label>
            <input className={inputCls} placeholder="أفضل الأسعار والجودة المضمونة" value={add.tagline} onChange={(e) => setAdd({ ...add, tagline: e.target.value })} />
          </div>
          <ImageField value={add.image} onChange={(v) => setAdd({ ...add, image: v })} />
          <button onClick={addCategory} disabled={busy} className="bg-orange-500 hover:bg-orange-400 disabled:opacity-60 rounded-xl px-8 py-3 font-extrabold transition">
            {busy ? "جاري الحفظ..." : "＋ إضافة القسم"}
          </button>
        </div>
      )}

      {/* القائمة */}
      <div className="space-y-3">
        {cats.map((c) => {
          const editing = editId === c.id;
          return (
            <div key={c.id} className="rounded-2xl bg-[#101a30] border border-white/10 p-4">
              {editing ? (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-orange-400">⚙️ تعديل القسم: {c.name}</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-extrabold text-white/70 mb-1.5 block">اسم القسم</label>
                      <input className={inputCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-white/70 mb-1.5 block">الرابط slug (تغييره بينقل منتجاته تلقائيًا)</label>
                      <input dir="ltr" className={inputCls} value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value.toLowerCase() })} />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-white/70 mb-1.5 block">الإيموجي</label>
                      <input className={inputCls} value={edit.emoji} onChange={(e) => setEdit({ ...edit, emoji: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-white/70 mb-1.5 block">ترتيب الظهور</label>
                      <input className={inputCls} inputMode="numeric" value={edit.sort_order} onChange={(e) => setEdit({ ...edit, sort_order: e.target.value.replace(/\D/g, "") })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-white/70 mb-1.5 block">وصف القسم</label>
                    <input className={inputCls} value={edit.tagline} onChange={(e) => setEdit({ ...edit, tagline: e.target.value })} />
                  </div>
                  <ImageField value={edit.image} onChange={(v) => setEdit({ ...edit, image: v })} />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={busy} className="bg-green-500/20 border border-green-500/40 text-green-300 rounded-lg px-6 py-2.5 text-sm font-bold transition">💾 حفظ التعديل</button>
                    <button onClick={() => setEditId(null)} className="border border-white/15 hover:bg-white/5 rounded-lg px-6 py-2.5 text-sm font-bold transition">إلغاء</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 flex-wrap">
                  {/* الصورة أو الإيموجي */}
                  <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10 grid place-items-center">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{c.emoji}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold">
                      {c.name}{" "}
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${c.is_active ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"}`}>
                        {c.is_active ? "ظاهر" : "مخفي"}
                      </span>
                    </p>
                    <p className="text-xs text-white/40 mt-0.5" dir="ltr">/{c.slug}</p>
                    <p className="text-xs text-white/50 mt-1">{c.tagline || "بدون وصف"} • ترتيب: {c.sort_order}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    <button onClick={() => startEdit(c)} className="text-xs font-bold border border-white/15 hover:bg-white/5 rounded-lg px-4 py-2 transition">⚙️ تعديل</button>
                    <button onClick={() => toggleActive(c)} className={`text-xs font-bold rounded-lg px-4 py-2 border transition ${c.is_active ? "border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10" : "border-green-500/40 text-green-400 hover:bg-green-500/10"}`}>
                      {c.is_active ? "👁️ إخفاء" : "✨ إظهار"}
                    </button>
                    <button onClick={() => removeCategory(c)} className="text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg px-4 py-2 transition">🗑️ حذف</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {cats.length === 0 && (
          <p className="text-center text-sm text-white/40 py-10 rounded-2xl border border-dashed border-white/10">
            مفيش أقسام — لو ده غلط، اتأكد إنك نفذت الـ SQL بتاع جدول الأقسام
          </p>
        )}
      </div>
    </div>
  );
}