import { useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'
import { BusinessProvider } from '../hooks/useBusinessContext'

interface Props {
  children: ReactNode
}

export default function Layout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <BusinessProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">

        {/* Mobile backdrop — tap to close the sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto">
          {/* Mobile top bar with hamburger — hidden on md+ where the sidebar is always visible */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-semibold text-gray-900 text-sm">Business Portal</span>
          </div>

          <div className="max-w-6xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </BusinessProvider>
  )
}
