'use client'

import { useState, useEffect } from 'react'
import Card from './components/Card'
import PumpStatusBadge from './components/PumpStatusBadge'
import ActivityFeed from './components/ActivityFeed'
import { Play, Square, DollarSign, Gauge, Brain, Bell, Zap, Settings, Droplets, TrendingUp, Activity } from 'lucide-react'

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
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur-2xl opacity-50 animate-pulse"></div>
          <h1 className="relative text-6xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            FlowFli Dashboard
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Revolutionary AI-powered water management system with blockchain integration
        </p>
        <div className="flex justify-center space-x-4 mt-6">
          <div className="glass-morphism px-4 py-2 rounded-full">
            <span className="text-green-400 font-semibold">🟢 System Online</span>
          </div>
          <div className="glass-morphism px-4 py-2 rounded-full">
            <span className="text-blue-400 font-semibold">🤖 AI Active</span>
          </div>
          <div className="glass-morphism px-4 py-2 rounded-full">
            <span className="text-purple-400 font-semibold">⛓️ Blockchain Ready</span>
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Pump Control" icon={<Droplets className="h-6 w-6" />} glowing={Object.values(status.pumps).includes('on')}>
          <div className="space-y-4">
            {Object.entries(status.pumps).map(([pump, state]) => (
              <div key={pump} className="glass-morphism p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse"></div>
                    <span className="font-bold text-white text-lg">{pump.toUpperCase()}</span>
                  </div>
                  <PumpStatusBadge status={state as string} />
                </div>
                <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${state === 'on' ? 'bg-gradient-to-r from-green-400 to-emerald-500 water-flow' : 'bg-gray-600'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="AI Analytics" icon={<Brain className="h-6 w-6" />}>
          <div className="space-y-4">
            {[
              { label: 'Payments', value: status.payments, color: 'from-blue-400 to-blue-600', icon: '💰' },
              { label: 'AI Decisions', value: status.reasoning, color: 'from-purple-400 to-purple-600', icon: '🧠' },
              { label: 'Notifications', value: status.notifications, color: 'from-pink-400 to-pink-600', icon: '🔔' }
            ].map((stat) => (
              <div key={stat.label} className="glass-morphism p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{stat.icon}</span>
                    <span className="text-gray-300">{stat.label}</span>
                  </div>
                  <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="System Control" icon={<Settings className="h-6 w-6" />}>
          <div className="space-y-3">
            <button
              onClick={() => sendCommand('activate_pump', { pumpId: 'pump1' })}
              disabled={loading}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/50 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-2">
                <Play className="h-5 w-5" />
                <span>Activate Pump 1</span>
              </div>
            </button>
            
            <button
              onClick={() => sendCommand('stop_pump', { pumpId: 'pump1' })}
              disabled={loading}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/50 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-2">
                <Square className="h-5 w-5" />
                <span>Stop Pump 1</span>
              </div>
            </button>
          </div>
        </Card>

        <Card title="Quick Actions" icon={<Zap className="h-6 w-6" />}>
          <div className="space-y-3">
            <button
              onClick={() => simulatePayment(25)}
              disabled={loading}
              className="w-full holographic text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50"
            >
              <div className="flex items-center justify-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>$25 Payment</span>
              </div>
            </button>
            
            <button
              onClick={() => simulatePayment(50)}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50"
            >
              <div className="flex items-center justify-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>$50 Payment</span>
              </div>
            </button>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card title="Live Activity Stream" icon={<Activity className="h-6 w-6" />} className="h-full">
            <ActivityFeed />
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card title="Payment Testing" icon={<DollarSign className="h-6 w-6" />}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => simulatePayment(25)}
                  disabled={loading}
                  className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <DollarSign className="h-6 w-6 mx-auto mb-1" />
                    <div className="text-sm">$25</div>
                  </div>
                </button>
                
                <button
                  onClick={() => simulatePayment(50)}
                  disabled={loading}
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <DollarSign className="h-6 w-6 mx-auto mb-1" />
                    <div className="text-sm">$50</div>
                  </div>
                </button>
              </div>
              
              <button
                onClick={() => simulatePayment(10)}
                disabled={loading}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>$10 (Invalid Test)</span>
                </div>
              </button>
              
              <div className="glass-morphism p-3 rounded-lg text-center">
                <div className="text-xs text-gray-300">
                  💡 <strong>Minimum:</strong> $25 • <strong>Rate:</strong> $25 = 30min
                </div>
              </div>
            </div>
          </Card>

          <Card title="System Health" icon={<TrendingUp className="h-6 w-6" />}>
            <div className="space-y-3">
              <div className="glass-morphism p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">🔋 System Status</span>
                  <span className="text-green-400 font-bold">Optimal</span>
                </div>
              </div>
              <div className="glass-morphism p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">🌊 Water Pressure</span>
                  <span className="text-blue-400 font-bold">18.5 PSI</span>
                </div>
              </div>
              <div className="glass-morphism p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">🌡️ Temperature</span>
                  <span className="text-cyan-400 font-bold">22°C</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-morphism rounded-2xl p-8 text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="text-white font-semibold">Processing AI Decision...</p>
            <p className="text-gray-300 text-sm mt-1">Analyzing payment and sensor data</p>
          </div>
        </div>
      )}
    </div>
  )
}
