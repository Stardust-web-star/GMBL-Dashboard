import { MeterRecord } from "../types";
import { INITIAL_METERS } from "../data/initialData";

export function parseCoordinate(val: any): number | null {
  if (val === undefined || val === null || val === "") return null;
  // Convert comma decimal separator (Indonesian Google Sheet format) to dot
  const str = String(val).trim().replace(",", ".");
  const match = str.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  if (isNaN(num)) return null;
  return num;
}

// Map of known localities in Baguala & Ambon area matching Google Satellite map locations
export const LOCALITY_ZONES = [
  // Waitatiri & Waiyari area (Image 1 left side)
  { keywords: ["WAITATIRI", "WAIYARI", "FOC", "ANGGA SERE", "KEBUN"], lat: -3.6192, lng: 128.2951 },
  // Suli & Kampus UKIM (Image 1 center-top)
  { keywords: ["UKIM", "SULI BANDA", "BARU-SULI", "TELAGA TIHU", "INDOMAS", "LAZIZ"], lat: -3.6142, lng: 128.3125 },
  // Suli Center & Village
  { keywords: ["SULI", "DP/POS", "POS 1"], lat: -3.6210, lng: 128.3150 },
  // Natsepa Beach & Mariboss (Image 1 coastal center-left)
  { keywords: ["NATSEPA", "MARIBOSS", "KUDA LAUT", "BEACH", "SPOT KUDA"], lat: -3.6275, lng: 128.3005 },
  // Sopapei & Backyard Suli (Image 1 coastal center)
  { keywords: ["SOPAPEI", "BACKYARD", "DOMULIA", "CABANG 2"], lat: -3.6295, lng: 128.3165 },
  // Rindam XV Pattimura & Toko Ita (Image 1 center)
  { keywords: ["RINDAM", "PATTIMURA", "ITA", "BRI", "AGEN BRI", "NIPPON"], lat: -3.6225, lng: 128.3245 },
  // Haliwela & Aer Batu Morea (Image 1 center-right)
  { keywords: ["HALIWELA", "AER BATU", "MOREA", "LORIHUA", "MANDALISE", "PRIVATE"], lat: -3.6335, lng: 128.3280 },
  // Dusun Durian & Agroforestry (Image 1 right side)
  { keywords: ["DURIAN", "DUSUN DURIAN", "PROPINSI", "AGROFORESTRY", "TUNI"], lat: -3.6235, lng: 128.3410 },
  // Waiso & Mareta (Image 1 top right)
  { keywords: ["WAISO", "MARETA", "ON MAN", "GEREJA WAISO"], lat: -3.6037, lng: 128.3352 },
  // Tulehu & Ehu
  { keywords: ["TULEHU", "EHU", "OKENG", "JEMBATAN DUA"], lat: -3.5970, lng: 128.3371 },
  // Waai & Ujung Batu
  { keywords: ["WAAI", "UJUNG", "BATU", "UJUNG BATU"], lat: -3.5752, lng: 128.3226 },
  // Passo Utama & Passo Pantai
  { keywords: ["PASSO", "PANTAI", "OTTOKWIK", "NEGERI LAMA"], lat: -3.6260, lng: 128.2500 },
  // Lateri & Halong
  { keywords: ["LATERI", "HALONG", "ZIPU", "MARTHA", "ONG"], lat: -3.6498, lng: 128.2391 },
  // Eri & Eri Lama
  { keywords: ["ERI", "ERI LAMA", "JOMI"], lat: -3.6512, lng: 128.2371 },
  // Kampung Baru, Kmp Pisang, Air Manis
  { keywords: ["KAMPUNG", "BARU", "PISANG", "AIR MANIS", "UD PATTIMURA"], lat: -3.7110, lng: 128.0999 },
];

