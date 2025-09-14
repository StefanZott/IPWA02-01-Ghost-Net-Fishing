<script>
document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("register-form");

  registerForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Verhindert Standard-Form-Submit

    // Werte auslesen
    const username = document.getElementById("register-username").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    const confirm = document.getElementById("register-confirm").value;

    // Einfacher Check
    if (password !== confirm) {
      alert("Passwörter stimmen nicht überein!");
      return;
    }

    // Objekt für Backend / Debug
    const payload = {
      username,
      email,
      password
    };

    console.log("Registrierungsdaten:", payload);

    // Beispiel: An dein Spring Boot Backend senden
    fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error("Fehler beim Registrieren: " + res.status);
      return res.json();
    })
    .then(data => {
      console.log("Antwort vom Server:", data);
      alert("Registrierung erfolgreich!");
      // Optional: Modal schließen
      const modal = bootstrap.Modal.getInstance(document.getElementById("registerModal"));
      modal.hide();
    })
    .catch(err => {
      console.error(err);
      alert("Registrierung fehlgeschlagen.");
    });
  });
});
</script>
