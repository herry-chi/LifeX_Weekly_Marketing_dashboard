"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { WeeklyLeadsCost } from "@/components/weekly-leads-cost"
import { WeeklyCostLeads } from "@/components/weekly-cost-leads"
import { MonthlyLeadsCost } from "@/components/monthly-leads-cost"
import { MonthlyPerLeadsCost } from "@/components/monthly-per-leads-cost"
import { DailyLeadsChart } from "@/components/daily-leads-chart"
import { MonthlyCountStackedChart } from "@/components/monthly-count-stacked-chart"
import { MonthlyPatternChart } from "@/components/monthly-pattern-chart"
import { PieChartWithFilter } from "@/components/pie-chart-with-filter"
import { BrokerWeeklyDonutChart } from "@/components/broker-weekly-donut-chart"
import { WeekdayChartWithFilter } from "@/components/weekday-chart-with-filter"
import { BrokerActivityHeatmap } from "@/components/broker-activity-heatmap"
import { AcquisitionTimeAnalysis } from "@/components/acquisition-time-analysis"
import { WeeklyAnalysis, WeeklyOverallAverage } from "@/components/weekly-analysis"
import { ExcelUpload } from "@/components/excel-upload"
import { AccountSwitcher } from "@/components/ui/platform-switcher"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, Upload, Maximize, Minimize } from "lucide-react"
import { LifeCarDailyTrends } from "@/components/lifecar-daily-trends"
import { LifeCarMonthlySummary } from "@/components/lifecar-monthly-summary"
import { LifeCarOverviewStats } from "@/components/lifecar-overview-stats"
import { LifeCarPerformanceHeatmap } from "@/components/lifecar-performance-heatmap"
import { parseLifeCarData, aggregateByMonth, filterByDateRange, type LifeCarDailyData, type LifeCarMonthlyData } from "@/lib/lifecar-data-processor"
// 移除静态导入，改为动态API调用

// 处理日期格式 - 将各种日期格式转换为标准格式
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  
  try {
    // 处理 "9/20/24" 格式
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        const month = parseInt(parts[0])
        const day = parseInt(parts[1])
        let year = parseInt(parts[2])
        
        // 处理两位数年份
        if (year < 100) {
          year = year > 50 ? 1900 + year : 2000 + year
        }
        
        return new Date(year, month - 1, day)
      }
    }
    
    // 尝试直接解析
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

