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
} from "lucide-react";
import { MeterRecord } from "../types";

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

  // Officer stats breakdown
  const officerMap: Record<string, { total: number; selesai: number; belum: number }> = {};
  meters.forEach((m) => {
    if (!officerMap[m.petugas]) {
      officerMap[m.petugas] = { total: 0, selesai: 0, belum: 0 };
    }
    officerMap[m.petugas].total += 1;
    if (m.status === "SELESAI") officerMap[m.petugas].selesai += 1;
    else officerMap[m.petugas].belum += 1;
  });

  const officerChartData = Object.keys(officerMap).map((name) => ({
    name,
    Selesai: officerMap[name].selesai,
    Belum: officerMap[name].belum,
    Total: officerMap[name].total,
  }));

  // Sort officers by total completed for leaderboard
  const leaderboard = [...officerChartData].sort((a, b) => b.Selesai - a.Selesai);

  // Tarif breakdown
  const tarifMap: Record<string, number> = {};
  meters.forEach((m) => {
    tarifMap[m.tarif] = (tarifMap[m.tarif] || 0) + 1;
  });
  const tarifChartData = Object.keys(tarifMap).map((key) => ({
    name: key,
    value: tarifMap[key],
  }));

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

  // Call Gemini AI Endpoint
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
        const errJson = await res.json();
        throw new Error(errJson.error || "Gagal menghubungi API analisis.");
      }

      const data = await res.json();
      setAiAnalysis(data.analysis);
    } catch (err: any) {
      console.error("AI analysis error:", err);
      setErrorAi(err.message || "Gagal membuat analisis AI.");
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
            Analitik komprehensif kinerja penggantian meter tua & AI Operational Recommendation PLN Baguala
          </p>
        </div>

        <button
          onClick={handleGenerateAiAnalysis}
          disabled={loadingAi}
          className="flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          <Sparkles className={`h-4 w-4 ${loadingAi ? "animate-spin" : ""}`} />
          <span>{loadingAi ? "Menganalisis Data..." : "Jalankan Analisis Gemini AI"}</span>
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
                Analisis & Rekomendasi Operasional AI (Gemini 3.7 Flash)
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
              <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200">
                {errorAi}
              </div>
            ) : (
              <div className="prose max-w-none text-xs leading-relaxed text-slate-800 whitespace-pre-line font-sans">
                {aiAnalysis}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Row 1: Key Performance Metrics & Progress Gauge */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Progress Gauge */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Target Penyelesaian GMBL
            </h3>
            <p className="text-xs text-slate-400">Rasio Penggantian Meter Tua Baguala</p>
          </div>

          <div className="my-6 text-center">
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
              <span className="text-slate-500">Target Total</span>
              <p className="font-bold text-slate-900">{totalMeters} Unit</p>
            </div>
            <div>
              <span className="text-slate-500">Sisa Belum</span>
              <p className="font-bold text-orange-600">{totalBelum} Unit</p>
            </div>
          </div>
        </div>

        {/* Reason & Type Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Distribusi Jenis & Alasan Pergantian
          </h3>

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

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-2">
              <span className="text-[10px] text-blue-600 font-semibold">Meter Tua</span>
              <p className="text-lg font-bold text-slate-900">{meterTuaCount} Unit</p>
            </div>
            <div className="rounded-lg bg-orange-50 border border-orange-100 p-2">
              <span className="text-[10px] text-orange-600 font-semibold">Meter Gangguan</span>
              <p className="text-lg font-bold text-slate-900">{meterGangguanCount} Unit</p>
            </div>
          </div>
        </div>

        {/* Officer Leaderboard */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Award className="h-4 w-4 text-amber-500" />
            <span>Leaderboard Petugas Lapangan</span>
          </h3>
          <p className="text-[11px] text-slate-400 mb-3">Top performer pergantian meter terbanyak</p>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
            {leaderboard.slice(0, 6).map((pet, idx) => (
              <div
                key={pet.name}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs"
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

                <div className="flex items-center space-x-3 text-[11px]">
                  <span className="text-green-600 font-bold">{pet.Selesai} Selesai</span>
                  <span className="text-slate-400">/ {pet.Total} Total</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Officer Performance Bar Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          Beban Kerja & Capaian per Petugas Lapangan
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Perbandingan jumlah meter tua yang SELESAI vs BELUM dikerjakan oleh masing-masing petugas
        </p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={officerChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} interval={0} angle={-30} textAnchor="end" />
              <YAxis stroke="#64748b" fontSize={10} />
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
              <Bar dataKey="Selesai" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="Belum" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
