# MySQL 盤點、備份與隔離還原操作清單

對應 [P0 放行條件](p0-audit.md)。**以下為待執行步驟，尚無備份或還原成功證據。** 本機未備妥 MySQL／mysqldump、隔離環境或加密備份位置；先由管理者指定安全位置與存取方式，不在聊天、Git 或 Issue 貼入憑證。

## 1. 執行前準備

- [ ] 指定操作人、受限紀錄、平台外加密儲存、解密金鑰保管者、保留期限與存取權；確認空間、傳輸／儲存／還原成本與核准預算。
- [ ] 由安全管道建立來源、隔離目標各自的 MySQL client 設定檔，放在 repository 外、權限 `0600`；設定連線端點、帳號、密碼、TLS／CA。遠端來源需驗證伺服器身份，或使用核准的安全通道；不把密碼寫入命令列、不開 shell tracing。
- [ ] 來源用可讀取完整業務 schema、view、routine、trigger、event 的最小必要備份權限；確認物件可見性，避免權限不足被誤認為沒有物件。帳號／授權另存加密受限紀錄，於新平台以新憑證重建，不直接搬運系統帳號表。
- [ ] 確認源與目標是不同實例，目標為可丟棄的隔離空實例，沒有正式連線、排程、Webhook 或寄送能力。MySQL `event_scheduler` 必須為 `OFF`，還原期間保持關閉，否則匯入的 event 可能自行執行。
- [ ] 先取得來源 MySQL 版本、儲存引擎及 GTID 設定，選相容 client；先演練相同版本還原，再驗證 Railway 預定版本。不要在尚未確認版本時直接套用下方 MySQL 8 範例。
- [ ] 不啟動 API／爬蟲、不執行 migration 或回填來驗證連線。盤點及備份仍可能消耗正式資源，選低負載時段，觀察延遲與容量，異常時停止工作。

## 2. 來源唯讀盤點

在 repository 根目錄執行以下範本；`SOURCE_CNF` 為安全 client 設定檔絕對路徑，`SOURCE_DB_NAME` 為已確認的業務 schema 名稱，`PRIVATE_AUDIT_DIR` 為 repository 外受限目錄。這些操作變數不屬於應用程式環境變數。

```bash
mysql --defaults-extra-file="${SOURCE_CNF:?}" \
  --database="${SOURCE_DB_NAME:?}" --batch \
  < docs/migration/mysql-inventory.sql \
  > "${PRIVATE_AUDIT_DIR:?}/source-inventory.txt"
```

輸出包括版本、容量估計、引擎、欄位編碼／排序、索引、外鍵、物件定義、migration 與十七張模型表的精確筆數。`information_schema.TABLES.TABLE_ROWS` 僅是估計值；筆數驗證使用檔案後段的 `COUNT(*)`。物件定義可能含敏感常數，報告必須限受控保存。

