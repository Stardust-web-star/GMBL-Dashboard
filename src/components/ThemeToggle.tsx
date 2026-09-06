import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface ThemeToggleProps {
  variant?: "pill" | "button" | "compact";
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = "pill", className = "" }) => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const isDark = theme === "dark";

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`relative p-2 rounded-xl border transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
          isDark
            ? "bg-slate-800/80 border-slate-700/80 text-amber-400 hover:bg-slate-700 hover:text-amber-300 shadow-sm"
            : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-sm"
        } ${className}`}
        title={isDark ? "Ganti ke Mode Normal (Terang)" : "Ganti ke Mode Gelap"}
        aria-label="Ganti Tema"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    );
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
          isDark
            ? "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"
        } ${className}`}
      >
        {isDark ? (
          <>
            <Sun className="h-4 w-4 text-amber-400" />
            <span>Mode Gelap</span>
          </>
        ) : (
          <>
            <Moon className="h-4 w-4 text-slate-600" />
            <span>Mode Normal</span>
          </>
        )}
      </button>
    );
  }

  // Default "pill" segment switch
  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl border transition-all ${
        isDark
          ? "bg-slate-950/80 border-slate-800 text-slate-300"
          : "bg-slate-100 border-slate-200 text-slate-600"
      } ${className}`}
      role="group"
      aria-label="Pilihan Tema Aplikasi"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          !isDark
            ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
            : "text-slate-400 hover:text-slate-200"
        }`}
        title="Aktifkan Mode Normal (Tema Terang)"
      >
        <Sun className={`h-3.5 w-3.5 ${!isDark ? "text-amber-500 fill-amber-500/20" : ""}`} />
        <span className="hidden sm:inline">Normal</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          isDark
            ? "bg-slate-800 text-white shadow-xs border border-slate-700/80"
            : "text-slate-500 hover:text-slate-800"
        }`}
        title="Aktifkan Mode Gelap (Tema Gelap)"
      >
        <Moon className={`h-3.5 w-3.5 ${isDark ? "text-sky-400 fill-sky-400/20" : ""}`} />
        <span className="hidden sm:inline">Gelap</span>
      </button>
    </div>
  );
};