export function isWaterCoordinate(lat: number, lng: number): boolean {
  if (!lat || !lng || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return true;

  // Teluk Ambon water body (Passo / Lateri / Halong / Galala shore)
  if (lat < -3.610 && lat > -3.665 && lng < 128.2510) return true;

  // Banda Sea / Baguala Bay (Tulehu / Suli / Waai / Natsepa coastal water)
  if (lat < -3.540 && lat > -3.625 && lng > 128.3360) return true;

  // Air Manis / Nusaniwe sea
  if (lat < -3.690 && lng < 128.1080) return true;

  // Outer bounds (far out in the sea surrounding Ambon)
  if (lat > -3.50 || lat < -3.75 || lng < 128.08 || lng > 128.38) return true;

  return false;
}

export const LOCALITY_LAND_ZONES = [
  {
    keywords: ["PASSO", "ERI", "JEMBATAN DUA", "OTTOKWIK", "NEGERI LAMA"],
    centerLat: -3.6275,
    centerLng: 128.2560,
  },
  {
    keywords: ["SULI", "NATSEPA", "UMURY", "ARI"],
    centerLat: -3.6210,
    centerLng: 128.2860,
  },
  {
    keywords: ["TULEHU", "EHU", "OKENG", "WAISO"],
    centerLat: -3.5960,
    centerLng: 128.3290,
  },
  {
    keywords: ["WAAI", "MARETA", "UJUNG BATU", "UJUNG"],
    centerLat: -3.5710,
    centerLng: 128.3240,
  },
  {
    keywords: ["LATERI", "HALONG", "ZIPU", "MARTHA", "ONG", "HT KECIL"],
    centerLat: -3.6510,
    centerLng: 128.2380,
  },
  {
    keywords: ["PATTIMURA", "KAMPUNG", "BARU", "PISANG", "AIR MANIS", "NANIA", "WAIHERU"],
    centerLat: -3.6220,
    centerLng: 128.2505,
  },
  {
    keywords: ["LIANG", "HUNIMUA"],
    centerLat: -3.5220,
    centerLng: 128.3310,
  },
];

export function snapToLandInBaguala(
  lat: number,
  lng: number,
  pnj?: string,
  namaPelanggan?: string,
  index: number = 0
): { lat: number; lng: number } {
  // If coordinates are already safely on land, retain them
  if (!isWaterCoordinate(lat, lng)) {
    return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
  }

  // Find matching land locality zone
  const searchText = `${pnj || ""} ${namaPelanggan || ""}`.toUpperCase();
  let matchedZone = LOCALITY_LAND_ZONES[0];

  for (const zone of LOCALITY_LAND_ZONES) {
    if (zone.keywords.some((kw) => searchText.includes(kw))) {
      matchedZone = zone;
      break;
    }
  }

  // Calculate realistic street/neighborhood offset on residential land
  const goldenAngle = 137.5 * (Math.PI / 180);
  const angle = (index * goldenAngle) % (2 * Math.PI);
  const radius = 0.0006 + ((index * 13) % 25) * 0.00012;
  const latOffset = radius * Math.cos(angle);
  const lngOffset = radius * Math.sin(angle);

  const finalLat = matchedZone.centerLat + latOffset;
  const finalLng = matchedZone.centerLng + lngOffset;

  return {
    lat: Number(finalLat.toFixed(6)),
    lng: Number(finalLng.toFixed(6)),
  };
}

export function getFallbackCoordinates(index: number, pnj?: string, namaPelanggan?: string): { lat: number; lng: number } {
  return snapToLandInBaguala(0, 0, pnj, namaPelanggan, index);
}

// Split CSV/TSV line handling quotes and auto-detecting delimiter (tab, semicolon, or comma)
export function parseCsvLine(line: string): string[] {
  if (line.includes("\t")) {
    return line.split("\t").map((c) => c.trim().replace(/^"|"$/g, ""));
  }

  const isSemicolon = (line.includes(";") && !line.includes(",")) || (line.split(";").length > line.split(",").length);
  const delimiter = isSemicolon ? ";" : ",";

  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(cur.trim().replace(/^"|"$/g, ""));
      cur = "";
    } else {
      cur += char;
    }
  }
  result.push(cur.trim().replace(/^"|"$/g, ""));
  return result;
}

