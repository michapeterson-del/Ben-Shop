// ---------------------------------------------------------------------------
// Rendert die Trend-Kategorie-Kacheln und den Produktkatalog auf der
// Startseite. Produkte kommen live aus Shopify (Storefront API) —
// hier wird nichts erfunden oder zwischengespeichert.
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

  function productCard(product) {
    const img = product.featuredImage
      ? `<img src="${product.featuredImage.url}" alt="${escapeHtml(product.featuredImage.altText || product.title)}" loading="lazy">`
      : `<div class="product-thumb-fallback">🧊</div>`;
    const price = fmtMoney(
      product.priceRange.minVariantPrice.amount,
      product.priceRange.minVariantPrice.currencyCode
    );
    const availableVariant = product.variants.edges.map((e) => e.node).find((v) => v.availableForSale);
    const soldOut = !product.availableForSale || !availableVariant;

    return `
      <article class="product-card">
        <a class="product-card-media" href="product.html?handle=${encodeURIComponent(product.handle)}">
          ${img}
          ${soldOut ? '<span class="badge badge-soldout">Ausverkauft</span>' : ""}
        </a>
        <div class="product-card-body">
          <a class="product-card-title" href="product.html?handle=${encodeURIComponent(product.handle)}">${escapeHtml(product.title)}</a>
          <p class="product-card-price">${price}</p>
        </div>
        <button
          type="button"
          class="btn btn-primary btn-sm product-card-add"
          data-variant-id="${availableVariant ? availableVariant.id : ""}"
          ${soldOut ? "disabled" : ""}
        >
          ${soldOut ? "Ausverkauft" : "In den Warenkorb"}
        </button>
      </article>
    `;
  }

  function skeletonGrid(count) {
    return Array.from({ length: count || 6 })
      .map(() => `<div class="product-card product-card-skeleton"></div>`)
      .join("");
  }

  function notConnectedNotice() {
    return `
      <div class="shop-placeholder">
        <p><strong>Shop noch nicht verbunden.</strong></p>
        <p>Trage Domain &amp; Storefront-Access-Token in <code>js/config.js</code> ein, dann erscheinen hier automatisch deine Shopify-Produkte.</p>
      </div>
    `;
  }

  function emptyNotice(handle) {
    return `
      <div class="shop-placeholder">
        <p>Noch keine Produkte in der Collection <code>${escapeHtml(handle)}</code>.</p>
        <p>Lege im Shopify-Adminbereich Produkte an und ordne sie dieser Collection zu.</p>
      </div>
    `;
  }

  function errorNotice() {
    return `
      <div class="shop-placeholder">
        <p>Produkte konnten nicht geladen werden. Bitte später erneut versuchen.</p>
      </div>
    `;
  }

  async function loadGrid(gridEl, handle) {
    if (!window.ShopifyClient.isConfigured()) {
      gridEl.innerHTML = notConnectedNotice();
      return;
    }
    gridEl.innerHTML = skeletonGrid(config.productsPerPage ? Math.min(6, config.productsPerPage) : 6);
    try {
      const { products } = await window.ShopifyClient.getProductsByCollection(
        handle,
        config.productsPerPage || 12
      );
      if (!products.length) {
        gridEl.innerHTML = emptyNotice(handle);
        return;
      }
      gridEl.innerHTML = products.map(productCard).join("");
    } catch (err) {
      console.error(err);
      gridEl.innerHTML = errorNotice();
    }
  }

  function renderCategoryTiles(container) {
    if (!container) return;
    container.innerHTML = (config.categories || [])
      .map(
        (cat) => `
        <button type="button" class="category-tile" data-category="${escapeHtml(cat.handle)}" style="--tint:${cat.tint || "#7c5cff"}">
          <span class="category-emoji">${cat.emoji || "✨"}</span>
          <span class="category-title">${escapeHtml(cat.title)}</span>
        </button>
      `
      )
      .join("");
  }

  function renderShopTabs(container) {
    if (!container) return;
    const tabs = [{ title: "Alle Trends", handle: config.trendCollectionHandle }].concat(
      config.categories || []
    );
    container.innerHTML = tabs
      .map(
        (tab, i) => `
        <button type="button" class="shop-tab ${i === 0 ? "is-active" : ""}" data-tab-handle="${escapeHtml(tab.handle)}">
          ${escapeHtml(tab.title)}
        </button>
      `
      )
      .join("");
  }

  function bindGridClicks(gridEl) {
    gridEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".product-card-add");
      if (!btn || btn.disabled) return;
      const variantId = btn.dataset.variantId;
      if (!variantId) return;
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = "Wird hinzugefügt …";
      window.Cart.addToCart(variantId, 1).finally(() => {
        btn.disabled = false;
        btn.textContent = original;
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const shopGrid = document.getElementById("shop-grid");
    const shopTabsEl = document.getElementById("shop-tabs");
    const categoryTilesEl = document.getElementById("category-tiles");

    if (!shopGrid) return; // Nicht auf der Startseite

    renderCategoryTiles(categoryTilesEl);
    renderShopTabs(shopTabsEl);
    bindGridClicks(shopGrid);

    loadGrid(shopGrid, config.trendCollectionHandle);

    if (shopTabsEl) {
      shopTabsEl.addEventListener("click", (e) => {
        const tab = e.target.closest(".shop-tab");
        if (!tab) return;
        shopTabsEl.querySelectorAll(".shop-tab").forEach((t) => t.classList.remove("is-active"));
        tab.classList.add("is-active");
        loadGrid(shopGrid, tab.dataset.tabHandle);
      });
    }

    if (categoryTilesEl) {
      categoryTilesEl.addEventListener("click", (e) => {
        const tile = e.target.closest(".category-tile");
        if (!tile) return;
        const handle = tile.dataset.category;
        if (shopTabsEl) {
          shopTabsEl.querySelectorAll(".shop-tab").forEach((t) => {
            t.classList.toggle("is-active", t.dataset.tabHandle === handle);
          });
        }
        loadGrid(shopGrid, handle);
        document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
      });
    }
  });
})();
