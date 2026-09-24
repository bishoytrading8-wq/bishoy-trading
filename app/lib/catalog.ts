import { supabase } from "./supabase";

export interface DbBrand {
  id: string;
  name: string;
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

const SELECT = "*, brand:brands(id, name)";

// 💰 حساب السعر النهائي — الخصم بيحسب بس لو التاريخ جواه فترته
export function priceInfo(p: DbProduct) {
  const today = new Date().toISOString().slice(0, 10);
  const active =
    (p.discount_percent != null || p.discount_amount != null) &&
    (!p.discount_from || p.discount_from <= today) &&
    (!p.discount_to || p.discount_to >= today);

  const base = Number(p.price);
  if (!active) return { base, final: base, hasDiscount: false, percentOff: 0 };

  const byPercent = p.discount_percent != null ? base * (1 - Number(p.discount_percent) / 100) : base;
  const byAmount = p.discount_amount != null ? base - Number(p.discount_amount) : base;
  const final = Math.max(0, Math.round(Math.min(byPercent, byAmount)));
  const percentOff = base > 0 ? Math.round(((base - final) / base) * 100) : 0;
  return { base, final, hasDiscount: true, percentOff };
}

// 🗂️ الأقسام — من قاعدة البيانات
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

// عدد المنتجات في كل قسم (للرئيسية)
export async function getCategoryCounts(): Promise<Record<string, number>> {
  const { data } = await supabase.from("products").select("category_slug");
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
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true });
  return count ?? 0;
}

export async function getProductsByCategory(slug: string): Promise<DbProduct[]> {
  const { data } = await supabase
    .from("products")
    .select(SELECT)
    .eq("category_slug", slug)
    .order("created_at", { ascending: false });
  return (data as DbProduct[]) ?? [];
}

export async function getAllDbProducts(): Promise<DbProduct[]> {
  const { data } = await supabase
    .from("products")
    .select(SELECT)
    .order("created_at", { ascending: false });
  return (data as DbProduct[]) ?? [];
}

export async function getDbProduct(id: string): Promise<DbProduct | null> {
  const { data } = await supabase.from("products").select(SELECT).eq("id", id).maybeSingle();
  return (data as DbProduct) ?? null;
}

// 🤝 منتجات مشابهة: نفس الماركة الأول — وبعدها نفس القسم
export async function getSimilar(p: DbProduct, limit = 4): Promise<DbProduct[]> {
  const { data } = await supabase
    .from("products")
    .select(SELECT)
    .eq("category_slug", p.category_slug)
    .neq("id", p.id)
    .limit(limit + 6);
  const list = (data as DbProduct[]) ?? [];
  const sameBrand = list.filter((x) => p.brand_id && x.brand_id === p.brand_id);
  const rest = list.filter((x) => !(p.brand_id && x.brand_id === p.brand_id));
  return [...sameBrand, ...rest].slice(0, limit);
}