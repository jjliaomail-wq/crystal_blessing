require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const Database = require('better-sqlite3');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { google } = require('googleapis');
const ExcelJS = require('exceljs');
const fs = require('fs');
const nodemailer = require('nodemailer');

let OpenAI;
try { OpenAI = require('openai').OpenAI; } catch (e) { /* fallback if not installed */ }

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── DB ──────────────────────────────────────────────────────────────────────
if (!fs.existsSync('./db')) fs.mkdirSync('./db');
const db = new Database('./db/readings.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS readings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT,
    gender        TEXT,
    birthdate     TEXT,
    birthtime     TEXT,
    religion      TEXT,
    email         TEXT,
    phone         TEXT,
    wrist_size    TEXT,
    crystal_picks TEXT,
    ai_result     TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 填補舊表缺少的欄位（版本遷移）
try { db.exec('ALTER TABLE readings ADD COLUMN phone TEXT'); } catch {}
try { db.exec('ALTER TABLE readings ADD COLUMN wrist_size TEXT'); } catch {}
try { db.exec('ALTER TABLE readings ADD COLUMN crystal_picks TEXT'); } catch {}
try { db.exec('ALTER TABLE readings ADD COLUMN order_details TEXT'); } catch {}
try { db.exec('ALTER TABLE readings ADD COLUMN shipping_method TEXT'); } catch {}
try { db.exec('ALTER TABLE readings ADD COLUMN payment_method TEXT'); } catch {}
try { db.exec('ALTER TABLE readings ADD COLUMN address TEXT'); } catch {}
try { db.exec('ALTER TABLE readings ADD COLUMN demand TEXT'); } catch {}

db.exec(`
  CREATE TABLE IF NOT EXISTS crystal_prices (
    crystal_id TEXT PRIMARY KEY,
    name TEXT,
    price INTEGER DEFAULT 0
  )
`);
try { db.exec('ALTER TABLE crystal_prices ADD COLUMN name TEXT'); } catch {}
db.exec(`
  CREATE TABLE IF NOT EXISTS store_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

// ── Models Setup ─────────────────────────────────────────────────────────────
const apiKeys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(k => k);
const geminiModels = apiKeys.map(key => {
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
});

const openaiKeys = (process.env.OPENAI_API_KEY || '').split(',').map(k => k.trim()).filter(k => k);
const openaiClients = openaiKeys.map(key => OpenAI ? new OpenAI({ apiKey: key }) : null).filter(c => c);

async function generateWithFallback(prompt) {
  let lastError;
  
  // 1. Try Gemini
  for (let i = 0; i < geminiModels.length; i++) {
    try {
      const result = await geminiModels[i].generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.warn(`[Gemini API] Key ${i + 1}/${geminiModels.length} failed:`, err.message);
      lastError = err;
    }
  }

  // 2. Try OpenAI
  for (let i = 0; i < openaiClients.length; i++) {
    try {
      const response = await openaiClients[i].chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });
      return response.choices[0].message.content;
    } catch (err) {
      console.warn(`[OpenAI API] Key ${i + 1}/${openaiClients.length} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("無可用或有效的 API Key");
}

// ── Google Sheets ─────────────────────────────────────────────────────────────
let sheetsClient = null;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SA_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  if (!SA_PATH || !fs.existsSync(SA_PATH)) {
    console.warn('[Sheets] Service account JSON not found, skipping Google Sheets.');
    return null;
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: SA_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  sheetsClient = google.sheets({ version: 'v4', auth });
  // Ensure header row exists
  try {
    const res = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A1:H1',
    });
  } catch(e) {}
  return sheetsClient;
}

function appendToSheet(row) {
  return getSheetsClient().then(sheets => {
    if (!sheets) return;
    return sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });
  }).catch(e => {
    console.error('[Sheets] Append failed:', e.message);
  });
}

