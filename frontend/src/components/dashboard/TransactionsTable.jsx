import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, FilterX, ArrowUpDown, ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import { formatearFechaVisual, formatMoney } from '../../lib/utils';
import CustomDatePicker from './CustomDatePicker';

export default function TransactionsTable({ 
  data = [], 
  allTransactions = [], 
  chartFilters, 
  setChartFilters,
  filtros, setFiltros,
  sortConfig, setSortConfig
}) {
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const res = await fetch(`/api/transacciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Error al actualizar');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      showToast("✅ Guardado exitoso");
    },
    onError: () => {
      showToast("❌ Error al guardar");
    }
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    setSortConfig({ key, direction });
  };

  const uniqueResponsables = [...new Set(allTransactions.map(d => d.responsable))].filter(Boolean);
  const uniqueResponsablePagos = [...new Set(allTransactions.map(d => d.responsable_pago))].filter(Boolean);
  const uniqueCategorias = [...new Set(allTransactions.map(d => d.categoria))].filter(Boolean);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="opacity-50" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  return (
    <div className="glass-panel p-6 relative w-full border-none rounded-t-none">
      <div className="w-full">
        <table className="w-full text-sm text-left text-gray-700 min-w-[800px]">
          <thead className="text-xs uppercase text-white sticky top-[60px] z-30">
            <tr className="h-[48px]">
              <th className="px-4 py-3 align-middle rounded-tl-xl bg-[#5b21b6]">
                <div className="flex items-center gap-2 relative">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-gray-200" onClick={() => handleSort('fecha')}>
                    <span className="whitespace-nowrap">Fecha</span>
                    <SortIcon columnKey="fecha" />
                  </div>
                  <button onClick={() => setShowDatePicker(!showDatePicker)} className={`p-1.5 rounded-lg transition-colors text-white ${filtros.fechaInicio || filtros.fechaFin ? 'bg-[#ec4899] hover:bg-[#ec4899]/80' : 'bg-white/20 hover:bg-white/30'}`} title="Filtrar por fecha">
                    <Calendar size={14} />
                  </button>

                  {showDatePicker && (
                    <div className="absolute top-[120%] left-0 bg-white shadow-xl rounded-xl p-3 border border-gray-100 z-50 flex flex-col gap-3 min-w-[200px]">
                      <div className="flex flex-col gap-1 relative z-[60]">
                        <label className="text-gray-500 text-[10px] uppercase font-bold">Desde</label>
                        <CustomDatePicker 
                          value={filtros.fechaInicio} 
                          onChange={val => setFiltros({...filtros, fechaInicio: val})} 
                          placeholder="Fecha inicio"
                        />
                      </div>
                      <div className="flex flex-col gap-1 relative z-[50]">
                        <label className="text-gray-500 text-[10px] uppercase font-bold">Hasta</label>
                        <CustomDatePicker 
                          value={filtros.fechaFin} 
                          onChange={val => setFiltros({...filtros, fechaFin: val})} 
                          placeholder="Fecha fin"
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <button onClick={() => setFiltros({...filtros, fechaInicio: '', fechaFin: ''})} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Limpiar</button>
                        <button onClick={() => setShowDatePicker(false)} className="text-xs bg-[#5b21b6] hover:bg-[#4c1d95] text-white px-3 py-1.5 rounded-lg transition-colors font-bold">Aplicar</button>
                      </div>
                    </div>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 align-middle bg-[#5b21b6]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-gray-200" onClick={() => handleSort('comercio')}>
                    <span className="whitespace-nowrap">Comercio</span>
                    <SortIcon columnKey="comercio" />
                  </div>
                  <input type="text" placeholder="Buscar..." value={filtros.comercio} onChange={e => setFiltros({...filtros, comercio: e.target.value})} className="w-32 px-2 py-1 text-xs text-white bg-[#5b21b6] border border-white/30 rounded-lg outline-none font-normal placeholder-white/70 focus:border-white focus:ring-1 focus:ring-white transition-all" />
                </div>
              </th>
              <th className="px-4 py-3 align-middle bg-[#5b21b6]">
                <div className="flex items-center gap-1 cursor-pointer hover:text-gray-200 w-max" onClick={() => handleSort('monto')}>
                  <span>Monto</span>
                  <SortIcon columnKey="monto" />
                </div>
              </th>
              <th className="px-4 py-3 align-middle bg-[#5b21b6]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-gray-200" onClick={() => handleSort('responsable')}>
                    <span className="whitespace-nowrap">Responsable</span>
                    <SortIcon columnKey="responsable" />
                  </div>
                  <select value={filtros.responsable} onChange={e => setFiltros({...filtros, responsable: e.target.value})} className="w-24 px-2 py-1 text-xs text-white bg-[#5b21b6] border border-white/30 rounded-lg outline-none font-normal focus:border-white focus:ring-1 focus:ring-white transition-all cursor-pointer">
                    <option value="">Todos</option>
                    {uniqueResponsables.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </th>
              <th className="px-4 py-3 align-middle bg-[#5b21b6]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-gray-200" onClick={() => handleSort('responsable_pago')}>
                    <span className="whitespace-nowrap">Responsable Pago</span>
                    <SortIcon columnKey="responsable_pago" />
                  </div>
                  <select value={filtros.responsablePago} onChange={e => setFiltros({...filtros, responsablePago: e.target.value})} className="w-24 px-2 py-1 text-xs text-white bg-[#5b21b6] border border-white/30 rounded-lg outline-none font-normal focus:border-white focus:ring-1 focus:ring-white transition-all cursor-pointer">
                    <option value="">Todos</option>
                    {uniqueResponsablePagos.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </th>
              <th className="px-4 py-3 align-middle bg-[#5b21b6]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-gray-200" onClick={() => handleSort('categoria')}>
                    <span className="whitespace-nowrap">Categoría</span>
                    <SortIcon columnKey="categoria" />
                  </div>
                  <select value={filtros.categoria} onChange={e => setFiltros({...filtros, categoria: e.target.value})} className="w-24 px-2 py-1 text-xs text-white bg-[#5b21b6] border border-white/30 rounded-lg outline-none font-normal focus:border-white focus:ring-1 focus:ring-white transition-all cursor-pointer">
                    <option value="">Todas</option>
                    {uniqueCategorias.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </th>
              <th className="px-4 py-3 align-middle text-center relative w-[160px] rounded-tr-xl bg-[#5b21b6]">
                <div className="flex items-center h-full justify-center">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-gray-200 mr-2" onClick={() => handleSort('pagado')}>
                    <span className="whitespace-nowrap">¿Pagado?</span>
                    <SortIcon columnKey="pagado" />
                  </div>
                  {chartFilters && chartFilters.category && (
                    <button onClick={() => setChartFilters({ date: null, category: null })} className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 hover:bg-red-600 text-white p-1 rounded transition-colors text-[10px] font-bold flex items-center gap-1" title="Limpiar todos los filtros">
                      <FilterX size={12} /> Limpiar
                    </button>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map(t => (
              <TransactionRow key={t.id} t={t} mutation={mutation} />
            ))}
            {data.length === 0 && (
              <tr><td colSpan="7" className="text-center p-4">No hay transacciones en la base de datos para este periodo</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={`fixed bottom-4 right-4 bg-white border border-gray-200 text-green-600 px-4 py-3 rounded-xl shadow-lg transition-all duration-300 z-50 font-medium ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        {toastMessage}
      </div>
    </div>
  );
}

