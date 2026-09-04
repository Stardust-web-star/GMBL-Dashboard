import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
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
  UserCheck,
  ExternalLink,
  Printer,
  FileText,
  Layers,
  X,
  Sparkles,
  Navigation,
  Crosshair,
  Bike,
  Car,
  Footprints,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Locate,
  Route,
} from "lucide-react";
import { MeterRecord, PetugasName, PETUGAS_LIST } from "../types";
import { snapToLandInBaguala } from "../utils/csvParser";
import {
  fetchDirections,
  getGoogleMapsNavigationUrl,
  calculateHaversineDistanceKm,
  RouteResult,
} from "../utils/routing";

interface Props {
  meters: MeterRecord[];
  onUpdateMeterStatus: (
    id: string,
    newStatus: "SELESAI" | "BELUM",
    petugas?: PetugasName,
    additionalData?: Partial<MeterRecord>
  ) => void;
  onSelectForDocument: (meter: MeterRecord) => void;
}

// Pre-defined static Leaflet DivIcons to prevent re-creating DOM strings for 6000+ items
const createCustomPinIcon = (startColor: string, endColor: string, innerContent: string, badgeBg: string, label: string) => {
  return L.divIcon({
    className: "custom-leaflet-teardrop-pin",
    html: `
      <div style="position: relative; width: 28px; height: 34px; cursor: pointer;">
        <svg viewBox="0 0 28 36" width="28" height="34" style="filter: drop-shadow(0px 4px 8px rgba(0,0,0,0.4)); overflow: visible;">
          <defs>
            <linearGradient id="pin-grad-${label}-${startColor.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${startColor}" />
              <stop offset="100%" stop-color="${endColor}" />
            </linearGradient>
          </defs>
          <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="url(#pin-grad-${label}-${startColor.replace('#', '')})" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
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
        ">${label}</div>
      </div>
    `,
    iconSize: [28, 34],
    iconAnchor: [14, 34],
    popupAnchor: [0, -32],
  });
};

