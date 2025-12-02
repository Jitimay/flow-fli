import './globals.css'
import Link from 'next/link'
import { Droplets, Waves } from 'lucide-react'

export const metadata = {
  title: 'FlowFli - Water Management',
  description: 'AI-powered water pump control system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-blue-50 to-cyan-50 min-h-screen">
        <nav className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Droplets className="h-8 w-8 text-cyan-200" />
                  <Waves className="h-4 w-4 text-blue-200 absolute -bottom-1 -right-1" />
                </div>
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                    FlowFli
                  </span>
                  <p className="text-xs text-cyan-200">AI Water Management</p>
                </div>
              </div>
              <div className="flex space-x-6">
                <Link href="/" className="px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-200 flex items-center space-x-1">
                  <span>Dashboard</span>
                </Link>
                <Link href="/logs" className="px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-200">
                  Logs
                </Link>
                <Link href="/settings" className="px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-200">
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
