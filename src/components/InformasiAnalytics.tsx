import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  Sparkles,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  RefreshCw,
  UserCheck,
  Check,
  ListFilter,
} from "lucide-react";
import { MeterRecord, PETUGAS_LIST } from "../types";

interface Props {
  meters: MeterRecord[];
}

export const InformasiAnalytics: React.FC<Props> = ({ meters }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [errorAi, setErrorAi] = useState<string | null>(null);

  // Compute Metrics
  const totalMeters = meters.length;
  const totalSelesai = meters.filter((m) => m.status === "SELESAI").length;
  const totalBelum = meters.filter((m) => m.status === "BELUM").length;
  const prabayarCount = meters.filter((m) => m.jenis === "PRA BAYAR").length;
  const paskabayarCount = meters.filter((m) => m.jenis === "PASKA BAYAR").length;
  const progressPercent = totalMeters > 0 ? Math.round((totalSelesai / totalMeters) * 100) : 0;

  // Officer stats breakdown - group accurately by assigned officer
  const officerMap: Record<string, { total: number; selesai: number; belum: number }> = {};
  
  // Initialize for all official officers
  PETUGAS_LIST.forEach((name) => {
    officerMap[name] = { total: 0, selesai: 0, belum: 0 };
  });

  let unassignedMasterCount = 0;

  meters.forEach((m) => {
    const p = (m.petugas || "").trim().toUpperCase();
    if (p && officerMap[p]) {
      if (m.status === "SELESAI") {
        officerMap[p].total += 1;
        officerMap[p].selesai += 1;
      } else {
        if (p === "ABDUL") {
          unassignedMasterCount += 1;
        } else {
          officerMap[p].total += 1;
          officerMap[p].belum += 1;
        }
      }
    } else if (m.status === "BELUM") {
      unassignedMasterCount += 1;
    }
  });

  const officerChartData = PETUGAS_LIST.map((name) => {
    const selesai = officerMap[name]?.selesai || 0;
    const belum = officerMap[name]?.belum || 0;
    const total = officerMap[name]?.total || 0;
    const percent = total > 0 ? Math.round((selesai / total) * 100) : 0;
    return {
      name,
      Selesai: selesai,
      Belum: belum,
      Total: total,
      Persen: percent,
    };
  });

  // Sort officers for leaderboard
  const leaderboard = [...officerChartData].sort((a, b) => b.Selesai - a.Selesai || b.Total - a.Total);

  // Tarif breakdown
  const tarifMap: Record<string, number> = {};
  meters.forEach((m) => {
    tarifMap[m.tarif] = (tarifMap[m.tarif] || 0) + 1;
  });

  // Alasan Ganti breakdown
  const meterTuaCount = meters.filter((m) => m.gantiMeter === "METER TUA").length;
  const meterGangguanCount = meters.filter((m) => m.gantiMeter === "METER GANGGUAN").length;

  const gantiReasonData = [
    { name: "Meter Tua", value: meterTuaCount, color: "#06b6d4" },
    { name: "Meter Gangguan", value: meterGangguanCount, color: "#f59e0b" },
  ];

  const jenisPieData = [
    { name: "Pra Bayar", value: prabayarCount, color: "#10b981" },
    { name: "Paska Bayar", value: paskabayarCount, color: "#8b5cf6" },
  ];

  // Call AI Endpoint
  const handleGenerateAiAnalysis = async () => {
    setLoadingAi(true);
    setErrorAi(null);

    try {
      const payload = {
        metersSummary: {
          total: totalMeters,
          selesai: totalSelesai,
          belum: totalBelum,
          percentageSelesai: progressPercent,
          prabayar: prabayarCount,
          paskabayar: paskabayarCount,
        },
        officerStats: officerChartData,
        gantiReasonStats: {
          meterTua: meterTuaCount,
          meterGangguan: meterGangguanCount,
        },
      };

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errMessage = "Gagal memproses analisis AI.";
        try {
          const errJson = await res.json();
          if (typeof errJson.error === "string") {
            errMessage = errJson.error;
          } else if (errJson.error?.message) {
            errMessage = errJson.error.message;
          }
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      }

      const data = await res.json();
      setAiAnalysis(data.analysis);
    } catch (err: any) {
      console.error("AI analysis error:", err);
      let errMsg = err?.message || "Gagal membuat analisis AI.";
      // Clean up raw JSON error messages if any
      if (errMsg.startsWith("{") && errMsg.includes("error")) {
        try {
          const parsed = JSON.parse(errMsg);
          errMsg = parsed.error?.message || parsed.message || "Model AI sedang sibuk. Silakan coba sesaat lagi.";
        } catch {
          errMsg = "Model AI sedang sibuk. Silakan coba sesaat lagi.";
        }
      }
      setErrorAi(errMsg);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span>Informasi & Analisis Strategis GMBL</span>
          </h2>
          <p className="text-xs text-slate-500">
            Analitik komprehensif kinerja penggantian meter tua & Rekomendasi Operasional AI PLN Baguala
          </p>
        </div>

        <button
          onClick={handleGenerateAiAnalysis}
          disabled={loadingAi}
          className="flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
        >
          <Sparkles className={`h-4 w-4 ${loadingAi ? "animate-spin" : ""}`} />
          <span>{loadingAi ? "Menganalisis Data..." : "Jalankan Analisis AI"}</span>
        </button>
      </div>

      {/* AI Analysis Card Container */}
      {(aiAnalysis || loadingAi || errorAi) && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-6 shadow-sm">
          <div className="flex items-center space-x-3 border-b border-blue-200/60 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-200">
              <Sparkles className="h-5 w-5 animate-pulse text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Analisis & Rekomendasi Operasional AI
              </h3>
              <p className="text-xs text-blue-700">
                Laporan evaluasi otomatis untuk Manager & Supervisor JTC Transaksi Energi Baguala
              </p>
            </div>
          </div>

          <div className="mt-4">
            {loadingAi ? (
              <div className="flex items-center space-x-3 py-6 text-xs text-blue-700">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                <span>AI sedang memproses data meter tua Baguala dan menghitung rasio efisiensi...</span>
              </div>
            ) : errorAi ? (
              <div className="text-xs text-rose-700 bg-rose-50 p-4 rounded-xl border border-rose-200 leading-relaxed font-medium">
                {errorAi}
              </div>
            ) : (
              <div className="prose max-w-none text-xs leading-relaxed text-slate-800 whitespace-pre-line font-sans bg-white/80 p-5 rounded-xl border border-blue-100 shadow-2xs">
                {aiAnalysis}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Row 1: Key Performance Metrics & Progress Gauge */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Progress Gauge */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Target Penyelesaian GMBL
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Rasio Penggantian Meter Tua Baguala</p>
          </div>

          <div className="h-44 w-full my-2 flex items-center justify-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="h-36 w-36 transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="url(#gradientProgress)"
                  strokeWidth="12"
                  strokeDasharray={376.8}
                  strokeDashoffset={376.8 - (376.8 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="gradientProgress" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-black text-slate-900">{progressPercent}%</span>
                <span className="block text-[10px] uppercase tracking-widest text-emerald-600 font-bold">
                  TERCAPAI
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block">Target Total</span>
              <p className="text-base font-bold text-slate-900">{totalMeters.toLocaleString()} Unit</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-orange-600 block">Sisa Belum</span>
              <p className="text-base font-bold text-orange-600">{totalBelum.toLocaleString()} Unit</p>
            </div>
          </div>
        </div>

        {/* Reason & Type Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Distribusi Jenis & Alasan Pergantian
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Kategori Meter Tua & Meter Gangguan</p>
          </div>

          <div className="h-44 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gantiReasonData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {gantiReasonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "8px",
                    color: "#0f172a",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend verticalAlign="bottom" height={24} iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] font-semibold text-blue-600 block">Meter Tua</span>
              <p className="text-base font-bold text-slate-900">{meterTuaCount.toLocaleString()} Unit</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-orange-600 block">Meter Gangguan</span>
              <p className="text-base font-bold text-slate-900">{meterGangguanCount.toLocaleString()} Unit</p>
            </div>
          </div>
        </div>

        {/* Officer Leaderboard */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
              <Award className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Leaderboard Petugas Lapangan</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Top Performer Pergantian Terbanyak</p>
          </div>

          <div className="my-2 h-44 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
            {leaderboard.slice(0, 6).map((pet, idx) => (
              <div
                key={pet.name}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      idx === 0
                        ? "bg-amber-400 text-slate-950"
                        : idx === 1
                        ? "bg-slate-300 text-slate-950"
                        : idx === 2
                        ? "bg-amber-700 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-800">{pet.name}</span>
                </div>

                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="text-emerald-600 font-bold">{pet.Selesai} Selesai</span>
                  <span className="text-slate-400">/ {pet.Total} Total</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block">Total Petugas</span>
              <p className="text-base font-bold text-slate-900">{PETUGAS_LIST.length} Orang</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-emerald-600 block">Total Selesai</span>
              <p className="text-base font-bold text-emerald-600">{totalSelesai.toLocaleString()} Unit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Officer Performance Bar Chart & Detailed Breakdown Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <BarChart3 className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                Beban Kerja & Capaian per Petugas Lapangan
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Perbandingan jumlah meter tua yang SELESAI vs BELUM dikerjakan oleh masing-masing petugas
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center space-x-1.5 rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700 border border-blue-100">
              <UserCheck className="h-3.5 w-3.5" />
              <span>{PETUGAS_LIST.length} Petugas Resmi</span>
            </span>
            {unassignedMasterCount > 0 && (
              <span className="inline-flex items-center space-x-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 border border-slate-200">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span>{unassignedMasterCount.toLocaleString()} Target Belum Dialokasikan</span>
              </span>
            )}
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={officerChartData} margin={{ top: 15, right: 15, left: -15, bottom: 25 }}>
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  fontWeight={600}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[160px]">
                          <p className="font-bold text-amber-400 border-b border-slate-700 pb-1 text-sm">
                            Petugas: {label}
                          </p>
                          <div className="flex justify-between items-center text-slate-300">
                            <span>Pekerjaan Selesai:</span>
                            <span className="font-bold text-emerald-400">{data.Selesai} Unit</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300">
                            <span>Pekerjaan Belum:</span>
                            <span className="font-bold text-amber-400">{data.Belum} Unit</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300 font-semibold pt-1 border-t border-slate-800">
                            <span>Total Ditugaskan:</span>
                            <span className="text-white">{data.Total} Unit</span>
                          </div>
                          <div className="pt-1">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                              <span>Capaian</span>
                              <span className="font-bold text-emerald-400">{data.Persen}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${data.Persen}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={32}
                  wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                />
                <Bar name="Selesai" dataKey="Selesai" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar name="Belum Selesai" dataKey="Belum" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Officer Workload Table */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <ListFilter className="h-4 w-4 text-blue-600" />
              <span>Tabel Rincian Beban Kerja & Capaian Petugas</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">
              Data real-time berdasarkan penugasan aktif
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-100/80 text-[11px] uppercase font-bold text-slate-600 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Petugas Lapangan</th>
                  <th className="py-3 px-4 text-center">Pekerjaan Selesai</th>
                  <th className="py-3 px-4 text-center">Pekerjaan Belum</th>
                  <th className="py-3 px-4 text-center">Total Ditugaskan</th>
                  <th className="py-3 px-4 text-center w-36">Rasio Capaian</th>
                  <th className="py-3 px-4 text-center">Status Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {officerChartData.map((pet, idx) => {
                  const statusLabel =
                    pet.Total === 0
                      ? "Belum Ada Alokasi"
                      : pet.Persen === 100
                      ? "Tuntas 100%"
                      : pet.Selesai > 0
                      ? "Dalam Proses"
                      : "Belum Dikerjakan";

                  const statusBg =
                    pet.Total === 0
                      ? "bg-slate-100 text-slate-500 border-slate-200"
                      : pet.Persen === 100
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                      : pet.Selesai > 0
                      ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                      : "bg-amber-50 text-amber-700 border-amber-200";

                  return (
                    <tr
                      key={pet.name}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-2.5 px-4 text-center font-medium text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center space-x-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">
                          {pet.name.charAt(0)}
                        </div>
                        <span>{pet.name}</span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md font-bold ${
                            pet.Selesai > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {pet.Selesai > 0 && <Check className="h-3 w-3" />}
                          <span>{pet.Selesai} Meter</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md font-semibold ${
                            pet.Belum > 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <span>{pet.Belum} Meter</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-800">
                        {pet.Total} Meter
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                pet.Persen === 100
                                  ? "bg-emerald-500"
                                  : pet.Persen > 0
                                  ? "bg-blue-500"
                                  : "bg-amber-400"
                              }`}
                              style={{ width: `${pet.Persen}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 w-9 text-right">
                            {pet.Persen}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${statusBg}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