export function parseCsvToMeters(csvText: string): MeterRecord[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const firstLineCols = parseCsvLine(lines[0]);
  const isHeader = firstLineCols.some((c) =>
    /lat|lng|long|pelanggan|nama|pnj|tarif|daya|meter|id/i.test(c)
  );

  let latIdx = -1;
  let lngIdx = -1;
  let idPelIdx = -1;
  let namaIdx = -1;
  let pnjIdx = -1;
  let tarifIdx = -1;
  let dayaIdx = -1;
  let jenisIdx = -1;
  let noMeterIdx = -1;
  let noMeterBaruIdx = -1;
  let statusIdx = -1;
  let petugasIdx = -1;
  let gantiMeterIdx = -1;
  let tanggalIdx = -1;

  if (isHeader) {
    firstLineCols.forEach((colHeader, idx) => {
      const lower = colHeader.toLowerCase().trim();
      if (/latitude|^lat$/i.test(lower) && !/long|lng/i.test(lower)) {
        latIdx = idx;
      } else if (/longitude|^long$|^lng$/i.test(lower)) {
        lngIdx = idx;
      } else if (/no\s*meter\s*baru|meter_baru/i.test(lower)) {
        noMeterBaruIdx = idx;
      } else if (/no\s*meter\s*lama|no_meter_lama|no\.?\s*meter/i.test(lower)) {
        noMeterIdx = idx;
      } else if (/id\s*pel|idpel|id_pel|id\s*pelanggan|^id$/i.test(lower)) {
        idPelIdx = idx;
      } else if (/nama/i.test(lower) && !/id/i.test(lower)) {
        namaIdx = idx;
      } else if (/pnj|alamat|lokasi/i.test(lower)) {
        pnjIdx = idx;
      } else if (/tarif/i.test(lower)) {
        tarifIdx = idx;
      } else if (/daya/i.test(lower)) {
        dayaIdx = idx;
      } else if (/jenis/i.test(lower)) {
        jenisIdx = idx;
      } else if (/status/i.test(lower)) {
        statusIdx = idx;
      } else if (/petugas/i.test(lower)) {
        petugasIdx = idx;
      } else if (/ganti|alasan/i.test(lower)) {
        gantiMeterIdx = idx;
      } else if (/tanggal|date/i.test(lower)) {
        tanggalIdx = idx;
      }
    });
  }

  const startRow = isHeader ? 1 : 0;
  const sampleDataRow = parseCsvLine(lines[startRow] || "");

  // Dynamic Column Auto-Detection via Data Content Heuristics
  if (idPelIdx === -1 || namaIdx === -1 || latIdx === -1 || lngIdx === -1) {
    sampleDataRow.forEach((val, idx) => {
      const cleaned = val.trim();
      if (/^\d{10,14}$/.test(cleaned) && cleaned.startsWith("4")) {
        if (idPelIdx === -1) idPelIdx = idx;
      } else if (/^\d{10,12}$/.test(cleaned) && cleaned.startsWith("3")) {
        if (noMeterIdx === -1) noMeterIdx = idx;
      } else if (/^-?3\.\d+|-?3,\d+/.test(cleaned)) {
        if (latIdx === -1) latIdx = idx;
      } else if (/^128\.\d+|^128,\d+/.test(cleaned)) {
        if (lngIdx === -1) lngIdx = idx;
      } else if (/^[RBSIM]\d/i.test(cleaned)) {
        if (tarifIdx === -1) tarifIdx = idx;
      } else if (/^(450|900|1300|2200|3500|4400|5500|6600|7700)$/.test(cleaned)) {
        if (dayaIdx === -1) dayaIdx = idx;
      } else if (/PRA|PASKA/i.test(cleaned)) {
        if (jenisIdx === -1) jenisIdx = idx;
      } else if (/[a-zA-Z*]{2,}/.test(cleaned) && !/PRA|PASKA|SELESAI|BELUM|METER/i.test(cleaned)) {
        if (namaIdx === -1 && idPelIdx !== idx) namaIdx = idx;
        else if (pnjIdx === -1 && namaIdx !== idx && idPelIdx !== idx) pnjIdx = idx;
      }
    });
  }

  // Fallback positional assignments if still undetected
  if (sampleDataRow.length >= 8 && sampleDataRow.length <= 15) {
    if (idPelIdx === -1) idPelIdx = 0;
    if (namaIdx === -1) namaIdx = 1;
    if (pnjIdx === -1) pnjIdx = 2;
    if (tarifIdx === -1) tarifIdx = 3;
    if (dayaIdx === -1) dayaIdx = 4;
    if (jenisIdx === -1) jenisIdx = 5;
    if (noMeterIdx === -1) noMeterIdx = 6;
    if (latIdx === -1) latIdx = 7;
    if (lngIdx === -1) lngIdx = 8;
  }

  const results: MeterRecord[] = [];

  for (let i = startRow; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 2) continue;

    const dataIndex = i - startRow;
    const initialFallback = INITIAL_METERS[dataIndex] || INITIAL_METERS[dataIndex % INITIAL_METERS.length];

    // Smart Per-Row extraction: Ensure idPel is numeric
    let idPel = idPelIdx >= 0 ? cols[idPelIdx] : "";
    if (!idPel || !/^\d{10,14}$/.test(idPel.trim())) {
      // Scan row for 10-14 digit number starting with 4
      const foundNumeric = cols.find((c) => /^\d{10,14}$/.test(c.trim()) && c.trim().startsWith("4"));
      if (foundNumeric) {
        idPel = foundNumeric.trim();
      } else {
        idPel = initialFallback?.idPelanggan || `411${100000000 + i}`;
      }
    }

    let nama = namaIdx >= 0 ? cols[namaIdx] : "";
    if (!nama || /^\d{10,14}$/.test(nama.trim())) {
      const foundText = cols.find(
        (c) => /[a-zA-Z]{3,}/.test(c.trim()) && !/^\d{10,14}$/.test(c.trim()) && !/PRA|PASKA|SELESAI|BELUM/i.test(c.trim())
      );
      if (foundText) {
        nama = foundText.trim();
      } else {
        nama = initialFallback?.namaPelanggan || `Pelanggan ${i}`;
      }
    }

    const pnjVal = (pnjIdx >= 0 ? cols[pnjIdx] : "") || initialFallback?.pnj || "BAGUALA";

    let rawLat = latIdx >= 0 ? parseCoordinate(cols[latIdx]) : null;
    let rawLng = lngIdx >= 0 ? parseCoordinate(cols[lngIdx]) : null;

    if (rawLat !== null && rawLng !== null) {
      if (Math.abs(rawLat) > 90 || (rawLat > 100 && rawLng < 0)) {
        const temp = rawLat;
        rawLat = rawLng;
        rawLng = temp;
      }
    }

    let finalLat: number;
    let finalLng: number;

    const initialMatch = INITIAL_METERS.find((m) => m.idPelanggan === idPel) || initialFallback;

    if (rawLat !== null && Math.abs(rawLat) <= 90 && rawLat !== 0) {
      finalLat = rawLat;
    } else if (initialMatch) {
      finalLat = initialMatch.latitude;
    } else {
      finalLat = getFallbackCoordinates(i, pnjVal, nama).lat;
    }

    if (rawLng !== null && Math.abs(rawLng) <= 180 && rawLng !== 0) {
      finalLng = rawLng;
    } else if (initialMatch) {
      finalLng = initialMatch.longitude;
    } else {
      finalLng = getFallbackCoordinates(i, pnjVal, nama).lng;
    }

    const jenisStr = (jenisIdx >= 0 ? cols[jenisIdx] : cols[5] || "").toUpperCase();
    const gantiStr = (gantiMeterIdx >= 0 ? cols[gantiMeterIdx] : cols[14] || "").toUpperCase();
    const statusStr = (statusIdx >= 0 ? cols[statusIdx] : cols[16] || "").toUpperCase();
    const noMeter = (noMeterIdx >= 0 ? cols[noMeterIdx] : "") || initialMatch?.noMeterLama || "";

    const snapped = snapToLandInBaguala(finalLat, finalLng, pnjVal, nama, i);

    results.push({
      id: `mtr-csv-${i}-${Date.now()}`,
      tanggal: (tanggalIdx >= 0 ? cols[tanggalIdx] : "") || new Date().toISOString().split("T")[0],
      idPelanggan: idPel,
      namaPelanggan: nama,
      tarif: (tarifIdx >= 0 ? cols[tarifIdx] : cols[3]) || initialMatch?.tarif || "R1",
      daya: parseInt((dayaIdx >= 0 ? cols[dayaIdx] : cols[4]) || "900", 10) || initialMatch?.daya || 900,
      noMeterLama: noMeter,
      noMeterBaru: (noMeterBaruIdx >= 0 ? cols[noMeterBaruIdx] : "") || "",
      noAgenda: `AGD-${Date.now()}-${i}`,
      noSnMaterialKwhMeter: "",
      noSnMaterialMcb: "",
      kabelTw: "Standard",
      segel: "BELUM",
      standBongkar: "0 kWh",
      jenis: jenisStr.includes("PRA") ? "PRA BAYAR" : "PASKA BAYAR",
      gantiMeter: gantiStr.includes("GANGGUAN") ? "METER GANGGUAN" : "METER TUA",
      petugas: ((petugasIdx >= 0 ? cols[petugasIdx] : "") || "ABDUL").toUpperCase() as any,
      status: statusStr === "SELESAI" ? "SELESAI" : "BELUM",
      pnj: pnjVal,
      latitude: snapped.lat,
      longitude: snapped.lng,
    });
  }

  return sanitizeAndRepairMeters(results);
}

