<template>
  <Teleport to="body">
    <Transition name="splash-fade">
      <div
        v-if="showSplash"
        class="splash"
        :class="{ 'splash-exit': splashExiting }"
        aria-hidden="true"
      >
        <div class="splash-bg"></div>
        <div class="splash-content">
          <div class="splash-icon-wrap">
            <AppLogo class="splash-icon" aria-hidden="true" />
            <div class="splash-icon-glow"></div>
          </div>
          <h1 class="splash-title">IMGNote</h1>
          <p class="splash-tagline">像素笔记，将文字刻进像素的笔记本</p>
          <div class="splash-bar">
            <div class="splash-bar-fill"></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
  <div v-show="!showSplash" class="app-layout">
    <Header :show-max="true" :show-bottom-border="true" :close-type="0" />
    <main class="app-content">
      <UpdatePage v-if="showUpdate && updateInfo" :info="updateInfo" @skip="showUpdate = false" />
      <router-view v-else />
    </main>
  </div>

  <ConfirmDialog
    v-model:visible="showQuitConfirm"
    title="退出程序"
    message="存在未保存的笔记内容，确定退出程序吗？"
    confirm-text="退出程序"
    cancel-text="取消"
    @confirm="handleForceQuit"
  />

  <ConfirmDialog
    v-model:visible="showUpdateExitGuard"
    title="正在更新"
    message="应用正在下载或安装更新，请等待更新完成后再退出。"
    confirm-text="知道了"
    cancel-text=""
    @confirm="showUpdateExitGuard = false"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNotebookStore } from '@/stores/notebookStore'
import Header from '@/components/Header.vue'
import AppLogo from '@/components/AppLogo.vue'
import UpdatePage from '@/components/UpdatePage.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const showSplash = ref(true)
const splashExiting = ref(false)
const notebookStore = useNotebookStore()
const updateInfo = ref(null)
const showUpdate = ref(false)
const showUpdateExitGuard = ref(false)
const showQuitConfirm = ref(false)

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

onMounted(async () => {
  const minShow = 2000
  const checkTask = window.api?.updater?.check?.().catch(() => null)
  await Promise.all([delay(minShow), notebookStore.ensureAndFetch?.().catch(() => {}), checkTask])
  const info = await checkTask
  if (info?.ok && info.updateAvailable) {
    updateInfo.value = info
    showUpdate.value = true
  }
  splashExiting.value = true
  await delay(500)
  showSplash.value = false
  await window.api?.app?.splashFinished?.()

  window.api?.app?.onQuitRequest?.(() => {
    showQuitConfirm.value = true
  })

  window.api?.app?.onUpdateExitBlocked?.(() => {
    showUpdateExitGuard.value = true
  })
})

function handleForceQuit() {
  if (typeof window !== 'undefined' && window.api?.app?.forceQuit) {
    window.api.app.forceQuit()
  }
}
</script>

<style>
#app {
  height: 100vh;
  overflow: hidden;
}
.app-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.app-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  -webkit-app-region: no-drag;
}
</style>

<style scoped>
.splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.splash.splash-exit .splash-content {
  opacity: 0;
  transform: scale(0.98);
}
.splash-bg {
  position: absolute;
  inset: 0;
  background: var(--bg-page);
}
.splash-content {
  position: relative;
  text-align: center;
  padding: 24px 28px;
  transition:
    opacity 0.45s ease,
    transform 0.45s ease;
}
.splash-icon-wrap {
  position: relative;
  margin-bottom: 12px;
}
.splash-icon {
  position: relative;
  font-size: 40px;
  width: 1em;
  height: 1em;
  color: var(--accent);
  opacity: 0.95;
  animation: splash-icon-in 0.7s ease-out;
}
.splash-icon-glow {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 56px;
  height: 56px;
  margin: -28px 0 0 -28px;
  background: var(--accent);
  border-radius: 50%;
  filter: blur(20px);
  opacity: 0.2;
  animation: splash-glow 2s ease-in-out infinite;
}
.splash-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.03em;
  margin: 0 0 4px;
  animation: splash-text-in 0.6s ease-out 0.15s both;
}
.splash-tagline {
  font-size: 12px;
  color: var(--text-tertiary);
  letter-spacing: 0.04em;
  margin: 0 0 16px;
  animation: splash-text-in 0.6s ease-out 0.25s both;
}
.splash-bar {
  width: 80px;
  height: 2px;
  margin: 0 auto;
  background: var(--border);
  border-radius: 1px;
  overflow: hidden;
  animation: splash-text-in 0.5s ease-out 0.35s both;
}
.splash-bar-fill {
  height: 100%;
  width: 40%;
  background: var(--accent);
  border-radius: 1px;
  animation: splash-bar 1.4s ease-in-out infinite;
}
.splash-exit .splash-bar-fill {
  animation: splash-bar-complete 0.4s ease-out forwards;
}

@keyframes splash-icon-in {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 0.95;
    transform: scale(1);
  }
}
@keyframes splash-glow {
  0%,
  100% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.28;
  }
}
@keyframes splash-text-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes splash-bar {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(250%);
  }
  100% {
    transform: translateX(-100%);
  }
}
@keyframes splash-bar-complete {
  to {
    width: 100%;
    transform: translateX(0);
  }
}
</style>
