const CRYSTALS = [
  {
    id: 'amethyst',
    name: '紫水晶',
    en: 'Amethyst',
    emoji: '💜',
    element: '水',
    color: 'rgba(139,92,246,0.35)',
    badge: '#7c3aed',
    effects: '提升智慧、安神助眠、防止負能量入侵、增強直覺力',
    suited: '腦力工作者、創作人、睡眠不佳者、學生',
    bracelet: '主石：紫水晶 ✦ 配石：白水晶或月光石 ✦ 比例：7:3',
    deity: '文殊菩薩、太白金星',
    care: '避免長時間陽光直射（易退色），以月光或白水晶淨化',
    note: '佩戴於左手可增強能量吸收',
  },
  {
    id: 'rose-quartz',
    name: '粉水晶',
    en: 'Rose Quartz',
    emoji: '🌸',
    element: '火',
    color: 'rgba(251,113,133,0.3)',
    badge: '#f472b6',
    effects: '招桃花、增進人緣、促進愛情與自我接納、緩解情緒',
    suited: '渴望愛情者、人際關係需要改善者、心情憂鬱者',
    bracelet: '主石：粉水晶 ✦ 配石：芙蓉石或草莓晶 ✦ 比例：8:2',
    deity: '月老、觀世音菩薩',
    care: '以流水淨化、月光充能，忌曝曬',
    note: '心輪水晶，佩戴左手近心臟效果佳',
  },
  {
    id: 'obsidian',
    name: '黑曜石',
    en: 'Black Obsidian',
    emoji: '🖤',
    element: '水',
    color: 'rgba(30,20,50,0.6)',
    badge: '#1f2937',
    effects: '強力辟邪、阻擋負能量、防小人、排除體內濁氣',
    suited: '工作壓力大者、常接觸複雜人際者、容易感應負能量者',
    bracelet: '主石：黑曜石 ✦ 配石：白水晶（必備，平衡能量）✦ 比例：6:4',
    deity: '玄天上帝、鍾馗',
    care: '定期以海鹽水或煙燻法淨化，能量強烈需每週淨化',
    note: '能量強，體質敏感者初期可先少量佩戴',
  },
  {
    id: 'clear-quartz',
    name: '白水晶',
    en: 'Clear Quartz',
    emoji: '🤍',
    element: '金',
    color: 'rgba(220,220,255,0.2)',
    badge: '#9ca3af',
    effects: '淨化磁場、增強其他水晶能量、提升專注力、全面平衡',
    suited: '所有人（萬用水晶）、需要淨化環境者',
    bracelet: '可與任何水晶搭配，作為主石或配石均適合',
    deity: '玉皇大帝、觀世音菩薩',
    care: '白水晶可自行淨化，也可用陽光或月光充能',
    note: '萬用能量放大石，是入門水晶首選',
  },
  {
    id: 'citrine',
    name: '黃水晶',
    en: 'Citrine',
    emoji: '💛',
    element: '土',
    color: 'rgba(251,191,36,0.25)',
    badge: '#d97706',
    effects: '招財納福、提升自信、帶來正能量、促進事業發展',
    suited: '創業者、業務人員、財運需要加強者',
    bracelet: '主石：黃水晶 ✦ 配石：虎眼石或黃虎眼 ✦ 比例：7:3',
    deity: '財神爺（趙公明）、土地公',
    care: '可陽光充能，以清水淨化，避免海鹽（易損傷）',
    note: '稱為「商人之石」，適合放在收銀機旁',
  },
  {
    id: 'moonstone',
    name: '月光石',
    en: 'Moonstone',
    emoji: '🌙',
    element: '水',
    color: 'rgba(186,230,253,0.25)',
    badge: '#60a5fa',
    effects: '增強女性魅力、調和情緒週期、提升直覺、促進桃花',
    suited: '女性、情緒起伏大者、創作者、懷孕備孕者',
    bracelet: '主石：月光石 ✦ 配石：粉水晶或珍珠 ✦ 比例：7:3',
    deity: '太陰娘娘、月老',
    care: '月光下充能最佳，忌陽光直射，以清水淨化',
    note: '滿月時充能效果翻倍，女性佩戴特別有效',
  },
  {
    id: 'labradorite',
    name: '拉長石',
    en: 'Labradorite',
    emoji: '🌈',
    element: '木',
    color: 'rgba(52,211,153,0.2)',
    badge: '#059669',
    effects: '保護氣場、開啟靈性、防止能量流失、增強洞察力',
    suited: '靈性修行者、從事療癒工作者、需要保護氣場者',
    bracelet: '主石：拉長石 ✦ 配石：黑碧璽或白水晶 ✦ 比例：6:4',
    deity: '地藏菩薩、普賢菩薩',
    care: '月光淨化最佳，避免化學清潔劑',
    note: '「神秘水晶」，在光線下展現彩虹光澤',
  },
  {
    id: 'aquamarine',
    name: '海藍寶',
    en: 'Aquamarine',
    emoji: '💙',
    element: '水',
    color: 'rgba(14,165,233,0.25)',
    badge: '#0284c7',
    effects: '平靜心緒、促進溝通表達、帶來清晰思維、海行守護',
    suited: '演說家、教師、溝通有困難者、海上工作者',
    bracelet: '主石：海藍寶 ✦ 配石：藍紋瑪瑙或白水晶 ✦ 比例：7:3',
    deity: '龍王、媽祖',
    care: '流水淨化，月光充能，避免長時間陽光照射',
    note: '古代航海者的護身符，促進溝通能力極佳',
  },
  {
    id: 'tiger-eye',
    name: '虎眼石',
    en: 'Tiger Eye',
    emoji: '🐯',
    element: '土',
    color: 'rgba(180,120,30,0.3)',
    badge: '#b45309',
    effects: '增強意志力、帶來好運與財氣、提升魄力、防邪避煞',
    suited: '需要增強行動力者、業務、管理職、創業者',
    bracelet: '主石：虎眼石 ✦ 配石：黃水晶或紅瑪瑙 ✦ 比例：6:4',
    deity: '關聖帝君、武財神',
    care: '陽光充能，流水清洗，能量持久',
    note: '「勇氣之石」，面試或重要場合佩戴增加氣場',
  },
  {
    id: 'green-phantom',
    name: '綠幽靈',
    en: 'Green Phantom Quartz',
    emoji: '💚',
    element: '木',
    color: 'rgba(74,222,128,0.2)',
    badge: '#16a34a',
    effects: '增強財運（偏財）、帶來事業機會、促進健康、凝聚正能量',
    suited: '渴望偏財與機遇者、事業起步階段者、健康需加強者',
    bracelet: '主石：綠幽靈 ✦ 配石：黃水晶或白水晶 ✦ 比例：7:3',
    deity: '財神爺、福德正神',
    care: '月光淨化為主，避免陽光（顏色偏淡者易退）',
    note: '內含幻影越清晰，能量越強，價值越高',
  },
  {
    id: 'rhodonite',
    name: '紅紋石',
    en: 'Rhodonite',
    emoji: '❤️',
    element: '火',
    color: 'rgba(239,68,68,0.25)',
    badge: '#dc2626',
    effects: '療癒心靈創傷、帶來無私之愛、增強自尊心、促進原諒',
    suited: '感情受傷者、需要療癒心靈者、自我認同感低者',
    bracelet: '主石：紅紋石 ✦ 配石：粉水晶或玫瑰輝石 ✦ 比例：7:3',
    deity: '觀世音菩薩、月老',
    care: '流水淨化，月光充能，避免海鹽',
    note: '「療癒之石」，適合冥想時握在手中',
  },
  {
    id: 'smoky-quartz',
    name: '茶晶（煙晶）',
    en: 'Smoky Quartz',
    emoji: '🤎',
    element: '土',
    color: 'rgba(120,80,40,0.3)',
    badge: '#78350f',
    effects: '吸收負能量、接地氣、消除壓力與焦慮、強化根輪',
    suited: '壓力過大者、思緒混亂者、需要接地能量者',
    bracelet: '主石：茶晶 ✦ 配石：黑曜石或黑碧璽 ✦ 比例：6:4',
    deity: '土地公、后土娘娘',
    care: '海鹽或煙燻淨化，陽光充能',
    note: '放在辦公桌或床頭可吸收環境負能量',
  },
  {
    id: 'moldavite',
    name: '捷克隕石',
    en: 'Moldavite',
    emoji: '🌿',
    element: '木',
    color: 'rgba(22,163,74,0.3)',
    badge: '#15803d',
    effects: '快速轉化命運、開啟靈性覺醒、加速業力清除、強力保護',
    suited: '靈性修行者、渴望人生重大改變者',
    bracelet: '主石：捷克隕石 ✦ 配石：白水晶（必備，緩和能量）✦ 比例：1:3',
    deity: '地藏菩薩、玉皇大帝',
    care: '月光淨化，忌海鹽與陽光（天然裂縫易受損）',
    note: '能量極強，初次佩戴可能感到頭暈，建議逐步配戴',
  },
  {
    id: 'sodalite',
    name: '蘇打石',
    en: 'Sodalite',
    emoji: '🔵',
    element: '水',
    color: 'rgba(37,99,235,0.25)',
    badge: '#1d4ed8',
    effects: '增強邏輯思維、促進自我表達、帶來冷靜理性、增強溝通',
    suited: '學生、研究人員、辯論者、需要理性決策者',
    bracelet: '主石：蘇打石 ✦ 配石：紫水晶或白水晶 ✦ 比例：7:3',
    deity: '文昌帝君、魁星',
    care: '月光或清水淨化，避免海鹽',
    note: '「智慧之石」，考試前佩戴特別推薦',
  },
  {
    id: 'malachite',
    name: '孔雀石',
    en: 'Malachite',
    emoji: '🟢',
    element: '木',
    color: 'rgba(5,150,105,0.3)',
    badge: '#059669',
    effects: '強力保護、吸收電磁波、帶來好運、促進轉變與成長',
    suited: '常使用電子設備者、需要心理保護者、正在經歷轉變者',
    bracelet: '主石：孔雀石 ✦ 配石：黑碧璽或拉長石 ✦ 比例：6:4',
    deity: '觀世音菩薩、木星神',
    care: '乾布輕拭，忌水淨化（含銅會與水反應），月光充能',
    note: '吸收負能量後顏色可能改變，及時淨化',
  },
  {
    id: 'garnet',
    name: '石榴石',
    en: 'Garnet',
    emoji: '🔴',
    element: '火',
    color: 'rgba(185,28,28,0.3)',
    badge: '#991b1b',
    effects: '增強活力與熱情、提振精神、增加行動力、招正財',
    suited: '體力不佳者、缺乏動力者、需要行動力的人',
    bracelet: '主石：石榴石 ✦ 配石：紅瑪瑙或虎眼石 ✦ 比例：7:3',
    deity: '關聖帝君、火德星君',
    care: '流水或月光淨化，陽光短暫充能',
    note: '「熱情之石」，運動前佩戴增強爆發力',
  },
  {
    id: 'lapis-lazuli',
    name: '青金石',
    en: 'Lapis Lazuli',
    emoji: '💙',
    element: '水',
    color: 'rgba(29,78,216,0.3)',
    badge: '#1e40af',
    effects: '開啟智慧、促進真實表達、帶來洞察力、連結高層靈性',
    suited: '靈性修行者、藝術家、領導者、需要開慧者',
    bracelet: '主石：青金石 ✦ 配石：白水晶或月光石 ✦ 比例：7:3',
    deity: '文殊菩薩、文昌帝君',
    care: '月光淨化，忌陽光（會使金星點退色），避免海鹽',
    note: '古埃及法老的聖石，連結第三眼與喉輪',
  },
  {
    id: 'black-tourmaline',
    name: '黑碧璽',
    en: 'Black Tourmaline',
    emoji: '⚫',
    element: '水',
    color: 'rgba(15,10,30,0.6)',
    badge: '#111827',
    effects: '終極防護石、阻擋電磁波與負能量、排毒、強化根輪',
    suited: '需要強力保護者、敏感體質者、工作環境複雜者',
    bracelet: '主石：黑碧璽 ✦ 配石：白水晶（必備）✦ 比例：1:1',
    deity: '玄天上帝、鍾馗',
    care: '流水或海鹽淨化，陽光充能，每週至少一次',
    note: '防護能力最強的黑色礦石之一，優於黑曜石',
  },
  {
    id: 'fluorite',
    name: '螢石',
    en: 'Fluorite',
    emoji: '🟣',
    element: '木',
    color: 'rgba(167,139,250,0.3)',
    badge: '#7c3aed',
    effects: '淨化思緒、增強專注力、改善學習效率、平衡情緒',
    suited: '學生、需要高度專注的工作者、注意力不集中者',
    bracelet: '主石：螢石 ✦ 配石：紫水晶或白水晶 ✦ 比例：7:3',
    deity: '文昌帝君、魁星',
    care: '流水淨化，月光充能，避免陽光（易褪色）',
    note: '顏色越深濃，能量越強，紫綠漸層螢石最為珍貴',
  },
  {
    id: 'pyrite',
    name: '黃鐵礦（愚人金）',
    en: 'Pyrite',
    emoji: '✨',
    element: '金',
    color: 'rgba(245,158,11,0.3)',
    badge: '#b45309',
    effects: '強力招財、提升商業直覺、帶來豐盛能量、增強意志力',
    suited: '商人、投資者、渴望財富積累者',
    bracelet: '主石：黃鐵礦 ✦ 配石：黃水晶或虎眼石 ✦ 比例：5:5',
    deity: '財神爺（趙公明）、武財神',
    care: '乾布輕拭，忌水（含鐵會氧化），陽光充能',
    note: '不適合直接接觸水，適合放在辦公室招財',
  },
];

