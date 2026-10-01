import { OfflineFoodDatabaseItem, SmartSwapItem } from '../types/extendedFeatures';

export const OFFLINE_THAI_FOOD_DATABASE: OfflineFoodDatabaseItem[] = [
  // ข้าว & อาหารจานเดียว
  { id: 'th-1', name: 'ข้าวกะเพราอกไก่ ไม่ใส่น้ำตาล ไข่ดาวน้ำ', category: 'clean_gym', calories: 380, protein: 36, carbs: 42, fat: 8, sugar: 1, sodium: 520, portion: '1 จาน (320g)', giLevel: 'medium', tags: ['โปรตีนสูง', 'ไขมันต่ำ', 'คลีน'] },
  { id: 'th-2', name: 'ข้าวกะเพราหมูสับ ไข่ดาว', category: 'rice_dishes', calories: 630, protein: 24, carbs: 58, fat: 34, sugar: 4, sodium: 980, portion: '1 จาน (350g)', giLevel: 'high', tags: ['อาหารจานเดียว', 'ยอดนิยม'] },
  { id: 'th-3', name: 'ข้าวกะเพราไก่สับ ไข่ดาว', category: 'rice_dishes', calories: 560, protein: 26, carbs: 58, fat: 24, sugar: 3, sodium: 920, portion: '1 จาน (340g)', giLevel: 'high', tags: ['อาหารจานเดียว'] },
  { id: 'th-4', name: 'ข้าวมันไก่ต้ม (เนื้ออก ไม่เอาหนัง)', category: 'clean_gym', calories: 420, protein: 32, carbs: 54, fat: 8, sugar: 2, sodium: 750, portion: '1 จาน (320g)', giLevel: 'medium', tags: ['โปรตีนสูง', 'ลีน'] },
  { id: 'th-5', name: 'ข้าวมันไก่ต้ม รวมหนัง', category: 'rice_dishes', calories: 590, protein: 24, carbs: 62, fat: 28, sugar: 3, sodium: 880, portion: '1 จาน (350g)', giLevel: 'high', tags: ['อาหารจานเดียว'] },
  { id: 'th-6', name: 'ข้าวมันไก่ทอด', category: 'rice_dishes', calories: 690, protein: 22, carbs: 68, fat: 36, sugar: 4, sodium: 950, portion: '1 จาน (350g)', giLevel: 'high', tags: ['ทอด', 'แคลอรีสูง'] },
  { id: 'th-7', name: 'ข้าวหมูแดงหมูกรอบ', category: 'rice_dishes', calories: 650, protein: 22, carbs: 72, fat: 30, sugar: 14, sodium: 1100, portion: '1 จาน (350g)', giLevel: 'high', tags: ['หวาน', 'โซเดียมสูง'] },
  { id: 'th-8', name: 'ข้าวผัดกุ้ง', category: 'rice_dishes', calories: 530, protein: 22, carbs: 65, fat: 20, sugar: 3, sodium: 820, portion: '1 จาน (330g)', giLevel: 'high', tags: ['อาหารจานเดียว'] },
  { id: 'th-9', name: 'ข้าวผัดหมู / ไก่', category: 'rice_dishes', calories: 580, protein: 20, carbs: 66, fat: 26, sugar: 3, sodium: 890, portion: '1 จาน (340g)', giLevel: 'high', tags: ['อาหารจานเดียว'] },
  { id: 'th-10', name: 'ข้าวไข่เจียวหมูสับ', category: 'rice_dishes', calories: 650, protein: 18, carbs: 55, fat: 40, sugar: 1, sodium: 680, portion: '1 จาน (300g)', giLevel: 'high', tags: ['ไขมันสูง'] },
  { id: 'th-11', name: 'ข้าวไข่ข้นกุ้ง คลีน', category: 'clean_gym', calories: 390, protein: 28, carbs: 45, fat: 10, sugar: 1, sodium: 480, portion: '1 จาน (300g)', giLevel: 'medium', tags: ['โปรตีนสูง', 'คลีน'] },
  { id: 'th-12', name: 'ข้าวขาหมู ไม่เอาหนัง', category: 'rice_dishes', calories: 480, protein: 28, carbs: 60, fat: 14, sugar: 8, sodium: 950, portion: '1 จาน (350g)', giLevel: 'medium', tags: ['อาหารจานเดียว'] },
  { id: 'th-13', name: 'ข้าวขาหมู เนื้อหนัง คากิ', category: 'rice_dishes', calories: 720, protein: 24, carbs: 62, fat: 42, sugar: 10, sodium: 1200, portion: '1 จาน (380g)', giLevel: 'high', tags: ['ไขมันสูง'] },
  { id: 'th-14', name: 'ข้าวผัดน้ำพริกปลาทู ผักสด', category: 'clean_gym', calories: 360, protein: 26, carbs: 46, fat: 8, sugar: 2, sodium: 620, portion: '1 จาน (320g)', giLevel: 'low', tags: ['ไฟเบอร์สูง', 'ปลาทะเล'] },
  { id: 'th-15', name: 'ข้าวกล้อง + อกไก่ย่างสมุนไพร + สลัดผัก', category: 'clean_gym', calories: 340, protein: 38, carbs: 36, fat: 5, sugar: 2, sodium: 390, portion: '1 เซ็ต (350g)', giLevel: 'low', tags: ['คลีนจัด', 'โปรตีนแน่น'] },
  { id: 'th-16', name: 'ข้าวไรซ์เบอร์รี่ + ปลากะพงนึ่งซีอิ๊ว', category: 'clean_gym', calories: 320, protein: 34, carbs: 38, fat: 4, sugar: 2, sodium: 510, portion: '1 เซ็ต (340g)', giLevel: 'low', tags: ['Low GI', 'โอเมก้า 3'] },
  { id: 'th-17', name: 'ข้าวผัดต้มยำกุ้งแห้ง / กุ้งสด', category: 'rice_dishes', calories: 510, protein: 20, carbs: 68, fat: 18, sugar: 4, sodium: 940, portion: '1 จาน (330g)', giLevel: 'high', tags: ['รสจัด'] },
  { id: 'th-18', name: 'ข้าวคลุกกะปิ', category: 'rice_dishes', calories: 550, protein: 22, carbs: 64, fat: 22, sugar: 12, sodium: 1150, portion: '1 จาน (350g)', giLevel: 'medium', tags: ['โซเดียมสูง'] },
  { id: 'th-19', name: 'ข้าวต้มกุ้ง / ปลากะพง', category: 'clean_gym', calories: 240, protein: 18, carbs: 36, fat: 3, sugar: 1, sodium: 580, portion: '1 ถ้วย (350g)', giLevel: 'medium', tags: ['ย่อยง่าย', 'แคลต่ำ'] },
  { id: 'th-20', name: 'โจ๊กหมูสับ ใส่ไข่ 1 ฟอง', category: 'rice_dishes', calories: 320, protein: 16, carbs: 42, fat: 9, sugar: 2, sodium: 780, portion: '1 ถ้วย (350g)', giLevel: 'high', tags: ['อาหารเช้า'] },

  // เส้น & ก๋วยเตี๋ยว
  { id: 'nd-1', name: 'ก๋วยเตี๋ยวเส้นหมี่น้ำใส อกไก่ฉีก ไม่เจียวกระเทียม', category: 'clean_gym', calories: 250, protein: 24, carbs: 32, fat: 3, sugar: 2, sodium: 620, portion: '1 ชาม (400g)', giLevel: 'low', tags: ['แคลอรี่ต่ำ', 'คลีน'] },
  { id: 'nd-2', name: 'ก๋วยเตี๋ยวต้มยำหมูสับ (เส้นเล็ก)', category: 'noodles', calories: 480, protein: 18, carbs: 54, fat: 22, sugar: 10, sodium: 1450, portion: '1 ชาม (450g)', giLevel: 'high', tags: ['โซเดียมสูง', 'น้ำตาลสูง'] },
  { id: 'nd-3', name: 'ก๋วยเตี๋ยวเรือน้ำตกหมู/เนื้อ', category: 'noodles', calories: 420, protein: 20, carbs: 48, fat: 16, sugar: 6, sodium: 1600, portion: '1 ชาม (400g)', giLevel: 'medium', tags: ['โซเดียมสูงมาก'] },
  { id: 'nd-4', name: 'ผัดไทยกุ้งสด', category: 'noodles', calories: 620, protein: 22, carbs: 70, fat: 28, sugar: 16, sodium: 1100, portion: '1 จาน (320g)', giLevel: 'high', tags: ['น้ำตาลสูง', 'แคลอรีสูง'] },
  { id: 'nd-5', name: 'ผัดซีอิ๊วหมู เส้นใหญ่', category: 'noodles', calories: 590, protein: 20, carbs: 62, fat: 30, sugar: 8, sodium: 980, portion: '1 จาน (340g)', giLevel: 'high', tags: ['มันเยิ้ม'] },
  { id: 'nd-6', name: 'ราดหน้าหมูนุ่ม เส้นหมี่ขาว', category: 'noodles', calories: 420, protein: 22, carbs: 52, fat: 14, sugar: 6, sodium: 1050, portion: '1 ชาม (400g)', giLevel: 'medium', tags: ['โซเดียมปานกลาง'] },
  { id: 'nd-7', name: 'บะหมี่เกี๊ยวหมูแดงแห้ง', category: 'noodles', calories: 460, protein: 20, carbs: 58, fat: 16, sugar: 6, sodium: 880, portion: '1 ชาม (300g)', giLevel: 'high', tags: ['อาหารจานเดียว'] },
  { id: 'nd-8', name: 'สุกี้น้ำรวมมิตรไก่-กุ้ง ผักเยอะ (น้ำจิ้ม 1 ช้อนโต๊ะ)', category: 'clean_gym', calories: 280, protein: 28, carbs: 24, fat: 6, sugar: 4, sodium: 690, portion: '1 ชาม (450g)', giLevel: 'low', tags: ['ไฟเบอร์สูง', 'ลดน้ำหนัก'] },
  { id: 'nd-9', name: 'สุกี้แห้งหมู ผัดน้ำมัน', category: 'noodles', calories: 490, protein: 22, carbs: 42, fat: 26, sugar: 8, sodium: 1120, portion: '1 จาน (350g)', giLevel: 'medium', tags: ['แคลอรีปานกลาง'] },
  { id: 'nd-10', name: 'วุ้นเส้นผัดขี้เมาไก่', category: 'noodles', calories: 430, protein: 24, carbs: 48, fat: 16, sugar: 4, sodium: 920, portion: '1 จาน (320g)', giLevel: 'medium', tags: ['รสจัด'] },

  // แกง & ต้ม & สลัดไทย
  { id: 'cr-1', name: 'ต้มยำกุ้งน้ำใส', category: 'clean_gym', calories: 120, protein: 18, carbs: 6, fat: 2, sugar: 2, sodium: 780, portion: '1 ถ้วย (300g)', giLevel: 'low', tags: ['แคลอรี่ต่ำมาก', 'สมุนไพร'] },
  { id: 'cr-2', name: 'ต้มยำกุ้งน้ำข้น ใส่นม/กะทิ', category: 'curries', calories: 290, protein: 18, carbs: 12, fat: 18, sugar: 6, sodium: 1080, portion: '1 ถ้วย (320g)', giLevel: 'medium', tags: ['ไขมันปานกลาง'] },
  { id: 'cr-3', name: 'แกงส้มผักรวมกุ้งสด', category: 'clean_gym', calories: 140, protein: 16, carbs: 14, fat: 2, sugar: 5, sodium: 850, portion: '1 ถ้วย (300g)', giLevel: 'low', tags: ['ไร้น้ำมัน', 'ไฟเบอร์สูง'] },
  { id: 'cr-4', name: 'แกงจืดเต้าหู้หมูสับ ผักกาดขาว', category: 'clean_gym', calories: 180, protein: 16, carbs: 8, fat: 9, sugar: 2, sodium: 620, portion: '1 ถ้วย (350g)', giLevel: 'low', tags: ['ย่อยง่าย', 'โซเดียมต่ำ'] },
  { id: 'cr-5', name: 'แกงเขียวหวานไก่ กะทิข้น', category: 'curries', calories: 380, protein: 18, carbs: 12, fat: 28, sugar: 6, sodium: 920, portion: '1 ถ้วย (280g)', giLevel: 'medium', tags: ['กะทิ', 'ไขมันอิ่มตัว'] },
  { id: 'cr-6', name: 'แกงพะแนงหมู', category: 'curries', calories: 420, protein: 20, carbs: 10, fat: 32, sugar: 8, sodium: 980, portion: '1 ถ้วย (250g)', giLevel: 'medium', tags: ['กะทิเข้มข้น'] },
  { id: 'cr-7', name: 'ส้มตำไทย ไม่ใส่น้ำตาลปี๊บเยอะ', category: 'clean_gym', calories: 120, protein: 4, carbs: 22, fat: 2, sugar: 8, sodium: 750, portion: '1 จาน (220g)', giLevel: 'low', tags: ['แคลอรี่ต่ำ', 'วิตามินซี'] },
  { id: 'cr-8', name: 'ลาบอกไก่สบ สมุนไพร', category: 'clean_gym', calories: 180, protein: 32, carbs: 6, fat: 3, sugar: 1, sodium: 580, portion: '1 จาน (200g)', giLevel: 'low', tags: ['โปรตีนสูงมาก', 'ลีนสุดๆ'] },
  { id: 'cr-9', name: 'ยำวุ้นเส้นรวมมิตร', category: 'curries', calories: 260, protein: 16, carbs: 36, fat: 6, sugar: 7, sodium: 990, portion: '1 จาน (280g)', giLevel: 'medium', tags: ['รสจัด'] },
  { id: 'cr-10', name: 'ไก่ย่างไม่เอาหนัง (1 น่องสะโพก)', category: 'clean_gym', calories: 190, protein: 28, carbs: 2, fat: 8, sugar: 1, sodium: 420, portion: '1 ชิ้น (180g)', giLevel: 'low', tags: ['โปรตีนสูง', 'คีโต'] },

  // เครื่องดื่ม & ชา กาแฟ
  { id: 'dr-1', name: 'อเมริกาโน่เย็น ไม่ใส่น้ำตาล (Iced Americano)', category: 'drinks', calories: 5, protein: 0, carbs: 1, fat: 0, sugar: 0, sodium: 5, portion: '1 แก้ว (16 oz)', giLevel: 'low', tags: ['0 Cal', 'ตื่นตัว', 'คีโต'] },
  { id: 'dr-2', name: 'ชาเขียวมะลิ/อู่หลงร้อน/เย็น ไม่ใส่น้ำตาล', category: 'drinks', calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, sodium: 0, portion: '1 แก้ว (16 oz)', giLevel: 'low', tags: ['ต้านอนุมูลอิสระ', '0 Cal'] },
  { id: 'dr-3', name: 'ชาไทยเย็น ใส่นมข้นหวาน (Thai Milk Tea)', category: 'drinks', calories: 320, protein: 4, carbs: 48, fat: 12, sugar: 38, sodium: 90, portion: '1 แก้ว (16 oz / 22 oz)', giLevel: 'high', tags: ['น้ำตาลสูงมาก', 'ระวังเบาหวาน'] },
  { id: 'dr-4', name: 'ชามะนาวหวานปกติ', category: 'drinks', calories: 180, protein: 0, carbs: 45, fat: 0, sugar: 42, sodium: 40, portion: '1 แก้ว (16 oz)', giLevel: 'high', tags: ['น้ำตาลสูง'] },
  { id: 'dr-5', name: 'กาแฟลาเต้เย็น หวานน้อย (นมสด)', category: 'drinks', calories: 140, protein: 6, carbs: 14, fat: 6, sugar: 10, sodium: 80, portion: '1 แก้ว (16 oz)', giLevel: 'medium', tags: ['แคลอรีปานกลาง'] },
  { id: 'dr-6', name: 'กาแฟสดใส่นมข้าวโอ๊ต ไม่เติมน้ำตาล', category: 'drinks', calories: 95, protein: 3, carbs: 14, fat: 3, sugar: 3, sodium: 60, portion: '1 แก้ว (16 oz)', giLevel: 'low', tags: ['Plant-Based', 'ไฟเบอร์'] },
  { id: 'dr-7', name: 'น้ำเต้าหู้หวานน้อย ใส่เครื่อง (ลูกเดือย แมงลัก)', category: 'drinks', calories: 130, protein: 8, carbs: 16, fat: 4, sugar: 6, sodium: 30, portion: '1 ถุง (300ml)', giLevel: 'low', tags: ['โปรตีนพืช', 'อิ่มท้อง'] },
  { id: 'dr-8', name: 'เวย์โปรตีน Isolate ผสมน้ำเปล่า', category: 'clean_gym', calories: 120, protein: 26, carbs: 2, fat: 1, sugar: 0, sodium: 140, portion: '1 สกู๊ป (30g)', giLevel: 'low', tags: ['โปรตีนบริสุทธิ์', 'สร้างกล้าม'] },
  { id: 'dr-9', name: 'น้ำมะพร้าวสด 100%', category: 'drinks', calories: 60, protein: 1, carbs: 14, fat: 0, sugar: 11, sodium: 45, portion: '1 ลูก (250ml)', giLevel: 'medium', tags: ['เกลือแร่ธรรมชาติ'] },
  { id: 'dr-10', name: 'ชานมไข่มุก หวาน 100%', category: 'drinks', calories: 420, protein: 3, carbs: 78, fat: 10, sugar: 52, sodium: 120, portion: '1 แก้วใหญ่', giLevel: 'high', tags: ['น้ำตาลสูงมาก', 'แป้งสูง'] },

  // ของว่าง สแน็ค & ไข่
  { id: 'sn-1', name: 'ไข่ต้ม CP / ตลาด (1 ฟอง)', category: 'clean_gym', calories: 75, protein: 6.5, carbs: 0.5, fat: 5, sugar: 0, sodium: 65, portion: '1 ฟอง (50g)', giLevel: 'low', tags: ['ของว่างสะดวก', 'โปรตีนดี'] },
  { id: 'sn-2', name: 'ไข่ต้ม 2 ฟอง + กล้วยหอม 1 ลูก', category: 'clean_gym', calories: 240, protein: 14, carbs: 28, fat: 10, sugar: 14, sodium: 130, portion: '1 เซ็ตมินิ', giLevel: 'medium', tags: ['พลังงานก่อนซ้อม'] },
  { id: 'sn-3', name: 'อกไก่นุ่ม เซเว่น 7-11', category: 'clean_gym', calories: 110, protein: 24, carbs: 1, fat: 1.5, sugar: 0, sodium: 480, portion: '1 ซอง (100g)', giLevel: 'low', tags: ['สะดวก', 'โปรตีนสูง'] },
  { id: 'sn-4', name: 'อัลมอนด์อบธรรมชาติ ไม่เค็ม', category: 'snacks', calories: 160, protein: 6, carbs: 6, fat: 14, sugar: 1, sodium: 2, portion: '1 กำมือ (28g / ~23 เม็ด)', giLevel: 'low', tags: ['ไขมันดี', 'วิตามิน E'] },
  { id: 'sn-5', name: 'โยเกิร์ตกรีกแท้ 0% ไขมัน', category: 'clean_gym', calories: 90, protein: 15, carbs: 6, fat: 0, sugar: 4, sodium: 60, portion: '1 ถ้วย (130g)', giLevel: 'low', tags: ['โปรตีนสูง', 'โพรไบโอติก'] },
  { id: 'sn-6', name: 'แอปเปิลเขียว 1 ผลกลาง', category: 'snacks', calories: 80, protein: 0.5, carbs: 20, fat: 0.3, sugar: 14, sodium: 2, portion: '1 ลูก (180g)', giLevel: 'low', tags: ['ไฟเบอร์สูง', 'อิ่มนาน'] },
  { id: 'sn-7', name: 'กล้วยน้ำว้า 1 ลูก', category: 'snacks', calories: 60, protein: 0.8, carbs: 15, fat: 0.2, sugar: 10, sodium: 1, portion: '1 ลูก (50g)', giLevel: 'low', tags: ['ย่อยง่าย', 'บำรุงกระเพาะ'] },
  { id: 'sn-8', name: 'มันหวานญี่ปุ่นนึ่ง 1 หัว', category: 'clean_gym', calories: 140, protein: 2.5, carbs: 32, fat: 0.2, sugar: 8, sodium: 35, portion: '1 หัวกลาง (130g)', giLevel: 'low', tags: ['คาร์บเชิงซ้อน', 'ไฟเบอร์'] },
  { id: 'sn-9', name: 'กล้วยแขกทอด (4 ชิ้น)', category: 'snacks', calories: 340, protein: 2, carbs: 46, fat: 16, sugar: 22, sodium: 120, portion: '4 ชิ้น', giLevel: 'high', tags: ['ทอดอมน้ำมัน', 'หวาน'] },
  { id: 'sn-10', name: 'ปาท่องโก๋ 2 ตัว + สังขยา', category: 'snacks', calories: 380, protein: 5, carbs: 50, fat: 18, sugar: 24, sodium: 280, portion: '1 เซ็ต', giLevel: 'high', tags: ['แคลอรีสูง'] },

  // เซเว่น & สุขภาพพกพาสะดวก (7-Eleven Clean Items)
  { id: 'sev-1', name: 'อกไก่นุ่มพริกไทยดำ 7-11', category: 'clean_gym', calories: 110, protein: 23, carbs: 2, fat: 1.5, sugar: 1, sodium: 490, portion: '1 ซอง (100g)', giLevel: 'low', tags: ['7-11', 'โปรตีนสูง', 'ไขมันต่ำ'] },
  { id: 'sev-2', name: 'ไข่ต้มสมุนไพร CP (แพ็ก 2 ฟอง)', category: 'clean_gym', calories: 150, protein: 13, carbs: 1, fat: 10, sugar: 0, sodium: 130, portion: '2 ฟอง (100g)', giLevel: 'low', tags: ['7-11', 'โปรตีนดี', 'คีโต'] },
  { id: 'sev-3', name: 'ไข่ลวก CP (แพ็ก 2 ฟอง)', category: 'clean_gym', calories: 145, protein: 12, carbs: 1, fat: 9.5, sugar: 0, sodium: 120, portion: '2 ฟอง', giLevel: 'low', tags: ['7-11', 'อาหารเช้า'] },
  { id: 'sev-4', name: 'นมโปรตีนสูง Meiji High Protein 0% Sugar', category: 'clean_gym', calories: 170, protein: 30, carbs: 8, fat: 0, sugar: 2, sodium: 150, portion: '1 ขวด (350ml)', giLevel: 'low', tags: ['7-11', 'โปรตีน 30g', 'ไม่มีน้ำตาลทราย'] },
  { id: 'sev-5', name: 'นมถั่วเหลือง Tofusan ไม่ใส่น้ำตาล', category: 'drinks', calories: 80, protein: 7, carbs: 4, fat: 3.5, sugar: 0, sodium: 20, portion: '1 ขวด (320ml)', giLevel: 'low', tags: ['7-11', 'Plant-Based', '0% น้ำตาล'] },
  { id: 'sev-6', name: 'สลัดโรลปูอัด + น้ำสลัดครีมซีฟู้ดครึ่งซอง', category: 'clean_gym', calories: 160, protein: 5, carbs: 26, fat: 4, sugar: 4, sodium: 420, portion: '1 กล่อง', giLevel: 'medium', tags: ['7-11', 'ผักสด'] },
  { id: 'sev-7', name: 'ทูน่าก้อนในน้ำแร่ ซีเล็ค (Sealect Tuna)', category: 'clean_gym', calories: 130, protein: 30, carbs: 0, fat: 1, sugar: 0, sodium: 320, portion: '1 กระป๋อง (185g)', giLevel: 'low', tags: ['โปรตีนบริสุทธิ์', 'ลีนสุดๆ'] },
  { id: 'sev-8', name: 'ข้าวไรซ์เบอร์รี่ผสมข้าวกล้องพร้อมทาน 7-11', category: 'clean_gym', calories: 230, protein: 5, carbs: 48, fat: 1.5, sugar: 0, sodium: 10, portion: '1 ถ้วย (150g)', giLevel: 'low', tags: ['7-11', 'คาร์บเชิงซ้อน', 'Low GI'] },
  { id: 'sev-9', name: 'เต้าหู้ขาวตราดาวนึ่งซีอิ๊ว', category: 'clean_gym', calories: 140, protein: 16, carbs: 4, fat: 7, sugar: 1, sodium: 380, portion: '1 ก้อน (150g)', giLevel: 'low', tags: ['โปรตีนพืช', 'มังสวิรัติ'] },
  { id: 'sev-10', name: 'ปลากะพงนึ่งมะนาว ไม่ซดน้ำซุปหมด', category: 'clean_gym', calories: 190, protein: 32, carbs: 6, fat: 3, sugar: 3, sodium: 620, portion: '1 เสิร์ฟ (250g)', giLevel: 'low', tags: ['โปรตีนปลา', 'แคลต่ำ'] }
];

