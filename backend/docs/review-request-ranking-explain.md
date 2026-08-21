# 求評價排行 Query 驗證紀錄

驗證日期：2026-08-22

## 驗證環境

- MySQL 8.0.35
- 使用既有 Courses、Interests、Timetables、TimetableItems 資料
- 使用 115-1 學期
- 以 connection-scoped temporary table 建立 30 筆 GuestTimetableSnapshots 測試資料
- 執行 `npm run explain:review-requests` 取得 Top 20 與 `EXPLAIN FORMAT=JSON`

## 結果摘要

- `JSON_TABLE` 可正確展開 `course_ids` JSON 並依 course ID 聚合。
- 登入課表與匿名課表計數皆在同一個 aggregate query 完成，沒有 N+1 query。
- 暫存 guest snapshots 中，同一課程出現在 10 個不同 client 時，排行訊號正確顯示 `timetableCount = 10`。
- 現有真實資料中，同分課程若評價數不同，review need factor 會明顯降低已有較多評價課程的分數。
- 排序結果符合 score、課表數、收藏分數、評價數、course ID 的固定 tie-breaker。

## EXPLAIN 觀察

| 資料來源 | 約略掃描筆數 | 觀察 |
| --- | ---: | --- |
| Courses | 5,702 | 目前資料量小，指定學期占比高，optimizer 選擇 full scan。 |
| Interests | 24 | 資料量很小，full scan 成本低。 |
| Timetables | 6 | 使用既有 `uniq_timetables_user_semester` index scan。 |
| TimetableItems | 每份課表約 7 | 使用既有 timetable/course unique index。 |
| GuestTimetableSnapshots | 30 | 暫存資料全部為同一學期，因此 optimizer 未選擇學期索引。 |
| JSON_TABLE 展開結果 | 每筆約 2 | 測試 payload 每個 snapshot 含 1～3 個 course ID。 |

## Index 決策

已確認現有索引與 #92 migration 的：

- Interests(course_id) 外鍵索引
- TimetableItems(course_id) 外鍵索引
- TimetableItems(timetable_id, course_id) unique index
- Timetables(user_id, semester) unique index
- GuestTimetableSnapshots(semester, last_synced_at) index

目前資料規模與 query plan 沒有顯示新增複合索引能帶來明確收益，因此本次不新增 index migration。資料量成長後可再次執行診斷 script，比較 `Interests(created_at, course_id)`、`Timetables(semester, id)` 等候選索引前後的實際成本。
