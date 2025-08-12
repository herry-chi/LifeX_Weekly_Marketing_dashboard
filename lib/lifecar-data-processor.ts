// LifeCAR数据处理器
export interface LifeCarDailyData {
  date: string
  spend: number
  followers: number
  interactions: number
  impressions: number
  privateMessages: number
}

export interface LifeCarMonthlyData {
  month: string
  totalSpend: number
  totalFollowers: number
  totalInteractions: number
  totalImpressions: number
  totalPrivateMessages: number
  avgDailySpend: number
  avgDailyInteractions: number
  cpm: number // 每千次展现成本
  cpi: number // 每次互动成本
}

export interface LifeCarWeeklyData {
  week: string
  totalSpend: number
  totalFollowers: number
  totalInteractions: number
  totalImpressions: number
  totalPrivateMessages: number
  avgDailySpend: number
}

// 解析CSV数据
export function parseLifeCarData(csvText: string): LifeCarDailyData[] {
  const lines = csvText.trim().split('\n')
  const data: LifeCarDailyData[] = []
  
  // 跳过标题行和合计行
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const columns = line.split(',')
    if (columns.length >= 6) {
      const dateStr = columns[0]
      const spend = parseFloat(columns[1]) || 0
      const followers = parseInt(columns[2]) || 0
      const interactions = parseInt(columns[3]) || 0
      const impressions = parseInt(columns[4]) || 0
      const privateMessages = parseInt(columns[5]) || 0
      
      // 验证日期格式
      if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        data.push({
          date: dateStr,
          spend,
          followers,
          interactions,
          impressions,
          privateMessages
        })
      }
    }
  }
  
  return data.sort((a, b) => a.date.localeCompare(b.date))
}

// 按月聚合数据
export function aggregateByMonth(dailyData: LifeCarDailyData[]): LifeCarMonthlyData[] {
  const monthlyMap: Record<string, LifeCarDailyData[]> = {}
  
  dailyData.forEach(item => {
    const month = item.date.substring(0, 7) // YYYY-MM
    if (!monthlyMap[month]) {
      monthlyMap[month] = []
    }
    monthlyMap[month].push(item)
  })
  
  return Object.entries(monthlyMap).map(([month, items]) => {
    const totalSpend = items.reduce((sum, item) => sum + item.spend, 0)
    const totalFollowers = items.reduce((sum, item) => sum + item.followers, 0)
    const totalInteractions = items.reduce((sum, item) => sum + item.interactions, 0)
    const totalImpressions = items.reduce((sum, item) => sum + item.impressions, 0)
    const totalPrivateMessages = items.reduce((sum, item) => sum + item.privateMessages, 0)
    const daysCount = items.length
    
    return {
      month,
      totalSpend,
      totalFollowers,
      totalInteractions,
      totalImpressions,
      totalPrivateMessages,
      avgDailySpend: totalSpend / daysCount,
      avgDailyInteractions: totalInteractions / daysCount,
      cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      cpi: totalInteractions > 0 ? totalSpend / totalInteractions : 0
    }
  }).sort((a, b) => a.month.localeCompare(b.month))
}

// 按周聚合数据
export function aggregateByWeek(dailyData: LifeCarDailyData[]): LifeCarWeeklyData[] {
  const weeklyMap: Record<string, LifeCarDailyData[]> = {}
  
  dailyData.forEach(item => {
    const date = new Date(item.date)
    const year = date.getFullYear()
    const weekNum = getWeekNumber(date)
    const weekKey = `${year}/wk${weekNum.toString().padStart(2, '0')}`
    
    if (!weeklyMap[weekKey]) {
      weeklyMap[weekKey] = []
    }
    weeklyMap[weekKey].push(item)
  })
  
  return Object.entries(weeklyMap).map(([week, items]) => {
    const totalSpend = items.reduce((sum, item) => sum + item.spend, 0)
    const totalFollowers = items.reduce((sum, item) => sum + item.followers, 0)
    const totalInteractions = items.reduce((sum, item) => sum + item.interactions, 0)
    const totalImpressions = items.reduce((sum, item) => sum + item.impressions, 0)
    const totalPrivateMessages = items.reduce((sum, item) => sum + item.privateMessages, 0)
    const daysCount = items.length
    
    return {
      week,
      totalSpend,
      totalFollowers,
      totalInteractions,
      totalImpressions,
      totalPrivateMessages,
      avgDailySpend: totalSpend / daysCount
    }
  }).sort((a, b) => a.week.localeCompare(b.week))
}

// 计算周数
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

// 按日期范围过滤数据
export function filterByDateRange(
  dailyData: LifeCarDailyData[], 
  startDate?: string, 
  endDate?: string
): LifeCarDailyData[] {
  if (!startDate && !endDate) return dailyData
  
  return dailyData.filter(item => {
    const itemDate = item.date
    if (startDate && itemDate < startDate) return false
    if (endDate && itemDate > endDate) return false
    return true
  })
}