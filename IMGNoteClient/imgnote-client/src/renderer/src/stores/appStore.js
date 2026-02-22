import { defineStore } from 'pinia'

const KEY_IMPORT_SKIP_DUPLICATES = 'imgnote-import-skip-duplicates'

function readImportSkipDuplicates() {
  try {
    const v = localStorage.getItem(KEY_IMPORT_SKIP_DUPLICATES)
    if (v === 'false' || v === '0') return false
    if (v === 'true' || v === '1') return true
  } catch (_) {}
  return true
}

export const useAppStore = defineStore('app', {
  state: () => ({
    ready: true,
    importSkipDuplicates: readImportSkipDuplicates()
  }),
  actions: {
    setImportSkipDuplicates(value) {
      this.importSkipDuplicates = !!value
      try {
        localStorage.setItem(KEY_IMPORT_SKIP_DUPLICATES, String(this.importSkipDuplicates))
      } catch (_) {}
    }
  }
})
