"use client";

import { useAuth } from "../lib/AuthProvider";

export default function ViewToggle() {
  const { previewMode, togglePreview, role } = useAuth();

  if (!role || role.kind === "customer") return null;

  return (
    <button
      onClick={togglePreview}
      title={previewMode ? "التحويل لوضع الإدارة 👑" : "التحويل لوضع العميل 👁️"}
      aria-label="تبديل وضع العرض"
      className="relative w-14 h-8 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition-colors shrink-0"
    >
      <span
        className={`absolute top-1/2 -translate-y-1/2 right-1 w-6 h-6 rounded-full grid place-items-center text-xs shadow transition-all duration-300 ${
          previewMode ? "bg-blue-400 -translate-x-6" : "bg-orange-500"
        }`}
      >
        {previewMode ? "👁️" : "👑"}
      </span>
    </button>
  );
}