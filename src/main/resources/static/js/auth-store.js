/**
 * Globale Auth-Verwaltung als Singleton + Events.
 * - Speichert das eingeloggte User-Objekt (ohne sensible Daten).
 * - Persistenz: sessionStorage (über Tab-Reloads).
 * - Events: 'auth:login', 'auth:logout', 'auth:update'
 *
 * Sicherheits-Hinweis:
 * - Session/JWT idealerweise als HttpOnly-Cookie vom Backend setzen lassen.
 *   Im Frontend speichern wir NUR harmlose Profildaten (name, username, roles).
 */
(() => {
  class AuthStore extends EventTarget {
    /** @type {{id?:number, username?:string, displayName?:string, roles?:string[]} | null} */
    #user = null;
    #KEY = "auth.user";

    constructor() {
      super();
      // aus sessionStorage wiederherstellen
      try {
        const raw = sessionStorage.getItem(this.#KEY);
        if (raw) this.#user = JSON.parse(raw);
      } catch {}
    }

    /** Liefert aktuelles Userobjekt oder null. */
    getUser() { return this.#user; }

    /** true, wenn ein User gesetzt ist. */
    isAuthenticated() { return !!this.#user; }

    /**
     * Setzt/aktualisiert den User und feuert 'auth:login' bzw. 'auth:update'.
     * @param {{id?:number, username?:string, displayName?:string, roles?:string[]}} user
     */
    setUser(user) {
      const hadUser = !!this.#user;
      this.#user = user ?? null;
      if (this.#user) {
        sessionStorage.setItem(this.#KEY, JSON.stringify(this.#user));
        this.dispatchEvent(new CustomEvent(hadUser ? "auth:update" : "auth:login", { detail: this.#user }));
      } else {
        this.logout(); // falls null übergeben, wie logout behandeln
      }
    }

    /** Löscht User & feuert 'auth:logout'. */
    logout() {
      this.#user = null;
      sessionStorage.removeItem(this.#KEY);
      this.dispatchEvent(new CustomEvent("auth:logout"));
    }
  }

  // global verfügbar machen
  window.Auth = new AuthStore();
})();
