// Base de datos de productos estáticos
const PRODUCTS_DB = [
  { id: "1", name: "Croissant de Manteca", price: 1200, category: "Panadería", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500" },
  { id: "2", name: "Pan de Campo de Masa Madre", price: 2500, category: "Panes", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500" },
  { id: "3", name: "Facturas con Crema Pastelera", price: 1200, category: "Panadería", image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500" },
  { id: "4", name: "Torta Rogel de la Casa", price: 18000, category: "Repostería", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500" }
];

// Estado de la sesión actual en memoria
let cart = [];
let orders = JSON.parse(localStorage.getItem('bakery_orders')) || [];

// Al iniciar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  renderCart();
  renderClientOrders();
  renderMerchantOrders();

  // Escuchar cambios de LocalStorage en otras pestañas para emular tiempo real
  window.addEventListener('storage', (event) => {
    if (event.key === 'bakery_orders') {
      orders = JSON.parse(event.newValue) || [];
      renderClientOrders();
      renderMerchantOrders();
    }
  });
});

// Guardar órdenes en LocalStorage y notificar cambios
function saveOrdersToStorage() {
  localStorage.setItem('bakery_orders', JSON.stringify(orders));
  // Forzar actualización en la misma pestaña
  renderClientOrders();
  renderMerchantOrders();
}

// Cambiar de vista (Cliente <-> Comercio)
function switchView(view) {
  document.getElementById('view-client').style.display = view === 'client' ? 'block' : 'none';
  document.getElementById('view-merchant').style.display = view === 'merchant' ? 'block' : 'none';
  
  document.getElementById('btn-client').className = view === 'client' ? 'active' : '';
  document.getElementById('btn-merchant').className = view === 'merchant' ? 'active' : '';
}

// Renderizar el catálogo de productos
function renderProducts() {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';
  
  PRODUCTS_DB.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="category">${product.category}</p>
        <p class="price">$${product.price}</p>
        <button onclick="addToCart('${product.id}')">Agregar al carrito</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Agregar productos al carrito
function addToCart(id) {
  const product = PRODUCTS_DB.find(p => p.id === id);
  const existingItem = cart.find(item => item.id === id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  renderCart();
}

// Remover productos del carrito
function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  renderCart();
}

// Renderizar interfaz del carrito
function renderCart() {
  const list = document.getElementById('cart-list');
  const emptyMsg = document.getElementById('cart-empty-msg');
  const totalContainer = document.getElementById('cart-total-container');
  const checkoutForm = document.getElementById('checkout-form');
  const totalValue = document.getElementById('cart-total-value');

  list.innerHTML = '';

  if (cart.length === 0) {
    emptyMsg.style.display = 'block';
    totalContainer.style.display = 'none';
    checkoutForm.style.display = 'none';
    return;
  }

  emptyMsg.style.display = 'none';
  totalContainer.style.display = 'block';
  checkoutForm.style.display = 'flex';

  let total = 0;
  cart.forEach(item => {
    total += item.price * item.quantity;
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <span>${item.name} (x${item.quantity})</span>
      <span>$${item.price * item.quantity}</span>
      <button class="btn-remove" onclick="removeFromCart('${item.id}')">❌</button>
    `;
    list.appendChild(li);
  });

  totalValue.textContent = total;
}

// Procesar confirmación del pedido
function processCheckout() {
  const customerName = document.getElementById('customer-name').value.trim();
  const address = document.getElementById('customer-address').value.trim();

  if (!customerName || !address) {
    alert("Por favor, completa tu nombre y dirección.");
    return;
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const newOrder = {
    id: `PED-${Math.floor(1000 + Math.random() * 9000)}`,
    customer: customerName,
    address: address,
    items: [...cart],
    total: total,
    status: 'Pendiente', // Estados: Pendiente -> Preparando -> Enviado -> Entregado
    createdAt: new Date().toISOString()
  };

  orders.unshift(newOrder);
  saveOrdersToStorage();

  // Limpiar carrito
  cart = [];
  renderCart();
  alert(`¡Pedido ${newOrder.id} enviado al comercio! Puedes seguir su estado desde 'Mis Pedidos'.`);
}

// Renderizar el historial de pedidos en la vista del Cliente
function renderClientOrders() {
  const container = document.getElementById('client-orders-list');
  const currentCustomer = document.getElementById('customer-name').value.trim();
  
  // Filtramos pedidos correspondientes al usuario actual
  const clientOrders = orders.filter(o => o.customer === currentCustomer);

  if (clientOrders.length === 0) {
    container.innerHTML = '<p class="no-orders-msg">No has realizado pedidos aún.</p>';
    return;
  }

  container.innerHTML = '';
  clientOrders.forEach(order => {
    const card = document.createElement('div');
    card.className = 'status-card';
    card.innerHTML = `
      <div class="status-header">
        <strong>${order.id}</strong>
        <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
      </div>
      <p style="margin: 5px 0 0 0; font-size: 0.9rem;">Monto Total: $${order.total}</p>
    `;
    container.appendChild(card);
  });
}

// Renderizar pedidos en el Panel de Control (Comercio)
function renderMerchantOrders() {
  const grid = document.getElementById('merchant-orders-grid');
  
  if (orders.length === 0) {
    grid.innerHTML = '<p class="no-orders">Esperando nuevos pedidos en tiempo real...</p>';
    return;
  }

  grid.innerHTML = '';
  orders.forEach(order => {
    const card = document.createElement('div');
    card.className = `order-card status-${order.status.toLowerCase()}`;
    
    // Generar la lista de ítems comprados
    const itemsHTML = order.items.map(item => `
      <li>${item.name} - Cantidad: ${item.quantity} ($${item.price * item.quantity})</li>
    `).join('');

    // Definir la acción del botón de acuerdo al estado actual
    let actionButtonHTML = '';
    if (order.status === 'Pendiente') {
      actionButtonHTML = `<button onclick="updateOrderStatus('${order.id}', 'Preparando')">Aceptar y Preparar</button>`;
    } else if (order.status === 'Preparando') {
      actionButtonHTML = `<button onclick="updateOrderStatus('${order.id}', 'Enviado')">Enviar Pedido 🚴</button>`;
    } else if (order.status === 'Enviado') {
      actionButtonHTML = `<button class="btn-complete" onclick="updateOrderStatus('${order.id}', 'Entregado')">Marcar como Entregado</button>`;
    } else if (order.status === 'Entregado') {
      actionButtonHTML = `<span class="order-completed-msg">✓ Pedido Completado</span>`;
    }

    card.innerHTML = `
      <div class="order-header">
        <h3>${order.id}</h3>
        <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
      </div>
      <div class="order-body">
        <p><strong>Cliente:</strong> ${order.customer}</p>
        <p><strong>Dirección:</strong> ${order.address}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
        <strong>Detalle:</strong>
        <ul>${itemsHTML}</ul>
        <p class="order-total"><strong>Monto Total:</strong> $${order.total}</p>
      </div>
      <div class="order-actions">
        ${actionButtonHTML}
      </div>
    `;
    grid.appendChild(card);
  });
}

// Actualizar el estado del pedido desde el panel de Comercio
function updateOrderStatus(orderId, newStatus) {
  orders = orders.map(order => {
    if (order.id === orderId) {
      order.status = newStatus;
    }
    return order;
  });
  saveOrdersToStorage();
}
