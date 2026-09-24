"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  // أول تحميل — نقرأ الاختيار المحفوظ من قبل
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved !== "light"; // الافتراضي غامق
    setDark(isDark);
    document.documentElement.classList.toggle("light", !isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("light", !next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      aria-label="تبديل المظهر"
      title={dark ? "الوضع الفاتح ☀️" : "الوضع الغامق 🌙"}
      className="relative w-14 h-8 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition-colors shrink-0"
    >
      <span
        className={`absolute top-1/2 -translate-y-1/2 right-1 w-6 h-6 rounded-full bg-orange-500 grid place-items-center text-xs shadow transition-all duration-300 ${dark ? "" : "-translate-x-6"}`}
      >
        {dark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}