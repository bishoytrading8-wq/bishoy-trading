"use client";

import type { ReactNode } from "react";
import { useAuth } from "../lib/AuthProvider";

export default function OpenAuthButton({
  mode = "login",
  className = "",
  children,
}: {
  mode?: "login" | "register";
  className?: string;
  children: ReactNode;
}) {
  const { openAuth } = useAuth();
  return (
    <button onClick={() => openAuth(mode)} className={className}>
      {children}
    </button>
  );
}