"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-orange-500/70 transition";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // 📬 استقبال التصريح من لينك الإيميل وتفعيل جلسة مؤقتة
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(() => setReady(true));
    } else {
      // ممكن الجلسة تكون اتفعلت تلقائيًا من الرابط
      setReady(true);
    }
  }, []);

  const save = async () => {
    setErr(""); setMsg("");
    if (pass.length < 6) { setErr("كلمة السر لازم 6 حروف على الأقل"); return; }
    if (pass !== pass2) { setErr("كلمة السر وتأكيدها مش زي بعض"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pass });
    setBusy(false);
    if (error) { setErr("فشل التغيير: " + error.message); return; }
    setMsg("✓ تم تغيير كلمة السر بنجاح — جاري تحويلك للدخول...");
    setTimeout(() => router.push("/"), 2500);
  };

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-[#101a30] border border-white/10 p-8">
        <div className="text-center">
          <span className="text-5xl">🔑</span>
          <h1 className="text-2xl font-black mt-3">كلمة سر جديدة</h1>
          <p className="text-white/50 text-xs mt-2">اختار كلمة سر جديدة لحسابك</p>
        </div>

        {msg ? (
          <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-bold text-green-300 text-center">
            {msg}
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <input type="password" className={inputCls} placeholder="كلمة السر الجديدة" value={pass} onChange={(e) => setPass(e.target.value)} />
            <input type="password" className={inputCls} placeholder="تأكيد كلمة السر الجديدة" value={pass2} onChange={(e) => setPass2(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
            {err && <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</p>}
            <button onClick={save} disabled={busy || !ready} className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 rounded-xl py-3.5 font-extrabold transition">
              {busy ? "جاري الحفظ..." : !ready ? "جاري التحقق من الرابط..." : "💾 حفظ كلمة السر الجديدة"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}