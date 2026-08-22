---
name: fix-pr
description: 處理 GitHub Pull Request 尚未解決且可執行的 review threads，完成程式碼修正、驗證、commit、push，並在每個原始 comment 下以可點擊的完整 commit SHA 逐則回覆，最後統一觸發一次 @codex review 並等待回應。當使用者要求處理 PR 未解決問題、修正 review 意見、推送修正並回覆 reviewer 時使用；預設保留 threads 為 unresolved，不直接 resolve。
---

# 處理未解決的 PR Review

依序完成 thread 查核、修正、驗證、發布及逐則回覆。遵守專案 AGENTS.md，維持變更最小且可追溯。

## 工作流程

1. 確認 PR 與工作區
   - 優先使用使用者提供的 PR URL 或編號；否則從目前分支查找 PR。
   - 檢查目前分支、remote、工作區狀態及 PR head branch。
   - 保留使用者既有變更；若會與修正範圍衝突，先向使用者說明。

2. 取得 thread-aware review 資料
   - 使用能回傳 thread ID、isResolved、isOutdated、檔案與行號的 GitHub API 或 GraphQL 查詢。
   - 不以 flat comments 列表判斷 resolution 狀態。
   - 只處理 unresolved 且可執行的意見；排除已解決、純資訊、重複及已過時且不再適用的意見。

3. 實作修正
   - 依檔案或行為領域整理問題，讓每項變更可對應回原始 thread。
   - 使用者要求處理全部問題時，處理所有 unresolved actionable threads。
   - 若意見互相衝突、語意不明或修正可能造成回歸，先說明取捨，不自行猜測。

4. 驗證
   - 執行與異動相稱的型別檢查、lint、測試或 build。
   - 檢查 git diff 與 git diff --check，確保沒有無關變更。
   - 驗證失敗時先修正；若是既有問題，清楚記錄證據與影響範圍。

5. Commit 與 push
   - 僅在使用者要求時 commit 與 push。
   - 只 stage 本次修正檔案；commit message 遵循 repository 既有英文風格，不使用中文。
   - push 到 PR 的 head branch，並取得 push 後 HEAD 的完整 40 字元 SHA。
   - 若程式碼早已修正，不建立空 commit；找出實際包含修正的 commit。

6. 逐則回覆修正內容
   - 等 push 成功後，依序回覆每個 thread 的最上層 review comment，讓修正與原始意見維持一對一的脈絡。
   - 每個 thread 只回覆對應的修正內容，不在 thread 回覆中加入 @codex review，以免同時觸發多個複查任務。
   - 使用完整 40 字元 commit SHA，且不得用反引號或 code block 包住 SHA，確保 GitHub 可自動產生連結。
   - 以繁體中文簡述該 thread 的實際修正及通過的驗證。

回覆格式：

已於 <完整 40 字元 commit SHA> 修正。<對應修正摘要>。已通過 <驗證項目>。

7. 統一觸發並等待 Codex 複查
   - 所有 thread 都回覆完成後，在 PR conversation 留下一則 @codex review，附上完整 commit SHA，請 Codex 統一複查本輪修正。
   - 只觸發一次，不為每個 thread 分別觸發 review。
   - 留言後記錄時間與 comment ID，輪詢 PR review 或 conversation，確認出現建立時間較新的 Codex bot 回覆。
   - 每次輪詢間隔不超過 60 秒，等待期間提供簡短進度更新。
   - 若 Codex 回覆提出新問題，先處理該問題並重新驗證、push、逐則回覆，再統一觸發下一輪複查。
   - 若合理等待時間內沒有回覆，停止重複觸發並回報目前狀態，避免建立重複 review 任務。

8. 保留 thread 未解決
   - 回覆後不要呼叫 resolve review thread。
   - 若 thread 先前已被誤設為 resolved，先 unresolve，再重新回覆。
   - 只有使用者在後續明確要求，且複查結果確認修正後，才 resolve 指定 thread。

9. 最後確認
   - 重新讀取目標 threads，確認逐則回覆存在、完整 SHA 未被 code formatting 包住，且 isResolved 為 false。
   - 確認 PR conversation 存在本輪唯一的 @codex review，並記錄統一複查結果。
   - 確認本機分支與遠端同步、工作區沒有本次流程遺留的未提交變更。
   - 回報修正數量、commit、push、驗證結果及仍保留 unresolved 的 threads。

## 寫入安全

- GitHub 回覆、commit、push、unresolve 或 resolve 都必須符合使用者明確授權。
- 不因完成修正而推定可以 merge、resolve、關閉 PR 或改寫歷史。
- GitHub CLI 不可用時，改用具備 thread resolution 資料與 review reply 能力的 GitHub connector；不要退回 flat comments 猜測狀態。
