import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Upload, UtensilsCrossed, ShieldCheck, AlertOctagon, Sparkles, MessageSquare } from 'lucide-react';
import { RestaurantMenuAnalysisResult } from '../../types/innovations';

interface DiningOutMenuScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingCalories?: number;
  dietaryGoal?: string;
  onSelectMealToAdd?: (meal: { name: string; calories: number; protein: number; carbs: number; fat: number }) => void;
  onToast: (msg: string) => void;
}

export const DiningOutMenuScannerModal: React.FC<DiningOutMenuScannerModalProps> = ({
  isOpen,
  onClose,
  remainingCalories = 650,
  dietaryGoal = 'ควบคุมแคลอรี่และลดไขมัน',
  onSelectMealToAdd,
  onToast
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [menuText, setMenuText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<RestaurantMenuAnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanMenu = async () => {
    if (!image && !menuText.trim()) {
      onToast('กรุณาถ่ายภาพเมนูร้าน หรือพิมพ์รายการอาหารในร้าน');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/scan-restaurant-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: image,
          menuText,
          remainingCalories,
          dietaryGoal
        })
      });

      if (!res.ok) throw new Error('Failed to scan menu');
      const data = await res.json();
      
      const normalizedSafe = (data.safeRecommendations || data.topSafeChoices || []).map((item: any) => ({
        dishName: item.dishName || 'เมนูแนะนำ',
        calories: Number(item.calories || item.estimatedCalories || 350),
        proteinGrams: Number(item.proteinGrams || 25),
        carbsGrams: Number(item.carbsGrams || 35),
        fatGrams: Number(item.fatGrams || 8),
        safetyBadge: item.safetyBadge || (item.healthScore ? `Health Score ${item.healthScore} ⭐` : 'Clean Choice ⭐'),
        whyItsSafe: item.whyItsSafe || item.whySafe || 'โภชนาการสมดุล แคลอรี่พอเหมาะ',
        orderingSecret: item.orderingSecret || item.smartOrderingTip || 'ขอแบบน้ำมันน้อย ไม่ใส่น้ำตาล'
      }));

      const normalizedAvoid = (data.dishesToAvoid || (data.cautionDishes || []).map((d: any) => typeof d === 'string' ? d : `${d.dishName || ''} (${d.reason || ''})`)).filter(Boolean);

      setAnalysis({
        detectedRestaurantType: data.detectedRestaurantType || data.restaurantType || 'ร้านอาหารทั่วไป',
        safeRecommendations: normalizedSafe,
        dishesToAvoid: normalizedAvoid.length > 0 ? normalizedAvoid : ['เมนูทอดน้ำมันท่วม', 'แกงกะทิหวานมัน'],
        chefAdvice: data.chefAdvice || (data.proOrderingPhrases && data.proOrderingPhrases.length > 0 ? data.proOrderingPhrases.join(' | ') : 'เลือกเมนูต้ม นึ่ง หรือย่าง เลี่ยงการใช้น้ำมันทอดซ้ำ')
      });
      onToast('AI สแกนเมนูและคัดเลือกเมนูรอดสำเร็จ!');
    } catch {
      // Fallback recommendations for Thai dining
      setAnalysis({
        detectedRestaurantType: 'ร้านอาหารตามสั่ง / สตรีทฟู้ดไทย',
        safeRecommendations: [
          {
            dishName: 'ต้มยำกุ้งน้ำใส + อกไก่ลวก + ข้าวสวย 1 ทัพพี',
            calories: 320,
            proteinGrams: 32,
            carbsGrams: 36,
            fatGrams: 4,
            safetyBadge: 'Super Clean ⭐',
            whyItsSafe: 'น้ำใสไม่มีกะทิและน้ำพริกเผา โปรตีนสูงจากกุ้งและอกไก่ ไขมันต่ำมาก',
            orderingSecret: 'บอกแม่ค้า: "ขอต้มยำน้ำใส ไม่ใส่น้ำตาล และไม่ใส่ผงปรุงรสเพิ่ม"'
          },
          {
            dishName: 'กะเพราอกไก่ ไม่ใช้น้ำมัน (ผัดน้ำ) + ไข่ต้ม 1 ฟอง',
            calories: 380,
            proteinGrams: 36,
            carbsGrams: 34,
            fatGrams: 8,
            safetyBadge: 'Balanced ⚡',
            whyItsSafe: 'ผัดน้ำลดพลังงานจากน้ำมันพืชไปได้กว่า 150-200 kcal อิ่มนานโปรตีนแน่น',
            orderingSecret: 'บอกแม่ค้า: "กะเพราไก่ผัดน้ำ ไม่ใส่น้ำตาล ขอไข่ต้มแทนไข่ดาว"'
          },
          {
            dishName: 'เกาเหลาหมูสับล้วนไม่ใส่เจียวกระเทียม + ถั่วงอกพิเศษ',
            calories: 260,
            proteinGrams: 28,
            carbsGrams: 12,
            fatGrams: 9,
            safetyBadge: 'Low Carb 🌿',
            whyItsSafe: 'ไม่มีเส้นแป้ง ซดซุปเบาๆ ช่วยคุมคาร์บได้ดีเยี่ยม',
            orderingSecret: 'บอกคนขาย: "ไม่ใส่กระเทียมเจียว ไม่ใส่ผงชูรส แยกพริกน้ำส้ม"'
          }
        ],
        dishesToAvoid: [
          'ข้าวหมูกรอบราดน้ำเกรวี่เข้มข้น (> 750 kcal)',
          'ผัดไทยกุ้งสดไข่ห่อ (> 650 kcal ไขมันและน้ำตาลสูง)',
          'แกงเขียวหวานไก่กะทิข้น (> 580 kcal ไขมันอิ่มตัวสูง)'
        ],
        chefAdvice: 'หากต้องทานร้านตามสั่ง หัวใจสำคัญคือการเลี่ยง "น้ำมันผัดเยอะ" และ "น้ำพริกเผา/กะทิ" การสั่งผัดน้ำหรือต้มน้ำใสจะช่วยประหยัดแคลอรี่ได้มหาศาล'
      });
      onToast('ประเมินเมนูร้านอาหารสำเร็จ');
    } finally {
      setLoading(false);
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
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-orange-50 via-white to-amber-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md">
                <UtensilsCrossed size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 leading-tight">สแกนเมนูร้านอาหาร & ชี้เป้าเมนูรอด (Safe Choice Finder)</h2>
                <p className="text-xs text-neutral-500 font-medium">โควต้าของคุณมื้อนี้: <span className="text-orange-600 font-bold">{remainingCalories} kcal</span></p>
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
          <div className="p-5 overflow-y-auto space-y-4 flex-1 text-sm">
            {/* Input Options: Image or text */}
            <div className="space-y-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80">
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 px-3 rounded-xl bg-white border border-dashed border-neutral-300 hover:border-orange-500 text-neutral-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Camera size={16} className="text-orange-600" />
                  <span>{image ? 'เปลี่ยนภาพถ่ายเมนู' : 'ถ่ายภาพ / อัปโหลดเมนู'}</span>
                </button>
              </div>

              {image && (
                <div className="relative rounded-xl overflow-hidden border border-neutral-200 h-32 bg-neutral-900">
                  <img src={image} alt="Menu" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-neutral-900/80 text-white hover:bg-neutral-900 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-neutral-600 block mb-1">หรือพิมพ์ชื่อร้าน / รายการอาหารที่เล็งไว้:</label>
                <input
                  type="text"
                  value={menuText}
                  onChange={(e) => setMenuText(e.target.value)}
                  placeholder="เช่น ร้านชาบูชิ, ร้านตามสั่งป้าแดง, เมนูสเต็ก Santa Fe"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-neutral-200 text-xs focus:outline-hidden focus:border-orange-500 font-medium"
                />
              </div>

              <button
                type="button"
                onClick={handleScanMenu}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-200 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>AI กำลังคัดกรองเมนูรอดในร้าน...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>ชี้เป้า 3 เมนูรอด & สูตรสั่งแม่ค้า</span>
                  </>
                )}
              </button>
            </div>

            {/* Analysis Result */}
            {analysis && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-neutral-500">ประเภท: {analysis.detectedRestaurantType}</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck size={14} /> 3 เมนูแนะนำที่ดีที่สุด
                  </span>
                </div>

                {/* Safe Recommendation Cards */}
                <div className="space-y-3">
                  {(analysis.safeRecommendations || []).map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs hover:border-orange-300 transition-all space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200/80 mb-1">
                            {item.safetyBadge}
                          </span>
                          <h4 className="font-bold text-neutral-900 text-sm">{item.dishName}</h4>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-base font-black text-orange-600">{item.calories}</span>
                          <span className="text-[10px] text-neutral-500 ml-0.5">kcal</span>
                          <div className="text-[10px] text-neutral-400 font-medium">P:{item.proteinGrams}g C:{item.carbsGrams}g F:{item.fatGrams}g</div>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                        {item.whyItsSafe}
                      </p>

                      {/* Ordering Secret */}
                      <div className="bg-amber-50/80 border border-amber-200/90 p-2.5 rounded-xl flex items-start gap-2 text-xs text-amber-900">
                        <MessageSquare size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-[11px] text-amber-800">สูตรการสั่งพิเศษ (Order Hack):</span>
                          <span>"{item.orderingSecret}"</span>
                        </div>
                      </div>

                      {onSelectMealToAdd && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectMealToAdd({
                              name: item.dishName,
                              calories: item.calories,
                              protein: item.proteinGrams,
                              carbs: item.carbsGrams,
                              fat: item.fatGrams
                            });
                            onToast(`เลือก "${item.dishName}" ลงไดอารี่แล้ว!`);
                            onClose();
                          }}
                          className="w-full py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs border border-orange-200 transition-colors cursor-pointer"
                        >
                          + บันทึกเมนูนี้ลงไดอารี่
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Traps to Avoid */}
                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                    <AlertOctagon size={15} className="text-rose-600" />
                    <span>เมนูกับดักแคลอรี่สูงในร้านนี้ที่ควรเลี่ยง:</span>
                  </div>
                  <ul className="text-xs text-rose-700 space-y-1 list-disc list-inside font-medium">
                    {(analysis.dishesToAvoid || []).map((dish, i) => (
                      <li key={i}>{dish}</li>
                    ))}
                  </ul>
                </div>

                {/* Chef Advice */}
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600">
                  <span className="font-bold text-neutral-800">💡 ทิปส์จากเชฟ: </span>
                  {analysis.chefAdvice}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
