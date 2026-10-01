import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Barcode, Camera, CheckCircle2, Sparkles, Volume2, Search, Plus, ShieldCheck } from 'lucide-react';

interface SmartBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogMeal?: (meal: { name: string; calories: number; protein: number; carbs: number; fat: number }) => void;
  onToast: (msg: string) => void;
}

interface BarcodeProduct {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodiumMg: number;
  sugarG: number;
  healthGrade: 'A' | 'B' | 'C';
  icon: string;
}

const THAI_BARCODE_DB: BarcodeProduct[] = [
  {
    barcode: '885012345601',
    name: 'อกไก่นุ่มกระเทียมพริกไทย (Steamed Chicken Breast)',
    brand: 'CP Delight',
    category: 'อาหารพร้อมทาน 7-Eleven',
    servingSize: '1 ซอง (90g)',
    calories: 100,
    protein: 21,
    carbs: 1,
    fat: 1.5,
    sodiumMg: 380,
    sugarG: 0,
    healthGrade: 'A',
    icon: '🍗'
  },
  {
    barcode: '885012345602',
    name: 'นมพาสเจอร์ไรส์ ไฮโปรตีน ไม่เติมน้ำตาลทราย (Whey Formula)',
    brand: 'Meiji High Protein',
    category: 'เครื่องดื่มโปรตีน',
    servingSize: '1 ขวด (350ml)',
    calories: 170,
    protein: 28,
    carbs: 10,
    fat: 2,
    sodiumMg: 140,
    sugarG: 6,
    healthGrade: 'A',
    icon: '🥛'
  },
  {
    barcode: '885012345603',
    name: 'ไข่ต้มสมุนไพร CP (Hard Boiled Eggs 2 pcs)',
    brand: 'CP',
    category: 'ไข่และโปรตีน',
    servingSize: '2 ฟอง',
    calories: 140,
    protein: 13,
    carbs: 1,
    fat: 9,
    sodiumMg: 120,
    sugarG: 0,
    healthGrade: 'A',
    icon: '🥚'
  },
  {
    barcode: '885012345604',
    name: 'น้ำเต้าหู้โทฟุซัง ไม่ใส่น้ำตาล สูตรโปรตีนสูง',
    brand: 'Tofusan High Protein',
    category: 'นมถั่วเหลือง',
    servingSize: '1 ขวด (350ml)',
    calories: 130,
    protein: 15,
    carbs: 8,
    fat: 4.5,
    sodiumMg: 95,
    sugarG: 0,
    healthGrade: 'A',
    icon: '🌱'
  },
  {
    barcode: '885012345605',
    name: 'ข้าวไรซ์เบอร์รี่ผสมข้าวกล้องพร้อมทาน',
    brand: 'Betagro / 7-Fresh',
    category: 'ข้าวพร้อมทาน',
    servingSize: '1 ถ้วย (150g)',
    calories: 180,
    protein: 4.5,
    carbs: 38,
    fat: 1,
    sodiumMg: 10,
    sugarG: 0,
    healthGrade: 'A',
    icon: '🍚'
  },
  {
    barcode: '885012345606',
    name: 'สลัดอกไก่ฉีกและไข่ต้ม พร้อมน้ำสลัดงาคั่วญี่ปุ่น',
    brand: 'EZY TASTE',
    category: 'สลัดผัก',
    servingSize: '1 กล่อง',
    calories: 220,
    protein: 18,
    carbs: 14,
    fat: 8,
    sodiumMg: 420,
    sugarG: 4,
    healthGrade: 'B',
    icon: '🥗'
  },
  {
    barcode: '885012345607',
    name: 'กรีกโยเกิร์ตแท้ 0% ไขมัน สไตล์บัลแกเรีย',
    brand: 'Dutch Mill Selected',
    category: 'โยเกิร์ต',
    servingSize: '1 ถ้วย (130g)',
    calories: 85,
    protein: 10,
    carbs: 6,
    fat: 0,
    sodiumMg: 45,
    sugarG: 4,
    healthGrade: 'A',
    icon: '🥣'
  }
];

