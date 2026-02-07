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
