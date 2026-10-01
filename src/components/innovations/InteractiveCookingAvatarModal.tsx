import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChefHat, Volume2, VolumeX, Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Check, Users, PackageCheck, Sparkles } from 'lucide-react';
import { deductIngredientsAfterCooking } from '../../utils/foodPantryStore';

interface InteractiveCookingAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe?: {
    name?: string;
    prepTime?: number;
    servings?: number;
    ingredients?: (string | { name: string; amount: string })[];
    steps?: string[];
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  onLogFinishedDish?: (dish: { title: string; calories: number; protein: number; carbs: number; fat: number }) => void;
  onToast: (msg: string) => void;
}

const DEFAULT_RECIPE = {
  name: 'อกไก่ผัดพริกไทยดำบล็อกโคลี่คลีน',
  prepTime: 15,
  servings: 1,
  ingredients: [
    { name: 'อกไก่หั่นเต๋า', amount: '180 กรัม' },
    { name: 'บรอกโคลีหั่นช่อ', amount: '100 กรัม' },
    { name: 'พริกไทยดำบดหยาบ', amount: '1 ช้อนชา' },
    { name: 'ซีอิ๊วขาวลดโซเดียม', amount: '1 ช้อนโต๊ะ' },
    { name: 'น้ำมันมะกอก', amount: '1/2 ช้อนชา' }
  ],
  steps: [
    'ตั้งกระทะไฟปานกลาง ใส่น้ำมันมะกอก 1/2 ช้อนชา รอจนกระทะเริ่มร้อน',
    'ใส่อกไก่ลงไปผัดจนเปลี่ยนเป็นสีขาวสุกทั่วประมาณ 3-4 นาที',
    'ใส่บรอกโคลีลงไปผัด เติมน้ำสะอาด 2 ช้อนโต๊ะแล้วปิดฝาอบ 2 นาทีให้บรอกโคลีกรอบหวาน',
    'ปรุงรสด้วยซีอิ๊วขาวลดโซเดียมและพริกไทยดำ คลุกเคล้าให้เข้ากัน 1 นาที ยกลงเสิร์ฟร้อนๆ'
  ],
  calories: 320,
  protein: 35,
  carbs: 12,
  fat: 8
};

