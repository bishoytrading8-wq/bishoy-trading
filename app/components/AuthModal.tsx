"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { WHATSAPP_LINK } from "../products-data";

const GOVS = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "الشرقية", "القليوبية",
  "كفر الشيخ", "الغربية", "المنوفية", "البحيرة", "الإسماعيلية", "بورسعيد",
  "السويس", "المنيا", "بني سويف", "الفيوم", "أسيوط", "سوهاج", "قنا",
  "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح",
  "شمال سيناء", "جنوب سيناء", "دمياط",
];

const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-orange-500/70 focus:bg-white/10 transition";

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.27A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.55.38-2.27v-3.1H1.29a12 12 0 0 0 0 10.74l3.98-3.1z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.63l3.98 3.1C6.22 6.88 8.87 4.77 12 4.77z" />
    </svg>
  );
}

export default function AuthModal({ open, initialMode = "login", onClose }: {
  open: boolean;
  initialMode?: "login" | "register";
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [gov, setGov] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regPass2, setRegPass2] = useState("");

  useEffect(() => {
    if (open) { setMode(initialMode); setErr(""); setOk(""); }
  }, [open, initialMode]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const errAr = (m: string) => {
    const s = m.toLowerCase();
    if (s.includes("invalid login")) return "الإيميل أو كلمة السر مش صح ✗";
    if (s.includes("not confirmed")) return "فعّل إيميلك من رسالة التأكيد وبعدين سجّل الدخول";
    if (s.includes("already registered")) return "الإيميل ده مسجل قبل كده — سجّل الدخول مباشرة";
    if (s.includes("rate limit")) return "محاولات كتير — استنى دقيقة وجرّب تاني";
    if (s.includes("signups not allowed")) return "التسجيل مقفول مؤقتًا — كلمنا واتساب وهنظبطها لك";
    return m || "حصل خطأ غير متوقع — جرّب تاني";
  };

  // 📧 استرجاع كلمة السر — بنبعت لينك على إيميله
  const doReset = async () => {
    setErr(""); setOk("");
    if (!email.trim() || !email.includes("@")) { setErr("اكتب إيميلك في الخانة فوق وبعدين دوس نسيت كلمة السر"); return; }
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + "/reset-password" });
    setResetting(false);
    if (error) { setErr("حصل خطأ — اتأكد إن الإيميل مكتوب صح"); return; }
    setOk("✓ بعتنا لينك تغيير كلمة السر على إيميلك — افتحه واتبع التعليمات 📬");
  };

  const doLogin = async () => {
    setErr(""); setOk("");
    if (!email.trim() || !pass) { setErr("اكتب الإيميل وكلمة السر الأول"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    setBusy(false);
    if (error) { setErr(errAr(error.message)); return; }
    onClose();
  };

  const doRegister = async () => {
    setErr(""); setOk("");
    if (!first.trim() || !last.trim()) { setErr("اكتب اسمك الأول واسم العيلة"); return; }
    if (!/^01[0-9]{9}$/.test(phone)) { setErr("رقم التليفون لازم 11 رقم ويبدأ بـ 01"); return; }
    if (!gov) { setErr("اختار محافظتك"); return; }
    if (!regEmail.includes("@")) { setErr("اكتب إيميل صحيح"); return; }
    if (regPass.length < 6) { setErr("كلمة السر لازم 6 حروف على الأقل"); return; }
    if (regPass !== regPass2) { setErr("كلمة السر وتأكيدها مش زي بعض"); return; }

    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: regEmail.trim(),
      password: regPass,
      options: {
        data: {
          first_name: first.trim(),
          last_name: last.trim(),
          phone,
          whatsapp: whatsapp || phone,
          governorate: gov,
        },
      },
    });
    setBusy(false);
    if (error) { setErr(errAr(error.message)); return; }
    setMode("login");
    setEmail(regEmail.trim());
    setOk("✓ اتعمل حسابك بنجاح — سجّل دخول دلوقتي");
    setFirst(""); setLast(""); setPhone(""); setWhatsapp("");
    setGov(""); setRegEmail(""); setRegPass(""); setRegPass2("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-3xl bg-[#101a30] border border-white/10 p-7 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="إغلاق" className="absolute top-4 left-4 w-8 h-8 grid place-items-center rounded-full bg-white/5 hover:bg-white/10 text-white/60">✕</button>

        {mode === "login" ? (
          <>
            <h2 className="text-2xl font-black text-center">تسجيل الدخول</h2>
            <p className="text-center text-xs text-white/50 mt-2">لمعرفة سعر المنتجات يرجى تسجيل الدخول</p>
            {ok && <p className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-bold text-green-300 text-center">{ok}</p>}
            <div className="mt-5 space-y-3">
              <input type="email" dir="ltr" className={inputCls} placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" className={inputCls} placeholder="كلمة السر" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} />
              {err && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</p>
                  <a href={WHATSAPP_LINK("مساعدة: عندي مشكلة في الدخول لحسابي")} target="_blank" className="block text-center text-[11px] font-bold text-green-400 hover:underline">محتاج مساعدة؟ كلمنا واتساب 💬</a>
                </div>
              )}
              <button onClick={doLogin} disabled={busy} className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 rounded-xl py-3.5 font-extrabold transition flex items-center justify-center gap-2">
                {busy && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                {busy ? "جاري الدخول..." : "دخول"}
              </button>
            </div>
            <button onClick={() => { setMode("register"); setErr(""); setOk(""); }} className="block mx-auto mt-4 text-xs text-orange-400 font-bold hover:underline">
              أول مرة معانا؟ اعمل حسابك مجانًا
            </button>
            <button onClick={doReset} disabled={resetting} className="block mx-auto mt-2 text-xs text-white/50 hover:text-white/80 font-bold hover:underline transition">
              {resetting ? "جاري الإرسال..." : "نسيت كلمة السر؟ 📧"}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-black text-center">حساب جديد</h2>
            <p className="text-center text-xs text-white/50 mt-2">بياناتك عندنا في أمان — ونتواصل معاك بأحسن سعر 🤝</p>
            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} placeholder="الاسم الأول" value={first} onChange={(e) => setFirst(e.target.value)} />
                <input className={inputCls} placeholder="اسم العيلة" value={last} onChange={(e) => setLast(e.target.value)} />
              </div>
              <input inputMode="numeric" className={inputCls} placeholder="رقم التليفون (11 رقم — يبدأ بـ 01)" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} />
              <input inputMode="numeric" className={inputCls} placeholder="رقم واتساب — لو مختلف (اختياري)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 11))} />
              <select className={inputCls} value={gov} onChange={(e) => setGov(e.target.value)}>
                <option value="" className="bg-[#101a30]">اختار محافظتك</option>
                {GOVS.map((g) => <option key={g} value={g} className="bg-[#101a30]">{g}</option>)}
              </select>
              <input type="email" dir="ltr" className={inputCls} placeholder="البريد الإلكتروني" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input type="password" className={inputCls} placeholder="كلمة السر" value={regPass} onChange={(e) => setRegPass(e.target.value)} />
                <input type="password" className={inputCls} placeholder="تأكيد كلمة السر" value={regPass2} onChange={(e) => setRegPass2(e.target.value)} />
              </div>
              {err && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</p>
                  <a href={WHATSAPP_LINK("مساعدة: عندي مشكلة في إنشاء الحساب")} target="_blank" className="block text-center text-[11px] font-bold text-green-400 hover:underline">محتاج مساعدة؟ كلمنا واتساب 💬</a>
                </div>
              )}
              <button onClick={doRegister} disabled={busy} className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 rounded-xl py-3.5 font-extrabold transition flex items-center justify-center gap-2">
                {busy && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                {busy ? "جاري الإنشاء..." : "إنشاء الحساب ✨"}
              </button>
            </div>
            <button onClick={() => { setMode("login"); setErr(""); setOk(""); }} className="block mx-auto mt-4 text-xs text-white/60 font-bold hover:underline">
              عندي حساب بالفعل — تسجيل الدخول
            </button>
          </>
        )}

        <div className="flex items-center gap-3 my-5">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/40">أو</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <button disabled className="w-full rounded-xl bg-white text-[#1f2937] py-3 font-extrabold text-sm flex items-center justify-center gap-3 opacity-60 cursor-not-allowed">
          <GoogleG /> الدخول بحساب جوجل
          <span className="text-[10px] bg-gray-200 text-gray-600 rounded-full px-2 py-0.5 font-bold">قريبًا</span>
        </button>
      </div>
    </div>
  );
}