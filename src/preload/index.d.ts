import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      aria2: {
        addUri: (uris: string[], options?: any) => Promise<string>
        addTorrent: (torrent: string, uris?: string[], options?: any) => Promise<string>
        tellStatus: (gid: string, keys?: string[]) => Promise<any>
        changeOption: (gid: string, options: any) => Promise<string>
        getTasks: () => Promise<{ active: any[], waiting: any[], stopped: any[] }>
        pause: (gid: string) => Promise<string>
        unpause: (gid: string) => Promise<string>
        remove: (gid: string) => Promise<string>
        getStats: () => Promise<any>
        changeGlobalOption: (options: any) => Promise<any>
      }
      dialog: {
        openDirectory: () => Promise<string | null>
      }
      shell: {
        openPath: (path: string) => Promise<any>
        showInFolder: (path: string) => Promise<boolean>
      }
      events: {
        onClipboardDetected: (callback: (url: string) => void) => void
      }
      notifications: {
        complete: (title: string, body: string, path: string) => Promise<boolean>
      }
    }
  }
}
