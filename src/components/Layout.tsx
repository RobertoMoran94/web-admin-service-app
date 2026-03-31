import { type ReactNode } from 'react'
import Sidebar from './Sidebar'
import { BusinessProvider } from '../hooks/useBusinessContext'

interface Props {
  children: ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <BusinessProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </BusinessProvider>
  )
}
