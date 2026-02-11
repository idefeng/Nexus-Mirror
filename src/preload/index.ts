import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  aria2: {
    addUri: (uris: string[], options: any = {}) => ipcRenderer.invoke('aria2:addUri', uris, options),
    addTorrent: (torrent: string, uris: string[] = [], options: any = {}) => ipcRenderer.invoke('aria2:addTorrent', torrent, uris, options),
    tellStatus: (gid: string, keys: string[] = []) => ipcRenderer.invoke('aria2:tellStatus', gid, keys),
    changeOption: (gid: string, options: any) => ipcRenderer.invoke('aria2:changeOption', gid, options),
    getTasks: () => ipcRenderer.invoke('aria2:getTasks'),
    pause: (gid: string) => ipcRenderer.invoke('aria2:pause', gid),
    unpause: (gid: string) => ipcRenderer.invoke('aria2:unpause', gid),
    remove: (gid: string) => ipcRenderer.invoke('aria2:remove', gid),
    getStats: () => ipcRenderer.invoke('aria2:getStats'),
  },
  shell: {
    openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
    showInFolder: (path: string) => ipcRenderer.invoke('shell:showInFolder', path),
  },
  events: {
    onClipboardDetected: (callback: (url: string) => void) => {
      ipcRenderer.on('clipboard:detected', (_, url) => callback(url))
    }
  },
  notifications: {
    complete: (title: string, body: string, path: string) => ipcRenderer.invoke('notification:complete', title, body, path),
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
