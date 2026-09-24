import Link from "next/link";
import { CONTACT, WHATSAPP_LINK } from "../products-data";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#080e1a] mt-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <h3 className="font-extrabold text-lg text-orange-400">{CONTACT.brand}</h3>
          <p className="text-sm text-white/60 mt-3 leading-relaxed">موايت • شفاطات مطابخ • أغلفة ديكور • بلورات • مراوح • ضفاير — جودة عالية وأسعار منافسة لكل بيت ومحل في مصر.</p>
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
            <li>📞 <span dir="ltr">{CONTACT.phones.join(" - ")}</span></li>
            <li>💬 <a href={WHATSAPP_LINK("مرحبًا، عايز أستفسر 👋")} target="_blank" className="hover:text-green-400 transition">واتساب مباشر</a></li>
            <li>🕗 {CONTACT.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {CONTACT.brand} — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}