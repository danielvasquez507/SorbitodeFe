import { useState } from 'react';
import { X, Plus, Calendar, CreditCard, User, CheckSquare } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import CustomDatePicker from './CustomDatePicker';

export default function ManualExpenseModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().slice(0, 16),
    comercio: '',
    monto: '',
    responsable: '',
    tarjeta: '',
    responsable_pago: '',
    categoria: '',
    pagado: false
  });
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: async (newExpense) => {
      const formattedExpense = {
        ...newExpense,
        fecha: newExpense.fecha.replace('T', ' ') + ':00' // Formato DB: YYYY-MM-DD HH:MM:SS
      };
      
      const res = await fetch(`/api/transacciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedExpense)
      });
      if (!res.ok) throw new Error('Error al guardar la transacción');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      setFormData({
        fecha: new Date().toISOString().slice(0, 16),
        comercio: '',
        monto: '',
        responsable: '',
        tarjeta: '',
        responsable_pago: '',
        categoria: '',
        pagado: false
      });
      onClose();
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fecha || !formData.comercio || !formData.monto) {
      setError('Por favor completa los campos obligatorios (*).');
      return;
    }
    setError(null);
    mutation.mutate({
      ...formData,
      monto: parseFloat(formData.monto)
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#5b21b6] px-6 py-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Plus size={20} />
            Registrar Gasto Manual
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-red-200">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1"><Calendar size={14} /> Fecha y Hora *</label>
              <div className="relative z-[70]">
                <CustomDatePicker 
                  value={formData.fecha} 
                  onChange={val => setFormData({...formData, fecha: val})} 
                  showTime={true} 
                  placeholder="Fecha y hora" 
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Monto ($) *</label>
              <input type="number" step="0.01" min="0" required placeholder="0.00" value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] text-sm text-gray-800" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase">Comercio / Descripción *</label>
            <input type="text" required placeholder="Ej. Restaurante La Loma" value={formData.comercio} onChange={e => setFormData({...formData, comercio: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] text-sm text-gray-800" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1"><User size={14} /> Tarjetahabiente</label>
              <select value={formData.responsable} onChange={e => setFormData({...formData, responsable: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] text-sm text-gray-800 bg-white">
                <option value="">Seleccionar</option>
                <option value="Daniel">Daniel</option>
                <option value="Gedalya">Gedalya</option>
                <option value="Familiar">Familiar</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1"><CreditCard size={14} /> Tarjeta</label>
              <select value={formData.tarjeta} onChange={e => setFormData({...formData, tarjeta: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] text-sm text-gray-800 bg-white">
                <option value="">Seleccionar</option>
                <option value="VISA 5176">VISA 5176 (Daniel)</option>
                <option value="VISA 2857">VISA 2857 (Gedalya)</option>
                <option value="N/A">Otra / N/A</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Responsable de Pago</label>
              <select value={formData.responsable_pago} onChange={e => setFormData({...formData, responsable_pago: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] text-sm text-gray-800 bg-white">
                <option value="">Sin Asignar</option>
                <option value="Daniel">Daniel</option>
                <option value="Gedalya">Gedalya</option>
                <option value="Familiar">Familiar</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Categoría</label>
              <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-xl outline-none focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] text-sm text-gray-800 bg-white">
                <option value="">Otro</option>
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
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors mt-2">
            <input type="checkbox" checked={formData.pagado} onChange={e => setFormData({...formData, pagado: e.target.checked})} className="accent-[#5b21b6] w-5 h-5" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-800 flex items-center gap-1">Marcar como pagado <CheckSquare size={14} className="text-[#5b21b6]"/></span>
              <span className="text-xs text-gray-500">Activa si este gasto ya fue liquidado.</span>
            </div>
          </label>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#5b21b6] hover:bg-[#4c1d95] shadow-lg shadow-purple-500/30 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2">
              {mutation.isPending ? 'Guardando...' : 'Guardar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
