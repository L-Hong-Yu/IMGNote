import { app, BrowserWindow, ipcMain, protocol, shell, Tray, Menu, dialog } from 'electron'
import path from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/appLogo.ico?asset'
import { getDataBasePath } from './store.js'
import {
  createCategory,
  deleteCategory,
  deleteNote,
  ensureDataBase,
  exportDataBase,
  exportImage,
  exportSelectedNotes,
  getDataBasePathExport,
  importDataBaseFile,
  importImage,
  listCategories,
  listNotes,
  migrateDataBase,
  moveNote,
  showImportDataBaseFileDialog,
  showImportImageDialog,
  showMigrateFolderDialog,
  updateCategory,
  updateNote
} from './notebookService.js'
import * as fs from 'node:fs'
import { checkForUpdate, runUpdateFlow } from './updaterService.js'

const { spawn, exec } = require('child_process')

const IMGNOTE_FILE_SCHEME = 'imgnote-file'
const imageExt = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'])
let lastDroppedImagePaths = []
let mainWindow = null
let tray = null
let isUpdating = false
let hasDirtyEditor = false

const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
  process.exit(0)
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.setSkipTaskbar(false)
    mainWindow.focus()
  })
}

function registerImageProtocol() {
  const base = getDataBasePath()
  protocol.registerFileProtocol(IMGNOTE_FILE_SCHEME, (request, callback) => {
    try {
      let raw = request.url.replace(`${IMGNOTE_FILE_SCHEME}://`, '')
      try {
        raw = decodeURIComponent(raw)
      } catch (_) {}
      const withSlashes = raw.replace(/^\/+/, '').replace(/\//g, path.sep)
      const requestedPath = path.normalize(withSlashes)
      if (!requestedPath.startsWith(base)) {
        return callback({ error: -2 })
      }
      callback({ path: requestedPath })
    } catch (err) {
      callback({ error: -2 })
    }
  })
}

// 声明后端进程变量
let backendProcess = null

// 获取路径
function getAssetPath(fileName) {
  if (app.isPackaged) {
    // 打包后环境 resources/assets
    return path.join(process.resourcesPath, 'assets', fileName)
  } else {
    // 开发环境 assets
    return path.resolve(app.getAppPath(), 'assets', fileName)
  }
}

// 启动后端 jar 包
function startBackendServer() {
  const jreJavaPath = getAssetPath('env/bin/java.exe')
  const jarPath = getAssetPath('IMGNoteServer-1.0.0.jar')

  if (!fs.existsSync(jreJavaPath) || !fs.existsSync(jarPath)) {
    console.error('JRE或Jar包缺失')
    return
  }

  const options = {
    cwd: path.dirname(jarPath),
    windowsHide: true,
    // 后端日志
    // stdio: 'inherit'
  }

  backendProcess = spawn(jreJavaPath, ['-jar', jarPath], options)

  backendProcess.on('error', (err) => {
    console.error('后端启动失败：', err.message)
  })

  backendProcess.on('exit', (code, signal) => {
    console.log('后端进程退出，码：', code, '信号：', signal)
    backendProcess = null
  })

  console.log('后端启动成功，PID：', backendProcess.pid)
}

// 关闭后端进程
function stopBackendServer() {
  if (!backendProcess || backendProcess.killed) {
    console.log('后端进程未启动或已关闭')
    return
  }

  try {
    const pid = backendProcess.pid
    console.log('开始关闭后端进程，PID：', pid)

    if (process.platform === 'win32') {
      exec(`taskkill /F /T /PID ${pid}`, (error, stdout, stderr) => {
        if (error) {
          console.error('按PID杀后端进程失败：', error.message)
        } else {
          console.log('后端进程组已彻底关闭：', stdout)
        }
      })
    } else {
      // Linux/macOS 杀进程组
      process.kill(-pid, 'SIGKILL')
    }
    backendProcess.killed = true
    backendProcess = null
  } catch (err) {
    console.error('关闭后端进程异常：', err.message)
    // 强制置空
    backendProcess = null
  }
}

const onWinTitleOp = () => {
  ipcMain.on('winTitleOp', (e, { action, data }) => {
    const webContents = e.sender
    const win = BrowserWindow.fromWebContents(webContents)
    switch (action) {
      case 'minimize':
        win.minimize()
        break
      case 'maximize':
        win.maximize()
        break
      case 'restore':
        win.unmaximize()
        break
      case 'alwaysOnTop': {
        const enabled =
          data && typeof data.enabled === 'boolean' ? data.enabled : !win.isAlwaysOnTop()
        win.setAlwaysOnTop(enabled, 'screen')
        break
      }
      case 'close':
        win.forceClose = !!data.forceClose
        win.close()
        break
      default:
        break
    }
  })
}

function createWindow() {
  // 使用无边框窗口，由渲染进程自定义 Header/TitleBar
  mainWindow = new BrowserWindow({
    width: 420,
    height: 280,
    minWidth: 320,
    minHeight: 200,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    resizable: true,
    icon,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.setAlwaysOnTop(true, 'screen')
    mainWindow.webContents.send('winIsMax', mainWindow.isMaximized())
  })

  mainWindow.on('maximize', () => {
    try {
      mainWindow.webContents.send('winIsMax', true)
    } catch (_) {}
  })

  mainWindow.on('unmaximize', () => {
    try {
      mainWindow.webContents.send('winIsMax', false)
    } catch (_) {}
  })

  mainWindow.on('close', (e) => {
    if (mainWindow.forceClose) return
    e.preventDefault()
    mainWindow.hide()
    mainWindow.setSkipTaskbar(true)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 主进程接收系统级拖放（Electron 会在此拿到真实路径），保存并发给渲染进程
  mainWindow.webContents.on('drop-files', (event, files) => {
    if (!files || !Array.isArray(files)) return
    const imagePaths = files.filter((f) => {
      if (!f || typeof f !== 'string') return false
      const ext = path.extname(f).toLowerCase()
      return imageExt.has(ext)
    })
    if (imagePaths.length > 0) {
      lastDroppedImagePaths = imagePaths
      mainWindow.webContents.send('files-dropped', imagePaths)
    }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // mainWindow.webContents.openDevTools()

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.IMGNote')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('app:splashFinished', (_event) => {
    const win = BrowserWindow.fromWebContents(_event.sender)
    if (win && !win.isDestroyed()) {
      win.setAlwaysOnTop(false)
      win.setResizable(true)
      win.setMinimumSize(800, 500)
      win.setSize(1030, 670)
      win.center()
    }
  })

  ipcMain.handle('app:getVersion', () => {
    try {
      return app.getVersion()
    } catch (_) {
      return ''
    }
  })

  ipcMain.on('app:setEditorDirty', (_event, dirty) => {
    hasDirtyEditor = !!dirty
  })

  ipcMain.on('app:forceQuit', () => {
    console.log('强制退出')
    if (!mainWindow) {
      app.quit()
      return
    }
    mainWindow.forceClose = true
    tray?.destroy()
    tray = null
    app.quit()
  })

  // 自动更新：检查新版本（启动页调用）
  ipcMain.handle('updater:check', async () => {
    try {
      return await checkForUpdate()
    } catch (e) {
      return { ok: false, updateAvailable: false, message: e?.message || '检查更新失败' }
    }
  })

  // 自动更新：下载/解压/安装（通过事件推送进度）
  ipcMain.handle('updater:start', async (event, payload) => {
    const wc = event.sender
    const send = (data) => {
      try {
        wc.send('updater:progress', data)
      } catch (_) {}
    }
    let workDir = null
    try {
      isUpdating = true
      workDir = await runUpdateFlow(payload, {
        onStage: ({ stage }) => send({ ok: true, stage, mode: 'stage' }),
        onProgress: ({ stage, received, total, percent }) =>
          send({ ok: true, stage, mode: 'progress', received, total, percent })
      })
      // 切到「重启中」后退出当前进程，安装脚本会自动拉起新版本
      send({ ok: true, stage: 'restarting', mode: 'stage' })
      setTimeout(() => app.quit(), 1500)
      return { ok: true, workDir }
    } catch (e) {
      send({ ok: false, stage: 'error', message: e?.message || '更新失败' })
      return { ok: false, message: e?.message || '更新失败' }
    } finally {
      isUpdating = false
    }
  })

  // 渲染进程拿不到 file.path 时，通过此接口向主进程要「刚刚拖入的图片路径」
  ipcMain.handle('notebook:getLastDroppedPaths', () => {
    const paths = lastDroppedImagePaths
    lastDroppedImagePaths = []
    return paths
  })

  // dataBase: categories & notes (fixed path, no user folder)
  ipcMain.handle('notebook:ensureDataBase', () => ensureDataBase())
  ipcMain.handle('notebook:listCategories', () => listCategories())
  ipcMain.handle('notebook:listNotes', () => listNotes())
  ipcMain.handle('notebook:createCategory', (_, name, color) => createCategory(name, color))
  ipcMain.handle('notebook:updateCategory', (_, categoryId, payload) =>
    updateCategory(categoryId, payload)
  )
  ipcMain.handle('notebook:deleteCategory', (_, categoryId) => deleteCategory(categoryId))
  ipcMain.handle('notebook:updateNote', (_, categoryId, noteId, payload) =>
    updateNote(categoryId, noteId, payload)
  )
  ipcMain.handle('notebook:moveNote', (_, noteId, fromCategoryId, toCategoryId) =>
    moveNote(noteId, fromCategoryId, toCategoryId)
  )
  ipcMain.handle('notebook:deleteNote', (_, noteId, categoryId) => deleteNote(noteId, categoryId))
  ipcMain.handle('notebook:importImage', (_, categoryId, sourcePath, name) =>
    importImage(categoryId, sourcePath, name)
  )
  ipcMain.handle('notebook:showImportDialog', () => showImportImageDialog())
  ipcMain.handle('notebook:showImportDataBaseFileDialog', () => showImportDataBaseFileDialog())
  ipcMain.handle('notebook:exportImage', (_, imagePath) => exportImage(imagePath))
  ipcMain.handle('notebook:exportDataBase', () => exportDataBase())
  ipcMain.handle('notebook:exportSelectedNotes', (_, selectedNotes) =>
    exportSelectedNotes(selectedNotes)
  )
  ipcMain.handle('notebook:importDataBaseFile', (_, sourceFilePath, options) =>
    importDataBaseFile(sourceFilePath, options)
  )
  ipcMain.handle('notebook:migrateDataBase', (_, targetPath) => migrateDataBase(targetPath))
  ipcMain.handle('notebook:showMigrateFolderDialog', () => showMigrateFolderDialog())
  ipcMain.handle('notebook:getDataBasePath', () => getDataBasePathExport())
  ipcMain.handle('notebook:getFileStats', (_, filePath) => {
    if (!filePath || typeof filePath !== 'string') return null
    try {
      const s = fs.statSync(filePath)
      return s.isFile() ? { size: s.size } : null
    } catch {
      return null
    }
  })

  registerImageProtocol()
  startBackendServer() // 启动后端
  createWindow()

  if (!tray) {
    tray = new Tray(icon)
    const buildMenu = () =>
      Menu.buildFromTemplate([
        {
          label: mainWindow?.isVisible() ? '隐藏窗口' : '显示窗口',
          click: () => {
            if (!mainWindow) return
            if (mainWindow.isVisible()) {
              mainWindow.hide()
              mainWindow.setSkipTaskbar(true)
            } else {
              mainWindow.show()
              mainWindow.setSkipTaskbar(false)
              mainWindow.focus()
            }
          }
        },
        { type: 'separator' },
        {
          label: '退出程序',
          click: async () => {
            if (!mainWindow) {
              app.quit()
              return
            }
            if (isUpdating) {
              // 确保窗口显示并获得焦点
              if (mainWindow.isMinimized()) mainWindow.restore()
              mainWindow.show()
              mainWindow.setSkipTaskbar(false)
              mainWindow.focus()
              mainWindow.webContents.send('app:update-exit-blocked')
              return
            }
            if (hasDirtyEditor) {
              // 确保窗口显示并获得焦点
              if (mainWindow.isMinimized()) mainWindow.restore()
              mainWindow.show()
              mainWindow.setSkipTaskbar(false)
              mainWindow.focus()
              mainWindow.webContents.send('app:quit-request')
              return
            }
            mainWindow.forceClose = true
            tray?.destroy()
            tray = null
            app.quit()
          }
        }
      ])
    tray.setToolTip('像素笔记')
    tray.setContextMenu(buildMenu())
    const showWindow = () => {
      if (!mainWindow) return
      mainWindow.show()
      mainWindow.setSkipTaskbar(false)
      mainWindow.focus()
      tray.setContextMenu(buildMenu())
    }
    tray.on('click', showWindow)
    tray.on('double-click', showWindow)
    mainWindow.on('show', () => tray.setContextMenu(buildMenu()))
    mainWindow.on('hide', () => tray.setContextMenu(buildMenu()))
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用退出时关闭后端
app.on('before-quit', () => {
  stopBackendServer()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

onWinTitleOp()
