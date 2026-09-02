import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff, Shield, KeyRound, Zap, Clock } from "lucide-react";
import { UserAccount } from "../types";
import { getStoredUsers, setCurrentSessionUser } from "../utils/storage";
import { GMBLLogo } from "./GMBLLogo";
import bgInspectionImage from "../assets/images/kwh_inspection_bg_1788312592374.jpg";

interface LoginProps {
  onLoginSuccess: (user: UserAccount) => void;
  logoutNotice?: string | null;
}

export const LoginScreen: React.FC<LoginProps> = ({ onLoginSuccess, logoutNotice }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      const users = getStoredUsers();
      const trimmedEmail = email.trim().toLowerCase();

      // Check default admin or stored users
      const match = users.find((u) => u.email.toLowerCase() === trimmedEmail);

      let isPasswordValid = false;
      if (match) {
        if (match.password) {
          isPasswordValid = password === match.password;
        } else {
          isPasswordValid = password.length >= 4 || password === "admin" || password === "admin123";
        }
      }

      if (
        (trimmedEmail === "fikiilham56@gmail.com" && password === "admin123") ||
        (trimmedEmail === "muhammadnurbella20@gmail.com" && password === "admin") ||
        isPasswordValid
      ) {
        const userToLogin: UserAccount = match || {
          id: trimmedEmail === "muhammadnurbella20@gmail.com" ? "usr-admin-02" : `usr-${Date.now()}`,
          email: trimmedEmail,
          name: trimmedEmail === "muhammadnurbella20@gmail.com" ? "Acho" : "Fiki Ilham (Admin GMBL)",
          role: "super_admin",
          status: "active",
          createdAt: "2026-09-01",
        };

        setCurrentSessionUser(userToLogin);
        onLoginSuccess(userToLogin);
      } else {
        setErrorMsg("Email atau Password tidak sesuai. Silakan periksa kembali.");
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-3 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 overflow-hidden bg-slate-950">
      {/* Background Image of Technicians inspecting kWh meter */}
      <img
        src={bgInspectionImage}
        alt="Petugas PLN Pengecekan kWh Meter"
        className="absolute inset-0 h-full w-full object-cover filter brightness-[0.55] contrast-[1.1] scale-105"
        referrerPolicy="no-referrer"
      />
      {/* Dark Vignette & Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-slate-950/80 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-teal-950/30 mix-blend-overlay" />

      {/* Outer Card Container */}
      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-teal-500/20 bg-slate-900/90 shadow-2xl shadow-black/80 backdrop-blur-md grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        
        {/* Left Column: Dark Teal/Cyan Branding Panel */}
        <div className="relative lg:col-span-5 bg-gradient-to-br from-teal-950 via-teal-900 to-slate-950 p-8 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-teal-800/40">
          {/* Background Subtle Glows */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top PLN Branding Box & GMBL Logo */}
          <div className="relative z-10 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-teal-950/60 backdrop-blur-md border border-teal-500/30 shadow-md">
                {/* PLN Official Yellow Emblem (Yellow Box, Blue Waves & Red Lightning) */}
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-[#FFD700] overflow-hidden p-0.5 shadow-xs border border-yellow-300/80">
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* 3 Blue Waves */}
                    <path d="M 8 32 Q 28 24 50 32 T 92 32" stroke="#0284C7" strokeWidth="7" fill="none" strokeLinecap="round" />
                    <path d="M 8 50 Q 28 42 50 50 T 92 50" stroke="#0284C7" strokeWidth="7" fill="none" strokeLinecap="round" />
                    <path d="M 8 68 Q 28 60 50 68 T 92 68" stroke="#0284C7" strokeWidth="7" fill="none" strokeLinecap="round" />
                    
                    {/* Red Lightning Bolt */}
                    <path
                      d="M 58 6 L 30 52 L 50 52 L 38 94 L 72 44 L 52 44 Z"
                      fill="#DC2626"
                      stroke="#991B1B"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="flex flex-col">
                  <span className="text-cyan-400 font-black text-sm tracking-tight leading-none">
                    PLN
                  </span>
                  <span className="text-[10px] font-bold text-teal-200/90 tracking-wider leading-none mt-1 uppercase">
                    ULP BAGUALA
                  </span>
                </div>
              </div>
            </div>

            {/* GMBL Gear Logo placed directly below PLN ULP BAGUALA */}
            <div className="pt-1">
              <GMBLLogo className="h-20 w-20 sm:h-24 sm:w-24" showGlow={true} />
            </div>

            {/* Middle Content Branding */}
            <div className="space-y-3">
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none drop-shadow-sm">
                  GMBL
                </h1>
                <p className="text-xs font-bold text-teal-300 tracking-wider uppercase">
                  GANTI METER BAGUALA
                </p>
              </div>

              <p className="text-xs text-teal-100/75 leading-relaxed font-normal pt-2 border-t border-teal-800/40">
                Sistem Terpadu Monitoring & Rekap kWh Meter Tua <span className="whitespace-nowrap">ULP Baguala.</span> Terintegrasi langsung dengan database <span className="whitespace-nowrap">METER BAGUALA GEMILANG.</span>
              </p>
            </div>
          </div>

          {/* Left Panel Footer decoration */}
          <div className="relative z-10 pt-4 border-t border-teal-800/30 flex items-center justify-between text-[10px] text-teal-300/60 font-mono">
            <span>PLN JTC Transaksi Energi</span>
            <span>2026 Edition</span>
          </div>
        </div>

        {/* Right Column: Clean Login Form */}
        <div className="relative lg:col-span-7 bg-white p-6 sm:p-10 flex flex-col justify-between">
          
          {/* Header Row */}
          <div>
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Login Sistem GMBL
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Silakan masukkan akun terdaftar Anda
                </p>
              </div>

              {/* Secure Portal Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-300/70 text-emerald-700 text-xs font-bold shadow-2xs shrink-0">
                <Shield className="h-3.5 w-3.5 text-emerald-600" />
                <span>Secure Portal</span>
              </div>
            </div>

            {/* Inactivity Logout Notification */}
            {logoutNotice && (
              <div className="mt-4 rounded-xl border border-amber-300/80 bg-amber-50/90 p-3.5 text-xs text-amber-900 font-medium flex items-center gap-2.5 shadow-2xs animate-in fade-in duration-200">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>{logoutNotice}</span>
              </div>
            )}

            {/* Error Notification */}
            {errorMsg && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600 font-semibold text-center animate-in fade-in duration-200">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email / User ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan Email / NIP..."
                    className="w-full text-xs p-3 pl-10 border border-slate-200 rounded-xl bg-slate-50/70 text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:border-transparent transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert("Silakan hubungi Super Admin untuk reset password.")}
                    className="text-xs font-bold text-cyan-600 hover:text-cyan-700 transition-colors"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full text-xs p-3 pl-10 pr-10 border border-slate-200 rounded-xl bg-slate-50/70 text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:border-transparent transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 hover:from-cyan-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-[0.99]"
              >
                <KeyRound className="h-4 w-4" />
                <span>{loading ? "Memverifikasi..." : "Masuk ke Dashboard GMBL"}</span>
              </button>
            </form>
          </div>

          {/* Footer Info Row */}
          <div className="pt-8 mt-6 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-500">
            <div className="flex items-center gap-1.5 text-teal-700 font-semibold">
              <Shield className="h-3.5 w-3.5 text-teal-600" />
              <span>Info Enkripsi Terproteksi</span>
            </div>
            <span className="font-mono text-slate-400">v3.0.2 • 2026</span>
          </div>

        </div>

      </div>
    </div>
  );
};

