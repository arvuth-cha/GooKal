import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Eye, 
  Sun, 
  Moon, 
  Type, 
  Sparkles, 
  CheckCircle2, 
  Contrast, 
  RotateCcw,
  Volume2,
  Wind,
  AlignLeft,
  BookOpen,
  Play
} from 'lucide-react';
import { 
  AccessibilitySettings, 
  DEFAULT_ACCESSIBILITY_SETTINGS, 
  loadAccessibilitySettings, 
  saveAccessibilitySettings,
  applyAccessibilityToDOM,
  speakAccessibilityText
} from '../../utils/accessibilityService';

interface AccessibilityAndThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const AccessibilityAndThemeModal: React.FC<AccessibilityAndThemeModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY_SETTINGS);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = loadAccessibilitySettings();
      setSettings(current);
    }
  }, [isOpen]);

  const updateSetting = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveAccessibilitySettings(updated);
    applyAccessibilityToDOM(updated);
  };

  const handleSave = () => {
    saveAccessibilitySettings(settings);
    onToast('✅ บันทึกการตั้งค่าการเข้าถึงและโหมดแสดงผลเรียบร้อย');
    onClose();
  };

  const handleReset = () => {
    setSettings(DEFAULT_ACCESSIBILITY_SETTINGS);
    saveAccessibilitySettings(DEFAULT_ACCESSIBILITY_SETTINGS);
    applyAccessibilityToDOM(DEFAULT_ACCESSIBILITY_SETTINGS);
    onToast('🔄 คืนค่าการแสดงผลเป็นค่ามาตรฐานแล้ว');
  };

  const handleTestTTS = () => {
    setIsPlayingAudio(true);
    const text = 'สวัสดีครับ นี่คือเสียงอ่านตัวอย่างจากระบบการเข้าถึง KalGuru';
    speakAccessibilityText(text, settings.ttsVoiceRate);
    onToast(`🔊 กำลังทดสอบเสียงอ่านภาษาไทย (${settings.ttsVoiceRate}x)`);
    setTimeout(() => setIsPlayingAudio(false), 3500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-neutral-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-sky-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <Eye size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-neutral-900 leading-tight">การเข้าถึง & โหมดแสดงผล (Accessibility)</h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    100% Real-Time
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium">ปรับขนาดตัวอักษร ธีมมืด OLED ถนอมสายตา และการอ่านง่าย</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-neutral-500 hover:text-neutral-800 flex items-center justify-center shadow-xs transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1 text-sm">
            {/* 1. Theme Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 block flex items-center justify-between">
                <span>โทนสีและธีมหน้าจอ (Color & Contrast Themes):</span>
                <span className="text-[10px] text-purple-600 font-medium">แสดงผลแบบทันที</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'light', name: 'สว่างคลีน', icon: Sun, bg: 'bg-white border-neutral-300 text-neutral-900' },
                  { id: 'dark', name: 'มืด OLED', icon: Moon, bg: 'bg-neutral-900 border-neutral-800 text-white' },
                  { id: 'warm_sepia', name: 'เซเปียถนอมตา', icon: Sparkles, bg: 'bg-[#fbf7ee] border-amber-300 text-amber-950' },
                  { id: 'high_contrast_dark', name: 'คอนทราสต์ มืด', icon: Contrast, bg: 'bg-black border-yellow-400 text-yellow-300' },
                  { id: 'high_contrast_light', name: 'คอนทราสต์ สว่าง', icon: Contrast, bg: 'bg-white border-black text-black' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => updateSetting('theme', t.id as any)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      settings.theme === t.id ? 'ring-2 ring-purple-600 shadow-md font-bold scale-[1.02]' : 'opacity-80 hover:opacity-100'
                    } ${t.bg}`}
                  >
                    <t.icon size={18} />
                    <span className="text-xs">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Font Size Scaler */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 block flex items-center gap-1">
                <Type size={14} /> ขนาดตัวอักษรทั้งแอป (Font Scaling):
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'normal', label: 'ปกติ (16px)', desc: 'มาตรฐาน' },
                  { id: 'large', label: 'ใหญ่ (18px)', desc: 'อ่านสบายตา' },
                  { id: 'extra_large', label: 'ใหญ่พิเศษ (20px)', desc: 'ชัดเจนสูงสุด' }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => updateSetting('fontSizeScale', f.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      settings.fontSizeScale === f.id
                        ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="text-xs font-bold">{f.label}</div>
                    <span className="text-[10px] text-neutral-400 font-medium">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Toggles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* High Contrast Toggle */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-neutral-900 block flex items-center gap-1.5">
                    <Contrast size={14} className="text-purple-600" /> ขอบคอนทราสต์ชัดเจน
                  </span>
                  <p className="text-[10px] text-neutral-500">เน้นเส้นขอบและปุ่มกดให้มองเห็นง่าย</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(e) => updateSetting('highContrast', e.target.checked)}
                  className="accent-purple-600 rounded w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Dyslexia / High Legibility */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-neutral-900 block flex items-center gap-1.5">
                    <BookOpen size={14} className="text-purple-600" /> ตัวอักษรเว้นช่องไฟกว้าง
                  </span>
                  <p className="text-[10px] text-neutral-500">เพิ่มระยะห่างระหว่างตัวอักษรให้อ่านง่าย</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dyslexiaFont}
                  onChange={(e) => updateSetting('dyslexiaFont', e.target.checked)}
                  className="accent-purple-600 rounded w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Reduced Motion */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-neutral-900 block flex items-center gap-1.5">
                    <Wind size={14} className="text-purple-600" /> ลดภาพเคลื่อนไหว (Reduce Motion)
                  </span>
                  <p className="text-[10px] text-neutral-500">ลดแอนิเมชันสำหรับผู้ที่ไวต่อการเคลื่อนไหว</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
                  className="accent-purple-600 rounded w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Line Spacing */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-neutral-900 block flex items-center gap-1.5">
                    <AlignLeft size={14} className="text-purple-600" /> ระยะบรรทัดโปร่งสบาย
                  </span>
                  <p className="text-[10px] text-neutral-500">เพิ่มความสูงบรรทัดให้อ่านไม่อึดอัด</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.lineSpacing === 'spacious'}
                  onChange={(e) => updateSetting('lineSpacing', e.target.checked ? 'spacious' : 'normal')}
                  className="accent-purple-600 rounded w-4 h-4 cursor-pointer"
                />
              </div>
            </div>

            {/* 4. Text-to-Speech Voice Rate */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <Volume2 size={14} className="text-purple-600" /> ความเร็วเสียงอ่านภาษาไทย (TTS Voice Rate):
                </span>
                <span className="text-xs font-bold text-purple-700">{settings.ttsVoiceRate}x</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { rate: 0.8, label: 'ช้าชัดเจน (0.8x)' },
                  { rate: 1.0, label: 'ปกติ (1.0x)' },
                  { rate: 1.2, label: 'เร็วคล่อง (1.2x)' }
                ].map(r => (
                  <button
                    key={r.rate}
                    type="button"
                    onClick={() => updateSetting('ttsVoiceRate', r.rate)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                      settings.ttsVoiceRate === r.rate
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleTestTTS}
                disabled={isPlayingAudio}
                className="w-full mt-2 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-purple-200"
              >
                <Play size={13} />
                <span>{isPlayingAudio ? 'กำลังทดสอบเสียงอ่าน...' : '🔊 ทดสอบฟังเสียงตัวอย่าง'}</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 font-bold text-xs flex items-center gap-1 hover:bg-neutral-200/60 transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>รีเซ็ตค่าเริ่มต้น</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-neutral-600 hover:text-neutral-800 font-bold text-xs cursor-pointer"
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 size={15} />
                <span>บันทึกการตั้งค่า</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
