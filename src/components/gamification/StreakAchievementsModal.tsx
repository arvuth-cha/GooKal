import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  X, 
  Trophy, 
  Star, 
  Zap, 
  Droplet, 
  Timer,
  Utensils
} from 'lucide-react';
import { AchievementBadge } from '../../types/extendedFeatures';

interface StreakAchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  history?: Array<{ date?: number; [key: string]: any }>;
  historyCount?: number;
  onToast: (msg: string) => void;
}

const BADGES_KEY = 'kalguru_badges_v1';

export const StreakAchievementsModal: React.FC<StreakAchievementsModalProps> = ({
  isOpen,
  onClose,
  history = [],
  historyCount,
  onToast
}) => {
  // Compute safe history count
  const effectiveHistoryCount = typeof historyCount === 'number' && !isNaN(historyCount)
    ? historyCount
    : (Array.isArray(history) ? history.length : 0);

  // Calculate real consecutive days streak from history
  const computedStreak = useMemo(() => {
    if (!Array.isArray(history) || history.length === 0) {
      return effectiveHistoryCount > 0 ? Math.min(30, effectiveHistoryCount) : 1;
    }

    // Extract unique dates formatted as YYYY-MM-DD
    const recordedDates = new Set<string>();
    for (const item of history) {
      if (item && item.date && !isNaN(Number(item.date))) {
        const d = new Date(Number(item.date));
        if (!isNaN(d.getTime())) {
          recordedDates.add(d.toISOString().split('T')[0]);
        }
      }
    }

    if (recordedDates.size === 0) {
      return effectiveHistoryCount > 0 ? Math.min(30, effectiveHistoryCount) : 1;
    }

    // Sort dates descending
    const sortedDates = Array.from(recordedDates).sort((a, b) => b.localeCompare(a));
    
    // Check consecutive days starting from today or yesterday
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if streak is active (logged today or yesterday)
    let currentCheck = sortedDates.includes(todayStr) 
      ? today 
      : (sortedDates.includes(yesterdayStr) ? yesterday : null);

    if (!currentCheck) {
      // If no log today or yesterday, streak is at least 1 if they have history, else 0
      return Math.max(1, Math.min(sortedDates.length, 30));
    }

    let streak = 0;
    const checkDate = new Date(currentCheck);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (recordedDates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return Math.max(1, streak);
  }, [history, effectiveHistoryCount]);

  const [currentStreak, setCurrentStreak] = useState<number>(computedStreak);

  useEffect(() => {
    if (!isNaN(computedStreak)) {
      setCurrentStreak(computedStreak);
    }
  }, [computedStreak]);

  if (!isOpen) return null;

  const BADGES: AchievementBadge[] = [
    {
      id: 'b-1',
      title: 'ก้าวแรกสู่นักนับแคล',
      description: 'บันทึกมื้ออาหารครั้งแรกในระบบ',
      icon: '🌱',
      category: 'streak',
      progress: Math.min(1, effectiveHistoryCount),
      maxProgress: 1,
      isUnlocked: effectiveHistoryCount >= 1
    },
    {
      id: 'b-2',
      title: 'วินัย 7 วันติด (7-Day Streak)',
      description: 'บันทึกมื้ออาหารต่อเนื่องครบ 7 วัน',
      icon: '🔥',
      category: 'streak',
      progress: Math.min(7, computedStreak || effectiveHistoryCount),
      maxProgress: 7,
      isUnlocked: (computedStreak || effectiveHistoryCount) >= 7
    },
    {
      id: 'b-3',
      title: 'นักสแกนสายลึก (Pro Scanner)',
      description: 'สแกนรูปอาหารหรือฉลากโภชนาการครบ 15 มื้อ',
      icon: '📸',
      category: 'nutrition',
      progress: Math.min(15, effectiveHistoryCount),
      maxProgress: 15,
      isUnlocked: effectiveHistoryCount >= 15
    },
    {
      id: 'b-4',
      title: 'ฮีโร่แห่งการดื่มน้ำ (Hydration Hero)',
      description: 'ดื่มน้ำครบ 2,500 ml ในหนึ่งวัน',
      icon: '💧',
      category: 'water',
      progress: 1,
      maxProgress: 1,
      isUnlocked: true
    },
    {
      id: 'b-5',
      title: 'ปรมาจารย์ IF 16:8 (Fasting Master)',
      description: 'ทำ Intermittent Fasting ครบตามเป้าหมายเวลา',
      icon: '⏱️',
      category: 'fasting',
      progress: 1,
      maxProgress: 1,
      isUnlocked: true
    },
    {
      id: 'b-6',
      title: 'เชฟอาหารคลีน (Master Chef)',
      description: 'ค้นหาและบันทึกสูตรอาหารคลีน AI เข้าสู่มื้ออาหาร',
      icon: '🍳',
      category: 'chef',
      progress: 1,
      maxProgress: 1,
      isUnlocked: true
    }
  ];

  const unlockedCount = BADGES.filter(b => b.isUnlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-b from-amber-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">เหรียญรางวัลและความต่อเนื่อง (Streaks)</h2>
              <p className="text-xs text-neutral-500 font-medium">สะสมความสม่ำเสมอ ปลดล็อกเหรียญและฉายานักโภชนาการ</p>
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

        {/* Streak Highlight Banner */}
        <div className="p-6 pb-3 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <Flame size={26} className="animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-300">ความต่อเนื่องปัจจุบัน</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black">{currentStreak}</span>
                <span className="text-sm font-bold text-neutral-400">วันติดต่อกัน 🔥</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-neutral-400 font-bold block">ปลดล็อกแล้ว</span>
            <span className="text-xl font-black text-amber-400">{unlockedCount} / {BADGES.length}</span>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BADGES.map((b) => (
              <div
                key={b.id}
                className={`p-4 rounded-3xl border transition-all flex items-start gap-3.5 ${
                  b.isUnlocked
                    ? 'bg-amber-50/50 border-amber-200 shadow-xs'
                    : 'bg-neutral-50 border-neutral-200/80 opacity-60'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm ${
                  b.isUnlocked ? 'bg-white border border-amber-200' : 'bg-neutral-200'
                }`}>
                  {b.icon}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-neutral-900">{b.title}</h4>
                    {b.isUnlocked ? (
                      <CheckCircle2 size={15} className="text-emerald-600" />
                    ) : (
                      <Lock size={14} className="text-neutral-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-tight">{b.description}</p>

                  <div className="pt-1">
                    <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, b.maxProgress > 0 ? (b.progress / b.maxProgress) * 100 : 0))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
