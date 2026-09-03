import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MeterRecord, UserAccount, PetugasName } from "./types";
import {
  addMeterRecord,
  addUserAccount,
  deleteMeterRecord,
  deleteUserAccount,
  getCurrentSessionUser,
  getStoredMeters,
  getStoredUsers,
  saveStoredMeters,
  saveStoredUsers,
  setCurrentSessionUser,
  updateMeterRecord,
} from "./utils/storage";
import { pullFromCloud, pushToCloud } from "./utils/cloudSync";
import {
  syncMeterToFirestore,
  batchSyncMetersToFirestore,
  syncMasterDatasetToFirestore,
  fetchMasterDatasetFromFirestore,
  subscribeToFirestoreMasterDataset,
  subscribeToFirestoreMeterUpdates,
  fetchInitialFirestoreUpdates,
  testFirestoreConnection,
  syncUsersToFirestore,
  fetchUsersFromFirestore,
} from "./utils/firestoreSync";
import { LoginScreen } from "./components/LoginScreen";
import { Navbar, TopHeader, MenuTab } from "./components/Navbar";
import { PetaLokasiMap } from "./components/PetaLokasiMap";
import { DataMeterTua } from "./components/DataMeterTua";
import { InputDataGantiMeter } from "./components/InputDataGantiMeter";
import { InformasiAnalytics } from "./components/InformasiAnalytics";
import { DokumenPrint } from "./components/DokumenPrint";
import { ManagementUser } from "./components/ManagementUser";
import { ExcelSyncModal } from "./components/ExcelSyncModal";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    getCurrentSessionUser()
  );
  const [meters, setMeters] = useState<MeterRecord[]>(() => getStoredMeters());
  const [users, setUsers] = useState<UserAccount[]>(() => getStoredUsers());

  const [activeTab, setActiveTab] = useState<MenuTab>("peta");
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedMeterForDoc, setSelectedMeterForDoc] = useState<MeterRecord | null>(null);
  const [editingMeter, setEditingMeter] = useState<MeterRecord | null>(null);
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncSuccessTime, setLastSyncSuccessTime] = useState<string>("");

  const metersRef = useRef(meters);
  const isPullingRef = useRef(false);
  useEffect(() => {
    metersRef.current = meters;
  }, [meters]);

  // Initial and periodic background cloud synchronization between Studio, Vercel & devices
  const triggerPullCloud = useCallback(async () => {
    if (isPullingRef.current) return;
    isPullingRef.current = true;
    setIsSyncing(true);
    try {
      const current = metersRef.current;
      // 1. Check Firestore initial/delta updates & master data
      const fsRes = await fetchInitialFirestoreUpdates(current);
      if (fsRes.changesApplied > 0 || fsRes.updatedMeters.length !== current.length) {
        setMeters(fsRes.updatedMeters);
        console.log(`[FirestoreSync] Synced ${fsRes.changesApplied} updates from Firestore.`);
      }

      // 2. Sync user accounts from Firestore
      const cloudUsers = await fetchUsersFromFirestore();
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
      }

      // 3. Also check fallback cloud sync
      const res = await pullFromCloud(metersRef.current);
      if (res.success && res.changesApplied > 0) {
        setMeters(res.updatedMeters);
        console.log(`[AutoSync] Synced ${res.changesApplied} updates between AI Studio & Vercel.`);
      }
      setLastSyncSuccessTime(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.warn("[AutoSync] Background check notice:", err);
    } finally {
      setIsSyncing(false);
      isPullingRef.current = false;
    }
  }, []);

  // Initial sync on startup & real-time Firestore subscriptions
  useEffect(() => {
    // 1. Connection check and initial fetch
    testFirestoreConnection().catch(() => {});
    triggerPullCloud();

    // 2. Real-time Firestore onSnapshot listener for per-meter updates
    const unsubscribeMeterUpdates = subscribeToFirestoreMeterUpdates(
      () => metersRef.current,
      (updatedMeters, count) => {
        setMeters(updatedMeters);
        setLastSyncSuccessTime(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        console.log(`[Firestore Real-Time] Received ${count} meter updates from Cloud!`);
      }
    );

    // 3. Real-time Firestore listener for Master Dataset modifications across Studio & Vercel
    const unsubscribeMasterDataset = subscribeToFirestoreMasterDataset(
      (newMasterMeters, meta) => {
        setMeters(newMasterMeters);
        setLastSyncSuccessTime(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        console.log(`[Firestore Master Dataset] Master data synchronized from ${meta.source} (${newMasterMeters.length} records).`);
      }
    );

    // 4. Fallback periodic polling every 30 seconds
    const pollTimer = setInterval(() => {
      triggerPullCloud();
    }, 30000);

    // 6. Multi-tab BroadcastChannel listener
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("gmbl_cloud_sync_broadcast");
        channel.onmessage = (event) => {
          if (event.data?.type === "GMBL_SYNC_UPDATE") {
            setMeters(getStoredMeters());
          }
        };
      }
    } catch {
      // Ignore
    }

    // 7. Window focus listener to refresh when switching tabs / returning to app
    const handleFocus = () => {
      triggerPullCloud();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      unsubscribeMeterUpdates();
      unsubscribeMasterDataset();
      clearInterval(pollTimer);
      window.removeEventListener("focus", handleFocus);
      if (channel) channel.close();
    };
  }, [triggerPullCloud]);

  // Auto logout user after 10 minutes (600,000ms) of inactivity on dashboard
  useEffect(() => {
    if (!currentUser) return;

    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
    let lastActivityTime = Date.now();

    const handleUserActivity = () => {
      lastActivityTime = Date.now();
    };

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    const checkInterval = setInterval(() => {
      const inactiveDuration = Date.now() - lastActivityTime;
      if (inactiveDuration >= INACTIVITY_TIMEOUT_MS) {
        setCurrentSessionUser(null);
        setCurrentUser(null);
        setLogoutNotice(
          "Sesi Anda telah berakhir karena tidak ada aktivitas selama 10 menit. Silakan login kembali."
        );
      }
    }, 5000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(checkInterval);
    };
  }, [currentUser]);

  // Sync state with storage and cloud when changed
  const handleUpdateMeterStatus = (
    id: string,
    newStatus: "SELESAI" | "BELUM",
    petugas?: PetugasName,
    additionalData?: Partial<MeterRecord>
  ) => {
    const updatePayload: Partial<MeterRecord> = {
      status: newStatus,
      ...(petugas ? { petugas } : {}),
      ...(additionalData || {}),
    };
    const updated = updateMeterRecord(id, updatePayload);
    if (updated) {
      const newMeters = getStoredMeters();
      setMeters(newMeters);
      const targetMeter = newMeters.find((m) => m.id === id);
      if (targetMeter) {
        // Direct real-time push to Firestore
        syncMeterToFirestore(targetMeter).catch(() => {});
      }
      // Auto-broadcast to Cloud
      pushToCloud(newMeters).catch(() => {});
    }
  };

  const handleSaveMeterRecord = (record: Omit<MeterRecord, "id">) => {
    let savedId = editingMeter?.id;
    if (editingMeter) {
      updateMeterRecord(editingMeter.id, record);
      setEditingMeter(null);
    } else {
      const created = addMeterRecord(record);
      savedId = created.id;
    }
    const newMeters = getStoredMeters();
    setMeters(newMeters);
    if (savedId) {
      const targetMeter = newMeters.find((m) => m.id === savedId);
      if (targetMeter) {
        syncMeterToFirestore(targetMeter).catch(() => {});
      }
    }
    pushToCloud(newMeters).catch(() => {});
    setActiveTab("data");
  };

  const handleDeleteMeter = (id: string) => {
    deleteMeterRecord(id);
    const newMeters = getStoredMeters();
    setMeters(newMeters);
    pushToCloud(newMeters).catch(() => {});
  };

  const handleAddUser = (email: string, name: string, role: UserAccount["role"], password?: string) => {
    addUserAccount(email, name, role, password);
    const newUsers = getStoredUsers();
    setUsers(newUsers);
    syncUsersToFirestore(newUsers).catch(() => {});
  };

  const handleDeleteUser = (id: string) => {
    deleteUserAccount(id);
    const newUsers = getStoredUsers();
    setUsers(newUsers);
    syncUsersToFirestore(newUsers).catch(() => {});
  };

  const handleSelectForDocument = (meter: MeterRecord) => {
    setSelectedMeterForDoc(meter);
    setActiveTab("dokumen");
  };

  const handleOpenEditModal = (meter: MeterRecord) => {
    setEditingMeter(meter);
    setActiveTab("input");
  };

  const handleLogout = () => {
    setCurrentSessionUser(null);
    setCurrentUser(null);
    setLogoutNotice(null);
  };

  const pendingCount = meters.filter((m) => m.status === "BELUM").length;
  const completedCount = meters.filter((m) => m.status === "SELESAI").length;

  return (
    <div className="relative h-screen w-full bg-slate-900 font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 overflow-hidden">
      <AnimatePresence mode="wait">
        {!currentUser ? (
          <motion.div
            key="login-screen-view"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="h-full w-full"
          >
            <LoginScreen
              logoutNotice={logoutNotice}
              onLoginSuccess={(user) => {
                setLogoutNotice(null);
                setCurrentUser(user);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="main-dashboard-view"
            initial={{ opacity: 0, scale: 0.97, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -15, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-screen w-full bg-slate-900 text-slate-800 overflow-hidden"
          >
            {/* Left Floating Sidebar Navigation */}
            <Navbar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              currentUser={currentUser}
              onLogout={handleLogout}
              onOpenSheetSync={() => setIsSheetModalOpen(true)}
              pendingCount={pendingCount}
              completedCount={completedCount}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
            />

            {/* Main Content Workspace Column */}
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-slate-50 lg:m-4 lg:rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden relative">
              {/* Top Header Bar */}
              <TopHeader
                activeTab={activeTab}
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
                isSyncing={isSyncing}
                lastSyncTime={lastSyncSuccessTime}
                onManualSync={triggerPullCloud}
              />

              {/* View Container with Smooth Motion Transitions */}
              <main className="flex-1 overflow-y-auto bg-slate-50 relative pb-20 lg:pb-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12, scale: 0.995 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.995 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full w-full"
                  >
                    {activeTab === "peta" && (
                      <PetaLokasiMap
                        meters={meters}
                        onUpdateMeterStatus={handleUpdateMeterStatus}
                        onSelectForDocument={handleSelectForDocument}
                      />
                    )}

                    {activeTab === "data" && (
                      <DataMeterTua
                        meters={meters}
                        onUpdateMeterStatus={handleUpdateMeterStatus}
                        onDeleteMeter={handleDeleteMeter}
                        onSelectForDocument={handleSelectForDocument}
                        onOpenEditModal={handleOpenEditModal}
                        onOpenAddNew={() => {
                          setEditingMeter(null);
                          setActiveTab("input");
                        }}
                      />
                    )}

                    {activeTab === "input" && (
                      <InputDataGantiMeter
                        onSave={handleSaveMeterRecord}
                        editingMeter={editingMeter}
                        onCancelEdit={() => setEditingMeter(null)}
                      />
                    )}

                    {activeTab === "informasi" && <InformasiAnalytics meters={meters} />}

                    {activeTab === "dokumen" && (
                      <DokumenPrint
                        meters={meters}
                        selectedMeter={selectedMeterForDoc}
                        onSelectMeter={(m) => setSelectedMeterForDoc(m)}
                      />
                    )}

                    {activeTab === "users" && (
                      <ManagementUser
                        users={users}
                        currentUser={currentUser}
                        onAddUser={handleAddUser}
                        onDeleteUser={handleDeleteUser}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>

            {/* Excel Sync Modal */}
            <ExcelSyncModal
              isOpen={isSheetModalOpen}
              onClose={() => setIsSheetModalOpen(false)}
              meters={meters}
              onMetersUpdated={(newMeters) => {
                setMeters(newMeters);
                syncMasterDatasetToFirestore(newMeters).catch(() => {});
                pushToCloud(newMeters).catch(() => {});
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



