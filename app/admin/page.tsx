"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthProvider";
import { getBrands, priceInfo, getCategories, type DbBrand, type DbProduct, type DbCategory } from "../lib/catalog";
import AdminNav from "../components/AdminNav";
import { exportCSV } from "../lib/export-csv";
import { compressImage } from "../lib/imageTools";

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-orange-500/70 transition";
const labelCls = "text-xs font-extrabold text-white/70 mb-1.5 block";

type Spec = { k: string; v: string };

const DRAFT_KEY = "bishoy-product-draft";

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
  const [sku, setSku] = useState("");
  const [stockStatus, setStockStatus] = useState("available");
  const [stockQty, setStockQty] = useState("");
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [specKey, setSpecKey] = useState("");
  const [specVal, setSpecVal] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);

  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrand, setNewBrand] = useState("");

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [restoreBanner, setRestoreBanner] = useState(false);

  // ✅ تحديد جماعي
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkPct, setBulkPct] = useState("");
  const [bulkBrand, setBulkBrand] = useState("");

  const hasAnyDiscount = discountPercent.trim() !== "" || discountAmount.trim() !== "";

  const loadBrands = useCallback(async () => setBrands(await getBrands()), []);

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

  // 💾 حفظ مسودة تلقائي في المتصفح — لو الصفحة اتقفت مش هتضيع
  useEffect(() => {
    if (editingId) return;
    if (!name.trim() && !price && !description.trim() && images.length === 0) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, price, discountPercent, discountAmount, discountFrom, discountTo, description, features, brandId, categorySlug, images, sizes, colors, sku, stockStatus, stockQty, specs }));
      } catch {}
    }, 1500);
    return () => clearTimeout(t);
  }, [name, price, discountPercent, discountAmount, discountFrom, discountTo, description, features, brandId, categorySlug, images, sizes, colors, sku, stockStatus, stockQty, specs, editingId]);

  useEffect(() => {
    try {
      const d = localStorage.getItem(DRAFT_KEY);
      if (d) {
        const parsed = JSON.parse(d);
        if (parsed.name || parsed.images?.length) setRestoreBanner(true);
      }
    } catch {}
  }, []);

  const restoreDraft = () => {
    try {
      const d = localStorage.getItem(DRAFT_KEY);
      if (!d) return;
      const p = JSON.parse(d);
      setName(p.name ?? ""); setPrice(p.price ?? ""); setDiscountPercent(p.discountPercent ?? "");
      setDiscountAmount(p.discountAmount ?? ""); setDiscountFrom(p.discountFrom ?? ""); setDiscountTo(p.discountTo ?? "");
      setDescription(p.description ?? ""); setFeatures(p.features ?? []); setBrandId(p.brandId ?? "");
      setCategorySlug(p.categorySlug ?? ""); setImages(p.images ?? []);
      setSizes(p.sizes ?? []); setColors(p.colors ?? []);
      setSku(p.sku ?? ""); setStockStatus(p.stockStatus ?? "available"); setStockQty(p.stockQty ?? "");
      setSpecs(p.specs ?? []);
      setMsg("✓ تم استرجاع المسودة المحفوظة");
    } catch {}
    setRestoreBanner(false);
  };

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setRestoreBanner(false);
  };

  // 🖼️ رفع مع ضغط تلقائي
  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setMsg("");
    for (const file of Array.from(files)) {
      const compressed = await compressImage(file);
      const ext = "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, compressed);
      if (!error) {
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        setImages((prev) => [...prev, data.publicUrl]);
      } else {
        setMsg("فشل رفع صورة — جرّب تاني");
      }
    }
    setUploading(false);
  };

  // 🖱️ سحب وإفلات لترتيب الصور
  const reorderImages = (from: number, to: number) => {
    setImages((prev) => {
      const arr = [...prev];
      const [m] = arr.splice(from, 1);
      arr.splice(to, 0, m);
      return arr;
    });
  };

  const addBrand = async () => {
    const n = newBrand.trim();
    if (!n) return;
    const { error } = await supabase.from("brands").insert({ name: n });
    if (error) { setMsg(error.message.includes("duplicate") ? "الماركة موجودة بالفعل" : "خطأ في إضافة الماركة"); return; }
    const { data } = await supabase.from("brands").select("*").eq("name", n).single();
    await loadBrands();
    setBrandId(data.id);
    setNewBrand("");
    setShowNewBrand(false);
  };

  const removeBrand = async (id: string) => {
    if (!confirm("امسح الماركة؟")) return;
    await supabase.from("brands").delete().eq("id", id);
    if (brandId === id) setBrandId("");
    loadBrands();
  };

  // 💾 الحفظ — publish أو مسودة — بيرجع id المنتج
  const saveProduct = async (asDraft: boolean, silent = false): Promise<string | null> => {
    if (!silent) setMsg("");
    if (!name.trim()) { if (!silent) setMsg("✍️ اكتب اسم المنتج"); return null; }
    const priceN = Number(price);
    if (!priceN || priceN <= 0) { if (!silent) setMsg("💰 اكتب سعر صحيح"); return null; }
    if (!categorySlug) { if (!silent) setMsg("🗂️ اختر القسم"); return null; }

    const pct = discountPercent.trim() ? Number(discountPercent) : null;
    const amt = discountAmount.trim() ? Number(discountAmount) : null;

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
      sku: sku.trim() || null,
      stock_status: stockStatus,
      stock_qty: stockQty ? Number(stockQty) : 0,
      specs,
      is_draft: asDraft,
    };

    const res = editingId
      ? await supabase.from("products").update(payload).eq("id", editingId).select("id").single()
      : await supabase.from("products").insert(payload).select("id").single();
    setBusy(false);

    if (res.error) {
      if (!silent) setMsg("فشل الحفظ — تأكد من صلاحياتك");
      return null;
    }

    const id = res.data?.id ?? editingId ?? null;

    if (!silent) {
      if (asDraft) {
        setMsg("✓ تم الحفظ كمسودة — مش هيظهر في الموقع لحد ما تنشره");
        if (id) setEditingId(id);
        setIsDraft(true);
      } else {
        setMsg(editingId ? "✓ تم تعديل المنتج — ظهر في الموقع" : "✓ تم نشر المنتج — ظهر في الموقع فورًا 🎉");
        localStorage.removeItem(DRAFT_KEY);
      }
    }
    loadItems();
    return id;
  };

  const publish = async () => {
    const ok = await saveProduct(false);
    if (ok && !editingId) {
      // 🔄 حفظ القسم والماركة بعد النشر — لإضافة المنتج اللي بعده بسرعة
      resetFormKeepContext();
    }
  };

  const saveDraft = async () => {
    await saveProduct(true);
  };

  const resetFormKeepContext = () => {
    setName(""); setPrice(""); setDiscountPercent(""); setDiscountAmount("");
    setDiscountFrom(""); setDiscountTo(""); setDescription("");
    setFeatures([]); setFeatureInput(""); setImages([]);
    setSizes([]); setSizeInput(""); setColors([]); setColorInput("");
    setSku(""); setStockStatus("available"); setStockQty(""); setSpecs([]);
    setSpecKey(""); setSpecVal("");
    setEditingId(null); setIsDraft(false);
    // ✅ categorySlug و brandId بيفضلوا زي ما هم — لإضافة المشابه بسرعة
  };

  const resetForm = () => {
    resetFormKeepContext();
    setCategorySlug(cats[0]?.slug ?? "");
    setBrandId("");
  };

  const editItem = (p: DbProduct) => {
    setEditingId(p.id);
    setIsDraft(!!p.is_draft);
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
    setSku(p.sku ?? "");
    setStockStatus(p.stock_status ?? "available");
    setStockQty(p.stock_qty != null ? String(p.stock_qty) : "");
    setSpecs(p.specs ?? []);
    setSpecKey(""); setSpecVal("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 📋 نسخة من منتج — يفتح الفورم معبّى بكل حاجة كمنتج جديد
  const duplicateItem = (p: DbProduct) => {
    editItem(p);
    setEditingId(null);
    setIsDraft(false);
    setName(`${p.name} — نسخة`);
    setMsg("📋 اتنسخ محتوى المنتج — غيّر الاسم والسعر واضغط نشر");
  };

  // 👁️ معاينة قبل النشر
  const previewProduct = async () => {
    if (editingId) {
      window.open(`/product/${editingId}`, "_blank");
      return;
    }
    const id = await saveProduct(true, true); // مسودة صامتة
    if (id) window.open(`/product/${id}`, "_blank");
  };

  const deleteItem = async (p: DbProduct) => {
    if (!confirm(`حذف "${p.name}" نهائيًا؟`)) return;
    await supabase.from("products").delete().eq("id", p.id);
    loadItems();
  };

  // ✅ تعديل جماعي
  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectBrandProducts = () => {
    if (!bulkBrand) return;
    setSelected(items.filter((p) => p.brand_id === bulkBrand).map((p) => p.id));
  };

  const bulkSetDiscount = async () => {
    const pct = Number(bulkPct);
    if (!pct || pct <= 0 || pct > 100 || selected.length === 0) return;
    if (!confirm(`تطبيق خصم ${pct}% على ${selected.length} منتج؟`)) return;
    await supabase.from("products").update({ discount_percent: pct, discount_amount: null }).in("id", selected);
    setMsg(`✓ تم تطبيق خصم ${pct}% على ${selected.length} منتج`);
    setSelected([]); setBulkPct("");
    loadItems();
  };

  const bulkRemoveDiscount = async () => {
    if (selected.length === 0) return;
    await supabase.from("products").update({ discount_percent: null, discount_amount: null }).in("id", selected);
    setMsg(`✓ تم إزالة الخصم من ${selected.length} منتج`);
    setSelected([]);
    loadItems();
  };

  const bulkSetStock = async (status: string) => {
    if (selected.length === 0) return;
    await supabase.from("products").update({ stock_status: status }).in("id", selected);
    setMsg(`✓ تم تحديث حالة المخزون لـ ${selected.length} منتج`);
    setSelected([]);
    loadItems();
  };

  const bulkDelete = async () => {
    if (selected.length === 0) return;
    if (!confirm(`حذف ${selected.length} منتج نهائيًا؟!`)) return;
    await supabase.from("products").delete().in("id", selected);
    setMsg(`🗑️ تم حذف ${selected.length} منتج`);
    setSelected([]);
    loadItems();
  };

  const exportProducts = () => {
    exportCSV("products.csv",
      ["الاسم","القسم","الماركة","السعر","الخصم %","السعر النهائي","المقاسات","الألوان","SKU","المخزون","المواصفات","الوصف","مميزات","حالة"],
      items.map((p) => {
        const { final, hasDiscount } = priceInfo(p);
        const cat = cats.find((c) => c.slug === p.category_slug);
        return [
          p.name, cat?.name ?? p.category_slug, p.brand?.name ?? "", p.price,
          p.discount_percent ?? "", hasDiscount ? final : "", 
          (p.sizes ?? []).join(" | "), (p.colors ?? []).join(" | "),
          p.sku ?? "", p.stock_status === "available" ? "متاح" : "غير متاح",
          (p.specs ?? []).map((s) => `${s.k}: ${s.v}`).join(" | "),
          p.description ?? "", (p.features ?? []).join(" | "),
          p.is_draft ? "مسودة" : "منشور",
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
        <div className={`rounded-xl border px-4 py-3 text-sm font-bold mb-6 animate-rise-in ${msg.startsWith("✓") ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>{msg}</div>
      )}

      {/* 💾 لافتة استرجاع المسودة */}
      {restoreBanner && (
        <div className="rounded-2xl border border-blue-500/40 bg-blue-500/10 px-5 py-4 mb-6 flex flex-wrap items-center justify-between gap-3 animate-rise-in">
          <p className="text-sm font-bold text-blue-200">💾 وجدنا مسودة محفوظة من جلسة سابقة — هل تسترجعها؟</p>
          <div className="flex gap-2">
            <button onClick={restoreDraft} className="bg-blue-500 hover:bg-blue-400 text-white rounded-lg px-4 py-2 text-xs font-bold transition">استرجاع</button>
            <button onClick={discardDraft} className="border border-white/15 hover:bg-white/5 rounded-lg px-4 py-2 text-xs font-bold transition">تجاهل</button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* ═══════════ الفورم ═══════════ */}
        <div className="lg:col-span-2 space-y-4">
          {editingId && (
            <p className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-2.5">
              ✏️ بتعديل منتج موجود — {isDraft && "⚠️ هذا منتج مسودة (غير منشور)"}
            </p>
          )}

          {/* ─── الأساسيات ─── */}
          <details open className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 text-lg">📦</span>
              <div className="flex-1">
                <h3 className="font-extrabold">الأساسيات</h3>
                <p className="text-[11px] text-white/40">الاسم والسعر والقسم</p>
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

          {/* ─── SKU والمخزون ─── */}
          <details className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 text-lg">🏷️</span>
              <div className="flex-1">
                <h3 className="font-extrabold">كود المنتج والمخزون</h3>
                <p className="text-[11px] text-white/40">{stockStatus === "available" ? "✅ متاح للبيع" : "🚫 غير متاح حاليًا"}</p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:col-span-1">
                  <label className={labelCls}>🔢 كود المنتج SKU</label>
                  <input dir="ltr" className={inputCls} placeholder="LB-BLW-008" value={sku} onChange={(e) => setSku(e.target.value)} />
                </div>
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label className={labelCls}>حالة المخزون</label>
                  <select className={inputCls} value={stockStatus} onChange={(e) => setStockStatus(e.target.value)}>
                    <option value="available" className="bg-[#101a30]">✅ متاح</option>
                    <option value="unavailable" className="bg-[#101a30]">🚫 غير متاح</option>
                  </select>
                </div>
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label className={labelCls}>الكمية المتاحة</label>
                  <input className={inputCls} inputMode="numeric" placeholder="10" value={stockQty} onChange={(e) => setStockQty(e.target.value.replace(/\D/g, ""))} />
                </div>
              </div>
            </div>
          </details>

          {/* ─── المواصفات الفنية ─── */}
          <details className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 text-lg">🔧</span>
              <div className="flex-1">
                <h3 className="font-extrabold">المواصفات الفنية</h3>
                <p className="text-[11px] text-white/40">{specs.length > 0 ? `${specs.length} مواصفات` : "القدرة، السعة، الضمان، بلد المنشأ..."}</p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <input className={inputCls} placeholder="الخاصية — مثال: القدرة" value={specKey} onChange={(e) => setSpecKey(e.target.value)} />
                <input className={inputCls} placeholder="القيمة — مثال: 120 وات" value={specVal} onChange={(e) => setSpecVal(e.target.value)} />
                <button onClick={() => { if (specKey.trim() && specVal.trim()) { setSpecs([...specs, { k: specKey.trim(), v: specVal.trim() }]); setSpecKey(""); setSpecVal(""); } }} className="shrink-0 w-11 rounded-xl bg-orange-500 hover:bg-orange-400 font-black text-lg transition">＋</button>
              </div>
              {specs.length > 0 && (
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  {specs.map((s, i) => (
                    <div key={s.k + i} className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0 bg-white/[0.02]">
                      <p className="text-xs text-white/70"><span className="font-bold text-white/90">{s.k}:</span> {s.v}</p>
                      <button onClick={() => setSpecs(specs.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-xs font-black">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-white/30">💡 اقتراحات: القدرة • السعة • الضمان • بلد المنشأ • المادة • استهلاك الكهرباء</p>
            </div>
          </details>

          {/* ─── الوصف والمميزات ─── */}
          <details className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 text-lg">📝</span>
              <div className="flex-1">
                <h3 className="font-extrabold">الوصف والمميزات</h3>
                <p className="text-[11px] text-white/40">لماذا يشتري العميل منك؟</p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <label className={labelCls}>📄 الوصف</label>
                <textarea className={inputCls + " min-h-24 resize-none"} placeholder="وصف مختصر وجاذب..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <label className={labelCls}>✅ المميزات</label>
                <div className="flex gap-2">
                  <input className={inputCls} placeholder="ميزة واحدة ثم Enter" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && featureInput.trim()) { e.preventDefault(); setFeatures([...features, featureInput.trim()]); setFeatureInput(""); } }} />
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

          {/* ─── الخصم ─── */}
          <details className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-red-500/15 text-red-400 text-lg">🔥</span>
              <div className="flex-1">
                <h3 className="font-extrabold">عرض وخصم</h3>
                <p className="text-[11px] text-white/40">{hasAnyDiscount ? "🔥 خصم نشط" : "اختياري — خانة واحدة فقط"}</p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label className={labelCls}>نسبة %</label>
                  <input className={inputCls} inputMode="numeric" placeholder="15" value={discountPercent} onChange={(e) => { setDiscountPercent(e.target.value.replace(/[^\d.]/g, "")); setDiscountAmount(""); }} />
                </div>
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label className={labelCls}>مبلغ ج.م</label>
                  <input className={inputCls} inputMode="numeric" placeholder="200" value={discountAmount} onChange={(e) => { setDiscountAmount(e.target.value.replace(/[^\d.]/g, "")); setDiscountPercent(""); }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label className={labelCls}>📅 من</label>
                  <input type="date" dir="ltr" className={inputCls} value={discountFrom} onChange={(e) => setDiscountFrom(e.target.value)} />
                </div>
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label className={labelCls}>📅 إلى</label>
                  <input type="date" dir="ltr" className={inputCls} value={discountTo} onChange={(e) => setDiscountTo(e.target.value)} />
                </div>
              </div>
            </div>
          </details>

          {/* ─── الخيارات ─── */}
          <details className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 text-lg">🎨</span>
              <div className="flex-1">
                <h3 className="font-extrabold">الخيارات المتاحة</h3>
                <p className="text-[11px] text-white/40">{sizes.length + colors.length > 0 ? `${sizes.length} مقاسات • ${colors.length} ألوان` : "مقاسات وألوان"}</p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <label className={labelCls}>📏 المقاسات</label>
                <div className="flex gap-2">
                  <input className={inputCls} placeholder="مثال: 8 بوصة — Enter" value={sizeInput} onChange={(e) => setSizeInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && sizeInput.trim()) { e.preventDefault(); if (!sizes.includes(sizeInput.trim())) setSizes([...sizes, sizeInput.trim()]); setSizeInput(""); } }} />
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
                  <input className={inputCls} placeholder="مثال: فضي — Enter" value={colorInput} onChange={(e) => setColorInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && colorInput.trim()) { e.preventDefault(); if (!colors.includes(colorInput.trim())) setColors([...colors, colorInput.trim()]); setColorInput(""); } }} />
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

          {/* ─── الصور والماركة ─── */}
          <details open className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 text-lg">🖼️</span>
              <div className="flex-1">
                <h3 className="font-extrabold">الصور والماركة</h3>
                <p className="text-[11px] text-white/40">{images.length > 0 ? `📷 ${images.length} صورة — اسحب لترتيبها` : "اسحب الصور هنا أو اضغط للاختيار"}</p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <label className="block rounded-2xl border-2 border-dashed border-white/15 hover:border-orange-500/50 hover:bg-orange-500/5 transition p-6 text-center cursor-pointer">
                <span className="text-3xl">🖼️</span>
                <p className="text-sm font-bold mt-1">{uploading ? "جارٍ الرفع والضغط..." : "اسحب الصور هنا أو اضغط للاختيار — تُضغط تلقائيًا"}</p>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { uploadImages(e.target.files); e.currentTarget.value = ""; }} />
              </label>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((src, i) => (
                    <div
                      key={src + i}
                      draggable
                      onDragStart={() => setDragIdx(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => { if (dragIdx !== null && dragIdx !== i) reorderImages(dragIdx, i); setDragIdx(null); }}
                      className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group cursor-grab active:cursor-grabbing"
                      title="اسحب لإعادة الترتيب"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-orange-500/90 text-white text-[9px] font-black text-center py-0.5">الغلاف</span>}
                      <button onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute top-1 left-1 w-5 h-5 grid place-items-center rounded-full bg-red-500 text-white text-[10px] font-black opacity-0 group-hover:opacity-100 transition" aria-label="حذف">✕</button>
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
                    <input className={inputCls} autoFocus placeholder="اسم الماركة" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addBrand()} />
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
          <button onClick={publish} disabled={busy || uploading} className="w-full bg-orange-500 hover:bg-orange-400 active:scale-[0.98] disabled:opacity-60 rounded-2xl py-5 font-black text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-2xl shadow-orange-500/40">
            {busy && <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
            {busy ? "جارٍ الحفظ..." : editingId ? (isDraft ? "🚀 نشر المنتج الآن" : "💾 حفظ التعديلات") : "🚀 نشر المنتج على الموقع"}
          </button>

          <button onClick={saveDraft} disabled={busy || uploading} className="w-full bg-[#101a30] hover:bg-white/5 border border-white/15 rounded-2xl py-3.5 font-bold text-sm transition flex items-center justify-center gap-2">
            💾 حفظ كمسودة (لا يظهر في الموقع)
          </button>

          <button onClick={previewProduct} disabled={busy || uploading || (!name.trim() && images.length === 0)} className="w-full bg-blue-500/15 border border-blue-500/40 text-blue-300 hover:bg-blue-500/25 disabled:opacity-50 rounded-2xl py-3.5 font-bold text-sm transition flex items-center justify-center gap-2">
            👁️ معاينة كعميل
          </button>

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
        </div>
      </div>

      {/* ═══════════ قائمة المنتجات + التعديل الجماعي ═══════════ */}
      <section className="mt-10">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-xl font-black">📦 منتجاتك في الموقع ({items.length})</h2>
          {items.length > 0 && (
            <button onClick={exportProducts} className="text-xs font-bold border border-white/15 hover:bg-white/5 rounded-xl px-4 py-2.5 transition">📥 تصدير Excel</button>
          )}
        </div>

        {/* ✅ شريط التعديل الجماعي */}
        {selected.length > 0 && (
          <div className="sticky top-20 z-30 rounded-2xl border border-orange-500/40 bg-[#101a30] p-4 mb-4 animate-rise-in shadow-2xl shadow-orange-500/10">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-black text-orange-400">✅ محدد: {selected.length}</span>
              <div className="flex items-center gap-1.5">
                <input value={bulkPct} onChange={(e) => setBulkPct(e.target.value.replace(/[^\d.]/g, ""))} placeholder="خصم %" className="w-20 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-orange-500/70" />
                <button onClick={bulkSetDiscount} className="bg-red-500 hover:bg-red-400 text-white rounded-lg px-3 py-2 text-xs font-bold transition">🔥 طبّق</button>
                <button onClick={bulkRemoveDiscount} className="border border-white/15 hover:bg-white/5 rounded-lg px-3 py-2 text-xs font-bold transition">إزالة الخصم</button>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => bulkSetStock("available")} className="bg-green-500/15 border border-green-500/40 text-green-300 rounded-lg px-3 py-2 text-xs font-bold transition hover:bg-green-500/25">✅ متاح</button>
                <button onClick={() => bulkSetStock("unavailable")} className="bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 rounded-lg px-3 py-2 text-xs font-bold transition hover:bg-yellow-500/25">🚫 غير متاح</button>
              </div>
              <select value={bulkBrand} onChange={(e) => { setBulkBrand(e.target.value); }} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs outline-none">
                <option value="">تحديد بكل الماركة...</option>
                {brands.map((b) => <option key={b.id} value={b.id} className="bg-[#101a30]">{b.name}</option>)}
              </select>
              {bulkBrand && <button onClick={selectBrandProducts} className="text-xs font-bold text-orange-400 hover:underline">تحديد كل منتجاتها</button>}
              <button onClick={bulkDelete} className="mr-auto text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg px-3 py-2 transition">🗑️ حذف المحدد</button>
              <button onClick={() => setSelected([])} className="text-white/50 hover:text-white text-xs font-bold">إلغاء التحديد</button>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {items.map((p) => {
            const { final, hasDiscount } = priceInfo(p);
            const cat = cats.find((c) => c.slug === p.category_slug);
            const isSelected = selected.includes(p.id);
            return (
              <div key={p.id} className={`flex items-center gap-3 rounded-2xl border p-3.5 transition ${isSelected ? "border-orange-500/50 bg-orange-500/5" : "bg-[#101a30] border-white/10 hover:border-orange-500/30"}`}>
                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(p.id)} className="w-4 h-4 accent-orange-500 shrink-0 cursor-pointer" />
                <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-white/5 grid place-items-center">
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{p.emoji ?? "📦"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">
                    {p.name}
                    {p.is_draft && <span className="text-[10px] rounded-full px-2 py-0.5 ml-1 bg-gray-500/20 text-gray-300 font-bold">📝 مسودة</span>}
                    {p.stock_status === "unavailable" && <span className="text-[10px] rounded-full px-2 py-0.5 ml-1 bg-red-500/15 text-red-300 font-bold">🚫 غير متاح</span>}
                  </p>
                  <p className="text-[11px] text-white/40 font-bold mt-0.5">
                    {cat?.name ?? p.category_slug} {p.brand?.name && `• 🏷️ ${p.brand.name}`} • <span className="text-orange-400">{final} ج.م</span>{hasDiscount && " 🔥"}
                    {p.sku && <span dir="ltr"> • #{p.sku}</span>}
                    {(p.sizes ?? []).length > 0 && ` • 📏 ${(p.sizes ?? []).length}`}
                  </p>
                </div>
                <button onClick={() => duplicateItem(p)} title="نسخة من المنتج" className="shrink-0 text-xs font-bold border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 rounded-lg px-3 py-2 transition">📋</button>
                <button onClick={() => editItem(p)} className="shrink-0 text-xs font-bold border border-white/15 hover:bg-white/5 rounded-lg px-4 py-2 transition">✏️ تعديل</button>
                <button onClick={() => deleteItem(p)} className="shrink-0 text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg px-4 py-2 transition">🗑️</button>
              </div>
            );
          })}
          {items.length === 0 && (
            <p className="text-center text-sm text-white/40 py-10 rounded-2xl border border-dashed border-white/10">لا توجد منتجات بعد — ابدأ من النموذج أعلاه 👆</p>
          )}
        </div>
      </section>
    </div>
  );
}