import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Loader2, 
  Check, 
  AlertCircle, 
  Volume2,
  RefreshCw,
  Send,
  Radio
} from 'lucide-react';
import { ThaiVoiceRecognizer } from '../../utils/voiceService';

interface VoiceMealLoggerProps {
  onAnalyzeMealText: (mealText: string) => void;
  isLoading: boolean;
  onToast: (msg: string) => void;
}

export const VoiceMealLogger: React.FC<VoiceMealLoggerProps> = ({
  onAnalyzeMealText,
  isLoading,
  onToast
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const recognizerRef = useRef<ThaiVoiceRecognizer | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    recognizerRef.current = new ThaiVoiceRecognizer({
      lang: 'th-TH',
      continuous: false,
      interimResults: true,
      onStart: () => {
        setIsListening(true);
        setRecordingSeconds(0);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setRecordingSeconds(s => s + 1);
        }, 1000);
      },
      onTranscriptChange: (text: string) => {
        if (text) {
          setTranscript(text);
        }
      },
      onError: (err: string) => {
        setIsListening(false);
        if (timerRef.current) clearInterval(timerRef.current);
        onToast(`🎙️ ${err}`);
      },
      onEnd: () => {
        setIsListening(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recognizerRef.current?.abort();
    };
  }, [onToast]);

  const toggleListening = () => {
    if (!recognizerRef.current?.isSupported()) {
      onToast('⚠️ เบราว์เซอร์นี้ไม่รองรับ Web Speech API คุณสามารถพิมพ์หรือกดเลือกเมนูตัวอย่างได้');
      // Fallback demo input
      setTranscript('ข้าวกะเพราอกไก่ไข่ดาว ไม่ใส่น้ำตาล 1 จาน');
      return;
    }

    if (isListening) {
      recognizerRef.current.stop();
      setIsListening(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setTranscript('');
      const started = recognizerRef.current.start();
      if (!started) {
        onToast('⚠️ ไม่สามารถเปิดไมโครโฟนได้ กรุณาตรวจสอบสิทธิ์การใช้งาน');
      }
    }
  };

  const handleSend = () => {
    if (!transcript.trim()) {
      onToast('⚠️ โปรดพูดหรือพิมพ์ชื่อเมนูอาหารก่อนกดวิเคราะห์');
      return;
    }
    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
    }
    onAnalyzeMealText(transcript.trim());
  };

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-br from-violet-50/80 via-purple-50/40 to-white border border-purple-100/80 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
            <Mic size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-xs text-neutral-900">วิเคราะห์อาหารด้วยเสียง (Voice Meal AI)</h4>
              {isListening && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  กำลังฟัง {recordingSeconds}s
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-500">พูดชื่อเมนู ส่วนประกอบ หรือปริมาณ เช่น "ข้าวกะเพราหมูสับไข่ดาว 1 จาน"</p>
          </div>
        </div>

        {/* Mic toggle button */}
        <button
          type="button"
          id="voice-logger-toggle-mic-btn"
          onClick={toggleListening}
          disabled={isLoading}
          className={`px-3.5 py-2 rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm ${
            isListening
              ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-500/30'
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20'
          }`}
        >
          {isListening ? (
            <>
              <MicOff size={15} />
              <span>หยุดบันทึก</span>
            </>
          ) : (
            <>
              <Mic size={15} />
              <span>กดเพื่อพูด</span>
            </>
          )}
        </button>
      </div>

      {/* Voice Wave Animation when active */}
      {isListening && (
        <div className="flex items-center justify-center gap-1 py-2 bg-purple-100/50 rounded-2xl border border-purple-200/60 animate-in fade-in duration-200">
          <span className="text-xs font-bold text-purple-900 mr-2">🎙️ กำลังรับฟังเสียงภาษาไทย...</span>
          <div className="flex items-center gap-0.5">
            {[40, 70, 100, 60, 90, 45, 80, 55, 30].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-purple-600 rounded-full animate-bounce"
                style={{
                  height: `${h * 0.22}px`,
                  animationDuration: `${0.4 + (i % 3) * 0.2}s`,
                  animationDelay: `${i * 0.05}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Input / Transcript Box */}
      <div className="relative">
        <input
          type="text"
          id="voice-meal-input-text"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={isListening ? '🎙️ กำลังรับฟังเสียงของคุณ (พูดได้เลย)...' : 'พิมพ์หรือกดปุ่มไมค์เพื่อพูด เช่น "สุกี้น้ำอกไก่พิเศษผัก"'}
          className="w-full pl-4 pr-24 py-2.5 rounded-2xl bg-white border border-purple-200/80 text-xs font-bold text-neutral-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-xs"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />

        <button
          type="button"
          id="voice-meal-submit-btn"
          onClick={handleSend}
          disabled={isLoading || !transcript.trim()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-[11px] font-bold transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
        >
          {isLoading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <>
              <Sparkles size={12} className="text-amber-400" />
              <span>วิเคราะห์</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] text-neutral-500 pb-0.5">
        <span className="font-bold text-neutral-400 shrink-0">ตัวอย่างคำพูด:</span>
        {[
          'ข้าวกะเพราอกไก่ไข่ดาว',
          'สุกี้น้ำรวมมิตร',
          'อเมริกาโน่เย็นไม่หวาน',
          'เวย์โปรตีน 1 สกู๊ป',
          'ก๋วยเตี๋ยวเส้นหมี่น้ำใส'
        ].map((sample) => (
          <button
            key={sample}
            type="button"
            onClick={() => setTranscript(sample)}
            className="px-2 py-1 rounded-xl bg-white border border-neutral-200 hover:border-purple-300 text-neutral-700 whitespace-nowrap transition-colors cursor-pointer shadow-2xs font-medium"
          >
            {sample}
          </button>
        ))}
      </div>
    </div>
  );
};
