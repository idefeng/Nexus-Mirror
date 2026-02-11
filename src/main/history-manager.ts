import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { Aria2Task } from './aria2-rpc'

export class HistoryManager {
    private historyPath: string
    private history: Aria2Task[] = []

    constructor() {
        const userData = app.getPath('userData')
        this.historyPath = path.join(userData, 'nexus-history.json')
        this.load()
    }

    private load() {
        try {
            if (fs.existsSync(this.historyPath)) {
                const data = fs.readFileSync(this.historyPath, 'utf8')
                this.history = JSON.parse(data)
            }
        } catch (e) {
            console.error('[History] Failed to load history:', e)
            this.history = []
        }
    }

    private save() {
        try {
            fs.writeFileSync(this.historyPath, JSON.stringify(this.history, null, 2))
        } catch (e) {
            console.error('[History] Failed to save history:', e)
        }
    }

    public update(tasks: Aria2Task[]) {
        let changed = false
        
        tasks.forEach(task => {
            // Only persist finished tasks
            if (task.status === 'complete' || task.status === 'removed' || task.status === 'error') {
                const index = this.history.findIndex(t => t.gid === task.gid)
                if (index === -1) {
                    this.history.push(task)
                    changed = true
                } else {
                    // Update existing record if status changed or it's been updated
                    if (JSON.stringify(this.history[index]) !== JSON.stringify(task)) {
                        this.history[index] = task
                        changed = true
                    }
                }
            }
        })

        if (changed) {
            this.save()
        }
    }

    public remove(gid: string) {
        this.history = this.history.filter(t => t.gid !== gid)
        this.save()
    }

    public getHistory() {
        return this.history
    }
}

export const historyManager = new HistoryManager()
