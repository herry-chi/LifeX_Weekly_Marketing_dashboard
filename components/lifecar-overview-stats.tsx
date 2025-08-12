"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface LifeCarOverviewStatsProps {
  data: LifeCarDailyData[]
}

export function LifeCarOverviewStats({ data }: LifeCarOverviewStatsProps) {
  const totalSpend = data.reduce((sum, item) => sum + item.spend, 0)
  const totalFollowers = data.reduce((sum, item) => sum + item.followers, 0)
  const totalInteractions = data.reduce((sum, item) => sum + item.interactions, 0)
  const totalImpressions = data.reduce((sum, item) => sum + item.impressions, 0)
  const totalPrivateMessages = data.reduce((sum, item) => sum + item.privateMessages, 0)
  
  const avgDailySpend = data.length > 0 ? totalSpend / data.length : 0
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0
  const ctr = totalImpressions > 0 ? (totalInteractions / totalImpressions) * 100 : 0
  const engagementRate = totalFollowers > 0 ? (totalInteractions / totalFollowers) * 100 : 0

  const stats = [
    {
      title: "Total Spend",
      value: `$${totalSpend.toFixed(2)}`,
      description: "Campaign investment",
      icon: "💰",
      color: "from-purple-700 to-pink-600"
    },
    {
      title: "Total Impressions", 
      value: totalImpressions.toLocaleString(),
      description: "Total reach achieved",
      icon: "👁️",
      color: "from-purple-700 to-pink-600"
    },
    {
      title: "Total Interactions",
      value: totalInteractions.toLocaleString(),
      description: "User engagement",
      icon: "❤️",
      color: "from-purple-700 to-pink-600"
    },
    {
      title: "New Followers",
      value: totalFollowers.toLocaleString(),
      description: "Audience growth",
      icon: "👥",
      color: "from-purple-700 to-pink-600"
    },
    {
      title: "Private Messages",
      value: totalPrivateMessages.toLocaleString(),
      description: "Direct inquiries",
      icon: "💬",
      color: "from-purple-700 to-pink-600"
    },
    {
      title: "CPM",
      value: `$${cpm.toFixed(3)}`,
      description: "Cost per 1K impressions",
      icon: "📊",
      color: "from-purple-700 to-pink-600"
    },
    {
      title: "CTR",
      value: `${ctr.toFixed(2)}%`,
      description: "Click-through rate",
      icon: "🎯",
      color: "from-purple-700 to-pink-600"
    },
    {
      title: "Avg Daily Spend",
      value: `$${avgDailySpend.toFixed(2)}`,
      description: "Daily investment",
      icon: "📅",
      color: "from-purple-700 to-pink-600"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
          <CardContent className="p-6 text-center">
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center">
              <span className="text-lg">{stat.icon}</span>
            </div>
            <div className="text-sm font-bold text-gray-700 mb-2">{stat.title}</div>
            <div className={`text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
              {stat.value}
            </div>
            <div className="text-xs font-semibold text-gray-600">{stat.description}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}