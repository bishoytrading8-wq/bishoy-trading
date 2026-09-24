import type { Metadata } from "next";
import { Cairo, Cairo_Play } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { AuthProvider } from "./lib/AuthProvider";

// 📝 نصوص الموقع — وضوح مريح
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["400", "500", "600", "700", "800", "900"],
});

// 🎨 العناوين — طابع براند قوي
const cairoPlay = Cairo_Play({
  subsets: ["arabic", "latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: { default: "شركة بيشوي للتجارة والتوريدات", template: "%s | شركة بيشوي" },
  description:
    "موايت • شفاطات مطابخ • أغلفة ديكور • بلورات • مراوح • ضفاير — جودة عالية وأسعار منافسة لكل بيت ومحل في مصر.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} ${cairoPlay.variable} antialiased bg-[#0b1220] text-white`}>
        <script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.add('light')}catch(e){}" }} />
        <AuthProvider>
          <Header />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}