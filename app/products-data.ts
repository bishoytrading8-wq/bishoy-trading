// ═══════════════════════════════════════════════
// احتياطي فقط — الإعدادات الفعلية من قاعدة البيانات
// وتتغير من: /admin/settings
// ═══════════════════════════════════════════════

export const CONTACT = {
  brand: "شركة بيشوي للتجارة والتوريدات",
  phones: ["0225899361", "01220847856"],
  landline: "0225899361",
  mobile: "01220847856",
  whatsapp: "201220847856",
  website: "https://bishoy-trading.vercel.app",
  address: "43 شارع نجيب الريحاني - العتبة - القاهرة",
  maps_url: "https://www.google.com/maps/search/?api=1&query=43+Naguib+El+Rihani+St+Attaba+Cairo",
  facebook: "https://www.facebook.com/share/1FNrRvx6wA/",
  telegram: "",
  instagram: "",
  linkedin: "",
  hours: "يوميًا من 9 صباحًا حتى 9 مساءً",
};

export const WHATSAPP_LINK = (msg = "مرحبًا 👋") =>
  `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(msg)}`;