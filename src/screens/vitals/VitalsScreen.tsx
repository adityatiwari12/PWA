import { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  TrendingUp, 
  TrendingDown,
  Send,
  AlertTriangle,
  Bot
} from 'lucide-react';
import { useMedicationStore } from '../../store/medicationStore';
import { useVitalsStore } from '../../store/vitalsStore';
import { useDiagnosticState } from '../../hooks/useDiagnosticState';
import { generateVitalsChatResponse } from '../../lib/gemini';
import { dbOperations } from '../../lib/db';
import type { UserProfile } from '../../types/user';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export default function VitalsScreen() {
  const { medications } = useMedicationStore();
  const { vitals, startSimulation } = useVitalsStore();
  const diagnostic = useDiagnosticState();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis'>('overview');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Chatbot State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startSimulation();
    dbOperations.getUserProfile().then(p => setUserProfile(p || null));
  }, [startSimulation]);

  useEffect(() => {
    if (activeTab === 'analysis') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeTab]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    const response = await generateVitalsChatResponse(
      userMessage,
      userProfile,
      vitals,
      medications.filter(m => m.status === 'active'),
      chatHistory
    );

    setChatHistory(prev => [...prev, { role: 'model', content: response }]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col min-h-full bg-white pb-32">
      
      {/* Header */}
      <header className="px-5 pt-12 pb-2">
        <h1 className="text-[20px] font-medium text-gray-900 leading-tight">Vitals Core</h1>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[12px] text-gray-500">Telemetry syncing</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-6 mt-6 border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-medium transition-all relative ${
              activeTab === 'overview' ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            Telemetry Grid
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-t-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('analysis')}
            className={`pb-3 text-sm font-medium transition-all relative ${
              activeTab === 'analysis' ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            AI Synthesis
            {activeTab === 'analysis' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-t-full" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 py-5 overflow-y-auto">
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-3">
            {vitals.map((v, i) => {
              const isHRV = v.id === 'hrv';
              
              // Resolve trend color to reflect meaning, not just blue
              const trendIcon = v.trend === 'up' 
                ? <TrendingUp size={16} className={isHRV || v.status === 'critical' || v.status === 'high' ? 'text-red-500' : 'text-emerald-500'} /> 
                : v.trend === 'down' 
                ? <TrendingDown size={16} className={isHRV || v.status === 'critical' || v.status === 'low' ? 'text-red-500' : 'text-emerald-500'} /> 
                : null;

              return (
                <div 
                  key={i} 
                  className={`rounded-[12px] p-[16px] relative flex flex-col justify-between min-h-[140px] transition-colors ${
                    isHRV 
                      ? 'bg-[#FFFBEB] border border-[#F59E0B]' 
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                     <div className={isHRV ? 'text-amber-500' : 'text-gray-600'}>
                       <v.icon size={20} strokeWidth={2} />
                     </div>
                     <div>
                       {trendIcon}
                     </div>
                  </div>
                  
                  <div className="mt-auto">
                    <p className="text-[11px] uppercase text-gray-400 tracking-wide font-medium mb-1">
                      {v.label}
                    </p>
                    <div className="flex items-baseline">
                       <p className={`text-[26px] font-medium leading-none ${isHRV ? 'text-amber-900' : 'text-gray-900'}`}>
                         {v.id === 'bp' ? `${v.sys}/${v.dia}` : v.value}
                       </p>
                       <span className="text-[14px] text-gray-400 ml-1">{v.unit}</span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-3">
                       <div className={`w-2 h-2 rounded-full ${
                          isHRV ? 'bg-amber-500' : 
                          v.status === 'critical' ? 'bg-red-500 animate-pulse' :
                          v.status === 'high' || v.status === 'low' ? 'bg-amber-400' : 'bg-emerald-500'
                       }`} />
                       <span className={`text-[12px] font-medium capitalize ${
                          isHRV ? 'text-amber-600' : 
                          v.status === 'critical' ? 'text-red-500' :
                          v.status === 'high' || v.status === 'low' ? 'text-amber-500' : 'text-emerald-600'
                       }`}>
                         {isHRV ? 'Low' : v.status === 'optimal' || v.status === 'normal' ? 'Normal' : v.status}
                       </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* AI Synthesis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-4">
            
            {/* Engine Overview */}
            <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <BrainCircuit className="text-red-500" size={20} />
                <h2 className="text-gray-900 font-semibold text-sm">Synthesis Engine</h2>
              </div>
              <p className="text-[13px] text-gray-600 leading-relaxed font-medium">
                 {diagnostic.vitalAnomalies.length > 0 
                   ? `Detected physiological deviations: ${diagnostic.vitalAnomalies.join('. ')}. Correlating with current medication stack.`
                   : 'Vitals are perfectly nominal. Correlating with stack confirms standard pharmacokinetic absorption with zero adverse impact.'}
              </p>
            </div>

            {/* AI Action/Warning Feedback */}
            {diagnostic.vitalAnomalies.length > 0 && medications.length > 0 ? (
               <div className="space-y-3">
                 <h3 className="text-[11px] font-bold text-red-500 uppercase tracking-widest mt-6 mb-2 ml-1">
                   Correlated Risk Vectors
                 </h3>
                 <div className="bg-red-50 border border-red-100 rounded-[16px] p-5 shadow-sm">
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-100 px-2 py-1 rounded">Drug-Induced Variance</span>
                     <AlertTriangle size={14} className="text-red-500" />
                   </div>
                   <h4 className="text-red-900 font-bold text-sm mb-2">{medications[0].brandName} Influence</h4>
                   <p className="text-[13px] text-red-800/80 leading-relaxed font-medium">
                     We noticed an anomaly in your vitals. <span className="font-bold text-red-900">{medications[0].brandName}</span> is active in your system and might be inducing these stress markers. Review dosage timing with your physician if this anomaly persists.
                   </p>
                 </div>
               </div>
            ) : medications.length > 0 ? (
               <div className="space-y-3 mt-6">
                 <h3 className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest ml-1">
                   Stable Efficacy Map
                 </h3>
                 <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm">
                    <h4 className="text-gray-900 font-semibold text-sm mb-1">{medications[0].brandName}</h4>
                    <p className="text-[13px] text-gray-600">
                      Vitals show optimal conditions. The drug is working as intended without disrupting cardiovascular or respiratory baselines.
                    </p>
                 </div>
               </div>
            ) : null}

            {/* Chatbot Interface */}
            <div className="mt-8 pt-6 border-t border-gray-100">
               <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                 <Bot size={14} /> Clinical Intelligence Chat
               </h3>
               
               <div className="bg-[#F7F8FA] rounded-[16px] border border-gray-200 flex flex-col h-[300px] overflow-hidden">
                 {/* Chat History */}
                 <div className="flex-1 overflow-y-auto p-4 space-y-4">
                   {chatHistory.length === 0 ? (
                     <div className="text-center mt-6">
                       <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 border border-gray-200 shadow-sm">
                         <BrainCircuit size={20} className="text-teal-500" />
                       </div>
                       <p className="text-[12px] font-medium text-gray-500 px-4">
                         I monitor your live vitals and profile. Ask me anything about your current health state or medications.
                       </p>
                     </div>
                   ) : (
                     chatHistory.map((msg, i) => (
                       <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[85%] rounded-[12px] px-4 py-2.5 text-[13px] ${
                           msg.role === 'user' 
                             ? 'bg-gray-900 text-white font-medium rounded-tr-sm' 
                             : 'bg-white border border-gray-200 text-gray-700 leading-relaxed rounded-tl-sm shadow-sm'
                         }`}>
                           {msg.content}
                         </div>
                       </div>
                     ))
                   )}
                   
                   {isTyping && (
                     <div className="flex justify-start">
                       <div className="bg-white border border-gray-200 rounded-[12px] rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                         <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                         <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                         <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                       </div>
                     </div>
                   )}
                   <div ref={chatEndRef} />
                 </div>

                 {/* Chat Input */}
                 <div className="bg-white border-t border-gray-200 p-3">
                   <div className="flex bg-[#F7F8FA] rounded-[12px] border border-gray-200 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                     <input 
                       type="text"
                       value={chatInput}
                       onChange={e => setChatInput(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                       placeholder="Ask about your vitals..."
                       className="flex-1 bg-transparent px-4 py-2.5 text-[13px] text-gray-800 outline-none placeholder-gray-400"
                     />
                     <button 
                       onClick={handleSendMessage}
                       disabled={isTyping || !chatInput.trim()}
                       className="px-3 text-teal-600 disabled:opacity-30 active:scale-95 transition-all"
                     >
                       <Send size={18} />
                     </button>
                   </div>
                 </div>
               </div>
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}
