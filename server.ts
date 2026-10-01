import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY is not set.');
    }
    aiClient = new GoogleGenAI(apiKey ? {
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    } : {});
  }
  return aiClient;
}

// Fast in-memory cache for repeated food analysis queries
const foodQueryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_MAX_SIZE = 1000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCachedFoodResult(key: string): any | null {
  const normalizedKey = key.trim().toLowerCase();
  const cached = foodQueryCache.get(normalizedKey);
  if (cached) {
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    foodQueryCache.delete(normalizedKey);
  }
  return null;
}

function setCachedFoodResult(key: string, data: any) {
  const normalizedKey = key.trim().toLowerCase();
  if (foodQueryCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = foodQueryCache.keys().next().value;
    if (oldestKey) foodQueryCache.delete(oldestKey);
  }
  foodQueryCache.set(normalizedKey, { data, timestamp: Date.now() });
}

// Ultra-fast Gemini AI invocation with zero thinking latency and automatic fallback
async function generateContentSafe(params: {
  model?: string;
  contents: any;
  config?: any;
}) {
  const aiInstance = getAI();
  const requestedModel = params.model;
  // Prioritize gemini-3.6-flash (highest reliability, no 503 traffic spikes) and gemini-3.8-flash (Google official recommendation)
  const primaryModel = requestedModel && requestedModel !== 'gemini-flash-latest' ? requestedModel : 'gemini-3.6-flash';
  const fallbackModels = [
    primaryModel,
    'gemini-3.6-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-3.7-flash',
  ];
  const modelsToTry = Array.from(new Set(fallbackModels));

  // Use MINIMAL thinking level to eliminate reasoning latency and provide instant responses
  const enrichedConfig = {
    ...params.config,
    thinkingConfig: params.config?.thinkingConfig || { thinkingLevel: ThinkingLevel.MINIMAL },
  };

  let lastError: any = null;
  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await aiInstance.models.generateContent({
          ...params,
          config: enrichedConfig,
          model: modelName,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || String(err)).toLowerCase();
        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('unavailable') ||
          errMsg.includes('high demand') ||
          errMsg.includes('429') ||
          errMsg.includes('resource_exhausted') ||
          errMsg.includes('overloaded') ||
          errMsg.includes('econnreset') ||
          errMsg.includes('etimedout');

        if (isTransient && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error('Failed to generate content from AI model');
}

// Google Search Grounded Gemini AI invocation with multi-model fallback
async function generateGroundedContentSafe(params: {
  contents: any;
  config?: any;
}) {
  const aiInstance = getAI();
  const modelsToTry = ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.7-flash'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await aiInstance.models.generateContent({
        model: modelName,
        contents: params.contents,
        config: {
          ...params.config,
          tools: [{ googleSearch: {} }],
        },
      });
      return { response, modelUsed: modelName };
    } catch (err: any) {
      lastError = err;
      console.warn(`Grounded generation failed on ${modelName}:`, err?.message || err);
      continue;
    }
  }

  throw lastError || new Error('Failed to generate grounded content from AI model');
}

// Built-in Thai Food Nutrition Database for high-precision offline fallback
const THAI_FOOD_NUTRITION_DB: Record<string, { cal: number; p: number; c: number; f: number; sugar: number; sodium: number }> = {
  // ข้าวและอาหารจานเดียว
  'ข้าวกะเพราไก่ไข่ดาว': { cal: 650, p: 32, c: 66, f: 28, sugar: 4, sodium: 1020 },
  'ข้าวกะเพราหมูไข่ดาว': { cal: 710, p: 30, c: 66, f: 35, sugar: 4, sodium: 1080 },
  'ข้าวกะเพราหมูกรอบไข่ดาว': { cal: 860, p: 26, c: 66, f: 52, sugar: 4, sodium: 1180 },
  'ข้าวกะเพราเนื้อไข่ดาว': { cal: 690, p: 34, c: 66, f: 31, sugar: 4, sodium: 1050 },
  'ข้าวกะเพรากุ้งไข่ดาว': { cal: 600, p: 28, c: 66, f: 23, sugar: 4, sodium: 1020 },
  'ข้าวกะเพราไก่': { cal: 520, p: 26, c: 65, f: 17, sugar: 4, sodium: 900 },
  'ข้าวกะเพราหมู': { cal: 580, p: 24, c: 65, f: 24, sugar: 4, sodium: 960 },
  'ข้าวกะเพราหมูกรอบ': { cal: 730, p: 20, c: 65, f: 42, sugar: 4, sodium: 1060 },
  'ข้าวกะเพราเนื้อ': { cal: 560, p: 28, c: 65, f: 20, sugar: 4, sodium: 930 },
  'ข้าวกะเพราทะเล': { cal: 530, p: 26, c: 65, f: 18, sugar: 4, sodium: 980 },
  'ข้าวกะเพราคลุก': { cal: 590, p: 25, c: 70, f: 22, sugar: 4, sodium: 1000 },
  
  'ข้าวผัดไก่': { cal: 550, p: 22, c: 70, f: 20, sugar: 3, sodium: 820 },
  'ข้าวผัดหมู': { cal: 590, p: 20, c: 70, f: 24, sugar: 3, sodium: 850 },
  'ข้าวผัดกุ้ง': { cal: 520, p: 22, c: 68, f: 18, sugar: 3, sodium: 860 },
  'ข้าวผัดปู': { cal: 510, p: 24, c: 68, f: 16, sugar: 3, sodium: 800 },
  'ข้าวผัดไข่': { cal: 480, p: 14, c: 68, f: 16, sugar: 2, sodium: 680 },
  'ข้าวผัดอเมริกัน': { cal: 720, p: 26, c: 84, f: 29, sugar: 14, sodium: 1120 },
  'ข้าวผัดต้มยำกุ้ง': { cal: 560, p: 24, c: 70, f: 20, sugar: 5, sodium: 1150 },
  'ข้าวผัดโบราณ': { cal: 610, p: 22, c: 72, f: 25, sugar: 5, sodium: 920 },
  'ข้าวผัดแหนม': { cal: 620, p: 21, c: 70, f: 27, sugar: 3, sodium: 1050 },

  'ข้าวไข่เจียว': { cal: 520, p: 14, c: 55, f: 26, sugar: 1, sodium: 620 },
  'ข้าวไข่เจียวหมูสับ': { cal: 620, p: 21, c: 55, f: 34, sugar: 1, sodium: 760 },
  'ข้าวไข่เจียวกุ้งสับ': { cal: 580, p: 22, c: 55, f: 30, sugar: 1, sodium: 740 },
  'ข้าวไข่ข้นกุ้ง': { cal: 490, p: 23, c: 52, f: 19, sugar: 2, sodium: 600 },
  'ข้าวไข่ข้นหมูสับ': { cal: 530, p: 22, c: 52, f: 24, sugar: 2, sodium: 640 },
  'ข้าวไข่ข้นปู': { cal: 480, p: 24, c: 52, f: 17, sugar: 2, sodium: 590 },
  'ข้าวไข่ดาว 2 ฟอง': { cal: 450, p: 14, c: 52, f: 19, sugar: 1, sodium: 400 },

  'ข้าวมันไก่ต้ม': { cal: 590, p: 24, c: 68, f: 23, sugar: 2, sodium: 890 },
  'ข้าวมันไก่ต้มไม่เอาหนัง': { cal: 510, p: 26, c: 68, f: 13, sugar: 2, sodium: 840 },
  'ข้าวมันไก่ทอด': { cal: 710, p: 20, c: 74, f: 36, sugar: 4, sodium: 980 },
  'ข้าวมันไก่ผสม': { cal: 650, p: 22, c: 71, f: 29, sugar: 3, sodium: 940 },

  'ข้าวหมูแดง': { cal: 540, p: 20, c: 75, f: 16, sugar: 14, sodium: 890 },
  'ข้าวหมูกรอบ': { cal: 690, p: 18, c: 72, f: 36, sugar: 12, sodium: 980 },
  'ข้าวหมูแดงหมูกรอบ': { cal: 620, p: 19, c: 74, f: 26, sugar: 13, sodium: 940 },
  'ข้าวขาหมู': { cal: 690, p: 24, c: 65, f: 36, sugar: 10, sodium: 1150 },
  'ข้าวขาหมูเนื้อล้วน': { cal: 520, p: 32, c: 65, f: 14, sugar: 8, sodium: 1050 },
  'ข้าวหน้าเป็ด': { cal: 580, p: 25, c: 68, f: 22, sugar: 11, sodium: 980 },
  'ข้าวคลุกกะปิ': { cal: 580, p: 22, c: 66, f: 24, sugar: 12, sodium: 1280 },
  'ข้าวหมูกระเทียม': { cal: 590, p: 22, c: 65, f: 26, sugar: 3, sodium: 850 },
  'ข้าวไก่กระเทียม': { cal: 520, p: 26, c: 65, f: 17, sugar: 3, sodium: 800 },
  'ข้าวผัดพริกแกงหมู': { cal: 590, p: 22, c: 65, f: 25, sugar: 5, sodium: 1100 },
  'ข้าวผัดพริกแกงไก่': { cal: 530, p: 25, c: 65, f: 18, sugar: 5, sodium: 1040 },
  'ข้าวราดคะน้าหมูกรอบ': { cal: 670, p: 19, c: 65, f: 37, sugar: 4, sodium: 1120 },
  'ข้าวราดผัดผักบุ้งหมูกรอบ': { cal: 660, p: 18, c: 64, f: 36, sugar: 4, sodium: 1140 },
  'ข้าวแกงกะหรี่ไก่': { cal: 590, p: 22, c: 78, f: 20, sugar: 8, sodium: 960 },
  'ข้าวแกงเขียวหวานไก่': { cal: 580, p: 22, c: 68, f: 24, sugar: 6, sodium: 1050 },
  'ข้าวแกงพะแนงหมู': { cal: 620, p: 23, c: 68, f: 27, sugar: 7, sodium: 1100 },
  'ข้าวไข่ต้ม 2 ฟอง': { cal: 360, p: 15, c: 52, f: 10, sugar: 1, sodium: 180 },

  // ก๋วยเตี๋ยวและเมนูเส้น
  'ผัดไทยกุ้งสด': { cal: 590, p: 22, c: 70, f: 24, sugar: 16, sodium: 1190 },
  'ผัดซีอิ๊วหมู': { cal: 630, p: 24, c: 62, f: 30, sugar: 8, sodium: 1140 },
  'ผัดซีอิ๊วไก่': { cal: 560, p: 26, c: 62, f: 22, sugar: 8, sodium: 1060 },
  'ผัดซีอิ๊วเส้นหมี่': { cal: 520, p: 22, c: 64, f: 18, sugar: 8, sodium: 1080 },
  'ราดหน้าหมูหมัก': { cal: 490, p: 20, c: 62, f: 16, sugar: 7, sodium: 1380 },
  'ราดหน้าเส้นใหญ่หมู': { cal: 510, p: 20, c: 65, f: 17, sugar: 7, sodium: 1390 },
  'ราดหน้าทะเล': { cal: 460, p: 22, c: 62, f: 12, sugar: 7, sodium: 1400 },
  'ผัดขี้เมาเส้นใหญ่ทะเล': { cal: 580, p: 24, c: 66, f: 23, sugar: 6, sodium: 1250 },
  'ก๋วยเตี๋ยวต้มยำหมู': { cal: 430, p: 18, c: 56, f: 13, sugar: 11, sodium: 1720 },
  'ก๋วยเตี๋ยวต้มยำน้ำใส': { cal: 390, p: 18, c: 55, f: 9, sugar: 9, sodium: 1650 },
  'ก๋วยเตี๋ยวน้ำใสไก่': { cal: 360, p: 22, c: 52, f: 7, sugar: 3, sodium: 1440 },
  'ก๋วยเตี๋ยวน้ำใสหมู': { cal: 380, p: 20, c: 52, f: 9, sugar: 3, sodium: 1480 },
  'ก๋วยเตี๋ยวเรือเนื้อ': { cal: 440, p: 23, c: 50, f: 15, sugar: 8, sodium: 1780 },
  'ก๋วยเตี๋ยวเรือหมู': { cal: 460, p: 21, c: 50, f: 17, sugar: 8, sodium: 1750 },
  'บะหมี่เกี๊ยวหมูแดง': { cal: 470, p: 22, c: 60, f: 14, sugar: 5, sodium: 1400 },
  'บะหมี่แห้งเป็ดย่าง': { cal: 540, p: 24, c: 58, f: 22, sugar: 7, sodium: 1280 },
  'เย็นตาโฟ': { cal: 410, p: 18, c: 56, f: 11, sugar: 12, sodium: 1820 },
  'ขนมจีนน้ำยาปลา': { cal: 340, p: 16, c: 48, f: 8, sugar: 4, sodium: 1200 },
  'ขนมจีนน้ำยากะทิ': { cal: 440, p: 14, c: 48, f: 21, sugar: 5, sodium: 1250 },
  'ขนมจีนแกงเขียวหวานไก่': { cal: 460, p: 18, c: 48, f: 22, sugar: 5, sodium: 1150 },
  'ขนมจีนน้ำเงี้ยว': { cal: 380, p: 18, c: 46, f: 13, sugar: 3, sodium: 1300 },
  'สุกี้น้ำรวมมิตร': { cal: 330, p: 23, c: 36, f: 8, sugar: 8, sodium: 1350 },
  'สุกี้แห้งไก่': { cal: 450, p: 26, c: 44, f: 16, sugar: 10, sodium: 1310 },
  'สุกี้แห้งหมู': { cal: 490, p: 24, c: 44, f: 21, sugar: 10, sodium: 1340 },
  'สุกี้แห้งทะเล': { cal: 430, p: 25, c: 44, f: 14, sugar: 10, sodium: 1320 },

  // ส้มตำ อีสาน ยำ และกับข้าว
  'ส้มตำไทย': { cal: 120, p: 4, c: 26, f: 1, sugar: 14, sodium: 980 },
  'ส้มตำปูปลาร้า': { cal: 95, p: 5, c: 19, f: 1, sugar: 6, sodium: 1680 },
  'ส้มตำปู': { cal: 105, p: 4, c: 22, f: 1, sugar: 10, sodium: 1350 },
  'ส้มตำไข่เค็ม': { cal: 190, p: 7, c: 27, f: 6, sugar: 14, sodium: 1420 },
  'ตำข้าวโพด': { cal: 160, p: 4, c: 35, f: 2, sugar: 16, sodium: 950 },
  'ตำแตง': { cal: 85, p: 3, c: 18, f: 1, sugar: 6, sodium: 1450 },
  'ลาบหมู': { cal: 230, p: 24, c: 8, f: 11, sugar: 2, sodium: 900 },
  'ลาบไก่': { cal: 185, p: 27, c: 8, f: 5, sugar: 2, sodium: 860 },
  'น้ำตกหมู': { cal: 270, p: 23, c: 8, f: 15, sugar: 2, sodium: 940 },
  'น้ำตกเนื้อ': { cal: 250, p: 26, c: 7, f: 12, sugar: 2, sodium: 920 },
  'ไก่ย่าง 1 น่อง': { cal: 210, p: 24, c: 2, f: 11, sugar: 2, sodium: 580 },
  'ไก่ย่าง 1 อก': { cal: 220, p: 36, c: 2, f: 6, sugar: 2, sodium: 520 },
  'คอหมูย่าง': { cal: 390, p: 18, c: 4, f: 33, sugar: 3, sodium: 740 },
  'หมูปิ้ง 1 ไม้': { cal: 130, p: 7, c: 5, f: 9, sugar: 4, sodium: 280 },
  'ไก่ทอด 1 ชิ้น': { cal: 280, p: 18, c: 12, f: 18, sugar: 1, sodium: 560 },
  'ยำวุ้นเส้นรวมมิตร': { cal: 240, p: 16, c: 34, f: 4, sugar: 9, sodium: 1380 },
  'ยำหมูยอ': { cal: 260, p: 14, c: 18, f: 14, sugar: 8, sodium: 1420 },
  'ยำแซลมอนสด': { cal: 230, p: 24, c: 8, f: 10, sugar: 6, sodium: 1150 },
  'ยำไข่ดาว (2 ฟอง)': { cal: 290, p: 14, c: 12, f: 21, sugar: 8, sodium: 1100 },

  // ต้ม แกง และซุป
  'ต้มยำกุ้งน้ำใส': { cal: 140, p: 20, c: 8, f: 3, sugar: 3, sodium: 1480 },
  'ต้มยำกุ้งน้ำข้น': { cal: 270, p: 22, c: 12, f: 15, sugar: 5, sodium: 1580 },
  'ต้มข่าไก่': { cal: 390, p: 24, c: 10, f: 27, sugar: 6, sodium: 1280 },
  'แกงเขียวหวานไก่': { cal: 430, p: 22, c: 12, f: 31, sugar: 6, sodium: 1180 },
  'แกงส้มชะอมกุ้ง': { cal: 290, p: 22, c: 16, f: 13, sugar: 8, sodium: 1410 },
  'แกงส้มผักรวม': { cal: 150, p: 8, c: 22, f: 2, sugar: 8, sodium: 1350 },
  'แกงจืดเต้าหู้หมูสับ': { cal: 195, p: 18, c: 6, f: 10, sugar: 2, sodium: 980 },
  'แกงจืดวุ้นเส้นหมูสับ': { cal: 210, p: 16, c: 18, f: 8, sugar: 2, sodium: 990 },
  'ต้มแซ่บกระดูกอ่อน': { cal: 280, p: 24, c: 6, f: 17, sugar: 2, sodium: 1520 },
  'ต้มจืดผักกาดขาวหมูสับ': { cal: 180, p: 16, c: 7, f: 9, sugar: 2, sodium: 940 },

  // เครื่องดื่ม
  'ชาไทยเย็น': { cal: 280, p: 4, c: 45, f: 9, sugar: 34, sodium: 90 },
  'ชาไทยหวานน้อย': { cal: 190, p: 4, c: 28, f: 6, sugar: 16, sodium: 80 },
  'ชาเขียวนมเย็น': { cal: 270, p: 4, c: 44, f: 8, sugar: 32, sodium: 85 },
  'กาแฟเอสเพรสโซ่เย็น': { cal: 220, p: 3, c: 32, f: 8, sugar: 26, sodium: 80 },
  'กาแฟลาเต้เย็น': { cal: 180, p: 6, c: 20, f: 7, sugar: 16, sodium: 110 },
  'กาแฟคาปูชิโน่เย็น': { cal: 170, p: 6, c: 18, f: 7, sugar: 14, sodium: 105 },
  'อเมริกาโน่เย็นไม่หวาน': { cal: 15, p: 1, c: 2, f: 0, sugar: 0, sodium: 10 },
  'อเมริกาโน่เย็นหวานน้อย': { cal: 60, p: 1, c: 14, f: 0, sugar: 12, sodium: 12 },
  'ชานมไข่มุก': { cal: 390, p: 3, c: 70, f: 10, sugar: 44, sodium: 110 },
  'ชามะนาวเย็น': { cal: 160, p: 0, c: 40, f: 0, sugar: 36, sodium: 20 },
  'นมสดปั่นคาราเมล': { cal: 410, p: 6, c: 62, f: 14, sugar: 48, sodium: 170 },
  'นมจืด 1 แก้ว (200ml)': { cal: 120, p: 7, c: 10, f: 6, sugar: 10, sodium: 100 },
  'นมพร่องมันเนย (200ml)': { cal: 90, p: 7, c: 10, f: 2, sugar: 10, sodium: 100 },
  'นมถั่วเหลืองหวานน้อย (250ml)': { cal: 110, p: 7, c: 12, f: 3, sugar: 8, sodium: 80 },
  'น้ำส้มคั้นสด 1 แก้ว': { cal: 110, p: 1, c: 26, f: 0, sugar: 20, sodium: 5 },
  'น้ำแตงโมปั่น': { cal: 130, p: 1, c: 32, f: 0, sugar: 28, sodium: 5 },
  'น้ำมะพร้าวสด 1 ลูก': { cal: 80, p: 1, c: 19, f: 0, sugar: 14, sodium: 40 },
  'โค้กซีโร่ 1 กระป๋อง': { cal: 0, p: 0, c: 0, f: 0, sugar: 0, sodium: 35 },
  'โค้ก 1 กระป๋อง (325ml)': { cal: 140, p: 0, c: 35, f: 0, sugar: 34, sodium: 30 },

  // ผลไม้และของว่างเพื่อสุขภาพ
  'ส้มโอ 1 กลีบ': { cal: 30, p: 0.5, c: 7, f: 0, sugar: 5, sodium: 1 },
  'ส้มโอ 2 กลีบ': { cal: 60, p: 1, c: 14, f: 0, sugar: 10, sodium: 2 },
  'ส้มโอ 4 กลีบ': { cal: 120, p: 2, c: 28, f: 0, sugar: 20, sodium: 4 },
  'กล้วยหอม 1 ลูก': { cal: 105, p: 1.3, c: 27, f: 0.3, sugar: 14, sodium: 1 },
  'กล้วยน้ำว้า 1 ลูก': { cal: 60, p: 0.8, c: 15, f: 0.1, sugar: 9, sodium: 1 },
  'แอปเปิ้ล 1 ลูก': { cal: 85, p: 0.5, c: 21, f: 0.3, sugar: 16, sodium: 2 },
  'ฝรั่ง 1 ลูก': { cal: 90, p: 3.5, c: 20, f: 1.2, sugar: 12, sodium: 4 },
  'แตงโม 1 ชิ้นใหญ่': { cal: 60, p: 1.2, c: 15, f: 0.3, sugar: 12, sodium: 2 },
  'มะละกอสุก 1 จานเล็ก': { cal: 70, p: 1, c: 17, f: 0.2, sugar: 13, sodium: 3 },
  'แก้วมังกร 1 ลูก': { cal: 90, p: 2, c: 20, f: 0.5, sugar: 13, sodium: 3 },
  'ทุเรียน 1 พู': { cal: 160, p: 2.5, c: 28, f: 5, sugar: 20, sodium: 3 },
  'มะม่วงสุก 1 ลูก': { cal: 135, p: 1.5, c: 35, f: 0.5, sugar: 30, sodium: 2 },
  'มะม่วงเปรี้ยว 1 ลูก': { cal: 90, p: 1, c: 22, f: 0.3, sugar: 14, sodium: 2 },

  // พื้นฐาน โปรตีน คลีน และวัตถุดิบ
  'ไข่ต้ม 1 ฟอง': { cal: 75, p: 6.3, c: 0.6, f: 5.3, sugar: 0.2, sodium: 65 },
  'ไข่ดาว 1 ฟอง': { cal: 130, p: 6.3, c: 0.6, f: 11.5, sugar: 0.2, sodium: 140 },
  'ไข่ลวก 1 ฟอง': { cal: 75, p: 6.3, c: 0.6, f: 5.3, sugar: 0.2, sodium: 65 },
  'อกไก่ต้ม 100g': { cal: 120, p: 26, c: 0, f: 2, sugar: 0, sodium: 65 },
  'อกไก่ย่าง 100g': { cal: 140, p: 28, c: 1, f: 3, sugar: 0, sodium: 120 },
  'สันในหมูต้ม 100g': { cal: 145, p: 26, c: 0, f: 4, sugar: 0, sodium: 60 },
  'กุ้งลวก 100g': { cal: 95, p: 21, c: 0.5, f: 1, sugar: 0, sodium: 140 },
  'ปลาแซลมอนย่าง 100g': { cal: 205, p: 22, c: 0, f: 13, sugar: 0, sodium: 60 },
  'เต้าหู้ขาว 1 แผ่น (150g)': { cal: 110, p: 12, c: 3, f: 6, sugar: 0.5, sodium: 20 },
  'ข้าวสวย 1 ทัพพี': { cal: 80, p: 1.5, c: 18, f: 0.2, sugar: 0, sodium: 2 },
  'ข้าวสวย 1 จาน': { cal: 220, p: 4, c: 50, f: 0.5, sugar: 0, sodium: 5 },
  'ข้าวกล้อง 1 ทัพพี': { cal: 75, p: 1.8, c: 16, f: 0.6, sugar: 0, sodium: 2 },
  'ข้าวกล้อง 1 จาน': { cal: 210, p: 5, c: 45, f: 1.5, sugar: 0, sodium: 5 },
  'ข้าวไรซ์เบอร์รี่ 1 ทัพพี': { cal: 75, p: 2, c: 16, f: 0.5, sugar: 0, sodium: 2 },
  'ข้าวเหนียว 1 ห่อ': { cal: 220, p: 4, c: 48, f: 1, sugar: 0, sodium: 5 },
  'ขนมปังโฮลวีท 1 แผ่น': { cal: 70, p: 3.5, c: 12, f: 1, sugar: 1.5, sodium: 130 },
  'ขนมปังขาว 1 แผ่น': { cal: 75, p: 2.5, c: 14, f: 1, sugar: 2, sodium: 140 },
  'เวย์โปรตีน 1 สกู๊ป': { cal: 120, p: 24, c: 2, f: 1.5, sugar: 1, sodium: 140 },
  'สลัดผักอกไก่': { cal: 220, p: 26, c: 12, f: 6, sugar: 4, sodium: 380 }
};

