'use client'

import { useState, useEffect } from 'react'
import { Clock, TrendingUp, Zap } from 'lucide-react'

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
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'reasoning':
        return <Zap className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getActivityBg = (type: string) => {
    switch (type) {
      case 'payment':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400'
      case 'reasoning':
        return 'bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-400'
      default:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-300'
    }
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No recent activity</p>
          <p className="text-xs text-gray-400 mt-1">Activity will appear here as the system processes payments</p>
        </div>
      ) : (
        activities.map((activity, index) => (
          <div key={index} className={`p-4 rounded-lg ${getActivityBg(activity.type)} transition-all duration-200 hover:shadow-md`}>
            <div className="flex items-start space-x-3">
              {getActivityIcon(activity.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-relaxed">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(activity.timestamp).toLocaleString()}</span>
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
