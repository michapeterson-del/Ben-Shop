// ---------------------------------------------------------------------------
// Schlanker Client für die Shopify Storefront API (GraphQL).
// Kein Build-Schritt, kein eigener Server nötig — läuft direkt im Browser.
// Produkte, Warenkorb (Cart) und Checkout laufen komplett über Shopify;
// dieser Client fragt nur Daten ab und leitet Cart-Mutationen weiter.
// ---------------------------------------------------------------------------
(function () {
  const config = window.SHOP_CONFIG || {};
  const CART_ID_KEY = "shop_cart_id";

  function isConfigured() {
    return Boolean(
      config.domain &&
        !config.domain.includes("DEIN-SHOP") &&
        config.storefrontAccessToken &&
        !config.storefrontAccessToken.includes("DEIN-STOREFRONT")
    );
  }

  async function storefrontFetch(query, variables) {
    if (!isConfigured()) {
      throw new Error("SHOP_NOT_CONFIGURED");
    }
    const url = `https://${config.domain}/api/${config.apiVersion}/graphql.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": config.storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      throw new Error(`Shopify-Anfrage fehlgeschlagen (${res.status})`);
    }
    const json = await res.json();
    if (json.errors && json.errors.length) {
      throw new Error(json.errors.map((e) => e.message).join(", "));
    }
    return json.data;
  }

  const MONEY_FIELDS = `amount currencyCode`;

  const PRODUCT_CARD_FIELDS = `
    id
    handle
    title
    tags
    availableForSale
    featuredImage { url altText width height }
    priceRange { minVariantPrice { ${MONEY_FIELDS} } }
    variants(first: 25) { edges { node { id availableForSale } } }
  `;

  async function getProductsByCollection(handle, first) {
    const data = await storefrontFetch(
      `query CollectionProducts($handle: String!, $first: Int!) {
        collection(handle: $handle) {
          title
          products(first: $first) {
            edges { node { ${PRODUCT_CARD_FIELDS} } }
          }
        }
      }`,
      { handle, first: first || 12 }
    );
    if (!data.collection) return { title: null, products: [] };
    return {
      title: data.collection.title,
      products: data.collection.products.edges.map((e) => e.node),
    };
  }

  async function getProductByHandle(handle) {
    const data = await storefrontFetch(
      `query ProductByHandle($handle: String!) {
        product(handle: $handle) {
          id
          handle
          title
          descriptionHtml
          tags
          images(first: 12) { edges { node { url altText width height } } }
          options { name values }
          priceRange { minVariantPrice { ${MONEY_FIELDS} } }
          variants(first: 100) {
            edges {
              node {
                id
                title
                availableForSale
                selectedOptions { name value }
                image { url altText }
                price { ${MONEY_FIELDS} }
              }
            }
          }
        }
      }`,
      { handle }
    );
    return data.product || null;
  }

  const CART_FIELDS = `
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { ${MONEY_FIELDS} }
      totalAmount { ${MONEY_FIELDS} }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              image { url altText }
              price { ${MONEY_FIELDS} }
              product { title handle }
            }
          }
        }
      }
    }
  `;

  function getCartId() {
    try {
      return localStorage.getItem(CART_ID_KEY);
    } catch (e) {
      return null;
    }
  }

  function setCartId(id) {
    try {
      localStorage.setItem(CART_ID_KEY, id);
    } catch (e) {
      /* ignore (private mode etc.) */
    }
  }

  function clearCartId() {
    try {
      localStorage.removeItem(CART_ID_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  async function createCart(lines) {
    const data = await storefrontFetch(
      `mutation CartCreate($lines: [CartLineInput!]) {
        cartCreate(input: { lines: $lines }) {
          cart { ${CART_FIELDS} }
          userErrors { field message }
        }
      }`,
      { lines: lines || [] }
    );
    const result = data.cartCreate;
    if (result.userErrors && result.userErrors.length) {
      throw new Error(result.userErrors.map((e) => e.message).join(", "));
    }
    setCartId(result.cart.id);
    return result.cart;
  }

  async function getCart(cartId) {
    const data = await storefrontFetch(
      `query CartQuery($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`,
      { id: cartId }
    );
    return data.cart || null;
  }

  async function addLine(variantId, quantity) {
    const cartId = getCartId();
    const lines = [{ merchandiseId: variantId, quantity: quantity || 1 }];

    if (!cartId) {
      return createCart(lines);
    }

    const data = await storefrontFetch(
      `mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { ${CART_FIELDS} }
          userErrors { field message }
        }
      }`,
      { cartId, lines }
    );
    const result = data.cartLinesAdd;
    if (result.userErrors && result.userErrors.length) {
      throw new Error(result.userErrors.map((e) => e.message).join(", "));
    }
    if (!result.cart) {
      // Cart existierte nicht mehr (z.B. abgelaufen) -> neu anlegen.
      clearCartId();
      return createCart(lines);
    }
    return result.cart;
  }

  async function updateLine(lineId, quantity) {
    const cartId = getCartId();
    if (!cartId) throw new Error("Kein aktiver Warenkorb");
    const data = await storefrontFetch(
      `mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart { ${CART_FIELDS} }
          userErrors { field message }
        }
      }`,
      { cartId, lines: [{ id: lineId, quantity }] }
    );
    const result = data.cartLinesUpdate;
    if (result.userErrors && result.userErrors.length) {
      throw new Error(result.userErrors.map((e) => e.message).join(", "));
    }
    return result.cart;
  }

  async function removeLine(lineId) {
    const cartId = getCartId();
    if (!cartId) throw new Error("Kein aktiver Warenkorb");
    const data = await storefrontFetch(
      `mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ${CART_FIELDS} }
          userErrors { field message }
        }
      }`,
      { cartId, lineIds: [lineId] }
    );
    const result = data.cartLinesRemove;
    if (result.userErrors && result.userErrors.length) {
      throw new Error(result.userErrors.map((e) => e.message).join(", "));
    }
    return result.cart;
  }

  async function getExistingCart() {
    const cartId = getCartId();
    if (!cartId) return null;
    try {
      const cart = await getCart(cartId);
      if (!cart) clearCartId();
      return cart;
    } catch (e) {
      clearCartId();
      return null;
    }
  }

  window.ShopifyClient = {
    isConfigured,
    getProductsByCollection,
    getProductByHandle,
    getExistingCart,
    addLine,
    updateLine,
    removeLine,
  };
})();
