<template>
  <div class="settings">
    <header class="settings-header">
      <button type="button" class="back-btn" aria-label="返回" @click="router.push('/')">
        <span class="back-arrow">←</span>
      </button>
      <h1 class="settings-title">设置</h1>
    </header>
    <main class="settings-main">
      <div class="settings-content">
        <section class="settings-section theme-section">
          <h2 class="section-title">外观</h2>
          <p class="section-desc">选择浅色或深色主题，切换时即时生效</p>
          <div class="theme-capsule" role="group" aria-label="主题切换">
            <span
              class="theme-capsule__slider"
              :data-active="themeStore.theme"
              aria-hidden="true"
            />
            <button
              type="button"
              class="theme-capsule__item"
              :class="{ active: themeStore.theme === 'light' }"
              :aria-pressed="themeStore.theme === 'light'"
              @click="themeStore.setTheme('light')"
            >
              <span class="theme-capsule__icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path
                    d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                  />
                </svg>
              </span>
              <span class="theme-capsule__label">浅色</span>
            </button>
            <button
              type="button"
              class="theme-capsule__item"
              :class="{ active: themeStore.theme === 'dark' }"
              :aria-pressed="themeStore.theme === 'dark'"
              @click="themeStore.setTheme('dark')"
            >
              <span class="theme-capsule__icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </span>
              <span class="theme-capsule__label">深色</span>
            </button>
          </div>
        </section>

        <section class="settings-section">
          <h2 class="section-title">数据存储位置</h2>
          <p class="section-desc">所有数据均存储于下方目录</p>
          <div class="path-box">
            <span class="path-box__icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                />
              </svg>
            </span>
            <span class="path-box__text" :title="dataBasePath || ''">{{
              dataBasePath || '加载中…'
            }}</span>
            <button
              v-if="dataBasePath"
              type="button"
              class="path-box__copy"
              aria-label="复制路径"
              title="复制路径"
              @click="copyDataBasePath"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>
        </section>

        <section class="settings-section">
          <h2 class="section-title">导入数据</h2>
          <p class="section-desc">从 .IMGNote 文件导入时，是否按笔记内容自动跳过已存在的重复数据</p>
          <label class="settings-check">
            <input
              type="checkbox"
              :checked="appStore.importSkipDuplicates"
              @change="appStore.setImportSkipDuplicates($event.target.checked)"
            />
            <span class="settings-check__label">导入时跳过重复的笔记</span>
          </label>
        </section>

        <section class="settings-section">
          <h2 class="section-title">数据备份</h2>
          <p class="section-desc">将全部笔记本数据导出为一个 .IMGNote 备份文件，便于备份与迁移</p>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="exportingDb"
            @click="backupDataBase"
          >
            {{ exportingDb ? '备份中…' : '数据备份' }}
          </button>
        </section>

        <section class="settings-section">
          <h2 class="section-title">迁移数据</h2>
          <p class="section-desc">
            将数据迁移到其它文件夹。将复制当前数据到您选择的目标目录下，并切换存储位置。建议迁移后重启应用
          </p>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="migrating"
            @click="migrateDataBase"
          >
            {{ migrating ? '迁移中…' : '迁移数据' }}
          </button>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/appStore'
import { useNotebookStore } from '@/stores/notebookStore'
import { useThemeStore } from '@/stores/themeStore'
import { ipcNotebook } from '@/api/notebook'
import Message from '@/utils/Message'

const router = useRouter()
const appStore = useAppStore()
const notebookStore = useNotebookStore()
const themeStore = useThemeStore()
const dataBasePath = ref('')
const exportingDb = ref(false)
const migrating = ref(false)

onMounted(async () => {
  dataBasePath.value = (await ipcNotebook.getDataBasePath?.()) || ''
})

async function copyDataBasePath() {
  if (!dataBasePath.value) return
  try {
    await navigator.clipboard.writeText(dataBasePath.value)
    Message.success('路径已复制')
  } catch (_) {
    Message.error('复制失败')
  }
}

