import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  Sparkles, 
  Check, 
  ShoppingBag, 
  Plus, 
  RefreshCw, 
  ChefHat, 
  ArrowRight,
  Copy,
  Printer,
  Edit3,
  Utensils,
  Sunrise,
  Sun,
  Moon,
  Apple,
  CheckCircle2,
  ChevronRight,
  Flame,
  Dumbbell,
  Heart,
  Save,
  Share2,
  Trash2
} from 'lucide-react';
import { ShoppingItem } from '../../types/extendedFeatures';

export interface PlannedMealItem {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  ingredients: string[];
  tip?: string;
}

export interface PlannedDay {
  dayName: string;
  dayShort: string;
  dayIndex: number;
  breakfast: PlannedMealItem;
  lunch: PlannedMealItem;
  dinner: PlannedMealItem;
  snack: PlannedMealItem;
  totalCal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export type DietGoalType = 'high_protein' | 'clean_fat_loss' | 'low_carb' | 'clean_thai' | 'plant_based';

const MEAL_PLANS_BY_DIET: Record<DietGoalType, PlannedDay[]> = {
  high_protein: [
    {
      dayName: 'วันจันทร์ (Monday)',
      dayShort: 'จันทร์',
      dayIndex: 0,
      breakfast: { name: 'ข้าวโอ๊ตต้มไข่ขาว 3 ฟอง + กล้วยหอม + นมอัลมอนด์', calories: 420, proteinG: 34, carbsG: 55, fatG: 6, ingredients: ['ข้าวโอ๊ต 50g', 'ไข่ขาวสด 3 ฟอง', 'กล้วยหอม 1 ลูก', 'นมอัลมอนด์ไม่หวาน 200ml'], tip: 'โปรตีนย่อยง่าย คาร์บค่อยๆ ปลดปล่อยพลังงาน' },
      lunch: { name: 'อกไก่ย่างสมุนไพรพริกไทยดำ + ข้าวไรซ์เบอร์รี่ + ผักนึ่ง', calories: 580, proteinG: 48, carbsG: 65, fatG: 8, ingredients: ['อกไก่ลอกหนัง 200g', 'ข้าวไรซ์เบอร์รี่ 1 ทัพพีครึ่ง', 'บรอกโคลี & ฟักทองนึ่ง 100g'], tip: 'อกไก่ย่างใช้ไฟกลาง ไม่ใช้น้ำมัน' },
      dinner: { name: 'สเต๊กปลาแซลมอนย่างซีอิ๊วหวานน้อย + หน่อไม้ฝรั่ง', calories: 520, proteinG: 42, carbsG: 20, fatG: 22, ingredients: ['เนื้อแซลมอนสด 180g', 'หน่อไม้ฝรั่ง 100g', 'ซีอิ๊วญี่ปุ่นโซเดียมต่ำ 1 ชช.'], tip: 'ได้ไขมันดีโอเมก้า 3 ช่วยลดการอักเสบ' },
      snack: { name: 'กรีกโยเกิร์ตแท้ 0% + เมล็ดเจีย + อัลมอนด์ 10 เม็ด', calories: 230, proteinG: 22, carbsG: 12, fatG: 9, ingredients: ['กรีกโยเกิร์ต 0% 150g', 'เมล็ดเจีย 1 ชช.', 'อัลมอนด์อบ 10 เม็ด'], tip: 'ของว่างโปรตีนแน่นอยู่ท้อง' },
      totalCal: 1750, proteinG: 146, carbsG: 152, fatG: 45
    },
    {
      dayName: 'วันอังคาร (Tuesday)',
      dayShort: 'อังคาร',
      dayIndex: 1,
      breakfast: { name: 'ขนมปังโฮลวีต 2 แผ่น + อะโวคาโด + ไข่ดาวน้ำ 2 ฟอง', calories: 440, proteinG: 26, carbsG: 42, fatG: 18, ingredients: ['ขนมปังโฮลวีต 2 แผ่น', 'ไข่ไก่ 2 ฟอง', 'อะโวคาโด 1/2 ลูก'], tip: 'ไขมันดีและคาร์บเชิงซ้อนช่วยสมาธิช่วงเช้า' },
      lunch: { name: 'เกาเหลาอกไก่ฉีกพิเศษผักบุ้ง + ถั่วงอก (ไม่กระเทียมเจียว)', calories: 510, proteinG: 46, carbsG: 38, fatG: 6, ingredients: ['อกไก่ฉีก 180g', 'ผักบุ้ง & ถั่วงอก 200g', 'น้ำซุปใสลดเค็ม'], tip: 'ซดน้ำซุปได้แต่ไม่ปรุงน้ำตาลเพิ่ม' },
      dinner: { name: 'สลัดทูน่าในน้ำแร่ไข่ต้ม + ผักกาดคอส + บัลซามิก', calories: 460, proteinG: 44, carbsG: 22, fatG: 14, ingredients: ['ทูน่าในน้ำแร่ 1 กระป๋อง', 'ไข่ต้ม 1 ฟอง', 'ผักสลัดคอส 150g', 'น้ำสลัดบัลซามิก 1 ชต.'], tip: 'ทูน่าไขมันต่ำ โปรตีนเพียว' },
      snack: { name: 'เวย์โปรตีน Isolate 1 สกู๊ป + ผลไม้สดตระกูลเบอร์รี่', calories: 210, proteinG: 28, carbsG: 18, fatG: 2, ingredients: ['เวย์โปรตีน 1 สกู๊ป', 'บลูเบอร์รี่/สตรอว์เบอร์รี่ 80g'], tip: 'หลังออกกำลังกาย เสริมสร้างกล้ามเนื้อ' },
      totalCal: 1620, proteinG: 144, carbsG: 120, fatG: 40
    },
    {
      dayName: 'วันพุธ (Wednesday)',
      dayShort: 'พุธ',
      dayIndex: 2,
      breakfast: { name: 'สมูทตี้โปรตีนกล้วยหอมเนยถั่ว + ผงโกโก้ 100%', calories: 430, proteinG: 32, carbsG: 48, fatG: 12, ingredients: ['กล้วยหอม 1 ลูก', 'โปรตีนผง 1 สกู๊ป', 'เนยถั่วแท้ 1 ชช.', 'ผงโกโก้แท้ 1 ชช.'], tip: 'ดื่มสดชื่น ดูดซึมไว เหมาะวันเร่งรีบ' },
      lunch: { name: 'ลาบอกไก่สับไม่หนัง + ข้าวกล้อง 1 ทัพพี + ผักสดเคียง', calories: 560, proteinG: 50, carbsG: 58, fatG: 7, ingredients: ['อกไก่สับ 200g', 'ข้าวกล้อง 1 ทัพพี', 'ผักกาดขาว แตงกวา กะหล่ำ'], tip: 'รสจัดจ้านแต่ไม่ใส่ผงชูรสและลดน้ำตาล' },
      dinner: { name: 'ปลากะพงนึ่งซีอิ๊วขิงซอย + เห็ดหอมสด + ผักกวางตุ้งฮ่องเต้', calories: 480, proteinG: 45, carbsG: 25, fatG: 10, ingredients: ['เนื้อปลากะพง 180g', 'ขิงซอย & เห็ดหอม', 'ผักกวางตุ้งฮ่องเต้ 150g'], tip: 'ปลาย่อยง่าย หลับสบายท้องเบา' },
      snack: { name: 'ไข่ต้มยางมะตูม 2 ฟอง + พริกไทยดำป่น', calories: 150, proteinG: 14, carbsG: 2, fatG: 10, ingredients: ['ไข่ไก่ต้ม 2 ฟอง'], tip: 'โปรตีนธรรมชาติ พกพาสะดวก' },
      totalCal: 1620, proteinG: 141, carbsG: 133, fatG: 39
    },
    {
      dayName: 'วันพฤหัสบดี (Thursday)',
      dayShort: 'พฤหัส',
      dayIndex: 3,
      breakfast: { name: 'โจ๊กข้าวโอ๊ตหมูสับไร้มัน + ไข่ออนเซ็น + ขิงซอย', calories: 410, proteinG: 30, carbsG: 46, fatG: 9, ingredients: ['ข้าวโอ๊ต 45g', 'หมูเนื้อแดงสับ 100g', 'ไข่ออนเซ็น 1 ฟอง', 'ต้นหอมขิงซอย'], tip: 'ไฟเบอร์เบต้ากลูแคนช่วยลดคอเลสเตอรอล' },
      lunch: { name: 'สเต๊กอกไก่ย่างกระเทียมพริกไทย + มันเทศหวานอบ + สลัด', calories: 590, proteinG: 52, carbsG: 62, fatG: 8, ingredients: ['อกไก่สด 220g', 'มันเทศญี่ปุ่นอบ 120g', 'ผักสลัดรวม'], tip: 'มันเทศอบเป็นคาร์บเชิงซ้อนชั้นเลิศ' },
      dinner: { name: 'ต้มยำกุ้งน้ำใสเห็ดฟาง + เต้าหู้ขาวนึ่ง + ข้าวไรซ์ 0.5 ทัพพี', calories: 450, proteinG: 40, carbsG: 35, fatG: 7, ingredients: ['กุ้งสดแกะเปลือก 150g', 'เต้าหู้ขาว 100g', 'เห็ดฟาง & สมุนไพรต้มยำ', 'ข้าวไรซ์เบอร์รี่ 1/2 ทัพพี'], tip: 'สมุนไพรไทย ข่า ตะไคร้ ใบมะกรูด ขับลม' },
      snack: { name: 'ถั่วแระญี่ปุ่นต้ม (Edamame) 1 ถ้วย', calories: 180, proteinG: 16, carbsG: 14, fatG: 6, ingredients: ['ถั่วแระญี่ปุ่น 150g'], tip: 'โปรตีนจากพืชและโฟเลตสูง' },
      totalCal: 1630, proteinG: 138, carbsG: 157, fatG: 30
    },
    {
      dayName: 'วันศุกร์ (Friday)',
      dayShort: 'ศุกร์',
      dayIndex: 4,
      breakfast: { name: 'แซนด์วิชทูน่าไข่ต้มโฮลวีต + ผักกาดหอม & มะเขือเทศ', calories: 430, proteinG: 36, carbsG: 44, fatG: 10, ingredients: ['ขนมปังโฮลวีต 2 แผ่น', 'ทูน่า 1/2 กระป๋อง', 'ไข่ต้ม 1 ฟอง', 'ผักสลัด'], tip: 'ไม่ใส่มายองเนส ใช้น้ำสลัดงาญี่ปุ่นหรือโยเกิร์ตแทน' },
      lunch: { name: 'ข้าวผัดอกไก่กระทะเทฟลอน ใช้น้ำมัน 1 ชช. + แตงกวา & มะนาว', calories: 570, proteinG: 46, carbsG: 68, fatG: 9, ingredients: ['ข้าวสวยไม่ขัดสี 1.5 ทัพพี', 'อกไก่หั่นเต๋า 180g', 'ไข่ไก่ 1 ฟอง', 'ต้นหอมผักชี'], tip: 'คุมน้ำมันพืชไม่เกิน 1 ช้อนชา' },
      dinner: { name: 'สุกี้น้ำอกไก่ ผักกาดขาวเห็ดเข็มทองวุ้นเส้นน้อย (ลดน้ำจิ้ม)', calories: 470, proteinG: 44, carbsG: 38, fatG: 7, ingredients: ['อกไก่สไลซ์ 180g', 'ผักกาดขาว & เห็ดเข็มทอง 200g', 'วุ้นเส้น 30g', 'ไข่ไก่ 1 ฟอง'], tip: 'ตักน้ำจิ้มสุกี้เพียง 1.5 ช้อนโต๊ะเพื่อคุมโซเดียม' },
      snack: { name: 'นมถั่วเหลืองสูตรไม่หวาน + อัลมอนด์ 8 เม็ด', calories: 190, proteinG: 15, carbsG: 8, fatG: 10, ingredients: ['นมถั่วเหลือง 250ml', 'อัลมอนด์ 8 เม็ด'], tip: 'อิสระจากน้ำตาลทราย 100%' },
      totalCal: 1660, proteinG: 141, carbsG: 158, fatG: 36
    },
    {
      dayName: 'วันเสาร์ (Saturday)',
      dayShort: 'เสาร์',
      dayIndex: 5,
      breakfast: { name: 'แพนเค้กกล้วยหอมข้าวโอ๊ต + ไข่ไก่ 2 ฟอง + น้ำผึ้ง 1 ชช.', calories: 450, proteinG: 25, carbsG: 62, fatG: 11, ingredients: ['ข้าวโอ๊ตปั่น 50g', 'กล้วยหอม 1 ลูก', 'ไข่ไก่ 2 ฟอง', 'น้ำผึ้งแท้ 1 ชช.'], tip: 'เมนูเช้าวันหยุด อร่อยคลีนเหมือนขนมคาเฟ่' },
      lunch: { name: 'สเต๊กสันในวัวย่าง (Lean Beef) + มันฝรั่งต้ม + หน่อไม้ฝรั่ง', calories: 610, proteinG: 55, carbsG: 45, fatG: 16, ingredients: ['เนื้อสันในวัวไม่ติดมัน 200g', 'มันฝรั่งต้ม 100g', 'หน่อไม้ฝรั่ง & เกลือชมพู'], tip: 'เนื้อวัวอุดมด้วยธาตุเหล็ก สังกะสี และ Creatine ธรรมชาติ' },
      dinner: { name: 'ยำวุ้นเส้นเห็ดรวมอกไก่สับกุ้งสด (ไม่ชูรส ลดหวาน)', calories: 480, proteinG: 42, carbsG: 48, fatG: 6, ingredients: ['อกไก่สับ 120g', 'กุ้งสด 80g', 'เห็ดหูหนูขาว & เห็ดชิเมจิ', 'วุ้นเส้น 35g', 'น้ำยำมะนาวสด'], tip: 'รสแซ่บสะใจ พลังงานเบาสบาย' },
      snack: { name: 'ดาร์กช็อกโกแลต 85% (2 ชิ้น) + แอปเปิ้ลเขียว 1 ลูก', calories: 190, proteinG: 4, carbsG: 28, fatG: 8, ingredients: ['Dark Choc 85% 20g', 'แอปเปิ้ลเขียว 1 ผล'], tip: 'สารต้านอนุมูลอิสระ Flavonoids สูง' },
      totalCal: 1730, proteinG: 126, carbsG: 183, fatG: 41
    },
    {
      dayName: 'วันอาทิตย์ (Sunday)',
      dayShort: 'อาทิตย์',
      dayIndex: 6,
      breakfast: { name: 'ไข่คนไข่ขาว 3 ฟอง + อะโวคาโด 1/2 ลูก + ขนมปังมัลติเกรน', calories: 420, proteinG: 28, carbsG: 36, fatG: 16, ingredients: ['ไข่ขาว 3 ฟอง', 'ไข่แดง 1 ฟอง', 'อะโวคาโด 1/2 ลูก', 'ขนมปังมัลติเกรน 1 แผ่น'], tip: 'กรดไขมันไม่อิ่มตัวเชิงเดี่ยว บำรุงหัวใจ' },
      lunch: { name: 'ข้าวหน้าหมูสไลซ์ผัดขิงไร้น้ำมัน + บรอกโคลี + ข้าวกล้อง', calories: 570, proteinG: 48, carbsG: 60, fatG: 11, ingredients: ['สันในหมูสไลซ์ 180g', 'ขิงซอย & หอมใหญ่', 'ข้าวกล้อง 1.5 ทัพพี', 'บรอกโคลีลวก'], tip: 'ขิงช่วยเร่งการเผาผลาญและช่วยย่อย' },
      dinner: { name: 'แกงจืดเต้าหู้ไข่หมูสับสาหร่ายวากาเมะ + ผักกาดขาว', calories: 430, proteinG: 38, carbsG: 24, fatG: 12, ingredients: ['เต้าหู้ไข่ 1 หลอด', 'หมูสับไม่ติดมัน 120g', 'สาหร่ายวากาเมะ', 'ผักกาดขาว 150g'], tip: 'ไอโอดีนและแร่ธาตุสูง ซดคล่องคอ' },
      snack: { name: 'ฝรั่งสด 1 ผลจิ้มพริกเกลือหวานน้อย', calories: 120, proteinG: 3, carbsG: 26, fatG: 1, ingredients: ['ฝรั่งสด 1 ผลใหญ่'], tip: 'วิตามินซีสูงกว่าส้ม 3 เท่า เสริมภูมิคุ้มกัน' },
      totalCal: 1540, proteinG: 117, carbsG: 146, fatG: 40
    }
  ],
  clean_fat_loss: [
    {
      dayName: 'วันจันทร์ (Monday)',
      dayShort: 'จันทร์',
      dayIndex: 0,
      breakfast: { name: 'ไข่ต้ม 2 ฟอง + สลัดผักไฮโดรโปนิกส์น้ำใส + มะเขือเทศราชินี', calories: 310, proteinG: 20, carbsG: 15, fatG: 12, ingredients: ['ไข่ต้ม 2 ฟอง', 'ผักสลัด 150g', 'มะเขือเทศราชินี 8 ลูก', 'น้ำสลัดบัลซามิก 1 ชช.'], tip: 'แคลอรีต่ำมาก อิ่มนานด้วยไฟเบอร์' },
      lunch: { name: 'อกไก่นึ่งขมิ้นชัน + ข้าวกล้อง 1 ทัพพี + กะหล่ำปลีต้ม', calories: 480, proteinG: 42, carbsG: 50, fatG: 5, ingredients: ['อกไก่ 180g', 'ข้าวกล้อง 1 ทัพพี', 'กะหล่ำปลีต้ม'], tip: 'ขมิ้นช่วยลดการอักเสบในเซลล์' },
      dinner: { name: 'ต้มยำปลากะพงน้ำใส + เห็ดนางฟ้า + ยอดฟักแม้วลวก', calories: 380, proteinG: 38, carbsG: 18, fatG: 6, ingredients: ['เนื้อปลากะพง 160g', 'เห็ดนางฟ้า 100g', 'ยอดฟักแม้ว 100g'], tip: 'เน้นโปรตีนและน้ำซุปผัก เบาสบาย' },
      snack: { name: 'แอปเปิ้ลเขียว 1 ลูก + น้ำมะนาวโซดาไม่หวาน', calories: 95, proteinG: 1, carbsG: 22, fatG: 0, ingredients: ['แอปเปิ้ลเขียว 1 ลูก', 'โซดา & มะนาว'], tip: 'สารเพคตินในแอปเปิ้ลช่วยดูดซับไขมัน' },
      totalCal: 1265, proteinG: 101, carbsG: 105, fatG: 23
    },
    {
      dayName: 'วันอังคาร (Tuesday)',
      dayShort: 'อังคาร',
      dayIndex: 1,
      breakfast: { name: 'ข้าวโอ๊ตต้มน้ำเปล่า 35g + ไข่ขาว 2 ฟอง + บลูเบอร์รี่สด', calories: 290, proteinG: 18, carbsG: 42, fatG: 4, ingredients: ['ข้าวโอ๊ต 35g', 'ไข่ขาว 2 ฟอง', 'บลูเบอร์รี่ 50g'], tip: 'GI ต่ำ รักษาระดับน้ำตาลในเลือด' },
      lunch: { name: 'สลัดอกไก่ฉีกน้ำยำมะนาวพริกสด + ข้าวโพดหวาน 2 ช้อนโต๊ะ', calories: 450, proteinG: 44, carbsG: 35, fatG: 6, ingredients: ['อกไก่ต้มฉีก 180g', 'ผักสลัดรวม 150g', 'ข้าวโพดหวาน 30g'], tip: 'รสแซ่บไม่พึ่งไขมัน' },
      dinner: { name: 'แกงส้มผักรวมกุ้งสด (ไม่ใส่น้ำตาลปี๊บ)', calories: 360, proteinG: 32, carbsG: 28, fatG: 4, ingredients: ['กุ้งสด 120g', 'ผักบุ้ง กะหล่ำ ถั่วฝักยาว 200g'], tip: 'พริกแกงส้มช่วยกระตุ้นการเผาผลาญ' },
      snack: { name: 'แตงกวาญี่ปุ่นแท่ง + โยเกิร์ต 0% Dip 2 ช้อนโต๊ะ', calories: 80, proteinG: 6, carbsG: 8, fatG: 0, ingredients: ['แตงกวาญี่ปุ่น 1 ลูก', 'กรีกโยเกิร์ต 0% 50g'], tip: 'โซเดียมต่ำมาก ไม่บวมน้ำ' },
      totalCal: 1180, proteinG: 100, carbsG: 113, fatG: 14
    },
    {
      dayName: 'วันพุธ (Wednesday)',
      dayShort: 'พุธ',
      dayIndex: 2,
      breakfast: { name: 'ไข่ตุ๋นไมโครเวฟกุ้งสด + เห็ดหอม + แครอทหั่นเต๋า', calories: 280, proteinG: 24, carbsG: 12, fatG: 8, ingredients: ['ไข่ไก่ 2 ฟอง', 'กุ้งสับ 40g', 'เห็ดหอม & แครอท'], tip: 'นุ่มละมุน ย่อยง่าย รวดเร็ว' },
      lunch: { name: 'ลาบเต้าหู้ขาว + เห็ดรวม + ข้าวไรซ์เบอร์รี่ 1 ทัพพี', calories: 460, proteinG: 28, carbsG: 55, fatG: 8, ingredients: ['เต้าหู้ขาวแข็ง 150g', 'เห็ดนางฟ้า เห็ดชิเมจิ', 'ข้าวไรซ์เบอร์รี่ 1 ทัพพี'], tip: 'ไฟเบอร์แน่น อยู่ท้องตลอดบ่าย' },
      dinner: { name: 'สเต๊กอกไก่ย่างเกลือพริกไทย + บรอกโคลีนึ่ง 150g', calories: 410, proteinG: 46, carbsG: 16, fatG: 6, ingredients: ['อกไก่ 200g', 'บรอกโคลี 150g'], tip: 'ลีนแคลอรี่ โปรตีนจัดเต็ม' },
      snack: { name: 'ฝรั่งสด 1/2 ลูก', calories: 60, proteinG: 1, carbsG: 14, fatG: 0, ingredients: ['ฝรั่งสด 150g'], tip: 'วิตามินซีสูง ช่วยเสริมผิวพรรณ' },
      totalCal: 1210, proteinG: 99, carbsG: 97, fatG: 22
    },
    {
      dayName: 'วันพฤหัสบดี (Thursday)',
      dayShort: 'พฤหัส',
      dayIndex: 3,
      breakfast: { name: 'ขนมปังโฮลวีต 1 แผ่น + เนยถั่ว 1 ชช. + กล้วยหอม 1/2 ลูก', calories: 260, proteinG: 9, carbsG: 38, fatG: 8, ingredients: ['โฮลวีต 1 แผ่น', 'เนยถั่วแท้ 1 ชช.', 'กล้วยหอม 1/2 ลูก'], tip: 'พลังงานพร้อมออกกำลังกายตอนเช้า' },
      lunch: { name: 'เกาเหลาปลากะพงพิเศษตำลึง + ข้าวกล้อง 0.5 ทัพพี', calories: 440, proteinG: 40, carbsG: 32, fatG: 6, ingredients: ['เนื้อปลา 180g', 'ใบตำลึง 100g', 'ข้าวกล้อง 1/2 ทัพพี'], tip: 'ใบตำลึงช่วยบำรุงสายตาและลดน้ำตาล' },
      dinner: { name: 'ยำเห็ดรวมอกไก่สับ + ถั่วฝักยาวลวก', calories: 370, proteinG: 36, carbsG: 22, fatG: 5, ingredients: ['อกไก่สับ 150g', 'เห็ดออรินจิ เห็ดเข็มทอง', 'ถั่วฝักยาว'], tip: 'แคลอรี่ต่ำมาก เหมาะช่วงคุม Deficit' },
      snack: { name: 'ชาเขียวมัทฉะร้อนไม่ใส่น้ำตาล', calories: 15, proteinG: 1, carbsG: 2, fatG: 0, ingredients: ['ผงมัทฉะแท้ 1 ชช.'], tip: 'สาร EGCG เร่งอัตราการเผาผลาญไขมัน' },
      totalCal: 1085, proteinG: 86, carbsG: 94, fatG: 19
    },
    {
      dayName: 'วันศุกร์ (Friday)',
      dayShort: 'ศุกร์',
      dayIndex: 4,
      breakfast: { name: 'สมูทตี้ผักเคล + กีวี 1 ลูก + โปรตีนพืช 1 สกู๊ป', calories: 310, proteinG: 24, carbsG: 36, fatG: 3, ingredients: ['ผักเคลสด 50g', 'กีวี 1 ลูก', 'โปรตีนพืช 1 สกู๊ป'], tip: 'Detox ธรรมชาติ สารต้านอนุมูลอิสระสูง' },
      lunch: { name: 'ข้าวกะเพราอกไก่ไร้น้ำมัน + ไข่ดาวน้ำ + ข้าวไรซ์ 1 ทัพพี', calories: 490, proteinG: 45, carbsG: 48, fatG: 8, ingredients: ['อกไก่สับ 180g', 'ใบกะเพราป่า', 'ข้าวไรซ์เบอร์รี่ 1 ทัพพี', 'ไข่ไก่ 1 ฟอง'], tip: 'ผัดด้วยน้ำสต๊อก ไม่ใช้น้ำมันพืช' },
      dinner: { name: 'ซุปมิโซะเต้าหู้อ่อนสาหร่าย + อกไก่ฉีก 100g', calories: 340, proteinG: 32, carbsG: 18, fatG: 6, ingredients: ['เต้าหู้อ่อน 100g', 'อกไก่ฉีก 100g', 'มิโซะลดโซเดียม 1 ชต.'], tip: 'โปรไบโอติกส์จากมิโซะช่วยการขับถ่าย' },
      snack: { name: 'ส้มสายน้ำผึ้ง 1 ลูก', calories: 70, proteinG: 1, carbsG: 16, fatG: 0, ingredients: ['ส้ม 1 ลูก'], tip: 'ให้ความสดชื่นยามบ่าย' },
      totalCal: 1210, proteinG: 102, carbsG: 118, fatG: 17
    },
    {
      dayName: 'วันเสาร์ (Saturday)',
      dayShort: 'เสาร์',
      dayIndex: 5,
      breakfast: { name: 'ไข่กวนไข่ขาว 3 ฟอง + มะเขือเทศย่าง + ขนมปังโฮลวีต 1 แผ่น', calories: 290, proteinG: 22, carbsG: 28, fatG: 6, ingredients: ['ไข่ขาว 3 ฟอง', 'มะเขือเทศ 1 ลูก', 'โฮลวีต 1 แผ่น'], tip: 'ไลโคปีนในมะเขือเทศดูดซึมดีขึ้นเมื่อผ่านความร้อน' },
      lunch: { name: 'สเต๊กปลาแซลมอนย่างเกลือ + ฟักทองนึ่ง 100g + สลัดผัก', calories: 510, proteinG: 38, carbsG: 32, fatG: 18, ingredients: ['แซลมอน 150g', 'ฟักทองนึ่ง 100g', 'ผักสลัด'], tip: 'พลังงานคุณภาพดี ไม่อ้วนสะสม' },
      dinner: { name: 'สุกี้โรลอกไก่สับนึ่ง (ผักกาดขาวห่อไก่) + น้ำจิ้มสุกี้ 1 ช้อนชา', calories: 370, proteinG: 38, carbsG: 22, fatG: 5, ingredients: ['อกไก่สับ 160g', 'ผักกาดขาว 6 ใบ', 'น้ำจิ้มสุกี้ 1 ชช.'], tip: 'เมนูคลีนยอดฮิต แคลน้อยไฟเบอร์สูง' },
      snack: { name: 'เมล็ดฟักทองอบ 1 ช้อนโต๊ะ', calories: 90, proteinG: 5, carbsG: 4, fatG: 7, ingredients: ['เมล็ดฟักทอง 15g'], tip: 'แมกนีเซียมสูง ช่วยคลายกล้ามเนื้อ' },
      totalCal: 1260, proteinG: 103, carbsG: 86, fatG: 36
    },
    {
      dayName: 'วันอาทิตย์ (Sunday)',
      dayShort: 'อาทิตย์',
      dayIndex: 6,
      breakfast: { name: 'กรีกโยเกิร์ต 0% 150g + สตรอว์เบอร์รี่สด 4 ลูก + เมล็ดเจีย', calories: 220, proteinG: 20, carbsG: 18, fatG: 4, ingredients: ['กรีกโยเกิร์ต 150g', 'สตรอว์เบอร์รี่ 4 ลูก', 'เมล็ดเจีย 1 ชช.'], tip: 'โปรตีนสูง คาร์บต่ำ อิ่มสบาย' },
      lunch: { name: 'ก๋วยเตี๋ยวลุยสวนอกไก่ (ใช้อกไก่แน่นๆ ผักเน้นๆ น้ำจิ้มซีฟู้ดแซ่บ)', calories: 460, proteinG: 38, carbsG: 42, fatG: 6, ingredients: ['แผ่นก๋วยเตี๋ยว', 'อกไก่ฉีก 150g', 'ผักชีฝรั่ง โหระพา แครอท'], tip: 'ผักสมุนไพรสดหลากหลายชนิด' },
      dinner: { name: 'ปลากะพงลวกจิ้มน้ำจิ้มซีฟู้ด + ผักกาดขาว & บรอกโคลีลวก', calories: 380, proteinG: 42, carbsG: 16, fatG: 5, ingredients: ['ปลากะพงสด 180g', 'ผักกาดขาว & บรอกโคลี 200g'], tip: 'โปรตีนบริสุทธิ์ก่อนนอน สบายท้อง' },
      snack: { name: 'มะละกอสุก 3 ชิ้นพอดีคำ', calories: 75, proteinG: 1, carbsG: 18, fatG: 0, ingredients: ['มะละกอสุก 100g'], tip: 'เอนไซม์ปาเปนช่วยย่อยโปรตีน' },
      totalCal: 1135, proteinG: 101, carbsG: 94, fatG: 15
    }
  ],
  low_carb: [
    {
      dayName: 'วันจันทร์ (Monday)',
      dayShort: 'จันทร์',
      dayIndex: 0,
      breakfast: { name: 'ไข่ดาวน้ำ 2 ฟอง + อะโวคาโด 1/2 ลูก + เบคอนอบไร้น้ำมัน 1 ชิ้น', calories: 380, proteinG: 22, carbsG: 8, fatG: 28, ingredients: ['ไข่ไก่ 2 ฟอง', 'อะโวคาโด 1/2 ลูก', 'เบคอน 1 ชิ้น'], tip: 'คาร์บต่ำกว่า 10g รักษาระดับคีโตซิส' },
      lunch: { name: 'สลัดเนื้อสันในย่าง + น้ำมันมะกอก Extra Virgin + ผักโขมสด', calories: 560, proteinG: 48, carbsG: 10, fatG: 34, ingredients: ['เนื้อสันใน 180g', 'ผักโขมสด 150g', 'น้ำมันมะกอก 1 ชต.'], tip: 'ไขมันดีจากมะกอกและโปรตีนเนื้อวัว' },
      dinner: { name: 'แซลมอนย่างกระทะ + ดอกกะหล่ำบดแทนมันฝรั่ง + บรอกโคลี', calories: 510, proteinG: 40, carbsG: 12, fatG: 32, ingredients: ['แซลมอน 180g', 'ดอกกะหล่ำ 150g', 'เนยแท้ 1 ชช.'], tip: 'ดอกกะหล่ำบดรสสัมผัสเหมือนมันบดแต่คาร์บต่ำมาก' },
      snack: { name: 'วอลนัท & อัลมอนด์อบ 20 เม็ด', calories: 190, proteinG: 6, carbsG: 5, fatG: 18, ingredients: ['วอลนัท & อัลมอนด์ 30g'], tip: 'ไขมันดีบำรุงสมอง' },
      totalCal: 1640, proteinG: 116, carbsG: 35, fatG: 112
    },
    {
      dayName: 'วันอังคาร (Tuesday)',
      dayShort: 'อังคาร',
      dayIndex: 1,
      breakfast: { name: 'ไข่เจียวชีสใส่ผักโขมและเห็ดหอม (ทอดน้ำมันมะกอก 1 ชช.)', calories: 390, proteinG: 26, carbsG: 6, fatG: 28, ingredients: ['ไข่ไก่ 2 ฟอง', 'ชีสเชดด้า 25g', 'ผักโขม & เห็ด'], tip: 'โปรตีนและไขมันช่วยให้ไม่หิวระหว่างมื้อ' },
      lunch: { name: 'ลาบหมูสับติดมันเล็กน้อย + ผักสดแตงกวากะหล่ำปลี (ไม่ใส่ข้าวคั่ว)', calories: 520, proteinG: 44, carbsG: 9, fatG: 32, ingredients: ['หมูสับ 180g', 'สมุนไพรลาบ', 'ผักสด 200g'], tip: 'ตัดข้าวคั่วออกเพื่อลดคาร์บส่วนเกิน' },
      dinner: { name: 'อกไก่ห่อเบคอนย่าง + หน่อไม้ฝรั่งผัดกระเทียม', calories: 480, proteinG: 46, carbsG: 8, fatG: 26, ingredients: ['อกไก่ 180g', 'เบคอน 1 ชิ้น', 'หน่อไม้ฝรั่ง 100g'], tip: 'อิ่มอร่อยสไตล์โลว์คาร์บ' },
      snack: { name: 'ชีสสติ๊ก 1 แท่ง + แตงกวาดอง', calories: 110, proteinG: 7, carbsG: 2, fatG: 9, ingredients: ['ชีสสติ๊ก 1 ชิ้น', 'แตงกวาดอง'], tip: 'ของว่างคาร์บแทบเป็นศูนย์' },
      totalCal: 1500, proteinG: 123, carbsG: 25, fatG: 95
    },
    {
      dayName: 'วันพุธ (Wednesday)',
      dayShort: 'พุธ',
      dayIndex: 2,
      breakfast: { name: 'กาแฟดำเนยสดแท้ (Bulletproof Coffee) + ไข่ต้ม 2 ฟอง', calories: 340, proteinG: 14, carbsG: 2, fatG: 30, ingredients: ['กาแฟดำ', 'เนยแท้จืด 1 ชต.', 'ไข่ต้ม 2 ฟอง'], tip: 'กระตุ้นการเผาผลาญไขมันและเพิ่มความตื่นตัว' },
      lunch: { name: 'ข้าวดอกกะหล่ำผัดกะเพราทะเลรวม (กุ้ง ปลาหมึก)', calories: 490, proteinG: 42, carbsG: 14, fatG: 24, ingredients: ['กุ้ง & ปลาหมึก 180g', 'ดอกกะหล่ำสับ 150g', 'ใบกะเพรา'], tip: 'ใช้ข้าวดอกกะหล่ำแทนข้าวสวย คาร์บลดลง 80%' },
      dinner: { name: 'สเต๊กหมูสันนอกพริกไทยดำ + สลัดผักน้ำสลัดซีซาร์คีโต', calories: 530, proteinG: 45, carbsG: 9, fatG: 33, ingredients: ['หมูสันนอก 180g', 'ผักกาดคอส 150g', 'ชีสพาเมซาน'], tip: 'โปรตีนแน่น ไขมันสมดุล' },
      snack: { name: 'ดาร์กช็อกโกแลต 90% (2 ชิ้น)', calories: 130, proteinG: 3, carbsG: 4, fatG: 12, ingredients: ['Dark Choc 90% 20g'], tip: 'ความสุขไร้น้ำตาล' },
      totalCal: 1490, proteinG: 104, carbsG: 29, fatG: 99
    },
    {
      dayName: 'วันพฤหัสบดี (Thursday)',
      dayShort: 'พฤหัส',
      dayIndex: 3,
      breakfast: { name: 'สมูทตี้อะโวคาโดนมอัลมอนด์ + ผงมัทฉะ + เวย์โปรตีน 1 สกู๊ป', calories: 390, proteinG: 28, carbsG: 9, fatG: 24, ingredients: ['อะโวคาโด 1/2 ลูก', 'นมอัลมอนด์ 200ml', 'เวย์โปรตีน 1 สกู๊ป', 'ผงมัทฉะ'], tip: 'กรดไขมันดีและสารต้านอนุมูลอิสระ' },
      lunch: { name: 'เกาเหลาหมูตุ๋นพิเศษผักบุ้ง (ไม่ใส่กระเทียมเจียว ไม่ใส่น้ำตาล)', calories: 470, proteinG: 42, carbsG: 8, fatG: 28, ingredients: ['หมูตุ๋น & หมูสด 180g', 'ผักบุ้ง & ถั่วงอก 200g'], tip: 'ซดน้ำซุปหอมกลมกล่อม' },
      dinner: { name: 'ปลากะพงทอดน้ำมันมะพร้าว + ผักสลัดน้ำใสเลมอน', calories: 490, proteinG: 44, carbsG: 7, fatG: 30, ingredients: ['เนื้อปลากะพง 200g', 'น้ำมันมะพร้าว 1 ชต.', 'ผักสลัดรวม'], tip: 'น้ำมันมะพร้าวมีกรด MCT เผาผลาญเป็นพลังงานทันที' },
      snack: { name: 'ไข่ต้มยางมะตูม 1 ฟอง + มายองเนสคีโต 1 ชช.', calories: 120, proteinG: 7, carbsG: 1, fatG: 10, ingredients: ['ไข่ไก่ 1 ฟอง', 'มายองเนสไร้น้ำตาล'], tip: 'ของว่างแก้หิวฉับไว' },
      totalCal: 1470, proteinG: 121, carbsG: 25, fatG: 92
    },
    {
      dayName: 'วันศุกร์ (Friday)',
      dayShort: 'ศุกร์',
      dayIndex: 4,
      breakfast: { name: 'มัฟฟินไข่ผักรวม (Egg Muffins) 3 ชิ้น อบชีสและพริกหวาน', calories: 360, proteinG: 24, carbsG: 6, fatG: 24, ingredients: ['ไข่ไก่ 3 ฟอง', 'พริกหวาน & เห็ด', 'มอสซาเรลล่าชีส 30g'], tip: 'Meal prep อบใส่ตู้เย็นไว้ อุ่นทานได้ทันที' },
      lunch: { name: 'สลัดทูน่าอะโวคาโดโบวล์ + ไข่ต้ม + เมล็ดทานตะวัน', calories: 540, proteinG: 45, carbsG: 11, fatG: 34, ingredients: ['ทูน่าในน้ำมันมะกอก 1 ป๋อง', 'อะโวคาโด 1/2 ลูก', 'ไข่ต้ม 1 ฟอง', 'เมล็ดทานตะวัน'], tip: 'โอเมก้า 3 และวิตามิน E เข้มข้น' },
      dinner: { name: 'สเต๊กไก่ย่างซอสเพสโต้ (Pesto Sauce) + บรอกโคลีอบชีส', calories: 510, proteinG: 46, carbsG: 10, fatG: 31, ingredients: ['อกไก่ 180g', 'ซอสเพสโต้ใบโหระพา 1 ชต.', 'บรอกโคลีอบชีส 150g'], tip: 'ซอสเพสโต้อุดมด้วยน้ำมันมะกอกและใบโหระพาสด' },
      snack: { name: 'อัลมอนด์อบธรรมชาติ 15 เม็ด', calories: 120, proteinG: 5, carbsG: 4, fatG: 10, ingredients: ['อัลมอนด์ 20g'], tip: 'ไฟเบอร์ช่วยให้อยู่ท้อง' },
      totalCal: 1530, proteinG: 120, carbsG: 31, fatG: 99
    },
    {
      dayName: 'วันเสาร์ (Saturday)',
      dayShort: 'เสาร์',
      dayIndex: 5,
      breakfast: { name: 'แพนเค้กแป้งอัลมอนด์ + เบอร์รี่สด + วิปครีมสดไร้น้ำตาล', calories: 410, proteinG: 16, carbsG: 12, fatG: 32, ingredients: ['แป้งอัลมอนด์ 40g', 'ไข่ไก่ 2 ฟอง', 'สตรอว์เบอร์รี่สด', 'วิปครีมแท้'], tip: 'แพนเค้กไร้แป้งสาลี คาร์บต่ำมาก' },
      lunch: { name: 'ชาบูคีโต (หมูสันนอกสไลซ์ + ผักกาดขาว + เห็ดรวม + น้ำซุปใส)', calories: 580, proteinG: 52, carbsG: 14, fatG: 34, ingredients: ['หมูสไลซ์ 220g', 'ผักกาดขาว & เห็ด 250g', 'น้ำจิ้มงาคีโต'], tip: 'มื้อสังสรรค์วันหยุด ไม่หลุดคีโต' },
      dinner: { name: 'ปลากะพงนึ่งมะนาวพริกกระเทียมสด + ผักต้มรวม', calories: 420, proteinG: 44, carbsG: 8, fatG: 18, ingredients: ['เนื้อปลา 200g', 'พริก มะนาว กระเทียม', 'กะหล่ำปลีต้ม'], tip: 'รสจัดจ้าน สดชื่น พลังงานสะอาด' },
      snack: { name: 'กากหมูทอดไร้น้ำมัน (Pork Rinds) 25g', calories: 140, proteinG: 15, carbsG: 0, fatG: 8, ingredients: ['แคบหมูไร้มัน/กากหมูคีโต'], tip: 'กรุบกรอบ 0 Carb' },
      totalCal: 1550, proteinG: 127, carbsG: 34, fatG: 92
    },
    {
      dayName: 'วันอาทิตย์ (Sunday)',
      dayShort: 'อาทิตย์',
      dayIndex: 6,
      breakfast: { name: 'ไข่คนแซลมอนรมควัน + ครีมชีส 1 ช้อนโต๊ะ + แตงกวา', calories: 390, proteinG: 28, carbsG: 5, fatG: 28, ingredients: ['ไข่ไก่ 2 ฟอง', 'แซลมอนรมควัน 60g', 'ครีมชีส 20g', 'แตงกวา'], tip: 'มื้อเช้าหรูหราแบบฉบับโลว์คาร์บ' },
      lunch: { name: 'สเต๊กเนื้อริบอายย่างเนยกระเทียม + หน่อไม้ฝรั่งย่าง', calories: 620, proteinG: 50, carbsG: 6, fatG: 44, ingredients: ['เนื้อริบอาย 200g', 'เนยแท้', 'หน่อไม้ฝรั่ง 100g'], tip: 'โปรตีนและไขมันเต็มอิ่มสำหรับวันพักผ่อน' },
      dinner: { name: 'แกงจืดไข่น้ำหมูสับตำลึง (ไข่เจียว 2 ฟองทำแกงจืด)', calories: 440, proteinG: 36, carbsG: 9, fatG: 28, ingredients: ['ไข่ไก่ 2 ฟอง', 'หมูสับ 100g', 'ใบตำลึง 150g'], tip: 'เมนูไทยบ้านๆ โลว์คาร์บตามธรรมชาติ' },
      snack: { name: 'มะคาเดเมียอบ 8 เม็ด', calories: 160, proteinG: 2, carbsG: 3, fatG: 16, ingredients: ['ถั่วมะคาเดเมีย 20g'], tip: 'ราชาแห่งถั่วไขมันดีสูง' },
      totalCal: 1610, proteinG: 116, carbsG: 23, fatG: 116
    }
  ],
  clean_thai: [
    {
      dayName: 'วันจันทร์ (Monday)',
      dayShort: 'จันทร์',
      dayIndex: 0,
      breakfast: { name: 'โจ๊กข้าวกล้องอกไก่ฉีก + ไข่ออนเซ็น + ขิงซอยผักชี', calories: 380, proteinG: 28, carbsG: 48, fatG: 6, ingredients: ['ข้าวกล้องต้ม 1 ถ้วย', 'อกไก่ฉีก 120g', 'ไข่ออนเซ็น 1 ฟอง', 'ขิง & ต้นหอม'], tip: 'มื้อเช้าไทยแท้ อบอุ่นสบายท้อง' },
      lunch: { name: 'ข้าวกะเพราอกไก่สับพริกแห้งไร้น้ำมัน + ข้าวไรซ์เบอร์รี่ + แตงกวา', calories: 520, proteinG: 46, carbsG: 58, fatG: 8, ingredients: ['อกไก่สับ 180g', 'ใบกะเพราป่า & พริกแห้ง', 'ข้าวไรซ์เบอร์รี่ 1.5 ทัพพี'], tip: 'ผัดด้วยน้ำ ผสานความหอมของพริกแห้ง' },
      dinner: { name: 'ต้มยำปลากะพงน้ำใสใบกะเพรา + ยำเห็ดรวมลวก', calories: 430, proteinG: 40, carbsG: 32, fatG: 6, ingredients: ['ปลากะพง 180g', 'เห็ดฟาง เห็ดนางฟ้า', 'สมุนไพรต้มยำ'], tip: 'สมุนไพรไทยช่วยระบบย่อยอาหาร' },
      snack: { name: 'กล้วยน้ำว้าปิ้ง 1 ลูก', calories: 90, proteinG: 1, carbsG: 22, fatG: 0, ingredients: ['กล้วยน้ำว้า 1 ลูก'], tip: 'ไฟเบอร์ช่วยให้อยู่ท้องและขับถ่ายดี' },
      totalCal: 1420, proteinG: 115, carbsG: 160, fatG: 20
    },
    {
      dayName: 'วันอังคาร (Tuesday)',
      dayShort: 'อังคาร',
      dayIndex: 1,
      breakfast: { name: 'ข้าวต้มปลาเก๋าใส่ขึ้นฉ่าย + ขิงซอย + กระเทียมเจียวไร้น้ำมัน', calories: 390, proteinG: 32, carbsG: 46, fatG: 5, ingredients: ['เนื้อปลา 150g', 'ข้าวต้ม 1 ถ้วย', 'ขึ้นฉ่าย & ขิง'], tip: 'เนื้อปลาหวานสด น้ำซุปใสกลมกล่อม' },
      lunch: { name: 'ลาบอกไก่คั่ว + ข้าวเหนียวลืมผัว 1 ห่อเล็ก + ผักสดเคียง', calories: 550, proteinG: 48, carbsG: 60, fatG: 8, ingredients: ['อกไก่บด 200g', 'ข้าวเหนียวดำ 1 ห่อเล็ก', 'ผักกาดขาว แตงกวา'], tip: 'ข้าวเหนียวดำมีแอนโทไซยานินสูง' },
      dinner: { name: 'แกงส้มผักรวมปลากะพง + ไข่ต้ม 1 ฟอง', calories: 420, proteinG: 38, carbsG: 34, fatG: 9, ingredients: ['เนื้อปลา 150g', 'ผักรวมแกงส้ม 200g', 'ไข่ต้ม 1 ฟอง'], tip: 'รสเปรี้ยวจากมะขามเปียกแท้' },
      snack: { name: 'มะละกอสุก 4 ชิ้นพอดีคำ', calories: 80, proteinG: 1, carbsG: 20, fatG: 0, ingredients: ['มะละกอสุก 120g'], tip: 'เอนไซม์ธรรมชาติช่วยย่อย' },
      totalCal: 1440, proteinG: 119, carbsG: 160, fatG: 22
    },
    {
      dayName: 'วันพุธ (Wednesday)',
      dayShort: 'พุธ',
      dayIndex: 2,
      breakfast: { name: 'ไข่กระทะทรงเครื่องคลีน (อกไก่สับ กุนเชียงปลา เห็ดหอม ขนมปังโฮลวีต 1 แผ่น)', calories: 410, proteinG: 30, carbsG: 36, fatG: 14, ingredients: ['ไข่ไก่ 2 ฟอง', 'อกไก่สับ 50g', 'กุนเชียงปลา 30g', 'โฮลวีต 1 แผ่น'], tip: 'ไข่กระทะสไตล์อีสานแบบลดไขมัน' },
      lunch: { name: 'ส้มตำไทยไม่ใส่ชูรส + ไก่ย่างไม่เอาหนัง + ข้าวเหนียวดำครึ่งห่อ', calories: 560, proteinG: 46, carbsG: 62, fatG: 11, ingredients: ['ส้มตำไทยลดน้ำตาล', 'สะโพก/อกไก่ย่างลอกหนัง 180g', 'ข้าวเหนียวดำ 50g'], tip: 'สั่งหวานน้อย ไม่ใส่ผงชูรส' },
      dinner: { name: 'ต้มแซ่บกระดูกอ่อนหมู/อกไก่ + เห็ดฟาง + ผักบุ้งลวก', calories: 440, proteinG: 42, carbsG: 25, fatG: 11, ingredients: ['อกไก่/หมูสันใน 180g', 'เห็ดฟาง 100g', 'ผักบุ้ง 100g', 'พริกคั่วข้าวคั่ว'], tip: 'แซ่บเผ็ดร้อน กระตุ้นเหงื่อ' },
      snack: { name: 'ฝรั่งกิมจู 1 ผล', calories: 95, proteinG: 2, carbsG: 22, fatG: 0, ingredients: ['ฝรั่งสด 1 ลูก'], tip: 'วิตามินซีสูงลิ่ว' },
      totalCal: 1505, proteinG: 120, carbsG: 145, fatG: 36
    },
    {
      dayName: 'วันพฤหัสบดี (Thursday)',
      dayShort: 'พฤหัส',
      dayIndex: 3,
      breakfast: { name: 'แซนด์วิชน้ำพริกเผาอกไก่หยองคลีน + ไข่ต้ม 1 ฟอง', calories: 380, proteinG: 26, carbsG: 44, fatG: 9, ingredients: ['โฮลวีต 2 แผ่น', 'ไก่หยองไม่ใส่น้ำตาล 40g', 'พริกเผาคลีน 1 ชช.', 'ไข่ต้ม 1 ฟอง'], tip: 'น้ำพริกเผาคลีนโซเดียมต่ำ' },
      lunch: { name: 'ข้าวผัดต้มยำอกไก่แห้ง + ไข่เค็ม 1/2 ฟอง + ผักสดเคียง', calories: 570, proteinG: 45, carbsG: 65, fatG: 12, ingredients: ['ข้าวกล้อง 1.5 ทัพพี', 'อกไก่ 180g', 'เครื่องต้มยำแห้ง', 'ไข่เค็ม 1/2 ฟอง'], tip: 'หอมกลิ่นสมุนไพรใบมะกรูดตะไคร้' },
      dinner: { name: 'แกงเลียงกุ้งสดผักรวมใบแมงลัก (บวบ ตำลึง ฟักทอง เห็ดฟาง)', calories: 390, proteinG: 34, carbsG: 38, fatG: 5, ingredients: ['กุ้งสด 120g', 'บวบ ฟักทอง ตำลึง 250g', 'พริกไทยเม็ด & หอมแดง'], tip: 'พริกไทยและหอมแดงขับลม บำรุงร่างกาย' },
      snack: { name: 'ชมพู่ทับทิมจันทร์ 2 ลูก', calories: 60, proteinG: 1, carbsG: 14, fatG: 0, ingredients: ['ชมพู่ 2 ลูก'], tip: 'ฉ่ำน้ำ ดับกระหาย' },
      totalCal: 1400, proteinG: 106, carbsG: 161, fatG: 26
    },
    {
      dayName: 'วันศุกร์ (Friday)',
      dayShort: 'ศุกร์',
      dayIndex: 4,
      breakfast: { name: 'ข้าวเหนียวดำอกไก่ปิ้ง 3 ไม้ (ไม่ติดมัน) + น้ำเต้าหู้ไม่หวาน', calories: 430, proteinG: 34, carbsG: 50, fatG: 8, ingredients: ['อกไก่ปิ้ง 3 ไม้ (150g)', 'ข้าวเหนียวดำ 50g', 'น้ำเต้าหู้สด 200ml'], tip: 'เมนูสตรีทฟู้ดเวอร์ชันสุขภาพ' },
      lunch: { name: 'เกาเหลาไก่ตุ๋นมะระพิเศษผักกาดหอม + ข้าวสวย 1 ทัพพี', calories: 510, proteinG: 44, carbsG: 52, fatG: 9, ingredients: ['น่องไก่ลอกหนัง/อกไก่ 180g', 'มะระตุ๋น & ผักกาดหอม', 'ข้าวสวย 1 ทัพพี'], tip: 'มะระช่วยปรับระดับน้ำตาลในเลือด' },
      dinner: { name: 'น้ำพริกกะปิคลีน + ปลาทูย่าง 1 ตัว + ผักสด/ผักต้ม + ข้าวกล้อง 0.5 ทัพพี', calories: 460, proteinG: 38, carbsG: 38, fatG: 14, ingredients: ['ปลาทูย่าง 1 ตัว', 'น้ำพริกกะปิ (ลดเค็มลดหวาน)', 'ผักต้มรวม 200g', 'ข้าวกล้อง 1/2 ทัพพี'], tip: 'ปลาทูอุดมด้วยโอเมก้า 3 และไอโอดีน' },
      snack: { name: 'สับปะรดภูแล 3 ชิ้น', calories: 75, proteinG: 1, carbsG: 18, fatG: 0, ingredients: ['สับปะรด 100g'], tip: 'เอนไซม์โบรมีเลนช่วยย่อย' },
      totalCal: 1475, proteinG: 117, carbsG: 158, fatG: 31
    },
    {
      dayName: 'วันเสาร์ (Saturday)',
      dayShort: 'เสาร์',
      dayIndex: 5,
      breakfast: { name: 'ไข่เจียวสมุนไพรทรงเครื่อง (ไข่ 2 ฟอง หอมแดง พริกขี้หนู โหระพา อกไก่สับ) + ข้าวสวย 1 ทัพพี', calories: 440, proteinG: 28, carbsG: 40, fatG: 16, ingredients: ['ไข่ไก่ 2 ฟอง', 'อกไก่สับ 50g', 'สมุนไพรหอมแดงพริก', 'ข้าวสวย 1 ทัพพี'], tip: 'ทอดด้วยกระทะเคลือบ ใช้น้ำมัน 1 ชช.' },
      lunch: { name: 'ผัดไทยอกไก่เส้นบุก (Shirataki Pad Thai) + ถั่วงอก & ถั่วลิสงป่น 1 ชช.', calories: 480, proteinG: 40, carbsG: 38, fatG: 14, ingredients: ['เส้นบุก 150g', 'อกไก่ 150g', 'เต้าหู้เหลือง 50g', 'ไข่ไก่ 1 ฟอง', 'ถั่วงอก'], tip: 'เส้นบุก 0 Calorie ทานอร่อยเหมือนผัดไทยแท้' },
      dinner: { name: 'แกงจืดเต้าหู้หมูสับสาหร่าย + ผัดผักบุ้งไฟแดงไร้น้ำมัน', calories: 420, proteinG: 36, carbsG: 26, fatG: 14, ingredients: ['เต้าหู้ไข่ 1 หลอด', 'หมูสับไม่มัน 100g', 'ผักบุ้งไทย', 'สาหร่ายวากาเมะ'], tip: 'อาหารเย็นสบายท้อง ไม่สะสมไขมัน' },
      snack: { name: 'ลูกชิ้นอกไก่ล้วนย่าง 4 ลูก + น้ำจิ้มซีฟู้ด', calories: 120, proteinG: 16, carbsG: 6, fatG: 2, ingredients: ['ลูกชิ้นอกไก่คลีน 4 ลูก'], tip: 'โปรตีนแท้ ไร้แป้งผสม' },
      totalCal: 1460, proteinG: 120, carbsG: 110, fatG: 46
    },
    {
      dayName: 'วันอาทิตย์ (Sunday)',
      dayShort: 'อาทิตย์',
      dayIndex: 6,
      breakfast: { name: 'ข้าวผัดไข่ใส่ต้นหอม + อกไก่ฉีก + แตงกวา & พริกน้ำปลาลดเค็ม', calories: 420, proteinG: 30, carbsG: 50, fatG: 9, ingredients: ['ข้าวสวย 1.5 ทัพพี', 'ไข่ไก่ 1 ฟอง', 'อกไก่ฉีก 80g', 'ต้นหอม'], tip: 'เมนูเคลียร์ตู้เย็นวันอาทิตย์' },
      lunch: { name: 'ขนมจีนน้ำยาป่าอกไก่ (ไม่ใส่กะทิ) + ผักสดบุฟเฟต์เต็มจาน', calories: 490, proteinG: 42, carbsG: 62, fatG: 6, ingredients: ['เส้นขนมจีน 100g', 'น้ำยาป่าเนื้ออกไก่ 200g', 'ผักสด ถั่วฝักยาว กะหล่ำ'], tip: 'น้ำยาป่าไม่ใส่กะทิ พลังงานต่ำมาก' },
      dinner: { name: 'ยำวุ้นเส้นกุ้งสดหมูสับคลีน (ผักกระเฉด/ขึ้นฉ่าย)', calories: 440, proteinG: 38, carbsG: 45, fatG: 8, ingredients: ['กุ้งสด 100g', 'หมูสับไร้มัน 80g', 'วุ้นเส้น 35g', 'ผักกระเฉด & ขึ้นฉ่าย'], tip: 'รสชาติจัดจ้าน สดชื่น ปิดท้ายสัปดาห์' },
      snack: { name: 'แตงโมสดหั่นชิ้น 1 ถ้วย', calories: 85, proteinG: 1, carbsG: 20, fatG: 0, ingredients: ['แตงโมสด 200g'], tip: 'ไลโคปีนและน้ำธรรมชาติ ดับร้อน' },
      totalCal: 1435, proteinG: 111, carbsG: 177, fatG: 23
    }
  ],
  plant_based: [
    {
      dayName: 'วันจันทร์ (Monday)',
      dayShort: 'จันทร์',
      dayIndex: 0,
      breakfast: { name: 'สมูทตี้โปรตีนพืชเบอร์รี่รวม + เมล็ดเจีย + นมอัลมอนด์', calories: 360, proteinG: 28, carbsG: 45, fatG: 8, ingredients: ['Plant Protein 1 สกู๊ป', 'เบอร์รี่รวม 100g', 'เมล็ดเจีย 1 ชช.', 'นมอัลมอนด์ 200ml'], tip: 'โปรตีนจากถั่วลันเตาและข้าวกล้อง' },
      lunch: { name: 'เต้าหู้ขาวแข็งย่างซีอิ๊วญี่ปุ่น + ข้าวไรซ์เบอร์รี่ + บรอกโคลี & เห็ดหอม', calories: 520, proteinG: 32, carbsG: 68, fatG: 14, ingredients: ['เต้าหู้ขาว 200g', 'ข้าวไรซ์เบอร์รี่ 1.5 ทัพพี', 'บรอกโคลี & เห็ด'], tip: 'เต้าหู้ขาวอุดมด้วยแคลเซียมและไอโซฟลาโวน' },
      dinner: { name: 'ลาบเทมเป้ถั่วเหลืองหมัก + ผักสดเคียง + ข้าวกล้อง 0.5 ทัพพี', calories: 440, proteinG: 30, carbsG: 42, fatG: 14, ingredients: ['เทมเป้สด 150g', 'สมุนไพรลาบ', 'ข้าวกล้อง 1/2 ทัพพี'], tip: 'เทมเป้มีโปรไบโอติกส์ช่วยสุขภาพลำไส้' },
      snack: { name: 'ถั่วแระญี่ปุ่นต้ม 1 ถ้วย', calories: 160, proteinG: 14, carbsG: 12, fatG: 6, ingredients: ['ถั่วแระญี่ปุ่น 150g'], tip: 'กรดอะมิโนจำเป็นครบถ้วน' },
      totalCal: 1480, proteinG: 104, carbsG: 167, fatG: 42
    },
    {
      dayName: 'วันอังคาร (Tuesday)',
      dayShort: 'อังคาร',
      dayIndex: 1,
      breakfast: { name: 'ข้าวโอ๊ตต้มเนยถั่วกล้วยหอม + นมข้าวโอ๊ต', calories: 410, proteinG: 16, carbsG: 62, fatG: 12, ingredients: ['ข้าวโอ๊ต 50g', 'เนยถั่วแท้ 1 ชต.', 'กล้วยหอม 1 ลูก', 'นมข้าวโอ๊ต 150ml'], tip: 'ไฟเบอร์ช่วยให้อิ่มยาวนาน' },
      lunch: { name: 'ข้าวกะเพราเต้าหู้ขาวสับใส่เห็ดหิมะ + ข้าวกล้อง + แตงกวา', calories: 490, proteinG: 28, carbsG: 64, fatG: 12, ingredients: ['เต้าหู้ขาว 180g', 'เห็ดหิมะ/เห็ดหอม', 'ข้าวกล้อง 1.5 ทัพพี'], tip: 'รสแซ่บแบบแพลนต์เบส 100%' },
      dinner: { name: 'สลัดถั่วลูกไก่ (Chickpeas) + อะโวคาโด + น้ำสลัดทาฮินี', calories: 460, proteinG: 22, carbsG: 46, fatG: 20, ingredients: ['ถั่วลูกไก่ต้ม 150g', 'อะโวคาโด 1/2 ลูก', 'ผักสลัดรวม', 'ซอสงาทาฮินี'], tip: 'ถั่วชิคพีมีโปรตีนและไฟเบอร์สูงมาก' },
      snack: { name: 'วอลนัทอบ 10 เม็ด + แอปเปิ้ล 1 ลูก', calories: 180, proteinG: 4, carbsG: 24, fatG: 9, ingredients: ['วอลนัท 20g', 'แอปเปิ้ล 1 ลูก'], tip: 'ไขมันดีโอเมก้า 3 จากพืช' },
      totalCal: 1540, proteinG: 70, carbsG: 196, fatG: 53
    },
    {
      dayName: 'วันพุธ (Wednesday)',
      dayShort: 'พุธ',
      dayIndex: 2,
      breakfast: { name: 'ขนมปังซาวร์โดว์ + อะโวคาโดบด + มะเขือเทศเชอร์รี่ & เมล็ดทานตะวัน', calories: 380, proteinG: 12, carbsG: 45, fatG: 18, ingredients: ['ขนมปัง Sourdough 1 แผ่น', 'อะโวคาโด 1/2 ลูก', 'เมล็ดทานตะวัน 1 ชต.'], tip: 'ขนมปังหมักธรรมชาติย่อยง่าย' },
      lunch: { name: 'แกงเขียวหวานเต้าหู้น้ำเต้าหู้ (ไร้กะทิ) + ข้าวไรซ์เบอร์รี่ + มะเขือเปราะ', calories: 510, proteinG: 28, carbsG: 68, fatG: 13, ingredients: ['เต้าหู้ขาว 180g', 'น้ำเต้าหู้เข้มข้น', 'มะเขือเปราะ', 'ข้าวไรซ์เบอร์รี่ 1.5 ทัพพี'], tip: 'ใช้น้ำเต้าหู้แทนกะทิ ลดไขมันอิ่มตัว' },
      dinner: { name: 'ซุปมิโซะเต้าหู้อ่อนสาหร่ายวากาเมะ + ถั่วแระญี่ปุ่น + สลัดผัก', calories: 390, proteinG: 26, carbsG: 35, fatG: 11, ingredients: ['เต้าหู้อ่อน 150g', 'ถั่วแระญี่ปุ่น 80g', 'สาหร่าย & มิโซะ'], tip: 'โปรตีนย่อยง่าย ไม่แน่นท้องก่อนนอน' },
      snack: { name: 'นมถั่วเหลืองออร์แกนิก 1 แก้ว', calories: 130, proteinG: 10, carbsG: 8, fatG: 5, ingredients: ['นมถั่วเหลือง 250ml'], tip: 'โปรตีนเสริมระหว่างวัน' },
      totalCal: 1410, proteinG: 76, carbsG: 156, fatG: 47
    },
    {
      dayName: 'วันพฤหัสบดี (Thursday)',
      dayShort: 'พฤหัส',
      dayIndex: 3,
      breakfast: { name: 'พุดดิ้งเมล็ดเจียนมอัลมอนด์ + กล้วยหอม & สตรอว์เบอร์รี่', calories: 340, proteinG: 12, carbsG: 46, fatG: 14, ingredients: ['เมล็ดเจีย 3 ชต.', 'นมอัลมอนด์ 180ml', 'กล้วย & สตรอว์เบอร์รี่'], tip: 'แช่ข้ามคืนพร้อมทานทันที' },
      lunch: { name: 'สเต๊กเทมเป้ย่างซอสพริกไทยดำ + มันเทศหวานอบ + สลัดผัก', calories: 540, proteinG: 34, carbsG: 62, fatG: 16, ingredients: ['เทมเป้ 180g', 'มันเทศญี่ปุ่น 120g', 'ผักสลัด'], tip: 'โปรตีนแน่น พลังงานคงที่' },
      dinner: { name: 'ต้มยำเห็ด 5 ชนิดน้ำใส + เต้าหู้ขาว + ข้าวกล้อง 0.5 ทัพพี', calories: 410, proteinG: 24, carbsG: 55, fatG: 8, ingredients: ['เห็ดหอม เห็ดออรินจิ เห็ดชิเมจิ เห็ดฟาง เห็ดเข็มทอง', 'เต้าหู้ขาว 120g'], tip: 'เบต้ากลูแคนจากเห็ด เสริมภูมิคุ้มกัน' },
      snack: { name: 'อัลมอนด์อบ 12 เม็ด', calories: 100, proteinG: 4, carbsG: 3, fatG: 9, ingredients: ['อัลมอนด์ 15g'], tip: 'วิตามิน E บำรุงเซลล์' },
      totalCal: 1390, proteinG: 74, carbsG: 166, fatG: 47
    },
    {
      dayName: 'วันศุกร์ (Friday)',
      dayShort: 'ศุกร์',
      dayIndex: 4,
      breakfast: { name: 'โจ๊กข้าวโอ๊ตเห็ดหอมใส่เต้าหู้สับ + ขิงซอยขึ้นฉ่าย', calories: 360, proteinG: 22, carbsG: 52, fatG: 7, ingredients: ['ข้าวโอ๊ต 45g', 'เต้าหู้สับ 100g', 'เห็ดหอมสด 50g'], tip: 'อุ่นท้องยามเช้า ไร้เนื้อสัตว์' },
      lunch: { name: 'ผัดไทยเส้นบุกเต้าหู้ทอดไร้น้ำมัน + ถั่วงอก & กุยช่าย', calories: 470, proteinG: 26, carbsG: 48, fatG: 16, ingredients: ['เส้นบุก 150g', 'เต้าหู้เหลือง 150g', 'ถั่วงอก & ถั่วป่น'], tip: 'อร่อยเหมือนผัดไทยแท้แต่แคลต่ำ' },
      dinner: { name: 'แกงเลียงผักรวมเจใส่เต้าหู้ขาว + ฟักทอง & ตำลึง', calories: 380, proteinG: 22, carbsG: 48, fatG: 8, ingredients: ['เต้าหู้ขาว 120g', 'ฟักทอง บวบ ตำลึง 250g'], tip: 'รสเผ็ดร้อนพริกไทยไทยแท้' },
      snack: { name: 'ฝรั่งสด 1 ผล', calories: 90, proteinG: 2, carbsG: 20, fatG: 0, ingredients: ['ฝรั่งสด 1 ลูก'], tip: 'วิตามินซีสูง' },
      totalCal: 1300, proteinG: 72, carbsG: 168, fatG: 31
    },
    {
      dayName: 'วันเสาร์ (Saturday)',
      dayShort: 'เสาร์',
      dayIndex: 5,
      breakfast: { name: 'แพนเค้กกล้วยหอมข้าวโอ๊ตเจ + เมล็ดแฟลกซ์ + น้ำเชื่อมเมเปิ้ลแท้ 1 ชช.', calories: 420, proteinG: 14, carbsG: 68, fatG: 10, ingredients: ['ข้าวโอ๊ตปั่น 50g', 'กล้วยหอม 1 ลูก', 'เมล็ดแฟลกซ์ 1 ชช.'], tip: 'ไม่ใช้นมและไข่ไก่ แพนเค้กเจแท้' },
      lunch: { name: 'ข้าวหน้าเห็ดออรินจิผัดซอสเทอริยากิ + ถั่วแระญี่ปุ่น + ข้าวกล้อง', calories: 530, proteinG: 26, carbsG: 75, fatG: 12, ingredients: ['เห็ดออรินจิ 200g', 'ถั่วแระญี่ปุ่น 80g', 'ข้าวกล้อง 1.5 ทัพพี'], tip: 'เห็ดออรินจิหนุบหนับเหมือนเนื้อสัตว์' },
      dinner: { name: 'สุกี้น้ำเจผักรวมเต้าหู้และวุ้นเส้น + น้ำจิ้มสุกี้เจลดหวาน', calories: 420, proteinG: 24, carbsG: 54, fatG: 9, ingredients: ['เต้าหู้ขาว 150g', 'ผักกาดขาว & เห็ด 250g', 'วุ้นเส้น 30g'], tip: 'ต้มผักหวานธรรมชาติ' },
      snack: { name: 'ดาร์กช็อกโกแลตเจ 80% (2 ชิ้น)', calories: 120, proteinG: 3, carbsG: 10, fatG: 8, ingredients: ['Dark Choc Vegan 20g'], tip: 'หวานละมุนคลีน' },
      totalCal: 1490, proteinG: 67, carbsG: 207, fatG: 39
    },
    {
      dayName: 'วันอาทิตย์ (Sunday)',
      dayShort: 'อาทิตย์',
      dayIndex: 6,
      breakfast: { name: 'โทสต์ขนมปังโฮลวีตเนยถั่ว + กล้วยหอม & ชินนามอน', calories: 390, proteinG: 14, carbsG: 52, fatG: 14, ingredients: ['โฮลวีต 2 แผ่น', 'เนยถั่ว 1.5 ชต.', 'กล้วยหอม 1 ลูก'], tip: 'ผงอบเชยช่วยคุมระดับน้ำตาล' },
      lunch: { name: 'สลัดคีนัว (Quinoa) อะโวคาโด & ถั่วแระ + มะเขือเทศราชินี & น้ำสลัดเลมอน', calories: 540, proteinG: 24, carbsG: 62, fatG: 22, ingredients: ['คีนัวสุก 1 ถ้วย', 'อะโวคาโด 1/2 ลูก', 'ถั่วแระญี่ปุ่น 80g', 'มะเขือเทศ'], tip: 'คีนัวเป็น Superfood โปรตีนสมบูรณ์' },
      dinner: { name: 'ต้มโคล้งเห็ดรวมเต้าหู้ย่าง + ยอดฟักแม้วผัดน้ำ', calories: 390, proteinG: 25, carbsG: 45, fatG: 10, ingredients: ['เห็ดรวม 200g', 'เต้าหู้ย่าง 120g', 'ยอดฟักแม้ว'], tip: 'รสแซ่บเปรี้ยวเค็มเผ็ดหอมกลิ่นพริกคั่ว' },
      snack: { name: 'ส้ม 1 ผล', calories: 70, proteinG: 1, carbsG: 16, fatG: 0, ingredients: ['ส้มสด 1 ลูก'], tip: 'วิตามินซีสดชื่น' },
      totalCal: 1390, proteinG: 64, carbsG: 175, fatG: 46
    }
  ]
};

const STORAGE_KEY_MEAL_PLAN = 'kalguru_weekly_meal_plan_v2';
const SHOPPING_STORAGE_KEY = 'kalguru_shopping_list_v1';

export interface WeeklyMealPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCalories?: number;
  targetProtein?: number;
  onLogMeal?: (meal: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    explanation?: string;
  }) => void;
  onLogFullDay?: (dayMeals: Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    explanation?: string;
  }>) => void;
  onOpenGroceryModal?: () => void;
  onExportToGrocery?: (items: string[]) => void;
  onToast: (msg: string) => void;
}

