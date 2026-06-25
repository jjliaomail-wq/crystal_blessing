# 靈晶祝福 (Crystal Blessing) 專案說明與操作手冊

> **給未來 AI 的系統提示 (AI Context & Instructions)**
> 
> **[專案目標]** 
> 這是一個名為「靈晶祝福 (Crystal Blessing)」的網頁應用程式。核心概念是「結合東方命理、五行學說與現代 AI 技術的客製化水晶能量推薦電商網站」。
> 
> **[給 AI 的開發與維護準則]**
> 1. **極致的視覺美學 (Premium UI/UX)**：網站風格為深空紫與星芒金搭配，廣泛使用 Glassmorphism (毛玻璃)、微動畫 (如星星背景、水晶星球旋轉)。任何新增的 UI 元件都必須符合這種神秘、高級、靈性的風格。
> 2. **響應式設計優先 (Mobile-First)**：由於多數使用者來自手機，所有排版必須確保在手機上的易讀性（例如：長篇報告切換的 Sticky Tabs 必須正常運作、卡片文字不能溢出、按鈕需滿版好點擊）。
> 3. **AI 容錯機制 (AI Fallback)**：核心功能依賴呼叫 AI 生成報告。預設使用 Google Gemini API，若失敗必須 fallback 到 OpenAI (GPT-4o-mini)，若全數失敗則提供 Mock 假資料，絕不能讓前端頁面卡死。
> 4. **輕量級資料庫 (Google Sheets Integration)**：訂單紀錄 (Orders)、價格管理 (Prices)、系統設定 (Settings) 皆透過 Google Sheets API 同步。若涉及資料庫操作，請針對 Google Sheets 的結構進行讀寫。
> 5. **遵守使用者全域規則**：使用者偏好「直接給程式碼、不廢話、專業且精確、使用繁體中文」。請嚴格遵守。
> 
> *如果你是未來接手此專案的 AI，請先閱讀以上準則，並根據下方的系統架構進行開發或修復。*

---

## 1. 網站概述
使用者可以透過填寫個人資訊（生辰八字）與祈願需求，獲得專屬的流年運勢分析、水晶手鍊配方建議，以及神明加持推薦，並直接在線上將專屬的推薦水晶加入購物車進行結帳。

## 2. 技術架構
* **前端 (Frontend)**：HTML5, CSS3 (Vanilla CSS, 不依賴 Tailwind), JavaScript (Vanilla)
* **後端 (Backend)**：Node.js + Express (`server.js`)
* **資料庫 (Database)**：Google Sheets API
* **AI 引擎**：Google Gemini API (主要) + OpenAI (備用)
* **通知系統**：Nodemailer (透過 Gmail SMTP 發送訂單確認信)

---

## 3. 核心功能與頁面介紹

### 📍 1. 祈願首頁 (`index.html` / `main.js`)
* **動態視覺**：首頁包含一個 3D 旋轉的「水晶星球系統」，背景有星空特效 (`stars.js`)。
* **祈願表單**：收集使用者基本資料（姓名、性別、出生年月日、手圍等）與祈願項目。
* **能量報告生成**：送出後呼叫 `/api/reading` 生成報告。結果區塊分為三個標籤頁（手機版會吸附置頂）：
  1. **🔯 能量分析**：流年與命格分析。
  2. **💎 水晶推薦**：AI 設計 2~4 條專屬「文謅謅名稱」的水晶手鍊配方，並附帶「🛒 加入購物車」按鈕。
  3. **🙏 神明加持**：推薦適合祈求的神明或守護天使。

### 📍 2. 水晶百科 (`crystals.html` / `crystals.js`)
* 展示所有可用的水晶種類，點擊跳出 Modal 顯示詳細五行屬性與功效，並可直接加入購物車。

### 📍 3. 購物車與結帳 (`cart.js`)
* **側邊欄設計**：點擊購物車圖示從右側滑出。自動計算商品小計、手續費、預計運費與總計。
* **結帳流程**：填寫收件與付款資訊後，系統會將訂單寫入 Google Sheets，並發送 HTML 格式的確認信。

### 📍 4. 查詢訂單
* 使用者輸入結帳時留下的「手機號碼」，系統會從 Google Sheets 撈取歷史訂單並顯示。

### 📍 5. 管理後台 (`admin.html` / `admin.js`)
* **商品定價管理**：同步 Google Sheets 的 `Prices` 工作表，調整單價與名稱。
* **系統設定**：同步 `Settings` 工作表，管理運費、手續費、每日 AI 限制次數等。
* **訂單匯出**：將 Google Sheets 中的訂單資料匯出查看。

---

## 4. 系統與後端整合細節

### 🔄 AI 容錯與提示詞 (Prompt) 機制
* 後端 (`server.js`) 中定義了極其詳細的 Prompt，要求 AI 輸出特定格式 (如 `---SECTION1---` 等)，以便前端解析為標籤頁。
* 要求 AI 必須針對祈願者的「手圍」精算水晶珠數，並產生富有靈性的商品名稱。

### 📊 Google Sheets 整合
專案使用服務帳號 (Service Account) 或 Credentials JSON 連結 Google Sheets：
1. **Orders**：記錄祈願資料、AI 分析文字、結帳明細。
2. **Prices**：動態定價來源，後端會在前端請求時，將覆蓋的價格注入 `crystals_base.js` 中。
3. **Settings**：全域變數存放區。

### 📧 Email 通知系統
* 結帳完成後，透過 `nodemailer` 發送排版精美的 HTML 訂單確認信給顧客。

---

## 5. 網站視覺與設計美學重點
* **色彩配置**：以深空紫 (`#0a0414`) 為底，搭配神秘紫 (`#7c3aed`) 與星芒金 (`#f59e0b`)。
* **排版特效**：重度使用毛玻璃效應 (`backdrop-filter: blur`)。
* **響應式 (RWD)**：特別針對手機版做了許多細節優化（如：防止 `body` 水平溢出的 `overflow-x: clip`、避免 Tabs 擋住內容的動態高度 Sticky 導覽列、防止卡片文字破版的 `word-break` 與 `flex-direction: column` 設定）。
