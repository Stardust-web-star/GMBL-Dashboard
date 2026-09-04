import { INITIAL_METERS, INITIAL_USERS } from "../data/initialData";
import { ExcelSyncConfig, MasterExcelMeta, MeterRecord, UserAccount } from "../types";
import { sanitizeAndRepairMeters } from "./csvParser";

const METERS_STORAGE_KEY = "gmbl_meters_data_v1";
const USERS_STORAGE_KEY = "gmbl_users_data_v1";
const AUTH_STORAGE_KEY = "gmbl_current_user_v1";
const SHEET_CONFIG_KEY = "gmbl_sheet_config_v1";
const MASTER_EXCEL_META_KEY = "gmbl_master_excel_meta_v1";
const MASTER_EXCEL_BACKUP_KEY = "gmbl_master_excel_backup_v1";

// Meter Records API
export function getStoredMeters(): MeterRecord[] {
  try {
    const data = localStorage.getItem(METERS_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(METERS_STORAGE_KEY, JSON.stringify(INITIAL_METERS));
      return INITIAL_METERS;
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length < 6246) {
      console.log("Upgrading device local storage to full 6246 Master Dataset...");
      const merged = mergeMetersWithExisting(parsed, INITIAL_METERS);
      saveStoredMeters(merged);
      return merged;
    }
    const repaired = sanitizeAndRepairMeters(parsed);
    saveStoredMeters(repaired);
    return repaired;
  } catch (err) {
    console.error("Failed to read meters from localStorage:", err);
    return INITIAL_METERS;
  }
}

export function saveStoredMeters(meters: MeterRecord[]): void {
  try {
    localStorage.setItem(METERS_STORAGE_KEY, JSON.stringify(meters));
  } catch (err) {
    console.error("Failed to save meters to localStorage:", err);
  }
}

