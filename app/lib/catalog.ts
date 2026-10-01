import { supabase } from "./supabase";

export interface DbBrand {
  id: string;
  name: string;
}

export interface DbSizePrice {
  size: string;
  price: number;
  discount_percent?: number | null;
  discount_amount?: number | null;
}

export interface DbProduct {
  id: string;
  name: string;
  price: number;
  discount_percent: number | null;
  discount_amount: number | null;
  discount_from: string | null;
  discount_to: string | null;
  description: string | null;
  features: string[];
  emoji: string | null;
  brand_id: string | null;
  brand: DbBrand | null;
  category_slug: string;
  images: string[];
  sizes: string[] | null;
  size_prices: DbSizePrice[] | null;
  size_specs: { size: string; specs: { k: string; v: string }[] }[] | null;
  colors: string[] | null;
  sku: string | null;
  stock_status: string | null;
  stock_qty: number | null;
  specs: { k: string; v: string }[] | null;
  is_draft: boolean | null;
  created_at?: string;
}

export interface DbCategory {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  image: string;
  tagline: string;
  sort_order: number;
  is_active: boolean;
}

const SELECT = "*, brand:brands(id, name), sizes, colors, size_prices, size_specs, sku, stock_status, stock_qty, specs, is_draft";

// ⏳ هل فترة العرض نشطة؟ (تواريخ مستوى المنتج — بتنطبق على المقاسات كمان)
export function discountPeriodActive(p: Pick<DbProduct, "discount_from" | "discount_to">): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (p.discount_from && p.discount_from > today) return false;
  if (p.discount_to && p.discount_to < today) return false;
  return true;
}

// 💰 تطبيق خصم على سعر أساسي — بيرجع النهائي وهل فيه خصم
function applyDiscount(base: number, pct: number | null | undefined, amt: number | null | undefined) {
  if (base <= 0) return { final: base, hasDiscount: false, percentOff: 0 };
  const byPct = pct != null && pct > 0 ? base * (1 - pct / 100) : Infinity;
  const byAmt = amt != null && amt > 0 ? base - amt : Infinity;
  const final = Math.max(0, Math.round(Math.min(byPct, byAmt)));
  const hasDiscount = final < base;
  const percentOff = hasDiscount && base > 0 ? Math.round(((base - final) / base) * 100) : 0;
  return { final, hasDiscount, percentOff };
}

// 💰 سعر منتج بدون مقاسات — سعر واحد + خصمه
export function priceInfo(p: DbProduct) {
  const base = Number(p.price);
  const active = discountPeriodActive(p) && (p.discount_percent != null || p.discount_amount != null);
  if (!active) return { base, final: base, hasDiscount: false, percentOff: 0 };
  return { base, ...applyDiscount(base, p.discount_percent, p.discount_amount) };
}

// 💰📏 سعر مقاس معين — خصم المقاس نفسه + فترة العرض على مستوى المنتج
export function priceForSize(p: DbProduct, size: string) {
  const basePrice = Number(p.price);
  const sp = (p.size_prices ?? []).find((x) => x.size === size);
  if (!sp) return priceInfo(p); // مقاس قديم بدون سطر — ياخد خصم مستوى المنتج
  const base = sp.price;
  if (!discountPeriodActive(p)) return { base, final: base, hasDiscount: false, percentOff: 0 };
  return { base, ...applyDiscount(base, sp.discount_percent, sp.discount_amount) };
}

// 📋 سعر العرض في الكروت: "يبدأ من" أرخص مقاس — أو سعر المنتج الواحد
export function listPrice(p: DbProduct) {
  const sps = p.size_prices ?? [];
  if (sps.length === 0) {
    const info = priceInfo(p);
    return { base: info.base, final: info.final, hasDiscount: info.hasDiscount, percentOff: info.percentOff, fromLabel: false };
  }
  const rows = sps.map((sp) => {
    if (!discountPeriodActive(p)) return { base: sp.price, final: sp.price, hasDiscount: false, percentOff: 0 };
    return { base: sp.price, ...applyDiscount(sp.price, sp.discount_percent, sp.discount_amount) };
  });
  const cheapest = rows.reduce((a, b) => (b.final < a.final ? b : a));
  const maxPct = rows.reduce((m, r) => Math.max(m, r.percentOff), 0);
  return {
    base: cheapest.base,
    final: cheapest.final,
    hasDiscount: cheapest.hasDiscount,
    percentOff: maxPct,
    fromLabel: sps.length > 1,
  };
}

// 🗂️ الأقسام
export async function getCategories(onlyActive = true): Promise<DbCategory[]> {
  let q = supabase.from("categories").select("*").order("sort_order");
  if (onlyActive) q = q.eq("is_active", true);
  const { data } = await q;
  return (data as DbCategory[]) ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<DbCategory | null> {
  const { data } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
  return (data as DbCategory) ?? null;
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const { data } = await supabase.from("products").select("category_slug").eq("is_draft", false);
  const counts: Record<string, number> = {};
  for (const r of (data as { category_slug: string }[]) ?? []) {
    counts[r.category_slug] = (counts[r.category_slug] ?? 0) + 1;
  }
  return counts;
}

export async function getBrands(): Promise<DbBrand[]> {
  const { data } = await supabase.from("brands").select("*").order("name");
  return data ?? [];
}

export async function countProducts(): Promise<number> {
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("is_draft", false);
  return count ?? 0;
}

export async function getProductsByCategory(slug: string): Promise<DbProduct[]> {
  const { data } = await supabase
    .from("products")
    .select(SELECT)
    .eq("category_slug", slug)
    .eq("is_draft", false)
    .order("created_at", { ascending: false });
  return (data as DbProduct[]) ?? [];
}

export async function getAllDbProducts(): Promise<DbProduct[]> {
  const { data } = await supabase
    .from("products")
    .select(SELECT)
    .eq("is_draft", false)
    .order("created_at", { ascending: false });
  return (data as DbProduct[]) ?? [];
}

export async function getDbProduct(id: string): Promise<DbProduct | null> {
  const { data } = await supabase.from("products").select(SELECT).eq("id", id).maybeSingle();
  return (data as DbProduct) ?? null;
}

export async function getSimilar(p: DbProduct, limit = 4): Promise<DbProduct[]> {
  const { data } = await supabase
    .from("products")
    .select(SELECT)
    .eq("category_slug", p.category_slug)
    .eq("is_draft", false)
    .neq("id", p.id)
    .limit(limit + 6);
  const list = (data as DbProduct[]) ?? [];
  const sameBrand = list.filter((x) => p.brand_id && x.brand_id === p.brand_id);
  const rest = list.filter((x) => !(p.brand_id && x.brand_id === p.brand_id));
  return [...sameBrand, ...rest].slice(0, limit);
}