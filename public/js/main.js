// ── Toast ─────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Tab switching ─────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ── Typewriter effect ─────────────────────────────────────────────────────
function typewrite(el, text, speed = 8) {
  el.textContent = '';
  let i = 0;
  return new Promise(resolve => {
    function tick() {
      if (i < text.length) {
        el.textContent += text[i++];
        setTimeout(tick, speed);
      } else {
        resolve();
      }
    }
    tick();
  });
}

// ── Crystal Planet System ───────────────────────────────────────────────────
const planetSystem = document.getElementById('planet-system');
if (planetSystem && typeof CRYSTALS !== 'undefined') {
  const radius = window.innerWidth < 600 ? 120 : 180; // Sphere radius
  let items = [];
  
  // (center orb removed)

  // Distribute crystals on a sphere using Fibonacci lattice
  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
  CRYSTALS.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = 'planet-item';
    el.style.setProperty('--crystal-color', c.badge);
    // Use canvas bead instead of img
    const cv = document.createElement('canvas');
    cv.className = 'planet-photo';
    cv.width = 50; cv.height = 50;
    cv.style.cssText = 'border-radius:50%;border:2px solid ' + c.badge + ';box-shadow:0 0 10px ' + c.badge;
    el.appendChild(cv);
    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = c.name;
    el.appendChild(nameSpan);
    el.onclick = () => { if (typeof openModal === 'function') openModal(c.id); };
    planetSystem.appendChild(el);
    if (window.CrystalBead) CrystalBead.draw(cv, c.id, 50);

    const y = 1 - (i / (CRYSTALS.length - 1)) * 2; 
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i; 

    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;

    items.push({ el, x, y, z });
  });

  // Animation variables
  let angleX = 0.002;
  let angleY = 0.003;
  let isHovered = false;

  function animatePlanet() {
    const sinX = Math.sin(angleX), cosX = Math.cos(angleX);
    const sinY = Math.sin(angleY), cosY = Math.cos(angleY);

    items.forEach(item => {
      let x1 = item.x * cosY - item.z * sinY;
      let z1 = item.z * cosY + item.x * sinY;

      let y1 = item.y * cosX - z1 * sinX;
      let z2 = z1 * cosX + item.y * sinX;

      item.x = x1;
      item.y = y1;
      item.z = z2;

      // Projection (make it elliptical by stretching X)
      const scale = (radius + item.z * radius) / (radius * 2); 
      const alpha = 0.3 + scale * 0.7;
      const blur = (1 - scale) * 3; 

      // Multiply X by 1.6 to create an elliptical shape, and slightly compress Y
      item.el.style.transform = `translate3d(${item.x * radius * 1.6}px, ${item.y * radius * 0.9}px, ${item.z * radius}px) scale(${0.5 + scale * 0.8})`;
      item.el.style.opacity = alpha;
      item.el.style.zIndex = Math.floor(scale * 100);
      item.el.style.filter = `blur(${blur}px)`;
    });

    requestAnimationFrame(animatePlanet);
  }
  
  animatePlanet();

  // Mouse interaction
  let mouseX = 0, mouseY = 0;
  planetSystem.addEventListener('mousemove', e => {
    isHovered = true;
    const rect = planetSystem.getBoundingClientRect();
    mouseX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    mouseY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    // Adjust rotation speed based on mouse position
    angleY = mouseX * 0.02;
    angleX = -mouseY * 0.02;
  });
  
  planetSystem.addEventListener('mouseleave', () => {
    isHovered = false;
    angleX = 0.002;
    angleY = 0.003;
  });
}

// ── Crystal picks checkboxes ─────────────────────────────────────────────
const picksContainer = document.getElementById('crystal-picks');
if (picksContainer && typeof CRYSTALS !== 'undefined') {
  picksContainer.innerHTML = CRYSTALS.map(c => `
    <label class="crystal-pick-label" style="
      display:flex;align-items:center;gap:.45rem;
      padding:.4rem .7rem;
      border:1px solid var(--glass-border);
      border-radius:.75rem;
      cursor:pointer;
      font-size:.82rem;
      transition:all .2s;
      background:var(--glass);
    ">
      <input type="checkbox" name="crystal_picks" value="${c.id}" style="display:none;" />
      <canvas data-bead="${c.id}" width="22" height="22" style="border-radius:50%;flex-shrink:0;"></canvas>
      ${c.name}
    </label>
  `).join('');

  // Draw tiny beads
  picksContainer.querySelectorAll('canvas[data-bead]').forEach(cv => {
    if (window.CrystalBead) CrystalBead.draw(cv, cv.dataset.bead, 22);
  });

  // Toggle style on check
  picksContainer.querySelectorAll('.crystal-pick-label').forEach(lbl => {
    lbl.addEventListener('click', () => {
      const cb = lbl.querySelector('input');
      // toggled after click, so read next state
      setTimeout(() => {
        if (cb.checked) {
          lbl.style.borderColor = 'var(--purple-light)';
          lbl.style.background = 'rgba(167,139,250,0.15)';
          lbl.style.color = 'var(--purple-light)';
        } else {
          lbl.style.borderColor = '';
          lbl.style.background = 'var(--glass)';
          lbl.style.color = '';
        }
      }, 0);
    });
  });
}

