require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { google } = require('googleapis');
const fs = require('fs');
const nodemailer = require('nodemailer');

let OpenAI;
try { OpenAI = require('openai').OpenAI; } catch (e) { /* fallback */ }

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Models Setup ─────────────────────────────────────────────────────────────
const apiKeys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(k => k);
const geminiModels = apiKeys.map(key => {
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
});

const openaiKeys = (process.env.OPENAI_API_KEY || '').split(',').map(k => k.trim()).filter(k => k);
const openaiClients = openaiKeys.map(key => OpenAI ? new OpenAI({ apiKey: key }) : null).filter(c => c);

async function generateWithFallback(prompt) {
  let errors = [];
  
  // 1. Try Gemini
  for (let i = 0; i < geminiModels.length; i++) {
    try {
      const result = await geminiModels[i].generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.warn(`[Gemini API] Key ${i + 1}/${geminiModels.length} failed:`, err.message);
      errors.push(`Gemini(${i+1}): ${err.message}`);
    }
  }

  // 2. Try OpenAI as fallback
  for (let i = 0; i < openaiClients.length; i++) {
    try {
      const response = await openaiClients[i].chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });
      return response.choices[0].message.content;
    } catch (err) {
      console.warn(`[OpenAI API] Key ${i + 1}/${openaiClients.length} failed:`, err.message);
      errors.push(`OpenAI(${i+1}): ${err.message}`);
    }
  }

  throw new Error("API 呼叫全數失敗。錯誤細節 -> " + errors.join(' | '));
}

// ── Google Sheets ─────────────────────────────────────────────────────────────
let sheetsClient = null;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SA_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  
  let authParams = { scopes: ['https://www.googleapis.com/auth/spreadsheets'] };
  
  if (process.env.GOOGLE_CREDENTIALS) {
    try {
      authParams.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    } catch(e) {
      console.error('[Sheets] Invalid GOOGLE_CREDENTIALS JSON format');
      return null;
    }
  } else if (SA_PATH && fs.existsSync(SA_PATH)) {
    authParams.keyFile = SA_PATH;
  } else {
    console.warn('[Sheets] Service account JSON not found!');
    return null;
  }

  const auth = new google.auth.GoogleAuth(authParams);
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

// Memory Cache for Prices and Settings
let storeCache = { prices: {}, names: {}, settings: {} };
let storeCacheTime = 0;

// AI 使用量計數器 (每日重置)
let aiUsage = {
  date: new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }),
  count: 0
};

async function getStoreData() {
  if (Date.now() - storeCacheTime < 60000) return storeCache; // Cache for 1 min
  const sheets = await getSheetsClient();
  if (!sheets) return storeCache;

  try {
    let pRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Prices!A:C' }).catch(() => null);
    if (!pRes) {
      pRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'PRICE!A:C' }).catch(() => ({ data: { values: [] } }));
    }
    
    let sRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Settings!A:B' }).catch(() => null);
    if (!sRes) {
      sRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'SETTINGS!A:B' }).catch(() => ({ data: { values: [] } }));
    }
    
    const prices = {}, names = {}, settings = {};
    if (pRes.data && pRes.data.values) {
      pRes.data.values.forEach(row => {
        if (row[0] && row[0] !== '水晶代號') {
          const rawId = row[0].toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
          let id = rawId;
          if (rawId === 'rosequartz') id = 'rose-quartz';
          if (rawId === 'blackobsidian' || rawId === 'black-obsidian') id = 'obsidian';
          if (rawId === 'clearquartz') id = 'clear-quartz';
          if (rawId === 'greenphantom' || rawId === 'green-phantom-quartz') id = 'green-phantom';
          if (rawId === 'smokyquartz') id = 'smoky-quartz';
          if (rawId === 'lapislazuli') id = 'lapis-lazuli';
          if (rawId === 'blacktourmaline') id = 'black-tourmaline';
          if (rawId === 'tigereye') id = 'tiger-eye';
          
          prices[id] = parseInt(row[2]) || 0;
          names[id] = row[1] || '';
        }
      });
    }
    if (sRes.data && sRes.data.values) {
      sRes.data.values.forEach(row => {
        if (row[0] && row[0] !== '設定項') settings[row[0]] = row[1];
      });
    }
    storeCache = { prices, names, settings };
    storeCacheTime = Date.now();
  } catch (err) {
    console.error('[Sheets] Error fetching store data:', err.message);
  }
  return storeCache;
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
請依照手圍尺寸（${wristLabel}）計算各個配石的「珠子數量」配置。為求靈性與能量的多元互補，每條手鍊請「搭配 2 到 5 種不同的水晶」（不用每次都只有兩種，可以更豐富）。總顆數須剛好符合手圍建議的總珠數（例如 15cm 手圍 8mm 珠子共約 20 顆）。
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

