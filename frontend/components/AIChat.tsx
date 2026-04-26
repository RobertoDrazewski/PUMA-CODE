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

  // Inicialización de sonidos y voces
  useEffect(() => {
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
  }, [lang]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !isVoiceEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) utterance.voice = voiceRef.current;
    utterance.lang = lang === 'es' ? 'es-ES' : (lang === 'en' ? 'en-US' : lang);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleListen = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'es' ? 'es-AR' : 'en-US';
    recognition.start();
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? " " : "") + transcript);
    };
  };

  // Bienvenida inicial
  useEffect(() => {
    if (isIdentified && !hasWelcomed.current && messages.length === 0) {
      hasWelcomed.current = true;
      const welcomeText = t.chat_welcome.replace("{name}", userData.name);
      setMessages([{ role: "assistant", content: welcomeText }]);
      audioRef.current?.play().catch(() => {});
    }
  }, [isIdentified, userData.name, t.chat_welcome]);

  const RAW_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, "");
  const API_URL = RAW_URL.includes('localhost') ? RAW_URL : RAW_URL.replace("http://", "https://");

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
      await fetch(`${API_URL}/api/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory: messages, userData }),
      });
    } catch (e) { console.log("Enviado..."); } finally { setLoading(false); }
  };

  if (!isIdentified) return (
    <div className="bg-gray-900 border border-blue-500/30 p-8 rounded-xl shadow-2xl max-w-md mx-auto">
      <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">PUMA <span className="text-blue-500">CODE</span></h2>
      <input className="w-full p-3 mb-4 bg-black border border-gray-700 rounded-lg text-white outline-none focus:border-blue-500" placeholder={t.chat_form_name} value={userData.name} onChange={(e) => setUserData({...userData, name: e.target.value})} />
      <input className="w-full p-3 mb-6 bg-black border border-gray-700 rounded-lg text-white outline-none focus:border-blue-500" placeholder={t.chat_form_email} value={userData.email} onChange={(e) => setUserData({...userData, email: e.target.value})} />
      <button onClick={() => setIsIdentified(true)} disabled={!userData.name || !userData.email} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all">{t.chat_button_start}</button>
    </div>
  );

  if (isSent) return (
    <div className="bg-gray-900 border border-green-500/30 p-10 rounded-xl text-center space-y-4 animate-in zoom-in duration-500">
      <div className="text-5xl mb-4">🐆</div>
      <h3 className="text-2xl font-bold text-white uppercase">{t.chat_success_title}</h3>
      <p className="text-gray-400">{t.chat_success_desc}</p>
    </div>
  );

  return (
    <div className="bg-gray-900 border border-blue-500/30 p-6 rounded-xl shadow-2xl space-y-4">
      <div className="flex justify-between items-center border-b border-gray-800 pb-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t.chat_title}</span>
        <button onClick={() => { setIsVoiceEnabled(!isVoiceEnabled); window.speechSynthesis.cancel(); }} className={`p-1 rounded-md transition-all ${isVoiceEnabled ? 'text-blue-400 bg-blue-500/10' : 'text-gray-600'}`}>
          {isVoiceEnabled ? '🔊' : '🔈'}
        </button>
      </div>

      <div ref={scrollRef} className="h-96 overflow-y-auto space-y-4 p-2 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-md' : 'bg-gray-800 text-gray-200 rounded-tl-none shadow-lg'}`}>{m.content}</div>
          </div>
        ))}
        {loading && <div className="text-blue-500 text-xs italic animate-pulse">Puma Code is thinking...</div>}
      </div>
      
      {messages.filter(m => m.role === 'user').length >= 6 && (
        <button onClick={sendRequestToRoberto} className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-gray-100 transition-all uppercase text-xs">
          {t.chat_btn_quote}
        </button>
      )}

      <div className="flex gap-2">
        <button onClick={handleListen} className={`px-4 rounded-xl transition-all border ${isListening ? 'bg-red-600 border-red-500 animate-pulse text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}>
          {isListening ? '🛑' : '🎤'}
        </button>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} className="flex-1 bg-black border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-blue-500 text-sm" placeholder={t.chat_placeholder} />
        <button onClick={sendMessage} disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-xl font-bold text-white transition-colors disabled:opacity-50 uppercase text-xs">
          {t.chat_button_send}
        </button>
      </div>
    </div>
  );
}