"use client"

import React, { useState, useMemo } from 'react';
import { WeekdayLeadsDistribution } from '@/components/weekday-leads-distribution';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// 移除静态导入，改为接收props
import { getDataRange } from '@/lib/date-utils';

// Convert week number to date range
function parseWeekToDateRange(weekStr: string): { start: Date, end: Date } | null {
  const match = weekStr.match(/(\d{4})\/wk(\d+)/)
  if (!match) return null
  
  const year = parseInt(match[1])
  const weekNum = parseInt(match[2])
  
  // 计算该年第一天
  const firstDay = new Date(year, 0, 1)
  const dayOfWeek = firstDay.getDay()
  
  // 计算第一周的开始（周一）
  const firstMonday = new Date(firstDay)
  firstMonday.setDate(firstDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
  
  // 计算目标周的开始
  const weekStart = new Date(firstMonday)
  weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7)
  
  // 计算目标周的结束
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  return { start: weekStart, end: weekEnd }
}

// 处理Weekday数据 - 使用broker数据按星期几统计
function processBrokerDataForWeekday(brokerDataJson: any[], startDate?: string, endDate?: string) {
  try {
    let brokerData = brokerDataJson || []
    
    // 如果有时间筛选，过滤数据
    if (startDate && endDate) {
      const filterStart = new Date(startDate)
      const filterEnd = new Date(endDate)
      filterEnd.setHours(23, 59, 59, 999) // 设置为当天结束时间
      
      brokerData = brokerData.filter((item: any) => {
        if (!item.date) return false
        
        // Convert Excel date serial number to JavaScript Date
        let itemDate: Date;
        if (typeof item.date === 'number') {
          const excelBase = new Date(1899, 11, 30);
          itemDate = new Date(excelBase.getTime() + item.date * 24 * 60 * 60 * 1000);
        } else {
          itemDate = new Date(item.date);
        }
        
        // 规范化到同一天的开始时间进行比较
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate())
        const startDateOnly = new Date(filterStart.getFullYear(), filterStart.getMonth(), filterStart.getDate())
        const endDateOnly = new Date(filterEnd.getFullYear(), filterEnd.getMonth(), filterEnd.getDate())
        
        return itemDateOnly >= startDateOnly && itemDateOnly <= endDateOnly
      })
    }
    
    return brokerData
  } catch (error) {
    console.error('处理Weekday数据失败:', error)
    return []
  }
}

// 处理WeeklyCostLeads数据 - 使用totalCost和leadsTotal
function processWeeklyCostLeadsData(weeklyDataJson: any[], startDate?: string, endDate?: string) {
  try {
    let weeklyData = weeklyDataJson || []
    
    // 如果有时间筛选，过滤数据
    if (startDate && endDate) {
      const filterStart = new Date(startDate)
      const filterEnd = new Date(endDate)
      
      weeklyData = weeklyData.filter((item: any) => {
        if (!item.week) return false
        
        const weekRange = parseWeekToDateRange(item.week)
        if (!weekRange) return false
        
        // 检查周次是否与筛选时间范围有重叠
        return !(weekRange.end < filterStart || weekRange.start > filterEnd)
      })
    }
    
    // 排序：从2024/wk44开始，按年份和周次排序
    return weeklyData
      .filter((item: any) => item.week && (item.totalCost > 0 || item.leadsTotal > 0))
      .sort((a: any, b: any) => {
        // 按年份和周次排序
        const parseWeek = (week: string) => {
          const match = week.match(/(\d{4})\/wk(\d+)/)
          if (match) {
            const year = parseInt(match[1])
            const weekNum = parseInt(match[2])
            return year * 100 + weekNum
          }
          return 0
        }
        return parseWeek(a.week) - parseWeek(b.week)
      })
  } catch (error) {
    console.error('处理WeeklyCostLeads数据失败:', error)
    return []
  }
}

interface WeekdayChartWithFilterProps {
  brokerData?: any[];
  weeklyData?: any[];
  dailyCostData?: any[];
}

