import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'

export class Aria2Manager {
    private aria2Process: ChildProcess | null = null
    private aria2Path: string
    private sessionPath: string

    constructor() {
        // Binary path: Check for aria2c.exe in resources/bin
        const isDev = !app.isPackaged
        const basePath = isDev
            ? path.join(process.cwd(), 'resources', 'bin')
            : path.join(process.resourcesPath, 'bin')

        this.aria2Path = path.join(basePath, process.platform === 'win32' ? 'aria2c.exe' : 'aria2c')

        // User data paths
        const userData = app.getPath('userData')
        this.sessionPath = path.join(userData, 'aria2.session')

        this.initSession()
        console.log(`[Aria2] Session path: ${this.sessionPath}`)
    }

    private initSession() {
        try {
            if (!fs.existsSync(this.sessionPath)) {
                fs.writeFileSync(this.sessionPath, '', { flag: 'a' })
                console.log('[Aria2] Created new session file')
            }
        } catch (e) {
            console.error('[Aria2] Failed to init session:', e)
        }
    }

    public start() {
        if (this.aria2Process) return

        if (!fs.existsSync(this.aria2Path)) {
            console.error(`[Aria2] Binary not found at: ${this.aria2Path}. Please ensure aria2c.exe is in resources/bin/`)
            return
        }

        const args = [
            '--enable-rpc=true',
            '--rpc-listen-all=true',
            '--rpc-listen-port=6800',
            '--rpc-allow-origin-all=true',
            '--rpc-max-request-size=10M',
            `--input-file=${this.sessionPath}`,
            `--save-session=${this.sessionPath}`,
            '--save-session-interval=1', // Save every 1 second for maximum persistence
            '--continue=true',
            '--max-concurrent-downloads=5',
            '--max-connection-per-server=16',
            '--split=16',
            '--min-split-size=1M',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            // BitTorrent Settings
            '--enable-dht=true',
            '--enable-dht6=false',
            '--enable-peer-exchange=true',
            '--bt-enable-lpd=true',
            '--bt-max-peers=55',
            '--bt-request-peer-speed-limit=50K',
            '--follow-torrent=mem',
            '--listen-port=6881-6999',
            '--dht-listen-port=6881-6999',
            '--quiet=true', // Minimize noise, use our own logging
        ]

        this.aria2Process = spawn(this.aria2Path, args, {
            stdio: 'pipe', // Change to pipe to capture initial errors if any
            windowsHide: true,
        })

        if (this.aria2Process.stderr) {
            this.aria2Process.stderr.on('data', (data) => {
                console.error(`[Aria2 Error] ${data}`)
            })
        }

        this.aria2Process.on('error', (err) => {
            console.error('[Aria2] Failed to start:', err)
        })

        this.aria2Process.on('exit', (code) => {
            console.log(`[Aria2] Process exited with code ${code}`)
            this.aria2Process = null
        })

        console.log('[Aria2] Engine started on port 6800')
    }

    public stop() {
        if (this.aria2Process) {
            this.aria2Process.kill()
            this.aria2Process = null
        }
    }

    public getPath() {
        return this.aria2Path
    }
}

export const aria2Manager = new Aria2Manager()
