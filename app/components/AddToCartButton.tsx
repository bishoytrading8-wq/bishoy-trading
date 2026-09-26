"use client";

import { useCart } from "./CartProvider";

export default function AddToCartButton({ item, className = "" }: {
  item: { id: string; name: string; price: number; emoji: string; image?: string };
  className?: string;
}) {
  const { add, justAdded } = useCart();
  const added = justAdded === item.id;

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); add(item); }}
      className={added
        ? "w-full bg-green-500 text-white rounded-xl py-2.5 text-sm font-extrabold transition-all duration-300"
        : `w-full bg-orange-500 hover:bg-orange-400 text-white rounded-xl py-2.5 text-sm font-extrabold transition-all duration-300 ${className}`}
    >
      {added ? "✓ اتضاف للطلب" : "＋ أضف للطلب"}
    </button>
  );
}