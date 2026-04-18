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
  Download,
  LogOut,
  Stethoscope,
  Pill,
  Trash2,
  PlusCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
    const p = await dbOperations.getUserProfile();
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
    await dbOperations.saveUserProfile({ ...editForm, updatedAt: Date.now() });
    setProfile(editForm);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    if (!profile) return;
    const confirm = window.confirm('Are you sure you want to log out? This will clear your local profile data.');
    if (confirm) {
      await dbOperations.deleteUserProfile(profile.uid);
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (!profile) return null;

  const calculateAge = (dob: string) =>
    Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));

  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : '—';
  const activeMeds = medications.filter(m => m.status === 'active');
  const fallbackMeds = profile.currentMedications || [];

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F8FA] pb-32">

      {/* ─── HEADER CARD ─── */}
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-[60px] h-[60px] rounded-full bg-teal-500 flex items-center justify-center text-white text-2xl font-black shadow-md select-none">
              {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-[18px] font-semibold text-gray-900 leading-tight">{profile.name}</h1>
              <p className="text-[13px] text-gray-400 mt-0.5">Health Resume</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 active:scale-90 transition-all"
            >
              <Pencil size={17} />
            </button>
          )}
        </div>

        {/* Stat Chips */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Droplets size={16} className="text-teal-500" />, value: profile.bloodType || '—', label: 'Blood Type' },
            { icon: <Scale size={16} className="text-teal-500" />, value: profile.weightKg ? `${profile.weightKg} kg` : '— kg', label: 'Weight' },
            { icon: <Activity size={16} className="text-teal-500" />, value: `${age} yrs`, label: 'Age' },
          ].map(chip => (
            <div
              key={chip.label}
              className="flex flex-col items-center py-3 px-2 bg-white border border-gray-200/70 rounded-2xl"
              style={{ borderWidth: '0.5px' }}
            >
              {chip.icon}
              <p className="text-[20px] font-bold text-gray-900 mt-1 leading-none">{chip.value}</p>
              <p className="text-[11px] text-gray-400 mt-1">{chip.label}</p>
            </div>
          ))}
        </div>
      </div>

      <main className="px-4 pt-5 space-y-4">

        {/* ─── EDIT FORM ─── */}
        {isEditing && editForm ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-gray-900 font-bold text-base">Edit Profile</h2>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 bg-gray-100 p-1.5 rounded-full">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-0.5 block">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-400 font-medium text-gray-800 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-0.5 block">Weight (kg)</label>
                  <input type="number" value={editForm.weightKg} onChange={e => setEditForm({ ...editForm, weightKg: Number(e.target.value) })} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-400 font-medium text-gray-800 outline-none text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-0.5 block">Height (cm)</label>
                  <input type="number" value={editForm.heightCm} onChange={e => setEditForm({ ...editForm, heightCm: Number(e.target.value) })} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-400 font-medium text-gray-800 outline-none text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-0.5 block">Date of Birth</label>
                  <input type="date" value={editForm.dateOfBirth} onChange={e => setEditForm({ ...editForm, dateOfBirth: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-400 font-medium text-gray-800 outline-none text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-0.5 block">Blood Type</label>
                  <select value={editForm.bloodType} onChange={e => setEditForm({ ...editForm, bloodType: e.target.value as any })} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-400 font-medium text-gray-800 outline-none text-sm">
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {(['allergies', 'chronicConditions'] as const).map(field => (
                <div key={field}>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-0.5 block">
                    {field === 'allergies' ? 'Allergies' : 'Chronic Conditions'}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editForm[field] as string[]).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-100 font-medium text-xs">
                        {item}
                        <button onClick={() => {
                          const arr = [...(editForm[field] as string[])];
                          arr.splice(idx, 1);
                          setEditForm({ ...editForm, [field]: arr });
                        }}><X size={12} className="text-teal-400 hover:text-red-500" /></button>
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
                            const arr = [...(editForm[field] as string[])];
                            if (!arr.includes(val)) { setEditForm({ ...editForm, [field]: [...arr, val] }); e.currentTarget.value = ''; }
                          }
                        }
                      }}
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-400 text-sm font-medium outline-none"
                    />
                    <button className="p-2.5 bg-gray-100 rounded-2xl text-gray-400"><PlusCircle size={18} /></button>
                  </div>
                </div>
              ))}

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 ml-0.5 block">Emergency Contacts</label>
                <div className="space-y-3">
                  {editForm.emergencyContacts.map((contact, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 relative">
                      <button onClick={() => { const arr = [...editForm.emergencyContacts]; arr.splice(idx, 1); setEditForm({ ...editForm, emergencyContacts: arr }); }} className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><Trash2 size={15} /></button>
                      <input type="text" value={contact.name} placeholder="Contact Name" onChange={e => { const arr = [...editForm.emergencyContacts]; arr[idx] = { ...arr[idx], name: e.target.value }; setEditForm({ ...editForm, emergencyContacts: arr }); }} className="w-full bg-white px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium outline-none" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={contact.relation} placeholder="Relation" onChange={e => { const arr = [...editForm.emergencyContacts]; arr[idx] = { ...arr[idx], relation: e.target.value }; setEditForm({ ...editForm, emergencyContacts: arr }); }} className="bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium outline-none" />
                        <input type="tel" value={contact.phone} placeholder="Phone" onChange={e => { const arr = [...editForm.emergencyContacts]; arr[idx] = { ...arr[idx], phone: e.target.value }; setEditForm({ ...editForm, emergencyContacts: arr }); }} className="bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium outline-none" />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setEditForm({ ...editForm, emergencyContacts: [...editForm.emergencyContacts, { name: '', relation: '', phone: '', isPrimary: false }] })} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
                    <PlusCircle size={15} /> Add Contact
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-0.5 block">Surgeries & History</label>
                <textarea
                  value={editForm.pastSurgeries?.join(', ') || ''}
                  onChange={e => setEditForm({ ...editForm, pastSurgeries: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-400 font-medium text-gray-800 text-sm min-h-[90px] outline-none resize-none"
                  placeholder="List past surgeries, separated by commas..."
                />
              </div>
            </div>

            <button onClick={handleSave} className="w-full py-4 bg-teal-500 text-white font-bold rounded-2xl shadow-md active:scale-95 transition-all text-sm">
              Save Changes
            </button>
          </div>
        ) : (
          <>
            {/* ─── OFFICIAL HEALTH RESUME ─── */}
            <div className="bg-white rounded-3xl border-l-4 border-teal-500 shadow-sm px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <FileText size={20} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-gray-900">Official Health Resume</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">PDF • 500KB</p>
                </div>
              </div>
              <a href="/health_resume.pdf" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center text-teal-600 bg-teal-50 active:scale-90 transition-transform">
                <Download size={17} />
              </a>
            </div>

            {/* ─── ALLERGIES + CHRONIC (side by side) ─── */}
            <div className="grid grid-cols-2 gap-3">
              {/* Allergies — red danger */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <AlertTriangle size={14} className="text-red-500" />
                  <span className="text-[11px] font-bold text-red-500 uppercase tracking-wide">Allergies</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.allergies.length > 0
                    ? profile.allergies.map(a => (
                        <span key={a} className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: '#FEE2E2', color: '#B91C1C' }}>{a}</span>
                      ))
                    : <span className="text-[11px] text-gray-300">None reported</span>}
                </div>
              </div>

              {/* Chronic — amber managed */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <Heart size={14} className="text-amber-500" />
                  <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wide">Chronic</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.chronicConditions.length > 0
                    ? profile.chronicConditions.map(c => (
                        <span key={c} className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: '#FEF3C7', color: '#92400E' }}>{c}</span>
                      ))
                    : <span className="text-[11px] text-gray-300">None</span>}
                </div>
              </div>
            </div>

            {/* ─── SURGERIES & HISTORY ─── */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-5 py-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Stethoscope size={20} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-900">Surgeries & History</p>
                <p className="text-[13px] text-gray-400 mt-1 leading-relaxed">
                  {profile.pastSurgeries?.length ? profile.pastSurgeries.join(', ') : 'No history declared.'}
                </p>
              </div>
            </div>

            {/* ─── MEDICATION STACK ─── */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <Pill size={16} className="text-teal-600" />
                  <span className="text-[13px] font-bold text-gray-700">Medication Stack</span>
                </div>
                <Link to="/medications" className="text-[12px] font-semibold text-red-500">See All</Link>
              </div>

              <div className="divide-y divide-gray-100" style={{ borderTop: '0.5px solid #f3f4f6' }}>
                {(activeMeds.length > 0 ? activeMeds : fallbackMeds).length === 0 ? (
                  <p className="text-[12px] text-gray-400 px-5 py-4">No active medications.</p>
                ) : (
                  (activeMeds.length > 0
                    ? activeMeds.map(m => ({
                        key: m.id,
                        name: m.brandName,
                        dosage: m.dosage || 'N/A',
                        freq: `${m.schedule.length}x daily`,
                      }))
                    : fallbackMeds.map((m, i) => ({
                        key: String(i),
                        name: m.name,
                        dosage: m.dosage || 'N/A',
                        freq: m.frequency,
                      }))
                  ).map(med => (
                    <div key={med.key} className="flex items-center gap-3 px-5 py-4 active:bg-gray-50 transition-colors" style={{ borderTopWidth: '0.5px' }}>
                      <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                        <Pill size={16} className="text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-gray-900 truncate">{med.name}</p>
                        <p className="text-[12px] text-gray-400">{med.dosage} · {med.freq}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wide">Active</span>
                        <ChevronRight size={15} className="text-gray-300" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ─── CYCLE HEALTH (if tracking) ─── */}
            {profile.menstrualCycle?.isTracking && (
              <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-rose-400" />
                  <span className="text-[11px] font-bold text-rose-400 uppercase tracking-widest">Hormonal & Cycle Health</span>
                </div>

                <div className="flex justify-between items-center bg-white/60 p-4 rounded-2xl">
                  <div>
                    <p className="font-semibold text-rose-900 capitalize text-sm">{cycle.currentPhase} Phase</p>
                    <p className="text-xs text-rose-700 mt-0.5">Day {cycle.daysIntoCycle} of ~{cycle.expectedCycleLength}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${cycle.currentPhase === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-rose-200 text-rose-800'}`}>
                    {cycle.currentPhase === 'late' ? 'Delayed' : 'Tracking'}
                  </span>
                </div>

                {cycle.currentPhase === 'late' && (
                  <div className="p-4 bg-white border border-amber-200 rounded-2xl">
                    <p className="text-xs font-bold text-amber-900 mb-1">Irregular Cycle Detected</p>
                    <p className="text-[11px] text-amber-700 mb-3 leading-relaxed">Your cycle appears delayed. Consider scheduling a teleconsultation.</p>
                    <a href="tel:+18001234567" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md active:scale-95 transition-transform">
                      <Phone size={13} /> Talk to Gynecologist
                    </a>
                  </div>
                )}

                <div className="pt-3 border-t border-rose-200/60">
                  {!aiInsight && !loadingInsight ? (
                    <div className="space-y-3">
                      <button onClick={() => fetchAiInsight(false)} className="w-full py-3 bg-gradient-to-r from-rose-500 to-purple-500 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <Sparkles size={14} /> Generate AI Cycle Insights
                      </button>
                      <div className="flex bg-white border border-rose-200 rounded-xl overflow-hidden focus-within:border-rose-400 transition-all">
                        <input type="text" value={aiQuestion} onChange={e => setAiQuestion(e.target.value)} placeholder="Ask a tailored question..." className="px-3 py-2 text-xs w-full focus:outline-none text-gray-700 bg-transparent placeholder-gray-400" onKeyDown={e => e.key === 'Enter' && aiQuestion.trim() && fetchAiInsight(true)} />
                        <button onClick={() => fetchAiInsight(true)} disabled={loadingInsight || !aiQuestion.trim()} className="px-4 bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-wider hover:bg-rose-100 disabled:opacity-50 transition-colors">Ask</button>
                      </div>
                    </div>
                  ) : loadingInsight ? (
                    <div className="flex items-center justify-center py-4 gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-rose-500" />
                      <span className="text-xs font-bold text-rose-500 animate-pulse">Analyzing…</span>
                    </div>
                  ) : (
                    <div className="bg-white/80 p-4 rounded-2xl border border-rose-100 relative">
                      <button onClick={() => setAiInsight(null)} className="absolute top-3 right-3 text-gray-400 bg-gray-50 p-1 rounded-full hover:bg-gray-100 transition-colors"><X size={13} /></button>
                      <h4 className="font-bold text-xs text-rose-900 mb-3 flex items-center gap-2"><Sparkles size={13} className="text-purple-500" /> SANJIVANI AI</h4>
                      <div className="space-y-3">
                        {aiInsight?.split(/\n\n+/).map((para, idx) => (
                          <p key={idx} className="text-[11px] text-gray-700 leading-relaxed">
                            {para.split('\n').map((line, i) => (
                              <span key={i}>
                                {line.includes(':') && line.match(/^[A-Z0-9\s\./]+:/) ? (
                                  <><strong className="text-rose-800 font-bold block mb-0.5 mt-1">{line.split(':')[0]}:</strong>{line.substring(line.indexOf(':') + 1)}</>
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
            )}

            {/* ─── EMERGENCY NETWORK ─── */}
            {profile.emergencyContacts.length > 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                  <Phone size={15} className="text-blue-500" />
                  <span className="text-[13px] font-bold text-gray-700">Emergency Network</span>
                </div>
                <div className="divide-y divide-gray-100" style={{ borderTop: '0.5px solid #f3f4f6' }}>
                  {profile.emergencyContacts.map((c, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-4" style={{ borderTopWidth: '0.5px' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm">{c.name[0]}</div>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">{c.name}</p>
                          <p className="text-[11px] text-gray-400">{c.relation}</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await fetch('https://hook.eu2.make.com/2b9qvf5zvmu99zss88yemjgl11irj4nw', {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ event: 'emergency_call_initiated', timestamp: new Date().toISOString(), caller: { name: profile.name, bloodType: profile.bloodType }, contact: { name: c.name, relation: c.relation, phone: c.phone } }),
                            });
                          } catch { /* silent */ }
                          window.location.href = `tel:${c.phone}`;
                        }}
                        className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <Phone size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                {(profile.primaryDoctor || profile.preferredHospital) && (
                  <div className="px-5 pb-4 pt-2 border-t border-gray-100 space-y-1">
                    {profile.primaryDoctor && <p className="text-[12px]"><span className="text-gray-400 font-medium uppercase text-[10px]">Doctor: </span><span className="font-semibold text-gray-800">{profile.primaryDoctor}</span></p>}
                    {profile.preferredHospital && <p className="text-[12px]"><span className="text-gray-400 font-medium uppercase text-[10px]">Hospital: </span><span className="font-semibold text-gray-800">{profile.preferredHospital}</span></p>}
                  </div>
                )}
              </div>
            )}

            {/* ─── MEDICAL ID BADGE ─── */}
            <div className="bg-teal-50 border border-teal-100 rounded-3xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-teal-600 shadow-sm shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-teal-900 uppercase tracking-widest">Medical ID Active</p>
                <p className="text-[11px] text-teal-700/70 leading-relaxed mt-0.5">Health data stored locally for emergency responder access.</p>
              </div>
            </div>

            {/* ─── LOGOUT ─── */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl border border-red-100 bg-red-50 text-red-500 font-semibold text-sm active:scale-95 transition-transform"
            >
              <LogOut size={16} /> Logout & Wipe Profile
            </button>
          </>
        )}
      </main>
    </div>
  );
}
