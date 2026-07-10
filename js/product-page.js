// ---------------------------------------------------------------------------
// Produktdetailseite: lädt ein einzelnes Produkt per ?handle= aus Shopify,
// zeigt Bildergalerie, Variantenauswahl und Menge, "In den Warenkorb" legt
// direkt in den Shopify-Cart.
// ---------------------------------------------------------------------------
(function () {
  const config = window.SHOP_CONFIG || {};

  function fmtMoney(amount, currencyCode) {
    try {
      return new Intl.NumberFormat(config.locale || "de-DE", {
        style: "currency",
        currency: currencyCode || config.currency || "EUR",
      }).format(Number(amount));
    } catch (e) {
      return `${amount} ${currencyCode || ""}`;
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function getHandleFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("handle");
  }

  let state = {
    product: null,
    selectedOptions: {},
    quantity: 1,
  };

  function findMatchingVariant(product, selectedOptions) {
    return product.variants.edges
      .map((e) => e.node)
      .find((variant) =>
        variant.selectedOptions.every((opt) => selectedOptions[opt.name] === opt.value)
      );
  }

  function renderGallery(container, images, activeIndex) {
    if (!images.length) {
      container.innerHTML = `<div class="product-gallery-main product-thumb-fallback">🧊</div>`;
      return;
    }
    const main = images[activeIndex] || images[0];
    container.innerHTML = `
      <div class="product-gallery-main">
        <img src="${main.url}" alt="${escapeHtml(main.altText || "")}">
      </div>
      ${
        images.length > 1
          ? `<div class="product-gallery-thumbs">
              ${images
                .map(
                  (img, i) => `
                <button type="button" class="gallery-thumb-btn ${i === activeIndex ? "is-active" : ""}" data-image-index="${i}">
                  <img src="${img.url}" alt="${escapeHtml(img.altText || "")}">
                </button>
              `
                )
                .join("")}
            </div>`
          : ""
      }
    `;
  }

  function renderOptions(container, product, selectedOptions) {
    container.innerHTML = product.options
      .map(
        (option) => `
        <div class="option-group">
          <p class="option-label">${escapeHtml(option.name)}</p>
          <div class="option-values">
            ${option.values
              .map(
                (value) => `
              <button
                type="button"
                class="option-value ${selectedOptions[option.name] === value ? "is-selected" : ""}"
                data-option-name="${escapeHtml(option.name)}"
                data-option-value="${escapeHtml(value)}"
              >${escapeHtml(value)}</button>
            `
              )
              .join("")}
          </div>
        </div>
      `
      )
      .join("");
  }

  function updateAddToCartState(variant) {
    const btn = document.getElementById("product-add-btn");
    const priceEl = document.getElementById("product-price");
    if (!btn) return;

    if (!variant) {
      btn.disabled = true;
      btn.textContent = "Bitte Optionen wählen";
      return;
    }

    priceEl.textContent = fmtMoney(variant.price.amount, variant.price.currencyCode);

    if (!variant.availableForSale) {
      btn.disabled = true;
      btn.textContent = "Ausverkauft";
    } else {
      btn.disabled = false;
      btn.textContent = "In den Warenkorb";
    }
    btn.dataset.variantId = variant.id;
  }

  function renderRelated(container, products, currentHandle) {
    const filtered = products.filter((p) => p.handle !== currentHandle).slice(0, 4);
    if (!filtered.length) {
      container.hidden = true;
      return;
    }
    container.hidden = false;
    const grid = container.querySelector("[data-related-grid]");
    grid.innerHTML = filtered
      .map((product) => {
        const img = product.featuredImage
          ? `<img src="${product.featuredImage.url}" alt="${escapeHtml(product.featuredImage.altText || product.title)}" loading="lazy">`
          : `<div class="product-thumb-fallback">🧊</div>`;
        const price = fmtMoney(
          product.priceRange.minVariantPrice.amount,
          product.priceRange.minVariantPrice.currencyCode
        );
        return `
          <a class="product-card product-card-link" href="product.html?handle=${encodeURIComponent(product.handle)}">
            <div class="product-card-media">${img}</div>
            <div class="product-card-body">
              <p class="product-card-title">${escapeHtml(product.title)}</p>
              <p class="product-card-price">${price}</p>
            </div>
          </a>
        `;
      })
      .join("");
  }

  async function loadRelated(product) {
    if (!config.trendCollectionHandle) return;
    try {
      const { products } = await window.ShopifyClient.getProductsByCollection(
        config.trendCollectionHandle,
        8
      );
      renderRelated(document.getElementById("related-section"), products, product.handle);
    } catch (e) {
      /* still fine without related products */
    }
  }

  function bindGalleryClicks(container, images) {
    container.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-image-index]");
      if (!btn) return;
      renderGallery(container, images, Number(btn.dataset.imageIndex));
    });
  }

  function bindOptionClicks(container, product) {
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".option-value");
      if (!btn) return;
      state.selectedOptions[btn.dataset.optionName] = btn.dataset.optionValue;
      renderOptions(container, product, state.selectedOptions);
      const variant = findMatchingVariant(product, state.selectedOptions);
      updateAddToCartState(variant);
    });
  }

  function bindQuantity() {
    const qtyValue = document.getElementById("product-qty-value");
    document.getElementById("product-qty-decrease").addEventListener("click", () => {
      state.quantity = Math.max(1, state.quantity - 1);
      qtyValue.textContent = state.quantity;
    });
    document.getElementById("product-qty-increase").addEventListener("click", () => {
      state.quantity += 1;
      qtyValue.textContent = state.quantity;
    });
  }

  function bindAddToCart() {
    document.getElementById("product-add-btn").addEventListener("click", (e) => {
      const btn = e.currentTarget;
      const variantId = btn.dataset.variantId;
      if (!variantId) return;
      btn.disabled = true;
      window.Cart.addToCart(variantId, state.quantity).finally(() => {
        btn.disabled = false;
      });
    });
  }

  function showNotFound() {
    document.getElementById("product-page-content").innerHTML = `
      <div class="shop-placeholder">
        <p><strong>Produkt nicht gefunden.</strong></p>
        <p>Entweder existiert dieser Handle nicht in deinem Shop, oder die Storefront-API ist noch nicht verbunden (siehe <code>js/config.js</code>).</p>
        <a class="btn btn-ghost" href="index.html#shop">Zurück zum Shop</a>
      </div>
    `;
  }

  async function init() {
    const handle = getHandleFromUrl();
    const contentEl = document.getElementById("product-page-content");
    if (!handle || !window.ShopifyClient.isConfigured()) {
      showNotFound();
      return;
    }

    try {
      const product = await window.ShopifyClient.getProductByHandle(handle);
      if (!product) {
        showNotFound();
        return;
      }
      state.product = product;

      // Erste verfügbare Kombination vorauswählen.
      const firstVariant = product.variants.edges[0] && product.variants.edges[0].node;
      if (firstVariant) {
        firstVariant.selectedOptions.forEach((opt) => {
          state.selectedOptions[opt.name] = opt.value;
        });
      }

      document.title = `${product.title} — Ben's 3D Prints`;
      document.getElementById("product-title").textContent = product.title;
      document.getElementById("product-description").innerHTML = product.descriptionHtml || "";

      const images = product.images.edges.map((e) => e.node);
      const galleryEl = document.getElementById("product-gallery");
      renderGallery(galleryEl, images, 0);
      bindGalleryClicks(galleryEl, images);

      const optionsEl = document.getElementById("product-options");
      if (product.options.length && !(product.options.length === 1 && product.options[0].name === "Title")) {
        renderOptions(optionsEl, product, state.selectedOptions);
        bindOptionClicks(optionsEl, product);
      } else {
        optionsEl.hidden = true;
      }

      updateAddToCartState(firstVariant);
      bindQuantity();
      bindAddToCart();

      contentEl.hidden = false;
      loadRelated(product);
    } catch (err) {
      console.error(err);
      showNotFound();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("product-page-content")) {
      init();
    }
  });
})();
