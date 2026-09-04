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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <span>Management User Admin (GMBL)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Kelola hak akses & akun administrator dashboard monitoring kWh meter tua Baguala
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
        >
          <UserPlus className="h-4 w-4" />
          <span>Tambah User Admin Baru</span>
        </button>
      </div>

      {toastMsg && (
        <div className="flex items-center space-x-2 rounded-xl border border-green-200 bg-green-50 p-4 text-xs font-bold text-green-700">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Primary Admin Info Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg shadow-md shadow-blue-200">
            PLN
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>Akses Super Admin Utama: fikiilham56@gmail.com</span>
              <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                ACTIVE
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Akun resmi administrator utama JTC Transaksi Energi Baguala.
            </p>
          </div>
        </div>
      </div>

      {/* Users List Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Email Administrator</th>
                <th className="px-5 py-3.5">Role / Peran</th>
                <th className="px-5 py-3.5">Status Hak Akses</th>
                <th className="px-5 py-3.5">Tanggal Dibuat</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => {
                const isCurrent = u.email.toLowerCase() === currentUser.email.toLowerCase();
                const isMainAdmin = u.email.toLowerCase() === "fikiilham56@gmail.com";

                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900 flex items-center space-x-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs text-blue-600 font-bold">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                      {isCurrent && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700 border border-blue-200">
                          AKUN ANDA
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-blue-600 font-medium">{u.email}</td>
                    <td className="px-5 py-4">
                      {u.role === "petugas" ? (
                        <span className="rounded bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 border border-amber-200">
                          PETUGAS (HANYA PETA)
                        </span>
                      ) : (
                        <span className="rounded bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center space-x-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                        <span>AKTIF</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 font-mono">{u.createdAt}</td>
                    <td className="px-5 py-4 text-center">
                      {!isMainAdmin && !isCurrent ? (
                        <button
                          onClick={() => {
                            if (confirm(`Hapus akses user admin ${u.email}?`)) {
                              onDeleteUser(u.id);
                            }
                          }}
                          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                          title="Hapus Akses Admin"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Protected</span>
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-800">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <span>Tambah User Admin Baru</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              User baru akan mendapatkan akses penuh untuk mengelola data dashboard GMBL.
            </p>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Administrator</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Acho / Budi Santoso"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Administrator (Gmail / Google Mail)
                </label>
                <input
                  type="email"
                  required
                  placeholder="muhammadnurbella20@gmail.com atau user@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
                <p className="mt-1 text-[11px] text-blue-600 font-medium">
                  ✓ Mendukung penambahan akun Gmail (@gmail.com) maupun email korporat.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password Login Akses
                </label>
                <input
                  type="text"
                  required
                  placeholder="Password login, contoh: admin"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Peran</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
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
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700"
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
