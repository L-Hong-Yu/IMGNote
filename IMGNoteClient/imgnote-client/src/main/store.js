import { app } from 'electron'
import { join } from 'path'
import Store from 'electron-store'

const DEFAULT_CATEGORY_ID = '_default'
const store = new Store({ name: 'imgnote-config' })
const KEY_DATABASE_PATH = 'dataBasePath'

function getDefaultDataBasePath() {
  return join(app.getPath('userData'), 'dataBase')
}

function getDataBasePath() {
  return store.get(KEY_DATABASE_PATH) || getDefaultDataBasePath()
}

function setDataBasePath(path) {
  if (path) {
    store.set(KEY_DATABASE_PATH, path)
  } else {
    store.delete(KEY_DATABASE_PATH)
  }
  return getDataBasePath()
}

export { getDataBasePath, setDataBasePath, getDefaultDataBasePath, DEFAULT_CATEGORY_ID }
