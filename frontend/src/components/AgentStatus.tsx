'use client'

import { FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi'
import clsx from 'clsx'

interface Agent {
  name: string
  status: 'active' | 'processing' | 'idle'
  tasksCompleted: number
}

const agents: Agent[] = [
  { name: 'Document Processor', status: 'processing', tasksCompleted: 145 },
  { name: 'Fiscal Classifier', status: 'active', tasksCompleted: 132 },
  { name: 'Tax Calculator', status: 'active', tasksCompleted: 89 },
  { name: 'Declaration Generator', status: 'idle', tasksCompleted: 67 },
  { name: 'Validator', status: 'active', tasksCompleted: 201 },
  { name: 'Communicator', status: 'processing', tasksCompleted: 312 },
  { name: 'Coordinator', status: 'active', tasksCompleted: 445 },
]

const statusConfig = {
  active: {
    label: 'Ativo',
    icon: FiCheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  processing: {
    label: 'Processando',
    icon: FiClock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  idle: {
    label: 'Ocioso',
    icon: FiAlertCircle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
  },
}

export default function AgentStatus() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Status dos Agentes</h3>
        <p className="text-sm text-gray-600">Agentes de IA em tempo real</p>
      </div>

      <div className="space-y-4">
        {agents.map((agent) => {
          const config = statusConfig[agent.status]
          const Icon = config.icon

          return (
            <div key={agent.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className={clsx('p-2 rounded-lg', config.bgColor)}>
                  <Icon className={clsx('w-4 h-4', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {agent.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {agent.tasksCompleted} tarefas
                  </p>
                </div>
              </div>
              <span
                className={clsx(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  config.bgColor,
                  config.color
                )}
              >
                {config.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Eficiência Geral</span>
          <span className="font-semibold text-gray-900">98.5%</span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
            style={{ width: '98.5%' }}
          ></div>
        </div>
      </div>
    </div>
  )
}