function generateMockResult({ name, gender, birthdate, birthtime, religion, wrist_size, demand }) {
  const wrist = parseFloat(wrist_size) || 15;
  const beads = Math.round((wrist * 10) / 8) + 1;
  return `---SECTION1---
【命理與流年分析】
這是一個測試的分析結果...
---SECTION2---
【水晶串珠推薦】
🔮 測試用紫水晶手鍊
• 核心功效：測試
• 適合原因：測試
• 水晶配方：紫水晶(${beads}顆)
• 珠數建議：總計 ${beads} 顆 8mm 珠子以符合 ${wrist} cm 手圍。
• 佩戴注意：測試
---SECTION3---
【神明加持推薦】
🙏 測試神明`;
}

function extractSection(text, start, end) {
  const startMarker = `---${start}---`;
  const endMarker = end ? `---${end}---` : null;
  const s = text.indexOf(startMarker);
  if (s === -1) return text;
  const from = s + startMarker.length;
  const to = endMarker ? text.indexOf(endMarker) : text.length;
  return text.slice(from, to !== -1 ? to : text.length).trim();
}

// ── API: 算命 ─────────────────────────────────────────────────────────────────
app.post('/api/reading', async (req, res) => {
  const { name, gender, birthdate, birthtime, religion, email, phone, wrist_size, crystal_picks, demand } = req.body;
  if (!name || !gender || !birthdate) return res.status(400).json({ error: '姓名、性別、出生日期為必填' });

  try {
    const today = new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' });
    if (aiUsage.date !== today) {
      aiUsage.date = today;
      aiUsage.count = 0;
    }

    const maxCalls = parseInt(storeCache.settings['MAX_AI_CALLS_PER_DAY'] || process.env.MAX_AI_CALLS_PER_DAY || '50');
    if (aiUsage.count >= maxCalls) {
      return res.status(429).json({ error: '非常抱歉，今日 AI 服務次數已達上限，請明日再試。' });
    }

    const prompt = buildPrompt({ name, gender, birthdate, birthtime, religion, wrist_size, email, phone, demand });
    let aiText;
    try {
      aiText = await generateWithFallback(prompt);
      aiUsage.count++;
      console.log(`[AI Usage] Today: ${aiUsage.count} / ${maxCalls}`);
    } catch (apiErr) {
      console.warn('[API] Fallback to mock result:', apiErr.message);
      const mockStr = generateMockResult({ name, gender, birthdate, birthtime, religion, wrist_size, demand });
      aiText = mockStr + `\n\n系統提示 (除錯用): API 失敗原因為 -> ${apiErr.message}`;
    }

    const sections = {
      analysis: extractSection(aiText, 'SECTION1', 'SECTION2'),
      crystals: extractSection(aiText, 'SECTION2', 'SECTION3'),
      deities: extractSection(aiText, 'SECTION3', null),
    };

    // Save to Google Sheets (Orders tab)
    const orderId = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
    const ts = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
    
    const sheets = await getSheetsClient();
    if (sheets) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Orders!A:Q',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [
          [orderId, ts, name, gender, birthdate, birthtime||'', religion||'', demand||'', wrist_size||'', crystal_picks||'', email||'', phone||'', '', '', '', '', aiText]
        ] },
      }).catch(e => console.error('[Sheets] Append failed:', e.message));
    }

    // Notice we return readingId = orderId so checkout can use it
    res.json({ success: true, id: orderId, sections });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI 分析失敗，請稍後再試' });
  }
});

