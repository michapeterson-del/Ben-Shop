// ---------------------------------------------------------------------------
// Formular für individuelle Druck-Wünsche ("Custom Request").
//
// WICHTIG: Dieses Formular erzeugt bewusst KEINE Shopify-Bestellung —
// es verschickt nur eine Kontakt-Nachricht (inkl. optionalem Referenzbild)
// an einen Formular-Service. Bestellt & bezahlt wird erst danach, ganz
// normal über den Shop, sobald ein Angebot steht.
//
// Einrichtung:
// 1. Bei https://formspree.io (oder einem anderen Formular-Service wie
//    https://web3forms.com) ein kostenloses Formular anlegen.
// 2. Die angezeigte Endpoint-URL unten bei FORM_ENDPOINT eintragen
//    (Formspree-Format: https://formspree.io/f/xxxxxxx).
// 3. Fertig — jede Anfrage inkl. hochgeladenem Bild kommt per E-Mail an.
//
// Ohne eingetragene FORM_ENDPOINT zeigt das Formular eine Hinweismeldung
// statt eines stillen Fehlschlags.
// ---------------------------------------------------------------------------
const FORM_ENDPOINT = "https://formspree.io/f/xwvdgbqo";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("request-form");
  const status = document.getElementById("form-status");
  if (!form) return;

  const emailInput = document.getElementById("req-email");
  const phoneInput = document.getElementById("req-phone");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!emailInput.value.trim() && !phoneInput.value.trim()) {
      setStatus("Bitte gib mindestens eine Kontaktmöglichkeit an (E-Mail oder Telefon).", "error");
      (emailInput.value.trim() ? phoneInput : emailInput).focus();
      return;
    }

    if (!FORM_ENDPOINT) {
      setStatus(
        "Das Anfrageformular ist noch nicht eingerichtet. Siehe js/request-form.js für die Einrichtung.",
        "error"
      );
      return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    setStatus("Wird gesendet …", "");

    try {
      const formData = new FormData(form);
      formData.set("_subject", "Neue individuelle Druck-Anfrage — Ben's 3D Prints");
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        form.reset();
        setStatus("Danke! Deine Anfrage ist angekommen — du bekommst bald ein Angebot per Mail/Telefon.", "success");
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
