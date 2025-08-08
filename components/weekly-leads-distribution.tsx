"use client"

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface BrokerData {
  broker: string;
  count: number;
  percentage: string;
}

interface WeeklyLeadsDistributionProps {
  data: BrokerData[];
  title?: string;
}

// Set colors for specific brokers
const getBrokerColor = (brokerName: string, index: number) => {
  const brokerColors: { [key: string]: string } = {
    'Ziv': '#FF8C00',
    'Yuki': '#B07AA1',
    'Jo': '#a2e329',
    'Amy': '#3cbde5'
  };
  
  // If specific broker, return specific color
  if (brokerColors[brokerName]) {
    return brokerColors[brokerName];
  }
  
  // Otherwise use company color scheme
  const companyColors = ['#751fae', '#8f4abc', '#a875ca', '#c29fd9', '#ef3c99', '#f186be', '#f3abd0', '#f4d0e3'];
  return companyColors[index % companyColors.length];
};

export function WeeklyLeadsDistribution({ data, title = "Weekly Leads Distribution" }: WeeklyLeadsDistributionProps) {
  const chartData = data.map(item => ({
    name: item.broker,
    value: item.count,
    percentage: item.percentage
  }));

  // Calculate total client count
  const totalClients = data.reduce((sum, item) => sum + item.count, 0);
  
  // Dynamically calculate threshold: adjust display conditions based on total data volume
  const getThreshold = () => {
    if (totalClients <= 100) return 1; // Total ≤100: show all ≥1
    if (totalClients <= 300) return 5; // Total ≤300: show all ≥5
    return 50; // Total >300: show all ≥50
  };
  
  const threshold = getThreshold();
  
  // Dynamic label function: adaptive threshold based on data volume
  const renderLabel = (props: any) => {
    const { name, value, cx, cy, midAngle, innerRadius, outerRadius } = props;
    if (!value || value < threshold) return null;
    
    // Calculate label position - place outside the pie
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30; // Position labels outside the pie
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#000" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        <tspan x={x} y={y-6}>{name}</tspan>
        <tspan x={x} y={y+6}>{value}</tspan>
      </text>
    );
  };

  return (
    <div className="w-full h-80 relative">
      {title && <h2 className="text-xl font-semibold text-gray-900 mb-6 font-montserrat">{title}</h2>}
      
      {/* Total display in top-left corner */}
      <div className="absolute top-4 left-0 z-10 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200">
        <div className="text-sm font-medium font-montserrat font-semibold" style={{color: '#0ea5e9'}}>Total</div>
        <div className="text-3xl font-bold font-montserrat" style={{color: '#1e293b'}}>{totalClients}</div>
        <div className="text-xs font-medium font-montserrat font-light" style={{color: '#64748b'}}>Leads</div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="55%"
            labelLine={false}
            label={renderLabel}
            outerRadius={100}
            innerRadius={0}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBrokerColor(entry.name, index)} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} clients`, 'Client Count']} />
          <Legend 
            verticalAlign="top"
            align="right"
            layout="vertical"
            iconType="circle"
            wrapperStyle={{
              paddingLeft: '10px',
              fontSize: '12px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}