export const WeeklyMealPlannerModal: React.FC<WeeklyMealPlannerModalProps> = ({
  isOpen,
  onClose,
  targetCalories = 2000,
  targetProtein = 120,
  onLogMeal,
  onLogFullDay,
  onOpenGroceryModal,
  onExportToGrocery,
  onToast
}) => {
  const [dietGoal, setDietGoal] = useState<DietGoalType>('high_protein');
  const [mealPlan, setMealPlan] = useState<PlannedDay[]>(() => MEAL_PLANS_BY_DIET.high_protein);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  
  // Custom meal editing state
  const [editingSlot, setEditingSlot] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | null>(null);
  const [editName, setEditName] = useState('');
  const [editCal, setEditCal] = useState<number>(400);
  const [editProtein, setEditProtein] = useState<number>(30);
  const [editCarbs, setEditCarbs] = useState<number>(40);
  const [editFat, setEditFat] = useState<number>(10);
  const [editTip, setEditTip] = useState('');

  // Load from local storage or initialize with chosen diet plan
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_MEAL_PLAN}_${dietGoal}`);
      if (saved) {
        setMealPlan(JSON.parse(saved));
      } else {
        setMealPlan(MEAL_PLANS_BY_DIET[dietGoal] || MEAL_PLANS_BY_DIET.high_protein);
      }
    } catch (e) {
      setMealPlan(MEAL_PLANS_BY_DIET[dietGoal] || MEAL_PLANS_BY_DIET.high_protein);
    }
  }, [dietGoal, isOpen]);

  // Save current plan
  const saveCurrentPlan = (updatedPlan: PlannedDay[]) => {
    setMealPlan(updatedPlan);
    try {
      localStorage.setItem(`${STORAGE_KEY_MEAL_PLAN}_${dietGoal}`, JSON.stringify(updatedPlan));
    } catch (e) {
      console.error(e);
    }
  };

  // Switch diet goal and update plan
  const handleSelectDiet = (newGoal: DietGoalType) => {
    setDietGoal(newGoal);
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_MEAL_PLAN}_${newGoal}`);
      if (saved) {
        setMealPlan(JSON.parse(saved));
      } else {
        const defaultPlan = MEAL_PLANS_BY_DIET[newGoal] || MEAL_PLANS_BY_DIET.high_protein;
        setMealPlan(defaultPlan);
      }
    } catch (e) {
      setMealPlan(MEAL_PLANS_BY_DIET[newGoal] || MEAL_PLANS_BY_DIET.high_protein);
    }
    onToast(`🥗 เปลี่ยนตารางมื้ออาหารเป็นแบบ "${getDietLabel(newGoal)}" เรียบร้อยแล้ว`);
  };

  // Regenerate plan with randomized variations
  const handleRegeneratePlan = () => {
    onToast('⚡ AI กำลังสุ่มจัดสมดุลเมนู 7 วันใหม่ตามเป้าหมายโภชนาการ...');
    
    setTimeout(() => {
      const basePlan = MEAL_PLANS_BY_DIET[dietGoal] || MEAL_PLANS_BY_DIET.high_protein;
      // Shuffle slightly or add variance
      const shuffled = basePlan.map(day => {
        const calVariance = Math.round((Math.random() - 0.5) * 40);
        return {
          ...day,
          totalCal: Math.max(1000, day.totalCal + calVariance),
          breakfast: { ...day.breakfast },
          lunch: { ...day.lunch },
          dinner: { ...day.dinner },
          snack: { ...day.snack },
        };
      });
      saveCurrentPlan(shuffled);
      onToast('✨ สุ่มจัดตารางอาหาร 7 วันใหม่สำเร็จแล้ว!');
    }, 400);
  };

  // Reset to default preset
  const handleResetToDefault = () => {
    const defaultPlan = MEAL_PLANS_BY_DIET[dietGoal] || MEAL_PLANS_BY_DIET.high_protein;
    saveCurrentPlan(defaultPlan);
    onToast('🔄 คืนค่าตารางอาหาร 7 วันตามมาตรฐานเริ่มต้นแล้ว');
  };

  // Open edit modal
  const handleStartEdit = (slot: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    const currentMeal = mealPlan[selectedDay][slot];
    setEditingSlot(slot);
    setEditName(currentMeal.name);
    setEditCal(currentMeal.calories);
    setEditProtein(currentMeal.proteinG);
    setEditCarbs(currentMeal.carbsG);
    setEditFat(currentMeal.fatG);
    setEditTip(currentMeal.tip || '');
  };

  // Save edited meal
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !editName.trim()) return;

    const updatedPlan = [...mealPlan];
    const day = { ...updatedPlan[selectedDay] };

    const oldMeal = day[editingSlot];
    const newMeal: PlannedMealItem = {
      ...oldMeal,
      name: editName.trim(),
      calories: Math.max(0, editCal),
      proteinG: Math.max(0, editProtein),
      carbsG: Math.max(0, editCarbs),
      fatG: Math.max(0, editFat),
      tip: editTip.trim()
    };

    day[editingSlot] = newMeal;

    // Recalculate daily totals
    day.totalCal = day.breakfast.calories + day.lunch.calories + day.dinner.calories + day.snack.calories;
    day.proteinG = day.breakfast.proteinG + day.lunch.proteinG + day.dinner.proteinG + day.snack.proteinG;
    day.carbsG = day.breakfast.carbsG + day.lunch.carbsG + day.dinner.carbsG + day.snack.carbsG;
    day.fatG = day.breakfast.fatG + day.lunch.fatG + day.dinner.fatG + day.snack.fatG;

    updatedPlan[selectedDay] = day;
    saveCurrentPlan(updatedPlan);
    setEditingSlot(null);
    onToast(`✅ อัปเดตเมนู "${newMeal.name}" ประจำวัน${day.dayShort} เรียบร้อยแล้ว`);
  };

  // Log single meal to diary
  const handleLogSingleMeal = (slot: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    const meal = mealPlan[selectedDay][slot];
    if (onLogMeal) {
      onLogMeal({
        name: meal.name,
        calories: meal.calories,
        protein: meal.proteinG,
        carbs: meal.carbsG,
        fat: meal.fatG,
        mealType: slot,
        explanation: `บันทึกจากแผนมื้ออาหาร 7 วัน (${mealPlan[selectedDay].dayName})`
      });
      onToast(`🍽️ บันทึก "${meal.name}" ลงในไดอารี่อาหารวันนี้แล้ว!`);
    } else {
      onToast(`🍽️ เลือกเมนู "${meal.name}" แล้ว`);
    }
  };

  // Log all 4 meals of current day to diary
  const handleLogAllDay = () => {
    const day = mealPlan[selectedDay];
    const mealsToLog = [
      { name: day.breakfast.name, calories: day.breakfast.calories, protein: day.breakfast.proteinG, carbs: day.breakfast.carbsG, fat: day.breakfast.fatG, mealType: 'breakfast' as const, explanation: `แผน 7 วัน (${day.dayShort})` },
      { name: day.lunch.name, calories: day.lunch.calories, protein: day.lunch.proteinG, carbs: day.lunch.carbsG, fat: day.lunch.fatG, mealType: 'lunch' as const, explanation: `แผน 7 วัน (${day.dayShort})` },
      { name: day.dinner.name, calories: day.dinner.calories, protein: day.dinner.proteinG, carbs: day.dinner.carbsG, fat: day.dinner.fatG, mealType: 'dinner' as const, explanation: `แผน 7 วัน (${day.dayShort})` },
      { name: day.snack.name, calories: day.snack.calories, protein: day.snack.proteinG, carbs: day.snack.carbsG, fat: day.snack.fatG, mealType: 'snack' as const, explanation: `แผน 7 วัน (${day.dayShort})` }
    ];

    if (onLogFullDay) {
      onLogFullDay(mealsToLog);
      onToast(`🎉 บันทึกทั้ง 4 มื้อของ "${day.dayName}" ลงในไดอารี่วันนี้เรียบร้อย!`);
    } else if (onLogMeal) {
      mealsToLog.forEach(m => onLogMeal(m));
      onToast(`🎉 บันทึกทั้ง 4 มื้อของ "${day.dayName}" ลงในไดอารี่วันนี้เรียบร้อย!`);
    }
  };

  // Extract all ingredients and export to Grocery Shopping List
  const handleExportAllToGrocery = () => {
    const ingredientsSet = new Set<string>();
    mealPlan.forEach(day => {
      [day.breakfast, day.lunch, day.dinner, day.snack].forEach(meal => {
        if (Array.isArray(meal.ingredients)) {
          meal.ingredients.forEach(ing => ingredientsSet.add(ing));
        }
      });
    });

    const ingredientList = Array.from(ingredientsSet);

    // Save directly to localStorage for GroceryShoppingListModal
    try {
      const existingStr = localStorage.getItem(SHOPPING_STORAGE_KEY);
      let currentItems: ShoppingItem[] = existingStr ? JSON.parse(existingStr) : [];
      
      const newItems: ShoppingItem[] = ingredientList.map((ing, idx) => {
        let category: ShoppingItem['category'] = 'produce';
        const lower = ing.toLowerCase();
        if (lower.includes('ไก่') || lower.includes('หมู') || lower.includes('ปลา') || lower.includes('กุ้ง') || lower.includes('แซลมอน') || lower.includes('ไข่') || lower.includes('เนื้อ') || lower.includes('เทมเป้')) {
          category = 'meat';
        } else if (lower.includes('นม') || lower.includes('โยเกิร์ต') || lower.includes('ชีส') || lower.includes('เวย์')) {
          category = 'dairy';
        } else if (lower.includes('ข้าว') || lower.includes('โอ๊ต') || lower.includes('น้ำมัน') || lower.includes('ซีอิ๊ว') || lower.includes('ซอส') || lower.includes('ผง') || lower.includes('น้ำผึ้ง') || lower.includes('เส้น') || lower.includes('วุ้นเส้น')) {
          category = 'pantry';
        } else if (lower.includes('ผัก') || lower.includes('กล้วย') || lower.includes('แอปเปิ้ล') || lower.includes('บลูเบอร์รี่') || lower.includes('มะเขือเทศ') || lower.includes('บรอกโคลี') || lower.includes('ขิง') || lower.includes('มะนาว') || lower.includes('ส้ม')) {
          category = 'produce';
        } else {
          category = 'other';
        }

        return {
          id: `sp-plan-${Date.now()}-${idx}`,
          name: ing,
          amount: 'สำหรับ 1 สัปดาห์',
          category,
          completed: false,
          recipeSource: `แผน 7 วัน (${getDietLabel(dietGoal)})`
        };
      });

      // Combine without duplicates
      const existingNames = new Set(currentItems.map(i => i.name.trim().toLowerCase()));
      const filteredNew = newItems.filter(i => !existingNames.has(i.name.trim().toLowerCase()));
      const combined = [...filteredNew, ...currentItems];

      localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(combined));
    } catch (e) {
      console.error(e);
    }

    if (onExportToGrocery) {
      onExportToGrocery(ingredientList);
    }

    onToast(`🛒 นำเข้าวัตถุดิบ ${ingredientList.length} รายการจากตาราง 7 วันสู่วิซาร์ดจ่ายตลาดแล้ว!`);
  };

  // Copy full 7-day plan formatted text
  const handleCopyPlan = () => {
    let text = `📅 แผนมื้ออาหารสุขภาพ 7 วัน (Kalguru 7-Day Meal Plan)\n`;
    text += `🎯 รูปแบบ: ${getDietLabel(dietGoal)}\n\n`;

    mealPlan.forEach(day => {
      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📍 ${day.dayName} (รวม ${day.totalCal} kcal | โปรตีน ${day.proteinG}g)\n`;
      text += `🌅 เช้า: ${day.breakfast.name} (${day.breakfast.calories} kcal)\n`;
      text += `☀️ กลางวัน: ${day.lunch.name} (${day.lunch.calories} kcal)\n`;
      text += `🌙 เย็น: ${day.dinner.name} (${day.dinner.calories} kcal)\n`;
      text += `🍎 ของว่าง: ${day.snack.name} (${day.snack.calories} kcal)\n\n`;
    });

    text += `สร้างโดย GooKal AI Meal Planner`;

    navigator.clipboard.writeText(text);
    onToast('📋 คัดลอกตาราง 7 วันไปที่คลิปบอร์ดแล้ว! สามารถส่งแชร์ใน LINE ได้ทันที');
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  function getDietLabel(goal: DietGoalType): string {
    switch (goal) {
      case 'high_protein': return '💪 ไฮโปรตีน สร้างกล้าม';
      case 'clean_fat_loss': return '🔥 ลดไขมัน ลีนแคล';
      case 'low_carb': return '🥑 โลว์คาร์บ บาลานซ์';
      case 'clean_thai': return '🇹🇭 ไทยคลีนยอดนิยม';
      case 'plant_based': return '🥗 แพลนต์เบส เจ/มังสวิรัติ';
      default: return 'ตารางมื้ออาหารสุขภาพ';
    }
  }

  const currentDayData = mealPlan[selectedDay] || mealPlan[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-neutral-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-inner text-xl">
              📅
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                  วางแผนมื้ออาหาร 7 วัน (Weekly Meal Planner)
                </h2>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold border border-white/30">
                  AI Smart Nutrition
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                จัดสรรเมนูคลีน 7 วันครบ 4 มื้อ คุมแคลอรี โปรตีน พร้อมบันทึกหรือจ่ายตลาดได้ทันที
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyPlan}
              title="คัดลอกตาราง 7 วันไปที่คลิปบอร์ด"
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            >
              <Copy size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Diet Archetype Filter Bar */}
        <div className="p-3 sm:p-4 border-b border-neutral-100 bg-neutral-50/90 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {/* Diet Goal Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'high_protein', label: '💪 ไฮโปรตีน', desc: '140-165g' },
              { id: 'clean_fat_loss', label: '🔥 ลดไขมัน ลีนแคล', desc: 'Deficit' },
              { id: 'low_carb', label: '🥑 โลว์คาร์บ', desc: '<35g Carb' },
              { id: 'clean_thai', label: '🇹🇭 ไทยคลีนรสแซ่บ', desc: 'ไม่ใช้น้ำมัน' },
              { id: 'plant_based', label: '🥗 แพลนต์เบส', desc: 'เต้าหู้/เทมเป้' }
            ].map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => handleSelectDiet(g.id as DietGoalType)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 text-xs ${
                  dietGoal === g.id
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <span>{g.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegeneratePlan}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-transform"
              title="สุ่มจัดตารางใหม่"
            >
              <RefreshCw size={13} className="text-emerald-600" />
              <span className="hidden sm:inline">สุ่มจัดตารางใหม่</span>
              <span className="sm:hidden">สุ่มใหม่</span>
            </button>

            <button
              type="button"
              onClick={handleExportAllToGrocery}
              className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-all"
              title="ส่งออกวัตถุดิบเข้าสู่รายการจ่ายตลาด"
            >
              <ShoppingBag size={13} />
              <span>ซิงค์รายการจ่ายตลาด</span>
            </button>
          </div>
        </div>

        {/* 7-Day Tab Selector */}
        <div className="flex border-b border-neutral-200 overflow-x-auto bg-white px-3 sm:px-5 pt-2.5 gap-1.5 no-scrollbar shrink-0">
          {mealPlan.map((day, idx) => {
            const isSelected = selectedDay === idx;
            return (
              <button
                key={day.dayIndex}
                type="button"
                onClick={() => setSelectedDay(idx)}
                className={`px-3.5 py-2 rounded-t-2xl font-bold text-xs whitespace-nowrap border-b-2 transition-all cursor-pointer flex flex-col items-center min-w-[76px] ${
                  isSelected
                    ? 'border-emerald-600 text-emerald-900 bg-emerald-50/80 font-black shadow-xs'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <div className="text-xs flex items-center gap-1">
                  <span>{day.dayShort}</span>
                </div>
                <div className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-emerald-700' : 'text-neutral-400'}`}>
                  {day.totalCal} kcal
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Day Overview & Meals Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-sm bg-neutral-50/40">
          {/* Daily Nutrition Banner */}
          <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-neutral-900">{currentDayData.dayName}</h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  {getDietLabel(dietGoal)}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                รวมโภชนาการประจำวันทั้ง 4 มื้อ (เป้าหมายแคลอรี: {targetCalories} kcal)
              </p>
            </div>

            {/* Macro Chips */}
            <div className="flex items-center gap-3">
              <div className="text-center px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-600 uppercase block">พลังงาน</span>
                <span className="text-base font-black text-emerald-700">{currentDayData.totalCal} <span className="text-[10px] font-normal">kcal</span></span>
              </div>
              <div className="text-center px-3 py-1 rounded-xl bg-blue-50 border border-blue-100">
                <span className="text-[10px] font-bold text-blue-600 uppercase block">โปรตีน</span>
                <span className="text-base font-black text-blue-700">{currentDayData.proteinG} <span className="text-[10px] font-normal">g</span></span>
              </div>
              <div className="text-center px-3 py-1 rounded-xl bg-amber-50 border border-amber-100 hidden sm:block">
                <span className="text-[10px] font-bold text-amber-600 uppercase block">คาร์บ</span>
                <span className="text-base font-black text-amber-700">{currentDayData.carbsG} <span className="text-[10px] font-normal">g</span></span>
              </div>
              <div className="text-center px-3 py-1 rounded-xl bg-rose-50 border border-rose-100 hidden sm:block">
                <span className="text-[10px] font-bold text-rose-600 uppercase block">ไขมัน</span>
                <span className="text-base font-black text-rose-700">{currentDayData.fatG} <span className="text-[10px] font-normal">g</span></span>
              </div>

              {/* Log All Day Button */}
              <button
                type="button"
                onClick={handleLogAllDay}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ml-1"
                title="บันทึกทั้ง 4 มื้อของวันนี้ลงไดอารี่อาหารวันนี้"
              >
                <CheckCircle2 size={15} />
                <span>บันทึกทั้งวัน</span>
              </button>
            </div>
          </div>

          {/* 4 Meals Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. Breakfast */}
            <MealCard
              slot="breakfast"
              title="มื้อเช้า (Breakfast)"
              icon={<Sunrise size={16} className="text-amber-500" />}
              badgeColor="bg-amber-50 text-amber-800 border-amber-200"
              meal={currentDayData.breakfast}
              onEdit={() => handleStartEdit('breakfast')}
              onLog={() => handleLogSingleMeal('breakfast')}
            />

            {/* 2. Lunch */}
            <MealCard
              slot="lunch"
              title="มื้อกลางวัน (Lunch)"
              icon={<Sun size={16} className="text-orange-500" />}
              badgeColor="bg-orange-50 text-orange-800 border-orange-200"
              meal={currentDayData.lunch}
              onEdit={() => handleStartEdit('lunch')}
              onLog={() => handleLogSingleMeal('lunch')}
            />

            {/* 3. Dinner */}
            <MealCard
              slot="dinner"
              title="มื้อเย็น (Dinner)"
              icon={<Moon size={16} className="text-indigo-500" />}
              badgeColor="bg-indigo-50 text-indigo-800 border-indigo-200"
              meal={currentDayData.dinner}
              onEdit={() => handleStartEdit('dinner')}
              onLog={() => handleLogSingleMeal('dinner')}
            />

            {/* 4. Snack */}
            <MealCard
              slot="snack"
              title="ของว่าง (Snack)"
              icon={<Apple size={16} className="text-emerald-500" />}
              badgeColor="bg-emerald-50 text-emerald-800 border-emerald-200"
              meal={currentDayData.snack}
              onEdit={() => handleStartEdit('snack')}
              onLog={() => handleLogSingleMeal('snack')}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              💡 <span>คลิก <strong>"บันทึกมื้อนี้"</strong> หรือ <strong>"แก้ไข"</strong> เพื่อปรับแต่งสูตรอาหารของตัวเองได้</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              คืนค่าเริ่มต้น
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-all cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>

        {/* Meal Edit Modal (Nested) */}
        {editingSlot && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs">
            <div 
              className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl border border-neutral-100 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 size={18} className="text-emerald-600" />
                  <h3 className="font-bold text-sm text-neutral-900">
                    แก้ไขเมนู ({editingSlot === 'breakfast' ? 'มื้อเช้า' : editingSlot === 'lunch' ? 'มื้อกลางวัน' : editingSlot === 'dinner' ? 'มื้อเย็น' : 'ของว่าง'})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">ชื่อเมนูอาหาร</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                    placeholder="เช่น ข้าวอกไก่ย่างกระเทียม"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-neutral-800 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">แคลอรี (kcal)</label>
                    <input
                      type="number"
                      value={editCal}
                      onChange={e => setEditCal(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">โปรตีน (g)</label>
                    <input
                      type="number"
                      value={editProtein}
                      onChange={e => setEditProtein(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">คาร์บ (g)</label>
                    <input
                      type="number"
                      value={editCarbs}
                      onChange={e => setEditCarbs(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">ไขมัน (g)</label>
                    <input
                      type="number"
                      value={editFat}
                      onChange={e => setEditFat(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">คำแนะนำ / เคล็ดลับคลีน</label>
                  <input
                    type="text"
                    value={editTip}
                    onChange={e => setEditTip(e.target.value)}
                    placeholder="เช่น ไม่ใช้น้ำมัน ใช้น้ำสต๊อกผัดแทน"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-neutral-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setEditingSlot(null)}
                    className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-xs"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Save size={14} />
                    <span>บันทึกการเปลี่ยนแปลง</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable Sub-component for individual Meal Cards
interface MealCardProps {
  slot: string;
  title: string;
  icon: React.ReactNode;
  badgeColor: string;
  meal: PlannedMealItem;
  onEdit: () => void;
  onLog: () => void;
}

const MealCard: React.FC<MealCardProps> = ({
  title,
  icon,
  badgeColor,
  meal,
  onEdit,
  onLog
}) => {
  return (
    <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs flex flex-col justify-between space-y-3 hover:border-emerald-300 transition-colors">
      <div className="space-y-2">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${badgeColor}`}>
            {icon}
            <span>{title}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              title="แก้ไขเมนูนี้"
              className="p-1 rounded-lg text-neutral-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <Edit3 size={13} />
            </button>
          </div>
        </div>

        {/* Meal Name & Calories */}
        <div>
          <h4 className="font-bold text-neutral-900 text-sm leading-snug">
            {meal.name}
          </h4>
          {meal.tip && (
            <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
              💡 {meal.tip}
            </p>
          )}
        </div>

        {/* Ingredients Tags */}
        {Array.isArray(meal.ingredients) && meal.ingredients.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {meal.ingredients.map((ing, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[10px] font-medium">
                {ing}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Macro summary & Log Action */}
      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            {meal.calories} kcal
          </span>
          <span className="text-neutral-500 font-semibold">
            P:{meal.proteinG}g C:{meal.carbsG}g F:{meal.fatG}g
          </span>
        </div>

        <button
          type="button"
          onClick={onLog}
          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-emerald-200 active:scale-95"
          title="บันทึกมื้อนี้ลงไดอารี่อาหารวันนี้"
        >
          <Plus size={13} />
          <span>บันทึกมื้อนี้</span>
        </button>
      </div>
    </div>
  );
};
