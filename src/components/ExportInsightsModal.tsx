import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, FileSpreadsheet, FileJson, FileText, Copy, Check, Share2, Sparkles, PieChart as PieIcon, BarChart3, Flame } from 'lucide-react';
import {
  ExportInsightsParams,
  generateInsightsCSV,
  generateInsightsJSON,
  generateInsightsTextReport,
  downloadFile,
} from '../utils/insightsExport';

interface ExportInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportParams?: ExportInsightsParams;
  params?: ExportInsightsParams;
  initialSection?: 'all' | 'calories' | 'macros' | 'protein';
  onToast?: (message: string) => void;
}

export const ExportInsightsModal: React.FC<ExportInsightsModalProps> = ({
  isOpen,
  onClose,
  exportParams,
  params,
  initialSection = 'all',
  onToast,
}) => {
  const activeParams: ExportInsightsParams = exportParams || params || {
    history: [],
    userProfile: {},
    bmr: 1500,
    tdee: 2000,
    dailyGoal: 2000,
    carbsGoal: 250,
    proteinGoal: 120,
    fatGoal: 55,
    sugarGoal: 24,
    sodiumGoal: 2000,
    weeklyData: [],
    monthlyData: [],
    chartTimeframe: 'weekly',
    macroDistributionData: [],
    totalMacroCals: 0
  };

  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'text'>('csv');
  const [selectedSection, setSelectedSection] = useState<'all' | 'calories' | 'macros' | 'protein'>(initialSection);
  const [isCopied, setIsCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const getExportFilename = (ext: string) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const sectionSuffix = selectedSection !== 'all' ? `-${selectedSection}` : '';
    return `gookal-insights${sectionSuffix}-${dateStr}.${ext}`;
  };

  const handleDownload = () => {
    setIsExporting(true);
    try {
      const paramsWithSection = { ...activeParams, filterSection: selectedSection };
      
      if (selectedFormat === 'csv') {
        const csvContent = generateInsightsCSV(paramsWithSection);
        downloadFile(csvContent, getExportFilename('csv'), 'text/csv;charset=utf-8;');
        onToast?.('ดาวน์โหลดไฟล์ CSV สำหรับ Excel สำเร็จแล้ว');
      } else if (selectedFormat === 'json') {
        const jsonContent = generateInsightsJSON(paramsWithSection);
        downloadFile(jsonContent, getExportFilename('json'), 'application/json;charset=utf-8;');
        onToast?.('ดาวน์โหลดไฟล์ JSON สำเร็จแล้ว');
      } else if (selectedFormat === 'text') {
        const textContent = generateInsightsTextReport(paramsWithSection);
        downloadFile(textContent, getExportFilename('txt'), 'text/plain;charset=utf-8;');
        onToast?.('ดาวน์โหลดรายงานสรุปข้อความแล้ว');
      }
    } catch (err) {
      console.error('Export error:', err);
      onToast?.('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyText = async () => {
    try {
      const paramsWithSection = { ...activeParams, filterSection: selectedSection };
      let textToCopy = '';
      if (selectedFormat === 'text') {
        textToCopy = generateInsightsTextReport(paramsWithSection);
      } else if (selectedFormat === 'json') {
        textToCopy = generateInsightsJSON(paramsWithSection);
      } else {
        textToCopy = generateInsightsCSV(paramsWithSection);
      }

      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      onToast?.('คัดลอกข้อมูลไปยังคลิปบอร์ดแล้ว');
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      console.error('Clipboard copy error:', e);
      onToast?.('ไม่สามารถคัดลอกได้');
    }
  };

  const handleShare = async () => {
    const paramsWithSection = { ...activeParams, filterSection: selectedSection };
    const textReport = generateInsightsTextReport(paramsWithSection);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GooKal - รายงานข้อมูลเชิงลึก',
          text: textReport,
        });
        onToast?.('แชร์ข้อมูลเรียบร้อยแล้ว');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyText();
        }
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-[2rem] shadow-2xl border border-neutral-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 pb-4 flex items-center justify-between border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Download size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 text-lg tracking-tight">ส่งออกข้อมูลเชิงลึก</h3>
                <p className="text-xs text-neutral-500 font-medium">Export Insights & Nutrition Analytics</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* 1. Scope / Section Selection */}
            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2.5">
                เลือกขอบเขตข้อมูลที่ต้องการส่งออก
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSection('all')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                    selectedSection === 'all'
                      ? 'border-orange-500 bg-orange-50/50 text-orange-950 font-bold ring-2 ring-orange-500/20'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                  }`}
                >
                  <Sparkles size={18} className={selectedSection === 'all' ? 'text-orange-600' : 'text-neutral-400'} />
                  <span className="text-xs font-bold truncate">ข้อมูลทั้งหมด (All)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSection('calories')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                    selectedSection === 'calories'
                      ? 'border-orange-500 bg-orange-50/50 text-orange-950 font-bold ring-2 ring-orange-500/20'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                  }`}
                >
                  <Flame size={18} className={selectedSection === 'calories' ? 'text-orange-600' : 'text-neutral-400'} />
                  <span className="text-xs font-bold truncate">แคลอรีที่ได้รับ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSection('macros')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                    selectedSection === 'macros'
                      ? 'border-orange-500 bg-orange-50/50 text-orange-950 font-bold ring-2 ring-orange-500/20'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                  }`}
                >
                  <PieIcon size={18} className={selectedSection === 'macros' ? 'text-orange-600' : 'text-neutral-400'} />
                  <span className="text-xs font-bold truncate">สัดส่วนสารอาหาร</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSection('protein')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                    selectedSection === 'protein'
                      ? 'border-orange-500 bg-orange-50/50 text-orange-950 font-bold ring-2 ring-orange-500/20'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                  }`}
                >
                  <BarChart3 size={18} className={selectedSection === 'protein' ? 'text-orange-600' : 'text-neutral-400'} />
                  <span className="text-xs font-bold truncate">โปรตีนที่ได้รับ</span>
                </button>
              </div>
            </div>

            {/* 2. Format Selection */}
            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2.5">
                เลือกรูปแบบไฟล์ (Format)
              </label>
              <div className="space-y-2">
                {/* CSV */}
                <label
                  onClick={() => setSelectedFormat('csv')}
                  className={`flex items-start gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedFormat === 'csv'
                      ? 'border-orange-500 bg-orange-50/40 text-neutral-900 ring-2 ring-orange-500/20'
                      : 'border-neutral-200 hover:bg-neutral-50/80 text-neutral-700 bg-white'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-neutral-900">Excel / CSV (.csv)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">แนะนำ</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                      เปิดใน Excel, Numbers, Google Sheets ได้ทันที รองรับภาษาไทยสมบูรณ์
                    </p>
                  </div>
                </label>

                {/* JSON */}
                <label
                  onClick={() => setSelectedFormat('json')}
                  className={`flex items-start gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedFormat === 'json'
                      ? 'border-orange-500 bg-orange-50/40 text-neutral-900 ring-2 ring-orange-500/20'
                      : 'border-neutral-200 hover:bg-neutral-50/80 text-neutral-700 bg-white'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <FileJson size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-neutral-900">JSON Analytics (.json)</span>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                      โครงสร้างข้อมูลเชิงลึกครบทุกมิติ สำหรับนักพัฒนาหรือวิเคราะห์เชิงลึก
                    </p>
                  </div>
                </label>

                {/* Text Report */}
                <label
                  onClick={() => setSelectedFormat('text')}
                  className={`flex items-start gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedFormat === 'text'
                      ? 'border-orange-500 bg-orange-50/40 text-neutral-900 ring-2 ring-orange-500/20'
                      : 'border-neutral-200 hover:bg-neutral-50/80 text-neutral-700 bg-white'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-neutral-900">สรุปรายงานข้อความ (Summary Report)</span>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                      รายงานสรุปภาษาไทยแบบย่อ พร้อมแชร์ทาง LINE, บันทึกโน้ต หรือส่งให้เทรนเนอร์
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Quick Preview summary */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 text-xs text-neutral-600 space-y-1.5 font-medium">
              <div className="flex justify-between items-center text-neutral-500">
                <span>บันทึกอาหารทั้งหมด:</span>
                <span className="font-bold text-neutral-900">{exportParams.history.length} รายการ</span>
              </div>
              <div className="flex justify-between items-center text-neutral-500">
                <span>ช่วงเวลาย้อนหลัง:</span>
                <span className="font-bold text-neutral-900">7 วันล่าสุด & 4 สัปดาห์</span>
              </div>
              <div className="flex justify-between items-center text-neutral-500">
                <span>สัดส่วนพลังงาน (Macro):</span>
                <span className="font-bold text-neutral-900">
                  C {exportParams.macroDistributionData[0]?.percent || 0}% / P {exportParams.macroDistributionData[1]?.percent || 0}% / F {exportParams.macroDistributionData[2]?.percent || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-3 bg-neutral-50/50 border-t border-neutral-100 flex flex-col gap-2.5">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isExporting}
                className="flex-1 bg-neutral-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
              >
                <Download size={18} />
                <span>ดาวน์โหลดไฟล์ (.{selectedFormat.toUpperCase()})</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="p-3.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-2xl border border-orange-200 transition-all flex items-center justify-center shrink-0 active:scale-95"
                title="แชร์รายงาน"
              >
                <Share2 size={20} />
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="p-3.5 bg-white text-neutral-700 hover:bg-neutral-100 rounded-2xl border border-neutral-200 transition-all flex items-center justify-center shrink-0 active:scale-95"
                title="คัดลอกข้อมูล"
              >
                {isCopied ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
              </button>
            </div>

            <p className="text-[11px] text-neutral-400 text-center font-medium">
              ไฟล์ที่ส่งออกประกอบด้วยข้อมูลสถิติ แคลอรี โปรตีน คาร์บ ไขมัน และรายการอาหารทั้งหมด
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
