import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Navigation as NavIcon, 
  BadgePercent, 
  TrendingDown,
  Info
} from 'lucide-react';
import { useMedicationStore } from '../../../store/medicationStore';
import { 
  findJanAushadhiEquivalent, 
  calculateMonthlySavings, 
  findNearestKendra 
} from '../../../lib/priceCompare';
import PriceCompareCard from '../../../components/medication/PriceCompareCard';
import SchemeEligibilityForm from '../../../components/medication/SchemeEligibilityForm';
import type { JanAushadhiKendra } from '../../../types/medication';

export default function PriceCompareModal() {
  const { medications } = useMedicationStore();
  const navigate = useNavigate();
  
  const [nearestKendra, setNearestKendra] = useState<(JanAushadhiKendra & { distance: number }) | null>(null);
  const [showSchemes, setShowSchemes] = useState(false);

  const savingsDetails = calculateMonthlySavings(medications);
  
  // High-value medications (those with equivalents)
  const affordableOptions = medications
    .map(med => ({
      ...med,
      equivalent: findJanAushadhiEquivalent(med.genericName)
    }))
    .filter(item => item.equivalent !== null);

  useEffect(() => {
    // Standard Browser Geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setNearestKendra(findNearestKendra(coords.lat, coords.lng));
        },
        (err) => console.warn('[Geolocation] Error:', err),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] pb-32">
      {/* Header Area */}
      <div className="bg-white px-6 pt-12 pb-8 border-b border-gray-100 sticky top-0 z-30">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate('/')} 
            className="p-3 bg-gray-50 rounded-2xl text-gray-400 active:scale-90 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-black text-gray-900 leading-tight">Affordability Layer</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sanjeevni Intelligence</p>
          </div>
        </div>

        {/* Savings Summary Hero */}
        <div className="bg-gray-900 rounded-[32px] p-6 text-white relative overflow-hidden shadow-2xl shadow-gray-900/20">
          <div className="absolute top-0 right-0 p-8 text-white/5">
             <BadgePercent size={120} />
          </div>
          
          <div className="relative z-10 space-y-4">
            <div>
              <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] mb-1">Potential Monthly Savings</p>
              <h3 className="text-4xl font-black tracking-tighter">₹{savingsDetails.potentialSavings.toFixed(0)}</h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-teal-500/20 rounded-full border border-teal-500/30 flex items-center gap-2">
                <TrendingDown size={14} className="text-teal-400" />
                <span className="text-xs font-black text-teal-400">Save {savingsDetails.savingPercent.toFixed(0)}% overall</span>
              </div>
              <p className="text-[10px] text-white/40 font-bold leading-tight">
                Based on your current<br/>active medications
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Section Tabs */}
        <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-gray-100">
           <button 
             onClick={() => setShowSchemes(false)}
             className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
               !showSchemes ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400'
             }`}
           >
             Price Compare
           </button>
           <button 
             onClick={() => setShowSchemes(true)}
             className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
               showSchemes ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400'
             }`}
           >
             Govt Schemes
           </button>
        </div>

        {!showSchemes ? (
          <div className="space-y-8">
            {/* Nearest Kendra Info */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nearest Store</h4>
              {nearestKendra ? (
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <h4 className="font-black text-gray-900">{nearestKendra.name}</h4>
                      <p className="text-xs text-gray-400 leading-relaxed font-medium">{nearestKendra.address}, {nearestKendra.city}</p>
                    </div>
                    <div className="text-teal-500 bg-teal-50 px-3 py-1 rounded-full text-[10px] font-black">
                      {nearestKendra.distance.toFixed(1)} KM
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button 
                      className="flex-1 py-3 bg-gray-50 text-gray-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${nearestKendra.coordinates.lat},${nearestKendra.coordinates.lng}`, '_blank')}
                    >
                      <NavIcon size={14} /> Get Directions
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-white rounded-[32px] border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                    <MapPin size={24} />
                  </div>
                  <p className="text-xs font-bold text-gray-400">
                    Enable location to find<br/>nearest stores.
                  </p>
                </div>
              )}
            </div>

            {/* Price Lists */}
            <div className="space-y-4">
              <div className="flex items-center justify-between ml-1">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Comparisons</h4>
                <div className="flex items-center gap-1.5 text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full text-[9px] font-bold">
                   <Info size={10} />
                   <span>Prices Updated Mar 2024</span>
                </div>
              </div>

              {affordableOptions.map((item) => (
                <PriceCompareCard 
                  key={item.id}
                  brandName={item.brandName}
                  equivalent={item.equivalent!}
                  onSwitch={() => console.log('Switched:', item.id)}
                />
              ))}

              {affordableOptions.length === 0 && (
                <div className="text-center py-12 px-6">
                   <p className="text-sm font-bold text-gray-400">No generic equivalents found for your current medications.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <SchemeEligibilityForm />
          </div>
        )}
      </div>
    </div>
  );
}