// ── Render grid ───────────────────────────────────────────────────────────
const grid = document.getElementById('crystals-grid');
let currentFilter = 'all';

function renderGrid(filter) {
  if (!grid) return;
  const items = filter === 'all' ? CRYSTALS : CRYSTALS.filter(c => c.element === filter);
  grid.innerHTML = items.map(c => `
    <div class="crystal-item" data-id="${c.id}" style="--crystal-color:${c.color}">
      <canvas class="crystal-canvas" data-id="${c.id}" width="60" height="60"></canvas>
      <h3>${c.name}</h3>
      <p>${c.en}</p>
      <span class="crystal-element" style="background:${c.badge}22;color:${c.badge};border:1px solid ${c.badge}55;">
        ${c.element}行
      </span>
    </div>
  `).join('');

  // Draw beads after DOM update
  grid.querySelectorAll('.crystal-canvas').forEach(cv => {
    if (window.CrystalBead) CrystalBead.draw(cv, cv.dataset.id, 60);
  });

  grid.querySelectorAll('.crystal-item').forEach(el => {
    el.addEventListener('click', () => openModal(el.dataset.id));
  });
}

// ── Filter buttons ────────────────────────────────────────────────────────
const filterBar = document.getElementById('filter-bar');
if (filterBar) {
  filterBar.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterBar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid(btn.dataset.filter);
    });
  });
}

