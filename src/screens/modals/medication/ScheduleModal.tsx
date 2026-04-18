import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Bell } from 'lucide-react';

/**
 * ScheduleModal — placeholder for dosage schedule builder.
 */
export default function ScheduleModal() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <header className="bg-white px-6 pt-12 pb-6 border-b border-gray-100 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-3 bg-gray-50 rounded-2xl text-gray-400 active:scale-90 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-black text-gray-900">Schedule Builder</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Set Reminders</p>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-[28px] bg-blue-50 flex items-center justify-center text-blue-400 mb-6">
          <Clock size={40} />
        </div>
        <h3 className="font-black text-gray-900 text-lg mb-2">Coming Soon</h3>
        <p className="text-xs text-gray-400 leading-relaxed max-w-[260px]">
          Advanced schedule builder with push notifications and wearable reminders.
        </p>
        <div className="mt-6 flex items-center gap-2 text-[10px] text-gray-400 font-bold">
          <Bell size={14} /> Push notifications require FCM setup
        </div>
      </main>
    </div>
  );
}
