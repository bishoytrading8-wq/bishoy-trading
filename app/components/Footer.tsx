import Link from "next/link";
import { getSettings, waLink } from "../lib/settings";

export default async function Footer() {
  const s = await getSettings();

  const socials = [
    { url: s.facebook, icon: "📘", label: "فيسبوك" },
    { url: s.telegram, icon: "✈️", label: "تلجرام" },
    { url: s.instagram, icon: "📸", label: "انستجرام" },
    { url: s.linkedin, icon: "💼", label: "لينكد إن" },
  ].filter((x) => x.url);

  return (
    <footer className="border-t border-white/10 bg-[#080e1a] mt-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <h3 className="font-extrabold text-lg text-orange-400">شركة بيشوي للتجارة والتوريدات</h3>
          <p className="text-sm text-white/60 mt-3 leading-relaxed">موايت • شفاطات مطابخ • أغلفة ديكور • بلورات • مراوح • ضفاير — جودة عالية وأسعار منافسة لكل بيت ومحل في مصر.</p>
          {socials.length > 0 && (
            <div className="flex gap-2 mt-4">
              {socials.map((soc) => (
                <a key={soc.label} href={soc.url} target="_blank" title={soc.label}
                  className="w-10 h-10 grid place-items-center rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/10 text-lg transition">
                  {soc.icon}
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h4 className="font-bold mb-3">روابط سريعة</h4>
          <ul className="space-y-2 text-sm text-white/60">
            <li><Link href="/" className="hover:text-orange-400 transition">الرئيسية</Link></li>
            <li><Link href="/about" className="hover:text-orange-400 transition">من نحن</Link></li>
            <li><Link href="/contact" className="hover:text-orange-400 transition">تواصل معنا</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-3">تواصل معنا</h4>
          <ul className="space-y-2 text-sm text-white/60">
            <li>☎️ <a href={`tel:${s.landline}`} className="hover:text-orange-400 transition" dir="ltr">{s.landline}</a> <span className="text-white/30">(أرضي)</span></li>
            <li>📱 <a href={`tel:${s.mobile}`} className="hover:text-orange-400 transition" dir="ltr">{s.mobile}</a> <span className="text-white/30">(محمول)</span></li>
            <li>💬 <a href={waLink(s.whatsapp, "مرحبًا، عايز أستفسر 👋")} target="_blank" className="hover:text-green-400 transition">واتساب مباشر</a></li>
            <li>📍 {s.address}</li>
            {s.maps_url && <li>🗺️ <a href={s.maps_url} target="_blank" className="hover:text-orange-400 transition font-bold">افتح اللوكيشن على الخريطة</a></li>}
            <li>🕗 {s.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} شركة بيشوي للتجارة والتوريدات — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}