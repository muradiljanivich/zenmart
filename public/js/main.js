/* Zenmart Shared Interactivity */
(function () {
    const CART_KEY = 'zenmart_cart_v1';
    const ORDER_KEY = 'zenmart_last_order_v1';

    const DEFAULT_CART = [
        {
            id: 'macbook-16',
            name: 'Apple MacBook Pro 16-inch Space Gray',
            price: 1999,
            qty: 1,
            img: '../public/images/products/macbook_16.png'
        },
        {
            id: 'apple-watch-se',
            name: 'Apple Watch SE (GPS) 40mm',
            price: 279,
            qty: 1,
            img: '../public/images/products/watch.png'
        }
    ];

    function getCart() {
        try {
            const raw = localStorage.getItem(CART_KEY);
            if (!raw) {
                localStorage.setItem(CART_KEY, JSON.stringify(DEFAULT_CART));
                return [...DEFAULT_CART];
            }
            return JSON.parse(raw);
        } catch (e) {
            return [...DEFAULT_CART];
        }
    }

    function saveCart(cart) {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        } catch (e) {}
        updateNavbarCart();
    }

    function updateNavbarCart() {
        const cart = getCart();
        const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
        const totalSum = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

        const countEl = document.getElementById('navBasketCount');
        const totalEl = document.getElementById('navBasketTotal');
        if (countEl) countEl.textContent = totalQty;
        if (totalEl) totalEl.textContent = '$' + totalSum.toFixed(2);
    }

    function addToCart(item) {
        const cart = getCart();
        const existing = cart.find((c) => c.id === item.id);
        if (existing) {
            existing.qty += item.qty || 1;
        } else {
            cart.push({
                id: item.id,
                name: item.name,
                price: Number(item.price),
                qty: item.qty || 1,
                img: item.img
            });
        }
        saveCart(cart);
    }

    // 1. Add to Cart buttons on Shop page
    document.querySelectorAll('.btn_add_cart_sm').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            addToCart({
                id: btn.dataset.id,
                name: btn.dataset.name,
                price: Number(btn.dataset.price),
                qty: 1,
                img: btn.dataset.img
            });
            const orig = btn.textContent;
            btn.textContent = 'Added!';
            setTimeout(() => (btn.textContent = orig), 1000);
        });
    });

    // 2. Shop Filters & Sorting (product/all.html)
    const productGrid = document.getElementById('productGrid');
    if (productGrid) {
        const cards = Array.from(productGrid.querySelectorAll('.shop_product_card'));
        const brandPills = document.querySelectorAll('.brand_pill');
        const categoryRadios = document.querySelectorAll('input[name="category"]');
        const minPriceInput = document.getElementById('minPrice');
        const maxPriceInput = document.getElementById('maxPrice');
        const searchInput = document.getElementById('shopSearchInput');
        const sortSelect = document.getElementById('sortSelect');
        const visibleCountEl = document.getElementById('visibleCount');
        const resetBtn = document.getElementById('resetFiltersBtn');

        let activeBrand = 'all';
        let activeCategory = 'all';

        function applyFilters() {
            const minP = Number(minPriceInput?.value) || 0;
            const maxP = Number(maxPriceInput?.value) || Infinity;
            const query = (searchInput?.value || '').trim().toLowerCase();

            let visible = 0;
            cards.forEach((card) => {
                const cat = card.dataset.category;
                const brand = card.dataset.brand;
                const price = Number(card.dataset.price);
                const title = card.querySelector('.shop_card_title')?.textContent.toLowerCase() || '';

                const matchBrand = activeBrand === 'all' || brand === activeBrand;
                const matchCat = activeCategory === 'all' || cat === activeCategory;
                const matchPrice = price >= minP && price <= maxP;
                const matchQuery = !query || title.includes(query) || brand.toLowerCase().includes(query);

                if (matchBrand && matchCat && matchPrice && matchQuery) {
                    card.style.display = 'flex';
                    visible++;
                } else {
                    card.style.display = 'none';
                }
            });

            if (visibleCountEl) visibleCountEl.textContent = visible;
        }

        brandPills.forEach((pill) => {
            pill.addEventListener('click', () => {
                brandPills.forEach((p) => p.classList.remove('active'));
                pill.classList.add('active');
                activeBrand = pill.dataset.brand;
                applyFilters();
            });
        });

        categoryRadios.forEach((radio) => {
            radio.addEventListener('change', () => {
                activeCategory = radio.value;
                applyFilters();
            });
        });

        [minPriceInput, maxPriceInput, searchInput].forEach((el) => {
            if (el) el.addEventListener('input', applyFilters);
        });

        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                const val = sortSelect.value;
                const sorted = [...cards].sort((a, b) => {
                    const pa = Number(a.dataset.price);
                    const pb = Number(b.dataset.price);
                    if (val === 'price-asc') return pa - pb;
                    if (val === 'price-desc') return pb - pa;
                    return 0;
                });
                sorted.forEach((c) => productGrid.appendChild(c));
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                activeBrand = 'all';
                activeCategory = 'all';
                brandPills.forEach((p) => p.classList.toggle('active', p.dataset.brand === 'all'));
                const allRadio = document.querySelector('input[name="category"][value="all"]');
                if (allRadio) allRadio.checked = true;
                if (minPriceInput) minPriceInput.value = '';
                if (maxPriceInput) maxPriceInput.value = '';
                if (searchInput) searchInput.value = '';
                applyFilters();
            });
        }
    }

    // 3. Chosen Product Detail Page
    const mainProductImg = document.getElementById('mainProductImg');
    if (mainProductImg) {
        document.querySelectorAll('.detail_thumb').forEach((thumb) => {
            thumb.addEventListener('click', () => {
                document.querySelectorAll('.detail_thumb').forEach((t) => t.classList.remove('active'));
                thumb.classList.add('active');
                mainProductImg.src = thumb.dataset.img;
            });
        });

        document.querySelectorAll('.variant_pills').forEach((group) => {
            group.querySelectorAll('.variant_pill').forEach((pill) => {
                pill.addEventListener('click', () => {
                    group.querySelectorAll('.variant_pill').forEach((p) => p.classList.remove('active'));
                    pill.classList.add('active');
                });
            });
        });

        let qty = 1;
        const qtyValue = document.getElementById('qtyValue');
        document.getElementById('qtyMinus')?.addEventListener('click', () => {
            if (qty > 1) {
                qty--;
                if (qtyValue) qtyValue.textContent = qty;
            }
        });
        document.getElementById('qtyPlus')?.addEventListener('click', () => {
            qty++;
            if (qtyValue) qtyValue.textContent = qty;
        });

        const detailAddBtn = document.getElementById('detailAddToCart');
        detailAddBtn?.addEventListener('click', () => {
            addToCart({
                id: detailAddBtn.dataset.id,
                name: detailAddBtn.dataset.name,
                price: Number(detailAddBtn.dataset.price),
                qty: qty,
                img: detailAddBtn.dataset.img
            });
            detailAddBtn.textContent = 'Added to Cart!';
            setTimeout(() => (detailAddBtn.textContent = 'Add to Cart'), 1200);
        });

        document.querySelectorAll('.tab_btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab_btn').forEach((b) => b.classList.remove('active'));
                document.querySelectorAll('.tab_panel').forEach((p) => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('tab-' + btn.dataset.tab)?.classList.add('active');
            });
        });
    }

    // 4. Cart Page
    const cartTableBody = document.getElementById('cartTableBody');
    if (cartTableBody) {
        let discountRate = 0;

        function renderCart() {
            const cart = getCart();
            cartTableBody.innerHTML = '';

            if (cart.length === 0) {
                cartTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#626974;">Your cart is empty. <a href="../product/all.html" style="color:#443297;font-weight:500;">Browse products</a></td></tr>';
            } else {
                cart.forEach((item, index) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>
                            <div class="cart_product_cell">
                                <img src="${item.img}" alt="${item.name}">
                                <div class="cart_product_meta">
                                    <strong>${item.name}</strong>
                                    <span>In Stock</span>
                                </div>
                            </div>
                        </td>
                        <td>$${item.price.toFixed(2)}</td>
                        <td>
                            <div class="cart_qty_control">
                                <button type="button" data-action="dec" data-index="${index}">-</button>
                                <span>${item.qty}</span>
                                <button type="button" data-action="inc" data-index="${index}">+</button>
                            </div>
                        </td>
                        <td><strong>$${(item.price * item.qty).toFixed(2)}</strong></td>
                        <td>
                            <button type="button" class="cart_remove_btn" data-action="remove" data-index="${index}">
                                <img src="../public/images/icons/remove_btn.svg" alt="Remove">
                            </button>
                        </td>
                    `;
                    cartTableBody.appendChild(tr);
                });
            }

            const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
            const discount = subtotal * discountRate;
            const total = Math.max(0, subtotal - discount);

            const subEl = document.getElementById('cartSubtotal');
            const discEl = document.getElementById('cartDiscount');
            const grandEl = document.getElementById('cartGrandTotal');
            if (subEl) subEl.textContent = '$' + subtotal.toFixed(2);
            if (discEl) discEl.textContent = '-$' + discount.toFixed(2);
            if (grandEl) grandEl.textContent = '$' + total.toFixed(2);
        }

        cartTableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const cart = getCart();
            const idx = Number(btn.dataset.index);
            const action = btn.dataset.action;

            if (action === 'inc') cart[idx].qty++;
            if (action === 'dec') {
                if (cart[idx].qty > 1) cart[idx].qty--;
            }
            if (action === 'remove') cart.splice(idx, 1);

            saveCart(cart);
            renderCart();
        });

        document.getElementById('applyCouponBtn')?.addEventListener('click', () => {
            const code = (document.getElementById('couponInput')?.value || '').trim().toUpperCase();
            if (code === 'ZEN10') {
                discountRate = 0.1;
                renderCart();
                alert('Coupon ZEN10 applied (10% off)!');
            } else {
                alert('Invalid coupon code. Try ZEN10.');
            }
        });

        renderCart();
    }

    // 5. Checkout Page
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        const cart = getCart();
        const listEl = document.getElementById('checkoutItemsList');
        let subtotal = 0;

        if (listEl) {
            listEl.innerHTML = '';
            cart.forEach((item) => {
                subtotal += item.price * item.qty;
                const row = document.createElement('div');
                row.className = 'summary_row';
                row.innerHTML = `<span>${item.name} &times; ${item.qty}</span><strong>$${(item.price * item.qty).toFixed(2)}</strong>`;
                listEl.appendChild(row);
            });
        }

        const subEl = document.getElementById('checkoutSubtotal');
        const totEl = document.getElementById('checkoutTotal');
        if (subEl) subEl.textContent = '$' + subtotal.toFixed(2);
        if (totEl) totEl.textContent = '$' + subtotal.toFixed(2);

        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const payment = document.querySelector('input[name="payment"]:checked')?.value || 'Direct Bank Transfer';
            const order = {
                orderNumber: 'ZM-' + Math.floor(10000 + Math.random() * 89999),
                date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                total: subtotal,
                payment: payment,
                items: cart
            };
            try {
                localStorage.setItem(ORDER_KEY, JSON.stringify(order));
            } catch (err) {}
            saveCart([]);
            window.location.href = 'received.html';
        });
    }

    // 6. Order Received Page
    const recItemsList = document.getElementById('recItemsList');
    if (recItemsList) {
        try {
            const rawOrder = localStorage.getItem(ORDER_KEY);
            if (rawOrder) {
                const order = JSON.parse(rawOrder);
                document.getElementById('recOrderNum').textContent = order.orderNumber;
                document.getElementById('recOrderDate').textContent = order.date;
                document.getElementById('recOrderTotal').textContent = '$' + order.total.toFixed(2);
                document.getElementById('recOrderPayment').textContent = order.payment;
                document.getElementById('recGrandTotal').textContent = '$' + order.total.toFixed(2);

                recItemsList.innerHTML = '';
                order.items.forEach((item) => {
                    const row = document.createElement('div');
                    row.className = 'summary_row';
                    row.innerHTML = `<span>${item.name} x ${item.qty}</span><strong>$${(item.price * item.qty).toFixed(2)}</strong>`;
                    recItemsList.appendChild(row);
                });
            }
        } catch (e) {}
    }

    // 7. Contact / Login / Signup Forms
    document.getElementById('contactForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you! Your message has been sent to Zenmart Support.');
        e.target.reset();
    });

    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Welcome back to Zenmart!');
        window.location.href = '../index.html';
    });

    document.getElementById('signupForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Your Zenmart account has been created!');
        window.location.href = 'login.html';
    });

    updateNavbarCart();

    // 8. Simple Home Page Swipers (Top Selling, TV & Home Theatre, Top Deals)
    function initSimpleSwiper(wrapperSelector, trackSelector, paginationScopeSelector) {
        const wrapper = document.querySelector(wrapperSelector);
        if (!wrapper) return;
        const track = wrapper.querySelector(trackSelector);
        if (!track) return;

        const arrows = wrapper.querySelectorAll('.next_prev_box');
        const prevBtn = arrows[0];
        const nextBtn = arrows[1];
        const step = 310;

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (track.scrollLeft <= 5) {
                    track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' });
                } else {
                    track.scrollBy({ left: -step, behavior: 'smooth' });
                }
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 5) {
                    track.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    track.scrollBy({ left: step, behavior: 'smooth' });
                }
            });
        }

        if (paginationScopeSelector) {
            const scope = document.querySelector(paginationScopeSelector);
            const dots = scope ? Array.from(scope.querySelectorAll('.pagionation_dot .dot')) : [];
            const pagArrows = scope ? scope.querySelectorAll('.pagionation_main > img') : [];

            function setActiveDot(idx) {
                dots.forEach((d, i) => d.classList.toggle('active', i === idx));
            }

            dots.forEach((dot, idx) => {
                dot.addEventListener('click', () => {
                    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
                    const targetLeft = dots.length > 1 ? (maxScroll * idx) / (dots.length - 1) : 0;
                    track.scrollTo({ left: targetLeft, behavior: 'smooth' });
                    setActiveDot(idx);
                });
            });

            if (pagArrows[0]) pagArrows[0].addEventListener('click', () => prevBtn?.click());
            if (pagArrows[1]) pagArrows[1].addEventListener('click', () => nextBtn?.click());

            track.addEventListener('scroll', () => {
                const maxScroll = Math.max(1, track.scrollWidth - track.clientWidth);
                const ratio = track.scrollLeft / maxScroll;
                const activeIdx = Math.min(dots.length - 1, Math.round(ratio * (dots.length - 1)));
                setActiveDot(activeIdx);
            });
        }
    }

    initSimpleSwiper('.selling_product_frame .product_wrapper', '.product_boxes', '.selling_product_frame');
    initSimpleSwiper('.tv_frame .tv_wrapper', '.tv_product_boxes', '.tv_frame');
    initSimpleSwiper('.event_frame .event_product_wrapper', '.event_product_boxes', null);
})();
