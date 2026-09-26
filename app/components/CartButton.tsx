"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartButton() {
  const { totalQty } = useCart();

  return (
    <Link
      href="/cart"
      title="طلباتي"
      className="relative w-10 h-10 grid place-items-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-orange-500/50 transition-all duration-300"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {totalQty > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 grid place-items-center rounded-full bg-orange-500 text-white text-[10px] font-black shadow-lg shadow-orange-500/40">
          {totalQty > 99 ? "99+" : totalQty}
        </span>
      )}
    </Link>
  );
}