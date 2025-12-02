interface PumpStatusBadgeProps {
  status: string
}

export default function PumpStatusBadge({ status }: PumpStatusBadgeProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'on':
        return 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg animate-pulse'
      case 'off':
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700'
      case 'error':
        return 'bg-gradient-to-r from-red-400 to-red-500 text-white shadow-lg'
      default:
        return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
    }
  }

  const getIcon = (status: string) => {
    switch (status) {
      case 'on':
        return '🟢'
      case 'off':
        return '⚫'
      case 'error':
        return '🔴'
      default:
        return '🟡'
    }
  }

  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1 ${getStatusStyle(status)} transition-all duration-300`}>
      <span>{getIcon(status)}</span>
      <span>{status.toUpperCase()}</span>
    </span>
  )
}
