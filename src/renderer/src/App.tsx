import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Settings } from 'lucide-react'
import { useAria2 } from './hooks/useAria2'
import { Sidebar } from './components/Sidebar'
import { SearchInput } from './components/SearchInput'
import { TaskCard } from './components/TaskCard'
import { TorrentModal } from './components/TorrentModal'
import { EmptyState } from './components/EmptyState'
import { SettingsPanel } from './components/SettingsPanel'
import { formatSpeed } from './utils/format'
import { cn } from './utils/cn'

export default function App() {
  const [activeTab, setActiveTab] = useState<'downloading' | 'completed' | 'trash' | 'settings'>('downloading')
  const [searchQuery, setSearchQuery] = useState('')
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
    confirmDownload,
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

  const handleAddUri = async (urlOverride?: string) => {
    const url = (urlOverride || searchQuery).trim()
    if (!url.startsWith('http') && !url.startsWith('magnet')) return

    try {
      const gid = await window.api.aria2.addUri([url], { pause: 'true' })
      if (url.startsWith('magnet')) {
        startPreviewPolling(gid)
      } else {
        await window.api.aria2.unpause(gid)
      }
      setSearchQuery('')
      setDetectedUrl(null)
      fetchTasks()
    } catch (error) {
      alert('添加任务失败，请检查链接是否正确')
    }
  }

  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'downloading':
        return tasks.filter((t) => t.status === 'active' || t.status === 'waiting' || t.status === 'paused')
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
              const gid = await window.api.aria2.addTorrent(base64, [], { pause: 'true' })
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
  }, [])

  return (
    <div className="flex bg-[#0a0a0b] text-slate-200 h-screen w-screen overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        taskCounts={taskCounts}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e] relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

        <header className="p-12 pb-0 flex items-center justify-between gap-12 relative z-10">
          <div className="flex-1">
            <SearchInput
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              detectedUrl={detectedUrl}
              setDetectedUrl={setDetectedUrl}
              onAdd={handleAddUri}
            />
          </div>
          <div className="shrink-0 flex items-center gap-6 pb-12">
            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                "p-4 rounded-2xl transition-all duration-300",
                activeTab === 'settings' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              )}
            >
              <Settings className="w-6 h-6" />
            </button>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Total Speed</p>
              <p className="text-2xl font-black text-blue-400 tabular-nums leading-none">
                {formatSpeed(globalStats.downloadSpeed)}
              </p>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-12 pb-12 custom-scrollbar relative z-10">
          {activeTab === 'settings' ? (
            <SettingsPanel
              downloadPath={downloadPath}
              isEngineConnected={isEngineConnected}
              onSelectPath={handleSelectPath}
            />
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {getFilteredTasks().map((task) => (
                  <TaskCard
                    key={task.gid}
                    task={task}
                    onPause={(gid) => window.api.aria2.pause(gid)}
                    onResume={(gid) => window.api.aria2.unpause(gid)}
                    onRemove={(gid) => window.api.aria2.remove(gid)}
                    onOpenFolder={(path) => window.api.shell.showInFolder(path)}
                  />
                ))}
              </AnimatePresence>
              {getFilteredTasks().length === 0 && <EmptyState />}
            </div>
          )}
        </section>

        <div className="h-1 w-full bg-white/[0.02] shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
          <div
            className="h-full bg-blue-600/60 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all duration-1000"
            style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'complete').length / tasks.length) * 100 : 0}%` }}
          />
        </div>

        <AnimatePresence>
          {previewTask && (
            <TorrentModal
              previewTask={previewTask}
              selectedFileIndexes={selectedFileIndexes}
              onCancel={cancelPreview}
              onConfirm={confirmDownload}
              onToggleFile={toggleFileSelection}
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
    </div>
  )
}
