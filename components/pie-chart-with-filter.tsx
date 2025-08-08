"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { WeeklyLeadsDistribution } from '@/components/weekly-leads-distribution';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// 移除静态导入，改为接收props
import { getDataRange } from '@/lib/date-utils';

// 处理饼图数据 - 使用真实Excel数据中的 Broker 列，支持时间筛选
function processBrokerData(brokerDataJson: any[], startDate?: string, endDate?: string) {
  try {
    let clientsData = brokerDataJson || []
    
    // 如果有时间筛选，过滤数据
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // 设置为当天结束时间
      
      clientsData = clientsData.filter((client: any) => {
        // Convert Excel date serial number to JavaScript Date
        const excelBase = new Date(1899, 11, 30);
        const clientDate = new Date(excelBase.getTime() + client.date * 24 * 60 * 60 * 1000);
        
        // 规范化到同一天的开始时间进行比较
        const clientDateOnly = new Date(clientDate.getFullYear(), clientDate.getMonth(), clientDate.getDate())
        const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate())
        const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate())
        
        return clientDateOnly >= startDateOnly && clientDateOnly <= endDateOnly
      })
    }
    
    // 统计每个 Broker 的客户数量
    const brokerCounts = clientsData.reduce((acc: any, client: any) => {
      let broker = client.broker || 'Unknown'
      
      // Normalize broker names
      if (broker.toLowerCase() === 'yuki') {
        broker = 'Yuki'
      } else if (broker.toLowerCase() === 'ruofan') {
        broker = 'Yuki'
      } else if (broker === 'Linudo') {
        broker = 'Linduo'
      } else if (broker.toLowerCase() === 'ziv') {
        broker = 'Ziv'
      }
      
      acc[broker] = (acc[broker] || 0) + 1
      return acc
    }, {})

    const total = clientsData.length
    return Object.entries(brokerCounts)
      .filter(([broker, count]: [string, any]) => {
        // 过滤掉不需要的broker
        const excludeBrokers = ['ruofan', 'Unknown'];
        return count > 0 && !excludeBrokers.includes(broker);
      })
      .map(([broker, count]: [string, any]) => ({
        broker,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count) // 按数量降序排列
  } catch (error) {
    console.error('Failed to process pie chart data:', error)
    return []
  }
}

interface PieChartWithFilterProps {
  startDate?: string;
  endDate?: string;
  brokerData?: any[];
}

export function PieChartWithFilter({ startDate = '', endDate = '', brokerData = [] }: PieChartWithFilterProps) {
  // 获取筛选后的数据
  const processedBrokerData = useMemo(() => {
    const data = processBrokerData(brokerData, startDate, endDate);
    return data;
  }, [brokerData, startDate, endDate]);

  const totalClients = useMemo(() => {
    return processedBrokerData.reduce((sum, broker) => sum + broker.count, 0);
  }, [processedBrokerData]);

  // Comment状态
  const [comment, setComment] = useState('');
  
  // 从localStorage加载保存的评论
  useEffect(() => {
    const savedComment = localStorage.getItem('pieChartComment');
    if (savedComment) {
      setComment(savedComment);
    }
  }, []);

  return (
    <div className="p-6">
      {/* 数据状态提示 */}
      {startDate && endDate && (
        <div className="mb-4">
          {totalClients === 0 ? (
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded font-montserrat font-light">
              ⚠️ No data in this time range. Excel file data only goes up to July 6, 2025.
            </div>
          ) : (
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded font-montserrat font-light">
              ✅ Filter successful, found {totalClients} client records
            </div>
          )}
        </div>
      )}

      {/* 饼图 */}
      <WeeklyLeadsDistribution 
        data={processedBrokerData} 
        title=""
      />
      
      {/* Broker统计信息 */}
      <div className="-mt-4">        
        {/* 详细列表 - 两列显示 */}
        <div className="grid grid-cols-2 gap-1">
          {processedBrokerData.length > 0 ? (
            processedBrokerData.map((broker, index) => {
              // 使用与饼图一致的颜色映射
              const getBrokerColor = (brokerName: string, index: number) => {
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
                return companyColors[index % companyColors.length];
              };

              return (
                <div key={broker.broker} className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ 
                      backgroundColor: getBrokerColor(broker.broker, index)
                    }}
                  />
                  <span className="text-xs font-medium text-gray-800 min-w-[30px]">{broker.broker}</span>
                  <span className="text-xs font-semibold text-gray-900">{broker.count} leads</span>
                  <span className="text-xs text-gray-600 ml-1">{broker.percentage}%</span>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center text-gray-500 py-4 font-montserrat font-light">
              No data available for the selected time period
            </div>
          )}
        </div>
        
        {/* Comment输入框 */}
        <div className="mt-3 p-4 bg-black rounded-lg border border-gray-600">
          <Label htmlFor="pie-chart-comment" className="text-sm text-white font-montserrat font-semibold mb-2 block">
            Comments & Notes
          </Label>
          <Textarea
            id="pie-chart-comment"
            placeholder="Add your comments or insights about the broker distribution..."
            value={comment}
            onChange={(e) => {
              const newComment = e.target.value;
              setComment(newComment);
              localStorage.setItem('pieChartComment', newComment);
            }}
            className="w-full min-h-[80px] resize-none bg-gray-800 border-gray-600 text-white placeholder-gray-400 font-montserrat font-light focus:border-purple-400 focus:ring-purple-400/20"
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