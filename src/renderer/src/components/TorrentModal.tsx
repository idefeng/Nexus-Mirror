import { motion } from 'framer-motion'
import { X, CheckSquare, Square, File } from 'lucide-react'
import { Aria2Task } from '../hooks/useAria2'
import { formatSize } from '../utils/format'
import { cn } from '../utils/cn'

interface TorrentModalProps {
    previewTask: Aria2Task | null
    selectedFileIndexes: number[]
    onCancel: () => void
    onConfirm: () => void
    onToggleFile: (index: number) => void
}

export function TorrentModal({ previewTask, selectedFileIndexes, onCancel, onConfirm, onToggleFile }: TorrentModalProps) {
    if (!previewTask) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onCancel}
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
                        onClick={onCancel}
                        className="shrink-0 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
                    {previewTask.files.map((file, index) => {
                        const idx = index + 1
                        const isSelected = selectedFileIndexes.includes(idx)
                        const fileName = file.path.split(/[/\\]/).pop() || 'Unknown File'

                        return (
                            <button
                                key={index}
                                onClick={() => onToggleFile(idx)}
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
                            {formatSize(previewTask.files.filter((_, i) => selectedFileIndexes.includes(i + 1)).reduce((acc, f) => acc + parseInt(f.length), 0))}
                        </span>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onCancel}
                            className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all text-slate-300"
                        >
                            取消
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-10 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
                        >
                            开启高速下载
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
