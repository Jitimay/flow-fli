import './globals.css'
import Link from 'next/link'
import { Droplets, Waves, Zap, Brain } from 'lucide-react'

export const metadata = {
  title: 'FlowFli - AI Water Management',
  description: 'Revolutionary AI-powered water distribution system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-x-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-50 glass-morphism border-b border-white/10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-lg opacity-75 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-full">
                    <Droplets className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    FlowFli
                  </h1>
                  <p className="text-xs text-gray-300 flex items-center space-x-1">
                    <Brain className="h-3 w-3" />
                    <span>AI Water Management</span>
                    <Zap className="h-3 w-3 text-yellow-400" />
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-1">
                {[
                  { href: '/', label: 'Dashboard', icon: '🏠' },
                  { href: '/logs', label: 'Analytics', icon: '📊' },
                  { href: '/settings', label: 'Settings', icon: '⚙️' }
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-4 py-2 rounded-xl glass-morphism hover:bg-white/20 transition-all duration-300 text-white/90 hover:text-white flex items-center space-x-2 group"
                  >
                    <span className="group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="relative z-10 container mx-auto px-6 py-8">
          {children}
        </main>

        {/* Floating Particles */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </body>
    </html>
  )
}
