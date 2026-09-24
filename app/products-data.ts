// ============================================================
// بيانات الموقع كلها من هنا — أقسام + منتجات + أرقام تواصل
// لما تحب تحط منتجاتك الحقيقية: التعديل من الملف ده بس
// ============================================================

// ☎️ أرقام التواصل — مصدر واحد لكل الموقع (عدّل من هنا بس)
export const CONTACT = {
  brand: "شركة بيشوي للتجارة والتوريدات",
  phones: ["0225899361", "01220847856"],
  mobile: "01220847856",
  whatsapp: "201220847856", // بصيغة دولية: 20 + الرقم من غير الصفر
  hours: "يوميًا من 9 صباحًا حتى 9 مساءً",
};

export const WHATSAPP_LINK = (msg = "مرحبًا 👋") =>
  `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(msg)}`;

// 📦 الأنواع
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  emoji: string;
}

export interface Category {
  slug: string;
  name: string;
  emoji: string;
  tagline: string;
  products: Product[];
}

// 🗂️ الأقسام والمنتجات (نموذجية — هتستبدلها بمنتجاتك بعدين)
export const CATEGORIES: Category[] = [
  {
    slug: "kitchen-extractors",
    name: "شفاطات مطابخ",
    emoji: "🌀",
    tagline: "أفضل الأسعار والجودة المضمونة",
    products: [
      { id: "extractor-6", name: "شفاط مطبخ 6 بوصة", price: 1200, emoji: "🌀", description: "شفاط مطبخ 6 بوصة بقوة سحب مناسبة للمطابخ الصغيرة — تشغيل هادئ واستهلاك كهرباء قليل.", features: ["مقاس 6 بوصة", "تشغيل هادئ", "استهلاك منخفض للكهرباء"] },
      { id: "extractor-8", name: "شفاط مطبخ 8 بوصة", price: 1650, emoji: "🌀", description: "شفاط مطبخ 8 بوصة بقوة سحب أعلى — الاختيار الأنسب للمطابخ المتوسطة.", features: ["مقاس 8 بوصة", "قوة سحب أعلى", "موتور قوي وعمر طويل"] },
      { id: "extractor-10", name: "شفاط مطبخ 10 بوصة", price: 2200, emoji: "🌀", description: "شفاط مطبخ 10 بوصة بأعلى قوة سحب — مثالي للمطابخ الكبيرة والمحلات.", features: ["مقاس 10 بوصة", "أعلى قوة سحب", "مناسب للمحلات"] },
    ],
  },
  {
    slug: "mowaet",
    name: "موايت",
    emoji: "💧",
    tagline: "موديلات متنوعة تناسب كل الاستخدامات",
    products: [
      { id: "mowaet-1", name: "مبرد مياه طاولة", price: 1850, emoji: "💧", description: "مبرد مياه مكتبي بتبريد سريع وحجم صغير يوفر مساحة.", features: ["تبريد سريع", "حجم صغير", "تشغيل هادئ"] },
      { id: "mowaet-2", name: "مبرد مياه أرضي", price: 2400, emoji: "💧", description: "مبرد مياه أرضي بعلبة مياه داخلية وتبريد وتسخين.", features: ["تبريد + تسخين", "علبة مياه داخلية", "تصميم مودرن"] },
      { id: "mowaet-3", name: "مبرد مياه أرضي بثلاجة", price: 2750, emoji: "💧", description: "مبرد مياه أرضي بثلاجة صغيرة — توفير عالي ومكانة قوية.", features: ["ثلاجة صغيرة", "تبريد وتسخين", "توفير عالي"] },
    ],
  },
  {
    slug: "blourat",
    name: "بلورات",
    emoji: "💎",
    tagline: "إضاءة تليق ببيتك — قطع فخمة بأقل سعر",
    products: [
      { id: "bloura-5", name: "بلورة 5 أفرع", price: 950, emoji: "💎", description: "بلورة إضاءة 5 أفرع بتصميم مودرن يناسب الصالات والغرف.", features: ["5 أفرع", "تصميم مودرن", "إضاءة قوية ومريحة"] },
      { id: "bloura-8", name: "بلورة 8 أفرع", price: 1450, emoji: "💎", description: "بلورة 8 أفرع بخامات عالية الجودة — مناسبة للصالات الكبيرة.", features: ["8 أفرع", "خامات عالية الجودة", "إضاءة موزعة"] },
      { id: "bloura-12", name: "بلورة 12 فرع", price: 2100, emoji: "💎", description: "بلورة 12 فرع بشكل فخم — الأنسب للمعيش الكبير.", features: ["12 فرع", "شكل فخم", "الأنسب للمعيش الكبير"] },
    ],
  },
  {
    slug: "decor-covers",
    name: "أغلفة ديكور",
    emoji: "✨",
    tagline: "شكل جديد لأجهزتك — حماية وأناقة",
    products: [
      { id: "cover-stove", name: "غلفة بوتاجاز", price: 180, emoji: "✨", description: "غلفة بوتاجاز بخامات متينة وألوان ثابتة — حماية وشكل أنيق.", features: ["خامة متينة", "ألوان ثابتة", "سهلة التنظيف"] },
      { id: "cover-fridge", name: "غلفة تلاجة", price: 220, emoji: "✨", description: "غلفة تلاجة بمقاسات متعددة وتصاميم متنوعة.", features: ["مقاسات متعددة", "تصاميم متنوعة", "حماية من الأتربة"] },
      { id: "cover-set", name: "طقم أغلفة مطبخ", price: 350, emoji: "✨", description: "طقم كامل لأجهزة المطبخ بلون واحد موحد.", features: ["طقم كامل", "لون موحد", "خامات مختارة"] },
    ],
  },
  {
    slug: "fans",
    name: "مراوح",
    emoji: "🌬️",
    tagline: "انتعاش لكل غرفة — كل المقاسات والأشكال",
    products: [
      { id: "fan-ceiling", name: "مروحة سقف 56 بوصة", price: 1350, emoji: "🌬️", description: "مروحة سقف 56 بوصة بموتور قوي و3 سرعات.", features: ["مقاس 56 بوصة", "3 سرعات", "موتور قوي"] },
      { id: "fan-table", name: "مروحة رجيل 16 بوصة", price: 620, emoji: "🌬️", description: "مروحة رجيل 16 بوصة خفيفة وسهلة الحركة.", features: ["مقاس 16 بوصة", "سهلة الحركة", "توفير في الكهرباء"] },
      { id: "fan-stand", name: "مروحة عمودية 16 بوصة", price: 780, emoji: "🌬️", description: "مروحة عمودية بارتفاع قابل للتعديل وتايمر.", features: ["ارتفاع قابل للتعديل", "تايمر", "3 سرعات"] },
    ],
  },
  {
    slug: "dafayer",
    name: "ضفاير",
    emoji: "💨",
    tagline: "تهوية قوية لحمامات ومطابخك",
    products: [
      { id: "dafaya-8", name: "ضفاية شباك 8 بوصة", price: 340, emoji: "💨", description: "ضفاية شباك 8 بوصة بسحب قوي — للحمامات والمطابخ الصغيرة.", features: ["مقاس 8 بوصة", "سحب قوي", "مناسبة للحمامات"] },
      { id: "dafaya-12", name: "ضفاية شباك 12 بوصة", price: 460, emoji: "💨", description: "ضفاية شباك 12 بوصة بتهوية أقوى وتشغيل صامت.", features: ["مقاس 12 بوصة", "تهوية أقوى", "تشغيل صامت"] },
    ],
  },
];

// 🔍 دوال مساعدة
export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getProduct(id: string) {
  for (const c of CATEGORIES) {
    const p = c.products.find((p) => p.id === id);
    if (p) return { product: p, category: c };
  }
  return undefined;
}

export function getAllProducts() {
  return CATEGORIES.flatMap((c) => c.products);
}