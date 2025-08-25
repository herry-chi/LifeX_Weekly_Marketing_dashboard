"use client"

import { Bar, BarChart, Line, LineChart, Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, LabelList } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeCarMonthlyData, LifeCarDailyData } from "@/lib/lifecar-data-processor"
import { DualAxisRollingAverageChart } from "@/components/dual-axis-rolling-average-chart"
import { SpendEngagementRollingChart } from "@/components/spend-engagement-rolling-chart"

interface LifeCarMonthlySummaryProps {
  data: LifeCarMonthlyData[]
  dailyData?: LifeCarDailyData[]
  unfilteredDailyData?: LifeCarDailyData[]  // 新增：未筛选的原始数据
  title?: string
}

export function LifeCarMonthlySummary({ data, dailyData = [], unfilteredDailyData, title = "Monthly Performance Summary" }: LifeCarMonthlySummaryProps) {
  const chartData = data.map(item => ({
    month: item.month,
    spend: item.totalSpend,
    interactions: item.totalInteractions,
    followers: item.totalFollowers,
    cpm: item.cpm,
    cpi: item.cpi
  }))

  // Custom label renderer with clear positioning
  const renderSpendLabel = (props: any) => {
    const { x, y, value, index, payload } = props;
    if (!value) return null;
    
    // Position above the point
    const yOffset = -12;
    
    return (
      <text 
        x={x} 
        y={y + yOffset} 
        fill="#EF3C99" 
        fontSize={10}
        fontWeight="bold"
        textAnchor="middle"
      >
        {`¥${value.toFixed(0)}`}
      </text>
    );
  }

  const renderInteractionsLabel = (props: any) => {
    const { x, y, value, index, payload } = props;
    if (!value) return null;
    
    // Position below the point
    const yOffset = 16;
    
    return (
      <text 
        x={x} 
        y={y + yOffset} 
        fill="#751FAE" 
        fontSize={10}
        fontWeight="bold"
        textAnchor="middle"
      >
        {value.toLocaleString()}
      </text>
    );
  }

  return (
    <div className="space-y-6">
      {/* 新增：7天滚动平均双Y轴图表 - 使用未筛选的原始数据 */}
      {unfilteredDailyData && unfilteredDailyData.length > 0 && (
        <>
          <DualAxisRollingAverageChart 
            data={unfilteredDailyData} 
            title="7-Day Rolling Average Analysis: Spend & Clicks"
          />
          
          {/* 新增：消费vs互动量和私信量的7天滚动平均图表 - 使用未筛选的原始数据 */}
          <SpendEngagementRollingChart 
            data={unfilteredDailyData} 
            title="7-Day Rolling Average: Spend vs Engagement & Private Messages"
          />
        </>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 月度支出和互动 */}
        <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">
              💰 Monthly Spend & Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF3C99" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF3C99" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#751FAE" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#751FAE" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    tick={{ fontSize: 12, fill: '#EF3C99' }}
                    label={{ value: 'Spend (¥)', angle: -90, position: 'insideLeft', style: { fill: '#EF3C99' } }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: '#751FAE' }}
                    label={{ value: 'Engagement', angle: 90, position: 'insideRight', style: { fill: '#751FAE' } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'spend') {
                        return [`¥${value.toFixed(2)}`, 'Total Spend']
                      }
                      return [value.toLocaleString(), 'Engagement']
                    }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="spend"
                    stroke="#EF3C99"
                    strokeWidth={2}
                    fill="url(#colorSpend)"
                    name="Spend (¥)"
                    dot={{ fill: '#EF3C99', r: 4 }}
                    activeDot={{ r: 6 }}
                  >
                    <LabelList 
                      content={renderSpendLabel}
                    />
                  </Area>
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="interactions"
                    stroke="#751FAE"
                    strokeWidth={2}
                    fill="url(#colorInteractions)"
                    name="Engagement"
                    dot={{ fill: '#751FAE', r: 4 }}
                    activeDot={{ r: 6 }}
                  >
                    <LabelList 
                      content={renderInteractionsLabel}
                    />
                  </Area>
                </AreaChart>
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
                        return [`¥${value.toFixed(3)}`, 'CPM (Cost per 1000 impressions)']
                      }
                      if (name === 'cpi') {
                        return [`¥${value.toFixed(2)}`, 'CPI (Cost per interaction)']
                      }
                      return [value.toFixed(2), name]
                    }}
                  />
                  <Legend />
                  <Bar dataKey="cpm" fill="#10B981" name="CPM (¥)" />
                  <Bar dataKey="cpi" fill="#F59E0B" name="CPI (¥)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}