"use client"

import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// 移除静态导入，改为接收props

interface BrokerWeeklyDonutChartProps {
  startDate?: string;
  endDate?: string;
  brokerData?: any[];
  weeklyData?: any[];
}

// 处理broker每周平均值数据
function processBrokerWeeklyAverage(brokerDataJson: any[] = [], weeklyDataJson: any[] = []) {
  try {
    let clientsData = brokerDataJson || [];
    
    // 标准化broker名称的函数
    const normalizeBrokerName = (broker: string) => {
      if (!broker) return 'Unknown';
      if (broker.toLowerCase() === 'yuki') return 'Yuki';
      if (broker.toLowerCase() === 'ruofan') return 'Yuki';
      if (broker === 'Linudo') return 'Linduo';
      if (broker.toLowerCase() === 'ziv') return 'Ziv';
      return broker;
    };
    
    // 解析日期的函数
    const parseClientDate = (dateValue: any) => {
      if (typeof dateValue === 'number') {
        return new Date((dateValue - 25569) * 86400 * 1000);
      } else if (typeof dateValue === 'string') {
        if (dateValue.includes('/')) {
          const parts = dateValue.split('/');
          if (parts.length === 3) {
            const month = parseInt(parts[0]);
            const day = parseInt(parts[1]);
            let year = parseInt(parts[2]);
            if (year < 100) {
              year = year > 50 ? 1900 + year : 2000 + year;
            }
            return new Date(year, month - 1, day);
          }
        } else {
          return new Date(dateValue);
        }
      }
      return null;
    };
    
    // 计算所有数据的范围和broker总数
    let allDataMinDate: Date | null = null;
    let allDataMaxDate: Date | null = null;
    const allBrokerCounts: { [key: string]: number } = {};
    
    clientsData.forEach((client: any) => {
      const clientDate = parseClientDate(client.date);
      if (clientDate && !isNaN(clientDate.getTime())) {
        // 记录日期范围
        if (!allDataMinDate || clientDate < allDataMinDate) allDataMinDate = clientDate;
        if (!allDataMaxDate || clientDate > allDataMaxDate) allDataMaxDate = clientDate;
        
        // 统计broker总数
        const broker = normalizeBrokerName(client.broker);
        allBrokerCounts[broker] = (allBrokerCounts[broker] || 0) + 1;
      }
    });
    
    // 使用实际的周数据总数，与其他组件保持一致
    const totalWeeks = weeklyDataJson.length;
    
    // 生成每周平均数据 - 过滤掉W、N/A和ruofan
    const weeklyAverageData = Object.entries(allBrokerCounts)
      .filter(([broker, count]) => {
        // 过滤掉不需要的broker
        const excludeBrokers = ['ruofan', 'Unknown'];
        return count > 0 && !excludeBrokers.includes(broker);
      })
      .sort(([,a], [,b]) => b - a)
      .map(([broker, totalLeads]) => {
        const weeklyAverage = totalLeads / totalWeeks;
        return {
          name: broker,
          value: Math.round(weeklyAverage * 10) / 10,
          totalLeads
        };
      });
    
    console.log('Broker每周平均数据:', {
      totalWeeks,
      allBrokerCounts,
      weeklyAverageData
    });
    
    return {
      data: weeklyAverageData,
      totalWeeks
    };
    
  } catch (error) {
    console.error('Failed to process broker weekly average data:', error);
    return {
      data: [],
      totalWeeks: 0
    };
  }
}

// 颜色配置 - 与左侧饼图保持一致
const getBrokerColor = (brokerName: string) => {
  const brokerColors: { [key: string]: string } = {
    'Ziv': '#FF8C00',
    'Yuki': '#B07AA1', 
    'Jo': '#a2e329',
    'Amy': '#3cbde5'
  };
  
  if (brokerColors[brokerName]) {
    return brokerColors[brokerName];
  }
  
  const companyColors = ['#751fae', '#8f4abc', '#a875ca', '#c29fd9', '#ef3c99', '#f186be', '#f3abd0', '#f4d0e3'];
  const index = Object.keys(brokerColors).length;
  return companyColors[index % companyColors.length];
};

export function BrokerWeeklyDonutChart({ startDate = '', endDate = '', brokerData = [], weeklyData = [] }: BrokerWeeklyDonutChartProps) {
  const { data, totalWeeks } = useMemo(() => {
    return processBrokerWeeklyAverage(brokerData, weeklyData);
  }, [brokerData, weeklyData]);

  // Comment状态
  const [comment, setComment] = useState('');
  
  // 从localStorage加载保存的评论
  useEffect(() => {
    const savedComment = localStorage.getItem('donutChartComment');
    if (savedComment) {
      setComment(savedComment);
    }
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            Weekly Average: {data.value} leads
          </p>
          <p className="text-xs text-gray-500">
            Total: {data.totalLeads} leads
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 font-montserrat">Weekly Broker Avg Leads (All Time)</h3>
      </div>

      {/* 饼图 */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={0}
              outerRadius={120}
              paddingAngle={0}
              dataKey="value"
              nameKey="name"
              stroke="#fff"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBrokerColor(entry.name)} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* 自定义图例 */}
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: getBrokerColor(entry.name) }}
            />
            <span className="text-sm text-gray-700 font-montserrat font-light">{entry.name}</span>
          </div>
        ))}
      </div>

      {/* 详细数据列表 */}
      <div className="mt-2">
        <div className="grid grid-cols-2 gap-1">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: getBrokerColor(entry.name) }}
              ></div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-gray-800 font-montserrat">{entry.name}</span>
                <span className="text-xs font-semibold text-gray-900 font-montserrat">{entry.value} leads/week</span>
                <span className="text-xs text-gray-600 font-montserrat font-light">{entry.totalLeads} total</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Comment输入框 */}
        <div className="mt-3 p-4 bg-black rounded-lg border border-gray-600">
          <Label htmlFor="donut-chart-comment" className="text-sm font-semibold text-white mb-2 block font-montserrat">
            Comments & Notes
          </Label>
          <Textarea
            id="donut-chart-comment"
            placeholder="Add your comments or insights about the broker weekly average performance..."
            value={comment}
            onChange={(e) => {
              const newComment = e.target.value;
              setComment(newComment);
              localStorage.setItem('donutChartComment', newComment);
            }}
            className="w-full min-h-[80px] resize-none bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400/20 font-montserrat font-light"
          />
          {comment && (
            <div className="mt-2 text-xs text-gray-400 font-montserrat font-light">
              Character count: {comment.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}