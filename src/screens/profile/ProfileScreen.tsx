import { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  Heart, 
  Phone, 
  Pencil, 
  ShieldCheck,
  Activity,
  Droplets,
  Scale,
  X,
  FileText,
  LogOut,
  Stethoscope,
  Pill,
  Trash2,
  PlusCircle,
  Sparkles
} from 'lucide-react';
import { dbOperations } from '../../lib/db';
import { useMedicationStore } from '../../store/medicationStore';
import { useCycleState } from '../../hooks/useCycleState';
import { generateCycleInsights } from '../../lib/gemini';
import type { UserProfile } from '../../types/user';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile | null>(null);
  const { medications, fetchMedications } = useMedicationStore();
  const cycle = useCycleState();

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');

  const fetchAiInsight = async (isCustomQuestion: boolean = false) => {
    if (!profile) return;
    setLoadingInsight(true);
    const insight = await generateCycleInsights(
      profile, 
      cycle.currentPhase, 
      cycle.daysIntoCycle,
      isCustomQuestion && aiQuestion.trim() ? aiQuestion : undefined
    );
    setAiInsight(insight);
    setLoadingInsight(false);
    if (isCustomQuestion) setAiQuestion('');
  };

  const loadData = async () => {
    const [p] = await Promise.all([
      dbOperations.getUserProfile(),
    ]);
    setProfile(p || null);
    setEditForm(p || null);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    fetchMedications();
  }, []);

  const handleSave = async () => {
    if (!editForm) return;
    await dbOperations.saveUserProfile({
      ...editForm,
      updatedAt: Date.now()
    });
    setProfile(editForm);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    if (!profile) return;
    const confirm = window.confirm("Are you sure you want to log out? This will clear your local profile data.");
    if (confirm) {
      await dbOperations.deleteUserProfile(profile.uid);
      window.location.href = '/';
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!profile) return null;

  const calculateAge = (dob: string) => {
    return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  };

  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : 'N/A';

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] pb-32">
      {/* Professional Header */}
      <header style={{ background: 'var(--teal-500)' }} className="px-6 pt-12 pb-20 rounded-b-[40px] shadow-lg shadow-teal-900/10 h-fit relative">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-3xl font-black border border-white/30">
                {profile.name[0]}
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-black leading-tight">{profile.name}</h1>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Health Resume</p>
              </div>
           </div>
           {!isEditing && (
             <div className="flex gap-2">
                 <button 
                   onClick={() => setIsEditing(true)}
                   className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
                 >
                   <Pencil size={18} />
                 </button>
             </div>
           )}
        </div>

        {/* Vital Cards */}
        <div className="grid grid-cols-3 gap-3">
           <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[28px] p-4 text-center">
              <Droplets className="text-white/50 mx-auto mb-1" size={16} />
              <p className="text-white text-lg font-black">{profile.bloodType}</p>
              <p className="text-white/50 text-[8px] font-bold uppercase tracking-tighter">Blood Type</p>
           </div>
           <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[28px] p-4 text-center">
              <Scale className="text-white/50 mx-auto mb-1" size={16} />
              <p className="text-white text-lg font-black">{profile.weightKg || '—'} <span className="text-[10px]">kg</span></p>
              <p className="text-white/50 text-[8px] font-bold uppercase tracking-tighter">Weight</p>
           </div>
           <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[28px] p-4 text-center">
              <Activity className="text-white/50 mx-auto mb-1" size={16} />
              <p className="text-white text-lg font-black">{age} <span className="text-[10px]">yrs</span></p>
              <p className="text-white/50 text-[8px] font-bold uppercase tracking-tighter">Age</p>
           </div>
        </div>
      </header>

      <main className="px-6 -mt-8 space-y-6">
        
        {!isEditing && (
          <a 
            href="/health_resume.pdf" target="_blank" rel="noreferrer"
            className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-xl mx-2 -mt-4 relative z-10 active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-white font-black">Official Health Resume</h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">PDF Document • 500KB</p>
              </div>
            </div>
          </a>
        )}

        {isEditing && editForm ? (
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 space-y-6">
             <div className="flex items-center justify-between mb-2 border-b pb-4">
                <h2 className="text-gray-900 font-black text-lg">Edit Profile</h2>
                <button onClick={() => setIsEditing(false)} className="text-gray-400 bg-gray-100 p-2 rounded-full"><X size={20} /></button>
             </div>

             <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 block">Full Name</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-500 font-bold text-gray-800 placeholder-gray-300" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 block">Weight (kg)</label>
                    <input type="number" value={editForm.weightKg} onChange={e => setEditForm({...editForm, weightKg: Number(e.target.value)})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-500 font-bold text-gray-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 block">Height (cm)</label>
                    <input type="number" value={editForm.heightCm} onChange={e => setEditForm({...editForm, heightCm: Number(e.target.value)})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-500 font-bold text-gray-800" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 block">Date of Birth</label>
                    <input type="date" value={editForm.dateOfBirth} onChange={e => setEditForm({...editForm, dateOfBirth: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-500 font-bold text-gray-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 block">Blood Type</label>
                    <select value={editForm.bloodType} onChange={e => setEditForm({...editForm, bloodType: e.target.value as any})} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-500 font-bold text-gray-800 outline-none">
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Tag Editors for Allergies & Conditions */}
                {['allergies', 'chronicConditions'].map((field) => (
                  <div key={field}>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 block">
                      {field === 'allergies' ? 'Allergies' : 'Chronic Conditions'}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(editForm[field as keyof UserProfile] as string[]).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-100 font-bold text-xs capitalize">
                          {item}
                          <button onClick={() => {
                            const arr = [...(editForm[field as keyof UserProfile] as string[])];
                            arr.splice(idx, 1);
                            setEditForm({...editForm, [field]: arr});
                          }}>
                            <X size={14} className="text-teal-400 hover:text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         placeholder={`Add ${field === 'allergies' ? 'allergy' : 'condition'}...`}
                         onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                             const val = e.currentTarget.value.trim();
                             if (val) {
                               const arr = [...(editForm[field as keyof UserProfile] as string[])];
                               if (!arr.includes(val)) {
                                 setEditForm({...editForm, [field]: [...arr, val]});
                                 e.currentTarget.value = '';
                               }
                             }
                           }
                         }}
                         className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-500 text-sm font-medium" 
                       />
                       <button className="p-3 bg-gray-100 rounded-2xl text-gray-400"><PlusCircle size={20} /></button>
                    </div>
                  </div>
                ))}

                {/* Emergency Contacts Editor */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-3 ml-1 block">Emergency Network</label>
                  <div className="space-y-3">
                    {editForm.emergencyContacts.map((contact, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 relative">
                        <button 
                          onClick={() => {
                            const arr = [...editForm.emergencyContacts];
                            arr.splice(idx, 1);
                            setEditForm({...editForm, emergencyContacts: arr});
                          }}
                          className="absolute top-4 right-4 text-gray-300 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                        <input 
                          type="text" 
                          value={contact.name} 
                          placeholder="Contact Name"
                          onChange={e => {
                            const arr = [...editForm.emergencyContacts];
                            arr[idx] = {...arr[idx], name: e.target.value};
                            setEditForm({...editForm, emergencyContacts: arr});
                          }}
                          className="w-full bg-white px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold" 
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            value={contact.relation} 
                            placeholder="Relation"
                            onChange={e => {
                              const arr = [...editForm.emergencyContacts];
                              arr[idx] = {...arr[idx], relation: e.target.value};
                              setEditForm({...editForm, emergencyContacts: arr});
                            }}
                            className="bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium" 
                          />
                          <input 
                            type="tel" 
                            value={contact.phone} 
                            placeholder="Phone Number"
                            onChange={e => {
                              const arr = [...editForm.emergencyContacts];
                              arr[idx] = {...arr[idx], phone: e.target.value};
                              setEditForm({...editForm, emergencyContacts: arr});
                            }}
                            className="bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium" 
                          />
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => setEditForm({
                        ...editForm, 
                        emergencyContacts: [...editForm.emergencyContacts, { name: '', relation: '', phone: '', isPrimary: false }]
                      })}
                      className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                    >
                      <PlusCircle size={16} /> Add New Contact
                    </button>
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 block">Surgeries & History</label>
                   <textarea 
                     value={editForm.pastSurgeries?.join(', ') || ''} 
                     onChange={e => setEditForm({...editForm, pastSurgeries: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                     className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-500 font-medium text-gray-800 text-sm min-h-[100px]"
                     placeholder="List past surgeries, separated by commas..."
                   />
                </div>
             </div>

             <button onClick={handleSave} className="w-full mt-4 py-4 bg-teal-500 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all">
               SAVE CHANGES
             </button>
          </div>
        ) : (
          <>
            {/* Medical Context Blocks */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white rounded-[32px] p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                      <AlertTriangle size={16} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Allergies</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.allergies.length > 0 ? profile.allergies.map(a => (
                      <span key={a} className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-full">{a}</span>
                    )) : <span className="text-[10px] text-gray-300">None reported</span>}
                  </div>
               </div>
               
               <div className="bg-white rounded-[32px] p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                      <Heart size={16} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chronic</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.chronicConditions.length > 0 ? profile.chronicConditions.map(c => (
                      <span key={c} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full">{c}</span>
                    )) : <span className="text-[10px] text-gray-300">None</span>}
                  </div>
               </div>
               
               <div className="col-span-2 bg-white rounded-[32px] p-5 shadow-sm border border-gray-100 flex items-start gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                    <Stethoscope size={20} />
                 </div>
                 <div>
                   <h4 className="font-bold text-gray-900 text-sm mb-1">Surgeries & History</h4>
                   <p className="text-xs text-gray-500">
                     {profile.pastSurgeries?.length ? profile.pastSurgeries.join(', ') : 'No history declared.'}
                   </p>
                 </div>
               </div>
            </div>

            {/* Meds & Symptoms */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
               <div className="flex items-center gap-2 mb-4">
                 <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                   <Pill size={16} />
                 </div>
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Medication Stack</span>
               </div>
                <div className="space-y-3">
                  {medications.filter(m => m.status === 'active').map((m) => (
                     <div key={m.id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{m.brandName}</p>
                          <p className="text-xs text-gray-500">{m.dosage || 'No dosage'} • {m.schedule.length}x daily</p>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">Active</span>
                     </div>
                  ))}
                  
                  {/* Fallback to profile meds if no scanned meds exist */}
                  {medications.filter(m => m.status === 'active').length === 0 && profile.currentMedications?.map((m, i) => (
                     <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{m.name}</p>
                          <p className="text-xs text-gray-500">{m.dosage} • {m.frequency}</p>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">Active</span>
                     </div>
                  ))}
                  
                  {!medications.some(m => m.status === 'active') && !profile.currentMedications?.length && (
                    <p className="text-xs text-gray-400">No active medications.</p>
                  )}
                </div>
            </div>

            {/* Cycle Health Block */}
            {profile.menstrualCycle?.isTracking && (
              <div className="bg-rose-50 border border-rose-100 rounded-[32px] p-6 shadow-sm mb-4">
                 <div className="flex items-center gap-2 mb-4">
                   <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center">
                     <Activity size={16} />
                   </div>
                   <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Hormonal & Cycle Health</span>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white/60 p-4 rounded-2xl">
                      <div>
                        <h4 className="font-bold text-rose-900 capitalize text-sm">{cycle.currentPhase} Phase</h4>
                        <p className="text-xs text-rose-700 font-medium">Day {cycle.daysIntoCycle} of ~{cycle.expectedCycleLength}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${cycle.currentPhase === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-rose-200 text-rose-800'}`}>
                        {cycle.currentPhase === 'late' ? 'Delayed' : 'Tracking'}
                      </span>
                    </div>

                    {cycle.currentPhase === 'late' && (
                      <div className="p-4 bg-white border border-amber-200 rounded-2xl">
                         <p className="text-xs font-bold text-amber-900 mb-1">Irregular Cycle Detected</p>
                         <p className="text-[10px] text-amber-700 mb-3 font-medium leading-relaxed">
                           Your baseline biometric data and dates indicate your cycle is delayed. Consider scheduling a teleconsultation.
                         </p>
                         <a href="tel:+18001234567" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-transform">
                            <Phone size={14} /> Talk to Gynecologist
                         </a>
                      </div>
                    )}

                    {/* AI Insights Engine */}
                    <div className="pt-4 border-t border-rose-200/50">
                      {!aiInsight && !loadingInsight ? (
                         <div className="space-y-3">
                           <button onClick={() => fetchAiInsight(false)} className="w-full py-3 bg-gradient-to-r from-rose-500 to-purple-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                              <Sparkles size={16} /> Generate AI Cycle Insights
                           </button>
                           <div className="flex bg-white border border-rose-200 rounded-xl overflow-hidden focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
                              <input 
                                type="text" 
                                value={aiQuestion} 
                                onChange={e => setAiQuestion(e.target.value)}
                                placeholder="Or ask Sanjivani AI a tailored question..." 
                                className="px-3 py-2 text-xs w-full focus:outline-none text-gray-700 bg-transparent placeholder-gray-400"
                                onKeyDown={e => e.key === 'Enter' && aiQuestion.trim() && fetchAiInsight(true)}
                              />
                              <button 
                                onClick={() => fetchAiInsight(true)}
                                disabled={loadingInsight || !aiQuestion.trim()}
                                className="px-4 bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-wider hover:bg-rose-100 disabled:opacity-50 transition-colors"
                              >
                                Ask
                              </button>
                           </div>
                         </div>
                      ) : loadingInsight ? (
                         <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-rose-500"></div>
                            <span className="ml-3 text-xs font-bold text-rose-500 animate-pulse">Sanjivani AI is analyzing...</span>
                         </div>
                      ) : (
                         <div className="bg-white/80 p-5 rounded-2xl border border-rose-100 shadow-sm relative">
                           <button onClick={() => setAiInsight(null)} className="absolute top-3 right-3 text-gray-400 bg-gray-50 p-1 rounded-full hover:bg-gray-100 transition-colors">
                             <X size={14} />
                           </button>
                           <h4 className="font-black text-xs text-rose-900 mb-3 flex items-center gap-2"><Sparkles size={14} className="text-purple-500" /> SANJIVANI AI INTELLIGENCE</h4>
                           <div className="space-y-4">
                             {aiInsight?.split(/\n\n+/).map((para, idx) => (
                               <p key={idx} className="text-[10px] text-gray-700 leading-relaxed font-medium">
                                 {para.split('\n').map((line, i) => (
                                   <span key={i}>
                                     {line.includes(':') && line.match(/^[A-Z0-9\s\.\/]+:/) ? (
                                        <><strong className="text-rose-800 font-bold block mb-0.5 mt-1">{line.split(':')[0]}:</strong>{line.substring(line.indexOf(':')+1)}</>
                                     ) : line}
                                     {i < para.split('\n').length - 1 && <br />}
                                   </span>
                                 ))}
                               </p>
                             ))}
                           </div>
                         </div>
                      )}
                    </div>

                 </div>
              </div>
            )}

            {/* Emergency Network Section */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
               <div className="flex items-center gap-2 mb-4">
                 <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                   <Phone size={16} />
                 </div>
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Emergency Network</span>
               </div>
               <div className="space-y-4">
                  {profile.emergencyContacts.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 border border-gray-100 shadow-sm font-black">
                          {c.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{c.name}</p>
                          <p className="text-[10px] text-gray-500 font-medium">{c.relation}</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await fetch('https://hook.eu2.make.com/2b9qvf5zvmu99zss88yemjgl11irj4nw', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                event: 'emergency_call_initiated',
                                timestamp: new Date().toISOString(),
                                caller: { name: profile.name, bloodType: profile.bloodType },
                                contact: { name: c.name, relation: c.relation, phone: c.phone },
                              }),
                            });
                          } catch (err) {
                            console.error('Webhook failed:', err);
                          }
                          window.location.href = `tel:${c.phone}`;
                        }}
                        className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                      >
                        <Phone size={16} />
                      </button>
                    </div>
                  ))}

                  {(profile.primaryDoctor || profile.preferredHospital) && (
                    <div className="border-t border-gray-100 pt-4 mt-2">
                       {profile.primaryDoctor && <p className="text-xs"><span className="text-gray-400 font-bold uppercase">Doctor:</span> <span className="font-bold text-gray-800">{profile.primaryDoctor}</span></p>}
                       {profile.preferredHospital && <p className="text-xs mt-1"><span className="text-gray-400 font-bold uppercase">Hospital:</span> <span className="font-bold text-gray-800">{profile.preferredHospital}</span></p>}
                    </div>
                  )}
               </div>
            </div>

            {/* Health Security Badge */}
            <div className="bg-teal-50 border border-teal-100 rounded-[32px] p-5 flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-teal-600 shadow-sm shrink-0">
                  <ShieldCheck size={28} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-teal-900 uppercase tracking-widest">Medical ID Active</p>
                  <p className="text-[10px] text-teal-700/70 leading-relaxed font-medium">
                    Your health data is stored locally and protected for emergency responder access.
                  </p>
               </div>
            </div>

            {/* Logout */}
            <button 
               onClick={handleLogout}
               className="w-full flex items-center justify-center gap-2 py-4 rounded-[28px] border-2 border-red-100 bg-red-50 text-red-600 font-black text-sm active:scale-95 transition-transform mt-4"
            >
               <LogOut size={18} /> Logout & Wipe Profile
            </button>
          </>
        )}
      </main>
    </div>
  );
}
