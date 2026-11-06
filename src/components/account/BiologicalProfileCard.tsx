import React, { useState, useEffect } from 'react';
import { Scale, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { UserProfile } from './AIMacroGoalCalculatorCard';
import { playSuccessChime, triggerHaptic } from '../../utils/voiceService';

interface BiologicalProfileCardProps {
  userProfile: UserProfile;
  onSaveProfile: (updatedProfile: UserProfile, notifyUser?: boolean) => void;
  onToast: (msg: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  bmr: number;
  tdee: number;
  bmi: number;
  bmiStatus: { text: string; color: string; bg: string };
}

export const BiologicalProfileCard: React.FC<BiologicalProfileCardProps> = ({
  userProfile,
  onSaveProfile,
  onToast,
  isExpanded,
  onToggleExpand,
  bmr,
  tdee,
  bmi,
  bmiStatus
}) => {
  const isCardExpanded = isExpanded !== undefined ? isExpanded : true;

  // Raw string states for smooth numeric typing without cursor jumps or backspace resets
  const [gender, setGender] = useState<'male' | 'female'>(userProfile.gender || 'male');
  const [rawAge, setRawAge] = useState<string>(() => String(userProfile.age || 59));
  const [rawWeight, setRawWeight] = useState<string>(() => String(userProfile.weight || 59));
  const [rawTargetWeight, setRawTargetWeight] = useState<string>(() => String(userProfile.targetWeight || userProfile.weight || 59));
  const [rawHeight, setRawHeight] = useState<string>(() => String(userProfile.height || 167));
  const [rawActivityLevel, setRawActivityLevel] = useState<string>(() => String(userProfile.activityLevel || 1.375));

  // Sync when userProfile prop updates externally
  useEffect(() => {
    setGender(userProfile.gender || 'male');
    setRawAge(String(userProfile.age || 59));
    setRawWeight(String(userProfile.weight || 59));
    setRawTargetWeight(String(userProfile.targetWeight || userProfile.weight || 59));
    setRawHeight(String(userProfile.height || 167));
    setRawActivityLevel(String(userProfile.activityLevel || 1.375));
  }, [userProfile]);

  const handleGenderToggle = (newGender: 'male' | 'female') => {
    setGender(newGender);
    const updated: UserProfile = {
      ...userProfile,
      gender: newGender,
      age: Number(rawAge) || 59,
      weight: parseFloat(rawWeight) || 59,
      targetWeight: parseFloat(rawTargetWeight) || 59,
      height: Number(rawHeight) || 167,
      activityLevel: parseFloat(rawActivityLevel) || 1.375
    };
    onSaveProfile(updated, false);
    triggerHaptic(15);
  };

  const handleSave = () => {
    const parsedAge = Math.max(10, Math.min(120, parseInt(rawAge, 10) || 59));
    const parsedWeight = Math.max(25, Math.min(300, parseFloat(rawWeight) || 59));
    const parsedTargetWeight = Math.max(25, Math.min(300, parseFloat(rawTargetWeight) || parsedWeight));
    const parsedHeight = Math.max(80, Math.min(250, parseInt(rawHeight, 10) || 167));
    const parsedAct = Math.max(1.0, Math.min(2.5, parseFloat(rawActivityLevel) || 1.375));

    setRawAge(String(parsedAge));
    setRawWeight(String(parsedWeight));
    setRawTargetWeight(String(parsedTargetWeight));
    setRawHeight(String(parsedHeight));
    setRawActivityLevel(String(parsedAct));

    const updated: UserProfile = {
      ...userProfile,
      gender,
      age: parsedAge,
      weight: parsedWeight,
      targetWeight: parsedTargetWeight,
      height: parsedHeight,
      activityLevel: parsedAct
    };

    onSaveProfile(updated, true);
    triggerHaptic([30, 20]);
    playSuccessChime();
    onToast(`💾 บันทึกข้อมูลสรีระสำเร็จ: ${gender === 'female' ? 'หญิง' : 'ชาย'} ${parsedAge} ปี • นน. ${parsedWeight} kg • สูง ${parsedHeight} cm`);
  };

  const activityPresets = [
    { label: '1.2 ไม่ออกกำลัง', value: 1.2 },
    { label: '1.38 เบา 1-3 วัน', value: 1.375 },
    { label: '1.55 ปานกลาง', value: 1.55 },
    { label: '1.72 หนัก 6 วัน', value: 1.725 },
  ];

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-neutral-100 space-y-3 w-full max-w-full overflow-hidden">
      
      {/* HEADER */}
      <div 
        onClick={onToggleExpand}
        className={`flex items-center justify-between gap-2 ${isCardExpanded ? 'border-b border-neutral-100 pb-2.5' : ''} ${onToggleExpand ? 'cursor-pointer select-none group' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Scale size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-sm font-black text-neutral-900 group-hover:text-orange-600 transition-colors whitespace-nowrap">
                ข้อมูลสรีระพื้นฐาน
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 whitespace-nowrap">
                {gender === 'female' ? 'หญิง' : 'ชาย'} {rawAge} ปี • {rawWeight} kg
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-medium mt-0.5 whitespace-nowrap">
              BMR {bmr.toLocaleString()} • TDEE {tdee.toLocaleString()} kcal • BMI {bmi}
            </p>
          </div>
        </div>
        {onToggleExpand && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center shrink-0 cursor-pointer">
            {isCardExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {isCardExpanded && (
        <div className="space-y-2 animate-in fade-in duration-200">
          
          {/* NUMERIC-ONLY HORIZONTAL INPUT ROWS */}
          <div className="space-y-1.5">
            {/* 👤 Gender Row */}
            <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-2.5 py-1.5 border border-neutral-200/70">
              <span className="text-base shrink-0">👤</span>
              <span className="text-xs font-bold text-neutral-700 min-w-[68px] shrink-0">เพศกำเนิด</span>
              <div className="flex-1 min-w-0 grid grid-cols-2 gap-1 bg-neutral-200/70 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleGenderToggle('male')}
                  className={`py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    gender === 'male' ? 'bg-orange-500 text-white shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <span>ชาย ♂</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenderToggle('female')}
                  className={`py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    gender === 'female' ? 'bg-orange-500 text-white shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <span>หญิง ♀</span>
                </button>
              </div>
            </div>

            {/* 🎂 Age Row */}
            <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-2.5 py-1.5 border border-neutral-200/70">
              <span className="text-base shrink-0">🎂</span>
              <span className="text-xs font-bold text-neutral-700 min-w-[68px] shrink-0">อายุ</span>
              <input
                type="number"
                inputMode="numeric"
                min="10"
                max="120"
                value={rawAge}
                onChange={(e) => setRawAge(e.target.value)}
                onBlur={() => {
                  const n = parseInt(rawAge, 10);
                  const valid = isNaN(n) ? (userProfile.age || 59) : Math.max(10, Math.min(120, n));
                  setRawAge(String(valid));
                  onSaveProfile({ ...userProfile, age: valid }, false);
                }}
                className="flex-1 min-w-0 bg-white border border-neutral-300 rounded-lg px-2 py-1 text-xs font-black text-neutral-800 text-center outline-none focus:ring-1 focus:ring-orange-400"
              />
              <span className="text-[11px] font-bold text-neutral-400 shrink-0">ปี</span>
            </div>

            {/* ⚖️ Current Weight Row */}
            <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-2.5 py-1.5 border border-neutral-200/70">
              <span className="text-base shrink-0">⚖️</span>
              <span className="text-xs font-bold text-neutral-700 min-w-[68px] shrink-0">น้ำหนักปัจจุบัน</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="25"
                max="300"
                value={rawWeight}
                onChange={(e) => setRawWeight(e.target.value)}
                onBlur={() => {
                  const n = parseFloat(rawWeight);
                  const valid = isNaN(n) ? (userProfile.weight || 59) : Math.max(25, Math.min(300, n));
                  setRawWeight(String(valid));
                  onSaveProfile({ ...userProfile, weight: valid }, false);
                }}
                className="flex-1 min-w-0 bg-white border border-neutral-300 rounded-lg px-2 py-1 text-xs font-black text-neutral-800 text-center outline-none focus:ring-1 focus:ring-orange-400"
              />
              <span className="text-[11px] font-bold text-neutral-400 shrink-0">กก.</span>
            </div>

            {/* 🎯 Target Weight Row */}
            <div className="flex items-center gap-2 bg-orange-50/60 rounded-xl px-2.5 py-1.5 border border-orange-200/60">
              <span className="text-base shrink-0">🎯</span>
              <span className="text-xs font-bold text-orange-700 min-w-[68px] shrink-0">นน.เป้าหมาย</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="25"
                max="300"
                value={rawTargetWeight}
                onChange={(e) => setRawTargetWeight(e.target.value)}
                onBlur={() => {
                  const n = parseFloat(rawTargetWeight);
                  const valid = isNaN(n) ? (userProfile.targetWeight || userProfile.weight || 59) : Math.max(25, Math.min(300, n));
                  setRawTargetWeight(String(valid));
                  onSaveProfile({ ...userProfile, targetWeight: valid }, false);
                }}
                className="flex-1 min-w-0 bg-white border border-orange-300 rounded-lg px-2 py-1 text-xs font-black text-orange-700 text-center outline-none focus:ring-1 focus:ring-orange-400"
              />
              <span className="text-[11px] font-bold text-orange-500 shrink-0">กก.</span>
            </div>

            {/* 📏 Height Row */}
            <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-2.5 py-1.5 border border-neutral-200/70">
              <span className="text-base shrink-0">📏</span>
              <span className="text-xs font-bold text-neutral-700 min-w-[68px] shrink-0">ส่วนสูง</span>
              <input
                type="number"
                inputMode="numeric"
                min="80"
                max="250"
                value={rawHeight}
                onChange={(e) => setRawHeight(e.target.value)}
                onBlur={() => {
                  const n = parseInt(rawHeight, 10);
                  const valid = isNaN(n) ? (userProfile.height || 167) : Math.max(80, Math.min(250, n));
                  setRawHeight(String(valid));
                  onSaveProfile({ ...userProfile, height: valid }, false);
                }}
                className="flex-1 min-w-0 bg-white border border-neutral-300 rounded-lg px-2 py-1 text-xs font-black text-neutral-800 text-center outline-none focus:ring-1 focus:ring-orange-400"
              />
              <span className="text-[11px] font-bold text-neutral-400 shrink-0">ซม.</span>
            </div>

            {/* 🏃 Activity Multiplier Row */}
            <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-2.5 py-1.5 border border-neutral-200/70">
              <span className="text-base shrink-0">🏃</span>
              <div className="min-w-[68px] shrink-0 flex flex-col leading-tight">
                <span className="text-xs font-bold text-neutral-700">กิจกรรม</span>
                <span className="text-[8px] text-neutral-400">TDEE Factor</span>
              </div>
              <input
                type="number"
                inputMode="decimal"
                step="0.025"
                min="1.0"
                max="2.5"
                value={rawActivityLevel}
                onChange={(e) => {
                  setRawActivityLevel(e.target.value);
                  const n = parseFloat(e.target.value);
                  if (!isNaN(n) && n >= 1.0 && n <= 2.5) {
                    onSaveProfile({ ...userProfile, activityLevel: n }, false);
                  }
                }}
                onBlur={() => {
                  const n = parseFloat(rawActivityLevel);
                  const valid = isNaN(n) ? (userProfile.activityLevel || 1.375) : Math.max(1.0, Math.min(2.5, n));
                  setRawActivityLevel(String(valid));
                  onSaveProfile({ ...userProfile, activityLevel: valid }, false);
                }}
                className="flex-1 min-w-0 bg-white border border-neutral-300 rounded-lg px-2 py-1 text-xs font-black text-neutral-800 text-center outline-none focus:ring-1 focus:ring-orange-400"
              />
              <span className="text-[11px] font-bold text-neutral-400 shrink-0">เท่า</span>
            </div>

            {/* Quick Activity Level Numeric Chips */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
              {activityPresets.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setRawActivityLevel(String(p.value));
                    onSaveProfile({ ...userProfile, activityLevel: p.value }, false);
                    triggerHaptic(10);
                  }}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border whitespace-nowrap cursor-pointer transition-colors ${
                    Math.abs(parseFloat(rawActivityLevel) - p.value) < 0.05
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-orange-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* METABOLIC STRIP */}
          <div className="bg-gradient-to-r from-neutral-50 to-orange-50/50 rounded-xl p-2 border border-orange-100 flex items-center justify-between text-xs flex-wrap gap-1">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-neutral-400 text-[10px]">BMR</span>
              <span className="text-neutral-800 font-black text-xs">{bmr.toLocaleString()}</span>
              <span className="text-neutral-300">•</span>
              <span className="text-orange-500 text-[10px]">TDEE</span>
              <span className="text-orange-600 font-black text-xs">{tdee.toLocaleString()} kcal</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-neutral-400 text-[10px]">BMI</span>
              <span className="font-bold text-neutral-800 text-xs">{bmi}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${bmiStatus.bg} ${bmiStatus.color}`}>
                {bmiStatus.text}
              </span>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-black active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save size={13} />
            <span>บันทึกข้อมูลสรีระพื้นฐาน</span>
          </button>
        </div>
      )}
    </div>
  );
};
