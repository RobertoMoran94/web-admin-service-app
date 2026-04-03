import { useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'
import { BusinessProvider } from '../hooks/useBusinessContext'

interface Props {
  children: ReactNode
}

export default function Layout({ children }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <BusinessProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">

        <Sidebar isCollapsed={isCollapsed} />

        {/* Toggle tab — sits at the sidebar/content boundary, always accessible */}
        <button
          onClick={() => setIsCollapsed(c => !c)}
          className="self-start mt-5 z-20 flex-shrink-0 bg-white border border-l-0
                     border-gray-200 rounded-r-lg w-4 h-8 flex items-center justify-center
                     shadow-sm hover:bg-gray-50 transition-colors"
          aria-label={isCollapsed ? 'Expand menu' : 'Collapse menu'}
        >
          <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2.5}>
            {isCollapsed
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            }
          </svg>
        </button>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </BusinessProvider>
  )
}
