import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  Bell,
  Activity,
  Calendar,
} from 'lucide-react';
import { useMedicationStore } from '../../store/medicationStore';
import { useVitalsStore } from '../../store/vitalsStore';
import { dbOperations } from '../../lib/db';
import type { UserProfile } from '../../types/user';

const getDays = () => {
  const days = [];
  for (let i = -3; i < 4; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
};

const isPastTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  if (now.getHours() > hours) return true;
  if (now.getHours() === hours && now.getMinutes() > minutes) return true;
  return false;
};

function getTimeLabel(timeStr: string) {
  const [hours] = timeStr.split(':').map(Number);
  if (hours < 12) return 'Morning dose';
  if (hours < 17) return 'Afternoon dose';
  if (hours < 20) return 'Evening dose';
  return 'Night dose';
}

export default function HomeScreen() {
  const { medications, adherence, fetchMedications, fetchAdherence, markAsTaken } = useMedicationStore();
  const { vitals, startSimulation, stopSimulation } = useVitalsStore();
  const [user, setUser] = useState<UserProfile | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const days = useMemo(() => getDays(), []);

  useEffect(() => {
    fetchMedications();
    dbOperations.getUserProfile().then(p => setUser(p || null));
    startSimulation();
    return () => { stopSimulation(); };
  }, [fetchMedications, startSimulation, stopSimulation]);

  useEffect(() => {
    fetchAdherence(selectedDate);
  }, [fetchAdherence, selectedDate]);

  const doses = useMemo(() => {
    const list: any[] = [];
    medications.forEach(med => {
      if (med.status !== 'active') return;
      med.schedule.forEach(sched => {
        const id = `${med.id}:${selectedDate}:${sched.time}`;
        const isTaken = adherence[id] === 'taken';
        const isMissed = !isTaken && selectedDate === todayStr && isPastTime(sched.time);
        const pastDayMissed = !isTaken && selectedDate < todayStr;
        list.push({
          ...sched,
          medication: med,
          id,
          status: isTaken ? 'taken' : (isMissed || pastDayMissed) ? 'missed' : 'pending',
        });
      });
    });
    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [medications, adherence, selectedDate, todayStr]);

  const takenCount = doses.filter(d => d.status === 'taken').length;
  const totalCount = doses.length;
  const compliancePercentage = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;
  
  const missedDoses = doses.filter(d => d.status === 'missed');
  
  // Find anomalous vitals to highlight (e.g., HRV)
  const anomalousVitals = vitals.filter(v => v.status === 'high' || v.status === 'low' || v.status === 'critical');
  const hrvAnomaly = anomalousVitals.find(v => v.id === 'hrv');
  const primaryAnomaly = hrvAnomaly || anomalousVitals[0];

  const hasMissed = missedDoses.length > 0;
  const hasAnomaly = !!primaryAnomaly;

  return (
    <div className="flex flex-col min-h-screen bg-white pb-32">

      {/* ─── TOP BAR ─── */}
      <header className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-[42px] h-[42px] rounded-full bg-teal-500 flex items-center justify-center text-white font-medium text-[16px] select-none">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-[14px] text-gray-500 mb-0.5">Good {getGreeting()},</p>
              <h1 className="text-[18px] font-medium text-gray-900 leading-tight">{user?.name?.split(' ')[0] || 'Friend'}</h1>
            </div>
          </div>
          <button className="relative p-2 text-gray-600 active:scale-90 transition-transform">
            <Bell size={24} />
            {(hasMissed || hasAnomaly) && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
            )}
          </button>
        </div>
      </header>

      <main className="px-5 pt-2 space-y-6">

        {/* ─── BEHAVIORAL ALERT (Missed Doses) ─── */}
        {hasMissed && (
          <div className="bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 border-l-[4px] border-l-red-500 p-4">
            <div className="flex items-start gap-3 mb-3">
               <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
               <div className="flex-1">
                 <h2 className="text-[16px] font-medium text-red-600 mb-2">
                   {missedDoses.length} {missedDoses.length === 1 ? 'dose' : 'doses'} missed today
                 </h2>
                 <div className="flex flex-wrap gap-2 mb-4">
                   {missedDoses.map(md => (
                     <span key={md.id} className="bg-red-50 text-red-700 px-2.5 py-1 rounded-[8px] text-[12px] font-medium border border-red-100">
                       {md.medication.brandName} · {md.time}
                     </span>
                   ))}
                 </div>
                 <div className="flex gap-2">
                   <button 
                     onClick={() => missedDoses.forEach(md => markAsTaken(md.medication.id, selectedDate, md.time))}
                     className="bg-red-500 text-white px-4 py-1.5 rounded-[8px] text-[13px] font-medium active:scale-95 transition-transform"
                   >
                     Log now
                   </button>
                   <button className="bg-white text-red-600 border border-red-200 px-4 py-1.5 rounded-[8px] text-[13px] font-medium active:scale-95 transition-transform">
                     Reschedule
                   </button>
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* ─── BIOMETRIC ALERT (Vitals Anomaly) ─── */}
        {hasAnomaly && (
          <div className="bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 border-l-[4px] border-l-amber-500 p-4 flex items-start gap-3">
             <Activity size={20} className="text-amber-500 shrink-0 mt-0.5" />
             <div className="flex-1">
               <h2 className="text-[15px] font-medium text-amber-600 mb-0.5">
                 {primaryAnomaly.id === 'hrv' ? 'HRV below optimal' : `${primaryAnomaly.label} ${primaryAnomaly.status}`}
               </h2>
               <p className="text-[13px] text-gray-500 mb-2">
                 {primaryAnomaly.value}{primaryAnomaly.unit} · {primaryAnomaly.id === 'hrv' ? 'Typical range 40–70ms' : 'Review your active vitals.'}
               </p>
               <Link to="/vitals" className="text-[13px] font-medium text-amber-600 active:opacity-70 transition-opacity">
                 View Vitals
               </Link>
             </div>
          </div>
        )}

        {/* ─── DATE NAVIGATOR ─── */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
             <div className="flex items-center gap-1.5 text-gray-500">
               <Calendar size={14} />
               <span className="text-[13px] font-medium">Schedule</span>
             </div>
             <span className="text-[12px] font-medium text-gray-500">{compliancePercentage}% this week</span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 snap-x">
            {days.map((date, idx) => {
              const dateStr = date.toISOString().split('T')[0];
              const isActive = selectedDate === dateStr;
              const isToday = todayStr === dateStr;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`snap-center flex flex-col items-center justify-center min-w-[56px] h-[64px] rounded-[16px] transition-all relative ${
                    isActive
                      ? 'bg-red-50 border border-red-100'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <span className={`text-[11px] font-medium mb-1 ${isActive ? 'text-red-500' : 'text-gray-400'}`}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  
                  {isToday ? (
                     <div className="w-[24px] h-[24px] bg-red-500 rounded-full flex items-center justify-center text-white text-[13px] font-medium shadow-sm shadow-red-500/30">
                       {date.getDate()}
                     </div>
                  ) : (
                     <span className={`text-[15px] font-medium ${isActive ? 'text-red-600' : 'text-gray-900'}`}>
                       {date.getDate()}
                     </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── REGIMEN LOG ─── */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-[17px] font-medium text-gray-900">Today's Log</h3>
            <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
              {compliancePercentage}% compliance
            </span>
          </div>

          {doses.length === 0 ? (
            <div className="bg-white rounded-[16px] border border-gray-200 p-8 text-center flex flex-col items-center">
              <div className="w-[48px] h-[48px] rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <CheckCircle2 size={24} className="text-gray-300" />
              </div>
              <p className="text-[15px] font-medium text-gray-900 mb-1">Schedule Clear</p>
              <p className="text-[13px] text-gray-500">No medications logged for this date.</p>
            </div>
          ) : (
            <div className="border-l-[1.5px] border-gray-100 ml-4 pl-5 space-y-6">
              {doses.map((dose, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline Node */}
                  <div className={`absolute -left-[27px] top-[2px] w-[12px] h-[12px] rounded-full border-2 border-white ${
                    dose.status === 'taken' ? 'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]' :
                    dose.status === 'missed' ? 'bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]' :
                    'bg-gray-200 shadow-[0_0_0_2px_rgba(229,231,235,0.5)]'
                  }`} />
                  
                  <div className="flex flex-col">
                    <p className="text-[13px] font-medium text-gray-500 mb-1 flex items-center gap-2">
                       {getTimeLabel(dose.time)}
                       {dose.status === 'taken' && (
                         <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-[4px] border border-emerald-100">
                           <CheckCircle2 size={10} /> Verified
                         </span>
                       )}
                    </p>
                    <div className={`bg-white rounded-[16px] border p-4 flex items-center justify-between ${
                      dose.status === 'taken' ? 'border-gray-200' :
                      dose.status === 'missed' ? 'border-red-200 bg-red-50/30' :
                      'border-gray-200'
                    }`}>
                      <div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <p className={`text-[15px] font-semibold ${dose.status === 'missed' ? 'text-red-900' : 'text-gray-900'}`}>{dose.time}</p>
                          <p className="text-[15px] font-medium text-gray-900">{dose.medication.brandName}</p>
                        </div>
                        <p className="text-[13px] text-gray-500">
                           {dose.quantity} {dose.unit} · {dose.withFood ? 'With food' : 'Empty stomach'}
                        </p>
                      </div>
                      
                      {dose.status !== 'taken' && selectedDate <= todayStr && (
                        <button
                          onClick={() => markAsTaken(dose.medication.id, selectedDate, dose.time)}
                          className={`w-[32px] h-[32px] rounded-full flex items-center justify-center active:scale-90 transition-transform ${
                             dose.status === 'missed' ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
