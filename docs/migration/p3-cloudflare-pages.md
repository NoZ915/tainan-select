# P3：Cloudflare Pages 測試前端

對應 [#107](https://github.com/NoZ915/tainan-select/issues/107)，承接已合併的 [P1／PR #112](https://github.com/NoZ915/tainan-select/pull/112)，與 [P2／PR #113](https://github.com/NoZ915/tainan-select/pull/113) 的 Railway 隔離環境配對。

**2026-10-19（Asia/Taipei）：本機設定與驗證完成，Cloudflare GitHub 整合尚待授權修復。** 建立 Pages 專案時回報 `8000011`，重新查詢帳號後仍無 Pages 專案；尚未部署、設定前端 DNS 或驗收瀏覽器登入。不得據此關閉 #107。

## 1. 專案範圍與前置條件

- 分支 `chore/migrate-p3-cloudflare-pages` 從 `main@a6d9f2f4a078ddad0d3dbaf0c295fa7b7f2c4093` 建立，與 P2 設定分開提交。
- Pages 的 `production` 環境代表此專案的主要測試前端，來源為 `main`；不代表正式流量已遷移。正式 `nutnselect.com` 與 Zeabur 設定不在本階段切換。
- Railway 測試入口為 `https://api-staging.nutnselect.com`，API、MySQL 維持私網，公開 Gateway 另有入口密碼。完整登入需前端 `https://staging.nutnselect.com` 與 API 的同站 HTTPS 子網域配對。
- P0 完整安全驗收、P2 定期備份及費用等待辦仍由原 Issue 追蹤；目前僅推進維護者已授權的測試環境工作。

## 2. Git 整合與建置設定

先在 Cloudflare Workers & Pages 建立 **Pages** 專案，連接 GitHub App「Cloudflare Workers & Pages」，僅授權必要儲存庫。`8000011` 為平台回報的 Git 安裝問題，目前已請維護者由 Dashboard 補上授權；修復後先重新查詢專案，避免重複建立。若仍失敗，依官方文件檢查安裝，重新安裝前先確認同一 App 是否供其他 Workers／Pages 使用。[官方 GitHub 整合與排錯](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)

以下為預定設定，尚未套用成功：

| 項目 | 設定 |
| --- | --- |
| 專案名稱 | `tainan-select-staging`，實際 `pages.dev` 網址以建立結果為準 |
| Repository／主要分支 | `NoZ915/tainan-select`／`main` |
| Root Directory | `frontend` |
| Build command | `npm ci && npm run build && node --input-type=module -e "$PAGES_STAGING_POSTBUILD"` |
| Output Directory | `dist`，相對 Root Directory |
| Build image／Node.js | V3／`NODE_VERSION=24`，需從平台建置日誌核對實際版本 |
| 相依套件安裝 | `SKIP_DEPENDENCY_INSTALL=1`，停用平台自動安裝，由命令明確執行 `npm ci` |
| Preview | 啟用同儲存庫分支預覽；推送 PR 分支後核對 commit、部署狀態及預覽 URL |
| 自動 PR 留言 | 關閉；保留平台部署檢查 |
| Functions／秘密／付費設定 | 本階段只有靜態產物，無新增 Functions、秘密或付費方案 |

Pages V3 以 `NODE_VERSION` 或 `.node-version` 選擇版本，不能僅依賴 `package.json` 的 engines。[官方建置環境](https://developers.cloudflare.com/pages/configuration/build-image/)

`production` 與 `preview` 均配置下列公開建置變數：

| 變數 | 值與用途 |
| --- | --- |
| `NODE_VERSION` | `24` |
| `SKIP_DEPENDENCY_INSTALL` | `1` |
| `VITE_API_BASE_URL` | `https://api-staging.nutnselect.com/api`，會進入瀏覽器 bundle |
| `PAGES_STAGING_POSTBUILD` | 完整複製 `frontend/scripts/prepare-pages-staging.mjs` 的文字內容，供上方建置命令執行；這段程式不含秘密 |

主要分支尚未包含本次新增腳本，因此初次建置使用平台變數中的腳本文字，確保 `main` 第一次部署就套用測試站限制。此變數不會自動跟隨 repository 檔案更新；修改腳本時，必須同步更新兩個環境的變數、逐字核對，並重新建置。不可只更新 repository 就假設平台已生效。

Google OAuth 在後端處理，前端不用填入 client secret、JWT、DB 或 Gateway 帳密；本輪也不配置未使用的 `VITE_GOOGLE_CLIENT_ID`。`VITE_*` 一律視為公開資訊。

## 3. 測試產物、路由與快取

`frontend/scripts/prepare-pages-staging.mjs` 只處理 `dist`：

- 僅接受 `CF_PAGES=1` 與指定的 Railway 測試 API；誤填正式 API 或其他來源時讓建置失敗。
- 移除首頁的正式 Google Analytics 載入及初始化程式，避免測試流量混入正式 GA。
- 新增 robots meta、`_headers` 的 `X-Robots-Tag: noindex, nofollow, noarchive`；覆寫產物 `robots.txt` 為禁止爬取，移除產物的正式 sitemap。
- 保留 Vite 應用程式入口與雜湊資產；原始 `index.html`、`public/robots.txt` 及 `public/sitemap.xml` 不受影響。
- 發現頂層 `404.html` 時拒絕建置，以保留 Pages 預設 SPA fallback；React Router 仍處理未知路徑到 `/404` 的導向。

沒有頂層 `404.html` 時，Pages 預設將未知路徑交回 SPA 入口，因此不額外新增全站 rewrite。部署後需實測 `/timetable`、`/wishlist`、`/course/測試課程代號` 與未知路徑的直接開啟／重新整理，以及 JS、CSS、頭貼等資產路徑；不存在的資產不可只看 HTTP 200，還須檢查內容類型。[SPA 與預設快取說明](https://developers.cloudflare.com/pages/configuration/serving-pages/)

先沿用 Pages 預設快取，不對 HTML 加長效快取；以實際回應核對 `Cache-Control`、ETag 與新部署後的內容。索引標頭不等於存取管制：前端靜態介面可公開，學生資料的 API 仍須通過既有 Gateway 入口驗證及應用程式權限，驗收報告不得公開個資。

## 4. 測試子網域與瀏覽器流程

1. Pages 的主要分支部署成功後，**先在 Pages 新增** `staging.nutnselect.com` 自訂網域。
2. 再由維護者於 Namecheap 新增 CNAME：Host `staging`，Value 為實際 Pages 專案的 `<專案名稱>.pages.dev`，TTL Automatic。只新增測試子網域，不更動根網域、`www`、nameservers 或既有 `api-staging` 紀錄。
3. 查核 DNS、Pages 網域狀態與 TLS 憑證，然後檢查首頁、深層路由、資產、索引標頭及 API 網址。
4. 同一瀏覽器先開啟 `https://api-staging.nutnselect.com/health`，用 repository 外受限檔案中的入口帳密通過驗證，再開測試前端。不得將入口密碼放入 URL、前端建置變數或公開報告。
5. 驗證首頁資料、訪客課表、Google 登入／返回、重新整理保持登入、登出，以及未授權狀態；同時觀察跨來源請求、Secure／SameSite cookie 與是否誤連正式 API。入口憑證跨來源傳遞仍須實際瀏覽器驗證，不能以 curl 成功代替。

外部 DNS 管理的子網域可用 CNAME 連接 Pages，無需搬移整個網域的 DNS；必須先在 Pages 關聯網域再新增紀錄。[官方自訂網域步驟](https://developers.cloudflare.com/pages/configuration/custom-domains/)

`pages.dev` 的 PR 預覽可以驗證靜態內容與 SPA 路由，但與 API 為跨站來源，且目前後端僅允許 `https://staging.nutnselect.com`。預覽網址不當作完整登入驗收，不為它放寬 CORS 或 SameSite。完整跨服務驗收由 #108 接續。

## 5. 本機驗證與尚待完成

以下命令均在 `frontend`、Node.js `24.22.0`／npm `11.19.1` 執行：

```bash
npm ci
npm test
node --test tests/deployment/pagesStagingBuild.test.mjs
VITE_API_BASE_URL=https://api-staging.nutnselect.com/api npm run build
CF_PAGES=1 VITE_API_BASE_URL=https://api-staging.nutnselect.com/api node scripts/prepare-pages-staging.mjs
```

2026-10-19 本機結果：既有 23 項測試及新增 3 項測試全部通過，TypeScript／Vite 建置成功。另核對實際產物使用指定測試 API、移除 GA／sitemap、含索引限制，且 HTML 引用的雜湊資產存在。Vite 仍有既有的大型 chunk 提醒；`npm ci` 回報既有 lockfile 共 36 個相依套件漏洞，本輪未更新相依套件。這些結果不代表平台部署或瀏覽器流程已通過。

| 驗收項目 | 狀態 |
| --- | --- |
| Node 24 本機建置、測試及產物檢查 | 通過 |
| Cloudflare GitHub 授權／Pages 專案 | 等待修復 `8000011`，尚未建立 |
| 平台 `main` 建置、來源 SHA、Node／安裝日誌 | 待部署後核對 |
| PR preview 自動部署、來源 SHA 與網址 | 待推送及平台驗證 |
| `staging.nutnselect.com` DNS／HTTPS | 尚未設定 |
| SPA 深層重新整理、404、資產與快取 | 本機產物條件通過；線上驗收待完成 |
| 瀏覽器 API／Cookie／OAuth／登出 | 待測試前端就緒後驗收，完整 E2E 接續 #108 |

完成平台操作後需回填部署 SHA、網址、驗證日期與不含敏感資料的結果，保留尚未驗收的項目，不能僅憑本機建置成功宣告 #107 完成。
