"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PumaFace, { PumaFaceState } from "../PumaFace";
import { api } from "../../lib/adminApi";

/**
 * PumaAssistant — el asistente de voz + texto del panel de super admin.
 *
 * - Click en la cabeza: abre/cierra el chat.
 * - Mic chico dentro del chat: dispara una escucha activa (una pregunta).
 * - Ícono de mute: apaga/prende la escucha pasiva de "Hey Puma" (por
 *   privacidad — no queremos que el mic quede abierto sin que lo sepas).
 * - Input de texto: para consultarle sin hablar en voz alta.
 * - Después de cada respuesta, Puma se queda escuchando activamente unos
 *   segundos por si seguís la conversación — no hace falta repetir el
 *   wake word en cada pregunta.
 *
 * "Hey Puma" solo funciona con la pestaña abierta y en primer plano
 * (limitación real del navegador, no del código). El mic chico y el
 * texto no tienen esa limitación.
 */

type Turn = { role: "user" | "assistant"; content: string };
type Phase = "idle" | "listening" | "thinking" | "speaking" | "unsupported";

const WAKE_PATTERNS = [/\bhey\s*puma\b/i, /\bey\s*puma\b/i, /\beh\s*puma\b/i, /\bjei\s*puma\b/i];
const FOLLOW_UP_MS = 9000;
const WAKE_ACKS = ["¿Sí? Decime.", "Te escucho.", "Dale, contame.", "¿Qué necesitás?"];

// Palabras de corte — frases CORTAS nomás (2 palabras o menos), para no
// disparar por accidente cuando "para" aparece dentro de una pregunta
// normal ("¿cuál es el proyecto para Kalyber?" no debe cortar nada).
const STOP_WORDS = new Set([
  "stop", "para", "pará", "parar", "basta", "listo", "silencio",
  "callate", "cállate", "chau", "ya esta", "ya está",
]);
function isStopCommand(text: string) {
  const clean = text.trim().toLowerCase().replace(/[¿?¡!.,]/g, "");
  if (!clean) return false;
  const words = clean.split(/\s+/);
  return words.length <= 2 && STOP_WORDS.has(clean);
}