export function sanitizeAndRepairMeters(meters: MeterRecord[]): MeterRecord[] {
  if (!meters || meters.length === 0) return [];

  const initialMapById = new Map<string, MeterRecord>();
  const initialMapByPel = new Map<string, MeterRecord>();
  INITIAL_METERS.forEach((m) => {
    initialMapById.set(m.id, m);
    initialMapByPel.set(m.idPelanggan, m);
  });

  return meters.map((m, idx) => {
    let currentIdPel = (m.idPelanggan || "").trim();
    let currentNama = (m.namaPelanggan || "").trim();

    // Check if currentIdPel is NOT valid numeric ID (must be 10-14 digits)
    const isValidIdPel = /^\d{10,14}$/.test(currentIdPel);

    // If ID Pel is invalid (contains letters, asterisks, etc.), attempt self-healing
    if (!isValidIdPel) {
      // 1. Check if m.id (e.g. "mtr-001") matches INITIAL_METERS
      const matchById = initialMapById.get(m.id);
      if (matchById) {
        currentIdPel = matchById.idPelanggan;
      } else if (idx < INITIAL_METERS.length) {
        // 2. Fallback to INITIAL_METERS[idx]
        currentIdPel = INITIAL_METERS[idx].idPelanggan;
      } else if (/^\d{10,14}$/.test(m.noMeterLama)) {
        // 3. Maybe noMeterLama was swapped
        currentIdPel = m.noMeterLama;
      } else if (m.idPelanggan && m.idPelanggan.match(/\d{10,14}/)) {
        const found = m.idPelanggan.match(/\d{10,14}/);
        if (found) currentIdPel = found[0];
      } else {
        currentIdPel = `4110${10000000 + idx}`;
      }
    }

    // Check if nama and idPel were swapped (e.g. nama is numeric and idPel is text)
    if (/^\d{10,14}$/.test(currentNama) && !/^\d{10,14}$/.test(m.idPelanggan)) {
      const temp = currentNama;
      currentNama = currentIdPel;
      currentIdPel = temp;
    }

    let lat = m.latitude;
    let lng = m.longitude;

    // Fix swapped coordinates if lat/lng were inverted
    if (Math.abs(lat) > 90 || (lat > 100 && lng < 0)) {
      const temp = lat;
      lat = lng;
      lng = temp;
    }

    const matchByPel = initialMapByPel.get(currentIdPel) || initialMapById.get(m.id);

    if (matchByPel) {
      // Restore true coordinates if available
      if (matchByPel.latitude && matchByPel.longitude) {
        lat = matchByPel.latitude;
        lng = matchByPel.longitude;
      }
      if (!currentNama || matchByPel.namaPelanggan.includes("*")) {
        currentNama = matchByPel.namaPelanggan;
      }
    } else {
      const isInvalid = !lat || !lng || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0);
      if (isInvalid) {
        const fallback = getFallbackCoordinates(idx, m.pnj, currentNama);
        lat = fallback.lat;
        lng = fallback.lng;
      }
    }

    const snapped = snapToLandInBaguala(lat, lng, m.pnj, currentNama, idx);

    return {
      ...m,
      idPelanggan: currentIdPel,
      namaPelanggan: currentNama,
      latitude: snapped.lat,
      longitude: snapped.lng,
    };
  });
}
