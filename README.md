# Ben's 3D Prints

Moderner, responsiver Onlineshop für 3D-gedruckte Produkte. Produktkatalog,
Warenkorb und Checkout laufen vollständig über die **Shopify Storefront API** —
Produkte, Bestellungen und Zahlungen bleiben komplett in deinem
Shopify-Backend sichtbar und verwaltbar. Zusätzlich gibt es einen eigenen
Bereich für individuelle Druck-Anfragen (Custom Request), der bewusst
**keine** Shopify-Bestellung erzeugt, sondern nur eine Kontakt-Nachricht.

Kein Build-Schritt, kein eigener Server nötig — reines HTML/CSS/JS, das
direkt im Browser läuft.

## Lokal ansehen

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen. (Direktes Öffnen der `index.html` per
Doppelklick funktioniert grundsätzlich auch, ein lokaler Server vermeidet aber
Browser-Eigenheiten bei `fetch`.)

## 1. Shopify Storefront API verbinden

1. Shopify-Adminbereich → **Einstellungen → Apps und Vertriebskanäle →
   Apps entwickeln** → **App erstellen**.
2. Unter **Konfiguration** die **Storefront API** aktivieren und mindestens
   folgende Bereiche erlauben:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_write_checkouts` / Cart-Berechtigungen
     (in neueren Shopify-Versionen automatisch über die Cart-API abgedeckt)
3. App installieren → **Storefront-API-Zugriffstoken** kopieren.
4. In `js/config.js` eintragen:

   ```js
   window.SHOP_CONFIG = {
     domain: "dein-shop.myshopify.com",
     storefrontAccessToken: "shpat_xxx...",
     apiVersion: "2025-10",
     trendCollectionHandle: "trends",
     categories: [ /* siehe Abschnitt 2 */ ],
   };
   ```

5. Seite neu laden — Produkte, Warenkorb und Checkout laufen jetzt live über
   dein Shopify-Backend. Solange kein gültiger Token eingetragen ist, zeigt
   die Seite einen freundlichen Hinweis statt eines Fehlers.

Die Storefront API erlaubt Cross-Origin-Requests direkt aus dem Browser,
daher ist kein eigener Backend-Server nötig.

## 2. Produktkatalog & Trend-Kategorien einrichten

Die Startseite zeigt Kategorie-Kacheln und Shop-Reiter für aktuell angesagte
3D-Druck-Artikel. Jede Kategorie entspricht einer **Shopify-Collection**
(Produkte → Collections → Handle im SEO-Bereich setzen).

Empfohlene Ausgangs-Kategorien (bereits in `js/config.js` vorbereitet):

| Kategorie | Collection-Handle | Beispielprodukte |
|---|---|---|
| Fidget-Spielzeuge | `fidget-toys` | Fidget-Cube, Pop-It-Anhänger, Spinner |
| Gelenktiere | `articulated-animals` | Artikulierter Drache, Krake, Schlange |
| Flexi-Prints | `flexi-prints` | Flexi-Fisch, Flexi-Schlange |
| Deko-Objekte | `deko-objekte` | Geometrische Vasen, LED-Lampenschirme |
| Handy-Halter | `handy-halter` | Handyständer, Kopfhörer-Halter |

Zusätzlich eine Collection für die Startseiten-Übersicht anlegen (Handle
`trends`, z. B. eine automatische Collection mit allen aktiven Produkten) —
sie wird im Reiter "Alle Trends" gezeigt.

Kategorien lassen sich jederzeit in `js/config.js` unter `categories`
anpassen, ergänzen oder entfernen — die Startseite übernimmt das automatisch.

Jedes Produkt braucht wie gewohnt in Shopify: Titel, Beschreibung, Bilder,
Preis, Varianten (z. B. Farbe/Größe) und Lagerbestand. Genau diese Daten
zieht die Website live über die Storefront API.

## 3. Custom-Request-Formular einrichten

Das Formular unter "Individuelle Anfrage" (`#request`) sendet Name,
Kontakt (E-Mail und/oder Telefon), Freitext-Beschreibung (Farbe, Größe,
Material, Stückzahl) und ein optionales Referenzbild — **ohne** dabei eine
Shopify-Bestellung anzulegen. Da die Seite keinen eigenen Server hat, läuft
der Versand über einen externen Formular-Service.

1. Bei [Formspree](https://formspree.io) (oder z. B.
   [Web3Forms](https://web3forms.com)) ein kostenloses Formular anlegen.
2. Die angezeigte Endpoint-URL in `js/request-form.js` eintragen:

   ```js
   const FORM_ENDPOINT = "https://formspree.io/f/xxxxxxx";
   ```

3. Fertig. Name, Kontakt, Beschreibung und Bild kommen automatisch per Mail
   an. Bis der Endpoint eingetragen ist, zeigt das Formular einen Hinweis
   statt Nachrichten einfach zu verwerfen.

## Struktur

```
index.html               Startseite: Hero, Trend-Kategorien, Shop, Anfrage-Formular
product.html              Produktdetailseite (Galerie, Varianten, In den Warenkorb)
css/style.css             Design (modern, responsive, mobile-first)
js/config.js              Shopify-Zugangsdaten, Kategorien, Einstellungen
js/shopify-client.js       Storefront-API-Client (GraphQL: Produkte, Warenkorb)
js/cart.js                Warenkorb-Drawer (Anzeige, Mengenänderung, Checkout-Redirect)
js/products.js             Rendert Kategorie-Kacheln & Produktkatalog auf der Startseite
js/product-page.js         Logik für die Produktdetailseite (Varianten, Galerie)
js/request-form.js         Sendet das individuelle Anfrage-Formular (kein Shopify-Order)
js/main.js                 Mobile Navigation, Header-Verhalten
```

## Deployment

Da es sich um eine statische Website handelt, funktioniert jedes
Static-Hosting: GitHub Pages, Netlify, Vercel, Cloudflare Pages, o. ä.
Einfach den gesamten Ordner deployen — kein Build-Schritt nötig.

## Nächste Schritte

- Produkte, Bilder, Preise & Varianten in Shopify pflegen — sie erscheinen
  automatisch im Shop.
- Kontakt-E-Mail in `index.html` / `product.html` (Footer) anpassen.
- Formular-Endpoint für individuelle Anfragen eintragen (siehe Abschnitt 3).
- Eigenes Logo/Favicon ergänzen (aktuell ein generiertes "B"-Icon).
