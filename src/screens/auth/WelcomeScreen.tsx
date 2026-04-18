import { useNavigate } from 'react-router-dom';
import { Heart, ChevronRight, Shield } from 'lucide-react';

/**
 * WelcomeScreen — entry point for new users.
 */
export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-white relative overflow-hidden">
      {/* Hero Section */}
      <div 
        className="flex-1 flex flex-col items-center justify-center px-8 text-center relative"
        style={{ background: 'linear-gradient(160deg, #0A6E57 0%, #1D9E75 50%, #E1F5EE 100%)' }}
      >
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
          <span className="text-white/60 text-[9px] font-black uppercase tracking-[0.3em]">Sanjeevni</span>
          <div className="flex items-center gap-1 text-white/40 text-[8px] font-bold">
            <Shield size={10} /> Secured
          </div>
        </div>

        <div className="w-24 h-24 rounded-[32px] bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center mb-8 shadow-2xl">
          <Heart size={44} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="text-white text-3xl font-black leading-tight mb-3">
          Your Health,<br/>Your Control.
        </h1>
        <p className="text-white/70 text-sm font-medium leading-relaxed max-w-[280px]">
          Intelligent medication management, safety checks, and affordable healthcare — all in one place.
        </p>
      </div>

      {/* Bottom Actions */}
      <div className="p-8 bg-white space-y-4">
        <button
          onClick={() => navigate('/auth/onboarding')}
          className="w-full py-5 rounded-[20px] text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
          style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0A6E57 100%)', boxShadow: '0 8px 24px rgba(29,158,117,0.3)' }}
        >
          Get Started <ChevronRight size={18} />
        </button>
        <button
          onClick={() => navigate('/auth/login')}
          className="w-full py-4 rounded-[20px] bg-gray-50 text-gray-600 font-bold text-sm active:scale-95 transition-all border border-gray-100"
        >
          I already have an account
        </button>
        <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
          By continuing you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
