// ---------------------------------------------------------------------------
// Formular für individuelle Druck-Wünsche.
//
// Diese Seite ist eine statische Website ohne eigenen Server, daher braucht
// das Formular einen externen Endpunkt, der die Mail samt Bild-Anhang
// weiterleitet. Empfehlung: https://formspree.io (kostenloses Kontingent).
//
// Einrichtung:
// 1. Bei Formspree einen kostenlosen Account + "Form" anlegen.
// 2. Die dort angezeigte Endpoint-URL unten bei FORM_ENDPOINT eintragen
//    (Format: https://formspree.io/f/xxxxxxx).
// 3. Fertig — Formspree leitet jede Anfrage inkl. hochgeladenem Bild als
//    E-Mail weiter.
//
// Ohne eingetragene FORM_ENDPOINT zeigt das Formular eine Hinweismeldung
// statt eines stillen Fehlschlags.
// ---------------------------------------------------------------------------
const FORM_ENDPOINT = ""; // z.B. "https://formspree.io/f/xxxxxxx"

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("request-form");
  const status = document.getElementById("form-status");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!FORM_ENDPOINT) {
      setStatus(
        "Das Anfrageformular ist noch nicht eingerichtet. Siehe js/request-form.js für die Einrichtung.",
        "error"
      );
      return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    setStatus("Wird gesendet ...", "");

    try {
      const formData = new FormData(form);
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        form.reset();
        setStatus("Danke! Deine Anfrage ist angekommen — du bekommst bald Antwort per Mail.", "success");
      } else {
        setStatus("Senden hat nicht geklappt. Bitte versuch es nochmal oder schreib direkt eine Mail.", "error");
      }
    } catch (err) {
      setStatus("Senden hat nicht geklappt. Bitte versuch es nochmal oder schreib direkt eine Mail.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });

  function setStatus(message, kind) {
    status.textContent = message;
    status.className = "form-status" + (kind ? " " + kind : "");
  }
});
