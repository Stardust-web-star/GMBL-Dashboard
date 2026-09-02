import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Cloud,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  FileCode,
  Copy,
  Check,
  Smartphone,
  Globe,
  Share2,
  Lock,
} from "lucide-react";
import { MeterRecord } from "../types";
import {
  getSyncCode,
  setSyncCode,
  pushToCloud,
  pullFromCloud,
  exportSyncFile,
  importSyncFile,
  extractModifiedMeters,
} from "../utils/cloudSync";

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  meters: MeterRecord[];
  onMetersUpdated: (meters: MeterRecord[]) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  meters,
  onMetersUpdated,
}) => {
  const [syncCode, setLocalSyncCode] = useState(getSyncCode());
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const completedCount = meters.filter((m) => m.status === "SELESAI").length;
  const modifiedList = extractModifiedMeters(meters);

  useEffect(() => {
    if (isOpen) {
      setLocalSyncCode(getSyncCode());
    }
  }, [isOpen]);

  const handlePullCloud = async () => {
    setIsSyncing(true);
    setStatusMessage({ type: "info", text: "Menghubungkan ke Cloud Sync PLN Baguala..." });

    try {
      const res = await pullFromCloud(meters);
      if (res.success) {
        onMetersUpdated(res.updatedMeters);
        setLastSyncTime(new Date().toLocaleTimeString("id-ID"));
        setStatusMessage({
          type: "success",
          text: `${res.message} (Total Selesai di Cloud: ${res.cloudCompletedCount} meter)`,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.message,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: `Gagal menarik data: ${err.message}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushCloud = async () => {
    setIsSyncing(true);
    setStatusMessage({ type: "info", text: "Mengunggah data progres lokal ke Cloud..." });

    try {
      const res = await pushToCloud(meters);
      if (res.success) {
        setLastSyncTime(new Date().toLocaleTimeString("id-ID"));
        setStatusMessage({
          type: "success",
          text: `Berhasil diunggah ke Cloud! Progres ${res.completedCount} meter selesai kini tersinkronisasi.`,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.message,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: `Gagal mengunggah ke Cloud: ${err.message}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportFile = () => {
    const jsonStr = exportSyncFile(meters);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GMBL_Sync_Backup_${new Date().toISOString().split("T")[0]}_${completedCount}Selesai.gmblsync`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatusMessage({
      type: "success",
      text: "File cadangan sinkronisasi (.gmblsync) berhasil diunduh!",
    });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const res = importSyncFile(content, meters);
        if (res.success) {
          onMetersUpdated(res.merged);
          setStatusMessage({
            type: "success",
            text: res.message,
          });
        } else {
          setStatusMessage({
            type: "error",
            text: res.message,
          });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveSyncCode = () => {
    setSyncCode(syncCode);
    setStatusMessage({
      type: "success",
      text: "Kode sinkronisasi berhasil disimpan.",
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden text-slate-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-6 py-5 text-white">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40">
                <Cloud className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                  Cloud Live Sync Multi-Device
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                    Real-Time
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Sinkronisasi data otomatis antara Google AI Studio, Vercel & Petugas Lapangan
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[calc(85vh-120px)] overflow-y-auto">
            {/* Status Alert */}
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                  statusMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : statusMessage.type === "error"
                    ? "bg-rose-50 text-rose-800 border border-rose-200"
                    : "bg-blue-50 text-blue-800 border border-blue-200"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : statusMessage.type === "error" ? (
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                ) : (
                  <RefreshCw className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
                )}
                <span className="flex-1">{statusMessage.text}</span>
              </motion.div>
            )}

            {/* Visual Sync Hub Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-bold mb-1">
                  <Globe className="h-4 w-4 text-indigo-600" />
                  <span>Google AI Studio / Vercel</span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-2xl font-black text-slate-900">{completedCount}</span>
                  <span className="text-[11px] text-slate-500">/ {meters.length} SELESAI</span>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 font-medium">
                  {modifiedList.length} data dimodifikasi
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-blue-800 text-xs font-bold mb-1">
                  <Smartphone className="h-4 w-4 text-blue-600" />
                  <span>Live Cloud Sync Status</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700">Aktif & Terhubung</span>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 font-medium">
                  {lastSyncTime ? `Sinkron terakhir: ${lastSyncTime}` : "Auto-sync berjalan tiap pembaruan"}
                </div>
              </div>
            </div>

            {/* Quick Sync Action Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                <Share2 className="h-3.5 w-3.5 text-blue-600" />
                Aksi Sinkronisasi Cepat (AI Studio ⇄ Vercel)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={handlePullCloud}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50/80 px-4 py-3 text-xs font-bold text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-all disabled:opacity-50 shadow-xs"
                >
                  <DownloadCloud className={`h-4 w-4 text-indigo-600 ${isSyncing ? "animate-bounce" : ""}`} />
                  <span>Tarik Data dari Cloud (Pull)</span>
                </button>

                <button
                  onClick={handlePushCloud}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-bold text-white hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shadow-blue-500/20"
                >
                  <UploadCloud className={`h-4 w-4 ${isSyncing ? "animate-bounce" : ""}`} />
                  <span>Kirim Data Lokal ke Cloud (Push)</span>
                </button>
              </div>
            </div>

            {/* Sync Code Section */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  Kode Sinkronisasi Room GMBL
                </label>
                <span className="text-[10px] text-slate-400">Harus sama di semua browser/HP</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={syncCode}
                  onChange={(e) => setLocalSyncCode(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Kode Sinkronisasi"
                />
                <button
                  onClick={handleCopyCode}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1 transition-colors"
                  title="Salin Kode"
                >
                  {copiedCode ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-500" />
                  )}
                  <span>{copiedCode ? "Disalin" : "Salin"}</span>
                </button>
                <button
                  onClick={handleSaveSyncCode}
                  className="rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-900 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </div>

            {/* Offline File Backup Export/Import */}
            <div className="border-t border-slate-200 pt-4 space-y-2">
              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-amber-600" />
                Cadangan File Sinkronisasi Mandiri (.gmblsync)
              </label>
              <p className="text-[11px] text-slate-500">
                Gunakan file ini jika Anda ingin mentransfer data progres antar laptop/HP secara offline via WhatsApp atau Flashdisk:
              </p>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  onClick={handleExportFile}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs"
                >
                  <DownloadCloud className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Unduh File (.gmblsync)</span>
                </button>

                <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 cursor-pointer transition-all shadow-2xs">
                  <UploadCloud className="h-3.5 w-3.5 text-blue-600" />
                  <span>Impor File (.gmblsync)</span>
                  <input
                    type="file"
                    accept=".gmblsync,.json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Auto-Sync aktif otomatis tiap pembaruan status</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
