import React, { useState } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Trash2,
  Mail,
  CheckCircle2,
  User,
  Key,
} from "lucide-react";
import { UserAccount } from "../types";

interface Props {
  users: UserAccount[];
  currentUser: UserAccount;
  onAddUser: (email: string, name: string, role: UserAccount["role"], password?: string) => void;
  onDeleteUser: (id: string) => void;
}

export const ManagementUser: React.FC<Props> = ({
  users,
  currentUser,
  onAddUser,
  onDeleteUser,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("admin");
  const [newRole, setNewRole] = useState<UserAccount["role"]>("admin");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    onAddUser(newEmail, newName, newRole, newPassword || "admin");

    setToastMsg(`User admin baru (${newEmail}) berhasil ditambahkan dengan password "${newPassword || "admin"}"!`);
    setTimeout(() => setToastMsg(null), 4000);

    setNewEmail("");
    setNewName("");
    setNewPassword("admin");
    setShowAddModal(false);
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            <span>Management User Admin (GMBL)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola hak akses & akun administrator dashboard monitoring kWh meter tua Baguala
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/30 hover:bg-sky-500 transition-all cursor-pointer active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          <span>Tambah User Admin Baru</span>
        </button>
      </div>

      {toastMsg && (
        <div className="flex items-center space-x-2 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/60 p-4 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Primary Admin Info Banner */}
      <div className="rounded-2xl border border-sky-200 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-950/20 p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white font-bold text-base shadow-md shadow-sky-600/30">
            PLN
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Akses Super Admin Utama: fikiilham56@gmail.com</span>
              <span className="rounded bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-500/30">
                ACTIVE
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Akun resmi administrator utama JTC Transaksi Energi Baguala.
            </p>
          </div>
        </div>
      </div>

      {/* Users List Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Email Administrator</th>
                <th className="px-5 py-3.5">Role / Peran</th>
                <th className="px-5 py-3.5">Status Hak Akses</th>
                <th className="px-5 py-3.5">Tanggal Dibuat</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {users.map((u) => {
                const isCurrent = u.email.toLowerCase() === currentUser.email.toLowerCase();
                const isMainAdmin = u.email.toLowerCase() === "fikiilham56@gmail.com";

                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950 border border-sky-300 dark:border-sky-500/30 text-xs text-sky-700 dark:text-sky-400 font-bold">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                      {isCurrent && (
                        <span className="rounded-full bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 text-[9px] font-bold text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-500/30">
                          AKUN ANDA
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-sky-600 dark:text-sky-400 font-medium">{u.email}</td>
                    <td className="px-5 py-4">
                      {u.role === "petugas" ? (
                        <span className="rounded bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                          PETUGAS (HANYA PETA)
                        </span>
                      ) : (
                        <span className="rounded bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent">
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center space-x-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>AKTIF</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-mono">{u.createdAt}</td>
                    <td className="px-5 py-4 text-center">
                      {!isMainAdmin && !isCurrent ? (
                        <button
                          onClick={() => {
                            if (confirm(`Hapus akses user admin ${u.email}?`)) {
                              onDeleteUser(u.id);
                            }
                          }}
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-300 transition-colors cursor-pointer"
                          title="Hapus Akses Admin"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Protected</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm sm:max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              <span>Tambah User Admin Baru</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              User baru akan mendapatkan akses untuk mengelola data dashboard GMBL.
            </p>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Administrator</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Administrator (Gmail / Google Mail)
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-950"
                />
                <p className="mt-1 text-[10px] text-sky-600 dark:text-sky-400">
                  ✓ Mendukung akun Gmail (@gmail.com) maupun email korporat.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password Login Akses
                </label>
                <input
                  type="text"
                  required
                  placeholder="Password login, contoh: admin"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role / Peran</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-950"
                >
                  <option value="admin">Admin Operasional</option>
                  <option value="super_admin">Super Admin Manager</option>
                  <option value="petugas">Petugas Lapangan (Hanya Akses Peta Lokasi)</option>
                  <option value="supervisor">Supervisor Transaksi Energi</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-sky-600/30 hover:bg-sky-500 transition-colors cursor-pointer active:scale-95"
                >
                  Simpan Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
