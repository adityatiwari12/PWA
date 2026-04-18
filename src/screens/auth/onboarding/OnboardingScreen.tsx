import { useState } from 'react';
import { 
  User, 
  Stethoscope, 
  Pill, 
  AlertCircle,
  Activity,
  Users,
  Phone,
  Home,
  ChevronRight, 
  ChevronLeft, 
  Check 
} from 'lucide-react';
import { dbOperations } from '../../../lib/db';
import type { UserProfile, BloodType, EmergencyContact, UserCurrentMedication } from '../../../types/user';

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const DIET_TYPES = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Pescatarian', 'Jain', 'Other'];
const ACTIVITY_LEVELS = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'];

export default function OnboardingScreen() {
  const [step, setStep] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  // 1. Identity
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');

  // 1b. Female Health Tracking
  const [isTrackingCycle, setIsTrackingCycle] = useState(false);
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [averageCycleLength, setAverageCycleLength] = useState('28');

  // 2. Critical Medical Info
  const [bloodType, setBloodType] = useState<BloodType>('Unknown');
  const [allergyInput, setAllergyInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditionInput, setConditionInput] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [surgeryInput, setSurgeryInput] = useState('');
  const [surgeries, setSurgeries] = useState<string[]>([]);

  // 3. Current Meds
  const [meds, setMeds] = useState<UserCurrentMedication[]>([]);
  const [medForm, setMedForm] = useState({ name: '', dosage: '', frequency: '', since: '' });

  // 4. Symptoms
  const [symptomInput, setSymptomInput] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);

  // 5. Lifestyle
  const [smoking, setSmoking] = useState(false);
  const [alcohol, setAlcohol] = useState(false);
  const [physicalActivity, setActivityLevel] = useState('Sedentary');
  const [diet, setDiet] = useState('Vegetarian');

  // 6. Family History
  const [historyInput, setHistoryInput] = useState('');
  const [familyHistory, setFamilyHistory] = useState<string[]>([]);

  // 7. Emergency
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [primaryDoctor, setPrimaryDoctor] = useState('');
  const [preferredHospital, setPreferredHospital] = useState('');

  // 8. Accessibility
  const [livingAlone, setLivingAlone] = useState(false);
  const [hasMonitor, setHasMonitor] = useState(false);
  const [elderlyMode, setElderlyMode] = useState(false);

  const addTag = (value: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) setList([...list, trimmed]);
    setInput('');
  };

  const removeTag = (value: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter(i => i !== value));
  };

  const addMed = () => {
    if (medForm.name.trim()) {
      setMeds([...meds, medForm]);
      setMedForm({ name: '', dosage: '', frequency: '', since: '' });
    }
  };

  const removeMed = (index: number) => {
    setMeds(meds.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    setSaving(true);
    const contact: EmergencyContact = {
      name: contactName,
      relation: contactRelation,
      phone: contactPhone,
      isPrimary: true
    };

    const profile: UserProfile = {
      uid: crypto.randomUUID(),
      name,
      dateOfBirth: dob,
      gender,
      bloodType,
      heightCm: Number(heightCm) || 0,
      weightKg: Number(weightKg) || 0,
      allergies,
      chronicConditions: conditions,
      pastSurgeries: surgeries,
      currentMedications: meds,
      symptoms,
      lifestyle: { smoking, alcohol, physicalActivity, diet },
      familyHistory,
      emergencyContacts: contactName ? [contact] : [],
      primaryDoctor,
      preferredHospital,
      elderlyMode,
      livingAlone,
      hasMonitor,
      preferredLanguage: 'en',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...(gender === 'Female' && isTrackingCycle ? {
        menstrualCycle: {
          isTracking: true,
          lastPeriodDate: lastPeriodDate || new Date().toISOString().split('T')[0],
          averageCycleLength: parseInt(averageCycleLength) || 28
        }
      } : {})
    };
    await dbOperations.saveUserProfile(profile);
    window.location.href = '/';
  };

  const steps = [
    { num: 1, label: 'Identity', icon: <User size={20} /> },
    { num: 2, label: 'Critical Data', icon: <Stethoscope size={20} /> },
    { num: 3, label: 'Medications', icon: <Pill size={20} /> },
    { num: 4, label: 'Symptoms', icon: <AlertCircle size={20} /> },
    { num: 5, label: 'Lifestyle', icon: <Activity size={20} /> },
    { num: 6, label: 'Genetics', icon: <Users size={20} /> },
    { num: 7, label: 'Emergency', icon: <Phone size={20} /> },
    { num: 8, label: 'Context', icon: <Home size={20} /> },
  ];

  const currentStepData = steps[step - 1];

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-white relative">
      {/* Header */}
      <div style={{ background: 'var(--teal-500)' }} className="px-5 pt-12 pb-6 flex-shrink-0">
        <h1 className="text-white text-2xl font-bold mb-1">Health Profile</h1>
        <p className="text-white/80 text-sm">Step {step} of 8: {currentStepData.label}</p>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-white/20 rounded-full mt-4 overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${(step / 8) * 100}%` }}
          />
        </div>
      </div>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-5">

        <div className="flex items-center gap-2 mb-4">
          <div className="text-teal-600 bg-teal-50 p-2 rounded-xl">{currentStepData.icon}</div>
          <h2 className="text-xl font-black text-gray-900">{currentStepData.label}</h2>
        </div>

        {/* STEP 1: Identity */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-teal-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Date of Birth</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-teal-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-teal-400">
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {gender === 'Female' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-rose-900 text-sm">Enable Cycle-Aware Vitals?</h4>
                  <button onClick={() => setIsTrackingCycle(!isTrackingCycle)} className={`w-12 h-6 rounded-full transition-colors relative ${isTrackingCycle ? 'bg-rose-500' : 'bg-rose-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isTrackingCycle ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                {isTrackingCycle && (
                  <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-rose-200/50">
                    <div>
                      <label className="text-xs font-semibold text-rose-800 mb-1 block">1st Day of Last Period</label>
                      <input type="date" value={lastPeriodDate} onChange={e => setLastPeriodDate(e.target.value)} className="w-full border border-rose-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-rose-400" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-rose-800 mb-1 block">Avg Cycle (Days)</label>
                      <input type="number" value={averageCycleLength} onChange={e => setAverageCycleLength(e.target.value)} placeholder="28" className="w-full border border-rose-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-rose-400" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Height (cm)</label>
                <input type="number" value={heightCm} onChange={e => setHeightCm(e.target.value)}
                  placeholder="170" className="w-full border border-gray-200 rounded-xl px-4 py-3"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Weight (kg)</label>
                <input type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)}
                  placeholder="70" className="w-full border border-gray-200 rounded-xl px-4 py-3"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Critical */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block">Blood Type</label>
              <div className="flex flex-wrap gap-2">
                {BLOOD_TYPES.map(bt => (
                  <button key={bt} onClick={() => setBloodType(bt)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${
                      bloodType === bt ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >{bt}</button>
                ))}
              </div>
            </div>
            
            {[
              { label: 'Allergies (Meds, Food)', val: allergyInput, setVal: setAllergyInput, list: allergies, setList: setAllergies, placeholder: 'e.g. Penicillin' },
              { label: 'Chronic Conditions', val: conditionInput, setVal: setConditionInput, list: conditions, setList: setConditions, placeholder: 'e.g. Diabetes Type 2' },
              { label: 'Past Surgeries / Hospitalizations', val: surgeryInput, setVal: setSurgeryInput, list: surgeries, setList: setSurgeries, placeholder: 'e.g. Appendectomy 2020' },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">{f.label}</label>
                <div className="flex gap-2">
                  <input value={f.val} onChange={e => f.setVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTag(f.val, f.list, f.setList, f.setVal)}
                    placeholder={f.placeholder}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-teal-400"
                  />
                  <button onClick={() => addTag(f.val, f.list, f.setList, f.setVal)}
                    className="px-4 rounded-xl text-teal-600 bg-teal-50 font-bold border border-teal-100">Add</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {f.list.map(item => (
                    <span key={item} className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border border-gray-200">
                      {item} <button onClick={() => removeTag(item, f.list, f.setList)} className="ml-1 text-gray-500 font-bold hover:text-red-500">&times;</button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 3: Current Meds */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">What medicines are you currently taking?</p>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
               <input placeholder="Medicine Name (e.g. Metformin)" value={medForm.name} onChange={e => setMedForm({...medForm, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
               <div className="grid grid-cols-2 gap-2">
                 <input placeholder="Dosage (e.g. 500mg)" value={medForm.dosage} onChange={e => setMedForm({...medForm, dosage: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
                 <input placeholder="Freq (e.g. 2x Daily)" value={medForm.frequency} onChange={e => setMedForm({...medForm, frequency: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
               </div>
               <input placeholder="Since when? (e.g. Jan 2023)" value={medForm.since} onChange={e => setMedForm({...medForm, since: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
               <button onClick={addMed} disabled={!medForm.name} className="w-full py-2 bg-teal-500 text-white rounded-xl font-bold disabled:opacity-50">+ Add Medication</button>
            </div>

            <div className="space-y-2 mt-4">
              {meds.map((m, i) => (
                <div key={i} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-xl shadow-sm">
                  <div>
                    <h4 className="font-bold text-gray-800">{m.name} <span className="text-teal-600 bg-teal-50 text-[10px] px-1.5 py-0.5 rounded">{m.dosage}</span></h4>
                    <p className="text-xs text-gray-500">{m.frequency} • Since {m.since}</p>
                  </div>
                  <button onClick={() => removeMed(i)} className="text-red-400 bg-red-50 p-2 rounded-full"><AlertCircle size={16} /></button>
                </div>
              ))}
              {meds.length === 0 && <p className="text-xs text-center text-gray-400 py-4 italic">No active medications added.</p>}
            </div>
          </div>
        )}

        {/* STEP 4: Symptoms */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Are you experiencing any physical or mental symptoms right now? (Optional)</p>
            <div className="flex gap-2">
              <input value={symptomInput} onChange={e => setSymptomInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag(symptomInput, symptoms, setSymptoms, setSymptomInput)}
                placeholder="e.g. Persistent Cough, Migraine"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-teal-400"
              />
              <button onClick={() => addTag(symptomInput, symptoms, setSymptoms, setSymptomInput)}
                className="px-4 rounded-xl text-teal-600 bg-teal-50 font-bold border border-teal-100">Add</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {symptoms.map(s => (
                <span key={s} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border border-amber-200">
                  {s} <button onClick={() => removeTag(s, symptoms, setSymptoms)} className="ml-1 text-amber-600 font-bold hover:text-red-500">&times;</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Lifestyle */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
               <div>
                 <h4 className="font-bold text-gray-800">Smoking Habit</h4>
               </div>
               <button onClick={() => setSmoking(!smoking)} className={`w-12 h-6 rounded-full transition-colors relative ${smoking ? 'bg-amber-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${smoking ? 'left-7' : 'left-1'}`} />
               </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
               <div>
                 <h4 className="font-bold text-gray-800">Alcohol Consumption</h4>
               </div>
               <button onClick={() => setAlcohol(!alcohol)} className={`w-12 h-6 rounded-full transition-colors relative ${alcohol ? 'bg-amber-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${alcohol ? 'left-7' : 'left-1'}`} />
               </button>
            </div>
            
            <div>
               <label className="text-xs font-semibold text-gray-500 mb-2 block">Physical Activity</label>
               <select value={physicalActivity} onChange={e => setActivityLevel(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3">
                 {ACTIVITY_LEVELS.map(a => <option key={a} value={a}>{a}</option>)}
               </select>
            </div>
            <div>
               <label className="text-xs font-semibold text-gray-500 mb-2 block">Diet Type (Restrictions)</label>
               <select value={diet} onChange={e => setDiet(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3">
                 {DIET_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
               </select>
            </div>
          </div>
        )}

        {/* STEP 6: Family History */}
        {step === 6 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Any immediate family history of heart disease, diabetes, cancer, or genetic conditions?</p>
            <div className="flex gap-2">
              <input value={historyInput} onChange={e => setHistoryInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag(historyInput, familyHistory, setFamilyHistory, setHistoryInput)}
                placeholder="e.g. Maternal Diabetes"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-teal-400"
              />
              <button onClick={() => addTag(historyInput, familyHistory, setFamilyHistory, setHistoryInput)}
                className="px-4 rounded-xl text-teal-600 bg-teal-50 font-bold border border-teal-100">Add</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {familyHistory.map(h => (
                <span key={h} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border border-purple-200">
                  {h} <button onClick={() => removeTag(h, familyHistory, setFamilyHistory)} className="ml-1 text-purple-500 font-bold hover:text-red-500">&times;</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* STEP 7: Emergency */}
        {step === 7 && (
          <div className="space-y-4">
            <h3 className="font-black text-gray-800 border-b pb-1">Emergency Contact</h3>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Contact Name</label>
              <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="e.g. Priya Kumar" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="text-xs font-semibold text-gray-500 mb-1 block">Relation</label>
                 <input value={contactRelation} onChange={e => setContactRelation(e.target.value)} placeholder="e.g. Daughter" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
               </div>
               <div>
                 <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone</label>
                 <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="9876543210" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
               </div>
            </div>

            <h3 className="font-black text-gray-800 border-b pb-1 mt-6">Preferred Doctors/Hospitals</h3>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Primary Doctor (Optional)</label>
              <input value={primaryDoctor} onChange={e => setPrimaryDoctor(e.target.value)} placeholder="Dr. Sharma" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Preferred Hospital (Optional)</label>
              <input value={preferredHospital} onChange={e => setPreferredHospital(e.target.value)} placeholder="Apollo Hospital" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
            </div>
          </div>
        )}

        {/* STEP 8: Accessibility */}
        {step === 8 && (
          <div className="space-y-4 pt-4">
             <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-blue-900 border-b border-blue-200 pb-1 mb-1">Live Alone?</h4>
                  <p className="text-xs text-blue-700">Activates auto-check-in features</p>
                </div>
                <button onClick={() => setLivingAlone(!livingAlone)} className={`w-12 h-6 rounded-full transition-colors relative ${livingAlone ? 'bg-blue-600' : 'bg-blue-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${livingAlone ? 'left-7' : 'left-1'}`} />
               </button>
             </div>
             
             <div className="p-5 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-teal-900 border-b border-teal-200 pb-1 mb-1">Health Monitored?</h4>
                  <p className="text-xs text-teal-700">Do you have someone monitoring you?</p>
                </div>
                <button onClick={() => setHasMonitor(!hasMonitor)} className={`w-12 h-6 rounded-full transition-colors relative ${hasMonitor ? 'bg-teal-600' : 'bg-teal-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hasMonitor ? 'left-7' : 'left-1'}`} />
               </button>
             </div>

             <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-1">Elderly Accessible Mode</h4>
                  <p className="text-xs text-gray-500">Increases text sizes across the app</p>
                </div>
                <button onClick={() => setElderlyMode(!elderlyMode)} className={`w-12 h-6 rounded-full transition-colors relative ${elderlyMode ? 'bg-gray-800' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${elderlyMode ? 'left-7' : 'left-1'}`} />
               </button>
             </div>
          </div>
        )}

      </div>

      {/* Navigation buttons */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white/90 backdrop-blur-md flex gap-3">
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-1 px-5 py-4 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200">
            <ChevronLeft size={16} /> Back
          </button>
        )}
        {step < 8 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 1 && (!name.trim() || !dob)}
            className="flex-1 flex items-center justify-center gap-1 py-4 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all"
            style={{ background: 'var(--teal-500)' }}
          >
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={handleFinish} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold text-sm disabled:opacity-60 transition-all"
            style={{ background: 'var(--teal-500)' }}
          >
            {saving ? 'Creating Profile...' : <><Check size={16} /> Start Using App</>}
          </button>
        )}
      </div>
    </div>
  );
}
