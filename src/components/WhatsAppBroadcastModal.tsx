import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Send,
  Copy,
  Check,
  MessageSquare,
  Share2,
  Users,
  BarChart3,
  Sparkles,
  Phone,
  ExternalLink,
  FileText,
} from "lucide-react";
import { MeterRecord, PETUGAS_LIST } from "../types";

interface WhatsAppBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  meters?: MeterRecord[];
  aiAnalysis?: string | null;
  initialType?: "ringkasan" | "petugas" | "analisis" | "pelanggan";
  selectedMeter?: MeterRecord | null;
}

export const WhatsAppBroadcastModal: React.FC<WhatsAppBroadcastModalProps> = ({
  isOpen,
  onClose,
  meters = [],
  aiAnalysis,
  initialType = "ringkasan",
  selectedMeter,
}) => {
  const [activeType, setActiveType] = useState<"ringkasan" | "petugas" | "analisis" | "pelanggan">(initialType);
  const [targetPhone, setTargetPhone] = useState("");
  const [copied, setCopied] = useState(false);
  const [customHeaderNote, setCustomHeaderNote] = useState("");

  // Sync activeType whenever modal opens or initialType changes
  useEffect(() => {
    if (isOpen) {
      setActiveType(initialType);
      setCopied(false);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  // Safe meters list
  const safeMeters = Array.isArray(meters) ? meters : [];

  // Calculate stats
  const total = safeMeters.length;
  const selesai = safeMeters.filter((m) => m && m.status === "SELESAI").length;
  const belum = safeMeters.filter((m) => m && m.status === "BELUM").length;
  const prabayar = safeMeters.filter((m) => m && m.jenis === "PRA BAYAR").length;
  const paskabayar = safeMeters.filter((m) => m && m.jenis === "PASKA BAYAR").length;
  const progressPercent = total > 0 ? Math.round((selesai / total) * 100) : 0;

  // Officer breakdown
  const officerStats = (PETUGAS_LIST || []).map((name) => {
    const list = safeMeters.filter(
      (m) => m && m.petugas && String(m.petugas).toUpperCase() === String(name).toUpperCase()
    );
    const countSelesai = list.filter((m) => m && m.status === "SELESAI").length;
    return { name, selesai: countSelesai, total: list.length };
  });

  // Current Date formatting
  const todayStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Generate Message Content based on Active Type
  const broadcastText = () => {
    let text = "";
    const headerPrefix = customHeaderNote.trim() ? `📌 *CATATAN PENTING:* ${customHeaderNote.trim()}\n\n` : "";

    if (activeType === "ringkasan") {
      text = `⚡ *LAPORAN HARIAN GANTI METER TUA (GMBL)*
📍 *PLN ULP BAGUALA - AMBON*
🗓️ Tanggal: ${todayStr}

${headerPrefix}📊 *RINGKASAN CAPAIAN:*
• Total Target Meter Tua: *${total}* pelanggan
• Selesai Diganti: *${selesai}* (${progressPercent}%) ✅
• Belum Diganti: *${belum}* pelanggan ⏳

🔌 *RINCIAN JENIS METER:*
• Prabayar (Token): *${prabayar}*
• Paskabayar (Pasca): *${paskabayar}*

👥 *RINGKASAN PETUGAS LAPANGAN:*
${officerStats.map((o) => `• ${o.name}: *${o.selesai}* selesai`).join("\n")}

Daftar dan tagging lokasi peta lengkap dapat dipantau langsung di Dashboard GMBL.
_Diposting via Sistem GMBL PLN ULP Baguala_ ⚡`;
    } else if (activeType === "petugas") {
      text = `⚡ *REKAPITULASI KINERJA PETUGAS LAPANGAN*
📍 *PLN ULP BAGUALA - GMBL*
🗓️ Tanggal: ${todayStr}

${headerPrefix}👥 *CAPAIAN PER PETUGAS LAPANGAN:*
${officerStats
  .map((o, idx) => {
    const icon = o.selesai > 0 ? "🎯" : "⚪";
    return `${idx + 1}. ${icon} *${o.name}*: ${o.selesai} meter selesai`;
  })
  .join("\n")}

📈 *TOTAL HASIL LAPANGAN:*
• Total Selesai: *${selesai}* / ${total} Meter Tua (${progressPercent}%)
• Sisa Target Keseluruhan: *${belum}* Meter Tua

Tetap utamakan *K3 (Keselamatan & Kesehatan Kerja)* dan pastikan pencatatan Stand Bongkar serta No Meter Baru terinput valid di sistem!
_Sistem Informasi Operasional GMBL PLN Baguala_ ⚡`;
    } else if (activeType === "analisis") {
      const cleanAi =
        typeof aiAnalysis === "string" && aiAnalysis.trim().length > 0
          ? aiAnalysis.replace(/#/g, "").trim()
          : "Belum ada analisis AI yang dijalankan.";
      text = `⚡ *HASIL ANALISIS STRATEGIS & REKOMENDASI AI*
📍 *PLN ULP BAGUALA - GMBL*
🗓️ Tanggal: ${todayStr}

${headerPrefix}🤖 *EVALUASI & REKOMENDASI OPERASIONAL:*
${cleanAi}

📊 *RINGKASAN PROGRES OPERASIONAL:*
• Total Target: *${total}* | Selesai: *${selesai}* (${progressPercent}%)
• Sisa Belum: *${belum}* pelanggan

_Laporan Otomatis dikembangkan oleh AI GMBL PLN Baguala_ ⚡`;
    } else if (activeType === "pelanggan" && selectedMeter) {
      const isSelesai = selectedMeter.status === "SELESAI";
      text = `⚡ *LAPORAN PENGGANTIAN METER PELANGGAN*
📍 *PLN ULP BAGUALA - GMBL*
🗓️ Tanggal: ${todayStr}

${headerPrefix}👤 *DATA PELANGGAN:*
• IDPEL: *${selectedMeter.idPelanggan || "-"}*
• Nama: *${selectedMeter.namaPelanggan || "-"}*
• Alamat: *${selectedMeter.alamat || "-"}*
• Tarif / Daya: *${selectedMeter.tarif || "-"}* / *${selectedMeter.daya || 0} VA*
• Jenis Meter: *${selectedMeter.jenis || "-"}*
• Nomor Meter Lama: *${selectedMeter.noMeterLama || "-"}*
• Tahun Meter: *${selectedMeter.thnMeter || "-"}*

📋 *STATUS PENGGANTIAN:*
• Status: *${isSelesai ? "SELESAI DIGANTI ✅" : "BELUM DIGANTI ⏳"}*
${isSelesai ? `• Stand Bongkar: *${selectedMeter.standBongkar || "0 kWh"}*\n• No Meter Baru: *${selectedMeter.noMeterBaru || "-"}*\n• Petugas Eksekusi: *${selectedMeter.petugas || "-"}*` : ""}

_Informasi Resmi Penggantian Meter Tua PLN ULP Baguala_ ⚡`;
    } else {
      text = `⚡ *LAPORAN GMBL PLN ULP BAGUALA*
Total Target: ${total} | Selesai: ${selesai} (${progressPercent}%) | Sisa: ${belum}`;
    }

    return text;
  };

  const currentMessageText = broadcastText();

  // Clean phone number for WhatsApp link
  const getFormattedPhone = () => {
    let clean = (targetPhone || "").replace(/\D/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.substring(1);
    }
    return clean;
  };

  // Safe Copy handler with fallbacks
  const handleCopy = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(currentMessageText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = currentMessageText;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = currentMessageText;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        alert("Gagal menyalin otomatis. Silakan salin teks dari kotak pratinjau secara manual.");
      }
    }
  };

  // WhatsApp Send Direct URL
  const getWhatsAppUrl = (isWebMode: boolean = false) => {
    const encodedText = encodeURIComponent(currentMessageText);
    const phone = getFormattedPhone();
    if (phone) {
      if (isWebMode) {
        return `https://web.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
      }
      return `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
    } else {
      if (isWebMode) {
        return `https://web.whatsapp.com/send?text=${encodedText}`;
      }
      return `https://api.whatsapp.com/send?text=${encodedText}`;
    }
  };

  const handleOpenWhatsApp = (isWebMode: boolean = false) => {
    try {
      const url = getWhatsAppUrl(isWebMode);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Gagal membuka WhatsApp link:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-emerald-600 dark:bg-emerald-700 px-5 py-4 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Broadcast Laporan WhatsApp</h3>
              <p className="text-xs text-emerald-100">Kirim laporan harian & rekapitulasi GMBL PLN Baguala</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Select Category Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveType("ringkasan")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === "ringkasan"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Ringkasan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveType("petugas")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === "petugas"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Petugas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveType("analisis")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === "analisis"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Analisis AI</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveType("pelanggan")}
              disabled={!selectedMeter}
              title={!selectedMeter ? "Pilih pelanggan dari tabel dulu" : "Laporan Pelanggan"}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === "pelanggan"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Pelanggan</span>
            </button>
          </div>

          {/* Optional Inputs: Target Phone & Custom Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Nomor Tujuan (Opsional):</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: 08123456789 (kosongkan jika grup)"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                *Kosongkan nomor jika ingin broadcast ke Grup WhatsApp.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Tambahan (Opsional):
              </label>
              <input
                type="text"
                placeholder="Contoh: Harap dievaluasi sebelum jam 17:00 WIT"
                value={customHeaderNote}
                onChange={(e) => setCustomHeaderNote(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* WhatsApp Preview Bubble */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Pratinjau Format Pesan WhatsApp:</span>
              </label>
              <span className="text-[10px] text-slate-400">Siap Kirim & Salin</span>
            </div>

            <div className="relative rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 font-mono text-xs text-slate-800 dark:text-emerald-100 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto shadow-inner">
              {currentMessageText}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer active:scale-95"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">Berhasil Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-slate-500" />
                <span>Salin Teks Pesan</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleOpenWhatsApp(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 rounded-xl border border-emerald-600 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer active:scale-95"
            >
              <ExternalLink className="h-4 w-4" />
              <span>WhatsApp Web</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenWhatsApp(false)}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-900/20 hover:bg-emerald-500 dark:hover:bg-emerald-400 transition-all cursor-pointer active:scale-95"
            >
              <Send className="h-4 w-4" />
              <span>Kirim via WA App</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