// ── Modal ─────────────────────────────────────────────────────────────────
const overlay = document.getElementById('modal-overlay');
const modalBody = document.getElementById('modal-body');

function openModal(id) {
  const c = CRYSTALS.find(x => x.id === id);
  if (!c) return;

  const glowColor = (c.mid || c.badge) + '88';

  modalBody.innerHTML = `
    <div style="text-align:center;margin-bottom:1.5rem;">
      <canvas id="modal-bead" width="100" height="100"
        style="display:block;margin:0 auto .75rem;filter:drop-shadow(0 0 18px ${glowColor})">
      </canvas>
      <h2 style="margin-top:.5rem;">${c.name} <span style="font-size:.9rem;color:var(--text-muted);">${c.en}</span></h2>
      <span class="crystal-element" style="background:${c.badge}22;color:${c.badge};border:1px solid ${c.badge}55;display:inline-block;margin-top:.25rem;">
        ${c.element}行
      </span>
    </div>
    <div class="modal-prop">
      <span class="modal-prop-label">✨ 功效</span>
      <span class="modal-prop-value">${c.effects}</span>
    </div>
    <div class="modal-prop">
      <span class="modal-prop-label">👤 適合對象</span>
      <span class="modal-prop-value">${c.suited}</span>
    </div>
    <div class="modal-prop">
      <span class="modal-prop-label">📿 串珠搭配</span>
      <span class="modal-prop-value">${c.bracelet}</span>
    </div>
    <div class="modal-prop">
      <span class="modal-prop-label">🙏 對應神明</span>
      <span class="modal-prop-value">${c.deity}</span>
    </div>
    <div class="modal-prop">
      <span class="modal-prop-label">🌊 保養方式</span>
      <span class="modal-prop-value">${c.care}</span>
    </div>
    <div class="modal-prop">
      <span class="modal-prop-label">💡 小知識</span>
      <span class="modal-prop-value">${c.note}</span>
    </div>
    <div style="text-align:center;margin-top:1.5rem;display:flex;justify-content:center;gap:.75rem;flex-wrap:wrap;">
      <a href="/" style="display:inline-block;padding:.65rem 1.5rem;background:linear-gradient(135deg,var(--purple),#9333ea);border-radius:.75rem;color:#fff;text-decoration:none;font-size:.9rem;">
        🔮 用此水晶祈願
      </a>
      <button class="btn-add-cart" onclick="if(typeof Cart!=='undefined'){Cart.addItem('${c.id}');Cart.showAddAnimation('${c.name}');const b=document.getElementById('cart-badge');if(b){b.classList.add('pulse');setTimeout(()=>b.classList.remove('pulse'),600)}}">
        🛒 加入購物車
      </button>
    </div>
  `;

  // Draw bead AFTER full innerHTML is set
  const modalBead = document.getElementById('modal-bead');
  if (modalBead && window.CrystalBead) CrystalBead.draw(modalBead, c.id, 100);

  overlay.classList.add('open');
}

document.getElementById('modal-close').addEventListener('click', () => overlay.classList.remove('open'));
overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

// Init
renderGrid('all');
