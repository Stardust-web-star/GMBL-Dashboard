import React, { useState, useEffect } from "react";
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
  setCurrentSessionUser,
  updateMeterRecord,
} from "./utils/storage";
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

  // Sync state with storage when changed
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
      setMeters(getStoredMeters());
    }
  };

  const handleSaveMeterRecord = (record: Omit<MeterRecord, "id">) => {
    if (editingMeter) {
      updateMeterRecord(editingMeter.id, record);
      setEditingMeter(null);
    } else {
      addMeterRecord(record);
    }
    setMeters(getStoredMeters());
    setActiveTab("data");
  };

  const handleDeleteMeter = (id: string) => {
    deleteMeterRecord(id);
    setMeters(getStoredMeters());
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
              onMetersUpdated={(newMeters) => setMeters(newMeters)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


