'use client'

import { useState, useEffect } from 'react'
import { FiUser, FiMail, FiPhone, FiFileText, FiSave, FiCheckCircle } from 'react-icons/fi'
import axios from 'axios'

export default function PerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    // Informações Básicas
    name: '',
    email: '',
    phone: '',
    cnpj: '',
    cpf: '',

    // Inscrições
    ie: '',
    im: '',

    // CNAE
    cnae_principal: '',

    // Regime Tributário
    tax_regime: 'SIMPLES_NACIONAL',
    simples_nacional_anexo: '',

    // Faturamento
    monthly_revenue: '',
    annual_revenue: '',
    employee_count: '',

    // Endereço
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  })

  useEffect(() => {
    loadClienteData()
  }, [])

  const loadClienteData = async () => {
    try {
      const savedUser = localStorage.getItem('user')
      if (!savedUser) return

      const user = JSON.parse(savedUser)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

      const token = localStorage.getItem('token')
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}
      const response = await axios.get(`${API_URL}/clientes/${user.id}`, { headers: authHeaders })
      const cliente = response.data.data

      setFormData({
        name: cliente.name || '',
        email: cliente.email || '',
        phone: cliente.phone || '',
        cnpj: cliente.cnpj || '',
        cpf: cliente.cpf || '',
        ie: cliente.ie || '',
        im: cliente.im || '',
        cnae_principal: cliente.cnaePrincipal || '',
        tax_regime: cliente.taxRegime || 'SIMPLES_NACIONAL',
        simples_nacional_anexo: cliente.simplesNacionalAnexo || '',
        monthly_revenue: cliente.monthlyRevenue?.toString() || '',
        annual_revenue: cliente.annualRevenue?.toString() || '',
        employee_count: cliente.employeeCount?.toString() || '',
        cep: cliente.address?.cep || '',
        logradouro: cliente.address?.logradouro || '',
        numero: cliente.address?.numero || '',
        complemento: cliente.address?.complemento || '',
        bairro: cliente.address?.bairro || '',
        cidade: cliente.address?.cidade || '',
        estado: cliente.address?.estado || '',
      })
    } catch (error) {
      setError('Erro ao carregar dados do perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const savedUser = localStorage.getItem('user')
      if (!savedUser) return

      const user = JSON.parse(savedUser)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

      const token = localStorage.getItem('token')
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}
      await axios.put(`${API_URL}/clientes/${user.id}`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cnpj: formData.cnpj,
        cpf: formData.cpf || null,
        ie: formData.ie || null,
        im: formData.im || null,
        cnae_principal: formData.cnae_principal || null,
        tax_regime: formData.tax_regime,
        simples_nacional_anexo: formData.simples_nacional_anexo || null,
        monthly_revenue: formData.monthly_revenue ? parseInt(formData.monthly_revenue) : 0,
        annual_revenue: formData.annual_revenue ? parseInt(formData.annual_revenue) : 0,
        employee_count: formData.employee_count ? parseInt(formData.employee_count) : 0,
        address: {
          cep: formData.cep,
          logradouro: formData.logradouro,
          numero: formData.numero,
          complemento: formData.complemento,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
        }
      }, { headers: authHeaders })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao salvar dados')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
        <p className="text-gray-600">Complete as informações da sua empresa</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 flex items-center gap-2">
          <FiCheckCircle className="w-5 h-5" />
          Perfil atualizado com sucesso!
        </div>
      )}

      {/* Informações Pessoais */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiUser className="w-5 h-5 text-blue-600" />
          Informações Pessoais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome / Razão Social *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone *
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CNPJ *
            </label>
            <input
              type="text"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              placeholder="00.000.000/0001-00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPF (opcional)
            </label>
            <input
              type="text"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              placeholder="000.000.000-00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Inscrições */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiFileText className="w-5 h-5 text-blue-600" />
          Inscrições
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inscrição Estadual (IE)
            </label>
            <input
              type="text"
              value={formData.ie}
              onChange={(e) => setFormData({ ...formData, ie: e.target.value })}
              placeholder="000.000.000.000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inscrição Municipal (IM)
            </label>
            <input
              type="text"
              value={formData.im}
              onChange={(e) => setFormData({ ...formData, im: e.target.value })}
              placeholder="000000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CNAE Principal
            </label>
            <input
              type="text"
              value={formData.cnae_principal}
              onChange={(e) => setFormData({ ...formData, cnae_principal: e.target.value })}
              placeholder="0000-0/00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
        >
          <FiSave className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

    </div>
  )
}
