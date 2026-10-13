import { useLocalStorage } from "./lib/useLocalStorage";
import { useState, useMemo, useEffect } from 'react';
import { Maximize2, Minimize2, ClipboardList, CreditCard, Wallet, Terminal, RefreshCw, LayoutGrid } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TopBar from './components/layout/TopBar';
import EvolutionChart from './components/dashboard/EvolutionChart';
import DistributionChart from './components/dashboard/DistributionChart';
import UnpaidDashboard from './components/dashboard/UnpaidDashboard';
import PaymentMatrix from './components/dashboard/PaymentMatrix';
import TransactionsTable from './components/dashboard/TransactionsTable';
import SystemLogs from './components/dashboard/SystemLogs';
import ManualExpenseModal from './components/dashboard/ManualExpenseModal';

function App() {
  const queryClient = useQueryClient();
  const [filterMode, setFilterMode] = useLocalStorage('sorbito_filterMode', 'rapido');
  const [quickFilter, setQuickFilter] = useLocalStorage('sorbito_quickFilter', 'Mes Actual');
  const [advMonth, setAdvMonth] = useLocalStorage('sorbito_advMonth', (new Date().getMonth() + 1).toString());
  const [advYear, setAdvYear] = useLocalStorage('sorbito_advYear', new Date().getFullYear().toString());
  
  const [showValues, setShowValues] = useLocalStorage('sorbito_showValues', true);
  const [isSingleColumn, setIsSingleColumn] = useLocalStorage('sorbito_isSingleColumn', false);
  const [activeTab, setActiveTab] = useLocalStorage('sorbito_activeTab', 'historial'); // 'historial', 'matriz', 'deudas'
  const [maximizedId, setMaximizedId] = useState(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  useEffect(() => {
    if (quickFilter === 'Año Actual') {
      setQuickFilter(new Date().getFullYear().toString());
    }
  }, [quickFilter, setQuickFilter]);
  
  // Filtros cruzados desde gráficos
  const [chartFilters, setChartFilters] = useLocalStorage('sorbito_chartFilters', { date: null, category: null });
  
  // Filtros de columnas (para tablas)
  const [columnFilters, setColumnFilters] = useLocalStorage('sorbito_columnFilters', { comercio: '', responsable: '', responsablePago: '', categoria: '', fechaInicio: '', fechaFin: '' });
  const [sortConfig, setSortConfig] = useLocalStorage('sorbito_sortConfig', { key: 'fecha', direction: 'desc' });

  const { data: allTransactions = [], isLoading } = useQuery({
    queryKey: ['transacciones'],
    queryFn: async () => {
      const res = await fetch('/api/transacciones');
      return res.json();
    }
  });



  const availableYears = useMemo(() => {
    const years = new Set();
    allTransactions.forEach(t => {
      if (!t.fecha) return;
      if (t.fecha.includes('-')) {
         years.add(t.fecha.substring(0, 4));
      } else if (t.fecha.includes('/')) {
         years.add(t.fecha.split('/')[2]);
      }
    });
    const sorted = Array.from(years).sort((a,b)=>b.localeCompare(a));
    const current = new Date().getFullYear().toString();
    if (!sorted.includes(current)) sorted.push(current);
    return sorted.sort((a,b)=>b.localeCompare(a));
  }, [allTransactions]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      if (!t.fecha) return false;
      let month = 1, year = 2026;
      if (t.fecha.includes('-')) {
         year = parseInt(t.fecha.substring(0, 4), 10);
         month = parseInt(t.fecha.substring(5, 7), 10);
      } else if (t.fecha.includes('/')) {
         const parts = t.fecha.split('/');
         month = parseInt(parts[1], 10);
         year = parseInt(parts[2], 10);
      }

      if (filterMode === 'avanzado') {
        const targetM = parseInt(advMonth, 10);
        const targetY = parseInt(advYear, 10);
        if (advMonth && month !== targetM) return false;
        if (advYear && year !== targetY) return false;
        return true;
      }

      // Modo Rápido
      if (quickFilter === 'Histórico') return true;
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      if (quickFilter === 'Año Actual') return year === currentYear; // fallback
      if (quickFilter.length === 4 && !isNaN(quickFilter)) return year === parseInt(quickFilter, 10);
      
      let targetMonth = currentMonth;
      let targetYear = currentYear;
      if (quickFilter === 'Mes Pasado') {
        targetMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        targetYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      }
      return month === targetMonth && year === targetYear;
    });
  }, [allTransactions, filterMode, quickFilter, advMonth, advYear]);

  // Limpiar filtros cruzados al cambiar los filtros generales
  useEffect(() => {
    setChartFilters({ date: null, category: null });
  }, [filterMode, quickFilter, advMonth, advYear]);

  const tableTransactions = useMemo(() => {
    // 1. Filtrar
    const filtered = filteredTransactions.filter(t => {
      if (chartFilters.category && (t.categoria || 'Sin Categoría') !== chartFilters.category) return false;
      if (chartFilters.date && t.fecha && !t.fecha.startsWith(chartFilters.date)) return false;
      
      if (columnFilters.comercio && !t.comercio.toLowerCase().includes(columnFilters.comercio.toLowerCase())) return false;
      if (columnFilters.responsable && t.responsable !== columnFilters.responsable) return false;
      if (columnFilters.responsablePago && t.responsable_pago !== columnFilters.responsablePago) return false;
      if (columnFilters.categoria && t.categoria !== columnFilters.categoria) return false;
      if (columnFilters.fechaInicio || columnFilters.fechaFin) {
        const dateStr = t.fecha.substring(0, 10);
        if (columnFilters.fechaInicio && dateStr < columnFilters.fechaInicio) return false;
        if (columnFilters.fechaFin && dateStr > columnFilters.fechaFin) return false;
      }
      return true;
    });

    // 2. Ordenar
    return filtered.sort((a, b) => {
      if (!sortConfig.key) return 0;
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (valA == null) valA = '';
      if (valB == null) valB = '';
      if (sortConfig.key === 'fecha') {
        valA = new Date(valA.replace(' ', 'T')).getTime();
        valB = new Date(valB.replace(' ', 'T')).getTime();
      }
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTransactions, chartFilters, columnFilters, sortConfig]);

  if (isLoading) return <div className="p-10 text-center font-bold text-gray-700">Cargando datos...</div>;

  return (
    <div className="w-full h-screen flex flex-col relative overflow-hidden bg-white">
      <div className="w-full relative z-50">
        <TopBar 
          filterMode={filterMode} setFilterMode={setFilterMode}
          quickFilter={quickFilter} setQuickFilter={setQuickFilter}
          advMonth={advMonth} setAdvMonth={setAdvMonth}
          advYear={advYear} setAdvYear={setAdvYear}
          showValues={showValues} setShowValues={setShowValues}
          isSingleColumn={isSingleColumn} setIsSingleColumn={setIsSingleColumn}
          allTransactions={allTransactions}
          availableYears={availableYears}
          activeTab={activeTab}
          
          onOpenManualExpense={() => setIsManualModalOpen(true)}
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth bg-gray-50/30">
        <div className="flex flex-col gap-6 min-h-max p-4">

      
      {/* Gráficos */}
      {maximizedId !== 'content' && (
        <div className={`grid gap-6 transition-all duration-500 flex-none ${maximizedId ? 'grid-cols-1' : (!isSingleColumn ? 'md:grid-cols-2 grid-cols-1' : 'grid-cols-1')}`}>
          {(maximizedId === null || maximizedId === 'evolution') && (
            <EvolutionChart 
              data={filteredTransactions} 
              showValues={showValues} 
              isHistorical={filterMode === 'rapido' && quickFilter === 'Histórico'} 
              isYearView={(filterMode === 'rapido' && quickFilter.length === 4) || (filterMode === 'avanzado' && advYear && !advMonth)}
              maximizedId={maximizedId} 
              setMaximizedId={setMaximizedId} 
              chartFilters={chartFilters}
              setChartFilters={setChartFilters}
            />
          )}
          {(maximizedId === null || maximizedId === 'distribution') && (
            <DistributionChart 
              data={filteredTransactions} 
              showValues={showValues} 
              maximizedId={maximizedId} 
              setMaximizedId={setMaximizedId} 
              chartFilters={chartFilters}
              setChartFilters={setChartFilters}
            />
          )}
        </div>
      )}

      {/* Navegación por Pestañas */}
      {(maximizedId === null || maximizedId === 'content') && (
        <div className={`transition-all duration-500 flex flex-col flex-1 shadow-sm rounded-xl bg-white border border-gray-100`}>
          <div className="flex justify-between items-center border-b border-gray-200 flex-none sticky top-0 z-40 bg-white px-4 shadow-sm rounded-t-xl h-[60px]">
            <div className="flex overflow-x-auto flex-1 gap-2">
              <button 
                onClick={() => setActiveTab('deudas')}
                className={`px-4 py-2 font-extrabold text-sm transition-all rounded-lg flex items-center gap-2 ${activeTab === 'deudas' ? 'bg-red-500 text-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-red-50'}`}
              >
                <Wallet size={18} className={activeTab === 'deudas' ? 'text-white' : 'text-red-400'} />
                Gestión de Pagos
              </button>
              <button 
                onClick={() => setActiveTab('matriz')}
                className={`px-4 py-2 font-extrabold text-sm transition-all rounded-lg flex items-center gap-2 ${activeTab === 'matriz' ? 'bg-[#5b21b6] text-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-purple-50'}`}
              >
                <LayoutGrid size={18} className={activeTab === 'matriz' ? 'text-white' : 'text-purple-500'} />
                Matriz Global
              </button>
              <button 
                onClick={() => setActiveTab('historial')}
                className={`px-4 py-2 font-extrabold text-sm transition-all rounded-lg flex items-center gap-2 ${activeTab === 'historial' ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-blue-50'}`}
              >
                <ClipboardList size={18} className={activeTab === 'historial' ? 'text-white' : 'text-blue-500'} />
                Historial de Transacciones
              </button>
              <button 
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 font-extrabold text-sm transition-all rounded-lg flex items-center gap-2 ${activeTab === 'logs' ? 'bg-indigo-500 text-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-indigo-50'}`}
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <Terminal size={18} className={activeTab === 'logs' ? 'text-white' : 'text-indigo-400'} />
                Terminal de Procesos
              </button>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {activeTab === 'logs' && (
                <button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['system-logs'] })}
                  className="p-2 text-gray-500 hover:text-indigo-600 transition-colors bg-gray-50 hover:bg-indigo-50 border border-gray-200 rounded-lg shrink-0 shadow-sm"
                  title="Refrescar Terminal"
                >
                  <RefreshCw size={18} />
                </button>
              )}
              <button 
                onClick={() => setMaximizedId(maximizedId === 'content' ? null : 'content')} 
                className="p-2 text-gray-500 hover:text-[#5b21b6] transition-colors bg-gray-50 hover:bg-purple-50 border border-gray-200 rounded-lg shrink-0 shadow-sm"
                title={maximizedId === 'content' ? 'Minimizar' : 'Maximizar'}
              >
                {maximizedId === 'content' ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
              </button>
            </div>
          </div>

          {/* Contenido de la Pestaña Activa */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#f9fafb]">
            {activeTab === 'historial' && (
              <TransactionsTable 
                data={tableTransactions} 
                isSingleColumn={isSingleColumn} 
                allTransactions={allTransactions}
                chartFilters={chartFilters}
                setChartFilters={setChartFilters}
                filtros={columnFilters}
                setFiltros={setColumnFilters}
                sortConfig={sortConfig}
                setSortConfig={setSortConfig}
              />
            )}
            {activeTab === 'matriz' && (
              <PaymentMatrix data={tableTransactions} />
            )}
            {activeTab === 'deudas' && (
              <UnpaidDashboard 
                data={tableTransactions} 
                filtros={columnFilters}
                setFiltros={setColumnFilters}
                sortConfig={sortConfig}
                setSortConfig={setSortConfig}
              />
            )}
            {activeTab === 'logs' && (
              <SystemLogs />
            )}
          </div>
        </div>
      )}
      
        </div>
      </div>
      
      <ManualExpenseModal 
        isOpen={isManualModalOpen} 
        onClose={() => setIsManualModalOpen(false)} 
      />
    </div>
  );
}

export default App;