export default function PumaAssistant() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [wakeEnabled, setWakeEnabled] = useState(true);
  const [inputText, setInputText] = useState("");
  const [history, setHistory] = useState<Turn[]>([]);

  const recognitionRef = useRef<any>(null);
  const activeRef = useRef(false); // true mientras está en modo "comando activo" (post wake-word o mic manual)
  const historyRef = useRef<Turn[]>([]);
  const followUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false); // true cuando Roberto apretó "detener" — ignora la respuesta que venga en camino
  const suppressMicRef = useRef(false); // true mientras Puma está hablando — el mic se pausa para no escucharse a sí mismo
  const wakeEnabledRef = useRef(true); // espejo de wakeEnabled, para leerlo sin closures viejos dentro de speak()

  useEffect(() => {
    wakeEnabledRef.current = wakeEnabled;
  }, [wakeEnabled]);

  const faceState: PumaFaceState =
    phase === "listening" ? "listening" : phase === "thinking" ? "thinking" : phase === "speaking" ? "speaking" : "idle";

  const clearFollowUp = useCallback(() => {
    if (followUpTimerRef.current) {
      clearTimeout(followUpTimerRef.current);
      followUpTimerRef.current = null;
    }
  }, []);

  const goIdle = useCallback(() => {
    activeRef.current = false;
    clearFollowUp();
    setPhase("idle");
  }, [clearFollowUp]);

  // Corta todo en el acto: la voz si está hablando, la respuesta si
  // todavía viene en camino, y vuelve a reposo — para cuando Roberto
  // quiere pararla a mitad de algo, no importa en qué estado esté.
  const stopPuma = useCallback(() => {
    stoppedRef.current = true;
    suppressMicRef.current = false;
    window.speechSynthesis?.cancel();
    goIdle();
    // Si el mic estaba pausado por estar hablando, lo reactivamos ya
    // (salvo que esté muteado a propósito).
    if (wakeEnabledRef.current) {
      try { recognitionRef.current?.start(); } catch { /* ya estaba corriendo */ }
    }
  }, [goIdle]);

  // Después de que Puma responde, se queda escuchando activamente un rato
  // por si seguís la conversación, en vez de "dormirse" y pedirte el wake
  // word de nuevo en cada pregunta.
  const armFollowUp = useCallback(() => {
    activeRef.current = true;
    setPhase("listening");
    clearFollowUp();
    followUpTimerRef.current = setTimeout(goIdle, FOLLOW_UP_MS);
  }, [clearFollowUp, goIdle]);

  const speak = useCallback((text: string) => {
    setPhase("speaking");

    const synth = window.speechSynthesis;
    if (!synth) {
      setError("Tu navegador no soporta síntesis de voz.");
      armFollowUp();
      return;
    }

    // Pausamos el mic mientras Puma habla — si no, el reconocimiento
    // capta la propia voz de Puma saliendo por el parlante y se arruina
    // todo lo que decís apenas termina (justo lo que pasaba).
    suppressMicRef.current = true;
    try { recognitionRef.current?.stop(); } catch { /* no estaba corriendo */ }

    synth.cancel(); // corta cualquier lectura anterior colgada

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-AR";
    utterance.rate = 1.05;
    utterance.pitch = 0.85;

    const voices = synth.getVoices();
    const esVoice = voices.find((v) => v.lang.startsWith("es"));
    if (esVoice) utterance.voice = esVoice;

    const resumeMic = () => {
      suppressMicRef.current = false;
      if (!wakeEnabledRef.current) return; // estaba muteado — no lo reactivamos solo
      try { recognitionRef.current?.start(); } catch { /* ya estaba corriendo */ }
    };

    utterance.onend = () => {
      resumeMic();
      armFollowUp();
    };
    utterance.onerror = (e) => {
      // "canceled"/"interrupted" pasa cuando una lectura pisa a otra
      // (por ejemplo si la conversación fluida dispara una respuesta
      // nueva mientras la anterior todavía se estaba leyendo) — es
      // esperable, no un error real, así que no lo mostramos.
      const benign = e.error === "canceled" || e.error === "interrupted";
      resumeMic();
      if (benign) {
        armFollowUp();
        return;
      }
      console.error("Puma speak() — speechSynthesis falló:", e.error);
      setError("No se pudo reproducir la voz.");
      armFollowUp();
    };

    synth.speak(utterance);
  }, [armFollowUp]);

  const askPuma = useCallback(async (message: string) => {
    stoppedRef.current = false;
    setTranscript(message);
    setReply("");
    setError("");
    setPhase("thinking");
    setOpen(true);
    clearFollowUp();
    try {
      const res = await api<{ reply: string }>("/api/assistant/chat", {
        method: "POST",
        body: { message, history: historyRef.current },
      });
      if (stoppedRef.current) return; // apretaste "detener" mientras esperábamos — ignoramos esto
      const nextHistory = [
        ...historyRef.current,
        { role: "user" as const, content: message },
        { role: "assistant" as const, content: res.reply },
      ].slice(-10);
      historyRef.current = nextHistory;
      setHistory(nextHistory);
      setReply(res.reply);
      speak(res.reply);
    } catch (e) {
      if (stoppedRef.current) return;
      const msg = e instanceof Error ? e.message : "Puma no pudo responder.";
      setError(msg);
      goIdle();
    }
  }, [speak, clearFollowUp, goIdle]);

  // --- Reconocimiento de voz continuo (wake word + comando) ---
  useEffect(() => {
    if (!wakeEnabled) return; // muteado: no arrancamos el mic

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setPhase("unsupported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-AR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    let restartTimer: ReturnType<typeof setTimeout> | null = null;
    let commandTimer: ReturnType<typeof setTimeout> | null = null;

    recognition.onresult = (event: any) => {
      let finalChunk = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalChunk += chunk;
        else interim += chunk;
      }

      // Comando de corte — funciona en cualquier momento de una sesión
      // activa (escuchando, pensando O hablando), así podés interrumpir
      // una respuesta larga a mitad de camino diciendo "pará" o "stop".
      if (activeRef.current && (isStopCommand(finalChunk) || isStopCommand(interim))) {
        stopPuma();
        return;
      }

      if (!activeRef.current) {
        // Modo dormido: solo buscamos la wake word.
        const heard = (finalChunk + " " + interim).trim();
        const wakeMatch = WAKE_PATTERNS.find((re) => re.test(heard));
        if (!wakeMatch) return;

        activeRef.current = true;
        setPhase("listening");
        setOpen(true);
        setError("");
        clearFollowUp();

        // Si dijiste todo junto ("hey puma, ¿qué...?"), NO cortamos acá —
        // seguimos de largo hacia el bloque de modo activo de abajo, con
        // el mismo resultado, para no perder la pregunta.
        const afterWake = heard.replace(wakeMatch, "").trim();
        if (!afterWake) {
          // Dijiste solo "hey puma" y nada más (todavía) — le devolvemos
          // una señal de que te está escuchando, en vez de silencio.
          setTranscript("");
          setReply("");
          speak(WAKE_ACKS[Math.floor(Math.random() * WAKE_ACKS.length)]);
          return;
        }
        setTranscript("");
        setReply("");
      }

      // Modo activo: cualquier cosa que escuchemos cancela el timer de
      // "se cerró la conversación" — todavía estás ahí, hablando.
      clearFollowUp();

      const soFar = (finalChunk || interim).replace(/hey\s*puma/i, "").trim();
      if (soFar) setTranscript(soFar);

      if (finalChunk.trim()) {
        if (commandTimer) clearTimeout(commandTimer);
        commandTimer = setTimeout(() => {
          const clean = finalChunk.replace(/hey\s*puma/i, "").trim();
          if (clean) askPuma(clean);
          else goIdle();
        }, 900);
      }
    };

    recognition.onerror = () => {
      // Chrome corta el reconocimiento por silencio/error de mic seguido;
      // lo reintentamos solo, sin molestar a Roberto con un error visible.
    };

    recognition.onend = () => {
      if (suppressMicRef.current) return; // Puma está hablando — el mic se reactiva solo cuando termine (ver speak())
      restartTimer = setTimeout(() => {
        try { recognition.start(); } catch { /* ya estaba corriendo */ }
      }, 300);
    };

    try {
      recognition.start();
    } catch {
      setPhase("unsupported");
    }

    return () => {
      if (restartTimer) clearTimeout(restartTimer);
      if (commandTimer) clearTimeout(commandTimer);
      recognition.onend = null;
      recognition.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wakeEnabled]);

  const handleFaceClick = () => setOpen((o) => !o);

  const handleMicButton = () => {
    setOpen(true);
    activeRef.current = true;
    setPhase("listening");
    setTranscript("");
    setReply("");
    setError("");
    clearFollowUp();
  };

  const toggleMute = () => {
    if (wakeEnabled) {
      // Al mutear cortamos cualquier conversación activa y la síntesis en curso.
      window.speechSynthesis?.cancel();
      goIdle();
      setError("");
    }
    setWakeEnabled((v) => !v);
  };

  const handleSendText = () => {
    const msg = inputText.trim();
    if (!msg) return;
    setInputText("");
    askPuma(msg);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[340px] rounded-2xl border border-white/10 bg-[#0b0b0f]/95 backdrop-blur-xl shadow-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 shrink-0">
                <PumaFace state={faceState} />
              </div>
              <span className="text-xs font-bold tracking-wide uppercase text-blue-400">Puma</span>
              <button
                onClick={toggleMute}
                title={wakeEnabled ? "Silenciar \"Hey Puma\"" : "Activar \"Hey Puma\""}
                className={`text-xs border rounded-full px-2 py-0.5 transition ${
                  wakeEnabled
                    ? "text-slate-400 border-white/10 hover:text-white"
                    : "text-red-400 border-red-500/30 bg-red-500/10"
                }`}
              >
                {wakeEnabled ? "🎙️" : "🔇"}
              </button>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
          </div>

          {!wakeEnabled && (
            <p className="text-[10px] text-red-400/80 mb-2">"Hey Puma" está silenciado — solo responde por texto o con el mic de acá abajo.</p>
          )}

          <div className="max-h-64 overflow-y-auto space-y-3 mb-3 pr-1">
            {history.slice(-6).map((t, i) => (
              <p key={i} className={`text-sm leading-relaxed ${t.role === "user" ? "text-slate-400" : "text-white"}`}>
                <span className="text-slate-600">{t.role === "user" ? "Vos: " : ""}</span>{t.content}
              </p>
            ))}
            {transcript && phase !== "idle" && !history.some((t) => t.content === transcript) && (
              <p className="text-sm text-slate-300"><span className="text-slate-600">Vos: </span>{transcript}</p>
            )}
            {phase === "thinking" && !reply && <p className="text-sm text-slate-500 italic">pensando...</p>}
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>

          <div className="flex items-center gap-2">
            {phase === "listening" || phase === "thinking" || phase === "speaking" ? (
              <button
                onClick={stopPuma}
                title="Detener"
                className="shrink-0 w-8 h-8 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center justify-center text-sm transition"
              >
                ⏹
              </button>
            ) : (
              <button
                onClick={handleMicButton}
                title="Hablar"
                className="shrink-0 w-8 h-8 rounded-full border border-white/10 hover:border-blue-500/50 flex items-center justify-center text-sm transition"
              >
                🎤
              </button>
            )}
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendText()}
              placeholder="Escribile a Puma..."
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50"
            />
            <button
              onClick={handleSendText}
              disabled={!inputText.trim()}
              className="shrink-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 flex items-center justify-center text-sm transition"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {phase === "unsupported" && wakeEnabled && (
        <p className="text-[10px] text-slate-600 bg-[#0b0b0f]/90 border border-white/10 rounded-full px-3 py-1">
          Tu navegador no soporta reconocimiento de voz — probá en Chrome.
        </p>
      )}

      <button
        onClick={handleFaceClick}
        className="relative w-20 h-20 rounded-full border border-white/10 bg-[#0b0b0f]/90 backdrop-blur-xl shadow-xl hover:border-blue-500/50 transition"
        title="Abrir chat con Puma"
      >
        <PumaFace state={faceState} />
        {!wakeEnabled && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-[#0b0b0f] flex items-center justify-center text-[8px] z-10">
            🔇
          </span>
        )}
      </button>
    </div>
  );
}
