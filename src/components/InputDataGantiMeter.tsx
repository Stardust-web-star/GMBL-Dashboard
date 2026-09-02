import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  PlusCircle,
  CheckCircle2,
  MapPin,
  Calendar,
  Zap,
  User,
  Hash,
  FileCheck,
  ShieldAlert,
  Save,
  RotateCcw,
} from "lucide-react";
import {
  AlasanGanti,
  JenisMeter,
  MeterRecord,
  PETUGAS_LIST,
  PetugasName,
  StatusGanti,
} from "../types";

interface Props {
  onSave: (data: Omit<MeterRecord, "id">) => void;
  editingMeter?: MeterRecord | null;
  onCancelEdit?: () => void;
}

export const InputDataGantiMeter: React.FC<Props> = ({
  onSave,
  editingMeter,
  onCancelEdit,
}) => {
  const [tanggal, setTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [idPelanggan, setIdPelanggan] = useState("");
  const [namaPelanggan, setNamaPelanggan] = useState("");
  const [tarif, setTarif] = useState("R1M");
  const [daya, setDaya] = useState<number>(900);
  const [noMeterLama, setNoMeterLama] = useState("");
  const [noMeterBaru, setNoMeterBaru] = useState("");
  const [noAgenda, setNoAgenda] = useState(`AGD-${Date.now().toString().slice(-6)}`);
  const [noSnMaterialKwhMeter, setNoSnMaterialKwhMeter] = useState("");
  const [noSnMaterialMcb, setNoSnMaterialMcb] = useState("");
  const [kabelTw, setKabelTw] = useState("10 Meter");
  const [segel, setSegel] = useState("TERPASANG 2 BUAH");
  const [standBongkar, setStandBongkar] = useState("0 kWh");
  const [jenis, setJenis] = useState<JenisMeter>("PASKA BAYAR");
  const [gantiMeter, setGantiMeter] = useState<AlasanGanti>("METER TUA");
  const [petugas, setPetugas] = useState<PetugasName>("ABDUL");
  const [status, setStatus] = useState<StatusGanti>("BELUM");
  const [pnj, setPnj] = useState("BAGUALA, PASSO");
  const [latitude, setLatitude] = useState<number>(-3.626);
  const [longitude, setLongitude] = useState<number>(128.25);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Populate form if editing
  useEffect(() => {
    if (editingMeter) {
      setTanggal(editingMeter.tanggal);
      setIdPelanggan(editingMeter.idPelanggan);
      setNamaPelanggan(editingMeter.namaPelanggan);
      setTarif(editingMeter.tarif);
      setDaya(editingMeter.daya);
      setNoMeterLama(editingMeter.noMeterLama);
      setNoMeterBaru(editingMeter.noMeterBaru);
      setNoAgenda(editingMeter.noAgenda);
      setNoSnMaterialKwhMeter(editingMeter.noSnMaterialKwhMeter);
      setNoSnMaterialMcb(editingMeter.noSnMaterialMcb);
      setKabelTw(editingMeter.kabelTw);
      setSegel(editingMeter.segel);
      setStandBongkar(editingMeter.standBongkar);
      setJenis(editingMeter.jenis);
      setGantiMeter(editingMeter.gantiMeter);
      setPetugas(editingMeter.petugas);
      setStatus(editingMeter.status);
      setPnj(editingMeter.pnj);
      setLatitude(editingMeter.latitude);
      setLongitude(editingMeter.longitude);
    }
  }, [editingMeter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idPelanggan || !namaPelanggan) {
      alert("ID Pelanggan dan Nama Pelanggan wajib diisi!");
      return;
    }

    const payload: Omit<MeterRecord, "id"> = {
      tanggal,
      idPelanggan,
      namaPelanggan,
      tarif,
      daya,
      noMeterLama,
      noMeterBaru,
      noAgenda,
      noSnMaterialKwhMeter,
      noSnMaterialMcb,
      kabelTw,
      segel,
      standBongkar,
      jenis,
      gantiMeter,
      petugas,
      status,
      pnj,
      latitude: Number(latitude),
      longitude: Number(longitude),
    };

    onSave(payload);

    if (status === "SELESAI") {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }

    setToastMsg(
      editingMeter
        ? "Data penggantian meter berhasil diperbarui!"
        : "Data penggantian meter baru berhasil disimpan!"
    );

    setTimeout(() => setToastMsg(null), 4000);

    if (!editingMeter) {
      // Reset form to default
      setIdPelanggan("");
      setNamaPelanggan("");
      setNoMeterLama("");
      setNoMeterBaru("");
      setNoSnMaterialKwhMeter("");
      setNoSnMaterialMcb("");
      setNoAgenda(`AGD-${Date.now().toString().slice(-6)}`);
    }
  };

  const handleGenerateRandomCoords = () => {
    // Random offsets within Baguala area (-3.58 to -3.71, 128.09 to 128.34)
    const lat = Number((-3.58 - Math.random() * 0.13).toFixed(8));
    const lng = Number((128.09 + Math.random() * 0.25).toFixed(8));
    setLatitude(lat);
    setLongitude(lng);
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
            <PlusCircle className="h-6 w-6 text-blue-600" />
            <span>
              {editingMeter ? "Edit Data Ganti Meter" : "Input Data Ganti Meter (GMBL)"}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Formulir registrasi & pembaruan data penggantian kWh meter tua PLN JTC Transaksi Energi
          </p>
        </div>

        {editingMeter && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Batal Edit
          </button>
        )}
      </div>

      {toastMsg && (
        <div className="flex items-center space-x-2 rounded-xl border border-green-200 bg-green-50 p-4 text-xs font-bold text-green-700">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Informasi Pelanggan & Lokasi */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 border-b border-slate-100 pb-2 flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>1. Data Pelanggan & Tarif</span>
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">TANGGAL</label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ID PELANGGAN *</label>
              <input
                type="text"
                required
                placeholder="Contoh: 411340318513"
                value={idPelanggan}
                onChange={(e) => setIdPelanggan(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-mono text-blue-600 font-bold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NAMA PELANGGAN *</label>
              <input
                type="text"
                required
                placeholder="Contoh: LA UMAR"
                value={namaPelanggan}
                onChange={(e) => setNamaPelanggan(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">TARIF</label>
              <select
                value={tarif}
                onChange={(e) => setTarif(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              >
                <option value="R1">R1 (Subsidi)</option>
                <option value="R1M">R1M (Mampu)</option>
                <option value="R1T">R1T (Prabayar)</option>
                <option value="R1MT">R1MT (Prabayar Mampu)</option>
                <option value="S1">S1 (Sosial)</option>
                <option value="B1">B1 (Bisnis)</option>
                <option value="I1">I1 (Industri)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">DAYA (VA)</label>
              <select
                value={daya}
                onChange={(e) => setDaya(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              >
                <option value={450}>450 VA</option>
                <option value={900}>900 VA</option>
                <option value={1300}>1300 VA</option>
                <option value={2200}>2200 VA</option>
                <option value={3500}>3500 VA</option>
                <option value={5500}>5500 VA</option>
                <option value={6600}>6600 VA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PNJ / ALAMAT LOKASI</label>
              <input
                type="text"
                placeholder="Contoh: KMP PISANG, BAGUALA"
                value={pnj}
                onChange={(e) => setPnj(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Spesifikasi kWh Meter & Material */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 border-b border-slate-100 pb-2 flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>2. Data Meter & Material KWh Meter</span>
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NO METER LAMA</label>
              <input
                type="text"
                placeholder="Contoh: 36000810071"
                value={noMeterLama}
                onChange={(e) => setNoMeterLama(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NO METER BARU</label>
              <input
                type="text"
                placeholder="Contoh: 37119200481"
                value={noMeterBaru}
                onChange={(e) => setNoMeterBaru(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-mono text-green-600 font-bold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NO AGENDA</label>
              <input
                type="text"
                value={noAgenda}
                onChange={(e) => setNoAgenda(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NO SN MATERIAL KWH METER</label>
              <input
                type="text"
                placeholder="Contoh: SN-KWH-99101"
                value={noSnMaterialKwhMeter}
                onChange={(e) => setNoSnMaterialKwhMeter(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NO SN MATERIAL MCB</label>
              <input
                type="text"
                placeholder="Contoh: SN-MCB-4A-01"
                value={noSnMaterialMcb}
                onChange={(e) => setNoSnMaterialMcb(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">KABEL TW</label>
              <input
                type="text"
                placeholder="Contoh: 10 Meter / Standard 2x10mm"
                value={kabelTw}
                onChange={(e) => setKabelTw(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SEGEL</label>
              <input
                type="text"
                placeholder="Contoh: TERPASANG 2 BUAH"
                value={segel}
                onChange={(e) => setSegel(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">STAND BONGKAR</label>
              <input
                type="text"
                placeholder="Contoh: 04891 kWh"
                value={standBongkar}
                onChange={(e) => setStandBongkar(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Klasifikasi & Pilihan Kategori Mandatori */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 border-b border-slate-100 pb-2 flex items-center space-x-2">
            <FileCheck className="h-4 w-4" />
            <span>3. Klasifikasi Penugasan & Status (Mandatori)</span>
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* JENIS Dropdown: Strictly PASKA BAYAR & PRA BAYAR */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                JENIS (Strict Choice) *
              </label>
              <select
                required
                value={jenis}
                onChange={(e) => setJenis(e.target.value as JenisMeter)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              >
                <option value="PASKA BAYAR">PASKA BAYAR</option>
                <option value="PRA BAYAR">PRA BAYAR</option>
              </select>
            </div>

            {/* GANTI METER Dropdown: Strictly METER GANGGUAN & METER TUA */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GANTI METER (Strict Choice) *
              </label>
              <select
                required
                value={gantiMeter}
                onChange={(e) => setGantiMeter(e.target.value as AlasanGanti)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              >
                <option value="METER TUA">METER TUA</option>
                <option value="METER GANGGUAN">METER GANGGUAN</option>
              </select>
            </div>

            {/* PETUGAS Dropdown: Strictly the 16 officers */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PETUGAS LAPANGAN *
              </label>
              <select
                required
                value={petugas}
                onChange={(e) => setPetugas(e.target.value as PetugasName)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-blue-600 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              >
                {PETUGAS_LIST.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* STATUS Dropdown: Strictly SELESAI & BELUM */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                STATUS *
              </label>
              <select
                required
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusGanti)}
                className={`w-full text-xs p-2.5 border rounded-lg font-bold focus:outline-none ${
                  status === "SELESAI"
                    ? "border-green-300 bg-green-50 text-green-700"
                    : "border-orange-300 bg-orange-50 text-orange-700"
                }`}
              >
                <option value="BELUM">BELUM</option>
                <option value="SELESAI">SELESAI</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: GPS Tagging Coordinates */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>4. Tagging Koordinat GPS Peta (Baguala Area)</span>
            </h3>
            <button
              type="button"
              onClick={handleGenerateRandomCoords}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              Set Koordinat Baguala Acak
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LATITUDE</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LONGITUDE</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          {editingMeter && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
          )}

          <button
            type="submit"
            className="flex items-center space-x-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            <Save className="h-4 w-4" />
            <span>
              {editingMeter ? "Simpan Perubahan Meter" : "Simpan Data Ganti Meter"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