// ── AI 能量分析 Prompt ───────────────────────────────────────────────────────────
function buildPrompt({ name, gender, birthdate, birthtime, religion, wrist_size, email, phone, demand }) {
  const genderLabel = { male: '男', female: '女', other: '其他' }[gender] || gender;
  const timeLabel = birthtime || '未知時辰';
  const religionLabel = religion || '無特定';
  const wristLabel = wrist_size ? `${wrist_size} cm` : '未知（預設 15 cm）';
  const emailStr = email || '未提供';
  const phoneStr = phone || '未提供';
  const today = new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' });

  return `你是一位精通中國傳統命理學、五行學說與水晶能量學的大師，同時熟悉各宗教的守護神明與祈禱文化。

【祈願者資訊】
- 姓名：${name}
- 性別：${genderLabel}
- 出生日期：${birthdate}
- 出生時辰：${timeLabel}
- 宗教信仰：${religionLabel}
- 手圍尺寸：${wristLabel}
- 手機號碼：${phoneStr}
- 電子信箱：${emailStr}
- 祈求需求：${demand || '一般開運'}
- 今日日期：${today}

請根據以上資訊，以繁體中文回答，分三個段落輸出（使用以下格式，不要有多餘的 markdown 符號，但可以用 emoji）：

---SECTION1---
【命理與流年分析】
1. 根據出生年月日推算天干地支、五行屬性（金木水火土各佔比例）、命格優缺點。
2. 流年運算：根據今日日期（${today}），分析祈願者今年、本月、今日的流年運勢，指出目前最缺乏的五行能量與需要補足的部分。
3. 號碼與靈動數分析：解析「手機號碼」的靈動數吉凶，以及「Email」字母組合的五行/靈數特性，並將其綜合進整體的能量缺漏評估中。

---SECTION2---
【水晶串珠推薦】
請根據流年與命格缺漏，以及祈願者的主要需求（${demand || '一般開運'}），設計 3 條專屬客製化水晶手鏈。
手鍊的名稱「絕對不要」只用「紫水晶手鍊」、「黃水晶手鍊」等無趣的分類名，請務必幫我取一個「文謅謅、典雅、富有靈性與意境的 4~6 字中文名稱」（例如：紫霞凝神手鍊、金沙聚富手繩、絳雪明眸手鍊、碧海平潮手環等）當作標題。
請依照手圍尺寸（${wristLabel}）計算各個配石的「珠子數量」配置。為求靈性與能量的多元互補，手鍊「可以不只兩種珠子，可以多種不同的水晶搭配」。總顆數須剛好符合手圍建議的總珠數（例如 15cm 手圍 8mm 珠子共約 20 顆）。
每條手鍊請精確使用以下格式輸出（請嚴格遵守，以便系統解析，水晶配方部分的水晶名稱請一定要和百科中的水晶名稱一致，例如：紫水晶、白水晶、黃水晶、粉水晶、黑曜石、月光石、拉長石、海藍寶、虎眼石、綠幽靈、紅紋石、茶晶、捷克隕石、蘇打石、孔雀石、石榴石、青金石、黑碧璽、螢石、黃鐵礦）：

🔮 [手鍊名稱]
• 核心功效：[描述此手鍊之主要功效]
• 適合原因：[結合流年、命格與需求，說明為何設計此手鍊]
• 水晶配方：[水晶名稱A]([數量]顆)、[水晶名稱B]([數量]顆)、[水晶名稱C]([數量]顆)...(可依需求增加)
• 珠數建議：總計 [總數量] 顆 8mm 珠子（[水晶名稱A] [數量A] 顆，[水晶名稱B] [數量B] 顆...）以符合 [手圍] cm 的手圍。
• 佩戴注意：[注意事項]

---SECTION3---
【神明加持推薦】
根據命格五行與宗教信仰（${religionLabel}），推薦 1～3 位適合祭拜或祈求的神明（若為基督/伊斯蘭信仰，則以守護天使/祈禱方式代替）。每位使用以下格式：

🙏 [神明名稱]
• 信仰體系：
• 職司：
• 與命格關聯：
• 搭配水晶：
• 供奉建議：`;
}

