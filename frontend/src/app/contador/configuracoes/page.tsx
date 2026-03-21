'use client'

import { useState, useEffect } from 'react'
import { FiUser, FiLock, FiBell, FiSave, FiCheck, FiAlertCircle } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function ConfiguracoesPage() {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [crc, setCrc] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setCrc(user.crc || '')
    }
  }, [user])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/contadores/${user?.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, email, phone })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Erro ao salvar')
      }

      const data = await res.json()

      // Atualizar localStorage
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}')
      const updatedUser = { ...savedUser, name, email, phone }
      localStorage.setItem('user', JSON.stringify(updatedUser))

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordSaving(true)
    setPasswordError('')
    try {
      if (newPassword.length < 6) {
        throw new Error('Nova senha deve ter pelo menos 6 caracteres')
      }

      const res = await fetch(`${API_URL}/contadores/${user?.id}/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Erro ao alterar senha')
      }

      setCurrentPassword('')
      setNewPassword('')
      setPasswordSaved(true)
      setTimeout(() => setPasswordSaved(false), 3000)
    } catch (err: any) {
      setPasswordError(err.message)
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracoes</h1>
        <p className="text-gray-600 mt-1">Gerencie seu perfil e preferencias</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Perfil */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FiUser className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Perfil</h2>
          </div>

          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <FiAlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CRC</label>
              <input
                type="text"
                value={crc}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            {user?.codigoContador && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codigo do Contador</label>
                <input
                  type="text"
                  value={user.codigoContador}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 font-mono text-lg tracking-widest"
                />
                <p className="text-xs text-gray-400 mt-1">Clientes usam este codigo para vincular ao seu escritorio</p>
              </div>
            )}
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saved ? <><FiCheck className="w-4 h-4" /> Salvo!</> :
               saving ? 'Salvando...' :
               <><FiSave className="w-4 h-4" /> Salvar Alteracoes</>}
            </button>
          </div>
        </div>

        {/* Segurança */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FiLock className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Seguranca</h2>
          </div>

          {passwordError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <FiAlertCircle className="w-4 h-4" />
              {passwordError}
            </div>
          )}

          {passwordSaved && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
              <FiCheck className="w-4 h-4" />
              Senha alterada com sucesso!
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 6 caracteres"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={passwordSaving || !currentPassword || !newPassword}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {passwordSaving ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>
        </div>

        {/* Info do Sistema */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-lg">🤖</span>
            <h2 className="text-lg font-semibold text-gray-900">Sistema</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-gray-600">Versao</span>
              <p className="font-medium text-gray-900">1.0.0</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-gray-600">Agentes de IA</span>
              <p className="font-medium text-gray-900">11 ativos</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-gray-600">CRON Mensal</span>
              <p className="font-medium text-green-600">Ativo (dia 1, 06:00)</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-gray-600">Backend</span>
              <p className="font-medium text-green-600">Online (porta 8000)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
