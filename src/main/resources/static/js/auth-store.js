/**
 * Globale Auth-Verwaltung als Singleton + Events.
 * - Speichert das eingeloggte User-Objekt (ohne sensible Daten).
 * - Persistenz: sessionStorage (über Tab-Reloads).
 * - Events: 'auth:login', 'auth:logout', 'auth:update'
 *
 * Erweiterung:
 * - Session läuft maximal 15 Minuten (TTL) und wird clientseitig geprüft.
 *
 * Sicherheits-Hinweis:
 * - Session/JWT idealerweise als HttpOnly-Cookie vom Backend setzen lassen.
 *   Im Frontend speichern wir NUR harmlose Profildaten (name, username, roles).
 */
(() => {
  class AuthStore extends EventTarget {
    /** @type {{id?:number, username?:string, displayName?:string, roles?:string[]} | null} */
    #user = null;

    /** @type {{loginAt:number, expiresAt:number} | null} */
    #meta = null;

    /** Storage-Key für Session-Daten */
    #KEY = "auth.user";

    /** Session TTL: 15 Minuten */
    static SESSION_TTL_MS = 15 * 60 * 1000;

    constructor() {
      super();
      // aus sessionStorage wiederherstellen
      this.#restoreFromSessionStorage();
      // beim Laden sofort Ablauf prüfen
      this.#ensureNotExpired();
    }

    /**
     * Liest Session aus sessionStorage.
     * Erwartet Format: { user: {...}, loginAt: number, expiresAt: number }
     *
     * @private
     */
    #restoreFromSessionStorage() {
      try {
        const raw = sessionStorage.getItem(this.#KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);

        // Backward compatibility: falls früher nur der User gespeichert wurde
        if (parsed && !parsed.user && (parsed.username || parsed.id || parsed.roles)) {
          this.#user = parsed;
          const now = Date.now();
          this.#meta = { loginAt: now, expiresAt: now + AuthStore.SESSION_TTL_MS };
          this.#persist(); // migrieren auf neues Format
          return;
        }

        // neues Format
        if (parsed?.user && typeof parsed?.expiresAt === "number") {
          this.#user = parsed.user ?? null;
          this.#meta = {
            loginAt: Number(parsed.loginAt ?? Date.now()),
            expiresAt: Number(parsed.expiresAt),
          };
        }
      } catch {
        // wenn kaputt: reset
        this.#user = null;
        this.#meta = null;
        sessionStorage.removeItem(this.#KEY);
      }
    }

    /**
     * Persistiert aktuellen State in sessionStorage.
     *
     * @private
     */
    #persist() {
      if (!this.#user) return;

      const now = Date.now();
      const meta = this.#meta ?? { loginAt: now, expiresAt: now + AuthStore.SESSION_TTL_MS };

      const payload = {
        user: this.#user,
        loginAt: meta.loginAt,
        expiresAt: meta.expiresAt,
      };

      sessionStorage.setItem(this.#KEY, JSON.stringify(payload));
    }

    /**
     * Prüft, ob die Session abgelaufen ist und loggt ggf. aus.
     *
     * @private
     * @returns {boolean} true, wenn Session noch gültig ist
     */
    #ensureNotExpired() {
      if (!this.#user || !this.#meta?.expiresAt) return false;

      if (Date.now() > this.#meta.expiresAt) {
        this.logout();
        return false;
      }

      return true;
    }

    /**
     * Liefert aktuelles Userobjekt oder null (inkl. Ablaufprüfung).
     *
     * @returns {{id?:number, username?:string, displayName?:string, roles?:string[]} | null}
     */
    getUser() {
      if (!this.#ensureNotExpired()) return null;
      return this.#user;
    }

    /**
     * true, wenn ein User gesetzt und nicht abgelaufen ist.
     *
     * @returns {boolean}
     */
    isAuthenticated() {
      return !!this.getUser();
    }

    /**
     * Setzt/aktualisiert den User und feuert 'auth:login' bzw. 'auth:update'.
     * Legt dabei eine neue 15-Minuten-Session an.
     *
     * @param {{id?:number, username?:string, displayName?:string, roles?:string[]}} user
     */
    setUser(user) {
      const hadUser = !!this.#user;

      if (!user) {
        this.logout(); // falls null übergeben, wie logout behandeln
        return;
      }

      const now = Date.now();
      this.#user = user;
      this.#meta = { loginAt: now, expiresAt: now + AuthStore.SESSION_TTL_MS };

      this.#persist();

      this.dispatchEvent(
        new CustomEvent(hadUser ? "auth:update" : "auth:login", { detail: this.#user })
      );
    }

    /**
     * Optional: Verlängert die Session ab "jetzt" um weitere 15 Minuten.
     * (Sliding Session – nur nutzen, wenn du das wirklich willst.)
     */
    refreshSession() {
      if (!this.#user) return;
      const now = Date.now();
      this.#meta = { loginAt: this.#meta?.loginAt ?? now, expiresAt: now + AuthStore.SESSION_TTL_MS };
      this.#persist();
      this.dispatchEvent(new CustomEvent("auth:update", { detail: this.#user }));
    }

    /**
     * Optional: Polling-Checker, der bei Ablauf automatisch logout triggert,
     * auch wenn gerade kein getUser() aufgerufen wird.
     *
     * @param {number} intervalMs - Prüfintervall (Default: 30s)
     */
    startExpiryWatcher(intervalMs = 30_000) {
      // keine doppelte Intervalle starten
      if (this._expiryInterval) return;

      this._expiryInterval = window.setInterval(() => {
        this.#ensureNotExpired();
      }, intervalMs);
    }

    /**
     * Stoppt den Expiry-Watcher.
     */
    stopExpiryWatcher() {
      if (!this._expiryInterval) return;
      clearInterval(this._expiryInterval);
      this._expiryInterval = null;
    }

    /** Löscht User & feuert 'auth:logout'. */
    logout() {
      this.#user = null;
      this.#meta = null;
      sessionStorage.removeItem(this.#KEY);
      this.dispatchEvent(new CustomEvent("auth:logout"));
    }
  }

  // global verfügbar machen
  window.Auth = new AuthStore();
})();
