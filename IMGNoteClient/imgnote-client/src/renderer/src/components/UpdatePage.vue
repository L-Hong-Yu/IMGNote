<template>
  <div class="update">
    <div class="card">
      <div class="head">
        <div class="title">{{ stageText }}</div>
        <div class="sub">
          <span class="ver">当前 {{ info.currentVersion }}</span>
          <span class="sep">→</span>
          <span class="ver strong">最新 {{ info.latestVersion || '-' }}</span>
        </div>
      </div>

      <div class="body">
        <div v-if="state.stage === 'ready'" class="hint">检测到新版本，是否下载并更新？</div>

        <div v-else class="progress">
          <div class="progress-bar" :class="{ indeterminate: state.stage !== 'downloading' }">
            <div
              v-if="state.stage === 'downloading'"
              class="progress-fill"
              :style="{ width: state.percent + '%' }"
            ></div>
            <div v-else class="progress-fill ind"></div>
          </div>
          <div class="progress-meta">
            <span v-if="state.stage === 'downloading'">
              {{ state.percent.toFixed(0) }}%（{{ formatBytes(state.received) }} /
              {{ formatBytes(state.total) }}）
            </span>
            <span v-if="state.stage === 'downloading'" class="progress-extra">
              {{ formatBytes(state.speedBps) }}/s · 剩余 {{ formatEta(state.etaSec) }}
            </span>
            <span v-else>请稍候…</span>
          </div>
        </div>

        <div v-if="state.stage === 'error'" class="error">
          <span>{{ state.error || '更新失败，请稍后重试。' }}</span>
          <p class="error-hint">
            请前往 GitHub 下载最新版本：
            <a
              :href="GITHUB_RELEASES_URL"
              target="_blank"
              rel="noopener noreferrer"
              class="error-link"
            >
              前往下载
            </a>
          </p>
        </div>

        <details v-if="info.notes" class="notes">
          <summary>更新说明</summary>
          <pre class="notes-text">{{ info.notes }}</pre>
        </details>
      </div>

      <div class="actions">
        <button v-if="canSkip" type="button" class="btn btn-ghost" @click="skip">稍后</button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="state.stage !== 'ready'"
          @click="start"
        >
          {{ state.stage === 'ready' ? '立即更新' : '更新中…' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive } from 'vue'

/** 更新失败时引导用户到此页面下载 */
const GITHUB_RELEASES_URL = 'https://github.com/L-Hong-Yu/IMGNote/releases'

const props = defineProps({
  info: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['skip'])

const state = reactive({
  stage: 'ready',
  percent: 0,
  received: 0,
  total: 0,
  speedBps: 0,
  etaSec: null,
  error: ''
})

const stageText = computed(() => {
  switch (state.stage) {
    case 'ready':
      return '发现新版本'
    case 'downloading':
      return '正在下载更新…'
    case 'extracting':
      return '正在解压更新…'
    case 'installing':
      return '正在安装更新…'
    case 'restarting':
      return '即将重启完成更新…'
    case 'error':
      return '更新失败'
    default:
      return ''
  }
})

const canSkip = computed(() => ['ready', 'error'].includes(state.stage))

let offProgress = null
let lastSampleAt = 0
let lastSampleReceived = 0
let lastUiAt = 0

function updateSpeedAndEta(received, total) {
  const now = Date.now()
  if (!lastSampleAt) {
    lastSampleAt = now
    lastSampleReceived = received
    state.speedBps = 0
    state.etaSec = null
    return
  }
  const dt = now - lastSampleAt
  const db = received - lastSampleReceived
  if (dt <= 0 || db <= 0) return

  if (now - lastUiAt < 320) {
    lastSampleAt = now
    lastSampleReceived = received
    return
  }
  lastUiAt = now

  const inst = (db * 1000) / dt
  state.speedBps = state.speedBps ? state.speedBps * 0.75 + inst * 0.25 : inst
  if (total > 0 && state.speedBps > 1) {
    const remain = Math.max(0, total - received)
    state.etaSec = Math.ceil(remain / state.speedBps)
  } else {
    state.etaSec = null
  }

  lastSampleAt = now
  lastSampleReceived = received
}

onMounted(() => {
  offProgress = window.api?.updater?.onProgress?.((p) => {
    if (!p) return
    if (p.stage) state.stage = p.stage
    if (p.mode === 'progress' && typeof p.percent === 'number') {
      state.percent = Math.max(0, Math.min(100, p.percent))
      state.received = p.received || 0
      state.total = p.total || 0
      if (state.stage === 'downloading') {
        updateSpeedAndEta(state.received, state.total)
      }
    }
    if (p.ok === false && p.message) {
      state.stage = 'error'
      state.error = p.message
    }
  })
})
onUnmounted(() => {
  if (typeof offProgress === 'function') offProgress()
})

function formatBytes(n) {
  const v = Number(n || 0)
  if (!v) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let x = v
  while (x >= 1024 && i < units.length - 1) {
    x /= 1024
    i++
  }
  return `${x.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatEta(sec) {
  const s = Number(sec)
  if (!Number.isFinite(s) || s <= 0) return '—'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = Math.floor(s % 60)
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`
}

async function start() {
  if (!window.api?.updater?.start) return
  state.stage = 'downloading'
  state.percent = 0
  state.error = ''
  state.speedBps = 0
  state.etaSec = null
  lastSampleAt = 0
  lastSampleReceived = 0
  lastUiAt = 0

  const rawParts = Array.isArray(props.info.parts) ? props.info.parts : []
  const cleanParts = rawParts.map((part, i) => ({
    index: part.index ?? i + 1,
    total: part.total ?? rawParts.length,
    url: part.url,
    size: part.size,
    name: part.name
  }))

  const rawAsset = props.info.asset
  const cleanAsset = rawAsset
    ? {
        type: rawAsset.type,
        name: rawAsset.name,
        url: rawAsset.url,
        size: rawAsset.size
      }
    : null

  const payload = {
    latestVersion: props.info.latestVersion,
    asset: cleanAsset,
    parts: cleanParts
  }

  const res = await window.api.updater.start(payload)
  if (res?.ok === false) {
    state.stage = 'error'
    state.error = res.message || '更新失败'
  }
}

function skip() {
  emit('skip')
}
</script>

<style scoped>
.update {
  user-select: none;
  height: 100%;
  width: 100%;
  display: grid;
  place-items: center;
  padding: 28px;
  background:
    radial-gradient(600px 280px at 50% 0%, var(--accent-subtle), transparent 60%),
    linear-gradient(180deg, var(--bg-page), var(--bg-muted));
}
.card {
  width: min(640px, 92vw);
  background: var(--overlay-panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow-dialog);
  overflow: hidden;
  backdrop-filter: blur(10px);
  transition:
    background 0.25s ease,
    border-color 0.25s ease;
}
.head {
  padding: 20px 22px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
  transition: background 0.25s ease;
}
.title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}
.sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: 8px;
}
.ver.strong {
  color: var(--text-secondary);
  font-weight: 600;
}
.sep {
  opacity: 0.7;
}
.body {
  padding: 18px 22px 6px;
}
.hint {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
}
.progress {
  margin-top: 4px;
}
.progress-bar {
  height: 10px;
  border-radius: 999px;
  background: var(--bg-muted);
  overflow: hidden;
  border: 1px solid var(--border);
  transition:
    background 0.25s ease,
    border-color 0.25s ease;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-subtle));
  border-radius: 999px;
  transition: width 0.18s ease;
}
.progress-fill.ind {
  width: 36%;
  animation: ind 1.15s ease-in-out infinite;
}
.progress-meta {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-tertiary);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.progress-extra {
  color: var(--text-tertiary);
}
.error {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--danger-hover-bg);
  color: var(--danger);
  font-size: 13px;
  transition:
    background 0.25s ease,
    color 0.25s ease;
}
.error-hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}
.error-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
}
.error-link:hover {
  text-decoration: underline;
}
.notes {
  margin-top: 14px;
  border-top: 1px dashed var(--border);
  padding-top: 10px;
}
.notes summary {
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  color: var(--text-secondary);
}
.notes-text {
  margin-top: 8px;
  padding: 10px 12px;
  background: var(--bg-hover);
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow: auto;
  transition: background 0.25s ease;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 22px 20px;
}
.btn {
  user-select: none;
  padding: 9px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.btn-primary {
  background: var(--accent);
  color: var(--accent-fg);
}
.btn-primary:hover:enabled {
  background: var(--accent-hover);
}
.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}
.btn-ghost:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

@keyframes ind {
  0% {
    transform: translateX(-120%);
  }
  55% {
    transform: translateX(160%);
  }
  100% {
    transform: translateX(260%);
  }
}
</style>
