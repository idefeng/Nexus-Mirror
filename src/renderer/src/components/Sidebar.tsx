import { useState, useEffect } from 'react'
import { DownloadCloud, CheckCircle, Trash2, Settings } from 'lucide-react'
import { cn } from '../utils/cn'
import logo from '../assets/icon.png'

interface SidebarProps {
    activeTab: string
    setActiveTab: (tab: any) => void
    taskCounts: {
        downloading: number
        completed: number
        trash: number
    }
}

export function Sidebar({ activeTab, setActiveTab, taskCounts }: SidebarProps) {
    const [version, setVersion] = useState<string>('0.0.0')

    useEffect(() => {
        window.api.app.getVersion().then(setVersion)
    }, [])

    const sidebarItems = [
        { id: 'downloading', icon: DownloadCloud, label: '正在下载', count: taskCounts.downloading, color: 'text-blue-400' },
        { id: 'completed', icon: CheckCircle, label: '已完成', count: taskCounts.completed, color: 'text-green-400' },
        { id: 'trash', icon: Trash2, label: '垃圾箱', count: taskCounts.trash, color: 'text-red-400' },
        { id: 'settings', icon: Settings, label: '参数设置', count: 0, color: 'text-slate-400' }
    ]

    return (
        <aside className="w-72 border-r border-white/5 bg-[#0a0a0b]/50 backdrop-blur-xl flex flex-col">
            <div className="p-8">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center shadow-lg shadow-white/5 border border-white/5 overflow-hidden">
                        <img src={logo} alt="Logo" className="w-7 h-7 object-contain" />
                    </div>
                    <div>
                        <h1 className="font-black text-xl tracking-tighter bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                            NEXUS MIRROR
                        </h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Engine Online</span>
                        </div>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1.5">
                {sidebarItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                            "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
                            activeTab === item.id
                                ? "bg-blue-600/10 text-white shadow-sm shadow-blue-600/5 border border-blue-500/20"
                                : "text-slate-500 hover:bg-white/[0.03] hover:text-slate-300 border border-transparent"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon className={cn(
                                "w-5 h-5",
                                activeTab === item.id ? item.color : "text-slate-600 group-hover:text-slate-400"
                            )} />
                            <span className="font-bold text-sm">{item.label}</span>
                        </div>
                        {item.count > 0 && (
                            <span className={cn(
                                "px-2 py-0.5 rounded-lg text-[10px] font-black tabular-nums border",
                                activeTab === item.id
                                    ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                                    : "bg-white/5 border-white/5 text-slate-600"
                            )}>
                                {item.count}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            <div className="p-8 mt-auto border-t border-white/5">
                <div className="flex items-center justify-between opacity-40 hover:opacity-100 transition-opacity duration-300">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">Version</p>
                        <p className="text-xs font-bold text-slate-300 tabular-nums">{version}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">Stable</p>
                        <p className="text-[10px] font-bold text-green-500 uppercase">Released</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}
