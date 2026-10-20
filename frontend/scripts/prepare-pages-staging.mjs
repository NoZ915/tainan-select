import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const apiUrl = new URL(process.env.VITE_API_BASE_URL || '')
if (
  apiUrl.origin !== 'https://api-staging.nutnselect.com'
  || apiUrl.pathname !== '/api'
  || apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash
) {
  throw new Error('Pages 測試建置只能連到已核對的隔離 API')
}
if (process.env.CF_PAGES !== '1') {
  throw new Error('此步驟僅供 Pages 測試建置使用')
}

const outputDirectory = path.resolve('dist')
const indexPath = path.join(outputDirectory, 'index.html')
if (existsSync(path.join(outputDirectory, '404.html'))) {
  throw new Error('Pages SPA 不可包含頂層 404.html')
}

const sourceHtml = readFileSync(indexPath, 'utf8')
const html = sourceHtml.replace(
  /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
  (script, attributes, contents) => (
    /googletagmanager\.com\/gtag\/js/.test(attributes)
    || /\bgtag\s*\(\s*['"]config['"]/.test(contents)
  ) ? '' : script,
)
if (/googletagmanager\.com|\bgtag\s*\(/.test(html)) {
  throw new Error('測試建置仍包含正式 Google Analytics')
}
if (!html.includes('</head>')) {
  throw new Error('找不到 HTML head，無法設定測試站索引限制')
}

// 僅修改建置產物，正式站原始 HTML 與 SEO 檔案不變。
writeFileSync(indexPath, html.replace('</head>', '<meta name="robots" content="noindex, nofollow, noarchive" />\n</head>'))
writeFileSync(path.join(outputDirectory, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n')
writeFileSync(path.join(outputDirectory, 'robots.txt'), 'User-agent: *\nDisallow: /\n')
rmSync(path.join(outputDirectory, 'sitemap.xml'), { force: true })
console.log('Pages 測試產物已限制索引並移除正式 Google Analytics')
