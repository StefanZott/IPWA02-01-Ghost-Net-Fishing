/**
 * map.js
 * Initialisiert die Leaflet-Karte im Layout (rechte Spalte).
 * Hängt die Karteninstanz unter window.__ghostNetMap__ ein,
 * damit andere Skripte (z. B. sidebar.js) sauber darauf zugreifen können.
 *
 * Voraussetzungen:
 *  - Leaflet CSS/JS ist in index.html eingebunden.
 *  - Ein <div id="map"> ist im DOM vorhanden und hat 100% Höhe (siehe CSS).
 */

/**
 * Initialisiert die Karte robust nach DOM-Aufbau.
 * - Setzt Start-Zentrum (Deutschland) und Tile-Layer.
 * - Behebt Größenprobleme durch invalidateSize().
 * - Lädt optional Marker aus dem Backend und setzt Bounds.
 */
document.addEventListener("DOMContentLoaded", async () => {
  const mapEl = document.getElementById("map");
  if (!mapEl) {
    console.error("map.js: Container #map nicht gefunden.");
    return;
  }

  // Leaflet-Karte erstellen
  const map = L.map("map", { zoomControl: true })
    .setView([51.163, 10.447], 6); // Deutschland Mitte

  // OpenStreetMap Tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap-Mitwirkende"
  }).addTo(map);

  // Workaround: Nach Layout-Paint berechnen lassen
  setTimeout(() => map.invalidateSize(), 0);
  window.addEventListener("resize", () => map.invalidateSize());

  // Global verfügbar machen (gezielt benannt)
  window.__ghostNetMap__ = map;

  // --- Optional: Bestehende Ghost Nets als Marker anzeigen ---
  try {
    const res = await fetch("/api/ghostnets");
    if (res.ok) {
      const nets = await res.json();
      const bounds = [];
      nets.forEach(net => {
        if (isNum(net.latitude) && isNum(net.longitude)) {
          const marker = L.marker([net.latitude, net.longitude]).addTo(map);
          marker.bindPopup(getPopupHtml(net));
          bounds.push([net.latitude, net.longitude]);
        }
      });
      // Falls wir Marker haben → auf Bounds zoomen
      // if (bounds.length) {
      //   map.fitBounds(bounds, { padding: [24, 24] });
      // }
    } else {
      console.warn("map.js: /api/ghostnets HTTP", res.status);
    }
  } catch (e) {
    console.warn("map.js: Konnte Ghost Nets nicht laden:", e);
  }
});

/** Hilfsfunktionen */
function isNum(v) { return typeof v === "number" && !Number.isNaN(v); }

function getPopupHtml(net) {
  const name = escapeHtml(net.name ?? `#${net.id}`);
  const status = escapeHtml(net.status ?? "unbekannt");
  const size = (typeof net.size === "number") ? `Größe: ${net.size}` : "";
  const lat = isNum(net.latitude) ? net.latitude.toFixed(5) : "-";
  const lng = isNum(net.longitude) ? net.longitude.toFixed(5) : "-";
  return `
    <div style="min-width:200px">
      <div><strong>${name}</strong></div>
      <div>Status: ${status}</div>
      <div>${size}</div>
      <div>Koord.: ${lat}, ${lng}</div>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
