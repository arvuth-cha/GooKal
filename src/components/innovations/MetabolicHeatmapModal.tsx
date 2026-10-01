import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Activity, CheckCircle2, TrendingUp, Award } from 'lucide-react';

interface MetabolicHeatmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const MetabolicHeatmapModal: React.FC<MetabolicHeatmapModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  const daysOfWeek = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  
  // Matrix data for past 7 days
  const heatmapData = [
    { day: 'จันทร์', calRatio: 98, proteinRatio: 105, waterRatio: 100, ifSuccess: true, score: 96 },
    { day: 'อังคาร', calRatio: 95, proteinRatio: 90, waterRatio: 88, ifSuccess: true, score: 91 },
    { day: 'พุธ', calRatio: 102, proteinRatio: 110, waterRatio: 100, ifSuccess: true, score: 98 },
    { day: 'พฤหัสฯ', calRatio: 90, proteinRatio: 85, waterRatio: 75, ifSuccess: false, score: 82 },
    { day: 'ศุกร์', calRatio: 115, proteinRatio: 95, waterRatio: 90, ifSuccess: true, score: 85 },
    { day: 'เสาร์', calRatio: 120, proteinRatio: 100, waterRatio: 100, ifSuccess: false, score: 80 },
    { day: 'อาทิตย์ (วันนี้)', calRatio: 96, proteinRatio: 102, waterRatio: 100, ifSuccess: true, score: 95 }
  ];

  const avgScore = Math.round(heatmapData.reduce((acc, d) => acc + d.score, 0) / heatmapData.length);

  const getHeatColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500 text-white';
    if (score >= 80) return 'bg-emerald-400 text-white';
    if (score >= 70) return 'bg-amber-400 text-neutral-900';
    return 'bg-rose-400 text-white';
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
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-emerald-50 via-teal-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Activity size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 leading-tight">แผนที่ความร้อนเมตาบอลิซึม (Metabolic Heatmap)</h2>
                <p className="text-xs text-neutral-500 font-medium">ภาพรวมความสม่ำเสมอของสารอาหาร & วินัย 7 วัน</p>
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
            {/* Weekly Adherence Banner */}
            <div className="bg-linear-to-r from-indigo-600 to-purple-600 text-white p-5 rounded-3xl shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-100">คะแนนความสมดุลเฉลี่ย 7 วัน</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black">{avgScore}</span>
                  <span className="text-indigo-200 text-sm font-bold">/ 100</span>
                </div>
                <span className="text-xs text-indigo-100 mt-1 block font-medium">ระดับ: Metabolic Master 🏆</span>
              </div>

              <div className="text-right space-y-1 bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-xs text-[11px] font-bold text-indigo-100">
                <div>🔥 แคลอรี่คุมได้: 6/7 วัน</div>
                <div>🥩 โปรตีนถึงเป้า: 6/7 วัน</div>
                <div>💧 ดื่มน้ำสมบูรณ์: 5/7 วัน</div>
              </div>
            </div>

            {/* Matrix Heatmap */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-800 block px-1">ตาราง Heatmap รายวัน (โภชนาการ vs วินัย):</span>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="text-[11px] font-bold text-neutral-500 border-b border-neutral-200">
                      <th className="py-2 text-left pl-2">วัน</th>
                      <th className="py-2">แคลอรี่ (%)</th>
                      <th className="py-2">โปรตีน (%)</th>
                      <th className="py-2">น้ำดื่ม</th>
                      <th className="py-2">IF สำเร็จ</th>
                      <th className="py-2 pr-2">คะแนนวัน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-medium">
                    {heatmapData.map((d, i) => (
                      <tr key={i} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-2.5 text-left pl-2 font-bold text-neutral-800">{d.day}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${d.calRatio <= 105 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {d.calRatio}%
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${d.proteinRatio >= 90 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                            {d.proteinRatio}%
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${d.waterRatio >= 85 ? 'bg-sky-100 text-sky-800' : 'bg-neutral-100 text-neutral-600'}`}>
                            {d.waterRatio}%
                          </span>
                        </td>
                        <td className="py-2.5">
                          {d.ifSuccess ? <span className="text-emerald-600 font-bold">✅</span> : <span className="text-neutral-400">➖</span>}
                        </td>
                        <td className="py-2.5 pr-2">
                          <span className={`px-2.5 py-1 rounded-xl font-black text-xs inline-block shadow-2xs ${getHeatColor(d.score)}`}>
                            {d.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Insights & Trend */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
              <span className="text-xs font-bold text-neutral-900 block">📊 วิเคราะห์แนวโน้มเมตาบอลิซึม (Metabolic Insights):</span>
              <p className="text-xs text-neutral-600 leading-relaxed">
                สัปดาห์นี้คุณสามารถรักษาระดับการกินโปรตีนได้อย่างสม่ำเสมอถึง 98% ของเป้าหมาย ส่งผลให้การสังเคราะห์กล้ามเนื้อและการเผาผลาญพื้นฐานทำงานได้สูงสุด มีการหลุดแคลอรี่เล็กน้อยในวันเสาร์ แต่สามารถปรับชดเชยได้ดีเยี่ยมในวันถัดมา
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
