'use client'

import { useState, useEffect } from 'react'
import { Clock, TrendingUp, Zap, Sparkles } from 'lucide-react'

interface Activity {
  timestamp: string
  type: string
  message: string
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    fetchActivities()
    const interval = setInterval(fetchActivities, 3000)
    return () => clearInterval(interval)
  }, [])

  const fetchActivities = async () => {
    try {
      const [payments, reasoning, notifications] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/logs/payments`).then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/logs/reasoning`).then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/logs/notifications`).then(r => r.json())
      ])

      const combined = [
        ...payments.map((p: any) => ({
          timestamp: p.timestamp,
          type: 'payment',
          message: `💰 Payment: $${p.amount} from ${p.customer} - ${p.processed ? 'Processed' : 'Failed'}`
        })),
        ...reasoning.map((r: any) => ({
          timestamp: r.timestamp,
          type: 'reasoning',
          message: `🤖 AI: ${r.reasoning.substring(0, 80)}...`
        })),
        ...notifications.map((n: any) => ({
          timestamp: n.timestamp,
          type: n.type,
          message: `📢 ${n.message}`
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setActivities(combined.slice(0, 10))
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <TrendingUp className="h-5 w-5 text-emerald-400" />
      case 'reasoning':
        return <Zap className="h-5 w-5 text-blue-400" />
      default:
        return <Sparkles className="h-5 w-5 text-purple-400" />
    }
  }

  const getActivityBg = (type: string) => {
    switch (type) {
      case 'payment':
        return 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-l-4 border-emerald-400'
      case 'reasoning':
        return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-l-4 border-blue-400'
      default:
        return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-l-4 border-purple-400'
    }
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="relative">
            <div className="w-20 h-20 glass-morphism rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-10 w-10 text-gray-400" />
            </div>
            <div className="absolute inset-0 w-20 h-20 border-2 border-blue-400/30 rounded-full animate-ping mx-auto"></div>
          </div>
          <p className="text-gray-300 text-lg font-semibold">Waiting for Activity</p>
          <p className="text-gray-400 text-sm mt-2">Real-time events will appear here as they happen</p>
        </div>
      ) : (
        activities.map((activity, index) => (
          <div 
            key={index} 
            className={`glass-morphism p-4 rounded-xl ${getActivityBg(activity.type)} transition-all duration-500 hover:scale-105 hover:shadow-xl`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start space-x-4">
              <div className="relative">
                <div className="p-2 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium leading-relaxed mb-2">
                  {activity.message}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(activity.timestamp).toLocaleString()}</span>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="capitalize">{activity.type}</span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
      `}</style>
    </div>
  )
}
