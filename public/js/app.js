(function () {
  let categories = [];
  let products = [];
  let cart = [];
  let paymentMethods = [];
  let selectedPaymentMethodId = null;

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => el.querySelectorAll(sel);

  function updateHeader() {
    const user = api.getStoredUser();
    const authBtns = $('#auth-buttons');
    const userMenu = $('#user-menu');
    const userNameEl = $('#header-user-name');
    if (user) {
      if (authBtns) authBtns.style.display = 'none';
      if (userMenu) {
        userMenu.style.display = 'flex';
        if (userNameEl) userNameEl.textContent = user.full_name || user.email;
      }
    } else {
      if (authBtns) authBtns.style.display = 'flex';
      if (userMenu) userMenu.style.display = 'none';
    }
  }

  function showScreen(screenId) {
    const user = api.getStoredUser();
    if ((screenId === 'carrito' || screenId === 'pago') && !user) {
      screenId = 'auth';
    }
    $$('.screen').forEach((s) => s.classList.remove('active'));
    $$('.nav-link').forEach((n) => n.classList.remove('active'));
    const screen = $(`#screen-${screenId}`);
    const nav = $(`.nav-link[data-screen="${screenId}"]`);
    if (screen) screen.classList.add('active');
    if (nav) nav.classList.add('active');
    if (screenId === 'inicio') renderInicio();
    if (screenId === 'carrito') renderCarrito();
    if (screenId === 'pago') renderPago();
    if (screenId === 'auth') renderAuth();
  }

  function formatPrice(n) {
    return '$' + parseFloat(n).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }

  function productImage(url, name) {
    if (url) return `<img src="${url}" alt="${name}" class="product-image" />`;
    return `<div class="product-placeholder">📦</div>`;
  }

  async function loadCategories() {
    try {
      categories = await api.getCategories();
    } catch (e) {
      console.error(e);
      categories = [];
    }
  }

  async function loadProducts(featuredOnly, categoryId, search) {
    try {
      const params = {};
      if (featuredOnly) params.featured = '1';
      if (categoryId) params.category = categoryId;
      if (search && search.trim()) params.search = search.trim();
      products = await api.getProducts(params);
    } catch (e) {
      console.error(e);
      products = [];
    }
  }

  async function loadCart() {
    if (!api.getUserId()) {
      cart = [];
      updateCartBadge();
      return;
    }
    try {
      cart = await api.getCart();
      updateCartBadge();
    } catch (e) {
      console.error(e);
      cart = [];
      updateCartBadge();
    }
  }

  function updateCartBadge() {
    const total = cart.reduce((s, i) => s + i.quantity, 0);
    const badge = $('#cart-badge');
    if (badge) {
      badge.textContent = total;
      badge.style.display = total > 0 ? 'flex' : 'none';
    }
  }

  const toastIcons = { success: '✓', error: '✕', info: 'ℹ' };
  function showToast(message, type = 'info', duration = 4500) {
    const container = $('#toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${toastIcons[type]}</span>
      <span class="toast-text">${escapeHtml(message)}</span>
      <button type="button" class="toast-close" aria-label="Cerrar">×</button>`;
    container.appendChild(toast);
    const remove = () => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    };
    toast.querySelector('.toast-close').addEventListener('click', remove);
    setTimeout(remove, duration);
  }
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showConfirm(message, onConfirm) {
    const overlay = $('#confirm-modal');
    const msgEl = $('#confirm-title');
    const btnCancel = overlay?.querySelector('.modal-btn-cancel');
    const btnConfirm = overlay?.querySelector('.modal-btn-confirm');
    if (!overlay || !msgEl) return;
    msgEl.textContent = message;
    overlay.hidden = false;
    const close = () => { overlay.hidden = true; };
    const doConfirm = () => { close(); onConfirm(); };
    const cancelClick = () => close();
    btnCancel?.replaceWith(btnCancel.cloneNode(true));
    btnConfirm?.replaceWith(btnConfirm.cloneNode(true));
    overlay.querySelector('.modal-btn-cancel').onclick = cancelClick;
    overlay.querySelector('.modal-btn-confirm').onclick = doConfirm;
    overlay.onclick = (e) => { if (e.target === overlay) cancelClick(); };
  }

  function renderInicio() {
    const searchVal = ($('#search-products') && $('#search-products').value) || '';
    const catId = window._selectedCategoryId || null;

    (async () => {
      await loadCategories();
      const onlyFeatured = !catId && !searchVal;
      await loadProducts(onlyFeatured, catId || undefined, searchVal || undefined);

      const catGrid = $('#categories-grid');
      if (catGrid) {
        const icons = { Electrónica: '📱', Moda: '👕', Hogar: '🏠', Belleza: '💄' };
        catGrid.innerHTML = categories
          .map(
            (c) =>
              `<button type="button" class="category-card" data-category-id="${c.category_id}">
                <span class="cat-icon">${icons[c.name] || '📂'}</span>
                <span class="cat-name">${c.name}</span>
              </button>`
          )
          .join('');
        catGrid.addEventListener('click', (e) => {
          const btn = e.target.closest('.category-card');
          if (!btn) return;
          const id = btn.dataset.categoryId;
          window._selectedCategoryId = id === window._selectedCategoryId ? null : id;
          renderInicio();
        });
      }

      const sectionByCat = $('#section-by-category');
      const featuredEl = $('#featured-products');
      const byCatEl = $('#products-by-category');
      const titleEl = $('#category-section-title');

      if (catId) {
        if (sectionByCat) sectionByCat.style.display = 'block';
        if (titleEl) titleEl.textContent = categories.find((c) => c.category_id == catId)?.name || 'Productos';
        if (byCatEl) {
          byCatEl.innerHTML = products
            .map(
              (p) => `
            <article class="product-card" data-product-id="${p.product_id}">
              ${productImage(p.image_url, p.name)}
              <div class="product-info">
                <h3 class="product-name">${p.name}</h3>
                <p class="product-price">${formatPrice(p.offer_price ?? p.price)}</p>
                <button type="button" class="btn-add">Añadir al carrito</button>
              </div>
            </article>`
            )
            .join('');
        }
        if (featuredEl) featuredEl.innerHTML = '';
      } else {
        if (sectionByCat) sectionByCat.style.display = 'none';
        if (featuredEl) {
          const list = searchVal ? products : products.filter((p) => p.is_featured);
          featuredEl.innerHTML = list
            .map(
              (p) => `
            <article class="product-card" data-product-id="${p.product_id}">
              ${productImage(p.image_url, p.name)}
              <div class="product-info">
                <h3 class="product-name">${p.name}</h3>
                <p class="product-price">${formatPrice(p.offer_price ?? p.price)}</p>
                <button type="button" class="btn-add">Añadir al carrito</button>
              </div>
            </article>`
            )
            .join('');
        }
      }
    })();
  }

  function setupAddToCartDelegation() {
    document.getElementById('app').addEventListener('click', async (e) => {
      const addBtn = e.target.closest('.product-card .btn-add');
      if (!addBtn) return;
      const card = addBtn.closest('.product-card');
      const id = card && card.dataset.productId;
      if (!id) return;
      if (!api.getUserId()) {
        showToast('Inicia sesión para agregar productos al carrito.', 'info');
        showScreen('auth');
        return;
      }
      try {
        await api.addToCart(id, 1);
        await loadCart();
        showToast('Producto añadido al carrito', 'success');
      } catch (err) {
        showToast(err.message || 'Error al agregar', 'error');
      }
    });
  }

  async function renderCarrito() {
    await loadCart();
    const container = $('#cart-items');
    const totalEl = $('#cart-total-amount');
    if (!container) return;

    if (cart.length === 0) {
      container.innerHTML = '<p class="cart-empty">Tu carrito está vacío. Añade productos desde Inicio.</p>';
      if (totalEl) totalEl.textContent = '$0.00';
      return;
    }

    const total = cart.reduce((s, i) => s + i.quantity * parseFloat(i.unit_price), 0);
    if (totalEl) totalEl.textContent = formatPrice(total);

    container.innerHTML = cart
      .map(
        (i) => `
      <div class="cart-item" data-cart-item-id="${i.cart_item_id}">
        ${i.image_url ? `<img src="${i.image_url}" alt="" class="cart-item-image" />` : '<div class="cart-item-placeholder">📦</div>'}
        <div class="cart-item-details">
          <p class="cart-item-name">${i.name}</p>
          <p class="cart-item-price">${formatPrice(i.unit_price)}</p>
          <div class="cart-item-actions">
            <div class="quantity-control">
              <button type="button" class="qty-minus">−</button>
              <span class="qty-value">${i.quantity}</span>
              <button type="button" class="qty-plus">+</button>
            </div>
            <button type="button" class="btn-remove">Eliminar</button>
          </div>
        </div>
      </div>`
      )
      .join('');

    container.addEventListener('click', async (e) => {
      const item = e.target.closest('.cart-item');
      if (!item) return;
      const id = item.dataset.cartItemId;
      if (e.target.classList.contains('qty-minus')) {
        const span = item.querySelector('.qty-value');
        const q = Math.max(1, parseInt(span.textContent, 10) - 1);
        try {
          await api.updateCartItem(id, q);
          await loadCart();
          renderCarrito();
        } catch (err) {
          showToast(err.message || 'Error', 'error');
        }
      } else if (e.target.classList.contains('qty-plus')) {
        const span = item.querySelector('.qty-value');
        const q = parseInt(span.textContent, 10) + 1;
        try {
          await api.updateCartItem(id, q);
          await loadCart();
          renderCarrito();
        } catch (err) {
          showToast(err.message || 'Error', 'error');
        }
      } else if (e.target.classList.contains('btn-remove')) {
        showConfirm('¿Eliminar este producto del carrito?', async () => {
          try {
            await api.removeCartItem(id);
            await loadCart();
            renderCarrito();
            showToast('Producto eliminado del carrito', 'success');
          } catch (err) {
            showToast(err.message || 'Error', 'error');
          }
        });
      }
    });
  }

  async function renderPago() {
    await loadCart();
    await loadPaymentMethods();

    const summaryEl = $('#order-summary');
    const totalEl = $('#order-total-amount');
    const methodsEl = $('#payment-methods');

    const total = cart.reduce((s, i) => s + i.quantity * parseFloat(i.unit_price), 0);
    if (totalEl) totalEl.textContent = formatPrice(total);

    if (summaryEl) {
      summaryEl.innerHTML = cart
        .map(
          (i, idx) => `
        <div class="order-summary-item">
          <span>Producto ${idx + 1} (x${i.quantity})</span>
          <span>${formatPrice(i.quantity * parseFloat(i.unit_price))}</span>
        </div>`
        )
        .join('');
    }

    if (methodsEl) {
      selectedPaymentMethodId = paymentMethods[0]?.payment_method_id || null;
      const icons = { 'Tarjeta de Crédito': '💳', 'Tarjeta de Débito': '💳', 'PayPal': '🅿️', 'Google Pay': 'G', 'PSE': '🏦' };
      methodsEl.innerHTML = paymentMethods
        .map(
          (pm) => `
          <button type="button" class="payment-method ${selectedPaymentMethodId === pm.payment_method_id ? 'selected' : ''}" data-pm-id="${pm.payment_method_id}">
            <span class="pm-icon">${icons[pm.name] || '💳'}</span>
            <span class="pm-name">${pm.name}</span>
          </button>`
        )
        .join('');
      methodsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.payment-method');
        if (!btn) return;
        $$('.payment-method').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedPaymentMethodId = parseInt(btn.dataset.pmId, 10);
      });
    }

    const btnProceed = $('#btn-proceed-purchase');
    if (btnProceed) {
      btnProceed.onclick = async () => {
        if (cart.length === 0) {
          showToast('El carrito está vacío.', 'info');
          return;
        }
        try {
          const result = await api.createOrder(selectedPaymentMethodId, null);
          showToast('Pedido realizado. Número: ' + result.orderId, 'success', 6000);
          await loadCart();
          showScreen('inicio');
        } catch (err) {
          showToast(err.message || 'Error al procesar el pedido', 'error');
        }
      };
    }
  }

  function showAuthMessage(text, isError = true) {
    const el = $('#auth-message');
    if (!el) return;
    el.textContent = text;
    el.className = 'auth-message ' + (isError ? 'error' : 'success');
    el.style.display = 'block';
  }

  function renderAuth() {
    const formLogin = $('#form-login');
    const formRegister = $('#form-register');
    const msg = $('#auth-message');
    if (msg) msg.style.display = 'none';
    if (formLogin) {
      formLogin.style.display = 'block';
      formLogin.reset();
    }
    if (formRegister) formRegister.style.display = 'none';
    $$('.auth-tab').forEach((t) => t.classList.remove('active'));
    const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
    if (loginTab) loginTab.classList.add('active');
  }

  function init() {
    updateHeader();
    setupAddToCartDelegation();

    document.querySelectorAll('.nav-link').forEach((btn) => {
      btn.addEventListener('click', () => showScreen(btn.dataset.screen));
    });
    $('.logo')?.addEventListener('click', (e) => { e.preventDefault(); showScreen('inicio'); });

    $('#btn-show-login')?.addEventListener('click', () => showScreen('auth'));
    $('#btn-show-register')?.addEventListener('click', () => {
      showScreen('auth');
      $$('.auth-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === 'register'));
      const formLogin = $('#form-login');
      const formRegister = $('#form-register');
      if (formLogin) formLogin.style.display = 'none';
      if (formRegister) {
        formRegister.style.display = 'block';
        formRegister.reset();
      }
    });

    $('#btn-logout')?.addEventListener('click', () => {
      api.logout();
      cart = [];
      updateHeader();
      updateCartBadge();
      showScreen('inicio');
    });

    $$('.auth-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        $$('.auth-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tabName));
        const formLogin = $('#form-login');
        const formRegister = $('#form-register');
        if (tabName === 'login') {
          if (formLogin) formLogin.style.display = 'block';
          if (formRegister) formRegister.style.display = 'none';
        } else {
          if (formLogin) formLogin.style.display = 'none';
          if (formRegister) formRegister.style.display = 'block';
        }
        $('#auth-message').style.display = 'none';
      });
    });

    $('#form-login')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('#login-email')?.value?.trim();
      const password = $('#login-password')?.value;
      if (!email || !password) {
        showAuthMessage('Completa email y contraseña.');
        return;
      }
      try {
        const { user } = await api.login(email, password);
        api.setUser(user);
        updateHeader();
        await loadCart();
        showToast('¡Bienvenido de nuevo, ' + (user.full_name || user.email) + '!', 'success');
        showScreen('inicio');
      } catch (err) {
        showAuthMessage(err.message || 'Error al iniciar sesión');
      }
    });

    $('#form-register')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = $('#register-name')?.value?.trim();
      const email = $('#register-email')?.value?.trim();
      const password = $('#register-password')?.value;
      if (!fullName || !email || !password) {
        showAuthMessage('Completa todos los campos.');
        return;
      }
      if (password.length < 6) {
        showAuthMessage('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      try {
        const { user } = await api.register(email, password, fullName);
        api.setUser(user);
        updateHeader();
        await loadCart();
        showToast('¡Cuenta creada! Bienvenido, ' + (user.full_name || user.email) + '.', 'success');
        showScreen('inicio');
      } catch (err) {
        showAuthMessage(err.message || 'Error al registrarse');
      }
    });

    $('#btn-auth-back')?.addEventListener('click', () => showScreen('inicio'));

    $('#btn-back-store')?.addEventListener('click', () => showScreen('inicio'));
    $('#btn-continue-purchase')?.addEventListener('click', () => showScreen('pago'));

    const searchInput = $('#search-products');
    if (searchInput) {
      let timer;
      searchInput.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          window._selectedCategoryId = null;
          renderInicio();
        }, 400);
      });
    }

    showScreen('inicio');
    if (api.getUserId()) loadCart();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
