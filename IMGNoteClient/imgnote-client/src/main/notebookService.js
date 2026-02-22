import { dialog, BrowserWindow, nativeImage } from 'electron'
import { createWriteStream } from 'fs'
import { readdir, readFile, writeFile, mkdir, stat, rename, copyFile, rm, cp } from 'fs/promises'
import { join, extname, basename, dirname } from 'path'
import { tmpdir } from 'os'
import { mkdtemp } from 'fs/promises'
import { createHash } from 'crypto'
import archiver from 'archiver'
import extract from 'extract-zip'
import { getDataBasePath, setDataBasePath, DEFAULT_CATEGORY_ID } from './store.js'

const IMGNOTE_EXT = '.IMGNote'

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'])
const META_FILE = 'meta.json'
const CATEGORY_FILE = 'category.json'

function isImageFile(name) {
  return IMAGE_EXT.has(extname(name).toLowerCase())
}

function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** 计算整个笔记本文件夹的 MD5，用于导入去重（含 meta.json、图片等所有文件） */
async function getFolderMd5(folderPath) {
  const hash = createHash('md5')
  const entries = await readdir(folderPath, { withFileTypes: true })
  const files = entries.filter((e) => e.isFile()).map((e) => e.name).sort()
  for (const name of files) {
    const filePath = join(folderPath, name)
    const content = await readFile(filePath)
    hash.update(content)
  }
  return hash.digest('hex')
}

export function getDataBasePathExport() {
  return getDataBasePath()
}

export async function ensureDataBase() {
  const base = getDataBasePath()
  await mkdir(base, { recursive: true })
  const defaultPath = join(base, DEFAULT_CATEGORY_ID)
  try {
    await stat(defaultPath)
  } catch {
    await mkdir(defaultPath, { recursive: true })
    await writeFile(
      join(defaultPath, CATEGORY_FILE),
      JSON.stringify({ name: '默认', color: '#6b7fd7' }, null, 2),
      'utf-8'
    )
  }
}

export async function listCategories() {
  await ensureDataBase()
  const base = getDataBasePath()
  const entries = await readdir(base, { withFileTypes: true })
  const list = []
  for (const ent of entries) {
    if (!ent.isDirectory()) continue
    const catPath = join(base, ent.name)
    const metaPath = join(catPath, CATEGORY_FILE)
    try {
      const raw = await readFile(metaPath, 'utf-8')
      const meta = JSON.parse(raw)
      list.push({
        id: ent.name,
        name: meta.name ?? ent.name,
        color: meta.color ?? '#6b7fd7'
      })
    } catch (_) {
      list.push({
        id: ent.name,
        name: ent.name === DEFAULT_CATEGORY_ID ? '默认' : ent.name,
        color: '#6b7fd7'
      })
    }
  }
  return list.sort((a, b) =>
    a.id === DEFAULT_CATEGORY_ID ? -1 : b.id === DEFAULT_CATEGORY_ID ? 1 : 0
  )
}

