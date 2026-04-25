"use client";
import { useState, useEffect, useRef } from 'react';

interface AIChatProps { lang: string; t: any; }

export default function AIChat({ lang, t }: AIChatProps) {
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ name: '', email: '' });
  const [isIdentified, setIsIdentified] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // --- LÓGICA DE URL INTELIGENTE ---
  const RAW_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, "");
  const API_URL = RAW_URL.includes('localhost') 
    ? RAW_URL 
    : RAW_URL.replace("http://", "https://");

  const userMessageCount = messages.filter(m => m.role === 'user').length;

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, userData, language: lang }),
      });
      const data = await res.json();
      if (data?.reply) setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (e) { 
      console.error("Error en fetch:", e); 
    } finally { setLoading(false); }
  };

  const sendRequestToRoberto = async () => {
    if (loading) return;
    setIsSent(true); // Muestra el mensaje de éxito inmediatamente
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ chatHistory: messages, userData }),
      });
    } catch (e) { 
        console.log("Enviado al servidor..."); 
    } finally { setLoading(false); }
  };

  // --- VISTA 1: IDENTIFICACIÓN ---
  if (!isIdentified) return (
    <div className="bg-gray-900 border border-blue-500/30 p-8 rounded-xl shadow-2xl max-w-md mx-auto">
      <h2 className="text-2xl font-black text-white mb-6">PUMA <span className="text-blue-500">CODE</span></h2>
      <input className="w-full p-3 mb-4 bg-black border border-gray-700 rounded-lg text-white outline-none focus:border-blue-500" placeholder={t.chat_form_name} value={userData.name} onChange={(e) => setUserData({...userData, name: e.target.value})} />
      <input className="w-full p-3 mb-6 bg-black border border-gray-700 rounded-lg text-white outline-none focus:border-blue-500" placeholder={t.chat_form_email} value={userData.email} onChange={(e) => setUserData({...userData, email: e.target.value})} />
      <button onClick={() => setIsIdentified(true)} disabled={!userData.name || !userData.email} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg disabled:opacity-50 transition-all">{t.chat_button_start}</button>
    </div>
  );

  // --- VISTA 2: ÉXITO (MENSAJE ACTUALIZADO) ---
  if (isSent) return (
    <div className="bg-gray-900 border border-green-500/30 p-10 rounded-xl text-center space-y-4 animate-in zoom-in duration-500">
      <div className="text-5xl mb-4">🐆</div>
      <h3 className="text-2xl font-bold text-white uppercase tracking-wider">
        ¡Solicitud Recibida!
      </h3>
      <p className="text-gray-400 text-lg leading-relaxed">
        Le estamos enviando la información a nuestro equipo técnico para la cotización estimada.
      </p>
      <div className="pt-4">
        <span className="text-xs text-blue-500 font-mono italic">Puma Code - Soluciones Tecnológicas</span>
      </div>
    </div>
  );

  // --- VISTA 3: CHAT ---
  return (
    <div className="bg-gray-900 border border-blue-500/30 p-6 rounded-xl shadow-2xl space-y-4">
      <div ref={scrollRef} className="h-96 overflow-y-auto space-y-4 p-2 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none'}`}>{m.content}</div>
          </div>
        ))}
      </div>
      
      {userMessageCount >= 4 && (
        <button onClick={sendRequestToRoberto} className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-gray-100 active:scale-95 transition-all shadow-xl mb-2">
          {t.chat_btn_quote}
        </button>
      )}

      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} className="flex-1 bg-black border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-blue-500 text-sm" placeholder={t.chat_placeholder} />
        <button onClick={sendMessage} disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-xl font-bold text-white transition-colors disabled:opacity-50">
          Send
        </button>
      </div>
    </div>
  );
}