export function WeekdayChartWithFilter({ brokerData = [], weeklyData = [], dailyCostData = [] }: WeekdayChartWithFilterProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const handleApplyFilter = () => {
    setError('');
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be later than end date');
      return;
    }
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setError('');
  };

  const handleQuickSelect = (range: string) => {
    setError('');
    let start = '';
    let end = '';
    
    switch (range) {
      case 'recent':
        start = '2025-07-01';
        end = '2025-08-31';
        break;
      case 'dynamicLastWeek':
        // 动态计算上周日期
        const today = new Date();
        
        // 计算上周日（上周的结束）
        const lastSunday = new Date(today);
        lastSunday.setDate(today.getDate() - (today.getDay() || 7)); // 上周日
        
        // 计算上周一（上周的开始）
        const lastMonday = new Date(lastSunday);
        lastMonday.setDate(lastSunday.getDate() - 6); // 上周一
        
        start = lastMonday.toISOString().split('T')[0];
        end = lastSunday.toISOString().split('T')[0];
        break;
      case 'thisMonth':
        start = '2025-08-01';
        end = '2025-08-31';
        break;
      case 'july7test':
        start = '2025-07-07';
        end = '2025-07-31';
        break;
      default:
        return;
    }
    
    setStartDate(start);
    setEndDate(end);
  };

  // 获取筛选后的数据
  const brokerWeekdayData = useMemo(() => {
    const data = processBrokerDataForWeekday(brokerData, startDate, endDate);
    return data;
  }, [brokerData, startDate, endDate]);

  const weeklyCostLeadsData = useMemo(() => {
    const data = processWeeklyCostLeadsData(weeklyData, startDate, endDate);
    return data;
  }, [weeklyData, startDate, endDate]);

  // 过滤日消费数据
  const filteredDailyCostData = useMemo(() => {
    let data = dailyCostData || [];
    
    if (startDate && endDate) {
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      filterEnd.setHours(23, 59, 59, 999);
      
      data = data.filter((item: any) => {
        if (!item.date) return false;
        
        // Convert Excel date serial number to JavaScript Date
        let itemDate: Date;
        if (typeof item.date === 'number') {
          const excelBase = new Date(1899, 11, 30);
          itemDate = new Date(excelBase.getTime() + item.date * 24 * 60 * 60 * 1000);
        } else {
          itemDate = new Date(item.date);
        }
        
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        const startDateOnly = new Date(filterStart.getFullYear(), filterStart.getMonth(), filterStart.getDate());
        const endDateOnly = new Date(filterEnd.getFullYear(), filterEnd.getMonth(), filterEnd.getDate());
        
        return itemDateOnly >= startDateOnly && itemDateOnly <= endDateOnly;
      });
    }
    
    return data;
  }, [startDate, endDate]);

  const totalClients = useMemo(() => {
    return brokerWeekdayData.length;
  }, [brokerWeekdayData]);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* 时间筛选器 */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium mb-3 font-montserrat">Weekday Chart Time Filter</h4>
        
        {/* 快速选择按钮 */}
        <div className="mb-3">
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => handleQuickSelect('recent')} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              Recent Months (Jul-Aug)
            </Button>
            <Button 
              onClick={() => handleQuickSelect('thisMonth')} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              August Data
            </Button>
            <Button 
              onClick={() => handleQuickSelect('dynamicLastWeek')} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              Last Week
            </Button>
          </div>
        </div>

        {/* 自定义日期范围 */}
        <div className="space-y-3">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="weekday-start-date" className="text-xs font-montserrat font-semibold">Start Date</Label>
              <Input
                id="weekday-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min="2024-09-01"
                max="2025-12-31"
                className="text-xs"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="weekday-end-date" className="text-xs font-montserrat font-semibold">End Date</Label>
              <Input
                id="weekday-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min="2024-09-01"
                max="2025-12-31"
                className="text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApplyFilter} size="sm" className="text-xs">
                Apply
              </Button>
              <Button onClick={handleClearFilter} variant="outline" size="sm" className="text-xs">
                Clear
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="text-red-600 text-xs font-montserrat font-light">{error}</div>
          )}
          
          <div className="text-xs text-gray-500 font-montserrat font-light">
            Data Range: {getDataRange().start} - {getDataRange().end} | Currently Showing: {totalClients} client records
          </div>
          
          {/* 数据状态提示 */}
          {startDate && endDate && (
            <div className="mt-2">
              {totalClients === 0 ? (
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded font-montserrat font-light">
                  ⚠️ No data in this time range. Excel file data goes up to {getDataRange().end}.
                </div>
              ) : (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded font-montserrat font-light">
                  ✅ Filter successful, found {totalClients} client records
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Weekday Leads Distribution 图表 */}
      <WeekdayLeadsDistribution 
        clientData={brokerWeekdayData}
        weeklyData={weeklyCostLeadsData}
        dailyCostData={filteredDailyCostData}
        title={`Weekday Leads Distribution${startDate && endDate ? ` (${startDate} to ${endDate})` : ''}`}
      />
    </div>
  );
}