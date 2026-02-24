<template>
  <div class="editor" @mousemove="onEditorMouseMove">
    <div class="editor-header-wrap" :class="{ 'is-hidden': !barsVisible }">
      <header class="editor-header" :class="{ 'is-visible': barsVisible }">
        <button type="button" class="back-btn" aria-label="返回" @click="goBack">
          <span class="back-arrow">←</span>
        </button>
        <h1 class="editor-title">{{ title || '笔记本' }}</h1>
        <CustomTooltip content="搜索 (Ctrl+F)">
          <button
            type="button"
            class="search-btn"
            aria-label="搜索"
            @click="openSearch"
          >
            <svg
              class="search-icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </CustomTooltip>
        <CustomTooltip :content="wrapEnabled ? '自动换行：已开启' : '自动换行：已关闭'">
          <button
            type="button"
            class="wrap-toggle-btn"
            :class="{ 'is-on': wrapEnabled }"
            @click="toggleWrap"
          >
            <span class="wrap-toggle-pill">
              <span class="wrap-toggle-dot"></span>
              <span class="wrap-toggle-text">{{ wrapEnabled ? '自动换行' : '单行' }}</span>
            </span>
          </button>
        </CustomTooltip>
        <button
          type="button"
          class="enc-btn"
          :disabled="needsPassword || isLoadingContent || saving"
          @click="
            () => {
              encryptError = ''
              showEncryptDialog = true
            }
          "
        >
          {{ isEncrypted ? '加密设置' : '加密' }}
        </button>
        <CustomTooltip content="保存 (Ctrl+S)">
          <button
            type="button"
            class="btn btn-primary save-btn"
            :disabled="needsPassword || !dirty || saving"
            @click="save"
          >
            {{ saving ? '保存中…' : '保存' }}
          </button>
        </CustomTooltip>
      </header>
      <!-- 顶部栏显示模式切换：始终显示 / 自动 / 始终隐藏 -->
      <CustomTooltip :content="`工具栏显示：${barsModeLabel}`" class="bars-mode-tooltip">
        <button
          type="button"
          class="bars-mode-toggle"
          :class="`mode-${barsMode}`"
          @click="cycleBarsMode"
        >
          <span class="bars-mode-shape" :class="`shape-${barsMode}`"></span>
        </button>
      </CustomTooltip>
    </div>
    <!-- 搜索栏：Ctrl+F 唤起 -->
    <Transition name="search-slide">
      <div v-if="showSearchBar" class="editor-search-bar" :class="{ 'is-visible': barsVisible }">
        <div class="editor-search-inner">
          <svg
            class="editor-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="editor-search-input"
            placeholder="搜索文本…"
            spellcheck="false"
            autocomplete="off"
            @keydown.enter.prevent.stop
            @keydown.shift.enter.prevent.stop
            @keydown.esc="closeSearch"
          />
          <div class="editor-search-actions">
            <span v-if="searchQuery" class="editor-search-count">
              {{
                searchMatches.length > 0
                  ? `${currentMatchIndex < 0 ? 0 : currentMatchIndex + 1} / ${searchMatches.length}`
                  : '无匹配'
              }}
            </span>
            <CustomTooltip content="上一个">
              <button
                type="button"
                class="editor-search-btn"
                :disabled="!searchQuery || searchMatches.length === 0"
                @click="searchPrev"
              >
                <span class="editor-search-btn-icon">▲</span>
              </button>
            </CustomTooltip>
            <CustomTooltip content="下一个">
              <button
                type="button"
                class="editor-search-btn"
                :disabled="!searchQuery || searchMatches.length === 0"
                @click="searchNext"
              >
                <span class="editor-search-btn-icon">▼</span>
              </button>
            </CustomTooltip>
            <CustomTooltip content="关闭 (Esc)">
              <button
                type="button"
                class="editor-search-close"
                @click="closeSearch"
              >
                ✕
              </button>
            </CustomTooltip>
          </div>
        </div>
      </div>
    </Transition>
    <div class="editor-body">
      <div class="editor-with-lines" :class="{ 'is-wrap': wrapEnabled }">
        <div
          v-if="!wrapEnabled"
          ref="linesRef"
          class="editor-lines"
          aria-hidden="true"
          :style="{ fontSize: fontSize + 'px', lineHeight: lineHeight }"
          @click="focusEditor"
        >
          <template v-if="lineCount <= VIRTUAL_LINE_THRESHOLD">
            <div
              v-for="n in lineCount"
              :key="n"
              class="editor-line-num"
              :class="{ current: n === currentLine }"
              :style="{ height: fontSize * lineHeight + 'px', lineHeight: lineHeight + 'em' }"
            />
          </template>
          <div
            v-else
            class="editor-lines-inner"
            :style="{ height: lineCount * lineHeightPx + 'px' }"
          >
            <div
              v-for="n in visibleLineNumbers"
              :key="n"
              class="editor-line-num editor-line-num-virtual"
              :class="{ current: n === currentLine }"
              :style="{
                top: (n - 1) * lineHeightPx + 'px',
                height: lineHeightPx + 'px',
                lineHeight: lineHeight + 'em'
              }"
            />
          </div>
        </div>
        <div class="editor-textarea-wrap" @click="focusEditor">
          <textarea
            ref="textareaRef"
            :value="content"
            class="editor-textarea"
            placeholder="在此输入内容…"
            spellcheck="false"
            :disabled="needsPassword"
            :style="{
              fontSize: fontSize + 'px',
              lineHeight: lineHeight + 'em',
              whiteSpace: wrapEnabled ? 'pre-wrap' : 'nowrap',
              overflowX: wrapEnabled ? 'hidden' : 'auto'
            }"
            @input="onContentInput"
            @keydown="onKeydown"
            @keyup="scheduleUpdateCurrentLine"
            @scroll="onScroll"
            @click="updateCurrentLine"
            @focus="
              () => {
                onEditorFocus()
                updateCurrentLine()
              }
            "
            @blur="onEditorBlur"
          />
          <footer class="editor-footer" :class="{ 'is-visible': barsVisible }" aria-live="polite">
            <div v-if="!wrapEnabled" class="editor-footer-left">
              <span class="editor-pos"> {{ currentLine }} 行 · {{ currentCol }} 列 </span>
            </div>
            <template v-if="maxBytes != null">
              <div class="editor-footer-center">
                <span class="editor-progress-label">容量使用</span>
                <div class="editor-progress-track">
                  <div
                    class="editor-progress-fill"
                    :style="{
                      width: displayStats.percentNum + '%',
                      background: displayStats.color
                    }"
                  />
                </div>
                <span class="editor-percent" :style="{ color: displayStats.color }">{{
                  displayStats.percent
                }}</span>
              </div>
            </template>
            <div v-else class="editor-footer-spacer"></div>
            <div class="editor-footer-right">
              <span class="editor-stat">{{ displayStats.chars.toLocaleString() }} 字符</span>
              <span class="editor-stat editor-byte">
                {{ displayStats.bytes.toLocaleString() }} 字节
                <template v-if="maxBytes != null"> / {{ maxBytes.toLocaleString() }} 字节</template>
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
    <ConfirmDialog
      v-model:visible="showLeaveConfirm"
      title="未保存的修改"
      message="有未保存的修改，确定离开？"
      confirm-text="确定离开"
      cancel-text="取消"
      @confirm="onConfirmLeave"
    />
    <PasswordDialog
      v-model:visible="needsPassword"
      title="需要密码"
      message="该笔记本已加密，请输入密码后打开编辑"
      confirm-text="解锁"
      cancel-text="返回"
      :error="passwordError"
      @confirm="unlock"
      @cancel="router.push('/')"
    />
    <EncryptionDialog
      v-model:visible="showEncryptDialog"
      v-model:error="encryptError"
      :encrypted="isEncrypted"
      :preset-current-password="notePassword"
      @enable="enableEncryption"
      @change="changeEncryptionPassword"
      @disable="disableEncryption"
    />
    <LoadingOverlay :visible="isLoadingContent" text="读取中" />
    <LoadingOverlay :visible="saving" text="保存中" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { readNote, writeNote } from '@/api/notebook'
