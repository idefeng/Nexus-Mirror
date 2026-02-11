import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, X, Zap } from 'lucide-react'

interface SearchInputProps {
    searchQuery: string
    setSearchQuery: (val: string) => void
    onAdd: (url?: string) => void
    detectedUrl: string | null
    setDetectedUrl: (url: string | null) => void
}

export function SearchInput({ searchQuery, setSearchQuery, onAdd, detectedUrl, setDetectedUrl }: SearchInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onAdd()
        }
    }

    return (
        <div className="relative mb-12">
            <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-all duration-700 opacity-0 group-hover:opacity-100" />
                <div className="relative bg-[#141416]/80 backdrop-blur-3xl border border-white/[0.05] p-2 rounded-[32px] flex items-center gap-4 shadow-2xl transition-all duration-500 hover:border-blue-500/30">
                    <div className="pl-6 group-focus-within:text-blue-400 transition-colors">
                        <Search className="w-6 h-6 opacity-30 group-focus-within:opacity-100" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="粘贴磁力链接、HTTP/HTTPS 地址或种子文件路径..."
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-600 font-bold text-lg py-4"
                    />
                    <button
                        onClick={() => onAdd()}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-[24px] font-black text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>解析并添加</span>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {detectedUrl && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute left-0 right-0 top-full mt-4 z-40 bg-blue-600 p-4 rounded-3xl flex items-center justify-between gap-4 shadow-2xl shadow-blue-600/40"
                    >
                        <div className="flex items-center gap-4 text-white overflow-hidden">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-sm uppercase tracking-widest opacity-70">Detected Link</p>
                                <p className="font-bold truncate text-sm">{detectedUrl}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={() => setDetectedUrl(null)}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                            <button
                                onClick={() => {
                                    onAdd(detectedUrl)
                                }}
                                className="px-6 py-3 bg-white text-blue-600 rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95"
                            >
                                导入任务
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
