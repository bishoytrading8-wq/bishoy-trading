"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import AuthModal from "../components/AuthModal";

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").toLowerCase();

export type Role = {
  kind: "owner" | "staff" | "customer";
  perms: {
    manageProducts: boolean;
    viewClients: boolean;
    addClients: boolean;
  };
};

const OWNER_ROLE: Role = {
  kind: "owner",
  perms: { manageProducts: true, viewClients: true, addClients: true },
};

const CUSTOMER_ROLE: Role = {
  kind: "customer",
  perms: { manageProducts: false, viewClients: false, addClients: false },
};

// 🧠 إزاي بنعرف الدور؟ المالك بالإيميل الثابت — الموظف من جدول staff_members
async function computeRole(u: User | null): Promise<Role | null> {
  if (!u) return null;
  if ((u.email ?? "").toLowerCase() === ADMIN_EMAIL) return OWNER_ROLE;

  const { data } = await supabase
    .from("staff_members")
    .select("can_manage_products, can_view_clients, can_add_clients, is_active")
    .eq("email", (u.email ?? "").toLowerCase())
    .maybeSingle();

  if (data?.is_active) {
    return {
      kind: "staff",
      perms: {
        manageProducts: !!data.can_manage_products,
        viewClients: !!data.can_view_clients,
        addClients: !!data.can_add_clients,
      },
    };
  }
  return CUSTOMER_ROLE;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  role: Role | null;
  isAdmin: boolean;          // مالك أو موظف بصلاحية إدارة
  can: (perm: keyof Role["perms"]) => boolean;
  openAuth: (mode?: "login" | "register") => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth لازم يشتغل جوه AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      setRole(await computeRole(u));
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setRole(await computeRole(u));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const openAuth = useCallback((m: "login" | "register" = "login") => {
    setMode(m);
    setOpen(true);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const can = useCallback(
    (perm: keyof Role["perms"]) => !!role?.perms[perm],
    [role]
  );

  const isAdmin = role?.kind === "owner" || (role?.kind === "staff" && role.perms.manageProducts);

  return (
    <Ctx.Provider value={{ user, loading, role, isAdmin, can, openAuth, signOut }}>
      {children}
      <AuthModal open={open} initialMode={mode} onClose={() => setOpen(false)} />
    </Ctx.Provider>
  );
}

export default AuthProvider;