import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GMBLLogo } from "./GMBLLogo";
import {
  MapPin,
  Table,
  PlusCircle,
  BarChart3,
  FileText,
  Users,
  LogOut,
  FileSpreadsheet,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Cloud,
  RefreshCw,
} from "lucide-react";
import { UserAccount } from "../types";

export type MenuTab =
  | "peta"
  | "data"
  | "input"
  | "informasi"
  | "dokumen"
  | "users";

interface NavbarProps {
  activeTab: MenuTab;
  setActiveTab: (tab: MenuTab) => void;
  currentUser: UserAccount;
  onLogout: () => void;
  onOpenSheetSync: () => void;
  pendingCount: number;
  completedCount: number;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenSheetSync,
  pendingCount,
  completedCount,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isPetugas = currentUser.role === "petugas";

  const allMenuItems = [
    {
      id: "peta" as MenuTab,
      label: "Peta Lokasi Tua",
      icon: MapPin,
      badge: isPetugas ? "HANYA PETA" : null,
      badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    },
    {
      id: "data" as MenuTab,
      label: "Data Meter Tua",
      icon: Table,
      badge: `${completedCount}/${completedCount + pendingCount}`,
      badgeColor: "bg-blue-600/30 text-blue-300 border border-blue-500/40",
    },
    {
      id: "input" as MenuTab,
      label: "Input Ganti Meter",
      icon: PlusCircle,
      badge: null,
    },
    {
      id: "informasi" as MenuTab,
      label: "Informasi & Analisa",
      icon: BarChart3,
      badge: "AI",
      badgeColor: "bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black animate-pulse shadow-sm shadow-indigo-500/50",
    },
    {
      id: "dokumen" as MenuTab,
      label: "Dokumen & Surat",
      icon: FileText,
      badge: null,
    },
    {
      id: "users" as MenuTab,
      label: "User Management",
      icon: Users,
      badge: currentUser.role === "super_admin" ? "SUPER" : null,
      badgeColor: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
    },
  ];

  const menuItems = isPetugas
    ? allMenuItems.filter((item) => item.id === "peta")
    : allMenuItems;

  return (
    <>
      {/* Mobile Slide-Over Drawer Navigation (z-[3000] to sit above all map layers and modals) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[3000] lg:hidden flex">
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
              aria-label="Tutup Menu"
            />

            {/* Slide-In Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="relative z-10 w-80 max-w-[85vw] h-full flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 shadow-2xl shadow-slate-950/90 backdrop-blur-2xl select-none"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-900/90">
                <div className="flex items-center gap-3 min-w-0">
                  <GMBLLogo size="md" showGlow={true} />
                  <div className="flex flex-col truncate">
                    <span className="text-white font-extrabold leading-none tracking-tight text-base flex items-center gap-1.5">
                      GMBL <Sparkles className="h-3.5 w-3.5 text-amber-400 inline" />
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold truncate">
                      Ganti Meter Baguala
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer active:scale-95"
                  aria-label="Tutup Menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Nav Items */}
              <nav className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-none">
                <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Menu Utama
                </div>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`relative w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all text-xs font-bold text-left cursor-pointer active:scale-98 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                      }`}
                    >
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center ${isActive ? "text-white" : "text-slate-400"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            item.badgeColor || (isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-300")
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Drawer Bottom Actions & User Profile */}
              <div className="p-3 border-t border-slate-800/80 space-y-2 shrink-0 bg-slate-900/90">
                {!isPetugas && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenSheetSync();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 to-teal-950/80 text-emerald-300 text-xs font-bold hover:border-emerald-400 shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unggah / Sync Excel</span>
                  </button>
                )}

