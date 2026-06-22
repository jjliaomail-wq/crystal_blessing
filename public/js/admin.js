let adminPassword = '';
let allRecords = [];

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

const genderMap = { male: '男', female: '女', other: '其他' };

// ── Login ─────────────────────────────────────────────────────────────────
document.getElementById('btn-login').addEventListener('click', () => login());
document.getElementById('admin-pw').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });

async function login() {
  const pw = document.getElementById('admin-pw').value;
  const err = document.getElementById('login-error');
  err.style.display = 'none';

  try {
    const res = await fetch('/api/admin/readings', {
      headers: { 'x-admin-password': pw }
    });
    if (!res.ok) { err.style.display = 'block'; return; }

    adminPassword = pw;
    allRecords = await res.json();
    document.getElementById('login-box').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    renderTable(allRecords);
  } catch {
    err.style.display = 'block';
  }
}

// ── Render table ──────────────────────────────────────────────────────────
function renderTable(records) {
  document.getElementById('record-count').textContent = records.length;
  const tbody = document.getElementById('records-body');
  tbody.innerHTML = records.map(r => {
    const hasOrder = !!r.order_details;
    return `
    <tr>
      <td>${r.id}</td>
      <td>${r.created_at ? r.created_at.replace('T', ' ').substring(0, 16) : ''}</td>
      <td>${r.name}</td>
      <td>${genderMap[r.gender] || r.gender}</td>
      <td>${r.birthdate}</td>
      <td>${r.birthtime || '—'}</td>
      <td>${r.religion || '—'}</td>
      <td>${r.email || '—'}</td>
      <td>${r.phone || '—'}</td>
      <td>${r.wrist_size ? r.wrist_size + ' cm' : '—'}</td>
      <td style="max-width:140px;font-size:.75rem;">${r.crystal_picks ? r.crystal_picks.split(',').join('\u3001') : '—'}</td>
      <td style="font-size:.78rem;">
        ${hasOrder
          ? `<span style="color:#4ade80;font-weight:600;">✅ 已下單</span><br><span style="color:var(--text-muted);">${r.shipping_method || ''}</span>`
          : '<span style="color:var(--text-muted);">\u5c1a未下單</span>'}
      </td>
      <td>
        <button onclick="showDetail(${r.id})" style="background:var(--glass);border:1px solid var(--glass-border);border-radius:.5rem;padding:.3rem .7rem;color:var(--purple-light);cursor:pointer;font-size:.8rem;">
          查看
        </button>
      </td>
    </tr>
  `}).join('');
}

// ── Search ────────────────────────────────────────────────────────────────
document.getElementById('search-input').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  const filtered = allRecords.filter(r =>
    r.name?.toLowerCase().includes(q) ||
    r.email?.toLowerCase().includes(q) ||
    r.phone?.toLowerCase().includes(q) ||
    r.religion?.toLowerCase().includes(q) ||
    r.crystal_picks?.toLowerCase().includes(q)
  );
  renderTable(filtered);
});

// ── Detail modal ──────────────────────────────────────────────────────────
function showDetail(id) {
  const r = allRecords.find(x => x.id === id);
  if (!r) return;
  const body = document.getElementById('modal-body');
  body.innerHTML = `
    <h2 style="font-family:'Noto Serif TC',serif;margin-bottom:1rem;">📜 ${r.name} 的能量報告</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:1rem;font-size:.85rem;">
      <div><span style="color:var(--text-muted);">性別：</span>${genderMap[r.gender] || r.gender}</div>
      <div><span style="color:var(--text-muted);">生日：</span>${r.birthdate}</div>
      <div><span style="color:var(--text-muted);">時辰：</span>${r.birthtime || '未知'}</div>
      <div><span style="color:var(--text-muted);">宗教：</span>${r.religion || '無特定'}</div>
      <div><span style="color:var(--text-muted);">Email：</span>${r.email || '—'}</div>
      <div><span style="color:var(--text-muted);">手機/LINE：</span>${r.phone || '—'}</div>
      <div><span style="color:var(--text-muted);">手圍：</span>${r.wrist_size ? r.wrist_size + ' cm' : '—'}</div>
      <div><span style="color:var(--text-muted);">時間：</span>${r.created_at?.substring(0, 16) || ''}</div>
    </div>
    ${r.order_details ? `
    <div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.3);border-radius:.75rem;padding:1rem;margin-bottom:1rem;">
      <div style="color:#4ade80;font-weight:700;font-size:1rem;margin-bottom:.75rem;">🛍️ 訂單明細</div>
      <div style="font-size:.85rem;display:grid;grid-template-columns:1fr 1fr;gap:.4rem;margin-bottom:.75rem;">
        <div><span style="color:var(--text-muted);">寄送方式：</span>${r.shipping_method || '—'}</div>
        <div><span style="color:var(--text-muted);">付款方式：</span>${r.payment_method || '—'}</div>
        <div style="grid-column:1/-1;"><span style="color:var(--text-muted);">地址：</span>${r.address || '—'}</div>
      </div>
      <div style="font-size:.85rem;">
        ${(() => {
          try {
            const items = JSON.parse(r.order_details);
            return items.map(i => `
              <div style="padding:.4rem 0;border-top:1px solid rgba(255,255,255,.08);">
                <strong>${i.name}</strong> &times; ${i.qty}
                ${i.details ? `<br><small style="color:var(--text-muted);">${i.details}</small>` : ''}
              </div>
            `).join('');
          } catch { return r.order_details; }
        })()}
      </div>
    </div>` : '<div style="color:var(--text-muted);font-size:.85rem;margin-bottom:1rem;">尚未下單</div>'}
    ${r.crystal_picks ? `
    <div style="margin-bottom:1rem;">
      <span style="color:var(--text-muted);font-size:.85rem;">有興趣的水晶：</span>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.4rem;">
        ${r.crystal_picks.split(',').filter(Boolean).map(id => {
          const crystal = (typeof CRYSTALS !== 'undefined' ? CRYSTALS : []).find(c => c.id === id);
          return crystal
            ? `<span style="background:${crystal.badge}22;color:${crystal.badge};border:1px solid ${crystal.badge}55;border-radius:999px;padding:.2rem .7rem;font-size:.78rem;">${crystal.name}</span>`
            : `<span style="background:var(--glass);border:1px solid var(--glass-border);border-radius:999px;padding:.2rem .7rem;font-size:.78rem;">${id}</span>`;
        }).join('')}
      </div>
    </div>` : ''}
    <hr style="border-color:var(--glass-border);margin-bottom:1rem;" />
    <div style="white-space:pre-wrap;font-size:.85rem;line-height:1.8;max-height:50vh;overflow-y:auto;">${r.ai_result || '（無記錄）'}</div>
  `;
  document.getElementById('modal-overlay').classList.add('open');
}