async function getNoteMeta(noteDirPath) {
  const metaPath = join(noteDirPath, META_FILE)
  try {
    const raw = await readFile(metaPath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function findImageInNoteDir(noteDirPath) {
  const entries = await readdir(noteDirPath, { withFileTypes: true })
  for (const ent of entries) {
    if (ent.isFile() && isImageFile(ent.name)) {
      return join(noteDirPath, ent.name)
    }
  }
  return null
}

export async function listNotes() {
  await ensureDataBase()
  const base = getDataBasePath()
  const catEntries = await readdir(base, { withFileTypes: true })
  const list = []
  for (const cat of catEntries) {
    if (!cat.isDirectory()) continue
    const catPath = join(base, cat.name)
    const subEntries = await readdir(catPath, { withFileTypes: true }).catch(() => [])
    for (const ent of subEntries) {
      if (!ent.isDirectory() || ent.name === CATEGORY_FILE) continue
      const noteDir = join(catPath, ent.name)
      const metaPath = join(noteDir, META_FILE)
      try {
        await stat(metaPath)
      } catch {
        continue
      }
      const meta = await getNoteMeta(noteDir)
      const imagePath = await findImageInNoteDir(noteDir)
      if (!imagePath) continue
      list.push({
        id: ent.name,
        categoryId: cat.name,
        name: meta.name ?? basename(imagePath, extname(imagePath)),
        imagePath,
        imageFile: meta.imageFile ?? basename(imagePath),
        encrypted: !!meta.encrypted,
        mtime: (await stat(imagePath).catch(() => ({}))).mtimeMs ?? 0
      })
    }
  }
  return list.sort((a, b) => b.mtime - a.mtime)
}

export async function createCategory(name, color = '#6b7fd7') {
  await ensureDataBase()
  const id = 'cat_' + generateId()
  const catPath = join(getDataBasePath(), id)
  await mkdir(catPath, { recursive: true })
  await writeFile(join(catPath, CATEGORY_FILE), JSON.stringify({ name, color }, null, 2), 'utf-8')
  return { id, name, color }
}

export async function updateCategory(categoryId, { name, color }) {
  const metaPath = join(getDataBasePath(), categoryId, CATEGORY_FILE)
  let meta = {}
  try {
    const raw = await readFile(metaPath, 'utf-8')
    meta = JSON.parse(raw)
  } catch (_) {}
  if (name !== undefined) meta.name = name
  if (color !== undefined) meta.color = color
  await writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
}

export async function deleteCategory(categoryId) {
  if (categoryId === DEFAULT_CATEGORY_ID) return
  const base = getDataBasePath()
  const catPath = join(base, categoryId)
  const defaultPath = join(base, DEFAULT_CATEGORY_ID)
  const entries = await readdir(catPath, { withFileTypes: true })
  for (const ent of entries) {
    if (ent.isDirectory() && ent.name !== CATEGORY_FILE) {
      const src = join(catPath, ent.name)
      const dest = join(defaultPath, ent.name)
      await rename(src, dest)
    }
  }
  await rm(catPath, { recursive: true })
}

export async function updateNote(categoryId, noteId, { name, encrypted }) {
  const notePath = join(getDataBasePath(), categoryId, noteId)
  const metaPath = join(notePath, META_FILE)
  const meta = await getNoteMeta(notePath)
  let changed = false
  if (name !== undefined && meta.name !== name) {
    meta.name = name
    changed = true
  }
  if (encrypted !== undefined) {
    const next = !!encrypted
    if (meta.encrypted !== next) {
      meta.encrypted = next
      changed = true
    }
  }
  if (changed) {
    await writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
  }
}

export async function moveNote(noteId, fromCategoryId, toCategoryId) {
  const base = getDataBasePath()
  const src = join(base, fromCategoryId, noteId)
  const dest = join(base, toCategoryId, noteId)
  await rename(src, dest)
  const newImagePath = await findImageInNoteDir(dest)
  return newImagePath || null
}

export async function deleteNote(noteId, categoryId) {
  const base = getDataBasePath()
  const notePath = join(base, categoryId, noteId)
  await rm(notePath, { recursive: true })
}

export async function importImage(categoryId, sourceImagePath, customName = '') {
  // 参数验证
  if (!categoryId || !sourceImagePath) {
    throw new Error('categoryId 和 sourceImagePath 不能为空')
  }

  await ensureDataBase()
  const base = getDataBasePath()
  const catPath = join(base, categoryId)
  const ext = extname(sourceImagePath)

  // 检查源文件是否存在
  try {
    await stat(sourceImagePath)
  } catch (err) {
    throw new Error(`源文件不存在: ${sourceImagePath}`)
  }

  const noteId = generateId('n_')
  const notePath = join(catPath, noteId)
  await mkdir(notePath, { recursive: true })
  const imageFileName = 'image.png'
  const destImagePath = join(notePath, imageFileName)

  await copyFile(sourceImagePath, destImagePath)

  const name = customName && customName.trim() ? customName.trim() : basename(sourceImagePath, ext)
  const meta = { name, imageFile: imageFileName, encrypted: false }
  await writeFile(join(notePath, META_FILE), JSON.stringify(meta, null, 2), 'utf-8')
  const mtime = (await stat(destImagePath)).mtimeMs
  return {
    id: noteId,
    categoryId,
    name,
    imagePath: destImagePath,
    imageFile: imageFileName,
    mtime
  }
}

export async function showImportImageDialog() {
  const win = BrowserWindow.getFocusedWindow()
  const { canceled, filePaths } = await dialog.showOpenDialog(win || null, {
    title: '选择要导入的图片',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'] }]
  })
  if (canceled || !filePaths?.length) return []
  return filePaths
}

/** 选择要导入的 .IMGNote 数据文件 */
export async function showImportDataBaseFileDialog() {
  const win = BrowserWindow.getFocusedWindow()
  const { canceled, filePaths } = await dialog.showOpenDialog(win || null, {
    title: '选择要导入的 IMGNote 数据文件',
    properties: ['openFile'],
    filters: [{ name: 'IMGNote 数据', extensions: ['IMGNote'] }]
  })
  if (canceled || !filePaths?.length) return null
  return filePaths[0]
}

/** 导出单张图片到用户选择的位置 */
export async function exportImage(imagePath) {
  const win = BrowserWindow.getFocusedWindow()

  // 根据 imagePath 找到对应的笔记本名称
  let notebookName = basename(imagePath, extname(imagePath))
  try {
    const noteDirPath = dirname(imagePath)
    const meta = await getNoteMeta(noteDirPath)
    if (meta.name) {
      notebookName = meta.name
    }
  } catch (_) {
    // 如果获取失败，使用默认名称
  }

  const defaultName = notebookName + '.png'
  const { canceled, filePath } = await dialog.showSaveDialog(win || null, {
    title: '导出图片',
    defaultPath: defaultName,
    filters: [{ name: 'PNG图片', extensions: ['png'] }]
  })
  if (canceled || !filePath) return false

  // 确保文件路径以 .png 结尾
  const finalPath = extname(filePath).toLowerCase() === '.png' ? filePath : filePath + '.png'

  // 使用 nativeImage 读取图片并转换为 PNG 格式保存
  try {
    const img = nativeImage.createFromPath(imagePath)
    if (img.isEmpty()) {
      throw new Error('无法读取图片文件')
    }
    const pngBuffer = img.toPNG()
    await writeFile(finalPath, pngBuffer)
  } catch (err) {
    // 如果转换失败，尝试直接复制
    await copyFile(imagePath, finalPath)
  }

  return finalPath
}

/** 导出整个数据库到用户选择的单个 .IMGNote 文件（用于数据备份） */
export async function exportDataBase() {
  const win = BrowserWindow.getFocusedWindow()
  const defaultName = `IMGNote备份${IMGNOTE_EXT}`
  const { canceled, filePath } = await dialog.showSaveDialog(win || null, {
    title: '数据备份',
    defaultPath: defaultName,
    filters: [{ name: 'IMGNote 数据', extensions: ['IMGNote'] }]
  })
  if (canceled || !filePath) return null
  const destFile = extname(filePath) === IMGNOTE_EXT ? filePath : filePath + IMGNOTE_EXT
  const base = getDataBasePath()
  await new Promise((resolve, reject) => {
    const output = createWriteStream(destFile)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', () => resolve())
    output.on('error', (err) => reject(err))
    archive.on('error', (err) => reject(err))
    archive.pipe(output)
    archive.directory(base, 'dataBase')
    archive.finalize()
  })
  return destFile
}

/**
 * 导出选中的笔记本到单个 .IMGNote 文件
 * @param {Array<{ id: string, categoryId: string }>} selectedNotes
 * @returns {Promise<string|null>} 保存路径或 null
 */
export async function exportSelectedNotes(selectedNotes) {
  if (!Array.isArray(selectedNotes) || selectedNotes.length === 0) return null
  const win = BrowserWindow.getFocusedWindow()
  const defaultName = `IMGNote导出${IMGNOTE_EXT}`
  const { canceled, filePath } = await dialog.showSaveDialog(win || null, {
    title: '导出选中的笔记本',
    defaultPath: defaultName,
    filters: [{ name: 'IMGNote 数据', extensions: ['IMGNote'] }]
  })
  if (canceled || !filePath) return null
  const destFile = extname(filePath) === IMGNOTE_EXT ? filePath : filePath + IMGNOTE_EXT
  const base = getDataBasePath()
  const uniqueCategories = [...new Set(selectedNotes.map((n) => n.categoryId))]
  let tempDir = null
  try {
    tempDir = await mkdtemp(join(tmpdir(), 'imgnote-export-'))
    for (const categoryId of uniqueCategories) {
      const catPath = join(base, categoryId)
      const destCatPath = join(tempDir, categoryId)
      await mkdir(destCatPath, { recursive: true })
      const categoryFile = join(catPath, CATEGORY_FILE)
      try {
        await copyFile(categoryFile, join(destCatPath, CATEGORY_FILE))
      } catch (_) {}
    }
    for (const { id, categoryId } of selectedNotes) {
      const srcNote = join(base, categoryId, id)
      const destNote = join(tempDir, categoryId, id)
      try {
        await stat(join(srcNote, META_FILE))
        await cp(srcNote, destNote, { recursive: true })
      } catch (_) {}
    }
    await new Promise((resolve, reject) => {
      const output = createWriteStream(destFile)
      const archive = archiver('zip', { zlib: { level: 9 } })
      output.on('close', () => resolve())
      output.on('error', (err) => reject(err))
      archive.on('error', (err) => reject(err))
      archive.pipe(output)
      archive.directory(tempDir, 'dataBase')
      archive.finalize()
    })
    return destFile
  } finally {
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true })
      } catch (_) {}
    }
  }
}