import Message from '@/utils/Message'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import PasswordDialog from '@/components/PasswordDialog.vue'
import EncryptionDialog from '@/components/EncryptionDialog.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import CustomTooltip from '@/components/CustomTooltip.vue'
import md5 from 'js-md5'

const route = useRoute()
const router = useRouter()
const id = computed(() => decodeURIComponent(route.params.id || ''))
const title = ref('')
const content = ref('')
const notebookData = ref(null)
const saving = ref(false)
const dirty = ref(false)
const isLoadingContent = ref(false)
const textareaRef = ref(null)
const linesRef = ref(null)
const searchInputRef = ref(null)

// 搜索功能
const showSearchBar = ref(false)
const searchQuery = ref('')
const currentMatchIndex = ref(-1)
const showLeaveConfirm = ref(false)
const needsPassword = ref(false)
const passwordError = ref('')
const notePassword = ref('')
const showEncryptDialog = ref(false)
const encryptError = ref('')
const fontSize = ref(15)
const lineHeight = ref(1.6)
const wrapEnabled = ref(false)

// 顶部栏/底部栏显示模式：
// - always：始终显示
// - auto：自动显示/隐藏（原有逻辑）
// - hidden：始终隐藏
const HIDE_BARS_DELAY = 2000
const editorFocused = ref(false)
const uiBarsVisible = ref(true)
const barsMode = ref('auto') // 'always' | 'auto' | 'hidden'
let hideBarsTimer = null

const barsVisible = computed(() => {
  if (barsMode.value === 'always') return true
  if (barsMode.value === 'hidden') return false
  return !editorFocused.value || uiBarsVisible.value
})

const barsModeLabel = computed(() => {
  if (barsMode.value === 'always') return '始终显示'
  if (barsMode.value === 'hidden') return '始终隐藏'
  return '自动显示'
})

const barsModeShortLabel = computed(() => {
  if (barsMode.value === 'always') return '显'
  if (barsMode.value === 'hidden') return '隐'
  return '自'
})

function cycleBarsMode() {
  if (barsMode.value === 'auto') barsMode.value = 'always'
  else if (barsMode.value === 'always') barsMode.value = 'hidden'
  else barsMode.value = 'auto'
}

function onEditorMouseMove() {
  if (barsMode.value !== 'auto') {
    // 非自动模式下，不做自动隐藏，只保持当前模式
    uiBarsVisible.value = true
    if (hideBarsTimer) clearTimeout(hideBarsTimer)
    hideBarsTimer = null
    return
  }
  if (!editorFocused.value) {
    uiBarsVisible.value = true
    if (hideBarsTimer) clearTimeout(hideBarsTimer)
    hideBarsTimer = null
    return
  }
  uiBarsVisible.value = true
  if (hideBarsTimer) clearTimeout(hideBarsTimer)
  hideBarsTimer = setTimeout(() => {
    uiBarsVisible.value = false
    hideBarsTimer = null
  }, HIDE_BARS_DELAY)
}

function onEditorFocus() {
  editorFocused.value = true
  onEditorMouseMove()
}

function onEditorBlur() {
  editorFocused.value = false
  uiBarsVisible.value = true
  if (hideBarsTimer) clearTimeout(hideBarsTimer)
  hideBarsTimer = null
}

function parseIdsFromImagePath(imagePath) {
  const p = String(imagePath || '').replace(/\\/g, '/')
  const parts = p.split('/').filter(Boolean)
  if (parts.length < 3) return null
  const noteId = parts[parts.length - 2]
  const categoryId = parts[parts.length - 3]
  return { categoryId, noteId }
}

async function setMetaEncryptedFlag(encrypted) {
  const ids = parseIdsFromImagePath(id.value)
  if (!ids) return
  try {
    await window.api?.notebook?.updateNote?.(ids.categoryId, ids.noteId, { encrypted: !!encrypted })
  } catch (_) {}
}

