import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderOpen, CheckSquare, Square, File, Download, Link2, Activity, Zap, Search } from 'lucide-react'
import { Aria2Task } from '../hooks/useAria2'
import { formatSize } from '../utils/format'
import { cn } from '../utils/cn'

interface AddTaskModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd: (url: string, path: string) => void
    downloadPath: string
    previewTask: Aria2Task | null
    selectedFileIndexes: number[]
    onToggleFile: (index: number) => void
    onConfirmTorrent: (path: string) => void
    cancelPreview: () => void
    initialUrl?: string // Pre-filled URL (e.g. from clipboard)
}

const getCategoryByExtension = (url: string) => {
    try {
        const pathPart = url.split('?')[0].split(/[/\\]/).pop() || ''
        const ext = pathPart.split('.').pop()?.toLowerCase()
        if (!ext) return null

        if (['mp4', 'mkv', 'avi', 'mov', 'flv', 'wmv'].includes(ext)) return '视频'
        if (['zip', '7z', 'rar', 'tar', 'gz', 'bz2'].includes(ext)) return '压缩包'
        if (['mp3', 'flac', 'wav', 'aac', 'm4a'].includes(ext)) return '音乐'
        if (['exe', 'msi', 'dmg', 'pkg', 'apk'].includes(ext)) return '软件'
        if (['txt', 'doc', 'docx', 'xls', 'xlsx', 'pdf', 'ppt', 'pptx'].includes(ext)) return '文档'
        return null
    } catch { return null }
}

