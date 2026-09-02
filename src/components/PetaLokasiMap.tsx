import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

import {
  MapPin,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Zap,
  User,
  ExternalLink,
  Printer,
  FileText,
  Layers,
} from "lucide-react";
import { MeterRecord, PetugasName, PETUGAS_LIST } from "../types";
import { snapToLandInBaguala } from "../utils/csvParser";

interface Props {
  meters: MeterRecord[];
  onUpdateMeterStatus: (id: string, newStatus: "SELESAI" | "BELUM") => void;
  onSelectForDocument: (meter: MeterRecord) => void;
}

export const PetaLokasiMap: React.FC<Props> = ({
  meters,
  onUpdateMeterStatus,
  onSelectForDocument,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterJenis, setFilterJenis] = useState<string>("ALL");
  const [filterGanti, setFilterGanti] = useState<string>("ALL");
  const [filterPetugas, setFilterPetugas] = useState<string>("ALL");
  const [selectedMeter, setSelectedMeter] = useState<MeterRecord | null>(null);

  const [mapTileType, setMapTileType] = useState<"satellite" | "streets">("satellite");
  const [useClustering, setUseClustering] = useState<boolean>(false); // Default to false (Titik Individual Satu-Satu)
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | any>(null);
  const hasInitialFittedRef = useRef(false);
  const prevFilterKeyRef = useRef<string>("");

  const filterKey = `${searchTerm}-${filterStatus}-${filterJenis}-${filterGanti}-${filterPetugas}-${useClustering}`;

  // Filter meters
  const filteredMeters = meters.filter((m) => {
    const matchesSearch =
      m.idPelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.namaPelanggan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.noMeterLama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.pnj.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" || m.status === filterStatus;
    const matchesJenis = filterJenis === "ALL" || m.jenis === filterJenis;
    const matchesGanti =
      filterGanti === "ALL" || m.gantiMeter === filterGanti;
    const matchesPetugas =
      filterPetugas === "ALL" || m.petugas === filterPetugas;

    return matchesSearch && matchesStatus && matchesJenis && matchesGanti && matchesPetugas;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Base center on Baguala / Suli / Ambon area
      const map = L.map(mapContainerRef.current, {
        center: [-3.6210, 128.3150],
        zoom: 13,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Tile layer
      const satelliteUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      const streetsUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const tileLayer = L.tileLayer(mapTileType === "satellite" ? satelliteUrl : streetsUrl, {
        attribution:
          mapTileType === "satellite"
            ? "&copy; Esri &mdash; Satellite Imagery | GMBL PLN Baguala"
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | GMBL PLN',
        maxZoom: 19,
        maxNativeZoom: mapTileType === "satellite" ? 17 : 19,
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers Layer Group whenever map or useClustering mode changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (markersLayerRef.current) {
      mapInstanceRef.current.removeLayer(markersLayerRef.current);
    }

    if (useClustering) {
      // MarkerCluster Group
      const clusterGroup = (L as any).markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 40,
        iconCreateFunction: (cluster: any) => {
          const childCount = cluster.getChildCount();
          let bgGradient = "linear-gradient(135deg, #0284c7, #2563eb)";
          let ringColor = "rgba(2, 132, 199, 0.4)";
          let size = 38;

          if (childCount > 50) {
            bgGradient = "linear-gradient(135deg, #f59e0b, #dc2626)";
            ringColor = "rgba(245, 158, 11, 0.45)";
            size = 46;
          } else if (childCount > 15) {
            bgGradient = "linear-gradient(135deg, #6366f1, #9333ea)";
            ringColor = "rgba(99, 102, 241, 0.45)";
            size = 42;
          }

          return L.divIcon({
            html: `
              <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
                <div style="
                  position: absolute;
                  inset: -5px;
                  border-radius: 50%;
                  background: ${ringColor};
                  filter: blur(3px);
                "></div>
                <div style="
                  position: relative;
                  width: ${size}px;
                  height: ${size}px;
                  background: ${bgGradient};
                  color: white;
                  font-weight: 800;
                  font-size: ${childCount > 99 ? '11px' : '12px'};
                  border-radius: 50%;
                  border: 2.5px solid #ffffff;
                  box-shadow: 0 6px 18px rgba(0,0,0,0.45);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  letter-spacing: -0.3px;
                ">
                  <span>${childCount}</span>
                </div>
              </div>
            `,
            className: "custom-marker-cluster-icon",
            iconSize: L.point(size, size),
          });
        },
      });
      mapInstanceRef.current.addLayer(clusterGroup);
      markersLayerRef.current = clusterGroup;
    } else {
      // Standard LayerGroup (Individual pins for every coordinate)
      const layerGroup = L.layerGroup();
      mapInstanceRef.current.addLayer(layerGroup);
      markersLayerRef.current = layerGroup;
    }
  }, [useClustering]);

  // Update Tile Layer when mapTileType changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const satelliteUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    const streetsUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const newTileLayer = L.tileLayer(mapTileType === "satellite" ? satelliteUrl : streetsUrl, {
      attribution:
        mapTileType === "satellite"
          ? "&copy; Esri World Imagery | GMBL PLN Baguala"
          : '&copy; OpenStreetMap | GMBL PLN',
      maxZoom: 19,
      maxNativeZoom: mapTileType === "satellite" ? 17 : 19,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTileLayer;
  }, [mapTileType]);

  // Update Markers & Fit Bounds on Filtered Meters Change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    // Clear existing layer markers
    markersLayerRef.current.clearLayers();

    const bounds: L.LatLngTuple[] = [];

    filteredMeters.forEach((m, idx) => {
      // 1. Parsing Data: Extract Latitude & Longitude precisely
      const rawLat = typeof m.latitude === "number" ? m.latitude : parseFloat(String(m.latitude).replace(",", "."));
      const rawLng = typeof m.longitude === "number" ? m.longitude : parseFloat(String(m.longitude).replace(",", "."));

      // Skip invalid numeric coordinates
      if (isNaN(rawLat) || isNaN(rawLng) || (rawLat === 0 && rawLng === 0)) return;

      // Ensure coordinate is strictly on land in Ambon/Baguala
      const snapped = snapToLandInBaguala(rawLat, rawLng, m.pnj, m.namaPelanggan, idx);
      const lat = snapped.lat;
      const lng = snapped.lng;

      const isSelesai = m.status === "SELESAI";
      const isPrabayar = m.jenis === "PRA BAYAR";

      bounds.push([lat, lng]);

      // Color coding & Gradients
      const gradId = `pin-grad-${m.id.replace(/[^a-zA-Z0-9]/g, "-")}`;
      let startColor = "#10b981";
      let endColor = "#059669";
      let innerContent = `<path d="M11 13.5l2 2 4-4" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;

      if (!isSelesai) {
        if (isPrabayar) {
          startColor = "#38bdf8";
          endColor = "#0284c7";
          // Zap / Lightning bolt symbol
          innerContent = `<path d="M14.5 7.5L9.5 14h3.5l-1.5 5.5 5.5-6.5h-3.5l1.5-5.5z" fill="#ffffff"/>`;
        } else {
          startColor = "#fbbf24";
          endColor = "#d97706";
          // Exclamation symbol
          innerContent = `<text x="14" y="16.5" text-anchor="middle" font-size="10" font-weight="900" fill="#ffffff">!</text>`;
        }
      }

      const badgeBg = isPrabayar
        ? "linear-gradient(135deg, #0284c7, #0369a1)"
        : "linear-gradient(135deg, #8b5cf6, #6d28d9)";

      // Custom Teardrop Marker Pin
      const customIcon = L.divIcon({
        className: "custom-leaflet-teardrop-pin",
        html: `
          <div style="position: relative; width: 28px; height: 34px; cursor: pointer;">
            <svg viewBox="0 0 28 36" width="28" height="34" style="filter: drop-shadow(0px 4px 8px rgba(0,0,0,0.4)); overflow: visible;">
              <defs>
                <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="${startColor}" />
                  <stop offset="100%" stop-color="${endColor}" />
                </linearGradient>
              </defs>
              <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="url(#${gradId})" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
              <circle cx="14" cy="13.5" r="5.5" fill="rgba(0,0,0,0.15)" />
              ${innerContent}
            </svg>
            <div style="
              position: absolute;
              top: -3px;
              right: -5px;
              padding: 1px 4px;
              border-radius: 8px;
              background: ${badgeBg};
              border: 1.5px solid #ffffff;
              font-size: 8px;
              font-weight: 900;
              color: #ffffff;
              letter-spacing: 0.2px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
            ">${isPrabayar ? "PR" : "PS"}</div>
          </div>
        `,
        iconSize: [28, 34],
        iconAnchor: [14, 34],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Click listener on marker: set selected meter & pan map smoothly WITHOUT zooming out!
      marker.on("click", () => {
        setSelectedMeter(m);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([lat, lng], { animate: true });
        }
      });

      markersLayerRef.current.addLayer(marker);
    });

    // Auto-fit Bounds ONLY on initial load OR when user changes filter inputs explicitly
    const filterChanged = prevFilterKeyRef.current !== filterKey;
    if (bounds.length > 0 && mapInstanceRef.current && (!hasInitialFittedRef.current || filterChanged)) {
      const latLngBounds = L.latLngBounds(bounds);
      mapInstanceRef.current.fitBounds(latLngBounds, {
        padding: [40, 40],
        maxZoom: 16,
      });
      hasInitialFittedRef.current = true;
      prevFilterKeyRef.current = filterKey;
    }
  }, [filteredMeters, filterKey, useClustering]);

  const handleFlyToMeter = (m: MeterRecord) => {
    setSelectedMeter(m);
    const lat = typeof m.latitude === "number" ? m.latitude : parseFloat(String(m.latitude).replace(",", "."));
    const lng = typeof m.longitude === "number" ? m.longitude : parseFloat(String(m.longitude).replace(",", "."));
    
    if (mapInstanceRef.current && !isNaN(lat) && !isNaN(lng)) {
      const curZoom = mapInstanceRef.current.getZoom();
      const targetZoom = Math.max(curZoom, 15);
      mapInstanceRef.current.flyTo([lat, lng], targetZoom, {
        duration: 0.8,
      });
    }
  };

  return (
    <div className="relative flex h-full min-h-[calc(100vh-64px)] w-full flex-col overflow-hidden bg-slate-50 lg:flex-row">
      {/* Side Filter Controls & Meter List */}
      <div className="z-20 flex w-full flex-col border-b border-slate-200 bg-white p-3 sm:p-4 shadow-sm lg:w-96 lg:border-b-0 lg:border-r max-h-[40vh] lg:max-h-none overflow-y-auto shrink-0">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Filter Tagging Lokasi</h2>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600 border border-blue-100">
            {filteredMeters.length} Points
          </span>
        </div>

        {/* Quick Filter Bar for JENIS (Prabayar vs Paskabayar) */}
        <div className="mt-3 flex space-x-1 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setFilterJenis("ALL")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
              filterJenis === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Semua ({meters.length})
          </button>
          <button
            onClick={() => setFilterJenis("PRA BAYAR")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
              filterJenis === "PRA BAYAR"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Prabayar
          </button>
          <button
            onClick={() => setFilterJenis("PASKA BAYAR")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
              filterJenis === "PASKA BAYAR"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Paskabayar
          </button>
        </div>

        {/* Search Input */}
        <div className="relative my-3">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari ID Pel, Nama, Lokasi, No Meter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs p-2.5 pl-10 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Detailed Filters Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">STATUS DIGANTI</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-1 w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option value="ALL">Semua Status</option>
              <option value="SELESAI">✓ SELESAI</option>
              <option value="BELUM">! BELUM</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">PETUGAS LAPANGAN</label>
            <select
              value={filterPetugas}
              onChange={(e) => setFilterPetugas(e.target.value)}
              className="mt-1 w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option value="ALL">Semua Petugas</option>
              {PETUGAS_LIST.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* List of Filtered Items */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
          {filteredMeters.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Tidak ada data meter yang cocok dengan filter.
            </div>
          ) : (
            filteredMeters.map((m) => {
              const isSelected = selectedMeter?.id === m.id;
              const isDone = m.status === "SELESAI";
              return (
                <div
                  key={m.id}
                  onClick={() => handleFlyToMeter(m)}
                  className={`cursor-pointer rounded-xl border p-3 transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{m.namaPelanggan}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isDone
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>ID Pel: <strong>{m.idPelanggan}</strong></span>
                    <span className="font-semibold text-blue-600">{m.tarif} / {m.daya} VA</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Jenis: <strong className="text-slate-700">{m.jenis}</strong></span>
                    <span className="text-slate-500 truncate max-w-[120px]">{m.pnj}</span>
                  </div>
                  <div className="mt-1 text-[10px] font-mono text-blue-600/80 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 flex items-center justify-between">
                    <span>Lat: {m.latitude}</span>
                    <span>Lng: {m.longitude}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Interactive Map View */}
      <div className="relative flex-1">
        <div ref={mapContainerRef} className="h-full w-full bg-slate-900" />

        {/* Map Type & Control Bar */}
        <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-1.5 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => setMapTileType("satellite")}
            className={`flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              mapTileType === "satellite"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>🛰️ Mode Satelit</span>
          </button>
          <button
            onClick={() => setMapTileType("streets")}
            className={`flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              mapTileType === "streets"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>🗺️ Peta Jalan</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

          {/* Mode Cluster vs Individual Pins */}
          <button
            onClick={() => setUseClustering(false)}
            className={`flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              !useClustering
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
            title="Tampilkan semua titik lokasi satu-satu tanpa dikelompokkan"
          >
            <span>📍 Titik Individual (Satu-Satu)</span>
          </button>
          <button
            onClick={() => setUseClustering(true)}
            className={`flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              useClustering
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400/50"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
            title="Kelompokkan titik yang berdekatan"
          >
            <span>🔮 Cluster</span>
          </button>
        </div>

        {/* High-Tech Legend Overlay on Map */}
        <div className="absolute top-4 right-4 z-[1000] w-72 rounded-2xl border border-slate-800/90 bg-slate-900/90 p-3.5 shadow-2xl backdrop-blur-md text-white transition-all">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
            <div className="flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <h4 className="font-extrabold text-xs text-slate-100 tracking-wide uppercase">Legenda Peta</h4>
            </div>
            <button
              onClick={() => setIsLegendOpen(!isLegendOpen)}
              className="rounded-lg bg-slate-800 p-1 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title={isLegendOpen ? "Sembunyikan Legenda" : "Tampilkan Legenda"}
            >
              <span className="text-xs font-bold px-1">{isLegendOpen ? "▲" : "▼"}</span>
            </button>
          </div>

          {isLegendOpen && (
            <div className="space-y-2 text-xs animate-in fade-in duration-200">
              {/* Item 1: Selesai */}
              <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-2 border border-slate-700/50">
                <div className="flex items-center space-x-2.5">
                  <div className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm shadow-emerald-900/50">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 text-[11px]">Meter SELESAI</div>
                    <div className="text-[10px] text-slate-400">Penggantian Tuntas</div>
                  </div>
                </div>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-400 border border-emerald-500/30">
                  HIJAU
                </span>
              </div>

              {/* Item 2: Prabayar Belum */}
              <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-2 border border-slate-700/50">
                <div className="flex items-center space-x-2.5">
                  <div className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 shadow-sm shadow-blue-900/50">
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 text-[11px]">Prabayar (BELUM)</div>
                    <div className="text-[10px] text-slate-400">Token / Pra Bayar</div>
                  </div>
                </div>
                <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-sky-400 border border-sky-500/30">
                  BIRU (PR)
                </span>
              </div>

              {/* Item 3: Paskabayar Belum */}
              <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-2 border border-slate-700/50">
                <div className="flex items-center space-x-2.5">
                  <div className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shadow-amber-900/50">
                    <Clock className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 text-[11px]">Paskabayar (BELUM)</div>
                    <div className="text-[10px] text-slate-400">Pasca / Meter Tua</div>
                  </div>
                </div>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-400 border border-amber-500/30">
                  KUNING (PS)
                </span>
              </div>

              {/* Item 4: Cluster */}
              <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-2 border border-slate-700/50">
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] font-extrabold text-white ring-2 ring-indigo-400/40 shadow-md">
                    25
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 text-[11px]">Cluster Titik Lokasi</div>
                    <div className="text-[10px] text-slate-400">Kelompok Meter Area</div>
                  </div>
                </div>
                <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-indigo-400 border border-indigo-500/30">
                  CLUSTER
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Selected Meter Quick Actions Overlay */}
        {selectedMeter && (
          <div className="absolute bottom-16 sm:bottom-6 left-3 right-3 sm:left-6 sm:right-6 z-[1000] max-w-xl mx-auto rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xl text-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-bold text-blue-600 tracking-wide">
                  {selectedMeter.jenis}
                </span>
                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 tracking-wide uppercase">
                  {selectedMeter.gantiMeter || "METER TUA"}
                </span>
              </div>

              <button
                onClick={() => setSelectedMeter(null)}
                className="text-slate-400 hover:text-slate-700 p-1 text-lg font-bold leading-none transition-colors"
                title="Tutup"
              >
                ✕
              </button>
            </div>

            <div className="mt-2.5">
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {selectedMeter.namaPelanggan}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                ID Pel: <span className="text-blue-600 font-bold">{selectedMeter.idPelanggan}</span>{" "}
                <span className="text-slate-300">|</span> No Meter:{" "}
                <span className="text-slate-700 font-semibold">{selectedMeter.noMeterLama || selectedMeter.jenis}</span>
              </p>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-x-6 gap-y-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-xs text-slate-600">
              <div>
                <span className="text-slate-500">Tarif / Daya:</span>{" "}
                <strong className="text-slate-900 font-bold ml-1">{selectedMeter.tarif} / {selectedMeter.daya} VA</strong>
              </div>
              <div>
                <span className="text-slate-500">Petugas:</span>{" "}
                <strong className="text-slate-900 font-bold ml-1">
                  {selectedMeter.status === "SELESAI" ? selectedMeter.petugas : "-"}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Stand Bongkar:</span>{" "}
                <strong className="text-slate-900 font-bold ml-1">{selectedMeter.standBongkar || "0 kWh"}</strong>
              </div>
              <div>
                <span className="text-slate-500">Lokasi/PNJ:</span>
                <div className="text-slate-900 font-bold uppercase mt-0.5 truncate">{selectedMeter.pnj || "-"}</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end space-x-2.5">
              <button
                onClick={() => {
                  const newSt = selectedMeter.status === "SELESAI" ? "BELUM" : "SELESAI";
                  onUpdateMeterStatus(selectedMeter.id, newSt);
                  setSelectedMeter({ ...selectedMeter, status: newSt });
                }}
                className={`flex items-center space-x-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs ${
                  selectedMeter.status === "SELESAI"
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {selectedMeter.status === "SELESAI" ? "Tandai BELUM" : "Tandai SELESAI"}
                </span>
              </button>

              <button
                onClick={() => onSelectForDocument(selectedMeter)}
                className="flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                <FileText className="h-4 w-4" />
                <span>Cetak Dokumen PK</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
