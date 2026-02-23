<template>
  <Teleport to="body">
    <div v-if="visible" class="viewer-mask" role="dialog" aria-modal="true">
      <header class="viewer-head">
        <div class="viewer-title">
          <span class="viewer-title-text">{{ title || '查看图片' }}</span>
        </div>
        <div class="viewer-actions">
          <button type="button" class="btn btn-ghost" @click="reset">重置</button>
          <button type="button" class="btn btn-primary" @click="close">关闭</button>
        </div>
      </header>

      <div
        ref="stageRef"
        class="viewer-stage"
        tabindex="0"
        :class="{ dragging: dragging, 'can-drag': canDrag }"
        @wheel.prevent="onWheel"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="stopDrag"
        @pointercancel="stopDrag"
        @pointerleave="stopDrag"
      >
        <div class="viewer-bg"></div>
        <div
          class="viewer-canvas"
          :style="{ transform: `translate3d(${panX}px, ${panY}px, 0) scale(${scale})` }"
        >
          <img
            class="viewer-img"
            :src="src"
            :alt="title"
            draggable="false"
            @load="onImgLoad"
            @error="loaded = true"
          />
        </div>
        <div class="viewer-hint">
          <span v-if="!loaded">加载中…</span>
          <span v-else>滚轮缩放 · 左键拖动</span>
        </div>
        <div v-if="dimensionsText" class="viewer-info-anchor">
          <CustomTooltip :content="fileSizeTooltip">
            <div class="viewer-info">
              {{ dimensionsText }}
            </div>
          </CustomTooltip>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import CustomTooltip from './CustomTooltip.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  imagePath: { type: String, default: '' }
})
const emit = defineEmits(['update:visible'])

const IMGNOTE_FILE_SCHEME = 'imgnote-file'
const src = computed(() => {
  const p = props.imagePath || ''
  if (!p) return ''
  const normalized = p.replace(/\\/g, '/').replace(/^\/+/, '')
  return `${IMGNOTE_FILE_SCHEME}:///${encodeURI(normalized)}`
})

const stageRef = ref(null)
const loaded = ref(false)

const imageSize = ref({ width: 0, height: 0 })
const fileSizeBytes = ref(null)

function formatFileSize(bytes) {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const dimensionsText = computed(() => {
  const w = imageSize.value.width
  const h = imageSize.value.height
  if (!w || !h) return ''
  return `${w} × ${h}`
})

const fileSizeTooltip = computed(() => {
  if (fileSizeBytes.value == null) return ''
  return `大小：${formatFileSize(fileSizeBytes.value)}`
})

async function fetchFileSize() {
  const path = props.imagePath
  if (!path || !window.api?.notebook?.getFileStats) {
    fileSizeBytes.value = null
    return
  }
  try {
    const stats = await window.api.notebook.getFileStats(path)
    fileSizeBytes.value = stats?.size ?? null
  } catch {
    fileSizeBytes.value = null
  }
}

function onImgLoad(e) {
  loaded.value = true
  const img = e.target
  if (img?.naturalWidth && img?.naturalHeight) {
    imageSize.value = { width: img.naturalWidth, height: img.naturalHeight }
  }
}

const scale = ref(1)
const panX = ref(0)
const panY = ref(0)

const dragging = ref(false)
const dragPointerId = ref(null)
const dragStart = ref({ x: 0, y: 0, panX: 0, panY: 0 })
const pendingPan = ref({ x: 0, y: 0 })
let panRaf = 0

const canDrag = computed(() => scale.value > 1.01)

function close() {
  emit('update:visible', false)
}

function reset() {
  scale.value = 1
  panX.value = 0
  panY.value = 0
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n))
}

function zoomTo(nextScale, cx, cy) {
  const stage = stageRef.value
  if (!stage) return
  const rect = stage.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const mx = cx != null ? cx - centerX : 0
  const my = cy != null ? cy - centerY : 0
  const prev = scale.value
  const ns = clamp(nextScale, 0.25, 6)
  if (Math.abs(ns - prev) < 0.0001) return

  const k = ns / prev
  panX.value = panX.value * k + (1 - k) * mx
  panY.value = panY.value * k + (1 - k) * my
  scale.value = ns

  if (scale.value <= 1.01) {
    panX.value = 0
    panY.value = 0
  }
}

