'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'

export default function ConfiguracoesPage() {
  const { user } = useAuth()
  const [codigoContador, setCodigoContador] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [contadorInfo, setContadorInfo] = useState<any>(null)

  const handleValidarCodigo = async () => {
    if (!codigoContador || codigoContador.length !== 6) {
      setError('O código deve ter 6 dígitos')
      return
    }

    setIsLoading(true)
    setError('')
    setContadorInfo(null)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const token = localStorage.getItem('token')
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}
      const response = await axios.get(`${API_URL}/contadores/codigo/${codigoContador}`, { headers: authHeaders })
      setContadorInfo(response.data)
      setError('')
    } catch (err: any) {
      setError('Código inválido ou contador não encontrado')
      setContadorInfo(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVincularContador = async () => {
    if (!user?.id || !contadorInfo) return

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const token = localStorage.getItem('token')
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}
      await axios.post(
        `${API_URL}/contadores/vincular?client_id=${user.id}`,
        { codigo_contador: codigoContador },
        { headers: authHeaders }
      )

      setSuccess(`Você foi vinculado com sucesso ao contador ${contadorInfo.name}!`)
      setCodigoContador('')
      setContadorInfo(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao vincular contador')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">Gerencie suas preferências e vinculação com contador</p>
      </div>

      {/* Vincular Contador */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Vincular ao Contador</h2>
        <p className="text-sm text-gray-600 mb-6">
          Insira o código de 6 dígitos fornecido pelo seu contador para vincular sua conta
        </p>

        {/* Mensagens */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Campo de Código */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={codigoContador}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6)
              setCodigoContador(value)
            }}
            placeholder="000000"
            maxLength={6}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
          />
          <button
            onClick={handleValidarCodigo}
            disabled={isLoading || codigoContador.length !== 6}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Validando...' : 'Validar'}
          </button>
        </div>

        {/* Informações do Contador */}
        {contadorInfo && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Contador Encontrado:</h3>
            <div className="space-y-1 text-sm text-blue-800 mb-4">
              <p><strong>Nome:</strong> {contadorInfo.name}</p>
              <p><strong>Email:</strong> {contadorInfo.email}</p>
              {contadorInfo.phone && <p><strong>Telefone:</strong> {contadorInfo.phone}</p>}
            </div>
            <button
              onClick={handleVincularContador}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Vinculando...' : 'Confirmar Vinculação'}
            </button>
          </div>
        )}
      </div>

      {/* Outras Configurações */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferências</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Notificações por Email</p>
              <p className="text-sm text-gray-600">Receba atualizações sobre seus documentos</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked={typeof window !== 'undefined' ? localStorage.getItem('pref_email_notif') !== 'false' : true}
                onChange={(e) => {
                  localStorage.setItem('pref_email_notif', String(e.target.checked))
                }}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Notificações Push</p>
              <p className="text-sm text-gray-600">Receba alertas em tempo real</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked={typeof window !== 'undefined' ? localStorage.getItem('pref_push_notif') === 'true' : false}
                onChange={(e) => {
                  localStorage.setItem('pref_push_notif', String(e.target.checked))
                }}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