// ── Re-do button ──────────────────────────────────────────────────────────
const btnRedo = document.getElementById('btn-redo');
if (btnRedo) {
  btnRedo.addEventListener('click', () => {
    document.getElementById('result-section').classList.remove('show');
    document.getElementById('reading-form').reset();
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
  });
}

// ── Form submit ───────────────────────────────────────────────────────────
const form = document.getElementById('reading-form');
const submitBtn = document.getElementById('submit-btn');

const demandSelect = document.getElementById('demand-select');
const demandInput = document.getElementById('demand');

if (demandSelect && demandInput) {
  demandSelect.addEventListener('change', () => {
    if (demandSelect.value === 'other') {
      demandInput.style.display = 'block';
      demandInput.required = true;
    } else {
      demandInput.style.display = 'none';
      demandInput.required = false;
    }
  });
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const picks = [...(form.querySelectorAll('input[name="crystal_picks"]:checked'))]
      .map(cb => cb.value);

    let finalDemand = form.demand?.value.trim() || '';
    if (demandSelect) {
      finalDemand = demandSelect.value === 'other' ? form.demand?.value.trim() : demandSelect.value;
    }

    const data = {
      name:         form.name.value.trim(),
      gender:       form.querySelector('input[name="gender"]:checked')?.value,
      birthdate:    form.birthdate.value,
      birthtime:    form.birthtime.value || '',
      religion:     form.religion.value || '',
      email:        form.email.value.trim() || '',
      wrist_size:   form.wrist_size.value || '',
      phone:        form.phone.value.trim() || '',
      demand:       finalDemand,
      crystal_picks: picks.join(','),
    };

    if (!data.gender) {
      showToast('請選擇性別', 'error');
      return;
    }

    // Loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> AI 能量分析中，請稍候...';

    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || '伺服器錯誤');

      // Store readingId and contact info for checkout modal
      window.currentReadingId = json.id;
      window.currentEmail = data.email;
      window.currentPhone = data.phone;

      // Show result section
      const resultSection = document.getElementById('result-section');
      resultSection.classList.add('show');
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Fill analysis & deities tabs with typewriter
      await typewrite(document.getElementById('result-analysis'), json.sections.analysis, 6);
      document.getElementById('result-deities').textContent = json.sections.deities;

      // Parse crystal recommendations into selectable cards
      _renderCrystalCards(json.sections.crystals);

      showToast('能量分析完成 ✨ 請選擇您要加入購物車的水晶', 'success');
    } catch (err) {
      showToast(err.message || '發生錯誤，請稍後再試', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '✨ 獲取專屬水晶祝福';
    }
  });
}

