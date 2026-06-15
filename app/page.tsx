'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import HoloCore from '@/components/HoloCore';

const API_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  : 'http://localhost:8000';

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [booted, setBooted] = useState(false);
  const [currentTime, setCurrentTime] = useState('--:--:--');
  const [statusText, setStatusText] = useState('INITIALIZING');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cloudMode, setCloudMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setBooted(true);
      setStatusText('ONLINE');
    }, 2000);
    setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    // Detect if running on cloud (no localhost)
    if (API_URL !== 'http://localhost:8000') {
      setCloudMode(true);
    }
    return () => clearInterval(timer);
  }, []);

  const sendToJarvis = async (audioBlob?: Blob, text?: string) => {
    setIsProcessing(true);
    setStatusText('PROCESSING');
    stopSpeaking();
    
    try {
      let data: any;
      
      if (cloudMode && text) {
        // Cloud mode: send text
        const res = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        data = await res.json();
        setTranscript(text);
        setResponse(data.message || '');
      } else if (audioBlob) {
        // Local mode: send audio
        const formData = new FormData();
        formData.append('file', audioBlob, 'command.wav');
        const res = await fetch(`${API_URL}/api/voice-command`, {
          method: 'POST',
          body: formData,
        });
        data = await res.json();
        setTranscript(data.transcript || '');
        setResponse(data.response?.message || '');
      }
      
      setStatusText('ONLINE');

      if (data?.audio_response) {
        const ab = new Blob(
          [Uint8Array.from(atob(data.audio_response), c => c.charCodeAt(0))],
          { type: 'audio/mp3' }
        );
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = URL.createObjectURL(ab);
        if (audioRef.current) {
          audioRef.current.src = audioUrlRef.current;
          audioRef.current.onplay = () => setIsSpeaking(true);
          audioRef.current.onended = () => setIsSpeaking(false);
          audioRef.current.onpause = () => setIsSpeaking(false);
          audioRef.current.play();
        }
      }
    } catch (error) {
      setResponse('Connection interrupted, sir.');
      setStatusText('ERROR');
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { channelCount: 1, sampleRate: 16000 } 
      });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        if (blob.size > 500) await sendToJarvis(blob);
        else { setIsProcessing(false); setStatusText('ONLINE'); }
      };
      mediaRecorder.start();
    } catch (error) {
      console.error('Mic error:', error);
      setIsListening(false);
      setStatusText('ONLINE');
    }
  }, [cloudMode]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
      if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null; }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      sendToJarvis(undefined, textInput.trim());
      setTextInput('');
    }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isProcessing && booted && !cloudMode) {
        e.preventDefault();
        setIsListening(true);
        setStatusText('LISTENING');
        startRecording();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isListening && !cloudMode) {
        e.preventDefault();
        setIsListening(false);
        stopRecording();
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [isProcessing, booted, isListening, cloudMode, startRecording, stopRecording]);

  const handleMicClick = () => {
    if (isProcessing || cloudMode) return;
    if (!isListening) { setIsListening(true); setStatusText('LISTENING'); startRecording(); }
    else { setIsListening(false); stopRecording(); }
  };

  return (
    <div className="h-screen w-screen bg-black text-[#ff6a00] font-mono overflow-hidden select-none">
      <audio ref={audioRef} className="hidden" />

      {!booted && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full border-2 border-[#ff6a00] mx-auto mb-6 animate-pulse flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border border-[#ff6a00]/50 animate-spin" />
            </div>
            <p className="text-[#ff6a00]/60 text-xs tracking-[0.4em] animate-pulse">INITIALIZING J.A.R.V.I.S.</p>
          </div>
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.02]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #ff6a00 2px, #ff6a00 4px)' }} />

      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-[#ff6a00]/30" />
        <div className="absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2 border-[#ff6a00]/30" />
        <div className="absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2 border-[#ff6a00]/30" />
        <div className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-[#ff6a00]/30" />
        <span className="absolute top-4 left-24 text-[7px] tracking-[0.4em] text-[#ff6a00]/20">SYS::NOMINAL</span>
        <span className="absolute top-4 right-24 text-[7px] tracking-[0.4em] text-[#ff6a00]/20">{currentTime}</span>
        <span className="absolute bottom-4 left-24 text-[7px] tracking-[0.4em] text-[#ff6a00]/20">STARK INDUSTRIES</span>
        <span className="absolute bottom-4 right-24 text-[7px] tracking-[0.4em] text-[#ff6a00]/20">{cloudMode ? 'CLOUD MODE' : 'JARVIS v4.0'}</span>
      </div>

      <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pt-4">
        <div className="flex items-center space-x-3 text-[8px] tracking-[0.3em]">
          <span className={`w-2 h-2 rounded-full ${
            isProcessing ? 'bg-[#ff4400] animate-pulse' : 
            isSpeaking ? 'bg-blue-400 animate-pulse' :
            isListening ? 'bg-green-500 animate-pulse' : 'bg-[#ff6a00]/40'
          }`} />
          <span className={`${
            isProcessing ? 'text-[#ff4400]' : 
            isSpeaking ? 'text-blue-400' :
            isListening ? 'text-green-400' : 'text-[#ff6a00]/30'
          }`}>
            {isProcessing ? 'PROCESSING' : isSpeaking ? 'SPEAKING' : isListening ? 'LISTENING' : statusText}
          </span>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <HoloCore isListening={isListening} isProcessing={isProcessing} transcript={transcript} response={response} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 pb-8">
        <div className="max-w-xl mx-auto px-6 space-y-2 mb-4">
          {transcript && (
            <div className="bg-black/80 border border-[#ff6a00]/20 rounded p-3 backdrop-blur">
              <p className="text-[8px] tracking-[0.3em] text-[#ff6a00]/30 mb-1">&gt; YOU</p>
              <p className="text-[#ff6a00]/50 text-xs">{transcript}</p>
            </div>
          )}
          {response && (
            <div className="bg-black/80 border border-[#ff4400]/20 rounded p-3 backdrop-blur">
              <p className="text-[8px] tracking-[0.3em] text-[#ff4400]/30 mb-1">&gt; J.A.R.V.I.S.</p>
              <p className="text-[#ff6a00]/70 text-xs leading-relaxed">{response}</p>
            </div>
          )}
        </div>

        {cloudMode ? (
          <form onSubmit={handleTextSubmit} className="flex items-center justify-center gap-2 px-6">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your command, sir..."
              className="flex-1 max-w-md bg-black/60 border border-[#ff6a00]/30 rounded px-4 py-2.5 text-[#ff6a00] text-xs outline-none focus:border-[#ff6a00] placeholder-[#ff6a00]/20"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-2.5 rounded border border-[#ff6a00]/40 text-[#ff6a00]/60 text-[10px] tracking-[0.3em] hover:border-[#ff6a00] hover:text-[#ff6a00] disabled:opacity-20"
            >
              SEND
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleMicClick}
              disabled={isProcessing}
              className={`px-10 py-3 rounded border text-[10px] tracking-[0.3em] transition-all duration-300 ${
                isListening
                  ? 'border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-pulse'
                  : isProcessing
                  ? 'border-[#ff6a00]/20 text-[#ff6a00]/20 cursor-not-allowed'
                  : 'border-[#ff6a00]/40 text-[#ff6a00]/60 hover:border-[#ff6a00] hover:text-[#ff6a00]'
              }`}
            >
              {isListening ? '● RELEASE TO SEND' : '○ HOLD TO TALK'}
            </button>
            {isSpeaking && (
              <button onClick={stopSpeaking} className="px-8 py-3 rounded border border-red-500/60 bg-red-500/10 text-red-400 text-[10px] tracking-[0.3em] hover:border-red-400">
                ■ STOP
              </button>
            )}
          </div>
        )}

        <p className="text-center text-[7px] tracking-[0.2em] text-[#ff6a00]/12 mt-3">
          {cloudMode 
            ? 'CLOUD MODE — TYPE YOUR COMMAND' 
            : isListening ? 'SPEAK NOW — RELEASE TO SEND' 
            : isProcessing ? 'THINKING...' 
            : isSpeaking ? 'JARVIS IS SPEAKING' 
            : 'HOLD SPACEBAR OR CLICK TO TALK'}
        </p>
      </div>
    </div>
  );
}