                <div className="flex items-center justify-between bg-slate-800/90 p-2.5 rounded-2xl border border-slate-700/80 shadow-inner">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div
                      className={`relative flex h-8 w-8 rounded-xl items-center justify-center text-xs font-black text-white uppercase shrink-0 shadow-md ${
                        isPetugas
                          ? "bg-gradient-to-tr from-amber-500 to-orange-600"
                          : "bg-gradient-to-tr from-sky-500 to-blue-600"
                      }`}
                    >
                      {currentUser.email.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-white text-xs font-bold truncate flex items-center gap-1">
                        {currentUser.name}
                        {currentUser.role === "super_admin" && (
                          <ShieldCheck className="h-3.5 w-3.5 text-purple-400 shrink-0 inline" />
                        )}
                      </span>
                      <span className="text-slate-400 text-[10px] truncate font-medium">
                        {currentUser.role === "super_admin"
                          ? "Super Admin"
                          : currentUser.role === "petugas"
                          ? "Petugas Lapangan"
                          : "Admin Operasional"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onLogout}
                    className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-xl transition-colors cursor-pointer"
                    title="Keluar / Logout"
                    aria-label="Keluar"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Collapsible Floating Sidebar Container (Hidden on mobile) */}
      <aside className="hidden lg:flex relative z-30 shrink-0 p-4 pr-0">
        <motion.div
          animate={{
            width: isCollapsed ? "80px" : "268px",
          }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col h-[calc(100vh-2rem)] bg-slate-900/95 text-slate-300 border border-slate-800/80 rounded-3xl shadow-2xl shadow-slate-950/50 backdrop-blur-xl transition-all overflow-visible"
        >
          {/* Header & Logo */}
          <div
            className={`border-b border-slate-800/80 flex items-center shrink-0 transition-all ${
              isCollapsed ? "p-3 justify-center relative" : "p-4 justify-between"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <GMBLLogo size="md" showGlow={true} />
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col truncate"
                >
                  <span className="text-white font-extrabold leading-none tracking-tight text-lg flex items-center gap-1.5">
                    GMBL <Sparkles className="h-3.5 w-3.5 text-amber-400 inline" />
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold truncate">
                    Ganti Meter Baguala
                  </span>
                </motion.div>
              )}
            </div>

            {/* Desktop Floating Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 border shadow-xs transition-all ${
                isCollapsed
                  ? "absolute -right-3 top-4 h-6 w-6 z-50 rounded-full border-blue-400/60 bg-blue-600 text-white shadow-md hover:bg-blue-500 hover:scale-110"
                  : "h-7 w-7 rounded-xl bg-slate-800/80 border-slate-700/60"
              }`}
              title={isCollapsed ? "Buka Sidebar" : "Ciutkan Sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-none">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                  }}
                  className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-xs font-bold text-left group ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {/* Sliding Active Pill Background */}
                  {isActive && (
                    <motion.div
                      layoutId="activeFloatingPill"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/30 border border-blue-400/40"
                    />
                  )}

