# 核心流程 E2E 與登入後驗收

## 一次設定，之後重跑同一指令

使用 Node.js 24，在 `frontend` 執行：

```bash
npm ci
npx playwright install chromium
cp .env.e2e.example .env.e2e.local
```

預設測試本機，入口帳號與密碼可留空。若在遷移期間測試 staging，才需要在 `.env.e2e.local` 填入既有測試 Gateway 的入口帳號與密碼。這些是測試工具的設定，不使用 `VITE_*`，也不需要 Google 密碼、JWT 或資料庫帳密。`*.local` 已在 Git 忽略清單內。

啟動本機前後端後執行：

```bash
npm run test:e2e
```

需要看到操作畫面時執行 `npm run test:e2e -- --headed`。已安裝 Google Chrome 者，可將 `E2E_BROWSER_CHANNEL=chrome` 填入本機設定，使用既有瀏覽器而略過 Chromium 安裝。

預設連線 `http://localhost:5173` 與 `http://localhost:3000/api`。遷移期間可將 `E2E_BASE_URL` 設為 `https://staging.nutnselect.com`，並將 `E2E_API_BASE_URL` 設為 `https://api-staging.nutnselect.com/api`。設定會拒絕正式站；測試期間若前端嘗試呼叫正式站，也會攔截並報錯。測試不會啟動、部署或修改平台服務。

長期僅保留本機開發／測試與 Railway 正式站；staging 為遷移期間的暫時環境，待正式切換及必要驗證完成後移除，不另保留一套常駐測試服務。

測試本機時，請先啟動前後端，並讓後端的 `FRONTEND_BASE_URL`／`BACKEND_BASE_URL` 與 E2E 設定一致；本機 HTTP 開發環境不要求 Secure cookie，測試站 HTTPS 則會檢查。

## 自動驗證範圍

- 原生 HTTP 入口驗證、課程清單、實際搜尋、課程詳情及重新整理。
- 課表與功能許願的深層路由直接開啟、重新整理及頁面標題。
- 訪客無法寫入評論、收藏、課表，也無法使用管理功能。
- 前端登入按鈕至 Google 的導向、callback 與 state cookie 屬性；攔截 Google 請求後清除本次登入嘗試。
- 不得出現未捕捉的前端例外，也不得誤連正式站。

每個案例使用全新的瀏覽器 context，不載入個人登入狀態。Google 帳號登入及登入後的業務讀寫由下方清單驗收，不將登入入口導向成功視為完整登入通過。

課程詳情依現有功能可能記錄瀏覽次數，因此只對隔離資料庫執行。預設不錄製 trace、影片或截圖；產生的 `test-results` 與 `playwright-report` 已忽略，不提交入口帳密或測試資料。

## 登入後的最小手動清單

平常使用本機前端驗收。遷移期間若驗收 staging，在同一瀏覽器先開啟 [測試 API health](https://api-staging.nutnselect.com/health)，輸入入口帳密，再開啟 [測試前端](https://staging.nutnselect.com)。所有操作僅使用本機或測試站。

- [ ] **登入與保持登入**：用可登入台南選的 Google 帳號登入，確認返回測試站並顯示帳號；重新整理後仍保持登入。
- [ ] **收藏**：選一門尚未收藏的課程，加入後確認個人頁看得到；重新整理後仍存在，最後移除本次新增的收藏。
- [ ] **評論**：選一門自己尚未評論的課程，新增可辨識的測試評論；重新整理後仍存在，最後刪除本次新增的評論。
- [ ] **課表**：在相同學期加入一門不衝堂、原本不在課表的課程；重新整理後仍存在，最後移除本次新增的課程。
- [ ] **登出與權限**：登出後重新整理，確認回到訪客狀態且無法新增評論或收藏；非管理員帳號不能進入管理後台。

記錄執行日期、測試版本及每項通過／失敗即可；遇到錯誤保留訊息，不記錄 Google 密碼或 Cookie 值。完成上述檢查不代表已匯入最新正式資料、完成備份排程或正式切換。
