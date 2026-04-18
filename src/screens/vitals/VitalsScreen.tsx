import { useState, useEffect } from 'react';
import { 
  Activity, 
  BrainCircuit, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Thermometer,
  ShieldAlert
} from 'lucide-react';
import { useMedicationStore } from '../../store/medicationStore';
import { useVitalsStore } from '../../store/vitalsStore';
import { useDiagnosticState } from '../../hooks/useDiagnosticState';

export default function VitalsScreen() {
  const { medications } = useMedicationStore();
  const { vitals, startSimulation } = useVitalsStore();
  const diagnostic = useDiagnosticState();
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis'>('overview');

  useEffect(() => {
    startSimulation();
    return () => {
      // Background sim is kept alive by HomeScreen, but here we explicitly request it active.
    };
  }, [startSimulation]);

  const hasCritical = vitals.some(v => v.status === 'critical');
  const hasWarning = vitals.some(v => v.status === 'high' || v.status === 'low');

  const bgGradient = hasCritical 
    ? 'from-red-950 via-rose-900 to-black' 
    : hasWarning 
    ? 'from-amber-950 via-[#1e140d] to-black' 
    : 'from-[#0B1120] via-[#0B1120] to-black';

  return (
    <div className={`flex flex-col min-h-full transition-colors duration-1000 bg-gradient-to-br ${bgGradient} text-gray-100 overflow-hidden relative pb-32`}>
      {/* Background glow effects */}
      <div className={`absolute top-0 left-1/4 w-96 h-96 blur-[100px] rounded-full pointer-events-none transition-colors duration-1000 ${
         hasCritical ? 'bg-red-600/20' : hasWarning ? 'bg-amber-500/10' : 'bg-indigo-500/10'
      }`} />
      
      {/* Header */}
      <header className="px-6 pt-12 pb-6 border-b border-white/5 relative z-10 bg-black/20 backdrop-blur-xl">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Activity className={hasCritical ? 'text-red-500 animate-pulse' : 'text-indigo-400'} />
              Vitals Core
            </h1>
            {hasCritical && (
               <div className="bg-red-600/20 text-red-400 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 border border-red-500/50">
                  <ShieldAlert size={12} /> Critical Flag
               </div>
            )}
        </div>
        
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${hasCritical ? 'bg-red-500' : hasWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          Telemetry Syncing
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 p-1 bg-white/5 rounded-2xl border border-white/5">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview' ? 'bg-white/20 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            Telemetry Grid
          </button>
          <button 
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'analysis' ? 'bg-white/20 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BrainCircuit size={14} className={hasCritical ? 'text-red-400' : ''} /> AI Synthesis
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 relative z-10">
        
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Context Warning if critical */}
            {hasCritical && (
               <div className="bg-red-900/40 border border-red-500/30 rounded-3xl p-5 mb-2 backdrop-blur-md">
                 <h3 className="text-red-400 font-black text-sm mb-1 flex items-center gap-2">
                    <AlertTriangle size={16} /> Danger Detected
                 </h3>
                 <p className="text-xs text-red-200/80 leading-relaxed font-medium">
                    One or more vitals are in critical danger zones. This may require immediate medical attention depending on your medication regimen.
                 </p>
               </div>
            )}

            {/* Vitals Grid */}
            <div className="grid grid-cols-2 gap-3">
              {vitals.map((v, i) => (
                <div key={i} className={`border rounded-3xl p-4 relative overflow-hidden transition-all duration-300 ${
                   v.status === 'critical' ? 'bg-red-900/40 border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.2)]' :
                   v.status === 'high' || v.status === 'low' ? 'bg-amber-900/20 border-amber-500/30' :
                   'bg-white/5 border-white/5 hover:bg-white/10'
                }`}>
                  <div className="absolute -right-4 -top-4 opacity-5">
                    <v.icon size={80} />
                  </div>
                  
                  <div className="flex justify-between items-start mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                       v.status === 'critical' ? 'bg-red-500/20 text-red-400' :
                       v.status === 'high' || v.status === 'low' ? 'bg-amber-500/20 text-amber-400' :
                       'bg-white/10 text-gray-300'
                    }`}>
                      <v.icon size={16} />
                    </div>
                    {v.trend === 'up' ? <TrendingUp size={14} className={v.status === 'critical' ? 'text-red-400' : 'text-emerald-400'} /> : 
                     v.trend === 'down' ? <TrendingDown size={14} className={v.status === 'critical' ? 'text-red-400' : 'text-indigo-400'} /> : 
                     null}
                  </div>
                  
                  <p className="text-[10px] font-black uppercase tracking-widest leading-tight mb-1 opacity-60">
                    {v.label}
                  </p>
                  <p className={`text-2xl font-black transition-all duration-300 ${v.status === 'critical' ? 'text-red-400' : 'text-white'}`}>
                    {v.id === 'bp' ? `${v.sys}/${v.dia}` : v.value} <span className="text-[10px] font-bold opacity-50">{v.unit}</span>
                  </p>

                  <div className="mt-3 flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                       v.status === 'optimal' || v.status === 'normal' ? 'bg-emerald-400' : 
                       v.status === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-400'
                    }`} />
                    <span className="text-[9px] uppercase tracking-widest font-black opacity-60">{v.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Status */}
            {!hasCritical && !hasWarning && (
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Activity className="text-emerald-400" size={20} />
                </div>
                <div>
                  <h3 className="text-emerald-400 font-black text-sm mb-1">Baseline Stable</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    All major vitals are within optimum physiological ranges. No immediate interventions required.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Synthesis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-4">
            
            {/* Pharmacokinetic Impact Engine */}
            <div className="bg-black/40 border border-white/5 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${hasCritical ? 'from-red-600 via-rose-500' : 'from-indigo-500 via-purple-500'} to-transparent`} />
              
              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit className={hasCritical ? 'text-red-400' : 'text-indigo-400'} size={20} />
                <h2 className="text-gray-100 font-black text-sm uppercase tracking-widest">Synthesis Engine</h2>
              </div>
              
              <p className="text-sm text-gray-300 leading-relaxed font-medium mb-4">
                 {diagnostic.vitalAnomalies.length > 0 
                   ? `Detected physiological deviations: ${diagnostic.vitalAnomalies.join('. ')}. Correlating with current medication stack.`
                   : 'Vitals are perfectly nominal. Correlating with stack confirms standard pharmacokinetic absorption with zero adverse impact.'}
              </p>
            </div>

            {/* Med Adverse Impact Mapping based on Vitals */}
            {diagnostic.vitalAnomalies.length > 0 && medications.length > 0 ? (
               <div className="space-y-3">
                 <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest mt-6 mb-2 ml-1">
                   Correlated Risk Vectors
                 </h3>
                 <div className="bg-red-900/10 border border-red-500/20 rounded-3xl p-5">
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-red-300 bg-red-500/20 px-2 py-1 rounded">Drug-Induced Variance</span>
                     <AlertTriangle size={14} className="text-red-400" />
                   </div>
                   <h4 className="text-white font-black text-sm mb-2">{medications[0].brandName} Influence</h4>
                   <p className="text-xs text-gray-400 leading-relaxed">
                     We noticed an anomaly in your vitals. <span className="text-red-300 font-bold">{medications[0].brandName}</span> is active in your system and might be inducing these stress markers. Review dosage timing with your physician if this anomaly persists.
                   </p>
                 </div>
               </div>
            ) : medications.length > 0 ? (
               <div className="space-y-3 mt-6">
                 <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">
                   Stable Efficacy Map
                 </h3>
                 <div className="bg-emerald-900/10 border border-emerald-500/10 rounded-3xl p-5">
                    <h4 className="text-white font-black text-sm mb-1">{medications[0].brandName}</h4>
                    <p className="text-xs text-gray-400">
                      Vitals show optimal conditions. The drug is working as intended without disrupting cardiovascular or respiratory baselines.
                    </p>
                 </div>
               </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center mt-6">
                 <Thermometer className="text-gray-500 mx-auto mb-3" size={24} />
                 <p className="text-sm font-black text-gray-300">Stack is Empty</p>
                 <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Add medications to analyze correlations</p>
              </div>
            )}
            
          </div>
        )}
      </main>
    </div>
  );
}
