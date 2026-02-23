<template>
  <div class="home">
    <aside class="sidebar">
      <div class="brand">
        <AppLogo class="brand-icon" />
        <span class="brand-name">IMGNote</span>
      </div>
      <div class="sidebar-nav">
        <CategorySidebar />
      </div>
      <nav class="sidebar-footer" aria-label="辅助导航">
        <router-link to="/help" class="footer-link" active-class="footer-link--active">
          <span class="footer-link__icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M9.7 9.2c.2-.8.8-1.4 1.6-1.5 1-.1 1.9.5 2.1 1.3.2.8-.2 1.5-.9 1.9l-1 .6" />
              <circle cx="12" cy="16.2" r="1.2" fill="currentColor" />
            </svg>
          </span>
          <span class="footer-link__label">帮助</span>
        </router-link>
        <span class="footer-divider" aria-hidden="true" />
        <router-link to="/settings" class="footer-link" active-class="footer-link--active">
          <span class="footer-link__icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            >
              <circle cx="12" cy="12" r="2.5" />
              <path
                d="M12 4v2.5M12 17.5V20M4 12h2.5M17.5 12H20M6.34 6.34l1.77 1.77M15.89 15.89l1.77 1.77M6.34 17.66l1.77-1.77M15.89 8.11l1.77-1.77"
              />
            </svg>
          </span>
          <span class="footer-link__label">设置</span>
        </router-link>
      </nav>
    </aside>
    <main class="main">
      <header class="toolbar">
        <h1 class="toolbar-title">像素笔记</h1>
        <div class="toolbar-actions">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="notebookStore.loading"
            @click="refresh"
          >
            刷新
          </button>
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="exportingDb || notebookStore.list.length === 0"
            @click="openExportModal"
          >
            {{ exportingDb ? '导出中…' : '导出笔记' }}
          </button>
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="importingDb"
            @click="importDataBaseFile"
          >
            {{ importingDb ? '导入中…' : '导入笔记' }}
          </button>
          <button type="button" class="btn btn-primary" @click="startImport">导入图片</button>
        </div>
      </header>
      <div
        v-if="isEmpty"
        class="empty-state"
        :class="{ 'drag-over': isDragOver }"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        @dragover="handleDragOver"
        @drop="handleDrop"
      >
        <div class="empty-icon">🖼️</div>
        <p class="empty-title">{{ isDragOver ? '松开鼠标导入图片' : '暂无笔记本' }}</p>
        <p class="empty-desc">
          {{
            isDragOver
              ? '将图片文件拖拽到这里'
              : '当前分类下没有笔记本，可点击「导入图片」从本机导入或直接拖拽图片文件到这里'
          }}
        </p>
      </div>
      <div
        v-else-if="showList"
        class="notebook-container"
        :class="{ 'drag-over': isDragOver }"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        @dragover="handleDragOver"
        @drop="handleDrop"
      >
        <div v-if="isDragOver" class="drag-hint">
          <div class="drag-hint-content">
            <span class="drag-icon">📁</span>
            <span class="drag-text">松开鼠标导入图片</span>
          </div>
        </div>
        <div class="notebook-grid">
          <NotebookCard
            v-for="nb in notebookStore.filteredList"
            :key="nb.id + nb.categoryId"
            :notebook="nb"
            @open="openNotebook(nb)"
            @view-image="openImageViewer(nb)"
          />
        </div>
      </div>
    </main>

    <div v-if="exportModalVisible" class="modal-mask" @click.self="closeExportModal">
      <div class="modal modal-export">
        <h3 class="modal-title">选择要导出的笔记本</h3>
        <p class="modal-desc">勾选需要导出的笔记本，将导出为单个 .IMGNote 文件</p>
        <div class="export-toolbar">
          <button type="button" class="btn-link" @click="selectAllExport">全选</button>
          <span class="export-toolbar-divider">|</span>
          <button type="button" class="btn-link" @click="deselectAllExport">取消全选</button>
        </div>
        <div class="export-list">
          <div v-for="cat in exportListByCategory" :key="cat.id" class="export-category">
            <div class="export-category-header">
              <span class="export-category-dot" :style="{ background: cat.color }"></span>
              <span class="export-category-name">{{ cat.name }}</span>
            </div>
            <label v-for="nb in cat.notes" :key="nb.id + nb.categoryId" class="export-note-item">
              <input
                type="checkbox"
                :checked="isExportNoteSelected(nb)"
                @change="toggleExportNote(nb)"
              />
              <span class="export-note-name">{{ nb.name || '未命名' }}</span>
            </label>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="closeExportModal">取消</button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="exportingDb || exportSelectedCount === 0"
            @click="confirmExportNotes"
          >
            {{ exportingDb ? '导出中…' : `导出（已选 ${exportSelectedCount} 个）` }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="importModalVisible" class="modal-mask" @click.self="cancelImport">
      <div class="modal modal-import">
        <h3 class="modal-title">导入图片</h3>
        <p class="modal-desc">
          已选择 {{ importPendingItems.length }} 张图片。可选填写笔记本名称，留空则使用图片文件名
        </p>
        <div class="modal-field">
          <label>目标分类</label>
          <div class="category-select" @click="toggleImportCategoryDropdown" ref="importCategoryDropdownRef">
            <div class="category-select-current">
              <span
                class="category-select-dot"
                :style="{ background: currentImportCategory?.color || '#6b7fd7' }"
              ></span>
              <span class="category-select-name">
                {{ currentImportCategory?.name || '未选择分类' }}
              </span>
              <span class="category-select-chevron">▾</span>
            </div>
            <div v-if="importCategoryDropdownOpen" class="category-select-dropdown">
              <button
                v-for="c in notebookStore.categories"
                :key="c.id"
                type="button"
                class="category-select-option"
                :class="{ active: c.id === importTargetCategoryId }"
                @click.stop="selectImportCategory(c.id)"
              >
                <span class="category-select-dot" :style="{ background: c.color || '#6b7fd7' }"></span>
                <span class="category-select-name">{{ c.name }}</span>
              </button>
            </div>
          </div>
        </div>
        <div class="modal-field">
          <label>笔记本名称（可选）</label>
          <div class="import-list">
            <div v-for="(item, index) in importPendingItems" :key="index" class="import-row">
              <span class="import-filename">{{ getFileName(item.path) }}</span>
              <input
                v-model="item.name"
                type="text"
                class="import-name-input"
                :placeholder="'默认为「' + getFileName(item.path) + '」'"
              />
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="cancelImport">取消</button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="importing"
            @click="confirmImport"
          >
            {{ importing ? '导入中…' : '导入' }}
          </button>
        </div>
      </div>
    </div>

    <ImageViewer
      v-model:visible="viewerVisible"
      :title="viewerNotebook?.name || '查看图片'"
      :image-path="viewerNotebook?.imagePath || ''"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/appStore'
import { useNotebookStore } from '@/stores/notebookStore'
import NotebookCard from '@/components/NotebookCard.vue'
import ImageViewer from '@/components/ImageViewer.vue'
import CategorySidebar from '@/components/CategorySidebar.vue'
import AppLogo from '@/components/AppLogo.vue'
import Message from '@/utils/Message'

const router = useRouter()
const appStore = useAppStore()
const notebookStore = useNotebookStore()
const importModalVisible = ref(false)
const importTargetCategoryId = ref('_default')
const importCategoryDropdownOpen = ref(false)
const importCategoryDropdownRef = ref(null)
const importPendingItems = ref([])
const importing = ref(false)
const exportingDb = ref(false)
const importingDb = ref(false)
const isDragOver = ref(false)
const dragCounter = ref(0)
const viewerVisible = ref(false)
const viewerNotebook = ref(null)

const isEmpty = computed(() => !notebookStore.loading && notebookStore.filteredList.length === 0)
const showList = computed(() => notebookStore.filteredList.length > 0)

const exportModalVisible = ref(false)
const exportSelectedKeys = ref(new Set())

const exportListByCategory = computed(() => {
  const list = notebookStore.list || []
  const categories = notebookStore.categories || []
  const byCat = new Map()
  for (const cat of categories) {
    byCat.set(cat.id, { id: cat.id, name: cat.name, color: cat.color || '#6b7fd7', notes: [] })
  }
  for (const nb of list) {
    let group = byCat.get(nb.categoryId)
    if (!group) {
      group = { id: nb.categoryId, name: nb.categoryId, color: '#6b7fd7', notes: [] }
      byCat.set(nb.categoryId, group)
    }
    group.notes.push(nb)
  }
  return [...byCat.values()].filter((g) => g.notes.length > 0)
})

const exportSelectedCount = computed(() => exportSelectedKeys.value.size)

function exportNoteKey(nb) {
  return `${nb.categoryId}|${nb.id}`
}

const currentImportCategory = computed(() => {
  const list = notebookStore.categories || []
  return list.find((c) => c.id === importTargetCategoryId.value) || list[0] || null
})

function toggleImportCategoryDropdown() {
  importCategoryDropdownOpen.value = !importCategoryDropdownOpen.value
}

function selectImportCategory(id) {
  importTargetCategoryId.value = id
  importCategoryDropdownOpen.value = false
}

function isExportNoteSelected(nb) {
  return exportSelectedKeys.value.has(exportNoteKey(nb))
}

function toggleExportNote(nb) {
  const key = exportNoteKey(nb)
  const next = new Set(exportSelectedKeys.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  exportSelectedKeys.value = next
}

function selectAllExport() {
  const all = new Set()
  for (const nb of notebookStore.list || []) all.add(exportNoteKey(nb))
  exportSelectedKeys.value = all
}

function deselectAllExport() {
  exportSelectedKeys.value = new Set()
}

function openExportModal() {
  exportModalVisible.value = true
  selectAllExport()
}

function closeExportModal() {
  exportModalVisible.value = false
}

async function confirmExportNotes() {
  if (exportSelectedCount.value === 0) {
    Message.warning('请至少选择一个笔记本')
    return
  }
  const selectedNotes = []
  for (const nb of notebookStore.list || []) {
    if (exportSelectedKeys.value.has(exportNoteKey(nb))) {
      selectedNotes.push({ id: nb.id, categoryId: nb.categoryId })
    }
  }
  exportingDb.value = true
  try {
    const dest = await notebookStore.exportSelectedNotes(selectedNotes)
    if (dest) {
      Message.success('已导出至：' + dest)
      closeExportModal()
    }
  } finally {
    exportingDb.value = false
  }
}

function openNotebook(notebook) {
  const id = encodeURIComponent(notebook.imagePath)
  router.push({ name: 'Editor', params: { id }, query: { name: notebook.name || '' } })
}

function openImageViewer(notebook) {
  viewerNotebook.value = notebook || null
  viewerVisible.value = true
}

async function refresh() {
  await notebookStore.ensureAndFetch()
  Message.success('已刷新')
}

function getFileName(path) {
  if (!path) return ''
  const name = path.replace(/^.*[\\/]/, '')
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}

async function startImport() {
  const paths = await notebookStore.showImportDialog()
  if (!paths?.length) return
  importPendingItems.value = paths.map((p) => ({ path: p, name: '' }))
  importTargetCategoryId.value = notebookStore.selectedCategoryId || '_default'
  importModalVisible.value = true
}

async function confirmImport() {
  if (!importPendingItems.value.length) {
    importModalVisible.value = false
    return
  }
  importing.value = true
  try {
    const categoryId = importTargetCategoryId.value || '_default'
    const added = await notebookStore.importImages(categoryId, importPendingItems.value)
    importModalVisible.value = false
    importPendingItems.value = []
    Message.success(`已导入 ${added.length} 个笔记本`)
    await notebookStore.ensureAndFetch()
  } finally {
    importing.value = false
  }
}

function cancelImport() {
  importModalVisible.value = false
  importPendingItems.value = []
}

async function importDataBaseFile() {
  const sourceFilePath = await notebookStore.showImportDataBaseFileDialog()
  if (!sourceFilePath) return
  importingDb.value = true
  try {
    const result = await notebookStore.importDataBaseFile(sourceFilePath, {
      skipDuplicates: appStore.importSkipDuplicates
    })
    await notebookStore.ensureAndFetch()
    const { added, skipped } = result || { added: 0, skipped: 0 }
    if (skipped > 0 && added > 0) {
      Message.success(`导入完成：新增 ${added} 条，跳过 ${skipped} 条重复`)
    } else if (skipped > 0) {
      Message.success(`导入完成：已跳过 ${skipped} 条重复数据`)
    } else if (added > 0) {
      Message.success(`导入完成：已新增 ${added} 条`)
    } else {
      Message.info('没有新数据导入')
    }
  } catch (e) {
    Message.error(e?.message || '导入失败')
  } finally {
    importingDb.value = false
  }
}

function handleDragEnter(e) {
  e.preventDefault()
  e.stopPropagation()
  dragCounter.value++
  if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
    isDragOver.value = true
  }
}

function handleDragLeave(e) {
  e.preventDefault()
  e.stopPropagation()
  dragCounter.value--
  if (dragCounter.value === 0) {
    isDragOver.value = false
  }
}

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'])

function isImagePath(path) {
  if (!path || typeof path !== 'string') return false
  const ext = path.toLowerCase().replace(/^.*\./, '')
  return IMAGE_EXT.has('.' + ext)
}

function handleDragOver(e) {
  e.preventDefault()
  e.stopPropagation()
  e.dataTransfer.dropEffect = 'copy'
}

async function handleDrop(e) {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = false
  dragCounter.value = 0

  let paths = []
  const dt = e.dataTransfer
  const getPathForFile = window.api?.notebook?.getPathForFile

  const isImage = (file) => file && (!file.type || file.type.startsWith('image/'))
  if (dt.files && dt.files.length > 0) {
    for (let i = 0; i < dt.files.length; i++) {
      const file = dt.files[i]
      if (!isImage(file)) continue
      const p = getPathForFile ? getPathForFile(file) : file.path || ''
      if (p && isImagePath(p)) paths.push(p)
    }
  }
  if (paths.length === 0 && dt.items) {
    for (let i = 0; i < dt.items.length; i++) {
      const item = dt.items[i]
      if (item.kind !== 'file') continue
      const file = item.getAsFile()
      if (!isImage(file)) continue
      const p = getPathForFile ? getPathForFile(file) : file.path || ''
      if (p && isImagePath(p)) paths.push(p)
    }
  }

  if (paths.length === 0 && window.api?.notebook?.getLastDroppedPaths) {
    await new Promise((r) => setTimeout(r, 150))
    const mainPaths = await window.api.notebook.getLastDroppedPaths()
    if (mainPaths?.length) paths = mainPaths.filter((p) => p && isImagePath(p))
  }

  if (paths.length > 0) {
    importPendingItems.value = paths.map((path) => ({ path, name: '' }))
    importTargetCategoryId.value = notebookStore.selectedCategoryId || '_default'
    importModalVisible.value = true
  }
}

function onFilesDropped(filePaths) {
  if (!filePaths || !Array.isArray(filePaths)) return
  const imageFiles = filePaths.filter((p) => {
    if (!p) return false
    const ext = (p.toLowerCase().split('.').pop() || '').trim()
    return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)
  })
  if (imageFiles.length > 0) {
    importPendingItems.value = imageFiles.map((path) => ({ path, name: '' }))
    importTargetCategoryId.value = notebookStore.selectedCategoryId || '_default'
    importModalVisible.value = true
  }
}

