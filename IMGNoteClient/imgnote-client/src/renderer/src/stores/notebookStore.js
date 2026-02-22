import { defineStore } from 'pinia'
import { ipcNotebook } from '@/api/notebook'

export const useNotebookStore = defineStore('notebook', {
  state: () => ({
    list: [],
    categories: [],
    selectedCategoryId: null,
    loading: false
  }),
  getters: {
    filteredList(state) {
      if (!state.selectedCategoryId) return state.list
      return state.list.filter((n) => n.categoryId === state.selectedCategoryId)
    },
    categoryById(state) {
      return (id) => state.categories.find((c) => c.id === id)
    },
    getCategoryForNotebook(state) {
      return (note) => (note ? state.categories.find((c) => c.id === note.categoryId) : null)
    }
  },
  actions: {
    async ensureAndFetch() {
      this.loading = true
      try {
        await ipcNotebook.ensureDataBase?.()
        const [categories, list] = await Promise.all([
          ipcNotebook.listCategories?.() || [],
          ipcNotebook.listNotes?.() || []
        ])
        this.categories = categories
        this.list = list
      } finally {
        this.loading = false
      }
    },
    setSelectedCategory(id) {
      this.selectedCategoryId = id
    },
    async addCategory(name, color = '#6b7fd7') {
      const cat = await ipcNotebook.createCategory?.(name, color)
      if (cat) this.categories.push(cat)
      return cat?.id
    },
    async updateCategory(id, payload) {
      await ipcNotebook.updateCategory?.(id, payload)
      const cat = this.categories.find((c) => c.id === id)
      if (cat) {
        if (payload.name !== undefined) cat.name = payload.name
        if (payload.color !== undefined) cat.color = payload.color
      }
    },
    async removeCategory(id) {
      await ipcNotebook.deleteCategory?.(id)
      this.categories = this.categories.filter((c) => c.id !== id)
      this.list = this.list.map((n) => (n.categoryId === id ? { ...n, categoryId: '_default' } : n))
      if (this.selectedCategoryId === id) this.selectedCategoryId = null
    },
    async updateNote(noteId, categoryId, payload) {
      await ipcNotebook.updateNote?.(categoryId, noteId, payload)
      const note = this.list.find((n) => n.id === noteId && n.categoryId === categoryId)
      if (note) {
        if (payload.name !== undefined) note.name = payload.name
        if (payload.encrypted !== undefined) note.encrypted = !!payload.encrypted
      }
    },
    async moveNote(noteId, fromCategoryId, toCategoryId) {
      const newImagePath = await ipcNotebook.moveNote?.(noteId, fromCategoryId, toCategoryId)
      const note = this.list.find((n) => n.id === noteId)
      if (note) {
        note.categoryId = toCategoryId
        if (newImagePath) note.imagePath = newImagePath
      }
    },
    async deleteNote(noteId, categoryId) {
      await ipcNotebook.deleteNote?.(noteId, categoryId)
      this.list = this.list.filter((n) => !(n.id === noteId && n.categoryId === categoryId))
    },
    /** items: [{ path, name? }]，name 为空则用图片文件名 */
    async importImages(categoryId, items) {
      const added = []
      for (const it of items) {
        const path = typeof it === 'string' ? it : it.path || ''
        const name = typeof it === 'string' ? '' : it.name || ''

        const note = await ipcNotebook.importImage?.(categoryId, path, name)
        if (note) {
          this.list.unshift(note)
          added.push(note)
        }
      }
      return added
    },
    async showImportDialog() {
      return (await ipcNotebook.showImportDialog?.()) || []
    },
    async showImportDataBaseFileDialog() {
      return (await ipcNotebook.showImportDataBaseFileDialog?.()) ?? null
    },
    async exportImage(imagePath) {
      return (await ipcNotebook.exportImage?.(imagePath)) ?? false
    },
    async exportDataBase() {
      return (await ipcNotebook.exportDataBase?.()) ?? null
    },
    async exportSelectedNotes(selectedNotes) {
      return (await ipcNotebook.exportSelectedNotes?.(selectedNotes)) ?? null
    },
    async importDataBaseFile(sourceFilePath, options) {
      return (await ipcNotebook.importDataBaseFile?.(sourceFilePath, options)) ?? { added: 0, skipped: 0 }
    },
    async migrateDataBase(targetPath) {
      return (await ipcNotebook.migrateDataBase?.(targetPath)) ?? null
    },
    async showMigrateFolderDialog() {
      return (await ipcNotebook.showMigrateFolderDialog?.()) ?? null
    }
  }
})
