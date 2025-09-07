/**
 * sidebar.js
 * Baut die linke Sidebar-Liste auf, filtert per Suchfeld
 * und fokussiert die Karte (map.js) beim Klick auf einen Eintrag.
 *
 * Erwartet die Elemente:
 *  - <input id="gn-search">
 *  - <ul id="gn-list">
 * Und die globale Karteninstanz: window.__ghostNetMap__ (von map.js)
 */

/**
 * Typdefinition (JSDoc) für Lesbarkeit
 * @typedef {Object} GhostNet
 * @property {number} id
 * @property {string=} name
 * @property {number} latitude
 * @property {number} longitude
 * @property {string=} status
 * @property {number=} size
 * @property {string=} updatedAt
 */

document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("gn-list");
  const searchEl = document.getElementById("gn-search");

  if (!listEl) {
    console.error("sidebar.js: #gn-list nicht gefunden.");
    return;
  }

  /** @type {GhostNet[]} */
  let allNets = [];

  // Daten vom Backend laden
  try {
    const res = await fetch("/api/ghostnets");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allNets = await res.json();
  } catch (e) {
    console.error("sidebar.js: Konnte Ghost Nets nicht laden:", e);
    listEl.innerHTML = `<li class="text-danger">Fehler beim Laden.</li>`;
    return;
  }

  // Render-Funktion
  const render = (nets) => {
    listEl.innerHTML = "";
    if (!nets.length) {
      listEl.innerHTML = `<li class="text-muted">Keine Einträge</li>`;
      return;
    }
    for (const net of nets) {
      const li = document.createElement("li");
      li.className = "sidebar__item";
      li.dataset.id = String(net.id);

      li.innerHTML = `
        <div class="sidebar__name">${escapeHtml(net.name ?? `#${net.id}`)}</div>
        <div class="sidebar__status">${escapeHtml(net.status ?? "unbekannt")}</div>
        <div class="sidebar__meta">${fmtMeta(net)}</div>
      `;

      // Klick: Karte fokussieren
      li.addEventListener("click", () => focusOnMap(net.latitude, net.longitude, 13));

      listEl.appendChild(li);
    }
  };

  render(allNets);

  // Live-Filter
  if (searchEl) {
    searchEl.addEventListener("input", (ev) => {
      const q = String(ev.target.value ?? "").toLowerCase().trim();
      const filtered = !q ? allNets : allNets.filter(n =>
        (n.name ?? "").toLowerCase().includes(q) ||
        (n.status ?? "").toLowerCase().includes(q)
      );
      render(filtered);
    });
  }
});

/** Karte fokussieren (nutzt die Map aus map.js) */
function focusOnMap(lat, lng, zoom = 13) {
  const map = window.__ghostNetMap__;
  if (!map || typeof map.setView !== "function") {
    console.warn("sidebar.js: Karte nicht bereit.");
    return;
  }
  if (isFinite(lat) && isFinite(lng)) {
    map.setView([lat, lng], zoom, { animate: true });
  }
}

/** Utilities */
function fmtMeta(n) {
  const size = (typeof n.size === "number") ? `Größe: ${n.size}` : "";
  const date = n.updatedAt ? `· Stand: ${new Date(n.updatedAt).toLocaleDateString()}` : "";
  const lat = (typeof n.latitude === "number") ? n.latitude.toFixed(3) : null;
  const lng = (typeof n.longitude === "number") ? n.longitude.toFixed(3) : null;
  const coords = (lat && lng) ? `· ${lat}, ${lng}` : "";
  return [size, date, coords].filter(Boolean).join(" ");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
