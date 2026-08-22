export type VersionKind = 'feat' | 'enhancement' | 'fix'

export type VersionEntry = {
  version: string
  releasedAt: string
  kind: VersionKind
  title: string
  summary: string
}

// Keep this list in reverse-chronological order (newest first).
export const VERSION_HISTORY: VersionEntry[] = [
  {
    version: 'v4.2.1',
    releasedAt: '2026-08-22',
    kind: 'fix',
    title: '課程爬蟲大修',
    summary:
      '學校在統計表偷偷多加了一列「跨領域學院」，結果整份課程資料的解析全部位移，爬到一堆不存在的網址 🥲 這次把解析方式整個改成逐列讀取，之後學校再改版也不會整批歪掉。順便讓課程大綱還在「整理中」的課也抓得到，跨領域學院的課終於出現了。',
  },
  {
    version: 'v4.2.0',
    releasedAt: '2026-08-22',
    kind: 'enhancement',
    title: '課表紀錄與瀏覽次數校正',
    summary:
      '開始記錄大家把哪些課排進課表，未登入的訪客課表也會一起納入，這樣才看得出哪些課是真的很多人在排。訪客的部分只存一組隨機的匿名識別碼和課號，不會帶到任何身分。另外瀏覽次數本來就有，只是這次改用匿名識別碼來算，同一個人重複點開同一門課不會再灌水，登入前後也會算成同一個人。',
  },
  {
    version: 'v4.1.0～v4.1.1',
    releasedAt: '2026-08-17',
    kind: 'feat',
    title: '開課班級與年級篩選',
    summary:
      '爬蟲新增抓「開課班級」，搜尋頁和課表規劃器都可以用年級、開課班別來篩課，課程上也會顯示班級標籤。另外修掉 iOS 點輸入框會自動放大的惱人問題。',
  },
  {
    version: 'v4.0.0',
    releasedAt: '2026-08-16',
    kind: 'feat',
    title: '訪客課表與課表規劃器',
    summary:
      '沒登入也可以排課表了！課表會先存在你自己的裝置上，之後登入再一鍵匯入帳號。另外新增課表規劃器，可以直接在格子上點選排課，課程頁也能直接加入課表（以前只能先收藏再加，有夠麻煩）。順便把多個分頁同時登入登出會互相打架的狀況修掉。',
  },
  {
    version: 'v3.3.0',
    releasedAt: '2026-08-01',
    kind: 'feat',
    title: '功能許願池上線',
    summary:
      '新增「功能許願」頁面，想要什麼功能可以直接許願，也能幫別人的願望投票，我會看票數決定先做哪個（盡量啦）。',
  },
  {
    version: 'v3.2.1',
    releasedAt: '2026-04-15',
    kind: 'feat',
    title: '白名單手動加入',
    summary:
      '在日本玩沒帶筆電，剛好有使用者想加白名單，直接用手機開 chatgpt 建一個功能出來  :3 於是...管理員後台可以直接把 Email 加進白名單了，還能一併填學號跟備註，不用再自己開資料庫來加',
  },
  {
    version: 'v3.2.0',
    releasedAt: '2026-03-27',
    kind: 'enhancement',
    title: '整體 UI 大幅美化',
    summary:
      '全站視覺風格統一：課程卡片、課程詳細頁、評論留言、個人頁、課表、版本頁等全面調整，加入黑框平陰影設計語言。版本頁新增時間軸；課表新增「現在」即時提示欄、課程清單可收合；換頁後自動捲回頂部。',
  },
  {
    version: 'v3.1.0',
    releasedAt: '2026-03-21',
    kind: 'feat',
    title: 'EWANT 遠距課程整合',
    summary:
      '新增 EWANT 遠距課程爬蟲與獨立搜尋 tab，課表中遠距課程改為獨立區塊顯示，不排入時間格也不參與衝堂判斷。',
  },
  {
    version: 'v3.0.2',
    releasedAt: '2026-03-14',
    kind: 'enhancement',
    title: 'Dcard 相關貼文補強',
    summary:
      '相關貼文數量現在會持久化；管理員匯入介面改善，支援課程關鍵字覆蓋設定，可手動掛載現有貼文；修正分頁時 Admin 統計資料被清空的問題。',
  },
  {
    version: 'v3.0.1',
    releasedAt: '2026-03-12',
    kind: 'feat',
    title: '評論留言功能上線',
    summary:
      '每則評論現在都可以留言、編輯與刪除',
  },
  {
    version: 'v3.0.0',
    releasedAt: '2026-03-12',
    kind: 'feat',
    title: 'Dcard 相關貼文與管理後台上線',
    summary:
      '課程頁新增相關貼文區塊，管理員後台可以匯入 Dcard 貼文、預覽自動配對課程、同步 Google 搜尋結果，也補上管理權限與匯入紀錄。',
  },
  {
    version: '2.1.1～2.1.4',
    releasedAt: '2026-03-05',
    kind: 'feat',
    title: '課表與搜尋體驗整合升級',
    summary:
      '課表手機版更好讀、未登入可先預覽並直接登入；登入視窗新增白名單/隱私 Q&A；課程卡片直接顯示學期；搜尋新增星期/節次（含時間）/學期多選進階篩選。',
  },
  {
    version: 'v2.1.0',
    releasedAt: '2026-03-04',
    kind: 'feat',
    title: '學期課表功能上線',
    summary:
      '終於把學期課表做出來了！現在可以切學期排課、檢查衝堂、從收藏加課，也支援衝堂課程的一鍵交換。',
  },
  {
    version: 'v2.0.0',
    releasedAt: '2026-03-04',
    kind: 'feat',
    title: 'emoji 評論互動',
    summary:
      '評論新增 emoji 互動，之後再來做評論留言互動。',
  },
  {
    version: 'v1.10.0',
    releasedAt: '2026-02-24',
    kind: 'feat',
    title: '個人頭像功能上線',
    summary:
      '個人頁現在可以選擇預設頭像，也能移除頭貼，浪費時間在這種沒用的地方 QQ 但網頁應該有更繽紛點...',
  },
  {
    version: 'v1.9.4',
    releasedAt: '2026-02-07',
    kind: 'enhancement',
    title: '後端連線池更省資源',
    summary: '連線池加入較小的預設值，小流量時也不會常駐太多連線',
  },
  {
    version: 'v1.9.3',
    releasedAt: '2026-01-31',
    kind: 'feat',
    title: '404 頁面上線',
    summary: '找不到頁面時會顯示友善的 404 畫面，並調整課程頁細節與路由',
  },
  {
    version: 'v1.9.1',
    releasedAt: '2026-01-27',
    kind: 'fix',
    title: '登入狀態更穩定',
    summary:
      '想說怎麼每次登入完關掉頁面再打開就被登出，原來之前根本沒寫好 🥲 現在應該不會一直被登出了',
  },
  {
    version: 'v1.9.0',
    releasedAt: '2026-01-27',
    kind: 'feat',
    title: '個人新頁面上線',
    summary:
      '類似哀居個人頁面，多了顯示數量統計，當然也改了 UI，應該有變好看一點，謝謝 gpt',
  },
  {
    version: 'v1.8.3',
    releasedAt: '2026-01-20',
    kind: 'fix',
    title: '排序記憶',
    summary:
      '又是 bug，原先排序的種類會在跳下一頁時又被洗成預設的排序種類，也修好ㄌ',
  },
  {
    version: 'v1.8.2',
    releasedAt: '2026-01-19',
    kind: 'fix',
    title: '使用者名稱更不容易撞名',
    summary:
      '也是 bug，幸好之前都沒有人取重複的名字，偷偷更一版修掉',
  },
  {
    version: 'v1.8.1',
    releasedAt: '2026-01-19',
    kind: 'fix',
    title: '課程排序更穩定',
    summary:
      '也是存在很久的 bug，排序原本會亂亂跳，拖很久終於修好了',
  },
  {
    version: 'v1.8.0',
    releasedAt: '2026-01-19',
    kind: 'feat',
    title: '評論卡片更好讀',
    summary:
      '改了評論卡片的 UI，主要就是縮小日期，再把給分的 rating 星星排版調整，再加個顯示更多顯示更少的功能，盡可能讓每張卡片一樣高，覺得進化滿多的，很滿意 :3',
  },
  {
    version: 'v1.7.1',
    releasedAt: '2026-01-19',
    kind: 'fix',
    title: '收藏切換即時更新',
    summary:
      '一個現在才發現的 bug，大概就是按了收藏，其實有收藏，但前端沒做好即時反應 :3',
  },
  {
    version: 'v1.7.0',
    releasedAt: '2026-01-18',
    kind: 'feat',
    title: '平台統計面板上線',
    summary:
      '把原本「TAINAN 選，求評價」區塊移除，新增一個統計平台，希望可以讓大家看到註冊人數，也能勇於註冊（？） BTW 這裡真的不是騙個資平台',
  },
  {
    version: 'v1.6.0',
    releasedAt: '2026-01-11',
    kind: 'enhancement',
    title: '頁面標題與 SEO 強化',
    summary:
      '把前一版的頁面標題打掉重練 _(:з)∠)_',
  },
  {
    version: 'v1.5.0',
    releasedAt: '2026-01-09',
    kind: 'enhancement',
    title: '頁面標題更精準',
    summary:
      '讓頁面標題可以動態改變，但只有 client 端，server 端沒做，有點麻煩，但沒做會讓 SEO 排名上不去 QQ 找時間來研究',
  },
  {
    version: 'v1.4.0',
    releasedAt: '2026-01-08',
    kind: 'feat',
    title: '常用連結頁面上線',
    summary:
      '弄了一個常用連結整理，希望這個平台可以跟大家更有黏著度',
  },
  {
    version: 'v1.3.0',
    releasedAt: '2026-01-01',
    kind: 'enhancement',
    title: 'SEO 強化整合',
    summary:
      '再改一版分享連結後會出現的縮圖',
  },
  {
    version: 'v1.2.0',
    releasedAt: '2026-01-01',
    kind: 'enhancement',
    title: 'SEO 基礎優化',
    summary:
      '試著改掉分享連結後會出現的縮圖...原本好醜，雖然改了也沒好到哪，盡力改',
  },
  {
    version: 'v1.1.0',
    releasedAt: '2025-12-30',
    kind: 'feat',
    title: '白名單登入更明確',
    summary:
      '剛好有想分享評價，但沒有學校信箱的同學提出來的想法，所以就做了一個人工審核的管道，可以手動幫忙加入白名單，盡可能讓大家都能分享修課心得啦～感謝大家願意分享🥹',
  },
  {
    version: 'v1.0.0',
    releasedAt: '2025-12-29',
    kind: 'enhancement',
    title: '更新爬蟲功能',
    summary:
      '第一次被學校擋爬蟲，只好更新一下寫法',
  },
  {
    version: 'v0.0.0',
    releasedAt: '2025-05-10',
    kind: 'feat',
    title: '正式版釋出',
    summary:
      '正式上線的第一天！目標是讓大家在網路上搜尋南大選課、南大的任何課程或老師，都能搜尋到 TAINAN 選',
  },
]
