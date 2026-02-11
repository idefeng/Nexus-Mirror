export const formatSize = (bytes: string | number) => {
  const b = typeof bytes === 'string' ? parseInt(bytes) : bytes
  if (isNaN(b) || b === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(b) / Math.log(k))
  return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatSpeed = (bytesPerSec: string | number) => {
  const s = formatSize(bytesPerSec)
  return s === '0 B' ? '0 B/s' : `${s}/s`
}
