// ---------------------------------------------------------------------------
// Warenkorb-Drawer: zeigt den Shopify-Cart an und leitet "Zur Kasse" direkt
// zum gehosteten Shopify-Checkout weiter. Bezahlung findet ausschließlich
// bei Shopify statt, hier passiert nur die Anzeige.
// ---------------------------------------------------------------------------
(function () {
  function fmtMoney(amount, currencyCode) {
    const config = window.SHOP_CONFIG || {};
    try {
      return new Intl.NumberFormat(config.locale || "de-DE", {
        style: "currency",
        currency: currencyCode || config.currency || "EUR",
      }).format(Number(amount));
    } catch (e) {
      return `${amount} ${currencyCode || ""}`;
    }
  }

  const els = {};
  let currentCart = null;

  function cacheEls() {
    els.drawer = document.getElementById("cart-drawer");
    els.overlay = document.getElementById("cart-overlay");
    els.lines = document.getElementById("cart-lines");
    els.empty = document.getElementById("cart-empty");
    els.subtotal = document.getElementById("cart-subtotal");
    els.checkoutBtn = document.getElementById("cart-checkout-btn");
    els.toggleBtns = document.querySelectorAll("[data-cart-toggle]");
    els.closeBtn = document.getElementById("cart-close-btn");
    els.countBadges = document.querySelectorAll("[data-cart-count]");
  }

  function openDrawer() {
    if (!els.drawer) return;
    els.drawer.classList.add("is-open");
    els.overlay.classList.add("is-open");
    document.body.classList.add("cart-open");
  }

  function closeDrawer() {
    if (!els.drawer) return;
    els.drawer.classList.remove("is-open");
    els.overlay.classList.remove("is-open");
    document.body.classList.remove("cart-open");
  }

  function updateBadge(count) {
    els.countBadges.forEach((el) => {
      el.textContent = String(count || 0);
      el.classList.toggle("is-visible", Boolean(count));
    });
  }

  function lineTemplate(line) {
    const variant = line.merchandise;
    const img = variant.image
      ? `<img src="${variant.image.url}" alt="${escapeHtml(variant.image.altText || variant.product.title)}" loading="lazy">`
      : `<div class="cart-line-thumb-fallback">🧊</div>`;
    const variantTitle = variant.title && variant.title !== "Default Title" ? `<p class="cart-line-variant">${escapeHtml(variant.title)}</p>` : "";

    return `
      <li class="cart-line" data-line-id="${line.id}">
        <div class="cart-line-thumb">${img}</div>
        <div class="cart-line-body">
          <p class="cart-line-title">${escapeHtml(variant.product.title)}</p>
          ${variantTitle}
          <div class="cart-line-controls">
            <div class="qty-stepper" data-qty-stepper>
              <button type="button" class="qty-btn" data-qty-decrease aria-label="Menge verringern">−</button>
              <span class="qty-value">${line.quantity}</span>
              <button type="button" class="qty-btn" data-qty-increase aria-label="Menge erhöhen">+</button>
            </div>
            <button type="button" class="cart-line-remove" data-line-remove aria-label="Entfernen">Entfernen</button>
          </div>
        </div>
        <p class="cart-line-price">${fmtMoney(variant.price.amount, variant.price.currencyCode)}</p>
      </li>
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function render(cart) {
    currentCart = cart;
    const hasLines = cart && cart.lines.edges.length > 0;

    updateBadge(cart ? cart.totalQuantity : 0);

    if (!els.lines) return;

    if (!hasLines) {
      els.lines.innerHTML = "";
      els.empty.hidden = false;
      els.checkoutBtn.setAttribute("disabled", "disabled");
      els.subtotal.textContent = fmtMoney(0, (window.SHOP_CONFIG || {}).currency);
      return;
    }

    els.empty.hidden = true;
    els.checkoutBtn.removeAttribute("disabled");
    els.lines.innerHTML = cart.lines.edges.map((e) => lineTemplate(e.node)).join("");
    els.subtotal.textContent = fmtMoney(
      cart.cost.subtotalAmount.amount,
      cart.cost.subtotalAmount.currencyCode
    );
  }

  async function refreshFromExisting() {
    try {
      const cart = await window.ShopifyClient.getExistingCart();
      render(cart);
    } catch (e) {
      render(null);
    }
  }

  async function addToCart(variantId, quantity) {
    if (!window.ShopifyClient.isConfigured()) {
      notifyNotConfigured();
      return;
    }
    try {
      const cart = await window.ShopifyClient.addLine(variantId, quantity || 1);
      render(cart);
      openDrawer();
    } catch (err) {
      console.error(err);
      alert("Konnte nicht zum Warenkorb hinzugefügt werden. Bitte versuch es erneut.");
    }
  }

  function notifyNotConfigured() {
    alert(
      "Der Shop ist noch nicht mit Shopify verbunden. Trage Domain und Storefront-Access-Token in js/config.js ein."
    );
  }

  async function changeQuantity(lineId, delta) {
    if (!currentCart) return;
    const line = currentCart.lines.edges.find((e) => e.node.id === lineId);
    if (!line) return;
    const newQty = line.node.quantity + delta;
    try {
      if (newQty <= 0) {
        const cart = await window.ShopifyClient.removeLine(lineId);
        render(cart);
      } else {
        const cart = await window.ShopifyClient.updateLine(lineId, newQty);
        render(cart);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function removeLineItem(lineId) {
    try {
      const cart = await window.ShopifyClient.removeLine(lineId);
      render(cart);
    } catch (err) {
      console.error(err);
    }
  }

  function bindEvents() {
    els.toggleBtns.forEach((btn) => btn.addEventListener("click", openDrawer));
    if (els.closeBtn) els.closeBtn.addEventListener("click", closeDrawer);
    if (els.overlay) els.overlay.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });

    if (els.checkoutBtn) {
      els.checkoutBtn.addEventListener("click", () => {
        if (currentCart && currentCart.checkoutUrl) {
          window.location.href = currentCart.checkoutUrl;
        }
      });
    }

    if (els.lines) {
      els.lines.addEventListener("click", (e) => {
        const lineEl = e.target.closest(".cart-line");
        if (!lineEl) return;
        const lineId = lineEl.dataset.lineId;
        if (e.target.closest("[data-qty-increase]")) changeQuantity(lineId, 1);
        else if (e.target.closest("[data-qty-decrease]")) changeQuantity(lineId, -1);
        else if (e.target.closest("[data-line-remove]")) removeLineItem(lineId);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    cacheEls();
    bindEvents();
    refreshFromExisting();
  });

  window.Cart = { addToCart, openDrawer, closeDrawer };
})();
