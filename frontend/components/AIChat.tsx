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
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasWelcomed = useRef(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio('/notify.mp3');
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const bestVoice = voices.find(v => 
          v.lang.startsWith(lang) && (v.name.includes('Google') || v.name.includes('Natural'))
        ) || voices.find(v => v.lang.startsWith(lang));
        if (bestVoice) voiceRef.current = bestVoice;
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [lang]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // FILTRO DE VOZ ESTRICTO (Solo puntos y comas)
  const cleanTextForSpeech = (text: string) => {
    return text
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,]/g, '')
      .replace(/[*#_~]/g, '')
      .trim();
  };

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !isVoiceEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(text));
    if (voiceRef.current) utterance.voice = voiceRef.current;
    utterance.lang = lang === 'es' ? 'es-ES' : 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handleListen = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'es' ? 'es-AR' : 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? " " : "") + transcript);
    };
    recognition.start();
  };

  // Función para resetear y cerrar todo
  const resetChat = () => {
    setIsIdentified(false);
    setIsSent(false);
    setMessages([]);
    hasWelcomed.current = false;
    setInput("");
  };

  useEffect(() => {
    if (isIdentified && !hasWelcomed.current && messages.length === 0) {
      hasWelcomed.current = true;
      const welcomeText = (t.chat_welcome || "Hola {name}").replace("{name}", userData.name);
      setMessages([{ role: "assistant", content: welcomeText }]);
      audioRef.current?.play().catch(() => {});
    }
  }, [isIdentified, userData.name, t.chat_welcome]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    try {
      const RAW_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, "");
      const res = await fetch(`${RAW_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, userData, language: lang }),
      });
      const data = await res.json();
      if (data?.reply) {
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
        audioRef.current?.play().catch(() => {});
        speak(data.reply);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const sendRequestToRoberto = async () => {
    if (loading) return;
    setIsSent(true);
    setLoading(true);
    try {
      const RAW_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, "");
      await fetch(`${RAW_URL}/api/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory: messages, userData }),
      });
    } catch (e) { console.log("Reporte enviado"); } finally { setLoading(false); }
  };

  // --- VISTA DE ÉXITO (MODAL CON X) ---
  if (isSent) return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-[100] backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-gray-900 border border-blue-500/20 p-10 rounded-3xl text-center shadow-2xl animate-in zoom-in duration-300">
        
        {/* BOTÓN X PARA CERRAR */}
        <button 
          onClick={resetChat} 
          className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors p-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex justify-center mb-6">
          <img src="/logotrans.png" alt="Logo" className="w-32 h-auto object-contain" />
        </div>

        <h3 className="text-2xl font-bold text-white uppercase mb-4 tracking-tight">{t.chat_success_title}</h3>
        <p className="text-gray-400 mb-8 leading-relaxed text-sm">{t.chat_success_desc}</p>
        
        <button 
          onClick={resetChat} 
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          {lang === 'es' ? 'Volver al Inicio' : 'Back to Home'}
        </button>
      </div>
    </div>
  );

  // --- VISTA DE LOGIN ---
  if (!isIdentified) return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-blue-500/30 p-8 rounded-3xl shadow-2xl">
        <div className="flex justify-center mb-8">
          <img src="/logotrans.png" alt="Logo" className="w-44 h-auto" />
        </div>
        <div className="space-y-4">
          <input className="w-full p-4 bg-black border border-gray-700 rounded-xl text-white outline-none focus:border-blue-500 text-lg" placeholder={t.chat_form_name} value={userData.name} onChange={(e) => setUserData({...userData, name: e.target.value})} />
          <input className="w-full p-4 bg-black border border-gray-700 rounded-xl text-white outline-none focus:border-blue-500 text-lg" placeholder={t.chat_form_email} value={userData.email} onChange={(e) => setUserData({...userData, email: e.target.value})} />
          <button onClick={() => setIsIdentified(true)} disabled={!userData.name || !userData.email} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-lg transition-all shadow-lg shadow-blue-500/20">{t.chat_button_start}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-40 md:relative md:inset-auto md:h-[650px] md:max-w-2xl md:mx-auto md:rounded-3xl md:border md:border-blue-500/30 overflow-hidden shadow-2xl">
      <button onClick={resetChat} className="absolute top-4 right-16 text-gray-600 hover:text-white z-50 md:hidden">✕</button>

      <div className="flex justify-between items-center bg-gray-900 px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <img src="/logotrans.png" alt="Logo" className="w-8 h-auto" />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Strategic AI Agent</span>
        </div>
        <button onClick={() => { setIsVoiceEnabled(!isVoiceEnabled); window.speechSynthesis.cancel(); }} className={`p-2.5 rounded-xl transition-all ${isVoiceEnabled ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-800 text-gray-500'}`}>
          {isVoiceEnabled ? '🔊' : '🔈'}
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 bg-black custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-[15px] leading-relaxed shadow-xl ${m.role === 'user' ? 'bg-blue-700 text-white rounded-tr-none shadow-blue-900/20' : 'bg-gray-900 text-gray-200 border border-gray-800 rounded-tl-none'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-blue-500 text-[10px] font-mono tracking-widest uppercase ml-2 animate-pulse">Analizando requerimientos...</div>}
      </div>
      
      <div className="p-4 bg-gray-900 border-t border-gray-800 space-y-4">
        {messages.filter(m => m.role === 'user').length >= 6 && (
          <button onClick={sendRequestToRoberto} className="w-full py-4 bg-white text-black font-black rounded-xl uppercase text-[11px] tracking-widest shadow-xl hover:bg-gray-200 active:scale-95 transition-all">
            {t.chat_btn_quote}
          </button>
        )}

        <div className="flex gap-3 items-center">
          <button onClick={handleListen} className={`flex-none w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 ${isListening ? 'bg-red-600 border-red-500 animate-pulse text-white' : 'bg-gray-800 border-gray-700 text-gray-400 active:bg-gray-700'}`}>
            {isListening ? '🛑' : '🎤'}
          </button>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} className="flex-1 bg-black border border-gray-700 p-4 rounded-2xl text-white outline-none focus:border-blue-500 text-base shadow-inner" placeholder={t.chat_placeholder} />
          <button onClick={sendMessage} disabled={loading || !input.trim()} className="flex-none w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white disabled:opacity-20 active:scale-95 transition-all shadow-lg shadow-blue-500/20">
             <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}