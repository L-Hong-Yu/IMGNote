<template>
  <article class="notebook-card" @click="emit('open', notebook)">
    <div
      class="notebook-spine"
      :style="{ background: category ? category.color + 'dd' : 'var(--spine-default)' }"
    ></div>
    <div class="notebook-cover">
      <img
        :src="fileUrl(notebook.imagePath)"
        :alt="notebook.name"
        class="notebook-cover-img"
        loading="lazy"
        @error="(e) => (e.target.style.display = 'none')"
      />
      <div v-if="!notebook.imagePath" class="notebook-cover-placeholder">📓</div>
      <div class="notebook-actions" @click.stop>
        <ElDropdown ref="dropdownRef" trigger="click">
          <button type="button" class="notebook-action-btn" aria-label="更多操作">
            <span class="action-icon">⋯</span>
          </button>
          <template #dropdown>
            <div class="notebook-dropdown-panel">
              <button type="button" class="dropdown-item" @click="renameNotebook">重命名</button>
              <div class="dropdown-move-list">
                <button
                  v-for="cat in categories"
                  :key="cat.id"
                  type="button"
                  class="dropdown-item"
                  :disabled="cat.id === notebook.categoryId"
                  @click="moveToCategory(cat.id, $event)"
                >
                  <span class="dropdown-dot" :style="{ background: cat.color }"></span>
                  移动到 {{ cat.name }}
                </button>
              </div>
              <button type="button" class="dropdown-item" @click="viewImage">查看图片</button>
              <button type="button" class="dropdown-item" @click="exportImage">导出图片</button>
              <button
                type="button"
                class="dropdown-item dropdown-item-danger"
                @click="confirmDelete"
              >
                删除笔记本
              </button>
            </div>
          </template>
        </ElDropdown>
      </div>
      <div class="notebook-footer">
        <span class="notebook-title">{{ notebook.name || '未命名' }}</span>
        <div class="notebook-footer-right">
          <CustomTooltip v-if="notebook.encrypted" content="已加密">
            <span class="notebook-lock-inline" aria-label="已加密">
              <svg class="notebook-lock-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M7.5 11V8.8a4.5 4.5 0 0 1 9 0V11"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <rect
                  x="6"
                  y="11"
                  width="12"
                  height="10"
                  rx="3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M12 15v3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </span>
          </CustomTooltip>
          <span
            v-if="category"
            class="notebook-category-tag"
            :style="{ background: category.color + '22', color: category.color }"
          >
            {{ category.name }}
          </span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useNotebookStore } from '@/stores/notebookStore'
import { ElDropdown, ElMessageBox } from 'element-plus'
import Message from '@/utils/Message'
import CustomTooltip from './CustomTooltip.vue'

const props = defineProps({
  notebook: { type: Object, required: true }
})
const emit = defineEmits(['open', 'viewImage'])

const notebookStore = useNotebookStore()
const category = computed(() => notebookStore.getCategoryForNotebook(props.notebook))
const categories = computed(() => notebookStore.categories)
const dropdownRef = ref(null)

const IMGNOTE_FILE_SCHEME = 'imgnote-file'

function fileUrl(filePath) {
  if (!filePath) return ''
  const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '')
  return `${IMGNOTE_FILE_SCHEME}:///${encodeURI(normalized)}`
}

function closeDropdown() {
  dropdownRef.value?.blur?.()
}

async function moveToCategory(toCategoryId, e) {
  e?.stopPropagation()
  closeDropdown()
  if (toCategoryId === props.notebook.categoryId) return
  await notebookStore.moveNote(props.notebook.id, props.notebook.categoryId, toCategoryId)
  Message.success('已移动')
}

async function confirmDelete(e) {
  e?.stopPropagation()
  closeDropdown()
  try {
    await ElMessageBox.confirm(
      '删除后无法恢复，该笔记本及其中的图片与内容将永久丢失。确定要删除吗？',
      '删除笔记本',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    await notebookStore.deleteNote(props.notebook.id, props.notebook.categoryId)
    Message.success('已删除')
  } catch (_) {}
}

async function exportImage() {
  closeDropdown()
  const dest = await notebookStore.exportImage(props.notebook.imagePath)
  if (dest) Message.success('图片已导出')
}

function viewImage(e) {
  e?.stopPropagation()
  closeDropdown()
  emit('viewImage', props.notebook)
}

async function renameNotebook(e) {
  e?.stopPropagation()
  closeDropdown()
  try {
    const { value } = await ElMessageBox.prompt('输入新名称', '重命名笔记本', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: props.notebook.name || '',
      inputPattern: /.+/,
      inputErrorMessage: '名称不能为空'
    })
    const name = (value || '').trim()
    if (!name) return
    await notebookStore.updateNote(props.notebook.id, props.notebook.categoryId, { name })
    Message.success('已修改')
  } catch (_) {}
}
</script>

<style scoped>
.notebook-card {
  user-select: none;
  position: relative;
  display: flex;
  background: var(--bg-card);
  border-radius: 0 10px 10px 0;
  overflow: visible;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  box-shadow: var(--shadow-card);
}
.notebook-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--shadow-dialog);
}

.notebook-spine {
  width: 12px;
  flex-shrink: 0;
  border-radius: 4px 0 0 4px;
  opacity: 0.95;
}
.notebook-cover {
  flex: 1;
  min-width: 0;
  aspect-ratio: 3/4;
  position: relative;
  overflow: hidden;
  border-radius: 0 8px 8px 0;
  background: linear-gradient(145deg, var(--bg-muted) 0%, var(--bg-page) 100%);
}
.notebook-cover-img {
  pointer-events: none;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.notebook-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  opacity: 0.4;
}
.notebook-lock-icon {
  width: 16px;
  height: 16px;
}
.notebook-actions {
  user-select: none;
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 4;
  opacity: 0;
  transition: opacity 0.2s;
}
.notebook-card:hover .notebook-actions {
  opacity: 1;
}
.notebook-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border);
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.25s;
}
.notebook-action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.action-icon {
  font-size: 18px;
  line-height: 1;
  font-weight: 600;
}
.notebook-dropdown-panel {
  user-select: none;
  min-width: 160px;
  padding: 4px 0;
  background: var(--bg-card);
  border-radius: 8px;
  box-shadow: var(--shadow-dialog);
  border: 1px solid var(--border);
  transition: background 0.25s ease, border-color 0.25s ease;
}
.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
}
.dropdown-item:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.dropdown-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.dropdown-move-list {
  max-height: 180px;
  overflow-y: auto;
  overflow-x: hidden;
}
.dropdown-move-list .dropdown-item {
  padding-left: 16px;
}
.dropdown-item-danger {
  color: var(--danger);
  border-top: 1px solid var(--border);
  margin-top: 4px;
  padding-top: 8px;
}
.dropdown-item-danger:hover {
  background: var(--danger-hover-bg);
  color: var(--danger);
}
.dropdown-dot {
  user-select: none;
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
  flex-shrink: 0;
}
.notebook-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  padding: 20px 12px 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-radius: 0 0 8px 0;
}
.notebook-footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-shrink: 0;
}
.notebook-lock-inline {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.95);
  background: rgba(255, 255, 255, 0.44);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(10px);
}
.notebook-lock-inline .notebook-lock-icon {
  width: 13px;
  height: 13px;
}
.notebook-title {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}
.notebook-category-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(4px);
}
</style>
