import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, Columns2, Plus } from 'lucide-react';

export default function TopBar({ 
  filterMode, setFilterMode, 
  quickFilter, setQuickFilter, 
  advMonth, setAdvMonth, 
  advYear, setAdvYear, 
  showValues, setShowValues, 
  isSingleColumn, setIsSingleColumn,
  allTransactions = [],
  activeTab,
  selectedRunId, setSelectedRunId,
  onOpenManualExpense
}) {
  const yearsSet = new Set(allTransactions.map(t => {
    if (!t.fecha) return null;
    // La fecha ahora viene en formato "YYYY-MM-DD HH:MM:SS" (ej. "2026-08-12 16:42:14") o "DD/MM/YYYY" si es antigua.
    if (t.fecha.includes('-')) return t.fecha.substring(0, 4);
    if (t.fecha.includes('/')) return t.fecha.split('/')[2];
    return null;
  }).filter(Boolean));
  const years = Array.from(yearsSet).sort((a, b) => b - a); // Orden descendente
  if (years.length === 0) years.push(new Date().getFullYear().toString());

  const months = [
    {v: '1', l: 'Enero'}, {v: '2', l: 'Febrero'}, {v: '3', l: 'Marzo'}, {v: '4', l: 'Abril'},
    {v: '5', l: 'Mayo'}, {v: '6', l: 'Junio'}, {v: '7', l: 'Julio'}, {v: '8', l: 'Agosto'},
    {v: '9', l: 'Septiembre'}, {v: '10', l: 'Octubre'}, {v: '11', l: 'Noviembre'}, {v: '12', l: 'Diciembre'}
  ];

  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Consultar estado de sincronización del backend cada 3 segundos
  const { data: syncStatus } = useQuery({
    queryKey: ['sync-status'],
    queryFn: async () => {
      const res = await fetch('/api/sync/status');
      return res.json();
    },
    refetchInterval: 3000
  });

  const isSyncing = isSyncingLocal || (syncStatus && syncStatus.isSyncing);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncingLocal(true);
    showToast("⏳ Iniciando sincronización...");
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Finalizada la sincronización: ${data.count || 0} registros nuevos`);
      } else {
        showToast(`❌ Error: ${data.message || 'Fallo desconocido'}`);
      }
    } catch (e) {
      console.error(e);
      showToast("❌ Error al conectar con el servidor");
    } finally {
      setIsSyncingLocal(false);
    }
  };

  return (
    <div className="glass-panel p-4 flex flex-col xl:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pr-4">
          <img src="/logo.png" alt="Logo Sorbito de Fé" className="w-12 h-12 object-contain drop-shadow-sm" />
          <h1 className="text-3xl font-extrabold text-gradient whitespace-nowrap">Sorbito de Fé</h1>
        </div>
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            isSyncing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          {isSyncing ? 'Sincronizando...' : '↻ Sincronizar'}
        </button>
        <button 
          onClick={onOpenManualExpense}
          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#5b21b6] hover:bg-[#4c1d95] text-white shadow-sm transition-colors flex items-center gap-1"
        >
          <Plus size={14} /> Nuevo Gasto
        </button>
      </div>
      
      <div className="flex flex-wrap items-center gap-6">
        {/* Toggles de Búsqueda */}
        <div className="flex gap-2">
          <button 
            onClick={() => setFilterMode('rapido')}
            className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors ${filterMode === 'rapido' ? 'bg-[#5b21b6] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Búsqueda Rápida
          </button>
          <button 
            onClick={() => setFilterMode('avanzado')}
            className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors ${filterMode === 'avanzado' ? 'bg-[#5b21b6] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Búsqueda Avanzada
          </button>
        </div>

        {/* Dropdowns de Filtros */}
        <div className="flex items-center gap-2">
          {filterMode === 'rapido' ? (
            <select 
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
              className="bg-white border-2 border-[#5b21b6] text-gray-700 rounded-lg p-1.5 text-sm outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-sm min-w-[120px]"
            >
              <option value="Mes Actual">Mes Actual</option>
              <option value="Mes Pasado">Mes Pasado</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
              <option value="Histórico">Total Histórico</option>
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <select 
                value={advMonth} 
                onChange={(e) => setAdvMonth(e.target.value)}
                className="bg-white border-2 border-[#5b21b6] text-gray-700 rounded-lg p-1.5 text-sm outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-sm"
              >
                  <option value="">-- Mes --</option>
                  {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
              <select 
                value={advYear}
                onChange={(e) => setAdvYear(e.target.value)}
                className="bg-white border-2 border-[#5b21b6] text-gray-700 rounded-lg p-1.5 text-sm outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-sm"
              >
                  <option value="">-- Año --</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>
              <label className="flex items-center gap-1.5 cursor-pointer text-sm font-semibold text-gray-700 ml-1">
                <input 
                  type="checkbox" 
                  checked={showValues} 
                  onChange={(e) => setShowValues(e.target.checked)} 
                  className="accent-primary w-4 h-4 rounded cursor-pointer" 
                />
                Valores
              </label>
            </div>
          )}
        </div>
        
        <div className="w-px h-8 bg-gray-200 hidden lg:block"></div>

        {/* Controles de Diseño */}
        <button 
          onClick={() => setIsSingleColumn(c => !c)}
          className="px-3 py-1.5 border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2 text-sm shadow-sm"
        >
          {!isSingleColumn ? <LayoutGrid size={16}/> : <Columns2 size={16}/>}
          Columnas
        </button>
      </div>
      <div className={`fixed bottom-4 right-4 bg-white border border-gray-200 text-[#5b21b6] px-4 py-3 rounded-xl shadow-lg transition-all duration-300 z-50 font-medium ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        {toastMessage}
      </div>
    </div>
  );
}
