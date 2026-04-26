"use client";
import { useState, useEffect, useRef } from 'react';

interface AIChatProps { lang: string; t: any; onClose: () => void; }

export default function AIChat({ lang, t, onClose }: AIChatProps) {
  const [step, setStep] = useState<'welcome' | 'register' | 'chat'>('welcome');
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ name: '', email: '' });
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // 1. GESTIÓN DE AUDIO Y VOCES
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio('/notify.mp3');
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        voiceRef.current = voices.find(v => v.lang.startsWith(lang) && (v.name.includes('Google') || v.name.includes('Natural'))) || voices.find(v => v.lang.startsWith(lang)) || null;
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [lang]);

  // 2. AUTO-SCROLL
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  // --- REPARACIÓN PARA MÓVILES: ACTIVADOR DE VOZ ---
  const handleStartAudio = () => {
    // 1. Habilitar la voz con un mensaje vacío (desbloquea el motor en iOS/Android)
    const silentUtterance = new SpeechSynthesisUtterance("");
    window.speechSynthesis.speak(silentUtterance);
    
    // 2. Habilitar el sonido de notificación
    if (audioRef.current) {
        audioRef.current.play().then(() => {
            audioRef.current?.pause();
            audioRef.current!.currentTime = 0;
        }).catch(() => {});
    }
    
    setIsVoiceEnabled(true);
    setStep('register');
  };

  // 3. TEXT-TO-SPEECH (REPARADO CON IDIOMAS)
  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !isVoiceEnabled) return;
    
    window.speechSynthesis.cancel(); // Limpia cola de mensajes
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_~]/g, ''));
    
    if (voiceRef.current) utterance.voice = voiceRef.current;
    
    // Mapeo preciso de idiomas
    const langCodes: any = { es: 'es-ES', en: 'en-US', pt: 'pt-BR', ja: 'ja-JP', zh: 'zh-CN' };
    utterance.lang = langCodes[lang] || 'es-ES';
    utterance.rate = 1.0; // Velocidad normal
    utterance.volume = 1.0; // Volumen al máximo

    window.speechSynthesis.speak(utterance);
  };

  // 4. SPEECH-TO-TEXT (MICRÓFONO)
  const handleListen = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    const langCodes: any = { es: 'es-AR', en: 'en-US', pt: 'pt-BR', ja: 'ja-JP', zh: 'zh-CN' };
    recognition.lang = langCodes[lang] || 'es-ES';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => setInput(prev => prev + (prev ? " " : "") + e.results[0][0].transcript);
    recognition.start();
  };

  // 5. ENVÍO AL BACKEND
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative z-[10000] w-full max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
        
        {/* STEP 1: WELCOME (BOTÓN REPARADO) */}
        {step === 'welcome' && (
          <div className="bg-gray-900 border border-white/10 p-10 rounded-[3rem] text-center shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <img src="/logotrans.png" alt="Logo" className="w-28 mx-auto mb-8" />
            <h2 className="text-2xl font-black text-white uppercase mb-10 tracking-tighter">{t.chat_title}</h2>
            {/* ESTE BOTÓN DESBLOQUEA EL AUDIO EN MÓVILES */}
            <button onClick={handleStartAudio} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-widest active:scale-95 shadow-lg shadow-blue-500/20">
                {t.chat_button_start}
            </button>
          </div>
        )}

        {/* STEP 2: REGISTER */}
        {step === 'register' && (
          <div className="bg-gray-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative animate-in fade-in duration-200">
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            <div className="space-y-4 pt-6">
              <input className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500" placeholder={t.chat_form_name} value={userData.name} onChange={(e) => setUserData({...userData, name: e.target.value})} />
              <input className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500" placeholder={t.chat_form_email} value={userData.email} onChange={(e) => setUserData({...userData, email: e.target.value})} />
              <button onClick={() => setStep('chat')} disabled={!userData.name || !userData.email} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl active:scale-95 disabled:opacity-30">
                {t.chat_button_start}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CHAT */}
        {step === 'chat' && (
          <div className="h-[85vh] md:h-[650px] bg-black flex flex-col rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center bg-gray-900 px-6 py-4 border-b border-white/5">
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm">{t.chat_title}</span>
                <span className="text-[10px] text-blue-500 uppercase font-black italic">Puma AI Agent</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setIsVoiceEnabled(!isVoiceEnabled); window.speechSynthesis.cancel(); }} className={`p-2 rounded-lg ${isVoiceEnabled ? 'bg-blue-600 text-white' : 'text-gray-500 bg-white/5'}`}>{isVoiceEnabled ? '🔊' : '🔈'}</button>
                <button onClick={onClose} className="p-2 text-gray-500 hover:text-white"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 bg-black custom-scrollbar scroll-smooth">
              <div className="flex justify-start">
                <div className="max-w-[85%] p-4 bg-gray-800/50 border border-blue-500/20 rounded-2xl rounded-tl-none text-[15px] text-gray-200">
                  {t.chat_welcome.replace("{name}", userData.name)}
                </div>
              </div>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-[15px] ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-100 border border-white/5 rounded-tl-none'}`}>{m.content}</div>
                </div>
              ))}
              {loading && <div className="text-blue-500 text-[10px] font-black animate-pulse uppercase tracking-[0.2em] ml-2">Puma thinking...</div>}
            </div>

            <div className="p-4 bg-gray-900 border-t border-white/5 pb-safe">
              <div className="flex gap-2 items-center">
                <button onClick={handleListen} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-red-600 animate-pulse text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]' : 'bg-white/5 border border-white/10 text-gray-400'}`}>🎤</button>
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} className="flex-1 bg-white/5 border border-white/10 p-3 rounded-2xl text-white outline-none focus:border-blue-500" placeholder={t.chat_placeholder} />
                <button onClick={sendMessage} className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white active:scale-95 shadow-lg shadow-blue-500/20"><svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}