import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Watch, Activity, RefreshCw, CheckCircle2, ShieldCheck, Heart, Sparkles, Zap, Smartphone, ExternalLink, Flame, Moon, Compass, Check } from 'lucide-react';

interface BiomarkerSyncSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncBiomarkers?: (data: { steps: number; activeCalories: number; restingHR: number; glucoseMgDl: number; deviceName?: string }) => void;
  onToast: (msg: string) => void;
}

export const BiomarkerSyncSimulatorModal: React.FC<BiomarkerSyncSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSyncBiomarkers,
  onToast
}) => {
  const [device, setDevice] = useState<'huawei_health' | 'apple_health' | 'garmin' | 'cgm_freestyle'>('huawei_health');
  const [isHuaweiLinked, setIsHuaweiLinked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kalguru_huawei_linked') === 'true';
    } catch {
      return true;
    }
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [syncing, setSyncing] = useState(false);
  const [showAuthGuide, setShowAuthGuide] = useState(false);
  const [syncedData, setSyncedData] = useState<{
    deviceName: string;
    steps: number;
    activeCalories: number;
    restingHR: number;
    maxHR: number;
    vo2Max: number;
    glucoseMgDl: number;
    sleepScore: number;
    spO2: number;
    stressLevel: number;
    workoutDistanceKm: number;
    lastSyncTime: string;
  } | null>(() => {
    // Initial mock data if Huawei is connected
    return {
      deviceName: 'HUAWEI WATCH GT 4 / Ultimate (Smart Health)',
      steps: 8420,
      activeCalories: 485,
      restingHR: 56,
      maxHR: 142,
      vo2Max: 46.2,
      glucoseMgDl: 95,
      sleepScore: 89,
      spO2: 98,
      stressLevel: 28,
      workoutDistanceKm: 5.4,
      lastSyncTime: 'เมื่อสักครู่'
    };
  });

  const handleToggleHuaweiLink = () => {
    const nextState = !isHuaweiLinked;
    setIsHuaweiLinked(nextState);
    try {
      localStorage.setItem('kalguru_huawei_linked', String(nextState));
    } catch (e) {
      console.error(e);
    }
    if (nextState) {
      onToast('🔗 เชื่อมต่อกับ Smart Health (HUAWEI ID) สำเร็จแล้ว!');
    } else {
      onToast('ยกเลิกการเชื่อมต่อกับ Smart Health');
    }
  };

  const handleSimulateSync = () => {
    setSyncing(true);
    setTimeout(() => {
      let deviceTitle = 'Smart Health';
      let activeCals = Math.floor(450 + Math.random() * 220);
      let stepsCount = Math.floor(8200 + Math.random() * 3800);
      let resting = Math.floor(54 + Math.random() * 8);
      let glucoseVal = Math.floor(92 + Math.random() * 14);

      if (device === 'huawei_health') {
        deviceTitle = 'Smart Health (HUAWEI TruSport™)';
      } else if (device === 'apple_health') {
        deviceTitle = 'Apple Health / Watch';
      } else if (device === 'garmin') {
        deviceTitle = 'Garmin Connect™';
      } else {
        deviceTitle = 'Continuous Glucose Monitor (CGM)';
      }

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;

      const data = {
        deviceName: deviceTitle,
        steps: stepsCount,
        activeCalories: activeCals,
        restingHR: resting,
        maxHR: Math.floor(138 + Math.random() * 25),
        vo2Max: 46.5,
        glucoseMgDl: glucoseVal,
        sleepScore: Math.floor(82 + Math.random() * 14),
        spO2: Math.floor(97 + Math.random() * 3),
        stressLevel: Math.floor(22 + Math.random() * 18),
        workoutDistanceKm: Number((stepsCount * 0.00075).toFixed(2)),
        lastSyncTime: timeStr
      };

      setSyncedData(data);
      setSyncing(false);

      if (onSyncBiomarkers) {
        onSyncBiomarkers({
          steps: data.steps,
          activeCalories: data.activeCalories,
          restingHR: data.restingHR,
          glucoseMgDl: data.glucoseMgDl,
          deviceName: deviceTitle
        });
      }

      onToast(`⚡ ซิงค์ข้อมูลสุขภาพจาก ${deviceTitle} สำเร็จ! (Active: ${data.activeCalories} kcal, ${data.steps.toLocaleString()} ก้าว)`);
    }, 1100);
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
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-red-50 via-teal-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
                <Watch size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-neutral-900 leading-tight">เชื่อมต่อข้อมูลสุขภาพ</h2>
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase">
                    Smart Health
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium">Smart Health / Apple Health / Garmin / CGM Real-time Sync</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1 text-sm">
            {/* Device selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 block">เลือกอุปกรณ์หรือบริการสุขภาพที่ต้องการเชื่อมต่อ:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'huawei_health', name: 'Smart Health', badge: 'แนะนำ', icon: '🔴', color: 'border-red-500 bg-red-50 text-red-900' },
                  { id: 'apple_health', name: 'Apple Health', badge: 'iOS', icon: '🍎', color: 'border-neutral-800 bg-neutral-50 text-neutral-900' },
                  { id: 'garmin', name: 'Garmin Connect', badge: 'GPS', icon: '⌚', color: 'border-blue-500 bg-blue-50 text-blue-900' },
                  { id: 'cgm_freestyle', name: 'CGM เซนเซอร์น้ำตาล', badge: 'Glucose', icon: '🩸', color: 'border-purple-500 bg-purple-50 text-purple-900' }
                ].map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDevice(d.id as any)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative ${
                      device === d.id
                        ? `${d.color} font-bold shadow-xs ring-2 ring-red-400/20`
                        : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-700 font-medium'
                    }`}
                  >
                    <div className="text-xl mb-1">{d.icon}</div>
                    <div className="text-xs leading-tight font-bold">{d.name}</div>
                    <span className="text-[9px] text-neutral-400 font-medium">{d.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Health Connection Card */}
            {device === 'huawei_health' && (
              <div className="p-4 rounded-2xl bg-linear-to-r from-red-50/80 via-white to-red-50/30 border border-red-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      HW
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-neutral-900">บัญชี HUAWEI ID & Smart Health</h3>
                      <p className="text-[11px] text-neutral-500 font-medium">
                        {isHuaweiLinked ? '🟢 เชื่อมต่อบัญชีสำเร็จแล้ว พร้อมดึงข้อมูลอัตโนมัติ' : '⚪ ยังไม่ได้เชื่อมต่อบัญชี HUAWEI ID'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleHuaweiLink}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isHuaweiLinked
                        ? 'bg-red-100 hover:bg-red-200 text-red-700'
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                    }`}
                  >
                    {isHuaweiLinked ? 'ตัดการเชื่อมต่อ' : '🔗 เชื่อมต่อ HUAWEI ID'}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-red-100 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowAuthGuide(!showAuthGuide)}
                    className="text-red-700 hover:text-red-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink size={13} />
                    <span>{showAuthGuide ? 'ซ่อนคู่มือการตั้งค่า' : 'วิธีเปิดสิทธิ์ในแอป Smart Health'}</span>
                  </button>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-neutral-600">
                    <input
                      type="checkbox"
                      checked={autoSyncEnabled}
                      onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                      className="accent-red-600 rounded"
                    />
                    <span>ซิงค์อัตโนมัติทุก 15 นาที</span>
                  </label>
                </div>

                {/* Authorization Instructions Collapse */}
                <AnimatePresence>
                  {showAuthGuide && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pt-2 text-xs text-neutral-600 space-y-1.5 bg-white/80 p-3 rounded-xl border border-red-100 font-normal leading-relaxed"
                    >
                      <div className="font-bold text-neutral-800 text-[11px] mb-1">📋 ขั้นตอนการอนุญาตในแอป Smart Health:</div>
                      <ol className="list-decimal list-inside space-y-1 text-[11px]">
                        <li>เปิดแอป <strong>Smart Health</strong> บนโทรศัพท์มือถือ</li>
                        <li>ไปที่เมนูด้านล่าง <strong>ฉัน (Me)</strong> ➔ <strong>การจัดการความเป็นส่วนตัว (Privacy management)</strong></li>
                        <li>เลือก <strong>การแชร์ข้อมูลและการอนุญาต (Data sharing and authorization)</strong></li>
                        <li>เลือก <strong>Kalguru Nutrition AI</strong> และกด <strong>"อนุญาตทั้งหมด"</strong> (ก้าวเดิน, แคลอรี่, อัตราเต้นหัวใจ, การนอนหลับ)</li>
                      </ol>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Sync trigger button */}
            <button
              type="button"
              onClick={handleSimulateSync}
              disabled={syncing}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                device === 'huawei_health'
                  ? 'bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white shadow-red-200'
                  : 'bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white shadow-teal-200'
              }`}
            >
              {syncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>กำลังดึงข้อมูลสัญญาณชีพและกิจกรรมจาก {device === 'huawei_health' ? 'Smart Health' : 'เซนเซอร์'}...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={15} />
                  <span>ดึงและซิงค์ข้อมูลล่าสุดจาก {device === 'huawei_health' ? 'Smart Health' : device === 'apple_health' ? 'Apple Health' : device === 'garmin' ? 'Garmin' : 'CGM'}</span>
                </>
              )}
            </button>

            {/* Synced Biomarkers Dashboard */}
            {syncedData && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-700 px-1">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 size={15} /> ข้อมูลสุขภาพซิงค์ล่าสุด ({syncedData.deviceName})
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">อัปเดต: {syncedData.lastSyncTime}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* 1. Steps */}
                  <div className="p-3 rounded-2xl bg-teal-50/80 border border-teal-200 space-y-1">
                    <span className="text-[10px] font-bold text-teal-800 uppercase block flex items-center gap-1">
                      <Compass size={12} /> ก้าวเดินวันนี้ (Steps)
                    </span>
                    <span className="text-lg font-black text-teal-950">{syncedData.steps.toLocaleString()}</span>
                    <span className="text-[10px] text-teal-700 block font-medium">ระยะทาง {syncedData.workoutDistanceKm} กม.</span>
                  </div>

                  {/* 2. Active Burn */}
                  <div className="p-3 rounded-2xl bg-orange-50/80 border border-orange-200 space-y-1">
                    <span className="text-[10px] font-bold text-orange-800 uppercase block flex items-center gap-1">
                      <Flame size={12} /> เบิร์นจริง (TruSport™)
                    </span>
                    <span className="text-lg font-black text-orange-950">+{syncedData.activeCalories}</span>
                    <span className="text-[10px] text-orange-700 block font-medium">kcal (ปรับโควต้าเพิ่มอัตโนมัติ)</span>
                  </div>

                  {/* 3. Heart Rate */}
                  <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-1">
                    <span className="text-[10px] font-bold text-rose-800 uppercase block flex items-center gap-1">
                      <Heart size={12} /> อัตราเต้นหัวใจ (TruSeen™)
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-rose-950">{syncedData.restingHR}</span>
                      <span className="text-[10px] text-neutral-500">RHR / Max {syncedData.maxHR} bpm</span>
                    </div>
                    <span className="text-[10px] text-rose-700 block font-medium">โซนแอโรบิกปกติ 🟢</span>
                  </div>

                  {/* 4. Sleep Quality */}
                  <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-800 uppercase block flex items-center gap-1">
                      <Moon size={12} /> คุณภาพการนอน (TruSleep™)
                    </span>
                    <span className="text-lg font-black text-indigo-950">{syncedData.sleepScore}/100</span>
                    <span className="text-[10px] text-indigo-700 block font-medium">ฟื้นตัวดีเยี่ยม (Deep Sleep 2.1h)</span>
                  </div>

                  {/* 5. SpO2 & Stress */}
                  <div className="p-3 rounded-2xl bg-sky-50/80 border border-sky-200 space-y-1">
                    <span className="text-[10px] font-bold text-sky-800 uppercase block flex items-center gap-1">
                      <Activity size={12} /> ออกซิเจนในเลือด & ความเครียด
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-sky-950">{syncedData.spO2}%</span>
                      <span className="text-[10px] text-sky-700">SpO2 | เครียด {syncedData.stressLevel}/100</span>
                    </div>
                    <span className="text-[10px] text-sky-700 block font-medium">สภาวะผ่อนคลาย (TruRelax)</span>
                  </div>

                  {/* 6. Glucose or VO2 Max */}
                  <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-1">
                    <span className="text-[10px] font-bold text-purple-800 uppercase block flex items-center gap-1">
                      <Zap size={12} /> VO2 Max & พลังงานคงเหลือ
                    </span>
                    <span className="text-lg font-black text-purple-950">{syncedData.vo2Max}</span>
                    <span className="text-[10px] text-purple-700 block font-medium">ระดับยอดเยี่ยม (Excellent)</span>
                  </div>
                </div>

                <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs text-neutral-600 leading-relaxed font-medium">
                  💡 <span className="font-bold text-neutral-800">Adaptive Nutrition Engine (การปรับโควต้าอัตโนมัติ):</span> ระบบเชื่อมโยงข้อมูลการเบิร์นจริง <strong>{syncedData.activeCalories} kcal</strong> และก้าวเดิน <strong>{syncedData.steps.toLocaleString()} ก้าว</strong> จาก <strong>Smart Health</strong> เข้ากับสมการคำนวณ TDEE เพื่อให้คุณทานอาหารได้อย่างเพียงพอโดยไม่ขาดสารอาหาร
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

