import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, RefreshCw, AlertCircle, Clock, Plus, Trash2 
} from 'lucide-react';
import { useMedicationStore } from '../../../store/medicationStore';
import { normalizeDrug } from '../../../lib/rxnorm';
import type { DoseSchedule } from '../../../types/medication';

const PRESETS = [
  { label: 'Morning', time: '09:00', icon: '☀️' },
  { label: 'Afternoon', time: '13:00', icon: '🌤️' },
  { label: 'Evening', time: '18:00', icon: '🌅' },
  { label: 'Night', time: '21:00', icon: '🌙' },
];

export default function ConfirmModal() {
  const { pendingScan, setPendingScan } = useMedicationStore();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    brandName: pendingScan?.brandName || '',
    dosage: pendingScan?.dosage || '',
    expiryDate: pendingScan?.expiryDate || '',
  });

  const [schedule, setSchedule] = useState<DoseSchedule[]>(() => {
    if (pendingScan?.intelligentSchedule && pendingScan.intelligentSchedule.length > 0) {
      return pendingScan.intelligentSchedule.map(time => ({
        time,
        quantity: 1,
        unit: 'tablet',
        withFood: true
      }));
    }
    return [{ time: '09:00', quantity: 1, unit: 'tablet', withFood: true }];
  });

  useEffect(() => {
    if (!pendingScan) {
      navigate('/medication/scan');
    }
  }, [pendingScan, navigate]);

  const mutation = useMutation({
    mutationFn: normalizeDrug,
    onSuccess: (result) => {
      const baseData = {
        ...pendingScan,
        brandName: formData.brandName,
        dosage: formData.dosage,
        expiryDate: formData.expiryDate,
        schedule: schedule,
        status: 'active' as const,
        addedAt: Date.now(),
        interactionLog: []
      };

      if (result) {
        setPendingScan({
          ...baseData,
          genericName: result.name,
          rxcui: result.rxcui,
        });
      } else {
        setPendingScan({
          ...baseData,
          genericName: formData.brandName,
        });
      }
      navigate('/medication/interactions');
    },
  });

  const handleConfirm = () => {
    mutation.mutate(formData.brandName);
  };

  const addSchedule = (time = '10:00') => {
    setSchedule([...schedule, { time, quantity: 1, unit: 'tablet', withFood: true }]);
  };

  const removeSchedule = (idx: number) => {
    setSchedule(schedule.filter((_, i) => i !== idx));
  };

  const updateSchedule = (idx: number, updates: Partial<DoseSchedule>) => {
    const newSched = [...schedule];
    newSched[idx] = { ...newSched[idx], ...updates };
    setSchedule(newSched);
  };

  if (!pendingScan) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] p-6 pb-32">
      <div className="flex items-center mb-8">
        <button 
          onClick={() => navigate('/medication/scan')} 
          className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 active:scale-90 transition-all"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div className="ml-4">
          <h2 className="text-xl font-black text-gray-900 leading-tight">Review Medication</h2>
          <p className="text-xs text-gray-500 font-medium">Verify details and set reminders</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Core Info Card */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 space-y-5">
           <div className="flex items-center gap-2 mb-2">
             <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <CheckCircle size={18} />
             </div>
             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Medical Details</span>
           </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Drug Name</label>
            <input
              type="text"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              className="w-full px-4 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Dosage</label>
              <input
                type="text"
                value={formData.dosage}
                placeholder="e.g. 500mg"
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                className="w-full px-4 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Expiry</label>
              <input
                type="text"
                value={formData.expiryDate}
                placeholder="MM/YYYY"
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-4 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Scheduling Card */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock size={18} />
               </div>
               <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Timings</span>
            </div>
            <button 
              onClick={() => addSchedule()}
              className="text-xs font-bold text-teal-600 flex items-center gap-1 active:scale-90 transition-all"
            >
              <Plus size={14} /> Add Dose
            </button>
          </div>
          
          {pendingScan?.intelligentSchedule && pendingScan.intelligentSchedule.length > 0 && (
            <div className="mb-6 flex items-start gap-2 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 p-3 rounded-2xl">
              <span className="text-teal-500 mt-0.5">✨</span>
              <p className="text-[10px] uppercase font-black tracking-widest text-teal-700 leading-relaxed">
                Smart Schedule Auto-Applied. <span className="text-teal-600 font-medium">Please verify times against doctor advice.</span>
              </p>
            </div>
          )}

          <div className="space-y-4">
            {schedule.map((item, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="time"
                    value={item.time}
                    onChange={(e) => updateSchedule(idx, { time: e.target.value })}
                    className="bg-white px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <div className="flex items-center bg-white rounded-xl border border-gray-200 px-3 py-2 gap-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateSchedule(idx, { quantity: Number(e.target.value) })}
                      className="w-8 text-center font-bold text-gray-800 outline-none"
                    />
                    <span className="text-xs text-gray-400 font-bold">tab</span>
                  </div>
                  {schedule.length > 1 && (
                    <button 
                      onClick={() => removeSchedule(idx)}
                      className="ml-auto p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSchedule(idx, { withFood: true })}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      item.withFood ? 'bg-teal-500 text-white' : 'bg-white text-gray-400 border border-gray-200'
                    }`}
                  >
                    After Meal
                  </button>
                  <button
                    onClick={() => updateSchedule(idx, { withFood: false })}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      !item.withFood ? 'bg-teal-500 text-white' : 'bg-white text-gray-400 border border-gray-200'
                    }`}
                  >
                    Before Meal
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Presets */}
          <div className="grid grid-cols-4 gap-2 mt-6">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => addSchedule(p.time)}
                className="flex flex-col items-center p-2 bg-gray-50 rounded-xl border border-gray-100 hover:bg-teal-50 hover:border-teal-200 transition-all group"
              >
                <span className="text-lg mb-0.5 group-hover:scale-125 transition-transform">{p.icon}</span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent">
        <div className="max-w-md mx-auto flex flex-col gap-3">
          {mutation.isError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-2xl text-xs font-bold border border-red-100 animate-bounce">
              <AlertCircle size={16} />
              <span>Normalization error. Saving as-is.</span>
            </div>
          )}



          <button
            onClick={handleConfirm}
            disabled={mutation.isPending}
            className="w-full py-5 rounded-[24px] bg-teal-500 text-white font-black text-sm shadow-xl shadow-teal-900/10 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-70"
          >
            {mutation.isPending ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                <span>SAVING RECORDS...</span>
              </>
            ) : (
              <>
                <span>VALIDATE & PROCEED</span>
                <CheckCircle size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
