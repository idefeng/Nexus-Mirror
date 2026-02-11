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
    }

    private initSession() {
        if (!fs.existsSync(this.sessionPath)) {
            fs.writeFileSync(this.sessionPath, '')
        }
    }

    public start() {
        if (this.aria2Process) return

        if (!fs.existsSync(this.aria2Path)) {
            console.error(`Aria2 binary not found at: ${this.aria2Path}. Please ensure aria2c.exe is in resources/bin/`)
            return
        }

        const args = [
            '--enable-rpc=true',
            '--rpc-listen-all=false',
            '--rpc-listen-port=6800',
            '--rpc-max-request-size=2M',
            `--input-file=${this.sessionPath}`,
            `--save-session=${this.sessionPath}`,
            '--save-session-interval=30',
            '--continue=true',
            '--max-concurrent-downloads=5',
            '--max-connection-per-server=16',
            '--split=16',
            '--min-split-size=1M',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        ]

        this.aria2Process = spawn(this.aria2Path, args, {
            stdio: 'ignore', // Keep it clean
            windowsHide: true,
        })

        this.aria2Process.on('error', (err) => {
            console.error('Failed to start aria2:', err)
        })

        this.aria2Process.on('exit', (code) => {
            console.log(`aria2 exited with code ${code}`)
            this.aria2Process = null
        })

        console.log('Aria2 engine started on port 6800')
    }

    public stop() {
        if (this.aria2Process) {
            this.aria2Process.kill()
            this.aria2Process = null
        }
    }
}

export const aria2Manager = new Aria2Manager()
