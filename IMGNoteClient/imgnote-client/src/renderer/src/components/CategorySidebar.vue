<template>
  <nav class="category-nav">
    <div class="nav-label">分类</div>
    <button
      type="button"
      class="nav-item"
      :class="{ active: selectedId === null }"
      @click="selectCategory(null)"
    >
      全部
    </button>
    <div
      v-for="cat in categoryList"
      :key="cat.id"
      class="nav-item with-tag"
      :class="{ active: selectedId === cat.id }"
      @click="editingCategoryId !== cat.id && selectCategory(cat.id)"
    >
      <span class="nav-dot" :style="{ background: cat.color }"></span>
      <template v-if="editingCategoryId === cat.id">
        <input
          v-model="editingName"
          type="text"
          class="nav-edit-input"
          maxlength="20"
          @click.stop
          @keydown.enter="saveEditCategory"
          @keydown.escape="cancelEditCategory"
          @blur="saveEditCategory"
        />
      </template>
      <span
        v-else
        class="nav-text"
        @click="selectCategory(cat.id)"
        @dblclick.stop="startEditCategory($event, cat)"
      >
        {{ cat.name }}
      </span>
      <template v-if="cat.id !== '_default' && editingCategoryId !== cat.id">
        <button
          type="button"
          class="nav-edit-btn"
          aria-label="重命名"
          @click="startEditCategory($event, cat)"
        >
          ✎
        </button>
        <button
          type="button"
          class="nav-remove"
          aria-label="删除分类"
          @click="removeCategory($event, cat.id)"
        >
          ×
        </button>
      </template>
    </div>
    <div v-if="showAdd" class="add-form">
      <input
        v-model="newName"
        type="text"
        class="add-input"
        placeholder="分类名称"
        maxlength="20"
        @keydown.enter="addCategory"
      />
      <div class="add-colors">
        <button
          v-for="c in presetColors"
          :key="c"
          type="button"
          class="color-dot"
          :class="{ selected: newColor === c }"
          :style="{ background: c }"
          @click="newColor = c"
        />
      </div>
      <div class="add-actions">
        <button type="button" class="btn-sm btn-ghost" @click="showAdd = false">取消</button>
        <button type="button" class="btn-sm btn-primary" @click="addCategory">添加</button>
      </div>
    </div>
    <button v-else type="button" class="nav-item add-trigger" @click="openAdd">+ 新建分类</button>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useNotebookStore } from '@/stores/notebookStore'
import { ElMessageBox } from 'element-plus'
import Message from '@/utils/Message'

const notebookStore = useNotebookStore()
const showAdd = ref(false)
const newName = ref('')
const newColor = ref('#6b7fd7')
const editingCategoryId = ref(null)
const editingName = ref('')

const categoryList = computed(() => notebookStore.categories)
const selectedId = computed(() => notebookStore.selectedCategoryId)

const presetColors = ['#6b7fd7', '#5a9b7a', '#c97b5e', '#9b7fc9', '#7fb8c9', '#c9a73d']

function selectCategory(id) {
  notebookStore.setSelectedCategory(id)
}

function openAdd() {
  showAdd.value = true
  newName.value = ''
  newColor.value = presetColors[0]
}

async function addCategory() {
  const name = newName.value.trim()
  if (!name) {
    Message.warning('请输入分类名称')
    return
  }
  await notebookStore.addCategory(name, newColor.value)
  newName.value = ''
  showAdd.value = false
  Message.success('已添加分类')
}

function startEditCategory(e, cat) {
  e.stopPropagation()
  if (cat.id === '_default') return
  editingCategoryId.value = cat.id
  editingName.value = cat.name || ''
}

function cancelEditCategory() {
  editingCategoryId.value = null
  editingName.value = ''
}

async function saveEditCategory() {
  const id = editingCategoryId.value
  if (!id) return
  const name = editingName.value.trim()
  if (!name) {
    Message.warning('名称不能为空')
    return
  }
  await notebookStore.updateCategory(id, { name })
  editingCategoryId.value = null
  editingName.value = ''
  Message.success('已修改')
}

async function removeCategory(e, id) {
  e.stopPropagation()
  if (id === '_default') return
  try {
    await ElMessageBox.confirm(
      '此操作不可恢复。删除后，该分类将永久移除，其中的笔记本会自动移至「默认」。确定要删除该分类吗？',
      '删除分类',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    await notebookStore.removeCategory(id)
    Message.success('已删除')
  } catch (_) {}
}
</script>

<style scoped>
.category-nav {
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nav-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 10px 20px 6px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: calc(100% - 20px);
  padding: 10px 20px;
  margin: 0 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  box-sizing: border-box;
}
.nav-item button {
  cursor: pointer;
}
.nav-edit-input {
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  border: 1px solid var(--accent);
  border-radius: 6px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}
.nav-edit-btn {
  opacity: 0;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1;
  flex-shrink: 0;
  transition:
    opacity 0.15s,
    background 0.15s;
}
.nav-item:hover .nav-edit-btn {
  opacity: 1;
}
.nav-edit-btn:hover {
  background: var(--bg-muted);
  color: var(--text-primary);
}
.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.nav-item.active {
  background: var(--accent-subtle);
  color: var(--accent);
  font-weight: 500;
}
.nav-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.nav-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nav-remove {
  opacity: 0;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    opacity 0.15s,
    background 0.15s;
}
.nav-item:hover .nav-remove {
  opacity: 1;
}
.nav-remove:hover {
  background: var(--bg-muted);
  color: var(--text-primary);
}
.add-trigger {
  color: var(--accent);
  margin-top: 4px;
}
.add-trigger:hover {
  background: var(--accent-subtle);
  color: var(--accent);
}
.add-form {
  margin: 10px 20px 0;
  padding: 14px;
  background: var(--bg-muted);
  border-radius: 12px;
}
.add-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 14px;
  margin-bottom: 10px;
  outline: none;
}
.add-input:focus {
  border-color: var(--accent);
}
.add-colors {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}
.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s;
}
.color-dot:hover {
  transform: scale(1.1);
}
.color-dot.selected {
  border-color: var(--text-primary);
  box-shadow: 0 0 0 1px var(--bg-card);
}
.add-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.btn-sm {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  border: none;
  cursor: pointer;
}
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}
.btn-ghost:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.btn-primary {
  background: var(--accent);
  color: var(--accent-fg);
}
.btn-primary:hover {
  background: var(--accent-hover);
}
</style>
