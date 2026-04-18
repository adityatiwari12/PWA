import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, ShieldAlert, Loader2 
} from 'lucide-react';
import { useMedicationStore } from '../../../store/medicationStore';
import { checkDrugInteractions } from '../../../lib/gemini';
import InteractionFlag from '../../../components/InteractionFlag';
import type { Medication } from '../../../types/medication';

export default function InteractionsModal() {
  const { pendingScan, medications, fetchMedications, addMedication, setPendingScan } = useMedicationStore();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['interactions', pendingScan?.genericName, medications],
    queryFn: async () => {
      if (!pendingScan?.genericName) return [];
      const existingNames = medications.map(m => m.genericName || m.brandName);
      const results = await checkDrugInteractions(pendingScan.genericName, existingNames);
      
      return results;
    },
    enabled: !!pendingScan?.genericName,
  });

  const handleAdd = async () => {
    if (!pendingScan) return;
    setIsSaving(true);
    
    try {
      const finalMed: Medication = {
        id: pendingScan.id || crypto.randomUUID(),
        brandName: pendingScan.brandName || 'Unknown',
        genericName: pendingScan.genericName || 'Unknown',
        rxcui: pendingScan.rxcui,
        dosage: pendingScan.dosage || null,
        expiryDate: pendingScan.expiryDate || null,
        rawText: pendingScan.rawText,
        schedule: pendingScan.schedule || [],
        status: 'active',
        addedAt: pendingScan.addedAt || Date.now(),
        interactionLog: alerts || []
      };

      await addMedication(finalMed);
      
      setPendingScan(null);
      navigate('/');
    } catch (err) {
      console.error('Save failed:', err);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPendingScan(null);
    navigate('/medication/scan');
  };

  if (!pendingScan) return null;

  const hasHighRisk = alerts?.some(a => a.severity === 'contraindicated' || a.severity === 'major');

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white px-6 pt-12 pb-6 border-b border-gray-100 flex items-center gap-4">
        <button 
          onClick={() => navigate('/medication/confirm')} 
          className="p-3 bg-gray-50 rounded-2xl text-gray-400 active:scale-90 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-black text-gray-900 leading-tight">Safety Check</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Powered by OpenFDA</p>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6">
        {/* Candidate Med Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-teal-500/20">
            {pendingScan.brandName?.[0] || 'M'}
          </div>
          <div>
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-0.5">Adding Now</p>
            <h3 className="font-black text-gray-900 text-lg leading-tight">{pendingScan.brandName}</h3>
            <p className="text-xs text-gray-400 font-medium">{pendingScan.genericName || 'Generic unknown'}</p>
          </div>
        </div>

        {/* Interaction Results */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Cross-Check Results</h4>

          {isLoading ? (
            <div className="bg-white rounded-[32px] p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-teal-500/20 rounded-full animate-ping" />
                <div className="relative bg-teal-500 p-4 rounded-full text-white">
                   <ShieldCheck size={32} />
                </div>
              </div>
              <p className="font-bold text-gray-900 mb-1">Checking Interactions...</p>
              <p className="text-xs text-gray-400 px-8">Comparing clinical data with your current medications.</p>
            </div>
          ) : alerts && alerts.length > 0 ? (
            <div className="space-y-4">
               {hasHighRisk && (
                 <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-3 animate-pulse">
                    <ShieldAlert className="text-red-500 shrink-0" />
                    <p className="text-xs font-bold text-red-800 leading-snug">
                       High-risk interactions detected. Please consult your physician before adding.
                    </p>
                 </div>
               )}
               {alerts.map((alert, i) => (
                 <div key={i} className="bg-white rounded-3xl p-5 shadow-sm border-2 border-transparent hover:border-teal-500/10 transition-all">
                    <InteractionFlag
                      severity={alert.severity}
                      description={alert.description}
                    />
                 </div>
               ))}
            </div>
          ) : (
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                 <ShieldCheck size={32} />
              </div>
              <p className="font-bold text-gray-900 mb-1">Safe to Proceed</p>
              <p className="text-xs text-gray-400 px-6">No interactions found against your existing medication profile.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="p-6 pb-10 bg-white border-t border-gray-100 flex gap-4">
        <button
          onClick={handleCancel}
          className="flex-1 py-4 bg-gray-50 text-gray-500 font-bold text-sm rounded-2xl active:scale-95 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={isSaving}
          className={`flex-[2] py-4 font-black text-sm rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
            hasHighRisk 
              ? 'bg-red-500 text-white shadow-red-500/20' 
              : 'bg-teal-500 text-white shadow-teal-500/20'
          }`}
        >
          {isSaving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : hasHighRisk ? (
            'ADD ANYWAY'
          ) : (
            'SAVE TO PROFILE'
          )}
        </button>
      </footer>
    </div>
  );
}
