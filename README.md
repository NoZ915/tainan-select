<div align="center">

<h1>TAINAN SELECT</h1>

<p><em>Course discovery, review, and timetable platform for National University of Tainan students.</em></p>
<p><em>國立臺南大學學生使用的課程搜尋、評價與課表平台。</em></p>

<img alt="last-commit" src="https://img.shields.io/github/last-commit/NoZ915/tainan-select?style=flat&logo=git&logoColor=white&color=0080ff" />
<img alt="repo-top-language" src="https://img.shields.io/github/languages/top/NoZ915/tainan-select?style=flat&color=0080ff" />
<img alt="repo-language-count" src="https://img.shields.io/github/languages/count/NoZ915/tainan-select?style=flat&color=0080ff" />

<p><em>Built with the tools and technologies below.</em></p>

<p>
  <img alt="React" src="https://img.shields.io/badge/React-61DAFB.svg?style=flat&logo=React&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=flat&logo=TypeScript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF.svg?style=flat&logo=Vite&logoColor=white" />
  <img alt="Mantine" src="https://img.shields.io/badge/Mantine-339AF0.svg?style=flat&logo=Mantine&logoColor=white" />
  <img alt="React Query" src="https://img.shields.io/badge/TanStack_Query-FF4154.svg?style=flat&logo=reactquery&logoColor=white" />
  <img alt="Zustand" src="https://img.shields.io/badge/Zustand-443E38.svg?style=flat&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-000000.svg?style=flat&logo=Express&logoColor=white" />
  <img alt="Passport" src="https://img.shields.io/badge/Passport-34E27A.svg?style=flat&logo=Passport&logoColor=white" />
  <img alt="JWT" src="https://img.shields.io/badge/JWT-000000.svg?style=flat&logo=JSON%20web%20tokens&logoColor=white" />
  <img alt="Sequelize" src="https://img.shields.io/badge/Sequelize-52B0E7.svg?style=flat&logo=Sequelize&logoColor=white" />
  <img alt="MySQL" src="https://img.shields.io/badge/MySQL-4479A1.svg?style=flat&logo=MySQL&logoColor=white" />
  <img alt="Axios" src="https://img.shields.io/badge/Axios-5A29E4.svg?style=flat&logo=Axios&logoColor=white" />
  <img alt="Cheerio" src="https://img.shields.io/badge/Cheerio-E88C1F.svg?style=flat&logo=Cheerio&logoColor=white" />
  <img alt="ESLint" src="https://img.shields.io/badge/ESLint-4B32C3.svg?style=flat&logo=ESLint&logoColor=white" />
  <img alt="nodemon" src="https://img.shields.io/badge/Nodemon-76D04B.svg?style=flat&logo=Nodemon&logoColor=white" />
</p>

</div>

TAINAN SELECT is a full-stack web application built to make course selection easier for NUTN students. It combines searchable course data, user-generated reviews, favorites, semester timetable planning, and course-related community posts in one product.

TAINAN SELECT 是一個為國立臺南大學學生打造的全端網站，整合課程搜尋、修課評價、收藏、學期課表規劃，以及課程相關社群貼文，讓選課前的資訊整理與分享更有效率。

## Overview / 專案概覽

- Course data is collected from the university's public course system through backend scraping and normalization scripts.
- The platform supports Google OAuth login, course reviews, reactions, comments, favorites, and semester-based timetable management.
- An admin console supports manual Dcard post import, automatic course matching preview, and Google search synchronization for related posts.
- 課程資料來自學校公開課程系統，後端負責爬取、清理與正規化。
- 平台支援 Google OAuth 登入、課程評價、互動 reaction、留言、收藏與學期課表管理。
- 管理後台可手動匯入 Dcard 貼文、預覽課程配對結果，並同步 Google 搜尋到的相關貼文。

## Core Features / 核心功能

- Course search and filtering by keyword, instructor, department, academy, semester, weekday, and period.
- Course detail pages with structured metadata, reviews, and related posts.
- Review system with create, edit, delete, emoji reactions, and threaded comments.
- User profile with favorites, review history, and avatar management.
- Semester timetable planning with conflict detection, swap flow, and quick add from favorites.
- Admin tools for related post import, cleanup, and sync operations.
- Dynamic page titles and SEO-oriented metadata handling on the frontend.
- 依關鍵字、老師、系所、學院、學期、星期與節次進行課程搜尋與篩選。
- 課程詳情頁整合課程資訊、評價內容與相關貼文。
- 評價系統支援新增、編輯、刪除、emoji reaction 與留言互動。
- 個人頁可管理收藏、歷史評論與頭像。
- 學期課表支援衝堂檢查、換課流程，以及從收藏快速加課。
- 管理端提供相關貼文匯入、維護與同步工具。
- 前端具備動態標題與 SEO 相關處理。

## Tech Stack / 技術棧

| Layer | Stack |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 6, React Router 7, TanStack Query 5, Mantine, Mantine Notifications, Mantine Hooks, Zustand, Unhead |
| Backend | Node.js, Express 4, TypeScript, Passport, Passport Google OAuth 2.0, JWT, cookie-parser, CORS, Sequelize |
| Database | MySQL, MySQL2 |
| Data Pipeline | Axios, Cheerio, custom scraper scripts, schedule backfill scripts |
| Tooling | ESLint 9, tsx, nodemon, sequelize-cli |

