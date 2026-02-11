import axios from 'axios'

const RPC_URL = 'http://localhost:6800/jsonrpc'

export interface Aria2Task {
    gid: string
    status: 'active' | 'waiting' | 'paused' | 'error' | 'complete' | 'removed'
    totalLength: string
    completedLength: string
    uploadSpeed: string
    downloadSpeed: string
    bittorrent?: {
        info?: {
            name?: string
        }
    }
    files: Array<{
        path: string
        length: string
        completedLength: string
        uris: Array<{ uri: string }>
    }>
    followedBy?: string[]
}

export class Aria2RPC {
    private static id = 1

    private static async call(method: string, params: any[] = []) {
        try {
            const response = await axios.post(RPC_URL, {
                jsonrpc: '2.0',
                id: this.id++,
                method: `aria2.${method}`,
                params,
            })
            return response.data.result
        } catch (error) {
            console.error(`Aria2 RPC Error (${method}):`, error)
            throw error
        }
    }

    static async addUri(uris: string[], options: any = {}) {
        return this.call('addUri', [uris, options])
    }

    static async addTorrent(torrent: string, uris: string[] = [], options: any = {}) {
        return this.call('addTorrent', [torrent, uris, options])
    }

    static async tellStatus(gid: string, keys: string[] = []): Promise<Aria2Task> {
        return this.call('tellStatus', [gid, keys])
    }

    static async tellActive(): Promise<Aria2Task[]> {
        return this.call('tellActive')
    }

    static async tellWaiting(offset: number, num: number): Promise<Aria2Task[]> {
        return this.call('tellWaiting', [offset, num])
    }

    static async tellStopped(offset: number, num: number): Promise<Aria2Task[]> {
        return this.call('tellStopped', [offset, num])
    }

    static async pause(gid: string) {
        return this.call('pause', [gid])
    }

    static async unpause(gid: string) {
        return this.call('unpause', [gid])
    }

    static async remove(gid: string) {
        return this.call('remove', [gid])
    }

    static async retry(gid: string) {
        // 1. Get current task details
        const task = await this.tellStatus(gid)
        
        // 2. Prepare URIs and Options
        const uris = task.files && task.files[0] ? task.files[0].uris.map(u => u.uri) : []
        
        if (uris.length === 0) {
            throw new Error('No URIs found for retrying task')
        }

        // Get options (like dir)
        const options = await this.call('getOption', [gid])
        
        // 3. Add task again
        const newGid = await this.addUri(uris, options)
        
        // 4. Remove the old failed/removed task
        await this.call('removeStopped', [gid]).catch(() => {})
        
        return newGid
    }

    static async forceRemove(gid: string) {
        return this.call('forceRemove', [gid])
    }

    static async changeOption(gid: string, options: any) {
        return this.call('changeOption', [gid, options])
    }

    static async getGlobalStat() {
        return this.call('getGlobalStat')
    }

    static async changeGlobalOption(options: any) {
        return this.call('changeGlobalOption', [options])
    }
}
