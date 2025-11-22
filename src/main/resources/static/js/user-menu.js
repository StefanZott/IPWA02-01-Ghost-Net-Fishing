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
 * @returns {{username?:string, displayName?:string, role?:string, id?:number}|null}
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

  // Helper zum Setzen von Textinhalten
  /**
   * Setzt den Text eines Elements, falls vorhanden.
   * @param {string} id
   * @param {string} value
   */
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "-";
  }

  const username = user.username ?? "-";
  const displayName = user.displayName || username || "-";
  const role = user.role ?? "-";
  const id = (user.id !== undefined && user.id !== null) ? String(user.id) : "-";

  setText("p-username", username);
  setText("p-displayName", displayName);
  setText("p-role", role);
  setText("p-id", id);

  // Modal anzeigen
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