onMounted(() => {
  notebookStore.ensureAndFetch()
  window.handleFilesDropped = onFilesDropped
})

onUnmounted(() => {
  window.handleFilesDropped = null
})
</script>

<style scoped>
.home {
  display: flex;
  height: 100%;
  background: var(--bg-page);
}
.sidebar {
  user-select: none;
  width: 232px;
  flex-shrink: 0;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.brand {
  flex-shrink: 0;
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-icon {
  font-size: 22px;
  color: var(--accent);
  opacity: 0.9;
}
.brand-name {
  font-size: 19px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.03em;
}
.sidebar-nav {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}
.sidebar-footer {
  flex-shrink: 0;
  padding: 14px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  background: var(--bg-sidebar);
}
.footer-link {
  -webkit-touch-callout: none !important;
  -webkit-user-drag: none !important;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-decoration: none;
  transition:
    color 0.18s ease,
    background 0.18s ease;
}
.footer-link:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}
.footer-link--active {
  color: var(--accent);
}
.footer-link--active:hover {
  color: var(--accent-hover);
}
.footer-link__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
}
.footer-link__icon svg {
  width: 100%;
  height: 100%;
}
.footer-divider {
  width: 1px;
  height: 14px;
  background: var(--border);
  flex-shrink: 0;
}
.main {
  user-select: none;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.toolbar {
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 28px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-page);
}
.toolbar-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.toolbar-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  text-align: center;
  transition: background-color 0.2s ease;
}

