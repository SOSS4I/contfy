'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiDollarSign,
  FiFile,
  FiMessageSquare,
  FiSettings,
  FiActivity,
  FiLogOut,
  FiUser,
  FiBell,
  FiX
} from 'react-icons/fi'
import clsx from 'clsx'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'

const navigation = [
  { name: 'Painel de Controle', href: '/contador', icon: FiHome },
  { name: 'Clientes', href: '/contador/clientes', icon: FiUsers },
  { name: 'Documentos', href: '/contador/documentos', icon: FiFileText },
  { name: 'Impostos', href: '/contador/impostos', icon: FiDollarSign },
  { name: 'Declarações', href: '/contador/declaracoes', icon: FiFile },
  { name: 'Assistente IA', href: '/contador/chat', icon: FiMessageSquare },
  { name: 'Agentes IA', href: '/contador/agentes', icon: FiActivity },
]

const secondaryNav = [
  { name: 'Notificações', href: '/contador/notificacoes', icon: FiBell },
  { name: 'Meu Perfil', href: '/contador/perfil', icon: FiUser },
  { name: 'Configurações', href: '/contador/configuracoes', icon: FiSettings },
]

interface ContadorSidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function ContadorSidebar({ mobileOpen = false, onMobileClose }: ContadorSidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Close mobile menu on route change
  useEffect(() => {
    if (mobileOpen && onMobileClose) {
      onMobileClose()
    }
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileOpen])

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile Close Button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          aria-label="Fechar menu"
        >
          <FiX className="w-6 h-6" />
        </button>

        {/* Logo & Brand */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <div className="w-6 h-6 border-2 border-white rounded-md"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Contabilidade</h1>
              <p className="text-xs text-slate-400 font-medium">Portal Contador</p>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="px-4 pt-6 pb-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl p-4 border border-slate-700/50 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-lg font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'C'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Contador'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || 'email@contador.com'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
            Menu Principal
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                )}
              >
                <item.icon className={clsx(
                  'w-5 h-5 transition-transform duration-200',
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                )} />
                <span className="font-medium text-sm">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </Link>
            )
          })}

          {/* Secondary Navigation */}
          <div className="pt-6">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
              Conta
            </div>
            {secondaryNav.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-slate-800/80 text-white'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom Section - Logout */}
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/50 hover:bg-red-600 rounded-xl transition-all duration-200 group border border-slate-700/50 hover:border-red-500"
          >
            <FiLogOut className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">Encerrar Sessão</span>
          </button>

          {/* System Status Indicator */}
          <div className="mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-400">Sistema Online</span>
          </div>
        </div>
      </div>
    </>
  )
}
