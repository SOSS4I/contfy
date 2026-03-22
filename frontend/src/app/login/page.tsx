'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { FiMail, FiLock, FiAlertCircle, FiUser, FiPhone, FiFileText, FiCheckCircle } from 'react-icons/fi'
import { SiOpenai } from 'react-icons/si'
import axios from 'axios'

type TabType = 'login' | 'register-user' | 'reset-password'

function validarCPF(cpf: string): boolean {
  if (/^(\d)\1{10}$/.test(cpf)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i)
  let d1 = 11 - (sum % 11)
  if (d1 >= 10) d1 = 0
  if (parseInt(cpf[9]) !== d1) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i)
  let d2 = 11 - (sum % 11)
  if (d2 >= 10) d2 = 0
  return parseInt(cpf[10]) === d2
}

function validarCNPJ(cnpj: string): boolean {
  if (/^(\d)\1{13}$/.test(cnpj)) return false
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 12; i++) sum += parseInt(cnpj[i]) * weights1[i]
  let d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (parseInt(cnpj[12]) !== d1) return false
  sum = 0
  for (let i = 0; i < 13; i++) sum += parseInt(cnpj[i]) * weights2[i]
  let d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return parseInt(cnpj[13]) === d2
}

function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) => d ? `${a}.${b}.${c}-${d}` : a.length === 3 && b.length === 3 && c ? `${a}.${b}.${c}` : a.length === 3 && b ? `${a}.${b}` : a)
  }
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_, a, b, c, d, e) => e ? `${a}.${b}.${c}/${d}-${e}` : `${a}.${b}.${c}/${d}`)
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, a, b, c) => c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : '')
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) => c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : '')
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<TabType>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  // Form data for registration
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    cnpj: '',
    phone: '',
    tax_regime: 'simples_nacional',
  })

  // Form data for password reset
  const [resetData, setResetData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
    } catch (err: any) {
      setError(err?.message || 'Email ou senha inválidos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    // Validações
    if (registerData.password !== registerData.confirmPassword) {
      setError('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    if (registerData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      setIsLoading(false)
      return
    }

    // Validar CPF/CNPJ
    const cleanDoc = registerData.cnpj.replace(/\D/g, '')
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      setError('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos')
      setIsLoading(false)
      return
    }
    if (cleanDoc.length === 11 && !validarCPF(cleanDoc)) {
      setError('CPF inválido')
      setIsLoading(false)
      return
    }
    if (cleanDoc.length === 14 && !validarCNPJ(cleanDoc)) {
      setError('CNPJ inválido')
      setIsLoading(false)
      return
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

      await axios.post(`${API_URL}/clientes`, {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        cnpj: registerData.cnpj,
        phone: registerData.phone,
        tax_regime: registerData.tax_regime,
        status: 'ativo',
      })

      setSuccess('Cadastro realizado com sucesso! Você já pode fazer login.')
      setRegisterData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        cnpj: '',
        phone: '',
        tax_regime: 'simples_nacional',
      })

      // Mudar para tab de login após 2 segundos
      setTimeout(() => {
        setActiveTab('login')
        setEmail(registerData.email)
        setSuccess('')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao cadastrar usuário')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    // Validações
    if (resetData.newPassword !== resetData.confirmPassword) {
      setError('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    if (resetData.newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      setIsLoading(false)
      return
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

      // Primeiro tenta definir senha (para usuários sem senha)
      try {
        await axios.post(`${API_URL}/auth/cliente/set-password`, {
          email: resetData.email,
          password: resetData.newPassword,
        })
        setSuccess('Senha definida com sucesso! Você já pode fazer login.')
      } catch (setErr: any) {
        // Se já tem senha, tenta redefinir
        if (setErr.response?.status === 400) {
          await axios.post(`${API_URL}/auth/cliente/reset-password`, {
            email: resetData.email,
            newPassword: resetData.newPassword,
          })
          setSuccess('Senha redefinida com sucesso! Você já pode fazer login.')
        } else {
          throw setErr
        }
      }

      setResetData({
        email: '',
        newPassword: '',
        confirmPassword: '',
      })

      // Mudar para tab de login após 2 segundos
      setTimeout(() => {
        setActiveTab('login')
        setEmail(resetData.email)
        setSuccess('')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao redefinir senha')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <SiOpenai className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Contabilidade AI
          </h1>
          <p className="text-primary-200">
            Automação Inteligente de Contabilidade
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => {
                setActiveTab('login')
                setError('')
                setSuccess('')
              }}
              className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === 'login'
                  ? 'bg-white text-primary-600 border-b-2 border-primary-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setActiveTab('register-user')
                setError('')
                setSuccess('')
              }}
              className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === 'register-user'
                  ? 'bg-white text-primary-600 border-b-2 border-primary-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Cadastro Cliente
            </button>
          </div>

          <div className="p-8">
            {/* Mensagens de Erro/Sucesso */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
                <FiCheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            {/* Tab: Login */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </button>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('reset-password')
                      setError('')
                      setSuccess('')
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              </form>
            )}

            {/* Tab: Redefinir Senha */}
            {activeTab === 'reset-password' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">
                    Digite seu email e uma nova senha para redefinir o acesso.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={resetData.email}
                      onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      value={resetData.newPassword}
                      onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      value={resetData.confirmPassword}
                      onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                      placeholder="Repita a nova senha"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
                </button>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login')
                      setError('')
                      setSuccess('')
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Voltar para o Login
                  </button>
                </div>
              </form>
            )}

            {/* Tab: Cadastro Cliente */}
            {activeTab === 'register-user' && (
              <form onSubmit={handleRegisterUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo / Razão Social
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      placeholder="João Silva / Empresa Ltda"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF/CNPJ
                  </label>
                  <div className="relative">
                    <FiFileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={registerData.cnpj}
                      onChange={(e) => setRegisterData({ ...registerData, cnpj: formatCpfCnpj(e.target.value) })}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      maxLength={18}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Regime Tributário
                  </label>
                  <select
                    value={registerData.tax_regime}
                    onChange={(e) => setRegisterData({ ...registerData, tax_regime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="simples_nacional">Simples Nacional</option>
                    <option value="mei">MEI</option>
                    <option value="lucro_presumido">Lucro Presumido</option>
                    <option value="lucro_real">Lucro Real</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      placeholder="Repita a senha"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Cadastrando...' : 'Cadastrar Cliente'}
                </button>
              </form>
            )}

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-primary-200 text-sm mt-6">
          © 2024 Contabilidade AI. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
