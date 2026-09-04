/**
 * Routing & Directions Service for GMBL
 * Calculates routes between user live location and target kWh meter
 * Powered by OpenStreetMap / OSRM with intelligent offline fallback
 */

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

export interface RouteResult {
  coordinates: [number, number][]; // [lat, lng] array for Leaflet polyline
  distanceKm: number;
  durationMinutes: number;
  summary: string;
  steps: RouteStep[];
  mode: "motorcycle" | "driving" | "walking";
}

// Calculate Haversine distance in km
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Fetch real route from OSRM or generate high-quality fallback
 */
export async function fetchDirections(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number,
  mode: "motorcycle" | "driving" | "walking" = "motorcycle"
): Promise<RouteResult> {
  const profile = mode === "walking" ? "walking" : "driving";
  const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const primaryRoute = data.routes[0];
        const rawCoords = primaryRoute.geometry.coordinates; // [lng, lat]
        const leafletCoords: [number, number][] = rawCoords.map(
          (pt: [number, number]) => [pt[1], pt[0]]
        );

        const distanceKm = +(primaryRoute.distance / 1000).toFixed(1);
        
        // Adjust duration slightly for motorcycle (typically 15-20% faster through traffic)
        let durationSec = primaryRoute.duration;
        if (mode === "motorcycle") {
          durationSec = durationSec * 0.85;
        }
        const durationMinutes = Math.max(1, Math.round(durationSec / 60));

        // Format summary steps
        const steps: RouteStep[] = [];
        if (primaryRoute.legs && primaryRoute.legs[0]?.steps) {
          primaryRoute.legs[0].steps.forEach((st: any) => {
            if (st.maneuver && st.name) {
              steps.push({
                instruction: st.maneuver.type === "depart"
                  ? `Mulai perjalanan ke arah ${st.name || "jalan utama"}`
                  : st.maneuver.type === "arrive"
                  ? "Tiba di lokasi kWh meter pelanggan"
                  : `${formatManeuver(st.maneuver.modifier)} ke ${st.name}`,
                distance: Math.round(st.distance),
                duration: Math.round(st.duration),
              });
            }
          });
        }

        const summaryStreet = primaryRoute.legs?.[0]?.summary || "Jalan Utama Baguala";

        return {
          coordinates: leafletCoords,
          distanceKm,
          durationMinutes,
          summary: `Via ${summaryStreet}`,
          steps,
          mode,
        };
      }
    }
  } catch (err) {
    console.warn("[Routing] OSRM live call failed, generating simulated route:", err);
  }

  // Resilient fallback if OSRM is offline or blocked
  const straightDistKm = calculateHaversineDistanceKm(startLat, startLng, destLat, destLng);
  // Real driving distance is usually ~1.3x - 1.4x straight line due to turns
  const estDistanceKm = +(straightDistKm * 1.35).toFixed(1);

  // Speed estimates: motorcycle 32km/h, car 26km/h, walking 4.5km/h
  const avgSpeedKmH = mode === "motorcycle" ? 32 : mode === "driving" ? 25 : 4.5;
  const durationMinutes = Math.max(1, Math.round((estDistanceKm / avgSpeedKmH) * 60));

  // Generate a multi-point polyline following gentle road curvature
  const points: [number, number][] = [];
  const segments = 12;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Add subtle road curvature curve
    const curveOffset = Math.sin(t * Math.PI) * 0.003;
    const lat = startLat + (destLat - startLat) * t + curveOffset;
    const lng = startLng + (destLng - startLng) * t + curveOffset * 0.5;
    points.push([lat, lng]);
  }

  return {
    coordinates: points,
    distanceKm: estDistanceKm,
    durationMinutes,
    summary: "Rute Tercepat Area Baguala",
    steps: [
      { instruction: "Arahkan kendaraan ke jalan utama terdekat", distance: 200, duration: 60 },
      { instruction: "Lanjutkan perjalanan menuju titik lokasi kWh meter", distance: Math.round(estDistanceKm * 800), duration: durationMinutes * 50 },
      { instruction: "Tiba di titik persil kWh meter tujuan", distance: 50, duration: 15 },
    ],
    mode,
  };
}

function formatManeuver(modifier?: string): string {
  switch (modifier) {
    case "right":
      return "Belok kanan";
    case "left":
      return "Belok kiri";
    case "slight right":
      return "Serong kanan";
    case "slight left":
      return "Serong kiri";
    case "sharp right":
      return "Belok tajam ke kanan";
    case "sharp left":
      return "Belok tajam ke kiri";
    case "straight":
      return "Lurus terus";
    case "uturn":
      return "Putar balik";
    default:
      return "Lanjutkan";
  }
}

/**
 * Generate deep link to Google Maps Turn-by-Turn Navigation
 */
export function getGoogleMapsNavigationUrl(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number,
  mode: "motorcycle" | "driving" | "walking" = "motorcycle"
): string {
  const travelmode = mode === "walking" ? "walking" : mode === "motorcycle" ? "two-wheeler" : "driving";
  return `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${destLat},${destLng}&travelmode=${travelmode}`;
}
