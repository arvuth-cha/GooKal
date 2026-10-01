import React, { useState, useRef } from 'react';
import { 
  Scan, 
  Camera, 
  Image as ImageIcon, 
  Loader2, 
  Check, 
  X, 
  Sparkles, 
  AlertCircle, 
  ShieldCheck, 
  Utensils,
  Maximize2
} from 'lucide-react';

interface NutritionLabelScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogMeal: (mealData: {
    foodName: string;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    sugarGrams?: number;
    sodiumMg?: number;
    explanation: string;
  }) => void;
  onToast: (msg: string) => void;
}

interface ParsedLabel {
  foodName: string;
  servingSize?: string;
  servingsPerContainer?: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  sugarGrams?: number;
  sodiumMg?: number;
  fiberGrams?: number;
  explanation: string;
}

export const NutritionLabelScannerModal: React.FC<NutritionLabelScannerModalProps> = ({
  isOpen,
  onClose,
  onLogMeal,
  onToast
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ParsedLabel | null>(null);
  const [servingsMultiplier, setServingsMultiplier] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('กรุณาอัปโหลดไฟล์รูปภาพที่ถูกต้อง');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImage(base64);
      analyzeLabel(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeLabel = async (base64Data: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze-nutrition-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data })
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถวิเคราะห์ฉลากโภชนาการได้');
      }

      const data: ParsedLabel = await response.json();
      setResult(data);
      onToast('🔍 สแกนฉลากโภชนาการสำเร็จเรียบร้อย!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดในการสแกนฉลากโภชนาการ โปรดลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmLog = () => {
    if (!result) return;
    const mult = servingsMultiplier || 1;

    onLogMeal({
      foodName: `${result.foodName} ${mult !== 1 ? `(${mult} เสิร์ฟ)` : ''}`,
      calories: Math.round(result.calories * mult),
      proteinGrams: Math.round(result.proteinGrams * mult),
      carbsGrams: Math.round(result.carbsGrams * mult),
      fatGrams: Math.round(result.fatGrams * mult),
      sugarGrams: result.sugarGrams ? Math.round(result.sugarGrams * mult) : undefined,
      sodiumMg: result.sodiumMg ? Math.round(result.sodiumMg * mult) : undefined,
      explanation: `สแกนจากฉลากโภชนาการ: ${result.explanation}`
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-b from-blue-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Scan size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">สแกนฉลากโภชนาการ (Nutrition Facts)</h2>
              <p className="text-xs text-neutral-500 font-medium">ถ่ายตารางโภชนาการหลังซอง AI จะอ่านสารอาหารให้อัตโนมัติ</p>
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Upload Area */}
          {!image && !loading && (
            <div className="space-y-4">
              <div className="p-8 border-2 border-dashed border-neutral-200 rounded-3xl text-center space-y-4 bg-neutral-50/50 hover:bg-blue-50/20 transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                  <Maximize2 size={28} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-neutral-900">ถ่ายรูปตารางโภชนาการ หรือบาร์โค้ด</h4>
                  <p className="text-xs text-neutral-500">รองรับทั้งภาษาไทยและภาษาอังกฤษ ชัดเจน รวดเร็ว</p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  />

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
                  >
                    <Camera size={16} />
                    <span>ถ่ายรูปด้วยกล้อง</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ImageIcon size={16} />
                    <span>เลือกจากคลังภาพ</span>
                  </button>
                </div>
              </div>

              {/* Demo Presets */}
              <div className="p-4 rounded-3xl bg-neutral-50 border border-neutral-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-700">💡 หรือทดลองด้วยตัวอย่างฉลากจำลอง:</span>
                  <span className="text-[10px] text-neutral-400">ไม่ต้องใช้รูปจริง</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      foodName: 'เวย์โปรตีน Isolate วานิลลา',
                      servingSize: '1 สกู๊ป (32g)',
                      calories: 120,
                      proteinGrams: 27,
                      carbsGrams: 1,
                      fatGrams: 0.5,
                      sugarGrams: 0,
                      sodiumMg: 140,
                      explanation: 'โปรตีนบริสุทธิ์สูง คาร์บและไขมันต่ำมาก เหมาะสำหรับการฟื้นฟูกล้ามเนื้อ'
                    },
                    {
                      foodName: 'อกไก่นุ่มพริกไทยดำพร้อมทาน',
                      servingSize: '1 ซอง (100g)',
                      calories: 110,
                      proteinGrams: 23,
                      carbsGrams: 2,
                      fatGrams: 1.5,
                      sugarGrams: 1,
                      sodiumMg: 490,
                      explanation: 'อาหารยอดนิยมในร้านสะดวกซื้อ โปรตีนสูง โซเดียมปานกลาง'
                    },
                    {
                      foodName: 'นมโอ๊ต ออร์แกนิกสูตรไม่เติมน้ำตาล',
                      servingSize: '1 แก้ว (250ml)',
                      calories: 95,
                      proteinGrams: 3,
                      carbsGrams: 14,
                      fatGrams: 3.5,
                      sugarGrams: 2,
                      sodiumMg: 90,
                      explanation: 'นมพืชไขมันต่ำ ไม่มีแลคโตส มีเบต้ากลูแคนช่วยลดคอเลสเตอรอล'
                    }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setResult(preset);
                        onToast(`✨ โหลดตัวอย่างฉลาก: ${preset.foodName}`);
                      }}
                      className="p-2.5 text-left rounded-2xl bg-white hover:bg-blue-50 border border-neutral-200 hover:border-blue-300 transition-all cursor-pointer shadow-2xs"
                    >
                      <h5 className="font-bold text-xs text-neutral-800 line-clamp-1">{preset.foodName}</h5>
                      <p className="text-[10px] text-neutral-500 font-medium mt-0.5">
                        {preset.calories} kcal • P: {preset.proteinGrams}g
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading Spinner */}
          {loading && (
            <div className="py-12 text-center space-y-4">
              <Loader2 size={36} className="animate-spin text-blue-600 mx-auto" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-neutral-900">กำลังอ่านตารางโภชนาการและบาร์โค้ด...</p>
                <p className="text-xs text-neutral-400">AI กำลังถอดรหัส แคลอรี่, โปรตีน, คาร์บ, ไขมัน, น้ำตาล, โซเดียม</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Analysis Result */}
          {result && !loading && (
            <div className="space-y-4">
              {/* Product Title */}
              <div className="p-4 rounded-3xl bg-neutral-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">ชื่ออาหาร/ผลิตภัณฑ์</span>
                  <h3 className="font-bold text-base mt-0.5">{result.foodName}</h3>
                  {result.servingSize && (
                    <span className="text-xs text-neutral-400">หนึ่งหน่วยบริโภค: {result.servingSize}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black font-mono text-amber-400">
                    {Math.round(result.calories * servingsMultiplier)}
                  </span>
                  <span className="text-xs text-neutral-400 block">kcal</span>
                </div>
              </div>

              {/* Servings Multiplier Selector */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
                  <span>คุณทานไปกี่หน่วยบริโภค / กี่เสิร์ฟ?</span>
                  <span className="text-blue-600">{servingsMultiplier}x</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0.5, 1, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setServingsMultiplier(s)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        servingsMultiplier === s
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {s}x {s === 1 ? '(1 ซอง)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nutrients Grid */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 text-center">
                  <span className="text-neutral-400 block text-[10px]">โปรตีน</span>
                  <strong className="text-neutral-900 text-base">{Math.round(result.proteinGrams * servingsMultiplier)}g</strong>
                </div>
                <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 text-center">
                  <span className="text-neutral-400 block text-[10px]">คาร์โบไฮเดรต</span>
                  <strong className="text-neutral-900 text-base">{Math.round(result.carbsGrams * servingsMultiplier)}g</strong>
                </div>
                <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 text-center">
                  <span className="text-neutral-400 block text-[10px]">ไขมัน</span>
                  <strong className="text-neutral-900 text-base">{Math.round(result.fatGrams * servingsMultiplier)}g</strong>
                </div>
                <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 text-center">
                  <span className="text-neutral-400 block text-[10px]">น้ำตาล</span>
                  <strong className="text-neutral-900 text-base">{result.sugarGrams ? Math.round(result.sugarGrams * servingsMultiplier) : 0}g</strong>
                </div>
                <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 text-center">
                  <span className="text-neutral-400 block text-[10px]">โซเดียม</span>
                  <strong className="text-neutral-900 text-base">{result.sodiumMg ? Math.round(result.sodiumMg * servingsMultiplier) : 0}mg</strong>
                </div>
                <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 text-center">
                  <span className="text-neutral-400 block text-[10px]">ใยอาหาร (ไฟเบอร์)</span>
                  <strong className="text-neutral-900 text-base">{result.fiberGrams ? Math.round(result.fiberGrams * servingsMultiplier) : '-'}g</strong>
                </div>
              </div>

              {/* Explanation Note */}
              <p className="text-xs text-neutral-600 bg-blue-50/60 p-3 rounded-2xl border border-blue-100">
                💡 <strong>ข้อแนะนำ:</strong> {result.explanation}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setResult(null);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  สแกนรูปอื่น
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLog}
                  className="flex-2 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check size={16} />
                  <span>บันทึกลงมื้ออาหาร</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
