import * as XLSX from "xlsx";
import { MeterRecord } from "../types";
import { parseCsvToMeters, parseCoordinate, sanitizeAndRepairMeters } from "./csvParser";
import { INITIAL_METERS } from "../data/initialData";

/**
 * Parses an Excel file (.xlsx, .xls) or CSV buffer into MeterRecord array
 */
export function parseExcelBuffer(buffer: ArrayBuffer): MeterRecord[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [];

  // Convert worksheet to tab-delimited text to leverage csvParser
  const tsvText = XLSX.utils.sheet_to_csv(worksheet, { FS: "\t" });
  if (!tsvText || !tsvText.trim()) return [];

  return parseCsvToMeters(tsvText);
}

/**
 * Downloads current meter records as an Excel file (.xlsx)
 * Formatted with "Kordinat" column (-3.6037047905949,128.335212307342) matching PLN Baguala standard
 */
export function exportMetersToExcelFile(meters: MeterRecord[], filename?: string): void {
  const dataRows = meters.map((m) => {
    const coordString = `${m.latitude},${m.longitude}`;
    return {
      "ID Pel": m.idPelanggan,
      "NAMA": m.namaPelanggan,
      "PNJ": m.pnj,
      "TARIF": m.tarif,
      "DAYA": m.daya,
      "JENIS": m.jenis,
      "No Meter": m.noMeterLama || "",
      "Kordinat": coordString,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  // Set column widths for nice viewing in Excel
  worksheet["!cols"] = [
    { wch: 16 }, // ID Pel
    { wch: 28 }, // NAMA
    { wch: 30 }, // PNJ
    { wch: 10 }, // TARIF
    { wch: 10 }, // DAYA
    { wch: 14 }, // JENIS
    { wch: 16 }, // No Meter
    { wch: 36 }, // Kordinat (e.g. -3.6037047905949,128.335212307342)
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Meter Tua");

  const name = filename || `GMBL_Master_Data_Meter_Baguala_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, name);
}

/**
 * Generates and downloads a clean Excel template (.xlsx) with sample format matching Image 2
 */
export function downloadExcelTemplateFile(): void {
  const sampleRows = INITIAL_METERS.slice(0, 5).map((m) => ({
    "ID Pel": m.idPelanggan,
    "NAMA": m.namaPelanggan,
    "PNJ": m.pnj,
    "TARIF": m.tarif,
    "DAYA": m.daya,
    "JENIS": m.jenis,
    "No Meter": m.noMeterLama || "",
    "Kordinat": `${m.latitude},${m.longitude}`,
  }));

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);

  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 28 },
    { wch: 30 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 16 },
    { wch: 36 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template Master Data");

  XLSX.writeFile(workbook, "Template_Master_Data_Meter_GMBL.xlsx");
}
