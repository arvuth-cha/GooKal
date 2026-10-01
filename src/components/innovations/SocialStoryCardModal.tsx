import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, Download, Sparkles, Flame, Droplets, CheckCircle, Award } from 'lucide-react';

interface SocialStoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyStats?: {
    caloriesEaten: number;
    calorieGoal: number;
    proteinGrams: number;
    proteinGoal: number;
    waterMl: number;
    streakDays: number;
    dateStr: string;
  };
  onToast: (msg: string) => void;
}

export const SocialStoryCardModal: React.FC<SocialStoryCardModalProps> = ({
  isOpen,
  onClose,
  dailyStats = {
    caloriesEaten: 1850,
    calorieGoal: 1900,
    proteinGrams: 140,
    proteinGoal: 135,
    waterMl: 2500,
    streakDays: 14,
    dateStr: '20 สิงหาคม 2026'
  },
  onToast
}) => {
  const [theme, setTheme] = useState<'emerald' | 'sunset' | 'midnight' | 'cyber'>('emerald');
  const cardRef = useRef<HTMLDivElement>(null);

  const getThemeStyles = () => {
    switch (theme) {
      case 'emerald':
        return {
          bg: 'bg-linear-to-br from-emerald-600 via-teal-700 to-emerald-900',
          accent: 'text-emerald-300',
          pill: 'bg-emerald-500/30 text-emerald-100 border-emerald-400/40',
          textMuted: 'text-emerald-100/80'
        };
      case 'sunset':
        return {
          bg: 'bg-linear-to-br from-orange-500 via-rose-600 to-purple-800',
          accent: 'text-amber-300',
          pill: 'bg-white/20 text-white border-white/30',
          textMuted: 'text-orange-100/90'
        };
      case 'midnight':
        return {
          bg: 'bg-linear-to-br from-neutral-900 via-slate-900 to-black',
          accent: 'text-cyan-400',
          pill: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40',
          textMuted: 'text-slate-300'
        };
      case 'cyber':
        return {
          bg: 'bg-linear-to-br from-purple-900 via-indigo-900 to-pink-900',
          accent: 'text-pink-300',
          pill: 'bg-pink-500/20 text-pink-100 border-pink-500/40',
          textMuted: 'text-indigo-100'
        };
    }
  };

  const themeStyle = getThemeStyles();

  const handleDownloadImage = () => {
    try {
      const canvas = document.createElement('canvas');
      const width = 1080;
      const height = 1920;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background Gradients
      const grad = ctx.createLinearGradient(0, 0, width, height);
      if (theme === 'emerald') {
        grad.addColorStop(0, '#059669');
        grad.addColorStop(0.5, '#0f766e');
        grad.addColorStop(1, '#064e3b');
      } else if (theme === 'sunset') {
        grad.addColorStop(0, '#f97316');
        grad.addColorStop(0.5, '#e11d48');
        grad.addColorStop(1, '#6b21a8');
      } else if (theme === 'midnight') {
        grad.addColorStop(0, '#171717');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#000000');
      } else {
        grad.addColorStop(0, '#581c87');
        grad.addColorStop(0.5, '#312e81');
        grad.addColorStop(1, '#831843');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Card Header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 52px system-ui, sans-serif';
      ctx.fillText('🥗 GOOKAL AI', 100, 180);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.roundRect(width - 450, 120, 350, 80, 40);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillText(`🔥 ${dailyStats.streakDays} Day Streak`, width - 410, 172);

      // Subtitle
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 38px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DAILY DISCIPLINE MASTERED', width / 2, 600);

      // Big Calories
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 160px system-ui, sans-serif';
      ctx.fillText(`${dailyStats.caloriesEaten}`, width / 2, 780);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 64px system-ui, sans-serif';
      ctx.fillText(`/ ${dailyStats.calorieGoal} kcal`, width / 2, 870);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '40px system-ui, sans-serif';
      ctx.fillText('เป้าหมายโภชนาการวันนี้สำเร็จลุล่วง 100% สุขภาพดีขึ้นทุกวัน', width / 2, 980);

      // Badges
      // Protein Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.roundRect(140, 1100, 360, 220, 40);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.fillText('🥩 Protein Goal', 320, 1170);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 64px system-ui, sans-serif';
      ctx.fillText(`${dailyStats.proteinGrams}g`, 320, 1260);

      // Water Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.roundRect(580, 1100, 360, 220, 40);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.fillText('💧 Water Target', 760, 1170);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 64px system-ui, sans-serif';
      ctx.fillText(`${(((dailyStats?.waterMl || 0) / 1000) || 0).toFixed(1)}L`, 760, 1260);

      // Quote
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'italic 36px system-ui, sans-serif';
      ctx.fillText('"วินัยเล็กๆ ทุกวัน สร้างการเปลี่ยนแปลงที่ยิ่งใหญ่"', width / 2, 1650);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '30px system-ui, sans-serif';
      ctx.fillText('gookal.web.app • โภชนาการและสุขภาพ AI', width / 2, 1750);

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `gookal_story_card_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      onToast('📸 ดาวน์โหลดการ์ดสตอรี่เป็นรูปภาพ PNG คมชัดสูงสำเร็จ!');
    } catch (e) {
      console.error('Canvas export error:', e);
      onToast('⚠️ ไม่สามารถบันทึกรูปภาพได้');
    }
  };

  const handleShareOrCopy = () => {
    if (navigator.share) {
      navigator.share({
        title: 'GooKal AI Health Achievement',
        text: `วันนี้วินัยแน่นเป๊ะ! กินแคลอรี่ ${dailyStats.caloriesEaten}/${dailyStats.calorieGoal} kcal, โปรตีน ${dailyStats.proteinGrams}g, สตรีค ${dailyStats.streakDays} วันติดต่อกัน! 🔥 #GooKal #HealthyLife`
      }).catch(() => {});
    } else {
      const text = `🔥 ความสำเร็จประจำวันกับ GooKal AI\n` +
        `📅 วันที่: ${dailyStats.dateStr}\n` +
        `🥗 แคลอรี: ${dailyStats.caloriesEaten}/${dailyStats.calorieGoal} kcal\n` +
        `🥩 โปรตีน: ${dailyStats.proteinGrams}/${dailyStats.proteinGoal}g\n` +
        `💧 น้ำดื่ม: ${(((dailyStats?.waterMl || 0) / 1000) || 0).toFixed(1)}L\n` +
        `⚡ สตรีคต่อเนื่อง: ${dailyStats.streakDays} วัน\n` +
        `#GooKal #Discipline #HealthyLife`;
      navigator.clipboard.writeText(text);
      onToast('📋 คัดลอกข้อความสรุปความสำเร็จสำหรับแชร์ลงโซเชียลแล้ว!');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-neutral-100"
        >
          {/* Header */}
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-pink-600" />
              <h2 className="text-base font-bold text-neutral-900">การ์ดสตอรี่ (Story Card)</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto space-y-4 flex-1 text-sm">
            {/* Theme picker */}
            <div className="flex justify-center gap-2">
              {(['emerald', 'sunset', 'midnight', 'cyber'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    theme === t ? 'bg-neutral-900 text-white shadow-xs' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* The 9:16 Story Card preview */}
            <div
              ref={cardRef}
              className={`w-full aspect-[9/14] rounded-3xl p-6 text-white shadow-2xl flex flex-col justify-between relative overflow-hidden ${themeStyle.bg}`}
            >
              {/* Top watermark & date */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-sm">
                    🥗
                  </div>
                  <span className="font-black text-sm tracking-wider">GOOKAL AI</span>
                </div>
                <span className={`text-[11px] font-bold ${themeStyle.pill} px-2.5 py-1 rounded-full border`}>
                  🔥 {dailyStats.streakDays} Day Streak
                </span>
              </div>

              {/* Center big accomplishment */}
              <div className="space-y-3 my-auto text-center py-4">
                <span className={`text-xs font-bold uppercase tracking-widest ${themeStyle.accent}`}>
                  Daily Discipline Mastered
                </span>
                <div className="text-4xl font-black tracking-tight leading-none">
                  {dailyStats.caloriesEaten}
                  <span className="text-lg font-bold opacity-80 ml-1">/ {dailyStats.calorieGoal} kcal</span>
                </div>
                <p className={`text-xs ${themeStyle.textMuted} max-w-[200px] mx-auto`}>
                  เป้าหมายโภชนาการวันนี้สำเร็จลุล่วง 100% สุขภาพดีขึ้นทุกวัน
                </p>

                {/* Macro Badges */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/15">
                    <span className="text-[10px] font-bold block opacity-80">🥩 Protein Goal</span>
                    <span className="text-base font-black">{dailyStats.proteinGrams}g</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/15">
                    <span className="text-[10px] font-bold block opacity-80">💧 Water Target</span>
                    <span className="text-base font-black">{(((dailyStats?.waterMl || 0) / 1000) || 0).toFixed(1)}L</span>
                  </div>
                </div>
              </div>

              {/* Footer Quote */}
              <div className="text-center border-t border-white/15 pt-3">
                <span className="text-[10px] opacity-75 font-medium block">
                  "วินัยเล็กๆ ทุกวัน สร้างการเปลี่ยนแปลงที่ยิ่งใหญ่"
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadImage}
                className="py-3 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
              >
                <Download size={15} />
                <span>บันทึกเป็นรูปภาพ (PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleShareOrCopy}
                className="py-3 rounded-2xl bg-neutral-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer transition-all active:scale-[0.98]"
              >
                <Share2 size={15} />
                <span>แชร์ลง Instagram / LINE</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
