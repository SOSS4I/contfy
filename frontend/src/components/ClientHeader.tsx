'use client'

import { FiBell, FiSearch, FiHelpCircle, FiMenu } from 'react-icons/fi'
import { useState } from 'react'

interface ClientHeaderProps {
  onMenuClick?: () => void
}

export default function ClientHeader({ onMenuClick }: ClientHeaderProps) {
  const [notifications, setNotifications] = useState(2)
  const [searchFocused, setSearchFocused] = useState(false)

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
                placeholder="Buscar..."
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

            {/* Notifications */}
            <button className="relative p-2 sm:p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all group">
              <FiBell className="w-5 h-5" />
              {notifications > 0 && (
                <>
                  <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full border-2 border-white">
                    {notifications}
                  </span>
                  <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-3 h-3 sm:w-4 sm:h-4 bg-red-400 rounded-full animate-ping"></span>
                </>
              )}
            </button>

            {/* Divider - Hidden on mobile */}
            <div className="hidden sm:block w-px h-8 bg-slate-200"></div>

            {/* Status Badge */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                <span className="text-xs sm:text-sm font-semibold text-green-700 whitespace-nowrap">Conta Ativa</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