// ── Parse AI crystal section → selectable add-to-cart cards ───────────────
function _renderCrystalCards(crystalText) {
  const container = document.getElementById('result-crystals');
  if (!container) return;

  // Split by 🔮 to get individual crystal blocks
  const blocks = crystalText.split(/(?=🔮)/);

  const cards = blocks.map(block => {
    if (!block.trim() || !block.startsWith('🔮')) return null;

    const nameLine = block.split('\n')[0].replace('🔮', '').trim();

    let matched = null;
    if (typeof CRYSTALS !== 'undefined') {
      // Find the primary crystal from the recipe line or the block
      const recipeMatch = block.match(/水晶配方[：:]\s*(.+)/);
      const searchTarget = recipeMatch ? recipeMatch[1] : block;
      
      matched = CRYSTALS.find(c => searchTarget.includes(c.name));
      if (!matched) {
        matched = CRYSTALS.find(c => block.includes(c.name));
      }
    }

    const beadsMatch = block.match(/珠數建議[：:]\s*(.+)/);
    const beadDetails = beadsMatch ? beadsMatch[1].trim() : '';
    
    const recipeMatch = block.match(/水晶配方[：:]\s*(.+)/);
    const recipeDetails = recipeMatch ? recipeMatch[1].trim() : '';
    
    // Combine custom bracelet name and details for the cart
    const details = nameLine + (recipeDetails ? ` - 配方: ${recipeDetails}` : '') + (beadDetails ? ` (${beadDetails})` : '');

    return { nameLine, matched, block, details };
  }).filter(Boolean);

  if (cards.length === 0) {
    container.textContent = crystalText;
    return;
  }

  container.innerHTML = cards.map((card, i) => `
    <div class="crystal-rec-card glass-card" id="crec-${i}">
      <div class="crystal-rec-header">
        ${card.matched ? `<canvas class="crystal-rec-bead" data-bead="${card.matched.id}" width="48" height="48"></canvas>` : ''}
        <div style="flex:1">
          <div class="crystal-rec-name">${card.nameLine}</div>
          ${card.details ? `<div class="crystal-rec-beads">🔮 ${card.details}</div>` : ''}
        </div>
        ${card.matched ? `
          <button class="btn-add-cart" data-crystal="${card.matched.id}" data-details="${encodeURIComponent(card.details)}" data-name="${card.nameLine}">
            🛒 加入購物車
          </button>
        ` : ''}
      </div>
      <pre class="crystal-rec-body">${card.block.split('\n').slice(1).join('\n').trim()}</pre>
    </div>
  `).join('');

  // Draw beads
  container.querySelectorAll('canvas[data-bead]').forEach(cv => {
    if (window.CrystalBead) CrystalBead.draw(cv, cv.dataset.bead, 48);
  });

  // Add to cart buttons
  container.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      if (typeof Cart === 'undefined') return;
      const crystalId = btn.dataset.crystal;
      const details = decodeURIComponent(btn.dataset.details);
      const name = btn.dataset.name;
      Cart.addItem(crystalId, 1, details);
      btn.textContent = '✅ 已加入';
      btn.disabled = true;
      btn.style.opacity = '0.6';
      showToast(`🛒「${name}」已加入購物車`, 'success');
      const badge = document.getElementById('cart-badge');
      if (badge) { badge.classList.add('pulse'); setTimeout(() => badge.classList.remove('pulse'), 600); }
    });
  });
}

// ── Order Search ─────────────────────────────────────────────────────────
const navSearchOrderBtn = document.getElementById('nav-search-order');
const searchOrderModal = document.getElementById('search-order-modal');
const searchOrderForm = document.getElementById('search-order-form');
const searchResultsContainer = document.getElementById('search-results');

if (navSearchOrderBtn && searchOrderModal) {
  navSearchOrderBtn.addEventListener('click', (e) => {
    e.preventDefault();
    searchOrderModal.classList.add('open');
  });
}

if (searchOrderForm) {
  searchOrderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('search-phone').value.trim();
    if (!phone) return;

    const btn = document.getElementById('search-submit-btn');
    btn.textContent = '查詢中...';
    btn.disabled = true;

    try {
      const res = await fetch(`/api/order/search?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || '查詢失敗');

      searchResultsContainer.style.display = 'block';
      if (data.length === 0) {
        searchResultsContainer.innerHTML = '<p style="color:var(--text-muted);text-align:center;">找不到該號碼的訂單紀錄。</p>';
      } else {
        searchResultsContainer.innerHTML = data.map(order => {
          let itemsHtml = '';
          try {
            const items = JSON.parse(order.order_details);
            itemsHtml = items.map(i => `<li>${i.name} x ${i.qty}<br><small style="color:var(--gold-light)">${i.details || ''}</small></li>`).join('');
          } catch (e) { itemsHtml = '<li>無法解析訂單項目</li>'; }
          
          return `
            <div style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:1rem; padding:1rem; margin-bottom:1rem;">
              <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.5rem;">訂單時間：${order.created_at}</div>
              <ul style="list-style:none; margin-bottom:1rem; font-size:0.9rem;">${itemsHtml}</ul>
              <div style="font-size:0.85rem;">
                <span style="display:inline-block; margin-right:1rem;">📦 ${order.shipping_method || '未知'}</span>
                <span>💳 ${order.payment_method || '未知'}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.textContent = '查詢';
      btn.disabled = false;
    }
  });
}
