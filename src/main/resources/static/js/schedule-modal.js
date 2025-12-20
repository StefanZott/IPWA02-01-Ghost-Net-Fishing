/**
 * schedule-modal.js
 * -----------------
 * Steuert das Modal "Bergung ankündigen / Status ändern":
 *  - Lädt alle Geisternetze von /api/ghostnets
 *  - Zeigt sie als Liste (gn-card) an
 *  - Ermöglicht die Auswahl eines Geisternetzes
 *  - Schickt den neuen Status per PATCH an /api/ghostnets/{id}/status
 *
 * Abhängigkeiten:
 *  - Bootstrap (Modal, global "bootstrap")
 *  - Backend-Endpoint: GET /api/ghostnets, PATCH /api/ghostnets/{id}/status
 */

/**
 * Typ-Hinweis für ein Geisternetz (doc only).
 * @typedef {Object} GhostNet
 * @property {number} id
 * @property {number} latitude
 * @property {number} longitude
 * @property {number|null} size
 * @property {string} status
 * @property {number|null|undefined} scheduledByUserId - ID der bergenden Person (optional)
 */

document.addEventListener("DOMContentLoaded", () => {
  const menuItem = document.getElementById("menuProfileSheduled");
  const modalEl  = document.getElementById("editGhostNetModal");
  const listEl   = document.getElementById("schedule-gn-list");
  const selectedBox = document.getElementById("schedule-selected-net");
  const hiddenId = /** @type {HTMLInputElement|null} */(
    document.getElementById("schedule-net-id")
  );
  const statusSelect = /** @type {HTMLSelectElement|null} */(
    document.getElementById("schedule-status")
  );
  const formEl   = /** @type {HTMLFormElement|null} */(
    document.getElementById("schedule-form")
  );
  const errorBox = document.getElementById("schedule-error");
  const submitBtn = /** @type {HTMLButtonElement|null} */(
    document.getElementById("schedule-submit")
  );

  if (!menuItem || !modalEl || !listEl || !selectedBox || !hiddenId ||
      !statusSelect || !formEl || !errorBox || !submitBtn) {
    console.warn("[schedule-modal] Benötigte DOM-Elemente nicht gefunden.");
    return;
  }

  let modal;
  try {
    // Bootstrap-Modal-Instanz holen
    modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  } catch (e) {
    console.error("[schedule-modal] Bootstrap Modal nicht verfügbar:", e);
    return;
  }

  /** @type {GhostNet[]} */
  let nets = [];
  /** @type {GhostNet|null} */
  let selectedNet = null;

  /**
   * Liefert den aktuell eingeloggten Benutzer aus sessionStorage["auth.user"].
   * Erwartete Struktur (aus LoginResponse):
   * { userId: number, username: string, ... }
   *
   * @returns {{ userId: number } | null}
   */
  function getCurrentUser() {
    try {
      const raw = sessionStorage.getItem("auth.user");
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (obj && typeof obj.id === "number") {
        return obj;
      }
    } catch (e) {
      console.warn("[schedule-modal] Konnte auth.user nicht lesen:", e);
    }
    return null;
  }

  /**
   * Lädt alle Geisternetze vom Backend.
   * @returns {Promise<GhostNet[]>}
   */
  async function fetchGhostNets() {
    const res = await fetch("/api/ghostnets");
    if (!res.ok) {
      throw new Error("HTTP-Fehler beim Laden der Geisternetze: " + res.status);
    }
    return res.json();
  }

  /**
   * Löscht Fehlermeldung im Modal.
   */
  function clearError() {
    errorBox.classList.add("d-none");
    errorBox.textContent = "";
  }

  /**
   * Zeigt eine Fehlermeldung im Modal an.
   * @param {string} msg
   */
  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("d-none");
  }

  /**
   * Rendert die Liste der Geisternetze als klickbare Karten.
   * @param {GhostNet[]} data
   */
  function renderList(data) {
    listEl.innerHTML = "";
    if (!data.length) {
      listEl.innerHTML = `<div class="text-muted small">
        Keine Geisternetze gefunden.
      </div>`;
      return;
    }

    data.forEach((net) => {
      const li = document.createElement("div");
      li.className = "gn-card gn-card--selectable";
      li.dataset.netId = String(net.id);

      const statusClass = "gn-status gn-status--" + (net.status || "").toUpperCase();

      const lat = typeof net.latitude === "number"
        ? net.latitude.toFixed(5)
        : "-";
      const lng = typeof net.longitude === "number"
        ? net.longitude.toFixed(5)
        : "-";
      const size = typeof net.size === "number"
        ? `${net.size} m²`
        : "unbekannt";

      li.innerHTML = `
        <div class="gn-row1 d-flex justify-content-between">
          <span>#${net.id}</span>
          <span class="${statusClass}">${net.status}</span>
        </div>
        <div class="gn-row2">
          Koord.: ${lat}, ${lng}<br>
          Größe: ${size}
        </div>
      `;

      li.addEventListener("click", () => {
        selectNet(net.id);
      });

      listEl.appendChild(li);
    });

    updateSelectionHighlight();
  }

  /**
   * Aktualisiert die optische Hervorhebung des ausgewählten Elements.
   */
  function updateSelectionHighlight() {
    const children = listEl.querySelectorAll(".gn-card--selectable");
    children.forEach((el) => {
      el.classList.remove("gn-card--selected");
      const idAttr = el.getAttribute("data-net-id");
      if (selectedNet && idAttr === String(selectedNet.id)) {
        el.classList.add("gn-card--selected");
      }
    });
  }

  /**
   * Wählt ein Geisternetz anhand der ID aus und aktualisiert Detailbereich und Form.
   *
   * @param {number} id
   */
  function selectNet(id) {
    selectedNet = nets.find((n) => Number(n.id) === Number(id)) || null;
    clearError();

    if (!selectedNet) {
      selectedBox.textContent = "Geisternetz nicht gefunden.";
      hiddenId.value = "";
      submitBtn.disabled = true;
      return;
    }

    const lat = typeof selectedNet.latitude === "number"
      ? selectedNet.latitude.toFixed(5)
      : "-";
    const lng = typeof selectedNet.longitude === "number"
      ? selectedNet.longitude.toFixed(5)
      : "-";
    const size = typeof selectedNet.size === "number"
      ? `${selectedNet.size} m²`
      : "unbekannt";

    const scheduledInfo = selectedNet.scheduledByUserId != null
      ? `<br>Bergung durch User-ID: ${selectedNet.scheduledByUserId}`
      : "";

    selectedBox.innerHTML = `
      <div><strong>Geisternetz #${selectedNet.id}</strong></div>
      <div class="text-muted small">
        Status: ${selectedNet.status}<br>
        Koord.: ${lat}, ${lng}<br>
        Größe: ${size}
        ${scheduledInfo}
      </div>
    `;
    hiddenId.value = String(selectedNet.id);
    submitBtn.disabled = false;

    const currentStatus = (selectedNet.status || "").toUpperCase();
    if ([...statusSelect.options].some(o => o.value === currentStatus)) {
      statusSelect.value = currentStatus;
    } else {
      statusSelect.value = "";
    }

    updateSelectionHighlight();
  }

  /**
   * Schickt den neuen Status an das Backend.
   * Setzt "scheduledByUserId" im Request-Body für SCHEDULED.
   *
   * @param {number} id        ID des Geisternetzes
   * @param {string} newStatus Neuer Ziel-Status
   * @returns {Promise<GhostNet>}
   */
  async function sendStatusUpdate(id, newStatus) {
    /** @type {Record<string,string>} */
    const headers = { "Content-Type": "application/json" };

    const currentUser = getCurrentUser();

    const scheduledByUserId =
      newStatus === "SCHEDULED" && currentUser && typeof currentUser.id === "number"
        ? currentUser.id
        : null;

    const recoveredByUserId =
      newStatus === "RECOVERED" && currentUser && typeof currentUser.id === "number"
        ? currentUser.id
        : null;

    const cancelledByUserId =
      newStatus === "CANCELLED" && currentUser && typeof currentUser.id === "number"
        ? currentUser.id
        : null;

    const body = {
      status: newStatus,
      scheduledByUserId,
      recoveredByUserId,
      cancelledByUserId
    };

    const res = await fetch(`/api/ghostnets/${id}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text || "Status-Update fehlgeschlagen"}`);
    }

    return res.json();
  }

  /**
   * Initialisiert das Modal: Liste laden + UI zurücksetzen.
   */
  async function openModal() {
    clearError();
    selectedNet = null;
    hiddenId.value = "";
    statusSelect.value = "";
    submitBtn.disabled = true;
    selectedBox.textContent = "Noch kein Geisternetz ausgewählt.";

    try {
      nets = await fetchGhostNets();
      nets.sort((a, b) => Number(a.id) - Number(b.id));
      renderList(nets);
      modal.show();
    } catch (e) {
      console.error("[schedule-modal] Fehler beim Öffnen:", e);
      listEl.innerHTML = `<div class="text-danger small">
        Fehler beim Laden der Geisternetze.
      </div>`;
      modal.show();
    }
  }

  // Klick auf "Geisternetz bearbeiten" im User-Menü → Modal öffnen
  menuItem.addEventListener("click", (ev) => {
    ev.preventDefault();
    openModal();
  });

  // Submit-Handler für das Formular
  formEl.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    clearError();

    if (!formEl.checkValidity()) {
      ev.stopPropagation();
      formEl.classList.add("was-validated");
      return;
    }

    if (!selectedNet) {
      showError("Bitte zuerst ein Geisternetz auswählen.");
      return;
    }

    const newStatus = statusSelect.value;
    if (!newStatus) {
      showError("Bitte einen Zielstatus auswählen.");
      return;
    }

    submitBtn.disabled = true;

    try {
      const updated = await sendStatusUpdate(selectedNet.id, newStatus);

      // lokale Daten updaten
      const idx = nets.findIndex(n => Number(n.id) === Number(updated.id));
      if (idx >= 0) {
        nets[idx] = updated;
      }
      selectedNet = updated;
      renderList(nets);
      selectNet(updated.id);

      // Prototyp: komplette Seite neu laden, damit Sidebar/Map updaten
      modal.hide();
      window.location.reload();
    } catch (e) {
      console.error("[schedule-modal] Status-Update fehlgeschlagen:", e);
      showError(e.message || "Status-Update fehlgeschlagen.");
      submitBtn.disabled = false;
    }
  });
});
