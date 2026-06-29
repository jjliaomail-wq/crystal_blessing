require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const key = process.env.GEMINI_API_KEY.split(',')[0].trim();
const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Simplified version of the prompt from server.js
const prompt = `你是一位精通中國傳統命理學、五行學說與水晶能量學的大師。

【祈願者資訊】
- 姓名：測試
- 性別：男
- 出生日期：1990-01-01
- 出生時辰：子時
- 宗教信仰：無特定
- 手圍尺寸：15 cm
- 祈求需求：事業

請根據以上資訊，以繁體中文回答，分三個段落輸出（使用以下格式，不要有多餘的 markdown 符號，但可以用 emoji）：

---SECTION1---
【命理與流年分析】
分析五行屬性。

---SECTION2---
【水晶串珠推薦】
🔮 [手鍊名稱]
• 核心功效：[描述]
• 適合原因：[描述]
• 水晶配方：紫水晶(10顆)、白水晶(10顆)
• 珠數建議：總計 20 顆 8mm 珠子以符合 15 cm 手圍。
• 佩戴注意：[注意事項]

---SECTION3---
【神明加持推薦】
🙏 [神明名稱]
• 信仰體系：
• 職司：
• 與命格關聯：
• 搭配水晶：
• 供奉建議：`;

console.log('Sending prompt to Gemini...');
console.time('AI Response Time');

model.generateContent(prompt).then(r => {
  console.timeEnd('AI Response Time');
  const text = r.response.text();
  console.log('\n=== RAW AI TEXT (first 2000 chars) ===');
  console.log(text.substring(0, 2000));
  console.log('\n=== SECTION MARKERS CHECK ===');
  console.log('Has ---SECTION1---:', text.includes('---SECTION1---'));
  console.log('Has ---SECTION2---:', text.includes('---SECTION2---'));
  console.log('Has ---SECTION3---:', text.includes('---SECTION3---'));
  
  // Also check for variations
  console.log('\nHas SECTION1 (no dashes):', text.includes('SECTION1'));
  console.log('Has 【命理', text.includes('【命理'));
  console.log('Has 【水晶', text.includes('【水晶'));
  console.log('Has 【神明', text.includes('【神明'));
}).catch(e => {
  console.timeEnd('AI Response Time');
  console.error('ERROR:', e.message);
});
