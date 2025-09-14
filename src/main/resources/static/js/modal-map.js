/**
 * modal-map.js
 * Interaktive Leaflet-Karte im Bootstrap-Modal #fakeModal1:
 * - Eingaben in lat/lng setzen Marker & zentrieren die Karte.
 * - Klick in die Karte schreibt lat/lng-Felder & versetzt den Marker.
 *
 * Globale Referenzen:
 *   window.__ghostNetModalMap__  : Leaflet-Map (einmalig)
 *   window.__ghostNetModalMarker__: Leaflet-Marker (re-used)
 */

/** @returns {import('leaflet').Map|null} */
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

  // Nach Rendern: Größe berechnen
  setTimeout(() => map.invalidateSize(), 0);

  // Klick in die Karte → Felder füllen & Marker setzen
  map.on("click", (ev) => {
    const { lat, lng } = ev.latlng;
    setFields(lat, lng);
    setMarker(map, lat, lng, { pan: true });
  });

  // Optional: vorhandene Ghost Nets anzeigen (wie in map.js)
  loadGhostNetMarkers(map).catch((e) => console.warn("modal-map.js:", e));

  return map;
}

/**
 * Lädt Ghost-Net-Daten und setzt Marker + Bounds (optional).
 * @param {import('leaflet').Map} map
 */
async function loadGhostNetMarkers(map) {
  try {
    const res = await fetch("/api/ghostnets");
    if (!res.ok) return;

    const nets = await res.json();
    const bounds = [];
    nets.forEach((n) => {
      if (isNum(n.latitude) && isNum(n.longitude)) {
        const m = L.marker([n.latitude, n.longitude]).addTo(map);
        m.bindPopup(getPopupHtml(n));
        bounds.push([n.latitude, n.longitude]);
      }
    });

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [24, 24] });
    }
  } catch (e) {
    console.warn("modal-map.js: /api/ghostnets fehlgeschlagen:", e);
  }
}

/** ========= Form/Marker Binding ========= */

/**
 * Setzt oder bewegt den (einen) Marker, optional mit Pan/Zoom.
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
 * @param {import('leaflet').Map} map
 */
function syncFromFields(map) {
  const { lat, lng, valid } = readFields();
  if (!valid) return;
  setMarker(map, lat, lng, { pan: true, zoom: 13 });
}

/** Felder → Zahlenwert (mit Range-Check) */
function readFields() {
  const latEl = /** @type {HTMLInputElement|null} */ (document.getElementById("modal-lat"));
  const lngEl = /** @type {HTMLInputElement|null} */ (document.getElementById("modal-lng"));
  const lat = latEl ? parseFloat(latEl.value.replace(",", ".")) : NaN;
  const lng = lngEl ? parseFloat(lngEl.value.replace(",", ".")) : NaN;

  const latOk = Number.isFinite(lat) && lat >= -90 && lat <= 90;
  const lngOk = Number.isFinite(lng) && lng >= -180 && lng <= 180;

  return { lat, lng, valid: latOk && lngOk };
}

/** Schreibt Felder mit 5 Dezimalen */
function setFields(lat, lng) {
  const latEl = /** @type {HTMLInputElement|null} */ (document.getElementById("modal-lat"));
  const lngEl = /** @type {HTMLInputElement|null} */ (document.getElementById("modal-lng"));
  if (latEl) latEl.value = toFixedStr(lat, 5);
  if (lngEl) lngEl.value = toFixedStr(lng, 5);
}

/** ========= Bootstrap Modal Hook ========= */

document.addEventListener("DOMContentLoaded", () => {
  const modalEl = document.getElementById("fakeModal1");
  if (!modalEl) return;

  // Beim Öffnen: Karte initialisieren/refreshen und ggf. Marker aus vorhandenen Feldern setzen
  modalEl.addEventListener("shown.bs.modal", () => {
    if (!window.__ghostNetModalMap__) {
      window.__ghostNetModalMap__ = createModalMap();
    } else {
      setTimeout(() => window.__ghostNetModalMap__.invalidateSize(), 0);
    }

    // Wenn in den Feldern bereits Koordinaten stehen → direkt anzeigen
    const { lat, lng, valid } = readFields();
    if (valid) {
      setMarker(window.__ghostNetModalMap__, lat, lng, { pan: true, zoom: 13 });
    }

    // Form-Submit unterbinden (wir reagieren live auf input)
    const form = document.getElementById("coord-form");
    form?.addEventListener("submit", (e) => e.preventDefault());

    // Live-Update bei Eingabe (leicht entprellt)
    const latEl = document.getElementById("modal-lat");
    const lngEl = document.getElementById("modal-lng");
    const debounced = debounce(() => syncFromFields(window.__ghostNetModalMap__), 150);

    latEl?.addEventListener("input", debounced);
    lngEl?.addEventListener("input", debounced);
  });

  /** ========= Formular Handler ========= */
  const form = document.getElementById("add-ghostnet-form");
    if (form) {
      form.addEventListener("submit", (ev) => {
        ev.preventDefault(); // Seite nicht neu laden

        const data = {
          firstName: form.querySelector('[aria-describedby="first-name"]')?.value.trim(),
          lastName: form.querySelector('[aria-describedby="last-name"]')?.value.trim(),
          phone: form.querySelector('[aria-describedby="phone-number"]')?.value.trim(),
          longitude: form.querySelector('[aria-describedby="longitude"]')?.value.trim(),
          latitude: form.querySelector('[aria-describedby="latitude"]')?.value.trim(),
        };

        console.log("Formulardaten:", data);

        // Hier kannst du die Daten an dein Backend schicken:
        // fetch("/api/ghostnets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })

        // Modal schließen, wenn gewünscht:
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal?.hide();
      });
  }
});

/** ========= Utils ========= */
function isNum(v) { return typeof v === "number" && !Number.isNaN(v); }
function toFixedStr(n, digits) {
  return Number.isFinite(n) ? n.toFixed(digits) : "";
}
function debounce(fn, wait) {
  let t = 0;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}
function getPopupHtml(net) {
  const name = esc(net.name ?? `#${net.id}`);
  const status = esc(net.status ?? "unbekannt");
  const size = typeof net.size === "number" ? `Größe: ${net.size}` : "";
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