// Pulsating live user GPS marker (Google Maps style)
const createUserGpsIcon = () => {
  return L.divIcon({
    className: "user-gps-location-pin",
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div class="gps-radar-wave" style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(37, 99, 235, 0.45); pointer-events: none;"></div>
        <div style="
          position: relative;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #2563eb;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        ">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

// Destination marker pin (Google Maps red pin with bounce)
const createDestinationPinIcon = () => {
  return L.divIcon({
    className: "destination-marker-pin",
    html: `
      <div class="destination-marker-bounce" style="position: relative; width: 32px; height: 42px; display: flex; align-items: center; justify-content: center;">
        <svg viewBox="0 0 28 38" width="32" height="42" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
          <path d="M14 0C6.27 0 0 6.27 0 14c0 11.5 14 24 14 24s14-12.5 14-24C28 6.27 21.73 0 14 0z" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
          <circle cx="14" cy="14" r="5.5" fill="#ffffff"/>
          <circle cx="14" cy="14" r="3" fill="#dc2626"/>
        </svg>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -40],
  });
};

const ICON_SELESAI_PR = createCustomPinIcon("#10b981", "#059669", `<path d="M11 13.5l2 2 4-4" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`, "linear-gradient(135deg, #0284c7, #0369a1)", "PR");
const ICON_SELESAI_PS = createCustomPinIcon("#10b981", "#059669", `<path d="M11 13.5l2 2 4-4" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`, "linear-gradient(135deg, #8b5cf6, #6d28d9)", "PS");
const ICON_BELUM_PR = createCustomPinIcon("#38bdf8", "#0284c7", `<path d="M14.5 7.5L9.5 14h3.5l-1.5 5.5 5.5-6.5h-3.5l1.5-5.5z" fill="#ffffff"/>`, "linear-gradient(135deg, #0284c7, #0369a1)", "PR");
const ICON_BELUM_PS = createCustomPinIcon("#fbbf24", "#d97706", `<text x="14" y="16.5" text-anchor="middle" font-size="10" font-weight="900" fill="#ffffff">!</text>`, "linear-gradient(135deg, #8b5cf6, #6d28d9)", "PS");

const getMeterIcon = (isSelesai: boolean, isPrabayar: boolean) => {
  if (isSelesai) {
    return isPrabayar ? ICON_SELESAI_PR : ICON_SELESAI_PS;
  }
  return isPrabayar ? ICON_BELUM_PR : ICON_BELUM_PS;
};

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
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [visibleCount, setVisibleCount] = useState<number>(80);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const hasInitialFittedRef = useRef(false);
  const prevFilterKeyRef = useRef<string>("");

  // Live GPS Location States
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "requesting" | "active" | "error">("idle");
  const [gpsErrorNotice, setGpsErrorNotice] = useState<string | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const hasCenteredOnUserRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);

  // Direction / Routing States (Google Maps style)
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [travelMode, setTravelMode] = useState<"motorcycle" | "driving" | "walking">("motorcycle");
  const [showSteps, setShowSteps] = useState(false);
  const [routedMeter, setRoutedMeter] = useState<MeterRecord | null>(null);
  const routeOutlineRef = useRef<L.Polyline | null>(null);
  const routeCoreRef = useRef<L.Polyline | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);

  const filterKey = `${searchTerm}-${filterStatus}-${filterJenis}-${filterGanti}-${filterPetugas}`;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(80);
  }, [searchTerm, filterStatus, filterJenis, filterGanti, filterPetugas]);

  // Memoize filtered meters to avoid heavy string ops on every single render
  const filteredMeters = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    return meters.filter((m) => {
      const matchesSearch =
        !s ||
        m.idPelanggan.toLowerCase().includes(s) ||
        m.namaPelanggan.toLowerCase().includes(s) ||
        m.noMeterLama.toLowerCase().includes(s) ||
        m.pnj.toLowerCase().includes(s);

      const matchesStatus =
        filterStatus === "ALL" || m.status === filterStatus;
      const matchesJenis = filterJenis === "ALL" || m.jenis === filterJenis;
      const matchesGanti =
        filterGanti === "ALL" || m.gantiMeter === filterGanti;
      const matchesPetugas =
        filterPetugas === "ALL" || m.petugas === filterPetugas;

      return matchesSearch && matchesStatus && matchesJenis && matchesGanti && matchesPetugas;
    });
  }, [meters, searchTerm, filterStatus, filterJenis, filterGanti, filterPetugas]);

  // Visible items for sidebar list to prevent 6000+ DOM cards overload
  const visibleSidebarMeters = useMemo(() => {
    return filteredMeters.slice(0, visibleCount);
  }, [filteredMeters, visibleCount]);

  // Modal for selecting Petugas when marking SELESAI
  const [meterToComplete, setMeterToComplete] = useState<MeterRecord | null>(null);
  const [selectedPetugasForCompletion, setSelectedPetugasForCompletion] = useState<PetugasName>("ABDUL");
  const [customStandBongkar, setCustomStandBongkar] = useState<string>("");
  const [customNoMeterBaru, setCustomNoMeterBaru] = useState<string>("");

  const handleInitiateMarkSelesai = (meter: MeterRecord) => {
    setMeterToComplete(meter);
    setSelectedPetugasForCompletion(meter.petugas || "ABDUL");
    setCustomStandBongkar(meter.standBongkar || "0 kWh");
    setCustomNoMeterBaru(meter.noMeterBaru || "");
  };

  const handleConfirmMarkSelesai = () => {
    if (!meterToComplete) return;
    const additional: Partial<MeterRecord> = {};
    if (customStandBongkar.trim()) additional.standBongkar = customStandBongkar.trim();
    if (customNoMeterBaru.trim()) additional.noMeterBaru = customNoMeterBaru.trim();

    onUpdateMeterStatus(
      meterToComplete.id,
      "SELESAI",
      selectedPetugasForCompletion,
      additional
    );

    if (selectedMeter && selectedMeter.id === meterToComplete.id) {
      setSelectedMeter({
        ...selectedMeter,
        status: "SELESAI",
        petugas: selectedPetugasForCompletion,
        ...additional,
      });
    }

    setMeterToComplete(null);
  };

  const handleMarkBelum = (meter: MeterRecord) => {
    onUpdateMeterStatus(meter.id, "BELUM");
    if (selectedMeter && selectedMeter.id === meter.id) {
      setSelectedMeter({
        ...selectedMeter,
        status: "BELUM",
      });
    }
  };

  // Start GPS Geolocation Tracking
  const startGpsTracking = useCallback((flyToUser = false) => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsErrorNotice("Browser tidak mendukung GPS Geolocation.");
      return;
    }

    setGpsStatus("requesting");
    setGpsErrorNotice(null);

    const handleSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      const coords = { lat: latitude, lng: longitude, accuracy };
      setUserLocation(coords);
      setGpsStatus("active");
      setGpsErrorNotice(null);

      if (mapInstanceRef.current) {
        const map = mapInstanceRef.current;

        // User GPS dot marker
        if (!userMarkerRef.current) {
          const userIcon = createUserGpsIcon();
          const marker = L.marker([latitude, longitude], {
            icon: userIcon,
            zIndexOffset: 2500,
          }).addTo(map);

          marker.bindPopup(`
            <div style="font-family: sans-serif; padding: 4px 6px;">
              <strong style="color: #1d4ed8; font-size: 12px; display: block; margin-bottom: 2px;">📍 Lokasi Anda (GPS Aktif)</strong>
              <div style="font-size: 11px; color: #475569; line-height: 1.4;">
                Koordinat: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}<br/>
                Akurasi: ±${Math.round(accuracy || 10)} meter
              </div>
            </div>
          `);
          userMarkerRef.current = marker;
        } else {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        }

        // Translucent accuracy circle
        if (!accuracyCircleRef.current) {
          const circle = L.circle([latitude, longitude], {
            radius: Math.min(accuracy || 25, 150),
            color: "#2563eb",
            fillColor: "#3b82f6",
            fillOpacity: 0.12,
            weight: 1,
          }).addTo(map);
          accuracyCircleRef.current = circle;
        } else {
          accuracyCircleRef.current.setLatLng([latitude, longitude]);
          accuracyCircleRef.current.setRadius(Math.min(accuracy || 25, 150));
        }

        // Fly to user on initial access or explicit button click
        if (flyToUser || !hasCenteredOnUserRef.current) {
          map.flyTo([latitude, longitude], 15, { duration: 1 });
          hasCenteredOnUserRef.current = true;
        }
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      console.warn("GPS tracking notice:", err.message);
      setGpsStatus("error");
      setGpsErrorNotice(
        err.code === 1
          ? "Izin GPS belum aktif di browser. Anda dapat mengaktifkan simulasi lokasi Passo Baguala."
          : "Sinyal GPS belum terdeteksi. Anda dapat mengaktifkan simulasi lokasi Passo Baguala."
      );
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 10000,
    });

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, () => {}, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 10000,
    });
  }, []);

  // Fallback to simulated location in Passo, Baguala
  const setSimulatedBagualaLocation = useCallback(() => {
    const simLat = -3.6280;
    const simLng = 128.2570;
    const coords = { lat: simLat, lng: simLng, accuracy: 15 };
    setUserLocation(coords);
    setGpsStatus("active");
    setGpsErrorNotice(null);

    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      if (!userMarkerRef.current) {
        const userIcon = createUserGpsIcon();
        const marker = L.marker([simLat, simLng], {
          icon: userIcon,
          zIndexOffset: 2500,
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px 6px;">
            <strong style="color: #1d4ed8; font-size: 12px; display: block; margin-bottom: 2px;">📍 Lokasi Petugas (ULP Baguala)</strong>
            <div style="font-size: 11px; color: #475569; line-height: 1.4;">
              Passo, Kec. Baguala, Kota Ambon<br/>
              Simulasi Posisi Siap Navigasi
            </div>
          </div>
        `);
        userMarkerRef.current = marker;
      } else {
        userMarkerRef.current.setLatLng([simLat, simLng]);
      }

      if (!accuracyCircleRef.current) {
        const circle = L.circle([simLat, simLng], {
          radius: 35,
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.12,
          weight: 1,
        }).addTo(map);
        accuracyCircleRef.current = circle;
      } else {
        accuracyCircleRef.current.setLatLng([simLat, simLng]);
      }

      map.flyTo([simLat, simLng], 15, { duration: 1 });
    }
  }, []);

  // Clear current active direction / route on the map
  const clearActiveRoute = useCallback(() => {
    if (mapInstanceRef.current) {
      if (routeOutlineRef.current) {
        mapInstanceRef.current.removeLayer(routeOutlineRef.current);
        routeOutlineRef.current = null;
      }
      if (routeCoreRef.current) {
        mapInstanceRef.current.removeLayer(routeCoreRef.current);
        routeCoreRef.current = null;
      }
      if (destinationMarkerRef.current) {
        mapInstanceRef.current.removeLayer(destinationMarkerRef.current);
        destinationMarkerRef.current = null;
      }
    }
    setActiveRoute(null);
    setRoutedMeter(null);
    setShowSteps(false);
  }, []);

  // Start route calculation from user position to meter location
  const handleStartDirection = async (
    meter: MeterRecord,
    mode: "motorcycle" | "driving" | "walking" = travelMode
  ) => {
    const rawLat = typeof meter.latitude === "number" ? meter.latitude : parseFloat(String(meter.latitude).replace(",", "."));
    const rawLng = typeof meter.longitude === "number" ? meter.longitude : parseFloat(String(meter.longitude).replace(",", "."));
    if (isNaN(rawLat) || isNaN(rawLng)) {
      alert("Koordinat kWh meter ini tidak valid.");
      return;
    }

    const snapped = snapToLandInBaguala(rawLat, rawLng, meter.pnj, meter.namaPelanggan);
    const destLat = snapped.lat;
    const destLng = snapped.lng;

    let startLat = userLocation?.lat;
    let startLng = userLocation?.lng;

    // If user location is not yet set, automatically activate Baguala center simulation
    if (!startLat || !startLng) {
      startLat = -3.6280;
      startLng = 128.2570;
      setSimulatedBagualaLocation();
    }

    setIsCalculatingRoute(true);
    setSelectedMeter(meter);
    setRoutedMeter(meter);
    setTravelMode(mode);

    try {
      const result = await fetchDirections(startLat, startLng, destLat, destLng, mode);
      setActiveRoute(result);

      if (mapInstanceRef.current) {
        const map = mapInstanceRef.current;

        // Clear existing polylines
        if (routeOutlineRef.current) map.removeLayer(routeOutlineRef.current);
        if (routeCoreRef.current) map.removeLayer(routeCoreRef.current);
        if (destinationMarkerRef.current) map.removeLayer(destinationMarkerRef.current);

        // Dark glowing casing (shadow) line
        const outline = L.polyline(result.coordinates, {
          color: "#1e3a8a",
          weight: 8,
          opacity: 0.85,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
        routeOutlineRef.current = outline;

        // Core bright blue line
        const core = L.polyline(result.coordinates, {
          color: "#2563eb",
          weight: 5,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
        routeCoreRef.current = core;

        // Red destination marker with bounce
        const destIcon = createDestinationPinIcon();
        const destMarker = L.marker([destLat, destLng], {
          icon: destIcon,
          zIndexOffset: 2000,
        }).addTo(map);

        destMarker.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px 6px;">
            <strong style="color: #dc2626; font-size: 12px; display: block; margin-bottom: 2px;">🏁 Tujuan: ${meter.namaPelanggan}</strong>
            <div style="font-size: 11px; color: #475569;">
              ID Pel: ${meter.idPelanggan}<br/>
              Estimasi: ${result.distanceKm} km (${result.durationMinutes} menit)
            </div>
          </div>
        `);
        destinationMarkerRef.current = destMarker;

        // Fit map bounds to view both user location, the complete route line, and target meter
        const bounds = L.latLngBounds(result.coordinates);
        map.fitBounds(bounds, {
          padding: [80, 80],
          maxZoom: 16,
        });
      }
    } catch (err) {
      console.error("Routing error:", err);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

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

      // Initialize Leaflet MarkerCluster Group with upgraded glowing cluster icons
      const clusterGroup = (L as any).markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 45,
        disableClusteringAtZoom: 16,
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

      map.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;
      mapInstanceRef.current = map;

      // Automatically initialize real-time GPS connection upon opening map
      startGpsTracking(false);
    }

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      userMarkerRef.current = null;
      accuracyCircleRef.current = null;
      routeOutlineRef.current = null;
      routeCoreRef.current = null;
      destinationMarkerRef.current = null;
    };
  }, [startGpsTracking]);

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
    if (!mapInstanceRef.current || !clusterGroupRef.current) return;

    // Use a short delay so tab opening motion animations finish completely before placing markers
    const frameId = requestAnimationFrame(() => {
      if (!clusterGroupRef.current) return;

      clusterGroupRef.current.clearLayers();

      const bounds: L.LatLngTuple[] = [];
      const markersList: L.Marker[] = [];

      filteredMeters.forEach((m, idx) => {
        // Parsing Data: Extract Latitude & Longitude precisely
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

        // Use pre-cached shared icon to avoid creating 6000+ SVG DOM strings
        const customIcon = getMeterIcon(isSelesai, isPrabayar);
        const marker = L.marker([lat, lng], { icon: customIcon });

        // Click listener on marker: set selected meter & pan map smoothly WITHOUT zooming out!
        marker.on("click", () => {
          setSelectedMeter(m);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo([lat, lng], { animate: true });
          }
        });

        markersList.push(marker);
      });

      // Bulk add all markers in one single pass for maximum MarkerCluster efficiency
      clusterGroupRef.current.addLayers(markersList);

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

      // Ensure map layout calculates properly
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [filteredMeters, filterKey]);

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
            <>
              {visibleSidebarMeters.map((m) => {
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
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[170px]">{m.namaPelanggan}</span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartDirection(m);
                          }}
                          className="flex items-center space-x-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition-all border border-blue-200"
                          title="Buat Rute Navigasi ke kWh Meter ini"
                        >
                          <Navigation className="h-2.5 w-2.5" />
                          <span>Rute</span>
                        </button>
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
              })}

              {visibleCount < filteredMeters.length && (
                <button
                  onClick={() => setVisibleCount((prev) => prev + 100)}
                  className="w-full py-2.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-200 mt-2"
                >
                  Tampilkan Lebih Banyak ({visibleCount} dari {filteredMeters.length} data)
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Interactive Map View */}
      <div className="relative flex-1">
        <div ref={mapContainerRef} className="h-full w-full bg-slate-900" />

        {/* Map Type Control Bar */}
        <div className="absolute top-4 left-4 z-[1000] flex items-center space-x-1.5 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-1.5 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => setMapTileType("satellite")}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              mapTileType === "satellite"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>🛰️ Mode Satelit</span>
          </button>
          <button
            onClick={() => setMapTileType("streets")}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              mapTileType === "streets"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>🗺️ Peta Jalan</span>
          </button>
        </div>

        {/* Floating Active Route / Navigation Bar (Google Maps & My Maps style) */}
        {activeRoute && routedMeter && (
          <div className="absolute top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 z-[1050] w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl text-white animate-in slide-in-from-top-4 duration-200">
            {/* Header & Travel Mode Selection */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60">
                <button
                  onClick={() => handleStartDirection(routedMeter, "motorcycle")}
                  className={`flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    travelMode === "motorcycle"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Sepeda Motor"
                >
                  <Bike className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Motor</span>
                </button>
                <button
                  onClick={() => handleStartDirection(routedMeter, "driving")}
                  className={`flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    travelMode === "driving"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Mobil"
                >
                  <Car className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Mobil</span>
                </button>
                <button
                  onClick={() => handleStartDirection(routedMeter, "walking")}
                  className={`flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    travelMode === "walking"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Jalan Kaki"
                >
                  <Footprints className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Jalan</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (mapInstanceRef.current && activeRoute) {
                      const bounds = L.latLngBounds(activeRoute.coordinates);
                      mapInstanceRef.current.fitBounds(bounds, { padding: [80, 80] });
                    }
                  }}
                  className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white transition-colors"
                  title="Pusatkan Rute"
                >
                  <Locate className="h-4 w-4" />
                </button>
                <button
                  onClick={clearActiveRoute}
                  className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white transition-colors"
                  title="Tutup Navigasi"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Route Metrics (Google Maps Style Duration & Distance) */}
            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-emerald-400 tracking-tight">
                    {activeRoute.durationMinutes} mnt
                  </span>
                  <span className="text-sm font-bold text-slate-300">
                    ({activeRoute.distanceKm} km)
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                  <Route className="h-3 w-3 text-blue-400" />
                  <span className="truncate max-w-[200px] sm:max-w-[260px] font-medium">
                    {activeRoute.summary || "Rute Tercepat"}
                  </span>
                </div>
              </div>

              <a
                href={getGoogleMapsNavigationUrl(
                  userLocation?.lat || -3.6280,
                  userLocation?.lng || 128.2570,
                  typeof routedMeter.latitude === "number" ? routedMeter.latitude : parseFloat(String(routedMeter.latitude).replace(",", ".")),
                  typeof routedMeter.longitude === "number" ? routedMeter.longitude : parseFloat(String(routedMeter.longitude).replace(",", ".")),
                  travelMode
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 transition-all ring-1 ring-blue-400/40"
              >
                <Navigation className="h-4 w-4" />
                <span>Buka Google Maps</span>
              </a>
            </div>

            {/* Destination target preview */}
            <div className="mt-3 rounded-xl bg-slate-800/70 p-2.5 border border-slate-700/60 flex items-center justify-between text-xs">
              <div className="truncate pr-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Tujuan Penggantian Meter:</span>
                <strong className="text-slate-200 font-bold block truncate">{routedMeter.namaPelanggan}</strong>
                <span className="text-slate-400 text-[11px]">ID: {routedMeter.idPelanggan} | {routedMeter.pnj}</span>
              </div>
              <button
                onClick={() => setShowSteps(!showSteps)}
                className="shrink-0 flex items-center space-x-1 text-xs font-bold text-blue-400 hover:text-blue-300 py-1 px-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-all border border-blue-500/20"
              >
                <span>Langkah ({activeRoute.steps.length})</span>
                {showSteps ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {/* Turn-by-Turn Instruction List (Collapsible) */}
            {showSteps && activeRoute.steps.length > 0 && (
              <div className="mt-2.5 max-h-44 overflow-y-auto space-y-1.5 rounded-xl bg-slate-950/80 p-2 border border-slate-800 scrollbar-thin text-xs animate-in fade-in duration-150">
                {activeRoute.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start space-x-2 py-1 border-b border-slate-900 last:border-0 text-slate-300">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-900/60 text-[10px] font-bold text-blue-300 border border-blue-700/50">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-[11px] leading-tight font-medium text-slate-200">{step.instruction}</p>
                      <span className="text-[10px] text-slate-400">
                        {step.distanceMeters > 0 ? `${step.distanceMeters} m` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GPS Permission / Simulation Notice Banner */}
        {gpsErrorNotice && (
          <div className="absolute top-16 left-4 right-4 sm:left-auto sm:right-4 z-[1000] max-w-sm rounded-2xl border border-amber-500/40 bg-amber-950/95 p-3.5 shadow-2xl backdrop-blur-md text-white text-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <span className="text-amber-400 text-sm">📍</span>
                <div>
                  <strong className="font-bold text-amber-200 block text-xs">GPS Lokasi Terdeteksi:</strong>
                  <span className="text-amber-100/80 text-[11px] leading-relaxed block mt-0.5">
                    {gpsErrorNotice}
                  </span>
                </div>
              </div>
              <button onClick={() => setGpsErrorNotice(null)} className="text-amber-400 hover:text-white ml-2 text-xs font-bold">✕</button>
            </div>
            <div className="mt-2.5 flex space-x-2">
              <button
                onClick={setSimulatedBagualaLocation}
                className="flex-1 rounded-xl bg-amber-500/20 px-3 py-1.5 text-[11px] font-bold text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-all text-center"
              >
                📍 Pakai Titik ULP Baguala (Passo)
              </button>
              <button
                onClick={() => startGpsTracking(true)}
                className="rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-700 transition-all"
              >
                Coba GPS Asli
              </button>
            </div>
          </div>
        )}

        {/* Floating GPS & Locate User Controls */}
        <div className="absolute bottom-6 right-4 z-[1000] flex flex-col items-end space-y-2">
          <button
            onClick={() => {
              if (userLocation && mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 16, { duration: 0.8 });
              } else {
                startGpsTracking(true);
              }
            }}
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700/70 bg-slate-900/90 text-white shadow-2xl backdrop-blur-md hover:bg-blue-600 hover:border-blue-500 transition-all group"
            title="Pusatkan ke Titik Lokasi Saya (GPS)"
          >
            <Crosshair className={`h-5 w-5 ${gpsStatus === 'active' ? 'text-blue-400 group-hover:text-white' : 'text-slate-400'}`} />
            {gpsStatus === 'active' && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
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

            {(() => {
              const mLat = typeof selectedMeter.latitude === "number" ? selectedMeter.latitude : parseFloat(String(selectedMeter.latitude).replace(",", "."));
              const mLng = typeof selectedMeter.longitude === "number" ? selectedMeter.longitude : parseFloat(String(selectedMeter.longitude).replace(",", "."));
              const distKm = (userLocation && !isNaN(mLat) && !isNaN(mLng))
                ? calculateHaversineDistanceKm(userLocation.lat, userLocation.lng, mLat, mLng)
                : null;

              return (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleStartDirection(selectedMeter)}
                      disabled={isCalculatingRoute}
                      className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                    >
                      <Navigation className="h-4 w-4" />
                      <span>
                        {isCalculatingRoute
                          ? "Menghitung Rute..."
                          : `Rute Arah ${distKm !== null ? `(${distKm.toFixed(1)} km)` : ""}`}
                      </span>
                    </button>

                    <a
                      href={getGoogleMapsNavigationUrl(
                        userLocation?.lat || -3.6280,
                        userLocation?.lng || 128.2570,
                        mLat,
                        mLng,
                        travelMode
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
                      title="Buka Navigasi Langsung di Google Maps"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                      <span>Google Maps</span>
                    </a>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (selectedMeter.status === "SELESAI") {
                          handleMarkBelum(selectedMeter);
                        } else {
                          handleInitiateMarkSelesai(selectedMeter);
                        }
                      }}
                      className={`flex items-center space-x-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all shadow-xs ${
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
                      className="flex items-center space-x-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs shadow-blue-200 hover:bg-blue-700 transition-all"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Cetak PK</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Petugas Selection Modal Dialog when marking as SELESAI */}
        {meterToComplete && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 text-white">
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold tracking-tight">Pilih Petugas Ganti Meter</h3>
                    <p className="text-[11px] text-slate-300">Tentukan petugas pelaksana untuk menandai SELESAI</p>
                  </div>
                </div>
                <button
                  onClick={() => setMeterToComplete(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Customer Info Card */}
              <div className="p-5 space-y-4">
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">{meterToComplete.namaPelanggan}</span>
                    <span className="rounded bg-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                      {meterToComplete.jenis}
                    </span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div>
                      ID Pel: <strong className="text-blue-700 font-mono font-bold">{meterToComplete.idPelanggan}</strong>
                    </div>
                    <div>
                      Tarif/Daya: <strong className="text-slate-900">{meterToComplete.tarif} / {meterToComplete.daya} VA</strong>
                    </div>
                    <div>
                      Meter Lama: <span className="font-mono text-slate-800">{meterToComplete.noMeterLama || "-"}</span>
                    </div>
                    <div className="truncate">
                      Lokasi/PNJ: <span className="text-slate-800 font-medium">{meterToComplete.pnj || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Petugas Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-blue-600" />
                      Petugas Pelaksana Ganti Meter <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Klik nama atau pilih dropdown</span>
                  </div>

                  {/* Quick Pick Pills / Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                    {PETUGAS_LIST.map((pet) => {
                      const isSelected = selectedPetugasForCompletion === pet;
                      return (
                        <button
                          key={pet}
                          type="button"
                          onClick={() => setSelectedPetugasForCompletion(pet)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-400 scale-[1.02]"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                          }`}
                        >
                          {pet}
                        </button>
                      );
                    })}
                  </div>

                  {/* Dropdown Select Alternative */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Pilihan Terpilih:</span>
                    <select
                      value={selectedPetugasForCompletion}
                      onChange={(e) => setSelectedPetugasForCompletion(e.target.value as PetugasName)}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {PETUGAS_LIST.map((p) => (
                        <option key={p} value={p}>
                          Petugas: {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Optional inputs */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      No. Meter Baru <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={customNoMeterBaru}
                      onChange={(e) => setCustomNoMeterBaru(e.target.value)}
                      placeholder="Contoh: 37119200481"
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Stand Bongkar <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={customStandBongkar}
                      onChange={(e) => setCustomStandBongkar(e.target.value)}
                      placeholder="Contoh: 04891 kWh"
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end space-x-2.5 border-t border-slate-100 bg-slate-50 px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => setMeterToComplete(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMarkSelesai}
                  className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Simpan & Tandai SELESAI ({selectedPetugasForCompletion})</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
