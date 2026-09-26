import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDbProduct, getSimilar, priceInfo, getCategoryBySlug } from "../../lib/catalog";
import { getSettings, waLink } from "../../lib/settings";
import ProductGallery from "../../components/ProductGallery";
import DbProductCard from "../../components/DbProductCard";
import PriceGate from "../../components/PriceGate";
import AddToCartButton from "../../components/AddToCartButton";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await getDbProduct(id);
  return p ? { title: p.name, description: p.description ?? undefined } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getDbProduct(id);
  if (!product) notFound();

  const cat = await getCategoryBySlug(product.category_slug);
  const s = await getSettings();
  const { final, hasDiscount, percentOff } = priceInfo(product);
  const similar = await getSimilar(product, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 lg:py-14">
      <nav className="text-xs text-white/50 flex items-center gap-2 flex-wrap mb-8">
        <Link href="/" className="hover:text-orange-400">الرئيسية</Link><span>/</span>
        {cat && (<><Link href={`/category/${cat.slug}`} className="hover:text-orange-400">{cat.name}</Link><span>/</span></>)}
        <span className="text-orange-400 font-bold">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 items-start">
        <ProductGallery images={product.images ?? []} emoji={product.emoji} name={product.name} />

        <div>
          {cat && (
            <span className="inline-block text-xs bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded-full px-3 py-1 font-bold">
              {cat.emoji} {cat.name}
            </span>
          )}
          {product.brand?.name && (
            <span className="inline-block text-xs bg-white/5 border border-white/10 text-white/60 rounded-full px-3 py-1 font-bold mr-2">
              🏷️ {product.brand.name}
            </span>
          )}

          <h1 className="text-3xl lg:text-4xl font-black mt-3">{product.name}</h1>
          {product.description && <p className="text-white/60 leading-relaxed mt-4">{product.description}</p>}

          {product.features && product.features.length > 0 && (
            <ul className="mt-5 space-y-2">
              {product.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
            </ul>
          )}

          {hasDiscount && (
            <span className="inline-block bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-black rounded-full px-3 py-1 mt-4">
              🔥 خصم {percentOff}% — لفترة محدودة
            </span>
          )}

          <div className="mt-6"><PriceGate price={final} /></div>

          {/* 🛒 إضافة للطلب */}
          <div className="mt-4">
            <AddToCartButton item={{ id: product.id, name: product.name, price: final, emoji: product.emoji ?? "📦", image: product.images?.[0] }} className="py-3.5 text-base" />
          </div>

          <div className="flex gap-3 mt-4 flex-wrap">
            <a href={`tel:${s.mobile}`} className="bg-orange-500 hover:bg-orange-400 px-7 py-3 rounded-xl font-extrabold transition shadow-lg shadow-orange-500/20">📞 اتصل بنا</a>
            <a href={waLink(s.whatsapp, `مرحبًا 👋 مهتم بـ ${product.name}`)} target="_blank" className="border border-green-500/40 text-green-400 hover:bg-green-500/10 px-7 py-3 rounded-xl font-bold transition">💬 واتساب</a>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-black mb-6">
            منتجات <span className="text-orange-400">مشابهة</span>
            {product.brand?.name && <span className="text-sm text-white/40 font-bold mr-2">(من نفس الماركة: {product.brand.name})</span>}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((x) => <DbProductCard key={x.id} product={x} />)}
          </div>
        </section>
      )}
    </div>
  );
}