import axios from 'axios'
import { app } from 'electron'
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import extract from 'extract-zip'
import { spawn } from 'child_process'

const GITHUB_OWNER = 'L-Hong-Yu'
const GITHUB_REPO = 'IMGNote'
const GITHUB_API_BASE = 'https://api.github.com'

function normalizeVersion(v) {
  return String(v || '')
    .trim()
    .replace(/^v/i, '')
}

function compareSemver(a, b) {
  const pa = normalizeVersion(a)
    .split('.')
    .map((n) => parseInt(n, 10) || 0)
  const pb = normalizeVersion(b)
    .split('.')
    .map((n) => parseInt(n, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0
    const db = pb[i] ?? 0
    if (da > db) return 1
    if (da < db) return -1
  }
  return 0
}

function pickLatestRelease(releases) {
  if (!Array.isArray(releases) || releases.length === 0) return null
  // 优先按 tag_name 语义版本排序，否则按时间
  const withTag = releases.filter((r) => r?.tag_name)
  if (withTag.length) {
    return withTag.slice().sort((a, b) => compareSemver(b.tag_name, a.tag_name))[0]
  }
  return releases
    .slice()
    .sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0))[0]
}

function pickBestAsset(release) {
  const assets = Array.isArray(release?.assets) ? release.assets : []
  const byName = (pred) => assets.find((a) => pred(String(a?.name || '').toLowerCase()))
  const assetUrl = (a) => a?.browser_download_url || a?.url || ''

  // 优先：NSIS 安装包 exe（Windows）
  const exe =
    byName((n) => n.endsWith('.exe') && (n.includes('setup') || n.includes('安装') || n.includes('像素笔记'))) ||
    byName((n) => n.endsWith('.exe'))
  if (exe && assetUrl(exe)) {
    return {
      type: 'exe',
      name: exe.name,
      url: assetUrl(exe),
      size: exe.size || 0
    }
  }

  // 兜底：更新包 zip（含安装包）
  const updateZip =
    byName((n) => n.includes('update') && n.endsWith('.zip')) ||
    byName((n) => n.includes('升级') && n.endsWith('.zip')) ||
    byName((n) => n.endsWith('.zip'))
  if (updateZip && assetUrl(updateZip)) {
    return {
      type: 'zip',
      name: updateZip.name,
      url: assetUrl(updateZip),
      size: updateZip.size || 0
    }
  }

  return null
}

const RELEASES_URL = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000
const NETWORK_ERRORS = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'SOCKET_HANG_UP', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'READ ECONNRESET', 'SOCKET HANG UP']

function isRetryableError(e) {
  const code = e?.code || ''
  const message = String(e?.message || '').toUpperCase()
  return NETWORK_ERRORS.some((c) => code === c || message.includes(c.toUpperCase()))
}

async function withRetry(fn) {
  let lastErr
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (i < MAX_RETRIES - 1 && isRetryableError(e)) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS + i * 1000))
      } else {
        throw lastErr
      }
    }
  }
  throw lastErr
}

export async function checkForUpdate() {
  const currentVersion = app.getVersion()
  let releases
  try {
    const { data } = await withRetry(() =>
      axios.get(RELEASES_URL, {
        timeout: 30000,
        params: { per_page: 20, page: 1 },
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'IMGNote-Updater'
        }
      })
    )
    releases = Array.isArray(data) ? data : []
  } catch (e) {
    return {
      ok: false,
      updateAvailable: false,
      currentVersion,
      latestVersion: null,
      message: e?.message || '拉取 GitHub Release 失败'
    }
  }

  const latestRelease = pickLatestRelease(releases)
  if (!latestRelease) {
    return {
      ok: true,
      updateAvailable: false,
      currentVersion,
      latestVersion: null,
      message: '暂无可用 Release'
    }
  }

  const latestVersion = normalizeVersion(latestRelease.tag_name || latestRelease.name || '')
  if (!latestVersion) {
    return {
      ok: true,
      updateAvailable: false,
      currentVersion,
      latestVersion: null,
      message: 'Release 格式不正确（需有 tag_name）'
    }
  }

  const asset = pickBestAsset(latestRelease)
  if (!asset?.url) {
    return {
      ok: true,
      updateAvailable: false,
      currentVersion,
      latestVersion,
      message: '该 Release 未包含可用的安装包（.exe 或 .zip）'
    }
  }

  const updateAvailable = compareSemver(latestVersion, currentVersion) > 0

  return {
    ok: true,
    updateAvailable,
    currentVersion,
    latestVersion,
    releaseName: latestRelease.name || `IMGNote v${latestVersion}`,
    notes: latestRelease.body || '',
    publishedAt: latestRelease.created_at || latestRelease.published_at || '',
    parts: null,
    asset
  }
}

