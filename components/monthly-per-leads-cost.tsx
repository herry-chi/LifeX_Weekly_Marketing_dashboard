"use client"

import React, { useState, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface MonthlyPerLeadsCostData {
  month: string;
  cost: number;
  count: number;
}

interface MonthlyPerLeadsCostProps {
  data: MonthlyPerLeadsCostData[];
  title?: string;
  startDate?: string;
  endDate?: string;
}

// 自定义标签组件 - per leads cost数据
const renderPerLeadsCostLabel = (props: any) => {
  const { x, y, value } = props;
  if (!value || value === 0) return <></>;
  
  return (
    <text 
      x={x} 
      y={y - 15} 
      fill="#3CBDE5" 
      textAnchor="middle" 
      fontSize="10" 
      fontWeight="600"
    >
      ${value.toFixed(1)}
    </text>
  );
};

// 自定义标签组件 - 数量数据（柱状图内部白色）
const renderCountLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (!value || value === 0) return <></>;
  
  return (
    <text 
      x={x + width / 2} 
      y={y + height / 2} 
      fill="#ffffff" 
      textAnchor="middle" 
      dominantBaseline="middle"
      fontSize="12" 
      fontWeight="700"
    >
      {value}
    </text>
  );
};

export function MonthlyPerLeadsCost({ data, title = "Monthly Per Leads Cost", startDate, endDate }: MonthlyPerLeadsCostProps) {
  console.log('MonthlyPerLeadsCost component received data:', data);
  
  // Comment状态
  const [comment, setComment] = useState('');
  
  // 从localStorage加载保存的评论
  useEffect(() => {
    const savedComment = localStorage.getItem('monthlyPerLeadsCostComment');
    if (savedComment) {
      setComment(savedComment);
    }
  }, []);
  
  // 检查数据是否为空或无效
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 font-montserrat">Monthly Per Leads Cost</h2>
          <p className="text-gray-500 font-montserrat font-light">No data available</p>
        </div>
      </div>
    );
  }
  
  // 时间筛选逻辑
  const filteredData = React.useMemo(() => {
    if (!startDate || !endDate) {
      return data;
    }

    return data.filter(item => {
      // 解析月份格式 (e.g., "2024-10")
      const itemDate = new Date(item.month + '-01');
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      
      return itemDate >= filterStart && itemDate <= filterEnd;
    });
  }, [data, startDate, endDate]);

  // 数据预处理：确保数据类型正确，并计算per leads cost
  const processedData = filteredData.map(item => {
    const cost = Number(item.cost) || 0;
    const count = Number(item.count) || 0;
    const perLeadsCost = count > 0 ? cost / count : 0;
    
    return {
      month: item.month,
      count: count,
      perLeadsCost: perLeadsCost
    };
  });

  // 计算平均值
  const averages = React.useMemo(() => {
    if (processedData.length === 0) {
      return { avgPerLeadsCost: 0, avgLeads: 0 };
    }
    
    const validPerLeadsCosts = processedData.filter(item => item.perLeadsCost > 0);
    const totalPerLeadsCost = validPerLeadsCosts.reduce((sum, item) => sum + item.perLeadsCost, 0);
    const totalLeads = processedData.reduce((sum, item) => sum + item.count, 0);
    
    return {
      avgPerLeadsCost: validPerLeadsCosts.length > 0 ? totalPerLeadsCost / validPerLeadsCosts.length : 0,
      avgLeads: totalLeads / processedData.length
    };
  }, [processedData]);

  // 使用processedData直接，不需要添加平均线数据（使用ReferenceLine代替）
  
  return (
    <div className="w-full">
      <div className="h-[500px]">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 font-montserrat">
          Monthly Per Leads Cost
          {startDate && endDate && (
            <span className="text-sm text-gray-500 ml-2 font-montserrat font-light">({startDate} to {endDate})</span>
          )}
        </h2>
        <div className="text-xs text-gray-500 mb-2 font-montserrat font-light">
          Data Count: {processedData.length} | Month Range: {processedData.length > 0 ? `${processedData[0]?.month} - ${processedData[processedData.length - 1]?.month}` : 'No Data'}
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={processedData} 
            margin={{ 
              top: 40, 
              right: 60, 
              left: 20, 
              bottom: 100 
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={10}
              interval={0}
              stroke="#666"
            />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              fontSize={12}
              stroke="#666"
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              fontSize={12}
              stroke="#666"
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'perLeadsCost') return [`$${Number(value).toFixed(1)}`, 'Per Leads Cost (AUD)'];
                if (name === 'count') return [`${value}`, 'Leads Count'];
                return [value, name];
              }}
            />
            <Legend 
              content={(props) => {
                const { payload } = props;
                return (
                  <div className="flex flex-wrap justify-center gap-6 mt-4 text-sm font-montserrat">
                    {payload?.map((entry, index) => (
                      <div key={`item-${index}`} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-gray-700">{entry.value}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500" />
                      <span className="text-gray-700">
                        Avg Leads: {averages.avgLeads.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Bar 
              yAxisId="right"
              dataKey="count" 
              fill="#ef3c99" 
              name="Leads Count"
              label={renderCountLabel}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="perLeadsCost" 
              stroke="#3CBDE5" 
              strokeWidth={3}
              name="Per Leads Cost (AUD)"
              dot={{ fill: '#3CBDE5', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: '#3CBDE5', strokeWidth: 2, fill: '#fff' }}
              label={renderPerLeadsCostLabel}
            />
            <ReferenceLine 
              yAxisId="left"
              y={averages.avgPerLeadsCost} 
              stroke="#ff6b35" 
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: `Avg: $${averages.avgPerLeadsCost.toFixed(1)}`,
                position: 'insideTopLeft',
                style: { fontSize: '12px', fill: '#ff6b35', fontWeight: 'bold' }
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Comment输入框 */}
      <div className="mt-6 p-4 bg-black rounded-lg border border-gray-600">
        <Label htmlFor="monthly-per-leads-cost-comment" className="text-sm text-white font-montserrat font-semibold mb-2 block">
          Comments & Notes
        </Label>
        <Textarea
          id="monthly-per-leads-cost-comment"
          placeholder="Add your comments or insights about the monthly per leads cost data..."
          value={comment}
          onChange={(e) => {
            const newComment = e.target.value;
            setComment(newComment);
            localStorage.setItem('monthlyPerLeadsCostComment', newComment);
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
  );
}