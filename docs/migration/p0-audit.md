# P0：遷移前盤點與放行清單

對應 [#104](https://github.com/NoZ915/tainan-select/issues/104)，母議題為 [#103](https://github.com/NoZ915/tainan-select/issues/103)。盤點日期：2026-10-17（Asia/Taipei）；程式基準：`4679ca3c0f6a3392a41c4fc8434d502c002d8eda`。分支：`chore/migrate-p0-audit`。

本次依維護者決定先完成盤點與操作清單；平台外加密儲存位置及隔離還原環境尚未指定，**尚未備份、還原或輪替憑證，P0 尚未驗收通過**。本次僅讀取程式、平台設定與公開 DNS，未連線正式 DB，未變更正式 DNS、部署或清理 Zeabur。

## 1. 現有服務與資料位置

「程式確認」只代表 repository 現況；不代表 Zeabur 正式環境已核對。

| 項目 | 已確認的非敏感資訊與依據 | 尚待正式平台核對 |
| --- | --- | --- |
| 前端 | `frontend/package.json`：React/Vite；建置 `npm ci && npm run build`，產物 `frontend/dist` | Zeabur 服務代稱、部署 SHA、實際建置／啟動命令、公開端口、Region |
| 後端 | `backend/package.json`：Express；現有啟動命令 `npm run start` 使用 nodemon/tsx；`backend/server.ts` 監聽 `PORT`，沒有預設端口 | Zeabur 服務代稱、部署 SHA、Node 版本、啟動命令、公開／內部端口、Region |
| MySQL | `backend/config/config.ts`、`config.cjs` 使用 `DB_*`；預設連接埠 `3306`，實際值由環境決定 | 服務代稱、版本、容量、儲存引擎、字元編碼、排序規則、索引、帳號權限、migration 狀態、精確筆數、Volume 與既有備份 |
| 頭貼 | `backend/public/avatars/` 的 `1.png` 至 `10.png` 共十個檔案已版本控管；`utils/avatarFiles.ts` 檢查本機檔案；`services/userService.ts` 僅儲存選用檔名，未見上傳流程 | 正式容器是否另有未納管檔案、Volume 掛載或手動覆寫；核對 `Users.avatar` 引用 |
| 互動圖示 | `server.ts` 提供 `/reactions` 靜態目錄；repository 未追蹤該目錄下檔案；初始 seed 使用 Unicode，`ReactionPresets.image_path` 可另指向圖片 | 正式 `ReactionPresets` 是否有圖片、實際來源、Volume／外部 URL、備份與還原方式；不可推定沒有檔案 |
| 訪客課表 | `frontend/src/utils/guestTimetableStorage.ts` 使用瀏覽器 localStorage；DB 的 `GuestTimetableSnapshots` 為分析快照 | DB 備份不能復原使用者瀏覽器資料；測試子網域與正式網域的 localStorage 分開 |
| 爬蟲與回填 | `backend/package.json` 有 `scrape`、`scrape:ewant` 及五個 `backfill:*` 指令，會寫 DB；程式庫未見後端排程器或 GitHub Actions 設定 | 平台排程、外部爬蟲 repository、執行者、時區、頻率、手動工作、失敗通知及目標 DB |
| 其他整合 | Google OAuth、Google Custom Search、Dcard 貼文匯入／配對、NUTN／eWant 課程來源 | Webhook、SMTP、物件儲存及額外 API Keys 的平台配置；程式庫未見不等於平台未使用 |

需由 Zeabur 管理者補齊前後端與 MySQL 的服務代稱、端口及 Volume。完整平台 ID、端點、連線方式與帳務證據放在受限操作紀錄，公開文件僅保留代稱與核對結果。本次未找到可用的 Zeabur 連接器，本機也未發現 `.env` 實檔或 MySQL／Docker CLI。

## 2. 環境變數名稱

以下只列名稱；正式平台需再匯出「名稱清單」與此表比對。不得將值、連線字串、憑證截圖或含值的日誌放入 Git、PR 或 Issue。所有 `VITE_*` 會出現在前端產物，不能放秘密。

| 用途 | 名稱 | 程式依據與核對重點 |
| --- | --- | --- |
| 後端執行與代理 | `PORT`、`NODE_ENV`、`TRUST_PROXY_HOPS` | `server.ts`、`models/index.ts`、`routes/auth.ts`；確認端口、代理層數與 Cookie 安全設定 |
| 資料庫 | `DB_USERNAME`、`DB_PASSWORD`、`DB_NAME`、`DB_HOST`、`DB_PORT` | `config/config.ts`、`config/config.cjs`；正式與測試帳號／端點必須分開 |
| 登入與簽章 | `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`ALLOWED_EMAIL_DOMAIN`、`JWT_SECRET` | `utils/passport.ts`、`utils/jwt.ts`；JWT 有效期七天 |
| 網址與 CORS | `FRONTEND_BASE_URL`、`BACKEND_BASE_URL` | `server.ts`、`utils/passport.ts`、`routes/auth.ts`；後端 callback 為 `BACKEND_BASE_URL` 加 `/auth/google/callback`，目前路由位於 `/api/auth/google/callback`，所以設定須包含 `/api` |
| 搜尋 | `GOOGLE_SEARCH_API_KEY`、`GOOGLE_SEARCH_CX` | `services/adminRelatedPostService.ts`；會呼叫計費／配額服務 |
| 前端 | `VITE_API_BASE_URL`、`VITE_GOOGLE_CLIENT_ID` | API URL 在程式使用；client ID 目前僅列在 `.env.example`，未見 `src` 使用 |

`backend/.env.example` 尚缺 `NODE_ENV`、`BACKEND_BASE_URL`、`GOOGLE_SEARCH_API_KEY`、`GOOGLE_SEARCH_CX`。本階段只記錄缺口，不改執行設定或範例。

## 3. 資料庫基線

執行方式及安全前提見 [MySQL 操作清單](mysql-backup-restore.md)；[盤點 SQL](mysql-inventory.sql) 未在正式 DB 執行。repository 有 **30 個 migration 檔**，不表示正式 DB 已套用 30 個。

| 關鍵資料表 | 核對內容 | 正式／還原筆數 |
| --- | --- | --- |
| `Users`、`Whitelists` | 登入身份、管理權限、白名單與唯一索引 | 待執行／待執行 |
| `Courses`、`CourseSchedules`、`CourseViews` | 課程識別、課程排程、瀏覽紀錄及索引 | 待執行／待執行 |
| `Reviews`、`ReviewComments` | 評論、留言、使用者與課程關聯 | 待執行／待執行 |
| `Interests`、`Timetables`、`TimetableItems` | 收藏、學期課表、明細與唯一索引 | 待執行／待執行 |
| `ReactionPresets`、`ReviewReactions` | 圖示路徑、互動紀錄與關聯 | 待執行／待執行 |
| `CourseRelatedPosts`、`RelatedPostImports` | 貼文來源、匯入紀錄與關聯 | 待執行／待執行 |
| `FeatureRequests`、`FeatureRequestVotes` | 願望、投票與計數 | 待執行／待執行 |
| `GuestTimetableSnapshots` | 訪客識別、學期、JSON 課程清單及唯一索引 | 待執行／待執行 |
| `SequelizeMeta` | migration 名稱集合，對照 `backend/migrations/*.js` | 待執行／待執行 |

需另外確認是否有未在模型中出現的資料表、view、trigger、routine 或 MySQL event；完整備份不能只挑上表。精確筆數、schema／索引比較、檔案雜湊與資料抽樣結果保存在受限紀錄；公開 Issue 僅記錄通過／失敗及證據代稱。

## 4. 平台與網域唯讀結果

以下為盤點當下的連線可見範圍，不代表帳號具有建立、付款或 DNS 寫入權限。

| 項目 | 2026-10-17 已確認 | 待辦 |
| --- | --- | --- |
| Cloudflare | 可列出一個帳號；Pages 專案清單為空；以 `nutnselect.com` 篩選 zone 結果為空 | 確認目標帳號角色、Pages 建立權限、GitHub App 對此 repository 的授權、帳務與通知；查不到 zone 不足以判定 DNS 管理者 |
| Railway | 可讀個人 workspace；已有 `pleasing-victory` 專案與 `tainan-select` 服務，來源 `NoZ915/tainan-select@main`，環境名 `production`，Region `iad`、一個 replica；最新部署 `FAILED`；無服務環境變數、共用變數、Volume、bucket 或待套用變更 | 確認失敗原因、管理角色、GitHub 授權是否仍有效、付費方案、剩餘額度、預算上限、通知及適合的 API／DB Region；本次不修復或重部署。此環境名稱不表示它是現行正式站 |
| 正式 DNS | `nutnselect.com`、`www.nutnselect.com`、`api.nutnselect.com` 的公開 CNAME 指向 `hnd1.cname.zeabur-dns.com` | 管理者需核對 registrar、權威 NS、zone 完整匯出、TTL、MX／TXT／CAA 等紀錄；不可直接搬動 nameserver |
| 測試 DNS | `staging.nutnselect.com`、`api-staging.nutnselect.com` 的 A 查詢未取得位址；authority SOA 為 `dns1.registrar-servers.com` | 僅為查詢觀察；管理者與新增權限未確認，尚未建立紀錄或驗證憑證 |
| Google OAuth | 程式所需 API callback：`https://api-staging.nutnselect.com/api/auth/google/callback`；前端接收路徑：`https://staging.nutnselect.com/auth/google/callback` | 確認 Google Cloud 專案管理權、測試 client、同意畫面／測試使用者、Authorized redirect URI；保留正式 URI，不以測試覆蓋正式設定 |

公開 DNS 可重查：`dig +noall +answer +authority nutnselect.com CNAME`，並分別查詢其他網域；NS／SOA 查詢可能沿 apex CNAME 回覆目標服務的資料，不可把該結果當成此網域的權威 NS。

成本記錄日期為 2026-10-17，均為預算基準，尚未確認目前帳務方案或建立新付費資源：

- Cloudflare Pages 可先評估 Free 方案，限制包含每月 500 次建置；付費功能與帳務設定另核對。[官方限制](https://developers.cloudflare.com/pages/platform/limits/)
- Railway Hobby 基準為每月 US$5，含 US$5 用量；超額另計，不能將 US$5 當成 Express + MySQL 的總成本上限。[官方方案](https://docs.railway.com/pricing/plans)
- 完整預估須加總 API／MySQL CPU、RAM、Volume、網路輸出、備份儲存與還原測試、雙平台並行及 Google Search 用量。實際用量、預估總額、預算／告警門檻、付款負責人與通知接收者皆待補於受限帳務紀錄。

## 5. 資安事件與憑證輪替計畫

Zeabur 的[官方事件報告](https://zeabur.com/blogs/august-2026-security-incident)確認 2026 年 8 月事件涉及專案環境變數名稱與值，建議替換曾存於 Zeabur 且仍有效的憑證。本專案是否收到受影響通知、是否遭濫用、是否已輪替仍待管理者核實；不能僅因未收到通知就標為安全。

| 憑證／設定 | 預定處理與目前服務影響 | 回復／撤銷方式 |
| --- | --- | --- |
| MySQL 帳密 | 先盤點 API、migration、爬蟲、回填與外部工具的使用者；建立最小權限新帳號，測試後依序更新；連線池可能需重啟。新環境不用舊帳密 | 原帳號撤銷前可切回已確認安全的設定；若疑似外洩，保留舊憑證不能作為常態回復，改發另一組新憑證 |
| `JWT_SECRET` | 目前僅支援單一簽章 key；輪替使既有七天 JWT 立即失效，需先確認全體重新登入與部署時序 | 回退程式仍使用新 key；不為了恢復舊 session 重新啟用疑似外洩 key |
| Google OAuth secret | 使用獨立測試 client；正式 secret 輪替須確認 provider 可用的交替方式、舊站更新及登入中斷範圍 | 保留程式與 URI 設定回復版本；安全性不明的舊 secret 不恢復，重新簽發並更新 |
| Google Search API key | 核對配額、費用、限制及異常用量；新 key 限制 API 與可用來源，驗證後撤銷舊 key | 安全的新 key 配合原程式使用；不要復用疑似外洩 key。`GOOGLE_SEARCH_CX` 是設定識別，非密碼 |
| 平台／GitHub／DNS Token | 核對曾存於 Zeabur 的有效 Token、授權與登入紀錄，縮小權限、撤銷不需要的授權 | 確認另有可用管理管道後撤銷；替換值只存受限秘密管理位置 |
| SMTP／物件儲存／其他 API Keys | 程式未見使用，仍需查平台與外部工作後決定是否適用；停用 staging 寄送與對外通知 | 依實際整合補上交替憑證、驗證與撤銷步驟；未核對前維持待辦 |

輪替順序：保存可用且加密的備份與安全設定紀錄 → 釐清受影響範圍與操作窗口 → 在隔離環境驗證新憑證 → 確認正式影響與回復步驟 → 更新所有使用端 → 驗證 → 撤銷舊憑證並查核異常。若確認正在遭濫用，應另外安排緊急處置，不以一般遷移時程延後撤銷。

## 6. 測試與部署的副作用

- 課程詳情 `GET /api/courses/:course_id` 會嘗試寫入瀏覽紀錄；OAuth 首次登入會建立使用者。不要把正式 API 當測試目標。
- 評論／留言／互動、收藏、課表匯入、訪客快照、願望／投票及管理匯入／刪除都會寫 DB；快照流程也可能清理過期資料。
- Google 搜尋同步會使用外部配額並寫 DB；課程爬蟲／回填會連外與寫 DB；migration 會變更 schema。測試環境先停用外部排程、Webhook、通知與自動同步，目標帳密僅能操作隔離 DB。
- 還原資料可能含 Google 身份、白名單 email、評論、瀏覽 IP／user agent 與訪客識別。隔離環境限制存取及外連，禁止將內容或未遮罩日誌公開；測試完依保存期限處理。

## 7. 部署與回復檢查清單

### P0 放行至後續資料操作（目前 No-go）

- [x] 以 repository 與平台唯讀結果建立盤點基線、憑證計畫及副作用清單。
- [ ] 補齊 Zeabur 服務／環境變數名稱／端口／儲存／排程／Webhook，並確認 DNS 與 OAuth 管理者。
- [ ] 執行 DB 版本、容量、schema、索引、migration 與精確筆數盤點；確認全部業務 schema 與檔案位置。
- [ ] 指定平台外加密備份位置、還原位置、保留期限、金鑰保管者與受限操作紀錄。
- [ ] 完整備份已保存平台外；在隔離 DB 成功還原並核對資料、schema、索引、migration 與檔案，記錄耗時及證據代稱。
- [ ] 確認正式憑證影響與回復方式，完成必要輪替並記錄撤銷狀態。
- [ ] 確認 Cloudflare／Railway／GitHub 的實際管理權、Region、費用估算、額度、告警與 staging DNS／OAuth 可用性。

### 後續部署與驗收（本次未執行）

- [ ] 修正 `NODE_ENV=production` 的 DB 設定缺口：`models/index.ts` 依環境取值，但兩份 `config` 目前僅定義 `development`；不可為繞過問題而關閉正式 Cookie 安全設定。
- [ ] 補齊 URL／環境變數、正式啟動方式與代理設定；確認 Pages SPA 深層路由、API health check、跨網域 Cookie／CORS、靜態資源及 OAuth。
- [ ] 使用隔離 DB 與測試憑證部署新站；記錄部署 SHA、migration 集合與回復版本；完成上述有寫入功能及登入／登出的隔離驗收。
- [ ] 正式切換前安排寫入凍結、最終備份／增量追平與對帳方式；指定切換負責人、可接受資料損失（RPO）與復原時間（RTO）。

### 正式切換與回復（需另行人工核准）

- [ ] 所有驗收及 P0 條件通過，才提出具體 DNS／流量切換計畫並取得人工核准；保存原紀錄與 TTL。
- [ ] 觸發回復條件：登入失效、關鍵資料不一致、重要功能不可用，或錯誤率／延遲超過切換前約定門檻。先停止新站寫入與排程並保留證據。
- [ ] 若新站尚無正式新寫入，經核准可按原 DNS／路由與部署設定切回仍保留的 Zeabur；復核登入與關鍵查詢。
- [ ] 若已有新寫入，先保全新 DB，再由負責人決定反向同步或其他追平方式；避免僅切 DNS 造成兩邊寫入與資料遺失。不得直接覆蓋任一正式 DB。
- [ ] 穩定觀察期間與清理條件另由後續階段確認；本階段不得清理 Zeabur。

## 8. 證據與安全記錄位置

| 位置 | 可記錄內容 | 目前狀態 |
| --- | --- | --- |
| 本目錄及公開 Issue／PR | 非敏感步驟、版本、檢查結果、阻塞點及證據代稱 | 本次文件待維護者審查，未提交、推送或發布留言 |
| 受限秘密管理位置 | 新舊憑證交替所需設定、權限與撤銷紀錄 | 位置／管理者待指定；不得使用 GitHub 留言保存 |
| 平台外加密儲存 | SQL 備份、額外檔案備份、雜湊與還原報告；解密私鑰分開保管 | 位置、權限、保存期限及金鑰負責人待指定 |
| 受限操作／帳務紀錄 | 實際端點、執行時間／人員、完整核對結果、費用、告警與回復演練 | 位置／負責人待指定；尚無實際操作證據 |

只完成文件不能關閉 #104。備份還原與資料核對通過後，再由維護者將不含敏感資訊的完成證據更新至 Issue。
