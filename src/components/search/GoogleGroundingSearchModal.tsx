import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Sparkles, 
  X, 
  ExternalLink, 
  Plus, 
  Utensils, 
  Flame, 
  Heart, 
  Check, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Copy, 
  CheckCircle2, 
  Globe, 
  Share2, 
  Clock, 
  ArrowRight, 
  TrendingUp, 
  HelpCircle, 
  Coffee, 
  Store, 
  ShieldCheck, 
  Loader2, 
  ChevronRight,
  BookOpen,
  Info
} from 'lucide-react';
import { ThaiVoiceRecognizer, speakThai, stopSpeaking, triggerHaptic } from '../../utils/voiceService';

export interface GroundedSearchResult {
  query: string;
  markdown: string;
  structuredData?: {
    isFood?: boolean;
    foodName?: string;
    servingSize?: string;
    calories?: number;
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
    sugarGrams?: number;
    sodiumMg?: number;
    healthRating?: number;
    tags?: string[];
    keyHighlights?: string[];
    actionableAdvice?: string;
    topic?: string;
  };
  sources: { title: string; uri: string }[];
  searchQueries?: string[];
  modelUsed?: string;
}

interface GoogleGroundingSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMealToDiary?: (meal: {
    foodName: string;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    sugarGrams?: number;
    sodiumMg?: number;
    explanation: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  }) => void;
  onLogMeal?: (meal: {
    foodName: string;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    sugarGrams?: number;
    sodiumMg?: number;
    explanation: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  }) => void;
  onToast: (msg: string) => void;
  defaultCategory?: string;
}

const CURATED_SEARCH_SUGGESTIONS = [
  { label: '☕ อเมริกาโน่ไม่หวาน vs ลาเต้เย็น Starbucks แคลอรี่', category: 'drinks' },
  { label: '🍲 สุกี้ตี๋น้อย กินอะไรไม่อ้วน แคลอรี่ต่ำ', category: 'restaurant' },
  { label: '🏪 อกไก่นุ่ม 7-Eleven โปรตีนและโซเดียมเท่าไหร่', category: 'brands' },
  { label: '🥗 กรดไหลย้อน ห้ามกินอะไร และควรกินอะไร', category: 'health' },
  { label: '🍳 โปรตีนในไข่ต้ม vs อกไก่ 100 กรัม', category: 'nutrition' },
  { label: '🥤 ชาเขียวนม Cafe Amazon หวาน 25% กี่แคลอรี่', category: 'drinks' },
  { label: '🥑 Intermittent Fasting 16/8 งานวิจัยล่าสุด', category: 'health' },
  { label: '🍜 บะหมี่กึ่งสำเร็จรูป ลดโซเดียมได้อย่างไร', category: 'nutrition' },
  { label: '🔥 บุฟเฟ่ต์หมูกระทะ ชาบู นับแคลอรี่และวิธีกินไม่ให้อ้วน', category: 'restaurant' },
  { label: '💊 Creatine กับ Whey Protein กินตอนไหนดีที่สุด', category: 'nutrition' }
];

const SEARCH_CATEGORIES = [
  { id: 'all', label: '🔍 ทั้งหมด', icon: Globe },
  { id: 'drinks', label: '☕ แบรนด์ & เครื่องดื่ม', icon: Coffee },
  { id: 'restaurant', label: '🍲 ร้านดัง & บุฟเฟ่ต์', icon: Store },
  { id: 'nutrition', label: '📊 แคลอรี่ & สารอาหาร', icon: Flame },
  { id: 'health', label: '🩺 สุขภาพ & โรคประจำตัว', icon: Heart }
];

