export type JenisMeter = "PASKA BAYAR" | "PRA BAYAR";
export type AlasanGanti = "METER GANGGUAN" | "METER TUA";
export type StatusGanti = "SELESAI" | "BELUM";

export const PETUGAS_LIST = [
  "ABDUL",
  "ANDRE",
  "AUNUR",
  "FEKI",
  "FRANS",
  "GABRIEL",
  "HANS",
  "HARDIN",
  "ONYONG",
  "PIYER",
  "RAHMAT",
  "RISKI",
  "SALOMO",
  "VAL",
  "YONO",
  "YUSRIL",
] as const;

export type PetugasName = (typeof PETUGAS_LIST)[number];

export interface MeterRecord {
  id: string;
  tanggal: string;
  idPelanggan: string;
  namaPelanggan: string;
  tarif: string;
  daya: number;
  noMeterLama: string;
  noMeterBaru: string;
  noAgenda: string;
  noSnMaterialKwhMeter: string;
  noSnMaterialMcb: string;
  kabelTw: string;
  segel: string;
  standBongkar: string;
  jenis: JenisMeter;
  gantiMeter: AlasanGanti;
  petugas: PetugasName;
  status: StatusGanti;
  pnj: string;
  latitude: number;
  longitude: number;
  updatedAt?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "petugas";
  status: "active" | "inactive";
  createdAt: string;
  lastLogin?: string;
  password?: string;
}

export interface ExcelSyncConfig {
  lastSyncTimestamp?: string;
  autoSync?: boolean;
}

export interface MasterExcelMeta {
  fileName: string;
  uploadedAt: string;
  totalRecords: number;
  taggedCount: number;
  source: "upload" | "paste" | "default";
}