export const SMART_NUTRITION_SWAPS: SmartSwapItem[] = [
  {
    originalName: 'ชานมไข่มุกหวาน 100%',
    originalCalories: 420,
    swapName: 'อเมริกาโน่เย็น / ชาใสหวาน 0% หรือ ชานมโอ๊ตหวาน 25%',
    swapCalories: 60,
    caloriesSaved: 360,
    category: 'เครื่องดื่ม',
    reason: 'ลดน้ำตาลทรายได้ถึง 45 กรัม ป้องกันอินซูลินสไปก์ และลดแคลอรีเทียบเท่าการวิ่ง 40 นาที!',
    proTip: 'สั่งระดับความหวาน 0% หรือใช้สารให้ความหวานทดแทน (หญ้าหวาน/อิริทริทอล)'
  },
  {
    originalName: 'ข้าวมันไก่ทอด รวมหนัง',
    originalCalories: 690,
    swapName: 'ข้าวมันไก่ต้ม เนื้ออกล้วน ไม่เอาหนัง (หรือเปลี่ยนเป็นข้าวสวย)',
    swapCalories: 410,
    caloriesSaved: 280,
    category: 'อาหารจานเดียว',
    reason: 'ลดไขมันเลวจากการทอดซ้ำ ได้โปรตีนลีนแน่นๆ 32 กรัมเต็มจาน',
    proTip: 'ขอน้ำซุปใสแยก และตักน้ำจิ้มพอประมาณเพื่อคุมโซเดียม'
  },
  {
    originalName: 'กะเพราหมูกรอบ ไข่ดาวกรอบ',
    originalCalories: 780,
    swapName: 'กะเพราอกไก่สับ ใช้น้ำมันสเปรย์ + ไข่ดาวน้ำ (Poached Egg)',
    swapCalories: 380,
    caloriesSaved: 400,
    category: 'อาหารจานเดียว',
    reason: 'ตัดไขมันหมูสามชั้นและน้ำมันทอดไข่ ได้รสชาติกะเพราไทยแท้แต่แคลอรีลดลงกว่าครึ่ง',
    proTip: 'สั่งแม่ค้า: ผัดน้ำมันน้อย ไม่ใส่น้ำตาล ไม่ใส่ผงชูรสเยอะ'
  },
  {
    originalName: 'ผัดไทยกุ้งสด เส้นจันท์',
    originalCalories: 620,
    swapName: 'สุกี้น้ำรวมมิตร เน้นผักกาดขาวและวุ้นเส้นน้อย',
    swapCalories: 280,
    caloriesSaved: 340,
    category: 'เส้น',
    reason: 'เส้นผัดไทยอมน้ำมันและน้ำตาลปี๊บ สุกี้น้ำมีไฟเบอร์สูงและโปรตีนแน่นช่วยให้อิ่มสบายท้อง',
    proTip: 'ตักน้ำจิ้มสุกี้เพียง 1 ช้อนโต๊ะ ผสมพริกสดมะนาวเพิ่มความแซ่บ'
  },
  {
    originalName: 'กล้วยทอด / ปาท่องโก๋จิ้มนมข้น',
    originalCalories: 380,
    swapName: 'กล้วยหอมสด 1 ลูก + อัลมอนด์อบ 15 เม็ด หรือ มันหวานนึ่ง',
    swapCalories: 170,
    caloriesSaved: 210,
    category: 'ของว่าง',
    reason: 'เปลี่ยนจากไขมันทรานส์และแป้งขัดขาว มาเป็นคาร์โบไฮเดรตเชิงซ้อนและไขมันดีจากธรรมชาติ',
    proTip: 'กล้วยหอมมีโพแทสเซียมสูง ช่วยลดอาการบวมน้ำจากโซเดียมสะสม'
  },
  {
    originalName: 'ชาไทยเย็น นมข้นหวานล้นแก้ว',
    originalCalories: 320,
    swapName: 'ชาไทยชงสดใส่นมสดไขมันต่ำ/นมข้าวโอ๊ต หวาน 0-25%',
    swapCalories: 90,
    caloriesSaved: 230,
    category: 'เครื่องดื่ม',
    reason: 'ลดน้ำตาลส่วนเกินและไขมันปาล์มในนมข้น แต่ยังได้กลิ่นหอมของใบชาไทยเข้มข้น',
    proTip: 'ขอแม่ค้าใช้นมสดแท้แทนครีมเทียมและนมข้น'
  }
];
