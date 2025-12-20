/**
 * sidebar.js
 * Listet Ghost Nets in der Sidebar als kompakte Cards:
 *  Zeile 1: "#<id> <STATUS>"
 *  Zeile 2: "<lat>, <lng>"
 *  Zeile 3 (optional): "Übernommen von User-ID #<id>"
 *
 * Klick fokussiert die Map (map.js), sonst keine Auto-Zooms.
 *
 * Erweiterungen:
 *  - Hört auf das Custom-Event "ghostnet:created" (wird nach erfolgreichem POST aus modal-map.js gefeuert)
 *  - Lädt dann die Sidebar neu, behält dabei die aktuelle Such-Query bei
 *
 * @typedef {Object} GhostNet
 * @property {number|string} id
 * @property {number} latitude
 * @property {number} longitude
 * @property {string=} status
 * @property {string=} name
 * @property {number=} size
 * @property {string=} updatedAt
 * @property {number|null|undefined} scheduledByUserId - ID der bergenden Person (optional)
 */

document.addEventListener("DOMContentLoaded", () => {
  const listEl   = document.getElementById("gn-list");
  const searchEl = /** @type {HTMLInputElement|null} */ (document.getElementById("gn-search"));
  const countEl  = document.getElementById("gn-count");

  if (!listEl) {
    console.error("sidebar.js: #gn-list nicht gefunden.");
    return;
  }

  /** @type {GhostNet[]} */
  let allNets = [];
  /** @type {string} Aktuelle Such-Query */
  let currentQuery = "";

  // --- Öffentliche/Globale Event-Hooks --------------------------------------

  // Bei neuem Eintrag: Liste neu laden (Filter bleibt aktiv)
  document.addEventListener("ghostnet:created", () => {
    reloadSidebar();
  });

  // --- Hilfsfunktionen -------------------------------------------------------

  /**
   * Lädt alle GhostNets vom Backend.
   * @returns {Promise<GhostNet[]>}
   */
  async function fetchGhostNets() {
    try {
      const res = await fetch("/api/ghostnets", { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return /** @type {GhostNet[]} */ (await res.json());
    } catch (e) {
      console.error("sidebar.js: Konnte Ghost Nets nicht laden:", e);
      return [];
    }
  }

  /**
   * Formatiert Zahl mit 3 Nachkommastellen, sonst "–".
   * @param {unknown} n
   * @returns {string}
   */
  const fmt3 = (n) =>
    typeof n === "number" && Number.isFinite(n) ? n.toFixed(3) : "–";

  /**
   * Liefert CSS-Klasse für Status-Badge.
   * @param {string|undefined} s
   * @returns {string}
   */
  const statusClass = (s) => `gn-status gn-status--${(s || "REPORTED").toUpperCase()}`;

  /**
   * Escaping für einfache Text-Outputs.
   * @param {string} s
   * @returns {string}
   */
  function escapeHtml(s) {
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  /**
   * Erzeugt den HTML-Block für die optionale Zeile mit der bergenden Person.
   * Es wird nur angezeigt, wenn eine User-ID gesetzt ist.
   *
   * @param {GhostNet} net
   * @returns {string} HTML-Fragment (oder leerer String)
   */
  function renderScheduledByRow(net) {
    if (net.scheduledByUserId == null) {
      return "";
    }

    // Optional: nur bei SCHEDULED/RECOVERED anzeigen
    const status = (net.status || "REPORTED").toUpperCase();
    if (status !== "SCHEDULED" && status !== "RECOVERED") {
      return "";
    }

    const idText = escapeHtml(String(net.scheduledByUserId));
    return `<div class="gn-row3 small text-muted">Übernommen von User-ID #${idText}</div>`;
  }

  /**
   * Rendert Cards in die Liste.
   * @param {GhostNet[]} nets
   */
  function render(nets) {
    listEl.innerHTML = "";
    if (countEl) countEl.textContent = String(nets.length);

    if (!nets.length) {
      listEl.innerHTML = `<li class="text-muted">Keine Einträge</li>`;
      return;
    }

    for (const net of nets) {
      const latTxt = fmt3(net.latitude);
      const lngTxt = fmt3(net.longitude);
      const statusTxt = (net.status || "REPORTED").toUpperCase();

      const li = document.createElement("li");
      li.dataset.id = String(net.id);

      const scheduledRowHtml = renderScheduledByRow(net);

      li.innerHTML = `
        <article class="gn-card" role="button" tabindex="0" aria-label="Geisternetz #${escapeHtml(String(net.id))}">
          <div class="gn-row1">
            <span>#${escapeHtml(String(net.id))}</span>
            <span class="${statusClass(statusTxt)}" style="margin-left:.35rem">${escapeHtml(statusTxt)}</span>
          </div>
          <div class="gn-row2">${latTxt}, ${lngTxt}</div>
          ${scheduledRowHtml}
        </article>
      `;

      // Klick/Enter → Karte fokussieren
      li.addEventListener("click", () => focusOnMap(net.latitude, net.longitude, 13));
      li.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          focusOnMap(net.latitude, net.longitude, 13);
        }
      });

      listEl.appendChild(li);
    }
  }

  /**
   * Filtert anhand der aktuellen Query nach name/status (Case-Insensitive).
   * Optional könnte hier auch nach ID oder scheduledByUserId gefiltert werden.
   *
   * @param {GhostNet[]} nets
   * @param {string} query
   * @returns {GhostNet[]}
   */
  function applyFilter(nets, query) {
    const q = query.toLowerCase().trim();
    if (!q) return nets;

    return nets.filter((n) => {
      const name   = (n.name ?? "").toLowerCase();
      const status = (n.status ?? "").toLowerCase();
      // Optional: ID/Übernehmer in Textsuche einbeziehen
      const idText = String(n.id ?? "").toLowerCase();
      const scheduledText = n.scheduledByUserId != null ? String(n.scheduledByUserId).toLowerCase() : "";

      return (
        name.includes(q) ||
        status.includes(q) ||
        idText.includes(q) ||
        scheduledText.includes(q)
      );
    });
  }

  /**
   * Lädt die Liste neu, wendet aktuellen Filter an und rendert.
   * Beibehaltung der globalen Variablen `allNets` und `currentQuery`.
   */
  async function reloadSidebar() {
    allNets = await fetchGhostNets();

    // LISTE NACH ID SORTIEREN (aufsteigend)
    allNets.sort((a, b) => Number(a.id) - Number(b.id));

    const filtered = applyFilter(allNets, currentQuery);
    render(filtered);
  }

  // --- Initiales Laden + Suchfeld verdrahten -------------------------------

  // Initial laden
  reloadSidebar();

  // Live-Filter
  if (searchEl) {
    searchEl.addEventListener("input", () => {
      currentQuery = String(searchEl.value ?? "");
      const filtered = applyFilter(allNets, currentQuery);
      render(filtered);
    });
  }
});

/**
 * Karte fokussieren (Map kommt aus map.js via window.__ghostNetMap__).
 *
 * @param {number} lat
 * @param {number} lng
 * @param {number} [zoom=13]
 */
function focusOnMap(lat, lng, zoom = 13) {
  const map = window.__ghostNetMap__;
  if (!map || typeof map.setView !== "function") return;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    map.setView([lat, lng], zoom, { animate: true });
  }
}