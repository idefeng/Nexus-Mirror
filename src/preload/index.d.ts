import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      aria2: {
        addUri: (uris: string[]) => Promise<string>
        getTasks: () => Promise<{ active: any[], waiting: any[], stopped: any[] }>
        pause: (gid: string) => Promise<string>
        unpause: (gid: string) => Promise<string>
        remove: (gid: string) => Promise<string>
        getStats: () => Promise<any>
      }
    }
  }
}