- 比對實際表清單與模型；若有額外 schema／表，加入完整備份與核對範圍。若預期表缺少而報錯，保留缺口，不能將部分輸出視為完成。
- 逐欄比較 `GENERATION_EXPRESSION`，不能只核對 `EXTRA` 的 generated 標記；並逐表以 `SHOW CREATE TABLE` 將完整建構語句存入受限報告，比較產生運算式、約束、索引與其他表屬性。
- 比對 `SequelizeMeta` 名稱集合與三十個 `backend/migrations/*.js` 檔案，記錄缺漏／額外項目；不要為了讓集合相同而在正式 DB 執行 migration。
- 逐項比較 view 查詢、routine 本體／參數／回傳型別、trigger 本體／執行順序、event 本體／排程／時區及建立時的 SQL mode／編碼設定；再對每個物件以 `SHOW CREATE VIEW`、`SHOW CREATE PROCEDURE`、`SHOW CREATE FUNCTION`、`SHOW CREATE TRIGGER` 或 `SHOW CREATE EVENT` 將完整建構語句存入受限報告，涵蓋 view 的 `ALGORITHM` 等額外屬性。定義為 `NULL`、空白或物件清單不完整時停止驗收，先確認讀取權限；不可將來源與還原端同時不可見當作相符。[官方權限說明](https://dev.mysql.com/doc/refman/8.0/en/information-schema-routines-table.html)
- 若有非 InnoDB 表，`--single-transaction` 無法保證其一致性，需另外設計並核准快照／維護窗口；不要直接加全域鎖。
- 盤點筆數的交易與 mysqldump 是不同快照；線上正式站持續寫入時，兩者不必相等。後續必須從同一份備份取得核對基線，不能把時間差誤判為還原失敗或忽略實際缺漏。

## 3. 完整業務資料備份

確認無 DDL／migration／回填與此工作重疊。以下是 **MySQL 8、全部業務表為 InnoDB、單一業務 schema、獨立還原用途**的範本；包含全部表／資料、view、routine、event、trigger，不限定關鍵表，也不含 `--ignore-table`。若還有其他業務 schema，需一起規劃與備份，不得漏掉。

先安全設定 `BACKUP_FILE`（repository 外、尚不存在的 `.sql.gz.age` 絕對路徑）、`BACKUP_RECIPIENT`（已驗證的 age 加密收件者）；解密私鑰分開保管。需要 `mysqldump`、`gzip`、`age`。在獨立 Bash 工作程序執行以下內容：

```bash
set -euo pipefail
set -o noclobber
umask 077
mysqldump --defaults-extra-file="${SOURCE_CNF:?}" \
  --single-transaction --quick --skip-lock-tables \
  --routines --events --triggers --hex-blob \
  --no-tablespaces --set-gtid-purged=OFF --column-statistics=0 \
  --default-character-set=utf8mb4 \
  --databases "${SOURCE_DB_NAME:?}" \
  | gzip \
  | age --recipient "${BACKUP_RECIPIENT:?}" \
      > "${BACKUP_FILE:?}"
shasum -a 256 < "$BACKUP_FILE" | awk '{print $1}' > "$BACKUP_FILE.sha256"
```

`pipefail` 確保任一環節失敗都不會記為成功；失敗可能留下部分加密檔，應標為失敗並依受限儲存程序處理。成功退出與雜湊也不等於可還原。確認平台外目的地取得檔案並重新校驗雜湊，保留加密 stderr／執行報告與開始結束時間，禁止將 dump 或日誌上傳 GitHub。

`.sha256` 僅保存 64 字元 digest，不記錄來源路徑。搬移或改名時一併保存配對的 digest 檔，以目前 `BACKUP_FILE` 加 `.sha256` 命名；還原時直接計算目前檔案的 digest 比較，避免誤驗仍存在的來源檔案。

此範本的 GTID 設定適用獨立 schema 還原，不建立 replication／時間點回復基線；若需要 binlog／GTID 追平，須另訂方案。`--databases` 會包含建立／切換原 schema 的語句，還原只能對空的隔離實例進行，不能只用目標 database 參數期待改名。物件的 `DEFINER`／跨 schema 引用與帳號權限亦需核對，不可直接用全域文字取代掩蓋問題。

完整備份另外包含：正式機器上 repository 未涵蓋的 avatars／reactions、其他 Volume／物件儲存檔案與清單／雜湊。若實際只有版本控管圖檔，也要記錄部署版本與核對結果。SQL 備份不包含這些檔案或瀏覽器 localStorage。

參考 [MySQL 官方 mysqldump 文件](https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html)：交易快照的引擎與 DDL 限制、備份物件及權限需求需依實際版本核對。

## 4. 隔離還原與核對

以下只可在已確認為隔離空實例的目標執行。`RESTORE_CNF` 指向隔離目標 client 設定，`BACKUP_IDENTITY` 為解密金鑰的受限路徑。先在安全管道人工核對兩個端點與實例身份；不要將端點公開。

```bash
mysql --defaults-extra-file="${RESTORE_CNF:?}" --batch \
  --execute='SELECT @@hostname, @@port, @@version, @@event_scheduler;'
```

確認 event scheduler 關閉後，於獨立 Bash 工作程序執行：

```bash
set -euo pipefail
expected_backup_sha256=$(cat "${BACKUP_FILE:?}.sha256")
actual_backup_sha256=$(shasum -a 256 < "$BACKUP_FILE" | awk '{print $1}')
if [[ ! "$expected_backup_sha256" =~ ^[0-9a-f]{64}$ ]] \
  || [[ "$actual_backup_sha256" != "$expected_backup_sha256" ]]; then
  printf '%s\n' '備份 SHA-256 校驗失敗，停止還原。' >&2
  exit 1
fi
age --decrypt --identity "${BACKUP_IDENTITY:?}" "$BACKUP_FILE" \
  | gzip --decompress \
  | mysql --defaults-extra-file="${RESTORE_CNF:?}"
mysql --defaults-extra-file="$RESTORE_CNF" \
  --database="${SOURCE_DB_NAME:?}" --batch \
  < docs/migration/mysql-inventory.sql \
  > "${PRIVATE_AUDIT_DIR:?}/restore-inventory.txt"
```

還原時不可使用 `mysql --force` 忽略錯誤，也不可先跑 migration／啟動 API 讓缺少的表被建立。若 dump 來自疑似受影響環境，先在斷開外連的環境受控檢視物件定義，不能將還原視為內容可信的證明。

- [ ] 解密、解壓縮與匯入皆成功退出，沒有截斷、權限或 `DEFINER` 錯誤；記錄 client／server 版本及各步耗時。
- [ ] 全部表、view、trigger、routine、event、欄位、編碼／排序、索引、外鍵與 `SequelizeMeta` 名稱集合相符；依第 2 節比較物件定義與 `SHOW CREATE` 完整建構語句，不能僅比較名稱。server 身份、容量與建立／執行時間等環境欄位不要求相同；`DEFINER` 或 event 狀態等預期差異須另行記錄原因與驗證結果。
- [ ] 十七張關鍵表與所有額外業務表的精確筆數／必要內容雜湊核對。同一份 dump 的預期筆數與內容可由受控工具解析，或在第二個隔離空實例獨立還原比對；僅兩次還原相同仍不足以證明來源備份範圍完整，還需來源物件／schema 清單與匯出成功紀錄。
- [ ] 使用非敏感抽樣核對課程身份、中文／emoji、日期／時區、JSON 課程清單與關聯，檢查孤立外鍵及重要唯一索引；不要僅以筆數相等判定資料正確。
- [ ] 若要與來源精確逐列核對，須有經核准的共同快照／短暫停寫策略；不能將不同時間的線上查詢直接當一致性證據。本 P0 不自行停寫正式站。
- [ ] 核對頭貼、互動圖片的路徑、檔案數與雜湊；還原報告記錄實際來源／目的地代稱及所有缺漏。
- [ ] 若測試需啟動應用程式，先提供獨立測試憑證、受限網路及隔離 DB；停用外部副作用。寫入測試應在完成備份核對之後進行，避免改變基線。

## 5. 執行紀錄與回復

每次備份／還原記錄：操作人、Asia/Taipei 時間與 UTC 時間、來源／目標代稱、schema 範圍、工具版本、物件與資料核對、加密檔雜湊、平台外檔案代稱、耗時、費用、例外、保存期限及清理負責人。公開紀錄僅附證據代稱、日期及通過／失敗，不附完整報告或資料。

本流程失敗時停止驗收，保留正式站原設定與安全的失敗證據；僅在確認目標身份後重建可丟棄的隔離實例重試。**本流程不向正式 DB 還原，也不修改正式 DNS。** 若舊正式站發生事故，需另行確認還原點、資料損失、操作影響與核准步驟，不能直接把本範本的目標改成正式端點。
