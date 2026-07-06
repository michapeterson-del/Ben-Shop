// ---------------------------------------------------------------------------
// Lädt Shopify Buy Button SDK und rendert die Produkte einer Collection.
// Zahlung, Warenkorb & Checkout laufen komplett gehostet über Shopify —
// hier passiert nur die Anzeige der Produkte.
// ---------------------------------------------------------------------------
(function () {
  const config = window.SHOPIFY_CONFIG || {};
  const container = document.getElementById("shopify-buy-button-container");

  const isConfigured =
    config.domain &&
    !config.domain.includes("DEIN-SHOP") &&
    config.storefrontAccessToken &&
    !config.storefrontAccessToken.includes("DEIN-STOREFRONT");

  if (!container || !isConfigured) {
    return; // Placeholder aus index.html bleibt sichtbar.
  }

  const script = document.createElement("script");
  script.src = "https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js";
  script.async = true;
  script.onload = initShopify;
  document.head.appendChild(script);

  function initShopify() {
    const client = ShopifyBuy.buildClient({
      domain: config.domain,
      storefrontAccessToken: config.storefrontAccessToken,
    });
    const ui = ShopifyBuy.UI.init(client);

    container.innerHTML = "";

    ui.createComponent("collection", {
      id: config.collectionHandle,
      node: container,
      moneyFormat: "%E2%82%AC%7B%7Bamount%7D%7D",
      options: {
        product: {
          styles: {
            product: {
              "@media (min-width: 150px)": {
                width: "calc(50% - 20px)",
                marginLeft: "20px",
                marginBottom: "50px",
              },
              "@media (min-width: 750px)": {
                width: "calc(33.33333% - 20px)",
              },
            },
          },
          buttonDestination: "checkout",
          contents: { options: false },
          text: { button: "In den Warenkorb" },
        },
        productSet: {
          styles: {
            products: {
              "@media (min-width: 150px)": { "margin-left": "-20px" },
            },
          },
        },
        cart: {
          text: { total: "Zwischensumme", button: "Zur Kasse" },
        },
        toggle: {},
      },
    });
  }
})();
