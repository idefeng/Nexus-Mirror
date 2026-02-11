import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DownloadCloud,
  CheckCircle,
  Trash2,
  Settings,
  Plus,
  Play,
  Pause,
  X,
  Search,
  FileText,
  Video,
  Music,
  Archive,
  Activity,
  Globe,
  Zap,
  AlertCircle,
  File,
  CheckSquare,
  Square,
  RotateCcw,
  FolderOpen
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import logoUrl from './assets/icon.png'

// --- Utility Functions ---
const formatSize = (bytes: string | number) => {
  const b = typeof bytes === 'string' ? parseInt(bytes) : bytes
  if (isNaN(b) || b === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(b) / Math.log(k))
  return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatSpeed = (bytesPerSec: string | number) => {
  const s = formatSize(bytesPerSec)
  return s === '0 B' ? '0 B/s' : `${s}/s`
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) return <Video className="w-5 h-5 text-purple-400" />
  if (['mp3', 'wav', 'flac', 'aac'].includes(ext)) return <Music className="w-5 h-5 text-pink-400" />
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <Archive className="w-5 h-5 text-amber-400" />
  return <FileText className="w-5 h-5 text-blue-400" />
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'downloading' | 'completed' | 'trash' | 'settings'>('downloading')
  const [searchQuery, setSearchQuery] = useState('')
  const [tasks, setTasks] = useState<any[]>([])
  const [globalStats, setGlobalStats] = useState({ downloadSpeed: '0', uploadSpeed: '0' })
  const [isEngineConnected, setIsEngineConnected] = useState(true)

  // Torrent Preview State
  const [previewTask, setPreviewTask] = useState<any | null>(null)
  const [selectedFileIndexes, setSelectedFileIndexes] = useState<number[]>([])
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Clipboard & Notification State
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null)
  const notifiedGids = useRef<Set<string>>(new Set())

  const fetchTasks = useCallback(async () => {
    try {
      const { active, waiting, stopped } = await window.api.aria2.getTasks()
      const stats = await window.api.aria2.getStats()

      setTasks([...active, ...waiting, ...stopped])
      setGlobalStats(stats)
      setIsEngineConnected(true)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      setIsEngineConnected(false)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(fetchTasks, 1000)
    return () => clearInterval(interval)
  }, [fetchTasks])

  // Listen for clipboard events
  useEffect(() => {
    window.api.events.onClipboardDetected((url) => {
      setDetectedUrl(url)
    })
  }, [])

  // Check for completed tasks to notify
  useEffect(() => {
    tasks.forEach(task => {
      if (task.status === 'complete' && !notifiedGids.current.has(task.gid)) {
        notifiedGids.current.add(task.gid)
        const name = task.bittorrent?.info?.name || task.files[0]?.path?.split(/[/\\]/).pop() || '文件'
        window.api.notifications.complete('下载完成', `“${name}”已下载完成`, task.files[0]?.path)
      }
    })
  }, [tasks])

  // Handle Drag & Drop for .torrent files
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => e.preventDefault()
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer?.files || [])
      const torrentFile = files.find(f => f.name.endsWith('.torrent'))

      if (torrentFile) {
        const reader = new FileReader()
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1]
          try {
            const gid = await window.api.aria2.addTorrent(base64, [], { pause: 'true' })
            startPreviewPolling(gid)
          } catch (err) {
            console.error('Add torrent error:', err)
          }
        }
        reader.readAsDataURL(torrentFile)
      }
    }

    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)
    return () => {
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [])

  const startPreviewPolling = (gid: string) => {
    if (previewTimerRef.current) clearInterval(previewTimerRef.current)

    previewTimerRef.current = setInterval(async () => {
      try {
        const status = await window.api.aria2.tellStatus(gid)
        // If it's a magnet, aria2 might create a new task once metadata is downloaded
        // But for simplicity, we check if files are available
        if (status.files && status.files.length > 0 && status.files[0].path !== '') {
          setPreviewTask(status)
          setSelectedFileIndexes(status.files.map((_, i) => i + 1)) // Default all selected (aria2 index starts from 1)
          if (previewTimerRef.current) clearInterval(previewTimerRef.current)
        }
      } catch (err) {
        console.error('Preview poll error:', err)
      }
    }, 500)
  }

  const handleAddUri = async (urlOverride?: string) => {
    const url = (urlOverride || searchQuery).trim()
    if (!url.startsWith('http') && !url.startsWith('magnet')) return

    try {
      // For magnet links, we want to preview too
      const gid = await window.api.aria2.addUri([url], { pause: 'true' })
      if (url.startsWith('magnet')) {
        startPreviewPolling(gid)
      } else {
        // Direct link, just unpause and clear
        await window.api.aria2.unpause(gid)
      }
      setSearchQuery('')
      setDetectedUrl(null)
    } catch (error) {
      alert('添加任务失败，请检查链接是否正确')
    }
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

  const cancelPreview = async () => {
    if (previewTask) {
      await window.api.aria2.remove(previewTask.gid)
    }
    setPreviewTask(null)
  }

  const toggleFileSelection = (index: number) => {
    setSelectedFileIndexes(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddUri()
    }
  }

  const sidebarItems = [
    { id: 'downloading', icon: DownloadCloud, label: '正在下载', count: tasks.filter(t => t.status === 'active' || t.status === 'waiting' || t.status === 'paused').length },
    { id: 'completed', icon: CheckCircle, label: '已完成', count: tasks.filter(t => t.status === 'complete').length },
    { id: 'trash', icon: Trash2, label: '垃圾箱', count: tasks.filter(t => t.status === 'removed' || t.status === 'error').length },
    { id: 'settings', icon: Settings, label: '设置', count: null },
  ] as const

  const getFilteredTasks = () => {
    let filtered = tasks
    if (activeTab === 'downloading') {
      filtered = tasks.filter(t => t.status === 'active' || t.status === 'waiting' || t.status === 'paused')
    } else if (activeTab === 'completed') {
      filtered = tasks.filter(t => t.status === 'complete')
    } else if (activeTab === 'trash') {
      filtered = tasks.filter(t => t.status === 'removed' || t.status === 'error')
    }

    if (searchQuery && !searchQuery.startsWith('http') && !searchQuery.startsWith('magnet')) {
      filtered = filtered.filter(t => {
        const name = t.bittorrent?.info?.name || t.files[0]?.path?.split(/[/\\]/).pop() || '未知文件'
        return name.toLowerCase().includes(searchQuery.toLowerCase())
      })
    }
    return filtered
  }

  return (
    <div className="flex h-screen w-full bg-[#0c0c0e] text-slate-200 select-none overflow-hidden font-sans">
      {/* Clipboard URL Detected Prompt */}
      <AnimatePresence>
        {detectedUrl && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4"
          >
            <div className="bg-[#1a1a1e]/90 backdrop-blur-2xl border border-blue-500/30 rounded-2xl p-4 shadow-2xl flex items-center gap-4 justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Plus className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">检测到下载链接</p>
                  <p className="text-sm text-slate-300 truncate font-medium">{detectedUrl}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setDetectedUrl(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
                >
                  忽略
                </button>
                <button
                  onClick={() => handleAddUri(detectedUrl)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-600/20 transition-all"
                >
                  立即下载
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0e0e11] flex flex-col relative z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center">
            <img src={logoUrl} alt="Nexus Mirror Logo" className="w-6 h-6 object-contain" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase tracking-wider">
            Nexus Mirror
          </h1>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                activeTab === item.id
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.05)]"
                  : "text-slate-500 hover:bg-white/5 hover:text-slate-300 border border-transparent"
              )}
            >
              {activeTab === item.id && (
                <motion.div layoutId="sidebar-active" className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full" />
              )}
              <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-blue-400" : "group-hover:text-blue-500 transition-colors")} />
              <span className="flex-1 text-left font-semibold text-sm">{item.label}</span>
              {item.count !== null && (
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-md font-bold",
                  activeTab === item.id ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-slate-500"
                )}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-3">
          {!isEngineConnected && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-[10px]">
              <AlertCircle className="w-3 h-3" />
              <span>引擎未就绪 (缺少 aria2c.exe)</span>
            </div>
          )}
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-bold text-sm tracking-wide">新建下载任务</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0c0c0e]">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0c0c0e]/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="粘贴下载链接 / 磁力链接，或拖入种子文件..."
                value={searchQuery}
                onKeyDown={handleKeyDown}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all text-sm placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-8 ml-4">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 text-blue-500">
                <Zap className="w-4 h-4 fill-current animate-pulse text-blue-500/50" />
                <span className="text-lg font-black tabular-nums">{formatSpeed(globalStats.downloadSpeed)}</span>
              </div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Global Speed</span>
            </div>
            <div className="w-px h-10 bg-white/5" />
            <div className="flex items-center gap-2">
              <button className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Play className="w-5 h-5 font-bold" /></button>
              <button className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Pause className="w-5 h-5" /></button>
            </div>
          </div>
        </header>

        {/* Task List */}
        <section className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          <AnimatePresence mode='popLayout'>
            {getFilteredTasks().map((task) => {
              const name = task.bittorrent?.info?.name || task.files[0]?.path?.split(/[/\\]/).pop() || task.files[0]?.uris[0]?.uri?.split('/').pop() || 'Nexus Metadata...'
              const progress = task.totalLength === '0' ? 0 : Math.round((parseInt(task.completedLength) / parseInt(task.totalLength)) * 100)
              const isBT = !!task.bittorrent

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  key={task.gid}
                  className="group bg-[#141416] border border-white/[0.03] rounded-3xl p-6 hover:border-blue-500/40 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 relative overflow-hidden"
                >
                  <div className="flex items-center gap-6">
                    {/* Icon Container with Glow */}
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-blue-500/20 blur-xl group-hover:bg-blue-500/40 transition-all duration-500 opacity-0 group-hover:opacity-100" />
                      <div className="relative p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-all duration-500">
                        {getFileIcon(name)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-4">
                      <div className="flex items-center justify-between gap-6">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors truncate text-lg tracking-tight">
                            {name}
                          </h3>
                          <div className="flex items-center gap-4 text-[12px] text-slate-500 mt-2 font-medium">
                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-md border border-white/5">
                              {isBT ? <Activity className="w-3 h-3 text-amber-500" /> : <Globe className="w-3 h-3 text-blue-500" />}
                              {isBT ? 'P2P' : 'WEB'}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <span className="tabular-nums">{formatSize(task.completedLength)} <span className="text-slate-700 mx-1">/</span> {formatSize(task.totalLength)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 gap-1">
                          <div className="text-blue-400 font-black text-lg tabular-nums flex items-baseline gap-1">
                            {task.status === 'active' ? formatSpeed(task.downloadSpeed) : 'PAUSED'}
                          </div>
                          <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
                            Speed Rate
                          </span>
                        </div>
                      </div>

                      {/* Professional Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-black text-slate-500 tracking-wider">
                          <span className="bg-blue-500/10 text-blue-400 px-2 rounded-md">{progress}% COMPLETED</span>
                          <span className="uppercase text-slate-600 px-2">{task.status}</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/[0.02]">
                          <motion.div
                            initial={false}
                            animate={{ width: `${progress}%` }}
                            className={cn(
                              "h-full rounded-full transition-all duration-700 ease-out relative",
                              task.status === 'complete' ? "bg-green-500" :
                                task.status === 'error' ? "bg-red-500" :
                                  "bg-gradient-to-r from-blue-700 to-blue-400"
                            )}
                          >
                            {task.status === 'active' && (
                              <motion.div
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                              />
                            )}
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 shrink-0">
                      {task.status === 'error' && (
                        <button
                          onClick={() => window.api.aria2.unpause(task.gid)}
                          className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-red-500 transition-all border border-red-500/20"
                          title="重试"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                      )}
                      {task.status === 'complete' && (
                        <button
                          onClick={() => window.api.shell.showInFolder(task.files[0].path)}
                          className="p-3 bg-green-500/10 hover:bg-green-500/20 rounded-2xl text-green-500 transition-all border border-green-500/20"
                          title="打开文件夹"
                        >
                          <FolderOpen className="w-5 h-5" />
                        </button>
                      )}
                      {task.status !== 'complete' && task.status !== 'error' && (
                        <button
                          onClick={() => task.status === 'paused' ? window.api.aria2.unpause(task.gid) : window.api.aria2.pause(task.gid)}
                          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/[0.05]"
                        >
                          {task.status === 'paused' ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                        </button>
                      )}
                      <button
                        onClick={() => window.api.aria2.remove(task.gid)}
                        className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-red-500/70 hover:text-red-400 transition-all border border-red-500/10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  {task.status === 'error' && (
                    <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs">
                      <AlertCircle className="w-4 h-4" />
                      <span>下载出错，请检查网络连接或资源是否有效。</span>
                    </div>
                  )}
                </motion.div>
              )
            })}

            {getFilteredTasks().length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32 text-slate-600 gap-6"
              >
                <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
                  <DownloadCloud className="w-10 h-10 opacity-20" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-bold text-slate-400">准备好开始下载了吗？</p>
                  <p className="text-sm font-medium opacity-50">粘贴链接、磁力链接或拖入种子文件即可</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Global Progress Bar at the very bottom */}
        <div className="h-1 w-full bg-white/[0.02] shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
          <motion.div
            className="h-full bg-blue-600/60 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'complete').length / tasks.length) * 100 : 0}%` }}
            transition={{ duration: 1 }}
          />
        </div>

        {/* --- Torrent Select Files Modal --- */}
        <AnimatePresence>
          {previewTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={cancelPreview}
                className="absolute inset-0 bg-[#000]/80 backdrop-blur-2xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative bg-[#1a1a1e] border border-white/10 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
              >
                <div className="p-8 border-b border-white/5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 block">New Torrent Task</span>
                    <h2 className="text-2xl font-black text-white truncate pr-4">
                      {previewTask.bittorrent?.info?.name || 'Loading details...'}
                    </h2>
                  </div>
                  <button
                    onClick={cancelPreview}
                    className="shrink-0 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
                  {previewTask.files.map((file: any, index: number) => {
                    const idx = index + 1
                    const isSelected = selectedFileIndexes.includes(idx)
                    const fileName = file.path.split(/[/\\]/).pop() || 'Unknown File'

                    return (
                      <button
                        key={index}
                        onClick={() => toggleFileSelection(idx)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border",
                          isSelected
                            ? "bg-blue-600/10 border-blue-500/30 text-slate-100"
                            : "bg-white/[0.02] border-transparent text-slate-500 hover:bg-white/5"
                        )}
                      >
                        {isSelected ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5 opacity-40" />}
                        <File className={cn("w-5 h-5 shrink-0", isSelected ? "text-blue-400" : "opacity-30")} />
                        <span className="flex-1 text-left text-sm font-bold truncate">{fileName}</span>
                        <span className="tabular-nums font-mono text-xs opacity-50">{formatSize(file.length)}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="p-8 bg-[#161618] border-t border-white/5 flex items-center justify-between gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Total Selection</span>
                    <span className="text-xl font-black text-blue-400 tabular-nums">
                      {formatSize(previewTask.files.filter((_, i) => selectedFileIndexes.includes(i + 1)).reduce((acc: number, f: any) => acc + parseInt(f.length), 0))}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={cancelPreview}
                      className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all text-slate-300"
                    >
                      取消
                    </button>
                    <button
                      onClick={confirmDownload}
                      className="px-10 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
                    >
                      开启高速下载
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  )
}
