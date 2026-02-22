import { contextBridge, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const { ipcRenderer } = electronAPI

function getPathForFile(file) {
  if (!file) return ''
  try {
    return (
      (webUtils && typeof webUtils.getPathForFile === 'function'
        ? webUtils.getPathForFile(file)
        : file.path) || ''
    )
  } catch (_) {
    return file.path || ''
  }
}

const notebookAPI = {
  ensureDataBase: () => ipcRenderer.invoke('notebook:ensureDataBase'),
  listCategories: () => ipcRenderer.invoke('notebook:listCategories'),
  listNotes: () => ipcRenderer.invoke('notebook:listNotes'),
  createCategory: (name, color) => ipcRenderer.invoke('notebook:createCategory', name, color),
  updateCategory: (categoryId, payload) =>
    ipcRenderer.invoke('notebook:updateCategory', categoryId, payload),
  deleteCategory: (categoryId) => ipcRenderer.invoke('notebook:deleteCategory', categoryId),
  updateNote: (categoryId, noteId, payload) =>
    ipcRenderer.invoke('notebook:updateNote', categoryId, noteId, payload),
  moveNote: (noteId, fromCategoryId, toCategoryId) =>
    ipcRenderer.invoke('notebook:moveNote', noteId, fromCategoryId, toCategoryId),
  deleteNote: (noteId, categoryId) => ipcRenderer.invoke('notebook:deleteNote', noteId, categoryId),
  importImage: (categoryId, sourcePath, name) =>
    ipcRenderer.invoke('notebook:importImage', categoryId, sourcePath, name),
  showImportDialog: () => ipcRenderer.invoke('notebook:showImportDialog'),
  showImportDataBaseFileDialog: () =>
    ipcRenderer.invoke('notebook:showImportDataBaseFileDialog'),
  exportImage: (imagePath) => ipcRenderer.invoke('notebook:exportImage', imagePath),
  exportDataBase: () => ipcRenderer.invoke('notebook:exportDataBase'),
  exportSelectedNotes: (selectedNotes) =>
    ipcRenderer.invoke('notebook:exportSelectedNotes', selectedNotes),
  importDataBaseFile: (sourceFilePath, options) =>
    ipcRenderer.invoke('notebook:importDataBaseFile', sourceFilePath, options),
  migrateDataBase: (targetPath) => ipcRenderer.invoke('notebook:migrateDataBase', targetPath),
  showMigrateFolderDialog: () => ipcRenderer.invoke('notebook:showMigrateFolderDialog'),
  getDataBasePath: () => ipcRenderer.invoke('notebook:getDataBasePath'),
  getLastDroppedPaths: () => ipcRenderer.invoke('notebook:getLastDroppedPaths'),
  getPathForFile: (file) => getPathForFile(file),
  getFileStats: (filePath) => ipcRenderer.invoke('notebook:getFileStats', filePath)
}

const updaterAPI = {
  check: () => ipcRenderer.invoke('updater:check'),
  start: (payload) => ipcRenderer.invoke('updater:start', payload),
  onProgress: (cb) => {
    const handler = (_event, payload) => cb && cb(payload)
    ipcRenderer.on('updater:progress', handler)
    return () => ipcRenderer.removeListener('updater:progress', handler)
  }
}

// Listen for dropped files
ipcRenderer.on('files-dropped', (event, filePaths) => {
  if (window.handleFilesDropped) {
    window.handleFilesDropped(filePaths)
  }
})

const appAPI = {
  splashFinished: () => ipcRenderer.invoke('app:splashFinished'),
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  setEditorDirty: (dirty) => ipcRenderer.send('app:setEditorDirty', !!dirty),
  onQuitRequest: (cb) => {
    const handler = () => cb && cb()
    ipcRenderer.on('app:quit-request', handler)
    return () => ipcRenderer.removeListener('app:quit-request', handler)
  },
  forceQuit: () => ipcRenderer.send('app:forceQuit'),
  onUpdateExitBlocked: (cb) => {
    const handler = () => cb && cb()
    ipcRenderer.on('app:update-exit-blocked', handler)
    return () => ipcRenderer.removeListener('app:update-exit-blocked', handler)
  }
}

const api = {
  notebook: notebookAPI,
  updater: updaterAPI,
  app: appAPI
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