// 处理饼图数据 - 使用真实Excel数据中的 Broker 列，不受时间筛选影响
function processBrokerData(brokerDataJson: any[]) {
  try {
    let clientsData = brokerDataJson || []
    
    // 统计每个 Broker 的客户数量
    const brokerCounts = clientsData.reduce((acc: any, client: any) => {
      let broker = client.broker || '未知'
      
      // Normalize broker names
      if (broker.toLowerCase() === 'yuki') {
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
      .map(([broker, count]: [string, any]) => ({
        broker,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count) // 按数量降序排列
  } catch (error) {
    console.error('处理饼图数据失败:', error)
    return []
  }
}

// 将周次转换为日期范围
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

// 处理折线图数据 - 使用真实Excel数据中的Week和Leads单价（aud）
function processWeeklyData(weeklyDataJson: any[]) {
  try {
    let weeklyData = weeklyDataJson || []
    
    // 排序：从2024/wk44开始，按年份和周次排序
    return weeklyData
      .filter((item: any) => item.week && item.leadsPrice && item.leadsPrice > 0)
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
    console.error('处理折线图数据失败:', error)
    return []
  }
}

// 处理月度数据 - 使用真实Excel数据
function processMonthlyData(monthlyDataJson: any[]) {
  try {
    let monthlyData = monthlyDataJson || []
    
    // 按月份排序
    return monthlyData.sort((a: any, b: any) => {
      return a.month.localeCompare(b.month)
    })
  } catch (error) {
    console.error('处理月度数据失败:', error)
    return []
  }
}

// 处理WeeklyCostLeads数据 - 使用totalCost和leadsTotal
function processWeeklyCostLeadsData(weeklyDataJson: any[]) {
  try {
    let weeklyData = weeklyDataJson || []
    
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

// 处理Weekday数据 - 使用broker数据按星期几统计
function processBrokerDataForWeekday(brokerDataJson: any[]) {
  try {
    let brokerData = brokerDataJson || []
    return brokerData
  } catch (error) {
    console.error('处理Weekday数据失败:', error)
    return []
  }
}

export default function Home() {
  // 模块导航状态
  const [activeModule, setActiveModule] = useState('broker');
  const [showUpload, setShowUpload] = useState(false);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 账号筛选状态
  const [selectedAccount, setSelectedAccount] = useState('xiaowang');
  
  // 日期范围状态（替代之前的dateRange）
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  // 账号切换处理函数
  const handleAccountChange = (account: string) => {
    setSelectedAccount(account);
  };

  // 时间筛选器处理函数
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

  const handleLastWeek = () => {
    const today = new Date();
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - (today.getDay() || 7)); // 上周日
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6); // 上周一
    
    setStartDate(lastWeekStart.toISOString().split('T')[0]);
    setEndDate(lastWeekEnd.toISOString().split('T')[0]);
    setError('');
  };
  
  // API数据状态
  const [brokerDataJson, setBrokerDataJson] = useState<any[]>([]);
  const [weeklyDataJson, setWeeklyDataJson] = useState<any[]>([]);
  const [monthlyDataJson, setMonthlyDataJson] = useState<any[]>([]);
  const [dailyCostDataJson, setDailyCostDataJson] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // LifeCAR数据状态
  const [lifeCarData, setLifeCarData] = useState<LifeCarDailyData[]>([]);
  const [lifeCarMonthlyData, setLifeCarMonthlyData] = useState<LifeCarMonthlyData[]>([]);
  const [lifeCarLoading, setLifeCarLoading] = useState(false);

  // 加载数据函数
  const loadData = async () => {
    try {
      setIsLoading(true);
      setDataError(null);
      
      const response = await fetch('/api/excel-data');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.data) {
        setBrokerDataJson(result.data.broker_data || []);
        setWeeklyDataJson(result.data.weekly_data || []);
        setMonthlyDataJson(result.data.monthly_data || []);
        setDailyCostDataJson(result.data.daily_cost_data || []);
      } else {
        throw new Error('Invalid data structure received');
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      setDataError(error.message || 'Failed to load data');
      // 设置空数据以防止组件崩溃
      setBrokerDataJson([]);
      setWeeklyDataJson([]);
      setMonthlyDataJson([]);
      setDailyCostDataJson([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载LifeCAR数据函数
  const loadLifeCarData = async () => {
    try {
      setLifeCarLoading(true);
      const response = await fetch('/database_lifecar/lifecar-data.csv');
      if (!response.ok) {
        throw new Error(`Failed to load LifeCAR data: ${response.statusText}`);
      }
      const csvText = await response.text();
      const parsedData = parseLifeCarData(csvText);
      const monthlyData = aggregateByMonth(parsedData);
      
      setLifeCarData(parsedData);
      setLifeCarMonthlyData(monthlyData);
    } catch (error) {
      console.error('Failed to load LifeCAR data:', error);
      setLifeCarData([]);
      setLifeCarMonthlyData([]);
    } finally {
      setLifeCarLoading(false);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    loadData();
    loadLifeCarData();
  }, []);

  // Handle successful upload - use uploaded data directly
  const handleUploadSuccess = async (uploadedData?: any) => {
    try {
      setShowUpload(false);
      
      if (uploadedData) {
        // 直接使用上传返回的数据，不需要重新调用API
        setBrokerDataJson(uploadedData.broker_data || []);
        setWeeklyDataJson(uploadedData.weekly_data || []);
        setMonthlyDataJson(uploadedData.monthly_data || []);
        setDailyCostDataJson(uploadedData.daily_cost_data || []);
        console.log('Data updated from upload:', {
          broker_data: uploadedData.broker_data?.length || 0,
          weekly_data: uploadedData.weekly_data?.length || 0,
          monthly_data: uploadedData.monthly_data?.length || 0,
          daily_cost_data: uploadedData.daily_cost_data?.length || 0
        });
      } else {
        // 如果没有数据，回退到重新加载
        await loadData();
      }
      
      setDataRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing data:', error);
      // 如果出错，尝试重新加载数据
      await loadData();
    }
  };

  const handleRefreshData = async () => {
    try {
      const response = await fetch('/api/refresh-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        alert('Data refreshed successfully! Updated ruofan to Yuki.');
        await loadData(); // 重新加载数据而不是刷新页面
      } else {
        alert('Refresh failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error occurred');
    }
  };

  // 全屏处理函数
  const handleFullscreen = () => {
    if (!isFullscreen) {
      // 进入全屏
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) {
        (document.documentElement as any).msRequestFullscreen();
      }
    } else {
      // 退出全屏
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  // 监听全屏状态变化和键盘快捷键
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // F11 键切换全屏
      if (event.key === 'F11') {
        event.preventDefault();
        handleFullscreen();
      }
      // Esc键退出全屏 - 直接检查document.fullscreenElement而不依赖state
      if (event.key === 'Escape' && document.fullscreenElement) {
        handleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // 移除依赖数组中的isFullscreen
  
  // 模块配置 - 根据不同账号显示不同的模块
  const getModulesForAccount = (account: string) => {
    if (account === 'lifecar') {
      return [
        { id: 'broker', name: 'Campaign Overview', icon: '🚗', desc: 'Overall campaign performance' },
        { id: 'cost', name: 'Cost Analysis', icon: '💰', desc: 'Spend and efficiency metrics' },
        { id: 'activity-heatmap', name: 'Performance Heatmap', icon: '🔥', desc: 'Time-based performance patterns' },
        { id: 'time-analysis', name: 'Engagement Analysis', icon: '⏰', desc: 'Interaction and reach trends' },
        { id: 'weekly-analysis', name: 'Comprehensive Report', icon: '📈', desc: 'Complete performance analysis' }
      ];
    } else {
      return [
        { id: 'broker', name: 'Broker Distribution', icon: '📊', desc: 'Broker performance analysis' },
        { id: 'cost', name: 'Cost & Leads', icon: '💰', desc: 'Cost comparison analysis' },
        { id: 'activity-heatmap', name: 'Activity Heatmap', icon: '🔥', desc: 'Broker activity patterns' },
        { id: 'time-analysis', name: 'Time Analysis', icon: '⏰', desc: 'Acquisition time distribution' },
        { id: 'weekly-analysis', name: 'Weekly Analysis', icon: '📈', desc: 'Weekly performance insights' }
      ];
    }
  };

  const modules = getModulesForAccount(selectedAccount);
  
  // 获取数据（受全局时间筛选器影响）
  const processedBrokerData = useMemo(() => {
    if (isLoading || !brokerDataJson.length) return [];
    const data = processBrokerData(brokerDataJson)
    console.log('Broker data:', data)
    return data
  }, [brokerDataJson, isLoading])

  const weeklyData = useMemo(() => {
    if (isLoading || !weeklyDataJson.length) return [];
    const data = processWeeklyData(weeklyDataJson)
    console.log('Weekly data:', data)
    return data
  }, [weeklyDataJson, isLoading])

  const monthlyData = useMemo(() => {
    if (isLoading || !monthlyDataJson.length) return [];
    const data = processMonthlyData(monthlyDataJson)
    console.log('Monthly data:', data)
    return data
  }, [monthlyDataJson, isLoading])

  const weeklyCostLeadsData = useMemo(() => {
    if (isLoading || !weeklyDataJson.length) return [];
    const data = processWeeklyCostLeadsData(weeklyDataJson)
    console.log('Weekly Cost & Leads data:', data)
    return data
  }, [weeklyDataJson, isLoading])

  // 计算总体统计信息
  const totalClients = useMemo(() => {
    if (isLoading || !brokerDataJson) return 0;
    return brokerDataJson.length
  }, [brokerDataJson, isLoading])

  const activeBrokers = useMemo(() => {
    if (isLoading || !processedBrokerData) return 0;
    return processedBrokerData.length
  }, [processedBrokerData, isLoading])

  // 处理LifeCAR数据（受时间筛选器影响）
  const filteredLifeCarData = useMemo(() => {
    if (lifeCarLoading || !lifeCarData.length) return [];
    return filterByDateRange(lifeCarData, startDate, endDate);
  }, [lifeCarData, startDate, endDate, lifeCarLoading])

  const filteredLifeCarMonthlyData = useMemo(() => {
    if (lifeCarLoading || !filteredLifeCarData.length) return [];
    return aggregateByMonth(filteredLifeCarData);
  }, [filteredLifeCarData, lifeCarLoading])

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // 如果有错误，显示错误信息
  if (dataError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600 mb-4">{dataError}</p>
          <button
            onClick={loadData}
            className="bg-gradient-to-r from-[#751FAE] to-[#EF3C99] text-white px-4 py-2 rounded hover:from-[#6919A6] hover:to-[#E73691] transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100">
      {/* 导航栏 */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-purple-200/30 sticky top-0 z-[100] shadow-lg shadow-purple-500/10">
        <div className="w-full px-8">
          <div className="relative flex items-center h-24 py-4">
            <div className="flex items-center space-x-4">
              <img 
                src="/LifeX_logo.png" 
                alt="LifeX Logo" 
                className="h-12 w-auto"
              />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <h1 className="text-4xl font-semibold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">Marketing Dashboard</h1>
              <p className="text-base text-purple-600 mt-1 font-montserrat font-light">Real-time analytics & insights</p>
            </div>
            <div className="ml-auto flex items-center space-x-3 z-50 relative">
              <AccountSwitcher 
                onAccountChange={handleAccountChange} 
                defaultAccount={selectedAccount} 
              />
              <button
                onClick={handleFullscreen}
                className="flex items-center justify-center w-8 h-8 text-gray-700 bg-white/90 backdrop-blur-sm border border-purple-200 rounded hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 shadow-sm cursor-pointer z-50 relative"
                title="Toggle Fullscreen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <button
                onClick={handleRefreshData}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-white/90 backdrop-blur-sm border border-purple-200 rounded hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 shadow-sm cursor-pointer z-50 relative"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-gradient-to-r from-[#751FAE] to-[#EF3C99] rounded hover:from-[#6919A6] hover:to-[#E73691] transition-all duration-200 shadow-md cursor-pointer z-50 relative"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="hidden sm:inline">Upload</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* 主内容区域 */}
      <div className="w-full px-8 py-4">
        
        {/* LifeCAR账号的数据面板 */}
        {selectedAccount === 'lifecar' && (
          <>
            {/* 时间筛选器 - 独立卡片设计 */}
            <div className="max-w-7xl mx-auto mb-6">
              <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-6">
                {/* 主体标签 */}
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                    <CalendarIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 font-montserrat">Time Filters</h3>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2 font-montserrat">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      Start Date
                    </label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min="2025-05-01"
                      max="2025-12-31"
                      className="w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-800 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200 hover:bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2 font-montserrat">
                      <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                      End Date
                    </label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min="2025-05-01"
                      max="2025-12-31"
                      className="w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-800 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-200 hover:bg-gray-50"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleClearFilter} 
                      variant="outline" 
                      className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 font-semibold"
                    >
                      Clear Dates
                    </Button>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button 
                      onClick={handleLastWeek} 
                      variant="secondary"
                      className="bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all duration-200 font-semibold"
                    >
                      Last Week
                    </Button>
                    <Button 
                      onClick={handleApplyFilter} 
                      className="bg-gradient-to-r from-[#751FAE] to-[#EF3C99] hover:from-[#6919A6] hover:to-[#E73691] text-white border-0 font-semibold transition-all duration-200"
                    >
                      Apply Filter
                    </Button>
                  </div>
                </div>
                
                {error && (
                  <div className="mt-4 text-red-600 text-sm font-medium font-montserrat">{error}</div>
                )}
                
                {startDate && endDate && (
                  <div className="mt-4 text-sm text-purple-600 font-medium font-montserrat">
                    Filtering data from {startDate} to {endDate}
                  </div>
                )}
              </div>
            </div>

            {/* LifeCAR数据加载状态 */}
            {lifeCarLoading && (
              <div className="max-w-7xl mx-auto mb-6 flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-purple-600 font-medium">Loading LifeCAR data...</p>
                </div>
              </div>
            )}

            {/* LifeCAR概览统计 */}
            {!lifeCarLoading && filteredLifeCarData.length > 0 && (
              <div className="max-w-7xl mx-auto">
                <LifeCarOverviewStats data={filteredLifeCarData} />
              </div>
            )}

            {/* LifeCAR模块导航 */}
            <div className="max-w-7xl mx-auto mb-6">
              <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-1">
                <div className="flex">
                  {modules.map((module, index) => (
                    <button
                      key={module.id}
                      onClick={() => setActiveModule(module.id)}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        activeModule === module.id
                          ? 'bg-gradient-to-r from-[#751FAE] to-[#EF3C99] text-white shadow-md'
                          : 'bg-transparent hover:bg-gray-50 text-gray-700'
                      } ${
                        index === 0 ? 'rounded-l-lg' : index === modules.length - 1 ? 'rounded-r-lg' : ''
                      }`}
                    >
                      {module.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* LifeCAR动态内容区域 */}
            {!lifeCarLoading && filteredLifeCarData.length > 0 && (
              <>
                {activeModule === 'broker' && (
                  <div className="max-w-7xl mx-auto mb-4 space-y-6">
                    <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">🚗 LifeCAR Performance Overview</h2>
                    
                    <LifeCarDailyTrends data={filteredLifeCarData} title="Daily Marketing Performance" />
                  </div>
                )}

                {activeModule === 'cost' && (
                  <div className="max-w-7xl mx-auto mb-4 space-y-6">
                    <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">💰 Cost & Performance Analysis</h2>
                    
                    <LifeCarMonthlySummary data={filteredLifeCarMonthlyData} title="Monthly Cost Analysis" />
                  </div>
                )}

                {activeModule === 'activity-heatmap' && (
                  <div className="max-w-7xl mx-auto mb-4">
                    <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">🔥 Performance Heatmap</h2>
                    <LifeCarPerformanceHeatmap data={filteredLifeCarData} title="Weekly Performance Pattern" />
                  </div>
                )}

                {activeModule === 'time-analysis' && (
                  <div className="max-w-7xl mx-auto mb-4">
                    <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">⏰ Time-based Analysis</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <LifeCarDailyTrends data={filteredLifeCarData} title="Daily Trends Analysis" />
                      <LifeCarPerformanceHeatmap data={filteredLifeCarData} title="Day-of-Week Performance" />
                    </div>
                  </div>
                )}

                {activeModule === 'weekly-analysis' && (
                  <div className="max-w-7xl mx-auto mb-4 space-y-6">
                    <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">📈 Comprehensive Analysis</h2>
                    
                    <LifeCarMonthlySummary data={filteredLifeCarMonthlyData} />
                    <LifeCarDailyTrends data={filteredLifeCarData} />
                  </div>
                )}
              </>
            )}

            {/* 无数据状态 */}
            {!lifeCarLoading && filteredLifeCarData.length === 0 && (
              <div className="max-w-7xl mx-auto flex items-center justify-center py-12">
                <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-12">
                  <div className="text-6xl mb-6">📊</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">No Data Available</h3>
                  <p className="text-gray-500">No data found for the selected date range. Please adjust your filters.</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* 澳洲小王Broker咨询的数据面板 */}
        {selectedAccount === 'xiaowang' && (
          <>
        
        
        
        {/* 时间筛选器 - 独立卡片设计 */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-6">
            {/* 主体标签 */}
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 font-montserrat">Time Filters</h3>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2 font-montserrat">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  Start Date
                </label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min="2024-09-01"
                  max="2025-12-31"
                  className="w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-800 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200 hover:bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2 font-montserrat">
                  <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                  End Date
                </label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min="2024-09-01"
                  max="2025-12-31"
                  className="w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-800 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-200 hover:bg-gray-50"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleClearFilter} 
                  variant="outline" 
                  className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 font-semibold"
                >
                  Clear Dates
                </Button>
              </div>
              <div className="flex items-end gap-2">
                <Button 
                  onClick={handleLastWeek} 
                  variant="secondary"
                  className="bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all duration-200 font-semibold"
                >
                  Last Week
                </Button>
                <Button 
                  onClick={handleApplyFilter} 
                  className="bg-gradient-to-r from-[#751FAE] to-[#EF3C99] hover:from-[#6919A6] hover:to-[#E73691] text-white border-0 font-semibold transition-all duration-200"
                >
                  Apply Filter
                </Button>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 text-red-600 text-sm font-medium font-montserrat">{error}</div>
            )}
            
            {startDate && endDate && (
              <div className="mt-4 text-sm text-purple-600 font-medium font-montserrat">
                Filtering data from {startDate} to {endDate}
              </div>
            )}
          </div>
        </div>
        
        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/90 backdrop-blur-xl rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-purple-500/20 border border-purple-200/50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">Upload Excel Data</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUpload(false)}
                  className="text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                >
                  ✕
                </Button>
              </div>
              <ExcelUpload onUploadSuccess={handleUploadSuccess} />
            </div>
          </div>
        )}
        
        {/* 概览统计卡片 */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-6 glass-card-hover relative text-center">
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-sm font-bold text-gray-700 mb-2">Total Clients</div>
            <div className="text-4xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">{totalClients}</div>
            <div className="text-xs font-semibold text-gray-600">All registered clients</div>
          </div>
          <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-6 glass-card-hover relative text-center">
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="text-sm font-bold text-gray-700 mb-2">Active Brokers</div>
            <div className="text-4xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">{activeBrokers}</div>
            <div className="text-xs font-semibold text-gray-600">Currently active brokers</div>
          </div>
          <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-6 glass-card-hover relative text-center">
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-sm font-bold text-gray-700 mb-2">Data Weeks</div>
            <div className="text-4xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">{isLoading ? '...' : weeklyDataJson.length}</div>
            <div className="text-xs font-semibold text-gray-600">Total weeks of data</div>
          </div>
          <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-6 glass-card-hover relative text-center">
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm font-bold text-gray-700 mb-2">Avg Acquisition Cost</div>
            <div className="text-4xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
              {isLoading ? '...' : 
                weeklyDataJson.length > 0 && brokerDataJson.length > 0 ? 
                `$${(weeklyDataJson.reduce((sum, item) => sum + item.totalCost, 0) / brokerDataJson.length).toFixed(1)}` : 
                '$0.0'
              }
            </div>
            <div className="text-xs font-semibold text-gray-600">Cost per client (AUD)</div>
          </div>
        </div>
        
        {/* 模块导航 */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-1">
            <div className="flex">
              {modules.map((module, index) => (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    activeModule === module.id
                      ? 'bg-gradient-to-r from-[#751FAE] to-[#EF3C99] text-white shadow-md'
                      : 'bg-transparent hover:bg-gray-50 text-gray-700'
                  } ${
                    index === 0 ? 'rounded-l-lg' : index === modules.length - 1 ? 'rounded-r-lg' : ''
                  }`}
                >
                  {module.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* 动态内容区域 */}
        {activeModule === 'broker' && (
          <div className="max-w-7xl mx-auto mb-4 space-y-3">
            <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">📊 Broker Distribution Analysis</h2>
            
            {/* 饼图区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左侧：现有饼图 */}
              <div className="glass-card rounded-lg overflow-hidden">
                <PieChartWithFilter startDate={startDate} endDate={endDate} brokerData={brokerDataJson} />
              </div>
              
              {/* 右侧：双环饼图 */}
              <div className="glass-card rounded-lg overflow-hidden">
                <BrokerWeeklyDonutChart startDate={startDate} endDate={endDate} brokerData={brokerDataJson} weeklyData={weeklyDataJson} />
              </div>
            </div>

          </div>
        )}

        {activeModule === 'cost' && (
          <div className="max-w-7xl mx-auto mb-4">
            <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">💰 Cost & Leads Comparison</h2>
            <div className="space-y-3">
              <div className="glass-card p-3 rounded-md glass-card-hover">
                <MonthlyLeadsCost 
                  data={monthlyData} 
                  title={`Monthly Cost & Leads`}
                />
              </div>
              <div className="glass-card p-3 rounded-md glass-card-hover">
                <MonthlyPerLeadsCost 
                  data={monthlyData} 
                  title={`Monthly Per Leads Cost`}
                />
              </div>
              <div className="glass-card p-3 rounded-md glass-card-hover">
                <WeeklyLeadsCost 
                  data={weeklyData.map(item => ({ ...item, originalWeek: item.week }))} 
                  title={`Weekly Leads Cost`}
                />
              </div>
              <div className="glass-card p-3 rounded-md glass-card-hover">
                <WeeklyCostLeads 
                  data={weeklyCostLeadsData} 
                  title={`Weekly Cost & Leads`}
                />
              </div>
              <div className="glass-card p-3 rounded-md glass-card-hover">
                <DailyLeadsChart 
                  data={weeklyCostLeadsData} 
                  title={`Daily Leads`}
                />
              </div>
            </div>
          </div>
        )}




        {/* 新增模块 - Broker活跃度热力图 */}
        {activeModule === 'activity-heatmap' && (
          <div className="max-w-7xl mx-auto mb-4">
            <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">🔥 Broker Activity Heatmap</h2>
            <div className="glass-card rounded-lg overflow-hidden">
              <BrokerActivityHeatmap />
            </div>
          </div>
        )}

        {/* 新增模块 - 客户获取时间分析 */}
        {activeModule === 'time-analysis' && (
          <div className="max-w-7xl mx-auto mb-4">
            <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">⏰ Customer Acquisition Time Analysis</h2>
            <div className="glass-card rounded-lg overflow-hidden">
              <AcquisitionTimeAnalysis brokerData={brokerDataJson} monthlyData={monthlyDataJson} dailyCostData={dailyCostDataJson} />
            </div>
          </div>
        )}

        {/* 新增模块 - Weekly Analysis */}
        {activeModule === 'weekly-analysis' && (
          <div className="max-w-7xl mx-auto mb-4 space-y-6">
            <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">📈 Weekly Analysis</h2>
            
            {/* Overall Weekly Average - 独立模块 */}
            <WeeklyOverallAverage weeklyData={weeklyDataJson} brokerData={brokerDataJson} />
            
            {/* Weekly Performance Details */}
            <WeeklyAnalysis weeklyData={weeklyDataJson} brokerData={brokerDataJson} />
          </div>
        )}

          </>
        )}

      </div>
      
    </div>
  )
}