export function addMeterRecord(record: Omit<MeterRecord, "id">): MeterRecord {
  const meters = getStoredMeters();
  const newRecord: MeterRecord = {
    ...record,
    id: `mtr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    updatedAt: new Date().toISOString(),
  };
  const updated = [newRecord, ...meters];
  saveStoredMeters(updated);
  return newRecord;
}

export function updateMeterRecord(id: string, updates: Partial<MeterRecord>): MeterRecord | null {
  const meters = getStoredMeters();
  let updatedRecord: MeterRecord | null = null;
  const updated = meters.map((m) => {
    if (m.id === id) {
      updatedRecord = {
        ...m,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return updatedRecord;
    }
    return m;
  });
  saveStoredMeters(updated);
  return updatedRecord;
}

export function deleteMeterRecord(id: string): void {
  const meters = getStoredMeters();
  const updated = meters.filter((m) => m.id !== id);
  saveStoredMeters(updated);
}

export function resetMetersToDefault(): MeterRecord[] {
  saveStoredMeters(INITIAL_METERS);
  return INITIAL_METERS;
}

// User Accounts API
export function getStoredUsers(): UserAccount[] {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed: UserAccount[] = JSON.parse(data);
    let filtered = parsed.filter(
      (u) => u.email !== "supervisor.baguala@pln.co.id"
    );

    // Ensure muhammadnurbella20@gmail.com admin exists and is updated to Acho (super_admin)
    let hasBella = false;
    let hasPetugasGm = false;

    filtered = filtered.map((u) => {
      if (u.email.toLowerCase() === "muhammadnurbella20@gmail.com") {
        hasBella = true;
        return {
          ...u,
          name: "Acho",
          role: "super_admin" as const,
        };
      }
      if (u.email.toLowerCase() === "petugasgm") {
        hasPetugasGm = true;
        return {
          ...u,
          name: "PETUGAS GM",
          role: "petugas" as const,
          password: "pw123!",
        };
      }
      return u;
    });

    if (!hasBella) {
      filtered.push({
        id: "usr-admin-02",
        email: "muhammadnurbella20@gmail.com",
        name: "Acho",
        role: "super_admin",
        status: "active",
        createdAt: "2026-09-01",
        lastLogin: "2026-09-01 17:00",
        password: "admin",
      });
    }

    if (!hasPetugasGm) {
      filtered.push({
        id: "usr-petugas-01",
        email: "petugasgm",
        name: "PETUGAS GM",
        role: "petugas",
        status: "active",
        createdAt: "2026-09-03",
        lastLogin: "2026-09-03 10:00",
        password: "pw123!",
      });
    }

    saveStoredUsers(filtered);
    return filtered;
  } catch (err) {
    console.error("Failed to read users from localStorage:", err);
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error("Failed to save users to localStorage:", err);
  }
}

export function addUserAccount(
  email: string,
  name: string,
  role: UserAccount["role"] = "admin",
  password?: string
): UserAccount {
  const users = getStoredUsers();
  const newUser: UserAccount = {
    id: `usr-${Date.now()}`,
    email: email.trim().toLowerCase(),
    name: name || email.split("@")[0],
    role,
    status: "active",
    createdAt: new Date().toISOString().split("T")[0],
    password: password || "admin",
  };
  const updated = [...users, newUser];
  saveStoredUsers(updated);
  return newUser;
}

export function deleteUserAccount(id: string): void {
  const users = getStoredUsers();
  const updated = users.filter((u) => u.id !== id);
  saveStoredUsers(updated);
}

// Auth Session Management (using sessionStorage for tab-scoped session)
export function getCurrentSessionUser(): UserAccount | null {
  try {
    // Purge legacy localStorage auth key if present
    localStorage.removeItem(AUTH_STORAGE_KEY);
    const data = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Auth session read error:", err);
  }
  return null;
}

export function setCurrentSessionUser(user: UserAccount | null): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (user) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (err) {
    console.error("Auth session write error:", err);
  }
}

// Excel Sync Config API
export function getExcelSyncConfig(): ExcelSyncConfig {
  try {
    const data = localStorage.getItem(SHEET_CONFIG_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Excel config read error:", err);
  }
  return {
    autoSync: false,
  };
}

export function saveExcelSyncConfig(config: ExcelSyncConfig): void {
  try {
    localStorage.setItem(SHEET_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error("Excel config write error:", err);
  }
}

// CSV Export & Import Helper for Google Sheet Syncing
export function exportMetersToCSV(meters: MeterRecord[], decimalSeparator: "," | "." = ","): string {
  const headers = [
    "TANGGAL",
    "ID PELANGGAN",
    "NAMA PELANGGAN",
    "TARIF",
    "DAYA",
    "NO METER LAMA",
    "NO METER BARU",
    "NO AGENDA",
    "NO SN MATERIAL KWH METER",
    "NO SN MATERIAL MCB",
    "KABEL TW",
    "SEGEL",
    "STAND BONGKAR",
    "JENIS",
    "GANTI METER",
    "PETUGAS",
    "STATUS",
    "PNJ / LOKASI",
    "KORDINAT",
    "LATITUDE",
    "LONGITUDE",
  ];

  const formatCoord = (val: number) => {
    const s = String(val);
    return decimalSeparator === "," ? s.replace(".", ",") : s;
  };

  const rows = meters.map((m) => [
    m.tanggal,
    `"${m.idPelanggan}"`,
    `"${m.namaPelanggan.replace(/"/g, '""')}"`,
    m.tarif,
    m.daya,
    `"${m.noMeterLama}"`,
    `"${m.noMeterBaru}"`,
    `"${m.noAgenda}"`,
    `"${m.noSnMaterialKwhMeter}"`,
    `"${m.noSnMaterialMcb}"`,
    `"${m.kabelTw}"`,
    `"${m.segel}"`,
    `"${m.standBongkar}"`,
    m.jenis,
    m.gantiMeter,
    m.petugas,
    m.status,
    `"${(m.pnj || "").replace(/"/g, '""')}"`,
    `"${m.latitude},${m.longitude}"`,
    formatCoord(m.latitude),
    formatCoord(m.longitude),
  ]);

  const delimiter = decimalSeparator === "," ? ";" : ",";
  return [headers.join(delimiter), ...rows.map((r) => r.join(delimiter))].join("\n");
}