/** 将 .IMGNote 文件内容追加到当前数据库（解压后按分类合并，可选按图片 MD5 去重）
 * @param {string} sourceFilePath
 * @param {{ skipDuplicates?: boolean }} [options] 默认 skipDuplicates 为 true（导入时跳过重复）
 * @returns {{ added: number, skipped: number }}
 */
export async function importDataBaseFile(sourceFilePath, options = {}) {
  const skipDuplicates = options.skipDuplicates !== false
  await ensureDataBase()
  let tempDir = null
  try {
    tempDir = await mkdtemp(join(tmpdir(), 'imgnote-import-'))
    await extract(sourceFilePath, { dir: tempDir })
    const dataBasePath = join(tempDir, 'dataBase')
    try {
      await stat(dataBasePath)
    } catch {
      throw new Error('无效的 IMGNote 文件：缺少 dataBase 目录')
    }
    return await mergeDataBaseFromFolder(dataBasePath, { skipDuplicates })
  } finally {
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true })
      } catch (_) {}
    }
  }
}

/** 将外部数据库文件夹内容追加到当前数据库（按分类合并，可选按图片 MD5 去重）
 * @param {string} sourceFolderPath
 * @param {{ skipDuplicates?: boolean }} [options]
 * @returns {{ added: number, skipped: number }}
 */