## Libraries In Use / 主要套件

- Frontend UI and state: `@mantine/core`, `@mantine/hooks`, `@mantine/notifications`, `zustand`
- Frontend routing and data flow: `react-router-dom`, `@tanstack/react-query`, `axios`
- Frontend metadata and UX: `@unhead/react`, `react-icons`, `react-intersection-observer`
- Backend auth and API: `express`, `passport`, `passport-google-oauth20`, `jsonwebtoken`, `google-auth-library`, `cookie-parser`, `cors`
- Backend data layer: `sequelize`, `mysql2`
- Data ingestion: `axios`, `cheerio`, `p-limit`
- Developer tooling: `typescript`, `tsx`, `nodemon`, `eslint`, `sequelize-cli`
- 前端 UI 與狀態管理：`@mantine/core`, `@mantine/hooks`, `@mantine/notifications`, `zustand`
- 前端路由與資料存取：`react-router-dom`, `@tanstack/react-query`, `axios`
- 前端 SEO 與互動體驗：`@unhead/react`, `react-icons`, `react-intersection-observer`
- 後端驗證與 API：`express`, `passport`, `passport-google-oauth20`, `jsonwebtoken`, `google-auth-library`, `cookie-parser`, `cors`
- 後端資料層：`sequelize`, `mysql2`
- 資料抓取與整理：`axios`, `cheerio`, `p-limit`
- 開發工具：`typescript`, `tsx`, `nodemon`, `eslint`, `sequelize-cli`

## Project Structure / 專案結構

```text
tainan-select/
+-- frontend/   # React + Vite client
+-- backend/    # Express API, auth, scraper, database models
\-- README.md
```

## Requirements / 環境需求

- Node.js 20+ recommended
- npm 10+ recommended
- MySQL database
- Google OAuth credentials
- 建議使用 Node.js 20 以上版本
- 建議使用 npm 10 以上版本
- 需要可用的 MySQL 資料庫
- 需要 Google OAuth 憑證

## Getting Started / 快速開始

### 1. Install dependencies / 安裝套件

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment variables / 設定環境變數

Create `.env` files from the examples below:
請先根據範例檔建立 `.env`：

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Backend variables:
後端環境變數：

| Variable | Description |
| --- | --- |
| `PORT` | Backend server port |
| `DB_USERNAME` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |
| `DB_HOST` | Database host |
| `DB_PORT` | Database port |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `ALLOWED_EMAIL_DOMAIN` | Allowed login email domain |
| `FRONTEND_BASE_URL` | Frontend origin used for CORS and OAuth redirect |
| `JWT_SECRET` | JWT signing secret |

Frontend variables:
前端環境變數：

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID for frontend |

### 3. Run database migration / 執行資料庫 migration

```bash
cd backend
npm run migrate
```

### 4. Start the development servers / 啟動開發環境

Backend:
後端：

```bash
cd backend
npm run start
```

Frontend:
前端：

```bash
cd frontend
npm run dev
```

Default local endpoints:
本機預設網址：

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:<PORT>`

## Available Scripts / 可用指令

### Frontend / 前端

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build production bundle |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

### Backend / 後端

| Command | Description |
| --- | --- |
| `npm run start` | Start API server with `nodemon` + `tsx` |
| `npm run migrate` | Run Sequelize migrations |
| `npm run scrape` | Crawl and sync course data from the school course site |
| `npm run backfill:schedules` | Rebuild normalized course schedule records |

## Current Highlights / 近期功能

- `v3.0.1`: Review comments
- `v3.0.0`: Related posts and admin console
- `v2.1.0`: Semester timetable and conflict handling
- `v3.0.1`：評論留言功能
- `v3.0.0`：相關貼文與管理後台
- `v2.1.0`：學期課表與衝堂處理

Full release history is maintained in `frontend/src/constants/versionHistory.ts`.
完整版本紀錄可參考 `frontend/src/constants/versionHistory.ts`。

## Notes / 注意事項

- The backend uses cookies, JWT, and Google OAuth. Make sure `FRONTEND_BASE_URL` matches the redirect URI configured in Google Cloud Console.
- The scraper depends on the structure of the university's public course pages. If the source markup changes, scraper updates may be required.
- There is no root-level monorepo script at the moment. Frontend and backend are installed and run separately.
- 後端使用 cookies、JWT 與 Google OAuth，本地開發時要確認 `FRONTEND_BASE_URL` 與 Google Cloud Console 設定的 redirect URI 一致。
- 爬蟲依賴學校公開課程頁面的 HTML 結構，若來源頁面改版，可能需要同步調整 scraper。
- 目前根目錄沒有 monorepo 指令，前後端需要分別安裝與啟動。

## License / 授權說明

This project is for educational and internal product development use unless stated otherwise by the repository owner.
除非 repository owner 另有說明，否則本專案目前以教育用途與內部產品開發用途為主。
