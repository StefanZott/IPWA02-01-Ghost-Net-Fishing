/**
 * map.js
 * Hauptkarte für Ghost Net Reporting:
 *  - Zeigt alle gemeldeten Geisternetze als Leaflet-Marker.
 *  - Klick auf Marker öffnet Popup mit Details.
 *  - Nach erfolgreichem POST (Event "ghostnet:created") wird die Karte aktualisiert.
 *  - Verhindert überlappende Marker durch minimale Versetzung ("spreadOverlappingNets").
 *
 * Globale Referenzen:
 *   window.__ghostNetMap__   : Leaflet-Map
 *   window.__ghostNetLayer__ : LayerGroup mit allen Markern
 */

document.addEventListener("DOMContentLoaded", async () => {
  const mapEl = document.getElementById("map");
  if (!mapEl) {
    console.error("map.js: #map nicht gefunden.");
    return;
  }

  // --- Karte initialisieren -------------------------------------------------
  const map = L.map(mapEl, { zoomControl: true }).setView([51.163, 10.447], 6);
  window.__ghostNetMap__ = map;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap-Mitwirkende",
  }).addTo(map);

  // LayerGroup für Marker
  window.__ghostNetLayer__ = L.layerGroup().addTo(map);

  // Initiale Daten laden
  await loadAndRenderGhostNets(map);

  // Event: Nach dem Erstellen eines neuen Netzes Karte aktualisieren
  document.addEventListener("ghostnet:created", async () => {
    await loadAndRenderGhostNets(map);
  });
});

/**
 * Lädt GhostNets vom Backend und rendert sie auf der Karte.
 * @param {import('leaflet').Map} map
 */
async function loadAndRenderGhostNets(map) {
  try {
    const res = await fetch("/api/ghostnets");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const nets = await res.json();
    renderGhostNetMarkers(map, nets);
  } catch (e) {
    console.error("map.js: Konnte GhostNets nicht laden:", e);
  }
}

/**
 * Entfernt alle alten Marker und zeichnet neue.
 * Nutzt spreadOverlappingNets(), um überlappende Marker zu vermeiden.
 * @param {import('leaflet').Map} map
 * @param {Array<{id?:number|string, latitude:number, longitude:number, status?:string, size?:number}>} nets
 */
function renderGhostNetMarkers(map, nets) {
  const layer = window.__ghostNetLayer__;
  if (!layer) return;
  layer.clearLayers();

  const spreadNets = spreadOverlappingNets(nets, 5, 30);

  for (const n of spreadNets) {
    if (!Number.isFinite(n.latitude) || !Number.isFinite(n.longitude)) continue;

    const popupHtml = getPopupHtml(n);
    const marker = L.marker([n.latitude, n.longitude]);
    marker.bindPopup(popupHtml);
    marker.addTo(layer);
  }
}

/**
 * Erstellt Popup-HTML für einen Marker.
 * @param {{id?:number|string, latitude:number, longitude:number, status?:string, size?:number}} net
 * @returns {string}
 */
function getPopupHtml(net) {
  const id = net.id ?? "?";
  const lat = net.latitude?.toFixed(5);
  const lng = net.longitude?.toFixed(5);
  const status = net.status ?? "REPORTED";
  const size = net.size != null ? `${net.size} m²` : "–";

  return `
    <div style="font-size:0.9rem; line-height:1.3;">
      <strong>#${id} ${status}</strong><br/>
      📍 ${lat}, ${lng}<br/>
      🕸️ Größe: ${size}
    </div>
  `;
}

/**
 * Gruppiert Marker mit identischen Koordinaten und verteilt sie minimal,
 * damit alle sichtbar bleiben. (Leaflet-Spreading ohne externe Lib.)
 *
 * @param {Array<{latitude:number, longitude:number, [k:string]:any}>} nets
 * @param {number} precision - Dezimalstellen zur Gruppierung (Standard 5)
 * @param {number} radiusM   - Radius in Metern für die Verteilung (Standard 30)
 * @returns {Array<{latitude:number, longitude:number, original:any, __spreadMeta?:{index:number,total:number}}>}
 */
function spreadOverlappingNets(nets, precision = 5, radiusM = 30) {
  // 1° Breite ≈ 111_320 m; 1° Länge ≈ 111_320 * cos(lat)
  const degLat = (m) => m / 111320;

  /** @type {Map<string, Array<any>>} */
  const groups = new Map();

  for (const n of nets) {
    if (!Number.isFinite(n.latitude) || !Number.isFinite(n.longitude)) continue;
    const key = `${n.latitude.toFixed(precision)}|${n.longitude.toFixed(precision)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(n);
  }

  /** @type {Array<any>} */
  const out = [];

  for (const [, group] of groups) {
    if (group.length === 1) {
      out.push({ ...group[0], __spreadMeta: { index: 0, total: 1 } });
      continue;
    }

    const total = group.length;
    group.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / total; // gleichmäßig im Kreis
      const latRad = (n.latitude * Math.PI) / 180;
      const degLng = (m) => m / (111320 * Math.cos(latRad));

      const dLat = degLat(radiusM) * Math.sin(angle);
      const dLng = degLng(radiusM) * Math.cos(angle);

      out.push({
        ...n,
        latitude: n.latitude + dLat,
        longitude: n.longitude + dLng,
        __spreadMeta: { index: i, total }
      });
    });
  }

  return out;
}
