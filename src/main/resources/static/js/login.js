/**
 * login.js – nur Icon/Border färben, Inputs bleiben unverändert.
 * Robust gegen fehlende Elemente und störende Extensions.
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = /** @type {HTMLFormElement|null} */ (document.getElementById("login-form"));
  if (!form) return;

  // Falls Inputs schon grün sind (von vorherigen Tests): zurücksetzen
  const u = /** @type {HTMLInputElement|null} */ (document.getElementById("login-username"));
  const p = /** @type {HTMLInputElement|null} */ (document.getElementById("login-password"));
  [u, p].forEach(el => {
    if (el instanceof Element) {
      el.classList.remove("is-valid", "is-invalid", "border-custom-green", "border-custom-red", "text-custom-green", "text-custom-red");
      el.removeAttribute("aria-invalid");
    }
  });

  // Submit-Handler (Capture + stopImmediatePropagation gegen Extensions)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if ("stopImmediatePropagation" in e) e.stopImmediatePropagation();

    const username = (u?.value ?? "").trim();
    const password = p?.value ?? "";

    if (!username || !password) {
      setIconState(false);
      return;
    }

    try {
      const res = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const isJson = (res.headers.get("content-type") || "").includes("application/json");
      const data = isJson ? await res.json() : {};
      const ok = res.ok && !!data?.success;

      setIconState(ok);

      if (ok) {
        // mini Delay für visuelles Feedback, dann Modal schließen
        setTimeout(() => {
          closeModal("loginModal");
          form.reset();
        }, 60);

        const profile = {
                username: data.username,
                displayName: data.displayName ?? data.username,
                role: data.role,
                id: data.userId,
                email: data.email,
                phoneNumber: data.phoneNumber,
                createdAt: data.createdAt
        };
        window.Auth.setUser(profile);     // <— global verfügbar
        setTimeout(() => { closeModal("loginModal"); form.reset(); }, 60);
      }
    } catch (err) {
      console.error("[login.js] Login-Fehler:", err);
      setIconState(false);
    }
  }, true);
});

/**
 * Färbt nur #login-logo (Textfarbe) und #login-border (Rahmen).
 * Null-sicher: fehlende Elemente werden übersprungen.
 * @param {boolean} ok
 */
function setIconState(ok) {
  const logo = document.getElementById("login-logo");
  const border = document.getElementById("login-border");
  const elems = [logo, border].filter((el) => el instanceof Element);

  for (const el of elems) {
    el.classList.remove("border-custom-green","text-custom-green","border-custom-red","text-custom-red");
    if (ok) {
      el.classList.add("border-custom-green","text-custom-green");
      el.setAttribute("aria-invalid", "false");
    } else {
      el.classList.add("border-custom-red","text-custom-red");
      el.setAttribute("aria-invalid", "true");
    }
  }
}

/**
 * Schließt ein Bootstrap-Modal robust (mit Fallback).
 * @param {string} modalId
 */
function closeModal(modalId) {
  const modalEl = document.getElementById(modalId);
  if (!modalEl) return;
  try {
    if (window.bootstrap?.Modal) {
      window.bootstrap.Modal.getOrCreateInstance(modalEl).hide();
      return;
    }
  } catch {}
  modalEl.querySelector(".btn-close")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  modalEl.classList.remove("show");
  modalEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  document.querySelectorAll(".modal-backdrop").forEach(n => n.remove());
}
