/**
 * crystal-bead.js
 * 用 Canvas 繪製逼真水晶珠，模仿圖片中的玻璃球效果
 */

const BEAD_CONFIGS = {
  'amethyst':        { base: '#9b59b6', mid: '#7c3aed', dark: '#4a1d7e', shine: '#e8d5ff', inner: '#c084fc', style: 'solid' },
  'rose-quartz':     { base: '#f4a0b5', mid: '#e879a5', dark: '#c2536a', shine: '#ffd6e7', inner: '#fba4c0', style: 'milky' },
  'obsidian':        { base: '#2d1b3d', mid: '#111827', dark: '#050508', shine: '#6b4e80', inner: '#3b2350', style: 'dark' },
  'clear-quartz':    { base: '#e8e4f5', mid: '#c9c3e8', dark: '#9b93c8', shine: '#ffffff', inner: '#f0eeff', style: 'clear' },
  'citrine':         { base: '#f5c842', mid: '#d97706', dark: '#92400e', shine: '#fff7c2', inner: '#fde68a', style: 'golden' },
  'moonstone':       { base: '#cfe8f7', mid: '#93c5fd', dark: '#3b82f6', shine: '#ffffff', inner: '#dbeafe', style: 'opal' },
  'labradorite':     { base: '#34d399', mid: '#059669', dark: '#064e3b', shine: '#a7f3d0', inner: '#6ee7b7', style: 'iridescent' },
  'aquamarine':      { base: '#7dd3fc', mid: '#0ea5e9', dark: '#075985', shine: '#e0f2fe', inner: '#bae6fd', style: 'blue' },
  'tiger-eye':       { base: '#d4a04a', mid: '#b45309', dark: '#6b3109', shine: '#fde68a', inner: '#f59e0b', style: 'tiger' },
  'green-phantom':   { base: '#4ade80', mid: '#16a34a', dark: '#14532d', shine: '#bbf7d0', inner: '#86efac', style: 'phantom' },
  'rhodonite':       { base: '#fb7185', mid: '#e11d48', dark: '#881337', shine: '#ffd6e0', inner: '#fda4af', style: 'rosy' },
  'smoky-quartz':    { base: '#a08060', mid: '#78350f', dark: '#3c1a06', shine: '#d9c8b0', inner: '#c4a882', style: 'smoky' },
  'moldavite':       { base: '#4ade80', mid: '#15803d', dark: '#14532d', shine: '#d1fae5', inner: '#6ee7b7', style: 'green' },
  'sodalite':        { base: '#6088e8', mid: '#1d4ed8', dark: '#1e3a8a', shine: '#dbeafe', inner: '#93c5fd', style: 'lapis' },
  'malachite':       { base: '#4ade80', mid: '#059669', dark: '#022c22', shine: '#d1fae5', inner: '#6ee7b7', style: 'malachite' },
  'garnet':          { base: '#f87171', mid: '#dc2626', dark: '#7f1d1d', shine: '#fecaca', inner: '#fca5a5', style: 'red' },
  'lapis-lazuli':    { base: '#4f80e1', mid: '#1e40af', dark: '#1e3a8a', shine: '#bfdbfe', inner: '#93c5fd', style: 'lapis' },
  'black-tourmaline':{ base: '#374151', mid: '#111827', dark: '#030712', shine: '#6b7280', inner: '#1f2937', style: 'dark' },
  'fluorite':        { base: '#c084fc', mid: '#7c3aed', dark: '#4c1d95', shine: '#ede9fe', inner: '#ddd6fe', style: 'purple' },
  'pyrite':          { base: '#f5c842', mid: '#ca8a04', dark: '#713f12', shine: '#fef9c3', inner: '#fde047', style: 'metallic' },
};

function drawCrystalBead(canvas, crystalId, size = 60) {
  const cfg = BEAD_CONFIGS[crystalId] || BEAD_CONFIGS['clear-quartz'];
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2, cy = size / 2, r = size / 2 - 1;

  // ── Outer shadow glow ─────────────────────────────────────────────────
  ctx.shadowBlur = size * 0.25;
  ctx.shadowColor = cfg.mid + '88';
  
  // ── Base sphere gradient ──────────────────────────────────────────────
  const baseGrad = ctx.createRadialGradient(cx * 0.65, cy * 0.6, r * 0.05, cx, cy, r);
  baseGrad.addColorStop(0, cfg.shine);
  baseGrad.addColorStop(0.15, cfg.base);
  baseGrad.addColorStop(0.5, cfg.mid);
  baseGrad.addColorStop(0.85, cfg.dark);
  baseGrad.addColorStop(1, '#000000cc');

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = baseGrad;
  ctx.fill();
  ctx.shadowBlur = 0;

  // ── Style-specific inner patterns ─────────────────────────────────────
  switch (cfg.style) {
    case 'clear': drawClearStyle(ctx, cx, cy, r, cfg); break;
    case 'tiger': drawTigerStyle(ctx, cx, cy, r, cfg, size); break;
    case 'phantom': drawPhantomStyle(ctx, cx, cy, r, cfg); break;
    case 'iridescent': drawIridescentStyle(ctx, cx, cy, r, cfg); break;
    case 'malachite': drawMalachiteStyle(ctx, cx, cy, r, cfg, size); break;
    case 'smoky': drawSmokyStyle(ctx, cx, cy, r, cfg); break;
    case 'opal': drawOpalStyle(ctx, cx, cy, r, cfg); break;
    case 'metallic': drawMetallicStyle(ctx, cx, cy, r, cfg, size); break;
    case 'milky': drawMilkyStyle(ctx, cx, cy, r, cfg); break;
    case 'lapis': drawLapisStyle(ctx, cx, cy, r, cfg, size); break;
    default: break;
  }

  // ── Highlight: main specular ──────────────────────────────────────────
  const hiGrad = ctx.createRadialGradient(cx * 0.55, cy * 0.42, 0, cx * 0.7, cy * 0.6, r * 0.4);
  hiGrad.addColorStop(0, 'rgba(255,255,255,0.92)');
  hiGrad.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  hiGrad.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = hiGrad;
  ctx.fill();

  // ── Secondary small specular ──────────────────────────────────────────
  const hi2 = ctx.createRadialGradient(cx * 0.58, cy * 0.44, 0, cx * 0.58, cy * 0.44, r * 0.14);
  hi2.addColorStop(0, 'rgba(255,255,255,0.98)');
  hi2.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hi2;
  ctx.fill();

  // ── Bottom rim light ──────────────────────────────────────────────────
  const rimGrad = ctx.createRadialGradient(cx * 1.3, cy * 1.6, r * 0.3, cx * 1.2, cy * 1.5, r * 0.8);
  rimGrad.addColorStop(0, 'rgba(255,255,255,0.18)');
  rimGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rimGrad;
  ctx.fill();

  ctx.restore();

  // ── Outer edge ring ───────────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

// ── Style helpers ─────────────────────────────────────────────────────────

function drawClearStyle(ctx, cx, cy, r, cfg) {
  // Internal cracks / inclusions
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i + 0.3;
    const len = r * (0.3 + Math.random() * 0.3);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r * 0.2, cy + Math.sin(angle) * r * 0.2);
    ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
    ctx.strokeStyle = 'rgba(200,190,255,0.25)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  ctx.restore();
}

