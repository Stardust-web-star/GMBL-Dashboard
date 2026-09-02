import React, { useState } from "react";
import {
  FileText,
  Printer,
  Download,
  Search,
  CheckCircle2,
  Zap,
  Building,
  ShieldCheck,
  QrCode,
  UserCheck,
} from "lucide-react";
import { MeterRecord } from "../types";

interface Props {
  meters: MeterRecord[];
  selectedMeter: MeterRecord | null;
  onSelectMeter: (meter: MeterRecord | null) => void;
}

export const DokumenPrint: React.FC<Props> = ({
  meters,
  selectedMeter,
  onSelectMeter,
}) => {
  const [docType, setDocType] = useState<"pk" | "ba" | "st">("pk");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMeters = meters.filter(
    (m) =>
      m.idPelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.namaPelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.noMeterLama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeMeter = selectedMeter || filteredMeters[0] || meters[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header & Controls (Hidden when printing) */}
      <div className="print:hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <span>Dokumen & Surat Perintah Kerja (PK)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Cetak Berita Acara & Surat Tugas Penggantian Meter Tua PLN JTC Transaksi Energi Baguala
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            disabled={!activeMeter}
            className="flex items-center space-x-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Dokumen Resmi</span>
          </button>
        </div>
      </div>

      {/* Screen Controls Grid (Hidden when printing) */}
      <div className="print:hidden grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Selector Meter */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Pilih Data Meter Target
          </h3>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ID Pelanggan / Nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs p-2 pl-8 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {filteredMeters.map((m) => {
              const isSelected = activeMeter?.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMeter(m)}
                  className={`cursor-pointer rounded-lg border p-2.5 text-xs transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-900 font-medium"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <p className="font-bold text-slate-900 truncate">{m.namaPelanggan}</p>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>ID: {m.idPelanggan}</span>
                    <span className="text-blue-600 font-semibold">
                      {m.status === "SELESAI" ? m.petugas : "-"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Document Format Selector */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <div className="flex space-x-2 border-b border-slate-100 pb-3">
            <button
              onClick={() => setDocType("pk")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                docType === "pk"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              1. Surat Perintah Kerja (PK)
            </button>
            <button
              onClick={() => setDocType("ba")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                docType === "ba"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              2. Berita Acara (BA) Penggantian
            </button>
            <button
              onClick={() => setDocType("st")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                docType === "st"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              3. Surat Tugas Pemeliharaan
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Pratinjau dokumen resmi yang akan dicetak di bawah ini. Tekan tombol &quot;Cetak Dokumen Resmi&quot; untuk mengunduh versi PDF/Print.
          </p>
        </div>
      </div>

      {/* Printable Paper Canvas (Styled like official PLN Letterhead) */}
      {activeMeter ? (
        <div className="mx-auto max-w-4xl bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-xl border border-slate-300 print:border-none print:shadow-none print:p-0">
          {/* PLN Official Header */}
          <div className="border-b-4 border-slate-900 pb-4 mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-600 text-white font-extrabold text-xl">
                PLN
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">
                  PT PLN (PERSERO) UNIT INDUK DISTRIBUSI MALUKU & MALUKU UTARA
                </h1>
                <h2 className="text-xs font-extrabold text-slate-700">
                  UP3 AMBON - ULP BAGUALA • JTC TRANSAKSI ENERGI
                </h2>
                <p className="text-[10px] text-slate-500">
                  Jl. Laksdya Leo Wattimena, Baguala, Kota Ambon, Maluku
                </p>
              </div>
            </div>

            <div className="text-right text-[10px] font-mono text-slate-600">
              <p>Nomor Agenda: <strong>{activeMeter.noAgenda}</strong></p>
              <p>Tanggal: <strong>{activeMeter.tanggal}</strong></p>
              <p>Status: <strong className="text-cyan-800">{activeMeter.status}</strong></p>
            </div>
          </div>

          {/* Document Type Title */}
          <div className="text-center my-6">
            <h2 className="text-lg font-black uppercase tracking-wide text-slate-900 underline decoration-2 underline-offset-4">
              {docType === "pk" && "SURAT PERINTAH KERJA (PK) PENGGANTIAN METER TUA"}
              {docType === "ba" && "BERITA ACARA PENGGANTIAN KWH METER (GMBL)"}
              {docType === "st" && "SURAT TUGAS PEMELIHARAAN TRANSAKSI ENERGI BAGUALA"}
            </h2>
            <p className="text-xs font-mono text-slate-600 mt-1">
              Ref: PLN/ULP-BGL/GMBL/{activeMeter.idPelanggan}/2026
            </p>
          </div>

          {/* Body Section 1: Customer Details */}
          <div className="space-y-4 text-xs leading-relaxed">
            <p className="font-medium text-slate-800">
              Yang bertanda tangan di bawah ini, Supervisor/JTC Transaksi Energi ULP Baguala memberi tugas & kuasa operasional pelaksanaan penggantian kWh Meter kepada Petugas Lapangan:
            </p>

            {/* Officer Box */}
            <div className="bg-slate-100 p-3 rounded-lg border border-slate-300 grid grid-cols-2 gap-2 font-mono">
              <div>
                Petugas Lapangan: <strong>{activeMeter.petugas}</strong>
              </div>
              <div>
                Unit / Jabatan: <strong>JTC Transaksi Energi Baguala</strong>
              </div>
            </div>

            <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mt-4 uppercase">
              I. DATA PELANGGAN & LOKASI
            </h3>

            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 font-semibold text-slate-600 w-44">ID Pelanggan</td>
                  <td className="py-1.5 font-bold font-mono text-slate-900">: {activeMeter.idPelanggan}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 font-semibold text-slate-600">Nama Pelanggan</td>
                  <td className="py-1.5 font-bold text-slate-900">: {activeMeter.namaPelanggan}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 font-semibold text-slate-600">Tarif / Daya</td>
                  <td className="py-1.5 font-bold text-slate-900">: {activeMeter.tarif} / {activeMeter.daya} VA</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 font-semibold text-slate-600">Alamat / PNJ</td>
                  <td className="py-1.5 font-bold text-slate-900">: {activeMeter.pnj}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 font-semibold text-slate-600">Koordinat Tagging GPS</td>
                  <td className="py-1.5 font-mono text-slate-900">: Lat {activeMeter.latitude}, Long {activeMeter.longitude}</td>
                </tr>
              </tbody>
            </table>

            <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mt-4 uppercase">
              II. SPESIFIKASI PENGGANTIAN METER & MATERIAL
            </h3>

            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 font-semibold text-slate-600 w-44">Jenis Layanan</td>
                  <td className="py-1.5 font-bold text-slate-900">: {activeMeter.jenis}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 font-semibold text-slate-600">Alasan Penggantian</td>
                  <td className="py-1.5 font-bold text-slate-900">: {activeMeter.gantiMeter}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 font-semibold text-slate-600">No Meter Lama (Bongkar)</td>
                  <td className="py-1.5 font-mono text-slate-900">: {activeMeter.noMeterLama || "-"}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 font-semibold text-slate-600">Stand Bongkar kWh Meter</td>
                  <td className="py-1.5 font-bold font-mono text-slate-900">: {activeMeter.standBongkar}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 font-semibold text-slate-600">No Meter Baru (Pasang)</td>
                  <td className="py-1.5 font-mono font-bold text-cyan-800">: {activeMeter.noMeterBaru || "-"}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 font-semibold text-slate-600">SN Material kWh / MCB</td>
                  <td className="py-1.5 font-mono text-slate-900">: {activeMeter.noSnMaterialKwhMeter} / {activeMeter.noSnMaterialMcb}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 font-semibold text-slate-600">Kabel TW / Segel PLN</td>
                  <td className="py-1.5 text-slate-900">: Kabel: {activeMeter.kabelTw} | Segel: {activeMeter.segel}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures & Stamps Footer */}
          <div className="mt-12 pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <p className="font-semibold text-slate-700">Pelanggan,</p>
              <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 italic">
                ( Tanda Tangan )
              </div>
              <p className="font-bold text-slate-900 underline">{activeMeter.namaPelanggan}</p>
            </div>

            <div>
              <p className="font-semibold text-slate-700">Petugas Eksekutor Lapangan,</p>
              <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                Verification Stamp
              </div>
              <p className="font-bold text-slate-900 underline">{activeMeter.petugas}</p>
              <p className="text-[10px] text-slate-500">JTC Transaksi Energi</p>
            </div>

            <div>
              <p className="font-semibold text-slate-700">Supervisor / Manager ULP Baguala,</p>
              <div className="h-16 flex items-center justify-center">
                <div className="border border-slate-400 p-1 rounded bg-slate-50 flex items-center space-x-1">
                  <QrCode className="h-10 w-10 text-slate-800" />
                  <span className="text-[8px] text-left font-mono leading-tight text-slate-600">
                    PLN Verified<br />GMBL-2026<br />Digital Signature
                  </span>
                </div>
              </div>
              <p className="font-bold text-slate-900 underline">MANAGER ULP BAGUALA</p>
              <p className="text-[10px] text-slate-500">NIP. 921839210-PLN</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          Tidak ada data meter yang dipilih untuk dicetak.
        </div>
      )}
    </div>
  );
};
