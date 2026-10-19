import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const scriptPath = fileURLToPath(new URL('../../scripts/prepare-pages-staging.mjs', import.meta.url))

function withBuild(callback) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'tainan-pages-test-'))
  mkdirSync(path.join(directory, 'dist'))
  const html = '<head><script async src="https://www.googletagmanager.com/gtag/js?id=G-example"></script><script>function gtag() {} gtag("config", "G-example")</script><script type="module" src="/assets/app-hash.js"></script></head><body><div id="root"></div></body>'
  writeFileSync(path.join(directory, 'dist/index.html'), html)
  writeFileSync(path.join(directory, 'dist/sitemap.xml'), '正式 sitemap')
  const run = (overrides = {}) => spawnSync(process.execPath, [scriptPath], {
    cwd: directory,
    encoding: 'utf8',
    env: { ...process.env, CF_PAGES: '1', VITE_API_BASE_URL: 'https://api-staging.nutnselect.com/api', ...overrides },
  })
  try {
    callback({ directory, html, run })
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

test('測試產物移除正式追蹤並保留應用程式入口', () => withBuild(({ directory, run }) => {
  assert.equal(run().status, 0)
  const html = readFileSync(path.join(directory, 'dist/index.html'), 'utf8')
  assert.doesNotMatch(html, /googletagmanager|gtag\(/)
  assert.match(html, /src="\/assets\/app-hash.js"/)
  assert.match(html, /name="robots" content="noindex, nofollow, noarchive"/)
  assert.match(readFileSync(path.join(directory, 'dist/_headers'), 'utf8'), /X-Robots-Tag: noindex/)
  assert.equal(readFileSync(path.join(directory, 'dist/robots.txt'), 'utf8'), 'User-agent: *\nDisallow: /\n')
  assert.throws(() => readFileSync(path.join(directory, 'dist/sitemap.xml')))
}))

test('拒絕正式 API 並保持輸出未修改', () => withBuild(({ directory, html, run }) => {
  assert.notEqual(run({ VITE_API_BASE_URL: 'https://api.nutnselect.com/api' }).status, 0)
  assert.equal(readFileSync(path.join(directory, 'dist/index.html'), 'utf8'), html)
}))

test('拒絕在一般建置或含頂層 404 的輸出執行', () => withBuild(({ directory, run }) => {
  assert.notEqual(run({ CF_PAGES: '' }).status, 0)
  writeFileSync(path.join(directory, 'dist/404.html'), '404')
  assert.notEqual(run().status, 0)
}))
