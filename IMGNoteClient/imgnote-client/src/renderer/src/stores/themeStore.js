import { defineStore } from 'pinia'

const STORAGE_KEY = 'imgnote-theme'
const THEMES = ['light', 'dark']

function applyTheme(theme) {
  const root = document.documentElement
  if (THEMES.includes(theme)) {
    root.setAttribute('data-theme', theme)
  } else {
    root.removeAttribute('data-theme')
  }
}

function readStored() {
  try {
    const t = localStorage.getItem(STORAGE_KEY)
    return THEMES.includes(t) ? t : 'light'
  } catch {
    return 'light'
  }
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: readStored()
  }),
  actions: {
    setTheme(theme) {
      if (!THEMES.includes(theme)) return
      this.theme = theme
      try {
        localStorage.setItem(STORAGE_KEY, theme)
      } catch (_) {}
      applyTheme(theme)
    },
    toggleTheme() {
      const next = this.theme === 'light' ? 'dark' : 'light'
      this.setTheme(next)
      return next
    }
  }
})
