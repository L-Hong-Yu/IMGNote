<template>
  <header
    class="header"
    :class="{ 'header--bordered': showBottomBorder }"
    @dblclick="onHeaderDblclick"
  >
    <div class="header__drag" />
    <CustomTooltip v-if="logo" content="双击最大化/还原">
      <div class="header__logo">
        <AppLogo class="header__logo-icon" />
        <span class="header__logo-text">像素笔记</span>
        <span v-if="version" class="header__ver">v{{ version }}</span>
      </div>
    </CustomTooltip>
    <div class="header__spacer" />
    <TitleBar :close-type="closeType" :show-max="showMax" class="header__titlebar" />
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import TitleBar from './TitleBar.vue'
import AppLogo from './AppLogo.vue'
import CustomTooltip from './CustomTooltip.vue'

const props = defineProps({
  logo: {
    type: Boolean,
    default: true
  },
  showMax: {
    type: Boolean,
    default: false
  },
  showBottomBorder: {
    type: Boolean,
    default: false
  },
  closeType: {
    type: Number,
    default: 1
  }
})

const isMax = ref(false)
const version = ref('')

function onHeaderDblclick(e) {
  if (!props.showMax) return
  if (e.target.closest('.header__titlebar')) return
  toggleMaximize()
}

function toggleMaximize() {
  if (!window.electron?.ipcRenderer) return
  window.electron.ipcRenderer.send('winTitleOp', {
    action: isMax.value ? 'restore' : 'maximize'
  })
}

function onWinIsMax(_, res) {
  isMax.value = !!res
}

onMounted(() => {
  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.on('winIsMax', onWinIsMax)
  }
  window.api?.app
    ?.getVersion?.()
    .then((v) => (version.value = String(v || '').replace(/^v/i, '')))
    .catch(() => {})
})

onUnmounted(() => {
  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.removeListener?.('winIsMax', onWinIsMax)
  }
})
</script>

<style scoped>
.header {
  flex-shrink: 0;
  height: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  padding: 0 0 0 16px;
  background: var(--bg-card);
  -webkit-app-region: drag;
  user-select: none;
}
.header--bordered {
  border-bottom: 1px solid var(--border);
}
.header__drag {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  -webkit-app-region: drag;
  pointer-events: none;
}
.header__logo {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  padding: 0 10px 0 0;
  max-width: 260px;
  height: 40px;
  -webkit-app-region: no-drag;
  cursor: default;
}
.header__logo-icon {
  font-size: 12px;
  color: var(--accent);
  opacity: 0.92;
  transition: opacity 0.2s ease;
}
.header__logo-text {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}
.header__ver {
  margin-left: 6px;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-tertiary);
  background: var(--bg-page);
  border: 1px solid var(--border);
  line-height: 1.2;
}
.header__logo:hover .header__logo-icon {
  opacity: 1;
}
.header__spacer {
  flex: 1;
  min-width: 0;
}
.header__titlebar {
  position: relative;
  z-index: 2;
  -webkit-app-region: no-drag;
}
</style>
