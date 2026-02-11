import { motion } from 'framer-motion'
import { FolderOpen, AlertCircle } from 'lucide-react'
import { cn } from '../utils/cn'

interface SettingsPanelProps {
    downloadPath: string
    onSelectPath: () => void
    isEngineConnected: boolean
}

export function SettingsPanel({ downloadPath, onSelectPath, isEngineConnected }: SettingsPanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl space-y-8"
        >
            <div className="space-y-4">
                <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    核心参数配置
                </h2>
                <p className="text-slate-500 font-medium">配置您的下载引擎与联机状态</p>
            </div>

            <div className="grid gap-6">
                <div className="bg-[#141416] border border-white/[0.03] rounded-3xl p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">默认保存路径</p>
                            <p className="text-lg font-bold text-slate-200 truncate max-w-md">{downloadPath || '未设置'}</p>
                        </div>
                        <button
                            onClick={onSelectPath}
                            className="p-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white transition-all shadow-lg shadow-blue-600/20"
                        >
                            <FolderOpen className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-500/80 font-medium leading-relaxed">
                            修改下载目录后，仅对后续新创建的任务生。已经在队列中的任务将继续下载到原有的路径中。
                        </p>
                    </div>
                </div>

                <div className="bg-[#141416] border border-white/[0.03] rounded-3xl p-8 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Aria2 核心引擎</p>
                        <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", isEngineConnected ? "bg-green-500" : "bg-red-500")} />
                            <p className="text-lg font-bold text-slate-200">
                                {isEngineConnected ? '运行中 (Local:6800)' : '已断开连接'}
                            </p>
                        </div>
                    </div>
                    <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 font-bold transition-all border border-white/5">
                        检查更新
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
