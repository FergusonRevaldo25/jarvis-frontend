'use client';

import { useRef, useCallback, useEffect } from 'react';

interface VoiceCommandProps {
  isListening: boolean;
  setIsListening: (value: boolean) => void;
  onCommand: (audioBlob: Blob) => void;
  transcript: string;
  response: string;
}

export default function VoiceCommand({
  isListening,
  setIsListening,
  onCommand,
  transcript,
  response,
}: VoiceCommandProps) {
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onCommand(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsListening(false);
    }
  }, [onCommand, setIsListening]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  useEffect(() => {
    if (isListening) startRecording();
    else stopRecording();
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isListening, startRecording, stopRecording]);

  return (
    <div className="bg-black/60 border border-[#ff6a00]/20 rounded p-6 backdrop-blur">
      <h3 className="text-xs tracking-[0.3em] text-[#ff6a00]/50 mb-4">VOICE INPUT</h3>

      {/* Arc Reactor Mic Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setIsListening(!isListening)}
          className="relative group"
        >
          {/* Outer rings */}
          <div className={`absolute inset-0 rounded-full border-2 border-[#ff6a00]/20 ${
            isListening ? 'animate-ping' : ''
          }`} 
            style={{ animationDuration: '2s' }}
          />
          <div className={`absolute -inset-4 rounded-full border border-[#ff6a00]/10 ${
            isListening ? 'animate-pulse' : ''
          }`} />
          
          {/* Main button */}
          <div className={`relative w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
            isListening
              ? 'border-[#ff6a00] shadow-[0_0_30px_#ff6a00,0_0_60px_#ff6600] bg-[#ff6a00]/10'
              : 'border-[#ff6a00]/40 hover:border-[#ff6a00]/80 hover:shadow-[0_0_15px_#ff6a00] bg-transparent'
          }`}>
            {/* Inner ring */}
            <div className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-500 ${
              isListening
                ? 'border-[#ff6a00] animate-spin bg-[#ff6a00]/5'
                : 'border-[#ff6a00]/30 group-hover:border-[#ff6a00]/60'
            }`} 
              style={{ animationDuration: '4s' }}
            >
              {/* Center dot */}
              <div className={`w-4 h-4 rounded-full transition-all duration-500 ${
                isListening
                  ? 'bg-[#ff6a00] shadow-[0_0_10px_#ff6a00] animate-pulse'
                  : 'bg-[#ff6a00]/40 group-hover:bg-[#ff6a00]/80'
              }`} />
            </div>
          </div>
        </button>
      </div>

      {/* Waveform bars */}
      <div className="flex justify-center items-end space-x-1 h-8 mb-6">
        {[1,2,3,4,5,4,3,2,1].map((h, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${
              isListening ? 'bg-[#ff6a00] animate-pulse' : 'bg-[#ff6a00]/20'
            }`}
            style={{
              height: isListening ? `${h * 6 + 4}px` : '4px',
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="bg-black/80 border border-[#ff6a00]/20 rounded p-3 mb-3">
          <p className="text-[10px] tracking-[0.2em] text-[#ff6a00]/30 mb-1">&gt; INPUT</p>
          <p className="text-[#ff6a00]/80 text-sm">{transcript}</p>
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="bg-black/80 border border-[#ff6a00]/20 rounded p-3">
          <p className="text-[10px] tracking-[0.2em] text-[#ff6a00]/30 mb-1">&gt; JARVIS</p>
          <p className="text-[#ff6a00]/80 text-sm">{response}</p>
        </div>
      )}

      {/* Listening indicator */}
      <div className="mt-4 text-center">
        <span className={`text-[10px] tracking-[0.3em] ${
          isListening ? 'text-[#ff6a00] animate-pulse' : 'text-[#ff6a00]/30'
        }`}>
          {isListening ? '● LISTENING' : 'STANDBY'}
        </span>
      </div>
    </div>
  );
}