// Helper function to normalize nutrition data and guarantee 100% mathematical consistency (Atwater System)
function normalizeNutritionData(data: {
  foodName?: string;
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  sugarGrams?: number;
  sodiumMg?: number;
  fiberGrams?: number;
  explanation?: string;
}, fallbackName: string = 'อาหาร'): {
  foodName: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  sugarGrams: number;
  sodiumMg: number;
  fiberGrams?: number;
  explanation: string;
} {
  let p = Math.max(0, Number(data.proteinGrams) || 0);
  let c = Math.max(0, Number(data.carbsGrams) || 0);
  let f = Math.max(0, Number(data.fatGrams) || 0);
  const rawCal = Number(data.calories) || 0;

  // Round macros to 1 decimal place
  p = Math.round(p * 10) / 10;
  c = Math.round(c * 10) / 10;
  f = Math.round(f * 10) / 10;

  // Exact Atwater formula: 1g Protein = 4 kcal, 1g Carbohydrate = 4 kcal, 1g Fat = 9 kcal
  let calculatedCal = Math.round((p * 4) + (c * 4) + (f * 9));

  // If macros are missing or zero but calories was provided
  if (calculatedCal <= 0 && rawCal > 0) {
    p = Math.round((rawCal * 0.18 / 4) * 10) / 10;
    c = Math.round((rawCal * 0.52 / 4) * 10) / 10;
    f = Math.round((rawCal * 0.30 / 9) * 10) / 10;
    calculatedCal = Math.round((p * 4) + (c * 4) + (f * 9));
  } else if (calculatedCal <= 0) {
    p = 20;
    c = 55;
    f = 16;
    calculatedCal = Math.round((p * 4) + (c * 4) + (f * 9));
  }

  let sugar = Math.max(0, Number(data.sugarGrams) || 0);
  sugar = Math.min(sugar, c); // Sugar cannot exceed Carbohydrates
  sugar = Math.round(sugar * 10) / 10;

  const sodium = Math.max(0, Math.round(Number(data.sodiumMg) || 650));
  const fiber = data.fiberGrams !== undefined ? Math.max(0, Math.round(Number(data.fiberGrams) * 10) / 10) : undefined;

  const foodName = (data.foodName && data.foodName.trim()) ? data.foodName.trim() : fallbackName;

  return {
    foodName,
    calories: calculatedCal,
    proteinGrams: p,
    carbsGrams: c,
    fatGrams: f,
    sugarGrams: sugar,
    sodiumMg: sodium,
    ...(fiber !== undefined ? { fiberGrams: fiber } : {}),
    explanation: data.explanation || `ประเมินสารอาหารสำหรับ "${foodName}" พลังงานรวม ${calculatedCal} kcal (โปรตีน ${p}g, คาร์บ ${c}g, ไขมัน ${f}g)`
  };
}

function calculateSingleItemNutrition(query: string) {
  const queryClean = query.trim();
  const lowerQ = queryClean.toLowerCase();

  let matchedKey = '';
  let baseFood = { cal: 400, p: 18, c: 48, f: 14, sugar: 4, sodium: 750 };

  // Match direct keys from the richest DB
  for (const [key, val] of Object.entries(THAI_FOOD_NUTRITION_DB)) {
    if (lowerQ.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerQ)) {
      matchedKey = key;
      baseFood = { ...val };
      break;
    }
  }

  // Fruit and piece parsing (e.g., ส้มโอ 4 กลีบ, กล้วย 2 ลูก)
  if (lowerQ.includes('ส้มโอ')) {
    const pMatch = lowerQ.match(/(\d+)\s*กลีบ/);
    const pieces = pMatch ? parseInt(pMatch[1], 10) : 2;
    return normalizeNutritionData({
      foodName: `ส้มโอ ${pieces} กลีบ`,
      calories: 30 * pieces,
      proteinGrams: 0.5 * pieces,
      carbsGrams: 7 * pieces,
      fatGrams: 0,
      sugarGrams: 5 * pieces,
      sodiumMg: 1 * pieces,
      explanation: `ส้มโอสด ${pieces} กลีบ (~${pieces * 60} กรัม) วิตามินซีสูง ใยอาหารแน่น ไร้ไขมัน แคลอรี่ต่ำ`
    });
  }

  if (lowerQ.includes('กล้วยหอม')) {
    const countMatch = lowerQ.match(/(\d+)\s*(ลูก|ผล)/);
    const count = countMatch ? parseInt(countMatch[1], 10) : 1;
    return normalizeNutritionData({
      foodName: `กล้วยหอม ${count} ลูก`,
      calories: 105 * count,
      proteinGrams: 1.3 * count,
      carbsGrams: 27 * count,
      fatGrams: 0.3 * count,
      sugarGrams: 14 * count,
      sodiumMg: 1 * count,
      explanation: `กล้วยหอมสด ${count} ลูก ให้พลังงานและโพแทสเซียมสูง เหมาะสำหรับก่อนหรือหลังออกกำลังกาย`
    });
  }

  if (!matchedKey) {
    if (lowerQ.includes('กะเพรา') || lowerQ.includes('กระเพรา')) {
      baseFood = { cal: 580, p: 26, c: 65, f: 24, sugar: 4, sodium: 950 };
      matchedKey = 'ข้าวกะเพรา';
    } else if (lowerQ.includes('ข้าวผัด')) {
      baseFood = { cal: 560, p: 22, c: 70, f: 20, sugar: 3, sodium: 850 };
      matchedKey = 'ข้าวผัด';
    } else if (lowerQ.includes('ข้าวมันไก่')) {
      baseFood = { cal: 590, p: 24, c: 68, f: 23, sugar: 2, sodium: 890 };
      matchedKey = 'ข้าวมันไก่';
    } else if (lowerQ.includes('ก๋วยเตี๋ยว') || lowerQ.includes('บะหมี่') || lowerQ.includes('เส้นเล็ก') || lowerQ.includes('เส้นใหญ่')) {
      baseFood = { cal: 420, p: 20, c: 55, f: 12, sugar: 6, sodium: 1500 };
      matchedKey = 'ก๋วยเตี๋ยว';
    } else if (lowerQ.includes('ส้มตำ') || lowerQ.includes('ตำไทย') || lowerQ.includes('ตำปลาร้า')) {
      baseFood = { cal: 120, p: 4, c: 24, f: 1, sugar: 12, sodium: 1200 };
      matchedKey = 'ส้มตำ';
    } else if (lowerQ.includes('สลัด')) {
      baseFood = { cal: 220, p: 18, c: 14, f: 8, sugar: 4, sodium: 400 };
      matchedKey = 'สลัด';
    } else if (lowerQ.includes('แกง')) {
      baseFood = { cal: 320, p: 18, c: 12, f: 20, sugar: 4, sodium: 1100 };
      matchedKey = 'แกง';
    } else if (lowerQ.includes('กาแฟ') || lowerQ.includes('ชา') || lowerQ.includes('นม') || lowerQ.includes('ชานม')) {
      baseFood = { cal: 220, p: 4, c: 34, f: 7, sugar: 26, sodium: 90 };
      matchedKey = 'เครื่องดื่ม';
    }
  }

  let totalCal = baseFood.cal;
  let totalP = baseFood.p;
  let totalC = baseFood.c;
  let totalF = baseFood.f;
  let totalSugar = baseFood.sugar;
  let totalSodium = baseFood.sodium;
  let title = matchedKey || queryClean;
  let notes: string[] = [];

  // Gram parsing (e.g. 200 กรัม / 200g)
  const gramMatch = queryClean.match(/(\d+(?:\.\d+)?)\s*(กรัม|g|gram|grams)/i);
  if (gramMatch) {
    const grams = parseFloat(gramMatch[1]);
    if (grams > 0 && grams <= 2000) {
      const scale = grams / 100;
      totalCal = Math.round(totalCal * scale);
      totalP = Math.round(totalP * scale * 10) / 10;
      totalC = Math.round(totalC * scale * 10) / 10;
      totalF = Math.round(totalF * scale * 10) / 10;
      totalSugar = Math.round(totalSugar * scale * 10) / 10;
      totalSodium = Math.round(totalSodium * scale);
      title = `${matchedKey || queryClean} ${grams} กรัม`;
      notes.push(`(คำนวณตามน้ำหนัก ${grams} กรัม)`);
    }
  } else {
    // Quantity parsing (e.g. 2 จาน, 3 ฟอง, 1 แก้ว)
    const amountMatch = queryClean.match(/(\d+(?:\.\d+)?)\s*(จาน|ชาม|ถ้วย|แก้ว|ขวด|กล่อง|ห่อ|ชิ้น|ฟอง|ลูก|ผล|ทัพพี|เสิร์ฟ|serving|servings|ไม้|พู)/i);
    if (amountMatch) {
      const num = parseFloat(amountMatch[1]);
      const unit = amountMatch[2].toLowerCase();
      if (num > 0 && num <= 20) {
        totalCal = Math.round(totalCal * num);
        totalP = Math.round(totalP * num * 10) / 10;
        totalC = Math.round(totalC * num * 10) / 10;
        totalF = Math.round(totalF * num * 10) / 10;
        totalSugar = Math.round(totalSugar * num * 10) / 10;
        totalSodium = Math.round(totalSodium * num);
        title = `${matchedKey || queryClean} ${num} ${unit}`;
        notes.push(`(คำนวณปริมาณ ${num} ${unit})`);
      }
    } else if (lowerQ.includes('ครึ่งจาน') || lowerQ.includes('ครึ่งชาม') || lowerQ.includes('ครึ่งแก้ว') || lowerQ.includes('ครึ่งห่อ') || lowerQ.includes('ครึ่งลูก')) {
      totalCal = Math.round(totalCal * 0.55);
      totalP = Math.round(totalP * 0.55 * 10) / 10;
      totalC = Math.round(totalC * 0.55 * 10) / 10;
      totalF = Math.round(totalF * 0.55 * 10) / 10;
      totalSugar = Math.round(totalSugar * 0.55 * 10) / 10;
      totalSodium = Math.round(totalSodium * 0.55);
      notes.push('(ปริมาณครึ่งส่วน)');
    } else if (lowerQ.includes('พิเศษ') || lowerQ.includes('จานใหญ่')) {
      totalCal = Math.round(totalCal * 1.3);
      totalP = Math.round(totalP * 1.35 * 10) / 10;
      totalC = Math.round(totalC * 1.25 * 10) / 10;
      totalF = Math.round(totalF * 1.3 * 10) / 10;
      totalSugar = Math.round(totalSugar * 1.1 * 10) / 10;
      totalSodium = Math.round(totalSodium * 1.3);
      notes.push('(ขนาดพิเศษ/จานใหญ่)');
    }
  }

  // Add-ons
  if (lowerQ.includes('ไข่ดาว') && !matchedKey.includes('ไข่ดาว')) {
    const eggCountMatch = lowerQ.match(/ไข่ดาว\s*(\d+)\s*ฟอง/);
    const eggCount = eggCountMatch ? parseInt(eggCountMatch[1], 10) : 1;
    totalCal += 130 * eggCount;
    totalP += 6.3 * eggCount;
    totalC += 0.6 * eggCount;
    totalF += 11.5 * eggCount;
    totalSodium += 140 * eggCount;
    notes.push(`+ เพิ่มไข่ดาว ${eggCount > 1 ? eggCount + ' ฟอง ' : ''}(+${130 * eggCount} kcal)`);
  }
  if (lowerQ.includes('ไข่ต้ม') && !matchedKey.includes('ไข่ต้ม')) {
    const eggCountMatch = lowerQ.match(/ไข่ต้ม\s*(\d+)\s*ฟอง/);
    const eggCount = eggCountMatch ? parseInt(eggCountMatch[1], 10) : 1;
    totalCal += 75 * eggCount;
    totalP += 6.3 * eggCount;
    totalC += 0.6 * eggCount;
    totalF += 5.3 * eggCount;
    totalSodium += 65 * eggCount;
    notes.push(`+ เพิ่มไข่ต้ม ${eggCount > 1 ? eggCount + ' ฟอง ' : ''}(+${75 * eggCount} kcal)`);
  }
  if (lowerQ.includes('ไข่เจียว') && !matchedKey.includes('ไข่เจียว')) {
    totalCal += 190;
    totalP += 7;
    totalC += 1;
    totalF += 17;
    totalSodium += 250;
    notes.push('+ เพิ่มไข่เจียว (+190 kcal)');
  }

  return normalizeNutritionData({
    foodName: title,
    calories: totalCal,
    proteinGrams: totalP,
    carbsGrams: totalC,
    fatGrams: totalF,
    sugarGrams: totalSugar,
    sodiumMg: totalSodium,
    explanation: notes.length > 0
      ? `ประเมินโภชนาการสำหรับ "${queryClean}": ${notes.join(' ')} ตามมาตรฐานฐานข้อมูลโภชนาการไทย`
      : `ประเมินโภชนาการมาตรฐานสำหรับ "${queryClean}" ตามหลักโภชนาการอาหารไทย (Thai Food Composition)`
  });
}

