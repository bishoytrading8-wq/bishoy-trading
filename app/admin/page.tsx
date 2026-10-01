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
  const [discountSource, setDiscountSource] = useState<"pct" | "amt" | null>(null);
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
  const [sizePrices, setSizePrices] = useState<{ size: string; price: string }[]>([]);
  const [sizeSpecs, setSizeSpecs] = useState<{ size: string; specs: Spec[] }[]>([]);
  const [sizeSpecsOpen, setSizeSpecsOpen] = useState<string | null>(null);
  const [tmpSpecK, setTmpSpecK] = useState("");
  const [tmpSpecV, setTmpSpecV] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [sku, setSku] = useState("");
  const [stockStatus, setStockStatus] = useState("available");
  const [stockQty, setStockQty] = useState("");
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [specKey, setSpecKey] = useState("");
  const [specVal, setSpecVal] = useState("");
  const [editingSpecIdx, setEditingSpecIdx] = useState<number | null>(null);
  const [editSpecKey, setEditSpecKey] = useState("");
  const [editSpecVal, setEditSpecVal] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);

  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrand, setNewBrand] = useState("");

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [restoreBanner, setRestoreBanner] = useState(false);

  const [selected, setSelected] = useState<string[]>([]);
  const [bulkPct, setBulkPct] = useState("");
  const [bulkBrand, setBulkBrand] = useState("");

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const cleanNum = (v: string) => v.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");

  const basePriceN = Number(price) || 0;
  const rawPct = Number(discountPercent) || 0;
  const rawAmt = Number(discountAmount) || 0;

  // قيمة الخصم بالجنيه — بتتحسب من الحقل اللي اتكتب فيه
  const discountValueN =
    basePriceN <= 0 ? 0
    : discountSource === "pct" ? round2((basePriceN * rawPct) / 100)
    : discountSource === "amt" ? round2(rawAmt)
    : 0;

  const hasAnyDiscount = discountValueN > 0;
  const discountPctN = hasAnyDiscount ? round2((discountValueN / basePriceN) * 100) : 0;
  const discountedFinal = hasAnyDiscount ? round2(Math.max(basePriceN - discountValueN, 0)) : null;

  // 🔒 الخصم الذكي — الحقل اللي اتكتب فيه حر، والتاني محسوب ومقفول
  const pctFilled = discountSource === "pct";
  const amtFilled = discountSource === "amt";
  const percentShown = amtFilled ? (hasAnyDiscount ? String(discountPctN) : "") : discountPercent;
  const amountShown = pctFilled ? (hasAnyDiscount ? String(discountValueN) : "") : discountAmount;

  const handlePercentChange = (val: string) => {
    let clean = cleanNum(val);
    if (Number(clean) > 99) clean = "99";
    setDiscountPercent(clean);
    setDiscountAmount("");
    setDiscountSource(clean ? "pct" : null);
  };

  const handleAmountChange = (val: string) => {
    let clean = cleanNum(val);
    if (basePriceN > 0 && Number(clean) >= basePriceN) clean = String(Math.max(basePriceN - 1, 0));
    setDiscountAmount(clean);
    setDiscountPercent("");
    setDiscountSource(clean ? "amt" : null);
  };

  // 🔧 مواصفات المقاسات — كل مقاس مواصفاته الخاصة
  const specsForSize = (s: string) => sizeSpecs.find((x) => x.size === s)?.specs ?? [];

  const addSizeSpec = (s: string) => {
    if (!tmpSpecK.trim() || !tmpSpecV.trim()) return;
    const existing = sizeSpecs.find((x) => x.size === s);
    if (existing) {
      setSizeSpecs(sizeSpecs.map((x) => x.size === s ? { ...x, specs: [...x.specs, { k: tmpSpecK.trim(), v: tmpSpecV.trim() }] } : x));
    } else {
      setSizeSpecs([...sizeSpecs, { size: s, specs: [{ k: tmpSpecK.trim(), v: tmpSpecV.trim() }] }]);
    }
    setTmpSpecK(""); setTmpSpecV("");
  };

  const removeSizeSpec = (s: string, idx: number) => {
    setSizeSpecs(sizeSpecs.map((x) => x.size === s ? { ...x, specs: x.specs.filter((_, j) => j !== idx) } : x));
  };

  // 📊 مؤشر إكمال
  const completionPct = Math.round(
    ((name.trim() ? 1 : 0) +
      (price.trim() ? 1 : 0) +
      (categorySlug ? 1 : 0) +
      (description.trim() ? 1 : 0) +
      (features.length ? 1 : 0) +
      (images.length ? 1 : 0) +
      ((sizes.length || colors.length) ? 1 : 0) +
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

  // 💾 مسودة تلقائية
  useEffect(() => {
    if (editingId) return;
    if (!name.trim() && !price && !description.trim() && images.length === 0) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, price, discountPercent, discountAmount, discountFrom, discountTo, description, features, brandId, categorySlug, images, sizes, sizePrices, sizeSpecs, colors, sku, stockStatus, stockQty, specs }));
      } catch {}
    }, 1500);
    return () => clearTimeout(t);
  }, [name, price, discountPercent, discountAmount, discountFrom, discountTo, description, features, brandId, categorySlug, images, sizes, sizePrices, sizeSpecs, colors, sku, stockStatus, stockQty, specs, editingId]);

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
      setName(p.name ?? ""); setPrice(p.price ?? "");
      if (p.discountPercent) { setDiscountPercent(p.discountPercent); setDiscountAmount(""); setDiscountSource("pct"); }
      else if (p.discountAmount) { setDiscountAmount(p.discountAmount); setDiscountPercent(""); setDiscountSource("amt"); }
      else { setDiscountPercent(""); setDiscountAmount(""); setDiscountSource(null); }
      setDiscountFrom(p.discountFrom ?? ""); setDiscountTo(p.discountTo ?? "");
      setDescription(p.description ?? ""); setFeatures(p.features ?? []); setBrandId(p.brandId ?? "");
      setCategorySlug(p.categorySlug ?? ""); setImages(p.images ?? []);
      setSizes(p.sizes ?? []); setSizePrices(p.sizePrices ?? []); setSizeSpecs(p.sizeSpecs ?? []);
      setColors(p.colors ?? []);
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

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setMsg("");
    for (const file of Array.from(files)) {
      const compressed = await compressImage(file);
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
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
    if (error) {
      setMsg(error.message.includes("duplicate") ? "الماركة موجودة بالفعل" : "خطأ في إضافة الماركة");
      return;
    }
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

  const saveProduct = async (asDraft: boolean, silent = false): Promise<string | null> => {
    if (!silent) setMsg("");
    if (!name.trim()) { if (!silent) setMsg("✍️ اكتب اسم المنتج"); return null; }
    const priceN = Number(price);
    if (!priceN || priceN <= 0) { if (!silent) setMsg("💰 اكتب سعر صحيح"); return null; }
    if (!categorySlug) { if (!silent) setMsg("🗂️ اختر القسم"); return null; }

    if (discountFrom && discountTo && discountTo < discountFrom) {
      if (!silent) setMsg("📅 تاريخ انتهاء الخصم قبل تاريخ البداية");
      return null;
    }

    const pct = hasAnyDiscount ? discountPctN : null;
    const amt = hasAnyDiscount ? discountValueN : null; // قيمة الخصم بالجنيه، مش السعر النهائي

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
      size_prices: sizePrices.filter((sp) => sp.price.trim()).map((sp) => ({ size: sp.size, price: Number(sp.price) })),
      size_specs: sizeSpecs.filter((x) => x.specs.length).map((x) => ({ size: x.size, specs: x.specs })),
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
        setMsg("✓ تم الحفظ كمسودة — لن يظهر في الموقع حتى النشر");
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
    if (ok && !editingId) resetFormKeepContext();
  };

  const saveDraft = async () => {
    await saveProduct(true);
  };

  const resetFormKeepContext = () => {
    setName(""); setPrice(""); setDiscountPercent(""); setDiscountAmount("");
    setDiscountSource(null);
    setDiscountFrom(""); setDiscountTo(""); setDescription("");
    setFeatures([]); setFeatureInput(""); setImages([]);
    setSizes([]); setSizeInput(""); setSizePrices([]); setSizeSpecs([]); setSizeSpecsOpen(null);
    setTmpSpecK(""); setTmpSpecV("");
    setColors([]); setColorInput("");
    setSku(""); setStockStatus("available"); setStockQty(""); setSpecs([]);
    setSpecKey(""); setSpecVal("");
    setEditingSpecIdx(null);
    setEditingId(null); setIsDraft(false);
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
    if (p.discount_percent != null) { setDiscountPercent(String(p.discount_percent)); setDiscountAmount(""); setDiscountSource("pct"); }
    else if (p.discount_amount != null) { setDiscountAmount(String(p.discount_amount)); setDiscountPercent(""); setDiscountSource("amt"); }
    else { setDiscountPercent(""); setDiscountAmount(""); setDiscountSource(null); }
    setDiscountFrom(p.discount_from ?? "");
    setDiscountTo(p.discount_to ?? "");
    setDescription(p.description ?? "");
    setFeatures(p.features ?? []);
    setBrandId(p.brand_id ?? "");
    setCategorySlug(p.category_slug);
    setImages(p.images ?? []);
    setSizes(p.sizes ?? []);
    setSizeInput("");
    setSizePrices((p.size_prices ?? []).map((sp) => ({ size: sp.size, price: String(sp.price) })));
    setSizeSpecs(p.size_specs ?? []);
    setSizeSpecsOpen(null);
    setColors(p.colors ?? []);
    setColorInput("");
    setSku(p.sku ?? "");
    setStockStatus(p.stock_status ?? "available");
    setStockQty(p.stock_qty != null ? String(p.stock_qty) : "");
    setSpecs(p.specs ?? []);
    setSpecKey(""); setSpecVal("");
    setEditingSpecIdx(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const duplicateItem = (p: DbProduct) => {
    editItem(p);
    setEditingId(null);
    setIsDraft(false);
    setName(`${p.name} — نسخة`);
    setMsg("📋 تم نسخ محتوى المنتج — غيّر الاسم والسعر واضغط نشر");
  };

  const previewProduct = async () => {
    if (editingId) {
      window.open(`/product/${editingId}`, "_blank");
      return;
    }
    const id = await saveProduct(true, true);
    if (id) window.open(`/product/${id}`, "_blank");
  };

  const deleteItem = async (p: DbProduct) => {
    if (!confirm(`حذف "${p.name}" نهائيًا؟`)) return;
    await supabase.from("products").delete().eq("id", p.id);
    loadItems();
  };

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
      ["الاسم","القسم","الماركة","السعر الأساسي","الخصم %","السعر النهائي","المقاسات بأسعارها","مواصفات المقاسات","الألوان","SKU","المخزون","المواصفات العامة","الوصف","مميزات","حالة"],
      items.map((p) => {
        const { final, hasDiscount } = priceInfo(p);
        const cat = cats.find((c) => c.slug === p.category_slug);
        return [
          p.name, cat?.name ?? p.category_slug, p.brand?.name ?? "", p.price,
          p.discount_percent ?? "", hasDiscount ? final : "",
          (p.size_prices ?? []).length > 0
            ? (p.size_prices ?? []).map((sp) => `${sp.size}: ${sp.price} ج.م`).join(" | ")
            : "سعر موحد",
          (p.size_specs ?? []).map((ss) => `${ss.size} [${ss.specs.map((sp) => `${sp.k}=${sp.v}`).join(", ")}]`).join(" | "),
          (p.colors ?? []).join(" | "),
          p.sku ?? "", p.stock_status === "available" ? "متاح" : "غير متاح",
          (p.specs ?? []).map((s) => `${s.k}: ${s.v}`).join(" | "),
          p.description ?? "", (p.features ?? []).join(" | "),
          p.is_draft ? "مسودة" : "منشور",
        ];
      })
    );
  };

  const saveSpecEdit = () => {
    if (editingSpecIdx === null) return;
    if (!editSpecKey.trim() || !editSpecVal.trim()) return;
    const nv = [...specs];
    nv[editingSpecIdx] = { k: editSpecKey.trim(), v: editSpecVal.trim() };
    setSpecs(nv);
    setEditingSpecIdx(null);
    setEditSpecKey("");
    setEditSpecVal("");
  };

  const cancelSpecEdit = () => {
    setEditingSpecIdx(null);
    setEditSpecKey("");
    setEditSpecVal("");
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

      {restoreBanner && (
        <div className="rounded-2xl border border-blue-500/40 bg-blue-500/10 px-5 py-4 mb-6 flex flex-wrap items-center justify-between gap-3 animate-rise-in">
          <p className="text-sm font-bold text-blue-200">💾 وجدنا مسودة محفوظة — هل تسترجعها؟</p>
          <div className="flex gap-2">
            <button onClick={restoreDraft} className="bg-blue-500 hover:bg-blue-400 text-white rounded-lg px-4 py-2 text-xs font-bold transition">استرجاع</button>
            <button onClick={discardDraft} className="border border-white/15 hover:bg-white/5 rounded-lg px-4 py-2 text-xs font-bold transition">تجاهل</button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* ═══════════ الفورم ═══════════ */}
        <div className="lg:col-span-2 space-y-4">

          {/* 🎛️ مؤشر الإكمال */}
          <div className="rounded-3xl bg-[#101a30] border border-white/10 p-5">
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 44 44" className="w-14 h-14 shrink-0 -rotate-90">
                <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="4" />
                <circle cx="22" cy="22" r="19" fill="none" stroke="#f97316" strokeWidth="4" strokeLinecap="round" strokeDasharray="119.4" className="completion-ring" strokeDashoffset={119.4 - (119.4 * completionPct) / 100} />
                <text x="22" y="27" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="900" transform="rotate(90 22 22)">{completionPct}%</text>
              </svg>
              <div className="flex-1">
                <h2 className="font-black text-lg">{editingId ? "✏️ تعديل منتج موجود" : "✨ منتج جديد"}</h2>
                <p className="text-xs text-white/40 mt-0.5">
                  {completionPct === 100 ? "🎉 البيانات مكتملة — جاهز للنشر!" : "أكمل البيانات — كلما زادت ظهر منتجك باحترافية أكبر"}
                </p>
              </div>
              {editingId && <button onClick={resetForm} className="shrink-0 text-xs font-bold border border-white/15 hover:bg-white/5 rounded-lg px-4 py-2 transition">إلغاء</button>}
            </div>
          </div>

          {/* ─── الأساسيات ─── */}
          <details open className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 text-lg">📦</span>
              <div className="flex-1">
                <h3 className="font-extrabold">الأساسيات</h3>
                <p className="text-[11px] text-white/40">الاسم والسعر الأساسي والقسم</p>
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
                  <label className={labelCls}>💰 السعر الأساسي (ج.م)</label>
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

          {/* ─── 🔥 الخصم الذكي — المحسوب مقفول ─── */}
          <details open className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-red-500/15 text-red-400 text-lg">🔥</span>
              <div className="flex-1">
                <h3 className="font-extrabold">عرض وخصم</h3>
                <p className="text-[11px] text-white/40">{hasAnyDiscount ? "🔥 خصم نشط — الحقل المحسوب مقفول تلقائيًا" : "اكتب النسبة أو المبلغ — والآخر يُحسب مقفولًا"}</p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* النسبة — مقفولة لو المبلغ هو اللي اتكتب */}
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label className={labelCls}>
                    نسبة الخصم %
                    {amtFilled && <span className="text-[10px] text-orange-400 font-black mr-1">🔒 محسوبة تلقائيًا</span>}
                  </label>
                  <input
                    className={inputCls}
                    inputMode="decimal"
                    placeholder="10"
                    value={percentShown}
                    onChange={(e) => handlePercentChange(e.target.value)}
                    readOnly={amtFilled}
                    style={amtFilled ? { opacity: 0.7, cursor: "not-allowed" } : {}}
                  />
                </div>
                {/* المبلغ — مقفول لو النسبة هي اللي اتكتبت */}
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label className={labelCls}>
                    قيمة الخصم ج.م
                    {pctFilled && <span className="text-[10px] text-orange-400 font-black mr-1">🔒 محسوب تلقائيًا</span>}
                  </label>
                  <input
                    className={inputCls}
                    inputMode="decimal"
                    placeholder="165"
                    value={amountShown}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    readOnly={pctFilled}
                    style={pctFilled ? { opacity: 0.7, cursor: "not-allowed" } : {}}
                  />
                </div>
              </div>

              {/* 💰 معاينة حية */}
              {discountedFinal != null && (
                <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-4">
                  <p className="text-[11px] font-bold text-white/40 mb-2">👁️ هكذا سيظهر السعر للعميل:</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xl font-bold text-red-400 line-through decoration-2">{basePriceN} ج.م</span>
                    <span className="text-3xl font-black text-green-400">{discountedFinal} ج.م</span>
                    <span className="text-[11px] font-black text-white bg-red-500 rounded-full px-2.5 py-1">
                      وفّر {discountValueN} ج.م ({discountPctN}%)
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label className={labelCls}>📅 يبدأ من</label>
                  <input type="date" dir="ltr" className={inputCls} value={discountFrom} onChange={(e) => setDiscountFrom(e.target.value)} />
                </div>
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label className={labelCls}>📅 ينتهي في</label>
                  <input type="date" dir="ltr" className={inputCls} value={discountTo} onChange={(e) => setDiscountTo(e.target.value)} />
                </div>
              </div>
            </div>
          </details>

          {/* ─── 📏 المقاسات — سعر + مواصفات خاصة لكل مقاس ─── */}
          <details open className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 text-lg">📏</span>
              <div className="flex-1">
                <h3 className="font-extrabold">المقاسات — سعر ومواصفات خاصة لكل مقاس</h3>
                <p className="text-[11px] text-white/40">{sizes.length > 0 ? `${sizes.length} مقاسات` : "كل مقاس له سعره ومواصفاته الفنية الخاصة — والعميل يشوف مواصفات مقاسه بس"}</p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-3">
              {sizes.map((s, i) => {
                const sp = sizePrices.find((x) => x.size === s);
                const specsOf = specsForSize(s);
                const isOpen = sizeSpecsOpen === s;
                return (
                  <div key={s + i} className="rounded-xl border border-white/10 overflow-hidden">
                    <div className="flex items-center gap-2 p-3 bg-white/[0.02] flex-wrap">
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold bg-violet-500/10 border border-violet-500/30 text-violet-300 rounded-full px-3 py-2">
                        📏 {s}
                        <button onClick={() => { setSizes(sizes.filter((_, j) => j !== i)); setSizePrices(sizePrices.filter((x) => x.size !== s)); setSizeSpecs(sizeSpecs.filter((x) => x.size !== s)); }} className="text-red-400 hover:text-red-300 font-black" aria-label={`حذف ${s}`}>✕</button>
                      </span>
                      <input
                        inputMode="numeric"
                        className="flex-1 min-w-32 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-orange-500/70"
                        placeholder="سعر هذا المقاس (فاضي = السعر الأساسي)"
                        value={sp?.price ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d.]/g, "");
                          const others = sizePrices.filter((x) => x.size !== s);
                          if (val) setSizePrices([...others, { size: s, price: val }]);
                          else setSizePrices(others);
                        }}
                      />
                      {sp?.price && <span className="shrink-0 text-xs font-bold text-orange-400">ج.م</span>}
                      <button
                        onClick={() => setSizeSpecsOpen(isOpen ? null : s)}
                        className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold border transition ${isOpen ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : specsOf.length > 0 ? "bg-amber-500/10 border-amber-500/30 text-amber-300" : "border-white/15 text-white/50 hover:bg-white/5"}`}
                      >
                        🔧 {specsOf.length > 0 ? `مواصفات (${specsOf.length})` : "مواصفات هذا المقاس"}
                      </button>
                    </div>

                    {/* 🔧 مواصفات هذا المقاس تحديدًا */}
                    {isOpen && (
                      <div className="border-t border-white/5 p-3 space-y-2 bg-black/20">
                        <p className="text-[11px] font-bold text-amber-300">⚙️ المواصفات الفنية الخاصة بمقاس "{s}" — العميل هيشوفها لما يختاره</p>
                        {specsOf.map((sp2, j) => (
                          <div key={j} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03]">
                            <p className="text-xs text-white/70"><span className="font-bold text-white/90">{sp2.k}:</span> {sp2.v}</p>
                            <button onClick={() => removeSizeSpec(s, j)} className="text-red-400 hover:text-red-300 text-xs font-black">✕</button>
                          </div>
                        ))}
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                          <input className={inputCls} placeholder="الخاصية — مثال: القدرة" value={tmpSpecK} onChange={(e) => setTmpSpecK(e.target.value)} />
                          <input className={inputCls} placeholder="القيمة — مثال: 120 وات" value={tmpSpecV} onChange={(e) => setTmpSpecV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSizeSpec(s); } }} />
                          <button onClick={() => addSizeSpec(s)} className="shrink-0 w-11 rounded-xl bg-orange-500 hover:bg-orange-400 font-black text-lg transition">＋</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="flex gap-2">
                <input className={inputCls} placeholder="اكتب مقاسًا جديدًا واضغط Enter — مثال: 8 بوصة" value={sizeInput} onChange={(e) => setSizeInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && sizeInput.trim()) { e.preventDefault(); if (!sizes.includes(sizeInput.trim())) { setSizes([...sizes, sizeInput.trim()]); setSizeInput(""); } } }} />
                <button onClick={() => { if (sizeInput.trim() && !sizes.includes(sizeInput.trim())) { setSizes([...sizes, sizeInput.trim()]); setSizeInput(""); } }} className="shrink-0 w-11 rounded-xl bg-orange-500 hover:bg-orange-400 font-black text-lg transition">＋</button>
              </div>
              {sizes.length > 0 && <p className="text-[11px] text-white/30">💡 كل مقاس مستقل: سعره الخاص + مواصفاته الخاصة — والعميل يشوف مواصفات المقاس اللي اختاره فقط</p>}
            </div>
          </details>

          {/* ─── 🔧 المواصفات العامة ─── */}
          <details className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 text-lg">🔧</span>
              <div className="flex-1">
                <h3 className="font-extrabold">المواصفات العامة (لكل المنتج)</h3>
                <p className="text-[11px] text-white/40">{specs.length > 0 ? `${specs.length} مواصفات عامة` : "مشتركة بين كل المقاسات — الضمان، بلد المنشأ..."} <span className="text-white/30">— تظهر كجدول أنيق للعميل</span></p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <input className={inputCls} placeholder="الخاصية — مثال: الضمان" value={specKey} onChange={(e) => setSpecKey(e.target.value)} />
                <input className={inputCls} placeholder="القيمة — مثال: سنتان" value={specVal} onChange={(e) => setSpecVal(e.target.value)} />
                <button onClick={() => { if (specKey.trim() && specVal.trim()) { setSpecs([...specs, { k: specKey.trim(), v: specVal.trim() }]); setSpecKey(""); setSpecVal(""); } }} className="shrink-0 w-11 rounded-xl bg-orange-500 hover:bg-orange-400 font-black text-lg transition">＋</button>
              </div>
              {specs.length > 0 && (
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  {specs.map((s, i) => {
                    if (editingSpecIdx === i) {
                      return (
                        <div key={i} className="p-3 border-b border-white/5 bg-orange-500/5 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input className={inputCls} value={editSpecKey} onChange={(e) => setEditSpecKey(e.target.value)} placeholder="الخاصية" autoFocus />
                            <input className={inputCls} value={editSpecVal} onChange={(e) => setEditSpecVal(e.target.value)} placeholder="القيمة" onKeyDown={(e) => { if (e.key === "Enter") saveSpecEdit(); if (e.key === "Escape") cancelSpecEdit(); }} />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button onClick={cancelSpecEdit} className="border border-white/15 hover:bg-white/5 rounded-lg px-4 py-1.5 text-xs font-bold transition">إلغاء</button>
                            <button onClick={saveSpecEdit} className="bg-green-500/20 border border-green-500/40 text-green-300 rounded-lg px-4 py-1.5 text-xs font-bold transition hover:bg-green-500/30">💾 حفظ</button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0 bg-white/[0.02] group/row">
                        <p className="text-xs text-white/70"><span className="font-bold text-white/90">{s.k}:</span> {s.v}</p>
                        <div className="flex gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingSpecIdx(i); setEditSpecKey(s.k); setEditSpecVal(s.v); }} title="تعديل" className="w-7 h-7 grid place-items-center rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25 text-xs transition">✏️</button>
                          <button onClick={() => setSpecs(specs.filter((_, j) => j !== i))} title="حذف" className="w-7 h-7 grid place-items-center rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-xs transition">✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-[11px] text-white/30">💡 مرر على أي سطر → ✏️ تعديل — والمواصفات الخاصة بكل مقاس تكون في قسم المقاسات فوق</p>
            </div>
          </details>

          {/* ─── الوصف والمميزات ─── */}
          <details open className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 text-lg">📝</span>
              <div className="flex-1">
                <h3 className="font-extrabold">الوصف والمميزات</h3>
                <p className="text-[11px] text-white/40">المميزات واحدة للمنتج كله — ووصف عام يشترك بين المقاسات</p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <label className={labelCls}>📄 وصف المنتج</label>
                <textarea className={inputCls + " min-h-24 resize-none"} placeholder="وصف مختصر وجاذب..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <label className={labelCls}>✅ المميزات — واحدة للمنتج كله</label>
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

          {/* ─── SKU والمخزون ─── */}
          <details className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 text-lg">🏷️</span>
              <div className="flex-1">
                <h3 className="font-extrabold">كود المنتج والمخزون</h3>
                <p className="text-[11px] text-white/40">{stockStatus === "available" ? "✅ متاح" : "🚫 غير متاح — زرار الشراء مقفول"}</p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label className={labelCls}>🔢 SKU</label>
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
                  <label className={labelCls}>الكمية</label>
                  <input className={inputCls} inputMode="numeric" placeholder="10" value={stockQty} onChange={(e) => setStockQty(e.target.value.replace(/\D/g, ""))} />
                </div>
              </div>
            </div>
          </details>

          {/* ─── الألوان ─── */}
          <details className="form-section rounded-3xl bg-[#101a30] border border-white/10 overflow-hidden">
            <summary className="flex items-center gap-3 p-5 cursor-pointer list-none select-none">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-pink-500/15 text-pink-400 text-lg">🎨</span>
              <div className="flex-1">
                <h3 className="font-extrabold">الألوان المتاحة</h3>
                <p className="text-[11px] text-white/40">{colors.length > 0 ? `${colors.length} ألوان` : "ألوان يختار منها العميل"}</p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <div className="glow-input rounded-xl border border-white/10 bg-white/[0.03] p-4">
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
                <p className="text-[11px] text-white/40">{images.length > 0 ? `📷 ${images.length} صورة — اسحب لترتيبها` : "اسحب الصور هنا أو اضغط"}</p>
              </div>
              <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <label className="block rounded-2xl border-2 border-dashed border-white/15 hover:border-orange-500/50 hover:bg-orange-500/5 transition p-6 text-center cursor-pointer">
                <span className="text-3xl">🖼️</span>
                <p className="text-sm font-bold mt-1">{uploading ? "جارٍ الرفع والضغط..." : "اسحب الصور هنا أو اضغط — تُضغط تلقائيًا"}</p>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { uploadImages(e.target.files); e.currentTarget.value = ""; }} />
              </label>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((src, i) => (
                    <div key={src + i} draggable onDragStart={() => setDragIdx(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragIdx !== null && dragIdx !== i) reorderImages(dragIdx, i); setDragIdx(null); }} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group cursor-grab active:cursor-grabbing" title="اسحب لإعادة الترتيب">
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

      {/* ═══════════ قائمة المنتجات ═══════════ */}
      <section className="mt-10">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-xl font-black">📦 منتجاتك في الموقع ({items.length})</h2>
          {items.length > 0 && (
            <button onClick={exportProducts} className="text-xs font-bold border border-white/15 hover:bg-white/5 rounded-xl px-4 py-2.5 transition">📥 تصدير Excel</button>
          )}
        </div>

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
              <select value={bulkBrand} onChange={(e) => setBulkBrand(e.target.value)} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs outline-none">
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
              <div key={p.id} className={`rounded-2xl border p-4 transition ${p.is_draft ? "border-gray-500/30 bg-gray-500/5" : isSelected ? "border-orange-500/50 bg-orange-500/5" : "bg-[#101a30] border-white/10 hover:border-orange-500/40"}`}>
                <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(p.id)} className="w-4 h-4 accent-orange-500 shrink-0 mt-1 cursor-pointer" />
                  <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-white/5 grid place-items-center relative">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{p.emoji ?? "📦"}</span>
                    )}
                    {p.is_draft && <span className="absolute inset-0 bg-black/60 grid place-items-center text-[10px] font-black text-white">📝 مسودة</span>}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-extrabold truncate">{p.name}</p>
                      {p.stock_status === "unavailable" && <span className="text-[10px] rounded-full px-2 py-0.5 bg-red-500/15 text-red-300 font-bold">🚫 غير متاح</span>}
                      {hasDiscount && <span className="text-[10px] rounded-full px-2 py-0.5 bg-red-500/15 text-red-300 font-bold">🔥 خصم {p.discount_percent ?? ""}%</span>}
                    </div>
                    <p className="text-[11px] text-white/40 font-bold">
                      {cat?.name ?? p.category_slug} {p.brand?.name && `• 🏷️ ${p.brand.name}`}
                      {p.sku && <span dir="ltr"> • #{p.sku}</span>}
                    </p>
                    <div className="flex gap-1.5 flex-wrap pt-0.5">
                      {(p.sizes ?? []).length > 0 && <span className="text-[10px] font-bold bg-violet-500/10 border border-violet-500/25 text-violet-300 rounded-full px-2.5 py-0.5">📏 {(p.sizes ?? []).length} مقاسات</span>}
                      {(p.colors ?? []).length > 0 && <span className="text-[10px] font-bold bg-pink-500/10 border border-pink-500/25 text-pink-300 rounded-full px-2.5 py-0.5">🎨 {(p.colors ?? []).length} ألوان</span>}
                      {(p.specs ?? []).length > 0 && <span className="text-[10px] font-bold bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded-full px-2.5 py-0.5">🔧 {(p.specs ?? []).length} مواصفات</span>}
                      {(p.size_prices ?? []).length > 0 && <span className="text-[10px] font-bold bg-green-500/10 border border-green-500/25 text-green-300 rounded-full px-2.5 py-0.5">💰 أسعار بالمقاس</span>}
                    </div>
                    <p className="pt-0.5">
                      {hasDiscount && <span className="text-xs font-bold text-red-400 line-through mr-1.5">{p.price} ج.م</span>}
                      <span className="font-black text-orange-400 text-lg">{final} ج.م</span>
                    </p>
                  </div>

                  <div className="flex gap-1.5 shrink-0 flex-wrap sm:flex-col">
                    <button onClick={() => duplicateItem(p)} title="نسخة" className="text-xs font-bold border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 rounded-lg px-3 py-2 transition">📋</button>
                    <button onClick={() => editItem(p)} className="text-xs font-bold border border-white/15 hover:bg-white/5 rounded-lg px-4 py-2 transition">✏️ تعديل</button>
                    <button onClick={() => deleteItem(p)} className="text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg px-3 py-2 transition">🗑️</button>
                  </div>
                </div>
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