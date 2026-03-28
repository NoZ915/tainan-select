# CLAUDE.md

此檔案為 Claude Code (claude.ai/code) 在此專案中操作時的參考指引。

## 專案簡介

**Tainan-Select** 是台南大學學生的選課探索與課表管理平台。採 monorepo 結構，分為獨立的 `backend/` 與 `frontend/` 目錄。

## 常用指令

### 後端（`cd backend`）
```bash
npm run start          # 開發伺服器，使用 nodemon + tsx（自動重載）
npm run migrate        # 執行 Sequelize DB migrations
npm run scrape         # 從學校網站爬取課程資料
npm run backfill:schedules  # 從 Course 資料補建 CourseSchedules
```

### 前端（`cd frontend`）
```bash
npm run dev            # 啟動 Vite 開發伺服器（預設：localhost:5173）
npm run build          # TypeScript 編譯 + 生產環境打包 → dist/
npm run lint           # ESLint 檢查
npm run preview        # 預覽生產環境建置結果
```

此專案目前無自動化測試。

## 架構說明

### 技術棧
- **後端**：Node.js + Express + TypeScript、MySQL via Sequelize ORM、Passport.js（Google OAuth 2.0）、JWT 驗證
- **前端**：React 19 + React Router v7、Vite、Mantine UI、Zustand（客戶端狀態）、TanStack React Query（伺服器狀態）、Axios

### 後端：分層架構

```
routes/ → controllers/ → services/ → repositories/ → models/
```

- **routes/**：Express 路由定義與 middleware 套用
- **controllers/**：HTTP 請求/回應處理、輸入驗證
- **services/**：業務邏輯、快取（`statsService`）、流程協調
- **repositories/**：所有 Sequelize 查詢；複雜的課程篩選（時段、系所）集中於此
- **models/**：Sequelize model 定義 + `index.ts`（Sequelize 實例）

### 驗證流程

1. Google OAuth via Passport → 建立/查找 User 記錄
2. JWT（7 天效期）設為 httpOnly cookie
3. `middlewares/authMiddleware.ts` 提供兩種 middleware：
   - `authenticateJWT`：強制驗證（未帶 token 回傳 401）
   - `getCookie`：選擇性驗證（有 token 則附加使用者資訊，無則繼續）

### 前端：狀態與資料流

- **Zustand**（`stores/authStore.ts`）：客戶端驗證狀態（isAuthenticated、user），持久化至 localStorage
- **React Query**（`hooks/`）：所有伺服器狀態；hook 命名慣例為 `useGet*`、`useUpsert*`、`useDelete*`
- **Axios**（`apis/axiosInstance.ts`）：全域 401 攔截器 → 觸發登出並清除驗證狀態
- **Query keys** 集中定義於 `hooks/queryKeys.ts`

### 路由守衛

- `pages/ProtectedRoute.tsx`：包裹需登入的路由
- `pages/AdminRoute.tsx`：包裹需管理員身分的路由

### 管理員功能

`admin.ts` 路由 + `adminController.ts` + `adminRelatedPostService.ts` 負責相關文章管理（從 Dcard 匯入、Google Sheets 同步、快取失效）。管理員身分驗證由 `middlewares/adminMiddleware.ts` 執行。

### 課程資料爬取

`scraper/scraper.ts` 從台南大學課程系統（ecourse.nutn.edu.tw）抓取資料，以 Cheerio 解析 HTML，寫入 `Courses` + `CourseSchedules` 資料表。使用 `p-limit` 控制並發數，並具備暫態網路錯誤的重試邏輯。

## 重要檔案

| 檔案 | 用途 |
|------|------|
| `backend/server.ts` | Express 應用設定、所有路由掛載 |
| `backend/models/index.ts` | Sequelize 實例與 DB 設定 |
| `backend/repositories/courseRepository.ts` | 含時段 join 的複雜課程篩選 |
| `backend/utils/jwt.ts` | JWT 簽發/驗證工具函式 |
| `frontend/src/main.tsx` | Router 設定與所有 Provider 包裝 |
| `frontend/src/apis/axiosInstance.ts` | Axios 設定與 401 攔截器 |
| `frontend/src/stores/authStore.ts` | 全域驗證狀態 |

## 環境變數

**後端**（`.env`）：`DB_USERNAME`、`DB_PASSWORD`、`DB_HOST`、`DB_PORT`、`DB_NAME`、`JWT_SECRET`、Google OAuth 憑證（`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`GOOGLE_CALLBACK_URL`）、`PORT`、`NODE_ENV`、`FRONTEND_BASE_URL`

**前端**（`.env`）：`VITE_API_BASE_URL`
