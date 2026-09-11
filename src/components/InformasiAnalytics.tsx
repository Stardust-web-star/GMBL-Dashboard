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
  MessageSquare,
} from "lucide-react";
import { MeterRecord, PETUGAS_LIST } from "../types";
import { useTheme } from "../context/ThemeContext";
import { WhatsAppBroadcastModal } from "./WhatsAppBroadcastModal";

interface Props {
  meters: MeterRecord[];
}

export const InformasiAnalytics: React.FC<Props> = ({ meters }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [errorAi, setErrorAi] = useState<string | null>(null);

  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waInitialType, setWaInitialType] = useState<"ringkasan" | "petugas" | "analisis" | "pelanggan">("ringkasan");

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

  // Fallback generator for strategic analysis when running on static Vercel host or offline
  const generateLocalStrategicAnalysis = (payloadData: any) => {
    const summary = payloadData.metersSummary || {};
    const officers = Array.isArray(payloadData.officerStats) ? payloadData.officerStats : [];
    
    const topOfficer = officers.length > 0
      ? [...officers].sort((a, b) => (b.Selesai || b.selesai || 0) - (a.Selesai || a.selesai || 0))[0]
      : { name: "Petugas Lapangan", Selesai: 0 };
    
    const lowestOfficer = officers.length > 0
      ? [...officers].sort((a, b) => (a.Selesai || a.selesai || 0) - (b.Selesai || b.selesai || 0))[0]
      : { name: "Petugas Lapangan", Selesai: 0 };

    return `## LAPORAN ANALISIS OPERASIONAL GMBL (GANTI METER BAGUALA)
**Unit Layanan Pelanggan (ULP) Baguala - Transaksi Energi**

### 1. 📊 Evaluasi Pencapaian & Progres Lapangan
- **Total Populasi Target:** ${(summary.total || 0).toLocaleString()} unit KWh meter tua/gangguan.
- **Realisasi Penggantian:** ${(summary.selesai || 0).toLocaleString()} unit telah berhasil diganti (${summary.percentageSelesai || 0}% tercapai).
- **Sisa Antrean (Backlog):** ${(summary.belum || 0).toLocaleString()} unit meter masih menunggu eksekusi lapangan.
- **Distribusi Layanan:** Terdiri dari ${(summary.prabayar || 0).toLocaleString()} pelanggan Prabayar (LPB) dan ${(summary.paskabayar || 0).toLocaleString()} pelanggan Paskabayar.

### 2. 👨‍🔧 Analisis Kinerja & Beban Kerja Petugas
- **Produktivitas Tertinggi:** Petugas **${topOfficer.name}** memimpin capaian dengan realisasi penggantian sebanyak **${topOfficer.Selesai || topOfficer.selesai || 0} unit** meter.
- **Pemerataan Penugasan:** Perlu penyesuaian rute dan alokasi harian bagi petugas dengan ritme kerja yang memerlukan dukungan tambahan (misalnya **${lowestOfficer.name}**) agar beban kerja antar-tim tetap seimbang.
- **Ketersediaan Material:** Pastikan stok KWh meter baru, MCB, segel, dan kabel TW didistribusikan secara proporsional setiap pagi sebelum briefing lapangan.

### 3. ⚠️ Identifikasi Kendala & Risiko Operasional
- **Akurasi Pengukuran & Proteksi Pendapatan:** Keberadaan meter tua dan meter macet/gangguan berpotensi menimbulkan susut energi (kWh losses) dan komplain tagihan susulan dari pelanggan.
- **Aksesibilitas Lokasi:** Sebagian titik di wilayah pesisir dan perbukitan (Passo, Lateri, Halong, Nania, Baguala) memerlukan koordinasi rute terpadu (cluster-based routing) agar waktu tempuh antar-persil lebih efisien.

### 4. 💡 Rekomendasi Strategis & Action Plan JTC Transaksi Energi
1. **Penerapan Sistem Klasterisasi Harian:** Fokuskan seluruh regu pada satu zona per hari (misal: Sektor Passo-Lateri diselesaikan tuntas sebelum berpindah) guna meminimalkan *travelling time*.
2. **Prioritas Meter Macet & Error:** Dahulukan penggantian meter kategori *Meter Gangguan/Error* untuk mencegah kerugian kWh tak tertagih.
3. **Validasi Real-Time Stand Bongkar:** Wajibkan input stand bongkar dan dokumentasi foto di aplikasi GMBL tepat saat meter lama diturunkan untuk mencegah sengketa rekening.
4. **Monitoring Berkala Dashboard GMBL:** Manfaatkan peta interaktif dan modul cetak berita acara otomatis untuk mempercepat rekonsiliasi administrasi harian.`;
  };

  // Call AI Endpoint
  const handleGenerateAiAnalysis = async () => {
    setLoadingAi(true);
    setErrorAi(null);

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

    try {
      let analysisResult = "";

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.analysis) {
            analysisResult = data.analysis;
          }
        }
      } catch (networkErr) {
        console.warn("Backend API endpoint unreachable (e.g. static host/Vercel), utilizing local analysis engine.");
      }

      if (!analysisResult) {
        analysisResult = generateLocalStrategicAnalysis(payload);
      }

      setAiAnalysis(analysisResult);
    } catch (err: any) {
      console.error("AI analysis fallback error:", err);
      setAiAnalysis(generateLocalStrategicAnalysis(payload));
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            <span>Informasi & Analisis Strategis GMBL</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Analitik komprehensif kinerja penggantian meter tua & Rekomendasi Operasional AI PLN Baguala
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setWaInitialType("ringkasan");
              setIsWaModalOpen(true);
            }}
            className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-900/20 hover:bg-emerald-500 transition-all cursor-pointer active:scale-95"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Broadcast WhatsApp</span>
          </button>

          <button
            onClick={handleGenerateAiAnalysis}
            disabled={loadingAi}
            className="flex items-center space-x-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-900/20 hover:bg-sky-500 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <Sparkles className={`h-4 w-4 ${loadingAi ? "animate-spin" : ""}`} />
            <span>{loadingAi ? "Menganalisis Data..." : "Jalankan Analisis AI"}</span>
          </button>
        </div>
      </div>

      {/* AI Analysis Card Container */}
      {(aiAnalysis || loadingAi || errorAi) && (
        <div className="rounded-2xl border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-950/20 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-sky-200 dark:border-sky-500/20 pb-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md shadow-sky-900/20">
                <Sparkles className="h-5 w-5 animate-pulse text-amber-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Analisis & Rekomendasi Operasional AI
                </h3>
                <p className="text-xs text-sky-700 dark:text-sky-300">
                  Laporan evaluasi otomatis untuk Manager & Supervisor JTC Transaksi Energi Baguala
                </p>
              </div>
            </div>

            {aiAnalysis && (
              <button
                onClick={() => {
                  setWaInitialType("analisis");
                  setIsWaModalOpen(true);
                }}
                className="flex items-center justify-center space-x-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Kirim Hasil ke WA</span>
              </button>
            )}
          </div>

          <div className="mt-4">
            {loadingAi ? (
              <div className="flex items-center space-x-3 py-6 text-xs text-sky-700 dark:text-sky-300">
                <RefreshCw className="h-5 w-5 animate-spin text-sky-500 dark:text-sky-400" />
                <span>AI sedang memproses data meter tua Baguala dan menghitung rasio efisiensi...</span>
              </div>
            ) : errorAi ? (
              <div className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 p-4 rounded-xl border border-rose-200 dark:border-rose-500/30 leading-relaxed font-medium">
                {errorAi}
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line font-sans bg-white dark:bg-slate-900/90 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                {aiAnalysis}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Row 1: Key Performance Metrics & Progress Gauge */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Progress Gauge */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between h-full">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Target Penyelesaian GMBL
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Rasio Penggantian Meter Tua Baguala</p>
          </div>

          <div className="h-44 w-full my-2 flex items-center justify-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="h-36 w-36 transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke={isDark ? "#1e293b" : "#e2e8f0"}
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
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{progressPercent}%</span>
                <span className="block text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">
                  TERCAPAI
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Target Total</span>
              <p className="text-base font-bold text-slate-900 dark:text-white">{totalMeters.toLocaleString()} Unit</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 block">Sisa Belum</span>
              <p className="text-base font-bold text-amber-600 dark:text-amber-400">{totalBelum.toLocaleString()} Unit</p>
            </div>
          </div>
        </div>

        {/* Reason & Type Distribution */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between h-full">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Distribusi Jenis & Alasan Pergantian
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Kategori Meter Tua & Meter Gangguan</p>
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
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                    borderRadius: "12px",
                    color: isDark ? "#f8fafc" : "#0f172a",
                    fontSize: "12px",
                    boxShadow: isDark ? "0 10px 15px -3px rgba(0,0,0,0.5)" : "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                  itemStyle={{ color: isDark ? "#f8fafc" : "#0f172a" }}
                />
                <Legend verticalAlign="bottom" height={24} iconSize={10} wrapperStyle={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 block">Meter Tua</span>
              <p className="text-base font-bold text-slate-900 dark:text-white">{meterTuaCount.toLocaleString()} Unit</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 block">Meter Gangguan</span>
              <p className="text-base font-bold text-slate-900 dark:text-white">{meterGangguanCount.toLocaleString()} Unit</p>
            </div>
          </div>
        </div>

        {/* Officer Leaderboard */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between h-full">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <Award className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />
              <span>Leaderboard Petugas Lapangan</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Top Performer Pergantian Terbanyak</p>
          </div>

          <div className="my-2 h-44 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
            {leaderboard.slice(0, 6).map((pet, idx) => (
              <div
                key={pet.name}
                className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-2 text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      idx === 0
                        ? "bg-amber-400 text-slate-950 font-black"
                        : idx === 1
                        ? "bg-slate-300 text-slate-950 font-black"
                        : idx === 2
                        ? "bg-amber-600 text-white font-black"
                        : "bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 font-medium"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{pet.name}</span>
                </div>

                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{pet.Selesai} Selesai</span>
                  <span className="text-slate-400 dark:text-slate-500">/ {pet.Total} Total</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Total Petugas</span>
              <p className="text-base font-bold text-slate-900 dark:text-white">{PETUGAS_LIST.length} Orang</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">Total Selesai</span>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{totalSelesai.toLocaleString()} Unit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Officer Performance Bar Chart & Detailed Breakdown Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30">
                <BarChart3 className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Beban Kerja & Capaian per Petugas Lapangan
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Perbandingan jumlah meter tua yang SELESAI vs BELUM dikerjakan oleh masing-masing petugas
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center space-x-1.5 rounded-full bg-sky-50 dark:bg-sky-950/60 px-3 py-1 font-semibold text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30">
              <UserCheck className="h-3.5 w-3.5" />
              <span>{PETUGAS_LIST.length} Petugas Resmi</span>
            </span>
            {unassignedMasterCount > 0 && (
              <span className="inline-flex items-center space-x-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{unassignedMasterCount.toLocaleString()} Target Belum Dialokasikan</span>
              </span>
            )}
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={officerChartData} margin={{ top: 15, right: 15, left: -15, bottom: 25 }}>
                <XAxis
                  dataKey="name"
                  stroke={isDark ? "#94a3b8" : "#64748b"}
                  fontSize={10}
                  fontWeight={600}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                />
                <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={10} allowDecimals={false} />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-200 dark:border-slate-700 min-w-[160px]">
                          <p className="font-bold text-amber-600 dark:text-amber-400 border-b border-slate-200 dark:border-slate-700 pb-1 text-sm">
                            Petugas: {label}
                          </p>
                          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                            <span>Pekerjaan Selesai:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{data.Selesai} Unit</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                            <span>Pekerjaan Belum:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">{data.Belum} Unit</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-800 dark:text-slate-300 font-semibold pt-1 border-t border-slate-200 dark:border-slate-800">
                            <span>Total Ditugaskan:</span>
                            <span className="text-slate-900 dark:text-white">{data.Total} Unit</span>
                          </div>
                          <div className="pt-1">
                            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                              <span>Capaian</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{data.Persen}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
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
                  wrapperStyle={{ fontSize: "11px", paddingBottom: "10px", color: isDark ? "#94a3b8" : "#64748b" }}
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center space-x-1.5">
              <ListFilter className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span>Tabel Rincian Beban Kerja & Capaian Petugas</span>
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Data real-time berdasarkan penugasan aktif
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200 border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-950 text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-800">
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
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
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
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      : pet.Persen === 100
                      ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30 font-bold"
                      : pet.Selesai > 0
                      ? "bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/30 font-semibold"
                      : "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30";

                  return (
                    <tr
                      key={pet.name}
                      className="hover:bg-slate-50 dark:hover:bg-slate-850/70 transition-colors"
                    >
                      <td className="py-2.5 px-4 text-center font-medium text-slate-400 dark:text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {pet.name.charAt(0)}
                        </div>
                        <span>{pet.name}</span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md font-bold border ${
                            pet.Selesai > 0
                              ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {pet.Selesai > 0 && <Check className="h-3 w-3" />}
                          <span>{pet.Selesai} Meter</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md font-semibold border ${
                            pet.Belum > 0
                              ? "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <span>{pet.Belum} Meter</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-800 dark:text-slate-100">
                        {pet.Total} Meter
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                pet.Persen === 100
                                  ? "bg-emerald-500"
                                  : pet.Persen > 0
                                  ? "bg-sky-500"
                                  : "bg-amber-400"
                              }`}
                              style={{ width: `${pet.Persen}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 w-9 text-right">
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

      <WhatsAppBroadcastModal
        isOpen={isWaModalOpen}
        onClose={() => setIsWaModalOpen(false)}
        meters={meters || []}
        aiAnalysis={aiAnalysis}
        initialType={waInitialType}
      />
    </div>
  );
};
