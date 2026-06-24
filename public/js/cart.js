/**
 * cart.js — 購物車模組
 * 使用 localStorage 管理購物車狀態
 */

const Cart = (() => {
  const STORAGE_KEY = 'crystal_cart';
  let storePrices = {};
  let storeSettings = {};

  // Self-contained toast helper (works even without main.js)
  function _toast(msg, type = 'success') {
    if (typeof showToast === 'function') { showToast(msg, type); return; }
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  async function loadStoreData() {
    try {
      const res = await fetch('/api/prices');
      const data = await res.json();
      storePrices = data.prices || {};
      storeSettings = data.settings || {};
      _renderDrawer();
    } catch (e) {
      console.error('Failed to load prices', e);
    }
  }

  function parseBeadsPrice(item) {
    let price = 0;
    if (item.details) {
      // 支援: 紫水晶(26顆) 或 紫水晶 26 顆
      const regex = /([\u4e00-\u9fa5]+)\s*[(（]?\s*(\d+)\s*[)）]?\s*顆/g;
      let match;
      let matchedAny = false;
      while ((match = regex.exec(item.details)) !== null) {
        const name = match[1];
        const count = parseInt(match[2], 10);
        const c = typeof CRYSTALS !== 'undefined' ? CRYSTALS.find(x => x.name === name) : null;
        if (c && storePrices[c.id]) {
          matchedAny = true;
          price += storePrices[c.id] * count;
        }
      }
      if (matchedAny) return price * item.qty;
    }
    
    // Fallback: assume 20 beads of the primary crystal if no details found
    if (storePrices[item.id]) {
      price = storePrices[item.id] * 20;
    }
    return price * item.qty;
  }

  function _load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { return []; }
  }

  function _save(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    _updateBadge();
    _renderDrawer();
  }

  // ── Public API ──────────────────────────────────────────────────────────

  function getItems() { return _load(); }

  function addItem(crystalId, qty = 1, details = '') {
    const items = _load();
    const cartItemId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    items.push({ cartItemId, id: crystalId, qty, details });
    _save(items);
    return items;
  }

  function removeItem(cartItemId) {
    const items = _load().filter(i => i.cartItemId !== cartItemId);
    _save(items);
    return items;
  }

  function updateQty(cartItemId, qty) {
    const items = _load();
    const item = items.find(i => i.cartItemId === cartItemId);
    if (item) {
      item.qty = Math.max(1, qty);
    }
    _save(items);
    return items;
  }

  function clear() {
    _save([]);
  }

  function totalCount() {
    return _load().reduce((sum, i) => sum + i.qty, 0);
  }

  // ── No auto-add from AI result anymore ───────────────────────────────────
  function addFromAIResult() {
    // Deprecated. Handled manually via UI buttons now.
    return [];
  }

  // ── Badge ───────────────────────────────────────────────────────────────
  function _updateBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const count = totalCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  // ── Drawer ──────────────────────────────────────────────────────────────
  function openDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    _renderDrawer();
  }

  function closeDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  function _renderDrawer() {
    const body = document.getElementById('cart-drawer-body');
    if (!body) return;
    const items = _load();

    if (items.length === 0) {
      body.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <p>購物車是空的</p>
          <p style="font-size:.8rem;color:var(--text-muted);margin-top:.5rem;">完成能量分析後即可加入推薦水晶</p>
        </div>
      `;
      return;
    }

    const crystalMap = {};
    if (typeof CRYSTALS !== 'undefined') {
      CRYSTALS.forEach(c => { crystalMap[c.id] = c; });
    }

    let subtotal = 0;

    body.innerHTML = items.map(item => {
      const c = crystalMap[item.id];
      if (!c) return '';
      
      const itemPrice = parseBeadsPrice(item);
      subtotal += itemPrice;

      return `
        <div class="cart-item" data-cid="${item.cartItemId}">
          <canvas class="cart-item-bead" data-bead="${item.id}" width="40" height="40"></canvas>
          <div class="cart-item-info">
            <div class="cart-item-name">${c.name}</div>
            <div class="cart-item-en">${c.en}</div>
            ${item.details ? `<div style="font-size:0.75rem; color:var(--gold-light); margin-top:2px;">${item.details}</div>` : ''}
            <div style="font-size:0.85rem; color:var(--text); margin-top:4px;">NT$ ${itemPrice}</div>
          </div>
          <div class="cart-item-qty">
            <button class="cart-qty-btn" data-action="dec" data-cid="${item.cartItemId}">−</button>
            <span>${item.qty}</span>
            <button class="cart-qty-btn" data-action="inc" data-cid="${item.cartItemId}">+</button>
          </div>
          <button class="cart-item-remove" data-cid="${item.cartItemId}" title="移除">✕</button>
        </div>
      `;
    }).join('');

    // Render Summary
    const summary = document.getElementById('cart-summary');
    if (summary) {
      if (items.length > 0 && Object.keys(storePrices).length > 0) {
        summary.style.display = 'block';
        const shippingFee = parseInt(storeSettings['shipping_fee'] || 0, 10);
        const handlingFee = parseInt(storeSettings['handling_fee'] || 0, 10);
        const total = subtotal + shippingFee + handlingFee;
        
        document.getElementById('cart-subtotal').textContent = `NT$ ${subtotal}`;
        document.getElementById('cart-shipping-fee').textContent = `NT$ ${shippingFee}`;
        document.getElementById('cart-handling-fee').textContent = `NT$ ${handlingFee}`;
        document.getElementById('cart-total-price').textContent = `NT$ ${total}`;
      } else {
        summary.style.display = 'none';
      }
    }

    // Draw beads
    body.querySelectorAll('canvas[data-bead]').forEach(cv => {
      if (window.CrystalBead) CrystalBead.draw(cv, cv.dataset.bead, 40);
    });

    // Qty buttons
    body.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cid = btn.dataset.cid;
        const currentItems = _load();
        const item = currentItems.find(i => i.cartItemId === cid);
        if (!item) return;
        if (btn.dataset.action === 'inc') {
          updateQty(cid, item.qty + 1);
        } else {
          if (item.qty <= 1) {
            removeItem(cid);
          } else {
            updateQty(cid, item.qty - 1);
          }
        }
      });
    });

    // Remove buttons
    body.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => removeItem(btn.dataset.cid));
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  function init() {
    _updateBadge();
    loadStoreData();

    // Cart icon click
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) cartBtn.addEventListener('click', openDrawer);

    // Close drawer
    const closeBtn = document.getElementById('cart-drawer-close');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    const overlay = document.getElementById('cart-overlay');
    if (overlay) overlay.addEventListener('click', closeDrawer);

    // Clear button
    const clearBtn = document.getElementById('cart-clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      clear();
      _toast('購物車已清空', 'success');
    });

    // Checkout flow trigger
    const checkoutBtn = document.getElementById('cart-checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.textContent = '前往結帳';
      checkoutBtn.addEventListener('click', _openCheckoutModal);
    }
  }

  function _openCheckoutModal() {
    const items = _load();
    if (items.length === 0) {
      _toast('購物車是空的', 'error');
      return;
    }

    // Attempt to grab current readingId if available from main flow
    const readingId = window.currentReadingId || '';
    const email = window.currentEmail || '';
    const phone = window.currentPhone || '';

    // Create modal if not exists
    let modal = document.getElementById('checkout-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'checkout-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal" style="max-width:500px; max-height: 90vh; overflow-y: auto;">
          <button class="modal-close" onclick="document.getElementById('checkout-modal').classList.remove('open')">×</button>
          <h2>🛍️ 確認結帳</h2>
          <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:1.5rem;">請確認寄送與聯絡資訊，完成後我們會將訂單明細發送至您的 Email。</p>
          
          <form id="checkout-form">
            <div class="form-group">
              <label>Email (必填)</label>
              <input type="email" id="co-email" required placeholder="接收訂單確認信">
            </div>
            <div class="form-group">
              <label>聯絡電話 (必填)</label>
              <input type="tel" id="co-phone" required placeholder="09xxxxxxxx">
            </div>
            <div class="form-group">
              <label>寄送方式</label>
              <select id="co-shipping">
                <option value="超商取貨">超商取貨 (7-11/全家)</option>
                <option value="宅配到府">宅配到府</option>
              </select>
            </div>
            <div class="form-group">
              <label>付款方式</label>
              <select id="co-payment">
                <option value="信用卡">信用卡</option>
                <option value="貨到付款">貨到付款</option>
                <option value="ATM 轉帳">ATM 轉帳</option>
              </select>
            </div>
            <div class="form-group">
              <label>收件地址 / 門市名稱</label>
              <input type="text" id="co-address" required placeholder="請填寫完整地址或超商門市">
            </div>
            
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:.75rem; padding:1rem; margin-bottom:1.5rem;">
              <h4 style="color:var(--gold-light); margin-bottom:.5rem; font-size:.95rem;">最終結帳金額確認</h4>
              <div style="display:flex; justify-content:space-between; margin-bottom: .2rem; font-size:.85rem; color:var(--text-muted);">
                <span>商品小計</span>
                <span id="modal-subtotal">NT$ 0</span>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom: .2rem; font-size:.85rem; color:var(--text-muted);">
                <span>運費 (可依實際狀況修改)</span>
                <input type="number" id="modal-shipping-fee" value="0" min="0" style="width:80px; padding:.2rem; border-radius:.3rem; border:1px solid var(--glass-border); background:rgba(0,0,0,.2); color:var(--text); text-align:right;">
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom: .2rem; font-size:.85rem; color:var(--text-muted);">
                <span>手續費 (可依實際狀況修改)</span>
                <input type="number" id="modal-handling-fee" value="0" min="0" style="width:80px; padding:.2rem; border-radius:.3rem; border:1px solid var(--glass-border); background:rgba(0,0,0,.2); color:var(--text); text-align:right;">
              </div>
              <div style="display:flex; justify-content:space-between; margin-top: .5rem; padding-top:.5rem; border-top:1px solid rgba(255,255,255,.1); font-size:1.1rem; font-weight:600; color:var(--gold-light);">
                <span>總計</span>
                <span id="modal-total-price">NT$ 0</span>
              </div>
            </div>

            <button type="submit" class="btn-submit" id="co-submit-btn">✅ 送出訂單</button>
          </form>
        </div>
      `;
      document.body.appendChild(modal);

      // Event listener for form submit
      document.getElementById('checkout-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('co-submit-btn');
        btn.textContent = '處理中...';
        btn.disabled = true;

        const currentItems = _load();
        let sub = 0;
        currentItems.forEach(i => sub += parseBeadsPrice(i));
        const sf = parseInt(document.getElementById('modal-shipping-fee').value || 0, 10);
        const hf = parseInt(document.getElementById('modal-handling-fee').value || 0, 10);

        const data = {
          readingId: window.currentReadingId || 'GUEST_' + Date.now(),
          email: document.getElementById('co-email').value,
          phone: document.getElementById('co-phone').value,
          shipping_method: document.getElementById('co-shipping').value,
          payment_method: document.getElementById('co-payment').value,
          address: document.getElementById('co-address').value,
          subtotal: sub,
          shipping_fee: sf,
          handling_fee: hf,
          total_price: sub + sf + hf,
          items: currentItems.map(i => {
            const c = (typeof CRYSTALS !== 'undefined' ? CRYSTALS.find(x => x.id === i.id) : null);
            return {
              id: i.id,
              name: c ? c.name : i.id,
              qty: i.qty,
              details: i.details,
              price: parseBeadsPrice(i)
            };
          })
        };

        try {
          const res = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          
          if (!res.ok) throw new Error('伺服器錯誤');
          
          _toast('訂單建立成功！確認信已寄出 🎉', 'success');
          clear();
          closeDrawer();
          document.getElementById('checkout-modal').classList.remove('open');
        } catch (err) {
          _toast('結帳失敗，請稍後再試', 'error');
        } finally {
          btn.textContent = '送出訂單';
          btn.disabled = false;
        }
      });
    }

    // Populate data every time modal opens
    document.getElementById('co-email').value = email;
    document.getElementById('co-phone').value = phone;

    let subtotal = 0;
    items.forEach(item => { subtotal += parseBeadsPrice(item); });
    
    document.getElementById('modal-subtotal').textContent = `NT$ ${subtotal}`;
    
    const sFeeInput = document.getElementById('modal-shipping-fee');
    const hFeeInput = document.getElementById('modal-handling-fee');
    
    sFeeInput.value = parseInt(storeSettings['shipping_fee'] || 0, 10);
    hFeeInput.value = parseInt(storeSettings['handling_fee'] || 0, 10);

    function updateTotal() {
      const s = parseInt(sFeeInput.value || 0, 10);
      const h = parseInt(hFeeInput.value || 0, 10);
      document.getElementById('modal-total-price').textContent = `NT$ ${subtotal + s + h}`;
    }

    // Add listeners once by replacing element (or just remove old listeners, but since it's anonymous we can use oninput)
    sFeeInput.oninput = updateTotal;
    hFeeInput.oninput = updateTotal;
    updateTotal();

    modal.classList.add('open');
  }

  // ── Toast animation for add-to-cart ─────────────────────────────────────
  function showAddAnimation(crystalName) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = `🛒 已將「${crystalName}」加入購物車`;
    t.className = 'toast success show';
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  return {
    getItems,
    addItem,
    removeItem,
    updateQty,
    clear,
    totalCount,
    addFromAIResult,
    openDrawer,
    closeDrawer,
    showAddAnimation,
    init,
  };
})();

// Auto init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Cart.init());
} else {
  Cart.init();
}