async function downloadToFile(url, destPath, onProgress) {
  await fsp.mkdir(path.dirname(destPath), { recursive: true })

  const urlsToTry = [url]
  if (url.includes('github.com') || url.includes('githubusercontent.com')) {
    urlsToTry.push(`https://ghproxy.com/${url}`)
  }

  let lastErr
  for (const tryUrl of urlsToTry) {
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        await fsp.rm(destPath, { force: true }).catch(() => {})
        const res = await axios.get(tryUrl, {
          responseType: 'stream',
          timeout: 0,
          headers: { 'User-Agent': 'IMGNote-Updater' }
        })
        const total = Number(res.headers['content-length'] || 0)
        let received = 0
        let lastEmitAt = 0
        let lastEmitReceived = 0
        const EMIT_INTERVAL_MS = 220
        await new Promise((resolve, reject) => {
          const out = fs.createWriteStream(destPath)
          res.data.on('data', (chunk) => {
            received += chunk.length
            if (typeof onProgress === 'function' && total > 0) {
              const now = Date.now()
              const shouldEmit =
                received >= total ||
                now - lastEmitAt >= EMIT_INTERVAL_MS ||
                received - lastEmitReceived >= 1024 * 256
              if (shouldEmit) {
                lastEmitAt = now
                lastEmitReceived = received
                onProgress({ received, total, percent: Math.min(100, (received / total) * 100) })
              }
            }
          })
          res.data.on('error', (e) => {
            out.destroy()
            reject(e)
          })
          out.on('error', reject)
          out.on('finish', resolve)
          res.data.pipe(out)
        })
        return
      } catch (e) {
        lastErr = e
        if (i < MAX_RETRIES - 1 && isRetryableError(e)) {
          if (typeof onProgress === 'function') {
            onProgress({ retrying: true, attempt: i + 1, maxRetries: MAX_RETRIES })
          }
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS + i * 2000))
        }
      }
    }
  }
  throw lastErr
}

async function findFirstExe(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isFile() && e.name.toLowerCase().endsWith('.exe')) return p
  }
  return null
}

function writeUpdateCmd({ installerExePath, relaunchExePath, cmdPath }) {
  // NSIS 静默：/S
  const lines = [
    '@echo off',
    'chcp 65001>nul',
    'setlocal',
    `start "" /wait "${installerExePath}" /S`,
    'timeout /t 2 /nobreak >nul',
    `start "" "${relaunchExePath}"`,
    'endlocal'
  ]
  return fsp.writeFile(cmdPath, lines.join('\r\n') + '\r\n', 'utf8')
}

export async function runUpdateFlow(
  { latestVersion, asset },
  { onStage, onProgress, relaunchExePath } = {}
) {
  if (!asset?.url) throw new Error('缺少更新资源 URL')
  const tmp = app.getPath('temp')
  const safeVer = String(latestVersion || 'latest').replace(/[^\w.-]+/g, '_')
  const workDir = path.join(tmp, `IMGNoteUpdate_${safeVer}`)
  await fsp.rm(workDir, { recursive: true, force: true }).catch(() => {})
  await fsp.mkdir(workDir, { recursive: true })

  const exeToRelaunch = relaunchExePath || process.execPath

  if (typeof onStage === 'function') onStage({ stage: 'downloading' })
  const downloadTarget =
    asset.type === 'exe'
      ? path.join(workDir, 'setup.exe')
      : path.join(workDir, `update_${safeVer}.zip`)

  await downloadToFile(asset.url, downloadTarget, (p) => {
    if (typeof onProgress === 'function') onProgress({ stage: 'downloading', ...p })
  })

  let installerExePath = null
  if (asset.type === 'exe') {
    installerExePath = downloadTarget
  } else {
    if (typeof onStage === 'function') onStage({ stage: 'extracting' })
    const extractDir = path.join(workDir, 'extracted')
    await fsp.mkdir(extractDir, { recursive: true })
    await extract(downloadTarget, { dir: extractDir })
    installerExePath = await findFirstExe(extractDir)
  }

  if (!installerExePath) throw new Error('未找到安装包 exe（更新压缩包内需包含 .exe）')

  if (typeof onStage === 'function') onStage({ stage: 'installing' })
  const cmdPath = path.join(workDir, 'run-update.cmd')
  await writeUpdateCmd({ installerExePath, relaunchExePath: exeToRelaunch, cmdPath })

  // 先启动安装脚本（独立进程），再退出当前程序
  spawn('cmd.exe', ['/c', cmdPath], {
    detached: true,
    windowsHide: true,
    stdio: 'ignore'
  }).unref()

  return workDir
}