function normalizeLineEndings(s) {
  if (s == null || s === '') return s === null ? '' : s
  return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function countLines(text) {
  if (!text || !text.length) return 1
  const normalized = normalizeLineEndings(text)
  return normalized.split('\n').length
}

/** 单遍计数行数，不分配大数组，用于大文本时的 lineCount（仅展示/虚拟列表） */
function countLinesFast(text) {
  if (!text || !text.length) return 1
  let n = 1
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') n++
    else if (text[i] === '\r') {
      n++
      if (i + 1 < text.length && text[i + 1] === '\n') i++
    }
  }
  return n
}

const lineCount = computed(() => countLinesFast(content.value))

/** 行号虚拟化：超过该行数只渲染可见行，减少 DOM 数量 */
const VIRTUAL_LINE_THRESHOLD = 1000
const linesScrollTop = ref(0)
const linesClientHeight = ref(500)
const lineHeightPx = computed(() => fontSize.value * lineHeight.value)

const visibleLineRange = computed(() => {
  const st = linesScrollTop.value
  const ch = linesClientHeight.value
  const lh = lineHeightPx.value
  const total = lineCount.value
  if (total <= 0 || lh <= 0) return { start: 1, end: 1 }
  const start = Math.max(1, Math.floor(st / lh) + 1 - 5)
  const end = Math.min(total, Math.ceil((st + ch) / lh) + 5)
  return { start, end }
})

const visibleLineNumbers = computed(() => {
  const { start, end } = visibleLineRange.value
  const len = end - start + 1
  return Array.from({ length: len }, (_, i) => start + i)
})

function getUtf8ByteLength(s) {
  if (s == null || s === '') return 0
  return new TextEncoder().encode(s).length
}

/**
 * 只对「变更片段」编码算字节数，避免大文本每次全文编码。
 * 用于输入时的上限检查，避免每次按键都卡。
 */
function computeByteLengthIncremental(newVal, oldVal, cachedOldBytes) {
  if (oldVal == null || oldVal === '' || cachedOldBytes == null) {
    return getUtf8ByteLength(newVal ?? '')
  }
  const oldLen = oldVal.length
  const newLen = (newVal ?? '').length
  let prefixLen = 0
  while (prefixLen < oldLen && prefixLen < newLen && oldVal[prefixLen] === newVal[prefixLen])
    prefixLen++
  let suffixLen = 0
  while (
    suffixLen < oldLen - prefixLen &&
    suffixLen < newLen - prefixLen &&
    oldVal[oldLen - 1 - suffixLen] === newVal[newLen - 1 - suffixLen]
  )
    suffixLen++
  const removed = oldVal.slice(prefixLen, oldLen - suffixLen)
  const added = newVal.slice(prefixLen, newLen - suffixLen)
  const changeSize = removed.length + added.length
  if (changeSize > (newLen || 1) * 0.5) return getUtf8ByteLength(newVal)
  return cachedOldBytes - getUtf8ByteLength(removed) + getUtf8ByteLength(added)
}

/** 当前内容的 UTF-8 字节数缓存，由 watch(content) 增量更新 */
const cachedByteLength = ref(0)

function truncateToMaxBytes(s, maxBytes) {
  if (maxBytes <= 0) return ''
  const enc = new TextEncoder().encode(s)
  if (enc.length <= maxBytes) return s
  const decoder = new TextDecoder('utf-8', { fatal: true })
  for (let n = maxBytes; n >= 0; n--) {
    try {
      return decoder.decode(enc.slice(0, n))
    } catch (_) {}
  }
  return ''
}

const currentChars = computed(() => (content.value || '').length)
const currentBytes = computed(() => cachedByteLength.value)

/** 底部栏展示用统计：节流更新，大文本时减少 getUtf8ByteLength 等计算频率 */
const STATS_THROTTLE_MS = 300
const displayStats = ref({
  chars: 0,
  bytes: 0,
  percentNum: 0,
  percent: '—',
  color: 'rgb(34, 197, 94)'
})
let statsThrottleTimer = null

function flushDisplayStats() {
  const c = content.value || ''
  const bytes = cachedByteLength.value
  const max = notebookData.value?.img?.maxContentLen
  const maxVal = max != null ? Math.max(0, Number(max)) : null
  const percentNum = maxVal != null && maxVal > 0 ? Math.min(100, (bytes / maxVal) * 100) : 0
  displayStats.value = {
    chars: c.length,
    bytes,
    percentNum,
    percent: maxVal == null ? '—' : `${percentNum.toFixed(2)}%`,
    color: getByteUsageColor(percentNum)
  }
}

function scheduleDisplayStats() {
  if (statsThrottleTimer) return
  statsThrottleTimer = setTimeout(() => {
    flushDisplayStats()
    statsThrottleTimer = null
  }, STATS_THROTTLE_MS)
}

const maxBytes = computed(() => {
  const b = notebookData.value?.img?.maxContentLen
  if (b == null) return null
  return Math.max(0, Number(b))
})

/** 字节使用率 0–100，无上限时为 0 */
const byteUsagePercentNum = computed(() => {
  const max = maxBytes.value
  if (max == null || max <= 0) return 0
  return Math.min(100, (currentBytes.value / max) * 100)
})
computed(() => {
  if (maxBytes.value == null) return '—'
  return `${byteUsagePercentNum.value.toFixed(2)}%`
})
/** 根据使用率返回颜色：绿 → 黄 → 红 */
function getByteUsageColor(percent) {
  if (percent <= 0) return 'rgb(34, 197, 94)'
  if (percent >= 100) return 'rgb(239, 68, 68)'
  let r, g, b
  if (percent <= 50) {
    const t = percent / 50
    r = Math.round(34 + (234 - 34) * t)
    g = Math.round(197 + (179 - 197) * t)
    b = Math.round(94 + (8 - 94) * t)
  } else {
    const t = (percent - 50) / 50
    r = Math.round(234 + (239 - 234) * t)
    g = Math.round(179 + (68 - 179) * t)
    b = Math.round(8 + (68 - 8) * t)
  }
  return `rgb(${r}, ${g}, ${b})`
}
computed(() => getByteUsageColor(byteUsagePercentNum.value))
function getEncNumber(enc) {
  if (enc == null) return 0
  if (typeof enc === 'number') return enc
  if (typeof enc === 'string') {
    if (enc.toUpperCase() === 'WEAK') return 1
    if (enc.toUpperCase() === 'STRONG') return 2
    return 0
  }
  if (typeof enc === 'object') {
    if (enc.number != null) return Number(enc.number) || 0
    if (enc.type && String(enc.type).includes('弱')) return 1
    if (enc.name && String(enc.name).toUpperCase() === 'WEAK') return 1
  }
  return 0
}

