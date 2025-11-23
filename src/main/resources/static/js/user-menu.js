/**
 * user-menu.js
 * Kontextsensitives Verhalten für das Navbar-Login-Icon:
 * - Nicht eingeloggt: Klick öffnet #loginModal.
 * - Eingeloggt: Klick öffnet Dropdown mit Profil/Logout.
 *
 * Abhängigkeiten:
 *  - Bootstrap (Dropdown + Modal)
 *  - window.Auth (auth-store.js)
 */

/**
 * Liest den aktuellen Benutzer aus window.Auth bzw. sessionStorage.
 * @returns {{username?:string, displayName?:string, role?:string, id?:number, email?:string, createdAt?:string}|null}
 */
function getCurrentUser() {
  // Bevorzugt: Auth-Store
  if (window.Auth?.getUser) {
    const u = window.Auth.getUser();
    if (u) return u;
  }

  // Fallback: sessionStorage-Objekt "user"
  try {
    const raw = sessionStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("user-menu.js: Konnte sessionStorage.user nicht lesen/parsen:", e);
    return null;
  }
}

/**
 * Setzt die farbige Darstellung der Rolle.
 * REPORTER  → blau
 * RECOVERER → grün
 * andere    → grau
 *
 * @param {HTMLElement|null} el - DOM-Element für die Rollenanzeige
 * @param {string} role - Rollen-String (z. B. "REPORTER")
 */
function applyRoleStyle(el, role) {
  if (!el) return;

  // Text setzen
  el.textContent = role || "-";

  // Alle Badge-/Farbklassen entfernen
  el.classList.remove("badge", "text-bg-primary", "text-bg-success", "text-bg-secondary");

  // Immer Badge als Basis
  el.classList.add("badge");

  const upper = String(role || "").toUpperCase();

  if (upper === "REPORTER") {
    el.classList.add("text-bg-primary");
  } else if (upper === "RECOVERER") {
    el.classList.add("text-bg-success");
  } else {
    el.classList.add("text-bg-secondary");
  }
}

/**
 * Lädt die Geisternetze des aktuellen Users und zeigt sie im Profil-Modal an.
 * Erwartet ein Container-Element mit id="p-my-nets" im DOM.
 *
 * @param {{id?:number, username?:string}} user - aktueller User
 * @returns {Promise<void>}
 */
async function loadMyGhostNets(user) {
  const container = document.getElementById("p-my-nets");
  if (!container) return; // Falls das UI-Element (noch) nicht existiert

  container.innerHTML = `<span class="text-muted small">Lade Geisternetze …</span>`;

  try {
    const res = await fetch("/api/ghostnets");
    if (!res.ok) {
      container.innerHTML = `<span class="text-danger small">Fehler beim Laden der Geisternetze.</span>`;
      return;
    }

    const nets = await res.json();

    // 🔎 Filterlogik an dein Backend anpassen:
    // hier mehrere Varianten, je nach DTO-Struktur.
    const myNets = nets.filter(net =>
      net.reporterId === user.id ||
      (net.reporter && net.reporter.id === user.id) ||
      net.reporterName === user.username
    );

    if (!myNets.length) {
      container.innerHTML = `<span class="text-muted small">Du hast bisher keine Geisternetze gemeldet.</span>`;
      return;
    }

    const list = document.createElement("ul");
    list.className = "list-group list-group-flush";

    myNets.forEach((net) => {
      const li = document.createElement("li");
      li.className = "list-group-item py-1 small";

      const id  = net.id ?? "?";
      const st  = net.status ?? "UNBEKANNT";
      const lat = (typeof net.latitude === "number")  ? net.latitude.toFixed(5)  : "-";
      const lng = (typeof net.longitude === "number") ? net.longitude.toFixed(5) : "-";

      li.innerHTML = `
        <div><strong>#${id}</strong> – Status: ${st}</div>
        <div class="text-muted">Koord.: ${lat}, ${lng}</div>
      `;

      list.appendChild(li);
    });

    container.innerHTML = "";
    container.appendChild(list);

  } catch (e) {
    console.error("user-menu.js: Fehler beim Laden der Geisternetze:", e);
    container.innerHTML = `<span class="text-danger small">Fehler beim Laden der Geisternetze.</span>`;
  }
}

/**
 * Öffnet das Profil-Modal und befüllt die Felder mit User-Daten.
 */