// ── Modal close ───────────────────────────────────────────────────────────
document.getElementById('modal-close').addEventListener('click', () =>
  document.getElementById('modal-overlay').classList.remove('open')
);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target.id === 'modal-overlay')
    document.getElementById('modal-overlay').classList.remove('open');
});

// ── Export Excel ──────────────────────────────────────────────────────────
document.getElementById('btn-export-excel').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = '/api/admin/export/excel';
  // Add password as query param for download link
  a.href = `/api/admin/export/excel?pw=${encodeURIComponent(adminPassword)}`;
  a.click();
});

// ── Logout ────────────────────────────────────────────────────────────────
document.getElementById('btn-logout').addEventListener('click', () => {
  adminPassword = '';
  allRecords = [];
  document.getElementById('login-box').style.display = 'block';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('admin-pw').value = '';
});

// ── Tabs ──────────────────────────────────────────────────────────────────
document.getElementById('tab-records-btn').addEventListener('click', () => {
  document.getElementById('tab-records-btn').classList.add('active');
  document.getElementById('tab-prices-btn').classList.remove('active');
  document.getElementById('panel-records').style.display = 'block';
  document.getElementById('panel-prices').style.display = 'none';
});

document.getElementById('tab-prices-btn').addEventListener('click', () => {
  document.getElementById('tab-prices-btn').classList.add('active');
  document.getElementById('tab-records-btn').classList.remove('active');
  document.getElementById('panel-prices').style.display = 'block';
  document.getElementById('panel-records').style.display = 'none';
  loadPrices();
});

// ── Prices ────────────────────────────────────────────────────────────────
async function loadPrices() {
  try {
    const res = await fetch('/api/prices');
    const data = await res.json();
    const prices = data.prices || {};
    const names = data.names || {};
    const settings = data.settings || {};
    
    document.getElementById('setting_shipping_fee').value = settings['shipping_fee'] || 0;
    document.getElementById('setting_handling_fee').value = settings['handling_fee'] || 0;

    const grid = document.getElementById('prices-grid');
    
    grid.innerHTML = CRYSTALS.map(c => {
      const currentName = names[c.id] || c.name;
      return `
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:.75rem; padding:1rem; display:flex; align-items:center; gap:.75rem;">
        <canvas data-bead="${c.id}" width="40" height="40" style="border-radius:50%; flex-shrink:0;"></canvas>
        <div style="flex:1;">
          <input type="text" name="name_${c.id}" value="${currentName}" style="width:100%; font-size:.9rem; font-weight:600; color:var(--gold-light); background:rgba(0,0,0,.2); border:1px solid var(--glass-border); border-radius:.4rem; padding:.2rem .4rem; margin-bottom:.4rem;" placeholder="水晶名稱">
          <div style="display:flex; align-items:center; gap:.5rem;">
            <span style="color:var(--text-muted); font-size:.85rem;">NT$</span>
            <input type="number" name="price_${c.id}" value="${prices[c.id] || 0}" min="0" style="width:100%; padding:.4rem; border-radius:.5rem; border:1px solid var(--glass-border); background:rgba(0,0,0,.2); color:var(--text); text-align:right;">
          </div>
        </div>
      </div>
    `}).join('');
    
    if (window.CrystalBead) {
      grid.querySelectorAll('canvas[data-bead]').forEach(cv => {
        CrystalBead.draw(cv, cv.dataset.bead, 40);
      });
    }
  } catch (err) {
    showToast('載入價格失敗', 'error');
  }
}

document.getElementById('price-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-save-prices');
  btn.textContent = '儲存中...';
  btn.disabled = true;
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  
  const payload = { prices: {}, names: {}, settings: {} };
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('setting_')) {
      payload.settings[key.replace('setting_', '')] = value;
    } else if (key.startsWith('name_')) {
      payload.names[key.replace('name_', '')] = value.trim();
    } else if (key.startsWith('price_')) {
      payload.prices[key.replace('price_', '')] = value;
    }
  }
  
  try {
    const res = await fetch('/api/admin/prices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': adminPassword
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error('儲存失敗');
    showToast('價格設定已儲存！', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.textContent = '儲存設定';
    btn.disabled = false;
  }
});