const encryptionTypeNumber = computed(() =>
  getEncNumber(notebookData.value?.header?.encryptionType)
)
const isEncrypted = computed(() => encryptionTypeNumber.value !== 0)

const currentLine = ref(1)
const currentCol = ref(1)

// 编辑区独立撤销/重做栈，避免与搜索框共用浏览器撤销导致搜索内容被撤回
const CONTENT_HISTORY_MAX = 50
const contentHistory = ref([]) // 每项为一次编辑后的内容；index 指向当前显示的状态
const contentHistoryIndex = ref(-1)
let isUndoRedo = false

function updateCurrentLine() {
  const ta = textareaRef.value
  if (!ta) return
  const pos = ta.selectionStart
  const textBeforeCursor = (ta.value || '').slice(0, pos)
  currentLine.value = Math.max(1, countLinesFast(textBeforeCursor))
  const lastNewlinePos = textBeforeCursor.lastIndexOf('\n') + 1
  const base = lastNewlinePos > 0 ? lastNewlinePos : 0
  const col = textBeforeCursor.length - base + 1
  currentCol.value = Math.max(1, col)
}

function scheduleUpdateCurrentLine() {
  setTimeout(updateCurrentLine, 0)
}

let selectionChangeRaf = null

function onSelectionChange() {
  if (document.activeElement !== textareaRef.value) return
  if (selectionChangeRaf) return
  selectionChangeRaf = requestAnimationFrame(() => {
    selectionChangeRaf = null
    updateCurrentLine()
  })
}

function onScroll() {
  const ta = textareaRef.value
  const lines = linesRef.value
  if (lines && ta) {
    lines.scrollTop = ta.scrollTop
    linesScrollTop.value = ta.scrollTop
    linesClientHeight.value = ta.clientHeight
  }
}

function focusEditor() {
  nextTick(() => {
    const ta = textareaRef.value
    if (ta && document.activeElement !== ta) {
      ta.focus()
    }
  })
}

