import React, { useState, useRef } from "react";
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  X,
  Copy,
  Check,
  FileText,
  AlertCircle,
  Table,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { MeterRecord } from "../types";
import {
  saveStoredMeters,
  getMasterExcelMeta,
  saveMasterExcelMeta,
  saveMasterExcelBackup,
  getMasterExcelBackup,
  mergeMetersWithExisting,
} from "../utils/storage";
import { parseCsvToMeters } from "../utils/csvParser";
import {
  parseExcelBuffer,
  exportMetersToExcelFile,
  downloadExcelTemplateFile,
} from "../utils/excelHandler";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  meters: MeterRecord[];
  onMetersUpdated: (meters: MeterRecord[]) => void;
}

export const ExcelSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  meters,
  onMetersUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "paste" | "export">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [previewMeters, setPreviewMeters] = useState<MeterRecord[] | null>(null);
  const [pasteInput, setPasteInput] = useState("");
  const [mergeMode, setMergeMode] = useState<"smart" | "replace">("smart");
  const [currentMeta, setCurrentMeta] = useState(() => getMasterExcelMeta());
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setSyncMessage({ text, type });
    setTimeout(() => setSyncMessage(null), 5000);
  };

  const processFile = (file: File) => {
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    const isCsv = file.name.endsWith(".csv") || file.name.endsWith(".txt");

    if (!isExcel && !isCsv) {
      showNotification("Format file tidak didukung. Harap unggah file .xlsx, .xls, atau .csv", "error");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        let parsedMeters: MeterRecord[] = [];

        if (isExcel) {
          parsedMeters = parseExcelBuffer(buffer);
        } else {
          const decoder = new TextDecoder("utf-8");
          const text = decoder.decode(buffer);
          parsedMeters = parseCsvToMeters(text);
        }

        if (parsedMeters && parsedMeters.length > 0) {
          setPreviewMeters(parsedMeters);
          showNotification(
            `File "${file.name}" berhasil dibaca! Ditemukan ${parsedMeters.length} data pelanggan. Periksa pratinjau di bawah lalu klik Terapkan Data.`,
            "success"
          );
        } else {
          showNotification("Gagal membaca baris data dari file Excel. Pastikan header dan format sesuai.", "error");
        }
      } catch (err: any) {
        showNotification("Terjadi kesalahan saat memproses file Excel: " + err.message, "error");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplyData = () => {
    if (!previewMeters || previewMeters.length === 0) return;

    let finalMeters: MeterRecord[] = previewMeters;
    if (mergeMode === "smart" && meters.length > 0) {
      finalMeters = mergeMetersWithExisting(meters, previewMeters);
    }

    saveStoredMeters(finalMeters);
    saveMasterExcelBackup(finalMeters);

    const metaInfo = {
      fileName: fileName || "Master_Data_Meter_Baguala.xlsx",
      uploadedAt: new Date().toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      totalRecords: finalMeters.length,
      taggedCount: finalMeters.filter((m) => m.latitude && m.longitude && m.latitude !== 0).length,
      source: "upload" as const,
    };
    saveMasterExcelMeta(metaInfo);
    setCurrentMeta(metaInfo);

    onMetersUpdated(finalMeters);
    showNotification(
      `Berhasil menyimpan ${finalMeters.length} data pelanggan Excel ke Master Data GMBL! (Terintegrasi dengan Tagging Peta & kWh Meter)`,
      "success"
    );
    setPreviewMeters(null);
    setFileName(null);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleProcessPasteData = () => {
    if (!pasteInput.trim()) {
      showNotification("Tempelkan data tabel atau baris dari Excel terlebih dahulu.", "error");
      return;
    }

    try {
      const parsedMeters = parseCsvToMeters(pasteInput);
      if (parsedMeters.length > 0) {
        let finalMeters: MeterRecord[] = parsedMeters;
        if (mergeMode === "smart" && meters.length > 0) {
          finalMeters = mergeMetersWithExisting(meters, parsedMeters);
        }

        saveStoredMeters(finalMeters);
        saveMasterExcelBackup(finalMeters);

        const metaInfo = {
          fileName: "Salinan_Tabel_Excel.xlsx",
          uploadedAt: new Date().toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
          totalRecords: finalMeters.length,
          taggedCount: finalMeters.filter((m) => m.latitude && m.longitude && m.latitude !== 0).length,
          source: "paste" as const,
        };
        saveMasterExcelMeta(metaInfo);
        setCurrentMeta(metaInfo);

        onMetersUpdated(finalMeters);
        showNotification(
          `Berhasil memproses & menyimpan ${finalMeters.length} data pelanggan ke Master Data! Koordinat lokasi otomatis terintegrasi.`,
          "success"
        );
        setPasteInput("");
        setTimeout(() => onClose(), 1200);
      } else {
        showNotification("Gagal membaca baris data. Pastikan menyalin tabel berformat Excel.", "error");
      }
    } catch (err: any) {
      showNotification("Error memproses data: " + err.message, "error");
    }
  };

  const handleRestoreBackup = () => {
    const backup = getMasterExcelBackup();
    if (!backup || backup.length === 0) {
      showNotification("Tidak ada cadangan master data Excel sebelumnya.", "error");
      return;
    }

    saveStoredMeters(backup);
    onMetersUpdated(backup);
    showNotification(`Berhasil memulihkan ${backup.length} master data Excel pelanggan!`, "success");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto text-slate-800 dark:text-slate-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-900/90 dark:via-teal-900/80 dark:to-slate-900 text-white border-b border-emerald-500/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 dark:bg-emerald-500/20 border border-white/30 dark:border-emerald-400/30 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 text-white dark:text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Sinkronisasi Data Excel</h3>
              <p className="text-[11px] text-emerald-100 dark:text-emerald-200/80">
                Unggah spreadsheet Excel pelanggan PLN Transaksi Energi Unit Baguala
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-colors cursor-pointer ${
              activeTab === "upload"
                ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah Excel</span>
          </button>

          <button
            onClick={() => setActiveTab("paste")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-colors cursor-pointer ${
              activeTab === "paste"
                ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Salin Baris</span>
          </button>

          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-colors cursor-pointer ${
              activeTab === "export"
                ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh & Ekspor</span>
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[calc(85vh-125px)] scrollbar-thin">
          {/* Master Excel Data Active Info Banner */}
          <div className="bg-slate-50 dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg border border-emerald-300 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">File Master:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-[10px] font-mono font-bold">
                    {currentMeta?.fileName || "Master_Data_Meter_Baguala.xlsx"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Total: <strong className="text-slate-900 dark:text-white">{meters.length} Pelanggan</strong> ({meters.filter((m) => m.latitude && m.longitude && m.latitude !== 0).length} Ter-tagging di Peta).
                </p>
              </div>
            </div>

            <button
              onClick={handleRestoreBackup}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
              title="Pulihkan data dari cadangan master Excel terakhir"
            >
              <RefreshCw className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Restore Backup</span>
            </button>
          </div>

          {/* Merge Mode Selection */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Mode Pengolahan:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMergeMode("smart")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mergeMode === "smart"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-850 border border-slate-250 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Smart Merge (Pertahankan Tagging)
              </button>
              <button
                type="button"
                onClick={() => setMergeMode("replace")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mergeMode === "replace"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-850 border border-slate-250 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Timpa Total
              </button>
            </div>
          </div>

          {/* Notification Message */}
          {syncMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
                syncMessage.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
                  : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/30"
              }`}
            >
              <div className="flex items-center gap-2">
                {syncMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span>{syncMessage.text}</span>
              </div>
              <button
                onClick={() => setSyncMessage(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: UNGGAH FILE EXCEL */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              {/* Dropzone Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                    : "border-slate-300 dark:border-slate-700 hover:border-emerald-500/60 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-950/70"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2.5">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                  Pilih atau Seret File Excel (.xlsx, .xls, .csv)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 max-w-sm mx-auto">
                  Sistem otomatis mendeteksi kolom: <span className="text-slate-800 dark:text-slate-200 font-semibold">ID Pel, NAMA, PNJ, TARIF, DAYA, JENIS, No Meter, Kordinat</span>.
                </p>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors shadow-xs">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Pilih File di Perangkat
                </span>
                {fileName && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 rounded-lg text-xs font-bold">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>File Terpilih: {fileName}</span>
                  </div>
                )}
              </div>

              {/* Format Column Guide */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Format Kolom Master:
                  </span>
                  <button
                    onClick={downloadExcelTemplateFile}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Unduh Format (.xlsx)
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] text-left text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                    <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 uppercase font-mono font-semibold">
                      <tr>
                        <th className="px-2.5 py-1 border-b border-slate-200 dark:border-slate-800">ID Pel</th>
                        <th className="px-2.5 py-1 border-b border-slate-200 dark:border-slate-800">NAMA</th>
                        <th className="px-2.5 py-1 border-b border-slate-200 dark:border-slate-800">PNJ</th>
                        <th className="px-2.5 py-1 border-b border-slate-200 dark:border-slate-800">TARIF</th>
                        <th className="px-2.5 py-1 border-b border-slate-200 dark:border-slate-800">DAYA</th>
                        <th className="px-2.5 py-1 border-b border-slate-200 dark:border-slate-800">JENIS</th>
                        <th className="px-2.5 py-1 border-b border-slate-200 dark:border-slate-800">No Meter</th>
                        <th className="px-2.5 py-1 border-b border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400">Kordinat (Lat,Lng)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                      <tr>
                        <td className="px-2.5 py-1 text-slate-800 dark:text-slate-200 font-bold">411340318513</td>
                        <td className="px-2.5 py-1">LA ***</td>
                        <td className="px-2.5 py-1">BAGUALA</td>
                        <td className="px-2.5 py-1">R1MT</td>
                        <td className="px-2.5 py-1">900</td>
                        <td className="px-2.5 py-1">PRABAYAR</td>
                        <td className="px-2.5 py-1">36000810071</td>
                        <td className="px-2.5 py-1 text-emerald-600 dark:text-emerald-400 font-bold">-3.603704,128.335212</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Preview Table */}
              {previewMeters && previewMeters.length > 0 && (
                <div className="space-y-2.5 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Pratinjau ({previewMeters.length} Pelanggan):
                    </span>
                    <button
                      onClick={handleApplyData}
                      className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors shadow-md flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Terapkan Data
                    </button>
                  </div>

                  <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold sticky top-0">
                        <tr>
                          <th className="px-2.5 py-1.5">#</th>
                          <th className="px-2.5 py-1.5">ID Pel</th>
                          <th className="px-2.5 py-1.5">Nama</th>
                          <th className="px-2.5 py-1.5">PNJ</th>
                          <th className="px-2.5 py-1.5">Tarif/Daya</th>
                          <th className="px-2.5 py-1.5">Koordinat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {previewMeters.slice(0, 15).map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850 font-mono text-[10px]">
                            <td className="px-2.5 py-1 text-slate-400 dark:text-slate-500">{idx + 1}</td>
                            <td className="px-2.5 py-1 font-bold text-slate-800 dark:text-slate-200">{m.idPelanggan}</td>
                            <td className="px-2.5 py-1 text-slate-700 dark:text-slate-300 font-sans">{m.namaPelanggan}</td>
                            <td className="px-2.5 py-1 text-slate-500 dark:text-slate-400 font-sans">{m.pnj}</td>
                            <td className="px-2.5 py-1">{m.tarif} / {m.daya}VA</td>
                            <td className="px-2.5 py-1 text-emerald-600 dark:text-emerald-400">
                              {m.latitude.toFixed(4)}, {m.longitude.toFixed(4)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COPY PASTE TEXT FROM EXCEL */}
          {activeTab === "paste" && (
            <div className="space-y-3">
              <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p>
                  Salin (Ctrl+C) baris data dari Excel Anda, lalu tempelkan (Ctrl+V) ke kotak teks di bawah.
                </p>
              </div>

              <div>
                <textarea
                  rows={6}
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  placeholder="411340318513	LA ***	BAGUALA	R1MT	900	PRABAYAR	36000810071	-3.603704,128.335212"
                  className="w-full p-2.5 font-mono text-xs border border-slate-300 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleProcessPasteData}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 transition-colors shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Proses Tempelan Excel
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: UNDUH & EKSPOR EXCEL */}
          {activeTab === "export" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Export Current Data */}
              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/60 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                    <Download className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Ekspor Data Aktif (.xlsx)</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Unduh seluruh data {meters.length} meter tua ke dalam file Excel.
                  </p>
                </div>
                <button
                  onClick={() => exportMetersToExcelFile(meters)}
                  className="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-500 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh File Excel
                </button>
              </div>

              {/* Download Standard Template */}
              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/60 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-2">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Unduh Format Template</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Template Excel (.xlsx) kosong dengan header standar PLN Baguala.
                  </p>
                </div>
                <button
                  onClick={downloadExcelTemplateFile}
                  className="w-full py-2 bg-sky-600 text-white font-bold text-xs rounded-lg hover:bg-sky-500 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Unduh Template Kosong
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span className="text-[11px]">Format: <strong className="text-slate-700 dark:text-slate-300">.xlsx, .xls, .csv</strong></span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
