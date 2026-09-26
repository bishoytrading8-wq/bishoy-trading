import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { AuthProvider } from "./lib/AuthProvider";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["400", "500", "600", "700", "800", "900"],
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
          <Header />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}