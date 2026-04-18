import { create } from 'zustand';
import { Heart, Activity, Thermometer, Droplets, Wind, Zap } from 'lucide-react';

export interface VitalSign {
  id: string;
  icon: any;
  label: string;
  value?: number;
  sys?: number;
  dia?: number;
  unit: string;
  status: 'optimal' | 'normal' | 'low' | 'high' | 'critical';
  color: string;
  bg: string;
  trend: 'up' | 'down' | 'steady';
}

interface VitalsStore {
  vitals: VitalSign[];
  isSimulating: boolean;
  startSimulation: () => void;
  stopSimulation: () => void;
}

// Initial mock state
const INITIAL_VITALS: VitalSign[] = [
  { id: 'hr', icon: Heart, label: 'Heart Rate', value: 72, unit: 'bpm', status: 'normal', color: 'text-rose-500', bg: 'bg-rose-50', trend: 'steady' },
  { id: 'bp', icon: Activity, label: 'Blood Pressure', sys: 118, dia: 76, unit: 'mmHg', status: 'optimal', color: 'text-indigo-500', bg: 'bg-indigo-50', trend: 'down' },
  { id: 'spo2', icon: Droplets, label: 'Blood Oxygen', value: 98, unit: '%', status: 'normal', color: 'text-sky-500', bg: 'bg-sky-50', trend: 'steady' },
  { id: 'resp', icon: Wind, label: 'Resp Rate', value: 16, unit: '/min', status: 'normal', color: 'text-teal-500', bg: 'bg-teal-50', trend: 'steady' },
  { id: 'hrv', icon: Zap, label: 'HRV', value: 45, unit: 'ms', status: 'low', color: 'text-amber-500', bg: 'bg-amber-50', trend: 'down' },
  { id: 'temp', icon: Thermometer, label: 'Temperature', value: 98.6, unit: '°F', status: 'normal', color: 'text-orange-500', bg: 'bg-orange-50', trend: 'steady' },
];

let simInterval: any = null;

export const useVitalsStore = create<VitalsStore>((set, get) => ({
  vitals: INITIAL_VITALS,
  isSimulating: false,
  
  startSimulation: () => {
    if (get().isSimulating) return;
    set({ isSimulating: true });
    
    simInterval = setInterval(() => {
      set(state => ({
        vitals: state.vitals.map(v => {
          let trend: 'steady'|'up'|'down' = 'steady';
          let newStatus = v.status;
          
          if (v.id === 'hr') {
            const change = Math.floor(Math.random() * 5) - 2;
            const next = Math.max(60, Math.min(125, (v.value||0) + change));
            trend = next > (v.value||0) ? 'up' : next < (v.value||0) ? 'down' : 'steady';
            newStatus = next > 100 ? 'high' : next < 60 ? 'low' : 'normal';
            return { ...v, value: next, trend, status: newStatus };
          }
          if (v.id === 'bp' && Math.random() > 0.7) {
            const sysChange = Math.floor(Math.random() * 3) - 1;
            const diaChange = Math.floor(Math.random() * 3) - 1;
            const nextSys = Math.max(90, Math.min(160, (v.sys||0) + sysChange));
            const nextDia = Math.max(60, Math.min(100, (v.dia||0) + diaChange));
            trend = nextSys > (v.sys||0) ? 'up' : nextSys < (v.sys||0) ? 'down' : 'steady';
            newStatus = nextSys > 140 || nextDia > 90 ? 'high' : nextSys < 90 || nextDia < 60 ? 'low' : 'optimal';
            return { ...v, sys: nextSys, dia: nextDia, trend, status: newStatus };
          }
          if (v.id === 'spo2' && Math.random() > 0.8) {
            const next = Math.max(88, Math.min(100, (v.value||0) + (Math.random() > 0.5 ? 1 : -1)));
            trend = next > (v.value||0) ? 'up' : next < (v.value||0) ? 'down' : 'steady';
            newStatus = next < 92 ? 'critical' : next < 95 ? 'low' : 'normal';
            return { ...v, value: next, trend, status: newStatus };
          }
          if (v.id === 'resp' && Math.random() > 0.8) {
            const next = Math.max(12, Math.min(28, (v.value||0) + (Math.random() > 0.5 ? 1 : -1)));
            trend = next > (v.value||0) ? 'up' : next < (v.value||0) ? 'down' : 'steady';
            newStatus = next > 20 ? 'high' : next < 12 ? 'low' : 'normal';
            return { ...v, value: next, trend, status: newStatus };
          }
          if (v.id === 'hrv') {
             const change = Math.floor(Math.random() * 3) - 1;
             const next = Math.max(20, Math.min(80, (v.value||0) + change));
             trend = next > (v.value||0) ? 'up' : next < (v.value||0) ? 'down' : 'steady';
             newStatus = next < 30 ? 'critical' : next < 50 ? 'low' : 'normal';
             return { ...v, value: next, trend, status: newStatus };
          }
          if (v.id === 'temp' && Math.random() > 0.9) {
             const change = (Math.random() * 0.2 - 0.1);
             const next = Math.max(97.0, Math.min(102.5, (v.value||0) + change));
             trend = next > (v.value||0) ? 'up' : next < (v.value||0) ? 'down' : 'steady';
             newStatus = next > 100.4 ? 'high' : next < 97 ? 'low' : 'normal';
             return { ...v, value: Number(next.toFixed(1)), trend, status: newStatus };
          }
          return v;
        })
      }));
    }, 2500);
  },
  
  stopSimulation: () => {
    if (simInterval) clearInterval(simInterval);
    set({ isSimulating: false });
  }
}));
