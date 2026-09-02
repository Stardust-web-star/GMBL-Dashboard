import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  getDocFromServer,
  writeBatch,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { MeterRecord } from "../types";
import { saveStoredMeters } from "./storage";

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
    petugas: m.petugas || "ABDUL",
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
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${meter.id}`);
  }
}

/**
 * Upload multiple modified records in a batch
 */
export async function batchSyncMetersToFirestore(meters: MeterRecord[]): Promise<void> {
  const modified = meters.filter(
    (m) =>
      m.status === "SELESAI" ||
      (m.noMeterBaru && m.noMeterBaru.trim().length > 0)
  );

  if (modified.length === 0) return;

  try {
    // Firestore batch supports up to 500 operations per batch
    const chunkSize = 400;
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
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
  }
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
          cloudData.segel !== localMeter.segel;

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
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      // If Firestore is empty but local has completed meters, seed Firestore
      const completed = currentMeters.filter((m) => m.status === "SELESAI");
      if (completed.length > 0) {
        await batchSyncMetersToFirestore(completed);
      }
      return { updatedMeters: currentMeters, changesApplied: 0 };
    }

    const updatesMapById = new Map<string, Record<string, any>>();
    const updatesMapByPel = new Map<string, Record<string, any>>();

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.id) updatesMapById.set(String(data.id), data);
      if (data.idPelanggan) updatesMapByPel.set(String(data.idPelanggan), data);
    });

    let changesApplied = 0;
    const mergedMeters = currentMeters.map((localMeter) => {
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

    if (changesApplied > 0) {
      saveStoredMeters(mergedMeters);
    }

    return { updatedMeters: mergedMeters, changesApplied };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    return { updatedMeters: currentMeters, changesApplied: 0 };
  }
}
