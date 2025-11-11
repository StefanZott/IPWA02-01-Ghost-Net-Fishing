/**
 * modal-map.js
 * Interaktive Leaflet-Karte im Bootstrap-Modal #fakeModal1:
 * - Eingaben in lat/lng setzen Marker & zentrieren die Karte.
 * - Klick in die Karte schreibt lat/lng-Felder & versetzt den Marker.
 *
 * Globale Referenzen:
 *   window.__ghostNetModalMap__   : Leaflet-Map (einmalig)
 *   window.__ghostNetModalMarker__: Leaflet-Marker (re-used)
 *
 * Voraussetzungen:
 *   - Bootstrap 5 (Modal)
 *   - Leaflet
 */

/**
 * Erstellt die Leaflet-Map im Element #modal-map.
 * Startansicht: Deutschland
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
 * @returns {Promise<void>}
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

/**
 * Felder → Zahlenwert (mit Range-Check)
 * @returns {{lat:number, lng:number, valid:boolean}}
 */
function readFields() {
  const latEl = /** @type {HTMLInputElement|null} */ (document.getElementById("modal-lat"));
  const lngEl = /** @type {HTMLInputElement|null} */ (document.getElementById("modal-lng"));
  const lat = latEl ? parseFloat(latEl.value.replace(",", ".")) : NaN;
  const lng = lngEl ? parseFloat(lngEl.value.replace(",", ".")) : NaN;

  const latOk = Number.isFinite(lat) && lat >= -90 && lat <= 90;
  const lngOk = Number.isFinite(lng) && lng >= -180 && lng <= 180;

  return { lat, lng, valid: latOk && lngOk };
}

/**
 * Schreibt Felder mit 5 Dezimalen
 * @param {number} lat
 * @param {number} lng
 */
function setFields(lat, lng) {
  const latEl = /** @type {HTMLInputElement|null} */ (document.getElementById("modal-lat"));
  const lngEl = /** @type {HTMLInputElement|null} */ (document.getElementById("modal-lng"));
  if (latEl) latEl.value = toFixedStr(lat, 5);
  if (lngEl) lngEl.value = toFixedStr(lng, 5);
}

/** ================= Bootstrap Modal Hook ================= */

/**
 * Bootstrap-Modal- und Formular-Initialisierung.
 * - Initialisiert/refresh’t die Leaflet-Karte beim Öffnen des Modals.
 * - Liest Koordinatenfelder live aus (debounced) und setzt Marker.
 * - Client-Side-Validation für Pflichtfelder (Lat/Lng).
 */
