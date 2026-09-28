import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { AuthProvider } from "./lib/AuthProvider";
import { CartProvider } from "./components/CartProvider";

// 📝 خط Cairo محلي — مفيش اعتماد على الإنترنت وقت البناء
const cairo = localFont({
  src: [
    { path: "./fonts/Cairo-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Cairo-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Cairo-Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "شركة بيشوي للتجارة والتوريدات", template: "%s | شركة بيشوي" },
  description:
    "موايت • شفاطات مطابخ • أغلفة ديكور • بلورات • مراوح • ضفاير — جودة عالية وأسعار منافسة لكل بيت ومحل في مصر.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} antialiased bg-[#0b1220] text-white`}>
        <AuthProvider>
          <CartProvider>
            <Header />
            <main className="min-h-[60vh]">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}