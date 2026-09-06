import React, { useState } from "react";
import {
  Table as TableIcon,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  Trash2,
  RefreshCw,
  Plus,
  FileText,
  ChevronLeft,
  ChevronRight,
  Zap,
  FileSpreadsheet,
  UserCheck,
  User,
  X,
} from "lucide-react";
import { MeterRecord, PetugasName, PETUGAS_LIST } from "../types";
import { exportMetersToCSV, getMasterExcelMeta } from "../utils/storage";

interface Props {
  meters: MeterRecord[];
  onUpdateMeterStatus: (
    id: string,
    status: "SELESAI" | "BELUM",
    petugas?: PetugasName,
    additionalData?: Partial<MeterRecord>
  ) => void;
  onDeleteMeter: (id: string) => void;
  onSelectForDocument: (meter: MeterRecord) => void;
  onOpenEditModal: (meter: MeterRecord) => void;
  onOpenAddNew: () => void;
}

export const DataMeterTua: React.FC<Props> = ({
  meters,
  onUpdateMeterStatus,
  onDeleteMeter,
  onSelectForDocument,
  onOpenEditModal,
  onOpenAddNew,
}) => {
  const masterMeta = getMasterExcelMeta();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterJenis, setFilterJenis] = useState<string>("ALL");
  const [filterPetugas, setFilterPetugas] = useState<string>("ALL");
  const [filterGanti, setFilterGanti] = useState<string>("ALL");

  // Modal for selecting Petugas when marking SELESAI
  const [meterToComplete, setMeterToComplete] = useState<MeterRecord | null>(null);
  const [selectedPetugasForCompletion, setSelectedPetugasForCompletion] = useState<PetugasName>("ABDUL");
  const [customStandBongkar, setCustomStandBongkar] = useState<string>("");
  const [customNoMeterBaru, setCustomNoMeterBaru] = useState<string>("");

  const handleInitiateMarkSelesai = (meter: MeterRecord) => {
    setMeterToComplete(meter);
    setSelectedPetugasForCompletion(meter.petugas || "ABDUL");
    setCustomStandBongkar(meter.standBongkar || "0 kWh");
    setCustomNoMeterBaru(meter.noMeterBaru || "");
  };

  const handleConfirmMarkSelesai = () => {
    if (!meterToComplete) return;
    const additional: Partial<MeterRecord> = {};
    if (customStandBongkar.trim()) additional.standBongkar = customStandBongkar.trim();
    if (customNoMeterBaru.trim()) additional.noMeterBaru = customNoMeterBaru.trim();

    onUpdateMeterStatus(
      meterToComplete.id,
      "SELESAI",
      selectedPetugasForCompletion,
      additional
    );

    setMeterToComplete(null);
  };

  const handleToggleStatus = (meter: MeterRecord) => {
    if (meter.status === "SELESAI") {
      onUpdateMeterStatus(meter.id, "BELUM");
    } else {
      handleInitiateMarkSelesai(meter);
    }
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate Metrics
  const total = meters.length;
  const selesai = meters.filter((m) => m.status === "SELESAI").length;
  const belum = meters.filter((m) => m.status === "BELUM").length;
  const prabayar = meters.filter((m) => m.jenis === "PRA BAYAR").length;
  const paskabayar = meters.filter((m) => m.jenis === "PASKA BAYAR").length;
  const percentage = total > 0 ? Math.round((selesai / total) * 100) : 0;

  // Filter logic
  const filteredMeters = meters.filter((m) => {
    const matchesSearch =
      m.idPelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.namaPelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.noMeterLama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.noMeterBaru.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.noAgenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.pnj.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "ALL" || m.status === filterStatus;
    const matchesJenis = filterJenis === "ALL" || m.jenis === filterJenis;
    const matchesPetugas = filterPetugas === "ALL" || m.petugas === filterPetugas;
    const matchesGanti = filterGanti === "ALL" || m.gantiMeter === filterGanti;

    return matchesSearch && matchesStatus && matchesJenis && matchesPetugas && matchesGanti;
  });

  const totalPages = Math.ceil(filteredMeters.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMeters = filteredMeters.slice(startIndex, startIndex + itemsPerPage);

  const handleExportCSV = () => {
    const csvContent = exportMetersToCSV(filteredMeters);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `GMBL_Rekapan_Meter_Tua_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
      {/* Top Header & Overview Cards */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
              <TableIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              <span>Data Rekapan Meter Tua (GMBL)</span>
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-[11px] font-semibold">
              <FileSpreadsheet className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              Master Excel Active ({masterMeta?.fileName || "Baguala_Master_Data"})
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rekapitulasi seluruh data penggantian kWh meter tua PLN JTC Transaksi Energi Baguala • Tersimpan Permanen
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenAddNew}
            className="flex items-center space-x-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-900/20 hover:bg-sky-500 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Data Ganti</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
          >
            <Download className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Total Meter Tua</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{total}</h3>
          <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 w-[100%]" />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Unit Terdaftar</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase flex items-center space-x-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Selesai</span>
          </p>
          <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{selesai}</h3>
          <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${percentage}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Sudah Diganti</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase flex items-center space-x-1">
            <Clock className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
            <span>Belum Diganti</span>
          </p>
          <h3 className="text-3xl font-black text-amber-500 dark:text-amber-400 mt-1">{belum}</h3>
          <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${100 - percentage}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Tunggakan Lapangan</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Prabayar</p>
          <h3 className="text-3xl font-black text-sky-600 dark:text-sky-400 mt-1">{prabayar}</h3>
          <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500" style={{ width: `${total ? (prabayar/total)*100 : 0}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Token / LPB</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Paskabayar</p>
          <h3 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{paskabayar}</h3>
          <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: `${total ? (paskabayar/total)*100 : 0}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Reguler / Pascabayar</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Capaian Progress</p>
          <h3 className="text-3xl font-black text-sky-600 dark:text-sky-400 mt-1">{percentage}%</h3>
          <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Target GMBL</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Cari ID Pelanggan, Nama, No Meter, Agenda, Lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-750 rounded-xl bg-slate-50 dark:bg-slate-950/70 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-950"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-750 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="SELESAI">SELESAI</option>
              <option value="BELUM">BELUM</option>
            </select>
          </div>

          {/* Jenis Filter */}
          <div>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-750 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Jenis Meter</option>
              <option value="PRA BAYAR">PRA BAYAR</option>
              <option value="PASKA BAYAR">PASKA BAYAR</option>
            </select>
          </div>

          {/* Petugas Filter */}
          <div>
            <select
              value={filterPetugas}
              onChange={(e) => setFilterPetugas(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-750 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Petugas</option>
              {PETUGAS_LIST.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Mobile Cards View (< md) */}
        <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-800">
          {paginatedMeters.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              Tidak ada data meter yang sesuai.
            </div>
          ) : (
            paginatedMeters.map((m, idx) => {
              const isDone = m.status === "SELESAI";
              return (
                <div key={m.id} className="p-4 space-y-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      #{startIndex + idx + 1} • {m.tanggal}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(m)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center space-x-1 border transition-all ${
                        isDone
                          ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
                          : "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isDone ? "bg-emerald-500" : "bg-amber-500"}`} />
                      <span>{m.status}</span>
                    </button>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{m.namaPelanggan}</h4>
                    <p className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">ID: {m.idPelanggan}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Tarif/Daya</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{m.tarif} / {m.daya} VA</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Jenis</span>
                      <span className={`font-bold ${m.jenis === "PRA BAYAR" ? "text-sky-600 dark:text-sky-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                        {m.jenis}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Meter Lama</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{m.noMeterLama || "-"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Meter Baru</span>
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{m.noMeterBaru || "-"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Petugas: <strong className="text-slate-900 dark:text-white">{isDone ? m.petugas : "-"}</strong>
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onSelectForDocument(m)}
                        className="rounded-lg p-2 bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Cetak Surat PK"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onOpenEditModal(m)}
                        className="rounded-lg p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                        title="Edit Data"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus record meter ID ${m.idPelanggan}?`)) {
                            onDeleteMeter(m.id);
                          }
                        }}
                        className="rounded-lg p-2 bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5 font-bold uppercase text-slate-600 dark:text-slate-400">No</th>
                <th className="px-4 py-3.5 font-bold uppercase text-slate-600 dark:text-slate-400">Tanggal</th>
                <th className="px-4 py-3.5 font-bold uppercase text-slate-600 dark:text-slate-400">ID Pelanggan</th>
                <th className="px-4 py-3.5 font-bold uppercase text-slate-600 dark:text-slate-400">Nama Pelanggan</th>
                <th className="px-4 py-3.5 font-bold uppercase text-slate-600 dark:text-slate-400">Tarif / Daya</th>
                <th className="px-4 py-3.5 font-bold uppercase text-slate-600 dark:text-slate-400">No Meter</th>
                <th className="px-4 py-3.5 font-bold uppercase text-emerald-700 dark:text-emerald-400">Kordinat</th>
                <th className="px-4 py-3.5 font-bold uppercase text-slate-600 dark:text-slate-400">Jenis</th>
                <th className="px-4 py-3.5 font-bold uppercase text-slate-600 dark:text-slate-400">Alasan</th>
                <th className="px-4 py-3.5 font-bold uppercase text-slate-600 dark:text-slate-400">Petugas</th>
                <th className="px-4 py-3.5 font-bold uppercase text-slate-600 dark:text-slate-400">Status</th>
                <th className="px-4 py-3.5 font-bold uppercase text-slate-600 dark:text-slate-400 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-slate-700 dark:text-slate-200">
              {paginatedMeters.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada data meter yang sesuai.
                  </td>
                </tr>
              ) : (
                paginatedMeters.map((m, idx) => {
                  const isDone = m.status === "SELESAI";
                  const coordStr = `${m.latitude},${m.longitude}`;
                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-850/70 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-500">{startIndex + idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{m.tanggal}</td>
                      <td className="px-4 py-3 font-mono font-bold text-sky-600 dark:text-sky-400">{m.idPelanggan}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{m.namaPelanggan}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                        <span className="font-mono">{m.tarif}</span> / {m.daya} VA
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                        {m.noMeterBaru ? (
                          <span className="text-sky-600 dark:text-sky-400 font-bold">{m.noMeterBaru}</span>
                        ) : (
                          m.noMeterLama || "-"
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-emerald-700 dark:text-emerald-300" title={`Kordinat: ${coordStr}`}>
                        <div className="flex items-center gap-1">
                          <span className="bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30">
                            {m.latitude.toFixed(6)},{m.longitude.toFixed(6)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            m.jenis === "PRA BAYAR"
                              ? "bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/30"
                              : "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30"
                          }`}
                        >
                          {m.jenis}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 dark:text-slate-400">{m.gantiMeter}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {isDone ? m.petugas : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(m)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 border transition-all cursor-pointer ${
                            isDone
                              ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/80"
                              : "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-900/80"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isDone ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          <span>{m.status}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onSelectForDocument(m)}
                            className="rounded-lg p-1.5 text-sky-600 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Cetak Surat Tugas / PK"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onOpenEditModal(m)}
                            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="Edit Data Meter"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus record meter ID ${m.idPelanggan} (${m.namaPelanggan})?`)) {
                                onDeleteMeter(m.id);
                              }
                            }}
                            className="rounded-lg p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            title="Hapus Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Menampilkan <span className="font-bold text-slate-900 dark:text-white">{startIndex + 1}</span> hingga{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {Math.min(startIndex + itemsPerPage, filteredMeters.length)}
            </span>{" "}
            dari <span className="font-bold text-slate-900 dark:text-white">{filteredMeters.length}</span> data
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-850 p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Halaman {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-850 p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Petugas Selection Modal Dialog when marking as SELESAI */}
      {meterToComplete && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-750 overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 py-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-400/40">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Pilih Petugas Ganti Meter</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Tentukan petugas pelaksana untuk menandai SELESAI</p>
                </div>
              </div>
              <button
                onClick={() => setMeterToComplete(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Customer Info Card */}
            <div className="p-5 space-y-4">
              <div className="rounded-xl border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-950/40 p-3.5 text-xs text-slate-800 dark:text-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">{meterToComplete.namaPelanggan}</span>
                  <span className="rounded bg-sky-100 dark:bg-sky-500/20 border border-sky-300 dark:border-sky-400/30 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                    {meterToComplete.jenis}
                  </span>
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div>
                    ID Pel: <strong className="text-sky-700 dark:text-sky-300 font-mono font-bold">{meterToComplete.idPelanggan}</strong>
                  </div>
                  <div>
                    Tarif/Daya: <strong className="text-slate-900 dark:text-white">{meterToComplete.tarif} / {meterToComplete.daya} VA</strong>
                  </div>
                  <div>
                    Meter Lama: <span className="font-mono text-slate-700 dark:text-slate-200">{meterToComplete.noMeterLama || "-"}</span>
                  </div>
                  <div className="truncate">
                    Lokasi/PNJ: <span className="text-slate-700 dark:text-slate-200 font-medium">{meterToComplete.pnj || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Petugas Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    Petugas Pelaksana Ganti Meter <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Klik nama atau pilih dropdown</span>
                </div>

                {/* Quick Pick Pills / Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  {PETUGAS_LIST.map((pet) => {
                    const isSelected = selectedPetugasForCompletion === pet;
                    return (
                      <button
                        key={pet}
                        type="button"
                        onClick={() => setSelectedPetugasForCompletion(pet)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? "bg-sky-600 text-white shadow-sm ring-2 ring-sky-400/50 scale-[1.02]"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {pet}
                      </button>
                    );
                  })}
                </div>

                {/* Dropdown Select Alternative */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Pilihan Terpilih:</span>
                  <select
                    value={selectedPetugasForCompletion}
                    onChange={(e) => setSelectedPetugasForCompletion(e.target.value as PetugasName)}
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    {PETUGAS_LIST.map((p) => (
                      <option key={p} value={p}>
                        Petugas: {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional inputs */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. Meter Baru <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={customNoMeterBaru}
                    onChange={(e) => setCustomNoMeterBaru(e.target.value)}
                    placeholder="Contoh: 37119200481"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stand Bongkar <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={customStandBongkar}
                    onChange={(e) => setCustomStandBongkar(e.target.value)}
                    placeholder="Contoh: 04891 kWh"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end space-x-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 px-5 py-3.5">
              <button
                type="button"
                onClick={() => setMeterToComplete(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmMarkSelesai}
                className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm shadow-emerald-900/30 transition-all cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Simpan & Tandai SELESAI ({selectedPetugasForCompletion})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
