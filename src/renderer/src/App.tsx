import { useState } from 'react'
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
  MoreVertical,
  Activity,
  Globe,
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import logoUrl from './assets/icon.png'

export default function App() {
  const [activeTab, setActiveTab] = useState<'downloading' | 'completed' | 'trash' | 'settings'>('downloading')
  const [searchQuery, setSearchQuery] = useState('')

  const sidebarItems = [
    { id: 'downloading', icon: DownloadCloud, label: '正在下载', count: 2 },
    { id: 'completed', icon: CheckCircle, label: '已完成', count: 15 },
    { id: 'trash', icon: Trash2, label: '垃圾箱', count: 0 },
    { id: 'settings', icon: Settings, label: '设置', count: null },
  ] as const

  const mockDownloads = [
    {
      id: 1,
      name: 'Cyberpunk_2077_Update_v2.1.zip',
      progress: 45,
      speed: '12.4 MB/s',
      status: 'downloading',
      type: 'archive',
      protocol: 'magnet',
      size: '2.4 GB',
      totalSize: '5.1 GB',
      timeLeft: '4m 12s'
    },
    {
      id: 2,
      name: 'interstellar_original_soundtrack_flac.wav',
      progress: 82,
      speed: '2.1 MB/s',
      status: 'downloading',
      type: 'audio',
      protocol: 'http',
      size: '180 MB',
      totalSize: '220 MB',
      timeLeft: '18s'
    },
    {
      id: 3,
      name: 'Ubuntu-22.04-desktop-amd64.iso',
      progress: 100,
      speed: '0 B/s',
      status: 'completed',
      type: 'archive',
      protocol: 'http',
      size: '3.6 GB',
      totalSize: '3.6 GB',
      timeLeft: '已完成'
    }
  ]

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-purple-400" />
      case 'audio': return <Music className="w-5 h-5 text-pink-400" />
      case 'archive': return <Archive className="w-5 h-5 text-amber-400" />
      default: return <FileText className="w-5 h-5 text-blue-400" />
    }
  }

  return (
    <div className="flex h-screen w-full bg-[#0c0c0e] text-slate-200 select-none overflow-hidden">
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

        <div className="p-4 border-t border-white/5">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 group">
            <Plus className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm">新建下载</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0c0c0e]/50 backdrop-blur-md sticky top-0 z-10 transition-all">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                placeholder="搜索任务..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 text-blue-400">
                <Zap className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold">14.5 MB/s</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">当前总网速</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-3">
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <Play className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <Pause className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Task List */}
        <section className="flex-1 overflow-y-auto p-8 space-y-4">
          <AnimatePresence>
            {mockDownloads
              .filter(task => {
                if (activeTab === 'downloading') return task.status === 'downloading'
                if (activeTab === 'completed') return task.status === 'completed'
                return false
              })
              .map((task, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  key={task.id}
                  className="group bg-[#161618] border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Progress Glow Background */}
                  {task.status === 'downloading' && (
                    <div
                      className="absolute bottom-0 left-0 h-1 bg-blue-500/20 blur-sm transition-all duration-500"
                      style={{ width: `${task.progress}%` }}
                    />
                  )}

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/5 rounded-xl group-hover:bg-blue-500/10 transition-colors">
                      {getFileIcon(task.type)}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors truncate max-w-md">
                            {task.name}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1 uppercase">
                              {task.protocol === 'magnet' ? <Activity className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                              {task.protocol}
                            </span>
                            <span>•</span>
                            <span>{task.size} / {task.totalSize}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="text-blue-400 font-bold text-sm tracking-tight">{task.speed}</span>
                          <span className="text-[10px] text-slate-500">剩余时间: {task.timeLeft}</span>
                        </div>
                      </div>

                      {/* Progress Area */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                          <span>{task.progress}%</span>
                          <span>{task.status === 'completed' ? '已完成' : '下载中'}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${task.progress}%` }}
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              task.status === 'completed' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                        {task.status === 'downloading' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </section>

        {/* Global Progress Bar at the very bottom */}
        <div className="h-1 w-full bg-white/5">
          <div className="h-full bg-blue-600/50 w-2/3 animate-pulse" />
        </div>
      </main>
    </div>
  )
}