function openProfileModal() {
  const modalEl = document.getElementById("profileModal");
  if (!modalEl) {
    console.warn("user-menu.js: #profileModal nicht im DOM gefunden.");
    return;
  }

  const user = getCurrentUser();
  if (!user) {
    alert("Kein Benutzer angemeldet.");
    return;
  }

  /**
   * Setzt den Text eines Elements, falls vorhanden.
   * @param {string} id
   * @param {string} value
   */
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "-";
  }

  const username    = user.username ?? "-";
  const displayName = user.displayName || username || "-";
  const email       = user.email ?? "-";
  const role        = user.role ?? "-";

  // createdAt schön formatieren
  let createdAt = "-";
  if (user.createdAt) {
    try {
      createdAt = new Date(user.createdAt).toLocaleString("de-DE");
    } catch {
      createdAt = user.createdAt;
    }
  }

  setText("p-username", username);
  setText("p-displayName", displayName);
  setText("p-email", email);

  // Rolle farbig darstellen
  const roleEl = document.getElementById("p-role");
  applyRoleStyle(roleEl, role);

  setText("p-createdAt", createdAt);

  // Eigene Geisternetze laden (falls entsprechender Container existiert)
  loadMyGhostNets(user).catch(() => { /* Fehler werden in der Funktion geloggt */ });

  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}


/**
 * Initialisiert das User-Menü-Verhalten nach DOM-Aufbau.
 */
document.addEventListener("DOMContentLoaded", () => {
  const toggleEl = /** @type {HTMLElement|null} */ (document.getElementById("loginMenuToggle"));
  const dropdownEl = /** @type {HTMLElement|null} */ (
    document.querySelector("#userMenu .dropdown-menu")
  );

  if (!toggleEl || !dropdownEl) return;

  /** Bootstrap Dropdown-Instanz lazy erzeugen */
  const getDropdown = () => bootstrap.Dropdown.getOrCreateInstance(toggleEl);

  /**
   * Öffnet das Login-Modal robust.
   */
  function openLoginModal() {
    const modalEl = document.getElementById("loginModal");
    if (!modalEl) return;
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  /**
   * Aktualisiert die UI-Zustände (z. B. Tooltip/Title) bei Auth-Änderungen.
   * @param {boolean} isAuth
   */
  function updateToggleState(isAuth) {
    toggleEl.setAttribute("title", isAuth ? "Profil / Logout" : "Login");
    // Optional: Icon-Farbe neutralisieren bei Logout
    if (!isAuth) {
      const logo = document.getElementById("login-logo");
      const border = document.getElementById("login-border");
      [logo, border].forEach(el => {
        el?.classList?.remove("border-custom-green","text-custom-green","border-custom-red","text-custom-red");
        // Standard (rot) wie initial:
        el?.classList?.add("border-custom-red","text-custom-red");
      });
    }
  }

  // Primärer Klick-Handler auf das Icon
  toggleEl.addEventListener("click", (ev) => {
    ev.preventDefault();
    const isAuth = !!window.Auth?.isAuthenticated?.() && window.Auth.isAuthenticated();
    if (isAuth) {
      // Eingeloggt → Dropdown anzeigen/umschalten
      getDropdown().toggle();
    } else {
      // Nicht eingeloggt → Login-Modal öffnen
      openLoginModal();
    }
  });

  // Menü-Items
  const profileItem = document.getElementById("menuProfile");
  const logoutItem  = document.getElementById("menuLogout");

  /**
   * Profil anzeigen: Dropdown schließen und Profil-Modal öffnen.
   */
  profileItem?.addEventListener("click", (e) => {
    e.preventDefault();
    getDropdown().hide();
    openProfileModal();
  });

  /**
   * Logout: Auth-Store leeren + optional Backend informieren.
   */
  logoutItem?.addEventListener("click", async (e) => {
    e.preventDefault();
    getDropdown().hide();
    try {
      // Optional: Server-Logout (falls Endpoint vorhanden)
      // await fetch("/api/user/logout", { method: "POST" });
    } catch {}
    window.Auth?.logout?.();
  });

  /** Auf Auth-Events reagieren (Login/Update/Logout) */
  window.Auth?.addEventListener?.("auth:login",  () => updateToggleState(true));
  window.Auth?.addEventListener?.("auth:update", () => updateToggleState(true));
  window.Auth?.addEventListener?.("auth:logout", () => updateToggleState(false));

  // Initialzustand setzen
  updateToggleState(window.Auth?.isAuthenticated?.() ? window.Auth.isAuthenticated() : false);

  const isAuth = window.Auth?.isAuthenticated?.() && window.Auth.isAuthenticated();
  const logo = document.getElementById("login-logo");
  const border = document.getElementById("login-border");

  if (!logo || !border) return;

  // Vorherige Farbklassen entfernen
  [logo, border].forEach(el => {
    el.classList.remove("border-custom-green","text-custom-green","border-custom-red","text-custom-red");
  });

  if (isAuth) {
    // User ist eingeloggt → grün
    logo.classList.add("text-custom-green");
    border.classList.add("border-custom-green");
  } else {
    // Kein User → rot
    logo.classList.add("text-custom-red");
    border.classList.add("border-custom-red");
  }
});
