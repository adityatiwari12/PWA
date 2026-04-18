import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Lock, ChevronRight } from 'lucide-react';

/**
 * LoginScreen — placeholder auth screen.
 * In production, this would integrate Firebase Auth / OTP.
 */
export default function LoginScreen() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');

  const handleLogin = () => {
    // Placeholder — in production, verify OTP / Firebase Auth
    navigate('/auth/onboarding');
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <button
          onClick={() => navigate('/auth/welcome')}
          className="p-3 bg-gray-50 rounded-2xl text-gray-400 active:scale-90 transition-all mb-6"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black text-gray-900 leading-tight">Welcome back</h1>
        <p className="text-sm text-gray-400 font-medium mt-1">Sign in with your phone number</p>
      </div>

      <div className="flex-1 px-6 space-y-5">
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-teal-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
          />
        </div>

        <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100 flex items-start gap-3">
          <Lock size={16} className="text-teal-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-teal-800 leading-relaxed font-medium">
            We'll send a one-time verification code to this number. Your data stays on-device.
          </p>
        </div>
      </div>

      <div className="p-6">
        <button
          onClick={handleLogin}
          disabled={phone.length < 10}
          className="w-full py-5 rounded-[20px] text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40 shadow-xl"
          style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0A6E57 100%)', boxShadow: '0 8px 24px rgba(29,158,117,0.3)' }}
        >
          Send OTP <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
