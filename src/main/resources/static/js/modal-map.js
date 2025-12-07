/**
 * modal-map.js
 * Interaktive Leaflet-Karte im Bootstrap-Modal #fakeModal1:
 * - Eingaben in lat/lng setzen Marker & zentrieren die Karte.
 * - Klick in die Karte schreibt lat/lng-Felder & versetzt den Marker.
 * - Vorhandene GhostNets werden angezeigt (inkl. Overlap-Spread, farbige Marker je Status).
 * - Beim Anlegen eines neuen GhostNets wird – falls vorhanden – die User-ID mitgeschickt.
 *
 * Globale Referenzen:
 *   window.__ghostNetModalMap__    : Leaflet-Map (einmalig)
 *   window.__ghostNetModalMarker__ : Leaflet-Marker (re-used)
 *   window.__ghostNetModalLayer__  : LayerGroup für vorhandene Netze
 *
 * Voraussetzungen:
 *   - Bootstrap 5 (Modal)
 *   - Leaflet
 */

/**
 * Liefert die Markerfarben für einen Geisternetz-Status.
 *
 * REPORTED   → Blau
 * SCHEDULED  → Gelb
 * RECOVERED  → Grün
 * CANCELLED  → Rot
 *
 * @param {string} status Backend-Status (z. B. "REPORTED")
 * @returns {{stroke:string, fill:string}} Farben für Marker-Rand und -Füllung
 */
function getStatusColor(status) {
  const key = String(status || "").toUpperCase();

  switch (key) {
    case "REPORTED":   // gemeldet
      return { stroke: "#0d6efd", fill: "#0d6efd" }; // Blau
    case "SCHEDULED":  // Bergung geplant
      return { stroke: "#ffc107", fill: "#ffc107" }; // Gelb
    case "RECOVERED":  // geborgen
      return { stroke: "#198754", fill: "#198754" }; // Grün
    case "CANCELLED":  // abgebrochen
      return { stroke: "#dc3545", fill: "#dc3545" }; // Rot
    default:
      return { stroke: "#6c757d", fill: "#6c757d" }; // Fallback: Grau
  }
}

/**
 * Erstellt die Leaflet-Map im Element #modal-map.
 * Startansicht: Deutschland
 *
 * @returns {import('leaflet').Map|null}
 */
function createModalMap() {
  const el = document.getElementById("modal-map");
  if (!el) {
    console.error("modal-map.js: #modal-map nicht gefunden.");
    return null;
  }

  // Karte erstellen (Startansicht: Deutschland)
  const map = L.map(el, { zoomControl: true }).setView([51.163, 10.447], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap-Mitwirkende"
  }).addTo(map);

  // LayerGroup für vorhandene GhostNets
  window.__ghostNetModalLayer__ = L.layerGroup().addTo(map);

  // Nach Rendern: Größe berechnen
  setTimeout(() => map.invalidateSize(), 0);

  // Klick in die Karte → Felder füllen & Marker setzen
  map.on("click", (ev) => {
    const { lat, lng } = ev.latlng;
    setFields(lat, lng);
    setMarker(map, lat, lng, { pan: true });
  });

  // Vorhandene Ghost Nets anzeigen (wie in map.js)
  loadGhostNetMarkers(map).catch((e) => console.warn("modal-map.js:", e));

  return map;
}

/**
 * Erzeugt einen Leaflet-Marker (klassische Pin-Form) mit farbigem Icon je Status
 * und fügt ihn dem übergebenen Layer hinzu.
 *
 * @param {import('leaflet').LayerGroup} layer
 * @param {{id?:number|string, latitude:number, longitude:number, status?:string, size?:number, name?:string}} net
 * @returns {import('leaflet').Marker}
 */
function createGhostNetModalMarker(layer, net) {
  const marker = L.marker(
    [net.latitude, net.longitude],
    { icon: getStatusIcon(net.status) }   // nutzt die gleiche Funktion wie map.js
  );
  marker.bindPopup(getPopupHtml(net));
  marker.addTo(layer);
  return marker;
}


/**
 * Lädt Ghost-Net-Daten und setzt farbige Marker + (optional) Bounds.
 *
 * @param {import('leaflet').Map} map
 * @returns {Promise<void>}
 */
async function loadGhostNetMarkers(map) {
  try {
    const res = await fetch("/api/ghostnets");
    if (!res.ok) return;

    /** @type {Array<{id?:number|string, latitude:any, longitude:any, status?:string, size?:number, name?:string}>} */
    const netsRaw = await res.json();

    // Wichtig: Lat/Lng hart in Numbers umwandeln, sonst werden sie ggf. als Strings verworfen
    const nets = netsRaw
      .map(n => ({
        ...n,
        latitude: parseFloat(String(n.latitude)),
        longitude: parseFloat(String(n.longitude))
      }))
      .filter(n => Number.isFinite(n.latitude) && Number.isFinite(n.longitude));

    const layer = window.__ghostNetModalLayer__;
    if (!layer) return;
    layer.clearLayers();

    const bounds = [];
    const spread = spreadOverlappingNets(nets, 5, 30);

    spread.forEach((n) => {
      if (isNum(n.latitude) && isNum(n.longitude)) {
        createGhostNetModalMarker(layer, n);
        bounds.push([n.latitude, n.longitude]);
      }
    });

    // Optionales Auto-Fit (im Modal oft nicht gewünscht, deshalb auskommentiert)
    // if (bounds.length) {
    //   map.fitBounds(bounds, { padding: [24, 24] });
    // }
  } catch (e) {
    console.warn("modal-map.js: /api/ghostnets fehlgeschlagen:", e);
  }
}

/** ================= Form/Marker Binding ================= */

/**
 * Setzt oder bewegt den (einen) Marker, optional mit Pan/Zoom.
 *
 * @param {import('leaflet').Map} map
 * @param {number} lat
 * @param {number} lng
 * @param {{pan?: boolean, zoom?: number}} [opts]
 */
function setMarker(map, lat, lng, opts = {}) {
  const { pan = false, zoom } = opts;

  if (!window.__ghostNetModalMarker__) {
    window.__ghostNetModalMarker__ = L.marker([lat, lng], { draggable: true }).addTo(map);

    // Marker dragend → Felder aktualisieren
    window.__ghostNetModalMarker__.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      setFields(pos.lat, pos.lng);
    });
  } else {
    window.__ghostNetModalMarker__.setLatLng([lat, lng]);
  }

  if (typeof zoom === "number") {
    map.setView([lat, lng], zoom, { animate: true });
  } else if (pan) {
    map.panTo([lat, lng], { animate: true });
  }
}

/**
 * Liest Felder, validiert & setzt Marker.
 * - Wird bei "input" von lat/lng verwendet.
 * - Erst wenn beide Werte valide sind, wird die Karte aktualisiert.
 *
 * @param {import('leaflet').Map} map
 */
function syncFromFields(map) {
  const { lat, lng, valid } = readFields();
  if (!valid) return;
  setMarker(map, lat, lng, { pan: true, zo
