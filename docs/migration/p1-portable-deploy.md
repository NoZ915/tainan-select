# P1：部署相容性與隔離驗收

對應 [#105](https://github.com/NoZ915/tainan-select/issues/105)。本階段只修改程式、環境範例與文件；不部署、不執行 migration／爬蟲／回填、不連線正式 DB、不變更正式 DNS、不清理 Zeabur。[P0 放行清單](p0-audit.md)中的備份、隔離還原與憑證核對仍待完成；本 PR 合併不等於可直接進行資料操作或正式切換。

## 啟動與資料庫設定

- 前後端以 `package.json` 的 `engines.node=22.x` 與各自的 `.node-version` 指定 Node.js 22；平台若有版本覆寫設定，需一致選擇 22，並檢查建置日誌。原本未限制版本時，本機 Node.js 26 載入現有 JWT 相依套件會因 `SlowBuffer` 缺失失敗；本次固定執行環境，不升級登入相依套件。[Node.js 官方移除說明](https://nodejs.org/en/blog/release/v25.0.0)
- 後端根目錄為 `backend`；安裝 `npm ci`，部署啟動 `npm start`（`tsx server.ts`），開發監看 `npm run dev`。`tsx` 保留在正式相依套件，不需要事先編譯；ESM 與既有省略副檔名的 import 由 `tsx` 處理。不要以 `npm ci --omit=dev` 建置前端，前端建置需要 TypeScript／Vite。
- `config/config.ts` 與 sequelize-cli 共用 `config/config.cjs`。`NODE_ENV=production` 時，`DB_USERNAME`、`DB_PASSWORD`、`DB_NAME`、`DB_HOST`、`DB_PORT` 全部必填，沒有開發預設值；`DB_PORT` 必須為 1–65535 整數。CLI 額外指定 `--env production` 時也會驗證，即使 shell 的 `NODE_ENV` 是 development。
- `development` 保留既有本機預設帳號、空密碼、`TainanSelect(STG)`、localhost、3306 及連線池上限 3。production 的連線池同樣為 3；不修改 schema、不自動呼叫 `sync()`，啟動指令也不串接 migration。
- `PORT` 採平台提供的值，未設定預設為 3000；監聽 `0.0.0.0`。先成功驗證 DB 連線才開放 HTTP；DB 或連接埠啟動失敗會結束並回傳非零狀態，日誌不輸出原始連線錯誤或憑證。設定驗證錯誤只列變數名稱與要求。
- `/health` 回傳 `200 {"status":"ok"}`，禁止快取、不查使用者資料；代表程序已通過啟動時 DB 驗證，不代表持續監測 DB 可用性、schema 完整性或登入功能。後續 Railway health check 路徑設為 `/health`。[Railway 官方說明](https://docs.railway.com/guides/healthchecks)

## 三種環境的設定

秘密值只放平台變數或本機未追蹤的 `.env`；下表的網域為設定範例，實際端點需由管理者核對。

| 項目 | 本機開發 | Zeabur 正式 | Railway／Cloudflare 隔離測試 |
| --- | --- | --- | --- |
| 後端 `NODE_ENV` | `development` | `production`；更新前核對完整變數 | `production`，不要使用 `staging` 作為 NODE_ENV |
| `PORT` | 3000 | 保留現有平台注入值 | Railway 注入值 |
| `TRUST_PROXY_HOPS` | 0 | 核對並保留實際代理層數 | 依測試流量路徑核對，不直接複製正式值 |
| 五個 `DB_*` | 本機開發 DB | 現有 Zeabur DB，全部明確設定 | 僅能操作隔離 DB 的獨立帳號與端點 |
| `FRONTEND_BASE_URL` | `http://localhost:5173` | `https://nutnselect.com`，以現有核准來源為準 | `https://staging.nutnselect.com` |
| `BACKEND_BASE_URL` | `http://localhost:3000/api` | `https://api.nutnselect.com/api` | `https://api-staging.nutnselect.com/api` |
| 前端 `VITE_API_BASE_URL` | `http://localhost:3000/api` | `https://api.nutnselect.com/api` | `https://api-staging.nutnselect.com/api` |
| Google client／secret、`ALLOWED_EMAIL_DOMAIN` | 開發憑證及允許網域 | 保留現有設定與正式 callback | 獨立測試 client、測試使用者與允許網域 |
| `JWT_SECRET` | 本機測試秘密 | 保留現有值；輪替另按 P0 計畫 | 獨立於正式環境的秘密 |
| `GOOGLE_SEARCH_API_KEY`／`GOOGLE_SEARCH_CX` | 需搜尋同步時設定 | 保留既有值 | 預設不配置、不觸發管理同步 |

後端啟動時驗證網址、Google 憑證與 JWT 秘密；`ALLOWED_EMAIL_DOMAIN` 留空時保留既有僅允許白名單的行為。production 的前後端網址必須為 HTTPS。前端來源只接受單一 origin，不接受 `*`、路徑或逗號清單；後端網址必須包含 `/api`。網址尾斜線會正規化，不會重複產生 callback 斜線。Zeabur 的既有 `npm start` 仍可使用；變更只移除部署不需要的監看程序。部署前仍需核對平台實際變數與啟動命令，不能以本機測試代替 Zeabur 驗收。

`TRUST_PROXY_HOPS` 僅接受非負整數；預設 0，不可設成 `true`。代理層數會影響 `req.ip` 與 OAuth 限流等判斷，必須確認外層代理覆寫轉送標頭，並檢查各種入口的跳數一致。增加 CDN 或繞過 CDN 的直連路徑後需重新核對。[Express 官方代理說明](https://expressjs.com/en/guide/behind-proxies/)

## OAuth、CORS 與 Cookie

- Google Authorized redirect URI 必須登記**後端**完整 callback：`https://api-staging.nutnselect.com/api/auth/google/callback`；登入完成後由後端導向**前端** `https://staging.nutnselect.com/auth/google/callback`。保留正式 client 的既有 URI，測試不要覆蓋正式設定。
- API 的 CORS 回傳指定的 `FRONTEND_BASE_URL` 與 `Access-Control-Allow-Credentials: true`，不回傳萬用來源。前端 Axios 已設定 `withCredentials: true`；自訂 session／analytics 標頭的 OPTIONS 預檢仍由 CORS 中介層處理。
- JWT 為七天、HttpOnly、production 使用 Secure、SameSite=Lax、Path=/，不設定 Domain；登出採相同 Cookie 屬性清除。OAuth state 也保留 Secure／Lax，路徑限 `/api/auth/google/callback`，Google 頂層 GET 重新導向可攜帶該 Cookie。
- 測試前後端需使用同一可註冊網域的 HTTPS 子網域。`*.pages.dev` 與 `*.up.railway.app` 屬於跨站組合，Lax Cookie 無法支援其背景 API 登入請求；平台預設網域可驗證靜態檔與 health，但不能當完整登入驗收。此階段保留既有 Cookie 策略；預覽站不要連正式 API，也不要為了測試放寬成任意 origin。[Cookie 屬性說明](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- OAuth state 與限流目前存在程序記憶體中；維持單一 API replica，重啟會使進行中的登入失效。多副本／共享儲存需另案處理。

## 前端靜態建置與深層路由

Cloudflare Pages 專案根目錄設為 `frontend`，建置 `npm ci && npm run build`，輸出目錄 `dist`。`VITE_API_BASE_URL` 必須在建置時指向隔離 API 並包含 `/api`，部署後更換變數必須重新建置；`VITE_*` 都是公開值，禁止放入秘密。`VITE_GOOGLE_CLIENT_ID` 保留為既有範例，目前前端程式未使用它。

前端不需要 Vite dev server 作為正式服務。專案未提供頂層 `404.html`，Cloudflare Pages 的預設 SPA 行為會將非靜態檔路徑交由 `index.html`，由 React Router 處理 `/timetable`、`/auth/google/callback` 等路由；保持這項條件，不新增破壞深層連結的 404 文件。[Cloudflare 官方 SPA 說明](https://developers.cloudflare.com/pages/configuration/serving-pages/)

本機 production build 與產物檢查不等於平台已完成路由驗收；後續測試部署仍需直接開啟／重新整理實際路由，並確認 JS、CSS、頭貼及 OAuth callback 載入正常。

## 本機檔案與外部副作用稽核

- `backend/public/avatars/1.png` 至 `10.png` 是版本控管靜態檔；目前只讀取檔案與儲存使用者選取的檔名，沒有上傳／寫入容器檔案流程。部署需包含 `public/avatars`；本次不引入 Volume 或儲存重構。
- `/reactions` 保留原靜態路由；repository 沒有追蹤對應圖片。正式平台可能有額外檔案，必須依 P0 清單核對、備份並在測試環境另外提供；本機路由存在不能證明正式圖示齊全。
- repository 未見內建排程器、寫檔流程或 API 啟動時自動執行爬蟲。`scrape`、`scrape:ewant`、五個 `backfill:*` 與 migration 是獨立手動指令，會連外或修改 DB，測試部署啟動命令不得串接它們；平台外排程仍需管理者盤點，禁止複製到 staging。
- API 業務寫入維持原行為，包含課程詳情的瀏覽紀錄、首次 OAuth 建立使用者、訪客快照清理及管理端搜尋同步。隔離依靠獨立 DB 權限、測試 Google client／JWT 與不配置搜尋 key；不新增可能意外改變正式業務行為的全域唯讀開關。

## 驗證方式與後續驗收

在各子目錄執行：

```bash
# backend
npm ci
npm test
./node_modules/.bin/tsc --noEmit

# frontend
npm ci
npm test
VITE_API_BASE_URL=https://api-staging.example.com/api npm run build
```

新增 `backend/tests/deployment/*.test.ts` 覆蓋 API／CLI DB 設定一致性、production 必填值、錯誤設定非零退出、HTTP health、靜態頭貼、CORS 預檢、OAuth callback／state／JWT Cookie、登出及 DB／連接埠啟動失敗。測試使用模擬 DB 驗證與 Google 身份，不連線真實 DB，不呼叫 Google。

2026-10-18（Asia/Taipei）以 Node.js 22.23.3 執行結果：

| 驗證 | 結果 |
| --- | --- |
| 後端 `npm test` | 46 項通過，包含新增的 9 項部署測試 |
| 後端 `tsc --noEmit` | 通過 |
| 前端 `npm test` | 23 項通過，包含測試用型別檢查 |
| 前端指定隔離 API 的 `npm run build` | 通過；Vite 提示主要 JS 超過 500 kB，效能拆包留待另案 |
| `dist` 產物檢查 | `index.html` 引用的 JS／CSS 齊全、無頂層 `404.html`，JS 包含指定隔離 API 且不含本機 API 網址 |
| `git diff --check` | 通過 |

後端型別檢查另於本機 Node.js 26 執行亦通過；Node.js 26 的完整 HTTP 測試因既有 JWT 相依套件載入失敗，部署及主要驗收均以已指定的 Node.js 22 為準。真實 MySQL、Google OAuth、Cloudflare Pages 與 Zeabur 平台驗收尚未執行。

後續部署驗收仍需：

- [ ] 完成 P0 備份／還原與憑證前置條件，並審查合併本 PR。
- [ ] 在隔離 DB 啟動 production API，確認 health、migration 集合、必要靜態檔及錯誤日誌；本次測試沒有證明真實 DB 可連線。
- [ ] 檢查 Zeabur 現有變數與啟動方式仍完整可用，記錄其部署驗收結果。
- [ ] 確認代理跳數、測試子網域 HTTPS 與 Google 測試 callback；直接開啟／重新整理前端深層連結，驗證登入、重新載入與登出。
- [ ] 只在隔離 DB 驗證有寫入的業務流程；保留正式設定與 Zeabur，正式 DNS 切換另行取得人工核准。
