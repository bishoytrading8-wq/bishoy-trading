"use client";

import { useCart } from "./CartProvider";

export default function AddToCartButton({ item, className = "" }: {
  item: { id: string; name: string; price: number; emoji: string; image?: string };
  className?: string;
}) {
  const { add, justAdded, items } = useCart();
  const inCart = items.find((x) => x.id === item.id);
  const added = justAdded === item.id;

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); add(item); }}
      className={added
        ? "w-full bg-green-500 text-white rounded-xl py-2.5 text-sm font-extrabold transition-all duration-300"
        : `w-full bg-orange-500 hover:bg-orange-400 text-white rounded-xl py-2.5 text-sm font-extrabold transition-all duration-300 ${className}`}
    >
      {added ? (
        "✓ اتضاف للطلب"
      ) : (
        <span className="inline-flex items-center justify-center gap-2">
          <span>＋ أضف للطلب</span>
          {inCart && (
            <span className="min-w-6 h-6 px-1.5 inline-grid place-items-center rounded-full bg-white text-orange-500 text-xs font-black shadow">
              {inCart.qty}
            </span>
          )}
        </span>
      )}
    </button>
  );
}