export const GoogleGroundingSearchModal: React.FC<GoogleGroundingSearchModalProps> = ({
  isOpen,
  onClose,
  onAddMealToDiary,
  onLogMeal,
  onToast,
  defaultCategory = 'all'
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<GroundedSearchResult | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kalguru_grounded_recent_searches');
      return saved ? JSON.parse(saved) : [
        'แคลอรี่ ลาเต้เย็น Starbucks หวาน 0%',
        'สุกี้ตี๋น้อย กี่แคลอรี่',
        'อกไก่ 7-Eleven โปรตีน',
        'อาหารลดกรดไหลย้อน'
      ];
    } catch {
      return [];
    }
  });

  // Voice Recognition
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const [isSpeakingResult, setIsSpeakingResult] = useState<boolean>(false);
  const voiceRecognizerRef = useRef<ThaiVoiceRecognizer | null>(null);

  // Meal Diary target type
  const [targetMealType, setTargetMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [portionScale, setPortionScale] = useState<number>(1.0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    try {
      voiceRecognizerRef.current = new ThaiVoiceRecognizer({
        onTranscriptChange: (transcript, isFinal) => {
          setSearchQuery(transcript);
          if (isFinal) {
            setIsVoiceListening(false);
            executeSearch(transcript, selectedCategory);
          }
        },
        onError: (err) => {
          console.error('Voice error:', err);
          setIsVoiceListening(false);
          onToast('เกิดข้อผิดพลาดในการฟังเสียง กรุณาลองพิมพ์ข้อความแทน');
        }
      });
    } catch (e) {
      console.warn('Voice recognition not supported:', e);
    }

    return () => {
      stopSpeaking();
      if (voiceRecognizerRef.current) {
        voiceRecognizerRef.current.stop();
      }
    };
  }, [selectedCategory]);

  const toggleVoiceInput = () => {
    triggerHaptic();
    if (!voiceRecognizerRef.current) {
      onToast('เบราว์เซอร์นี้ไม่รองรับการสั่งงานด้วยเสียง');
      return;
    }
    if (isVoiceListening) {
      voiceRecognizerRef.current.stop();
      setIsVoiceListening(false);
    } else {
      setIsVoiceListening(true);
      voiceRecognizerRef.current.start();
      onToast('🎙️ กำลังฟังเสียงภาษาไทย... พูดชื่ออาหารหรือคำถามสุขภาพได้เลย');
    }
  };

  const handleReadAloud = (textToRead: string) => {
    triggerHaptic();
    if (isSpeakingResult) {
      stopSpeaking();
      setIsSpeakingResult(false);
    } else {
      // Clean markdown tags for natural speech
      const plainText = textToRead
        .replace(/[#*`_~[\]()]/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .trim();

      setIsSpeakingResult(true);
      speakThai(plainText, () => setIsSpeakingResult(false));
    }
  };

  const executeSearch = async (queryToSearch: string, category: string = selectedCategory) => {
    const trimmed = queryToSearch.trim();
    if (!trimmed) {
      onToast('กรุณากรอกคำค้นหา');
      return;
    }

    stopSpeaking();
    setIsSpeakingResult(false);
    setIsLoading(true);
    triggerHaptic();

    // Update recent searches
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('kalguru_grounded_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    try {
      const res = await fetch('/api/search-grounded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          category,
          userContext: {
            app: 'GooKal',
            locale: 'th-TH',
            timezone: 'Asia/Bangkok'
          }
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error('Search error:', err);
      onToast('ไม่สามารถค้นหาข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFoodToDiary = () => {
    if (!result?.structuredData?.isFood) return;
    triggerHaptic();

    const data = result.structuredData;
    const baseCal = Number(data.calories || 0);
    const baseP = Number(data.proteinGrams || 0);
    const baseC = Number(data.carbsGrams || 0);
    const baseF = Number(data.fatGrams || 0);
    const baseSugar = Number(data.sugarGrams || 0);
    const baseSodium = Number(data.sodiumMg || 0);

    const scaledCal = Math.round(baseCal * portionScale);
    const scaledP = Math.round(baseP * portionScale * 10) / 10;
    const scaledC = Math.round(baseC * portionScale * 10) / 10;
    const scaledF = Math.round(baseF * portionScale * 10) / 10;
    const scaledSugar = Math.round(baseSugar * portionScale * 10) / 10;
    const scaledSodium = Math.round(baseSodium * portionScale);

    const logFn = onLogMeal || onAddMealToDiary;
    if (logFn) {
      logFn({
        foodName: data.foodName || result.query,
        calories: scaledCal,
        proteinGrams: scaledP,
        carbsGrams: scaledC,
        fatGrams: scaledF,
        sugarGrams: scaledSugar,
        sodiumMg: scaledSodium,
        explanation: `ค้นหาด้วย Google Search Grounding: ${data.servingSize || '1 เสิร์ฟ'} (สัดส่วน ${portionScale}x)`,
        mealType: targetMealType
      });
    }

    const mealLabel = targetMealType === 'breakfast' ? 'มื้อเช้า' : targetMealType === 'lunch' ? 'มื้อกลางวัน' : targetMealType === 'dinner' ? 'มื้อเย็น' : 'ของว่าง';
    onToast(`✅ บันทึก "${data.foodName || result.query}" (${scaledCal} kcal) ลงใน ${mealLabel} สำเร็จ!`);
    onClose();
  };

  const handleCopyResult = () => {
    triggerHaptic();
    if (!result) return;
    const textToCopy = `🔍 ข้อมูลจาก GooKal Google Search Grounding:\n${result.query}\n\n${result.markdown}\n\nแหล่งอ้างอิง:\n${result.sources.map(s => `• ${s.title}: ${s.uri}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedLink(true);
    onToast('📋 คัดลอกข้อมูลและแหล่งอ้างอิงแล้ว');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div 
      id="google-grounding-search-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="google-grounding-search-modal-container"
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-neutral-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Globe size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                  Google Search Grounded Intelligence
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                  Google Search Live
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">
                ค้นหาข้อมูลโภชนาการ เมนูร้านดัง แคลอรี่ และวิทยาศาสตร์สุขภาพแบบเรียลไทม์
              </p>
            </div>
          </div>
          <button
            id="btn-close-grounded-search-modal"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar & Category Filter */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 bg-neutral-50/60 space-y-3">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-emerald-600 pointer-events-none">
              <Search size={20} />
            </div>
            <input
              id="input-grounded-search-query"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  executeSearch(searchQuery);
                }
              }}
              placeholder="ค้นหา เช่น แคลอรี่ ชาเขียว Starbucks, สุกี้ตี๋น้อย, อาหารลดกรดไหลย้อน..."
              className="w-full bg-white pl-12 pr-28 py-3.5 rounded-2xl border border-neutral-200/90 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs transition-all"
            />
            
            <div className="absolute right-2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 transition-colors"
                >
                  <X size={16} />
                </button>
              )}

              <button
                type="button"
                id="btn-grounded-search-voice"
                onClick={toggleVoiceInput}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isVoiceListening 
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-md shadow-rose-500/30' 
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
                }`}
                title="ค้นหาด้วยเสียงภาษาไทย"
              >
                {isVoiceListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button
                type="button"
                id="btn-grounded-search-submit"
                onClick={() => executeSearch(searchQuery)}
                disabled={isLoading || !searchQuery.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <span>ค้นหา</span>
                )}
              </button>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {SEARCH_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (searchQuery.trim()) {
                      executeSearch(searchQuery, cat.id);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-neutral-900 text-white shadow-xs' 
                      : 'bg-white text-neutral-600 border border-neutral-200/80 hover:bg-neutral-100'
                  }`}
                >
                  <Icon size={13} className={isSelected ? 'text-emerald-400' : 'text-neutral-500'} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 animate-ping absolute opacity-70"></div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 relative">
                  <Globe size={28} className="animate-spin text-white" />
                </div>
              </div>
              <div>
                <h4 className="text-base font-bold text-neutral-900">กำลังดึงข้อมูลเรียลไทม์จาก Google Search...</h4>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  Gemini 2.5 Flash กำลังค้นหาข้อมูลโภชนาการที่ถูกต้อง ตรวจสอบเมนูจากแหล่งข้อมูลทางการ และประมวลผลข้อเท็จจริง
                </p>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Google Verified Grounding Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <span>ยืนยันข้อมูลอ้างอิงล่าสุดผ่าน Google Search ({result.sources.length} แหล่งข้อมูล)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReadAloud(result.markdown)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      isSpeakingResult
                        ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {isSpeakingResult ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    <span>{isSpeakingResult ? 'หยุดอ่าน' : 'ฟังเสียง'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyResult}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100 text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedLink ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedLink ? 'คัดลอกแล้ว' : 'แชร์'}</span>
                  </button>
                </div>
              </div>

              {/* Food Structured Card (If Detected as Food/Drink) */}
              {result.structuredData?.isFood && (
                <div className="bg-gradient-to-br from-white via-orange-50/30 to-amber-50/50 rounded-3xl p-5 border border-orange-200/90 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-orange-100 text-orange-800 rounded-md">
                          🍽️ ข้อมูลโภชนาการ
                        </span>
                        {result.structuredData.servingSize && (
                          <span className="text-xs text-neutral-500 font-medium">
                            ขนาดเสิร์ฟ: {result.structuredData.servingSize}
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-black text-neutral-900 mt-1">
                        {result.structuredData.foodName || result.query}
                      </h4>
                    </div>

                    <div className="text-right shrink-0 bg-white px-3.5 py-2 rounded-2xl border border-orange-100 shadow-2xs">
                      <div className="text-2xl font-black text-orange-600">
                        {Math.round((result.structuredData.calories || 0) * portionScale)}
                      </div>
                      <div className="text-[10px] font-bold text-neutral-400 uppercase">kcal</div>
                    </div>
                  </div>

                  {/* Macronutrient Pills */}
                  <div className="grid grid-cols-5 gap-2 text-center">
                    <div className="p-2.5 rounded-2xl bg-white border border-neutral-100 shadow-2xs">
                      <div className="text-xs font-bold text-blue-600">
                        {Math.round((result.structuredData.proteinGrams || 0) * portionScale * 10) / 10}g
                      </div>
                      <div className="text-[10px] text-neutral-400 font-medium mt-0.5">โปรตีน</div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white border border-neutral-100 shadow-2xs">
                      <div className="text-xs font-bold text-amber-600">
                        {Math.round((result.structuredData.carbsGrams || 0) * portionScale * 10) / 10}g
                      </div>
                      <div className="text-[10px] text-neutral-400 font-medium mt-0.5">คาร์บ</div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white border border-neutral-100 shadow-2xs">
                      <div className="text-xs font-bold text-rose-600">
                        {Math.round((result.structuredData.fatGrams || 0) * portionScale * 10) / 10}g
                      </div>
                      <div className="text-[10px] text-neutral-400 font-medium mt-0.5">ไขมัน</div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white border border-neutral-100 shadow-2xs">
                      <div className="text-xs font-bold text-purple-600">
                        {Math.round((result.structuredData.sugarGrams || 0) * portionScale * 10) / 10}g
                      </div>
                      <div className="text-[10px] text-neutral-400 font-medium mt-0.5">น้ำตาล</div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white border border-neutral-100 shadow-2xs">
                      <div className="text-xs font-bold text-neutral-700">
                        {Math.round((result.structuredData.sodiumMg || 0) * portionScale)}mg
                      </div>
                      <div className="text-[10px] text-neutral-400 font-medium mt-0.5">โซเดียม</div>
                    </div>
                  </div>

                  {/* Add to Diary Action Controls */}
                  <div className="pt-2 border-t border-orange-100/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-600">บันทึกลง:</span>
                      <div className="grid grid-cols-4 gap-1">
                        {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(mType => (
                          <button
                            key={mType}
                            type="button"
                            onClick={() => setTargetMealType(mType)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              targetMealType === mType 
                                ? 'bg-orange-500 text-white shadow-2xs' 
                                : 'bg-white text-neutral-600 border border-neutral-200'
                            }`}
                          >
                            {mType === 'breakfast' ? 'เช้า' : mType === 'lunch' ? 'เที่ยง' : mType === 'dinner' ? 'เย็น' : 'ว่าง'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-neutral-200 text-xs">
                        <span className="text-neutral-500 font-medium">สัดส่วน:</span>
                        <select
                          value={portionScale}
                          onChange={(e) => setPortionScale(Number(e.target.value))}
                          className="font-bold text-neutral-800 bg-transparent focus:outline-none"
                        >
                          <option value={0.5}>0.5 จาน/แก้ว</option>
                          <option value={0.75}>0.75 จาน/แก้ว</option>
                          <option value={1.0}>1.0 จาน/แก้ว</option>
                          <option value={1.25}>1.25 จาน/แก้ว</option>
                          <option value={1.5}>1.5 จาน/แก้ว</option>
                          <option value={2.0}>2.0 จาน/แก้ว</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        id="btn-add-searched-food-to-diary"
                        onClick={handleAddFoodToDiary}
                        className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <Plus size={14} className="text-emerald-400" />
                        <span>บันทึกเป็นมื้ออาหาร</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Comprehensive Answer Markdown */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-100 shadow-2xs space-y-3 leading-relaxed text-sm text-neutral-800">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                  <BookOpen size={16} className="text-emerald-600" />
                  <h4 className="font-bold text-neutral-900">สรุปคำตอบ & ข้อมูลเชิงลึกจาก Google</h4>
                </div>
                
                <div className="prose prose-sm max-w-none text-neutral-700 space-y-3 whitespace-pre-line font-normal">
                  {result.markdown}
                </div>

                {result.structuredData?.actionableAdvice && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
                    <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Coach ProTip: </span>
                      <span>{result.structuredData.actionableAdvice}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Web Grounding Sources (Google Search Links) */}
              {result.sources.length > 0 && (
                <div className="bg-neutral-50 rounded-3xl p-4 sm:p-5 border border-neutral-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
                      <Globe size={15} className="text-emerald-600" />
                      <span>แหล่งข้อมูลอ้างอิงจากเว็บ (Google Search Sources)</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-medium">คลิกเพื่อเปิดเว็บต้นทาง</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-2xl bg-white border border-neutral-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex items-start justify-between gap-2 group shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-neutral-900 group-hover:text-emerald-700 truncate">
                            {source.title || 'แหล่งข้อมูลอ้างอิง'}
                          </div>
                          <div className="text-[10px] text-neutral-400 truncate mt-0.5 font-mono">
                            {source.uri}
                          </div>
                        </div>
                        <ExternalLink size={14} className="text-neutral-400 group-hover:text-emerald-600 shrink-0 mt-0.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Initial View / Recommendations */
            <div className="space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-neutral-400" />
                      <span>การค้นหาล่าสุด</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentSearches([]);
                        try { localStorage.removeItem('kalguru_grounded_recent_searches'); } catch {}
                      }}
                      className="text-[11px] text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    >
                      ล้างประวัติ
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSearchQuery(item);
                          executeSearch(item);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span>{item}</span>
                        <ChevronRight size={12} className="text-neutral-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Curated Topics */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
                  <TrendingUp size={15} className="text-orange-500" />
                  <span>คำถามและเมนูยอดนิยมที่คนค้นหาบ่อย</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CURATED_SEARCH_SUGGESTIONS.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSearchQuery(sug.label);
                        setSelectedCategory(sug.category);
                        executeSearch(sug.label, sug.category);
                      }}
                      className="text-left p-3 rounded-2xl bg-white border border-neutral-200/80 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all flex items-center justify-between gap-2 shadow-2xs group cursor-pointer active:scale-[0.99]"
                    >
                      <span className="text-xs font-semibold text-neutral-800 group-hover:text-emerald-800">
                        {sug.label}
                      </span>
                      <ArrowRight size={14} className="text-neutral-300 group-hover:text-emerald-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Google Search Grounding Capability Highlights */}
              <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-50/60 to-teal-50/60 border border-emerald-100 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Sparkles size={16} className="text-emerald-600" />
                  <span>พลังแห่ง Google Search Grounding ใน GooKal</span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  ระบบเชื่อมต่อกับ Google Search ดึงข้อมูลเมนูร้านดังใหม่ล่าสุด (Starbucks, Amazon, ตี๋น้อย, 7-Eleven, MK), ค่าสารอาหารจริง, วิธีดูแลสุขภาพตามโรคประจำตัว, และงานวิจัยโภชนาการระดับสากล พร้อมสามารถบันทึกลงไดอารี่อาหารของคุณได้ในคลิกเดียว
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-neutral-100 bg-neutral-50/70 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-1.5">
            <Globe size={13} className="text-emerald-600" />
            <span className="font-semibold text-neutral-700">Google Search Powered</span>
            <span>• Gemini 2.5 Flash</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold transition-all cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
