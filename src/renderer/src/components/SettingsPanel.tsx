import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FolderOpen, AlertCircle, Cpu, Globe, ShieldCheck, Check } from 'lucide-react'
import { cn } from '../utils/cn'

interface SettingsPanelProps {
    downloadPath: string
    onSelectPath: () => void
    isEngineConnected: boolean
    proxy: string
    onSaveProxy: (proxy: string) => void
}

export function SettingsPanel({ downloadPath, onSelectPath, isEngineConnected, proxy, onSaveProxy }: SettingsPanelProps) {
    const [enginePath, setEnginePath] = useState<string>('正在获取...')
    const [localProxy, setLocalProxy] = useState(proxy)
    const [isSaved, setIsSaved] = useState(false)

    useEffect(() => {
        window.api.aria2.getEnginePath().then(setEnginePath)
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl space-y-8"
        >
            <div className="space-y-4">
                <p className="text-slate-500 font-medium">配置您的下载引擎与联机状态</p>
            </div>

            <div className="grid gap-6">
                <div className="bg-[#141416] border border-white/[0.03] rounded-3xl p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Globe className="w-6 h-6 text-blue-500" />
                                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">网络代理 (HTTP/SOCKS5)</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className={cn("w-4 h-4", localProxy ? "text-green-500" : "text-slate-600")} />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                    {localProxy ? '代理已启用' : '直连模式'}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={localProxy}
                                onChange={(e) => {
                                    setLocalProxy(e.target.value)
                                    setIsSaved(false)
                                }}
                                placeholder="例如: http://127.0.0.1:7890"
                                className="flex-1 bg-black/20 border border-white/5 rounded-2xl px-6 py-4 text-slate-200 font-medium focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                            />
                            <button
                                onClick={() => {
                                    onSaveProxy(localProxy)
                                    setIsSaved(true)
                                    setTimeout(() => setIsSaved(false), 2000)
                                }}
                                className={cn(
                                    "px-8 rounded-2xl font-black text-sm transition-all flex items-center gap-2",
                                    isSaved
                                        ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                                )}
                            >
                                {isSaved ? <Check className="w-4 h-4" /> : null}
                                {isSaved ? '已保存' : '保存'}
                            </button>
                        </div>
                    </div>
                </div>

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

                <div className="bg-[#141416] border border-white/[0.03] rounded-3xl p-8 space-y-4">
                    <div className="flex items-center justify-between">
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
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-slate-500 group">
                            <Cpu className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">引擎二进制路径</span>
                        </div>
                        <p className="text-xs font-mono text-slate-400 break-all bg-black/20 p-2 rounded-lg border border-white/5 leading-relaxed">
                            {enginePath}
                        </p>
                    </div>
                </div>
            </div>


            <div className="space-y-6 pt-8 border-t border-white/5">
                <div className="space-y-4">
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                        关于 Nexus Mirror
                    </h2>
                    <div className="bg-[#141416] border border-white/[0.03] rounded-3xl p-8 space-y-6">
                        <p className="text-sm text-slate-400 font-medium leading-relaxed">
                            Nexus Mirror 是一款基于 Aria2 的高性能、全能型下载客户端，致力于通过现代化的 UI 设计为您提供极致美观与流畅的下载体验。
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">开源地址</p>
                                <a
                                    href="https://github.com/idefeng/Nexus-Mirror"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                                >
                                    github.com/idefeng/Nexus-Mirror
                                </a>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">开发者</p>
                                <p className="text-sm font-bold text-slate-200">idefeng <span className="text-slate-500 font-medium ml-2">(changdefeng06@gmail.com)</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
