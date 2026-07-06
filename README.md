# Ben's 3D Prints

Statische Website für einen 3D-Druck-Shop: Showcase gehypter Prints, ein Formular für
individuelle Wünsche (mit Bild-Upload) und ein eingebundener Shopify-Shop, über den
Zahlung und Bestellverwaltung komplett laufen.

## Lokal ansehen

Kein Build nötig — einfach `index.html` im Browser öffnen, oder einen kleinen
lokalen Server starten:

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen.

## Shopify-Shop einrichten

Der Shop-Bereich nutzt den offiziellen **Shopify Buy Button** (Storefront API).
Damit läuft der komplette Bezahlvorgang, Warenkorb und alle Bestellungen über
Shopify — die Website selbst braucht dafür keinen eigenen Server.

1. Im Shopify-Adminbereich: **Einstellungen → Apps und Vertriebskanäle → Apps entwickeln**
   → eine neue App erstellen → **Storefront API** aktivieren.
2. Den generierten **Storefront-Access-Token** kopieren.
3. In `js/shopify-config.js` eintragen:
   ```js
   window.SHOPIFY_CONFIG = {
     domain: "dein-shop.myshopify.com",
     storefrontAccessToken: "shpat_xxx...",
     collectionHandle: "frontpage", // oder eine eigene Collection
   };
   ```
4. Seite neu laden — die Produkte der Collection erscheinen im Shop-Bereich,
   inklusive "In den Warenkorb" und Checkout direkt bei Shopify.

Produkte, Preise, Lagerbestand, Zahlungsarten und Bestellungen werden wie gewohnt
im Shopify-Dashboard verwaltet — die Website zeigt nur an, was dort im Shop steht.

## Anfrage-Formular einrichten

Das Formular unter "Wunsch einreichen" braucht einen externen Endpunkt, weil die
Seite keinen eigenen Server hat. Empfohlen: [Formspree](https://formspree.io)
(kostenloses Kontingent reicht für den Start).

1. Bei Formspree ein kostenloses Formular anlegen.
2. Die angezeigte Endpoint-URL in `js/request-form.js` eintragen:
   ```js
   const FORM_ENDPOINT = "https://formspree.io/f/xxxxxxx";
   ```
3. Fertig. Name, E-Mail, Beschreibung und das hochgeladene Bild kommen dann
   automatisch per Mail an.

Bis der Endpoint eingetragen ist, zeigt das Formular einen Hinweis statt
Nachrichten einfach zu verwerfen.

## Struktur

```
index.html               Hauptseite
css/style.css             Styling
js/shopify-config.js      Shopify-Zugangsdaten (Domain + Token)
js/shopify-buy-button.js  Lädt & rendert den Shopify Buy Button
js/request-form.js        Sendet das Anfrage-Formular
```

## Nächste Schritte

- Platzhalter-Emojis in der Ideen-Galerie durch echte Produktfotos ersetzen.
- Kontakt-E-Mail in `index.html` (Footer) anpassen.
- Eigenes Logo/Favicon ergänzen.
