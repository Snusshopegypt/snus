// ⚠️ IMPORTANT: Replace with your Egyptian WhatsApp number (country code 20 without +)
const WHATSAPP_NUMBER = "+201012030695"; 

let products = [];
let cart = JSON.parse(localStorage.getItem('snus_cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
    updateCartUI();
});

async function loadProducts() {
    try {
        const response = await fetch('products.json');
        products = await response.json();
        
        const localProducts = localStorage.getItem('snus_products');
        if (localProducts) {
            products = JSON.parse(localProducts);
        }
        renderProducts(products);
        renderAdminProductList();
    } catch (error) {
        console.error('Error loading products:', error);
        const localProducts = localStorage.getItem('snus_products');
        if (localProducts) {
            products = JSON.parse(localProducts);
            renderProducts(products);
            renderAdminProductList();
        }
    }
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-secondary)">No products available right now.</p>';
        return;
    }

    items.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div class="product-image-container">
                ${product.badge ? `<span class="badge">${product.badge}</span>` : ''}
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=60'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                <div class="product-footer">
                    <div class="price-box">
                        <span class="current-price">${product.price} EGP</span>
                        ${product.oldPrice ? `<span class="old-price">${product.oldPrice} EGP</span>` : ''}
                    </div>
                    <button class="btn btn-primary add-to-cart-btn" data-id="${product.id}">
                        <i class="fa-solid fa-plus"></i> Add
                    </button>
                </div>
            </div>
        `;

        // Click card to open product detail modal (except when clicking the quick add button)
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.add-to-cart-btn')) {
                openProductModal(product.id);
            }
        });

        grid.appendChild(card);
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            addToCartWithQuantity(id, 1);
        });
    });
}

function renderAdminProductList() {
    const listContainer = document.getElementById('admin-product-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (products.length === 0) {
        listContainer.innerHTML = '<p style="color:var(--text-secondary); font-size:0.9rem;">No products found.</p>';
        return;
    }

    products.forEach(product => {
        const itemEl = document.createElement('div');
        itemEl.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: var(--bg-primary); padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);";
        itemEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
                <img src="${product.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&q=60'">
                <div>
                    <h4 style="font-size: 0.9rem; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${product.name}</h4>
                    <p style="font-size: 0.75rem; color: var(--text-secondary);">${product.price} EGP</p>
                </div>
            </div>
            <div style="display: flex; gap: 6px;">
                <button type="button" class="btn btn-secondary edit-prod-btn" data-id="${product.id}" style="padding: 5px 10px; font-size: 0.8rem;"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="btn btn-secondary delete-prod-btn" data-id="${product.id}" style="padding: 5px 10px; font-size: 0.8rem; background: #ef4444; border-color: #ef4444; color: white;"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        listContainer.appendChild(itemEl);
    });

    // Attach event listeners for edit and delete buttons inside admin modal
    document.querySelectorAll('.edit-prod-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            startEditProduct(id);
        });
    });

    document.querySelectorAll('.delete-prod-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            deleteProduct(id);
        });
    });
}

function startEditProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('p-id').value = product.id;
    document.getElementById('p-name').value = product.name;
    document.getElementById('p-category').value = product.category;
    document.getElementById('p-price').value = product.price;
    document.getElementById('p-oldprice').value = product.oldPrice || '';
    document.getElementById('p-badge').value = product.badge || '';
    document.getElementById('p-image').value = product.image;
    document.getElementById('p-desc').value = product.description || '';

    document.getElementById('form-title').textContent = 'Edit Product / Bundle';
    document.getElementById('save-product-btn').textContent = 'Update Product';
    document.getElementById('cancel-edit-btn').style.display = 'block';

    // Scroll admin modal to top of form
    document.querySelector('.admin-content').scrollTop = 0;
}

function resetAdminForm() {
    document.getElementById('add-product-form').reset();
    document.getElementById('p-id').value = '';
    document.getElementById('form-title').textContent = 'Add New Product / Bundle';
    document.getElementById('save-product-btn').textContent = 'Add Product';
    document.getElementById('cancel-edit-btn').style.display = 'none';
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('snus_products', JSON.stringify(products));
        renderProducts(products);
        renderAdminProductList();
    }
}

function setupEventListeners() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const filter = e.target.getAttribute('data-filter');
            if (filter === 'all') {
                renderProducts(products);
            } else {
                renderProducts(products.filter(p => p.category === filter));
            }
        });
    });

    const cartDrawer = document.getElementById('cart-drawer');
    document.getElementById('cart-btn').addEventListener('click', () => cartDrawer.classList.add('open'));
    document.getElementById('close-cart').addEventListener('click', () => cartDrawer.classList.remove('open'));

    const adminModal = document.getElementById('admin-modal');
    document.getElementById('admin-toggle-btn').addEventListener('click', () => {
        renderAdminProductList();
        adminModal.classList.add('open');
    });
    document.querySelector('.close-admin').addEventListener('click', () => adminModal.classList.remove('open'));

    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        resetAdminForm();
    });

    document.getElementById('add-product-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('p-id').value;
        
        const productData = {
            id: editId ? parseInt(editId) : Date.now(),
            name: document.getElementById('p-name').value,
            category: document.getElementById('p-category').value,
            price: parseFloat(document.getElementById('p-price').value),
            oldPrice: document.getElementById('p-oldprice').value ? parseFloat(document.getElementById('p-oldprice').value) : null,
            badge: document.getElementById('p-badge').value,
            image: document.getElementById('p-image').value,
            description: document.getElementById('p-desc').value
        };

        if (editId) {
            // Update existing product
            const index = products.findIndex(p => p.id === parseInt(editId));
            if (index !== -1) {
                products[index] = productData;
            }
            alert('Product updated successfully!');
        } else {
            // Add new product
            products.push(productData);
            alert('Product added successfully!');
        }

        localStorage.setItem('snus_products', JSON.stringify(products));
        renderProducts(products);
        renderAdminProductList();
        resetAdminForm();
    });

    document.getElementById('export-json-btn').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "products.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    document.getElementById('whatsapp-checkout-btn').addEventListener('click', () => {
        const name = document.getElementById('customer-name').value.trim();
        const phone = document.getElementById('customer-phone').value.trim();
        const address = document.getElementById('customer-address').value.trim();

        if (!name || !phone || !address) {
            alert('Please fill in your Name, Phone Number, and Delivery Address.');
            return;
        }

        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        let total = 0;
        let orderMessage = `*🛒 NEW SNUS ORDER - EGYPT*\n\n`;
        orderMessage += `👤 *Customer Name:* ${name}\n`;
        orderMessage += `📞 *Phone:* ${phone}\n`;
        orderMessage += `📍 *Address:* ${address}\n\n`;
        orderMessage += `*Products Ordered:*\n`;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            orderMessage += `${index + 1}. *${item.name}* x ${item.quantity} = ${itemTotal} EGP\n`;
        });

        orderMessage += `\n💰 *Total Amount:* *${total} EGP*\n`;
        orderMessage += `🚚 *Delivery:* Cash on Delivery / Egypt\n`;

        const encodedMessage = encodeURIComponent(orderMessage);
        const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
        
        window.open(whatsappURL, '_blank');
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCartUI();
    document.getElementById('cart-drawer').classList.add('open');
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        cart = cart.filter(item => item.id !== productId);
    }

    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('snus_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const countSpan = document.getElementById('cart-count');
    const itemsContainer = document.getElementById('cart-items');
    const totalPriceSpan = document.getElementById('cart-total-price');

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    countSpan.textContent = totalCount;

    itemsContainer.innerHTML = '';

    if (cart.length === 0) {
        itemsContainer.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">Your cart is empty.</p>';
        totalPriceSpan.textContent = '0 EGP';
        return;
    }

    let totalPrice = 0;

    cart.forEach(item => {
        totalPrice += item.price * item.quantity;
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>${item.price} EGP x ${item.quantity}</p>
            </div>
            <div class="cart-item-actions">
                <button onclick="updateQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
        `;
        itemsContainer.appendChild(itemEl);
    });

    totalPriceSpan.textContent = `${totalPrice} EGP`;
}
function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const container = document.getElementById('modal-product-details');
    container.innerHTML = `
        <div class="modal-product-layout">
            <div class="modal-img-container">
                ${product.badge ? `<span class="badge">${product.badge}</span>` : ''}
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=60'">
            </div>
            <div class="modal-info-container">
                <span class="modal-category">${product.category}</span>
                <h2>${product.name}</h2>
                <p class="modal-desc">${product.description || 'No detailed description provided for this item.'}</p>
                <div class="modal-price-box">
                    <span class="current-price">${product.price} EGP</span>
                    ${product.oldPrice ? `<span class="old-price">${product.oldPrice} EGP</span>` : ''}
                </div>
                <div class="quantity-selector-group">
                    <label>Select Quantity:</label>
                    <div class="qty-controls">
                        <button type="button" id="modal-qty-minus">-</button>
                        <span id="modal-qty-val">1</span>
                        <button type="button" id="modal-qty-plus">+</button>
                    </div>
                </div>
                <button class="btn btn-primary" id="modal-add-to-cart-btn" data-id="${product.id}" style="width: 100%; margin-top: 10px;">
                    <i class="fa-solid fa-cart-shopping"></i> Add to Cart
                </button>
            </div>
        </div>
    `;

    let currentQty = 1;
    document.getElementById('modal-qty-minus').addEventListener('click', () => {
        if (currentQty > 1) {
            currentQty--;
            document.getElementById('modal-qty-val').textContent = currentQty;
        }
    });

    document.getElementById('modal-qty-plus').addEventListener('click', () => {
        currentQty++;
        document.getElementById('modal-qty-val').textContent = currentQty;
    });

    document.getElementById('modal-add-to-cart-btn').addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        addToCartWithQuantity(id, currentQty);
        document.getElementById('product-modal').classList.remove('open');
    });

    document.getElementById('product-modal').classList.add('open');
}

function addToCartWithQuantity(productId, quantity) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ ...product, quantity: quantity });
    }

    saveCart();
    updateCartUI();
    document.getElementById('cart-drawer').classList.add('open');
}
// Add close listener for product modal
    const productModal = document.getElementById('product-modal');
    document.querySelector('.close-product-modal').addEventListener('click', () => {
        productModal.classList.remove('open');
    });

    // Close modal when clicking outside content area
    window.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.classList.remove('open');
        }
    });