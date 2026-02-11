import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  aria2: {
    addUri: (uris: string[]) => ipcRenderer.invoke('aria2:addUri', uris),
    getTasks: () => ipcRenderer.invoke('aria2:getTasks'),
    pause: (gid: string) => ipcRenderer.invoke('aria2:pause', gid),
    unpause: (gid: string) => ipcRenderer.invoke('aria2:unpause', gid),
    remove: (gid: string) => ipcRenderer.invoke('aria2:remove', gid),
    getStats: () => ipcRenderer.invoke('aria2:getStats'),
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
