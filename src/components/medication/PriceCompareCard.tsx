import React from 'react';
import { ArrowRight, BadgePercent, CheckCircle, ExternalLink } from 'lucide-react';
import type { JanAushadhiProduct } from '../../types/medication';

interface PriceCompareCardProps {
  brandName: string;
  equivalent: JanAushadhiProduct;
  onSwitch?: () => void;
}

const PriceCompareCard: React.FC<PriceCompareCardProps> = ({ brandName, equivalent, onSwitch }) => {
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <BadgePercent size={18} />
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Savings Opportunity</span>
        </div>
        <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-tighter shadow-lg shadow-emerald-500/20">
          SAVE {equivalent.savingsPercent}%
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-2">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Your Brand</p>
          <p className="font-black text-gray-900 leading-tight">{brandName}</p>
          <p className="text-sm font-black text-gray-400">₹{equivalent.marketPrice.toFixed(2)}</p>
        </div>

        <div className="text-gray-200">
          <ArrowRight size={20} />
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-bold text-teal-600 uppercase tracking-tight">Jan Aushadhi</p>
          <p className="font-black text-teal-700 leading-tight">{equivalent.productName}</p>
          <p className="text-xl font-black text-emerald-600">₹{equivalent.mrp.toFixed(2)}</p>
        </div>
      </div>

      <div className="pt-2 flex flex-col gap-2">
        <button
          onClick={onSwitch}
          className="w-full py-3 bg-teal-500 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-teal-500/20"
        >
          <CheckCircle size={16} />
          SWITCH TO GENERIC
        </button>
        <button
          className="w-full py-3 bg-gray-50 text-gray-500 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
          onClick={() => window.open('https://janaushadhi.gov.in/', '_blank')}
        >
          <ExternalLink size={14} />
          LEARN MORE
        </button>
      </div>
    </div>
  );
};

export default PriceCompareCard;
