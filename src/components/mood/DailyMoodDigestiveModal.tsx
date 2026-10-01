import React, { useState, useEffect } from 'react';
import { 
  Smile, 
  BatteryCharging, 
  Activity, 
  Check, 
  X, 
  Sparkles, 
  HeartHandshake,
  MessageSquare
} from 'lucide-react';
import { DailyMoodLog } from '../../types/extendedFeatures';

const MOOD_STORAGE_KEY = 'kalguru_daily_mood_logs_v1';

interface DailyMoodDigestiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onToast: (msg: string) => void;
}

export const DailyMoodDigestiveModal: React.FC<DailyMoodDigestiveModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onToast
}) => {
  const dateStr = selectedDate.toISOString().split('T')[0];

  const [energyLevel, setEnergyLevel] = useState<number>(4);
  const [bloatingLevel, setBloatingLevel] = useState<number>(1);
  const [fullnessLevel, setFullnessLevel] = useState<number>(3);
  const [mood, setMood] = useState<'great' | 'good' | 'neutral' | 'tired' | 'stressed'>('great');
  const [digestiveStatus, setDigestiveStatus] = useState<string>('ปกติ สบายท้อง');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MOOD_STORAGE_KEY);
      if (saved) {
        const logs: Record<string, DailyMoodLog> = JSON.parse(saved);
        if (logs[dateStr]) {
          const l = logs[dateStr];
          setEnergyLevel(l.energyLevel);
          setBloatingLevel(l.bloatingLevel);
          setFullnessLevel(l.fullnessLevel);
          setMood(l.mood);
          setDigestiveStatus(l.digestiveStatus);
          setNotes(l.notes);
        }
      }
    } catch (e) {
      console.error('Failed to load mood logs:', e);
    }
  }, [isOpen, dateStr]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem(MOOD_STORAGE_KEY);
      const logs: Record<string, DailyMoodLog> = saved ? JSON.parse(saved) : {};
      
      logs[dateStr] = {
        dateStr,
        energyLevel,
        bloatingLevel,
        fullnessLevel,
        mood,
        digestiveStatus,
        notes
      };

      localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(logs));
      onToast(`✨ บันทึกอารมณ์และสุขภาพทางเดินอาหาร (${dateStr}) เรียบร้อย!`);
      onClose();
    } catch (e) {
      console.error('Failed to save mood log:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-b from-purple-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/20">
              <Smile size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">บันทึกพลังงานและระบบย่อย (Gut Health)</h2>
              <p className="text-xs text-neutral-500 font-medium">สังเกตความสัมพันธ์ระหว่างอาหาร อารมณ์ และอาการท้องอืด</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Energy Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-700">ระดับพลังงานและความสดชื่น (Energy Level):</label>
              <span className="text-xs font-black text-purple-600">{energyLevel} / 5</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setEnergyLevel(lvl)}
                  className={`py-3 rounded-2xl border font-bold text-xs transition-all ${
                    energyLevel === lvl
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm scale-105'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  ⚡ {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Bloating Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-700">อาการแน่นท้อง / ท้องอืด (Bloating):</label>
              <span className="text-xs font-black text-rose-600">{bloatingLevel === 1 ? 'ไม่มีเลย (สบายท้อง)' : bloatingLevel === 5 ? 'อืดแน่นมาก' : `ระดับ ${bloatingLevel}`}</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[
                { lvl: 1, label: 'ปกติ' },
                { lvl: 2, label: 'เล็กน้อย' },
                { lvl: 3, label: 'ปานกลาง' },
                { lvl: 4, label: 'ค่อนข้างแน่น' },
                { lvl: 5, label: 'แน่นมาก' }
              ].map((item) => (
                <button
                  key={item.lvl}
                  type="button"
                  onClick={() => setBloatingLevel(item.lvl)}
                  className={`py-2.5 rounded-2xl border font-bold text-[11px] transition-all ${
                    bloatingLevel === item.lvl
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm scale-105'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mood Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-700">อารมณ์ความรู้สึกวันนี้:</label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'great', label: 'ยอดเยี่ยม', emoji: '🤩' },
                { id: 'good', label: 'อารมณ์ดี', emoji: '😊' },
                { id: 'neutral', label: 'เฉยๆ', emoji: '😐' },
                { id: 'tired', label: 'เหนื่อยล้า', emoji: '🥱' },
                { id: 'stressed', label: 'เครียด', emoji: '😣' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id as any)}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    mood === m.id
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <span className="text-xl block">{m.emoji}</span>
                  <span className="text-[10px] font-bold mt-1 block">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-neutral-700">บันทึกเพิ่มเติมเกี่ยวกับสุขภาพ / อาหารวันนี้:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="เช่น วันนี้ดื่มกาแฟแล้วใจสั่นเล็กน้อย / หลังทานสลัดรู้สึกย่อยง่าย สบายตัวมาก..."
              className="w-full p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 outline-none focus:border-purple-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-neutral-600 hover:bg-neutral-100"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              บันทึกไดอารี่
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
