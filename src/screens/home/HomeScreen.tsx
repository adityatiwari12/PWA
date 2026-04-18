import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, Clock, ShieldAlert, AlertTriangle, 
  ShieldCheck, CalendarDays, Zap, Activity, Pill, ChevronRight
} from 'lucide-react';
import { useMedicationStore } from '../../store/medicationStore';
import { useVitalsStore } from '../../store/vitalsStore';
import { dbOperations } from '../../lib/db';
import type { UserProfile } from '../../types/user';
import { useDiagnosticState } from '../../hooks/useDiagnosticState';

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
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  if (currentHours > hours) return true;
  if (currentHours === hours && currentMinutes > minutes) return true;
  return false;
};

export default function HomeScreen() {
  const { medications, adherence, fetchMedications, fetchAdherence, markAsTaken } = useMedicationStore();
  const { startSimulation, stopSimulation } = useVitalsStore();
  const diagnostic = useDiagnosticState();
  const [user, setUser] = useState<UserProfile | null>(null);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const days = useMemo(() => getDays(), []);

  useEffect(() => {
    fetchMedications();
    dbOperations.getUserProfile().then(p => setUser(p || null));
    startSimulation();
    return () => { stopSimulation(); }
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
          ...sched, medication: med, id,
          status: isTaken ? 'taken' : (isMissed || pastDayMissed) ? 'missed' : 'pending'
        });
      });
    });
    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [medications, adherence, selectedDate, todayStr]);

  const takenCount = doses.filter(d => d.status === 'taken').length;
  const totalCount = doses.length;
  const headerState = diagnostic.level;

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 pb-32 ${
      headerState === 'critical' ? 'bg-[#fff5f5]' :
      headerState === 'warning' ? 'bg-[#fffbeb]' :
      'bg-[#f8fafc]'
    }`}>
      
      {/* 1. Global State Header (HUD Level Insight) */}
      <header className="px-6 pt-12 pb-8 relative overflow-hidden z-10 transition-all duration-700 shadow-2xl" 
        style={{
          background: headerState === 'critical' ? 'linear-gradient(135deg, #e11d48, #be123c)' : 
                      headerState === 'warning' ? 'linear-gradient(135deg, #d97706, #b45309)' : 
                      'linear-gradient(135deg, #0d9488, #0f766e)'
        }}
      >
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           {headerState === 'critical' && <div className="absolute inset-0 bg-red-800 animate-pulse mix-blend-overlay opacity-50" />}
           <div className="absolute -right-12 -top-12 opacity-10 blur-[2px] mix-blend-overlay transform rotate-12 scale-150">
              {headerState === 'critical' ? <ShieldAlert size={240} /> :
               headerState === 'warning' ? <AlertTriangle size={240} /> :
               <ShieldCheck size={240} />}
           </div>
        </div>
        
        <div className="relative z-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 bg-black/10 backdrop-blur-md pl-2 pr-4 py-1.5 rounded-full border border-white/20">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm shadow-inner">
                {user?.name?.[0] || 'U'}
              </div>
              <span className="text-white/90 text-xs font-black uppercase tracking-widest leading-none">
                {user?.name || 'User'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {headerState === 'critical' && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-xl border flex items-center gap-1.5 shadow-2xl ${
                headerState === 'critical' ? 'bg-red-950/60 text-red-50 border-red-500/50' : 
                headerState === 'warning' ? 'bg-amber-950/60 text-amber-50 border-amber-500/50' : 
                'bg-black/20 text-teal-50 border-teal-400/30'
              }`}>
                {headerState === 'critical' ? 'CRITICAL SYSTEM ALERT' :
                 headerState === 'warning' ? 'ATTENTION REQUIRED' : 'SYSTEM OPTIMAL'}
              </span>
            </div>
          </div>
          
          <h1 className="text-white text-[32px] font-black leading-[1.1] mb-4 tracking-tight drop-shadow-md">
            {headerState === 'critical' ? (
               diagnostic.hasInteractionRisk ? 'Dangerous Interaction Detected' : 'Critical Vitals Active'
            ) :
             headerState === 'warning' ? (
               diagnostic.missedDoses > 0 ? `Missed ${diagnostic.missedDoses} ${diagnostic.missedDoses === 1 ? 'Dose' : 'Doses'} Logged` : 'Vitals Anomaly Detected'
            ) : 'All Systems Stable'}
          </h1>
          
          {diagnostic.reasons.length > 0 && (
            <div className="flex flex-col gap-2 mt-2 bg-black/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
               {diagnostic.reasons.slice(0, 2).map((reason, idx) => (
                  <p key={idx} className="text-white/95 text-xs font-bold flex items-start gap-2 leading-tight">
                    <span className="text-white/50 mt-[1px]">⚡</span> {reason}
                  </p>
               ))}
            </div>
          )}
        </div>
      </header>

      {/* 2. Actionable Priority Alert (System Context) */}
      {headerState !== 'safe' && (
        <div className="px-5 -mt-6 relative z-30 mb-8">
          <div className="bg-white rounded-[24px] p-5 flex gap-4 transition-all" style={{
            boxShadow: headerState === 'critical' ? '0 20px 40px -10px rgba(225, 29, 72, 0.4)' : '0 20px 40px -10px rgba(217, 119, 6, 0.3)',
            border: headerState === 'critical' ? '2px solid rgba(225, 29, 72, 0.2)' : '2px solid rgba(245, 158, 11, 0.2)'
          }}>
            <div className={`mt-1 shrink-0 ${headerState === 'critical' ? 'text-rose-600' : 'text-amber-500'}`}>
              <ShieldAlert size={28} className={headerState === 'critical' ? 'animate-pulse' : ''} />
            </div>
            <div className="flex-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                Required Protocol
              </h3>
              <p className="text-sm text-gray-900 leading-snug font-bold mb-4">
                {headerState === 'critical' 
                  ? 'Biometric array indicates an extreme health risk. Review interaction profile or seek immediate emergency care.'
                  : 'System health score dropping. Review missed medications or anomalous biometric telemetry immediately.'}
              </p>
              <div className="flex gap-2">
                  {diagnostic.hasInteractionRisk && (
                    <Link to="/interactions" className="bg-rose-500 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform flex-1 text-center shadow-lg shadow-rose-500/30">
                      View Risk Analysis
                    </Link>
                  )}
                  {diagnostic.vitalAnomalies.length > 0 && (
                    <Link to="/vitals" className="bg-gray-900 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform flex-1 text-center shadow-lg shadow-gray-900/30">
                      Open Vitals Matrix
                    </Link>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. System Date Navigator (Low priority visually) */}
      <main className={`flex-1 px-5 ${headerState === 'safe' ? 'pt-6' : 'pt-2'} space-y-8 relative z-10`}>
        <div className="flex items-center justify-between px-1 mb-2">
           <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
             <CalendarDays size={14} /> System Timeframe
           </h2>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 -mx-5 px-5 select-none">
          {days.map((date, idx) => {
             const dateStr = date.toISOString().split('T')[0];
             const isActive = selectedDate === dateStr;
             const isToday = todayStr === dateStr;
             
             return (
               <button
                 key={idx}
                 onClick={() => setSelectedDate(dateStr)}
                 className={`flex flex-col items-center justify-center min-w-[56px] py-3 rounded-[18px] border-2 transition-all ${
                   isActive 
                     ? 'bg-gray-900 border-gray-900 text-white shadow-xl shadow-gray-900/15 scale-105' 
                     : 'bg-white border-transparent text-gray-400 hover:border-gray-200'
                 }`}
               >
                 <span className={`text-[8px] uppercase font-black tracking-widest mb-1 ${isActive ? 'text-gray-400' : 'text-gray-400'}`}>
                   {isToday ? 'TODAY' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                 </span>
                 <span className={`text-sm font-black ${isActive ? 'text-white' : 'text-gray-900'}`}>
                   {date.getDate()}
                 </span>
               </button>
             );
          })}
        </div>

        {/* 4. Actionable Adherence Log (System Timeline) */}
        <div>
          <div className="flex items-center justify-between px-1 mb-6">
            <h2 className="text-gray-900 font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} /> Regimen Log
            </h2>
            {totalCount > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                <span className={takenCount === totalCount ? 'text-teal-600' : 'text-gray-500'}>
                  {Math.round((takenCount/totalCount)*100)}% Compliance
                </span>
              </div>
            )}
          </div>

          <div className="relative">
            {/* The rigid system timeline backbone */}
            <div className="absolute top-4 bottom-4 left-[34px] w-[3px] bg-gray-200/60 rounded-full z-0" />

            <div className="space-y-6 relative z-10">
              {doses.length === 0 ? (
                <div className="bg-white rounded-[24px] border border-gray-200 border-dashed p-8 ml-16 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <h3 className="font-black text-xs uppercase text-gray-900 tracking-widest">Awaiting Input</h3>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    No pharmacological interventions scheduled. The system is standing by for new prescription data or telemetry updates.
                  </p>
                  <Link to="/medications" className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-2 rounded-xl">
                    Input Data <ChevronRight size={12} />
                  </Link>
                </div>
              ) : (
                doses.map((dose, idx) => (
                  <div key={idx} className="flex gap-4">
                    {/* Time Node */}
                    <div className="w-[70px] shrink-0 flex flex-col items-center pt-3 focus:outline-none">
                      <div className={`w-[26px] h-[26px] rounded-full border-[4px] border-[#f8fafc] flex items-center justify-center z-10 transition-colors ${
                        dose.status === 'taken' ? 'bg-teal-500' : 
                        dose.status === 'missed' ? 'bg-amber-500 ring-4 ring-amber-500/20' : 
                        'bg-gray-300'
                      }`}>
                        {dose.status === 'taken' && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <span className={`text-[10px] font-black mt-2 tracking-widest ${
                        dose.status === 'missed' ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        {dose.time}
                      </span>
                    </div>

                    {/* Dose Card */}
                    <div className={`flex-1 bg-white rounded-[24px] p-5 shadow-sm transition-all border ${
                      dose.status === 'taken' ? 'border-teal-100 shadow-teal-900/5' : 
                      dose.status === 'missed' ? 'border-amber-200 shadow-amber-900/10' : 
                      'border-gray-100'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-black text-sm leading-tight ${dose.status === 'missed' ? 'text-amber-950' : 'text-gray-900'}`}>
                          {dose.medication.brandName}
                        </h4>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex items-center gap-1 ${
                          dose.status === 'taken' ? 'bg-teal-50 text-teal-700' :
                          dose.status === 'missed' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {dose.status === 'taken' ? 'VERIFIED' : dose.status === 'missed' ? 'MISSED' : 'PENDING'}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-gray-500`}>
                          {dose.quantity} {dose.unit}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-gray-500`}>
                          {dose.withFood ? 'WITH FOOD' : 'EMPTY STOMACH'}
                        </span>
                      </div>

                      {/* Log Action */}
                      {dose.status !== 'taken' && selectedDate <= todayStr && (
                        <button
                          onClick={() => markAsTaken(dose.medication.id, selectedDate, dose.time)}
                          className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 ${
                             dose.status === 'missed' 
                              ? 'bg-amber-500 text-white shadow-amber-500/20 active:scale-95' 
                              : 'bg-gray-900 text-white shadow-gray-900/20 active:scale-95 hover:bg-gray-800'
                          }`}
                        >
                          {dose.status === 'missed' ? 'Override: Log Late Intake' : 'Commit: Mark Taken'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
