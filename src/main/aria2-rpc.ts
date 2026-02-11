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
