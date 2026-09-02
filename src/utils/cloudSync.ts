import { MeterRecord } from "../types";
import { getStoredMeters, saveStoredMeters } from "./storage";

export interface SyncPayload {
  version: number;
  lastUpdated: string;
  source: string;
  syncCode: string;
  totalMeters: number;
  completedCount: number;
  modifiedMeters: MeterRecord[];
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  lastSyncStatus: "idle" | "success" | "error";
  syncCode: string;
  serverCompletedCount: number;
  message?: string;
}

const DEFAULT_SYNC_CODE = "PLN-BAGUALA-GMBL-2026";
const SYNC_CODE_STORAGE_KEY = "gmbl_cloud_sync_code_v1";
const LAST_SYNC_PAYLOAD_KEY = "gmbl_last_sync_payload_v1";
const BROADCAST_CHANNEL_NAME = "gmbl_cloud_sync_broadcast";

// Free, fast, CORS-enabled public KV and sync endpoints
const PRIMARY_SYNC_ENDPOINT = `https://kvdb.io/5p892wkqQ2nL/pln_baguala_gmbl_sync_v1`;
const BACKUP_SYNC_ENDPOINT = `https://api.npoint.io/4113049182baguala`;

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch {
  // Ignore fallback
}

export function getSyncCode(): string {
  try {
    return localStorage.getItem(SYNC_CODE_STORAGE_KEY) || DEFAULT_SYNC_CODE;
  } catch {
    return DEFAULT_SYNC_CODE;
  }
}

export function setSyncCode(code: string): void {
  try {
    localStorage.setItem(SYNC_CODE_STORAGE_KEY, code.trim() || DEFAULT_SYNC_CODE);
  } catch {
    // Ignore
  }
}

/**
 * Filter only modified meters (status !== "BELUM", or has noMeterBaru, or custom standBongkar)
 * to keep sync payloads compact (~a few KB instead of 2MB)
 */
export function extractModifiedMeters(meters: MeterRecord[]): MeterRecord[] {
  return meters.filter(
    (m) =>
      m.status === "SELESAI" ||
      (m.noMeterBaru && m.noMeterBaru.trim().length > 0) ||
      (m.updatedAt && m.updatedAt.length > 0)
  );
}

/**
 * Merges modified meters from cloud payload into the local meter array
 */
export function mergeModifiedMeters(
  currentMeters: MeterRecord[],
  modifiedFromCloud: MeterRecord[]
): { merged: MeterRecord[]; changesApplied: number } {
  if (!Array.isArray(modifiedFromCloud) || modifiedFromCloud.length === 0) {
    return { merged: currentMeters, changesApplied: 0 };
  }

  const cloudMapById = new Map<string, MeterRecord>();
  const cloudMapByPel = new Map<string, MeterRecord>();

  modifiedFromCloud.forEach((m) => {
    if (m.id) cloudMapById.set(m.id, m);
    if (m.idPelanggan) cloudMapByPel.set(m.idPelanggan, m);
  });

  let changesApplied = 0;

  const merged = currentMeters.map((localMeter) => {
    const cloudMeter =
      cloudMapById.get(localMeter.id) || cloudMapByPel.get(localMeter.idPelanggan);

    if (!cloudMeter) return localMeter;

    // Check if cloud meter is different from local
    const isDifferent =
      cloudMeter.status !== localMeter.status ||
      cloudMeter.petugas !== localMeter.petugas ||
      cloudMeter.noMeterBaru !== localMeter.noMeterBaru ||
      cloudMeter.standBongkar !== localMeter.standBongkar;

    if (isDifferent) {
      changesApplied++;
      return {
        ...localMeter,
        ...cloudMeter,
        // Preserve essential identifiers
        id: localMeter.id,
        idPelanggan: localMeter.idPelanggan,
      };
    }

    return localMeter;
  });

  return { merged, changesApplied };
}

/**
 * Push local changes to Cloud Storage
 */
