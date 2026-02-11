import { useState, useEffect, useCallback, useRef } from 'react'

export interface Aria2Task {
  gid: string
  status: 'active' | 'waiting' | 'paused' | 'error' | 'complete' | 'removed'
  totalLength: string
  completedLength: string
  downloadSpeed: string
  uploadSpeed: string
  bittorrent?: {
    info?: {
      name: string
    }
  }
  files: Array<{
    path: string
    length: string
    uris: Array<{ uri: string }>
  }>
  followedBy?: string[]
}

export function useAria2() {
  const [tasks, setTasks] = useState<Aria2Task[]>([])
  const [globalStats, setGlobalStats] = useState({ downloadSpeed: '0', uploadSpeed: '0' })
  const [isEngineConnected, setIsEngineConnected] = useState(true)
  const [previewTask, setPreviewTask] = useState<Aria2Task | null>(null)
  const [selectedFileIndexes, setSelectedFileIndexes] = useState<number[]>([])
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null)
  const notifiedGids = useRef<Set<string>>(new Set())

  const fetchTasks = useCallback(async () => {
    try {
      const { active, waiting, stopped } = await window.api.aria2.getTasks()
      const stats = await window.api.aria2.getStats()

      // Calculate real-time total speed from individual active tasks
      // This provides instant feedback when a task finishes or is paused
      const activeDownloadSpeed = active.reduce((sum, t) => sum + parseInt(t.downloadSpeed || '0'), 0)
      const activeUploadSpeed = active.reduce((sum, t) => sum + parseInt(t.uploadSpeed || '0'), 0)

      setTasks([...active, ...waiting, ...stopped])
      setGlobalStats({
        ...stats,
        downloadSpeed: activeDownloadSpeed.toString(),
        uploadSpeed: activeUploadSpeed.toString()
      })
      setIsEngineConnected(true)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      setIsEngineConnected(false)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(fetchTasks, 500)
    return () => clearInterval(interval)
  }, [fetchTasks])

  // Monitor completions
  useEffect(() => {
    tasks.forEach(task => {
      if (task.status === 'complete' && !notifiedGids.current.has(task.gid)) {
        notifiedGids.current.add(task.gid)
        const name = task.bittorrent?.info?.name || task.files[0]?.path?.split(/[/\\]/).pop() || '文件'
        window.api.notifications.complete('下载完成', `“${name}”已下载完成`, task.files[0]?.path)
      }
    })
  }, [tasks])

  const startPreviewPolling = (initialGid: string) => {
    if (previewTimerRef.current) clearInterval(previewTimerRef.current)

    let currentGid = initialGid
    
    // Auto-unpause for magnets so they can fetch metadata
    const initMagnet = async () => {
        try {
            await window.api.aria2.unpause(initialGid)
        } catch (e) { /* ignore */ }
    }
    initMagnet()

    previewTimerRef.current = setInterval(async () => {
      try {
        const status = await window.api.aria2.tellStatus(currentGid)
        
        if (status.followedBy && status.followedBy.length > 0) {
            currentGid = status.followedBy[0]
            return
        }

        if (status.files && status.files.length > 0) {
          const firstFile = status.files[0]
          const isMetadata = firstFile.path.startsWith('[METADATA]') || firstFile.path === ''
          
          if (!isMetadata || (status.bittorrent?.info?.name && status.files.length > 1)) {
             await window.api.aria2.pause(currentGid)
             setPreviewTask(status)
             setSelectedFileIndexes(status.files.map((_, i) => i + 1))
             if (previewTimerRef.current) clearInterval(previewTimerRef.current)
          }
        }
      } catch (err) {
        console.error('Preview poll error:', err)
      }
    }, 1000)
  }

  const cancelPreview = async () => {
    if (previewTask) {
      await window.api.aria2.remove(previewTask.gid)
    }
    setPreviewTask(null)
  }

  const confirmDownload = async () => {
    if (!previewTask) return
    const selectFiles = selectedFileIndexes.join(',')
    try {
      await window.api.aria2.changeOption(previewTask.gid, { 'select-file': selectFiles })
      await window.api.aria2.unpause(previewTask.gid)
      setPreviewTask(null)
      fetchTasks()
    } catch (err) {
      console.error('Confirm download error:', err)
    }
  }

  const toggleFileSelection = (index: number) => {
    setSelectedFileIndexes(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  return {
    tasks,
    globalStats,
    isEngineConnected,
    previewTask,
    selectedFileIndexes,
    setPreviewTask,
    setSelectedFileIndexes,
    fetchTasks,
    startPreviewPolling,
    cancelPreview,
    confirmDownload,
    toggleFileSelection
  }
}
