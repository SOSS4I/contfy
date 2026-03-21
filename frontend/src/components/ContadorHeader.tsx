'use client'

import { FiBell, FiSearch, FiHelpCircle, FiMenu } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface ContadorHeaderProps {
  onMenuClick?: () => void
}

export default function ContadorHeader({ onMenuClick }: ContadorHeaderProps) {
  const [pendingCount, setPendingCount] = useState(0)
  const [searchFocused, setSearchFocused] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    fetchPendingCount()
    // Polling a cada 30 segundos
    const interval = setInterval(fetchPendingCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchPendingCount = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/admin/notifications/pending-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPendingCount(data.count || 0)
      }
    } catch (error) {
      // Silently fail
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:gap-4">

          {/* Mobile Menu Button */}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              aria-label="Abrir menu"
            >
              <FiMenu className="w-6 h-6" />
            </button>
          )}

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <div className={`relative group ${searchFocused ? 'block' : 'hidden sm:block'}`}>
              <FiSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Buscar clientes, documentos, impostos..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>

            {/* Mobile Search Toggle */}
            {!searchFocused && (
              <button
                onClick={() => setSearchFocused(true)}
                className="sm:hidden p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                aria-label="Buscar"
              >
                <FiSearch className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Help Button - Hidden on mobile */}
            <button className="hidden md:flex items-center gap-2 px-3 sm:px-4 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all group">
              <FiHelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-semibold">Ajuda</span>
            </button>

            {/* Notifications - FUNCTIONAL */}
            <button
              onClick={() => router.push('/contador/notificacoes')}
              className="relative p-2 sm:p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all group"
            >
              <FiBell className="w-5 h-5" />
              {pendingCount > 0 && (
                <>
                  <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full border-2 border-white">
                    {pendingCount}
                  </span>
                  <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-3 h-3 sm:w-4 sm:h-4 bg-red-400 rounded-full animate-ping"></span>
                </>
              )}
            </button>

            {/* Divider - Hidden on mobile */}
            <div className="hidden sm:block w-px h-8 bg-slate-200"></div>

            {/* Admin Badge */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
                <span className="text-xs sm:text-sm font-semibold text-blue-700 whitespace-nowrap">
                  {user?.name || 'Admin Contador'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