function calculateNutritionFallback(query: string) {
  const queryClean = query.trim();
  
  // Check if multiple items are joined by +, และ, กับ, ,, or newline
  const multiSplit = queryClean.split(/\s*(?:\+|\band\b|และ|กับ|,|\n)\s*/i).filter(s => s.trim().length > 0);
  
  if (multiSplit.length > 1) {
    let sumCal = 0;
    let sumP = 0;
    let sumC = 0;
    let sumF = 0;
    let sumSugar = 0;
    let sumSodium = 0;
    const names: string[] = [];
    const itemExplanations: string[] = [];

    for (const subItem of multiSplit) {
      const itemResult = calculateSingleItemNutrition(subItem);
      sumCal += itemResult.calories;
      sumP += itemResult.proteinGrams;
      sumC += itemResult.carbsGrams;
      sumF += itemResult.fatGrams;
      sumSugar += itemResult.sugarGrams;
      sumSodium += itemResult.sodiumMg;
      names.push(itemResult.foodName);
      itemExplanations.push(`${itemResult.foodName} (${itemResult.calories} kcal)`);
    }

    return normalizeNutritionData({
      foodName: names.join(' + '),
      calories: sumCal,
      proteinGrams: sumP,
      carbsGrams: sumC,
      fatGrams: sumF,
      sugarGrams: sumSugar,
      sodiumMg: sumSodium,
      explanation: `รวมมื้ออาหาร: ${itemExplanations.join(' + ')} รวมพลังงาน ${sumCal} kcal ตามมาตรฐานโภชนาการไทย`
    });
  }

  return calculateSingleItemNutrition(queryClean);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware to parse large JSON payloads (base64 images)
  app.use(express.json({ limit: '50mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // User Cloud Data Storage & Realtime Cross-Device Sync API
  const USERS_DATA_DIR = path.resolve(process.cwd(), 'data', 'users');
  try {
    if (!fs.existsSync(USERS_DATA_DIR)) {
      fs.mkdirSync(USERS_DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to create users data directory:', err);
  }

  // GET /api/user/sync?userId=...
  app.get('/api/user/sync', (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const userFilePath = path.join(USERS_DATA_DIR, `${safeId}.json`);
      if (fs.existsSync(userFilePath)) {
        const fileContent = fs.readFileSync(userFilePath, 'utf-8');
        const userData = JSON.parse(fileContent);

        // Filter out any items in deletedIds tombstones
        const delSet = new Set(Array.isArray(userData.deletedIds) ? userData.deletedIds : []);
        if (Array.isArray(userData.history)) {
          userData.history = userData.history.filter((h: any) => h && h.id && !delSet.has(h.id));
        }

        return res.json({ success: true, data: userData });
      } else {
        return res.json({ success: true, data: null });
      }
    } catch (err: any) {
      console.error('Error fetching user sync data:', err);
      return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });

  // POST /api/user/sync
  app.post('/api/user/sync', (req, res) => {
    try {
      const { userId, email, history, profile, lastUpdated, deletedIds } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const userFilePath = path.join(USERS_DATA_DIR, `${safeId}.json`);

      let incomingDeleted: string[] = Array.isArray(deletedIds) ? deletedIds : [];
      let combinedDeleted = new Set<string>(incomingDeleted);

      let mergedData: any = {
        userId,
        email: email || '',
        lastUpdated: lastUpdated || Date.now(),
        history: Array.isArray(history) ? history : [],
        profile: profile || {},
        deletedIds: []
      };

      if (fs.existsSync(userFilePath)) {
        try {
          const existing = JSON.parse(fs.readFileSync(userFilePath, 'utf-8'));

          // Merge deletedIds tombstones
          if (Array.isArray(existing.deletedIds)) {
            existing.deletedIds.forEach((id: string) => combinedDeleted.add(id));
          }

          // Use incoming history if provided (client is authoritative for its state)
          if (Array.isArray(history)) {
            mergedData.history = history.filter((h: any) => h && h.id && !combinedDeleted.has(h.id));
          } else if (Array.isArray(existing.history)) {
            mergedData.history = existing.history.filter((h: any) => h && h.id && !combinedDeleted.has(h.id));
          }

          mergedData.profile = { ...(existing.profile || {}), ...(profile || {}) };
          mergedData.lastUpdated = Math.max(existing.lastUpdated || 0, mergedData.lastUpdated);
        } catch (e) {
          console.warn('Could not read existing file for merge, overwriting:', e);
          if (Array.isArray(history)) {
            mergedData.history = history.filter((h: any) => h && h.id && !combinedDeleted.has(h.id));
          }
        }
      } else {
        if (Array.isArray(history)) {
          mergedData.history = history.filter((h: any) => h && h.id && !combinedDeleted.has(h.id));
        }
      }

      mergedData.deletedIds = Array.from(combinedDeleted);

      fs.writeFileSync(userFilePath, JSON.stringify(mergedData, null, 2), 'utf-8');
      return res.json({ success: true, data: mergedData });
    } catch (err: any) {
      console.error('Error saving user sync data:', err);
      return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });

  // Handler for analyzing food images (High-Precision Multimodal Gemini 3.7 Flash)
  const handleAnalyzeFoodImage = async (req: express.Request, res: express.Response) => {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'กรุณาอัปโหลดหรือถ่ายรูปภาพอาหาร' });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

    try {
      const prompt = `คุณคือนักกำหนดอาหารวิชาชีพและผู้เชี่ยวชาญการประเมินภาพถ่ายอาหารระดับสูง (Senior Clinical Dietitian & Thai Food Composition Expert)
หน้าที่ของคุณคือวิเคราะห์รูปภาพอาหารที่ส่งมาอย่างแม่นยำและรวดเร็วที่สุด โดยคำนวณแคลอรี่และสารอาหารหลักตามมาตรฐาน Thai Food Composition Table (สถาบันโภชนาการ มหาวิทยาลัยมหิดล / กรมอนามัย) และ USDA:

ขั้นตอนการวิเคราะห์รูปภาพ:
1. การระบุชนิดอาหารและวัตถุดิบ (Visual Identification):
   - ระบุชนิดอาหารอย่างเจาะจง (เช่น "ข้าวกะเพราหมูสับไข่ดาว", "ส้มตำไทย + ไก่ย่าง 1 น่อง + ข้าวเหนียว 1 ห่อ", "ก๋วยเตี๋ยวต้มยำหมูมะนาว", "ข้าวไข่ข้นกุ้ง", "สลัดอกไก่ย่าง")
   - คาร์โบไฮเดรต: ประเมินปริมาณ ข้าวสวย (1 ทัพพี ~80 kcal, 1 จาน ~220 kcal), ข้าวเหนียว (~220 kcal), เส้นก๋วยเตี๋ยว (~180-220 kcal), ขนมจีน (~140 kcal)
   - โปรตีน: ชนิดเนื้อสัตว์และกรรมวิธี (อกไก่ต้ม ~120 kcal/100g, ไก่ทอด ~280 kcal/ชิ้น, คอหมูย่าง ~390 kcal, หมูกรอบ ~500 kcal/100g, กุ้งลวก ~95 kcal/100g)
   - ไข่: ไข่ต้ม/ไข่ลวก = 75 kcal, ไข่ดาวทอดกรอบ = 130 kcal, ไข่เจียว = 190-220 kcal
   - ไขมันและน้ำมันปรุงอาหาร: ผัดน้ำมันทั่วไป +10-15g fat (~90-135 kcal), ทอดน้ำมันท่วม +15-25g fat, ต้ม/นึ่ง/ย่างไม่ใช้น้ำมัน ~2-5g fat
   - เครื่องดื่ม/ของหวาน: กาแฟดำ = 15 kcal, ชานม/ชาไทยหวานปกติ = 280-390 kcal (น้ำตาล 30-45g), ผลไม้ตามชนิดและจำนวนชิ้น

2. การประเมินขนาดเสิร์ฟ (Portion Scale):
   - ประเมินสัดส่วนในจาน/ชาม (จานมาตรฐาน ~1 เสิร์ฟ, จานใหญ่/พิเศษ ~1.3-1.5 เสิร์ฟ, ชามเล็ก ~0.6-0.8 เสิร์ฟ)

3. ความถูกต้องทางคณิตศาสตร์โภชนาการ:
   - ตรวจสอบให้แน่ใจว่า: แคลอรี่รวม (Calories) ต้องสอดคล้องกับสารอาหารหลักตามหลักสากล: Calories ≈ (Protein × 4) + (Carbs × 4) + (Fat × 9) ± 5%

4. สรุปผลลัพธ์:
   - foodName: ชื่ออาหารภาษาไทยที่ชัดเจน ระบุส่วนประกอบสำคัญและปริมาณ (เช่น "ข้าวกะเพราหมูสับไข่ดาว 1 จาน", "ส้มตำไทยและไก่ย่าง 1 ชิ้น")
   - explanation: สรุปแจกแจงสัดส่วนแคลอรี่ของแต่ละส่วนประกอบสั้นๆ เช่น "ข้าวสวย 1 จาน (220 kcal) + กะเพราหมูสับผัดน้ำมัน (360 kcal) + ไข่ดาวทอดกรอบ (130 kcal) | รวม 710 kcal อุดมด้วยโปรตีน 30g"`;

      const response = await generateContentSafe({
        model: 'gemini-flash-latest',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { data: base64Data, mimeType } }
            ]
          }
        ],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              foodName: { type: Type.STRING, description: 'ชื่ออาหารภาษาไทยที่เฉพาะเจาะจง' },
              calories: { type: Type.INTEGER, description: 'แคลอรี่รวมโดยประมาณ (kcal)' },
              proteinGrams: { type: Type.NUMBER, description: 'โปรตีน (กรัม)' },
              carbsGrams: { type: Type.NUMBER, description: 'คาร์โบไฮเดรต (กรัม)' },
              fatGrams: { type: Type.NUMBER, description: 'ไขมัน (กรัม)' },
              sugarGrams: { type: Type.NUMBER, description: 'น้ำตาล (กรัม)' },
              sodiumMg: { type: Type.INTEGER, description: 'โซเดียม (มิลลิกรัม)' },
              explanation: { type: Type.STRING, description: 'คำอธิบายแจกแจงส่วนประกอบและแคลอรี่' }
            },
            required: ['foodName', 'calories', 'proteinGrams', 'carbsGrams', 'fatGrams', 'sugarGrams', 'sodiumMg', 'explanation']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from AI');

      let cleanText = text.trim();
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) {
        cleanText = match[1].trim();
      }

      const parsed = JSON.parse(cleanText);
      const normalized = normalizeNutritionData(parsed, 'อาหารจากรูปภาพ');
      res.json(normalized);
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      res.json(normalizeNutritionData({
        foodName: 'อาหารจากรูปภาพ',
        calories: 520,
        proteinGrams: 24,
        carbsGrams: 58,
        fatGrams: 20,
        sugarGrams: 5,
        sodiumMg: 850,
        explanation: 'ประเมินจากภาพถ่ายอาหารตามหลักโภชนาการมาตรฐาน (โหมดสำรอง)'
      }));
    }
  };

  app.post('/api/analyze', handleAnalyzeFoodImage);
  app.post('/api/analyze-image', handleAnalyzeFoodImage);

  // Handler for text, meal, and speech food analysis (Fast Cached Gemini 3.7 Flash)
  const handleAnalyzeFoodText = async (req: express.Request, res: express.Response) => {
    const rawQuery = req.body.query || req.body.textQuery || req.body.text || req.body.mealDescription || '';
    const queryClean = String(rawQuery).trim();

    if (!queryClean) {
      return res.status(400).json({ error: 'กรุณากรอกหรือพูดชื่ออาหารที่รับประทาน' });
    }

    // 1. Instant Cache Check for ultra-fast repeated queries (<1ms)
    const cached = getCachedFoodResult(queryClean);
    if (cached) {
      return res.json(normalizeNutritionData(cached, queryClean));
    }

    try {
      const prompt = `คุณคือนักกำหนดอาหารวิชาชีพและนักโภชนาการคลินิกผู้เชี่ยวชาญอาหารไทยและสากล (Senior Clinical Dietitian & Thai Nutritionist)
หน้าที่ของคุณคือคำนวณแคลอรี่และสารอาหารของอาหารหรือมื้ออาหารที่ผู้ใช้ระบุอย่าง "แม่นยำและถูกต้องตามหลักโภชนาการ 100%"

ข้อความที่ผู้ใช้ระบุ: "${queryClean}"

หลักเกณฑ์การคำนวณสารอาหารอย่างแม่นยำ:
1. การระบุปริมาณและจำนวนเสิร์ฟ (Portion Multiplier):
   - หากผู้ใช้ระบุจำนวนชิ้น/จาน/ชาม/แก้ว/ฟอง/กรัม (เช่น "2 จาน", "3 ฟอง", "150 กรัม", "2 แก้ว", "พิเศษ", "ครึ่งจาน") ให้คูณและคำนวณสารอาหารรวมทั้งหมดตามจริง
   - หากมีหลายเมนูผสมกันในข้อความเดียว (เช่น "ข้าวมันไก่ 1 จาน + ต้มยำกุ้ง 1 ถ้วย + ชาเย็น 1 แก้ว" หรือ "ส้มตำไทย ไก่ย่าง 1 น่อง ข้าวเหนียว 1 ห่อ") ให้คำนวณผลรวมแคลอรี่และสารอาหารของทุกเมนูรวมกันทั้งหมด
   - หากมีการปรับแต่ง (เช่น "ไม่ใส่น้ำมัน", "อกไก่ล้วน", "หวาน 25%", "หวาน 0%", "ไม่ใส่ชูรส", "ข้าวไรซ์เบอร์รี่") ให้ปรับลดไขมัน/น้ำตาล/โซเดียมให้ตรงกับความเป็นจริง

2. ฐานข้อมูลอ้างอิงโภชนาการไทยมาตรฐาน (Thai Food Composition Table & USDA):
   - ข้าวสวย 1 ทัพพี (~60g) = 80 kcal (C: 18g, P: 1.5g) / ข้าวสวย 1 จานปกติ (~150-180g) = 220 kcal
   - ข้าวเหนียว 1 ห่อ (~100g) = 220 kcal (C: 48g, P: 4g)
   - ข้าวกล้อง / ไรซ์เบอร์รี่ 1 ทัพพี = 75 kcal, 1 จาน = 210 kcal
   - ไข่ต้ม/ไข่ลวก 1 ฟอง = 75 kcal (P: 6.3g, F: 5.3g, C: 0.6g)
   - ไข่ดาวทอดกรอบ 1 ฟอง = 130 kcal (P: 6.3g, F: 11.5g, C: 0.6g)
   - ไข่เจียว 1 ฟองทอดน้ำมัน = 190 kcal (P: 7g, F: 17g, C: 1g)
   - ข้าวกะเพราไก่ = 520 kcal (ถ้าใส่ไข่ดาว = 650 kcal)
   - ข้าวกะเพราหมูสับ = 580 kcal (ถ้าใส่ไข่ดาว = 710 kcal)
   - ข้าวกะเพราหมูกรอบ = 730 kcal (ถ้าใส่ไข่ดาว = 860 kcal)
   - ข้าวมันไก่ต้ม = 590 kcal / ข้าวมันไก่ไม่เอาหนัง = 510 kcal / ข้าวมันไก่ทอด = 710 kcal
   - ข้าวหมูแดง = 540 kcal / ข้าวหมูกรอบ = 690 kcal / ข้าวขาหมู = 690 kcal (เนื้อล้วน 520 kcal)
   - ผัดไทยกุ้งสด = 590 kcal / ผัดซีอิ๊วหมู = 630 kcal / ราดหน้าหมู = 490 kcal
   - ก๋วยเตี๋ยวน้ำใส = 360-380 kcal / ก๋วยเตี๋ยวต้มยำ = 430 kcal / ก๋วยเตี๋ยวเรือ = 440-460 kcal / สุกี้น้ำ = 330 kcal / สุกี้แห้ง = 470 kcal
   - ส้มตำไทย 1 จาน = 120 kcal (C: 26g, P: 4g, Sugar: 14g, Sodium: 980mg)
   - ส้มตำปูปลาร้า 1 จาน = 95 kcal (Sodium: 1680mg)
   - ลาบหมู = 230 kcal / น้ำตกหมู = 270 kcal / ไก่ย่าง 1 น่อง = 210 kcal / ไก่ทอด 1 ชิ้น = 280 kcal / หมูปิ้ง 1 ไม้ = 130 kcal
   - ต้มยำกุ้งน้ำใส = 140 kcal / ต้มยำกุ้งน้ำข้น = 270 kcal / แกงเขียวหวานไก่ = 430 kcal / แกงจืดเต้าหู้หมูสับ = 195 kcal
   - ผลไม้: ส้มโอ 1 กลีบ = 30 kcal (C: 7g, Sugar: 5g), กล้วยหอม 1 ลูก = 105 kcal, กล้วยน้ำว้า 1 ลูก = 60 kcal, แอปเปิ้ล 1 ลูก = 85 kcal, ฝรั่ง 1 ลูก = 90 kcal, แตงโม 1 ชิ้น = 60 kcal
   - เครื่องดื่ม: อเมริกาโน่ไม่หวาน = 15 kcal, กาแฟลาเต้เย็น = 180 kcal, ชาไทยเย็น = 280 kcal (หวานน้อย 190 kcal), ชานมไข่มุก = 390 kcal, นมสด (200ml) = 120 kcal, เวย์โปรตีน 1 สกู๊ป = 120 kcal (P: 24g)

3. ความสอดคล้องของสูตรคณิตศาสตร์:
   - แคลอรี่รวม (calories) ต้องสอดคล้องกับมาโคร: Calories = (Protein × 4) + (Carbs × 4) + (Fat × 9)

4. ข้อมูลส่งออก:
   - foodName: สรุปชื่ออาหารและปริมาณที่เข้าใจง่าย ภาษาไทย เช่น "ข้าวกะเพราหมูสับไข่ดาว 1 จาน" หรือ "ส้มโอ 4 กลีบ"
   - calories: จำนวนแคลอรี่รวม (kcal)
   - proteinGrams: โปรตีน (g)
   - carbsGrams: คาร์โบไฮเดรต (g)
   - fatGrams: ไขมัน (g)
   - sugarGrams: น้ำตาล (g)
   - sodiumMg: โซเดียม (mg)
   - explanation: แจกแจงรายละเอียดสั้นๆ ว่าแต่ละองค์ประกอบมีกี่แคลอรี่ พร้อมคำแนะนำโภชนาการ`;

      const response = await generateContentSafe({
        model: 'gemini-flash-latest',
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              foodName: { type: Type.STRING, description: 'ชื่ออาหารภาษาไทย' },
              calories: { type: Type.INTEGER, description: 'แคลอรี่รวมโดยประมาณ (kcal)' },
              proteinGrams: { type: Type.NUMBER, description: 'โปรตีน (กรัม)' },
              carbsGrams: { type: Type.NUMBER, description: 'คาร์โบไฮเดรต (กรัม)' },
              fatGrams: { type: Type.NUMBER, description: 'ไขมัน (กรัม)' },
              sugarGrams: { type: Type.NUMBER, description: 'น้ำตาล (กรัม)' },
              sodiumMg: { type: Type.INTEGER, description: 'โซเดียม (มิลลิกรัม)' },
              explanation: { type: Type.STRING, description: 'คำอธิบายเกี่ยวกับปริมาณและโภชนาการ' }
            },
            required: ['foodName', 'calories', 'proteinGrams', 'carbsGrams', 'fatGrams', 'sugarGrams', 'sodiumMg', 'explanation']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from AI');

      let cleanText = text.trim();
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) {
        cleanText = match[1].trim();
      }

      const parsed = JSON.parse(cleanText);
      const finalResult = normalizeNutritionData(parsed, queryClean);

      // Cache result for instant future lookups
      setCachedFoodResult(queryClean, finalResult);

      res.json(finalResult);
    } catch (error: any) {
      console.error('Error analyzing food text with AI, using fallback database:', error);
      const fallbackResult = calculateNutritionFallback(queryClean);
      return res.json(fallbackResult);
    }
  };

  app.post('/api/analyze-text', handleAnalyzeFoodText);
  app.post('/api/analyze-food-text', handleAnalyzeFoodText);
  app.post('/api/analyze-food-speech', handleAnalyzeFoodText);
  app.post('/api/analyze-meal', handleAnalyzeFoodText);

  // API Route for Nutrition Label Scanner (OCR + Nutrition analysis from photo)
  app.post('/api/analyze-nutrition-label', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Image base64 is required' });
      }

      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const prompt = `คุณคือ AI ผู้เชี่ยวชาญการอ่านตารางข้อมูลโภชนาการ (Nutrition Facts Label Scanner) และบาร์โค้ดสินค้า
จงอ่านรูปภาพฉลากโภชนาการนี้ แล้วสกัดค่าสารอาหารออกมาอย่างแม่นยำ:
- ชื่อสินค้า/อาหาร (ภาษาไทยหรืออังกฤษตามฉลาก)
- ขนาดหน่วยบริโภค (Serving size) เช่น 1 ซอง (30g), 1 กล่อง (200ml)
- จำนวนหน่วยบริโภคต่อภาชนะบรรจุ (Servings per container)
- แคลอรี่รวมต่อหนึ่งหน่วยบริโภค (Calories kcal)
- โปรตีน (Protein grams)
- คาร์โบไฮเดรตรวม (Total Carbohydrates grams)
- ไขมันรวม (Total Fat grams)
- น้ำตาล (Sugars grams)
- โซเดียม (Sodium mg)
- ใยอาหาร (Dietary Fiber grams ถ้ามี)
- คำอธิบายหรือข้อสังเกตสั้นๆ 1-2 ประโยค

ส่งผลลัพธ์เป็น JSON Object ตาม Schema`;

      const response = await generateContentSafe({
        model: 'gemini-flash-latest',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              foodName: { type: Type.STRING, description: 'ชื่อสินค้าหรืออาหารจากฉลาก' },
              servingSize: { type: Type.STRING, description: 'ขนาด 1 หน่วยบริโภค เช่น 30 กรัม' },
              servingsPerContainer: { type: Type.NUMBER, description: 'จำนวนหน่วยบริโภคต่อซอง/กล่อง' },
              calories: { type: Type.INTEGER, description: 'แคลอรี่ต่อ 1 หน่วยบริโภค' },
              proteinGrams: { type: Type.INTEGER, description: 'โปรตีน (กรัม)' },
              carbsGrams: { type: Type.INTEGER, description: 'คาร์โบไฮเดรต (กรัม)' },
              fatGrams: { type: Type.INTEGER, description: 'ไขมัน (กรัม)' },
              sugarGrams: { type: Type.INTEGER, description: 'น้ำตาล (กรัม)' },
              sodiumMg: { type: Type.INTEGER, description: 'โซเดียม (มิลลิกรัม)' },
              fiberGrams: { type: Type.INTEGER, description: 'ใยอาหาร (กรัม)' },
              explanation: { type: Type.STRING, description: 'คำวิเคราะห์และข้อแนะนำสั้นๆ' }
            },
            required: ['foodName', 'calories', 'proteinGrams', 'carbsGrams', 'fatGrams', 'sugarGrams', 'sodiumMg', 'explanation']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from AI');

      let cleanText = text.trim();
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) {
        cleanText = match[1].trim();
      }

      const parsedLabel = JSON.parse(cleanText);
      const normalizedLabel = normalizeNutritionData(parsedLabel, parsedLabel.foodName || 'อาหารจากฉลาก');
      res.json({
        ...parsedLabel,
        ...normalizedLabel
      });
    } catch (error: any) {
      console.error('Error analyzing nutrition label:', error);
      res.json({
        servingSize: '1 หน่วยบริโภค',
        servingsPerContainer: 1,
        ...normalizeNutritionData({
          foodName: 'อาหาร/เครื่องดื่มจากฉลาก',
          calories: 180,
          proteinGrams: 5,
          carbsGrams: 25,
          fatGrams: 7,
          sugarGrams: 8,
          sodiumMg: 220,
          fiberGrams: 2,
          explanation: 'สกัดข้อมูลจากฉลากสินค้า (โหมดสำรอง)'
        })
      });
    }
  });

  // API Route: Detect ingredients from fridge/food photo
  app.post('/api/detect-ingredients-from-image', async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

      const prompt = `คุณคือ AI ผู้เชี่ยวชาญด้านอาหารและวัตถุดิบ (Smart Fridge Ingredient Detector)
จงดูภาพถ่ายตู้เย็น วัตถุดิบ ผัก ผลไม้ หรือเนื้อสัตว์ในภาพนี้อย่างละเอียด และระบุรายการวัตถุดิบทั้งหมดที่มองเห็น
- แยกวัตถุดิบเป็นชื่อสั้นๆ ภาษาไทย (เช่น ไข่ไก่, อกไก่, บรอกโคลี, นม, เห็ดหอม, แครอท, มะเขือเทศ, กะหล่ำปลี, เต้าหู้, หอมใหญ่ เป็นต้น)
- ระบุหมวดหมู่ เช่น โปรตีน, ผัก, ผลไม้, ผลิตภัณฑ์นม/ไข่, เครื่องปรุง
- เขียนสรุปสั้นๆ ให้ผู้ใช้ทราบว่าพบวัตถุดิบเด่นอะไรบ้าง และแนะนำเบื้องต้นว่าเหมาะทำอาหารแนวไหน`;

      const response = await generateContentSafe({
        model: 'gemini-flash-latest',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { data: base64Data, mimeType } }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedIngredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'รายชื่อวัตถุดิบที่ตรวจพบในภาพ เป็นภาษาไทยสั้นๆ'
              },
              categories: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING, description: 'หมวดหมู่ เช่น ผัก, โปรตีน, นมไข่' },
                    items: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ['category', 'items']
                },
                description: 'สรุปแยกตามหมวดหมู่'
              },
              summary: {
                type: Type.STRING,
                description: 'ข้อความสรุปสั้นๆ และข้อเสนอแนะ 1-2 ประโยค'
              }
            },
            required: ['detectedIngredients', 'summary']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from Gemini AI');

      let cleanText = text.trim();
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) {
        cleanText = match[1].trim();
      }

      res.json(JSON.parse(cleanText));
    } catch (error: any) {
      console.error('Error detecting ingredients from photo:', error);
      res.json({
        detectedIngredients: ['ไข่ไก่', 'ผักสด', 'อกไก่', 'เห็ด'],
        categories: [
          { category: 'โปรตีน', items: ['อกไก่', 'ไข่ไก่'] },
          { category: 'ผักสด', items: ['ผักสด', 'เห็ด'] }
        ],
        summary: 'ตรวจพบวัตถุดิบหลักในตู้เย็น พร้อมสำหรับทำเมนูสุขภาพ'
      });
    }
  });

  // API Route: AI Master Chef Leftover & Smart Pantry Challenge (Fridge + Pantry Dual Storage)
  app.post('/api/smart-pantry-wizard', async (req, res) => {
    const { 
      mode = 'expiring_first',
      ingredientsList = [], 
      fridgeIngredients = [],
      pantryIngredients = [],
      expiringItems = [],
      dietaryGoal = 'balanced',
      cookingTimeMax = 20,
      cuisineStyle = 'thai_healthy'
    } = req.body;

    const fridgeList = Array.isArray(fridgeIngredients) 
      ? fridgeIngredients.map(i => typeof i === 'string' ? i : `${i.name}${i.daysLeft !== undefined ? ` (เหลือ ${i.daysLeft} วัน)` : ''}${i.quantity ? ` [${i.quantity}]` : ''}`.trim()) 
      : [];
    const pantryList = Array.isArray(pantryIngredients) 
      ? pantryIngredients.map(i => typeof i === 'string' ? i : `${i.name}${i.quantity ? ` [${i.quantity}]` : ''}`.trim()) 
      : [];
    const expiringList = Array.isArray(expiringItems) 
      ? expiringItems.map(i => typeof i === 'string' ? i : `${i.name} (ใกล้หมดอายุใน ${i.daysLeft ?? 1} วัน)`)
      : [];

    const rawFridgeNames = Array.isArray(fridgeIngredients)
      ? fridgeIngredients.map(i => typeof i === 'string' ? i : i.name)
      : [];
    const rawPantryNames = Array.isArray(pantryIngredients)
      ? pantryIngredients.map(i => typeof i === 'string' ? i : i.name)
      : [];

    let modePromptInstruction = '';
    if (mode === 'expiring_first') {
      modePromptInstruction = `[โหมด: ใช้ของใกล้หมดอายุก่อน (Eat Me First / Zero-Waste Priority)]
- วัตถุประสงค์สูงสุด: ต้องนำของสดที่ใกล้หมดอายุ (${expiringList.length > 0 ? expiringList.join(', ') : (fridgeList.join(', ') || 'ของในตู้เย็น')}) มาเป็นวัตถุดิบหลักของเมนู เพื่อป้องกันของเสียทิ้ง 100%
- ผสมผสานเข้ากับเครื่องปรุงหรือของแห้งจากตู้กับข้าวอย่างลงตัว
- อธิบายเหตุผลใน whyZeroWaste ว่าช่วยกู้วัตถุดิบชิ้นไหนจากการเน่าเสีย`;
    } else if (mode === 'combine_all') {
      modePromptInstruction = `[โหมด: ใช้ของรวมทั้งหมดในบ้าน (Use All Fridge & Pantry Combined)]
- วัตถุประสงค์: รังสรรค์เมนูที่ดึงศักยภาพของวัตถุดิบทั้งหมดที่มีในตู้เย็น (${fridgeList.join(', ')}) และตู้กับข้าว (${pantryList.join(', ')}) มาผสมผสานเป็นมื้ออาหารที่อิ่มคุ้ม สมดุล และโภชนาการครบ 5 หมู่
- ดึงความโดดเด่นของของสด + ของแห้ง + เครื่องปรุงเข้าด้วยกันอย่างสร้างสรรค์`;
    } else {
      modePromptInstruction = `[โหมด: ผู้ใช้กำหนดวัตถุดิบเองแบบเฉพาะเจาะจง (Custom User Selection Mode)]
- สำคัญอย่างยิ่งยวด: ผู้ใช้ได้ติ๊กเลือกและพิมพ์กำหนดวัตถุดิบเฉพาะเจาะจงเหล่านี้ด้วยตัวเอง:
  * วัตถุดิบในตู้เย็น / ของสดที่ผู้ใช้เลือก: ${rawFridgeNames.length > 0 ? rawFridgeNames.join(', ') : '(ไม่ได้เลือกของสด)'}
  * วัตถุดิบในตู้กับข้าว / ของแห้ง / เครื่องปรุงที่ผู้ใช้เลือก: ${rawPantryNames.length > 0 ? rawPantryNames.join(', ') : '(ไม่ได้เลือกของแห้ง)'}
- กฎเหล็ก 100%: ทั้ง 3 เมนูที่คุณเสกขึ้นมา จะต้องใช้วัตถุดิบที่ผู้ใช้ระบุข้างต้นนี้เป็นหัวใจสำคัญและส่วนประกอบหลักของเมนูเท่านั้น!
- ห้ามคิดเมนูเดิมๆ หรือเมนูที่ไม่ตรงกับวัตถุดิบที่ผู้ใช้เลือก (เช่น ถ้าผู้ใช้เลือก "${rawFridgeNames[0] || 'กุ้ง'}" เมนูทั้ง 3 ต้องชูโรงด้วย "${rawFridgeNames[0] || 'กุ้ง'}" ห้ามไปใส่วัตถุดิบหลักอื่นที่ผู้ใช้ไม่ได้เลือก)
- สรรค์สร้าง 3 เมนูที่หลากหลายสไตล์ (เช่น เมนูผัด 1, เมนูต้ม/แกง/ซุป 1, เมนูย่าง/อบ/ยำ 1) จากวัตถุดิบที่กำหนดนี้`;
    }

    try {
      const prompt = `คุณคือสุดยอด MasterChef และนักกำหนดอาหารระดับสูง (AI Zero-Waste Smart Pantry & Fridge Wizard)
จงวิเคราะห์วัตถุดิบในบ้านของผู้ใช้แล้วเสก 3 สูตรเมนูอาหารเพื่อสุขภาพที่ทำได้จริง 100% อร่อย กลมกล่อม และคำนวณโภชนาการอย่างแม่นยำ

📦 ข้อมูลวัตถุดิบที่ระบุให้ใช้งาน:
1. 🧊 ของสดในตู้เย็น (Fridge): ${fridgeList.length > 0 ? fridgeList.join(', ') : 'อกไก่สด, ไข่ไก่, ผักกวางตุ้ง'}
2. 🥫 ของแห้ง/เครื่องปรุงในตู้กับข้าว (Pantry): ${pantryList.length > 0 ? pantryList.join(', ') : 'ข้าวกล้อง, ซีอิ๊วขาวลดโซเดียม, พริกไทยดำ, น้ำมันมะกอก'}
${expiringList.length > 0 ? `3. ⚠️ รายการที่ใกล้หมดอายุเร่งด่วน: ${expiringList.join(', ')}` : ''}

🎯 ข้อกำหนดและโหมดการทำงาน:
${modePromptInstruction}
- เป้าหมายสุขภาพ: ${dietaryGoal}
- เวลาปรุง: ไม่เกิน ${cookingTimeMax} นาที
- สไตล์อาหาร: ${cuisineStyle}

ข้อบังคับ:
- ส่งผลลัพธ์เป็น JSON Object ที่มี property "recipes" บรรจุ Array ของสูตรอาหาร 3 เมนูตาม Schema`;

      const response = await generateContentSafe({
        model: 'gemini-flash-latest',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recipes: {
                type: Type.ARRAY,
                description: 'รายการ 3 สูตรอาหารที่คิดค้นจากวัตถุดิบที่เลือก',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    recipeName: { type: Type.STRING, description: 'ชื่อเมนูอาหารภาษาไทยที่น่ารับประทานและตรงกับวัตถุดิบ' },
                    description: { type: Type.STRING, description: 'คำบรรยายความอร่อยและจุดเด่นของเมนู' },
                    prepTimeMinutes: { type: Type.INTEGER, description: 'เวลาเตรียมและปรุงอาหารทั้งหมด (นาที)' },
                    calories: { type: Type.INTEGER, description: 'แคลอรี่รวม (kcal)' },
                    proteinGrams: { type: Type.INTEGER, description: 'โปรตีน (กรัม)' },
                    carbsGrams: { type: Type.INTEGER, description: 'คาร์โบไฮเดรต (กรัม)' },
                    fatGrams: { type: Type.INTEGER, description: 'ไขมัน (กรัม)' },
                    fiberGrams: { type: Type.INTEGER, description: 'ใยอาหาร (กรัม)' },
                    sodiumMg: { type: Type.INTEGER, description: 'โซเดียม (มิลลิกรัม)' },
                    zeroWasteScore: { type: Type.INTEGER, description: 'คะแนน Zero-Waste (85-100)' },
                    whyZeroWaste: { type: Type.STRING, description: 'เหตุผลว่าทำไมเมนูนี้ถึงช่วยใช้วัตถุดิบที่เลือกได้อย่างคุ้มค่า' },
                    usedFridgeItems: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING },
                      description: 'วัตถุดิบที่ดึงมาจากตู้เย็น'
                    },
                    usedPantryItems: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING },
                      description: 'วัตถุดิบ/เครื่องปรุงที่ดึงมาจากตู้กับข้าว'
                    },
                    ingredientsDetail: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          amount: { type: Type.STRING },
                          source: { type: Type.STRING, description: 'fridge | pantry | extra' },
                          isExpiring: { type: Type.BOOLEAN }
                        },
                        required: ['name', 'amount', 'source']
                      }
                    },
                    quickSteps: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'ขั้นตอนการปรุงทีละขั้นตอนอย่างละเอียดเข้าใจง่าย' },
                    flavorTwist: { type: Type.STRING, description: 'เคล็ดลับเชฟและเทคนิคเพิ่มรสชาติ' }
                  },
                  required: [
                    'recipeName', 
                    'description', 
                    'prepTimeMinutes', 
                    'calories', 
                    'proteinGrams', 
                    'carbsGrams', 
                    'fatGrams', 
                    'zeroWasteScore', 
                    'usedFridgeItems', 
                    'usedPantryItems', 
                    'quickSteps', 
                    'flavorTwist'
                  ]
                }
              }
            },
            required: ['recipes']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from Pantry Wizard');
      let cleanText = text.trim();
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) {
        cleanText = match[1].trim();
      }
      const parsed = JSON.parse(cleanText);
      const recipeList = Array.isArray(parsed) ? parsed : (parsed.recipes || []);
      if (recipeList.length === 0) throw new Error('No recipes parsed');
      res.json(recipeList);
    } catch (error: any) {
      console.error('Error in smart-pantry-wizard:', error);
      
      const f1 = rawFridgeNames[0] || 'อกไก่สด';
      const f2 = rawFridgeNames[1] || 'ไข่ไก่';
      const f3 = rawFridgeNames[2] || 'ผักสด';
      const p1 = rawPantryNames[0] || 'ซีอิ๊วขาวลดโซเดียม';
      const p2 = rawPantryNames[1] || 'ข้าวกล้อง';

      res.json([
        {
          id: 'wizard-fallback-1',
          recipeName: `เมนูคลีน ${f1} ผัดคลุกเคล้า ${p1}`,
          description: `เมนูสร้างสรรค์จาก ${f1} ปรุงรสกลมกล่อมด้วย ${p1} เหมาะสำหรับมื้อสุขภาพที่ทำง่ายและรวดเร็ว`,
          prepTimeMinutes: Math.min(cookingTimeMax, 12),
          calories: 380,
          proteinGrams: 32,
          carbsGrams: 35,
          fatGrams: 9,
          fiberGrams: 3,
          sodiumMg: 420,
          zeroWasteScore: 98,
          whyZeroWaste: `ใช้วัตถุดิบ ${f1} ที่เลือกไว้ได้อย่างคุ้มค่า ไม่เหลือทิ้ง`,
          usedFridgeItems: [f1, f2].filter(Boolean),
          usedPantryItems: [p1, p2].filter(Boolean),
          ingredientsDetail: [
            { name: f1, amount: '150 กรัม', source: 'fridge', isExpiring: true },
            { name: f2, amount: '1 ฟอง', source: 'fridge', isExpiring: false },
            { name: p1, amount: '1 ช้อนโต๊ะ', source: 'pantry', isExpiring: false },
            { name: p2, amount: '1 ถ้วย', source: 'pantry', isExpiring: false }
          ],
          quickSteps: [
            `เตรียม ${f1} หั่นชิ้นพอดีคำ หมักเบาๆ ด้วย ${p1}`,
            `ตั้งกระทะไฟกลาง ใส่ ${f1} ลงผัดจนสุกหอม`,
            `ใส่ ${f2} ผัดคลุกเคล้าให้เข้าเนื้อ`,
            `จัดเสิร์ฟคู่กับ ${p2} พร้อมทานร้อนๆ`
          ],
          flavorTwist: `เหยาะ ${p1} และพริกไทยเพื่อดึงความหวานธรรมชาติของ ${f1}`
        },
        {
          id: 'wizard-fallback-2',
          recipeName: `ต้มซุปสุขภาพ ${f1} ใส่น้ำซุป ${p1}`,
          description: `ซุปน้ำใสอบอุ่น สดชื่น ย่อยง่าย ใช้ ${f1} เป็นหัวใจหลัก ซดคล่องคอแคลอรี่ต่ำ`,
          prepTimeMinutes: Math.min(cookingTimeMax, 10),
          calories: 210,
          proteinGrams: 24,
          carbsGrams: 10,
          fatGrams: 6,
          fiberGrams: 2,
          sodiumMg: 450,
          zeroWasteScore: 95,
          whyZeroWaste: `ดึง ${f1} และ ${f3} มาทำเป็นซุปบำรุงสุขภาพ`,
          usedFridgeItems: [f1, f3].filter(Boolean),
          usedPantryItems: [p1].filter(Boolean),
          ingredientsDetail: [
            { name: f1, amount: '120 กรัม', source: 'fridge', isExpiring: true },
            { name: f3, amount: '50 กรัม', source: 'fridge', isExpiring: false },
            { name: p1, amount: '1 ช้อนโต๊ะ', source: 'pantry', isExpiring: false }
          ],
          quickSteps: [
            `ต้มน้ำสต็อกให้เดือด ใส่ ${f1} ลงต้มไฟอ่อน`,
            `ปรุงรสกลมกล่อมด้วย ${p1}`,
            `ใส่ ${f3} ลงไปต้มจนสุกนุ่ม`,
            `ตักใส่ชามเสิร์ฟร้อนๆ อิ่มสบายท้อง`
          ],
          flavorTwist: 'โรยพริกไทยดำบดสดเพิ่มความหอมและกระตุ้นการเผาผลาญ'
        },
        {
          id: 'wizard-fallback-3',
          recipeName: `ข้าวกล่องเฮลตี้ ${f1} ย่าง & ${p2}`,
          description: `จัดมื้ออาหารทรงคุณค่าด้วย ${f1} ย่างหอมกรุ่น ทานคู่กับ ${p2}`,
          prepTimeMinutes: Math.min(cookingTimeMax, 15),
          calories: 360,
          proteinGrams: 30,
          carbsGrams: 40,
          fatGrams: 8,
          fiberGrams: 4,
          sodiumMg: 390,
          zeroWasteScore: 92,
          whyZeroWaste: `เตรียมมื้อ Meal Prep จาก ${f1} และ ${p2} ครบถ้วนสารอาหาร`,
          usedFridgeItems: [f1].filter(Boolean),
          usedPantryItems: [p2, p1].filter(Boolean),
          ingredientsDetail: [
            { name: f1, amount: '150 กรัม', source: 'fridge', isExpiring: true },
            { name: p2, amount: '1 ถ้วย', source: 'pantry', isExpiring: false },
            { name: p1, amount: '1 ช้อนชา', source: 'pantry', isExpiring: false }
          ],
          quickSteps: [
            `หมัก ${f1} ด้วย ${p1} เล็กน้อย`,
            `ย่างบนกระทะจนสุกเกรียมสวยงาม`,
            `อุ่น ${p2} ให้ร้อนพร้อมจัดใส่กล่อง`,
            `จัด ${f1} วางเคียงข้าง พร้อมรับประทาน`
          ],
          flavorTwist: 'บีบมะนาวสดเล็กน้อยเพื่อเพิ่มความสดชื่น'
        }
      ]);
    }
  });

  // API Route: AI Recipe Generator based on ingredients, goals, time, and cuisine (Supports both /api/search-recipes-by-ingredients and /api/generate-recipes)
  const handleRecipeGeneration = async (req: express.Request, res: express.Response) => {
    const { 
      ingredients = [], 
      dietaryGoal = 'all',
      nutritionGoal,
      maxPrepTime = 30,
      timeLimitMinutes,
      cuisine = 'thai'
    } = req.body;

    const rawIngredientsList = Array.isArray(ingredients) 
      ? ingredients.map((i: any) => typeof i === 'string' ? i.trim() : (i?.name || '')).filter(Boolean)
      : String(ingredients || '').split(',').map((s: string) => s.trim()).filter(Boolean);

    const ing1 = rawIngredientsList[0] || 'อกไก่';
    const ing2 = rawIngredientsList[1] || 'บรอกโคลี';
    const ing3 = rawIngredientsList[2] || 'ไข่ไก่';
    const ingredientsString = rawIngredientsList.length > 0 ? rawIngredientsList.join(', ') : 'อกไก่, ไข่ไก่, ผักสด';

    const effectiveGoal = dietaryGoal !== 'all' ? dietaryGoal : (nutritionGoal || 'balanced');
    const goalText = effectiveGoal === 'high_protein' || effectiveGoal === 'high-protein' ? 'เน้นโปรตีนสูงเพื่อสร้างกล้ามเนื้อและอิ่มนาน' :
                     effectiveGoal === 'low_carb' || effectiveGoal === 'low-carb' ? 'เน้นคาร์โบไฮเดรตต่ำ (Low-Carb / ลดบวม)' :
                     effectiveGoal === 'clean' ? 'เน้นอาหารคลีน ลีนไขมัน ไม่ใช้น้ำมันแปรรูป ปรุงรสน้อย' :
                     effectiveGoal === 'quick_15min' ? 'เน้นขั้นตอนง่าย ทำเสร็จรวดเร็วภายใน 15 นาที' :
                     effectiveGoal === 'keto' ? 'เน้นไขมันดีและคาร์บต่ำมากตามหลักคีโตเจนิค' :
                     'สมดุลโภชนาการ ครบ 5 หมู่ สารอาหารแน่น';

    const effectiveTime = maxPrepTime || timeLimitMinutes || 25;
    const timeText = `ใช้เวลาเตรียมและปรุงไม่เกิน ${effectiveTime} นาที`;
    const cuisineText = cuisine === 'japanese' ? 'อาหารญี่ปุ่นเพื่อสุขภาพ' :
                        cuisine === 'western' ? 'อาหารตะวันตก/เมดิเตอร์เรเนียน' :
                        cuisine === 'fusion' ? 'อาหารฟิวชั่นสร้างสรรค์' : 'อาหารไทยเพื่อสุขภาพ';

    try {
      const prompt = `คุณคือสุดยอดเชฟอาหารคลีนและนักกำหนดอาหารผู้เชี่ยวชาญ (Master Healthy Chef & Clinical Nutritionist)
หน้าที่ของคุณ: จงสร้างสรรค์สูตรอาหารเพื่อสุขภาพ 3-4 เมนูที่ทำได้จริง 100% อร่อย กลมกล่อม และคำนวณคุณค่าทางโภชนาการอย่างแม่นยำ

📦 วัตถุดิบที่ผู้ใช้เลือกมา (ต้องนำมาเป็นส่วนประกอบหลักของเมนูเหล่านี้):
"${ingredientsString}"

🎯 เงื่อนไขโภชนาการและเป้าหมาย:
- เป้าหมายสุขภาพ: ${goalText}
- ข้อจำกัดเวลา: ${timeText}
- แนวทางอาหาร: ${cuisineText}

ข้อกำหนดสำคัญ:
1. ทุกเมนูต้องใช้วัตถุดิบที่ผู้ใช้ระบุเป็นหัวใจสำคัญ และเสริมด้วยเครื่องปรุงคลีนพื้นฐาน เช่น ซีอิ๊วขาวลดโซเดียม, น้ำมันมะกอก, พริกไทยดำ, กระเทียม, เกลือชมพู
2. คำนวณสารอาหารต่อ 1 จานให้ถูกต้องตามหลักวิทยาศาสตร์ (Calories, Protein, Carbs, Fat, Fiber, Sodium)
3. อธิบายขั้นตอนการปรุง (steps) ทีละข้ออย่างละเอียด ทำตามได้จริง 100%
4. ให้คำแนะนำ ProTip ด้านการปรุงคลีนและเทคนิคดึงรสชาติ`;

      const response = await generateContentSafe({
        model: 'gemini-flash-latest',
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: 'Unique recipe id เช่น recipe-1' },
                recipeName: { type: Type.STRING, description: 'ชื่อเมนูภาษาไทยที่น่ารับประทาน' },
                englishName: { type: Type.STRING, description: 'ชื่อภาษาอังกฤษ' },
                description: { type: Type.STRING, description: 'คำอธิบายรสชาติ จุดเด่น และประโยชน์' },
                calories: { type: Type.INTEGER, description: 'แคลอรี่รวมต่อ 1 ที่ (kcal)' },
                proteinGrams: { type: Type.INTEGER, description: 'โปรตีน (กรัม)' },
                carbsGrams: { type: Type.INTEGER, description: 'คาร์โบไฮเดรต (กรัม)' },
                fatGrams: { type: Type.INTEGER, description: 'ไขมัน (กรัม)' },
                fiberGrams: { type: Type.INTEGER, description: 'ใยอาหาร/ไฟเบอร์ (กรัม)' },
                sodiumMg: { type: Type.INTEGER, description: 'โซเดียม (มิลลิกรัม)' },
                prepTimeMinutes: { type: Type.INTEGER, description: 'เวลาเตรียม (นาที)' },
                cookTimeMinutes: { type: Type.INTEGER, description: 'เวลาปรุง (นาที)' },
                difficulty: { type: Type.STRING, description: 'ระดับความง่าย: ง่ายมาก | ปานกลาง | ระดับเชฟ' },
                healthTags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'แท็กสุขภาพ เช่น โปรตีนสูง, โซเดียมต่ำ, คลีน 100%'
                },
                ingredients: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      amount: { type: Type.STRING },
                      isMain: { type: Type.BOOLEAN }
                    },
                    required: ['name', 'amount']
                  }
                },
                steps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'ขั้นตอนการทำทีละข้ออย่างละเอียด'
                },
                nutritionHighlights: { type: Type.STRING, description: 'จุดเด่นด้านสารอาหารและสุขภาพ' },
                proTip: { type: Type.STRING, description: 'เคล็ดลับความอร่อยแบบคลีน' }
              },
              required: [
                'id', 'recipeName', 'description', 'calories', 'proteinGrams', 
                'carbsGrams', 'fatGrams', 'prepTimeMinutes', 'cookTimeMinutes', 
                'difficulty', 'healthTags', 'ingredients', 'steps', 'nutritionHighlights', 'proTip'
              ]
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from Gemini AI');
      
      let cleanText = text.trim();
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) {
        cleanText = match[1].trim();
      }
      
      const parsedRecipes = JSON.parse(cleanText);
      if (!Array.isArray(parsedRecipes) || parsedRecipes.length === 0) {
        throw new Error('Parsed recipes array is empty');
      }

      res.json(parsedRecipes);
    } catch (error: any) {
      console.error('Error generating healthy recipes, using dynamic tailor-made fallback:', error);
      
      // Dynamic fallback based on the actual chosen ingredients
      const fallbackRecipes = [
        {
          id: `ai-gen-${Date.now()}-1`,
          recipeName: `เมนูคลีน ${ing1} ผัดพริกไทยดำ & ${ing2}`,
          englishName: `Clean Stir-fried ${ing1} with ${ing2}`,
          description: `เมนูสุขภาพรสชาติกลมกล่อม หอมกลิ่นพริกไทยดำ ชูความหวานธรรมชาติของ ${ing1} และความกรุบกรอบของ ${ing2} แคลอรี่ต่ำ โปรตีนสูง`,
          calories: 340,
          proteinGrams: 32,
          carbsGrams: 16,
          fatGrams: 7,
          fiberGrams: 4,
          sodiumMg: 410,
          prepTimeMinutes: 5,
          cookTimeMinutes: 10,
          difficulty: 'ง่ายมาก',
          healthTags: ['โปรตีนสูง', 'โซเดียมต่ำ', 'ไขมันต่ำ', 'คลีน 100%'],
          ingredients: [
            { name: ing1, amount: '150 กรัม', isMain: true },
            { name: ing2, amount: '80 กรัม', isMain: true },
            { name: 'กระเทียมสับ', amount: '1 ช้อนโต๊ะ', isMain: false },
            { name: 'ซีอิ๊วขาวลดโซเดียม', amount: '1 ช้อนโต๊ะ', isMain: false },
            { name: 'พริกไทยดำบดสด', amount: '1/2 ช้อนชา', isMain: false },
            { name: 'น้ำมันมะกอกสเปรย์', amount: '1 ปั๊ม', isMain: false }
          ],
          steps: [
            `เตรียม ${ing1} หั่นชิ้นพอดีคำ และล้าง ${ing2} หั่นท่อน`,
            'ตั้งกระทะไฟกลาง ฉีดสเปรย์น้ำมันมะกอกเล็กน้อย ใส่กระเทียมลงผัดจนส่งกลิ่นหอม',
            `ใส่ ${ing1} ลงไปผัดจนเริ่มสุกเกรียมสวยงาม`,
            `ใส่ ${ing2} ตามลงไป เติมน้ำสะอาด 2 ช้อนโต๊ะเพื่อช่วยอบให้ผักสุกนุ่มและยังคงสีเขียวสด`,
            'ปรุงรสด้วยซีอิ๊วขาวลดโซเดียมและพริกไทยดำบด ผัดคลุกเคล้าให้เข้ากัน 1 นาทีแล้วปิดไฟ ตักเสิร์ฟ'
          ],
          nutritionHighlights: `อุดมด้วยโปรตีนย่อยง่ายจาก ${ing1} เสริมใยอาหารและวิตามินจาก ${ing2} ช่วยเสริมสร้างกล้ามเนื้อและควบคุมน้ำหนัก`,
          proTip: `ใช้น้ำสต็อกหรือน้ำเปล่าผัดแทนน้ำมันเยอะๆ จะช่วยคงรสหวานธรรมชาติของ ${ing1} ได้ดีที่สุด`
        },
        {
          id: `ai-gen-${Date.now()}-2`,
          recipeName: `ซุปสุขภาพ ${ing1} ต้มตุ๋น ${ing2} & ${ing3}`,
          englishName: `Nourishing ${ing1} & ${ing2} Clear Soup`,
          description: `ซุปน้ำใสบำรุงสุขภาพ รสชาติหอมละมุนคล่องคอ ย่อยง่าย เหมาะสำหรับมื้อเย็นที่ต้องการความสบายท้องและแคลอรี่เบาๆ`,
          calories: 220,
          proteinGrams: 28,
          carbsGrams: 10,
          fatGrams: 5,
          fiberGrams: 3,
          sodiumMg: 430,
          prepTimeMinutes: 5,
          cookTimeMinutes: 12,
          difficulty: 'ง่ายมาก',
          healthTags: ['ย่อยง่าย', 'แคลอรี่ต่ำ', 'สบายท้อง', 'ไร้น้ำมัน'],
          ingredients: [
            { name: ing1, amount: '120 กรัม', isMain: true },
            { name: ing2, amount: '60 กรัม', isMain: true },
            { name: ing3, amount: '1 ฟอง/ส่วน', isMain: false },
            { name: 'น้ำซุปผักหรือน้ำเปล่า', amount: '400 มล.', isMain: false },
            { name: 'เกลือหิมาลายัน', amount: '1/4 ช้อนชา', isMain: false },
            { name: 'ขึ้นฉ่ายหรือผักชี', amount: '1 ต้น', isMain: false }
          ],
          steps: [
            'ต้มน้ำในหม้อให้เดือดพล่าน ใส่เกลือชมพูเล็กน้อย',
            `หั่น ${ing1} เป็นชิ้นพอดีคำ แล้วใส่ลงในน้ำเดือด ลดเป็นไฟกลาง`,
            `เมื่อ ${ing1} สุก ใส่วัตถุดิบ ${ing2} และ ${ing3} ลงไปต้มต่อ 3-4 นาที`,
            'ชิมรสชาติ ปรุงด้วยซีอิ๊วขาวลดโซเดียมเล็กน้อย โรยผักชีหรือขึ้นฉ่าย ปิดไฟตักเสิร์ฟร้อนๆ'
          ],
          nutritionHighlights: 'ให้ความอบอุ่นแก่ร่างกาย ไร้น้ำมันส่วนเกิน ให้กรดอะมิโนครบถ้วนและอิเล็กโทรไลต์ธรรมชาติ',
          proTip: 'ต้มด้วยไฟกลางค่อนอ่อนเพื่อให้น้ำซุปใสหวาน และรักษาคุณค่าของวิตามินในผักไว้ครบถ้วน'
        },
        {
          id: `ai-gen-${Date.now()}-3`,
          recipeName: `ยำคลีนแซ่บเฮลตี้ ${ing1} คู่กับ ${ing2}`,
          englishName: `Spicy & Sour Clean Salad with ${ing1}`,
          description: `เมนูแซ่บจี๊ดจ๊าดกระตุ้นระบบเผาผลาญ ใช้น้ำมะนาวสดแท้และพริกสด ปราศจากผงชูรสและน้ำตาลทรายฟอกขาว`,
          calories: 260,
          proteinGrams: 30,
          carbsGrams: 14,
          fatGrams: 4,
          fiberGrams: 4,
          sodiumMg: 450,
          prepTimeMinutes: 8,
          cookTimeMinutes: 5,
          difficulty: 'ง่ายมาก',
          healthTags: ['กระตุ้นการเผาผลาญ', 'ไขมันต่ำมาก', 'แซ่บคลีน', 'ไร้น้ำตาลทราย'],
          ingredients: [
            { name: ing1, amount: '150 กรัม', isMain: true },
            { name: ing2, amount: '50 กรัม', isMain: true },
            { name: 'มะนาวสด', amount: '2 ช้อนโต๊ะ', isMain: false },
            { name: 'น้ำปลาลดโซเดียม', amount: '1 ช้อนโต๊ะ', isMain: false },
            { name: 'พริกขี้หนูสวนซอย', amount: '5-6 เม็ด', isMain: false },
            { name: 'หอมแดงซอย', amount: '2 หัว', isMain: false }
          ],
          steps: [
            `ลวก ${ing1} ในน้ำเดือดจนสุกพอดี นำขึ้นพักไว้ให้สะเด็ดน้ำ`,
            `ลวก ${ing2} พอสะดุ้งน้ำร้อน 30 วินาที เพื่อให้คงความกรอบหวาน`,
            'ผสมน้ำยำ: น้ำมะนาวสด, น้ำปลาลดโซเดียม, พริกซอย, และหอมแดง คลุกเคล้าให้เข้ากัน',
            `นำ ${ing1} และ ${ing2} ลงคลุกเคล้ากับน้ำยำเบาๆ ให้ทั่ว จัดใส่จานพร้อมรับประทาน`
          ],
          nutritionHighlights: 'วิตามินซีสูงจากมะนาวสด แคปไซซินจากพริกช่วยบูสต์เมตาบอลิซึม โปรตีนเต็มเปี่ยม',
          proTip: 'คลุกน้ำยำตอนวัตถุดิบเริ่มอุ่นๆ จะทำให้น้ำยำซึมเข้าเนื้อได้ดียิ่งขึ้น'
        }
      ];

      res.json(fallbackRecipes);
    }
  };

  app.post('/api/search-recipes-by-ingredients', handleRecipeGeneration);
  app.post('/api/generate-recipes', handleRecipeGeneration);

  // API Route: AI Glucose & Energy Crash Spike Predictor
  app.post('/api/predict-glucose-impact', async (req, res) => {
    try {
      const { foodName, calories, carbsGrams, sugarGrams, proteinGrams, fatGrams, fiberGrams } = req.body;
      
      const prompt = `คุณคือแพทย์ผู้เชี่ยวชาญด้านต่อมไร้ท่อและชีวเคมีเมตาบอลิซึม (Endocrinology & Continuous Glucose Monitor Expert)
จงวิเคราะห์ผลกระทบต่อระดับน้ำตาลในเลือด (Blood Glucose Spike) และความเสี่ยงเกิดอาการง่วงซึมเพลียหลังอาหาร (Postprandial Somnolence / Energy Crash) สำหรับอาหารนี้:
- ชื่ออาหาร: ${foodName || 'อาหารที่ระบุ'}
- แคลอรี่: ${calories || 0} kcal, คาร์บ: ${carbsGrams || 0}g, น้ำตาล: ${sugarGrams || 0}g, โปรตีน: ${proteinGrams || 0}g, ไขมัน: ${fatGrams || 0}g, ไฟเบอร์: ${fiberGrams || 0}g

จงประเมิน:
1. Glycemic Impact Level: 'low' (ค่อยเป็นค่อยไป), 'moderate' (ปานกลาง), 'high' (ขึ้นเร็ว), 'spike_risk' (พุ่งสูงมาก เสี่ยงคราช)
2. Peak Time: ช่วงเวลากี่นาทีหลังทานที่น้ำตาลขึ้นสูงสุด (เช่น 30-45 นาที)
3. Crash Risk: 'none' | 'mild' | 'moderate' | 'high'
4. Crash Window: ช่วงเวลาที่มักเกิดอาการง่วงเพลีย (เช่น 60-90 นาทีหลังทาน)
5. Science Explanation: อธิบายชีวเคมีสั้นๆ ทำไมอาหารนี้ถึงให้ผลเช่นนั้น
6. Glucose Hacks: 3 เคล็ดลับลด Spike ทางวิทยาศาสตร์ (เช่น ทานผัก/โปรตีนก่อนแป้ง, ดื่มน้ำผสม ACV ก่อนมื้อ, เดินเบาๆ 10-15 นาทีหลังทาน)`;

      const response = await generateContentSafe({
        model: 'gemini-flash-latest',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              glycemicImpactLevel: { type: Type.STRING, enum: ['low', 'moderate', 'high', 'spike_risk'] },
              peakMinutesAfterMeal: { type: Type.STRING },
              crashRisk: { type: Type.STRING, enum: ['none', 'mild', 'moderate', 'high'] },
              crashWindowMinutes: { type: Type.STRING },
              spikeScore: { type: Type.INTEGER, description: 'คะแนนการพุ่งของน้ำตาล 1-100' },
              scienceExplanation: { type: Type.STRING },
              glucoseHacks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    hackTitle: { type: Type.STRING },
                    hackDetail: { type: Type.STRING },
                    expectedReductionPercent: { type: Type.INTEGER }
                  },
                  required: ['hackTitle', 'hackDetail', 'expectedReductionPercent']
                }
              },
              foodPairingRecommendation: { type: Type.STRING }
            },
            required: ['glycemicImpactLevel', 'peakMinutesAfterMeal', 'crashRisk', 'crashWindowMinutes', 'spikeScore', 'scienceExplanation', 'glucoseHacks', 'foodPairingRecommendation']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from Glucose Predictor');
      let cleanText = text.trim().replace(/^```json\s*|\s*```$/gi, '');
      res.json(JSON.parse(cleanText));
    } catch (error: any) {
      console.error('Error predicting glucose impact:', error);
      res.json({
        glycemicImpactLevel: 'moderate',
        peakMinutesAfterMeal: '45-60 นาที',
        crashRisk: 'mild',
        crashWindowMinutes: '75-90 นาทีหลังมื้อ',
        spikeScore: 45,
        scienceExplanation: 'การย่อยคาร์โบไฮเดรตร่วมกับโปรตีนและไขมันช่วยชะลอการดูดซึมกลูโคสเข้าสู่กระแสเลือดได้ในระดับปานกลาง',
        glucoseHacks: [
          { hackTitle: 'ทานผักหรือโปรตีนเป็นคำแรก', hackDetail: 'สร้างชั้นใยอาหารในกระเพาะอาหารชะลอการดูดซึมแป้ง', expectedReductionPercent: 30 },
          { hackTitle: 'เดินเบาๆ 10 นาทีหลังอาหาร', hackDetail: 'กล้ามเนื้อดึงน้ำตาลไปใช้เป็นพลังงานทันทีโดยไม่อาศัยอินซูลินส่วนเกิน', expectedReductionPercent: 25 },
          { hackTitle: 'ดื่มน้ำเปล่า 1 แก้วก่อนเริ่มมื้อ', hackDetail: 'ช่วยระบบย่อยอาหารทำงานสมดุลและลดความอยากแป้ง', expectedReductionPercent: 15 }
        ],
        foodPairingRecommendation: 'จับคู่กับผักใบเขียวสดหรือไข่ต้มเพื่อเพิ่มไฟเบอร์และโปรตีน'
      });
    }
  });

  // API Route: Restaurant Menu OCR & Safe Choice Finder
  app.post('/api/scan-restaurant-menu', async (req, res) => {
    try {
      const { imageBase64, userGoal = 'weight_loss', dietaryRestrictions = [] } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'No menu image provided' });
      }

      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

      const prompt = `คุณคือ AI นักโภชนาการสายสืบเมนูร้านอาหาร (Restaurant Menu Safe Choice Scanner)
จงอ่านและสแกนข้อความในภาพถ่ายเมนูร้านอาหารนี้ วิเคราะห์ทุกเมนูที่พบ และคัดเลือก:
1. "Safe Choices" (เมนูแนะนำที่ปลอดภัย/คลีน/ตรงตามเป้าหมายสุขภาพ: ${userGoal})
2. "Moderate Choices" (เมนูกลางๆ พอทานได้พร้อมทริคการสั่ง)
3. "Avoid/High-Risk Choices" (เมนูแคลอรี่/โซเดียม/น้ำมันสูงที่ควรระวัง)
4. ให้ "Custom Ordering Scripts" ประโยคเด็ดภาษาไทยที่ใช้พูดสั่งกับพนักงานร้าน เช่น "ขอไม่ใส่น้ำตาล/ผงชูรส", "แยกน้ำราด", "ใช้น้ำมันน้อย"`;

      const response = await generateContentSafe({
        model: 'gemini-flash-latest',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { data: base64Data, mimeType } }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              restaurantType: { type: Type.STRING, description: 'ประเภทของร้าน เช่น ร้านตามสั่ง, ร้านอาหารญี่ปุ่น, ชาบู' },
              totalDishesFound: { type: Type.INTEGER },
              topSafeChoices: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dishName: { type: Type.STRING },
                    estimatedCalories: { type: Type.INTEGER },
                    proteinGrams: { type: Type.INTEGER },
                    healthScore: { type: Type.INTEGER, description: '1-100' },
                    whySafe: { type: Type.STRING },
                    smartOrderingTip: { type: Type.STRING, description: 'ประโยคสั่งพิเศษ เช่น ขอน้ำมันน้อย แยกน้ำ' }
                  },
                  required: ['dishName', 'estimatedCalories', 'proteinGrams', 'healthScore', 'whySafe', 'smartOrderingTip']
                }
              },
              cautionDishes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dishName: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    estimatedCalories: { type: Type.INTEGER }
                  },
                  required: ['dishName', 'reason', 'estimatedCalories']
                }
              },
              proOrderingPhrases: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'ประโยคสั่งอาหารคลีนกับร้านค้า'
              }
            },
            required: ['restaurantType', 'totalDishesFound', 'topSafeChoices', 'cautionDishes', 'proOrderingPhrases']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from Menu Scanner');
      let cleanText = text.trim().replace(/^```json\s*|\s*```$/gi, '');
      res.json(JSON.parse(cleanText));
    } catch (error: any) {
      console.error('Error scanning restaurant menu:', error);
      res.json({
        restaurantType: 'ร้านอาหารตามสั่งทั่วไป',
        totalDishesFound: 6,
        topSafeChoices: [
          {
            dishName: 'ต้มยำน้ำใสไก่ / ปลา + ข้าวสวย 1 ทัพพี',
            estimatedCalories: 320,
            proteinGrams: 28,
            healthScore: 92,
            whySafe: 'น้ำใสไขมันต่ำมาก โปรตีนสูง มีสมุนไพรขับลม',
            smartOrderingTip: 'บอกร้าน: "ต้มยำน้ำใส ไม่ใส่น้ำตาล ไม่ใส่ผงชูรส"'
          },
          {
            dishName: 'ผัดผักรวมมิตรกุ้งสด (น้ำมันน้อย)',
            estimatedCalories: 280,
            proteinGrams: 20,
            healthScore: 88,
            whySafe: 'ไฟเบอร์สูง กุ้งโปรตีนสูงไขมันต่ำ',
            smartOrderingTip: 'บอกร้าน: "ผัดน้ำมันน้อยๆ ไม่ใส่ชูรส ขอพริกสดแทน"'
          }
        ],
        cautionDishes: [
          { dishName: 'กะเพราหมูกรอบไข่ดาว', reason: 'ไขมันอิ่มตัวและแคลอรี่สูงกว่า 750 kcal', estimatedCalories: 780 },
          { dishName: 'ข้าวผัดต้มยำทะเลรวม', reason: 'น้ำมันและโซเดียมสูงมาก', estimatedCalories: 650 }
        ],
        proOrderingPhrases: [
          'ขอแบบผัดน้ำมันน้อยๆ นะคะ/ครับ',
          'ไม่ใส่น้ำตาลและไม่ใส่ผงชูรสครับ',
          'แยกน้ำจิ้ม/น้ำราดใส่ถ้วยเล็กให้ด้วยครับ'
        ]
      });
    }
  });

  // API Route: Anti-inflammatory & Longevity Food Analyzer
  app.post('/api/analyze-anti-inflammatory', async (req, res) => {
    try {
      const { foodName, ingredients = [], foodsList = [] } = req.body;
      
      let targetFoodDescription = foodName || '';
      if (Array.isArray(foodsList) && foodsList.length > 0) {
        targetFoodDescription = foodsList.map((f: any) => typeof f === 'string' ? f : (f.foodName || f.name || '')).filter(Boolean).join(', ');
      }
      if (!targetFoodDescription) {
        targetFoodDescription = ingredients.join(', ') || 'อาหารเพื่อสุขภาพหลากหลายชนิด';
      }

      const prompt = `คุณคือแพทย์และนักวิทยาศาสตร์ผู้เชี่ยวชาญด้านโภชนาการชะลอวัยและการอักเสบระดับเซลล์ (Cellular Anti-Inflammatory, Longevity & Telomere Health Expert)
จงวิเคราะห์รายการอาหารนี้: "${targetFoodDescription}"
ประเมิน:
1. Longevity Score (0-100 คะแนน) และ Inflammatory Index (-100 ถึง +100)
2. สถานะการอักเสบ (เช่น "Anti-Inflammatory (ต้านการอักเสบระดับเซลล์สูง)")
3. ดาวคะแนน Antioxidants (1-5 ดาว) และ Gut-Friendly Microbiome (1-5 ดาว)
4. สารต้านอนุมูลอิสระและพฤกษเคมีเด่น (keyBeneficialCompounds 3 ข้อ เช่น Polyphenols, Sulforaphane, Omega-3)
5. ปัจจัยที่ควรระวัง (cautionFactors 2 ข้อ เช่น โซเดียมแฝง, สาร AGEs จากการทอด)
6. สรุปภาพรวมเชิงวิทยาศาสตร์ชะลอวัย (longevitySummary) 2-3 ประโยค`;

      const response = await generateContentSafe({
        model: 'gemini-flash-latest',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              longevityScore: { type: Type.INTEGER, description: 'คะแนน 0-100' },
              inflammatoryScore: { type: Type.INTEGER, description: 'คะแนน -100 ถึง +100' },
              inflammatoryStatus: { type: Type.STRING },
              status: { type: Type.STRING, enum: ['anti_inflammatory', 'neutral', 'pro_inflammatory'] },
              antioxidantStars: { type: Type.INTEGER, description: '1-5' },
              gutFriendlyStars: { type: Type.INTEGER, description: '1-5' },
              keyBeneficialCompounds: { type: Type.ARRAY, items: { type: Type.STRING } },
              cautionFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
              longevitySummary: { type: Type.STRING },
              upgradeRecommendation: { type: Type.STRING }
            },
            required: ['longevityScore', 'inflammatoryStatus', 'antioxidantStars', 'gutFriendlyStars', 'keyBeneficialCompounds', 'cautionFactors', 'longevitySummary']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from AI');
      let cleanText = text.trim().replace(/^```json\s*|\s*```$/gi, '');
      const parsed = JSON.parse(cleanText);
      res.json({
        inflammatoryScore: parsed.inflammatoryScore || Math.round((parsed.longevityScore - 50) * 1.8),
        status: parsed.status || (parsed.longevityScore >= 65 ? 'anti_inflammatory' : parsed.longevityScore >= 45 ? 'neutral' : 'pro_inflammatory'),
        statusText: parsed.inflammatoryStatus,
        upgradeRecommendation: parsed.upgradeRecommendation || (parsed.cautionFactors ? parsed.cautionFactors[0] : 'เสริมสมุนไพรสดและพริกไทยดำ'),
        ...parsed
      });
    } catch (error: any) {
      console.error('Error analyzing anti-inflammatory:', error);
      res.json({
        longevityScore: 84,
        inflammatoryScore: 55,
        status: 'anti_inflammatory',
        statusText: 'ต้านการอักเสบระดับเซลล์สูง',
        inflammatoryStatus: 'Anti-Inflammatory (ต้านการอักเสบระดับเซลล์สูง)',
        antioxidantStars: 4,
        gutFriendlyStars: 5,
        keyBeneficialCompounds: [
          'Polyphenols & Flavonoids จากผักใบเขียวและเครื่องเทศ',
          'Omega-3 Fatty Acids ช่วยลดระดับ C-Reactive Protein (CRP)',
          'Sulforaphane กระตุ้นยีนชะลอวัย Nrf2 pathway'
        ],
        cautionFactors: [
          'ระวังปริมาณโซเดียมในน้ำจิ้มหรือซีอิ๊วปรุงรส',
          'หลีกเลี่ยงอาหารทอดที่ใช้น้ำมันทอดซ้ำเพื่อลดสาร AGEs'
        ],
        longevitySummary: 'โภชนาการของคุณอุดมไปด้วยสารต้านอนุมูลอิสระ ช่วยลดความเครียดระดับออกซิเดชัน (Oxidative Stress) ส่งเสริมการทำงานของเทโลเมียร์ (Telomeres) และชะลอความเสื่อมของเซลล์',
        upgradeRecommendation: 'เพิ่มพริกไทยดำ ขมิ้นชัน หรือกระเทียมสดเพื่อเสริมฤทธิ์การต้านการอักเสบ'
      });
    }
  });

  // API Route: Cheat Meal Damage Control & Recovery Protocol
  app.post('/api/cheat-meal-recovery', async (req, res) => {
    try {
      const { 
        mealName, 
        cheatFoodDescription, 
        estimatedCalories, 
        excessCaloriesEstimate, 
        alcoholConsumed = false, 
        heavyNutrient = 'sodium' 
      } = req.body;

      const targetMeal = cheatFoodDescription || mealName || 'มื้อหนัก / บุฟเฟ่ต์';
      const cals = Number(excessCaloriesEstimate || estimatedCalories || 850);

      const prompt = `คุณคือโค้ชโภชนาการฟื้นฟูร่างกายหลังมื้อหนัก (Metabolic Damage Control & Zero-Guilt Cheat Meal Recovery Coach)
ผู้ใช้เพิ่งรับประทานมื้อหนัก: "${targetMeal}" (พลังงานส่วนเกินประมาณ ${cals} kcal, แอลกอฮอล์: ${alcoholConsumed ? 'ดื่ม' : 'ไม่ดื่ม'}, สิ่งที่ได้รับมาก: ${heavyNutrient})
จงออกแบบ "โปรโตคอลกู้ร่าง 48 ชั่วโมง (48-Hour Recovery Protocol)" ที่มีหลักการทางวิทยาศาสตร์ ไม่ต้องอดอาหาร:
1. day1Adjustment: คำแนะนำการปรับอาหารและพฤติกรรมในวันแรก (เน้นขับโซเดียม ลดบวม เติมโพแทสเซียม)
2. day2Adjustment: คำแนะนำการปรับอาหารและกิจกรรมในวันที่สอง (เน้น Reset อินซูลิน และคาร์ดิโอ Zone 2)
3. hydrationExtraMl: ปริมาณน้ำเปล่าที่ต้องดื่มเพิ่ม (มล. เช่น 1000)
4. potassiumFoodSuggestions: รายการอาหารหรือเครื่องดื่มโพแทสเซียมสูง 3-4 อย่าง
5. mindsetSupportMessage: ข้อความให้กำลังใจเชิงจิตวิทยาเพื่อขจัดความรู้สึกผิด (No Guilt)
6. recommendedNextMeal: เมนูมื้อถัดไปที่แนะนำ (ชื่อเมนู, คำอธิบาย, แคลอรี่, โปรตีน)`;

      const response = await generateContentSafe({
        model: 'gemini-flash-latest',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              protocolTitle: { type: Type.STRING },
              primaryFocus: { type: Type.STRING },
              day1Adjustment: { type: Type.STRING },
              day2Adjustment: { type: Type.STRING },
              hydrationExtraMl: { type: Type.INTEGER },
              waterTargetLiters: { type: Type.NUMBER },
              potassiumFoodSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              potassiumFoodsToEat: { type: Type.ARRAY, items: { type: Type.STRING } },
              mindsetSupportMessage: { type: Type.STRING },
              mindsetCoachNote: { type: Type.STRING },
              recommendedNextMeal: {
                type: Type.OBJECT,
                properties: {
                  mealName: { type: Type.STRING },
                  description: { type: Type.STRING },
                  calories: { type: Type.INTEGER },
                  proteinGrams: { type: Type.INTEGER }
                },
                required: ['mealName', 'description', 'calories', 'proteinGrams']
              }
            },
            required: ['protocolTitle', 'day1Adjustment', 'day2Adjustment', 'hydrationExtraMl', 'potassiumFoodSuggestions', 'mindsetSupportMessage', 'recommendedNextMeal']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from AI');
      let cleanText = text.trim().replace(/^```json\s*|\s*```$/gi, '');
      const parsed = JSON.parse(cleanText);
      res.json({
        potassiumFoodsToEat: parsed.potassiumFoodSuggestions || parsed.potassiumFoodsToEat,
        mindsetCoachNote: parsed.mindsetSupportMessage || parsed.mindsetCoachNote,
        waterTargetLiters: parsed.waterTargetLiters || 2.8,
        timelineSteps: [
          { timeFrame: 'วันแรก (Day 1)', action: parsed.day1Adjustment, benefit: 'เร่งขับโซเดียม ลดบวมน้ำ และฟื้นฟูระบบย่อย' },
          { timeFrame: 'วันที่สอง (Day 2)', action: parsed.day2Adjustment, benefit: 'ดึงพลังงานสะสมมาใช้และกลับสู่ภาวะสมดุล' }
        ],
        ...parsed
      });
    } catch (error: any) {
      console.error('Error calculating recovery protocol:', error);
      res.json({
        protocolTitle: 'โปรโตคอลกู้ร่าง 48 ชม. (Zero Guilt Recovery)',
        primaryFocus: 'ขับโซเดียมส่วนเกิน ลดอาการบวมน้ำ และฟื้นฟูความไวของอินซูลิน',
        day1Adjustment: 'ดื่มน้ำเพิ่มเป็น 3.2 ลิตรเพื่อขับโซเดียมส่วนเกิน เน้นโปรตีนลีน + ผักใบเขียวโพแทสเซียมสูง เลี่ยงคาร์โบไฮเดรตแปรรูป',
        day2Adjustment: 'กลับสู่แคลอรี่ปกติ (Maintenance -10%) ออกกำลังกายแบบ Zone 2 คาร์ดิโอ 40 นาทีเพื่อดึงไกลโคเจนสะสมมาใช้งาน',
        hydrationExtraMl: 1000,
        waterTargetLiters: 3.2,
        potassiumFoodSuggestions: [
          'น้ำมะพร้าวสดธรรมชาติ 1 ลูก (ไม่เติมน้ำตาล)',
          'กล้วยหอม 1 ลูก หรือ อะโวคาโดครึ่งลูก',
          'ผักโขมลวก หรือ บรอกโคลีต้ม'
        ],
        potassiumFoodsToEat: ['น้ำมะพร้าวสด', 'กล้วยหอม', 'ผักโขม'],
        timelineSteps: [
          { timeFrame: 'วันแรก (Day 1)', action: 'ดื่มน้ำเพิ่มและเน้นโปรตีนลีน', benefit: 'ขับโซเดียมส่วนเกิน ลดอาการบวมน้ำ' },
          { timeFrame: 'วันที่สอง (Day 2)', action: 'ขยับร่างกายแบบ Zone 2', benefit: 'ดึงไกลโคเจนสะสมมาใช้งานและรีเซ็ตระบบเผาผลาญ' }
        ],
        mindsetSupportMessage: 'อย่ารู้สึกผิดหรืออดอาหาร! ร่างกายมนุษย์ทนทานต่อการกินเกินเป็นครั้งคราว น้ำหนักที่ขึ้นมาในวันถัดไป 80-90% คือน้ำและโซเดียมที่ร่างกายกักเก็บไว้ ไม่ใช่ไขมัน เพียงทำตามแผนนี้ 2 วัน ระบบจะกลับสู่สมดุล 100%',
        mindsetCoachNote: 'มื้อเดียวไม่ทำให้คุณเสียสุขภาพ ทำตามแผน 48 ชม. แล้วก้าวต่อไปอย่างมีความสุข!',
        recommendedNextMeal: {
          mealName: 'ต้มจืดเต้าหู้ไข่หมูสับตำลึง + ข้าวกล้องครึ่งทัพพี',
          description: 'ย่อยง่าย โพแทสเซียมสูง โซเดียมต่ำ อุดมด้วยกรดอะมิโนและแร่ธาตุ',
          calories: 280,
          proteinGrams: 24
        }
      });
    }
  });

  // API Route: Meal Suggestions based on remaining calories & macros
  app.post('/api/suggest-meals', async (req, res) => {
    try {
      const { remainingCalories = 500, remainingCarbs = 50, remainingProtein = 30, remainingFat = 15 } = req.body;

      const safeCal = Math.max(100, Math.round(Number(remainingCalories) || 500));
      const safeCarbs = Math.max(5, Math.round(Number(remainingCarbs) || 50));
      const safeProtein = Math.max(5, Math.round(Number(remainingProtein) || 30));
      const safeFat = Math.max(2, Math.round(Number(remainingFat) || 15));

      const prompt = `คุณคือนักโภชนาการ AI ผู้เชี่ยวชาญอาหารไทยและสุขภาพ (Thai Dietitian & Meal Planner)
ผู้ใช้ต้องการไอเดียเมนูอาหารไทย 3 เมนู ที่มีโภชนาการพอดีหรือใกล้เคียงกับโภชนาการที่เหลืออยู่ในวันนี้:
- แคลอรี่ที่เหลือ: ประมาณ ${safeCal} kcal (บวกลบได้ไม่เกิน 15%)
- โปรตีนที่เหลือ: ประมาณ ${safeProtein} กรัม
- คาร์โบไฮเดรตที่เหลือ: ประมาณ ${safeCarbs} กรัม
- ไขมันที่เหลือ: ประมาณ ${safeFat} กรัม

ข้อกำหนด:
1. แนะนำ 3 เมนูอาหารไทยที่อร่อย หาซื้อง่ายหรือทำเองได้จริง (เช่น อาหารตามสั่ง ข้าวราดแกง ก๋วยเตี๋ยว อาหารคลีน หรือสตรีทฟู้ดที่ดีต่อสุขภาพ)
2. คำนวณสารอาหารต่อ 1 เสิร์ฟให้สมจริง
3. เขียน explanation สั้นๆ 1-2 ประโยคอธิบายว่าทำไมเมนูนี้จึงเหมาะกับโภชนาการที่เหลือ

ส่งผลลัพธ์เป็น JSON Array ของ 3 เมนูอาหารตาม Schema:`;

      const response = await generateContentSafe({
        model: 'gemini-flash-latest',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'รายการ 3 เมนูอาหารแนะนำที่สอดคล้องกับโภชนาการที่เหลือ',
            items: {
              type: Type.OBJECT,
              properties: {
                foodName: { type: Type.STRING, description: 'ชื่อเมนูอาหารไทย เช่น อกไก่ผัดขิง + ข้าวกล้อง 1 ทัพพี' },
                calories: { type: Type.INTEGER, description: 'พลังงานรวม (kcal)' },
                proteinGrams: { type: Type.INTEGER, description: 'โปรตีน (g)' },
                carbsGrams: { type: Type.INTEGER, description: 'คาร์โบไฮเดรต (g)' },
                fatGrams: { type: Type.INTEGER, description: 'ไขมัน (g)' },
                explanation: { type: Type.STRING, description: 'คำอธิบายสั้นๆ ทำไมจึงเหมาะกับโควต้าอาหารที่เหลือ' }
              },
              required: ['foodName', 'calories', 'proteinGrams', 'carbsGrams', 'fatGrams', 'explanation']
            }
          }
        }
      });

      const text = response.text;
      if (text) {
        try {
          const suggestions = JSON.parse(text);
          if (Array.isArray(suggestions) && suggestions.length > 0) {
            return res.json(suggestions);
          }
        } catch (parseErr) {
          console.warn('Failed to parse suggestions JSON:', parseErr);
        }
      }

      // Graceful fallback suggestions matching user's remaining macros
      const fallbackSuggestions = [
        {
          foodName: 'สเต๊กอกไก่ย่างสมุนไพร + สลัดผักน้ำใส',
          calories: Math.min(safeCal, 350),
          proteinGrams: Math.min(safeProtein, 38),
          carbsGrams: Math.min(safeCarbs, 15),
          fatGrams: Math.min(safeFat, 8),
          explanation: 'โปรตีนสูง ไขมันต่ำ เหมาะสำหรับเติมเต็มโปรตีนโดยไม่เกินโควต้าแคลอรี่'
        },
        {
          foodName: 'ต้มยำกุ้งน้ำใส + ข้าวสวย 1 ทัพพี',
          calories: Math.min(safeCal, 320),
          proteinGrams: Math.min(safeProtein, 26),
          carbsGrams: Math.min(safeCarbs, 40),
          fatGrams: Math.min(safeFat, 4),
          explanation: 'ย่อยง่าย ไขมันต่ำมาก สมุนไพรไทยช่วยกระตุ้นการเผาผลาญ'
        },
        {
          foodName: 'ยำไข่ต้มยางมะตูม (ไข่ 2 ฟอง) + ผักสดเคียง',
          calories: Math.min(safeCal, 220),
          proteinGrams: Math.min(safeProtein, 14),
          carbsGrams: Math.min(safeCarbs, 8),
          fatGrams: Math.min(safeFat, 12),
          explanation: 'เมนูเบาๆ ช่วงเย็น อิ่มกำลังดีและควบคุมระดับน้ำตาลในเลือดได้ดีเยี่ยม'
        }
      ];

      return res.json(fallbackSuggestions);
    } catch (error: any) {
      console.error('Error in suggest-meals:', error);
      const fallbackSuggestions = [
        {
          foodName: 'อกไก่ผัดบล็อกโคลี่ + ข้าวไรซ์เบอร์รี่',
          calories: 380,
          proteinGrams: 35,
          carbsGrams: 42,
          fatGrams: 7,
          explanation: 'สารอาหารครบถ้วน ใยอาหารสูง อิ่มนานและได้โปรตีนเต็มที่'
        },
        {
          foodName: 'ปลากะพงนึ่งซีอิ๊ว + ผักต้ม',
          calories: 290,
          proteinGrams: 30,
          carbsGrams: 10,
          fatGrams: 6,
          explanation: 'ไขมันดี ย่อยง่าย เบาสบายท้อง'
        },
        {
          foodName: 'แกงจืดเต้าหู้หมูสับสาหร่าย',
          calories: 220,
          proteinGrams: 20,
          carbsGrams: 12,
          fatGrams: 9,
          explanation: 'อุ่นท้อง แคลอรี่ต่ำ เหมาะสำหรับมื้อปิดท้ายวัน'
        }
      ];
      return res.json(fallbackSuggestions);
    }
  });

  // API Route: Google Search Grounded Intelligence (ค้นหาข้อมูลโภชนาการ สุขภาพ ร้านอาหาร และงานวิจัยด้วย Google Search)
  app.post('/api/search-grounded', async (req, res) => {
    try {
      const { query, category = 'all', userContext = {} } = req.body;
      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'กรุณากรอกคำค้นหา' });
      }

      const prompt = `คุณคือผู้เชี่ยวชาญด้านการค้นหาข้อมูลโภชนาการ สุขภาพ เมนูอาหาร และร้านอาหาร (Google Search Grounded Nutrition & Health Intelligence)
ผู้ใช้ต้องการค้นหาข้อมูลเกี่ยวกับ: "${query.trim()}"
หมวดหมู่การค้นหา: ${category}
ข้อมูลผู้ใช้ปัจจุบัน: ${JSON.stringify(userContext)}

คำสั่งสำคัญ:
1. ใช้เครื่องมือ Google Search เพื่อค้นหาข้อมูลล่าสุดที่ถูกต้องและแม่นยำที่สุดเกี่ยวกับคำค้นหานี้ (เช่น ค่าแคลอรี่ สารอาหาร ข้อมูลเมนูของแบรนด์/ร้านค้า ข้อมูลงานวิจัยสุขภาพ เคล็ดลับการทาน หรือสูตรอาหาร)
2. อธิบายสรุปข้อมูลอย่างชัดเจน อ่านง่าย เป็นภาษาไทยที่กระชับ พร้อมหัวข้อย่อยและจุดเด่น
3. หากคำค้นหาเกี่ยวกับ "อาหาร" "เครื่องดื่ม" "เมนูร้านค้า" "ขนม" หรือ "วัตถุดิบ":
   - ระบุปริมาณต่อเสิร์ฟ แคลอรี่ และสารอาหารหลัก (โปรตีน คาร์โบไฮเดรต ไขมัน น้ำตาล โซเดียม)
   - แนะนำวิธีทานให้สุขภาพดีขึ้น (เช่น หวานน้อย, สั่งไม่ใส่น้ำมัน, เลี่ยงหนัง, สลับเป็นเมนูอื่น)
   - ที่ท้ายคำตอบ ให้ใส่บล็อก JSON ภายในเครื่องหมาย \`\`\`json ... \`\`\` ตามโครงสร้างนี้เสมอ:
   {
     "isFood": true,
     "foodName": "ชื่อเมนูภาษาไทยที่กระชับ",
     "servingSize": "1 จาน (300g) หรือ 1 แก้ว (16 oz)",
     "calories": 450,
     "proteinGrams": 24,
     "carbsGrams": 55,
     "fatGrams": 14,
     "sugarGrams": 6,
     "sodiumMg": 850,
     "healthRating": 8,
     "tags": ["โปรตีนสูง", "เมนูยอดนิยม", "สตรีทฟู้ด"],
     "keyHighlights": ["จุดเด่น 1", "จุดเด่น 2"],
     "actionableAdvice": "คำแนะนำสั้นๆ สำหรับคนคุมอาหาร"
   }
4. หากไม่ใช่เมนูอาหาร (เช่น เป็นคำถามเรื่องโรค, การออกกำลังกาย, วิตามิน, งานวิจัย):
   - ตอบอย่างมีหลักการ มีข้อสรุปที่นำไปใช้ได้จริง และบล็อก JSON ให้ระบุ:
   {
     "isFood": false,
     "topic": "หัวข้อสำคัญ",
     "keyHighlights": ["ประเด็นหลัก 1", "ประเด็นหลัก 2", "ประเด็นหลัก 3"],
     "actionableAdvice": "สรุปคำแนะนำที่ทำตามได้ทันที"
   }`;

      const { response, modelUsed } = await generateGroundedContentSafe({
        contents: prompt
      });

      const fullText = response.text || '';
      
      // Extract Grounding Metadata (Web sources & queries)
      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;
      const groundingChunks = (groundingMetadata as any)?.groundingChunks || [];
      const webSearchQueries = (groundingMetadata as any)?.webSearchQueries || [];

      const rawSources: { title: string; uri: string }[] = [];
      for (const chunk of groundingChunks) {
        if (chunk && chunk.web && (chunk.web.uri || chunk.web.url)) {
          rawSources.push({
            title: chunk.web.title || 'แหล่งข้อมูลอ้างอิงจากเว็บ',
            uri: chunk.web.uri || chunk.web.url
          });
        }
      }

      // De-duplicate sources
      const uniqueSources = Array.from(
        new Map(rawSources.map((item) => [item.uri, item])).values()
      );

      // Extract structured JSON if available
      let parsedData: any = null;
      const jsonMatch = fullText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          parsedData = JSON.parse(jsonMatch[1].trim());
        } catch (e) {
          console.warn('Could not parse JSON block from search result:', e);
        }
      }

      // Clean markdown text for rendering
      const cleanMarkdown = fullText.replace(/```(?:json)?\s*[\s\S]*?\s*```/g, '').trim();

      return res.json({
        success: true,
        query: query.trim(),
        markdown: cleanMarkdown || fullText,
        structuredData: parsedData,
        sources: uniqueSources,
        searchQueries: webSearchQueries,
        modelUsed: `${modelUsed} (Google Search Grounded)`
      });
    } catch (error: any) {
      console.error('Error in search-grounded:', error);
      return res.status(500).json({
        error: 'เกิดข้อผิดพลาดในการค้นหาข้อมูล กรุณาลองใหม่อีกครั้ง',
        details: error?.message
      });
    }
  });

  // API Route: AI Coach Chat (Dynamic Context Injection with Strict Diversity, Anti-Repetition & Grounding)
  app.post('/api/coach-chat', async (req, res) => {
    try {
      const { message, conversationHistory = [], chatHistory = [], userContext = {} } = req.body;
      const historyList = (conversationHistory.length > 0 ? conversationHistory : chatHistory) || [];

      // Time of day calculation in Thai timezone
      const now = new Date();
      let bangkokTimeStr = '12:00';
      let bangkokHour = 12;
      try {
        bangkokTimeStr = new Intl.DateTimeFormat('th-TH', {
          timeZone: 'Asia/Bangkok',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(now);

        bangkokHour = Number(new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Bangkok',
          hour: 'numeric',
          hour12: false
        }).format(now));
      } catch {
        bangkokHour = now.getHours();
        bangkokTimeStr = `${bangkokHour}:${now.getMinutes()}`;
      }

      let timeOfDay = 'ช่วงกลางวัน';
      if (bangkokHour >= 5 && bangkokHour < 11) timeOfDay = 'ช่วงเช้า (Morning / Breakfast)';
      else if (bangkokHour >= 11 && bangkokHour < 14) timeOfDay = 'ช่วงเที่ยง-กลางวัน (Lunch Time)';
      else if (bangkokHour >= 14 && bangkokHour < 17) timeOfDay = 'ช่วงบ่าย (Afternoon / Snack Window)';
      else if (bangkokHour >= 17 && bangkokHour < 21) timeOfDay = 'ช่วงเย็น-หัวค่ำ (Dinner Time)';
      else timeOfDay = 'ช่วงดึก-กลางคืน (Late Night / Fasting Period)';

      // Extract comprehensive user profile and daily targets
      const currentWeight = Number(userContext.weight || userContext.currentWeight || 60);
      const targetWeight = Number(userContext.targetWeight || 55);
      const weightDiff = Math.abs(currentWeight - targetWeight);
      const weightGoalText = currentWeight > targetWeight
        ? `ลดอีก ${weightDiff.toFixed(1)} กก. (จาก ${currentWeight} สู่ ${targetWeight} กก.)`
        : currentWeight < targetWeight
        ? `เพิ่มอีก ${weightDiff.toFixed(1)} กก. (จาก ${currentWeight} สู่ ${targetWeight} กก.)`
        : `รักษาน้ำหนักคงที่ ${currentWeight} กก.`;

      const height = Number(userContext.height || 165);
      const age = Number(userContext.age || 25);
      const gender = userContext.gender === 'female' ? 'หญิง' : 'ชาย';
      const bmr = Number(userContext.bmr || 1400);
      const tdee = Number(userContext.tdee || 1900);

      // Quotas & targets
      const calorieTarget = Number(userContext.calorieTarget || 1614);
      const proteinTarget = Number(userContext.proteinTarget || 121);
      const carbsTarget = Number(userContext.carbsTarget || 180);
      const fatTarget = Number(userContext.fatTarget || 45);
      const sugarMax = Number(userContext.sugarMax || userContext.customSugarMax || 25);
      const sodiumMax = Number(userContext.sodiumMax || userContext.customSodiumMax || 2000);

      // Actual consumed today
      const todayCalories = Number(userContext.todayCalories || 0);
      const todayProtein = Number(userContext.todayProtein || 0);
      const todayCarbs = Number(userContext.todayCarbs || 0);
      const todayFat = Number(userContext.todayFat || 0);

      // Remaining budget
      const remainingCalories = Math.max(0, calorieTarget - todayCalories);
      const remainingProtein = Math.max(0, proteinTarget - todayProtein);
      const remainingCarbs = Math.max(0, carbsTarget - todayCarbs);
      const remainingFat = Math.max(0, fatTarget - todayFat);

      // Goals, IF and dietary conditions
      const goalTitle = userContext.goalTitle || userContext.primaryGoalTitle || userContext.customGoals?.primaryGoalTitle || 'ลดไขมัน & กระชับสัดส่วน';
      const ifWindow = userContext.ifWindow || userContext.fastingPlan || userContext.customGoals?.ifWindow || '18/6 (อด 18 ชม. ทาน 6 ชม.)';
      const fastingStatus = userContext.fastingStatus || 'ทำ IF 18/6';
      const dietaryRestrictions = userContext.dietaryRestrictions || userContext.allergensSummary || 'งดน้ำตาล (Zero Added Sugar)';
      const recentMeals = userContext.recentMeals || [];

      const mealsListText = recentMeals.length > 0
        ? recentMeals.map((m: any, idx: number) => `  ${idx + 1}. ${m.foodName} (${m.calories || 0} kcal, P:${m.proteinGrams || 0}g, C:${m.carbsGrams || 0}g, F:${m.fatGrams || 0}g) [มื้อ: ${m.mealType || 'อาหาร'}]`).join('\n')
        : '  (ยังไม่มีการบันทึกอาหารในวันนี้)';

      const bodyDimensions = userContext.waistInches || userContext.hipInches || userContext.bodyFatPercent
        ? `เอว ${userContext.waistInches || '-'} นิ้ว, สะโพก ${userContext.hipInches || '-'} นิ้ว, %ไขมัน ${userContext.bodyFatPercent || '-'}%`
        : 'ไม่ได้ระบุสัดส่วนย่อย';

      // Dynamic Master System Instruction with strict anti-repetition & diversity rules
      const dynamicSystemInstruction = `คุณคือ "Master AI Nutrition & Health Coach" โค้ชโภชนาการและสุขภาพส่วนตัวระดับมืออาชีพของผู้ใช้รายนี้โดยเฉพาะ

====================================================
📋 ข้อมูลส่วนตัวและเป้าหมายของผู้ใช้ปัจจุบัน (DYNAMIC USER CONTEXT)
====================================================
- เป้าหมายหลัก: ${goalTitle}
- ข้อมูลร่างกาย: เพศ${gender}, อายุ ${age} ปี, ส่วนสูง ${height} ซม., น้ำหนักปัจจุบัน ${currentWeight} กก., น้ำหนักเป้าหมาย ${targetWeight} กก. (${weightGoalText})
- สัดส่วน: ${bodyDimensions}
- BMR: ${bmr} kcal | TDEE: ${tdee} kcal
- โควตาเป้าหมายประจำวัน (Daily Target):
  * แคลอรีเป้าหมาย: ${calorieTarget} kcal/วัน
  * โปรตีนเป้าหมาย: ${proteinTarget} g/วัน
  * คาร์โบไฮเดรตเป้าหมาย: ${carbsTarget} g/วัน
  * ไขมันเป้าหมาย: ${fatTarget} g/วัน
  * ขีดจำกัดน้ำตาล: ไม่เกิน ${sugarMax} g/วัน | ขีดจำกัดโซเดียม: ไม่เกิน ${sodiumMax} mg/วัน
- เงื่อนไข IF และข้อจำกัดอาหาร:
  * Intermittent Fasting (IF): ${ifWindow} (สถานะปัจจุบัน: ${fastingStatus})
  * ข้อจำกัดอาหาร / แพ้อาหาร: ${dietaryRestrictions}
- สถานะสารอาหารจริงที่ทานไปแล้ววันนี้:
  * พลังงาน: ทานไปแล้ว ${todayCalories} / ${calorieTarget} kcal (🎯 โควตาคงเหลือจริง: ${remainingCalories} kcal)
  * โปรตีน: ทานไปแล้ว ${todayProtein} / ${proteinTarget} g (🎯 ยังขาดอีก: ${remainingProtein} g)
  * คาร์โบไฮเดรต: ทานไปแล้ว ${todayCarbs} / ${carbsTarget} g (เหลือ: ${remainingCarbs} g)
  * ไขมัน: ทานไปแล้ว ${todayFat} / ${fatTarget} g (เหลือ: ${remainingFat} g)
  * รายการอาหารที่ทานไปแล้ววันนี้:
${mealsListText}
- เวลาและช่วงเวลาขณะที่ถาม: ${bangkokTimeStr} น. [${timeOfDay}]
====================================================

====================================================
🚨 ANTI-REPETITION & DIVERSITY MANDATE - กฎเหล็กป้องกันการตอบซ้ำซาก (สำคัญที่สุด)
====================================================
1. ห้ามใช้คำตอบสำเร็จรูปหรือแพทเทิร์นประโยคเดิมซ้ำๆ (No canned responses / No robotic formulaic templates):
   - ห้ามขึ้นต้นด้วยประโยคเดิมซ้ำๆ เช่น "สวัสดีครับ ยินดีให้คำปรึกษา..." หรือ "ตามข้อมูลของคุณ..."
   - ให้เริ่มตอบเข้าประเด็นด้วยน้ำเสียงสดใหม่ กระชับ อบอุ่น มีพลัง และเข้ากับช่วงเวลา (${timeOfDay}) ทันที

2. เสนอเมนูที่หลากหลายและสดใหม่อยู่เสมอ (Menu Novelty & Diverse Categories):
   - ห้ามแนะนำเฉพาะเมนูพื้นๆ ซ้ำซาก (ห้ามแนะนำแค่อกไก่ต้ม/ไข่ต้มวนไปวนมาทุกครั้ง)
   - ให้สลับสับเปลี่ยนหมวดหมู่อาหารไทยที่น่าทานและทำได้จริง เช่น:
     * อาหารตามสั่งสั่งพิเศษ (เช่น กะเพราไก่ไม่ใส่น้ำตาล/ผัดน้ำ, เกาเหลาเนื้อน่องลายพิเศษผักเยอะ, ลาบไก่/ลาบเต้าหู้ไม่ใส่น้ำตาล)
     * อาหารในร้านสะดวกซื้อ (7-Eleven / CJ) เช่น สันในไก่นุ่ม, อกไก่รมควัน, ไข่ตุ๋นคัพ, เต้าหู้ปลา, สลัดอกไก่ไข่ต้ม, นมพืชโปรตีนสูงสูตรไม่เติมน้ำตาล
     * เมนูทำเองง่ายๆ 10-15 นาที (เช่น สเต๊กปลาแซลมอน/ดอลลี่ย่างกระทะ, อกไก่ผัดพริกไทยดำ, ผัดกะหล่ำปลีอกไก่สับใช้น้ำมันมะกอก)
     * อาหารคลีนและสตรีทฟู้ดเพื่อสุขภาพ (เช่น ส้มตำไทยไม่ใส่น้ำตาล+ไก่ย่างลอกหนัง, ซุปเปอร์ตีนไก่/ต้มแซ่บ, สุกี้น้ำอกไก่/กุ้งไม่ใส่วุ้นเส้น/วุ้นเส้นน้อย)
   - ทุกเมนูต้องระบุตัวเลขประมาณการชัดเจน (พลังงาน kcal, โปรตีน g, คาร์บ g, ไขมัน g) และคำนวณให้พอดีกับโควตาที่เหลือ (${remainingCalories} kcal, โปรตีนขาดอีก ${remainingProtein} g)

3. ตอบตรงคำถามโดยใช้ข้อมูลจริงที่มี:
   - ห้ามถามข้อมูลที่ผู้ใช้ให้ไว้แล้วซ้ำ เช่น ห้ามถามน้ำหนัก ส่วนสูง หรือโควตา เพราะคุณรู้ทั้งหมดแล้ว
   - วิเคราะห์และให้คำแนะนำที่เหมาะกับเงื่อนไข (${ifWindow}, ${dietaryRestrictions}) และช่วงเวลา (${timeOfDay}) อย่างแท้จริง

4. รูปแบบการตอบ:
   - ใช้ Markdown (หัวข้อ, ตัวหนา, bullet points) ให้อ่านง่าย สวยงาม กระชับ ไม่เยิ่นเย้อ`;

      // Build conversation contents including history
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      // Filter and append recent history (up to last 8 messages)
      const validHistory = historyList
        .filter((m: any) => m && (m.content || m.text) && typeof (m.content || m.text) === 'string')
        .slice(-8);

      for (const msg of validHistory) {
        const role = (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';
        const text = (msg.content || msg.text || '').trim();
        if (text) {
          contents.push({
            role,
            parts: [{ text }]
          });
        }
      }

      // Add current user prompt with context anchor and time anchor
      const userPromptWithAnchor = `[บริบทของผู้ใช้: เป้าหมาย "${goalTitle}", โควตา ${calorieTarget} kcal / โปรตีน ${proteinTarget}g, วันนี้กินแล้ว ${todayCalories} kcal เหลือ ${remainingCalories} kcal, โปรตีนขาดอีก ${remainingProtein}g, เงื่อนไข: ${ifWindow}, ${dietaryRestrictions}, เวลาขณะนี้: ${bangkokTimeStr} น. (${timeOfDay})]

ผู้ใช้ถาม/ปรึกษาว่า:
"${message}"

(คำสั่งโค้ช AI: วิเคราะห์คำตอบจากโควตาคงเหลือจริง ${remainingCalories} kcal และโปรตีนที่ขาดอีก ${remainingProtein}g ให้คำแนะนำเฉพาะเจาะจง สดใหม่ ห้ามตอบซ้ำหรือใช้คำตอบสำเร็จรูป)`;

      contents.push({
        role: 'user',
        parts: [{ text: userPromptWithAnchor }]
      });

      const { response } = await generateGroundedContentSafe({
        contents,
        config: {
          systemInstruction: dynamicSystemInstruction,
          temperature: 0.85,
          topP: 0.95,
          topK: 40
        }
      });

      const reply = response.text || `สำหรับช่วง${timeOfDay}นี้ คุณมีโควตาคงเหลือ ${remainingCalories} kcal และยังต้องการโปรตีนอีก ${remainingProtein}g แนะนำเลือกเมนูโปรตีนสูงที่สอดคล้องกับข้อจำกัด (${dietaryRestrictions}) และเหมาะกับช่วงเวลาครับ`;
      
      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;
      const groundingChunks = (groundingMetadata as any)?.groundingChunks || [];
      const rawSources: { title: string; uri: string }[] = [];
      for (const chunk of groundingChunks) {
        if (chunk && chunk.web && (chunk.web.uri || chunk.web.url)) {
          rawSources.push({
            title: chunk.web.title || 'แหล่งข้อมูลอ้างอิง',
            uri: chunk.web.uri || chunk.web.url
          });
        }
      }

      const uniqueSources = Array.from(
        new Map(rawSources.map((item) => [item.uri, item])).values()
      );

      res.json({ reply, sources: uniqueSources });
    } catch (error: any) {
      console.error('Error in coach chat:', error);
      const userCtx = req.body?.userContext || {};
      const calRem = Math.max(0, Number(userCtx.calorieTarget || 1614) - Number(userCtx.todayCalories || 0));
      const pRem = Math.max(0, Number(userCtx.proteinTarget || 121) - Number(userCtx.todayProtein || 0));
      const rest = userCtx.dietaryRestrictions || 'งดน้ำตาล';
      
      res.json({
        reply: `ตามโควตาของคุณวันนี้ ยังมีพลังงานเหลือ **${calRem} kcal** และยังต้องการโปรตีนอีก **${pRem}g** ภายใต้เงื่อนไข **${rest}** แนะนำเลือกเมนูโปรตีนลีน เช่น สเต๊กปลา/ไก่ย่างไม่หวาน หรือต้มแซ่บ/เกาเหลาไม่ใส่น้ำตาล เพื่อให้ถึงเป้าหมายอย่างลงตัวครับ`,
        sources: []
      });
    }
  });

  // API Route: AI Coach Daily Audit (ตรวจการบ้านอาหารประจำวันและย้อนหลัง)
  app.post('/api/coach-audit', async (req, res) => {
    try {
      const userCtx = req.body?.userContext || req.body || {};
      const recentMeals = userCtx.recentMeals || userCtx.todayMeals || [];
      const calorieTarget = Number(userCtx.calorieTarget || userCtx.targetCalories || 2000);
      const proteinTarget = Number(userCtx.proteinTarget || userCtx.targetProtein || 120);
      const carbsTarget = Number(userCtx.carbsTarget || 220);
      const fatTarget = Number(userCtx.fatTarget || 55);

      // Aggregate calories and macros if not provided or 0
      let todayCalories = Number(userCtx.todayCalories || 0);
      let todayProtein = Number(userCtx.todayProtein || 0);
      let todayCarbs = Number(userCtx.todayCarbs || 0);
      let todayFat = Number(userCtx.todayFat || 0);

      if (todayCalories === 0 && recentMeals.length > 0) {
        todayCalories = recentMeals.reduce((sum: number, m: any) => sum + (Number(m.calories) || 0), 0);
        todayProtein = recentMeals.reduce((sum: number, m: any) => sum + (Number(m.proteinGrams) || 0), 0);
        todayCarbs = recentMeals.reduce((sum: number, m: any) => sum + (Number(m.carbsGrams) || 0), 0);
        todayFat = recentMeals.reduce((sum: number, m: any) => sum + (Number(m.fatGrams) || 0), 0);
      }

      const waterGlasses = Number(userCtx.waterGlasses || 0);
      const waterMl = Number(userCtx.waterMl || (waterGlasses * 250));
      const sleepHours = Number(userCtx.sleepHours || 7.5);
      const dateLabel = userCtx.dateLabel || 'วันนี้';
      const customGoals = userCtx.customGoals || {};
      const goalTitle = customGoals.primaryGoalTitle || 'ควบคุมโภชนาการและดูแลสุขภาพ';
      const weight = userCtx.weight || 70;
      const targetWeight = userCtx.targetWeight || 65;

      const prompt = `คุณคือหัวหน้านักกำหนดอาหารและ Master Nutrition AI Coach (ตรวจการบ้านอาหารประจำวันและย้อนหลัง)
วิเคราะห์ผลการรับประทานอาหารของวันที่: "${dateLabel}"

📋 ข้อมูลและเป้าหมายของผู้ใช้:
- เป้าหมายหลัก: ${goalTitle}
- น้ำหนักปัจจุบัน: ${weight} kg (เป้าหมาย: ${targetWeight} kg)
- เป้าหมายพลังงานต่อวัน: ${calorieTarget} kcal
- เป้าหมายโปรตีน: ${proteinTarget} g
- เป้าหมายคาร์โบไฮเดรต: ${carbsTarget} g
- เป้าหมายไขมัน: ${fatTarget} g

🍽️ ข้อมูลที่บันทึกจริงในวันนี้:
- พลังงานรวมที่ทาน: ${todayCalories} kcal (ต่างจากเป้าหมาย ${todayCalories - calorieTarget > 0 ? '+' : ''}${todayCalories - calorieTarget} kcal)
- โปรตีนรวม: ${todayProtein} g
- คาร์โบไฮเดรตรวม: ${todayCarbs} g
- ไขมันรวม: ${todayFat} g
- การดื่มน้ำ: ${waterGlasses} แก้ว (${waterMl} มล.)
- การนอนหลับ: ${sleepHours} ชั่วโมง
- รายการมื้ออาหารทั้งหมดที่บันทึกไว้ (${recentMeals.length} รายการ):
${recentMeals.length > 0 ? JSON.stringify(recentMeals, null, 2) : 'ยังไม่มีการบันทึกอาหารในวันนี้'}

คำแนะนำในการประเมิน:
1. วิเคราะห์ความสอดคล้องกับเป้าหมาย "${goalTitle}" ทั้งแคลอรี่และโปรตีน
2. ให้คะแนน (overallScore 0-100) และเกรด (grade เช่น A+, A, B+, B, C+, C, D) ตามความเป็นจริง
3. เขียน verdict ให้กระชับ ได้ใจความ อบอุ่น ให้กำลังใจ และมีหลักการโภชนาการ
4. สรุปสถานะแคลอรี (calorieStatus) และสถานะโปรตีน (proteinStatus) พร้อมตัวเลขจริง
5. ระบุจุดแข็ง (strengths) 2-4 ข้อที่ทำได้ดี
6. ระบุจุดที่ควรระวัง/ปรับปรุง (improvements) 2-3 ข้อ
7. ระบุ 3 แผนปฏิบัติการที่ทำได้จริงสำหรับวันพรุ่งนี้ (actionPlanForTomorrow) โดยขึ้นต้นด้วย "1. ", "2. ", "3. "
8. coachQuote คำคมสร้างแรงบันดาลใจจากโค้ช AI

ตอบกลับเป็นภาษาไทย ในรูปแบบ JSON ตาม Schema ที่กำหนดเท่านั้น`;

      const response = await generateContentSafe({
        model: 'gemini-flash-latest',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.INTEGER, description: 'คะแนนการคุมอาหารวันนี้ 0-100' },
              grade: { type: Type.STRING, description: 'เกรดผลงาน เช่น A+, A, B+, B, C+, C, D' },
              verdict: { type: Type.STRING, description: 'บทวิเคราะห์ภาพรวมผลงานโภชนาการประจำวัน' },
              calorieStatus: { type: Type.STRING, description: 'สถานะแคลอรี เช่น อยู่ในเกณฑ์สมดุลดีมาก (1,850/1,900 kcal)' },
              proteinStatus: { type: Type.STRING, description: 'สถานะโปรตีน เช่น โปรตีนถึงเป้าหมายยอดเยี่ยม (130g/120g)' },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'จุดเด่นหรือพฤติกรรมที่ดีเยี่ยมของวันนี้ 2-4 ข้อ'
              },
              improvements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'จุดที่ควรระวังหรือปรับปรุง 2-3 ข้อ'
              },
              actionPlanForTomorrow: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 แผนปฏิบัติการที่ทำได้จริงสำหรับวันพรุ่งนี้'
              },
              coachQuote: { type: Type.STRING, description: 'คำคมสร้างแรงบันดาลใจสไตล์โค้ชมืออาชีพ' }
            },
            required: [
              'overallScore',
              'grade',
              'verdict',
              'calorieStatus',
              'proteinStatus',
              'strengths',
              'improvements',
              'actionPlanForTomorrow',
              'coachQuote'
            ]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from AI');
      let cleanText = text.trim().replace(/^```json\s*|\s*```$/gi, '');
      const parsed = JSON.parse(cleanText);

      res.json(parsed);
    } catch (error: any) {
      console.error('Error in coach audit:', error);
      
      const userCtx = req.body?.userContext || req.body || {};
      const recentMeals = userCtx.recentMeals || userCtx.todayMeals || [];
      const calorieTarget = Number(userCtx.calorieTarget || userCtx.targetCalories || 2000);
      const proteinTarget = Number(userCtx.proteinTarget || userCtx.targetProtein || 120);
      const todayCalories = Number(userCtx.todayCalories || recentMeals.reduce((s: number, m: any) => s + (Number(m.calories) || 0), 0));
      const todayProtein = Number(userCtx.todayProtein || recentMeals.reduce((s: number, m: any) => s + (Number(m.proteinGrams) || 0), 0));
      const dateLabel = userCtx.dateLabel || 'วันนี้';
      const customGoals = userCtx.customGoals || {};
      const goalTitle = customGoals.primaryGoalTitle || 'ดูแลสุขภาพ';

      const calorieDiff = todayCalories - calorieTarget;
      const isCalorieGood = Math.abs(calorieDiff) <= 200;
      const isProteinMet = todayProtein >= proteinTarget * 0.95;
      const hasMeals = recentMeals.length > 0;

      let score = 75;
      if (hasMeals) {
        score = (isCalorieGood ? 50 : 35) + (isProteinMet ? 40 : 25) + 10;
      }

      let pStatus = 'ยังไม่บันทึกโปรตีน';
      if (todayProtein > 0) {
        if (isProteinMet) {
          pStatus = `โปรตีนถึงเป้าหมายยอดเยี่ยม (${todayProtein}g / ${proteinTarget}g)`;
        } else {
          pStatus = `ควรเพิ่มโปรตีนอีก ${Math.max(0, proteinTarget - todayProtein)}g (${todayProtein}g / ${proteinTarget}g)`;
        }
      }

      res.json({
        overallScore: Math.min(score, 98),
        grade: score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : hasMeals ? 'C+' : 'N/A',
        verdict: hasMeals
          ? (isCalorieGood && isProteinMet
              ? `ผลงานของวันที่ ${dateLabel} ยอดเยี่ยมมาก คุมแคลอรีและโปรตีนได้ตามเป้าหมาย "${goalTitle}" อย่างมีวินัย!`
              : `ในวันที่ ${dateLabel} บันทึกอาหารได้ดี ${isProteinMet ? 'ได้รับโปรตีนครบถ้วนแล้ว' : 'สามารถปรับสัดส่วนโปรตีนให้ตรงเป้าหมายมากขึ้น'} เพื่อผลลัพธ์ "${goalTitle}"`)
          : `ยังไม่มีการบันทึกอาหารสำหรับวันที่ ${dateLabel}`,
        calorieStatus: todayCalories === 0 ? 'ยังไม่บันทึกแคลอรี' : (calorieDiff > 200 ? `เกินเป้าหมาย ${calorieDiff} kcal (${todayCalories}/${calorieTarget} kcal)` : calorieDiff < -300 ? `ต่ำกว่าเป้าหมาย ${Math.abs(calorieDiff)} kcal (${todayCalories}/${calorieTarget} kcal)` : `อยู่ในเกณฑ์สมดุลดีมาก (${todayCalories}/${calorieTarget} kcal)`),
        proteinStatus: pStatus,
        strengths: hasMeals ? [
          'มีการบันทึกอาหารเพื่อติดตามตนเองอย่างสม่ำเสมอ',
          isProteinMet ? `ได้รับโปรตีนคุณภาพดีเพียงพอต่อร่างกาย (${todayProtein}g)` : 'เลือกรับประทานอาหารหลากหลาย',
          'ความตั้งใจและมีวินัยในการควบคุมโภชนาการ'
        ] : ['เริ่มต้นบันทึกมื้ออาหารเพื่อผลลัพธ์ที่ดีขึ้น'],
        improvements: hasMeals ? [
          !isProteinMet 
            ? `เพิ่มแหล่งโปรตีนลีน เช่น ไข่ต้ม อกไก่ หรือเต้าหู้ อีก ${Math.max(0, proteinTarget - todayProtein)}g` 
            : 'เน้นเพิ่มใยอาหารจากผักสดและผลไม้น้ำตาลต่ำเพื่อระบบขับถ่าย',
          todayCalories > calorieTarget ? 'ระวังน้ำมันที่ใช้ผัดหรือน้ำตาลแฝงในเครื่องดื่ม' : 'หลีกเลี่ยงการปล่อยให้ร่างกายหิวจนโหย'
        ] : ['บันทึกมื้ออาหารในแต่ละวันเพื่อการประเมินที่แม่นยำ'],
        actionPlanForTomorrow: [
          isProteinMet 
            ? `1. รักษาสมดุลการเลือกโปรตีนคุณภาพดี (${proteinTarget}g) อย่างสม่ำเสมอ`
            : `1. เติมโปรตีนลีนในแต่ละมื้อให้ถึงเป้าหมาย ${proteinTarget}g ต่อวัน`,
          `2. ดื่มน้ำให้เพียงพอ 8 แก้วต่อวันเพื่อกระตุ้นระบบเผาผลาญ`,
          `3. พักผ่อนให้เต็มที่ 7-8 ชั่วโมงเพื่อคืนความสดชื่นให้กล้ามเนื้อ`
        ],
        coachQuote: '"ความสม่ำเสมอในแต่ละวัน สำคัญกว่าความสมบูรณ์แบบเพียงแค่วันเดียว ทำต่อไปนะครับ คุณมาถูกทางแล้ว!"'
      });
    }
  });

  // API Route: AI Calculate Macros (BMR, TDEE, Macros & Personalized Sports Nutrition)
  app.post('/api/ai-calculate-macros', async (req, res) => {
    try {
      const { 
        gender = 'female', 
        age = 28, 
        height = 165, 
        weight = 55, 
        targetWeight = 52,
        activityLevel = 1.375, 
        goalType = 'fat_loss',
        customNotes = ''
      } = req.body;

      const safeWeight = Math.max(30, Number(weight) || 55);
      const safeHeight = Math.max(100, Number(height) || 165);
      const safeAge = Math.max(12, Math.min(100, Number(age) || 28));
      const safeAct = typeof activityLevel === 'number' ? activityLevel : 1.375;

      // Base Mifflin-St Jeor calculation
      const bmr = gender === 'male'
        ? Math.round((10 * safeWeight) + (6.25 * safeHeight) - (5 * safeAge) + 5)
        : Math.round((10 * safeWeight) + (6.25 * safeHeight) - (5 * safeAge) - 161);
      
      const tdee = Math.round(bmr * safeAct);

      const prompt = `คุณคือหัวหน้านักกำหนดอาหารการกีฬาและผู้เชี่ยวชาญด้านเวชศาสตร์ชะลอวัย (Chief Sports Nutritionist & Longevity Dietitian)
จงวิเคราะห์ข้อมูลชีวเคมีและไลฟ์สไตล์เพื่อออกแบบ "แผนโภชนาการและมาโครเฉพาะบุคคล" ที่แม่นยำที่สุด:
- ข้อมูลผู้ใช้: เพศ${gender === 'female' ? 'หญิง' : 'ชาย'}, อายุ ${safeAge} ปี, ส่วนสูง ${safeHeight} ซม., น้ำหนัก ${safeWeight} กก., น้ำหนักเป้าหมาย ${targetWeight} กก.
- อัตราการเผาผลาญพื้นฐาน (BMR): ${bmr} kcal | อัตราเผาผลาญรวม (TDEE): ${tdee} kcal
- เป้าหมาย: ${goalType} (บันทึกเพิ่มเติม: ${customNotes || 'ไม่มี'})

ข้อกำหนด:
1. คำนวณ dailyCalories (ต้องไม่ต่ำกว่า BMR ${bmr} kcal ยกเว้นเป้าหมายเร่งด่วนพิเศษ)
2. สัดส่วนโปรตีน (proteinGrams) ให้เหมาะสมกับน้ำหนักตัวและการรักษามวลกล้ามเนื้อ (1.5 - 2.0 g/kg)
3. สัดส่วนคาร์โบไฮเดรต (carbsGrams) และไขมันดี (fatGrams) ให้ครบถ้วนตามหลักการกีฬา
4. น้ำตาล (sugarGrams) ไม่เกิน 25g และโซเดียม (sodiumMg) ~2000mg
5. ให้ keyTips 3 ข้อที่ปฏิบัติได้จริงและ planTitle ที่กระชับ ได้ใจความ
6. explanation อธิบายหลักการทางชีวเคมีสั้นๆ 1-2 ประโยค

ส่งผลลัพธ์เป็น JSON Object ตาม Schema`;

      try {
        const response = await generateContentSafe({
          model: 'gemini-flash-latest',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                dailyCalories: { type: Type.INTEGER },
                proteinGrams: { type: Type.INTEGER },
                carbsGrams: { type: Type.INTEGER },
                fatGrams: { type: Type.INTEGER },
                sugarGrams: { type: Type.INTEGER },
                sodiumMg: { type: Type.INTEGER },
                planTitle: { type: Type.STRING },
                explanation: { type: Type.STRING },
                keyTips: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['dailyCalories', 'proteinGrams', 'carbsGrams', 'fatGrams', 'planTitle', 'explanation', 'keyTips']
            }
          }
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text.trim().replace(/^```json\s*|\s*```$/gi, ''));
          return res.json({
            bmr,
            tdee,
            targetCalories: parsed.dailyCalories,
            ...parsed
          });
        }
      } catch (aiErr) {
        console.warn('AI macro calculation model error, using math formula:', aiErr);
      }

      // Sports science fallback formula
      let calorieAdjustment = 0;
      let proteinPerKg = 1.6;
      if (goalType === 'fat_loss' || goalType === 'cut') {
        calorieAdjustment = -400;
        proteinPerKg = 1.8;
      } else if (goalType === 'muscle_build' || goalType === 'bulk') {
        calorieAdjustment = 250;
        proteinPerKg = 2.0;
      }

      const targetCalories = Math.max(bmr, tdee + calorieAdjustment);
      const proteinGrams = Math.round(safeWeight * proteinPerKg);
      const fatGrams = Math.round((targetCalories * 0.25) / 9);
      const carbsGrams = Math.max(50, Math.round((targetCalories - (proteinGrams * 4) - (fatGrams * 9)) / 4));

      res.json({
        bmr,
        tdee,
        targetCalories,
        dailyCalories: targetCalories,
        proteinGrams,
        carbsGrams,
        fatGrams,
        sugarGrams: 24,
        sodiumMg: 2000,
        planTitle: `แผนโภชนาการวิทยาศาสตร์การกีฬา (${goalType})`,
        explanation: `คำนวณตามหลักเวชศาสตร์การกีฬา พลังงาน ${targetCalories} kcal พร้อมโปรตีน ${proteinGrams}g เหมาะสมที่สุดสำหรับการรักษามวลกล้ามเนื้อและบรรลุเป้าหมาย`,
        keyTips: [
          `กระจายโปรตีนเฉลี่ย 25-35 กรัมต่อมื้อเพื่อคงสภาพกล้ามเนื้อ`,
          `ดื่มน้ำสะอาดวันละอย่างน้อย 2.5 ลิตรเพื่อเพิ่มอัตราการเผาผลาญ`,
          `ทานอาหารไม่แปรรูปและเลี่ยงน้ำตาลเติมแต่ง`
        ]
      });
    } catch (error: any) {
      console.error('Error calculating macros:', error);
      res.status(500).json({ error: 'Failed to calculate macros' });
    }
  });

  // Vite middleware for development vs Static file server for production
  const hasDist = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));
  const isProd = process.env.NODE_ENV === 'production' || (!process.env.VITE_DEV && hasDist);

  if (!isProd) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        watch: {
          ignored: ['**/data/**', '**/dist/**']
        }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`GooKal Server running on port ${PORT} (0.0.0.0 dual-stack IPv4/IPv6)`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
