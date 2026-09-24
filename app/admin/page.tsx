"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthProvider";
import { getBrands, priceInfo, getCategories, type DbBrand, type DbProduct, type DbCategory } from "../lib/catalog";
import AdminNav from "../components/AdminNav";
import { exportCSV } from "../lib/export-csv";

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-orange-500/70 transition";
const labelCls = "text-xs font-extrabold text-white/70 mb-1.5 block";
const stepCls = "flex items-start gap-3 rounded-2xl bg-white/[0.03] border border-white/10 p-4";

export default function AdminPage() {
  const { user, loading, can } = useAuth();

  const [brands, setBrands] = useState<DbBrand[]>([]);
  const [cats, setCats] = useState<DbCategory[]>([]);
  const [items, setItems] = useState<DbProduct[]>([]);

  // الفورم — الـ 10 حقول
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountFrom, setDiscountFrom] = useState("");
  const [discountTo, setDiscountTo] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // إضافة ماركة جديدة
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrand, setNewBrand] = useState("");

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const loadBrands = useCallback(async () => {
    setBrands(await getBrands());
  }, []);

  const loadItems = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("*, brand:brands(id,name)")
      .order("created_at", { ascending: false });
    setItems((data as DbProduct[]) ?? []);
  }, []);

  useEffect(() => {
    if (can("manageProducts")) {
      loadBrands();
      loadItems();
      getCategories().then((list) => {
        setCats(list);
        setCategorySlug((prev) => prev || list[0]?.slug || "");
      });
    }
  }, [can, loadBrands, loadItems]);

  // 🖼️ رفع الصور (عدد لا نهائي)
  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setMsg("");
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        setImages((prev) => [...prev, data.publicUrl]);
      } else {
        setMsg("فشل رفع صورة — اتأكد إن صلاحية إدارة المنتجات مفعّلة لحسابك");
      }
    }
    setUploading(false);
  };

  // ✨ إضافة ماركة جديدة
  const addBrand = async () => {
    const n = newBrand.trim();
    if (!n) return;
    const { error } = await supabase.from("brands").insert({ name: n });
    if (error) {
      setMsg(error.message.includes("duplicate") ? "الماركة دي موجودة بالفعل" : "حصل خطأ في إضافة الماركة");
      return;
    }
    const { data } = await supabase.from("brands").select("*").eq("name", n).single();
    await loadBrands();
    setBrandId(data.id);
    setNewBrand("");
    setShowNewBrand(false);
  };

  const removeBrand = async (id: string) => {
    if (!confirm("امسح الماركة؟ المنتجات المرتبطة هتفضل موجودة من غير ماركة")) return;
    await supabase.from("brands").delete().eq("id", id);
    if (brandId === id) setBrandId("");
    loadBrands();
  };

  // 💾 حفظ المنتج
  const save = async () => {
    setMsg("");
    if (!name.trim()) return setMsg("✍️ اكتب اسم المنتج (نقطة 1)");
    const priceN = Number(price);
    if (!priceN || priceN <= 0) return setMsg("💰 اكتب سعر صحيح أكبر من صفر (نقطة 2)");
    if (!categorySlug) return setMsg("🗂️ اختار قسم المنتج (نقطة 8)");

    const pct = discountPercent.trim() ? Number(discountPercent) : null;
    const amt = discountAmount.trim() ? Number(discountAmount) : null;
    if (pct != null && amt != null) return setMsg("خصم: املأ خانة واحدة بس — نسبة مئوية أو مبلغ ج.م (نقطة 3)");
    if (pct != null && (pct <= 0 || pct > 100)) return setMsg("نسبة الخصم لازم بين 1 و 100");
    if (amt != null && amt <= 0) return setMsg("مبلغ الخصم لازم أكبر من صفر");
    if (discountFrom && discountTo && discountFrom > discountTo) return setMsg("تاريخ بداية الخصم لازم يكون قبل نهايته (نقطة 4)");

    setBusy(true);
    const payload = {
      name: name.trim(),
      price: priceN,
      discount_percent: pct,
      discount_amount: amt,
      discount_from: discountFrom || null,
      discount_to: discountTo || null,
      description: description.trim(),
      features,
      emoji: cats.find((c) => c.slug === categorySlug)?.emoji ?? "📦",
      brand_id: brandId || null,
      category_slug: categorySlug,
      images,
    };

    const { error } = editingId
      ? await supabase.from("products").update(payload).eq("id", editingId)
      : await supabase.from("products").insert(payload);
    setBusy(false);

    if (error) {
      setMsg("فشل الحفظ — اتأكد إن صلاحية إدارة المنتجات مفعّلة لحسابك ✅");
      return;
    }
    setMsg(editingId ? "✓ تم تعديل المنتج" : "✓ تم إضافة المنتج — ظهر في الموقع فورًا 🎉");
    resetForm();
    loadItems();
  };

  const resetForm = () => {
    setName(""); setPrice(""); setDiscountPercent(""); setDiscountAmount("");
    setDiscountFrom(""); setDiscountTo(""); setDescription("");
    setFeatures([]); setFeatureInput(""); setBrandId("");
    setCategorySlug(""); setImages([]);
    setEditingId(null);
  };

  const editItem = (p: DbProduct) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(String(p.price));
    setDiscountPercent(p.discount_percent != null ? String(p.discount_percent) : "");
    setDiscountAmount(p.discount_amount != null ? String(p.discount_amount) : "");
    setDiscountFrom(p.discount_from ?? "");
    setDiscountTo(p.discount_to ?? "");
    setDescription(p.description ?? "");
    setFeatures(p.features ?? []);
    setBrandId(p.brand_id ?? "");
    setCategorySlug(p.category_slug);
    setImages(p.images ?? []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteItem = async (p: DbProduct) => {
    if (!confirm(`امسح "${p.name}" نهائيًا؟`)) return;
    await supabase.from("products").delete().eq("id", p.id);
    loadItems();
  };

  // 📥 تصدير المنتجات Excel
  const exportProducts = () => {
    exportCSV("products.csv",
      ["الاسم","القسم","الماركة","السعر","نسبة الخصم %","مبلغ الخصم","من تاريخ","إلى تاريخ","السعر النهائي","الوصف","المميزات"],
      items.map((p) => {
        const { final, hasDiscount } = priceInfo(p);
        const cat = cats.find((c) => c.slug === p.category_slug);
        return [
          p.name, cat?.name ?? p.category_slug, p.brand?.name ?? "", p.price,
          p.discount_percent ?? "", p.discount_amount ?? "",
          p.discount_from ?? "", p.discount_to ?? "",
          hasDiscount ? `${final} (بعد الخصم)` : String(final),
          p.description ?? "", (p.features ?? []).join(" | "),
        ];
      })
    );
  };

  // 🔒 الحماية
  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20"><div className="h-40 rounded-3xl bg-white/5 animate-pulse" /></div>;

  if (!user || !can("manageProducts")) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <span className="text-6xl">🔒</span>
        <h1 className="text-2xl font-black mt-4">الصفحة دي لفريق الإدارة بس</h1>
        <p className="text-white/50 text-sm mt-2">لو إنت من فريق العمل — سجّل دخول بحسابك الإداري</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      <AdminNav />

      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-black">لوحة المنتجات ⚙️</h1>
          <p className="text-white/50 text-sm mt-1">أضف منتجاتك — وكل حاجة بتظهر في الموقع فورًا</p>
        </div>
        <div className="flex items-center gap-2">
          {user.email?.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").toLowerCase() && (
            <span className="text-[10px] font-bold text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-full px-2.5 py-1">👑 مالك</span>
          )}
          <span className="text-xs text-white/40 font-bold bg-white/5 border border-white/10 rounded-full px-4 py-1.5" dir="ltr">{user.email}</span>
        </div>
      </div>

      {msg && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-bold mb-6 ${msg.startsWith("✓") ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
          {msg}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* ═══════════ الفورم ═══════════ */}
        <div className="lg:col-span-2 rounded-3xl bg-[#101a30] border border-white/10 p-6 space-y-4">
          {editingId && (
            <p className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-2.5">
              ✏️ بتحرّر منتج موجود — بعد الحفظ الفورم هينضف
            </p>
          )}

          {/* 1️⃣ 2️⃣ الاسم + السعر */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className={stepCls}>
              <span className="w-6 h-6 shrink-0 grid place-items-center rounded-full bg-orange-500/20 text-orange-400 text-xs font-black">1</span>
              <div className="flex-1">
                <label className={labelCls}>اسم المنتج</label>
                <input className={inputCls} placeholder="مثال: شفاط مطبخ 8 بوصة" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div className={stepCls}>
              <span className="w-6 h-6 shrink-0 grid place-items-center rounded-full bg-orange-500/20 text-orange-400 text-xs font-black">2</span>
              <div className="flex-1">
                <label className={labelCls}>السعر (ج.م)</label>
                <input className={inputCls} inputMode="numeric" placeholder="1650" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} />
              </div>
            </div>
          </div>

          {/* 3️⃣ 4️⃣ الخصم + التواريخ */}
          <div className={stepCls}>
            <span className="w-6 h-6 shrink-0 grid place-items-center rounded-full bg-orange-500/20 text-orange-400 text-xs font-black">3</span>
            <div className="flex-1 space-y-3">
              <label className={labelCls}>الخصم (اختياري — املأ خانة واحدة بس)</label>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} inputMode="numeric" placeholder="نسبة % — مثال: 15" value={discountPercent} onChange={(e) => { setDiscountPercent(e.target.value.replace(/[^\d.]/g, "")); setDiscountAmount(""); }} />
                <input className={inputCls} inputMode="numeric" placeholder="مبلغ ج.م — مثال: 200" value={discountAmount} onChange={(e) => { setDiscountAmount(e.target.value.replace(/[^\d.]/g, "")); setDiscountPercent(""); }} />
              </div>
              <label className={labelCls + " pt-1"}>تاريخ الخصم من — إلى (اختياري — فاضي = دائم)</label>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" dir="ltr" className={inputCls} value={discountFrom} onChange={(e) => setDiscountFrom(e.target.value)} />
                <input type="date" dir="ltr" className={inputCls} value={discountTo} onChange={(e) => setDiscountTo(e.target.value)} />
              </div>
            </div>
          </div>

          {/* 5️⃣ الوصف */}
          <div className={stepCls}>
            <span className="w-6 h-6 shrink-0 grid place-items-center rounded-full bg-orange-500/20 text-orange-400 text-xs font-black">5</span>
            <div className="flex-1">
              <label className={labelCls}>وصف المنتج</label>
              <textarea className={inputCls + " min-h-24 resize-none"} placeholder="اكتب وصف مختصر وجاذب للمنتج..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          {/* 6️⃣ المميزات */}
          <div className={stepCls}>
            <span className="w-6 h-6 shrink-0 grid place-items-center rounded-full bg-orange-500/20 text-orange-400 text-xs font-black">6</span>
            <div className="flex-1">
              <label className={labelCls}>مميزات المنتج</label>
              <div className="flex gap-2">
                <input className={inputCls} placeholder="ميزة واحدة كل مرة — مثال: موتور نحاس" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && featureInput.trim()) { e.preventDefault(); setFeatures([...features, featureInput.trim()]); setFeatureInput(""); } }} />
                <button onClick={() => { if (featureInput.trim()) { setFeatures([...features, featureInput.trim()]); setFeatureInput(""); } }} className="shrink-0 w-11 rounded-xl bg-orange-500 hover:bg-orange-400 font-black text-lg transition">＋</button>
              </div>
              {features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {features.map((f, i) => (
                    <span key={f + i} className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                      ✓ {f}
                      <button onClick={() => setFeatures(features.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 font-black" aria-label={`حذف ${f}`}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 7️⃣ 8️⃣ الماركة + القسم */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className={stepCls}>
              <span className="w-6 h-6 shrink-0 grid place-items-center rounded-full bg-orange-500/20 text-orange-400 text-xs font-black">7</span>
              <div className="flex-1">
                <label className={labelCls}>ماركة المنتج</label>
                <select className={inputCls} value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                  <option value="" className="bg-[#101a30]">بدون ماركة</option>
                  {brands.map((b) => <option key={b.id} value={b.id} className="bg-[#101a30]">{b.name}</option>)}
                </select>
                {showNewBrand ? (
                  <div className="flex gap-2 mt-2">
                    <input className={inputCls} autoFocus placeholder="اسم الماركة الجديدة" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addBrand()} />
                    <button onClick={addBrand} className="shrink-0 px-3 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400 text-sm font-black">حفظ</button>
                    <button onClick={() => { setShowNewBrand(false); setNewBrand(""); }} className="shrink-0 px-3 rounded-xl bg-white/5 text-white/50 text-sm font-black">✕</button>
                  </div>
                ) : (
                  <button onClick={() => setShowNewBrand(true)} className="text-xs font-bold text-orange-400 hover:underline mt-2">＋ إضافة ماركة جديدة</button>
                )}
              </div>
            </div>
            <div className={stepCls}>
              <span className="w-6 h-6 shrink-0 grid place-items-center rounded-full bg-orange-500/20 text-orange-400 text-xs font-black">8</span>
              <div className="flex-1">
                <label className={labelCls}>قسم المنتج</label>
                <select className={inputCls} value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)}>
                  {cats.map((c) => <option key={c.slug} value={c.slug} className="bg-[#101a30]">{c.emoji} {c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 9️⃣ الصور */}
          <div className={stepCls}>
            <span className="w-6 h-6 shrink-0 grid place-items-center rounded-full bg-orange-500/20 text-orange-400 text-xs font-black">9</span>
            <div className="flex-1">
              <label className={labelCls}>صور المنتج (عدد لا نهائي — تختار كلهم مرة واحدة)</label>
              <label className="block rounded-2xl border-2 border-dashed border-white/15 hover:border-orange-500/50 hover:bg-orange-500/5 transition p-5 text-center cursor-pointer">
                <span className="text-3xl">🖼️</span>
                <p className="text-sm font-bold mt-1">{uploading ? "جاري الرفع..." : "اضغط واختار صور المنتج"}</p>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { uploadImages(e.target.files); e.currentTarget.value = ""; }} />
              </label>
              {images.length > 0 && (
                <>
                  <p className="text-[11px] text-white/40 font-bold mt-3">📷 {images.length} {images.length === 1 ? "صورة" : "صور"} جاهزة</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {images.map((src, i) => (
                      <div key={src + i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />
                        <button onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute top-1 left-1 w-5 h-5 grid place-items-center rounded-full bg-red-500 text-white text-[10px] font-black opacity-0 group-hover:opacity-100 transition" aria-label="حذف الصورة">✕</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 🔟 المشابهة — تلقائي */}
          <div className={stepCls + " border-green-500/20 bg-green-500/[0.03]"}>
            <span className="w-6 h-6 shrink-0 grid place-items-center rounded-full bg-green-500/20 text-green-400 text-xs font-black">10</span>
            <p className="text-xs text-white/60 leading-relaxed flex-1">
              🤝 <span className="font-bold text-green-300">المنتجات المشابهة بتظهر تلقائيًا</span> في صفحة المنتج — من نفس الماركة الأول، وبعدها نفس القسم. مفيش شغل يدوي هنا ✅
            </p>
          </div>

          {/* أزرار الحفظ */}
          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={busy || uploading} className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 rounded-xl py-3.5 font-extrabold transition flex items-center justify-center gap-2">
              {busy && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {busy ? "جاري الحفظ..." : editingId ? "💾 حفظ التعديل" : "✨ إضافة المنتج للموقع"}
            </button>
            {editingId && (
              <button onClick={resetForm} className="px-6 rounded-xl border border-white/15 hover:bg-white/5 font-bold text-sm transition">إلغاء</button>
            )}
          </div>
        </div>

        {/* ═══════════ الماركات ═══════════ */}
        <div className="rounded-3xl bg-[#101a30] border border-white/10 p-6">
          <h2 className="font-black text-lg">🏷️ الماركات ({brands.length})</h2>
          <p className="text-xs text-white/40 mt-1">بتظهر في القايمة المنسدلة بتاعة الفورم</p>
          <div className="mt-4 space-y-2">
            {brands.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-2.5">
                <span className="text-sm font-bold">{b.name}</span>
                <button onClick={() => removeBrand(b.id)} className="text-red-400 hover:text-red-300 text-xs font-black" aria-label={`حذف ${b.name}`}>حذف</button>
              </div>
            ))}
            {brands.length === 0 && <p className="text-xs text-white/40 py-4 text-center">مفيش ماركات لسه</p>}
          </div>
        </div>
      </div>

      {/* ═══════════ قائمة المنتجات ═══════════ */}
      <section className="mt-10">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-xl font-black">📦 منتجاتك في الموقع ({items.length})</h2>
          {items.length > 0 && (
            <button onClick={exportProducts} className="text-xs font-bold border border-white/15 hover:bg-white/5 rounded-xl px-4 py-2.5 transition">📥 تصدير Excel</button>
          )}
        </div>
        <div className="grid gap-3">
          {items.map((p) => {
            const { final, hasDiscount } = priceInfo(p);
            const cat = cats.find((c) => c.slug === p.category_slug);
            return (
              <div key={p.id} className="flex items-center gap-4 rounded-2xl bg-[#101a30] border border-white/10 p-3.5 hover:border-orange-500/30 transition">
                <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-white/5 grid place-items-center">
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{p.emoji ?? "📦"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{p.name}</p>
                  <p className="text-[11px] text-white/40 font-bold mt-0.5">
                    {cat?.name ?? p.category_slug} {p.brand?.name && `• 🏷️ ${p.brand.name}`} • <span className="text-orange-400">{final} ج.م</span>{hasDiscount && " 🔥"}
                  </p>
                </div>
                <button onClick={() => editItem(p)} className="shrink-0 text-xs font-bold border border-white/15 hover:bg-white/5 rounded-lg px-4 py-2 transition">✏️ تعديل</button>
                <button onClick={() => deleteItem(p)} className="shrink-0 text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg px-4 py-2 transition">🗑️ حذف</button>
              </div>
            );
          })}
          {items.length === 0 && (
            <p className="text-center text-sm text-white/40 py-10 rounded-2xl border border-dashed border-white/10">لسه مفيش منتجات — ابدأ بإضافة أول منتج من الفورم فوق 👆</p>
          )}
        </div>
      </section>
    </div>
  );
}