                  {/* Icon */}
                  <div
                    className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center transition-transform group-hover:scale-110 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Label & Badge */}
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="relative z-10 flex-1 flex items-center justify-between truncate"
                    >
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            item.badgeColor || (isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-300")
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </motion.div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Floating Card & User Profile */}
          <div className="p-3 border-t border-slate-800/80 space-y-2 shrink-0">
            {/* Excel Sync Trigger (Hidden for Petugas GM since access is strictly limited to map) */}
            {!isPetugas && (
              <button
                onClick={onOpenSheetSync}
                className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 to-teal-950/80 text-emerald-300 text-xs font-bold hover:from-emerald-900/90 hover:to-teal-900/90 hover:border-emerald-400 shadow-md transition-all group ${
                  isCollapsed ? "px-2" : ""
                }`}
                title="Unggah / Sync Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                {!isCollapsed && <span>Unggah / Sync Excel</span>}
              </button>
            )}

            {/* User Profile Floating Card */}
            <div
              className={`flex items-center justify-between bg-slate-800/90 p-2.5 rounded-2xl border border-slate-700/80 shadow-inner ${
                isCollapsed ? "flex-col gap-2" : ""
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div
                  className={`relative flex h-8 w-8 rounded-xl items-center justify-center text-xs font-black text-white uppercase shrink-0 shadow-md ${
                    isPetugas
                      ? "bg-gradient-to-tr from-amber-500 to-orange-600"
                      : "bg-gradient-to-tr from-sky-500 to-blue-600"
                  }`}
                >
                  {currentUser.email.substring(0, 2).toUpperCase()}
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-white text-xs font-bold truncate flex items-center gap-1">
                      {currentUser.name}
                      {currentUser.role === "super_admin" && (
                        <ShieldCheck className="h-3.5 w-3.5 text-purple-400 shrink-0 inline" />
                      )}
                    </span>
                    <span className="text-slate-400 text-[10px] truncate font-medium">
                      {currentUser.role === "super_admin"
                        ? "Super Admin"
                        : currentUser.role === "petugas"
                        ? "Petugas Lapangan"
                        : "Admin Operasional"}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-xl transition-colors cursor-pointer"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </aside>
      {/* Mobile Bottom Navigation Dock (Visible on handphones < lg when multiple tabs exist and not on full-screen peta view) */}
      {menuItems.length > 1 && activeTab !== "peta" && (
        <div className="fixed bottom-3 inset-x-3 z-40 lg:hidden flex items-center justify-around bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl rounded-2xl p-2 shadow-2xl shadow-slate-950/80">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
                  isActive ? "text-blue-400 font-extrabold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeMobileBottomPill"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute inset-0 bg-blue-600/20 border border-blue-500/30 rounded-xl"
                  />
                )}
                <Icon className={`h-5 w-5 z-10 transition-transform ${isActive ? "scale-110 text-blue-400" : "text-slate-400"}`} />
                <span className="text-[9px] z-10 mt-1 font-semibold truncate max-w-[52px] leading-none">
                  {item.label.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};

export const TopHeader: React.FC<{
  activeTab: MenuTab;
  onOpenMobileMenu: () => void;
  currentUser?: UserAccount;
  isSyncing?: boolean;
  lastSyncTime?: string;
  onManualSync?: () => void;
}> = ({
  activeTab,
  onOpenMobileMenu,
  currentUser,
  isSyncing = false,
  lastSyncTime,
  onManualSync,
}) => {
  const titles: Record<MenuTab, string> = {
    peta: "1. Peta Lokasi Meter Tua",
    data: "2. Data Meter Tua",
    input: "3. Input Data Ganti Meter",
    informasi: "4. Informasi & AI Analytics",
    dokumen: "5. Dokumen & Surat PK",
    users: "6. Management User Admin",
  };

  const todayDateStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-8 shrink-0 z-30 shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenMobileMenu();
          }}
          className="p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl lg:hidden transition-colors cursor-pointer active:scale-95"
          aria-label="Buka Menu Navigasi"
          title="Buka Menu Navigasi"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex flex-col truncate">
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              <motion.h1
                key={activeTab}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate"
              >
                {titles[activeTab] || "Dashboard Monitoring"}
              </motion.h1>
            </AnimatePresence>
            {currentUser?.role === "petugas" && (
              <span className="hidden sm:inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                Akses Terbatas: Peta Lokasi
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold truncate">
            JTC Transaksi Energi • PLN Unit Baguala
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium shrink-0">
        {/* Firestore Real-Time Sync Indicator */}
        <button
          onClick={onManualSync}
          title="Klik untuk sinkronisasi paksa antara Google AI Studio & Vercel"
          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-full flex items-center gap-2 font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">Cloud Firestore Synced</span>
          <span className="sm:hidden">Synced</span>
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? "animate-spin" : ""}`} />
        </button>

        {lastSyncTime && (
          <span className="text-[10px] text-slate-400 hidden xl:inline-block font-mono">
            {lastSyncTime}
          </span>
        )}

        <span className="text-slate-500 font-mono font-semibold hidden md:inline-block bg-slate-100 px-3 py-1 rounded-xl border border-slate-200/60">
          {todayDateStr}
        </span>
      </div>
    </header>
  );
};



