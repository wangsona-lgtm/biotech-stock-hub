# BIO·PULSE 台美日生技股情與金主聯盟終端

模仿 `semiconductor-stock-hub` 架構打造之 **零後端靜態生技股情分析終端**，採用「**靜態 HTML/Canvas 前端 + Python 自動化資料管線 + GitHub Actions 定時部署**」，無須付費伺服器即可每日自動更新台股上市櫃、美股、日股報價、技術指標、2025 至今季度財報與新聞，並深度整合：

1. **🏦 上市櫃「金主爸爸」轉投資與持股比例**
   - 清楚標註每檔生技標的背後的上市櫃母公司／策略法人股東（如鴻海/鴻準 `2354` 入股台康生技、統一企業 `1216` 轉投資神隆與葡萄王、廣達 `2382` 入股長佳智能、保瑞 `6472` 與潤泰入股泰福-KY、台耀 `4746` 創設台新藥、晟德 `4123` 轉投資順藥/博晟/益安/永昕、台灣東洋 `4105` 轉投資智擎、中天 `4128`/富邦/台新發起鑽石投資等）與持股比例。
2. **🌏 美國・日本合作 / MOU 備忘錄 / 授權動態**
   - 獨立標記每檔標的之日本合作（JCR 策略入股、Alfresa 合資、CMIC ADC MOU、藤本製藥、鳥居製藥、養樂多、Terumo、PMDA 認證）、美國合作（BD MOU、Sanofi、Harrow、Sandoz、GeneFab、IDEXX、Akebia、UNC、FDA 藥證）與簽署 MOU / 合資 (JV) 狀態。

---

## 完整建站 SOP（標準作業流程）

### Step 1：準備專案與設定追蹤標的
1. 編輯 `config/stocks_config.json`，定義：
   - `segments`：生技次產業分類（7 大分群）
   - `stocks`：標的代號（台股上市 `.TW`、上櫃 `.TWO`、美股、日股 `.T`）、`capital_backers`（上市櫃金主與轉投資比例）、`intl_coop`（日本/美國合作與 MOU）、`revenue_mix`、`news_query`。

### Step 2：執行 Python 自動化資料管線
於專案根目錄執行（無須額外安裝第三方套件，純 Python 3.11+ 標準庫即可運行）：
```bash
python scripts/fetch_stocks.py
```
腳本會自動向 **TWSE**（`BWIBBU_ALL`）、**TPEx**（`tpex_mainboard_peratio_analysis`）、**Yahoo Finance**（2 年 K 線、報價、季度財報）與 **Google News RSS** 抓取最新資料，計算均線/RSI/MACD/相對 `^NBI` 超額報酬，並輸出 `data/stocks.json` 與 `data/stocks.js`。

### Step 3：本機預覽與驗證
直接用瀏覽器開啟 `index.html`（透過 `data/stocks.js` 免 CORS 備援）或啟動本地伺服器預覽：
```bash
python -m http.server 8080
```
打開 `http://localhost:8080/` 即可驗證所有 5 個工作區分頁與 CSV 匯出功能。

### Step 4：推送至 GitHub 並啟用 GitHub Actions + Pages
1. 在 GitHub 建立新 Repository（例如 `biotech-stock-hub`），將 `biotech-stock-site/` 內所有檔案推送至 `main` 分支（含 `.github/workflows/update-data.yml`）。
2. 前往 Repo 的 **Settings → Actions → General → Workflow permissions**，勾選 **Read and write permissions**（讓 Actions 可將每日更新的 `data/stocks.json` 與 `data/stocks.js` 自動 Commit 回 `main`）。
3. 前往 **Settings → Pages → Build and deployment → Source**，選擇 **GitHub Actions**。
4. 前往 **Actions** 分頁，點選 `Update Biotech Stock Data & Deploy Pages` → **Run workflow** 即可立即執行首次抓價並發布上線！

---

## 每日自動排程（UTC+8 台灣時間）
- `06:30`：美股收盤後自動更新（`^NBI`、`LLY`、`REGN`、`HROW` 等）
- `16:00`：台股盤後初步更新（日 K 線、技術指標、最新新聞）
- `18:00`：台股估值補強更新（確保 TWSE / TPEx 當日 PE / PB / 殖利率完整入庫）

> ⚠️ 本網站數據、轉投資比例與技術訊號僅供研究與程式分析展示，不構成任何投資買賣建議；實際股東持股比例請以公開資訊觀測站最新公告為準。
