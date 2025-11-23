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
 * Liest den aktuellen Benutzer ausschließlich aus window.Auth.
 * @returns {{
 *   id?: number,
 *   username?: string,
 *   role?: string,
 *   email?: string,
 *   phoneNumber?: string | null,
 *   createdAt?: string
 * } | null}
 */
function getCurrentUser() {
  if (window.Auth?.getUser) {
    try {
      const u = window.Auth.getUser();
      if (u) return u;
    } catch (e) {
      console.warn("user-menu.js: Fehler beim Lesen von window.Auth.getUser():", e);
    }
  }
  return null;
}

/**
 * Aktualisiert den Benutzer lokal im Auth-Store.
 * KEIN eigener sessionStorage-Eintrag "user" mehr!
 *
 * @param {object} user - Benutzerobjekt (vom Backend)
 */
function persistUser(user) {
  if (window.Auth?.updateUser) {
    try { window.Auth.updateUser(user); } catch (e) {
      console.warn("user-menu.js: Fehler bei Auth.updateUser:", e);
    }
  } else if (window.Auth?.setUser) {
    try { window.Auth.setUser(user); } catch (e) {
      console.warn("user-menu.js: Fehler bei Auth.setUser:", e);
    }
  }
}

/**
 * Aktualisiert die E-Mail / Telefonnummer eines Users im Backend.
 *
 * @param {{id?:number, email?:string, phoneNumber?:string|null}} user
 * @returns {Promise<object|null>} aktualisierter User oder null bei Fehler
 */