export const InteractiveCookingAvatarModal: React.FC<InteractiveCookingAvatarModalProps> = ({
  isOpen,
  onClose,
  recipe,
  onLogFinishedDish,
  onToast
}) => {
  const activeRecipe = recipe || DEFAULT_RECIPE;
  const rawIngredients = activeRecipe.ingredients || DEFAULT_RECIPE.ingredients;
  const formattedIngredients = rawIngredients.map((item: any) => {
    if (typeof item === 'string') {
      return { name: item, amount: 'ตามสัดส่วน' };
    }
    return item;
  });

  const stepsList = activeRecipe.steps && activeRecipe.steps.length > 0 ? activeRecipe.steps : DEFAULT_RECIPE.steps;

  const [currentStep, setCurrentStep] = useState(0);
  const [servingsScale, setServingsScale] = useState(activeRecipe.servings || 1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [autoDeductInventory, setAutoDeductInventory] = useState(true);

  // Step Timer
  const [stepTimer, setStepTimer] = useState(120);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setStepTimer(120);
      setTimerRunning(false);
    }
  }, [isOpen, recipe]);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning && stepTimer > 0) {
      interval = setInterval(() => {
        setStepTimer(t => t - 1);
      }, 1000);
    } else if (stepTimer === 0 && timerRunning) {
      setTimerRunning(false);
      onToast('⏰ หมดเวลาของขั้นตอนนี้แล้ว! ไปขั้นตอนต่อไปได้เลย');
    }
    return () => clearInterval(interval);
  }, [timerRunning, stepTimer, onToast]);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !ttsEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextStep = () => {
    if (currentStep < stepsList.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      setStepTimer(120);
      setTimerRunning(false);
      if (ttsEnabled) {
        speakText(`ขั้นตอนที่ ${next + 1}: ${stepsList[next]}`);
      }
    } else {
      // Finished Cooking
      const dishTitle = activeRecipe.name || 'เมนูคลีนปรุงเอง';
      const cals = (activeRecipe.calories || 320) * servingsScale;
      const prot = (activeRecipe.protein || 35) * servingsScale;
      const carbs = (activeRecipe.carbs || 12) * servingsScale;
      const fat = (activeRecipe.fat || 8) * servingsScale;

      if (autoDeductInventory) {
        const ingredientNames = formattedIngredients.map((i: any) => i.name);
        deductIngredientsAfterCooking(ingredientNames, onToast);
      }

      if (onLogFinishedDish) {
        onLogFinishedDish({
          title: dishTitle,
          calories: cals,
          protein: prot,
          carbs: carbs,
          fat: fat
        });
      }

      onToast(`🎉 ปรุง "${dishTitle}" เสร็จสมบูรณ์! บันทึกโภชนาการลงในไดอารี่เรียบร้อย`);
      onClose();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      setStepTimer(120);
      setTimerRunning(false);
      if (ttsEnabled) {
        speakText(`ย้อนกลับขั้นตอนที่ ${prev + 1}: ${stepsList[prev]}`);
      }
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
          className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-neutral-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <ChefHat size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 leading-tight">เชฟ AI สอนทำอาหารสด (Step-by-Step)</h2>
                <p className="text-xs text-neutral-600 font-bold truncate max-w-xs">{activeRecipe.name || 'เมนูคลีนปรุงสด'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  ttsEnabled ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-neutral-100 text-neutral-400 border-neutral-200'
                }`}
                title={ttsEnabled ? 'เปิดเสียงขานขั้นตอน' : 'ปิดเสียง'}
              >
                {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1 text-sm">
            {/* Servings & Inventory Auto-deduct options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-center justify-between bg-neutral-50 p-3 rounded-2xl border border-neutral-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                  <Users size={15} className="text-emerald-600" />
                  <span>ที่เสิร์ฟ:</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setServingsScale(num)}
                      className={`w-7 h-7 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        servingsScale === num
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between bg-neutral-50 p-3 rounded-2xl border border-neutral-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                  <PackageCheck size={15} className="text-emerald-600" />
                  <span>ตัดสต็อกตู้เย็นอัตโนมัติ:</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoDeductInventory}
                  onChange={(e) => setAutoDeductInventory(e.target.checked)}
                  className="accent-emerald-600 rounded w-4 h-4 cursor-pointer"
                />
              </div>
            </div>

            {/* Ingredients quick check */}
            <div className="bg-emerald-50/60 border border-emerald-200/80 p-3.5 rounded-2xl">
              <span className="text-xs font-bold text-emerald-900 block mb-1.5">วัตถุดิบที่ต้องใช้ (ปรับสัดส่วนสำหรับ {servingsScale} ที่):</span>
              <div className="grid grid-cols-2 gap-2 text-xs text-emerald-800">
                {(formattedIngredients || []).map((ing: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{ing.name} {ing.amount ? `(${ing.amount})` : ''}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Card Visual */}
            <div className="bg-neutral-900 text-white p-6 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                  ขั้นตอนที่ {currentStep + 1} จาก {stepsList.length}
                </span>

                {/* Live timer */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-neutral-300">
                    ⏱️ {Math.floor(stepTimer / 60)}:{(stepTimer % 60).toString().padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTimerRunning(!timerRunning)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                  >
                    {timerRunning ? <Pause size={12} /> : <Play size={12} />}
                  </button>
                </div>
              </div>

              <div className="min-h-[90px] flex items-center">
                <p className="text-base font-semibold text-neutral-100 leading-relaxed">
                  {stepsList[currentStep] || ''}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / Math.max(1, stepsList.length)) * 100}%` }}
                />
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className="py-3 px-4 rounded-2xl bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-neutral-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>ย้อนกลับ</span>
              </button>

              <button
                type="button"
                onClick={() => speakText(`ขั้นตอนที่ ${currentStep + 1}: ${stepsList[currentStep] || ''}`)}
                className="py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200 transition-colors cursor-pointer"
              >
                <Volume2 size={16} />
                <span>อ่านเสียง</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200 transition-all cursor-pointer"
              >
                <span>{currentStep === stepsList.length - 1 ? 'เสร็จสิ้นการปรุง' : 'ขั้นตอนถัดไป'}</span>
                {currentStep === stepsList.length - 1 ? <Check size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
