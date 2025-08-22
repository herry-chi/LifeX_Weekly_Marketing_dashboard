"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface LifeCarOverviewStatsProps {
  data: LifeCarDailyData[]
  allTimeData?: LifeCarDailyData[]
}

export function LifeCarOverviewStats({ data, allTimeData }: LifeCarOverviewStatsProps) {
  const totalSpend = data.reduce((sum, item) => sum + item.spend, 0)
  const totalFollowers = data.reduce((sum, item) => sum + item.followers, 0)
  const totalInteractions = data.reduce((sum, item) => sum + item.interactions, 0)
  const totalImpressions = data.reduce((sum, item) => sum + item.impressions, 0)
  const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0)
  const totalPrivateMessages = data.reduce((sum, item) => sum + ((item.multiConversion1 || 0) + (item.multiConversion2 || 0)), 0)
  
  const avgDailySpend = data.length > 0 ? totalSpend / data.length : 0
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const engagementRate = totalFollowers > 0 ? (totalInteractions / totalFollowers) * 100 : 0
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0
  const cpe = totalInteractions > 0 ? totalSpend / totalInteractions : 0
  const cppm = totalPrivateMessages > 0 ? totalSpend / totalPrivateMessages : 0
  
  // 计算所有时间的总体CTR作为基准AVG
  const allTimeTotalClicks = allTimeData ? allTimeData.reduce((sum, item) => sum + (item.clicks || 0), 0) : totalClicks
  const allTimeTotalImpressions = allTimeData ? allTimeData.reduce((sum, item) => sum + (item.impressions || 0), 0) : totalImpressions
  const avgCTR = allTimeTotalImpressions > 0 ? (allTimeTotalClicks / allTimeTotalImpressions) * 100 : 0
  const ctrDifference = ctr - avgCTR
  const ctrDifferencePercent = avgCTR > 0 ? ((ctr - avgCTR) / avgCTR) * 100 : 0

  // 计算所有时间的总体Engagement Rate作为基准AVG
  const allTimeTotalInteractions = allTimeData ? allTimeData.reduce((sum, item) => sum + (item.interactions || 0), 0) : totalInteractions
  const avgEngagementRate = allTimeTotalClicks > 0 ? (allTimeTotalInteractions / allTimeTotalClicks) * 100 : 0
  const currentEngagementRate = totalClicks > 0 ? (totalInteractions / totalClicks) * 100 : 0
  const engagementRateDifference = currentEngagementRate - avgEngagementRate
  const engagementRateDifferencePercent = avgEngagementRate > 0 ? ((currentEngagementRate - avgEngagementRate) / avgEngagementRate) * 100 : 0

  // 计算所有时间的总体Private Message Rate作为基准AVG
  const allTimeTotalPrivateMessages = allTimeData ? allTimeData.reduce((sum, item) => sum + ((item.multiConversion1 || 0) + (item.multiConversion2 || 0)), 0) : totalPrivateMessages
  const avgPrivateMessageRate = allTimeTotalClicks > 0 ? (allTimeTotalPrivateMessages / allTimeTotalClicks) * 100 : 0
  const currentPrivateMessageRate = totalClicks > 0 ? (totalPrivateMessages / totalClicks) * 100 : 0
  const privateMessageRateDifference = currentPrivateMessageRate - avgPrivateMessageRate
  const privateMessageRateDifferencePercent = avgPrivateMessageRate > 0 ? ((currentPrivateMessageRate - avgPrivateMessageRate) / avgPrivateMessageRate) * 100 : 0
  
  // 计算与之前同等时间段的消费对比
  const currentPeriodDays = data.length
  let previousPeriodSpend = 0
  let previousPeriodData: LifeCarDailyData[] = []
  
  if (allTimeData && allTimeData.length > 0 && data.length > 0) {
    // 获取当前选择时间段的开始日期
    const currentStartDate = new Date(Math.min(...data.map(d => new Date(d.date).getTime())))
    
    // 计算之前同等长度时间段的数据
    const previousEndDate = new Date(currentStartDate)
    previousEndDate.setDate(previousEndDate.getDate() - 1)
    const previousStartDate = new Date(previousEndDate)
    previousStartDate.setDate(previousStartDate.getDate() - currentPeriodDays + 1)
    
    // 过滤出之前时间段的数据
    previousPeriodData = allTimeData.filter(item => {
      const itemDate = new Date(item.date)
      return itemDate >= previousStartDate && itemDate <= previousEndDate
    })
    
    previousPeriodSpend = previousPeriodData.reduce((sum, item) => sum + item.spend, 0)
  }
  
  const spendDifference = totalSpend - previousPeriodSpend
  const spendDifferencePercent = previousPeriodSpend > 0 ? ((totalSpend - previousPeriodSpend) / previousPeriodSpend) * 100 : 0
  
  // 计算之前时间段的CPM
  const previousPeriodImpressions = previousPeriodData.reduce((sum, item) => sum + item.impressions, 0)
  const previousPeriodCPM = previousPeriodImpressions > 0 ? (previousPeriodSpend / previousPeriodImpressions) * 1000 : 0
  const cpmDifference = cpm - previousPeriodCPM
  const cpmDifferencePercent = previousPeriodCPM > 0 ? ((cpm - previousPeriodCPM) / previousPeriodCPM) * 100 : 0
  
  // 计算之前时间段的CPC
  const previousPeriodClicks = previousPeriodData.reduce((sum, item) => sum + item.clicks, 0)
  const previousPeriodCPC = previousPeriodClicks > 0 ? previousPeriodSpend / previousPeriodClicks : 0
  const cpcDifference = cpc - previousPeriodCPC
  const cpcDifferencePercent = previousPeriodCPC > 0 ? ((cpc - previousPeriodCPC) / previousPeriodCPC) * 100 : 0
  
  // 计算之前时间段的CPE
  const previousPeriodInteractions = previousPeriodData.reduce((sum, item) => sum + item.interactions, 0)
  const previousPeriodCPE = previousPeriodInteractions > 0 ? previousPeriodSpend / previousPeriodInteractions : 0
  const cpeDifference = cpe - previousPeriodCPE
  const cpeDifferencePercent = previousPeriodCPE > 0 ? ((cpe - previousPeriodCPE) / previousPeriodCPE) * 100 : 0
  
  // 计算之前时间段的CPPM
  const previousPeriodPrivateMessages = previousPeriodData.reduce((sum, item) => sum + ((item.multiConversion1 || 0) + (item.multiConversion2 || 0)), 0)
  const previousPeriodCPPM = previousPeriodPrivateMessages > 0 ? previousPeriodSpend / previousPeriodPrivateMessages : 0
  const cppmDifference = cppm - previousPeriodCPPM
  const cppmDifferencePercent = previousPeriodCPPM > 0 ? ((cppm - previousPeriodCPPM) / previousPeriodCPPM) * 100 : 0

  const stats = [
    {
      title: "Total Spend",
      value: `¥${totalSpend.toFixed(2)}`,
      description: "Campaign investment",
      icon: "💰",
      color: "from-purple-700 to-pink-600",
      isSpecial: true,
      spendDifference: spendDifference,
      spendDifferencePercent: spendDifferencePercent,
      previousPeriodSpend: previousPeriodSpend,
      currentPeriodDays: currentPeriodDays
    },
    {
      title: "CTR",
      value: `${ctr.toFixed(2)}%`,
      description: "Click-through rate",
      icon: "🎯",
      color: "from-purple-700 to-pink-600",
      isSpecial: true,
      ctrDifference: ctrDifference,
      ctrDifferencePercent: ctrDifferencePercent,
      totalClicks: totalClicks,
      totalImpressions: totalImpressions
    },
    {
      title: "Engagement Rate",
      value: `${currentEngagementRate.toFixed(2)}%`,
      description: "Interactions per click",
      icon: "❤️",
      color: "from-purple-700 to-pink-600",
      isSpecial: true,
      engagementRateDifference: engagementRateDifference,
      engagementRateDifferencePercent: engagementRateDifferencePercent,
      totalInteractions: totalInteractions,
      totalClicks: totalClicks
    },
    {
      title: "Private Message Rate",
      value: `${currentPrivateMessageRate.toFixed(2)}%`,
      description: "Private messages per click",
      icon: "💬",
      color: "from-purple-700 to-pink-600",
      isSpecial: true,
      privateMessageRateDifference: privateMessageRateDifference,
      privateMessageRateDifferencePercent: privateMessageRateDifferencePercent,
      totalPrivateMessages: totalPrivateMessages,
      totalClicks: totalClicks
    },
    {
      title: "CPM",
      value: `¥${cpm.toFixed(2)}`,
      description: "Cost per 1K impressions",
      icon: "📊",
      color: "from-purple-700 to-pink-600",
      isSpecial: true,
      cpmDifference: cpmDifference,
      cpmDifferencePercent: cpmDifferencePercent,
      previousPeriodCPM: previousPeriodCPM,
      currentPeriodDays: currentPeriodDays
    },
    {
      title: "CPC",
      value: `¥${cpc.toFixed(2)}`,
      description: "Cost per click",
      icon: "💵",
      color: "from-purple-700 to-pink-600",
      isSpecial: true,
      cpcDifference: cpcDifference,
      cpcDifferencePercent: cpcDifferencePercent,
      previousPeriodCPC: previousPeriodCPC,
      currentPeriodDays: currentPeriodDays
    },
    {
      title: "CPE",
      value: `¥${cpe.toFixed(2)}`,
      description: "Cost per engagement",
      icon: "💸",
      color: "from-purple-700 to-pink-600",
      isSpecial: true,
      cpeDifference: cpeDifference,
      cpeDifferencePercent: cpeDifferencePercent,
      previousPeriodCPE: previousPeriodCPE,
      currentPeriodDays: currentPeriodDays
    },
    {
      title: "CPPM",
      value: `¥${cppm.toFixed(2)}`,
      description: "Cost per private message",
      icon: "📩",
      color: "from-purple-700 to-pink-600",
      isSpecial: true,
      cppmDifference: cppmDifference,
      cppmDifferencePercent: cppmDifferencePercent,
      previousPeriodCPPM: previousPeriodCPPM,
      currentPeriodDays: currentPeriodDays
    }
  ]

  return (
    <div className="mb-6">
      {/* First row - 4 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.slice(0, 4).map((stat, index) => (
          <Card key={index} className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
            <CardContent className="p-6 text-center">
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center">
                <span className="text-lg">{stat.icon}</span>
              </div>
              <div className="text-sm font-bold text-gray-700 mb-2">{stat.title}</div>
              <div className={`text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                {stat.value}
              </div>
              
              {/* 特殊的CTR、Engagement Rate或Private Message Rate卡片显示 */}
              {stat.isSpecial ? (
                <div className="space-y-2">
                  {/* 与平均值对比的箭头和百分比 */}
                  <div className="flex items-center justify-center gap-1">
                    {stat.title === 'CTR' ? (
                      <span className={`${stat.ctrDifference >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                        {stat.ctrDifference >= 0 ? '▲' : '▼'}
                        {Math.abs(stat.ctrDifferencePercent).toFixed(1)}%
                      </span>
                    ) : stat.title === 'Engagement Rate' ? (
                      <span className={`${stat.engagementRateDifference >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                        {stat.engagementRateDifference >= 0 ? '▲' : '▼'}
                        {Math.abs(stat.engagementRateDifferencePercent).toFixed(1)}%
                      </span>
                    ) : stat.title === 'Private Message Rate' ? (
                      <span className={`${stat.privateMessageRateDifference >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                        {stat.privateMessageRateDifference >= 0 ? '▲' : '▼'}
                        {Math.abs(stat.privateMessageRateDifferencePercent).toFixed(1)}%
                      </span>
                    ) : stat.title === 'Total Spend' ? (
                      <span className={`${stat.spendDifference >= 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold flex items-center`}>
                        {stat.spendDifference >= 0 ? '▲' : '▼'}
                        {Math.abs(stat.spendDifferencePercent).toFixed(1)}%
                      </span>
                    ) : null}
                    <span className="text-xs text-gray-500">{stat.title === 'Total Spend' ? 'vs Previous Period' : 'vs AVG'}</span>
                  </div>
                  {/* 详细信息 */}
                  <div className="text-xs text-gray-600">
                    {stat.title === 'CTR' ? (
                      <>{stat.totalClicks?.toLocaleString()} clicks / {stat.totalImpressions?.toLocaleString()} impressions</>
                    ) : stat.title === 'Engagement Rate' ? (
                      <>{stat.totalInteractions?.toLocaleString()} interactions / {stat.totalClicks?.toLocaleString()} clicks</>
                    ) : stat.title === 'Private Message Rate' ? (
                      <>{stat.totalPrivateMessages?.toLocaleString()} messages / {stat.totalClicks?.toLocaleString()} clicks</>
                    ) : stat.title === 'Total Spend' ? (
                      <>Previous {stat.currentPeriodDays} days: ¥{stat.previousPeriodSpend?.toFixed(2)}</>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="text-xs font-semibold text-gray-600">{stat.description}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Second row - 4 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.slice(4).map((stat, index) => (
          <Card key={index + 4} className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
          <CardContent className="p-6 text-center">
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center">
              <span className="text-lg">{stat.icon}</span>
            </div>
            <div className="text-sm font-bold text-gray-700 mb-2">{stat.title}</div>
            <div className={`text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
              {stat.value}
            </div>
            
            {/* 特殊的CTR、Engagement Rate或Private Message Rate卡片显示 */}
            {stat.isSpecial ? (
              <div className="space-y-2">
                {/* 与平均值对比的箭头和百分比 */}
                <div className="flex items-center justify-center gap-1">
                  {stat.title === 'CTR' ? (
                    <span className={`${stat.ctrDifference >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                      {stat.ctrDifference >= 0 ? '▲' : '▼'}
                      {Math.abs(stat.ctrDifferencePercent).toFixed(1)}%
                    </span>
                  ) : stat.title === 'Engagement Rate' ? (
                    <span className={`${stat.engagementRateDifference >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                      {stat.engagementRateDifference >= 0 ? '▲' : '▼'}
                      {Math.abs(stat.engagementRateDifferencePercent).toFixed(1)}%
                    </span>
                  ) : stat.title === 'Private Message Rate' ? (
                    <span className={`${stat.privateMessageRateDifference >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                      {stat.privateMessageRateDifference >= 0 ? '▲' : '▼'}
                      {Math.abs(stat.privateMessageRateDifferencePercent).toFixed(1)}%
                    </span>
                  ) : stat.title === 'Total Spend' ? (
                    <span className={`${stat.spendDifference >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                      {stat.spendDifference >= 0 ? '▲' : '▼'}
                      {Math.abs(stat.spendDifferencePercent).toFixed(1)}%
                    </span>
                  ) : stat.title === 'CPM' ? (
                    <span className={`${stat.cpmDifference >= 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold flex items-center`}>
                      {stat.cpmDifference >= 0 ? '▲' : '▼'}
                      {Math.abs(stat.cpmDifferencePercent).toFixed(1)}%
                    </span>
                  ) : stat.title === 'CPC' ? (
                    <span className={`${stat.cpcDifference >= 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold flex items-center`}>
                      {stat.cpcDifference >= 0 ? '▲' : '▼'}
                      {Math.abs(stat.cpcDifferencePercent).toFixed(1)}%
                    </span>
                  ) : stat.title === 'CPE' ? (
                    <span className={`${stat.cpeDifference >= 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold flex items-center`}>
                      {stat.cpeDifference >= 0 ? '▲' : '▼'}
                      {Math.abs(stat.cpeDifferencePercent).toFixed(1)}%
                    </span>
                  ) : stat.title === 'CPPM' ? (
                    <span className={`${stat.cppmDifference >= 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold flex items-center`}>
                      {stat.cppmDifference >= 0 ? '▲' : '▼'}
                      {Math.abs(stat.cppmDifferencePercent).toFixed(1)}%
                    </span>
                  ) : null}
                  <span className="text-xs text-gray-500">{(stat.title === 'Total Spend' || stat.title === 'CPM' || stat.title === 'CPC' || stat.title === 'CPE' || stat.title === 'CPPM') ? 'vs Previous Period' : 'vs AVG'}</span>
                </div>
                {/* 详细信息 */}
                <div className="text-xs text-gray-600">
                  {stat.title === 'CTR' ? (
                    <>{stat.totalClicks?.toLocaleString()} clicks / {stat.totalImpressions?.toLocaleString()} impressions</>
                  ) : stat.title === 'Engagement Rate' ? (
                    <>{stat.totalInteractions?.toLocaleString()} interactions / {stat.totalClicks?.toLocaleString()} clicks</>
                  ) : stat.title === 'Private Message Rate' ? (
                    <>{stat.totalPrivateMessages?.toLocaleString()} messages / {stat.totalClicks?.toLocaleString()} clicks</>
                  ) : stat.title === 'Total Spend' ? (
                    <>Previous {stat.currentPeriodDays} days: ¥{stat.previousPeriodSpend?.toFixed(2)}</>
                  ) : stat.title === 'CPM' ? (
                    <>Previous {stat.currentPeriodDays} days: ¥{stat.previousPeriodCPM?.toFixed(2)}</>
                  ) : stat.title === 'CPC' ? (
                    <>Previous {stat.currentPeriodDays} days: ¥{stat.previousPeriodCPC?.toFixed(2)}</>
                  ) : stat.title === 'CPE' ? (
                    <>Previous {stat.currentPeriodDays} days: ¥{stat.previousPeriodCPE?.toFixed(2)}</>
                  ) : stat.title === 'CPPM' ? (
                    <>Previous {stat.currentPeriodDays} days: ¥{stat.previousPeriodCPPM?.toFixed(2)}</>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="text-xs font-semibold text-gray-600">{stat.description}</div>
            )}
          </CardContent>
        </Card>
        ))}
      </div>
    </div>
  )
}