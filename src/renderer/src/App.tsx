import { useState, useEffect, useCallback } from 'react'
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
  AlertCircle
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

  const handleAddUri = async () => {
    const url = searchQuery.trim()
    if (!url.startsWith('http') && !url.startsWith('magnet')) return

    try {
      await window.api.aria2.addUri([url])
      setSearchQuery('')
      fetchTasks()
    } catch (error) {
      alert('添加任务失败，请检查链接是否正确')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddUri()
    }
  }

  const sidebarItems = [
    { id: 'downloading', icon: DownloadCloud, label: '正在下载', count: tasks.filter(t => t.status === 'active' || t.status === 'waiting').length },
    { id: 'completed', icon: CheckCircle, label: '已完成', count: tasks.filter(t => t.status === 'complete').length },
    { id: 'trash', icon: Trash2, label: '垃圾箱', count: tasks.filter(t => t.status === 'removed').length },
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

    if (searchQuery && !searchQuery.startsWith('http')) {
      filtered = filtered.filter(t => {
        const name = t.bittorrent?.info?.name || t.files[0]?.path?.split(/[/\\]/).pop() || '未知文件'
        return name.toLowerCase().includes(searchQuery.toLowerCase())
      })
    }
    return filtered
  }

  return (
    <div className="flex h-screen w-full bg-[#0c0c0e] text-slate-200 select-none overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0e0e11] flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center">
            <img src={logoUrl} alt="Nexus Mirror Logo" className="w-6 h-6 object-contain" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            灵镜里
          </h1>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                activeTab === item.id
                  ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "group-hover:text-blue-400")} />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.count !== null && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  activeTab === item.id ? "bg-white/20" : "bg-white/5"
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
            onClick={() => {/* TODO: Open Add Dialog */ }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 group"
          >
            <Plus className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm">新建下载</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0c0c0e]/50 backdrop-blur-md sticky top-0 z-10 transition-all">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                placeholder="粘贴下载链接并按回车，或搜索任务..."
                value={searchQuery}
                onKeyDown={handleKeyDown}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 text-blue-400">
                <Zap className="w-4 h-4 fill-current animate-pulse" />
                <span className="text-sm font-bold">{formatSpeed(globalStats.downloadSpeed)}</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">当前总网速</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-3">
              <button className="p-2 text-slate-400 hover:text-white transition-colors"><Play className="w-5 h-5" /></button>
              <button className="p-2 text-slate-400 hover:text-white transition-colors"><Pause className="w-5 h-5" /></button>
            </div>
          </div>
        </header>

        {/* Task List */}
        <section className="flex-1 overflow-y-auto p-8 space-y-4">
          <AnimatePresence mode='popLayout'>
            {getFilteredTasks().map((task) => {
              const name = task.bittorrent?.info?.name || task.files[0]?.path?.split(/[/\\]/).pop() || task.files[0]?.uris[0]?.uri?.split('/').pop() || '未知文件'
              const progress = task.totalLength === '0' ? 0 : Math.round((parseInt(task.completedLength) / parseInt(task.totalLength)) * 100)
              const isBT = !!task.bittorrent

              return (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={task.gid}
                  className="group bg-[#161618] border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/5 rounded-xl group-hover:bg-blue-500/10 transition-colors shrink-0">
                      {getFileIcon(name)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors truncate">
                            {name}
                          </h3>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                            <span className="flex items-center gap-1 uppercase font-medium">
                              {isBT ? <Activity className="w-3 h-3 text-amber-500" /> : <Globe className="w-3 h-3 text-blue-500" />}
                              {isBT ? 'BitTorrent' : 'Direct'}
                            </span>
                            <span className="opacity-30">•</span>
                            <span>{formatSize(task.completedLength)} / {formatSize(task.totalLength)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-blue-400 font-bold text-sm tabular-nums">
                            {task.status === 'active' ? formatSpeed(task.downloadSpeed) : '--'}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1">
                            {task.status === 'active' ? '正在连接...' : task.status}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-slate-500 font-medium tracking-tighter">
                          <span>{progress}%</span>
                          <span className="uppercase">{task.status}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={false}
                            animate={{ width: `${progress}%` }}
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              task.status === 'complete' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" :
                                task.status === 'error' ? "bg-red-500" :
                                  "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                      <button
                        onClick={() => task.status === 'paused' ? window.api.aria2.unpause(task.gid) : window.api.aria2.pause(task.gid)}
                        className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                      >
                        {task.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => window.api.aria2.remove(task.gid)}
                        className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {getFilteredTasks().length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 italic">
                <DownloadCloud className="w-12 h-12 mb-4 opacity-10" />
                <p>暂无任务，粘贴链接开始下载吧</p>
              </div>
            )}
          </AnimatePresence>
        </section>

        {/* Global Progress Bar at the bottom */}
        <div className="h-0.5 w-full bg-white/5">
          <div
            className="h-full bg-blue-600/50 transition-all duration-500"
            style={{ width: `${tasks.length > 0 ? (getFilteredTasks().filter(t => t.status === 'complete').length / tasks.length) * 100 : 0}%` }}
          />
        </div>
      </main>
    </div>
  )
}