.empty-state.drag-over {
  background-color: var(--accent-subtle);
  border: 2px dashed var(--accent);
  border-radius: 12px;
  margin: 20px;
}
.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.85;
  filter: grayscale(0.1);
}
.empty-title {
  font-size: 19px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 10px;
  letter-spacing: -0.01em;
}
.empty-desc {
  font-size: 14px;
  color: var(--text-tertiary);
  max-width: 380px;
  margin: 0 0 28px;
  line-height: 1.6;
}
.notebook-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.notebook-container.drag-over {
  background-color: var(--accent-subtle);
}

.drag-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--accent-subtle);
  z-index: 100;
  border: 2px dashed var(--accent);
  border-radius: 12px;
  margin: 20px;
}

.drag-hint-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.drag-icon {
  font-size: 48px;
}

.drag-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--accent);
}

.notebook-grid {
  flex: 1;
  padding: 28px 32px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 28px 24px;
  align-content: start;
  overflow-y: auto;
  overflow-x: hidden;
}
.btn {
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.1s ease;
}
.btn:active {
  transform: scale(0.98);
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
.btn-ghost:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.btn-ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-mask {
  user-select: none;
  position: fixed;
  inset: 0;
  background: var(--overlay-mask);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: background 0.25s ease;
}
.modal {
  background: var(--bg-card);
  border-radius: 14px;
  padding: 26px 28px;
  min-width: 340px;
  box-shadow: var(--shadow-dialog);
  border: 1px solid var(--border);
  transition:
    background 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}
.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}
.modal-desc {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0 0 16px;
}
.modal-field {
  margin-bottom: 20px;
}
.modal-field label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.category-select {
  position: relative;
  width: 100%;
}
.category-select-current {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.category-select-current:hover {
  background: var(--bg-hover);
  border-color: var(--accent-subtle);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}
.category-select-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex-shrink: 0;
}
.category-select-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.category-select-chevron {
  font-size: 11px;
  color: var(--text-tertiary);
}
.category-select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 220px;
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 30;
  overflow-y: auto;
}
.category-select-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
  text-align: left;
  transition:
    background 0.12s,
    color 0.12s;
}
.category-select-option:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.category-select-option.active {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--text-primary);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.modal-export {
  max-width: 420px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-export .modal-desc {
  margin-bottom: 12px;
}
.export-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.btn-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  color: var(--accent);
  cursor: pointer;
  transition: color 0.18s ease;
}
.btn-link:hover {
  color: var(--accent-hover);
}
.export-toolbar-divider {
  color: var(--border);
  font-size: 12px;
  user-select: none;
}
.export-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-page);
  padding: 8px;
  margin-bottom: 16px;
  max-height: 320px;
}
.export-category {
  margin-bottom: 12px;
}
.export-category:last-child {
  margin-bottom: 0;
}
.export-category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}
.export-category-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.export-category-name {
  flex: 1;
}
.export-note-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
  font-size: 14px;
  color: var(--text-primary);
}
.export-note-item:hover {
  background: var(--bg-hover);
}
.export-note-item input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
  flex-shrink: 0;
}
.export-note-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-import {
  max-width: 420px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-import .modal-desc {
  margin-bottom: 12px;
}
.import-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px;
  background: var(--bg-page);
}
.import-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
}
.import-row:last-child {
  border-bottom: none;
}
.import-filename {
  flex-shrink: 0;
  width: 100px;
  font-size: 12px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.import-name-input {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  background: var(--bg-card);
  color: var(--text-primary);
}
.import-name-input::placeholder {
  color: var(--text-tertiary);
}
</style>
