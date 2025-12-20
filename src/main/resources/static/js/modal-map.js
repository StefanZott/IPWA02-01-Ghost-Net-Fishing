/**
 * modal-map.js
 * Interaktive Leaflet-Karte im Bootstrap-Modal #fakeModal1:
 * - Klick in die Karte setzt Marker + schreibt lat/lng Felder
 * - Vorhandene GhostNets werden farbig nach Status angezeigt (Pins, keine Kreise!)
 * - Overlap-Spreading für gleiche Positionen
 * - POST /api/ghostnets/add zum Erstellen neuer Einträge
 */

/* -------------------------------------------------------
 *  Farbige Marker-Icons (Standard-Pin-Form)
 *  Quelle Icons: https://github.com/pointhi/leaflet-color-markers
 * ------------------------------------------------------- */
const __markerShadow =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png";

const __iconBase =
  "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/";

function coloredIcon(file) {
  return L.icon({
    iconUrl: __iconBase + file,
    shadowUrl: __markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
}

const STATUS_ICON = {
  REPORTED:  coloredIcon("marker-icon-blue.png"),
  SCHEDULED: coloredIcon("marker-icon-gold.png"),
  RECOVERED: coloredIcon("marker-icon-green.png"),
  CANCELLED: coloredIcon("marker-icon-red.png"),
};

/**
 * Liefert Icon je Status (Fallback = Blau)
 */
function getStatusIcon(status) {
  const key = String(status || "").toUpperCase();
  return STATUS_ICON[key] || STATUS_ICON.REPORTED;
}

/* -------------------------------------------------------
 *  Karte im Modal erzeugen
 * ------------------------------------------------------- */
function createModalMap() {
  const el = document.getElementById("modal-map");
  if (!el) {
    console.error("modal-map.js: #modal-map nicht gefunden.");
    return null;
  }

  const map = L.map(el, { zoomControl: true }).setView([51.163, 10.447], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap-Mitwirkende",
  }).addTo(map);

  window.__ghostNetModalLayer__ = L.layerGroup().addTo(map);

  setTimeout(() => map.invalidateSize(), 0);

  // Klick → Marker + Felder
  map.on("click", (ev) => {
    const { lat, lng } = ev.latlng;
    setFields(lat, lng);
    setMarker(map, lat, lng, { pan: true });
  });

  loadGhostNetMarkers(map);

  return map;
}

/* -------------------------------------------------------
 *  GhostNets anzeigen (mit farbigen Pins)
 * ------------------------------------------------------- */
async function loadGhostNetMarkers(map) {
  try {
    const res = await fetch("/api/ghostnets");
    if (!res.ok) return;

    const raw = await res.json();

    const nets = raw
      .map(n => ({
        ...n,
        latitude: Number(n.latitude),
        longitude: Number(n.longitude)
      }))
      .filter(n => Number.isFinite(n.latitude) && Number.isFinite(n.longitude));

    const layer = window.__ghostNetModalLayer__;
    layer.clearLayers();

    const spread = spreadOverlappingNets(nets, 5, 30);

    spread.forEach(n => {
      const marker = L.marker(
        [n.latitude, n.longitude],
        { icon: getStatusIcon(n.status) }
      );
      marker.bindPopup(getPopupHtml(n));
      marker.addTo(layer);
    });

  } catch (err) {
    console.warn("modal-map.js: Fehler beim Laden:", err);
  }
}

/* -------------------------------------------------------
 *  Marker setzen für die Eingabe (nur 1 Stück, neutral)
 * ------------------------------------------------------- */
function setMarker(map, lat, lng, opts = {}) {
  const { pan = false, zoom = null } = opts;

  if (!window.__ghostNetModalMarker__) {
    window.__ghostNetModalMarker__ = L.marker([lat, lng], {
      draggable: true,
    }).addTo(map);

    window.__ghostNetModalMarker__.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      setFields(pos.lat, pos.lng);
    });

  } else {
    window.__ghostNetModalMarker__.setLatLng([lat, lng]);
  }

  if (zoom !== null) {
    map.setView([lat, lng], zoom, { animate: true });
  } else if (pan) {
    map.panTo([lat, lng], { animate: true });
  }
}

/* -------------------------------------------------------
 *  Felder → Marker Sync
 * ------------------------------------------------------- */
function syncFromFields(map) {
  const { lat, lng, valid } = readFields();
  if (!valid) return;
  setMarker(map, lat, lng, { pan: true, zoom: 13 });
}

