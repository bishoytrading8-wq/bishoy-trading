"use client";

import { useAuth } from "../lib/AuthProvider";

export default function PreviewExitButton() {
  const { previewMode, togglePreview } = useAuth();

  if (!previewMode) return null;

  return (
    <button
      onClick={togglePreview}
      className="fixed bottom-5 left-5 z-[90] flex items-center gap-2.5 rounded-full bg-orange-500 hover:bg-orange-400 text-white px-5 py-3.5 font-extrabold text-sm shadow-2xl shadow-orange-500/50 transition-all duration-300 hover:scale-105"
    >
      <span className="text-lg">👑</span>
      رجوع لوضع الإدارة
    </button>
  );
}