// ── API: 結帳下單 ───────────────────────────────────────────────────────────
app.post('/api/order', async (req, res) => {
  const { readingId, email, phone, shipping_method, payment_method, address, items } = req.body;
  if (!readingId || !email || !phone || !shipping_method || !address || !items || !items.length) {
    return res.status(400).json({ error: '訂單資訊不完整' });
  }

  try {
    const sheets = await getSheetsClient();
    if (sheets) {
      // Find row in Orders sheet
      const response = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Orders!A:A' });
      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(r => r[0] === readingId);
      
      if (rowIndex !== -1) {
        // Update columns K (Email) to P (Order Details)
        // Row index in API is 1-based, so rowIndex + 1
        const targetRow = rowIndex + 1;
        const orderDetailsStr = items.map(i => `${i.name} x${i.qty}`).join(', ');
        
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Orders!K${targetRow}:P${targetRow}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [
            [email, phone, shipping_method, payment_method, address, JSON.stringify(items)]
          ] }
        });
      } else {
        console.warn(`[Order] Order ID ${readingId} not found in Sheets. Appending as new row.`);
        const ts = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: 'Orders!A:Q',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [
            [readingId, ts, 'Checkout User', '', '', '', '', '', '', '', email, phone, shipping_method, payment_method, address, JSON.stringify(items), '']
          ] },
        });
      }
    }

    // Send Email
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // TLS
        auth: { user: smtpUser, pass: smtpPass }
      });
      const itemsHtml = items.map(i => `<li>${i.name} x ${i.qty}<br><small style="color:#666">${i.details || ''}</small></li>`).join('');
      const mailOptions = {
        from: `"靈晶祝福" <${smtpUser}>`,
        to: email,
        subject: `【靈晶祝福】您的專屬水晶訂單已建立！`,
        html: `<h2>您好！</h2><p>感謝您使用靈晶祝福，我們已收到您的客製化水晶訂單。</p>
          <h3>🛍️ 您的訂單明細：</h3><ul>${itemsHtml}</ul><hr>
          <p><strong>寄送方式：</strong> ${shipping_method}</p>
          <p><strong>付款方式：</strong> ${payment_method}</p>
          <p><strong>收件地址/門市：</strong> ${address}</p><hr>
          <p>若有任何問題，請透過官方 LINE 與我們聯繫，祝您順心！</p>`
      };
      transporter.sendMail(mailOptions, (e, i) => e ? console.error('[Nodemailer]', e) : console.log('[Nodemailer] Sent:', i.messageId));
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Order Error]', err);
    res.status(500).json({ error: '訂單建立失敗，請稍後再試' });
  }
});

// ── API: 價格與設定 ─────────────────────────────────────────────────────────
app.get('/js/crystals.js', async (req, res) => {
  const crystalPath = path.join(__dirname, 'public/js/crystals_base.js');
  let content = fs.readFileSync(crystalPath, 'utf8');
  try {
    const data = await getStoreData();
    if (Object.keys(data.names).length > 0) {
      const overrides = Object.keys(data.names).map(id => `
        { const c = CRYSTALS.find(x => x.id === "${id}"); if (c) c.name = "${data.names[id].replace(/"/g, '\\"')}"; }
      `).join('');
      content += '\n// --- Dynamic Overrides ---\n' + overrides;
    }
  } catch (e) {}
  res.setHeader('Content-Type', 'application/javascript');
  res.send(content);
});

app.get('/api/prices', async (req, res) => {
  const data = await getStoreData();
  res.json(data);
});

// ── API: 查詢訂單 ────────────────────────────────────────────────────────────
app.get('/api/order/search', async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: '請提供電話號碼' });
  
  try {
    const sheets = await getSheetsClient();
    if (!sheets) return res.json([]);
    const response = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Orders!A:Q' });
    const rows = response.data.values || [];
    
    // Filter by phone (Column L, index 11) and ensure Order Details exist (Column P, index 15)
    const matches = rows.filter(r => r[11] === phone && r[15]).map(r => ({
      id: r[0],
      created_at: r[1],
      name: r[2],
      phone: r[11],
      shipping_method: r[12],
      payment_method: r[13],
      address: r[14],
      order_details: r[15],
    })).reverse(); // newest first
    
    res.json(matches);
  } catch(e) {
    res.status(500).json({ error: '查詢失敗' });
  }
});

// ── API: Debug ──────────────────────────────────────────────────────────────
app.get('/api/debug', async (req, res) => {
  const hasGemini = geminiModels.length > 0;
  const hasOpenAI = openaiClients.length > 0;
  const hasSheetId = !!SHEET_ID;
  const hasGoogleCreds = !!process.env.GOOGLE_CREDENTIALS;
  const hasSAPath = SA_PATH && fs.existsSync(SA_PATH);
  
  let sheetsStatus = 'not_initialized';
  try {
    const s = await getSheetsClient();
    sheetsStatus = s ? 'client_created' : 'client_null';
  } catch(e) {
    sheetsStatus = 'error: ' + e.message;
  }

  let geminiTestResult = 'Not tested';
  if (hasGemini) {
    try {
      const testModel = geminiModels[0];
      const resTest = await testModel.generateContent('ping');
      geminiTestResult = 'Success: ' + resTest.response.text();
    } catch (err) {
      geminiTestResult = 'Error: ' + err.message;
    }
  }

  res.json({
    ai: {
      gemini_configured: hasGemini,
      gemini_test_result: geminiTestResult,
      openai_configured: hasOpenAI,
      openai_keys_count: openaiKeys.length
    },
    google_sheets: {
      has_sheet_id: hasSheetId,
      has_google_credentials_env: hasGoogleCreds,
      has_sa_path_file: hasSAPath,
      status: sheetsStatus,
      storeCacheKeys: Object.keys(storeCache.prices).length
    },
    env_keys_present: {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      GOOGLE_CREDENTIALS: !!process.env.GOOGLE_CREDENTIALS
    }
  });
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ 靈晶祝福網站運行中 → http://localhost:${PORT}`));