function readFields() {
  const latEl = document.getElementById("modal-lat");
  const lngEl = document.getElementById("modal-lng");

  const lat = Number(latEl.value.replace(",", "."));
  const lng = Number(lngEl.value.replace(",", "."));

  const okLat = Number.isFinite(lat) && lat >= -90 && lat <= 90;
  const okLng = Number.isFinite(lng) && lng >= -180 && lng <= 180;

  return { lat, lng, valid: okLat && okLng };
}

function setFields(lat, lng) {
  document.getElementById("modal-lat").value = lat.toFixed(5);
  document.getElementById("modal-lng").value = lng.toFixed(5);
}

/* -------------------------------------------------------
 *  Modal Initialisierung
 * ------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const modalEl = document.getElementById("fakeModal1");
  const form = document.getElementById("add-ghostnet-form");

  if (!modalEl || !form) return;

  modalEl.addEventListener("shown.bs.modal", () => {
    if (!window.__ghostNetModalMap__) {
      window.__ghostNetModalMap__ = createModalMap();
    } else {
      window.__ghostNetModalMap__.invalidateSize();
    }

    const { lat, lng, valid } = readFields();
    if (valid) {
      setMarker(window.__ghostNetModalMap__, lat, lng, { pan: true, zoom: 13 });
    }

    const deb = debounce(() => syncFromFields(window.__ghostNetModalMap__), 150);
    document.getElementById("modal-lat").addEventListener("input", deb);
    document.getElementById("modal-lng").addEventListener("input", deb);
  });

  /* -------------------------------------------
   *  Formular absenden → POST zum Backend
   * ------------------------------------------- */
      form.addEventListener("submit", async (ev) => {
    ev.preventDefault();

    const { lat, lng, valid } = readFields();
    if (!valid) {
      alert("Bitte gültige Koordinaten eingeben.");
      return;
    }

    const size = document.getElementById("size-ghost-net").value;
    const phone = document.getElementById("phone-number").value;
    const userId = getCurrentUserId();

    const payload = {
      latitude: lat,
      longitude: lng,
    };
    if (size) payload.size = Number(size);
    if (phone) payload.phone = phone;
    if (userId) payload.reportedByUserId = userId;

    const res = await fetch("/api/ghostnets/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": userId ?? "",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("Fehler beim Speichern.");
      return;
    }

    // Nach Speichern → Modal schließen & Hauptkarte informieren
    bootstrap.Modal.getInstance(modalEl).hide();
    document.dispatchEvent(new CustomEvent("ghostnet:created"));

    // Modal-Liste aktualisieren
    if (window.__ghostNetModalMap__) {
      loadGhostNetMarkers(window.__ghostNetModalMap__);
    }
  });
});

/* -------------------------------------------------------
 *  Utils
 * ------------------------------------------------------- */
function debounce(fn, ms) {
  let t = 0;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function getCurrentUserId() {
  try {
    if (window.Auth?.getUser) {
      const u = window.Auth.getUser();
      if (u?.id != null) return Number(u.id);
    }
    const raw = sessionStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.id != null) return Number(u.id);
    }
  } catch {}
  return null;
}

function getPopupHtml(net) {
  const lat = net.latitude?.toFixed(5);
  const lng = net.longitude?.toFixed(5);
  const size = net.size != null ? `${net.size} m²` : "-";

  return `
    <div>
      <strong>#${net.id} ${net.status}</strong><br>
      📍 ${lat}, ${lng}<br>
      🕸️ Größe: ${size}
    </div>`;
}

/* -------------------------------------------------------
 *  Overlap-Spreading
 * ------------------------------------------------------- */
function spreadOverlappingNets(nets, precision = 5, radiusM = 30) {
  const degLat = (m) => m / 111320;

  /** @type {Map<string, Array<any>>} */
  const groups = new Map();

  nets.forEach(n => {
    const k = `${n.latitude.toFixed(precision)}|${n.longitude.toFixed(precision)}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(n);
  });

  const out = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      out.push(group[0]);
      continue;
    }

    const total = group.length;
    group.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / total;
      const latRad = n.latitude * Math.PI / 180;
      const degLng = (m) => m / (111320 * Math.cos(latRad));

      const dLat = degLat(radiusM) * Math.sin(angle);
      const dLng = degLng(radiusM) * Math.cos(angle);

      out.push({
        ...n,
        latitude: n.latitude + dLat,
        longitude: n.longitude + dLng,
      });
    });
  }

  return out;
}