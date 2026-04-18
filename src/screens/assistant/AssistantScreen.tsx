import { Bot, Mic, Send } from 'lucide-react';
import { useState } from 'react';

/**
 * AssistantScreen — placeholder for Voice RAG AI chatbot.
 * Will integrate with the RAG backend for health queries.
 */
export default function AssistantScreen() {
  const [input, setInput] = useState('');

  return (
    <div className="flex flex-col min-h-full bg-[#F8FAFC]">
      <header className="px-6 pt-12 pb-6 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Assistant</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">AI Health Guide</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 pb-32 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-[28px] bg-gray-100 flex items-center justify-center text-gray-300 mb-6">
          <Bot size={40} />
        </div>
        <h3 className="font-black text-gray-900 text-lg mb-2">Ask me anything</h3>
        <p className="text-xs text-gray-400 leading-relaxed max-w-[260px] mb-8">
          Get answers about your medications, interactions, dosage, and health conditions.
        </p>

        <div className="w-full flex items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
          <button className="p-3 rounded-xl bg-gray-50 text-gray-400 active:scale-90 transition-all">
            <Mic size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 py-2 px-2 text-sm font-medium text-gray-800 outline-none bg-transparent"
          />
          <button 
            className="p-3 rounded-xl text-white active:scale-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #0A6E57 100%)' }}
          >
            <Send size={18} />
          </button>
        </div>

        <p className="text-[9px] text-gray-300 mt-4 font-bold uppercase tracking-widest">
          ⚕️ Not a substitute for professional medical advice
        </p>
      </main>
    </div>
  );
}
