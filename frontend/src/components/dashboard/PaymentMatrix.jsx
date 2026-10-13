import { CreditCard } from 'lucide-react';
import { formatMoney } from '../../lib/utils';

export default function PaymentMatrix({ data = [], standalone = true }) {
  // Pivotar datos localmente basados en las transacciones filtradas
  const matriz = {};
  data.forEach(t => {
    if (!t.responsable_pago) return; // Si no hay deudor, se omite
    if (!matriz[t.responsable_pago]) matriz[t.responsable_pago] = {};
    const cat = t.categoria || 'Sin Categoría';
    matriz[t.responsable_pago][cat] = (matriz[t.responsable_pago][cat] || 0) + t.monto;
  });

  const responsables = Object.keys(matriz);
  const categoriasSet = new Set();
  responsables.forEach(r => Object.keys(matriz[r]).forEach(c => categoriasSet.add(c)));
  const categorias = Array.from(categoriasSet);

  // Totales
  const totalesColumna = {};
  categorias.forEach(c => totalesColumna[c] = 0);
  let granTotal = 0;

  return (
    <div className={standalone ? "glass-panel p-6 w-full max-w-full overflow-hidden border-none rounded-t-none" : "w-full max-w-full overflow-hidden border border-gray-100 rounded-lg"}>
      <div className="w-full overflow-x-auto no-scrollbar">
      <table className="w-full text-sm text-left text-gray-700 min-w-[800px]">
        <thead className="text-xs uppercase text-white sticky top-0 z-30 shadow-sm">
          <tr className="h-[48px]">
            <th className="px-4 py-3 rounded-tl-xl bg-[#5b21b6] sticky left-0 z-40 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">Responsable</th>
            {categorias.map(c => <th key={c} className="px-4 py-3 text-center bg-[#5b21b6]">{c}</th>)}
            <th className="px-4 py-3 rounded-tr-xl text-center bg-[#ec4899] sticky right-0 z-40 shadow-[-2px_0_5px_rgba(0,0,0,0.1)]">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {responsables.map((r) => {
            let totalFila = 0;
            return (
              <tr key={r} className="border-b border-gray-100 group transition-colors">
                <td className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">{r}</td>
                {categorias.map(c => {
                  const val = matriz[r][c] || 0;
                  totalFila += val;
                  totalesColumna[c] += val;
                  return <td key={c} className="px-4 py-3 text-center bg-white group-hover:bg-gray-50">${formatMoney(val)}</td>
                })}
                <td className="px-4 py-3 text-center text-primary font-bold sticky right-0 bg-white group-hover:bg-gray-50 z-20 shadow-[-2px_0_5px_rgba(0,0,0,0.02)]">${formatMoney(totalFila)}</td>
              </tr>
            );
          })}
          {responsables.length > 0 && (
            <tr className="font-bold text-gray-800 border-t-2 border-gray-200">
              <td className="px-4 py-3 sticky left-0 bg-gray-100 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">Sub Total</td>
              {categorias.map(c => {
                granTotal += totalesColumna[c];
                return <td key={c} className="px-4 py-3 text-center text-primary bg-gray-100">${formatMoney(totalesColumna[c])}</td>
              })}
              <td className="px-4 py-3 text-center text-[#ec4899] text-base sticky right-0 bg-gray-100 z-20 shadow-[-2px_0_5px_rgba(0,0,0,0.02)]">${formatMoney(granTotal)}</td>
            </tr>
          )}
          {responsables.length === 0 && (
            <tr><td colSpan={100} className="text-center p-4">No hay deudas registradas para este periodo</td></tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
