const API_BASE = '';

function getStoredUser() {
  try {
    const data = sessionStorage.getItem('d1shop_user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function getUserId() {
  const user = getStoredUser();
  return user ? user.user_id : null;
}

async function request(path, options = {}) {
  const url = `${API_BASE}/api${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

const api = {
  getStoredUser,
  getUserId,
  login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  register(email, password, fullName) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
  },
  logout() {
    sessionStorage.removeItem('d1shop_user');
  },
  setUser(user) {
    sessionStorage.setItem('d1shop_user', JSON.stringify(user));
  },
  getCategories: () => request('/categories'),
  getProducts(params = {}) {
    const q = new URLSearchParams(params).toString();
    return request('/products' + (q ? '?' + q : ''));
  },
  getProduct: (id) => request(`/products/${id}`),
  getCart() {
    const userId = getUserId();
    if (!userId) return Promise.reject(new Error('Debes iniciar sesión'));
    return request('/cart?userId=' + userId);
  },
  addToCart(productId, quantity = 1) {
    const userId = getUserId();
    if (!userId) return Promise.reject(new Error('Debes iniciar sesión para agregar al carrito'));
    return request('/cart', {
      method: 'POST',
      body: JSON.stringify({ userId, productId, quantity }),
    });
  },
  updateCartItem(cartItemId, quantity) {
    const userId = getUserId();
    if (!userId) return Promise.reject(new Error('Debes iniciar sesión'));
    return request(`/cart/${cartItemId}?userId=${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },
  removeCartItem(cartItemId) {
    const userId = getUserId();
    if (!userId) return Promise.reject(new Error('Debes iniciar sesión'));
    return request(`/cart/${cartItemId}?userId=${userId}`, { method: 'DELETE' });
  },
  getPaymentMethods: () => request('/payment-methods'),
  createOrder(paymentMethodId, addressId) {
    const userId = getUserId();
    if (!userId) return Promise.reject(new Error('Debes iniciar sesión para finalizar la compra'));
    return request('/orders', {
      method: 'POST',
      body: JSON.stringify({ userId, paymentMethodId, addressId }),
    });
  },
};
