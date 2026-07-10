// ---------------------------------------------------------------------------
// Shopify-Verbindung konfigurieren (Storefront API)
//
// 1. Shopify-Adminbereich -> Einstellungen -> Apps und Vertriebskanäle
//    -> "Apps entwickeln" -> eigene App erstellen -> Storefront API-Bereiche
//    aktivieren (mind. unread_products, unread_product_listings,
//    unread_checkouts / cart-Berechtigungen) -> App installieren
//    -> Storefront-API-Zugriffstoken kopieren.
// 2. Werte unten eintragen. Produkte, Lagerbestand, Zahlungen und
//    Bestellungen laufen danach vollständig über dein Shopify-Backend —
//    diese Seite zeigt nur an, was dort im Shop steht, und leitet den
//    Checkout an Shopify weiter.
// 3. Für jede Kategorie unten eine Collection mit passendem Handle in
//    Shopify anlegen (Produkte -> Collections -> "Handle" im SEO-Bereich).
// ---------------------------------------------------------------------------
window.SHOP_CONFIG = {
  domain: "bens3dprints-2.myshopify.com",
  storefrontAccessToken: "755ab2f3676074701ea5261c56934082",
  apiVersion: "2026-07",

  // Collection, deren Produkte im "Alle Trends"-Reiter der Startseite
  // erscheinen (z. B. eine Collection mit allen aktiven Produkten).
  trendCollectionHandle: "trends",

  // Trend-Kategorien für die Kachel-Navigation + Shop-Filter-Reiter.
  // "handle" muss dem Handle der jeweiligen Shopify-Collection entsprechen.
  categories: [
    { title: "Fidget-Spielzeuge", handle: "fidget-toys", emoji: "🌀", tint: "#7c5cff" },
    { title: "Gelenktiere", handle: "articulated-animals", emoji: "🐉", tint: "#ff3d81" },
    { title: "Flexi-Prints", handle: "flexi-prints", emoji: "🦑", tint: "#06d6a0" },
    { title: "Deko-Objekte", handle: "deko-objekte", emoji: "💡", tint: "#ffb703" },
    { title: "Handy-Halter", handle: "handy-halter", emoji: "📱", tint: "#5ca8ff" },
  ],

  // Wie viele Produkte pro Kategorie/Reiter geladen werden.
  productsPerPage: 12,

  currency: "EUR",
  locale: "de-DE",
};