async function mergeDataBaseFromFolder(sourceFolderPath, options = {}) {
  const skipDuplicates = options.skipDuplicates !== false
  const base = getDataBasePath()
  const existingMd5Set = skipDuplicates ? new Set() : null
  if (skipDuplicates) {
    const existingNotes = await listNotes()
    for (const n of existingNotes) {
      const noteDir = dirname(n.imagePath)
      try {
        const md5 = await getFolderMd5(noteDir)
        existingMd5Set.add(md5)
      } catch (_) {}
    }
  }
  let added = 0
  let skipped = 0
  const entries = await readdir(sourceFolderPath, { withFileTypes: true }).catch(() => [])
  for (const ent of entries) {
    if (!ent.isDirectory()) continue
    const srcCat = join(sourceFolderPath, ent.name)
    const destCat = join(base, ent.name)
    const srcMeta = join(srcCat, CATEGORY_FILE)
    try {
      await stat(srcMeta)
    } catch {
      continue
    }
    await mkdir(destCat, { recursive: true })
    const destMeta = join(destCat, CATEGORY_FILE)
    try {
      await stat(destMeta)
    } catch {
      await copyFile(srcMeta, destMeta)
    }
    const noteDirs = await readdir(srcCat, { withFileTypes: true }).catch(() => [])
    for (const note of noteDirs) {
      if (!note.isDirectory() || note.name === CATEGORY_FILE) continue
      const srcNote = join(srcCat, note.name)
      try {
        await stat(join(srcNote, META_FILE))
      } catch {
        continue
      }
      const imagePath = await findImageInNoteDir(srcNote)
      if (!imagePath) continue
      if (skipDuplicates && existingMd5Set) {
        let md5
        try {
          md5 = await getFolderMd5(srcNote)
        } catch (_) {
          md5 = null
        }
        if (md5 && existingMd5Set.has(md5)) {
          skipped += 1
          continue
        }
        const newNoteId = generateId('n_')
        const destNote = join(destCat, newNoteId)
        await cp(srcNote, destNote, { recursive: true })
        if (md5) existingMd5Set.add(md5)
        added += 1
      } else {
        const newNoteId = generateId('n_')
        const destNote = join(destCat, newNoteId)
        await cp(srcNote, destNote, { recursive: true })
        added += 1
      }
    }
  }
  return { added, skipped }
}

/** 迁移数据库到新文件夹：复制当前数据库到目标路径并切换存储位置 */
export async function migrateDataBase(targetFolderPath) {
  const base = getDataBasePath()
  const dest = join(targetFolderPath, 'dataBase')
  await mkdir(dest, { recursive: true })
  await cp(base, dest, { recursive: true })
  setDataBasePath(dest)
  return dest
}

export async function showMigrateFolderDialog() {
  const win = BrowserWindow.getFocusedWindow()
  const { canceled, filePaths } = await dialog.showOpenDialog(win || null, {
    title: '选择迁移目标文件夹（将在其下创建 dataBase）',
    properties: ['openDirectory', 'createDirectory']
  })
  if (canceled || !filePaths?.length) return null
  return filePaths[0]
}