// ── Mock Fallback for Gemini ──────────────────────────────────────────────────
function generateMockResult({ name, gender, birthdate, birthtime, religion, wrist_size, email, phone, demand }) {
  const genderLabel = { male: '男', female: '女', other: '其他' }[gender] || gender;
  const wrist = parseFloat(wrist_size) || 15;
  const beads = Math.round((wrist * 10) / 8) + 1; // approx 8mm beads count
  const mainBeads = Math.round(beads * 0.7);
  const subBeads = beads - mainBeads;
  const today = new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' });

  return `---SECTION1---
【命理與流年分析】
親愛的 ${name}（${genderLabel}，生於 ${birthdate} ${birthtime || '吉時'}），您的命格呈現「水木相生」之局。
針對您的祈求需求【${demand || '一般開運'}】，您的氣場特別需要火、土能量來進行補足。
五行分佈：金：15%, 木：35%, 水：30%, 火：10%, 土：10%。
流年運算（以 ${today} 為準）：今年流年逢土金，加上本月星象變化，您目前的氣場特別容易流失穩定感與熱情，五行極度缺乏火、土能量，需要適時補足。
號碼與靈數分析：您的手機號碼靈動數偏木，信箱字首屬水，兩者相生但更加劇了缺乏火土的情形，因此更需借助水晶補強。

---SECTION2---
【水晶串珠推薦】

🔮 紫霞凝神手鍊
• 核心功效：提升智慧、安神助眠、防止負能量入侵。
• 適合原因：能平衡您流年過多的思緒，增強直覺力，開智慧。
• 水晶配方：紫水晶(${mainBeads}顆)、白水晶(${subBeads}顆)
• 珠數建議：總計 ${beads} 顆 8mm 珠子（紫水晶 ${mainBeads} 顆，白水晶 ${subBeads} 顆）以符合您 ${wrist} cm 的手圍。
• 佩戴注意：避免長時間曝曬。

🔮 金沙聚富手繩
• 核心功效：招財納福、提升自信、帶來正能量。
• 適合原因：補充您流年極度缺少的土能量，帶來穩定的財運與自信。
• 水晶配方：黃水晶(${mainBeads}顆)、虎眼石(${subBeads}顆)
• 珠數建議：總計 ${beads} 顆 8mm 珠子（黃水晶 ${mainBeads} 顆，虎眼石 ${subBeads} 顆）以符合您 ${wrist} cm 的手圍。
• 佩戴注意：以清水淨化。

🔮 碧海平潮手環
• 核心功效：平靜心緒、促進溝通表達、帶來清晰思維。
• 適合原因：為您的能量進行全面平衡與純化，穩住當下流年波動。
• 水晶配方：海藍寶(${mainBeads}顆)、白水晶(${subBeads}顆)
• 珠數建議：總計 ${beads} 顆 8mm 珠子（海藍寶 ${mainBeads} 顆，白水晶 ${subBeads} 顆）以符合您 ${wrist} cm 的手圍。
• 佩戴注意：定期淨化。

---SECTION3---
【神明加持推薦】

🙏 觀世音菩薩
• 信仰體系：佛教/民間信仰
• 職司：慈悲度苦、安穩心神
• 與命格關聯：與您的木行慈悲特質完美契合，可保流年平安順遂。
• 搭配水晶：紫水晶
• 供奉建議：以清水、鮮花供奉。`;
}