function drawTigerStyle(ctx, cx, cy, r, cfg, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const bands = 7;
  for (let i = 0; i < bands; i++) {
    const y = -r + (2 * r / bands) * i;
    const w = Math.sqrt(Math.max(0, r * r - y * y)) * 2;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(180,83,9,0.18)' : 'rgba(250,200,50,0.12)';
    ctx.fillRect(cx - w / 2, cy + y, w, 2 * r / bands + 1);
  }
  ctx.restore();
}

function drawPhantomStyle(ctx, cx, cy, r, cfg) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  // Phantom triangle/pyramid inside
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.55);
  ctx.lineTo(cx - r * 0.4, cy + r * 0.35);
  ctx.lineTo(cx + r * 0.4, cy + r * 0.35);
  ctx.closePath();
  ctx.fillStyle = 'rgba(21,128,61,0.22)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(74,222,128,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawIridescentStyle(ctx, cx, cy, r, cfg) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const colours = ['rgba(52,211,153,0.3)', 'rgba(96,165,250,0.25)', 'rgba(196,181,253,0.25)', 'rgba(251,191,36,0.2)'];
  colours.forEach((col, i) => {
    const angle = (Math.PI * 2 / colours.length) * i;
    const g = ctx.createRadialGradient(
      cx + Math.cos(angle) * r * 0.4, cy + Math.sin(angle) * r * 0.4, 0,
      cx + Math.cos(angle) * r * 0.4, cy + Math.sin(angle) * r * 0.4, r * 0.7
    );
    g.addColorStop(0, col);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fill();
  });
  ctx.restore();
}

function drawMalachiteStyle(ctx, cx, cy, r, cfg, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(cx + (Math.random()-0.5) * r * 0.6, cy + (Math.random()-0.5) * r * 0.6, r * (0.2 + i * 0.12), 0, Math.PI * 2);
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(4,120,87,0.3)' : 'rgba(110,231,183,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawSmokyStyle(ctx, cx, cy, r, cfg) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const smokeGrad = ctx.createRadialGradient(cx * 0.8, cy * 1.2, 0, cx, cy, r);
  smokeGrad.addColorStop(0, 'rgba(60,26,6,0.5)');
  smokeGrad.addColorStop(0.6, 'rgba(120,80,40,0.15)');
  smokeGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = smokeGrad;
  ctx.fill();
  ctx.restore();
}

function drawOpalStyle(ctx, cx, cy, r, cfg) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ['rgba(196,181,253,0.3)', 'rgba(147,197,253,0.25)', 'rgba(110,231,183,0.2)', 'rgba(253,186,116,0.15)'].forEach((col, i) => {
    const g = ctx.createRadialGradient(
      cx + Math.cos(i * 1.5) * r * 0.35, cy + Math.sin(i * 1.5) * r * 0.35, 0,
      cx + Math.cos(i * 1.5) * r * 0.35, cy + Math.sin(i * 1.5) * r * 0.35, r * 0.6
    );
    g.addColorStop(0, col);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fill();
  });
  ctx.restore();
}

function drawMetallicStyle(ctx, cx, cy, r, cfg, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  // Cubic face reflections
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * r * 0.8, cy + Math.sin(angle) * r * 0.8);
    ctx.strokeStyle = 'rgba(254,249,195,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawMilkyStyle(ctx, cx, cy, r, cfg) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const milkGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  milkGrad.addColorStop(0, 'rgba(255,255,255,0.35)');
  milkGrad.addColorStop(0.7, 'rgba(255,200,220,0.1)');
  milkGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = milkGrad;
  ctx.fill();
  ctx.restore();
}

function drawLapisStyle(ctx, cx, cy, r, cfg, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  // Gold flecks
  for (let i = 0; i < 8; i++) {
    const fx = cx + (Math.random() - 0.5) * r * 1.4;
    const fy = cy + (Math.random() - 0.5) * r * 1.4;
    ctx.beginPath();
    ctx.arc(fx, fy, Math.random() * 2 + 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(250,204,21,0.7)';
    ctx.fill();
  }
  ctx.restore();
}

// ── Public API ────────────────────────────────────────────────────────────
window.CrystalBead = { draw: drawCrystalBead };