function onWheel(e) {
  if (!props.visible) return
  const delta = -e.deltaY
  const factor = delta > 0 ? 1.1 : 0.9
  zoomTo(scale.value * factor, e.clientX, e.clientY)
}

function flushPan() {
  panRaf = 0
  panX.value = pendingPan.value.x
  panY.value = pendingPan.value.y
}

function onPointerDown(e) {
  if (e.button !== 0) return
  if (!canDrag.value) return
  const stage = stageRef.value
  if (!stage) return
  dragging.value = true
  dragPointerId.value = e.pointerId
  dragStart.value = { x: e.clientX, y: e.clientY, panX: panX.value, panY: panY.value }
  stage.setPointerCapture?.(e.pointerId)
}

function onPointerMove(e) {
  if (!dragging.value) return
  if (dragPointerId.value != null && e.pointerId !== dragPointerId.value) return
  const dx = e.clientX - dragStart.value.x
  const dy = e.clientY - dragStart.value.y
  pendingPan.value = { x: dragStart.value.panX + dx, y: dragStart.value.panY + dy }
  if (!panRaf) panRaf = requestAnimationFrame(flushPan)
}

function stopDrag(e) {
  if (!dragging.value) return
  dragging.value = false
  const stage = stageRef.value
  if (stage && dragPointerId.value != null) {
    try {
      stage.releasePointerCapture?.(dragPointerId.value)
    } catch (_) {}
  }
  dragPointerId.value = null
  if (panRaf) {
    cancelAnimationFrame(panRaf)
    panRaf = 0
  }
}

function onKeydown(e) {
  if (!props.visible) return
  if (e.key === 'Escape') close()
  if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    reset()
  }
}

watch(
  () => props.visible,
  async (v) => {
    if (v) {
      loaded.value = false
      imageSize.value = { width: 0, height: 0 }
      fileSizeBytes.value = null
      reset()
      await nextTick()
      stageRef.value?.focus?.()
      fetchFileSize()
    } else {
      stopDrag()
    }
  }
)

watch(
  () => props.imagePath,
  () => {
    if (props.visible && props.imagePath) fetchFileSize()
  }
)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.viewer-mask {
  user-select: none;
  position: fixed;
  inset: 0;
  z-index: 2400;
  background: linear-gradient(180deg, var(--bg-page), var(--bg-muted));
  display: flex;
  flex-direction: column;
}
.viewer-head {
  flex-shrink: 0;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
}
.viewer-title-text {
  font-size: 14px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}
.viewer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.viewer-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  outline: none;
  cursor: default;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(900px 420px at 50% 10%, var(--accent-subtle), transparent 55%),
    linear-gradient(180deg, var(--bg-page), var(--bg-muted));
  touch-action: none;
}
.viewer-stage.can-drag {
  cursor: grab;
}
.viewer-stage.dragging {
  cursor: grabbing;
}
.viewer-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--border) 1px, transparent 1px),
    linear-gradient(90deg, var(--border) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.4;
}
.viewer-canvas {
  position: relative;
  transform-origin: center center;
  will-change: transform;
}
.viewer-img {
  max-width: 92vw;
  max-height: calc(100vh - 110px);
  display: block;
  user-select: none;
  pointer-events: none;
  border-radius: 12px;
  box-shadow: var(--shadow-dialog);
}
.viewer-info-anchor {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
}

.viewer-hint {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--overlay-panel);
  border: 1px solid var(--overlay-panel-border);
  color: var(--text-tertiary);
  font-size: 12px;
  backdrop-filter: blur(10px);
  transition:
    background 0.25s ease,
    border-color 0.25s ease;
}

.viewer-info {
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--overlay-panel);
  border: 1px solid var(--overlay-panel-border);
  color: var(--text-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-card);
  transition:
    background 0.25s ease,
    border-color 0.25s ease;
}
.btn {
  user-select: none;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}
.btn-primary {
  background: var(--accent);
  color: var(--accent-fg);
}
.btn-primary:hover {
  background: var(--accent-hover);
}
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}
.btn-ghost:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
