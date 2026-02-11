import { motion } from 'framer-motion'
import { Activity, Globe, Play, Pause, Trash2, FolderOpen, RotateCcw, AlertCircle, Video, Music, Archive, FileText } from 'lucide-react'
import { Aria2Task } from '../hooks/useAria2'
import { formatSize, formatSpeed } from '../utils/format'
import { cn } from '../utils/cn'

interface TaskCardProps {
    task: Aria2Task
    onPause: (gid: string) => void
    onResume: (gid: string) => void
    onRemove: (gid: string) => void
    onOpenFolder: (path: string) => void
}

const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) return <Video className="w-5 h-5 text-purple-400" />
    if (['mp3', 'wav', 'flac', 'aac'].includes(ext)) return <Music className="w-5 h-5 text-pink-400" />
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <Archive className="w-5 h-5 text-amber-400" />
    return <FileText className="w-5 h-5 text-blue-400" />
}

export function TaskCard({ task, onPause, onResume, onRemove, onOpenFolder }: TaskCardProps) {
    const name = task.bittorrent?.info?.name || task.files[0]?.path?.split(/[/\\]/).pop() || task.files[0]?.uris[0]?.uri?.split('/').pop() || 'Nexus Metadata...'
    const progress = task.totalLength === '0' ? 0 : Math.round((parseInt(task.completedLength) / parseInt(task.totalLength)) * 100)
    const isBT = !!task.bittorrent

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group bg-[#141416] border border-white/[0.03] rounded-3xl p-6 hover:border-blue-500/40 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 relative overflow-hidden"
        >
            <div className="flex items-center gap-6">
                <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl group-hover:bg-blue-500/40 transition-all duration-500 opacity-0 group-hover:opacity-100" />
                    <div className="relative p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-all duration-500 text-blue-400">
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
                                <span className="tabular-nums">
                                    {formatSize(task.completedLength)} <span className="text-slate-700 mx-1">/</span> {formatSize(task.totalLength)}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 gap-1">
                            <div className="text-blue-400 font-black text-lg tabular-nums flex items-baseline gap-1">
                                {task.status === 'active' ? formatSpeed(task.downloadSpeed) : task.status.toUpperCase()}
                            </div>
                            <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
                                Status / Speed
                            </span>
                        </div>
                    </div>

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

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 shrink-0">
                    {task.status === 'error' && (
                        <button
                            onClick={() => onResume(task.gid)}
                            className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-red-500 transition-all border border-red-500/20"
                            title="重试"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    )}
                    {task.status === 'complete' && (
                        <button
                            onClick={() => onOpenFolder(task.files[0].path)}
                            className="p-3 bg-green-500/10 hover:bg-green-500/20 rounded-2xl text-green-500 transition-all border border-green-500/20"
                            title="打开文件夹"
                        >
                            <FolderOpen className="w-5 h-5" />
                        </button>
                    )}
                    {task.status !== 'complete' && task.status !== 'error' && (
                        <button
                            onClick={() => task.status === 'paused' ? onResume(task.gid) : onPause(task.gid)}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/[0.05]"
                        >
                            {task.status === 'paused' ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                        </button>
                    )}
                    <button
                        onClick={() => onRemove(task.gid)}
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
}
