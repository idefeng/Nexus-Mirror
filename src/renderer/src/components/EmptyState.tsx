import { motion } from 'framer-motion'
import { DownloadCloud } from 'lucide-react'

export function EmptyState() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 text-slate-600 gap-6"
        >
            <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
                <DownloadCloud className="w-10 h-10 opacity-20" />
            </div>
            <div className="text-center space-y-2">
                <p className="text-lg font-bold text-slate-400">准备好开始下载了吗？</p>
                <p className="text-sm font-medium opacity-50">粘贴链接、磁力链接或拖入种子文件即可</p>
            </div>
        </motion.div>
    )
}