// ── API: 算命 ─────────────────────────────────────────────────────────────────
app.post('/api/reading', async (req, res) => {
  const { name, gender, birthdate, birthtime, religion, email, phone, wrist_size, crystal_picks, demand } = req.body;

  if (!name || !gender || !birthdate) {
    return res.status(400).json({ error: '姓名、性別、出生日期為必填' });
  }

  try {
    const prompt = buildPrompt({ name, gender, birthdate, birthtime, religion, wrist_size, email, phone, demand });
    let aiText;
    
    try {
      aiText = await generateWithFallback(prompt);
    } catch (apiErr) {
      console.warn('[API] All keys failed, falling back to mock result:', apiErr.message);
      aiText = generateMockResult({ name, gender, birthdate, birthtime, religion, wrist_size, email, phone, demand });
    }

    // Parse sections
    const sections = {
      analysis: extractSection(aiText, 'SECTION1', 'SECTION2'),
      crystals: extractSection(aiText, 'SECTION2', 'SECTION3'),
      deities: extractSection(aiText, 'SECTION3', null),
    };

    // Save to SQLite
    const stmt = db.prepare(
      'INSERT INTO readings (name, gender, birthdate, birthtime, religion, email, phone, wrist_size, crystal_picks, ai_result, demand) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const info = stmt.run(name, gender, birthdate, birthtime || '', religion || '', email || '', phone || '', wrist_size || '', crystal_picks || '', aiText, demand || '');

    // Save to Google Sheets (async, don't await to avoid delay)
    const summary = sections.crystals.substring(0, 200).replace(/\n/g, ' ');
    const ts = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
    const sheetReligion = religion ? `${religion} (${demand || '開運'})` : (demand || '開運');
    appendToSheet([ts, name, gender === 'male' ? '男' : gender === 'female' ? '女' : '其他', birthdate, birthtime || '', sheetReligion, email || '', summary]);

    res.json({ success: true, id: info.lastInsertRowid, sections });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI 分析失敗，請稍後再試' });
  }
});



// ── API: 結帳下單 ───────────────────────────────────────────────────────────
app.post('/api/order', (req, res) => {
  const { readingId, email, phone, shipping_method, payment_method, address, items } = req.body;
  
  if (!readingId || !email || !phone || !shipping_method || !address || !items || !items.length) {
    return res.status(400).json({ error: '訂單資訊不完整' });
  }

  try {
    // 1. Update SQLite
    const orderDetailsStr = JSON.stringify(items);
    const stmt = db.prepare(`
      UPDATE readings 
      SET email = ?, phone = ?, shipping_method = ?, payment_method = ?, address = ?, order_details = ?
      WHERE id = ?
    `);
    stmt.run(email, phone, shipping_method, payment_method, address, orderDetailsStr, readingId);

    // 2. Fetch user name for the email
    const row = db.prepare('SELECT name FROM readings WHERE id = ?').get(readingId);
    const userName = row ? row.name : '親愛的顧客';

    // 3. Send Email
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    
    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass }
      });

      const itemsHtml = items.map(i => `<li>${i.name} x ${i.qty}<br><small style="color:#666">${i.details || ''}</small></li>`).join('');

      const mailOptions = {
        from: `"靈晶祝福" <${smtpUser}>`,
        to: email,
        subject: `【靈晶祝福】您的專屬水晶訂單已建立！`,
        html: `
          <h2>您好，${userName}！</h2>
          <p>感謝您使用靈晶祝福，我們已收到您的客製化水晶訂單。</p>
          <h3>🛍️ 您的訂單明細：</h3>
          <ul>${itemsHtml}</ul>
          <hr>
          <p><strong>寄送方式：</strong> ${shipping_method}</p>
          <p><strong>付款方式：</strong> ${payment_method}</p>
          <p><strong>收件地址/門市：</strong> ${address}</p>
          <hr>
          <p>若有任何問題，請透過官方 LINE 與我們聯繫，祝您順心！</p>
        `
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error('[Nodemailer Error]', error);
        else console.log('[Nodemailer] Order email sent:', info.messageId);
      });
    } else {
      console.warn('[Nodemailer] SMTP_USER or SMTP_PASS not configured in .env. Skipping email sending.');
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Order Error]', err);
    res.status(500).json({ error: '訂單建立失敗，請稍後再試' });
  }
});

function extractSection(text, start, end) {
  const startMarker = `---${start}---`;
  const endMarker = end ? `---${end}---` : null;
  const s = text.indexOf(startMarker);
  if (s === -1) return text;
  const from = s + startMarker.length;
  const to = endMarker ? text.indexOf(endMarker) : text.length;
  return text.slice(from, to !== -1 ? to : text.length).trim();
}

// ── API: 管理後台 ──────────────────────────────────────────────────────────────
function adminAuth(req, res, next) {
  const pw = req.headers['x-admin-password'] || req.query.pw;
  if (pw !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: '密碼錯誤' });
  next();
}

app.get('/api/admin/readings', adminAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM readings ORDER BY created_at DESC').all();
  res.json(rows);
});

