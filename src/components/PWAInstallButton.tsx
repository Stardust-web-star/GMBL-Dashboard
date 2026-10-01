import React, { useState } from "react";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { Smartphone, Download, Share, PlusSquare, CheckCircle2, X } from "lucide-react";

interface PWAInstallButtonProps {
  variant?: "button" | "banner" | "compact";
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = "button",
  className = "",
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already opened as installed standalone PWA, hide install prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {variant === "compact" ? (
        <button
          onClick={handleInstallClick}
          type="button"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-orange-900/20 transition-all cursor-pointer active:scale-95 ${className}`}
          title="Install Aplikasi ke Layar Utama HP / PC"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0 animate-pulse" />
          <span>Install Aplikasi HP</span>
        </button>
      ) : variant === "banner" ? (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white border border-blue-500/30 shadow-lg ${className}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-md">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white">Akses Cepat Langsung dari HP!</p>
              <p className="text-[11px] text-slate-300">
                Jadikan GMBL sebagai aplikasi Android / Shortcut Layar Utama tanpa perlu download di Play Store.
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            type="button"
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Pasang Pintasan HP</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleInstallClick}
          type="button"
          className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer active:scale-95 ${className}`}
        >
          <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Install App HP</span>
        </button>
      )}

      {/* Guide Modal for iOS & Android Shortcut Creation */}
      {showModal && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-800 dark:text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-md">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Pasang Aplikasi GMBL di HP
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Shortcut resmi Layar Utama Smartphone
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Instructions */}
            {isIOS ? (
              <div className="space-y-3 text-xs leading-relaxed">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Untuk memasang pintasan di <span className="text-amber-600 dark:text-amber-400 font-bold">iPhone / iPad (Safari)</span>:
                </p>
                <ol className="space-y-2.5 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-black text-white">1</span>
                    <span>
                      Ketuk tombol <Share className="inline w-3.5 h-3.5 text-blue-500 mx-1" /> <strong>Bagikan (Share)</strong> di bilah bawah browser Safari.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-black text-white">2</span>
                    <span>
                      Gulir ke bawah dan pilih <PlusSquare className="inline w-3.5 h-3.5 text-slate-600 dark:text-slate-300 mx-1" /> <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-black text-white">3</span>
                    <span>
                      Ketik <strong>Tambah</strong> di sudut kanan atas. Aplikasi GMBL akan langsung muncul di layar HP Anda!
                    </span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-xs leading-relaxed">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Untuk memasang pintasan di <span className="text-amber-600 dark:text-amber-400 font-bold">Android / Chrome</span>:
                </p>
                <ol className="space-y-2.5 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-black text-white">1</span>
                    <span>
                      Ketuk <strong>Titik Tiga (⋮)</strong> di sudut kanan atas browser Google Chrome / Android.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-black text-white">2</span>
                    <span>
                      Pilih <Download className="inline w-3.5 h-3.5 text-blue-500 mx-1" /> <strong>Install Aplikasi</strong> atau <strong>Tambahkan ke Layar Utama</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-black text-white">3</span>
                    <span>
                      Konfirmasi pembuatan shortcut. Aplikasi akan berjalan layaknya aplikasi Android native!
                    </span>
                  </li>
                </ol>
              </div>
            )}

            <div className="mt-5 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-2.5 text-xs font-bold hover:bg-slate-800 dark:hover:bg-white transition-all cursor-pointer"
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
