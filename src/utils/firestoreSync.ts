import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  getDocFromServer,
  writeBatch,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { MeterRecord, UserAccount } from "../types";
import { saveStoredMeters, getStoredMeters, saveStoredUsers, getStoredUsers } from "./storage";
import { pushToCloud } from "./cloudSync";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
}

const COLLECTION_NAME = "meter_updates";
const MASTER_CHUNKS_COLLECTION = "master_dataset";
const SYNC_STATE_DOC = "master_meta";
const USERS_STATE_DOC = "user_accounts_meta";
const LOCAL_MASTER_SYNC_TIME_KEY = "gmbl_firestore_master_sync_time";

/**
 * Test initial Firestore connection
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "sync_state", "connection_check"));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore client is offline, using offline cache.");
    }
    return false;
  }
}

/**
 * Clean meter record for Firestore serialization (removing any undefined properties)
 */
function sanitizeMeterForFirestore(m: MeterRecord): Record<string, any> {
  const clean: Record<string, any> = {
    id: m.id || "",
    tanggal: m.tanggal || "",
    idPelanggan: m.idPelanggan || "",
    namaPelanggan: m.namaPelanggan || "",
    tarif: m.tarif || "",
    daya: Number(m.daya) || 0,
    noMeterLama: m.noMeterLama || "",
    noMeterBaru: m.noMeterBaru || "",
    noAgenda: m.noAgenda || "",
    noSnMaterialKwhMeter: m.noSnMaterialKwhMeter || "",
    noSnMaterialMcb: m.noSnMaterialMcb || "",
    kabelTw: m.kabelTw || "",
    segel: m.segel || "",
    standBongkar: m.standBongkar || "",
    jenis: m.jenis || "PASKA BAYAR",
    gantiMeter: m.gantiMeter || "METER TUA",
    petugas: m.petugas || "",
    status: m.status || "BELUM",
    pnj: m.pnj || "",
    latitude: Number(m.latitude) || -3.65,
    longitude: Number(m.longitude) || 128.2,
    updatedAt: m.updatedAt || new Date().toISOString(),
  };
  return clean;
}

/**
 * Real-time push for a single meter update to Firestore
 */
