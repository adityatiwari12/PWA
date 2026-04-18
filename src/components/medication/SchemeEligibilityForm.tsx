import React, { useState } from 'react';
import { User, MapPin, ChevronRight, ShieldCheck } from 'lucide-react';
import { GOVT_SCHEMES } from '../../lib/janAushadhiDataset';
import type { GovernmentScheme } from '../../types/medication';

const SchemeEligibilityForm: React.FC = () => {
  const [age, setAge] = useState('');
  const [state, setState] = useState('');
  const [results, setResults] = useState<GovernmentScheme[]>([]);
  const [checked, setChecked] = useState(false);

  const states = [
    'Delhi', 'Maharashtra', 'Karnataka', 'West Bengal', 'Tamil Nadu', 
    'Uttar Pradesh', 'Gujarat', 'Rajasthan', 'Kerala', 'Punjab'
  ];

  const handleCheck = () => {
    if (!age || !state) return;
    
    // MVP Filter Logic
    const ageNum = parseInt(age);
    const eligible = GOVT_SCHEMES.filter(scheme => {
      if (scheme.id === 'SCH-003' && ageNum < 60) return false; // Rashtriya Vayoshri (60+)
      return true;
    });

    setResults(eligible);
    setChecked(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck size={18} />
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Eligibility Check</span>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full pl-12 pr-10 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-gray-800 appearance-none"
            >
              <option value="">Select your State</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <button
            onClick={handleCheck}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl shadow-gray-900/10"
          >
            CALCULATE ELIGIBILITY
          </button>
        </div>
      </div>

      {checked && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Relevant Schemes</h4>
          
          {results.length > 0 ? (
            results.map(scheme => (
              <div key={scheme.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
                <h4 className="font-black text-gray-900 mb-2">{scheme.name}</h4>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">{scheme.description}</p>
                
                <div className="space-y-2 mb-4">
                  {scheme.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <p className="text-[11px] font-bold text-gray-700 leading-tight">{b}</p>
                    </div>
                  ))}
                </div>

                <button 
                  className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                  onClick={() => scheme.applicationUrl && window.open(scheme.applicationUrl, '_blank')}
                >
                  Apply via Official Portal
                  <ChevronRight size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
               <p className="text-sm font-bold text-gray-400">No specific matches found for your criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SchemeEligibilityForm;
