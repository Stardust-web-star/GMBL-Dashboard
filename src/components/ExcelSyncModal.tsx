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
} from "lucide-react";
import { MeterRecord } from "../types";
import { saveStoredMeters } from "../utils/storage";
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

    saveStoredMeters(previewMeters);
    onMetersUpdated(previewMeters);
    showNotification(`Berhasil memperbarui ${previewMeters.length} data pelanggan ke master data GMBL!`, "success");
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
        saveStoredMeters(parsedMeters);
        onMetersUpdated(parsedMeters);
        showNotification(
          `Berhasil memproses ${parsedMeters.length} data pelanggan! Koordinat lokasi otomatis diproyeksikan presisi pada peta satelit Baguala.`,
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md">
              <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Sinkronisasi Data Excel (.xlsx / .csv)</h3>
              <p className="text-xs text-emerald-100">
                Unggah spreadsheet Excel pelanggan PLN Transaksi Energi Unit Baguala
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-colors ${
              activeTab === "upload"
                ? "bg-white border-slate-200 text-emerald-700 shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Unggah File Excel</span>
          </button>

          <button
            onClick={() => setActiveTab("paste")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-colors ${
              activeTab === "paste"
                ? "bg-white border-slate-200 text-emerald-700 shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Salin & Tempel Baris</span>
          </button>

          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-colors ${
              activeTab === "export"
                ? "bg-white border-slate-200 text-emerald-700 shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Unduh & Ekspor</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Notification Message */}
          {syncMessage && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
                syncMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {syncMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{syncMessage.text}</span>
              </div>
              <button
                onClick={() => setSyncMessage(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: UNGGAH FILE EXCEL */}
          {activeTab === "upload" && (
            <div className="space-y-6">
              {/* Dropzone Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50/50 scale-[1.01]"
                    : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-800 mb-1">
                  Pilih atau Seret File Excel (.xlsx, .xls, .csv)
                </h4>
                <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
                  Unggah file Excel daftar pelanggan PLN. Sistem akan otomatis mendeteksi kolom{" "}
                  <strong className="text-slate-700">ID Pel, NAMA, PNJ, TARIF, DAYA, JENIS, No Meter, Latitude, Longitude</strong>.
                </p>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm">
                  <FileSpreadsheet className="w-4 h-4" />
                  Cari File di Komputer
                </span>
                {fileName && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>File Terpilih: {fileName}</span>
                  </div>
                )}
              </div>

              {/* Format Column Guide */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-emerald-600" />
                    Format Kolom Excel yang Didukung:
                  </span>
                  <button
                    onClick={downloadExcelTemplateFile}
                    className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Contoh Format (.xlsx)
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left text-slate-600 border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-mono font-semibold">
                      <tr>
                        <th className="px-3 py-1.5 border-b">ID Pel</th>
                        <th className="px-3 py-1.5 border-b">NAMA</th>
                        <th className="px-3 py-1.5 border-b">PNJ</th>
                        <th className="px-3 py-1.5 border-b">TARIF</th>
                        <th className="px-3 py-1.5 border-b">DAYA</th>
                        <th className="px-3 py-1.5 border-b">JENIS</th>
                        <th className="px-3 py-1.5 border-b">No Meter</th>
                        <th className="px-3 py-1.5 border-b">Latitude</th>
                        <th className="px-3 py-1.5 border-b">Longitude</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      <tr>
                        <td className="px-3 py-1 text-slate-900 font-bold">411340318513</td>
                        <td className="px-3 py-1">LA ***</td>
                        <td className="px-3 py-1">***ON MAN*** DEPAN ***</td>
                        <td className="px-3 py-1">R1MT</td>
                        <td className="px-3 py-1">900</td>
                        <td className="px-3 py-1">PRABAYAR</td>
                        <td className="px-3 py-1">36000810071</td>
                        <td className="px-3 py-1 text-emerald-700">-3.60370479</td>
                        <td className="px-3 py-1 text-emerald-700">128.3352123</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Preview Table */}
              {previewMeters && previewMeters.length > 0 && (
                <div className="space-y-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Pratinjau Hasil Impor Excel ({previewMeters.length} Pelanggan Baru):
                    </span>
                    <button
                      onClick={handleApplyData}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Terapkan Data ke Master
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-emerald-200 rounded-lg bg-white">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-emerald-100 text-emerald-900 font-bold sticky top-0">
                        <tr>
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">ID Pelanggan</th>
                          <th className="px-3 py-2">Nama</th>
                          <th className="px-3 py-2">PNJ / Lokasi</th>
                          <th className="px-3 py-2">Tarif/Daya</th>
                          <th className="px-3 py-2">No Meter</th>
                          <th className="px-3 py-2">Koordinat (Lat, Lng)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewMeters.slice(0, 20).map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 font-mono text-[11px]">
                            <td className="px-3 py-1.5 text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-1.5 font-bold text-slate-900">{m.idPelanggan}</td>
                            <td className="px-3 py-1.5 text-slate-700 font-sans">{m.namaPelanggan}</td>
                            <td className="px-3 py-1.5 text-slate-600 font-sans">{m.pnj}</td>
                            <td className="px-3 py-1.5">{m.tarif} / {m.daya}VA</td>
                            <td className="px-3 py-1.5">{m.noMeterLama || "-"}</td>
                            <td className="px-3 py-1.5 text-emerald-700">
                              {m.latitude.toFixed(6)}, {m.longitude.toFixed(6)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewMeters.length > 20 && (
                    <p className="text-[11px] text-emerald-800 text-center font-medium italic">
                      ... dan {previewMeters.length - 20} data pelanggan lainnya siap dimasukkan.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COPY PASTE TEXT FROM EXCEL */}
          {activeTab === "paste" && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Salin (Ctrl+C) sel dari spreadsheet Microsoft Excel Anda, lalu tempelkan (Ctrl+V) langsung ke dalam kotak di bawah ini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tempelkan Baris Tabel Excel di Sini:
                </label>
                <textarea
                  rows={8}
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  placeholder="411340318513	LA ***	***ON MAN***	R1MT	900	PRABAYAR	36000810071	-3,60370479	128,335212&#10;411300228124	EDM** ******	***ERI LAMA	R1T	2200	PRABAYAR	36002382194	-3,62607190	128,243261"
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-slate-50"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleProcessPasteData}
                  className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors shadow-md flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Memproses Baris Tempelan Excel
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: UNDUH & EKSPOR EXCEL */}
          {activeTab === "export" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export Current Data */}
              <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-3">
                    <Download className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Ekspor Data Aktif ke Excel (.xlsx)</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Unduh seluruh data {meters.length} meter tua yang saat ini tersimpan di dashboard ke dalam file Excel (.xlsx).
                  </p>
                </div>
                <button
                  onClick={() => exportMetersToExcelFile(meters)}
                  className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Unduh File Excel (.xlsx)
                </button>
              </div>

              {/* Download Standard Template */}
              <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 mb-3">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Unduh Format Template Excel</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Dapatkan template file Excel (.xlsx) kosong dengan susunan header kolom standar PLN Baguala.
                  </p>
                </div>
                <button
                  onClick={downloadExcelTemplateFile}
                  className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Unduh Template Kosong
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Format didukung: <strong>.xlsx, .xls, .csv</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
