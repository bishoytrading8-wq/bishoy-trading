import { supabase } from "./supabase";

// ⚙️ إعدادات الموقع — مصدر الحقيقة: جدول site_settings
// تتعدل من لوحة التحكم: /admin/settings
export interface SiteSettings {
  landline: string;
  mobile: string;
  whatsapp: string;
  hours: string;
  address: string;
  maps_url: string;
  website: string;
  facebook: string;
  telegram: string;
  instagram: string;
  linkedin: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  landline: "0225899361",
  mobile: "01220847856",
  whatsapp: "201220847856",
  hours: "يوميًا من 9 صباحًا حتى 9 مساءً",
  address: "43 شارع نجيب الريحاني - العتبة - القاهرة",
  maps_url: "https://www.google.com/maps/search/?api=1&query=43+Naguib+El+Rihani+St+Attaba+Cairo",
  website: "https://bishoy-trading.vercel.app",
  facebook: "https://www.facebook.com/share/1FNrRvx6wA/",
  telegram: "",
  instagram: "",
  linkedin: "",
};

export async function getSettings(): Promise<SiteSettings> {
  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) } as SiteSettings;
}

export async function saveSettings(s: SiteSettings): Promise<string | null> {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ id: 1, ...s, updated_at: new Date().toISOString() });
  return error ? error.message : null;
}

// 💬 رابط واتساب برسالة جاهزة
export function waLink(whatsapp: string, msg = "مرحبًا 👋") {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
}