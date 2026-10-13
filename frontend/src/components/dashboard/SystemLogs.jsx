import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Terminal, CheckCircle2, XCircle, AlertCircle, Info, RefreshCw, Clock, Database, Brain, Mail, Server, ClipboardList } from 'lucide-react';

export default function SystemLogs() {
  const [selectedRunId, setSelectedRunId] = useState(null);

  const { data: logs = [], refetch, isFetching } = useQuery({
    queryKey: ['system-logs'],
    queryFn: async () => {
      const res = await fetch('/api/logs');
      return res.json();
    },
    refetchInterval: 3000
  });

  const groupedLogs = logs.reduce((acc, log) => {
    if (!log.run_id) return acc;
    if (!acc[log.run_id]) acc[log.run_id] = [];
    acc[log.run_id].push(log);
    return acc;
  }, {});

  const runIds = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));
  const activeRunId = selectedRunId && groupedLogs[selectedRunId] ? selectedRunId : (runIds.length > 0 ? runIds[0] : null);
  const activeLogs = activeRunId ? groupedLogs[activeRunId] : [];

  // Función para agrupar logs en pasos
  const buildPipeline = (logsArr) => {
    const steps = [
      { id: 'imap', title: 'Conexión y Descarga IMAP', icon: Mail, status: 'pending', messages: [] },
      { id: 'parse', title: 'Análisis de Comprobantes', icon: Server, status: 'pending', messages: [] },
      { id: 'ia', title: 'Clasificación con IA (Gemini)', icon: Brain, status: 'pending', messages: [] },
      { id: 'db', title: 'Registro en Base de Datos', icon: Database, status: 'pending', messages: [] },
    ];

    let hasError = false;

    logsArr.forEach(log => {
      const msg = log.message;
      const type = log.type;
      
      if (type === 'ERROR') hasError = true;

      // Paso 1: IMAP
      if (msg.includes('Analizando bandeja') || msg.includes('Se identificaron')) {
        steps[0].messages.push(log);
        steps[0].status = type === 'ERROR' ? 'error' : 'in-progress';
      }
      // Paso 2: Parseo
      else if (msg.includes('Descarga finalizada') || msg.includes('Analizando')) {
        steps[0].status = steps[0].status === 'error' ? 'error' : 'success';
        steps[1].messages.push(log);
        steps[1].status = type === 'ERROR' ? 'error' : 'in-progress';
      }
      // Paso 3: IA
      else if (msg.includes('Gemini') || msg.includes('lote de')) {
        steps[1].status = steps[1].status === 'error' ? 'error' : 'success';
        steps[2].messages.push(log);
        steps[2].status = type === 'ERROR' ? 'error' : 'in-progress';
      }
      // Paso 4: BD
      else if (msg.includes('Nuevas transacciones') || msg.includes('No se encontraron') || msg.includes('Sincronización finalizada')) {
        if (steps[0].status !== 'error') steps[0].status = 'success';
        if (steps[1].status !== 'error') steps[1].status = 'success';
        if (steps[2].status === 'in-progress') steps[2].status = 'success';
        
        steps[3].messages.push(log);
        steps[3].status = type === 'ERROR' ? 'error' : 'success';
      } else {
        // Fallback: meter en el paso actualmente activo
        const activeStep = steps.findLast(s => s.status === 'in-progress') || steps[0];
        activeStep.messages.push(log);
        if (type === 'ERROR') activeStep.status = 'error';
      }
    });

    // Finalizar proceso si no hubo errores pero se quedó pegado (ej. no hubo necesidad de IA)
    if (!hasError && logsArr.length > 0) {
      const lastMsg = logsArr[logsArr.length-1].message;
      if (lastMsg.includes('No se encontraron') || lastMsg.includes('Sincronización finalizada')) {
        steps.forEach(s => {
          if (s.status === 'pending') s.status = 'skipped';
          if (s.status === 'in-progress') s.status = 'success';
        });
      }
    }

    return steps;
  };

  const pipeline = buildPipeline(activeLogs);

  const StatusIcon = ({ status }) => {
    switch(status) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500 bg-white rounded-full" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500 bg-white rounded-full" />;
      case 'in-progress': return <RefreshCw className="w-5 h-5 text-amber-500 animate-spin bg-white rounded-full" />;
      case 'skipped': return <CheckCircle2 className="w-5 h-5 text-gray-400 bg-white rounded-full" />;
      default: return <Clock className="w-5 h-5 text-gray-300 bg-white rounded-full" />;
    }
  };

  const getBorderColor = (status) => {
    switch(status) {
      case 'success': return 'border-emerald-500';
      case 'error': return 'border-red-500';
      case 'in-progress': return 'border-amber-500 border-dashed';
      case 'skipped': return 'border-gray-300';
      default: return 'border-gray-200';
    }
  };

  const getBgColor = (status) => {
    switch(status) {
      case 'success': return 'bg-emerald-50';
      case 'error': return 'bg-red-50';
      case 'in-progress': return 'bg-amber-50';
      case 'skipped': return 'bg-gray-50 opacity-60';
      default: return 'bg-white';
    }
  };

  return (
    <div className="glass-panel p-0 flex h-[600px] w-full border border-gray-100 rounded-t-none overflow-hidden bg-[#f8fafc]">
      
      {/* Sidebar - Historial */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
            <ClipboardList size={16} /> Historial
          </h3>
          <button onClick={() => refetch()} className={`p-1.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 ${isFetching ? 'animate-spin' : ''}`}>
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {runIds.length === 0 ? (
            <div className="p-4 text-xs text-gray-500 text-center">No hay ejecuciones registradas.</div>
          ) : (
            runIds.map((id, idx) => {
              const runLogs = groupedLogs[id];
              const hasError = runLogs.some(l => l.type === 'ERROR');
              return (
                <button
                  key={id}
                  onClick={() => setSelectedRunId(id)}
                  className={`w-full text-left p-3 border-b border-gray-50 transition-colors flex flex-col gap-1 ${activeRunId === id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-gray-700">{idx === 0 ? 'Última Ejecución' : `Ejecución #${runIds.length - idx}`}</span>
                    {hasError ? <XCircle size={12} className="text-red-500" /> : <CheckCircle2 size={12} className="text-emerald-500" />}
                  </div>
                  <span className="text-[10px] text-gray-500">{new Date(parseInt(id)).toLocaleString('es-PA', { hour12: true }).replace(/\s?a\.?\s?m\.?/i, ' am').replace(/\s?p\.?\s?m\.?/i, ' pm')}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content - Flowchart */}
      <div className="flex-1 overflow-y-auto p-8 relative bg-[#f8fafc]">
        {activeLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
            <Terminal size={48} className="opacity-20" />
            <p>Selecciona una ejecución para ver el flujo.</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <Terminal className="text-indigo-600" /> 
                Pipeline de Sincronización
              </h2>
              <p className="text-sm text-gray-500 mt-1">Ejecutado el {new Date(parseInt(activeRunId)).toLocaleString('es-PA', { hour12: true }).replace(/\s?a\.?\s?m\.?/i, ' am').replace(/\s?p\.?\s?m\.?/i, ' pm')}</p>
            </div>

            <div className="relative pl-6">
              {/* Línea vertical conectora */}
              <div className="absolute left-[1.8rem] top-4 bottom-8 w-0.5 bg-gray-200 z-0"></div>

              <div className="space-y-6">
                {pipeline.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="relative z-10">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          <StatusIcon status={step.status} />
                        </div>
                        <div className={`flex-1 border-2 rounded-xl p-4 transition-all shadow-sm ${getBorderColor(step.status)} ${getBgColor(step.status)}`}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                              <Icon size={18} className={step.status === 'error' ? 'text-red-500' : 'text-indigo-600'} />
                            </div>
                            <h3 className="font-bold text-gray-800">{step.title}</h3>
                          </div>
                          
                          {step.messages.length > 0 ? (
                            <div className="mt-3 space-y-1.5 bg-white/60 p-3 rounded-lg text-xs font-mono">
                              {step.messages.map((log, lidx) => (
                                <div key={lidx} className="flex gap-2">
                                  <span className="text-[10px] text-gray-400 select-none whitespace-nowrap pt-[2px]">[{new Date(log.timestamp).toLocaleTimeString('es-PA', { hour12: true }).replace(/\s?a\.?\s?m\.?/i, ' am').replace(/\s?p\.?\s?m\.?/i, ' pm')}]</span>
                                  <span className={log.type === 'ERROR' ? 'text-red-600 font-bold' : log.type === 'WARNING' ? 'text-amber-600' : 'text-gray-700'}>
                                    {log.message}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-1 text-xs text-gray-400 italic">
                              {step.status === 'pending' ? 'Esperando inicio...' : step.status === 'skipped' ? 'Paso omitido.' : 'Sin detalles de log.'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
