'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface ChartProps {
  data: any[]
  type?: 'line' | 'bar'
  dataKey?: string
  xAxisDataKey?: string
}

export function Chart({ data, type = 'line', dataKey = 'value', xAxisDataKey = 'name' }: ChartProps) {
  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisDataKey} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={dataKey} fill="#1e40af" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisDataKey} />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey={dataKey} stroke="#1e40af" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}