document.addEventListener("DOMContentLoaded", async () => {
  /** @type {HTMLElement|null} */
  const modalEl = document.getElementById("fakeModal1");
  if (!modalEl) return;

  // Modal geöffnet → Karte initialisieren / refreshen / Inputs anbinden
  modalEl.addEventListener("shown.bs.modal", async () => {
    try {
      if (!window.__ghostNetModalMap__) {
        window.__ghostNetModalMap__ = createModalMap();
      } else {
        await Promise.resolve(); // microtask
        window.__ghostNetModalMap__.invalidateSize();
      }

      // Wenn schon Werte in den Feldern stehen → Marker direkt anzeigen
      const { lat, lng, valid } = readFields();
      if (valid) {
        setMarker(window.__ghostNetModalMap__, lat, lng, { pan: true, zoom: 13 });
      }

      // Form-Submit (Koordinaten-Form) unterbinden – wir reagieren live
      const coordForm = document.getElementById("coord-form");
      coordForm?.addEventListener("submit", (e) => e.preventDefault());

      // Live-Update (leicht entprellt)
      const latEl = document.getElementById("modal-lat");
      const lngEl = document.getElementById("modal-lng");
      const debounced = debounce(() => syncFromFields(window.__ghostNetModalMap__), 150);
      latEl?.addEventListener("input", debounced);
      lngEl?.addEventListener("input", debounced);
    } catch (err) {
      console.error("[modal] Fehler beim Öffnen/Initialisieren:", err);
    }
  });

  // ======= Client-Side-Validation für #add-ghostnet-form =======
  /** @type {HTMLFormElement|null} */
  const form = document.getElementById("add-ghostnet-form");
  if (!form) return;

  /** Pflichtfelder */
  const lngInput = /** @type {HTMLInputElement|null} */ (document.getElementById("modal-lng"));
  const latInput = /** @type {HTMLInputElement|null} */ (document.getElementById("modal-lat"));

  /**
   * Prüft die numerischen Grenzen eines Inputs.
   * Setzt aussagekräftige Fehlermeldungen via setCustomValidity.
   * @param {HTMLInputElement|null} el
   * @param {number} min
   * @param {number} max
   */
  function validateRange(el, min, max) {
    if (!el) return;
    el.setCustomValidity("");
    const val = Number(String(el.value).replace(",", "."));
    const isFiniteNum = Number.isFinite(val);

    if (!el.value) {
      el.setCustomValidity("Dieses Feld ist erforderlich.");
    } else if (!isFiniteNum) {
      el.setCustomValidity("Bitte eine gültige Zahl eingeben.");
    } else if (val < min || val > max) {
      el.setCustomValidity(`Wert außerhalb des gültigen Bereichs (${min} bis ${max}).`);
    }
  }

  // Live-Validierung bei Eingabe
  latInput?.addEventListener("input", () => {
    validateRange(latInput, -90, 90);
    latInput.reportValidity();
  });
  lngInput?.addEventListener("input", () => {
    validateRange(lngInput, -180, 180);
    lngInput.reportValidity();
  });

  // Submit-Handler: prüft Form-Gültigkeit und markiert mit 'was-validated'
  form.addEventListener("submit", async (event) => {
    // Pflichtfelder prüfen (inkl. Range)
    validateRange(latInput, -90, 90);
    validateRange(lngInput, -180, 180);

    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
      form.classList.add("was-validated");
      return;
    }

    // <-- ab hier: eigenen Submit übernehmen
    event.preventDefault();                      // WICHTIG: Default-Submit verhindern

    // Werte robust lesen/normalisieren
    const phoneEl = /** @type {HTMLInputElement} */(document.getElementById("phone-number"));
    const sizeEl  = /** @type {HTMLInputElement} */(document.getElementById("size-ghost-net"));

    const latitude  = Number(String(latInput.value).replace(",", "."));
    const longitude = Number(String(lngInput.value).replace(",", "."));
    const size      = sizeEl?.value ? Number(String(sizeEl.value).replace(",", ".")) : null;
    const phone     = phoneEl?.value?.trim() || null;

    /** @type {{latitude:number, longitude:number, size?:number|null, phone?:string|null}} */
    const payload = { latitude, longitude };
    if (size !== null && Number.isFinite(size)) payload.size = size;
    if (phone) payload.phone = phone;

    try {
      const res = await fetch("/api/ghostnets/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Optional: Fehlermeldung für den/die Nutzer:in
        console.error("POST /api/ghostnets fehlgeschlagen:", res.status, await res.text());
        alert("Speichern fehlgeschlagen. Bitte später erneut versuchen.");
        return;
      }

      // Erfolg: Modal schließen, Liste/Karte aktualisieren
      form.reset();
      form.classList.remove("was-validated");

      // Modal schließen (Bootstrap 5)
      const modal = bootstrap.Modal.getInstance(document.getElementById("fakeModal1"));
      modal?.hide();

      // Karte/Liste neu laden (einfachste Variante: Seite neu, oder gezielt refreshen)
      // a) Seite neu laden:
      // location.reload();

      // b) gezielt: Marker & Sidebar neu laden (falls du Funktionen exportierst)
      // -> hier minimalistisch: Marker aus map.js neu durchladen:
      // (z.B. eigenes Custom-Event abfeuern, das map.js/sidebar.js abonniert)
      document.dispatchEvent(new CustomEvent("ghostnet:created"));
    } catch (e) {
      console.error("Netzwerkfehler beim Speichern:", e);
      alert("Netzwerkfehler beim Speichern.");
    }
  });

  // Komfort: Beim Öffnen des Modals Reset der Validierungszustände.
  modalEl.addEventListener("show.bs.modal", () => {
    form.classList.remove("was-validated");
    [latInput, lngInput].forEach((el) => el?.setCustomValidity && el.setCustomValidity(""));
  });
});

/** ===================== Utilities ===================== */

/**
 * Prüft, ob ein Wert eine Zahl ist (ohne NaN).
 * @param {any} v
 * @returns {boolean}
 */
function isNum(v) { return typeof v === "number" && !Number.isNaN(v); }

/**
 * Formatiert eine Zahl auf 'digits' Nachkommastellen, sonst leerer String.
 * @param {number} n
 * @param {number} digits
 * @returns {string}
 */
function toFixedStr(n, digits) {
  return Number.isFinite(n) ? n.toFixed(digits) : "";
}

/**
 * Einfaches Debounce
 * @template {any[]} T
 * @param {(...args:T)=>void} fn
 * @param {number} wait
 * @returns {(...args:T)=>void}
 */
function debounce(fn, wait) {
  let t = 0;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/**
 * HTML escapen (für Popup-Inhalte).
 * @param {string} s
 * @returns {string}
 */
function esc(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

/**
 * Popup-HTML für vorhandene Ghost Nets.
 * @param {{id:number, name?:string, status?:string, size?:number, latitude?:number, longitude?:number}} net
 * @returns {string}
 */
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
