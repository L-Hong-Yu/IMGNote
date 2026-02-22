import { request } from '@/utils/Request'
import { Api } from '@/utils/Api'
import { requestJson } from '../utils/Request'

/** 读取笔记本内容。大文本时可传 timeout（毫秒）延长请求超时，默认 60 秒 */
export async function readNote(imagePath, password = '', options = {}) {
  return await request({
    url: Api.notebook.read,
    params: { imagePath, password },
    showLoading: false,
    timeout: options.timeout ?? 60 * 1000
  })
}

export async function writeNote(imagePath, content, encryptionType = 0, password = '') {
  const res = await requestJson({
    url: Api.notebook.write,
    params: { imagePath, content, encryptionType, password },
    showLoading: false
  })
  return res?.code === 200
}

export const ipcNotebook =
  typeof window !== 'undefined' && window.api?.notebook
    ? window.api.notebook
    : {
        ensureDataBase: () => Promise.resolve(),
        listCategories: () => Promise.resolve([]),
        listNotes: () => Promise.resolve([]),
        createCategory: () => Promise.resolve(null),
        updateCategory: () => Promise.resolve(),
        deleteCategory: () => Promise.resolve(),
        updateNote: () => Promise.resolve(),
        moveNote: () => Promise.resolve(),
        deleteNote: () => Promise.resolve(),
        importImage: () => Promise.resolve(null),
        showImportDialog: () => Promise.resolve([]),
        showImportDataBaseFileDialog: () => Promise.resolve(null),
        exportImage: () => Promise.resolve(false),
        exportDataBase: () => Promise.resolve(null),
        exportSelectedNotes: () => Promise.resolve(null),
        importDataBaseFile: (_path, _opts) => Promise.resolve({ added: 0, skipped: 0 }),
        migrateDataBase: () => Promise.resolve(null),
        showMigrateFolderDialog: () => Promise.resolve(null),
        getDataBasePath: () => Promise.resolve(''),
        getLastDroppedPaths: () => Promise.resolve([]),
        getPathForFile: () => ''
      }
