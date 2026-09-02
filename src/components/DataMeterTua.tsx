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
} from "lucide-react";
import { MeterRecord, PETUGAS_LIST } from "../types";
import { exportMetersToCSV, getMasterExcelMeta } from "../utils/storage";

interface Props {
  meters: MeterRecord[];
  onUpdateMeterStatus: (id: string, status: "SELESAI" | "BELUM") => void;
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
            <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
              <TableIcon className="h-5 w-5 text-blue-600" />
              <span>Data Rekapan Meter Tua (GMBL)</span>
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-semibold">
              <FileSpreadsheet className="h-3 w-3 text-emerald-600" />
              Master Excel Active ({masterMeta?.fileName || "Baguala_Master_Data"})
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Rekapitulasi seluruh data penggantian kWh meter tua PLN JTC Transaksi Energi Baguala • Tersimpan Permanen
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenAddNew}
            className="flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Data Ganti</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase">Total Meter Tua</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{total}</h3>
          <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[100%]" />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Unit Terdaftar</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase flex items-center space-x-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            <span>Selesai</span>
          </p>
          <h3 className="text-3xl font-black text-green-600 mt-1">{selesai}</h3>
          <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${percentage}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Sudah Diganti</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase flex items-center space-x-1">
            <Clock className="h-3.5 w-3.5 text-orange-500" />
            <span>Belum Diganti</span>
          </p>
          <h3 className="text-3xl font-black text-orange-500 mt-1">{belum}</h3>
          <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500" style={{ width: `${100 - percentage}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Tunggakan Lapangan</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase">Prabayar</p>
          <h3 className="text-3xl font-black text-blue-600 mt-1">{prabayar}</h3>
          <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${total ? (prabayar/total)*100 : 0}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Token / LPB</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase">Paskabayar</p>
          <h3 className="text-3xl font-black text-purple-600 mt-1">{paskabayar}</h3>
          <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500" style={{ width: `${total ? (paskabayar/total)*100 : 0}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Reguler / Pascabayar</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase">Capaian Progress</p>
          <h3 className="text-3xl font-black text-blue-600 mt-1">{percentage}%</h3>
          <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Target GMBL</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ID Pelanggan, Nama, No Meter, Agenda, Lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
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
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
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
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Mobile Cards View (< md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {paginatedMeters.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              Tidak ada data meter yang sesuai.
            </div>
          ) : (
            paginatedMeters.map((m, idx) => {
              const isDone = m.status === "SELESAI";
              return (
                <div key={m.id} className="p-4 space-y-2.5 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      #{startIndex + idx + 1} • {m.tanggal}
                    </span>
                    <button
                      onClick={() => onUpdateMeterStatus(m.id, isDone ? "BELUM" : "SELESAI")}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center space-x-1 transition-all ${
                        isDone
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isDone ? "bg-green-500" : "bg-orange-500"}`} />
                      <span>{m.status}</span>
                    </button>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{m.namaPelanggan}</h4>
                    <p className="text-xs font-mono font-bold text-blue-600">ID: {m.idPelanggan}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Tarif/Daya</span>
                      <span className="font-mono font-semibold text-slate-800">{m.tarif} / {m.daya} VA</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Jenis</span>
                      <span className={`font-bold ${m.jenis === "PRA BAYAR" ? "text-blue-600" : "text-purple-600"}`}>
                        {m.jenis}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Meter Lama</span>
                      <span className="font-mono text-slate-700">{m.noMeterLama || "-"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Meter Baru</span>
                      <span className="font-mono font-bold text-blue-600">{m.noMeterBaru || "-"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      Petugas: <strong className="text-slate-800">{isDone ? m.petugas : "-"}</strong>
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onSelectForDocument(m)}
                        className="rounded-lg p-2 bg-blue-50 text-blue-600 hover:bg-blue-100"
                        title="Cetak Surat PK"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onOpenEditModal(m)}
                        className="rounded-lg p-2 bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                        className="rounded-lg p-2 bg-rose-50 text-rose-600 hover:bg-rose-100"
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
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold uppercase text-slate-500">No</th>
                <th className="px-4 py-3 font-bold uppercase text-slate-500">Tanggal</th>
                <th className="px-4 py-3 font-bold uppercase text-slate-500">ID Pelanggan</th>
                <th className="px-4 py-3 font-bold uppercase text-slate-500">Nama Pelanggan</th>
                <th className="px-4 py-3 font-bold uppercase text-slate-500">Tarif / Daya</th>
                <th className="px-4 py-3 font-bold uppercase text-slate-500">No Meter Lama</th>
                <th className="px-4 py-3 font-bold uppercase text-slate-500">No Meter Baru</th>
                <th className="px-4 py-3 font-bold uppercase text-slate-500">Jenis</th>
                <th className="px-4 py-3 font-bold uppercase text-slate-500">Alasan</th>
                <th className="px-4 py-3 font-bold uppercase text-slate-500">Petugas</th>
                <th className="px-4 py-3 font-bold uppercase text-slate-500">Status</th>
                <th className="px-4 py-3 font-bold uppercase text-slate-500 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedMeters.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data meter yang sesuai.
                  </td>
                </tr>
              ) : (
                paginatedMeters.map((m, idx) => {
                  const isDone = m.status === "SELESAI";
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-400">{startIndex + idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{m.tanggal}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{m.idPelanggan}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{m.namaPelanggan}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        <span className="font-mono">{m.tarif}</span> / {m.daya} VA
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">{m.noMeterLama || "-"}</td>
                      <td className="px-4 py-3 font-mono text-blue-600 font-bold">{m.noMeterBaru || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.jenis === "PRA BAYAR"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {m.jenis}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">{m.gantiMeter}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {isDone ? m.petugas : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            onUpdateMeterStatus(m.id, isDone ? "BELUM" : "SELESAI")
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 transition-all ${
                            isDone
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isDone ? "bg-green-500" : "bg-orange-500"
                            }`}
                          />
                          <span>{m.status}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onSelectForDocument(m)}
                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                            title="Cetak Surat Tugas / PK"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onOpenEditModal(m)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
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
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{startIndex + 1}</span> hingga{" "}
            <span className="font-bold text-slate-800">
              {Math.min(startIndex + itemsPerPage, filteredMeters.length)}
            </span>{" "}
            dari <span className="font-bold text-slate-800">{filteredMeters.length}</span> data
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-slate-700">
              Halaman {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
