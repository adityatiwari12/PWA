import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Pill, Plus, Clock, AlertTriangle, Archive, ChevronRight, Share2, Activity
} from 'lucide-react';
import { useMedicationStore } from '../../store/medicationStore';
import { useDiagnosticState } from '../../hooks/useDiagnosticState';
import { notificationManager } from '../../lib/notification';

/**
 * MedicationsScreen — Medication inventory and safety analysis.
 * Upgraded to a state-driven structure indicating interaction graphs based on new_task.md
 */
export default function MedicationsScreen() {
  const { medications, fetchMedications, adherence } = useMedicationStore();
  const diagnostic = useDiagnosticState();

  useEffect(() => {
    fetchMedications().then(() => {
      // Initialize reminders on load
      const meds = useMedicationStore.getState().medications;
      notificationManager.scheduleFromStore(meds);
    });
  }, [fetchMedications]);

  const active = useMemo(() => medications.filter(m => m.status === 'active'), [medications]);
  const archived = useMemo(() => medications.filter(m => m.status !== 'active'), [medications]);

  const handleRequestPermission = async () => {
    const granted = await notificationManager.requestPermission();
    if (granted) {
      notificationManager.scheduleFromStore(medications);
    }
  };

  // Compute a rough mock adherence score based on total local records
  const adherenceScore = useMemo(() => {
    if (active.length === 0) return 0;
    const records = Object.values(adherence);
    if (records.length === 0) return 100;
    const taken = records.filter(r => r === 'taken').length;
    return Math.round((taken / records.length) * 100);
  }, [adherence, active.length]);

  return (
    <div className={`flex flex-col min-h-screen pb-32 transition-colors duration-500 ${
      diagnostic.hasInteractionRisk ? 'bg-rose-50' : 'bg-[#F8FAFC]'
    }`}>
      {/* Header */}
      <header className={`px-6 pt-12 pb-10 shadow-lg relative border-b ${
        diagnostic.hasInteractionRisk ? 'bg-gradient-to-t from-red-600 to-rose-700 border-red-800' : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <h1 className={`text-2xl font-black ${diagnostic.hasInteractionRisk ? 'text-white' : 'text-gray-900'}`}>
               Medication Stack
            </h1>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${diagnostic.hasInteractionRisk ? 'text-rose-200' : 'text-gray-400'}`}>
              {active.length} active prescriptions
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/medication/confirm"
              onClick={() => {
                useMedicationStore.getState().setPendingScan({
                  brandName: '',
                  dosage: '',
                  expiryDate: '',
                  rawText: ''
                });
              }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all bg-white border border-teal-100 text-teal-600`}
            >
              <Clock size={22} />
            </Link>
            <Link
              to="/medication/scan"
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all ${
                diagnostic.hasInteractionRisk ? 'bg-red-900 shadow-red-900/50' : 'bg-teal-500 shadow-teal-500/20'
              }`}
            >
              <Plus size={22} />
            </Link>
          </div>
        </div>

        {/* System Intelligence Block */}
        {active.length > 0 && (
          <div className={`mt-6 rounded-3xl p-5 border shadow-xl flex gap-4 ${
             diagnostic.hasInteractionRisk 
               ? 'bg-rose-900/50 border-rose-400/50 backdrop-blur-md shadow-rose-900/20' 
               : 'bg-white border-gray-100 shadow-gray-200/50'
          }`}>
             <div className="flex-1">
                <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                  diagnostic.hasInteractionRisk ? 'text-rose-300' : 'text-teal-600'
                }`}>
                   <Activity size={12} /> Adherence Rating
                </p>
                <div className="flex items-end gap-1 mt-1">
                   <h2 className={`font-black text-3xl leading-none ${diagnostic.hasInteractionRisk ? 'text-white' : 'text-gray-900'}`}>
                     {adherenceScore}%
                   </h2>
                   <span className={`text-xs font-bold mb-1 ${diagnostic.hasInteractionRisk ? 'text-rose-200' : 'text-gray-400'}`}>
                     Trailing ratio
                   </span>
                </div>
             </div>
             {diagnostic.hasInteractionRisk && (
               <div className="w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center text-white shrink-0 animate-pulse border-2 border-red-400">
                  <AlertTriangle size={24} />
               </div>
             )}
          </div>
        )}
        {/* Reminder Permission Banner */}
        {active.length > 0 && Notification.permission !== 'granted' && (
          <div className="mt-6 bg-teal-50 border border-teal-200 rounded-3xl p-5 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-black text-teal-900 mb-0.5">Reminders Disabled</p>
              <p className="text-[10px] text-teal-700 font-medium">Enable notifications to never miss a dose.</p>
            </div>
            <button 
              onClick={handleRequestPermission}
              className="bg-teal-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
            >
              Enable
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 px-6 pt-6 space-y-8 relative z-10">
        
        {/* Interaction Warnings (If Any) */}
        {diagnostic.hasInteractionRisk && (
          <div className="bg-red-100 border-2 border-red-300 rounded-3xl p-5 relative overflow-hidden -mx-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/50 blur-2xl rounded-full" />
            <h3 className="font-black text-red-900 text-sm flex items-center gap-2 mb-2 relative z-10">
              <Share2 size={16} className="text-red-600" />
              Pharmacological Conflict
            </h3>
            <p className="text-xs text-red-700 font-medium relative z-10 leading-relaxed mb-3">
              We detected severe interactions in your active stack. These molecules should not be synthesized simultaneously without medical supervision.
            </p>
            <Link to="/medication/interactions" className="inline-block bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest relative z-10">
              Isolate Interactions
            </Link>
          </div>
        )}

        {/* Active Stack Visual Display */}
        {active.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Live Regimen</h3>
            </div>
            
            <div className="relative">
              {/* Interaction Connection Line Layer (simulated via CSS if multiple meds) */}
              {active.length > 1 && diagnostic.hasInteractionRisk && (
                 <div className="absolute top-10 bottom-10 left-6 w-[2px] bg-red-400 z-0 border-l-[2px] border-dashed border-red-300" />
              )}
              {active.length > 1 && !diagnostic.hasInteractionRisk && (
                 <div className="absolute top-10 bottom-10 left-6 w-[2px] bg-teal-100 z-0" />
              )}

              <div className="space-y-4 relative z-10">
                {active.map(med => {
                  const hasConflict = med.interactionLog?.some(i => i.severity === 'contraindicated' || i.severity === 'major');
                  return (
                    <div 
                      key={med.id} 
                      className={`bg-white rounded-3xl p-4 shadow-sm border-2 transition-all flex items-start gap-4 ${
                        hasConflict ? 'border-red-400 shadow-red-900/10' : 'border-gray-100/80 shadow-gray-200/50 hover:border-teal-200'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        hasConflict ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-600'
                      }`}>
                        <Pill size={22} />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h4 className={`font-black text-sm truncate ${hasConflict ? 'text-red-900' : 'text-gray-900'}`}>
                          {med.brandName}
                        </h4>
                        <p className={`text-[11px] font-medium truncate ${hasConflict ? 'text-red-700/80' : 'text-gray-500'}`}>
                          {med.genericName} • {med.dosage || 'No dosage'}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${
                            hasConflict ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <Clock size={10} />
                            {med.schedule.length} dose{med.schedule.length !== 1 ? 's' : ''}/day
                          </span>
                          
                          {med.interactionLog.length > 0 && (
                            <span className="px-2 py-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 rounded-lg">
                              <AlertTriangle size={10} />
                              {med.interactionLog.length} Risks
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} className={hasConflict ? 'text-red-300' : 'text-gray-300'} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <Pill className="text-gray-300" size={32} />
            </div>
            <p className="text-sm font-black text-gray-900 mb-1">Stack is empty</p>
            <p className="text-xs text-gray-500 font-medium px-8 text-center">
              The system requires active medications to perform health impact correlations.
            </p>
            <Link
              to="/medication/scan"
              className="mt-6 px-6 py-3 rounded-xl bg-teal-500 text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-teal-500/20"
            >
              + ADD MEDICATION
            </Link>
          </div>
        )}

        {/* Archived */}
        {archived.length > 0 && (
          <div className="space-y-3 pt-6 border-t border-gray-200/60">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <Archive size={12} /> Inactive / Historical
            </h3>
            {archived.map(med => (
              <div key={med.id} className="bg-gray-100/50 rounded-2xl p-4 border border-transparent flex items-center gap-4 group hover:border-gray-200 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                  <Pill size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-500 truncate text-xs">{med.brandName}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-0.5">{med.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
