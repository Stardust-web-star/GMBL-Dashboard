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
  setCurrentSessionUser,
  updateMeterRecord,
} from "./utils/storage";
import { pullFromCloud, pushToCloud } from "./utils/cloudSync";
import { LoginScreen } from "./components/LoginScreen";
import { Navbar, TopHeader, MenuTab } from "./components/Navbar";
import { PetaLokasiMap } from "./components/PetaLokasiMap";
import { DataMeterTua } from "./components/DataMeterTua";
import { InputDataGantiMeter } from "./components/InputDataGantiMeter";
import { InformasiAnalytics } from "./components/InformasiAnalytics";
import { DokumenPrint } from "./components/DokumenPrint";
import { ManagementUser } from "./components/ManagementUser";
import { ExcelSyncModal } from "./components/ExcelSyncModal";
import { CloudSyncModal } from "./components/CloudSyncModal";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    getCurrentSessionUser()
  );
  const [meters, setMeters] = useState<MeterRecord[]>(() => getStoredMeters());
  const [users, setUsers] = useState<UserAccount[]>(() => getStoredUsers());

  const [activeTab, setActiveTab] = useState<MenuTab>("peta");
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedMeterForDoc, setSelectedMeterForDoc] = useState<MeterRecord | null>(null);
  const [editingMeter, setEditingMeter] = useState<MeterRecord | null>(null);
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);

  const metersRef = useRef(meters);
  useEffect(() => {
    metersRef.current = meters;
  }, [meters]);

  // Initial and periodic background cloud synchronization
  const triggerPullCloud = useCallback(async (silent = true) => {
    if (!silent) setIsCloudSyncing(true);
    try {
      const current = metersRef.current;
      const res = await pullFromCloud(current);
      if (res.success && res.changesApplied > 0) {
        setMeters(res.updatedMeters);
        console.log(`[CloudSync] Applied ${res.changesApplied} updates from Cloud.`);
      }
    } catch (err) {
      console.warn("[CloudSync] Background sync check failed:", err);
    } finally {
      if (!silent) setIsCloudSyncing(false);
    }
  }, []);

  // Initial sync on startup & periodic polling every 12 seconds
  useEffect(() => {
    // 1. Initial pull
    triggerPullCloud(true);

    // 2. Also push current local state to cloud once on mount if we have completed records
    const completedNow = metersRef.current.filter((m) => m.status === "SELESAI").length;
    if (completedNow > 0) {
      pushToCloud(metersRef.current).catch(() => {});
    }

    // 3. Periodic polling
    const pollTimer = setInterval(() => {
      triggerPullCloud(true);
    }, 12000);

    // 4. Multi-tab BroadcastChannel listener
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

    // 5. Window focus listener to refresh when switching tabs
    const handleFocus = () => {
      triggerPullCloud(true);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
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

  // Quick manual sync handler
  const handleQuickSync = async () => {
    setIsCloudSyncing(true);
    try {
      // Push first to make sure local changes are in cloud
      await pushToCloud(metersRef.current);
      // Then pull latest
      const res = await pullFromCloud(metersRef.current);
      if (res.success) {
        setMeters(res.updatedMeters);
      }
    } catch (err) {
      console.warn("Manual sync error:", err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

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
      // Auto-broadcast to Cloud
      pushToCloud(newMeters).catch(() => {});
    }
  };

  const handleSaveMeterRecord = (record: Omit<MeterRecord, "id">) => {
    if (editingMeter) {
      updateMeterRecord(editingMeter.id, record);
      setEditingMeter(null);
    } else {
      addMeterRecord(record);
    }
    const newMeters = getStoredMeters();
    setMeters(newMeters);
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
    setUsers(getStoredUsers());
  };

  const handleDeleteUser = (id: string) => {
    deleteUserAccount(id);
    setUsers(getStoredUsers());
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
              onOpenCloudSync={() => setIsCloudModalOpen(true)}
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
                onOpenCloudSync={() => setIsCloudModalOpen(true)}
                isCloudSyncing={isCloudSyncing}
                onQuickSync={handleQuickSync}
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
                pushToCloud(newMeters).catch(() => {});
              }}
            />

            {/* Cloud Live Sync Modal */}
            <CloudSyncModal
              isOpen={isCloudModalOpen}
              onClose={() => setIsCloudModalOpen(false)}
              meters={meters}
              onMetersUpdated={(newMeters) => {
                setMeters(newMeters);
                saveStoredMeters(newMeters);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


