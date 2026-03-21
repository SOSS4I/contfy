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
  FiBell
} from 'react-icons/fi'
import { SiOpenai } from 'react-icons/si'
import clsx from 'clsx'
import { useAuth } from '@/contexts/AuthContext'

const navigation = [
  { name: 'Dashboard', href: '/contador', icon: FiHome },
  { name: '🔔 Notificações', href: '/contador/notificacoes', icon: FiBell, badge: true },
  { name: 'Clientes', href: '/contador/clientes', icon: FiUsers },
  { name: 'Documentos', href: '/contador/documentos', icon: FiFileText },
  { name: 'Impostos', href: '/contador/impostos', icon: FiDollarSign },
  { name: 'Declarações', href: '/contador/declaracoes', icon: FiFile },
  { name: 'Chat IA', href: '/contador/chat', icon: FiMessageSquare },
  { name: 'Agentes', href: '/contador/agentes', icon: FiActivity },
  { name: 'Configurações', href: '/contador/configuracoes', icon: FiSettings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <div className="w-64 bg-gradient-to-b from-primary-900 to-primary-800 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-primary-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <SiOpenai className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Contabilidade AI</h1>
            <p className="text-xs text-primary-300">Automação Inteligente</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-primary-200 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-primary-700">
        <div className="px-4 py-3 bg-white/10 rounded-lg mb-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.name?.charAt(0) || 'CT'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-primary-300 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          <FiLogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </div>
  )
}
