# P2：Railway 隔離測試環境部署準備

對應 [#106](https://github.com/NoZ915/tainan-select/issues/106)，前置文件為 [P0 放行清單](p0-audit.md)、[備份／隔離還原](mysql-backup-restore.md)與 [P1 部署相容性](p1-portable-deploy.md)。

**2026-10-18（Asia/Taipei）維護者確認 P0 尚未完成，本輪只準備部署設定與文件，不執行平台變更。** P1 已透過 [PR #112](https://github.com/NoZ915/tainan-select/pull/112) 合併，準備基準為 `a6d9f2f4a078ddad0d3dbaf0c295fa7b7f2c4093`。下列設定是待執行方案，不是已部署證據；尚未建立服務、設定變數、匯入 DB、建立測試 DNS 或啟用備份／告警。

## 1. 唯讀現況與放行條件

| 項目 | 本輪確認結果 |
| --- | --- |
| 現有 Railway | `pleasing-victory` 專案只有 `tainan-select` 服務；環境名稱為 `production`，不代表 Zeabur 正式站 |
| 既有服務設定 | 來源 `NoZ915/tainan-select@main`，RAILPACK，Region `iad`、一個 replica；未明確設定 backend Root Directory 或 health check |
| 最新部署 | 2026-10-17 的部署為 `FAILED`，設定記錄的來源 SHA 為 `4679ca3`，不是已合併的 P1；不能當作本輪部署結果 |
| 隔離資源 | 未見 MySQL、Volume、服務／共用變數、公開網域、TCP Proxy 或待套用變更 |
| 本輪操作 | 僅讀取 GitHub／Railway 設定與官方文件，未讀取秘密值，未連線任何 DB |

建立或啟動測試服務前，需補齊：

- [ ] P0 平台外加密備份、隔離還原、schema／資料核對及安全檢核已通過，提供不含秘密的證據代稱。
- [ ] 確認來源 MySQL 精確版本、原 schema 名稱、資料量與 migration 集合，取得受限備份／金鑰的存取方式。
- [ ] 依維護者決定沿用既有 Google OAuth client／secret；測試 API 網址確定後，在同一 client 額外加入測試 callback，保留正式 callback 與既有發布狀態。另備獨立 JWT secret、測試帳號與秘密保管位置。
- [ ] 確認 Railway 帳務方案、可用 Region、Volume 容量、費用預估、告警門檻與付款負責人。

## 2. 資源與 API 設定

採獨立 Project `tainan-select-staging`，目標環境命名為 `staging`，服務名為 `API`、`MySQL`。建立前重新核對清單，避免建立重複資源；環境需用實際 ID 指定，不依工具預設選取 production。既有失敗專案本輪不刪除或改造。

本階段以平台設定及下表作為操作依據。官方已淘汰 `railway.json`／`railway.toml`，新服務無法採用；若日後需要程式化管理，再使用 `.railway/railway.ts` 的 IaC，先預覽 plan 並審查影響。本輪不新增 IaC 相依套件或自動 apply 流程。[官方設定方式](https://docs.railway.com/config-as-code)、[IaC 說明](https://docs.railway.com/infrastructure-as-code)

| API 設定 | 待套用值／核對方式 |
| --- | --- |
| Repository／Branch | `NoZ915/tainan-select`／`main`；記錄實際部署 SHA，確認包含 P1 |
| Root Directory | `backend`；命令相對此目錄執行，不再重複 `cd backend` |
| Builder／Node.js | RAILPACK／24.x；檢查建置日誌，平台版本覆寫需與 `package.json`、`.node-version` 一致 |
| 相依套件 | 使用鎖定檔執行 `npm ci`；檢查 RAILPACK 安裝步驟，不在 build 階段連 DB |
| Start Command | `npm start`，實際為 `tsx server.ts`；無需額外編譯 TypeScript |
| Pre-deploy Command | 留空；不自動執行 migrate、sync、爬蟲或 backfill |
| PORT／監聽 | 使用 Railway 注入的 `PORT`，程式監聽 `0.0.0.0`；公開網域 target port 必須一致 |
| Health Check | `/health`，timeout 300 秒；只有 DB 啟動驗證成功後才會監聽 HTTP |
| Region | API 與 DB 優先同放 Singapore，官方代碼 `asia-southeast1-eqsg3a`；以當時帳號可選項及實測延遲確認 |
| Replica／自動休眠 | API 一個 replica；驗收期間不啟用自動休眠，避免干擾重啟與登入驗證 |
| 重啟／排程 | 失敗時重啟，上限先設 3 次並觀察原因；不設定 cron |
| 檔案 | 保留版本控管的 `public/avatars`；額外 reactions 圖片依 P0 清單補齊，不以空目錄判定完成 |

Railway health check 只用於部署期間，不是持續監測；程式 `/health` 也不持續查 DB。需另外以 API 查詢與部署／重啟紀錄驗收。[Health 官方說明](https://docs.railway.com/deployments/healthchecks)、[Region 官方清單](https://docs.railway.com/deployments/regions)

## 3. MySQL、Volume 與變數 Reference

先建立 MySQL，再建立尚未連接 GitHub 的空 API 服務；確認還原基線後，才接上 API 原始碼並啟動，避免 API 業務寫入影響匯入核對。

- 本次查詢 MySQL 模板來源為 `mysql:8`、Volume mount 為 `/var/lib/mysql`。浮動 tag 不能保證與來源相容；部署前確認實際版本／digest、SQL mode、utf8mb4／排序規則及備份可還原性，不直接選 `latest`。
- API／MySQL 必須在同一 Project、同一環境、同一 Region；MySQL 只使用私網，不建立公開網域或 TCP Proxy。
- 容量依 P0 資料量、索引、成長及還原暫存空間配置；Volume 需掛載成功才匯入。DB replica 維持一個，不能用一般 Volume 複製當作高可用。
- **MySQL 的 `MYSQL_DATABASE` 設為 P0 備份的原 schema 名稱**，`MYSQLDATABASE` 保留參照 `${{MYSQL_DATABASE}}`。P0 dump 使用 `--databases`，會建立／切換原 schema；只在匯入指令加另一個 database 名稱不會替它改名。不要讓 API 仍連到模板預設的空 `railway` schema。
- MySQL `event_scheduler` 在還原與測試期間保持 OFF；核對匯入的 event／trigger／routine 與權限，不能讓還原資料自行觸發非預期工作。
- 匯入／維護使用新環境管理帳號；API 啟動前建立限於目標 schema 的獨立應用帳號，提供現有 API 所需權限，DDL／migration 管理另行分開。將帳號與新密碼以 `APP_DB_USERNAME`、`APP_DB_PASSWORD` 存於 MySQL 服務的受限變數，供 API Reference；這兩個是本方案新增的變數，不是模板自帶欄位。

以下假設服務名為 `MySQL`，改名時 Reference 也須對應。模板的 `MYSQLUSER`／`MYSQLPASSWORD` 為管理帳號，保留供維護，不直接交給 API。

| API 變數 | Railway 值／來源 |
| --- | --- |
| `NODE_ENV` | `production`；環境名稱 staging 不等於 NODE_ENV=staging |
| `DB_HOST` | `${{MySQL.MYSQLHOST}}`，須解析成該環境私網端點 |
| `DB_PORT` | `${{MySQL.MYSQLPORT}}` |
| `DB_NAME` | `${{MySQL.MYSQLDATABASE}}`，核對為還原後的原 schema |
| `DB_USERNAME` | `${{MySQL.APP_DB_USERNAME}}` |
| `DB_PASSWORD` | `${{MySQL.APP_DB_PASSWORD}}` |
| `FRONTEND_BASE_URL` | `https://staging.nutnselect.com`；僅為待建立的測試來源，不使用正式前端 |
| `BACKEND_BASE_URL` | 首次可用 `https://<Railway API 測試網域>/api`；同站 E2E 前改為 `https://api-staging.nutnselect.com/api` 並同步測試 OAuth callback |
| `GOOGLE_CLIENT_ID`／`GOOGLE_CLIENT_SECRET` | 沿用既有 client，從秘密管理位置設定；目前程式啟動必填 |
| `JWT_SECRET` | 全新且獨立的隨機秘密，不沿用正式值 |
| `ALLOWED_EMAIL_DOMAIN` | 測試允許網域；留空時仍可透過 DB 白名單登入，不能視為關閉登入 |
| `TRUST_PROXY_HOPS` | 部署時核對實際代理路徑後設定；沒有證據時不直接套用 1 或相信所有代理 |
| `GOOGLE_SEARCH_API_KEY`／`GOOGLE_SEARCH_CX` | 不配置、不觸發管理搜尋同步 |

平台 Reference 會解析變數，不需要更改程式。秘密不寫入文件、Issue、PR、命令列或日誌；查設定時優先只列變數名稱。不要直接複製本機 `.env.example` 的開發預設值到平台。[MySQL 官方連線說明](https://docs.railway.com/databases/mysql)、[Reference 語法](https://docs.railway.com/variables#referencing-another-services-variable)

## 4. 還原、啟動與隔離驗收順序

1. 完成第 1 節放行，確認操作者、費用與目標 Project／環境／DB 身份。API 保持未啟動，不複製正式排程、Webhook 或通知設定。
2. 在能連 Railway 私網的受限還原工作環境備妥相容 MySQL client、gzip、age 與 `0600` 的 client 設定；由安全管道提供加密備份／金鑰。不將 dump 放進 Git、容器 image、公開 artifact 或可公開下載網址。
3. 依 [P0 還原步驟](mysql-backup-restore.md#4-隔離還原與核對)校驗 SHA-256、解密、解壓與匯入，保留 pipefail，不使用 `mysql --force`。client 目標必須是已確認的隔離私網 DB；本機不應直接連不到的 `.railway.internal`，也不以長期公開 DB 取代私網工作環境。
4. 在 API 尚未啟動時，執行 [mysql-inventory.sql](mysql-inventory.sql)，核對全部 schema／物件定義、索引／外鍵、migration 集合、精確筆數、中文／emoji／JSON 與關聯；逐項沿用 P0 的同備份基線，不能拿持續寫入的正式站即時筆數直接比較。
5. 建立應用帳號、確認 Reference 及測試憑證；驗證備份後再連接 API 的 GitHub source。連接來源可能立即建置，因此此步最後執行。觀察 build／deploy／restart／失敗日誌，僅將遮罩後的錯誤分類存入公開紀錄。
6. 公開前先限制驗收者的存取權，避免還原資料任意對外開放，再生成 API 的 Railway 測試網域；只先對測試 API 執行下方查詢。正式 DNS、Zeabur 設定與正式 DB 均不變更。
7. 完成資料基線核對後，才在隔離 DB 測試登入、評論、收藏、課表等寫入；首次 OAuth、課程詳情、訪客快照均可能寫 DB。外部搜尋、爬蟲、信件與排程保持不執行。
8. 在隔離 DB 建立可辨識的測試資料，記錄其存在與筆數，重啟 MySQL 後重新查核，確認同一 Volume 仍掛載、資料保留；記錄完成後的測試資料清理結果，不修改原備份核對報告。

在受限終端設定 `STAGING_API_ORIGIN` 為核對過的 Railway **測試** HTTPS origin，再執行：

```bash
curl --fail --silent --show-error "${STAGING_API_ORIGIN:?}/health"
curl --fail --silent --show-error "${STAGING_API_ORIGIN:?}/api/semesters"
curl --fail --silent --show-error "${STAGING_API_ORIGIN:?}/api/courses/getAllDepartments"
curl --fail --silent --show-error --request OPTIONS \
  --header 'Origin: https://staging.nutnselect.com' \
  --header 'Access-Control-Request-Method: POST' \
  --header 'Access-Control-Request-Headers: content-type,x-expected-session-scope' \
  --dump-header - --output /dev/null \
  "${STAGING_API_ORIGIN:?}/api/auth/logout"
```

health 預期 `200 {"status":"ok"}`；學期與系所預期成功回傳還原資料，不能僅靠 health 推論 schema／資料正確。OPTIONS 預期 204、指定測試 origin 與允許 credentials，不得出現 `Access-Control-Allow-Origin: *`。查詢內容若涉及私有資料，僅保存在受限紀錄。

完整瀏覽器 E2E 需先備妥同站的測試 HTTPS 子網域，並在既有 Google OAuth client 額外加入測試 callback：`https://api-staging.nutnselect.com/api/auth/google/callback`；保留原正式 callback。Railway／Pages 預設網域為跨站組合，現有 SameSite=Lax Cookie 無法驗收背景 API 登入。測試 DNS 的建立與正式流量切換分開記錄，本輪兩者均未執行。

## 5. 備份、還原演練與費用

- 在 MySQL 的 Volume Backups 啟用排程，先以每日備份作為驗收方案，記錄實際保留策略、容量與一次成功備份。Railway 同平台快照不能取代平台外的加密邏輯備份；後者沿用 P0 流程，只將來源改為已核對的 Railway 隔離 DB。
- 另外在可丟棄的隔離環境演練邏輯備份還原；平台快照則依當時支援的同 Project／同環境還原流程，審查新 Volume 掛載與 staged changes 後執行。還原前停用測試 API，保留舊 Volume，記錄資料核對及耗時，不覆蓋原始 P0 備份。[備份官方說明](https://docs.railway.com/volumes/backups)
- 由管理者在 Workspace Usage 設定 email 告警；hard limit 會停止該 workspace 的 workloads，需先核對其他服務與可接受中斷範圍。門檻、通知接收者與付款負責人目前待指定，本輪沒有更動帳務設定。[成本控制](https://docs.railway.com/pricing/cost-control)

2026-10-18 官方單價基準如下；不是帳號目前方案或已產生的帳單：

| 資源 | 月費估算基準（美元） |
| --- | --- |
| RAM／CPU | 平均 RAM 每 GB 約 US$10；平均 CPU 每 vCPU 約 US$20 |
| Volume／備份 | Volume 每 GB 約 US$0.15；快照額外增量依 Volume 單價計 |
| 網路輸出 | 每 GB 約 US$0.05；另計平台外備份儲存／傳輸 |
| Hobby | 每月 US$5，含 US$5 用量；不能將 US$5 當 API＋MySQL 總費用上限 |

情境試算：兩服務合計平均 RAM 1 GB、CPU 0.1 vCPU、Volume 5 GB、快照增量 1 GB、對外輸出 1 GB，約為 US$12.95／月；在 Hobby 計價下已超過內含 US$5，不再重複加 US$5。此為假設值，未含平台外備份、其他 workspace 服務與稅費，實際需依 Metrics／Usage／預估帳單重算。[官方價格](https://docs.railway.com/pricing/plans)

部署後記錄 API／MySQL 的 CPU、RAM、Volume、egress、重啟次數與取樣期間，至少涵蓋閒置及代表性隔離測試；目前只有舊失敗服務，**新環境實際用量、月費預測與預算告警均未驗收**，不能以零部署推論零費用。

## 6. 完成證據與停止條件

| 驗收項目 | 本輪狀態／後續證據 |
| --- | --- |
| P0／隔離備份可用 | 未完成；待備份與還原報告代稱 |
| API／MySQL／Volume | 未建立；待環境、版本、私網與掛載核對 |
| Health／API／重啟持久化 | 未測試；待部署 SHA、HTTP 結果與資料保留證據 |
| Schema／資料／migration | 未匯入；待同備份基線核對報告 |
| OAuth／靜態檔／副作用隔離 | 未驗收；待既有 client 加入測試 callback、同站子網域與完整流程 |
| 平台及平台外備份／還原 | 未啟用；待排程、加密檔代稱、還原結果與耗時 |
| 用量／月費／通知 | 未取得新環境實測；待帳務方案、取樣、預估與告警設定 |
| Zeabur／正式 DNS／正式 DB | 本輪未變更，也未向正式 DB 執行測試 |

若出現錯誤 DB／環境 Reference、版本不相容、資料核對失敗、Volume 未掛載、費用未確認或非預期對外副作用，停止 API／還原操作並保留受限證據；不得藉由改連 Zeabur DB、重跑全部 migration、重建正式 Volume 或切正式 DNS 繞過問題。

本文件審查合併只完成部署準備，不能關閉 #106。實際驗收後才將非敏感的部署 SHA、設定摘要、測試結果、費用與風險更新至 Issue；完整端點、憑證與私有資料留在受限紀錄。
