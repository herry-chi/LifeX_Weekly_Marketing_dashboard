"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeCarMonthlyData } from "@/lib/lifecar-data-processor"

interface LifeCarMonthlySummaryProps {
  data: LifeCarMonthlyData[]
  title?: string
}

export function LifeCarMonthlySummary({ data, title = "Monthly Performance Summary" }: LifeCarMonthlySummaryProps) {
  const chartData = data.map(item => ({
    month: item.month,
    spend: item.totalSpend,
    interactions: item.totalInteractions,
    followers: item.totalFollowers,
    cpm: item.cpm,
    cpi: item.cpi
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 月度支出和互动 */}
      <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">
            💰 Monthly Spend & Interactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'spend') {
                      return [`$${value.toFixed(2)}`, 'Total Spend']
                    }
                    return [value.toLocaleString(), name]
                  }}
                />
                <Legend />
                <Bar dataKey="spend" fill="#EF3C99" name="Spend ($)" />
                <Bar dataKey="interactions" fill="#751FAE" name="Interactions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 成本效率分析 */}
      <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">
            📊 Cost Efficiency Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'cpm') {
                      return [`$${value.toFixed(3)}`, 'CPM (Cost per 1000 impressions)']
                    }
                    if (name === 'cpi') {
                      return [`$${value.toFixed(2)}`, 'CPI (Cost per interaction)']
                    }
                    return [value.toFixed(2), name]
                  }}
                />
                <Legend />
                <Bar dataKey="cpm" fill="#10B981" name="CPM ($)" />
                <Bar dataKey="cpi" fill="#F59E0B" name="CPI ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}