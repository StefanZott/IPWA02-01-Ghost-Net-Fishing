/**
 * modal-map.js
 * Interaktive Leaflet-Karte im Bootstrap-Modal #fakeModal1:
 * - Eingaben in lat/lng setzen Marker & zentrieren die Karte.
 * - Klick in die Karte schreibt lat/lng-Felder & versetzt den Marker.
 * - Vorhandene GhostNets werden angezeigt (inkl. Overlap-Spread).
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
 * Lädt Ghost-Net-Daten und setzt Marker + (optional) Bounds.
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
        const m = L.marker([n.latitude, n.longitude]).addTo(layer);
        m.bindPopup(getPopupHtml(n));
        bounds.push([n.latitude, n.longitude]);
      }
    });

    // Optionales Auto-Fit (im Modal oft nicht gewünscht, deshalb aus)
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
 * - Client-Side-Validation für Pflichtfelder (Lat/Lng) und POST an Backend.
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

  // ======= Client-Side-Validation + POST für #add-ghostnet-form =======
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

  // Submit-Handler: prüft Form-Gültigkeit, sendet POST und feuert Event
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
    event.preventDefault();

    // Werte robust lesen/normalisieren
    const phoneEl = /** @type {HTMLInputElement} */(document.getElementById("phone-number"));
    const sizeEl  = /** @type {HTMLInputElement} */(document.getElementById("size-ghost-net"));

    const latitude  = Number(String(latInput.value).replace(",", "."));
    const longitude = Number(String(lngInput.value).replace(",", "."));
    const size      = sizeEl?.value ? Number(String(sizeEl.value).replace(",", ".")) : null;
    const phone     = phoneEl?.value?.trim() || null;

    // User-ID ermitteln (Auth-Store oder sessionStorage)
    const currentUserId = getCurrentUserId();

    /**
     * Payload für das Backend.
     * WICHTIG: Falls dein Backend einen anderen Feldnamen erwartet
     * (z.B. "userId" statt "reportedByUserId"), hier anpassen.
     *
     * reportedByUserId wird IMMER mitgeschickt (number oder null).
     */
    /** @type {{latitude:number, longitude:number, size?:number|null, phone?:string|null, reportedByUserId:number|null}} */
    const payload = {
      latitude,
      longitude,
    };

    if (size !== null && Number.isFinite(size)) payload.size = size;
    if (phone) payload.phone = phone;

    try {
      // Passe ggf. den Endpoint an: /api/ghostnets ODER /api/ghostnets/add
      const res = await fetch("/api/ghostnets/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-User-Id": currentUserId ?? null
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
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

      // Sidebar + Hauptkarte aktualisieren
      document.dispatchEvent(new CustomEvent("ghostnet:created"));

      // Auch die Marker im Modal neu laden (damit neue Einträge sichtbar sind)
      if (window.__ghostNetModalMap__) {
        await loadGhostNetMarkers(window.__ghostNetModalMap__);
      }
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
 * Liefert die aktuelle User-ID aus globalem Auth-Store oder sessionStorage.
 * Falls kein User gefunden wird oder keine ID vorhanden ist, wird null zurückgegeben.
 *
 * Erwartete Strukturen:
 *  - window.Auth.getUser() → { id: number | string, ... }
 *  - sessionStorage["user"] → JSON-Objekt mit Feld "id"
 *
 * @returns {number|null} User-ID oder null (anonyme Meldung)
 */
function getCurrentUserId() {
  try {
    // 1) Bevorzugt: globaler Auth-Store (auth-store.js)
    if (window.Auth && typeof window.Auth.getUser === "function") {
      const u = window.Auth.getUser();
      if (u && u.id !== undefined && u.id !== null) {
        const idNum = Number(u.id);
        if (Number.isFinite(idNum)) return idNum;
      }
    }

    // 2) Fallback: direkt aus sessionStorage lesen
    const raw = sessionStorage.getItem("user");
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed && parsed.id !== undefined && parsed.id !== null) {
      const idNum = Number(parsed.id);
      if (Number.isFinite(idNum)) return idNum;
    }
  } catch (err) {
    console.warn("[modal-map.js] getCurrentUserId(): Fehler beim Lesen des Users:", err);
  }

  // 3) Kein User → anonym
  return null;
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
 * @param {{id?:number|string, name?:string, status?:string, size?:number, latitude?:number, longitude?:number}} net
 * @returns {string}
 */
function getPopupHtml(net) {
  const name = esc(net.name ?? `#${net.id ?? "?"}`);
  const status = esc(net.status ?? "REPORTED");
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

/**
 * Verhindert überlappende Marker, indem Gruppen gleicher Koordinaten minimal
 * versetzt (im Kreis) dargestellt werden.
 *
 * WICHTIG: Diese Version coerc’t latitude/longitude in Numbers, damit
 * auch String-Werte vom Backend nicht „durchfallen“.
 *
 * @param {Array<{latitude:any, longitude:any, [k:string]:any}>} nets
 * @param {number} [precision=5] Dezimalstellen zur Gruppierung
 * @param {number} [radiusM=30]  Radius in Metern für die Verteilung
 * @returns {Array<{latitude:number, longitude:number, [k:string]:any, __spreadMeta?:{index:number,total:number}}>}
 */
function spreadOverlappingNets(nets, precision = 5, radiusM = 30) {
  // 1° Breite ≈ 111_320 m; 1° Länge ≈ 111_320 * cos(lat)
  const degLat = (m) => m / 111320;

  /** @type {Map<string, Array<any>>} */
  const groups = new Map();

  for (const raw of nets) {
    const latNum = parseFloat(String(raw.latitude));
    const lngNum = parseFloat(String(raw.longitude));
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) continue;

    const item = { ...raw, latitude: latNum, longitude: lngNum };
    const key = `${latNum.toFixed(precision)}|${lngNum.toFixed(precision)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
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
