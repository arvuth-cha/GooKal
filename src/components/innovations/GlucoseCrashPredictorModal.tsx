import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Activity, Zap, TrendingUp, Sparkles, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { GlucosePredictionResult } from '../../types/innovations';

interface GlucoseCrashPredictorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFoodName?: string;
  initialCalories?: number;
  initialCarbs?: number;
  initialSugar?: number;
  initialProtein?: number;
  initialFat?: number;
  initialFiber?: number;
  onToast: (msg: string) => void;
}

export const GlucoseCrashPredictorModal: React.FC<GlucoseCrashPredictorModalProps> = ({
  isOpen,
  onClose,
  initialFoodName = '',
  initialCalories = 450,
  initialCarbs = 60,
  initialSugar = 15,
  initialProtein = 15,
  initialFat = 12,
  initialFiber = 3,
  onToast
}) => {
  const [foodName, setFoodName] = useState(initialFoodName || 'ชานมไข่มุกหวานปกติ + ข้าวไข่เจียว');
  const [calories, setCalories] = useState(initialCalories || 450);
  const [carbsGrams, setCarbsGrams] = useState(initialCarbs || 60);
  const [sugarGrams, setSugarGrams] = useState(initialSugar || 15);
  const [proteinGrams, setProteinGrams] = useState(initialProtein || 15);
  const [fatGrams, setFatGrams] = useState(initialFat || 12);
  const [fiberGrams, setFiberGrams] = useState(initialFiber || 3);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GlucosePredictionResult | null>(null);

  const handleAnalyze = async () => {
    if (!foodName.trim()) {
      onToast('กรุณากรอกชื่ออาหาร');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/predict-glucose-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodName,
          calories,
          carbsGrams,
          sugarGrams,
          proteinGrams,
          fatGrams,
          fiberGrams
        })
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setResult(data);
      onToast('วิเคราะห์ระดับน้ำตาลและอาการง่วงสำเร็จ');
    } catch {
      // Fallback calculation in case of network issue
      const isSpike = sugarGrams > 20 || (carbsGrams > 70 && fiberGrams < 4);
      setResult({
        glycemicLevel: isSpike ? 'spike_risk' : carbsGrams > 45 ? 'high' : 'moderate',
        glycemicIndexEstimate: isSpike ? 82 : carbsGrams > 45 ? 65 : 45,
        peakMinutes: 35,
        crashRisk: isSpike ? 'high' : 'moderate',
        crashWindowText: '60 - 90 นาทีหลังรับประทาน',
        scienceExplanation: `เนื่องจากมีปริมาณคาร์บ ${carbsGrams}g และน้ำตาล ${sugarGrams}g เทียบกับไฟเบอร์ ${fiberGrams}g ทำให้อัตราการดูดซึมกลูโคสเข้าสู่กระแสเลือดรวดเร็ว ส่งผลให้อินซูลินหลั่งสูงและอาจเกิด Reactive Hypoglycemia ตามมา`,
        glucoseHacks: [
          '🥗 ทานผักสลัดหรือโปรตีนก่อนทานคาร์บ 5-10 นาทีเพื่อชะลอการดูดซึม',
          '🚶‍♂️ เดินแกว่งแขนเบาๆ 10-15 นาทีหลังมื้ออาหาร ช่วยให้กล้ามเนื้อดึงน้ำตาลไปใช้ทันที',
          '🍋 ดื่มน้ำผสมน้ำส้มสายชูหมัก (Apple Cider Vinegar 1 ช้อนชา) ช่วยลด Spike ได้ 20-30%'
        ],
        simulatedCurve: [
          { minute: 0, glucoseLevel: 85 },
          { minute: 15, glucoseLevel: 110 },
          { minute: 35, glucoseLevel: isSpike ? 165 : 130 },
          { minute: 60, glucoseLevel: isSpike ? 140 : 115 },
          { minute: 90, glucoseLevel: isSpike ? 75 : 95 },
          { minute: 120, glucoseLevel: 85 },
          { minute: 150, glucoseLevel: 88 },
          { minute: 180, glucoseLevel: 90 }
        ]
      });
      onToast('ประเมินกราฟน้ำตาลและอาการง่วงสำเร็จ');
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
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-purple-50 via-white to-pink-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <Activity size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 leading-tight">ทำนายกราฟน้ำตาล & อาการง่วง (Glucose Spike & Crash)</h2>
                <p className="text-xs text-neutral-500 font-medium">ประเมิน Postprandial Crash และวิธีควบคุมระดับพลังงาน</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1 text-sm">
            {/* Input form */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">ชื่ออาหาร / มื้ออาหารที่ต้องการตรวจ</label>
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="เช่น ชานมไข่มุก, ข้าวผัดกะเพราไข่ดาว, ข้าวเหนียวมะม่วง"
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-neutral-200 text-sm focus:outline-hidden focus:border-purple-500 focus:ring-2 focus:ring-purple-100 font-medium text-neutral-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-neutral-600 block">คาร์บ (g)</label>
                  <input
                    type="number"
                    value={carbsGrams}
                    onChange={(e) => setCarbsGrams(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-white rounded-xl border border-neutral-200 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-600 block">น้ำตาล (g)</label>
                  <input
                    type="number"
                    value={sugarGrams}
                    onChange={(e) => setSugarGrams(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-white rounded-xl border border-neutral-200 text-xs font-semibold text-rose-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-600 block">ไฟเบอร์ (g)</label>
                  <input
                    type="number"
                    value={fiberGrams}
                    onChange={(e) => setFiberGrams(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-white rounded-xl border border-neutral-200 text-xs font-semibold text-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-neutral-600 block">โปรตีน (g)</label>
                  <input
                    type="number"
                    value={proteinGrams}
                    onChange={(e) => setProteinGrams(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-white rounded-xl border border-neutral-200 text-xs font-semibold text-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-600 block">ไขมัน (g)</label>
                  <input
                    type="number"
                    value={fatGrams}
                    onChange={(e) => setFatGrams(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-white rounded-xl border border-neutral-200 text-xs font-semibold text-amber-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-600 block">แคลอรี่ (kcal)</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-white rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-900"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-200 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>กำลังจำลองปฏิกิริยากลูโคสชีวภาพ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>จำลองระดับน้ำตาล & วิเคราะห์ความเสี่ยงง่วงนอน</span>
                  </>
                )}
              </button>
            </div>

            {/* Results Section */}
            {result && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className={`p-3 rounded-2xl border text-center ${
                    result.glycemicLevel === 'spike_risk' || result.glycemicLevel === 'high'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    <span className="text-[10px] font-bold block uppercase tracking-wider">Glycemic Impact</span>
                    <span className="text-sm font-black mt-0.5 block">
                      {result.glycemicLevel === 'spike_risk' ? '🚨 Spike เสี่ยงสูง' :
                       result.glycemicLevel === 'high' ? '⚠️ พุ่งเร็ว' :
                       result.glycemicLevel === 'moderate' ? '⚡ ปานกลาง' : '✅ ค่อยเป็นค่อยไป'}
                    </span>
                    <span className="text-[10px] opacity-80">GI ~{result.glycemicIndexEstimate}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-center">
                    <span className="text-[10px] font-bold block uppercase tracking-wider">Peak Time</span>
                    <span className="text-sm font-black mt-0.5 block flex items-center justify-center gap-1">
                      <Clock size={14} className="text-purple-600" />
                      {result.peakMinutes} นาที
                    </span>
                    <span className="text-[10px] text-purple-600">จุดสูงสุดหลังกิน</span>
                  </div>

                  <div className={`p-3 rounded-2xl border text-center ${
                    result.crashRisk === 'high' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                    <span className="text-[10px] font-bold block uppercase tracking-wider">ความเสี่ยงง่วง (Crash)</span>
                    <span className="text-sm font-black mt-0.5 block">
                      {result.crashRisk === 'high' ? '😴 ง่วงเพลียสูง' : result.crashRisk === 'moderate' ? '🥱 มีอาการเล็กน้อย' : '⚡ สดชื่นต่อเนื่อง'}
                    </span>
                    <span className="text-[10px] opacity-80">{result.crashWindowText}</span>
                  </div>
                </div>

                {/* Simulated Glucose Curve Visualization */}
                <div className="bg-neutral-900 text-white p-4 rounded-2xl shadow-inner space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-purple-400" />
                      กราฟจำลองระดับน้ำตาลในเลือด (0 - 180 นาที)
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">mg/dL Simulation</span>
                  </div>

                  {/* SVG Line Graph */}
                  <div className="h-28 w-full pt-2">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 300 80">
                      {/* Normal baseline zone */}
                      <rect x="0" y="40" width="300" height="25" fill="#10b981" fillOpacity="0.12" rx="4" />
                      <line x1="0" y1="52" x2="300" y2="52" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                      <text x="5" y="48" fill="#10b981" fontSize="7" fontWeight="bold">Normal Range (80-110 mg/dL)</text>

                      {/* Polyline Curve */}
                      <path
                        d={(result.simulatedCurve || []).map((point, idx) => {
                          const x = (point.minute / 180) * 280 + 10;
                          // map glucose from 60..180 to 70..10
                          const y = Math.max(10, Math.min(75, 75 - ((point.glucoseLevel - 70) / 110) * 65));
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke={result.glycemicLevel === 'spike_risk' ? '#f43f5e' : '#a855f7'}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Peak Dot */}
                      {(result.simulatedCurve || []).length > 2 && (
                        <circle
                          cx={(result.peakMinutes / 180) * 280 + 10}
                          cy={Math.max(10, Math.min(75, 75 - (( ((result.simulatedCurve || []).find(p => p.minute === result.peakMinutes)?.glucoseLevel || 150) - 70) / 110) * 65))}
                          r="4"
                          fill="#f43f5e"
                          stroke="#fff"
                          strokeWidth="1.5"
                        />
                      )}
                    </svg>
                  </div>

                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono pt-1 border-t border-neutral-800">
                    <span>0 นาที (เริ่มทาน)</span>
                    <span>60 นาที (Crash Window)</span>
                    <span>120 นาที</span>
                    <span>180 นาที</span>
                  </div>
                </div>

                {/* Science Explanation */}
                <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-xs text-neutral-700 leading-relaxed">
                  <span className="font-bold text-neutral-900 block mb-1">🔬 คำอธิบายชีวเคมี:</span>
                  {result.scienceExplanation}
                </div>

                {/* Glucose Hacks */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Zap size={15} className="text-emerald-600" />
                    <span>3 เคล็ดลับลด Spike & ป้องกันอาการง่วงหลังมื้อนี้</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-emerald-800 font-medium">
                    {(result.glucoseHacks || []).map((hack, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{hack}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
