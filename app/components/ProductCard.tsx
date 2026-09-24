import Link from "next/link";
import type { Product } from "../products-data";
import PriceGate from "./PriceGate";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`} className="group rounded-2xl bg-[#101a30] border border-white/10 hover:border-orange-500/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <div className="h-40 grid place-items-center bg-gradient-to-b from-white/5 to-transparent text-6xl group-hover:scale-110 transition-transform duration-300">
        {product.emoji}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-bold group-hover:text-orange-400 transition">{product.name}</h3>
        <p className="text-xs text-white/50 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between pt-1">
          <PriceGate price={product.price} compact />
          <span className="text-xs text-white/40 group-hover:text-orange-400 transition font-bold">التفاصيل ←</span>
        </div>
      </div>
    </Link>
  );
}