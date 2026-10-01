import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Sun, 
  Moon, 
  Type, 
  Sparkles, 
  Contrast, 
  RotateCcw,
  Volume2,
  Wind,
  AlignLeft,
  BookOpen,
  CheckCircle2,
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

interface AccessibilitySettingsCardProps {
  onToast: (msg: string) => void;
}

export const AccessibilitySettingsCard: React.FC<AccessibilitySettingsCardProps> = ({
  onToast
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY_SETTINGS);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    const current = loadAccessibilitySettings();
    setSettings(current);

    const handleExternalChange = (e: CustomEvent<AccessibilitySettings>) => {
      if (e.detail) {
        setSettings(e.detail);
      }
    };

    window.addEventListener('kalguru_accessibility_changed' as any, handleExternalChange as any);
    return () => {
      window.removeEventListener('kalguru_accessibility_changed' as any, handleExternalChange as any);
    };
  }, []);

  const updateSetting = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    // Instant Live Update & Save
    saveAccessibilitySettings(updated);
    applyAccessibilityToDOM(updated);
  };

  const handleReset = () => {
    setSettings(DEFAULT_ACCESSIBILITY_SETTINGS);
    saveAccessibilitySettings(DEFAULT_ACCESSIBILITY_SETTINGS);
    applyAccessibilityToDOM(DEFAULT_ACCESSIBILITY_SETTINGS);
    onToast('🔄 คืนค่าการแสดงผลและการเข้าถึงเป็นค่าเริ่มต้นแล้ว');
  };

  const handleTestTTS = () => {
    setIsPlayingAudio(true);
    const text = 'สวัสดีครับ นี่คือเสียงอ่านตัวอย่างจากระบบการเข้าถึง KalGuru โภชนาการเพื่อสุขภาพของคุณ';
    const success = speakAccessibilityText(text, settings.ttsVoiceRate);
    if (success) {
      onToast(`🔊 กำลังทดสอบเสียงอ่านภาษาไทย (ความเร็ว ${settings.ttsVoiceRate}x)`);
    } else {
      onToast('เบราว์เซอร์ของคุณยังไม่รองรับระบบสังเคราะห์เสียง Web Speech API');
    }
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 4000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 space-y-5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-xs">
            <Eye size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-900 leading-tight">การเข้าถึง & โหมดแสดงผล (Accessibility)</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                100% ใช้งานได้จริง
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              ปรับธีมมืด OLED, เซเปียถนอมสายตา, ขนาดฟอนต์ และระบบสังเคราะห์เสียง
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          title="รีเซ็ตค่ามาตรฐาน"
          className="px-2.5 py-1.5 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>รีเซ็ต</span>
        </button>
      </div>

      {/* 1. Theme Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
            <Sparkles size={14} className="text-purple-600" />
            <span>โทนสีและธีมหน้าจอ (Color Themes):</span>
          </label>
          <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
            ปรับทันทีแบบเรียลไทม์
          </span>
        </div>

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
              onClick={() => {
                updateSetting('theme', t.id as any);
                onToast(`🎨 เปลี่ยนธีมเป็น "${t.name}" เรียบร้อย`);
              }}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                settings.theme === t.id 
                  ? 'ring-2 ring-purple-600 shadow-md font-bold scale-[1.02]' 
                  : 'opacity-80 hover:opacity-100 hover:scale-[1.01]'
              } ${t.bg}`}
            >
              <t.icon size={18} />
              <span className="text-[11px] leading-tight font-bold">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Font Size Scaling */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
          <Type size={14} className="text-purple-600" />
          <span>ขนาดตัวอักษรทั้งระบบ (System Font Size):</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'normal', label: 'ปกติ (16px)', desc: 'ขนาดมาตรฐาน' },
            { id: 'large', label: 'ใหญ่ (18px)', desc: 'อ่านสบายตา' },
            { id: 'extra_large', label: 'ใหญ่พิเศษ (20px)', desc: 'ชัดเจนสูงสุด' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                updateSetting('fontSizeScale', f.id as any);
                onToast(`🔤 ปรับขนาดตัวอักษรเป็น "${f.label}"`);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                settings.fontSizeScale === f.id
                  ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold shadow-xs'
                  : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              <div className="text-xs font-bold">{f.label}</div>
              <span className="text-[10px] text-neutral-400 font-medium block mt-0.5">{f.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Accessibility Toggles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* High Contrast Toggle */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
          <div className="space-y-0.5 pr-2">
            <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <Contrast size={14} className="text-purple-600" /> ขอบคอนทราสต์ชัดเจน
            </span>
            <p className="text-[10px] text-neutral-500">เน้นเส้นขอบและปุ่มกดทั้งหมดให้มองเห็นง่าย</p>
          </div>
          <input
            type="checkbox"
            checked={settings.highContrast}
            onChange={(e) => {
              updateSetting('highContrast', e.target.checked);
              onToast(e.target.checked ? 'เปิดโหมดเน้นขอบคอนทราสต์ชัดเจน' : 'ปิดโหมดเน้นขอบคอนทราสต์');
            }}
            className="accent-purple-600 rounded w-4 h-4 cursor-pointer"
          />
        </div>

        {/* Dyslexia / High Legibility */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
          <div className="space-y-0.5 pr-2">
            <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <BookOpen size={14} className="text-purple-600" /> ตัวอักษรเว้นช่องไฟกว้าง
            </span>
            <p className="text-[10px] text-neutral-500">เพิ่มระยะห่างช่องไฟและตัวอักษรอ่านง่าย (Dyslexia Friendly)</p>
          </div>
          <input
            type="checkbox"
            checked={settings.dyslexiaFont}
            onChange={(e) => {
              updateSetting('dyslexiaFont', e.target.checked);
              onToast(e.target.checked ? 'เปิดโหมดตัวอักษรอ่านง่าย' : 'ปิดโหมดตัวอักษรอ่านง่าย');
            }}
            className="accent-purple-600 rounded w-4 h-4 cursor-pointer"
          />
        </div>

        {/* Reduced Motion */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
          <div className="space-y-0.5 pr-2">
            <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <Wind size={14} className="text-purple-600" /> ลดภาพเคลื่อนไหว (Reduce Motion)
            </span>
            <p className="text-[10px] text-neutral-500">ลดแอนิเมชันสำหรับผู้ที่ไวต่อการเคลื่อนไหว</p>
          </div>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => {
              updateSetting('reducedMotion', e.target.checked);
              onToast(e.target.checked ? 'เปิดโหมดลดภาพเคลื่อนไหว' : 'ปิดโหมดลดภาพเคลื่อนไหว');
            }}
            className="accent-purple-600 rounded w-4 h-4 cursor-pointer"
          />
        </div>

        {/* Line Spacing */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
          <div className="space-y-0.5 pr-2">
            <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <AlignLeft size={14} className="text-purple-600" /> ระยะบรรทัดโปร่งสบาย
            </span>
            <p className="text-[10px] text-neutral-500">เพิ่มความสูงบรรทัดให้อ่านไม่อึดอัด</p>
          </div>
          <input
            type="checkbox"
            checked={settings.lineSpacing === 'spacious'}
            onChange={(e) => {
              const val = e.target.checked ? 'spacious' : 'normal';
              updateSetting('lineSpacing', val);
              onToast(e.target.checked ? 'เปิดระยะบรรทัดโปร่งสบาย' : 'ตั้งค่าระยะบรรทัดปกติ');
            }}
            className="accent-purple-600 rounded w-4 h-4 cursor-pointer"
          />
        </div>
      </div>

      {/* 4. Text-to-Speech Voice Rate & Speech Test */}
      <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
            <Volume2 size={15} className="text-purple-600" /> ความเร็วเสียงอ่านภาษาไทย (TTS Voice Rate):
          </span>
          <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
            {settings.ttsVoiceRate}x
          </span>
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
              onClick={() => {
                updateSetting('ttsVoiceRate', r.rate);
                onToast(`🔊 ตั้งความเร็วเสียงอ่านเป็น ${r.rate}x`);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                settings.ttsVoiceRate === r.rate
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
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
          className="w-full py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
        >
          <Play size={13} className={isPlayingAudio ? 'animate-pulse text-purple-600' : ''} />
          <span>{isPlayingAudio ? 'กำลังเล่นเสียงตัวอย่าง...' : '🔊 ทดสอบฟังเสียงอ่านตัวอย่าง (Test TTS Speech)'}</span>
        </button>
      </div>

      {/* Confirmation indicator */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-emerald-900">
        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
        <span className="font-medium">การตั้งค่าทั้งหมดถูกบันทึกอัตโนมัติลงในอุปกรณ์นี้ และมีผลกับทุกหน้าของแอปทันที</span>
      </div>
    </div>
  );
};
