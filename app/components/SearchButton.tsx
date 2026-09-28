"use client";

import { useState } from "react";
import SearchOverlay from "./SearchOverlay";

export default function SearchButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="ابحث عن منتج"
        aria-label="بحث"
        className="w-10 h-10 grid place-items-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-orange-500/50 transition-all duration-300"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-5 h-5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
      <SearchOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}