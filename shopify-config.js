// ---------------------------------------------------------------------------
// Shopify-Verbindung konfigurieren
//
// 1. Shopify-Adminbereich -> Einstellungen -> Apps und Vertriebskanäle
//    -> "Apps entwickeln" -> eigene App erstellen -> Storefront API aktivieren
//    -> Storefront-Access-Token kopieren.
// 2. Werte unten eintragen. Damit laufen Warenkorb, Bezahlung und alle
//    Bestellungen automatisch über das Shopify-Dashboard von Ben.
// ---------------------------------------------------------------------------
window.SHOPIFY_CONFIG = {
  domain: "DEIN-SHOP.myshopify.com",
  storefrontAccessToken: "DEIN-STOREFRONT-ACCESS-TOKEN",
  // Handle der Collection, die im Shop-Bereich gezeigt werden soll
  // (z.B. "frontpage" für die Standard-Collection, oder ein eigener Handle).
  collectionHandle: "frontpage",
};
