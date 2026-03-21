'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const data = [
  { month: 'Jan', impostos: 18500, receita: 120000 },
  { month: 'Fev', impostos: 19200, receita: 125000 },
  { month: 'Mar', impostos: 21000, receita: 135000 },
  { month: 'Abr', impostos: 20500, receita: 132000 },
  { month: 'Mai', impostos: 22800, receita: 145000 },
  { month: 'Jun', impostos: 24100, receita: 152000 },
  { month: 'Jul', impostos: 23500, receita: 148000 },
  { month: 'Ago', impostos: 25200, receita: 158000 },
  { month: 'Set', impostos: 26800, receita: 165000 },
  { month: 'Out', impostos: 28100, receita: 172000 },
  { month: 'Nov', impostos: 29500, receita: 180000 },
  { month: 'Dez', impostos: 31200, receita: 190000 },
]

export default function TaxChart() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Receita e Impostos</h3>
        <p className="text-sm text-gray-600">Evolução mensal dos últimos 12 meses</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="receita"
            stroke="#0ea5e9"
            strokeWidth={2}
            name="Receita"
            dot={{ fill: '#0ea5e9', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="impostos"
            stroke="#8b5cf6"
            strokeWidth={2}
            name="Impostos"
            dot={{ fill: '#8b5cf6', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