// Master Excel Data Metadata & Backup API
export function getMasterExcelMeta(): MasterExcelMeta | null {
  try {
    const data = localStorage.getItem(MASTER_EXCEL_META_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Master Excel metadata read error:", err);
  }
  return null;
}

export function saveMasterExcelMeta(meta: MasterExcelMeta): void {
  try {
    localStorage.setItem(MASTER_EXCEL_META_KEY, JSON.stringify(meta));
  } catch (err) {
    console.error("Master Excel metadata write error:", err);
  }
}

export function saveMasterExcelBackup(meters: MeterRecord[]): void {
  try {
    localStorage.setItem(MASTER_EXCEL_BACKUP_KEY, JSON.stringify(meters));
  } catch (err) {
    console.error("Master Excel backup save error:", err);
  }
}

export function getMasterExcelBackup(): MeterRecord[] | null {
  try {
    const data = localStorage.getItem(MASTER_EXCEL_BACKUP_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Master Excel backup read error:", err);
  }
  return null;
}

/**
 * Smart merge function that preserves user tagging (latitude/longitude),
 * completed meter replacement statuses, and replacement hardware serial numbers
 * when updated Excel sheets are imported.
 */
export function mergeMetersWithExisting(
  existingMeters: MeterRecord[],
  incomingMeters: MeterRecord[]
): MeterRecord[] {
  const existingMap = new Map<string, MeterRecord>();
  existingMeters.forEach((m) => {
    if (m.idPelanggan && m.idPelanggan.trim()) {
      existingMap.set(m.idPelanggan.trim(), m);
    }
    if (m.noMeterLama && m.noMeterLama.trim()) {
      existingMap.set(m.noMeterLama.trim(), m);
    }
  });

  const mergedList: MeterRecord[] = incomingMeters.map((incoming) => {
    const match =
      (incoming.idPelanggan && existingMap.get(incoming.idPelanggan.trim())) ||
      (incoming.noMeterLama && existingMap.get(incoming.noMeterLama.trim()));

    if (!match) return incoming;

    // Check coordinate validity
    const existingHasValidCoords = Boolean(
      match.latitude && match.longitude && match.latitude !== 0
    );
    const incomingHasValidCoords = Boolean(
      incoming.latitude && incoming.longitude && incoming.latitude !== 0
    );

    return {
      ...incoming,
      id: match.id,
      // Keep existing location tagging if incoming doesn't bring explicit valid custom coordinates
      latitude: incomingHasValidCoords ? incoming.latitude : (existingHasValidCoords ? match.latitude : incoming.latitude),
      longitude: incomingHasValidCoords ? incoming.longitude : (existingHasValidCoords ? match.longitude : incoming.longitude),
      status: match.status === "SELESAI" ? "SELESAI" : incoming.status,
      noMeterBaru: incoming.noMeterBaru || match.noMeterBaru || "",
      noAgenda: incoming.noAgenda || match.noAgenda || "",
      noSnMaterialKwhMeter: incoming.noSnMaterialKwhMeter || match.noSnMaterialKwhMeter || "",
      noSnMaterialMcb: incoming.noSnMaterialMcb || match.noSnMaterialMcb || "",
      kabelTw: incoming.kabelTw || match.kabelTw || "",
      segel: incoming.segel || match.segel || "",
      standBongkar: incoming.standBongkar || match.standBongkar || "",
      petugas: match.status === "SELESAI" ? match.petugas : incoming.petugas,
      tanggal: match.tanggal || incoming.tanggal,
      updatedAt: new Date().toISOString(),
    };
  });

  return mergedList;
}
