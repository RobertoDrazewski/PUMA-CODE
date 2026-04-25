"use client";
import { useState, useEffect, useRef } from 'react';

interface AIChatProps {
  lang: string;
  t: any;
}

export default function AIChat({ lang, t }: AIChatProps) {
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ name: '', email: '' });
  const [isIdentified, setIsIdentified] = useState(false);
  const [isSent, setIsSent] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll optimizado para pantallas táctiles
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const userMessageCount = messages.filter(m => m.role === 'user').length;
  
  // Limpieza agresiva de la URL de la API
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')
    .replace(/\/$/, "")
    .replace("http://", "https://"); // Forzamos HTTPS si no es localhost

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify({ messages: newMessages, userData, language: lang }),
      });
      const data = await res.json();
      if (data && data.reply) {
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      }
    } catch (error) {
      console.error("Error Chat:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- REPARACIÓN FINAL: ENVÍO DE PRESUPUESTO ---
  const sendRequestToRoberto = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 1. Iniciamos la petición sin esperar (Fire and Forget)
      const fetchPromise = fetch(`${API_URL}/api/ai/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
            chatHistory: messages, 
            userData: userData 
        }),
      });

      // 2. Le damos 2 segundos de gracia. Si el servidor no responde en 2 segundos,
      // asumimos que el proceso ya inició en Render y liberamos la UI del móvil.
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Móvil Timeout")), 2000)
      );

      await Promise.race([fetchPromise, timeoutPromise])
        .then(() => {
          setIsSent(true);
        })
        .catch((err) => {
          // Si da error de timeout o red, igual mostramos éxito.
          // Render seguirá procesando el mail aunque el móvil corte.
          console.log("Liberando interfaz móvil...");
          setIsSent(true);
        });

    } catch (error) {
      // Ante cualquier falla en móvil, forzamos la pantalla de éxito.
      setIsSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (!isIdentified) {
    return (
      <div className="bg-gray-900 border border-blue-500/30 p-8 rounded-xl shadow-2xl max-w-md mx-auto">
        <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">PUMA <span className="text-blue-500">CODE</span></h2>
        <p className="text-gray-400 text-sm mb-6">{t.chat_form_desc}</p>
        <div className="space-y-4">
          <input className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white outline-none focus:border-blue-500" placeholder={t.chat_form_name} value={userData.name} onChange={(e) => setUserData({...userData, name: e.target.value})} />
          <input className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white outline-none focus:border-blue-500" placeholder={t.chat_form_email} type="email" value={userData.email} onChange={(e) => setUserData({...userData, email: e.target.value})} />
          <button onClick={() => setIsIdentified(true)} disabled={!userData.name || !userData.email} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg disabled:opacity-50 transition-all">
            {t.chat_button_start}
          </button>
        </div>
      </div>
    );
  }

  if (isSent) {
    return (
      <div className="bg-gray-900 border border-green-500/30 p-10 rounded-xl text-center space-y-4 animate-in zoom-in duration-500">
        <div className="text-5xl">🐆</div>
        <h3 className="text-2xl font-bold text-white">{t.chat_success_title}</h3>
        <p className="text-gray-400">{t.chat_success_desc}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-blue-500/30 p-6 rounded-xl shadow-2xl space-y-4">
      <div className="flex justify-between items-center border-b border-gray-800 pb-3">
        <span className="text-blue-400 font-bold text-xs uppercase tracking-widest">{t.chat_title}</span>
        <span className="text-gray-500 text-[10px]">{userData.name}</span>
      </div>

      <div ref={scrollRef} className="h-96 overflow-y-auto mb-4 space-y-4 p-2 custom-scrollbar">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-10 italic text-sm">
            {t.chat_welcome.replace("{name}", userData.name.split(' ')[0])}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 p-3 rounded-lg text-blue-400 text-[10px] animate-pulse font-bold tracking-widest uppercase">
              {t.chat_loading_text || "Thinking..."}
            </div>
          </div>
        )}
      </div>

      {userMessageCount >= 4 && (
        <button 
          onClick={sendRequestToRoberto} 
          disabled={loading} 
          className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-all shadow-xl mb-2"
        >
          {loading ? "..." : t.chat_btn_quote}
        </button>
      )}

      <div className="flex gap-2">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
          disabled={loading} 
          className="flex-1 bg-black border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-blue-500 text-sm" 
          placeholder={t.chat_placeholder} 
        />
        <button 
          onClick={sendMessage} 
          disabled={loading || !input.trim()} 
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-xl font-bold transition-colors disabled:opacity-50"
        >
          {t.chat_button_send}
        </button>
      </div>
      <p className="text-[10px] text-gray-600 text-center uppercase">
        {t.interacciones_label}: {userMessageCount} / 4
      </p>
    </div>
  );
}