function TransactionRow({ t, mutation }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (field, value) => {
    setIsUpdating(true);
    try {
      await mutation.mutateAsync({ id: t.id, updates: { [field]: value } });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-all duration-300 ${isUpdating ? 'opacity-40 scale-[0.99] bg-gray-100' : 'opacity-100'}`}>
      <td className="px-4 py-3 whitespace-nowrap">{formatearFechaVisual(t.fecha)}</td>
      <td className="px-4 py-3 font-semibold text-gray-800 truncate max-w-[150px]">{t.comercio}</td>
      <td className="px-4 py-3 text-gray-900 font-bold">${formatMoney(t.monto)}</td>
      <td className="px-4 py-3">{t.responsable}</td>
      <td className="px-4 py-3">
        <select 
          value={t.responsable_pago || ''} 
          onChange={(e) => handleUpdate('responsable_pago', e.target.value)}
          className="bg-white border border-gray-200 text-gray-700 rounded-md p-1.5 outline-none focus:ring-2 focus:ring-primary w-full transition-colors cursor-pointer"
        >
          <option value="">Sin Asignar</option>
          <option value="Daniel">Daniel</option>
          <option value="Gedalya">Gedalya</option>
          <option value="Familiar">Familiar</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <select 
          value={t.categoria || ''} 
          onChange={(e) => handleUpdate('categoria', e.target.value)}
          className="bg-white border border-gray-200 text-gray-700 rounded-md p-1.5 outline-none focus:ring-2 focus:ring-primary w-full transition-colors cursor-pointer"
        >
          <option value="">Sin Categoría</option>
          <option value="Salud">Salud</option>
          <option value="Casa">Casa</option>
          <option value="Remodelaciones">Remodelaciones</option>
          <option value="Estudio">Estudio</option>
          <option value="Seguro">Seguro</option>
          <option value="Supermercado">Supermercado</option>
          <option value="Transporte">Transporte</option>
          <option value="Entretenimiento">Entretenimiento</option>
          <option value="Restaurante">Restaurante</option>
          <option value="Servicios">Servicios</option>
          <option value="Otro">Otro</option>
        </select>
      </td>
      <td className="px-4 py-3 text-center">
        <input 
          type="checkbox" 
          checked={t.pagado === 1}
          onChange={(e) => handleUpdate('pagado', e.target.checked)}
          className="accent-[#5b21b6] w-4 h-4 cursor-pointer"
        />
      </td>
    </tr>
  );
}
