<template>
  <div class="titlebar">
    <button
      type="button"
      class="titlebar__btn titlebar__btn--pin"
      :class="{ 'titlebar__btn--pin-active': isTop }"
      :aria-pressed="isTop"
      :title="isTop ? '取消置顶' : '置顶窗口'"
      @click="toggleTop()"
    >
      <svg
        class="titlebar__icon"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        stroke-width="1.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 2.5h6" />
        <path d="M4 2.5v3.2c0 .3-.1.6-.4.8L2.5 8h7L8.4 6.5c-.2-.2-.4-.5-.4-.8V2.5" />
        <path d="M6 8v2.5" />
      </svg>
    </button>
    <button
      v-if="showMin"
      type="button"
      class="titlebar__btn titlebar__btn--min"
      title="最小化"
      aria-label="最小化"
      @click="minimize()"
    >
      <svg
        class="titlebar__icon"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        stroke-width="1.25"
        stroke-linecap="round"
      >
        <path d="M2 6h8" />
      </svg>
    </button>
    <button
      v-if="showMax"
      type="button"
      class="titlebar__btn titlebar__btn--max"
      :title="isMax ? '还原' : '最大化'"
      :aria-label="isMax ? '还原' : '最大化'"
      @click="maximize()"
    >
      <svg
        v-if="isMax"
        class="titlebar__icon titlebar__icon--restore"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        stroke-width="1.1"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3.5 1.2h7.5c.4 0 .7.3.7.7V8.5" stroke-linecap="round" stroke-linejoin="round" />
        <rect x="1.8" y="3.2" width="8" height="8" rx="1.2" />
      </svg>
      <svg
        v-else
        class="titlebar__icon"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        stroke-width="1.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="1" y="1" width="10" height="10" rx="1.2" />
      </svg>
    </button>
    <button
      v-if="showClose"
      type="button"
      class="titlebar__btn titlebar__btn--close"
      title="关闭"
      aria-label="关闭"
      @click="close()"
    >
      <svg
        class="titlebar__icon titlebar__icon--close"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        stroke-width="1.35"
        stroke-linecap="round"
      >
        <path d="M2 2l8 8M10 2L2 10" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isMax = ref(false)
const isTop = ref(false)

const props = defineProps({
  showMin: {
    type: Boolean,
    default: true
  },
  showMax: {
    type: Boolean,
    default: false
  },
  showClose: {
    type: Boolean,
    default: true
  },
  closeType: {
    type: Number,
    default: 1
  },
  forceClose: {
    type: Boolean,
    default: false
  }
})

function winOp(action, data = {}) {
  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.send('winTitleOp', { action, data })
  }
}

function close() {
  winOp('close', {
    closeType: props.closeType,
    forceClose: props.forceClose
  })
}

function minimize() {
  winOp('minimize')
}

function maximize() {
  winOp(isMax.value ? 'restore' : 'maximize')
}

function toggleTop() {
  isTop.value = !isTop.value
  winOp('alwaysOnTop', { enabled: isTop.value })
}

function onWinIsMax(_, res) {
  isMax.value = !!res
}

onMounted(() => {
  isMax.value = false
  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.on('winIsMax', onWinIsMax)
  }
})

onUnmounted(() => {
  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.removeListener?.('winIsMax', onWinIsMax)
  }
})

defineExpose({
  custClose: () => winOp('close', { closeType: props.closeType, forceClose: true }),
  alwaysOnTop: () => winOp('alwaysOnTop')
})
</script>

<style scoped>
.titlebar {
  display: flex;
  align-items: stretch;
  height: 40px;
}
.titlebar__btn {
  width: 46px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
  -webkit-app-region: no-drag;
}
.titlebar__btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.titlebar__btn:active {
  background: var(--border);
}
.titlebar__btn--close:hover {
  background: #e81123;
  color: #fff;
}
.titlebar__btn--close:active {
  background: #c50f1f;
}
.titlebar__icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}
.titlebar__icon--restore {
  width: 11px;
  height: 11px;
}
.titlebar__btn--pin {
  position: relative;
}
.titlebar__btn--pin-active {
  color: var(--accent);
}
.titlebar__btn--pin-active::before {
  content: '';
  position: absolute;
  inset: 8px 10px;
  border-radius: 999px;
  background: rgba(91, 111, 216, 0.12);
}
.titlebar__icon--close {
  stroke-width: 1.5;
}
</style>