export function AddTaskModal({
    isOpen,
    onClose,
    onAdd,
    downloadPath,
    previewTask,
    selectedFileIndexes,
    onToggleFile,
    onConfirmTorrent,
    cancelPreview,
    initialUrl = ''
}: AddTaskModalProps) {
    const [url, setUrl] = useState(initialUrl)
    const [customPath, setCustomPath] = useState(downloadPath)
    const [isParsing, setIsParsing] = useState(false)
    const [isAutoSuggested, setIsAutoSuggested] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setCustomPath(downloadPath)
            setIsAutoSuggested(false)
            if (!previewTask) {
                setUrl(initialUrl)
                setIsParsing(false)
            }
        }
    }, [isOpen, downloadPath, previewTask, initialUrl])

    // Intelligent categorization effect
    useEffect(() => {
        if (!url || previewTask) return

        const category = getCategoryByExtension(url)
        if (category) {
            const separator = downloadPath.includes('\\') ? '\\' : '/'
            const newPath = downloadPath.endsWith(separator)
                ? `${downloadPath}${category}`
                : `${downloadPath}${separator}${category}`
            setCustomPath(newPath)
            setIsAutoSuggested(true)
        } else {
            setCustomPath(downloadPath)
            setIsAutoSuggested(false)
        }
    }, [url, downloadPath, previewTask])

    const handleSelectPath = async () => {
        const path = await window.api.dialog.openDirectory()
        if (path) {
            setCustomPath(path)
            setIsAutoSuggested(false) // User override
        }
    }

    const handleStart = () => {
        if (!url.trim()) return
        setIsParsing(true)
        onAdd(url, customPath)
    }

    const handleConfirmTorrent = () => {
        onConfirmTorrent(customPath)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                    if (previewTask) cancelPreview()
                    onClose()
                }}
                className="absolute inset-0 bg-[#000]/60 backdrop-blur-xl"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative bg-[#1a1a1e]/90 border border-white/10 rounded-[40px] w-full max-w-2xl overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh] backdrop-blur-3xl"
            >
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] block">Nexus Engine</span>
                        <h2 className="text-2xl font-black text-white">
                            {previewTask ? '配置任务内容' : '新建下载任务'}
                        </h2>
                    </div>
                    <button
                        onClick={() => {
                            if (previewTask) cancelPreview()
                            onClose()
                        }}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                    {/* URL Input Stage or Preview Info Block */}
                    {!previewTask ? (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">下载链接 / 磁力链接</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-6 flex items-center text-slate-500 group-focus-within:text-blue-500 transition-colors">
                                        <Link2 className="w-5 h-5" />
                                    </div>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="粘贴下载地址或磁力链接..."
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-[24px] py-6 pl-16 pr-8 text-white font-bold text-lg placeholder:text-slate-700 outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all"
                                    />
                                </div>
                            </div>

                            {/* Save Path Option */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between pl-1">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">保存到</label>
                                    <AnimatePresence>
                                        {isAutoSuggested && (
                                            <motion.span
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="text-[10px] font-bold text-blue-400 flex items-center gap-1"
                                            >
                                                <Zap className="w-3 h-3" />
                                                已为您自动选择分类目录
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-[24px] py-4 px-6 flex items-center gap-3 overflow-hidden group hover:border-white/10 transition-all cursor-pointer" onClick={handleSelectPath}>
                                        <FolderOpen className="w-5 h-5 text-slate-500 shrink-0" />
                                        <span className="text-slate-300 font-bold text-sm truncate">{customPath}</span>
                                    </div>
                                    <button
                                        onClick={handleSelectPath}
                                        className="p-4 bg-white/5 hover:bg-white/10 rounded-[20px] text-slate-400 hover:text-white transition-all border border-white/5"
                                    >
                                        <Search className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Torrent Data Info */}
                            <div className="bg-blue-600/5 border border-blue-500/10 rounded-[32px] p-6 flex items-start gap-4">
                                <div className="p-4 bg-blue-600/10 rounded-[20px] text-blue-500">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest mb-1">资源名称</p>
                                    <h3 className="text-lg font-black text-white truncate leading-tight">
                                        {previewTask.bittorrent?.info?.name || 'Torrent Metadata'}
                                    </h3>
                                </div>
                            </div>

                            {/* File List */}
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">选择下载文件 ({previewTask.files.length})</label>
                                <div className="grid gap-2">
                                    {previewTask.files.map((file, index) => {
                                        const idx = index + 1
                                        const isSelected = selectedFileIndexes.includes(idx)
                                        const fileName = file.path.split(/[/\\]/).pop() || 'Unknown File'
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => onToggleFile(idx)}
                                                className={cn(
                                                    "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border text-left",
                                                    isSelected
                                                        ? "bg-blue-600/10 border-blue-500/30 text-white"
                                                        : "bg-white/[0.02] border-transparent text-slate-500 hover:bg-white/5"
                                                )}
                                            >
                                                {isSelected ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5 opacity-40" />}
                                                <File className={cn("w-5 h-5 shrink-0", isSelected ? "text-blue-400" : "opacity-30")} />
                                                <span className="flex-1 text-sm font-bold truncate">{fileName}</span>
                                                <span className="tabular-nums font-mono text-[10px] opacity-40">{formatSize(file.length)}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Save Path (Also in Torrent Stage) */}
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">验证保存路径</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-[24px] py-4 px-6 flex items-center gap-3 overflow-hidden group hover:border-white/10 transition-all cursor-pointer" onClick={handleSelectPath}>
                                        <FolderOpen className="w-5 h-5 text-slate-500 shrink-0" />
                                        <span className="text-slate-300 font-bold text-sm truncate">{customPath}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-white/[0.02] border-t border-white/5 flex items-center justify-between gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            {previewTask ? '总计大小' : '预估速度限制'}
                        </span>
                        <span className="text-xl font-black text-white tabular-nums">
                            {previewTask
                                ? formatSize(previewTask.files.filter((_, i) => selectedFileIndexes.includes(i + 1)).reduce((acc, f) => acc + parseInt(f.length), 0))
                                : 'UNLIMITED'
                            }
                        </span>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                if (previewTask) cancelPreview()
                                onClose()
                            }}
                            className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all text-slate-300"
                        >
                            取消
                        </button>
                        <button
                            disabled={!previewTask && (!url || isParsing)}
                            onClick={previewTask ? handleConfirmTorrent : handleStart}
                            className={cn(
                                "px-10 py-4 rounded-[20px] font-black text-white shadow-xl transition-all flex items-center gap-2",
                                (!url && !previewTask) || isParsing
                                    ? "bg-slate-700 opacity-50 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30 hover:scale-105 active:scale-95"
                            )}
                        >
                            {isParsing && !previewTask ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                >
                                    <Zap className="w-5 h-5" />
                                </motion.div>
                            ) : <Download className="w-5 h-5" />}
                            <span>{previewTask ? '确认开启下载' : (isParsing ? '正在准备...' : '开始下载')}</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