// ========== 搜索功能 ==========
function escapeHtml(s) {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

function getSearchRegex() {
  const q = (searchQuery.value || '').trim()
  if (!q) return null
  try {
    return new RegExp(escapeRegex(q), 'g')
  } catch {
    return null
  }
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findSearchMatches() {
  const q = (searchQuery.value || '').trim()
  const text = content.value || ''
  if (!q || !text) return []
  const regex = getSearchRegex()
  if (!regex) return []
  const matches = []
  let m
  regex.lastIndex = 0
  while ((m = regex.exec(text)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length })
  }
  return matches
}

// 由 searchQuery 与 content 计算匹配，用于跳转和选中（不再做额外自定义高亮层）
const searchMatches = computed(() => findSearchMatches())

/** 测量文本宽度（需与 textarea 字体一致） */
function measureTextWidth(text) {
  const ta = textareaRef.value
  if (!ta || !text) return 0
  const m = document.createElement('span')
  const style = getComputedStyle(ta)
  m.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${style.font};font-size:${style.fontSize};font-family:${style.fontFamily};line-height:${style.lineHeight};letter-spacing:${style.letterSpacing}`
  m.textContent = text
  document.body.appendChild(m)
  const w = m.offsetWidth
  m.remove()
  return w
}

/**
 * 在开启自动换行时，根据 textarea 的实际渲染样式估算指定光标位置的视觉纵向偏移，
 * 用于计算 scrollTop，使匹配位置真正出现在可见区域
 */
function getCaretVisualOffset(ta, pos) {
  if (!ta) return { top: 0, left: 0 }
  const text = ta.value || ''
  const safePos = Math.max(0, Math.min(pos, text.length))
  const style = getComputedStyle(ta)

  const div = document.createElement('div')
  div.style.position = 'absolute'
  div.style.visibility = 'hidden'
  div.style.whiteSpace = 'pre-wrap'
  div.style.wordWrap = 'break-word'
  div.style.overflow = 'hidden'
  div.style.boxSizing = style.boxSizing
  div.style.width = ta.clientWidth + 'px'
  div.style.padding = style.padding
  div.style.border = style.border
  div.style.font = style.font
  div.style.lineHeight = style.lineHeight
  div.style.letterSpacing = style.letterSpacing

  const before = text.slice(0, safePos)
  const after = text.slice(safePos)

  const beforeNode = document.createTextNode(before)
  const caretSpan = document.createElement('span')
  caretSpan.textContent = after.length ? after[0] : '\u200b'

  div.appendChild(beforeNode)
  div.appendChild(caretSpan)

  document.body.appendChild(div)
  const top = caretSpan.offsetTop
  const left = caretSpan.offsetLeft
  document.body.removeChild(div)

  return { top, left }
}

/** 获取当前行从行首到 pos 的文本 */
function getLineTextBefore(text, pos) {
  const last = text.lastIndexOf('\n', pos - 1)
  return text.slice(last + 1, pos)
}

function scrollToMatch(options = {}) {
  const { focusEditor = true } = options
  const ta = textareaRef.value
  const matches = searchMatches.value
  const idx = currentMatchIndex.value
  if (!ta || !matches.length || idx < 0 || idx >= matches.length) return
  const { start, end } = matches[idx]
  const text = content.value || ''
  if (focusEditor) {
    ta.focus()
    ta.setSelectionRange(start, end)
  }
  // 自动换行：根据实际渲染后的光标位置精确计算 scrollTop，使匹配行在可见区域内
  if (wrapEnabled.value) {
    requestAnimationFrame(() => {
      const el = textareaRef.value
      if (!el) return
      const { top } = getCaretVisualOffset(el, start)
      const targetTop = Math.max(0, top - el.clientHeight / 2)
      el.scrollTop = targetTop
      // 自动换行模式下不需要横向滚动，保持在起始位置即可
      el.scrollLeft = 0
    })
    return
  }

  const lineH = fontSize.value * lineHeight.value
  const lineTextBefore = getLineTextBefore(text, start)
  const lineTextMatch = text.slice(start, end)
  const xStart = measureTextWidth(lineTextBefore)
  const xEnd = measureTextWidth(lineTextBefore + lineTextMatch)
  const xCenter = (xStart + xEnd) / 2
  const maxScrollLeft = Math.max(0, ta.scrollWidth - ta.clientWidth)
  const targetScrollLeft = Math.max(0, Math.min(maxScrollLeft, xCenter - ta.clientWidth / 2))
  const textBefore = text.slice(0, start)
  const lineNum = countLinesFast(textBefore)

  // 垂直滚动：使选区所在行可见
  const targetScrollTop = Math.max(0, (lineNum - 2) * lineH)
  ta.scrollTop = Math.min(ta.scrollTop, targetScrollTop)
  if (ta.scrollTop + ta.clientHeight < targetScrollTop + lineH * 2) {
    ta.scrollTop = Math.max(0, targetScrollTop - ta.clientHeight / 2)
  }

  ta.scrollLeft = targetScrollLeft

  // 延迟一帧再设一次，确保覆盖浏览器 setSelectionRange 后的自动滚动
  requestAnimationFrame(() => {
    const el = textareaRef.value
    if (el) {
      el.scrollLeft = targetScrollLeft
    }
  })
}

function searchNext() {
  const matches = searchMatches.value
  if (!matches.length) return
  if (currentMatchIndex.value < 0) {
    currentMatchIndex.value = 0
  } else {
    currentMatchIndex.value = (currentMatchIndex.value + 1) % matches.length
  }
  // 点击「下一个」时，聚焦编辑区并选中当前匹配
  scrollToMatch({ focusEditor: true })
}

function searchPrev() {
  const matches = searchMatches.value
  if (!matches.length) return
  if (currentMatchIndex.value < 0) {
    currentMatchIndex.value = matches.length - 1
  } else {
    currentMatchIndex.value =
      currentMatchIndex.value <= 0 ? matches.length - 1 : currentMatchIndex.value - 1
  }
  // 点击「上一个」时，聚焦编辑区并选中当前匹配
  scrollToMatch({ focusEditor: true })
}

function openSearch() {
  showSearchBar.value = true
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

function onSearchEnter(isPrev) {
  if (isPrev) searchPrev()
  else searchNext()
}

function closeSearch() {
  showSearchBar.value = false
  searchQuery.value = ''
  currentMatchIndex.value = -1
}

function onSearchKeydown(e) {
  if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    openSearch()
  }
  if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    save()
  }
  if (e.key === 'Escape' && showSearchBar.value) {
    closeSearch()
  }
}

/** 计算字符串的MD5哈希值 */
function md5Hash(text) {
  return md5(text)
}

async function load(showLoading = true) {
  if (!id.value) return
  isLoadingContent.value = showLoading
  const res = await readNote(id.value, '')
  console.log('获取到笔记本数据', res)
  notebookData.value = res?.data != null ? res.data : null
  if (res?.code === 406) {
    Message.warning('该图片未被写入过任何信息')
    isLoadingContent.value = false
    return
  } else if (res?.code === 410) {
    Message.error('该图片写入的信息已损坏或未被写入过')
    isLoadingContent.value = false
    return
  }

  // 检查是否需要密码（前端校验）
  const header = notebookData.value?.header
  // 后端 Header 中的密码 MD5 保存在 verifyCode 字段
  const encodeType = header?.encryptionType
  const isEncryptedNotebook = encodeType === 'WEAK'

  const storedPasswordHash = header?.verifyCode

  if (isEncryptedNotebook && !notePassword.value) {
    needsPassword.value = true
    passwordError.value = ''
    content.value = ''
    await setMetaEncryptedFlag(true)
    isLoadingContent.value = false
    return
  }

  if (isEncryptedNotebook && notePassword.value) {
    // 前端校验密码MD5
    const inputPasswordHash = md5Hash(notePassword.value)
    if (inputPasswordHash.toLowerCase() !== storedPasswordHash.toLowerCase()) {
      needsPassword.value = true
      passwordError.value = '密码错误'
      content.value = ''
      await setMetaEncryptedFlag(true)
      isLoadingContent.value = false
      return
    }
  }

  // 密码正确或无需密码，加载内容
  needsPassword.value = false
  passwordError.value = ''
  content.value = normalizeLineEndings(notebookData.value?.data ?? '')
  contentHistory.value = []
  contentHistoryIndex.value = -1
  await setMetaEncryptedFlag(isEncryptedNotebook)

  const nameFromQuery = route.query?.name
  title.value =
    (typeof nameFromQuery === 'string' && nameFromQuery.trim()) ||
    id.value.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '') ||
    '未命名'
  const bytes = notebookData.value?.img?.maxContentLen
  if (bytes != null && Number(bytes) <= 0) {
    Message.warning('图片尺寸太小')
  }
  await nextTick()
  updateCurrentLine()
  flushDisplayStats()
  const ta = textareaRef.value
  if (ta) {
    linesScrollTop.value = ta.scrollTop
    linesClientHeight.value = ta.clientHeight
  }
  dirty.value = false
  isLoadingContent.value = false
}

watch(
  () => route.query?.name,
  (name) => {
    if (typeof name === 'string' && name.trim()) title.value = name.trim()
  }
)

async function save() {
  if (!id.value || !dirty.value) return
  if (needsPassword.value) return
  saving.value = true
  try {
    const encType = encryptionTypeNumber.value
    const ok = await writeNote(
      id.value,
      normalizeLineEndings(content.value),
      encType,
      encType ? notePassword.value : ''
    )
    if (ok) {
      dirty.value = false
      Message.success('已保存')
    }
  } finally {
    saving.value = false
  }
}

function goBack() {
  if (dirty.value) {
    showLeaveConfirm.value = true
  } else {
    router.push('/')
  }
}

function onConfirmLeave() {
  router.push('/')
}

async function unlock(pwd) {
  if (!id.value || !pwd) {
    passwordError.value = '请输入密码'
    return
  }

  // 前端校验密码MD5
  const header = notebookData.value?.header
  const storedPasswordHash = header?.verifyCode
  if (typeof storedPasswordHash !== 'string' || !storedPasswordHash.length) {
    passwordError.value = '密码验证失败'
    return
  }

  const inputPasswordHash = md5Hash(pwd)
  if (inputPasswordHash.toLowerCase() !== storedPasswordHash.toLowerCase()) {
    passwordError.value = '密码错误'
    return
  }

  // 密码正确，解锁
  notePassword.value = pwd
  needsPassword.value = false
  passwordError.value = ''
  content.value = normalizeLineEndings(notebookData.value?.data ?? '')
  contentHistory.value = []
  contentHistoryIndex.value = -1
  await setMetaEncryptedFlag(true)
  await nextTick()
  updateCurrentLine()
  dirty.value = false
}

async function enableEncryption(newPassword) {
  if (!id.value) return
  saving.value = true
  const ok = await writeNote(id.value, normalizeLineEndings(content.value), 1, newPassword)
  if (ok) {
    saving.value = false
    Message.success('已启用加密')
    notePassword.value = newPassword
    await setMetaEncryptedFlag(true)
    showEncryptDialog.value = false
    encryptError.value = ''
    dirty.value = false
    await load()
  }
}

async function changeEncryptionPassword({ currentPassword, newPassword }) {
  if (!id.value) return

  // 前端校验密码MD5
  const header = notebookData.value?.header
  const storedPasswordHash = header?.verifyCode
  if (typeof storedPasswordHash !== 'string' || !storedPasswordHash.length) {
    Message.error('密码验证失败')
    return
  }

  const inputPasswordHash = md5Hash(currentPassword)
  if (inputPasswordHash.toLowerCase() !== storedPasswordHash.toLowerCase()) {
    encryptError.value = '原密码错误'
    return
  }

  // 密码正确
  saving.value = true
  const ok = await writeNote(id.value, normalizeLineEndings(content.value), 1, newPassword)
  if (ok) {
    saving.value = false
    Message.success('密码已修改')
    notePassword.value = newPassword
    await setMetaEncryptedFlag(true)
    showEncryptDialog.value = false
    encryptError.value = ''
    dirty.value = false
    await load()
  }
}

async function disableEncryption({ currentPassword }) {
  if (!id.value) return
  const header = notebookData.value?.header
  const storedPasswordHash = header?.verifyCode
  if (typeof storedPasswordHash !== 'string' || !storedPasswordHash.length) {
    Message.error('密码验证失败')
    return
  }

  const inputPasswordHash = md5Hash(currentPassword)
  if (inputPasswordHash.toLowerCase() !== storedPasswordHash.toLowerCase()) {
    encryptError.value = '原密码错误'
    return
  }
  saving.value = true
  const ok = await writeNote(id.value, normalizeLineEndings(content.value), 0, '')
  if (ok) {
    saving.value = false
    Message.success('已取消加密')
    notePassword.value = ''
    await setMetaEncryptedFlag(false)
    showEncryptDialog.value = false
    encryptError.value = ''
    dirty.value = false
    await load()
  }
}

const TAB_STR = '    '

function onContentInput(e) {
  const ta = e.target
  const newVal = ta.value
  const prevVal = content.value
  if (!isUndoRedo && prevVal !== newVal) {
    let hist = contentHistory.value.slice()
    let idx = contentHistoryIndex.value
    if (idx < hist.length - 1) hist.splice(idx + 1)
    if (idx < 0) hist = [prevVal, newVal]
    else hist.push(newVal)
    if (hist.length > CONTENT_HISTORY_MAX) hist.shift()
    contentHistory.value = hist
    contentHistoryIndex.value = hist.length - 1
  }
  const limit = maxBytes.value
  if (limit != null) {
    const newBytes = computeByteLengthIncremental(newVal, content.value, cachedByteLength.value)
    if (newBytes > limit) {
      const insertLen = newVal.length - content.value.length
      const cursorBefore = Math.max(0, ta.selectionStart - insertLen)
      ta.value = content.value
      ta.selectionStart = ta.selectionEnd = cursorBefore
      return
    }
  }
  content.value = newVal
}

function onKeydown(e) {
  if (e.key === 'Tab') {
    e.preventDefault()
    const ta = e.target
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const newContent = content.value.slice(0, start) + TAB_STR + content.value.slice(end)
    const limit = maxBytes.value
    if (limit != null && getUtf8ByteLength(newContent) > limit) return
    content.value = newContent
    if (textareaRef.value) {
      textareaRef.value.value = newContent
      const pos = Math.min(start + TAB_STR.length, newContent.length)
      textareaRef.value.selectionStart = textareaRef.value.selectionEnd = pos
      updateCurrentLine()
    }
    return
  }
  if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
    e.preventDefault()
    editorUndo()
    return
  }
  if (
    (e.key === 'y' && (e.ctrlKey || e.metaKey)) ||
    (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)
  ) {
    e.preventDefault()
    editorRedo()
    return
  }
  scheduleUpdateCurrentLine()
}

function editorUndo() {
  const hist = contentHistory.value
  let idx = contentHistoryIndex.value
  if (idx <= 0 || hist.length === 0) return
  idx -= 1
  const prevContent = hist[idx]
  isUndoRedo = true
  contentHistoryIndex.value = idx
  content.value = prevContent
  nextTick(() => {
    const ta = textareaRef.value
    if (ta) {
      ta.value = prevContent
      ta.selectionStart = ta.selectionEnd = prevContent.length
      updateCurrentLine()
    }
    isUndoRedo = false
  })
}

function editorRedo() {
  const hist = contentHistory.value
  let idx = contentHistoryIndex.value
  if (idx >= hist.length - 1 || hist.length === 0) return
  idx += 1
  const nextContent = hist[idx]
  isUndoRedo = true
  contentHistoryIndex.value = idx
  content.value = nextContent
  nextTick(() => {
    const ta = textareaRef.value
    if (ta) {
      ta.value = nextContent
      ta.selectionStart = ta.selectionEnd = nextContent.length
      updateCurrentLine()
    }
    isUndoRedo = false
  })
}

function handleWheel(e) {
  if (e.ctrlKey) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.5 : 0.5
    const newFontSize = Math.max(10, Math.min(24, fontSize.value + delta))
    const newLineHeight = Math.max(1.2, Math.min(2.2, lineHeight.value + delta * 0.1))
    fontSize.value = newFontSize
    lineHeight.value = newLineHeight
    nextTick(() => {
      if (linesRef.value && textareaRef.value) {
        linesRef.value.scrollTop = textareaRef.value.scrollTop
        updateCurrentLine()
      }
    })
  }
}

function toggleWrap() {
  wrapEnabled.value = !wrapEnabled.value
  nextTick(() => {
    if (linesRef.value && textareaRef.value) {
      linesRef.value.scrollTop = textareaRef.value.scrollTop
      updateCurrentLine()
    }
  })
}

onMounted(() => {
  load()
  document.addEventListener('selectionchange', onSelectionChange)
  document.addEventListener('wheel', handleWheel, { passive: false })
  document.addEventListener('keydown', onSearchKeydown)
  onEditorMouseMove()
})

onUnmounted(() => {
  document.removeEventListener('selectionchange', onSelectionChange)
  document.removeEventListener('wheel', handleWheel)
  document.removeEventListener('keydown', onSearchKeydown)
  if (hideBarsTimer) clearTimeout(hideBarsTimer)
  if (statsThrottleTimer) clearTimeout(statsThrottleTimer)
  if (truncateCheckTimer) clearTimeout(truncateCheckTimer)
  if (selectionChangeRaf) cancelAnimationFrame(selectionChangeRaf)
  window.api?.app?.setEditorDirty?.(false)
})

watch(content, (newVal, oldVal) => {
  if (!isLoadingContent.value) dirty.value = true
  scheduleDisplayStats()
  cachedByteLength.value = computeByteLengthIncremental(newVal, oldVal, cachedByteLength.value)
})
watch(maxBytes, scheduleDisplayStats)

watch(id, load)

watch(
  dirty,
  (v) => {
    window.api?.app?.setEditorDirty?.(!!v)
  },
  { immediate: true }
)

const TRUNCATE_CHECK_MS = 100
let truncateCheckTimer = null

function runTruncateCheck() {
  truncateCheckTimer = null
  const c = content.value
  const maxVal = maxBytes.value
  if (maxVal == null || c == null) return
  if (cachedByteLength.value <= maxVal) return
  const truncated = truncateToMaxBytes(c, maxVal)
  content.value = truncated
  nextTick(() => {
    const ta = textareaRef.value
    if (ta) {
      ta.value = truncated
      ta.selectionStart = ta.selectionEnd = truncated.length
      updateCurrentLine()
    }
  })
}

watch([content, maxBytes], () => {
  const maxVal = maxBytes.value
  if (maxVal == null) return
  if (truncateCheckTimer) clearTimeout(truncateCheckTimer)
  truncateCheckTimer = setTimeout(runTruncateCheck, TRUNCATE_CHECK_MS)
})

// 搜索：输入变化时仅重置当前匹配索引，不做任何自定义高亮或自动跳转
watch(
  searchQuery,
  () => {
    currentMatchIndex.value = -1
  },
  { flush: 'sync' }
)

watch([fontSize, lineHeight], () => {
  nextTick(() => {
    if (linesRef.value && textareaRef.value) {
      linesRef.value.scrollTop = textareaRef.value.scrollTop
      updateCurrentLine()
    }
  })
})
</script>

<style scoped>
.editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
}

.editor-header-wrap {
  position: relative;
  flex-shrink: 0;
  height: 60px;
  overflow: visible;
  transition: height 0.25s ease;
}

.editor-header-wrap.is-hidden {
  height: 7px;
}

/* 顶部栏模式按钮的 Tooltip：让容器参与绝对定位，以便 tooltip 定位正确 */
.bars-mode-tooltip {
  position: absolute;
  right: 80px;
  bottom: 0;
}

.editor-header {
  user-select: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
  transform: translateY(0);
  transition: transform 0.25s ease;
}

.editor-header-wrap.is-hidden .editor-header {
  transform: translateY(-100%);
}

.back-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s,
    color 0.15s;
}

.back-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.back-arrow {
  font-size: 18px;
  line-height: 1;
}

.editor-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.save-btn {
  flex-shrink: 0;
}

.enc-btn {
  flex-shrink: 0;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}

.enc-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.enc-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s,
    color 0.15s;
}

.search-btn:hover {
  background: var(--bg-hover);
  color: var(--accent);
}

.search-icon-svg {
  width: 18px;
  height: 18px;
}

/* ========== 搜索栏 ========== */
.editor-search-bar {
  flex-shrink: 0;
  padding: 10px 20px 14px;
  background: linear-gradient(180deg, var(--bg-card) 0%, var(--bg-muted) 100%);
  border-bottom: 1px solid var(--border);
}

.editor-search-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.editor-search-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--text-tertiary);
}

.editor-search-input {
  flex: 1;
  min-width: 120px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.editor-search-input::placeholder {
  color: var(--text-tertiary);
}

.editor-search-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.editor-search-count {
  font-size: 12px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
  min-width: 3.5em;
  text-align: center;
}

.editor-search-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: var(--bg-muted);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s,
    color 0.15s;
}

.editor-search-btn:hover:not(:disabled) {
  background: var(--accent-subtle);
  color: var(--accent);
}

.editor-search-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.editor-search-btn-icon {
  font-size: 10px;
  line-height: 1;
}

.editor-search-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s,
    color 0.15s;
}

.editor-search-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.search-slide-enter-active,
.search-slide-leave-active {
  transition: all 0.25s ease;
}

.search-slide-enter-from,
.search-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 编辑页全局选中高亮（textarea、input 等） */
.editor textarea::selection,
.editor input::selection {
  background: color-mix(in srgb, var(--accent) 20%, transparent);
  color: inherit;
}

.editor-body {
  flex: 1;
  padding: 20px 24px;
  overflow: hidden;
}

.editor-with-lines {
  display: flex;
  height: 100%;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-card);
  cursor: text;
}

.editor-lines {
  flex-shrink: 0;
  width: 1em;
  padding: 16px 3px 36px 4px;
  overflow-y: auto;
  overflow-x: hidden;
  text-align: right;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
  user-select: none;
  border-right: 1px solid var(--border);
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.editor-lines::-webkit-scrollbar {
  display: none;
}

.editor-lines-inner {
  position: relative;
  width: 100%;
}

.editor-line-num {
  box-sizing: border-box;
  position: relative;
}

.editor-line-num-virtual {
  position: absolute;
  left: 0;
  right: 0;
  text-align: right;
}

.editor-line-num.current {
  color: inherit;
  font-weight: 400;
}

.editor-line-num.current::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 4px;
  bottom: 4px;
  width: 6px;
  border-radius: 999px;
  background: var(--accent);
}

.editor-textarea-wrap {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  position: relative;
}

.editor-footer {
  user-select: none;
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  border-radius: 10px;
  background: var(--overlay-panel);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--overlay-panel-border);
  pointer-events: none;
  transition:
    background 0.25s ease,
    border-color 0.25s ease;
  font-size: 12px;
  line-height: 1.4;
  font-variant-numeric: tabular-nums;
  transform: translateY(150%);
}

.editor-with-lines.is-wrap .editor-footer {
  bottom: 2px;
}

.editor-footer.is-visible {
  transform: translateY(0);
}

.editor-footer-left {
  flex-shrink: 0;
  color: var(--text-tertiary);
}

.editor-pos {
  color: var(--text-secondary);
  font-weight: 500;
}

.editor-footer-spacer {
  flex: 1;
  min-width: 0;
}

.editor-footer-center {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.editor-progress-label {
  flex-shrink: 0;
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 500;
}

.editor-progress-track {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: var(--bg-muted);
  overflow: hidden;
  transition: background 0.25s ease;
}

.editor-progress-fill {
  height: 100%;
  border-radius: 999px;
  transition:
    width 0.2s ease,
    background 0.2s ease;
}

.editor-percent {
  flex-shrink: 0;
  min-width: 3.2em;
  font-weight: 600;
  font-size: 12px;
  text-align: right;
}

.editor-footer-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-tertiary);
}

.editor-stat {
  color: var(--text-secondary);
  font-weight: 500;
}

.editor-stat.editor-byte {
  font-weight: 400;
  color: var(--text-tertiary);
}

.editor-textarea {
  width: 100%;
  height: 100%;
  padding: 16px 16px 36px 12px;
  border: none;
  border-radius: 0 10px 10px 0;
  background: transparent;
  color: var(--text-primary);
  resize: none;
  outline: none;
  font-family: inherit;
  transition: box-shadow 0.15s;
  display: block;
  box-sizing: border-box;
  overflow: auto;
}

.editor-textarea:focus {
  box-shadow: none;
}

.editor-with-lines:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-subtle);
}

.editor-textarea::placeholder {
  color: var(--text-tertiary);
}

.btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary {
  background: var(--accent);
  color: var(--accent-fg);
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 自动换行切换胶囊按钮 */
.wrap-toggle-btn {
  flex-shrink: 0;
  border: none;
  background: transparent;
  padding: 0;
  margin-left: 6px;
  cursor: pointer;
}

.wrap-toggle-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  font-size: 12px;
  color: var(--text-secondary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition:
    background 0.15s,
    border-color 0.15s,
    box-shadow 0.15s,
    color 0.15s;
}

.wrap-toggle-btn.is-on .wrap-toggle-pill {
  border-color: var(--accent-subtle);
  background: var(--accent-subtle);
  color: var(--accent);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.wrap-toggle-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--accent);
  flex-shrink: 0;
}

.wrap-toggle-btn.is-on .wrap-toggle-dot {
  background: var(--accent);
}

.wrap-toggle-text {
  white-space: nowrap;
}

/* 顶部栏模式切换：顶部栏右下角小图标（下尖角 / 圆圈 / 上尖角）*/
.bars-mode-toggle {
  position: absolute;
  right: -60px;
  bottom: -10px;
  width: 22px;
  height: 26px;
  padding: 0;
  border-radius: 999px;
  border-bottom: 1px solid var(--border);
  border-top: none;
  border-left: none;
  border-right: none;
  background: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    box-shadow 0.15s,
    transform 0.12s;
  z-index: 20;
  clip-path: inset(8px 0 0 0);
}

.bars-mode-toggle:hover {
  background: var(--bg-hover);
  border-color: var(--accent-subtle);
  transform: translateY(-1px);
}

.bars-mode-toggle.mode-always {
  border-color: var(--accent-subtle);
}

.bars-mode-toggle.mode-hidden {
  opacity: 0.7;
}

.bars-mode-shape {
  position: absolute;
  bottom: 6px;
  display: block;
}

/* 始终隐藏：向下小尖角 */
.bars-mode-shape.shape-hidden {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 7px solid var(--text-secondary);
}

/* 自动：小圆圈 */
.bars-mode-shape.shape-auto {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  border: 2px solid var(--text-secondary);
}

/* 始终显示：向上小尖角 */
.bars-mode-shape.shape-always {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 7px solid var(--text-secondary);
}

.editor-with-lines::-webkit-scrollbar {
  cursor: default;
}

.editor-with-lines::-webkit-scrollbar-thumb {
  cursor: pointer;
}

.editor-textarea::-webkit-scrollbar {
  cursor: default;
}

.editor-textarea::-webkit-scrollbar-thumb {
  cursor: pointer;
}

.editor-with-lines {
  cursor: text;
}

.editor-with-lines::-webkit-scrollbar {
  cursor: default;
}

*::-webkit-scrollbar {
  cursor: default;
}

*::-webkit-scrollbar-track {
  cursor: default;
}

*::-webkit-scrollbar-thumb {
  cursor: pointer;
}
</style>