async function updateUserOnServer(user) {
  if (!user.id) {
    alert("Benutzer-ID fehlt. Profil kann nicht aktualisiert werden.");
    return null;
  }

  try {
    const res = await fetch(`/api/user/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email ?? null,
        phoneNumber: user.phoneNumber ?? null
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("updateUserOnServer: Fehlerantwort:", res.status, text);
      alert("Fehler beim Speichern der Profildaten im Backend.");
      return null;
    }

    return await res.json();
  } catch (e) {
    console.error("updateUserOnServer: Netzwerk-/Serverfehler:", e);
    alert("Verbindungsfehler beim Aktualisieren des Profils.");
    return null;
  }
}

/**
 * Setzt die farbige Darstellung der Rolle.
 * REPORTER            → blau
 * RECOVERER / SALVOR  → grün
 * andere              → grau
 *
 * @param {HTMLElement|null} el - DOM-Element für die Rollenanzeige
 * @param {string} role - Rollen-String (z. B. "REPORTER", "SALVOR")
 */
function applyRoleStyle(el, role) {
  if (!el) return;

  el.textContent = role || "-";

  el.classList.remove("badge", "text-bg-primary", "text-bg-success", "text-bg-secondary");
  el.classList.add("badge");

  const upper = String(role || "").toUpperCase();

  if (upper === "REPORTER") {
    el.classList.add("text-bg-primary");
  } else if (upper === "RECOVERER" || upper === "SALVOR") {
    el.classList.add("text-bg-success");
  } else {
    el.classList.add("text-bg-secondary");
  }
}

/**
 * Lädt die Geisternetze des aktuellen Users und zeigt sie im Profil-Modal an.
 *
 * @param {{id?:number}} user - aktueller User
 * @returns {Promise<void>}
 */
async function loadMyGhostNets(user) {
  const container = document.getElementById("p-my-nets");
  if (!container) return;

  container.innerHTML = `<span class="text-muted small">Lade Geisternetze …</span>`;

  try {
    const res = await fetch("/api/ghostnets");
    if (!res.ok) {
      container.innerHTML = `<span class="text-danger small">Fehler beim Laden der Geisternetze.</span>`;
      return;
    }

    const nets = await res.json();

    const myNets = nets.filter((net) => {
      if (net.reportedBy == null || user.id == null) return false;
      return Number(net.reportedBy) === Number(user.id);
    });

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

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "-";
  }

  const username = user.username ?? "-";
  const email    = user.email ?? "-";
  const role     = user.role ?? "-";
  const phone    = user.phoneNumber ?? "-";

  let createdAt = "-";
  if (user.createdAt) {
    try {
      createdAt = new Date(user.createdAt).toLocaleString("de-DE");
    } catch {
      createdAt = user.createdAt;
    }
  }

  setText("p-username", username);
  setText("p-email", email);
  setText("p-phoneNumber", phone);

  const roleEl = document.getElementById("p-role");
  applyRoleStyle(roleEl, role);

  setText("p-createdAt", createdAt);

  loadMyGhostNets(user).catch(() => {});
  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

/**
 * Handhabt den Klick auf einen Edit-Button im Profil-Modal.
 * Nur email und phoneNumber sind editierbar.
 *
 * @param {string|null} field - Feldname aus data-profile-edit
 */
async function handleProfileEdit(field) {
  if (!field) return;

  const user = getCurrentUser();
  if (!user) {
    alert("Kein Benutzer angemeldet.");
    return;
  }

  const EDITABLE = {
    email:       { label: "E-Mail",       type: "email" },
    phoneNumber: { label: "Telefonnummer", type: "tel" }
  };

  if (!Object.prototype.hasOwnProperty.call(EDITABLE, field)) {
    alert("Dieses Feld kann nicht bearbeitet werden.");
    return;
  }

  const cfg = EDITABLE[field];
  const currentValue = (user[field] ?? "") || "";

  const input = window.prompt(`Neuen ${cfg.label} eingeben:`, currentValue);
  if (input === null) {
    return;
  }

  const value = input.trim();

  if (cfg.type === "email") {
    if (value && !value.includes("@")) {
      alert("Bitte eine gültige E-Mail-Adresse eingeben.");
      return;
    }
  }

  if (cfg.type === "tel") {
    if (value && value.length < 3) {
      alert("Bitte eine gültige Telefonnummer eingeben.");
      return;
    }
  }

  if (value === currentValue.trim()) {
    return;
  }

  const updatedDraft = {
    ...user,
    [field]: value || null
  };

  // Backend-Update
  const updatedFromServer = await updateUserOnServer(updatedDraft);
  if (!updatedFromServer) {
    return;
  }

  // Nur Auth-Store aktualisieren, kein eigener sessionStorage-Eintrag
  persistUser(updatedFromServer);

  // UI neu befüllen
  openProfileModal();
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

  const getDropdown = () => bootstrap.Dropdown.getOrCreateInstance(toggleEl);

  function openLoginModal() {
    const modalEl = document.getElementById("loginModal");
    if (!modalEl) return;
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  function updateToggleState(isAuth) {
    toggleEl.setAttribute("title", isAuth ? "Profil / Logout" : "Login");
    if (!isAuth) {
      const logo = document.getElementById("login-logo");
      const border = document.getElementById("login-border");
      [logo, border].forEach(el => {
        el?.classList?.remove("border-custom-green","text-custom-green","border-custom-red","text-custom-red");
        el?.classList?.add("border-custom-red","text-custom-red");
      });
    }
  }

  toggleEl.addEventListener("click", (ev) => {
    ev.preventDefault();
    const isAuth = !!window.Auth?.isAuthenticated?.() && window.Auth.isAuthenticated();
    if (isAuth) {
      getDropdown().toggle();
    } else {
      openLoginModal();
    }
  });

  const profileItem = document.getElementById("menuProfile");
  const logoutItem  = document.getElementById("menuLogout");

  profileItem?.addEventListener("click", (e) => {
    e.preventDefault();
    getDropdown().hide();
    openProfileModal();
  });

  logoutItem?.addEventListener("click", async (e) => {
    e.preventDefault();
    getDropdown().hide();
    try {
      // optional: await fetch("/api/user/logout", { method: "POST" });
    } catch {}
    window.Auth?.logout?.();
  });

  window.Auth?.addEventListener?.("auth:login",  () => updateToggleState(true));
  window.Auth?.addEventListener?.("auth:update", () => updateToggleState(true));
  window.Auth?.addEventListener?.("auth:logout", () => updateToggleState(false));

  updateToggleState(window.Auth?.isAuthenticated?.() ? window.Auth.isAuthenticated() : false);

  const isAuth = window.Auth?.isAuthenticated?.() && window.Auth.isAuthenticated();
  const logo = document.getElementById("login-logo");
  const border = document.getElementById("login-border");

  if (!logo || !border) return;

  [logo, border].forEach(el => {
    el.classList.remove("border-custom-green","text-custom-green","border-custom-red","text-custom-red");
  });

  if (isAuth) {
    logo.classList.add("text-custom-green");
    border.classList.add("border-custom-green");
  } else {
    logo.classList.add("text-custom-red");
    border.classList.add("border-custom-red");
  }

  // Edit-Buttons (Stift-Icon) mit Logik verbinden
  document.querySelectorAll("[data-profile-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const field = btn.getAttribute("data-profile-edit");
      handleProfileEdit(field);
    });
  });
});