async function backupDataBase() {
  exportingDb.value = true
  try {
    const dest = await notebookStore.exportDataBase()
    if (dest) Message.success('备份已保存至：' + dest)
  } finally {
    exportingDb.value = false
  }
}

async function migrateDataBase() {
  const targetPath = await notebookStore.showMigrateFolderDialog()
  if (!targetPath) return
  migrating.value = true
  try {
    const newPath = await notebookStore.migrateDataBase(targetPath)
    if (newPath) {
      dataBasePath.value = newPath
      await notebookStore.ensureAndFetch()
      Message.success('数据已迁移至新地址，重启应用后生效')
    }
  } finally {
    migrating.value = false
  }
}
</script>

<style scoped>
.settings {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
}
.settings-header {
  user-select: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
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
}
.back-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.back-arrow {
  font-size: 18px;
}
.settings-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
.settings-main {
  flex: 1;
  overflow: auto;
  padding: 0;
  min-width: 0;
}
.settings-content {
  max-width: 100%;
  padding: 28px 32px 40px;
}
.settings-section {
  margin-bottom: 36px;
}
.settings-section:last-child {
  margin-bottom: 0;
}
.section-title {
  user-select: none;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px;
}
.section-desc {
  user-select: none;
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0 0 14px;
  line-height: 1.5;
}
.path-box {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 12px 14px 12px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  border-left: 3px solid var(--accent);
  box-shadow: 0 1px 3px var(--shadow);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.path-box:hover {
  border-color: var(--border);
  box-shadow: 0 2px 6px var(--shadow);
}
.path-box__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--text-tertiary);
}
.path-box__icon svg {
  width: 20px;
  height: 20px;
}
.path-box__text {
  flex: 1;
  min-width: 0;
  font-family: ui-monospace, 'Cascadia Code', 'SF Mono', Monaco, Consolas, monospace;
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.path-box__copy {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}
.path-box__copy:hover {
  background: var(--bg-hover);
  color: var(--accent);
}
.path-box__copy svg {
  width: 16px;
  height: 16px;
}
.btn {
  user-select: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  background: var(--accent);
  color: var(--accent-fg);
  transition: background 0.2s ease;
}
.btn:hover:not(:disabled) {
  background: var(--accent-hover);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 外观 — 胶囊切换（滑动指示条 + 随主题变色） */
.theme-section {
  padding-bottom: 28px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 32px;
}
.theme-capsule {
  position: relative;
  display: inline-flex;
  align-items: stretch;
  background: var(--bg-muted);
  border-radius: 999px;
  padding: 4px;
  border: 1px solid var(--border);
  box-shadow: inset 0 1px 2px var(--shadow);
}
.theme-capsule__slider {
  position: absolute;
  left: 4px;
  top: 4px;
  bottom: 4px;
  width: calc(50% - 4px);
  border-radius: 999px;
  background: #7c9cbf;
  box-shadow: 0 2px 8px rgba(124, 156, 191, 0.4);
  pointer-events: none;
  transition:
    transform 0.45s cubic-bezier(0.32, 0.72, 0, 1),
    background-color 0.4s ease,
    box-shadow 0.4s ease;
  z-index: 0;
}
.theme-capsule__slider[data-active='dark'] {
  transform: translateX(100%);
  background: var(--accent);
  box-shadow: 0 2px 8px var(--shadow);
}
.theme-capsule__item {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 96px;
  padding: 10px 20px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.35s ease;
}
.theme-capsule__item:hover {
  color: var(--text-primary);
}
.theme-capsule__item.active {
  color: #fff;
}
.theme-capsule__item.active:hover {
  color: #fff;
}
.theme-capsule__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  transition: opacity 0.25s ease;
}
.theme-capsule__icon svg {
  width: 18px;
  height: 18px;
}
.theme-capsule__label {
  letter-spacing: 0.02em;
}

.settings-check {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}
.settings-check input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}
.settings-check__label {
  letter-spacing: 0.02em;
}
</style>
