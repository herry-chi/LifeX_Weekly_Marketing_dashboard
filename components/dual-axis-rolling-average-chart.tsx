"use client"

import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface DualAxisRollingAverageChartProps {
  data: LifeCarDailyData[]
  title?: string
}

interface RollingAverageData {
  date: string
  spendAvg: number
  clicksAvg: number
  originalSpend: number
  originalClicks: number
}

// Calculate 7-day rolling average (7 days before, 0 days after)
function calculateRollingAverage(data: LifeCarDailyData[]): RollingAverageData[] {
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date))
  const result: RollingAverageData[] = []
  
  for (let i = 0; i < sortedData.length; i++) {
    // Collect data for current date and previous 7 days (including current date)
    const windowData = []
    for (let j = Math.max(0, i - 6); j <= i; j++) {
      windowData.push(sortedData[j])
    }
    
    // Calculate average for this window
    const spendSum = windowData.reduce((sum, item) => sum + item.spend, 0)
    const clicksSum = windowData.reduce((sum, item) => sum + item.clicks, 0)
    
    result.push({
      date: sortedData[i].date,
      spendAvg: spendSum / windowData.length,
      clicksAvg: clicksSum / windowData.length,
      originalSpend: sortedData[i].spend,
      originalClicks: sortedData[i].clicks
    })
  }
  
  return result
}

// Calculate nice axis domain and ticks for dynamic scaling
function calculateNiceScale(minValue: number, maxValue: number, targetTicks: number = 7) {
  // Add 10% padding to the range
  const range = maxValue - minValue
  const padding = range * 0.1
  const paddedMin = minValue - padding
  const paddedMax = maxValue + padding
  
  // Calculate raw interval
  const rawInterval = (paddedMax - paddedMin) / targetTicks
  
  // Find the magnitude of the interval
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)))
  
  // Normalize the interval to between 1 and 10
  const normalizedInterval = rawInterval / magnitude
  
  // Choose a nice interval (1, 2, 2.5, 5, or 10)
  let niceInterval: number
  if (normalizedInterval <= 1) niceInterval = 1
  else if (normalizedInterval <= 2) niceInterval = 2
  else if (normalizedInterval <= 2.5) niceInterval = 2.5
  else if (normalizedInterval <= 5) niceInterval = 5
  else niceInterval = 10
  
  niceInterval *= magnitude
  
  // Calculate nice min and max
  const niceMin = Math.floor(paddedMin / niceInterval) * niceInterval
  const niceMax = Math.ceil(paddedMax / niceInterval) * niceInterval
  
  // Generate ticks
  const ticks: number[] = []
  for (let tick = niceMin; tick <= niceMax; tick += niceInterval) {
    ticks.push(tick)
  }
  
  return {
    domain: [Math.max(0, niceMin), niceMax], // Ensure min is not negative for these metrics
    ticks: ticks.filter(t => t >= 0), // Filter out negative ticks
    interval: niceInterval
  }
}

