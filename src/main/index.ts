import { app, shell, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { aria2Manager } from './aria2-manager'
import { Aria2RPC } from './aria2-rpc'
import { ClipboardMonitor } from './clipboard-monitor'
import { historyManager } from './history-manager'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuiting = false

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    minWidth: 960,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Start clipboard monitor
  const clipboardMonitor = new ClipboardMonitor(mainWindow)
  clipboardMonitor.start()

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Tray Implementation
  const trayIcon = nativeImage.createFromPath(icon)
  tray = new Tray(trayIcon)
  const contextMenu = Menu.buildFromTemplate([
    { label: '打开 Nexus Mirror', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: '退出', click: () => {
      isQuiting = true
      app.quit()
    }}
  ])
  tray.setToolTip('Nexus Mirror')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    mainWindow?.isVisible() ? mainWindow?.hide() : mainWindow?.show()
  })

  mainWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault()
      mainWindow?.hide()
    }
    return false
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.nexus-mirror')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Aria2 IPC Handlers
  ipcMain.handle('aria2:addUri', async (_, uris: string[], options: any = {}) => {
    return await Aria2RPC.addUri(uris, options)
  })

  ipcMain.handle('aria2:addTorrent', async (_, torrent: string, uris: string[] = [], options: any = {}) => {
    return await Aria2RPC.addTorrent(torrent, uris, options)
  })

  ipcMain.handle('aria2:tellStatus', async (_, gid: string, keys: string[] = []) => {
    return await Aria2RPC.tellStatus(gid, keys)
  })

  ipcMain.handle('aria2:changeOption', async (_, gid: string, options: any) => {
    return await Aria2RPC.changeOption(gid, options)
  })

  ipcMain.handle('aria2:getTasks', async () => {
    const active = await Aria2RPC.tellActive()
    const waiting = await Aria2RPC.tellWaiting(0, 100)
    const stopped = await Aria2RPC.tellStopped(0, 100)
    
    // Sync stopped tasks to persistent history
    historyManager.update(stopped)
    
    // Merge persistent history for stopped/complete/removed tasks
    const history = historyManager.getHistory()
    
    // Deduplicate by GID, prioritizing live data from aria2 if available
    const stoppedMap = new Map()
    history.forEach(t => stoppedMap.set(t.gid, t))
    stopped.forEach(t => stoppedMap.set(t.gid, t))
    
    return { 
        active, 
        waiting, 
        stopped: Array.from(stoppedMap.values()).sort((a: any, b: any) => b.gid.localeCompare(a.gid)) 
    }
  })

  ipcMain.handle('aria2:removePermanently', async (_, gid: string) => {
    try {
        await Aria2RPC.remove(gid).catch(() => {}) // Try to remove from aria2 memory if still there
        historyManager.remove(gid) // Remove from persistent disk
        return true
    } catch (e) {
        return false
    }
  })

  ipcMain.handle('aria2:pause', async (_, gid: string) => {
    return await Aria2RPC.pause(gid)
  })

  ipcMain.handle('aria2:unpause', async (_, gid: string) => {
    return await Aria2RPC.unpause(gid)
  })

  ipcMain.handle('aria2:retry', async (_, gid: string) => {
    const result = await Aria2RPC.retry(gid)
    historyManager.remove(gid) // Clear the old failed record from persistent storage
    return result
  })

  ipcMain.handle('aria2:remove', async (_, gid: string) => {
    return await Aria2RPC.remove(gid)
  })

  ipcMain.handle('aria2:getStats', async () => {
    return await Aria2RPC.getGlobalStat()
  })

  ipcMain.handle('aria2:changeGlobalOption', async (_, options: any) => {
    return await Aria2RPC.changeGlobalOption(options)
  })

  ipcMain.handle('aria2:getEnginePath', async () => {
    return aria2Manager.getPath()
  })

  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('dialog:openDirectory', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('shell:openPath', async (_, path: string) => {
    return await shell.openPath(path)
  })

  ipcMain.handle('shell:showInFolder', async (_, path: string) => {
    shell.showItemInFolder(path)
    return true
  })

  ipcMain.handle('notification:complete', async (_, title: string, body: string, path: string) => {
    const n = new Notification({ title, body })
    n.on('click', () => {
      shell.showItemInFolder(path)
    })
    n.show()
    return true
  })

  // Start aria2 engine
  aria2Manager.start()

  createWindow()

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
  aria2Manager.stop()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
