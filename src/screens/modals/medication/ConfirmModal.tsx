import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Sun, 
  CloudSun, 
  Sunset, 
  Moon,
  Check
} from 'lucide-react';
import { useMedicationStore } from '../../../store/medicationStore';
import { normalizeDrug } from '../../../lib/rxnorm';
import type { DoseSchedule } from '../../../types/medication';

const TIME_PRESETS = [
  { id: 'morning', label: 'Morning', time: '09:00', Icon: Sun },
  { id: 'afternoon', label: 'Afternoon', time: '13:00', Icon: CloudSun },
  { id: 'evening', label: 'Evening', time: '18:00', Icon: Sunset },
  { id: 'night', label: 'Night', time: '21:00', Icon: Moon },
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

  const [selectedPreset, setSelectedPreset] = useState<string>('morning');

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

  const updateSchedule = (idx: number, updates: Partial<DoseSchedule>) => {
    const newSched = [...schedule];
    newSched[idx] = { ...newSched[idx], ...updates };
    setSchedule(newSched);
  };

  if (!pendingScan) return null;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/medication/scan')}
            className="text-gray-900 active:scale-90 transition-transform"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-[18px] font-medium text-gray-900 leading-tight">Review medication</h1>
            <p className="text-[13px] text-gray-500">Verify details and set reminders</p>
          </div>
        </div>
      </header>

      <main className="px-5 space-y-4">
        {/* Card 1: Medical Details */}
        <div className="bg-white rounded-[12px] border border-gray-200 p-5 space-y-6">
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Drug name</label>
            <input
              type="text"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              className="w-full pb-2 border-b border-gray-100 focus:border-[#E84040] outline-none transition-colors text-[16px] font-medium text-gray-900 bg-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Dosage</label>
              <input
                type="text"
                value={formData.dosage}
                placeholder="650mg"
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                className="w-full pb-2 border-b border-gray-100 focus:border-[#E84040] outline-none transition-colors text-[16px] font-medium text-gray-900 bg-transparent placeholder-gray-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Expiry</label>
              <input
                type="text"
                value={formData.expiryDate}
                placeholder="MM/YYYY"
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full pb-2 border-b border-gray-100 focus:border-[#E84040] outline-none transition-colors text-[16px] font-medium text-gray-900 bg-transparent placeholder-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Schedule */}
        <div className="bg-white rounded-[12px] border border-gray-200 p-5">
          <h2 className="text-[15px] font-medium text-gray-900 mb-4">Schedule</h2>
          
          <div className="space-y-6">
            {schedule.map((item, idx) => (
              <div key={idx} className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={item.time}
                      onChange={(e) => updateSchedule(idx, { time: e.target.value })}
                      className="text-[16px] font-medium text-gray-900 bg-transparent outline-none"
                    />
                    <Clock size={16} className="text-gray-400" />
                  </div>
                  <div className="bg-gray-100 px-2.5 py-1 rounded-full">
                    <span className="text-[13px] text-gray-500">{item.quantity} tab</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => updateSchedule(idx, { withFood: true })}
                    className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                      item.withFood 
                        ? 'bg-[#E84040] text-white' 
                        : 'bg-white text-gray-500 border border-gray-200'
                    }`}
                  >
                    After meal
                  </button>
                  <button
                    onClick={() => updateSchedule(idx, { withFood: false })}
                    className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                      !item.withFood 
                        ? 'bg-[#E84040] text-white' 
                        : 'bg-white text-gray-500 border border-gray-200'
                    }`}
                  >
                    Before meal
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {TIME_PRESETS.map((p) => {
                    const isSelected = selectedPreset === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPreset(p.id);
                          updateSchedule(idx, { time: p.time });
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-[12px] border transition-all ${
                          isSelected 
                            ? 'border-[#E84040] text-[#E84040]' 
                            : 'border-gray-200 text-gray-400 bg-white'
                        }`}
                      >
                        <p.Icon size={16} strokeWidth={2} className="mb-1" />
                        <span className="text-[10px] font-medium">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom CTA */}
      <div className="mt-auto p-5">
        <button
          onClick={handleConfirm}
          disabled={mutation.isPending}
          className="w-full h-[52px] rounded-full bg-[#E84040] text-white font-medium text-[16px] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-70 shadow-lg shadow-[#E84040]/20"
        >
          {mutation.isPending ? 'Singeing records...' : 'Validate and proceed'}
        </button>
      </div>
    </div>
  );
}