export const SmartBarcodeScannerModal: React.FC<SmartBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onLogMeal,
  onToast
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<BarcodeProduct | null>(null);

  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz High Beep
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Audio context might be restricted
    }
  };

  const handleSimulateScan = (product: BarcodeProduct) => {
    setScanning(true);
    setTimeout(() => {
      playBeepSound();
      setScannedProduct(product);
      setScanning(false);
      onToast(`⚡ สแกนสำเร็จ: ${product.name} (${product.calories} kcal)`);
    }, 600);
  };

  const handleManualSearch = () => {
    const found = THAI_BARCODE_DB.find(p => p.barcode.includes(manualCode) || p.name.toLowerCase().includes(manualCode.toLowerCase()));
    if (found) {
      handleSimulateScan(found);
    } else {
      onToast('ไม่พบข้อมูลสินค้านี้ในฐานข้อมูล 7-Eleven / ซูเปอร์มาร์เก็ต');
    }
  };

  const handleLogCurrent = () => {
    if (!scannedProduct) return;
    if (onLogMeal) {
      onLogMeal({
        name: `${scannedProduct.name} (${scannedProduct.brand})`,
        calories: scannedProduct.calories,
        protein: scannedProduct.protein,
        carbs: scannedProduct.carbs,
        fat: scannedProduct.fat
      });
    }
    onToast(`บันทึก ${scannedProduct.name} ลงไดอารี่แล้ว!`);
    onClose();
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
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-teal-50 via-sky-50 to-blue-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                <Barcode size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-neutral-900 leading-tight">สแกนบาร์โค้ดสินค้า 7-Eleven & ห้างสรรพสินค้า</h2>
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black">
                    Live Barcode Scanner
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium">สแกนสินค้าพร้อมทาน CP, Meiji, Betagro, Dutch Mill ทราบสารอาหารทันที</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-neutral-500 hover:text-neutral-800 flex items-center justify-center shadow-xs transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scanner Viewfinder Area */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1 text-sm">
            {/* Viewfinder simulation box */}
            <div className="relative w-full h-48 rounded-3xl bg-neutral-900 overflow-hidden flex flex-col items-center justify-center text-white border-2 border-dashed border-teal-500/60 shadow-inner">
              {/* Laser animation */}
              <div className="absolute inset-x-8 top-1/2 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse" />
              
              <div className="z-10 text-center space-y-1.5 p-4">
                <Camera size={28} className="mx-auto text-teal-400 opacity-80" />
                <p className="text-xs font-bold text-neutral-200">นำกล้องจ่อที่แถบบาร์โค้ดสินค้า</p>
                <p className="text-[11px] text-neutral-400">ระบบจะส่งเสียงบี๊บ (Beep) และดึงฉลากสารอาหารอัตโนมัติ</p>
              </div>
            </div>

            {/* Quick Sample Products for 1-Click Test Scan */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 block flex items-center gap-1">
                <Sparkles size={13} className="text-teal-600" /> ทดสอบสแกนบาร์โค้ดสินค้ายอดฮิต (Instant Test):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {THAI_BARCODE_DB.slice(0, 6).map((item) => (
                  <button
                    key={item.barcode}
                    type="button"
                    onClick={() => handleSimulateScan(item)}
                    className="p-2.5 rounded-2xl border border-neutral-200 hover:border-teal-400 bg-white hover:bg-teal-50/50 text-left transition-all cursor-pointer shadow-xs"
                  >
                    <span className="text-lg block mb-0.5">{item.icon}</span>
                    <div className="text-xs font-bold text-neutral-900 truncate leading-tight">{item.name}</div>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className="text-teal-700 font-bold">{item.calories} kcal</span>
                      <span className="text-neutral-400">{item.protein}g P</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scanned Result Card */}
            {scannedProduct && (
              <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{scannedProduct.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-neutral-900">{scannedProduct.name}</h3>
                        <span className="px-1.5 py-0.2 rounded bg-teal-200 text-teal-900 font-black text-[9px]">
                          เกรด {scannedProduct.healthGrade}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">{scannedProduct.brand} • {scannedProduct.servingSize}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogCurrent}
                    className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>บันทึกลงไดอารี่</span>
                  </button>
                </div>

                {/* Macro breakdown grid */}
                <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-teal-200/60 text-xs">
                  <div className="p-2 rounded-xl bg-white/80 border border-teal-100">
                    <span className="text-[10px] text-neutral-500 font-semibold block">แคลอรี่</span>
                    <span className="text-sm font-black text-neutral-900">{scannedProduct.calories}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/80 border border-teal-100">
                    <span className="text-[10px] text-teal-700 font-semibold block">โปรตีน</span>
                    <span className="text-sm font-black text-teal-800">{scannedProduct.protein}g</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/80 border border-teal-100">
                    <span className="text-[10px] text-amber-700 font-semibold block">คาร์บ</span>
                    <span className="text-sm font-black text-amber-800">{scannedProduct.carbs}g</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/80 border border-teal-100">
                    <span className="text-[10px] text-rose-700 font-semibold block">ไขมัน</span>
                    <span className="text-sm font-black text-rose-800">{scannedProduct.fat}g</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-600 px-1">
                  <span>โซเดียม: <strong>{scannedProduct.sodiumMg} mg</strong></span>
                  <span>น้ำตาล: <strong>{scannedProduct.sugarG} g</strong></span>
                  <span className="text-emerald-700 font-semibold">บาร์โค้ด: {scannedProduct.barcode}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-all cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