export function DualAxisRollingAverageChart({ data, title = "Cost & Clicks Rolling Average Analysis" }: DualAxisRollingAverageChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    return calculateRollingAverage(data)
  }, [data])

  // Calculate dynamic scales for both axes
  const { spendScale, clicksScale } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        spendScale: { domain: [0, 100], ticks: [0, 25, 50, 75, 100] },
        clicksScale: { domain: [0, 100], ticks: [0, 25, 50, 75, 100] }
      }
    }
    
    // Find min and max for spend with better dynamic range
    const spendValues = chartData.map(d => d.spendAvg).filter(v => v > 0)
    const minSpend = spendValues.length > 0 ? Math.min(...spendValues) : 0
    const maxSpend = spendValues.length > 0 ? Math.max(...spendValues) : 100
    
    // Find min and max for clicks with better dynamic range
    const clicksValues = chartData.map(d => d.clicksAvg).filter(v => v > 0)
    const minClicks = clicksValues.length > 0 ? Math.min(...clicksValues) : 0
    const maxClicks = clicksValues.length > 0 ? Math.max(...clicksValues) : 100
    
    // Use adaptive tick count based on data range
    const spendRange = maxSpend - minSpend
    const clicksRange = maxClicks - minClicks
    
    const spendTickCount = spendRange > 1000 ? 6 : spendRange > 100 ? 5 : 4
    const clicksTickCount = clicksRange > 1000 ? 6 : clicksRange > 100 ? 5 : 4
    
    return {
      spendScale: calculateNiceScale(minSpend, maxSpend, spendTickCount),
      clicksScale: calculateNiceScale(minClicks, maxClicks, clicksTickCount)
    }
  }, [chartData])

  // Format date display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find the data point for this date
      const dataPoint = chartData.find(d => d.date === label)
      
      // Format date nicely
      const formattedDate = new Date(label).toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
      
      // Calculate day-over-day changes if previous data exists
      const currentIndex = chartData.findIndex(d => d.date === label)
      const prevData = currentIndex > 0 ? chartData[currentIndex - 1] : null
      
      const spendChange = prevData 
        ? ((dataPoint.spendAvg - prevData.spendAvg) / prevData.spendAvg * 100)
        : null
      const clicksChange = prevData
        ? ((dataPoint.clicksAvg - prevData.clicksAvg) / prevData.clicksAvg * 100)
        : null
      
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-xl min-w-[220px]">
          <p className="font-bold text-gray-900 mb-3 border-b pb-2">{formattedDate}</p>
          
          {/* Spend Section */}
          <div className="mb-3">
            <p className="text-sm font-semibold text-pink-600 mb-1">💰 Spend</p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">7-day Avg:</span> ¥{dataPoint.spendAvg.toFixed(2)}
            </p>
          </div>
          
          {/* Clicks Section */}
          <div>
            <p className="text-sm font-semibold text-purple-600 mb-1">👆 Clicks</p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">7-day Avg:</span> {dataPoint.clicksAvg.toFixed(1)}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">
            📈 {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
      <CardHeader>
        <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">
          📈 {title}
        </CardTitle>
        <p className="text-sm text-gray-600 font-montserrat font-light">
          7-day rolling average comparison analysis. X-axis: Time, Left Y-axis: Spend rolling avg, Right Y-axis: Clicks rolling avg
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={formatDate}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              
              {/* Left Y-axis - Spend */}
              <YAxis 
                yAxisId="spend"
                orientation="left"
                domain={spendScale.domain}
                ticks={spendScale.ticks}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `¥${(value/1000000).toFixed(1)}M`
                  if (value >= 1000) return `¥${(value/1000).toFixed(1)}K`
                  return `¥${value.toFixed(0)}`
                }}
                label={{ value: 'Spend (¥)', angle: -90, position: 'insideLeft' }}
              />
              
              {/* Right Y-axis - Clicks */}
              <YAxis 
                yAxisId="clicks"
                orientation="right"
                domain={clicksScale.domain}
                ticks={clicksScale.ticks}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`
                  if (value >= 1000) return `${(value/1000).toFixed(1)}K`
                  return value.toFixed(0)
                }}
                label={{ value: 'Clicks', angle: 90, position: 'insideRight' }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* 7-day Spend Rolling Average - Left axis */}
              <Line
                yAxisId="spend"
                type="monotone"
                dataKey="spendAvg"
                stroke="#EF3C99"
                strokeWidth={3}
                dot={false}
                name="7-day Spend Rolling Avg"
                connectNulls={false}
              />
              
              {/* 7-day Clicks Rolling Average - Right axis */}
              <Line
                yAxisId="clicks"
                type="monotone"
                dataKey="clicksAvg"
                stroke="#751FAE"
                strokeWidth={3}
                dot={false}
                name="7-day Clicks Rolling Avg"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}