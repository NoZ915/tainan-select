# 停機搬遷的維修模式

維修模式預設關閉。此變更只提供開關與頁面，不會自行停止線上服務。

## 啟用

1. 在目前對外的後端設定 `MAINTENANCE_MODE=true`，重新部署或重新啟動。除 `GET /health`（及對應的 HEAD）外，包含登入入口、OAuth callback、已登入請求、讀寫與靜態路徑皆回傳 `503`、`Cache-Control: no-store` 與 `Retry-After: 3600`。這不會清除既有登入 Cookie，但維修期間無法用它存取 API。
2. 在目前對外的前端設定 `VITE_MAINTENANCE_MODE=true`，重新建置並部署。所有路徑（包含課程、個人頁與登入 callback）皆顯示維修頁，不掛載原本的登入、查詢與課表同步流程。這是建置變數，僅改平台設定而不重建不會生效。
3. 確認正式網域顯示維修頁，直接請求 API 課程列表與登入入口皆為 `503`。已開啟的舊頁面在重新整理前可能仍顯示原畫面，但 API 開關會拒絕其操作。
4. 確認舊 API 部署已停止處理請求，並停止可能另行執行的爬蟲、匯入或其他資料寫入工作；等進行中的寫入完成後，才匯出最後一份資料備份。維修開關僅攔截 HTTP 請求，不會中止獨立腳本或已進行中的工作。

維修頁仍由前端提供 HTML；前端頁面本身可能回傳 `200`，API 才回傳 `503`。健康檢查保留 `200`，避免部署平台將正常提供維修回應的服務判定為故障。

## 恢復

1. 將最新資料匯入 Railway，保留舊資料庫與匯出備份，直到確認搬遷成功。
2. 在尚未承接正式流量的新環境驗證資料、登入、收藏、評論及課表。
3. 確認正式網域、API 來源與 Google callback 設定，切換流量。
4. 將新環境的 `MAINTENANCE_MODE` 與 `VITE_MAINTENANCE_MODE` 設為 `false`，分別重新啟動後端、重新建置部署前端，再確認正式入口可使用。

長期僅保留本機開發／測試與一套 Railway 正式環境；暫時測試環境與舊服務在正式切換穩定後清除。

## 本機預覽

在 `frontend` 執行（使用 Node.js 24）：

```bash
VITE_MAINTENANCE_MODE=true npm run dev
```

開啟 `http://localhost:5173`，亦可直接開啟 `/profile` 或 `/auth/google/callback`；應只顯示維修頁，沒有登入按鈕或業務 API 請求。

後端在既有本機環境設定完整的情況下執行：

```bash
MAINTENANCE_MODE=true npm run dev
```

確認 `/health` 回傳 `200`，`/api/courses`、`/api/auth/google` 與寫入請求皆回傳 `503`。取消變數或改為 `false` 後重新啟動，即恢復原本行為。
