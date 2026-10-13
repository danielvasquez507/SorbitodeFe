import { useLocalStorage } from "../../lib/useLocalStorage";
import { AlertCircle, CreditCard, Banknote, CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown, Calendar, LayoutList, Grid } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { formatearFechaVisual, formatMoney } from '../../lib/utils';
import CustomDatePicker from './CustomDatePicker';
import PaymentMatrix from './PaymentMatrix';

export default function UnpaidDashboard({ data = [], filtros, setFiltros, sortConfig, setSortConfig }) {
  const queryClient = useQueryClient();
  const [loadingId, setLoadingId] = useState(null);
  const [isMarking, setIsMarking] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewMode, setViewMode] = useLocalStorage('sorbito_unpaidViewMode', 'list');

  const pending = data.filter(t => t.pagado === 0 || t.pagado === false);
  const totalDeuda = pending.reduce((acc, curr) => acc + curr.monto, 0);

  // Agrupar deuda por deudor
  const deudasPorPersona = {};
  pending.forEach(t => {
    const p = t.responsable_pago || 'Sin Asignar';
    deudasPorPersona[p] = (deudasPorPersona[p] || 0) + t.monto;
  });

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
    },
    onSettled: () => {
      setLoadingId(null);
    }
  });

  const marcarComoPagado = async (id) => {
    setLoadingId(id);
    await mutation.mutateAsync({ id, updates: { pagado: 1 } });
  };

  const updateField = async (id, field, value) => {
    setLoadingId(id);
    await mutation.mutateAsync({ id, updates: { [field]: value } });
  };

  const [showConfirm, setShowConfirm] = useState(false);

  const handleMarkAllAsPaid = () => {
    if (pending.length === 0) return;
    setShowConfirm(true);
  };

  const executeMarkAllAsPaid = async () => {
    setShowConfirm(false);
    setIsMarking(true);
    try {
      await Promise.all(pending.map(t => fetch(`/api/transacciones/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagado: 1 })
      })));
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      setFiltros({ comercio: '', responsable: '', responsablePago: '', categoria: '', fechaInicio: '', fechaFin: '' });
    } catch (e) {
      console.error(e);
      alert("Hubo un error al actualizar algunas transacciones.");
    } finally {
      setIsMarking(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="opacity-50" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const hasActiveFilters = filtros && Object.values(filtros).some(val => val !== '');

  if (pending.length === 0) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center text-center h-[250px] border-l-4 border-green-500 bg-green-50/50">
        <div className="bg-green-100 p-4 rounded-full mb-4">
          <Banknote className="text-green-600 w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          {hasActiveFilters ? 'No hay resultados' : '¡Todo al día!'}
        </h2>
        <p className="text-gray-600 mt-2">
          {hasActiveFilters 
            ? 'No hay transacciones pendientes que coincidan con los filtros de búsqueda actuales.' 
            : 'No hay transacciones pendientes de pago en este periodo.'}
        </p>
        
        {hasActiveFilters && (
          <button 
            onClick={() => setFiltros({ comercio: '', responsable: '', responsablePago: '', categoria: '', fechaInicio: '', fechaFin: '' })}
            className="mt-6 px-4 py-2 bg-[#5b21b6] text-white rounded-lg shadow-sm hover:bg-[#4c1d95] transition-colors text-sm font-bold flex items-center gap-2"
          >
            Limpiar Filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 border-l-4 border-red-500 w-full border-t-0 rounded-t-none">
      <div className="flex flex-wrap items-center mb-6 gap-4">
        <div className="bg-red-50 px-6 py-3 rounded-xl border border-red-100 flex items-center gap-4">
          <span className="text-red-600 font-bold uppercase text-xs tracking-wider">Deuda Total</span>
          <span className="text-2xl font-black text-red-600">${formatMoney(totalDeuda)}</span>
        </div>

        {Object.entries(deudasPorPersona).map(([persona, monto]) => (
          <div key={persona} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex justify-between items-center min-w-[150px]">
            <div className="flex items-center gap-2">
              <CreditCard className="text-gray-400 w-4 h-4" />
              <span className="font-bold text-gray-700">{persona}</span>
            </div>
            <span className="font-black text-red-500 ml-4">${formatMoney(monto)}</span>
          </div>
        ))}

        <div className="ml-auto flex gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${viewMode === 'list' ? 'bg-white text-[#5b21b6] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutList size={16} /> Lista
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${viewMode === 'matrix' ? 'bg-white text-[#5b21b6] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Grid size={16} /> Matriz
            </button>
          </div>
          <button 
            onClick={handleMarkAllAsPaid}
            disabled={isMarking}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm transition-colors text-sm font-bold disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            {isMarking ? 'Marcando...' : 'Marcar Todo Como Pagado'}
          </button>
        </div>
      </div>

      {viewMode === 'matrix' ? (
        <PaymentMatrix data={pending} standalone={false} />
      ) : (
      <div className="w-full border border-gray-100 rounded-lg">
        <table className="w-full text-sm text-left text-gray-700 min-w-[800px]">
          <thead className="text-xs uppercase text-white sticky top-[60px] z-30 shadow-sm">
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
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-gray-200" onClick={() => handleSort('categoria')}>
                    <span className="whitespace-nowrap">Categoría</span>
                    <SortIcon columnKey="categoria" />
                  </div>
                  <select value={filtros.categoria} onChange={e => setFiltros({...filtros, categoria: e.target.value})} className="w-24 px-2 py-1 text-xs text-white bg-[#5b21b6] border border-white/30 rounded-lg outline-none font-normal focus:border-white focus:ring-1 focus:ring-white transition-all cursor-pointer">
                    <option value="">Todas</option>
                    {[...new Set(data.map(d => d.categoria))].filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </th>
              <th className="px-4 py-3 align-middle bg-[#5b21b6]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-gray-200" onClick={() => handleSort('responsable_pago')}>
                    <span className="whitespace-nowrap">Deudor</span>
                    <SortIcon columnKey="responsable_pago" />
                  </div>
                  <select value={filtros.responsablePago} onChange={e => setFiltros({...filtros, responsablePago: e.target.value})} className="w-24 px-2 py-1 text-xs text-white bg-[#5b21b6] border border-white/30 rounded-lg outline-none font-normal focus:border-white focus:ring-1 focus:ring-white transition-all cursor-pointer">
                    <option value="">Todos</option>
                    {[...new Set(data.map(d => d.responsable_pago))].filter(Boolean).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </th>
              <th className="px-4 py-3 align-middle bg-[#5b21b6]">
                <div className="flex items-center gap-1 cursor-pointer hover:text-gray-200 w-max" onClick={() => handleSort('monto')}>
                  <span>Monto</span>
                  <SortIcon columnKey="monto" />
                </div>
              </th>
              <th className="px-4 py-3 align-middle text-center rounded-tr-xl bg-[#5b21b6]">Acción</th>
            </tr>
          </thead>
          <tbody>
            {pending.map(t => (
              <tr key={t.id} className={`border-b border-gray-100 transition-all ${loadingId === t.id ? 'opacity-40' : 'hover:bg-red-50/30'}`}>
                <td className="px-4 py-3 whitespace-nowrap">{formatearFechaVisual(t.fecha)}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">{t.comercio}</td>
                <td className="px-4 py-3">
                  <select 
                    value={t.categoria || ''} 
                    onChange={(e) => updateField(t.id, 'categoria', e.target.value)}
                    disabled={loadingId === t.id}
                    className="text-xs text-gray-500 bg-gray-50 px-2 py-1.5 rounded-md border border-gray-200 outline-none focus:ring-2 focus:ring-primary w-full transition-colors cursor-pointer"
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
                    <option value="Otros">Otros</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select 
                    value={t.responsable_pago || ''} 
                    onChange={(e) => updateField(t.id, 'responsable_pago', e.target.value)}
                    disabled={loadingId === t.id}
                    className="bg-gray-100 text-gray-700 px-2 py-1.5 rounded-md text-xs font-bold border-none outline-none focus:ring-2 focus:ring-primary w-full transition-colors cursor-pointer"
                  >
                    <option value="">Sin Asignar</option>
                    <option value="Daniel">Daniel</option>
                    <option value="Gedalya">Gedalya</option>
                    <option value="Familiar">Familiar</option>
                  </select>
                </td>
                <td className="px-4 py-3 font-black text-red-600">${formatMoney(t.monto)}</td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => marcarComoPagado(t.id)}
                    disabled={loadingId === t.id}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm disabled:bg-gray-300"
                  >
                    Marcar Pagado
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#5b21b6] p-4 text-center">
              <AlertCircle size={32} className="mx-auto text-white mb-2" />
              <h3 className="text-lg font-bold text-white">Confirmar Pago Múltiple</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-700 text-sm mb-6">
                ¿Seguro que deseas marcar las <span className="font-bold text-red-600">{pending.length}</span> deudas pendientes como pagadas?
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  onClick={executeMarkAllAsPaid}
                  className="px-6 py-2 font-bold text-white bg-green-500 hover:bg-green-600 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Sí, marcar como pagadas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
