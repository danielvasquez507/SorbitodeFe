import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Legend } from 'recharts';
import { Maximize2, Minimize2 } from 'lucide-react';
import { formatMoney } from '../../lib/utils';

const COLORS = ['#ec4899', '#8b5cf6', '#6366f1', '#f59e0b', '#10b981'];

export default function DistributionChart({ data = [], showValues, maximizedId, setMaximizedId, chartFilters, setChartFilters }) {
  const [chartType, setChartType] = useState('Barras');

  const catMap = {};
  data.forEach(t => {
    catMap[t.categoria || 'Sin Categoría'] = (catMap[t.categoria || 'Sin Categoría'] || 0) + t.monto;
  });
  
  let chartData = Object.keys(catMap)
    .map(k => ({ name: k, value: catMap[k] }))
    .sort((a,b) => b.value - a.value);

  if (chartData.length === 0) {
    chartData = [{ name: 'Sin registros', value: 1, isEmpty: true }];
  }

  const handleCategoryClick = (category) => {
    if (!setChartFilters) return;
    setChartFilters(prev => ({
      ...prev,
      category: prev.category === category ? null : category
    }));
  };

  return (
    <div className="glass-panel p-6 flex flex-col h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Distribución por Categoría</h2>
        <div className="flex items-center gap-2">
          <select 
            value={chartType} onChange={(e) => setChartType(e.target.value)}
            className="bg-white border border-gray-300 text-gray-700 rounded-md px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer"
          >
            <option value="Dona">Dona</option>
            <option value="Barras">Barras</option>
          </select>
        </div>
      </div>
      <div className={`w-full text-xs font-semibold text-gray-500 ${maximizedId === 'distribution' ? 'h-[70vh]' : 'h-64'}`}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'Dona' ? (
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', color: '#1f2937', fontWeight: 'bold' }} formatter={(value) => `$${formatMoney(Number(value))}`} />
              <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '13px', fontWeight: '500' }} iconType="circle" />
              <Pie 
                data={chartData} dataKey="value" nameKey="name" 
                cx="50%" cy="50%" innerRadius={65} outerRadius={85} 
                stroke="none" paddingAngle={5} cornerRadius={6}
                onClick={(entry) => !entry.isEmpty && handleCategoryClick(entry.name)}
                style={{ cursor: chartData[0]?.isEmpty ? 'default' : 'pointer' }}
                label={showValues && !chartData[0]?.isEmpty ? (entry) => `$${Number(Math.round(entry.value)).toLocaleString('en-US')}` : false}
              >
                {chartData.map((entry, index) => {
                  const isSelected = chartFilters?.category === entry.name;
                  const isDimmed = chartFilters?.category && !isSelected;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isEmpty ? '#f3f4f6' : COLORS[index % COLORS.length]} 
                      style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))', opacity: isDimmed ? 0.3 : 1, transition: 'opacity 0.2s' }} 
                    />
                  );
                })}
              </Pie>
            </PieChart>
          ) : (
            <BarChart layout="vertical" data={chartData} margin={{ top: 25, right: 40, left: 20, bottom: 0 }}
                      onClick={(e) => { if(e && e.activePayload) handleCategoryClick(e.activePayload[0].payload.name); }}
                      style={{ cursor: chartData[0]?.isEmpty ? 'default' : 'pointer' }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
              <XAxis type="number" stroke="#9ca3af" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" stroke="#9ca3af" tickLine={false} axisLine={false} width={110} interval={0} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#1f2937' }} formatter={(value) => `$${formatMoney(Number(value))}`} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => {
                  const isSelected = chartFilters?.category === entry.name;
                  const isDimmed = chartFilters?.category && !isSelected;
                  return <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} style={{ opacity: isDimmed ? 0.3 : 1, transition: 'opacity 0.2s' }} />;
                })}
                {showValues && !chartData[0]?.isEmpty && <LabelList dataKey="value" position="right" fill="#6b7280" fontSize={11} fontWeight="bold" formatter={(value) => `$${Number(Math.round(value)).toLocaleString('en-US')}`} />}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
