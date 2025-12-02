interface PumpStatusBadgeProps {
  status: string
}

export default function PumpStatusBadge({ status }: PumpStatusBadgeProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'on':
        return 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-lg shadow-green-500/50 animate-pulse'
      case 'off':
        return 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200'
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/50 animate-pulse'
      default:
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-yellow-500/50'
    }
  }

  const getIcon = (status: string) => {
    switch (status) {
      case 'on':
        return '💧'
      case 'off':
        return '⭕'
      case 'error':
        return '⚠️'
      default:
        return '🔄'
    }
  }

  return (
    <div className="relative">
      <div className={`
        px-4 py-2 rounded-full text-sm font-bold 
        flex items-center space-x-2 
        ${getStatusStyle(status)} 
        transition-all duration-300
        ripple-effect
      `}>
        <span className="text-lg">{getIcon(status)}</span>
        <span className="uppercase tracking-wider">{status}</span>
      </div>
      
      {status === 'on' && (
        <div className="absolute inset-0 rounded-full bg-green-400/30 animate-ping"></div>
      )}
    </div>
  )
}
