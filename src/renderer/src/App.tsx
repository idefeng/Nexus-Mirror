import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Settings, Plus, X, Minus, Square } from 'lucide-react'
import { useAria2 } from './hooks/useAria2'
import { Sidebar } from './components/Sidebar'
import { TaskCard } from './components/TaskCard'
import { EmptyState } from './components/EmptyState'
import { SettingsPanel } from './components/SettingsPanel'
import { AddTaskModal } from './components/AddTaskModal'
import { formatSpeed } from './utils/format'
import { cn } from './utils/cn'

export default function App() {
  const [activeTab, setActiveTab] = useState<'downloading' | 'completed' | 'trash' | 'settings'>('downloading')
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null)
  const [downloadPath, setDownloadPath] = useState(localStorage.getItem('download-path') || '')

  const {
    tasks,
    globalStats,
    isEngineConnected,
    previewTask,
    selectedFileIndexes,
    startPreviewPolling,
    cancelPreview,
    toggleFileSelection,
    fetchTasks
  } = useAria2()

  // --- Handlers ---
  const handleSelectPath = async () => {
    const path = await window.api.dialog.openDirectory()
    if (path) {
      setDownloadPath(path)
    }
  }

  const handleAddNewTask = async (url: string, path: string) => {
    if (!url.startsWith('http') && !url.startsWith('magnet')) return

    try {
      // Add with the specified path, start immediately
      await window.api.aria2.addUri([url], { pause: 'false', dir: path })

      setIsAddTaskModalOpen(false)
      setActiveTab('downloading')
      setDetectedUrl(null)
      fetchTasks()
    } catch (error) {
      alert('添加任务失败，请检查链接是否正确')
    }
  }

  const handleConfirmTorrent = async (path: string) => {
    if (!previewTask) return
    const selectFiles = selectedFileIndexes.join(',')
    try {
      await window.api.aria2.changeOption(previewTask.gid, { 'select-file': selectFiles, 'dir': path })
      await window.api.aria2.unpause(previewTask.gid)
      setIsAddTaskModalOpen(false)
      fetchTasks()
    } catch (err) {
      console.error('Confirm download error:', err)
    }
  }

  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'downloading':
        return tasks.filter((t) => t.status === 'active' || t.status === 'waiting' || t.status === 'paused' || t.status === 'error')
      case 'completed':
        return tasks.filter((t) => t.status === 'complete')
      case 'trash':
        return tasks.filter((t) => t.status === 'removed' || t.status === 'error')
      default:
        return []
    }
  }

  const taskCounts = {
    downloading: tasks.filter(t => t.status === 'active' || t.status === 'waiting' || t.status === 'paused').length,
    completed: tasks.filter(t => t.status === 'complete').length,
    trash: tasks.filter(t => t.status === 'removed' || t.status === 'error').length
  }

  // --- Effects ---
  useEffect(() => {
    if (downloadPath) {
      window.api.aria2.changeGlobalOption({ dir: downloadPath })
      localStorage.setItem('download-path', downloadPath)
    }
  }, [downloadPath])

  useEffect(() => {
    window.api.events.onClipboardDetected((url) => {
      setDetectedUrl(url)
      setIsAddTaskModalOpen(true) // Automatically open modal on link detection
    })
  }, [])

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => e.preventDefault()
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer?.files || [])
      files.forEach((file) => {
        if (file.name.endsWith('.torrent')) {
          const reader = new FileReader()
          reader.onload = async () => {
            const base64 = (reader.result as string).split(',')[1]
            try {
              setIsAddTaskModalOpen(true)
              const gid = await window.api.aria2.addTorrent(base64, [], { pause: 'true', dir: downloadPath })
              startPreviewPolling(gid)
            } catch (err) {
              alert('解析种子失败')
            }
          }
          reader.readAsDataURL(file)
        }
      })
    }
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)
    return () => {
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [downloadPath])

  return (
    <div className="flex bg-[#0a0a0b] text-slate-200 h-screen w-screen overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        taskCounts={taskCounts}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e] relative drag">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {/* Window Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-1 z-[100] no-drag">
          <button
            onClick={() => window.api.app.minimize()}
            className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all focus:outline-none"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.api.app.maximize()}
            className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all focus:outline-none"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => window.api.app.close()}
            className="p-2 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-500 transition-all focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <header className="p-12 pb-0 flex flex-wrap items-center justify-between gap-8 relative z-10">
          <div className="min-w-[400px] flex-1">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase shrink-0">
                {activeTab === 'downloading' ? '正在下载' :
                  activeTab === 'completed' ? '已完成' :
                    activeTab === 'trash' ? '垃圾箱' : '参数设置'}
              </h1>
              <div className="h-px bg-white/5 flex-1 mx-4 hidden md:block" />
              <button
                onClick={() => setIsAddTaskModalOpen(true)}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-[24px] font-black text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shrink-0 no-drag"
              >
                <Plus className="w-6 h-6" />
                <span className="hidden sm:inline">添加下载</span>
                <span className="sm:hidden">添加</span>
              </button>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-6">
            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                "p-4 rounded-2xl transition-all duration-300 no-drag group",
                activeTab === 'settings' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              )}
            >
              <Settings className="w-6 h-6 rotate-0 group-hover:rotate-45 transition-transform duration-500" />
            </button>
            <div className="w-[160px] text-right shrink-0">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Total Speed</p>
              <p className="text-2xl font-black text-blue-400 tabular-nums leading-none">
                {formatSpeed(globalStats.downloadSpeed)}
              </p>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-12 pb-12 pt-8 custom-scrollbar relative z-10">
          {activeTab === 'settings' ? (
            <SettingsPanel
              downloadPath={downloadPath}
              isEngineConnected={isEngineConnected}
              onSelectPath={handleSelectPath}
            />
          ) : (
            <motion.div layout className="flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {getFilteredTasks().map((task) => (
                  <TaskCard
                    key={task.gid}
                    task={task}
                    onPause={(gid) => window.api.aria2.pause(gid)}
                    onResume={(gid) => window.api.aria2.unpause(gid)}
                    onRetry={async (gid) => {
                      await window.api.aria2.retry(gid)
                      fetchTasks()
                    }}
                    onRemove={async (gid) => {
                      if (activeTab === 'trash' || activeTab === 'completed') {
                        await window.api.aria2.removePermanently(gid)
                      } else {
                        await window.api.aria2.remove(gid)
                      }
                      fetchTasks()
                    }}
                    onOpenFolder={(path) => window.api.shell.showInFolder(path)}
                  />
                ))}
              </AnimatePresence>
              {getFilteredTasks().length === 0 && <EmptyState />}
            </motion.div>
          )}
        </section>

        <div className="h-1 w-full bg-white/[0.02] shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
          <div
            className="h-full bg-blue-600/60 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all duration-1000"
            style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'complete').length / tasks.length) * 100 : 0}%` }}
          />
        </div>

        <AnimatePresence>
          {isAddTaskModalOpen && (
            <AddTaskModal
              isOpen={isAddTaskModalOpen}
              onClose={() => {
                setIsAddTaskModalOpen(false)
                setDetectedUrl(null)
              }}
              onAdd={handleAddNewTask}
              downloadPath={downloadPath}
              previewTask={previewTask}
              selectedFileIndexes={selectedFileIndexes}
              onToggleFile={toggleFileSelection}
              onConfirmTorrent={handleConfirmTorrent}
              cancelPreview={cancelPreview}
              initialUrl={detectedUrl || ''}
            />
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
      `}</style>
    </div >
  )
}
