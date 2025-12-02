'use client'

import { useState } from 'react'
import Card from '../components/Card'

export default function Settings() {
  const [settings, setSettings] = useState({
    pumpTimeout: 30,
    paymentThreshold: 25,
    notifications: true,
    autoMode: true
  })

  const handleSave = () => {
    // In a real app, this would save to backend
    alert('Settings saved!')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      
      <Card title="Pump Configuration">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Pump Timeout (minutes)
            </label>
            <input
              type="number"
              value={settings.pumpTimeout}
              onChange={(e) => setSettings({...settings, pumpTimeout: parseInt(e.target.value)})}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Threshold ($)
            </label>
            <input
              type="number"
              value={settings.paymentThreshold}
              onChange={(e) => setSettings({...settings, paymentThreshold: parseInt(e.target.value)})}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </Card>

      <Card title="System Preferences">
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Enable notifications
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.autoMode}
              onChange={(e) => setSettings({...settings, autoMode: e.target.checked})}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Automatic pump control
            </label>
          </div>
        </div>
      </Card>

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Save Settings
      </button>
    </div>
  )
}