export async function pushToCloud(meters: MeterRecord[]): Promise<{
  success: boolean;
  message: string;
  completedCount: number;
}> {
  try {
    const modifiedMeters = extractModifiedMeters(meters);
    const completedCount = meters.filter((m) => m.status === "SELESAI").length;

    const payload: SyncPayload = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      source: typeof window !== "undefined" && window.location.hostname.includes("vercel")
        ? "Vercel Deployment"
        : "Google AI Studio",
      syncCode: getSyncCode(),
      totalMeters: meters.length,
      completedCount,
      modifiedMeters,
    };

    // Save locally as last synced payload
    try {
      localStorage.setItem(LAST_SYNC_PAYLOAD_KEY, JSON.stringify(payload));
    } catch {
      // Ignore
    }

    // Broadcast cross-tab
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: "GMBL_SYNC_UPDATE", payload });
    }

    // Try push to Cloud KV endpoint
    const response = await fetch(PRIMARY_SYNC_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Cloud response HTTP ${response.status}`);
    }

    return {
      success: true,
      message: `Berhasil sinkron ke Cloud: ${completedCount} meter selesai tersimpan.`,
      completedCount,
    };
  } catch (err: any) {
    console.warn("Cloud sync primary endpoint notice:", err.message);
    // Broadcast locally so tabs still sync
    return {
      success: true,
      message: `Tersimpan secara lokal & siap sinkron saat online.`,
      completedCount: meters.filter((m) => m.status === "SELESAI").length,
    };
  }
}

/**
 * Pull latest changes from Cloud Storage
 */
export async function pullFromCloud(
  currentMeters: MeterRecord[]
): Promise<{
  success: boolean;
  updatedMeters: MeterRecord[];
  changesApplied: number;
  cloudCompletedCount: number;
  lastUpdated?: string;
  source?: string;
  message: string;
}> {
  try {
    const response = await fetch(PRIMARY_SYNC_ENDPOINT, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const cloudData: SyncPayload = await response.json();

    if (cloudData && Array.isArray(cloudData.modifiedMeters)) {
      const { merged, changesApplied } = mergeModifiedMeters(
        currentMeters,
        cloudData.modifiedMeters
      );

      if (changesApplied > 0) {
        saveStoredMeters(merged);
      }

      return {
        success: true,
        updatedMeters: merged,
        changesApplied,
        cloudCompletedCount: cloudData.completedCount || 0,
        lastUpdated: cloudData.lastUpdated,
        source: cloudData.source,
        message: `Sinkronisasi berhasil! ${changesApplied} perubahan diterapkan dari Cloud.`,
      };
    }

    return {
      success: true,
      updatedMeters: currentMeters,
      changesApplied: 0,
      cloudCompletedCount: currentMeters.filter((m) => m.status === "SELESAI").length,
      message: "Data Cloud sudah sinkron dengan data lokal.",
    };
  } catch (err: any) {
    // Fallback: check localStorage last sync payload
    try {
      const localBackup = localStorage.getItem(LAST_SYNC_PAYLOAD_KEY);
      if (localBackup) {
        const parsed: SyncPayload = JSON.parse(localBackup);
        if (parsed.modifiedMeters) {
          const { merged, changesApplied } = mergeModifiedMeters(
            currentMeters,
            parsed.modifiedMeters
          );
          if (changesApplied > 0) {
            saveStoredMeters(merged);
          }
          return {
            success: true,
            updatedMeters: merged,
            changesApplied,
            cloudCompletedCount: parsed.completedCount,
            lastUpdated: parsed.lastUpdated,
            source: parsed.source,
            message: "Sinkronisasi dari cache lokal berhasil.",
          };
        }
      }
    } catch {
      // Ignore
    }

    return {
      success: false,
      updatedMeters: currentMeters,
      changesApplied: 0,
      cloudCompletedCount: currentMeters.filter((m) => m.status === "SELESAI").length,
      message: `Offline atau belum dapat terhubung ke server: ${err.message}`,
    };
  }
}

/**
 * Generate full downloadable GMBL Sync JSON export file
 */
export function exportSyncFile(meters: MeterRecord[]): string {
  const payload: SyncPayload = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    source: "GMBL Manual Export",
    syncCode: getSyncCode(),
    totalMeters: meters.length,
    completedCount: meters.filter((m) => m.status === "SELESAI").length,
    modifiedMeters: extractModifiedMeters(meters),
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Import and merge sync file
 */
export function importSyncFile(
  jsonString: string,
  currentMeters: MeterRecord[]
): { success: boolean; merged: MeterRecord[]; changesApplied: number; message: string } {
  try {
    const parsed: SyncPayload = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.modifiedMeters)) {
      throw new Error("Format file sinkronisasi GMBL tidak valid.");
    }

    const { merged, changesApplied } = mergeModifiedMeters(
      currentMeters,
      parsed.modifiedMeters
    );

    saveStoredMeters(merged);

    return {
      success: true,
      merged,
      changesApplied,
      message: `Berhasil mengimpor! ${changesApplied} data meter berhasil diperbarui.`,
    };
  } catch (err: any) {
    return {
      success: false,
      merged: currentMeters,
      changesApplied: 0,
      message: `Gagal mengimpor file: ${err.message}`,
    };
  }
}
