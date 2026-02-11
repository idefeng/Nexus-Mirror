import { clipboard, Notification, BrowserWindow } from 'electron'

export class ClipboardMonitor {
  private lastText: string = ''
  private interval: NodeJS.Timeout | null = null
  private patterns = [/\.exe(\?.*)?$/i, /\.zip(\?.*)?$/i, /\.mp4(\?.*)?$/i, /^magnet:\?xt=/i]

  constructor(private mainWindow: BrowserWindow) {}

  public start() {
    if (this.interval) return

    this.interval = setInterval(() => {
      this.checkClipboard()
    }, 2000)
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  private checkClipboard() {
    const text = clipboard.readText().trim()
    if (!text || text === this.lastText) return

    this.lastText = text

    const isMatch = this.patterns.some((pattern) => pattern.test(text))
    if (isMatch) {
      this.notify(text)
    }
  }

  private notify(url: string) {
    const notification = new Notification({
      title: '发现下载链接',
      body: `剪贴板中发现链接: ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}\n点击开启高速下载`,
      silent: false
    })

    notification.on('click', () => {
      this.mainWindow.show()
      // Send to renderer to handle the URL
      this.mainWindow.webContents.send('clipboard:detected', url)
    })

    notification.show()
  }
}
