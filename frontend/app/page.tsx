'use client'

import { useState, useEffect } from 'react'
import Card from './components/Card'
import PumpStatusBadge from './components/PumpStatusBadge'
import ActivityFeed from './components/ActivityFeed'
import { Play, Square, DollarSign, Gauge, Brain, Bell, Zap, Settings } from 'lucide-react'

export default function Dashboard() {
  const [status, setStatus] = useState({ pumps: {}, payments: 0, reasoning: 0, notifications: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/status`)
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch status:', error)
    }
  }

  const sendCommand = async (command: string, params: any) => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, params })
      })
      const result = await response.json()
      console.log('Command result:', result)
      fetchStatus()
    } catch (error) {
      console.error('Command failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const simulatePayment = async (amount: number) => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/simulate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, customer: `user_${Date.now()}` })
      })
      const result = await response.json()
      console.log('Payment result:', result)
      fetchStatus()
    } catch (error) {
      console.error('Payment failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
          FlowFli Dashboard
        </h1>
        <p className="text-gray-600">AI-powered water management system</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Pump Status" icon={<Gauge className="h-5 w-5" />}>
          <div className="space-y-4">
            {Object.entries(status.pumps).map(([pump, state]) => (
              <div key={pump} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-700">{pump.toUpperCase()}</span>
                </div>
                <PumpStatusBadge status={state as string} />
              </div>
            ))}
          </div>
        </Card>

        <Card title="System Stats" icon={<Brain className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-lg">
              <span className="text-gray-600">Payments</span>
              <span className="text-2xl font-bold text-blue-600">{status.payments}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50/50 rounded-lg">
              <span className="text-gray-600">AI Decisions</span>
              <span className="text-2xl font-bold text-green-600">{status.reasoning}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50/50 rounded-lg">
              <span className="text-gray-600">Notifications</span>
              <span className="text-2xl font-bold text-purple-600">{status.notifications}</span>
            </div>
          </div>
        </Card>

        <Card title="Manual Control" icon={<Settings className="h-5 w-5" />}>
          <div className="space-y-3">
            <button
              onClick={() => sendCommand('activate_pump', { pumpId: 'pump1' })}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Play className="h-4 w-4" />
              <span>Start Pump 1</span>
            </button>
            <button
              onClick={() => sendCommand('stop_pump', { pumpId: 'pump1' })}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Square className="h-4 w-4" />
              <span>Stop Pump 1</span>
            </button>
          </div>
        </Card>

        <Card title="Quick Actions" icon={<Zap className="h-5 w-5" />}>
          <div className="space-y-3">
            <button
              onClick={() => simulatePayment(25)}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <DollarSign className="h-4 w-4" />
              <span>Test $25</span>
            </button>
            <button
              onClick={() => simulatePayment(50)}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-3 rounded-lg hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <DollarSign className="h-4 w-4" />
              <span>Test $50</span>
            </button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Live Activity Feed" icon={<Bell className="h-5 w-5" />} className="lg:col-span-1">
          <ActivityFeed />
        </Card>
        
        <Card title="Payment Testing" icon={<DollarSign className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => simulatePayment(25)}
                disabled={loading}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-3 rounded-lg hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <DollarSign className="h-4 w-4" />
                <span>$25</span>
              </button>
              <button
                onClick={() => simulatePayment(50)}
                disabled={loading}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <DollarSign className="h-4 w-4" />
                <span>$50</span>
              </button>
            </div>
            <button
              onClick={() => simulatePayment(10)}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <DollarSign className="h-4 w-4" />
              <span>$10 (Invalid Test)</span>
            </button>
            <div className="text-xs text-gray-500 text-center mt-2">
              Minimum payment: $25 • Each $25 = 30min pump time
            </div>
          </div>
        </Card>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
