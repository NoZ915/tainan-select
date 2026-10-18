# P2：Railway 隔離測試環境部署準備

對應 [#106](https://github.com/NoZ915/tainan-select/issues/106)，前置文件為 [P0 放行清單](p0-audit.md)、[備份／隔離還原](mysql-backup-restore.md)與 [P1 部署相容性](p1-portable-deploy.md)。

**2026-10-18（Asia/Taipei）P0 尚未完整驗收；維護者後續授權繼續建立 Railway 測試資源，已完成 MySQL／Volume 部署、來源備份匯入、API 專用 DB 帳號與空 API 服務設定。** P1 已透過 [PR #112](https://github.com/NoZ915/tainan-select/pull/112) 合併，準備基準為 `a6d9f2f4a078ddad0d3dbaf0c295fa7b7f2c4093`。API 尚缺既有 Google OAuth 的兩個變數，尚未連接 GitHub 或啟動；測試 DNS、Railway 備份／告警仍未建立。

## 1. 平台現況與放行條件

| 項目 | 本輪確認結果 |
| --- | --- |
| 現有 Railway | `pleasing-victory` 專案只有 `tainan-select` 服務；環境名稱為 `production`，不代表 Zeabur 正式站 |
| 既有服務設定 | 來源 `NoZ915/tainan-select@main`，RAILPACK，Region `iad`、一個 replica；未明確設定 backend Root Directory 或 health check |
| 最新部署 | 2026-10-17 的部署為 `FAILED`，設定記錄的來源 SHA 為 `4679ca3`，不是已合併的 P1；不能當作本輪部署結果 |
| 既有專案隔離資源 | 原 `pleasing-victory` 專案未見 MySQL、Volume、服務／共用變數、公開網域、TCP Proxy 或待套用變更 |
| 新測試專案 | 已建立私人專案 [tainan-select-staging](https://railway.com/project/a2c5fd3b-3a46-4408-ab14-a3289ce52cb1)，預設環境為 `staging`；未啟用 PR 自動部署 |
| 新環境驗證 | MySQL `8.0.46` 與 500 MB Volume 均在新加坡，來源備份已匯入並核對 18 張表；API 空服務已建立並設定為同 Region，無公開網域、TCP Proxy 或待部署變更 |
| 本輪操作 | 原先僅準備文件；後續依維護者授權建立測試資源、匯入備份及設定 API 專用帳號，未變更既有專案、Zeabur 或正式 DNS |

建立或啟動測試服務前，需補齊：

- [ ] P0 平台外加密備份、隔離還原、schema／資料核對及安全檢核已通過，提供不含秘密的證據代稱。
- [ ] 確認來源 MySQL 精確版本、原 schema 名稱、資料量與 migration 集合，取得受限備份／金鑰的存取方式。
- [ ] 依維護者決定沿用既有 Google OAuth client／secret；測試 API 網址確定後，在同一 client 額外加入測試 callback，保留正式 callback 與既有發布狀態。另備獨立 JWT secret、測試帳號與秘密保管位置。
- [ ] 確認 Railway 帳務方案、可用 Region、Volume 容量、費用預估、告警門檻與付款負責人。

## 2. 資源與 API 設定

已建立獨立 Project `tainan-select-staging`、`staging` 環境、`MySQL` 與空 `API` 服務。API 的下列平台設定已套用，尚未連接原始碼或部署；建立服務前重新核對清單，避免建立重複資源，環境需用實際 ID 指定。既有失敗專案本輪不刪除或改造。

本階段以平台設定及下表作為操作依據。官方已淘汰 `railway.json`／`railway.toml`，新服務無法採用；若日後需要程式化管理，再使用 `.railway/railway.ts` 的 IaC，先預覽 plan 並審查影響。本輪不新增 IaC 相依套件或自動 apply 流程。[官方設定方式](https://docs.railway.com/config-as-code)、[IaC 說明](https://docs.railway.com/infrastructure-as-code)

| API 設定 | 設定值／核對方式 |
| --- | --- |
| Repository／Branch | 預計 `NoZ915/tainan-select`／`main`，目前尚未連接；部署時記錄實際 SHA，確認包含 P1 |
| Root Directory | 已設 `/backend`；命令相對此目錄執行，不再重複 `cd backend` |
| Builder／Node.js | RAILPACK／24.x；檢查建置日誌，平台版本覆寫需與 `package.json`、`.node-version` 一致 |
| 相依套件 | 使用鎖定檔執行 `npm ci`；檢查 RAILPACK 安裝步驟，不在 build 階段連 DB |
| Start Command | `npm start`，實際為 `tsx server.ts`；無需額外編譯 TypeScript |
| Pre-deploy Command | 留空；不自動執行 migrate、sync、爬蟲或 backfill |
| PORT／監聽 | 使用 Railway 注入的 `PORT`，程式監聽 `0.0.0.0`；公開網域 target port 必須一致 |
| Health Check | `/health`，timeout 300 秒；只有 DB 啟動驗證成功後才會監聽 HTTP |
| Region | API 與 DB 優先同放 Singapore，官方代碼 `asia-southeast1-eqsg3a`；以當時帳號可選項及實測延遲確認 |
| Replica／自動休眠 | API 一個 replica；驗收期間不啟用自動休眠，避免干擾重啟與登入驗證 |
| 重啟／排程 | 失敗時重啟，上限先設 3 次並觀察原因；不設定 cron |
| 資源上限 | 已設 1 vCPU、1 GB RAM；此為資源上限，非費用上限，實際用量待部署後取樣 |
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

2026-10-18 23:31（Asia/Taipei）空 DB 部署驗證結果如下；後續 SSH 匯入與核對結果見第 4 節，應用帳號設定結果見本節下方：

| 已套用項目 | 結果 |
| --- | --- |
| Image／啟動 | 固定 `mysql:8.0.46`；部署 `04a8b74e-474b-4860-8a95-e96f1c98b982` 為 `SUCCESS`，日誌確認 `8.0.46` 在 `3306` ready for connections |
| Region／Volume | 一個 replica，`asia-southeast1-eqsg3a`；同 Region 的 `mysql-volume` 為 500 MB，掛載 `/var/lib/mysql`；匯入前仍需檢查實際剩餘空間 |
| Schema／密碼 | 模板輸入 `MYSQL_DATABASE=tainanselect_prod`，其餘連線變數保留模板 Reference；新管理密碼由 Railway 自動產生，未讀出秘密值 |
| 網路 | 私網端點名稱 `mysql`；查詢確認公開網域與 TCP Proxy 皆為空，尚未從另一服務測試私網連線 |
| 資源上限／重啟 | 上限 1 vCPU、1 GB RAM；失敗重啟至多 3 次，不設定 cron；資源上限不等於費用上限 |
| 還原前設定 | 沿用模板停用 native AIO、binlog 與 Performance Schema；buffer pool 改為 128 MB，明確設定 `event_scheduler=OFF`、停用 MySQL X 與 local infile |

實際啟動命令如下。連接器無法修改尚未建立的服務設定，因此先以模板建立空 DB，再套用新加坡與此命令；最終服務及 Volume Region 已重新核對。

```bash
docker-entrypoint.sh mysqld --innodb-use-native-aio=0 --disable-log-bin --performance_schema=0 --innodb-buffer-pool-size=128M --event-scheduler=OFF --mysqlx=0 --local-infile=0
```

以下假設服務名為 `MySQL`，改名時 Reference 也須對應。模板的 `MYSQLUSER`／`MYSQLPASSWORD` 為管理帳號，保留供維護，不直接交給 API。

API 專用帳號 `tainan_api` 已建立並核對：僅對 `tainanselect_prod` 授予 `SELECT`、`INSERT`、`UPDATE`、`DELETE`，沒有 DDL、授權轉授或其他 schema 的權限。此實例 `partial_revokes=OFF`，資料庫層級授權以 `tainanselect\_prod` 處理底線，避免將它視為萬用字元。[MySQL 官方授權規則](https://dev.mysql.com/doc/refman/8.0/en/grant.html)

已驗證此帳號從 MySQL 容器透過私網端點登入，且帳號設定前後業務資料逐表筆數不變；API 實際跨服務連線仍待啟動驗證。`APP_DB_USERNAME`／`APP_DB_PASSWORD` 已存入 MySQL 服務，API 的 DB Reference 已在記憶體內核對解析結果；獨立 `JWT_SECRET` 也已設定。新秘密透過 CLI stdin 傳入並另存受限加密恢復副本，未出現在命令列、聊天或公開文件。

目前 API 已設定 DB Reference、兩個 base URL、`NODE_ENV`、`ALLOWED_EMAIL_DOMAIN` 與獨立 JWT secret；`TRUST_PROXY_HOPS` 保留程式預設 0，待實際代理路徑核對後決定。兩個 Google 變數需由維護者在 API 的 Variables 填入，確認完整後才連接 GitHub；不以佔位值啟動。帳號及變數設定證據代稱為 `railway-api-prep-20261018`；本次專用 SSH 公鑰、暫存私鑰與 agent 均已清理。

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
| `GOOGLE_CLIENT_ID`／`GOOGLE_CLIENT_SECRET` | 尚未設定；沿用既有 client，由維護者在平台填入，程式啟動必填 |
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

2026-10-18 已完成來源備份的 Railway 隔離還原，證據代稱為 `railway-restore-20261018`；完整報告、逐表筆數、建表定義、日誌與耗時存於 repository 外受限位置。使用官方 CLI `5.70.0` 完成登入及專用 SSH 公鑰註冊，本機解密後透過 SSH 將 SQL 傳至容器內 MySQL Unix socket，未建立 DB 公網入口，也未傳送解密金鑰。[官方 SSH 說明](https://docs.railway.com/cli/ssh)

| 匯入／核對項目 | 結果 |
| --- | --- |
| 匯入前檢查 | 核對專案、環境與服務身份、`8.0.46`、`/var/lib/mysql`、事件排程 OFF、空 schema 與剩餘空間；加密檔及解密內容 SHA-256 均與本機備份紀錄相符 |
| 匯入方式 | 僅對新隔離 DB 執行一次匯入，成功退出；未執行 migration、爬蟲、回填或啟動 API |
| 資料與 migration | 18 張資料表集合與逐表精確筆數均符合備份基線；30 個 migration 名稱與 repository 相符 |
| 結構 | 148 個欄位、71 筆索引定義及 17 筆外鍵欄位定義符合本機還原基線；全部建表定義與 dump 等價，涵蓋約束及其他表屬性 |
| 比對差異紀錄 | MySQL 查詢列排序不同，改以不依賴列順序的完整資料比較；`SequelizeMeta.name` 顯式宣告與繼承表預設 `utf8mb3` 的寫法等價，欄位編碼／排序另已核對，保留原字元集 |
| 其他物件／完整性 | view、trigger、routine、event 均為 0；孤立外鍵為 0，18 張表的 `CHECK TABLE` 全部通過 |
| 完成後狀態 | MySQL Online、一個 running replica、無失敗部署；專用 SSH 公鑰已撤銷、暫存私鑰已刪除、專用 agent 已停止 |
| 尚待驗收 | API 跨服務私網啟動、重啟持久化、資料抽樣、Railway 備份與還原演練、OAuth、費用／告警，以及其餘 P0 待辦；來源結構獨立比對仍未完成 |

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

部署後記錄 API／MySQL 的 CPU、RAM、Volume、egress、重啟次數與取樣期間，至少涵蓋閒置及代表性隔離測試。空 MySQL 啟動後首次查詢，當次 RAM 約 0.3585 GB、CPU 為 0，`DISK_USAGE_GB` 約 0.1547 GB；此為短暫啟動取樣，不能當作 Volume 剩餘空間或穩態用量。**完整用量、月費預測與預算告警仍未驗收**，後續需涵蓋匯入與 API 測試期間。

## 6. 完成證據與停止條件

| 驗收項目 | 本輪狀態／後續證據 |
| --- | --- |
| P0／隔離備份可用 | 本機加密備份、18 張表隔離還原與逐表筆數核對已完成；來源結構獨立比對、金鑰另存與其他安全檢核仍待辦，P0 尚未完整驗收 |
| API／MySQL／Volume | MySQL 與 Volume 已部署並還原；API 專用帳號與空服務設定已完成，缺 Google 兩個變數，尚未連接原始碼或啟動；跨服務連線待驗證 |
| Health／API／重啟持久化 | 未測試；待部署 SHA、HTTP 結果與資料保留證據 |
| Schema／資料／migration | 已匯入並通過同備份的結構、逐表筆數、migration 及外鍵核對；證據代稱 `railway-restore-20261018` |
| OAuth／靜態檔／副作用隔離 | 未驗收；待既有 client 加入測試 callback、同站子網域與完整流程 |
| 平台及平台外備份／還原 | 來源平台外加密備份已成功還原至 Railway；Railway 自身的定期備份、平台外備份與還原演練仍待辦 |
| 用量／月費／通知 | 已取得空 DB 啟動取樣；待帳務方案、代表性用量、預估與告警設定 |
| Zeabur／正式 DNS／正式 DB | 本輪未變更，也未向正式 DB 執行測試 |

若出現錯誤 DB／環境 Reference、版本不相容、資料核對失敗、Volume 未掛載、費用未確認或非預期對外副作用，停止 API／還原操作並保留受限證據；不得藉由改連 Zeabur DB、重跑全部 migration、重建正式 Volume 或切正式 DNS 繞過問題。

本文件審查合併只完成部署準備，不能關閉 #106。實際驗收後才將非敏感的部署 SHA、設定摘要、測試結果、費用與風險更新至 Issue；完整端點、憑證與私有資料留在受限紀錄。
