"use client";
import { useState, useEffect, useRef } from 'react';

interface AIChatProps { lang: string; t: any; onClose: () => void; }

export default function AIChat({ lang, t, onClose }: AIChatProps) {
  const [step, setStep] = useState<'welcome' | 'register' | 'chat' | 'success'>('welcome');
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ name: '', email: '' });
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio('/notify.mp3');
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        voiceRef.current = voices.find(v => v.lang.startsWith(lang)) || voices[0] || null;
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [lang]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleStartAudio = () => {
    const silentUtterance = new SpeechSynthesisUtterance("");
    window.speechSynthesis.speak(silentUtterance);
    if (audioRef.current) {
      audioRef.current.play().then(() => { audioRef.current?.pause(); audioRef.current!.currentTime = 0; }).catch(() => {});
    }
    setIsVoiceEnabled(true);
    setStep('register');
  };

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !isVoiceEnabled) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_~]/g, '').replace(/[^\w\sñáéíóúü,.?¡!]/gi, ''); 
    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (voiceRef.current) utterance.voice = voiceRef.current;
    const langCodes: any = { es: 'es-ES', en: 'en-US', pt: 'pt-BR', it: 'it-IT', de: 'de-DE', ja: 'ja-JP' };
    utterance.lang = langCodes[lang] || 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleListen = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'es' ? 'es-AR' : 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => setInput(prev => prev + (prev ? " " : "") + e.results[0][0].transcript);
    recognition.start();
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/ai/chat`, {
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

  const handleQuoteRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory: messages, userData, language: lang }),
      });
      if (res.ok) {
        setStep('success');
        speak(t.chat_success_title);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // Botón de cierre reutilizable
  const CloseButton = () => (
    <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors group">
      <div className="relative">
        <svg className="w-8 h-8 group-active:scale-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Overlay con blur profundo */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[20px]" onClick={onClose}></div>
      
      <div className="relative z-[10000] w-full max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
        
        {/* PANTALLA BIENVENIDA */}
        {step === 'welcome' && (
          <div className="glass-effect p-10 rounded-[3rem] text-center shadow-2xl relative animate-in zoom-in duration-300 neon-border">
            <CloseButton />
            <div className="mb-8 relative inline-block">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
              <img src="/logotrans.png" alt="Logo" className="w-24 relative z-10" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase mb-8 tracking-tighter leading-tight italic">
              {t.chat_title}
            </h2>
            <button onClick={handleStartAudio} className="btn-futuristic w-full py-5 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                {t.chat_button_start}
            </button>
          </div>
        )}

        {/* REGISTRO */}
        {step === 'register' && (
          <div className="glass-effect p-10 rounded-[3rem] shadow-2xl relative animate-in fade-in duration-300 text-center neon-border">
            <CloseButton />
            <img src="/logotrans.png" alt="Logo" className="w-20 mx-auto mb-8 opacity-80" />
            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <input className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all text-sm" placeholder={t.chat_form_name} value={userData.name} onChange={(e) => setUserData({...userData, name: e.target.value})} />
              </div>
              <div className="space-y-1 text-left">
                <input className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all text-sm" placeholder={t.chat_form_email} value={userData.email} onChange={(e) => setUserData({...userData, email: e.target.value})} />
              </div>
              <button onClick={() => setStep('chat')} disabled={!userData.name || !userData.email} className="btn-futuristic w-full py-5 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-[0.2em] disabled:opacity-20 transition-all mt-4">
                {t.chat_button_start}
              </button>
            </div>
          </div>
        )}

        {/* CHAT INTERFAZ */}
        {step === 'chat' && (
          <div className="h-[85vh] md:h-[700px] flex flex-col glass-effect rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-8 duration-500 neon-border">
            {/* Header del Chat */}
            <div className="flex justify-between items-center bg-white/5 px-6 py-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#2563eb]"></div>
                <div className="flex flex-col">
                  <span className="text-white font-black text-xs uppercase tracking-widest italic">{t.chat_title}</span>
                  <span className="text-[9px] text-blue-500 font-bold tracking-widest uppercase opacity-80">AI Neural Link</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setIsVoiceEnabled(!isVoiceEnabled); window.speechSynthesis.cancel(); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isVoiceEnabled ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-gray-500 bg-white/5 border border-white/10'}`}>
                  {isVoiceEnabled ? '🔊' : '🔈'}
                </button>
                <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Mensajes */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent custom-scrollbar scroll-smooth">
              {/* Saludo Puma */}
              <div className="flex justify-start">
                <div className="max-w-[85%] p-4 bg-white/5 border border-white/10 rounded-2xl rounded-tl-none text-[14px] text-gray-300 leading-relaxed">
                  {t.chat_welcome.replace("{name}", userData.name)}
                </div>
              </div>

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-[14px] leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-lg font-medium' : 'bg-white/5 text-gray-300 border border-white/10 rounded-tl-none'}`}>
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 ml-1">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-blue-500/60 text-[9px] font-black uppercase tracking-[0.2em]">Processing link...</span>
                </div>
              )}

              {messages.length >= 6 && step === 'chat' && (
                <div className="flex justify-center pt-4 animate-in zoom-in duration-500">
                   <button onClick={handleQuoteRequest} disabled={loading} className="w-full py-5 bg-gradient-to-r from-blue-700 to-blue-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-900/20 active:scale-95 disabled:opacity-50 transition-all border border-blue-400/20">
                      {loading ? "ANALYZING DATA..." : t.chat_btn_quote}
                   </button>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-5 bg-white/5 border-t border-white/5 pb-safe-offset-4 flex gap-3 items-center">
                <button onClick={handleListen} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse text-white' : 'bg-white/5 border border-white/10 text-gray-500 hover:text-gray-300'}`}>
                  <span className="text-lg">🎤</span>
                </button>
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all text-sm placeholder:text-gray-600" placeholder={t.chat_placeholder} />
                <button onClick={sendMessage} className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all shadow-lg shadow-blue-900/40">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                </button>
            </div>
          </div>
        )}

        {/* PANTALLA ÉXITO */}
        {step === 'success' && (
          <div className="glass-effect p-12 rounded-[3rem] text-center shadow-2xl relative animate-in zoom-in duration-500 neon-border">
            <CloseButton />
            <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-500/20 relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse"></div>
              <svg className="w-12 h-12 text-blue-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-black text-white uppercase mb-4 tracking-tighter italic">
              {t.chat_success_title}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-10 opacity-80 uppercase tracking-widest text-[11px] font-bold">
              {t.chat_success_desc}
            </p>
            <button onClick={onClose} className="btn-futuristic w-full py-5 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-[0.2em] shadow-lg shadow-blue-900/40">
              {t.chat_success_close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}