app.get('/api/admin/export/excel', adminAuth, async (req, res) => {
  const rows = db.prepare('SELECT * FROM readings ORDER BY created_at DESC').all();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('祈願紀錄');
  ws.columns = [
    { header: '編號',    key: 'id',            width: 8  },
    { header: '時間',    key: 'created_at',    width: 22 },
    { header: '姓名',    key: 'name',          width: 12 },
    { header: '性別',    key: 'gender',        width: 8  },
    { header: '生日',    key: 'birthdate',     width: 14 },
    { header: '時辰',    key: 'birthtime',     width: 10 },
    { header: '宗教信仰', key: 'religion',     width: 14 },
    { header: 'Email',   key: 'email',         width: 25 },
    { header: '手機/LINE', key: 'phone',       width: 18 },
    { header: '手圍(cm)', key: 'wrist_size',   width: 12 },
    { header: '祈願項目', key: 'demand',       width: 15 },
    { header: '水晶選配', key: 'crystal_picks', width: 30 },
    { header: '寄送方式', key: 'shipping_method', width: 12 },
    { header: '付款方式', key: 'payment_method', width: 12 },
    { header: '收件地址', key: 'address',      width: 30 },
    { header: '訂單明細', key: 'order_details', width: 40 },
    { header: 'AI推薦',  key: 'ai_result',     width: 60 },
  ];
  ws.getRow(1).font = { bold: true };
  rows.forEach(r => ws.addRow({ ...r, gender: r.gender === 'male' ? '男' : r.gender === 'female' ? '女' : '其他' }));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="readings.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

// ── API: 水晶價格管理 ────────────────────────────────────────────────────────
app.get('/js/crystals.js', (req, res) => {
  const crystalPath = path.join(__dirname, 'public/js/crystals_base.js');
  let content = fs.readFileSync(crystalPath, 'utf8');
  
  try {
    const rows = db.prepare('SELECT crystal_id, name FROM crystal_prices WHERE name IS NOT NULL AND name != ""').all();
    if (rows.length > 0) {
      const overrides = rows.map(r => `
        { const c = CRYSTALS.find(x => x.id === "${r.crystal_id}"); if (c) c.name = "${r.name.replace(/"/g, '\\"')}"; }
      `).join('');
      content += '\n// --- Dynamic Overrides ---\n' + overrides;
    }
  } catch (e) {}
  
  res.setHeader('Content-Type', 'application/javascript');
  res.send(content);
});

app.get('/api/prices', (req, res) => {
  const rows = db.prepare('SELECT crystal_id, price, name FROM crystal_prices').all();
  const prices = {};
  const names = {};
  rows.forEach(r => {
    prices[r.crystal_id] = r.price;
    if (r.name) names[r.crystal_id] = r.name;
  });
  
  const settingsRows = db.prepare('SELECT key, value FROM store_settings').all();
  const settings = {};
  settingsRows.forEach(r => settings[r.key] = r.value);
  
  res.json({ prices, names, settings });
});

app.post('/api/admin/prices', adminAuth, (req, res) => {
  const data = req.body; 
  if (!data || typeof data !== 'object') return res.status(400).json({ error: '無效的資料格式' });

  const prices = data.prices || {};
  const names = data.names || {};
  const settings = data.settings || {};

  const stmtPrice = db.prepare('INSERT INTO crystal_prices (crystal_id, price, name) VALUES (?, ?, ?) ON CONFLICT(crystal_id) DO UPDATE SET price = excluded.price, name = excluded.name');
  const stmtSetting = db.prepare('INSERT INTO store_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  
  const updateMany = db.transaction(() => {
    // Collect all keys
    const allIds = new Set([...Object.keys(prices), ...Object.keys(names)]);
    for (const id of allIds) {
      stmtPrice.run(id, parseInt(prices[id], 10) || 0, names[id] || null);
    }
    for (const [key, value] of Object.entries(settings)) {
      stmtSetting.run(key, value.toString());
    }
  });

  try {
    updateMany();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '儲存失敗' });
  }
});

// ── API: 查詢訂單 ────────────────────────────────────────────────────────────
app.get('/api/order/search', (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: '請提供電話號碼' });
  
  const rows = db.prepare('SELECT * FROM readings WHERE phone = ? AND order_details IS NOT NULL ORDER BY created_at DESC').all(phone);
  res.json(rows);
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ 靈晶祝福網站運行中 → http://localhost:${PORT}`));
