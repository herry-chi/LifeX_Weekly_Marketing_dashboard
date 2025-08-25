"use client"

import { useState } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface LifeCarDailyTrendsProps {
  data: LifeCarDailyData[]
  title?: string
}

export function LifeCarDailyTrends({ data, title = "Daily Performance Trends" }: LifeCarDailyTrendsProps) {
  // 数据系列控制状态
  const [visibleSeries, setVisibleSeries] = useState({
    spend: true,
    interactions: true,
    impressions: true,
    followers: true
  })

  // 切换系列可见性
  const toggleSeries = (seriesKey: keyof typeof visibleSeries) => {
    setVisibleSeries(prev => ({
      ...prev,
      [seriesKey]: !prev[seriesKey]
    }))
  }

  // 数据系列配置
  const seriesConfig = [
    { key: 'spend', label: 'Spend (¥)', color: '#EF3C99', icon: '💰' },
    { key: 'interactions', label: 'Interactions', color: '#751FAE', icon: '❤️' },
    { key: 'impressions', label: 'Impressions (÷100)', color: '#10B981', icon: '👁️' },
    { key: 'followers', label: 'Followers', color: '#F59E0B', icon: '👥' }
  ]
  const chartData = data.map(item => ({
    date: item.date.substring(5), // 只显示月-日
    spend: item.spend,
    interactions: item.interactions,
    impressions: Math.round(item.impressions / 100), // 缩放展现量以便显示
    followers: item.followers
  }))

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">
          📈 {title}
        </CardTitle>
        
        {/* 数据系列筛选按钮 */}
        <div className="flex flex-wrap gap-2 mt-4">
          {seriesConfig.map((series) => (
            <Button
              key={series.key}
              variant={visibleSeries[series.key as keyof typeof visibleSeries] ? "default" : "outline"}
              size="sm"
              onClick={() => toggleSeries(series.key as keyof typeof visibleSeries)}
              className={`flex items-center gap-1 transition-all duration-200 ${
                visibleSeries[series.key as keyof typeof visibleSeries]
                  ? 'bg-gradient-to-r from-[#751FAE] to-[#EF3C99] text-white hover:from-[#6919A6] hover:to-[#E73691]'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-sm">{series.icon}</span>
              <span className="text-xs font-medium">{series.label}</span>
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                interval="preserveStartEnd"
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
                  if (name === 'impressions') {
                    return [(value * 100).toLocaleString(), 'Impressions']
                  }
                  if (name === 'spend') {
                    return [`¥${value.toFixed(2)}`, 'Spend']
                  }
                  return [value.toLocaleString(), name]
                }}
              />
              <Legend />
              {visibleSeries.spend && (
                <Line 
                  type="monotone" 
                  dataKey="spend" 
                  stroke="#EF3C99" 
                  strokeWidth={2}
                  name="Spend (¥)"
                  dot={false}
                />
              )}
              {visibleSeries.interactions && (
                <Line 
                  type="monotone" 
                  dataKey="interactions" 
                  stroke="#751FAE" 
                  strokeWidth={2}
                  name="Interactions"
                  dot={false}
                />
              )}
              {visibleSeries.impressions && (
                <Line 
                  type="monotone" 
                  dataKey="impressions" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Impressions (÷100)"
                  dot={false}
                />
              )}
              {visibleSeries.followers && (
                <Line 
                  type="monotone" 
                  dataKey="followers" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  name="Followers"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          * Impressions are scaled down by 100 for better visualization
        </div>
      </CardContent>
    </Card>
  )
}