export async function syncMeterToFirestore(meter: MeterRecord): Promise<void> {
  try {
    const docId = meter.id || meter.idPelanggan;
    if (!docId) return;

    const data = sanitizeMeterForFirestore(meter);
    const docRef = doc(db, COLLECTION_NAME, docId);
    await setDoc(docRef, data, { merge: true });

    // Also update sync_state timestamp
    await setDoc(
      doc(db, "sync_state", "latest_update"),
      {
        lastMeterId: docId,
        updatedAt: new Date().toISOString(),
        source: typeof window !== "undefined" && window.location.hostname.includes("vercel") ? "Vercel" : "Google AI Studio",
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${meter.id}`);
  }
}

let isSyncingMaster = false;
let lastMasterSyncTimestamp = 0;

/**
 * Compact meter record for lightweight cloud storage
 */
function compactMeterForStorage(m: MeterRecord) {
  return {
    id: m.id,
    idPelanggan: m.idPelanggan,
    namaPelanggan: m.namaPelanggan,
    tarif: m.tarif,
    daya: m.daya,
    jenis: m.jenis,
    noMeterLama: m.noMeterLama,
    noMeterBaru: m.noMeterBaru || "",
    standBongkar: m.standBongkar || "",
    noSnMaterialKwhMeter: m.noSnMaterialKwhMeter || "",
    noSnMaterialMcb: m.noSnMaterialMcb || "",
    kabelTw: m.kabelTw || "",
    segel: m.segel || "",
    gantiMeter: m.gantiMeter || "METER TUA",
    petugas: m.petugas || "",
    status: m.status || "BELUM",
    pnj: m.pnj || "",
    latitude: Number(m.latitude) || -3.65,
    longitude: Number(m.longitude) || 128.2,
    updatedAt: m.updatedAt || "",
  };
}

/**
 * Upload multiple modified records in a batch with throttling
 */
export async function batchSyncMetersToFirestore(meters: MeterRecord[]): Promise<void> {
  const modified = meters.filter(
    (m) =>
      m.status === "SELESAI" ||
      (m.noMeterBaru && m.noMeterBaru.trim().length > 0)
  );

  if (modified.length === 0) return;

  try {
    const chunkSize = 200;
    for (let i = 0; i < modified.length; i += chunkSize) {
      const chunk = modified.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((meter) => {
        const docId = meter.id || meter.idPelanggan;
        if (docId) {
          const docRef = doc(db, COLLECTION_NAME, docId);
          batch.set(docRef, sanitizeMeterForFirestore(meter), { merge: true });
        }
      });
      await batch.commit();
      // Brief pause between batches to prevent socket write-stream saturation
      if (i + chunkSize < modified.length) {
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
  }
}

/**
 * Synchronize full Master Dataset to Firestore in compact, throttled chunks
 * Allows Google AI Studio and Vercel to have 100% identical master datasets automatically.
 */
export async function syncMasterDatasetToFirestore(meters: MeterRecord[]): Promise<{
  success: boolean;
  totalChunks: number;
  message: string;
}> {
  // Prevent concurrent or hyper-frequent uploads
  const now = Date.now();
  if (isSyncingMaster || (now - lastMasterSyncTimestamp < 15000)) {
    return {
      success: true,
      totalChunks: 0,
      message: "Sinkronisasi master data sedang berlangsung...",
    };
  }

  isSyncingMaster = true;
  lastMasterSyncTimestamp = now;

  try {
    if (!Array.isArray(meters) || meters.length === 0) {
      isSyncingMaster = false;
      return { success: false, totalChunks: 0, message: "Data master kosong." };
    }

    const compactedMeters = meters.map(compactMeterForStorage);
    const CHUNK_SIZE = 800;
    const totalChunks = Math.ceil(compactedMeters.length / CHUNK_SIZE);
    const updatedAt = new Date().toISOString();
    const source =
      typeof window !== "undefined" && window.location.hostname.includes("vercel")
        ? "Vercel Deployment"
        : "Google AI Studio";

    // 1. Write each chunk sequentially to Firestore with small throttling delay
    for (let i = 0; i < totalChunks; i++) {
      const slice = compactedMeters.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkDocRef = doc(db, MASTER_CHUNKS_COLLECTION, `chunk_${i}`);
      await setDoc(chunkDocRef, {
        chunkIndex: i,
        totalChunks,
        totalMeters: compactedMeters.length,
        metersJson: JSON.stringify(slice),
        updatedAt,
      });

      // Throttling to prevent WebSocket / stream buffer exhaustion
      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    // 2. Update master metadata document
    await setDoc(doc(db, "sync_state", SYNC_STATE_DOC), {
      totalMeters: compactedMeters.length,
      totalChunks,
      updatedAt,
      source,
    });

    try {
      localStorage.setItem(LOCAL_MASTER_SYNC_TIME_KEY, updatedAt);
    } catch {
      // Ignore
    }

    // 3. Also push completed meters & KV
    await pushToCloud(meters);

    return {
      success: true,
      totalChunks,
      message: `Master data (${meters.length} titik) berhasil tersinkron ke Firestore Cloud!`,
    };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, MASTER_CHUNKS_COLLECTION);
    return {
      success: false,
      totalChunks: 0,
      message: `Gagal sinkron master data ke Firestore: ${err?.message || err}`,
    };
  } finally {
    isSyncingMaster = false;
  }
}

/**
 * Fetch and reconstruct the synchronized Master Dataset from Firestore chunks
 */
export async function fetchMasterDatasetFromFirestore(): Promise<{
  success: boolean;
  meters: MeterRecord[] | null;
  updatedAt?: string;
  source?: string;
}> {
  try {
    const metaDocRef = doc(db, "sync_state", SYNC_STATE_DOC);
    const metaSnap = await getDoc(metaDocRef);

    if (!metaSnap.exists()) {
      return { success: false, meters: null };
    }

    const meta = metaSnap.data();
    const totalChunks = Number(meta.totalChunks) || 0;
    if (totalChunks === 0) {
      return { success: false, meters: null };
    }

    const chunkPromises = [];
    for (let i = 0; i < totalChunks; i++) {
      chunkPromises.push(getDoc(doc(db, MASTER_CHUNKS_COLLECTION, `chunk_${i}`)));
    }

    const chunkSnaps = await Promise.all(chunkPromises);
    const reconstructed: MeterRecord[] = [];

    for (const snap of chunkSnaps) {
      if (snap.exists()) {
        const chunkData = snap.data();
        if (chunkData.metersJson) {
          const parsedChunk: MeterRecord[] = JSON.parse(chunkData.metersJson);
          reconstructed.push(...parsedChunk);
        }
      }
    }

    if (reconstructed.length > 0) {
      saveStoredMeters(reconstructed);
      try {
        localStorage.setItem(LOCAL_MASTER_SYNC_TIME_KEY, meta.updatedAt || new Date().toISOString());
      } catch {
        // Ignore
      }
      return {
        success: true,
        meters: reconstructed,
        updatedAt: meta.updatedAt,
        source: meta.source,
      };
    }

    return { success: false, meters: null };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, MASTER_CHUNKS_COLLECTION);
    return { success: false, meters: null };
  }
}

/**
 * Real-time listener for Master Dataset changes in Firestore
 */
export function subscribeToFirestoreMasterDataset(
  onMasterUpdated: (meters: MeterRecord[], meta: { updatedAt: string; source: string }) => void
): Unsubscribe {
  const metaDocRef = doc(db, "sync_state", SYNC_STATE_DOC);

  return onSnapshot(
    metaDocRef,
    async (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.data();
      const cloudTime = data.updatedAt;
      const localTime = localStorage.getItem(LOCAL_MASTER_SYNC_TIME_KEY);

      // Only re-fetch if cloud has newer timestamp
      if (cloudTime && cloudTime !== localTime) {
        const res = await fetchMasterDatasetFromFirestore();
        if (res.success && res.meters && res.meters.length > 0) {
          onMasterUpdated(res.meters, {
            updatedAt: data.updatedAt,
            source: data.source || "Cloud",
          });
        }
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `sync_state/${SYNC_STATE_DOC}`);
    }
  );
}

/**
 * Subscribes to real-time updates from Firestore collection `meter_updates`.
 * Automatically merges incoming updates into current state and localStorage.
 */
export function subscribeToFirestoreMeterUpdates(
  getLatestMeters: () => MeterRecord[],
  onUpdate: (updatedMeters: MeterRecord[], changesCount: number) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTION_NAME);

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) return;

      const currentMeters = getLatestMeters();
      const updatesMapById = new Map<string, Record<string, any>>();
      const updatesMapByPel = new Map<string, Record<string, any>>();

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.id) updatesMapById.set(String(data.id), data);
        if (data.idPelanggan) updatesMapByPel.set(String(data.idPelanggan), data);
      });

      let changesCount = 0;
      const mergedMeters = currentMeters.map((localMeter) => {
        const cloudData =
          updatesMapById.get(localMeter.id) ||
          updatesMapByPel.get(localMeter.idPelanggan);

        if (!cloudData) return localMeter;

        const isDifferent =
          cloudData.status !== localMeter.status ||
          cloudData.petugas !== localMeter.petugas ||
          cloudData.noMeterBaru !== localMeter.noMeterBaru ||
          cloudData.standBongkar !== localMeter.standBongkar ||
          cloudData.noSnMaterialKwhMeter !== localMeter.noSnMaterialKwhMeter ||
          cloudData.noSnMaterialMcb !== localMeter.noSnMaterialMcb ||
          cloudData.segel !== localMeter.segel ||
          (cloudData.latitude && Math.abs(cloudData.latitude - localMeter.latitude) > 0.00001) ||
          (cloudData.longitude && Math.abs(cloudData.longitude - localMeter.longitude) > 0.00001);

        if (isDifferent) {
          changesCount++;
          return {
            ...localMeter,
            ...cloudData,
            id: localMeter.id,
            idPelanggan: localMeter.idPelanggan,
          };
        }

        return localMeter;
      });

      if (changesCount > 0) {
        saveStoredMeters(mergedMeters);
        onUpdate(mergedMeters, changesCount);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    }
  );
}

/**
 * One-time initial fetch from Firestore to merge on app launch
 */
export async function fetchInitialFirestoreUpdates(
  currentMeters: MeterRecord[]
): Promise<{ updatedMeters: MeterRecord[]; changesApplied: number }> {
  try {
    // 1. Check if master dataset exists in Firestore
    const masterRes = await fetchMasterDatasetFromFirestore();
    let baseMeters = currentMeters;
    if (masterRes.success && masterRes.meters && masterRes.meters.length > 0) {
      baseMeters = masterRes.meters;
    }

    // 2. Fetch individual meter updates
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      return { updatedMeters: baseMeters, changesApplied: masterRes.success ? baseMeters.length : 0 };
    }

    const updatesMapById = new Map<string, Record<string, any>>();
    const updatesMapByPel = new Map<string, Record<string, any>>();

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.id) updatesMapById.set(String(data.id), data);
      if (data.idPelanggan) updatesMapByPel.set(String(data.idPelanggan), data);
    });

    let changesApplied = 0;
    const mergedMeters = baseMeters.map((localMeter) => {
      const cloudData =
        updatesMapById.get(localMeter.id) ||
        updatesMapByPel.get(localMeter.idPelanggan);

      if (!cloudData) return localMeter;

      const isDifferent =
        cloudData.status !== localMeter.status ||
        cloudData.petugas !== localMeter.petugas ||
        cloudData.noMeterBaru !== localMeter.noMeterBaru ||
        cloudData.standBongkar !== localMeter.standBongkar;

      if (isDifferent) {
        changesApplied++;
        return {
          ...localMeter,
          ...cloudData,
          id: localMeter.id,
          idPelanggan: localMeter.idPelanggan,
        };
      }

      return localMeter;
    });

    if (changesApplied > 0 || masterRes.success) {
      saveStoredMeters(mergedMeters);
    }

    return { updatedMeters: mergedMeters, changesApplied };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    return { updatedMeters: currentMeters, changesApplied: 0 };
  }
}

/**
 * User accounts synchronization with Firestore
 */
export async function syncUsersToFirestore(users: UserAccount[]): Promise<void> {
  try {
    await setDoc(doc(db, "sync_state", USERS_STATE_DOC), {
      usersJson: JSON.stringify(users),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `sync_state/${USERS_STATE_DOC}`);
  }
}

export async function fetchUsersFromFirestore(): Promise<UserAccount[] | null> {
  try {
    const snap = await getDoc(doc(db, "sync_state", USERS_STATE_DOC));
    if (snap.exists() && snap.data().usersJson) {
      let users: UserAccount[] = JSON.parse(snap.data().usersJson);
      if (Array.isArray(users) && users.length > 0) {
        // Ensure PETUGAS GM exists even if old cloud data doesn't have it
        const hasPetugas = users.some((u) => u.email.toLowerCase() === "petugasgm");
        if (!hasPetugas) {
          users.push({
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
        saveStoredUsers(users);
        return users;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `sync_state/${USERS_STATE_DOC}`);
  }
  return null;
}

