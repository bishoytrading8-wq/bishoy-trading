import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategory } from "../../products-data";
import { getProductsByCategory } from "../../lib/catalog";
import DbProductCard from "../../components/DbProductCard";
import MembersBanner from "../../components/MembersBanner";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategory(slug);
  return cat ? { title: cat.name, description: cat.tagline } : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) notFound();
  const products = await getProductsByCategory(slug);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 lg:py-14">
      <nav className="text-xs text-white/50 flex items-center gap-2 mb-8">
        <Link href="/" className="hover:text-orange-400">الرئيسية</Link><span>/</span>
        <span className="text-orange-400 font-bold">{cat.name}</span>
      </nav>

      <div className="flex items-center gap-4 mb-2">
        <span className="text-5xl">{cat.emoji}</span>
        <div>
          <h1 className="text-3xl lg:text-4xl font-black">{cat.name}</h1>
          <p className="text-white/50 mt-1">{cat.tagline}</p>
        </div>
      </div>
      <p className="text-xs text-white/40 mb-6">{products.length} منتجات متاحة</p>

      <MembersBanner />

      {products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 p-12 text-center mt-8">
          <span className="text-5xl">🛠️</span>
          <h2 className="font-extrabold text-lg mt-3">منتجات القسم ده بتتضاف قريب</h2>
          <p className="text-sm text-white/50 mt-1">عندك استفسار؟ كلمنا واحنا نوفرلك اللي بتدور عليه</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {products.map((p) => <DbProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}