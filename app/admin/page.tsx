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
  const [sizes, setSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrand, setNewBrand] = useState("");

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  // 📊 مؤشر إكمال بيانات المنتج
  const hasAnyDiscount = discountPercent.trim() !== "" || discountAmount.trim() !== "";
  const completionPct = Math.round(
    ((name.trim() ? 1 : 0) +
      (price.trim() ? 1 : 0) +
      (categorySlug ? 1 : 0) +
      (description.trim() ? 1 : 0) +
      (features.length ? 1 : 0) +
      (images.length ? 1 : 0) +
      (sizes.length || colors.length ? 1 : 0) +
      (brandId ? 1 : 0)) / 8 * 100
  );

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

  const save = async () => {
    setMsg("");
    if (!name.trim()) return setMsg("✍️ اكتب اسم المنتج");
    const priceN = Number(price);
    if (!priceN || priceN <= 0) return setMsg("💰 اكتب سعر صحيح أكبر من صفر");
    if (!categorySlug) return setMsg("🗂️ اختر قسم المنتج");

    const pct = discountPercent.trim() ? Number(discountPercent) : null;
    const amt = discountAmount.trim() ? Number(discountAmount) : null;
    if (pct != null && amt != null) return setMsg("الخصم: املأ خانة واحدة فقط — نسبة أو مبلغ");
    if (pct != null && (pct <= 0 || pct > 100)) return setMsg("نسبة الخصم يجب أن تكون بين 1 و 100");
    if (amt != null && amt <= 0) return setMsg("مبلغ الخصم يجب أن يكون أكبر من صفر");
    if (discountFrom && discountTo && discountFrom > discountTo) return setMsg("تاريخ بداية الخصم يجب أن يسبق نهايته");

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
      sizes: sizes.length ? sizes : null,
      colors: colors.length ? colors : null,
    };

    const { error } = editingId
      ? await supabase.from("products").update(payload).eq("id", editingId)
      : await supabase.from("products").insert(payload);
    setBusy(false);

    if (error) {
      setMsg("فشل الحفظ — تأكد من تفعيل صلاحية إدارة المنتجات لحسابك");
      return;
    }
    setMsg(editingId ? "✓ تم تعديل المنتج بنجاح" : "✓ تم إضافة المنتج — ظهر في الموقع فورًا 🎉");
    resetForm();
    loadItems();
  };

  const resetForm = () => {
    setName(""); setPrice(""); setDiscountPercent(""); setDiscountAmount("");
    setDiscountFrom(""); setDiscountTo(""); setDescription("");
    setFeatures([]); setFeatureInput(""); setBrandId("");
    setCategorySlug(cats[0]?.slug ?? ""); setImages([]);
    setSizes([]); setSizeInput(""); setColors([]); setColorInput("");
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
    setSizes(p.sizes ?? []);
    setSizeInput("");
    setColors(p.colors ?? []);
    setColorInput("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteItem = async (p: DbProduct) => {
    if (!confirm(`هل تريد حذف "${p.name}" نهائيًا؟`)) return;
    await supabase.from("products").delete().eq("id", p.id);
    loadItems();
  };

  const exportProducts = () => {
    exportCSV("products.csv",
      ["الاسم","القسم","الماركة","السعر","نسبة الخصم %","مبلغ الخصم","من تاريخ","إلى تاريخ","السعر النهائي","المقاسات","الألوان","الوصف","المميزات"],
      items.map((p) => {
        const { final, hasDiscount } = priceInfo(p);
        const cat = cats.find((c) => c.slug === p.category_slug);
        return [
          p.name, cat?.name ?? p.category_slug, p.brand?.name ?? "", p.price,
          p.discount_percent ?? "", p.discount_amount ?? "",
          p.discount_from ?? "", p.discount_to ?? "",
          hasDiscount ? `${final} (بعد الخصم)` : String(final),
          (p.sizes ?? []).join(" | "), (p.colors ?? []).join(" | "),
          p.description ?? "", (p.features ?? []).join(" | "),
        ];
      })
    );
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20"><div className="h-40 rounded-3xl bg-white/5 animate-pulse" /></div>;

  if (!user || !can("manageProducts")) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <span className="text-6xl">🔒</span>
        <h1 className="text-2xl font-black mt-4">هذه الصفحة لفريق الإدارة فقط</h1>
        <p className="text-white/50 text-sm mt-2">إن كنت من فريق العمل — سجّل دخولك بحسابك الإداري</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      <AdminNav />

      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-black">لوحة المنتجات ⚙️</h1>
          <p className="text-white/50 text-sm mt-1">أضف منتجاتك — وكل شيء يظهر في الموقع فورًا</p>
        </div>
        <div className="flex items-center gap-2">
          {user.email?.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").toLowerCase() && (
            <span className="text-[10px] font-bold text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-full px-2.5 py-1">👑 مالك</span>
          )}
          <span className="text-xs text-white/40 font-bold bg-white/5 border border-white/10 rounded-full px-4 py-1.5" dir="ltr">{user.email}</span>
        </div>
      </div>

      {msg && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-bold mb-6 animate-rise-in ${msg.startsWith("✓") ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
          {msg}
        </div>
      )}

      {/* ═══════════ نموذج الإضافة الفاخر ═══════════ */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">

        {/* العمود الرئيسي */}
        <div className="lg:col-span-2 space-y-4">

          {/* 🎛️ هيدر النموذج: دائرة الإكمال */}
          <div className="rounded-3xl bg-[#101a30] border border-white/10 p-5">
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 44 44" className="w-14 h-14 shrink-0 -rotate-90">
                <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="4" />
                <circle
                  cx="22" cy="22" r="19" fill="none" stroke="#f97316" strokeWidth="4"
                  strokeLinecap="round" strokeDasharray="119.4"
                  className="completion-ring"
                  strokeDashoffset={119.4 - (119.4 * completionPct) / 100}
                />
                <text x="22" y="27" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="900" transform="rotate(90 22 22)">{completionPct}%</text>
              </svg>
              <div className="flex-1">
                <h2 className="font-black text-lg">
                  {editingId ? "✏️ تعديل منتج موجود" : "✨ منتج جديد"}
                </h2>
                <p className="text-xs text-white/40 mt-0.5">
                  {completionPct === 100
                    ? "🎉 البيانات مكتملة — جاهز للنشر!"
                    : "أكمل البيانات — كلما زادت، ظهر منتجك باحترافية أكبر"}
                </p>
              </div>
              {editingId && (
                <button onClick={resetForm} className="shrink-0 text-xs font-bold border border-white/15 hover:bg-white/5 rounded-lg px-4 py-2 transition">إلغاء التعديل</button>
              )}
            </div>
          </div>

          {/* ─── القسم 1: الأساسيات ─── */}
          <details open className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 text-lg">📦</span>
              <div className="flex-1">
                <h3 className="font-extrabold">الأساسيات</h3>
                <p className="text-[11px] text-white/40">الاسم والسعر والقسم — الحد الأدنى للنشر</p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <label className={labelCls}>📦 اسم المنتج</label>
                <input className={inputCls} placeholder="مثال: بلاور هواء LUFTBERG" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label className={labelCls}>💰 السعر (ج.م)</label>
                  <input className={inputCls} inputMode="numeric" placeholder="1650" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} />
                </div>
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label className={labelCls}>🗂️ القسم</label>
                  <select className={inputCls} value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)}>
                    {cats.map((c) => <option key={c.slug} value={c.slug} className="bg-[#101a30]">{c.emoji} {c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </details>

          {/* ─── القسم 2: الوصف والمميزات ─── */}
          <details className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 text-lg">📝</span>
              <div className="flex-1">
                <h3 className="font-extrabold">الوصف والمميزات</h3>
                <p className="text-[11px] text-white/40">لماذا يشتري العميل منك تحديدًا؟</p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <label className={labelCls}>📄 وصف المنتج</label>
                <textarea className={inputCls + " min-h-24 resize-none"} placeholder="وصف مختصر وجاذب — ما هو، لمن يصلح، وما يميزه..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <label className={labelCls}>✅ المميزات</label>
                <div className="flex gap-2">
                  <input className={inputCls} placeholder="ميزة واحدة كل مرة — ثم اضغط Enter" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && featureInput.trim()) { e.preventDefault(); setFeatures([...features, featureInput.trim()]); setFeatureInput(""); } }} />
                  <button onClick={() => { if (featureInput.trim()) { setFeatures([...features, featureInput.trim()]); setFeatureInput(""); } }} className="shrink-0 w-11 rounded-xl bg-orange-500 hover:bg-orange-400 font-black text-lg transition">＋</button>
                </div>
                {features.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {features.map((f, i) => (
                      <span key={f + i} className="inline-flex items-center gap-1.5 text-xs font-bold bg-orange-500/10 border border-orange-500/30 text-orange-300 rounded-full px-3 py-1.5">
                        ✓ {f}
                        <button onClick={() => setFeatures(features.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 font-black">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </details>

          {/* ─── القسم 3: الخصم ─── */}
          <details className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-red-500/15 text-red-400 text-lg">🔥</span>
              <div className="flex-1">
                <h3 className="font-extrabold">عرض وخصم</h3>
                <p className="text-[11px] text-white/40">{hasAnyDiscount ? "🔥 خصم نشط على هذا المنتج" : "اختياري — املأ خانة واحدة فقط"}</p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label className={labelCls}>نسبة مئوية %</label>
                  <input className={inputCls} inputMode="numeric" placeholder="15" value={discountPercent} onChange={(e) => { setDiscountPercent(e.target.value.replace(/[^\d.]/g, "")); setDiscountAmount(""); }} />
                </div>
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label className={labelCls}>مبلغ ج.م</label>
                  <input className={inputCls} inputMode="numeric" placeholder="200" value={discountAmount} onChange={(e) => { setDiscountAmount(e.target.value.replace(/[^\d.]/g, "")); setDiscountPercent(""); }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label className={labelCls}>📅 يبدأ من (اختياري)</label>
                  <input type="date" dir="ltr" className={inputCls} value={discountFrom} onChange={(e) => setDiscountFrom(e.target.value)} />
                </div>
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label className={labelCls}>📅 ينتهي في</label>
                  <input type="date" dir="ltr" className={inputCls} value={discountTo} onChange={(e) => setDiscountTo(e.target.value)} />
                </div>
              </div>
            </div>
          </details>

          {/* ─── القسم 4: الخيارات ─── */}
          <details className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 text-lg">🎨</span>
              <div className="flex-1">
                <h3 className="font-extrabold">الخيارات المتاحة</h3>
                <p className="text-[11px] text-white/40">{sizes.length + colors.length > 0 ? `${sizes.length} مقاسات • ${colors.length} ألوان` : "مقاسات وألوان — العميل يختار قبل الشراء"}</p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <label className={labelCls}>📏 المقاسات</label>
                <div className="flex gap-2">
                  <input className={inputCls} placeholder="مثال: 6 بوصة — ثم Enter" value={sizeInput} onChange={(e) => setSizeInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && sizeInput.trim()) { e.preventDefault(); if (!sizes.includes(sizeInput.trim())) setSizes([...sizes, sizeInput.trim()]); setSizeInput(""); } }} />
                  <button onClick={() => { if (sizeInput.trim() && !sizes.includes(sizeInput.trim())) { setSizes([...sizes, sizeInput.trim()]); setSizeInput(""); } }} className="shrink-0 w-11 rounded-xl bg-orange-500 hover:bg-orange-400 font-black text-lg transition">＋</button>
                </div>
                {sizes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {sizes.map((s, i) => (
                      <span key={s + i} className="inline-flex items-center gap-1.5 text-xs font-bold bg-violet-500/10 border border-violet-500/30 text-violet-300 rounded-full px-3 py-1.5">
                        📏 {s}
                        <button onClick={() => setSizes(sizes.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 font-black">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <label className={labelCls}>🎨 الألوان</label>
                <div className="flex gap-2">
                  <input className={inputCls} placeholder="مثال: فضي — ثم Enter" value={colorInput} onChange={(e) => setColorInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && colorInput.trim()) { e.preventDefault(); if (!colors.includes(colorInput.trim())) setColors([...colors, colorInput.trim()]); setColorInput(""); } }} />
                  <button onClick={() => { if (colorInput.trim() && !colors.includes(colorInput.trim())) { setColors([...colors, colorInput.trim()]); setColorInput(""); } }} className="shrink-0 w-11 rounded-xl bg-orange-500 hover:bg-orange-400 font-black text-lg transition">＋</button>
                </div>
                {colors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {colors.map((c, i) => (
                      <span key={c + i} className="inline-flex items-center gap-1.5 text-xs font-bold bg-pink-500/10 border border-pink-500/30 text-pink-300 rounded-full px-3 py-1.5">
                        🎨 {c}
                        <button onClick={() => setColors(colors.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 font-black">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </details>

          {/* ─── القسم 5: الصور والماركة ─── */}
          <details className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 text-lg">🖼️</span>
              <div className="flex-1">
                <h3 className="font-extrabold">الصور والماركة</h3>
                <p className="text-[11px] text-white/40">{images.length > 0 ? `📷 ${images.length} صورة مرفوعة` : "الصورة الأولى هي صورة الغلاف الأساسية"}</p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <label className="block rounded-2xl border-2 border-dashed border-white/15 hover:border-orange-500/50 hover:bg-orange-500/5 transition p-6 text-center cursor-pointer">
                <span className="text-3xl">🖼️</span>
                <p className="text-sm font-bold mt-1">{uploading ? "جارٍ الرفع..." : "اضغط لاختيار صور المنتج — عدد غير محدود"}</p>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { uploadImages(e.target.files); e.currentTarget.value = ""; }} />
              </label>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((src, i) => (
                    <div key={src + i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-orange-500/90 text-white text-[9px] font-black text-center py-0.5">الغلاف</span>}
                      <button onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute top-1 left-1 w-5 h-5 grid place-items-center rounded-full bg-red-500 text-white text-[10px] font-black opacity-0 group-hover:opacity-100 transition" aria-label="حذف الصورة">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <label className={labelCls}>🏷️ الماركة</label>
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
                  <button onClick={() => setShowNewBrand(true)} className="text-xs font-bold text-orange-400 hover:underline mt-2">＋ ماركة جديدة</button>
                )}
              </div>
            </div>
          </details>
        </div>

        {/* ═══════════ العمود الجانبي ═══════════ */}
        <div className="space-y-4 lg:sticky lg:top-24">
          {/* 💾 الحفظ */}
          <button onClick={save} disabled={busy || uploading} className="w-full bg-orange-500 hover:bg-orange-400 active:scale-[0.98] disabled:opacity-60 rounded-2xl py-5 font-black text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-2xl shadow-orange-500/40">
            {busy && <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
            {busy ? "جارٍ الحفظ..." : editingId ? "💾 حفظ التعديلات" : "🚀 نشر المنتج على الموقع"}
          </button>

          {/* 🏷️ الماركات */}
          <div className="rounded-3xl bg-[#101a30] border border-white/10 p-6">
            <h2 className="font-black text-lg">🏷️ الماركات ({brands.length})</h2>
            <div className="mt-4 space-y-2">
              {brands.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-2.5">
                  <span className="text-sm font-bold">{b.name}</span>
                  <button onClick={() => removeBrand(b.id)} className="text-red-400 hover:text-red-300 text-xs font-black">حذف</button>
                </div>
              ))}
              {brands.length === 0 && <p className="text-xs text-white/40 py-4 text-center">لا توجد ماركات بعد</p>}
            </div>
          </div>

          {/* 🤝 المشابهة التلقائية */}
          <div className="rounded-3xl border border-green-500/20 bg-green-500/[0.03] p-5">
            <p className="text-xs text-white/60 leading-relaxed">
              🤝 <span className="font-bold text-green-300">المنتجات المشابهة تلقائية</span> — تظهر من نفس الماركة أولًا ثم نفس القسم، دون أي جهد يدوي.
            </p>
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
                    {(p.sizes ?? []).length > 0 && ` • 📏 ${(p.sizes ?? []).length} مقاسات`}
                    {(p.colors ?? []).length > 0 && ` • 🎨 ${(p.colors ?? []).length} ألوان`}
                  </p>
                </div>
                <button onClick={() => editItem(p)} className="shrink-0 text-xs font-bold border border-white/15 hover:bg-white/5 rounded-lg px-4 py-2 transition">✏️ تعديل</button>
                <button onClick={() => deleteItem(p)} className="shrink-0 text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg px-4 py-2 transition">🗑️ حذف</button>
              </div>
            );
          })}
          {items.length === 0 && (
            <p className="text-center text-sm text-white/40 py-10 rounded-2xl border border-dashed border-white/10">لا توجد منتجات بعد — ابدأ بإضافة أول منتج من النموذج أعلاه 👆</p>
          )}
        </div>
      </section>
    </div>
  );
}