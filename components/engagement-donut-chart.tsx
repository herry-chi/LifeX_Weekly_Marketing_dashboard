"use client"

import React, { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface EngagementDonutChartProps {
  filteredData: LifeCarDailyData[]
  allTimeData: LifeCarDailyData[]
  title?: string
}

interface EngagementData {
  name: string
  value: number
  color: string
  percentage: number
}

// Colors for different engagement types
const ENGAGEMENT_COLORS = {
  likes: '#EF3C99',      // Pink
  comments: '#3B82F6',   // Blue
  saves: '#10B981',      // Green
  followers: '#F59E0B',  // Orange
  shares: '#8B5CF6'      // Purple
}

function calculateEngagementData(data: LifeCarDailyData[]): EngagementData[] {
  if (!data || data.length === 0) {
    return [
      { name: 'Likes', value: 0, color: ENGAGEMENT_COLORS.likes, percentage: 0 },
      { name: 'Comments', value: 0, color: ENGAGEMENT_COLORS.comments, percentage: 0 },
      { name: 'Saves', value: 0, color: ENGAGEMENT_COLORS.saves, percentage: 0 },
      { name: 'Followers', value: 0, color: ENGAGEMENT_COLORS.followers, percentage: 0 },
      { name: 'Shares', value: 0, color: ENGAGEMENT_COLORS.shares, percentage: 0 }
    ]
  }

  const totals = data.reduce((acc, item) => ({
    likes: acc.likes + (item.likes || 0),
    comments: acc.comments + (item.comments || 0),
    saves: acc.saves + (item.saves || 0),
    followers: acc.followers + (item.followers || 0),
    shares: acc.shares + (item.shares || 0)
  }), { likes: 0, comments: 0, saves: 0, followers: 0, shares: 0 })

  const totalEngagements = totals.likes + totals.comments + totals.saves + totals.followers + totals.shares

  return [
    {
      name: 'Likes',
      value: totals.likes,
      color: ENGAGEMENT_COLORS.likes,
      percentage: totalEngagements > 0 ? (totals.likes / totalEngagements) * 100 : 0
    },
    {
      name: 'Comments',
      value: totals.comments,
      color: ENGAGEMENT_COLORS.comments,
      percentage: totalEngagements > 0 ? (totals.comments / totalEngagements) * 100 : 0
    },
    {
      name: 'Saves',
      value: totals.saves,
      color: ENGAGEMENT_COLORS.saves,
      percentage: totalEngagements > 0 ? (totals.saves / totalEngagements) * 100 : 0
    },
    {
      name: 'Followers',
      value: totals.followers,
      color: ENGAGEMENT_COLORS.followers,
      percentage: totalEngagements > 0 ? (totals.followers / totalEngagements) * 100 : 0
    },
    {
      name: 'Shares',
      value: totals.shares,
      color: ENGAGEMENT_COLORS.shares,
      percentage: totalEngagements > 0 ? (totals.shares / totalEngagements) * 100 : 0
    }
  ].filter(item => item.value > 0) // Only show engagement types with actual data
}

export function EngagementDonutChart({ 
  filteredData, 
  allTimeData, 
  title = "Engagement Breakdown: Filtered vs All Time" 
}: EngagementDonutChartProps) {
  
  const { filteredEngagementData, allTimeEngagementData } = useMemo(() => {
    return {
      filteredEngagementData: calculateEngagementData(filteredData),
      allTimeEngagementData: calculateEngagementData(allTimeData)
    }
  }, [filteredData, allTimeData])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-gray-800 mb-1">{data.name}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Count:</span> {data.value.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Percentage:</span> {data.percentage.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }


  if (!filteredEngagementData.length && !allTimeEngagementData.length) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">
            🍩 {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            No engagement data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
      <CardHeader>
        <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">
          🍩 {title}
        </CardTitle>
        <p className="text-sm text-gray-600 font-montserrat font-light">
          Inner ring: All time data, Outer ring: Filtered period data
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* Inner ring - All time data */}
              {allTimeEngagementData.length > 0 && (
                <Pie
                  data={allTimeEngagementData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {allTimeEngagementData.map((entry, index) => (
                    <Cell 
                      key={`inner-cell-${index}`} 
                      fill={entry.color}
                      opacity={0.6}
                    />
                  ))}
                </Pie>
              )}
              
              {/* Outer ring - Filtered data */}
              {filteredEngagementData.length > 0 && (
                <Pie
                  data={filteredEngagementData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {filteredEngagementData.map((entry, index) => (
                    <Cell 
                      key={`outer-cell-${index}`} 
                      fill={entry.color}
                      opacity={1}
                    />
                  ))}
                </Pie>
              )}
              
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Unified Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pb-4 border-b border-gray-200">
          {Object.entries(ENGAGEMENT_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-600 font-medium capitalize">{key}</span>
            </div>
          ))}
        </div>
        
        {/* Data summary */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-semibold text-gray-700 mb-2">📅 Filtered Period</h4>
            <div className="space-y-1">
              {filteredEngagementData.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-600">{item.name}:</span>
                  <span className="font-medium">{item.value.toLocaleString()} ({item.percentage.toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-semibold text-gray-700 mb-2">🌍 All Time</h4>
            <div className="space-y-1">
              {allTimeEngagementData.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-600">{item.name}:</span>
                  <span className="font-medium">{item.value.toLocaleString()} ({item.percentage.toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}