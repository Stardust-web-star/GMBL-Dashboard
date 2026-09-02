import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Health Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "GMBL - Ganti Meter Baguala", version: "1.0.0" });
  });

  // Gemini AI Analysis Endpoint for Menu 4 (Informasi)
  app.post("/api/analyze", async (req, res) => {
    try {
      const { metersSummary, officerStats, jenisStats, gantiReasonStats } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY belum dikonfigurasi pada environment server.",
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = `Anda adalah seorang Konsultan Senior Efisiensi Operasional PLN Transaksi Energi Unit Pemeliharaan Meter Baguala (GMBL - Ganti Meter Baguala).
Berikan analisis teknis strategis, mendalam, profesional, dan terstruktur berdasarkan data pemeliharaan meter tua terkini berikut:

RINGKASAN METRICS:
- Total KWh Meter Tua: ${metersSummary.total}
- Status Selesai: ${metersSummary.selesai} (${metersSummary.percentageSelesai}%)
- Status Belum Diganti: ${metersSummary.belum}
- Jenis Prabayar: ${metersSummary.prabayar}
- Jenis Paskabayar: ${metersSummary.paskabayar}

STATISTIK PETUGAS (Pencapaian per Petugas):
${JSON.stringify(officerStats, null, 2)}

STATISTIK ALASAN PENGGANTIAN:
${JSON.stringify(gantiReasonStats, null, 2)}

Format laporan analisis Anda dalam bahasa Indonesia yang formal, terstruktur, dan actionable dengan poin-poin berikut:
1. 📊 **Evaluasi Pencapaian & Progres Lapangan** (Bahas persentase penyelesaian, kecepatan pergantian, serta perbandingan meter Prabayar vs Paskabayar).
2. 👨‍🔧 **Analisis Kinerja & Beban Kerja Petugas** (Highlight petugas paling produktif, petugas dengan backlog tinggi, dan usulan distribusi penugasan tim).
3. ⚠️ **Identifikasi Kendala & Risiko Operasional** (Penyebab tunggakan "Meter Tua" & "Meter Gangguan" serta potensi kerugian kWh / revenue protection PLN).
4. 💡 **Rekomendasi Strategis & Action Plan JTC Transaksi Energi** (3-4 langkah konkrit untuk mempercepat target pergantian 100% di wilayah Baguala).

Gunakan bahasa PLN yang teknis dan apresiatif. Singkat, padat, dan berdampak tinggi.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });

      return res.json({ analysis: response.text });
    } catch (error: any) {
      console.error("Gemini Analysis Error:", error);
      return res.status(500).json({ error: error.message || "Gagal membuat analisis AI." });
    }
  });

  // Vite middleware in development vs static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server GMBL running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
