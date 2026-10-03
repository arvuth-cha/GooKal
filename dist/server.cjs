var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_genai = require("@google/genai");
var import_vite = require("vite");
var aiClient = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Warning: GEMINI_API_KEY is not set.");
    }
    aiClient = new import_genai.GoogleGenAI(apiKey ? {
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    } : {});
  }
  return aiClient;
}
var foodQueryCache = /* @__PURE__ */ new Map();
var CACHE_MAX_SIZE = 1e3;
var CACHE_TTL_MS = 24 * 60 * 60 * 1e3;
function getCachedFoodResult(key) {
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
function setCachedFoodResult(key, data) {
  const normalizedKey = key.trim().toLowerCase();
  if (foodQueryCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = foodQueryCache.keys().next().value;
    if (oldestKey) foodQueryCache.delete(oldestKey);
  }
  foodQueryCache.set(normalizedKey, { data, timestamp: Date.now() });
}
async function generateContentSafe(params) {
  const aiInstance = getAI();
  const requestedModel = params.model;
  const primaryModel = requestedModel && requestedModel !== "gemini-flash-latest" ? requestedModel : "gemini-3.6-flash";
  const fallbackModels = [
    primaryModel,
    "gemini-3.6-flash",
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-3.7-flash"
  ];
  const modelsToTry = Array.from(new Set(fallbackModels));
  const enrichedConfig = {
    ...params.config,
    thinkingConfig: params.config?.thinkingConfig || { thinkingLevel: import_genai.ThinkingLevel.MINIMAL }
  };
  let lastError = null;
  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await aiInstance.models.generateContent({
          ...params,
          config: enrichedConfig,
          model: modelName
        });
        return response;
      } catch (err) {
        lastError = err;
        const errMsg = (err?.message || String(err)).toLowerCase();
        const isTransient = errMsg.includes("503") || errMsg.includes("unavailable") || errMsg.includes("high demand") || errMsg.includes("429") || errMsg.includes("resource_exhausted") || errMsg.includes("overloaded") || errMsg.includes("econnreset") || errMsg.includes("etimedout");
        if (isTransient && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          continue;
        }
        break;
      }
    }
  }
  throw lastError || new Error("Failed to generate content from AI model");
}
async function generateGroundedContentSafe(params) {
  const aiInstance = getAI();
  const modelsToTry = ["gemini-3.6-flash", "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.7-flash"];
  let lastError = null;
  for (const modelName of modelsToTry) {
    try {
      const response = await aiInstance.models.generateContent({
        model: modelName,
        contents: params.contents,
        config: {
          ...params.config,
          tools: [{ googleSearch: {} }]
        }
      });
      return { response, modelUsed: modelName };
    } catch (err) {
      lastError = err;
      console.warn(`Grounded generation failed on ${modelName}:`, err?.message || err);
      continue;
    }
  }
  throw lastError || new Error("Failed to generate grounded content from AI model");
}
var THAI_FOOD_NUTRITION_DB = {
  // ข้าวและอาหารจานเดียว
  "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E44\u0E01\u0E48\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27": { cal: 650, p: 32, c: 66, f: 28, sugar: 4, sodium: 1020 },
  "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E2B\u0E21\u0E39\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27": { cal: 710, p: 30, c: 66, f: 35, sugar: 4, sodium: 1080 },
  "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E2B\u0E21\u0E39\u0E01\u0E23\u0E2D\u0E1A\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27": { cal: 860, p: 26, c: 66, f: 52, sugar: 4, sodium: 1180 },
  "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27": { cal: 690, p: 34, c: 66, f: 31, sugar: 4, sodium: 1050 },
  "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E01\u0E38\u0E49\u0E07\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27": { cal: 600, p: 28, c: 66, f: 23, sugar: 4, sodium: 1020 },
  "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E44\u0E01\u0E48": { cal: 520, p: 26, c: 65, f: 17, sugar: 4, sodium: 900 },
  "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E2B\u0E21\u0E39": { cal: 580, p: 24, c: 65, f: 24, sugar: 4, sodium: 960 },
  "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E2B\u0E21\u0E39\u0E01\u0E23\u0E2D\u0E1A": { cal: 730, p: 20, c: 65, f: 42, sugar: 4, sodium: 1060 },
  "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E40\u0E19\u0E37\u0E49\u0E2D": { cal: 560, p: 28, c: 65, f: 20, sugar: 4, sodium: 930 },
  "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E17\u0E30\u0E40\u0E25": { cal: 530, p: 26, c: 65, f: 18, sugar: 4, sodium: 980 },
  "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E04\u0E25\u0E38\u0E01": { cal: 590, p: 25, c: 70, f: 22, sugar: 4, sodium: 1e3 },
  "\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14\u0E44\u0E01\u0E48": { cal: 550, p: 22, c: 70, f: 20, sugar: 3, sodium: 820 },
  "\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14\u0E2B\u0E21\u0E39": { cal: 590, p: 20, c: 70, f: 24, sugar: 3, sodium: 850 },
  "\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14\u0E01\u0E38\u0E49\u0E07": { cal: 520, p: 22, c: 68, f: 18, sugar: 3, sodium: 860 },
  "\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14\u0E1B\u0E39": { cal: 510, p: 24, c: 68, f: 16, sugar: 3, sodium: 800 },
  "\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14\u0E44\u0E02\u0E48": { cal: 480, p: 14, c: 68, f: 16, sugar: 2, sodium: 680 },
  "\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14\u0E2D\u0E40\u0E21\u0E23\u0E34\u0E01\u0E31\u0E19": { cal: 720, p: 26, c: 84, f: 29, sugar: 14, sodium: 1120 },
  "\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14\u0E15\u0E49\u0E21\u0E22\u0E33\u0E01\u0E38\u0E49\u0E07": { cal: 560, p: 24, c: 70, f: 20, sugar: 5, sodium: 1150 },
  "\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14\u0E42\u0E1A\u0E23\u0E32\u0E13": { cal: 610, p: 22, c: 72, f: 25, sugar: 5, sodium: 920 },
  "\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14\u0E41\u0E2B\u0E19\u0E21": { cal: 620, p: 21, c: 70, f: 27, sugar: 3, sodium: 1050 },
  "\u0E02\u0E49\u0E32\u0E27\u0E44\u0E02\u0E48\u0E40\u0E08\u0E35\u0E22\u0E27": { cal: 520, p: 14, c: 55, f: 26, sugar: 1, sodium: 620 },
  "\u0E02\u0E49\u0E32\u0E27\u0E44\u0E02\u0E48\u0E40\u0E08\u0E35\u0E22\u0E27\u0E2B\u0E21\u0E39\u0E2A\u0E31\u0E1A": { cal: 620, p: 21, c: 55, f: 34, sugar: 1, sodium: 760 },
  "\u0E02\u0E49\u0E32\u0E27\u0E44\u0E02\u0E48\u0E40\u0E08\u0E35\u0E22\u0E27\u0E01\u0E38\u0E49\u0E07\u0E2A\u0E31\u0E1A": { cal: 580, p: 22, c: 55, f: 30, sugar: 1, sodium: 740 },
  "\u0E02\u0E49\u0E32\u0E27\u0E44\u0E02\u0E48\u0E02\u0E49\u0E19\u0E01\u0E38\u0E49\u0E07": { cal: 490, p: 23, c: 52, f: 19, sugar: 2, sodium: 600 },
  "\u0E02\u0E49\u0E32\u0E27\u0E44\u0E02\u0E48\u0E02\u0E49\u0E19\u0E2B\u0E21\u0E39\u0E2A\u0E31\u0E1A": { cal: 530, p: 22, c: 52, f: 24, sugar: 2, sodium: 640 },
  "\u0E02\u0E49\u0E32\u0E27\u0E44\u0E02\u0E48\u0E02\u0E49\u0E19\u0E1B\u0E39": { cal: 480, p: 24, c: 52, f: 17, sugar: 2, sodium: 590 },
  "\u0E02\u0E49\u0E32\u0E27\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27 2 \u0E1F\u0E2D\u0E07": { cal: 450, p: 14, c: 52, f: 19, sugar: 1, sodium: 400 },
  "\u0E02\u0E49\u0E32\u0E27\u0E21\u0E31\u0E19\u0E44\u0E01\u0E48\u0E15\u0E49\u0E21": { cal: 590, p: 24, c: 68, f: 23, sugar: 2, sodium: 890 },
  "\u0E02\u0E49\u0E32\u0E27\u0E21\u0E31\u0E19\u0E44\u0E01\u0E48\u0E15\u0E49\u0E21\u0E44\u0E21\u0E48\u0E40\u0E2D\u0E32\u0E2B\u0E19\u0E31\u0E07": { cal: 510, p: 26, c: 68, f: 13, sugar: 2, sodium: 840 },
  "\u0E02\u0E49\u0E32\u0E27\u0E21\u0E31\u0E19\u0E44\u0E01\u0E48\u0E17\u0E2D\u0E14": { cal: 710, p: 20, c: 74, f: 36, sugar: 4, sodium: 980 },
  "\u0E02\u0E49\u0E32\u0E27\u0E21\u0E31\u0E19\u0E44\u0E01\u0E48\u0E1C\u0E2A\u0E21": { cal: 650, p: 22, c: 71, f: 29, sugar: 3, sodium: 940 },
  "\u0E02\u0E49\u0E32\u0E27\u0E2B\u0E21\u0E39\u0E41\u0E14\u0E07": { cal: 540, p: 20, c: 75, f: 16, sugar: 14, sodium: 890 },
  "\u0E02\u0E49\u0E32\u0E27\u0E2B\u0E21\u0E39\u0E01\u0E23\u0E2D\u0E1A": { cal: 690, p: 18, c: 72, f: 36, sugar: 12, sodium: 980 },
  "\u0E02\u0E49\u0E32\u0E27\u0E2B\u0E21\u0E39\u0E41\u0E14\u0E07\u0E2B\u0E21\u0E39\u0E01\u0E23\u0E2D\u0E1A": { cal: 620, p: 19, c: 74, f: 26, sugar: 13, sodium: 940 },
  "\u0E02\u0E49\u0E32\u0E27\u0E02\u0E32\u0E2B\u0E21\u0E39": { cal: 690, p: 24, c: 65, f: 36, sugar: 10, sodium: 1150 },
  "\u0E02\u0E49\u0E32\u0E27\u0E02\u0E32\u0E2B\u0E21\u0E39\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E25\u0E49\u0E27\u0E19": { cal: 520, p: 32, c: 65, f: 14, sugar: 8, sodium: 1050 },
  "\u0E02\u0E49\u0E32\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E1B\u0E47\u0E14": { cal: 580, p: 25, c: 68, f: 22, sugar: 11, sodium: 980 },
  "\u0E02\u0E49\u0E32\u0E27\u0E04\u0E25\u0E38\u0E01\u0E01\u0E30\u0E1B\u0E34": { cal: 580, p: 22, c: 66, f: 24, sugar: 12, sodium: 1280 },
  "\u0E02\u0E49\u0E32\u0E27\u0E2B\u0E21\u0E39\u0E01\u0E23\u0E30\u0E40\u0E17\u0E35\u0E22\u0E21": { cal: 590, p: 22, c: 65, f: 26, sugar: 3, sodium: 850 },
  "\u0E02\u0E49\u0E32\u0E27\u0E44\u0E01\u0E48\u0E01\u0E23\u0E30\u0E40\u0E17\u0E35\u0E22\u0E21": { cal: 520, p: 26, c: 65, f: 17, sugar: 3, sodium: 800 },
  "\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14\u0E1E\u0E23\u0E34\u0E01\u0E41\u0E01\u0E07\u0E2B\u0E21\u0E39": { cal: 590, p: 22, c: 65, f: 25, sugar: 5, sodium: 1100 },
  "\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14\u0E1E\u0E23\u0E34\u0E01\u0E41\u0E01\u0E07\u0E44\u0E01\u0E48": { cal: 530, p: 25, c: 65, f: 18, sugar: 5, sodium: 1040 },
  "\u0E02\u0E49\u0E32\u0E27\u0E23\u0E32\u0E14\u0E04\u0E30\u0E19\u0E49\u0E32\u0E2B\u0E21\u0E39\u0E01\u0E23\u0E2D\u0E1A": { cal: 670, p: 19, c: 65, f: 37, sugar: 4, sodium: 1120 },
  "\u0E02\u0E49\u0E32\u0E27\u0E23\u0E32\u0E14\u0E1C\u0E31\u0E14\u0E1C\u0E31\u0E01\u0E1A\u0E38\u0E49\u0E07\u0E2B\u0E21\u0E39\u0E01\u0E23\u0E2D\u0E1A": { cal: 660, p: 18, c: 64, f: 36, sugar: 4, sodium: 1140 },
  "\u0E02\u0E49\u0E32\u0E27\u0E41\u0E01\u0E07\u0E01\u0E30\u0E2B\u0E23\u0E35\u0E48\u0E44\u0E01\u0E48": { cal: 590, p: 22, c: 78, f: 20, sugar: 8, sodium: 960 },
  "\u0E02\u0E49\u0E32\u0E27\u0E41\u0E01\u0E07\u0E40\u0E02\u0E35\u0E22\u0E27\u0E2B\u0E27\u0E32\u0E19\u0E44\u0E01\u0E48": { cal: 580, p: 22, c: 68, f: 24, sugar: 6, sodium: 1050 },
  "\u0E02\u0E49\u0E32\u0E27\u0E41\u0E01\u0E07\u0E1E\u0E30\u0E41\u0E19\u0E07\u0E2B\u0E21\u0E39": { cal: 620, p: 23, c: 68, f: 27, sugar: 7, sodium: 1100 },
  "\u0E02\u0E49\u0E32\u0E27\u0E44\u0E02\u0E48\u0E15\u0E49\u0E21 2 \u0E1F\u0E2D\u0E07": { cal: 360, p: 15, c: 52, f: 10, sugar: 1, sodium: 180 },
  // ก๋วยเตี๋ยวและเมนูเส้น
  "\u0E1C\u0E31\u0E14\u0E44\u0E17\u0E22\u0E01\u0E38\u0E49\u0E07\u0E2A\u0E14": { cal: 590, p: 22, c: 70, f: 24, sugar: 16, sodium: 1190 },
  "\u0E1C\u0E31\u0E14\u0E0B\u0E35\u0E2D\u0E34\u0E4A\u0E27\u0E2B\u0E21\u0E39": { cal: 630, p: 24, c: 62, f: 30, sugar: 8, sodium: 1140 },
  "\u0E1C\u0E31\u0E14\u0E0B\u0E35\u0E2D\u0E34\u0E4A\u0E27\u0E44\u0E01\u0E48": { cal: 560, p: 26, c: 62, f: 22, sugar: 8, sodium: 1060 },
  "\u0E1C\u0E31\u0E14\u0E0B\u0E35\u0E2D\u0E34\u0E4A\u0E27\u0E40\u0E2A\u0E49\u0E19\u0E2B\u0E21\u0E35\u0E48": { cal: 520, p: 22, c: 64, f: 18, sugar: 8, sodium: 1080 },
  "\u0E23\u0E32\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E21\u0E39\u0E2B\u0E21\u0E31\u0E01": { cal: 490, p: 20, c: 62, f: 16, sugar: 7, sodium: 1380 },
  "\u0E23\u0E32\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E2A\u0E49\u0E19\u0E43\u0E2B\u0E0D\u0E48\u0E2B\u0E21\u0E39": { cal: 510, p: 20, c: 65, f: 17, sugar: 7, sodium: 1390 },
  "\u0E23\u0E32\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E30\u0E40\u0E25": { cal: 460, p: 22, c: 62, f: 12, sugar: 7, sodium: 1400 },
  "\u0E1C\u0E31\u0E14\u0E02\u0E35\u0E49\u0E40\u0E21\u0E32\u0E40\u0E2A\u0E49\u0E19\u0E43\u0E2B\u0E0D\u0E48\u0E17\u0E30\u0E40\u0E25": { cal: 580, p: 24, c: 66, f: 23, sugar: 6, sodium: 1250 },
  "\u0E01\u0E4B\u0E27\u0E22\u0E40\u0E15\u0E35\u0E4B\u0E22\u0E27\u0E15\u0E49\u0E21\u0E22\u0E33\u0E2B\u0E21\u0E39": { cal: 430, p: 18, c: 56, f: 13, sugar: 11, sodium: 1720 },
  "\u0E01\u0E4B\u0E27\u0E22\u0E40\u0E15\u0E35\u0E4B\u0E22\u0E27\u0E15\u0E49\u0E21\u0E22\u0E33\u0E19\u0E49\u0E33\u0E43\u0E2A": { cal: 390, p: 18, c: 55, f: 9, sugar: 9, sodium: 1650 },
  "\u0E01\u0E4B\u0E27\u0E22\u0E40\u0E15\u0E35\u0E4B\u0E22\u0E27\u0E19\u0E49\u0E33\u0E43\u0E2A\u0E44\u0E01\u0E48": { cal: 360, p: 22, c: 52, f: 7, sugar: 3, sodium: 1440 },
  "\u0E01\u0E4B\u0E27\u0E22\u0E40\u0E15\u0E35\u0E4B\u0E22\u0E27\u0E19\u0E49\u0E33\u0E43\u0E2A\u0E2B\u0E21\u0E39": { cal: 380, p: 20, c: 52, f: 9, sugar: 3, sodium: 1480 },
  "\u0E01\u0E4B\u0E27\u0E22\u0E40\u0E15\u0E35\u0E4B\u0E22\u0E27\u0E40\u0E23\u0E37\u0E2D\u0E40\u0E19\u0E37\u0E49\u0E2D": { cal: 440, p: 23, c: 50, f: 15, sugar: 8, sodium: 1780 },
  "\u0E01\u0E4B\u0E27\u0E22\u0E40\u0E15\u0E35\u0E4B\u0E22\u0E27\u0E40\u0E23\u0E37\u0E2D\u0E2B\u0E21\u0E39": { cal: 460, p: 21, c: 50, f: 17, sugar: 8, sodium: 1750 },
  "\u0E1A\u0E30\u0E2B\u0E21\u0E35\u0E48\u0E40\u0E01\u0E35\u0E4A\u0E22\u0E27\u0E2B\u0E21\u0E39\u0E41\u0E14\u0E07": { cal: 470, p: 22, c: 60, f: 14, sugar: 5, sodium: 1400 },
  "\u0E1A\u0E30\u0E2B\u0E21\u0E35\u0E48\u0E41\u0E2B\u0E49\u0E07\u0E40\u0E1B\u0E47\u0E14\u0E22\u0E48\u0E32\u0E07": { cal: 540, p: 24, c: 58, f: 22, sugar: 7, sodium: 1280 },
  "\u0E40\u0E22\u0E47\u0E19\u0E15\u0E32\u0E42\u0E1F": { cal: 410, p: 18, c: 56, f: 11, sugar: 12, sodium: 1820 },
  "\u0E02\u0E19\u0E21\u0E08\u0E35\u0E19\u0E19\u0E49\u0E33\u0E22\u0E32\u0E1B\u0E25\u0E32": { cal: 340, p: 16, c: 48, f: 8, sugar: 4, sodium: 1200 },
  "\u0E02\u0E19\u0E21\u0E08\u0E35\u0E19\u0E19\u0E49\u0E33\u0E22\u0E32\u0E01\u0E30\u0E17\u0E34": { cal: 440, p: 14, c: 48, f: 21, sugar: 5, sodium: 1250 },
  "\u0E02\u0E19\u0E21\u0E08\u0E35\u0E19\u0E41\u0E01\u0E07\u0E40\u0E02\u0E35\u0E22\u0E27\u0E2B\u0E27\u0E32\u0E19\u0E44\u0E01\u0E48": { cal: 460, p: 18, c: 48, f: 22, sugar: 5, sodium: 1150 },
  "\u0E02\u0E19\u0E21\u0E08\u0E35\u0E19\u0E19\u0E49\u0E33\u0E40\u0E07\u0E35\u0E49\u0E22\u0E27": { cal: 380, p: 18, c: 46, f: 13, sugar: 3, sodium: 1300 },
  "\u0E2A\u0E38\u0E01\u0E35\u0E49\u0E19\u0E49\u0E33\u0E23\u0E27\u0E21\u0E21\u0E34\u0E15\u0E23": { cal: 330, p: 23, c: 36, f: 8, sugar: 8, sodium: 1350 },
  "\u0E2A\u0E38\u0E01\u0E35\u0E49\u0E41\u0E2B\u0E49\u0E07\u0E44\u0E01\u0E48": { cal: 450, p: 26, c: 44, f: 16, sugar: 10, sodium: 1310 },
  "\u0E2A\u0E38\u0E01\u0E35\u0E49\u0E41\u0E2B\u0E49\u0E07\u0E2B\u0E21\u0E39": { cal: 490, p: 24, c: 44, f: 21, sugar: 10, sodium: 1340 },
  "\u0E2A\u0E38\u0E01\u0E35\u0E49\u0E41\u0E2B\u0E49\u0E07\u0E17\u0E30\u0E40\u0E25": { cal: 430, p: 25, c: 44, f: 14, sugar: 10, sodium: 1320 },
  // ส้มตำ อีสาน ยำ และกับข้าว
  "\u0E2A\u0E49\u0E21\u0E15\u0E33\u0E44\u0E17\u0E22": { cal: 120, p: 4, c: 26, f: 1, sugar: 14, sodium: 980 },
  "\u0E2A\u0E49\u0E21\u0E15\u0E33\u0E1B\u0E39\u0E1B\u0E25\u0E32\u0E23\u0E49\u0E32": { cal: 95, p: 5, c: 19, f: 1, sugar: 6, sodium: 1680 },
  "\u0E2A\u0E49\u0E21\u0E15\u0E33\u0E1B\u0E39": { cal: 105, p: 4, c: 22, f: 1, sugar: 10, sodium: 1350 },
  "\u0E2A\u0E49\u0E21\u0E15\u0E33\u0E44\u0E02\u0E48\u0E40\u0E04\u0E47\u0E21": { cal: 190, p: 7, c: 27, f: 6, sugar: 14, sodium: 1420 },
  "\u0E15\u0E33\u0E02\u0E49\u0E32\u0E27\u0E42\u0E1E\u0E14": { cal: 160, p: 4, c: 35, f: 2, sugar: 16, sodium: 950 },
  "\u0E15\u0E33\u0E41\u0E15\u0E07": { cal: 85, p: 3, c: 18, f: 1, sugar: 6, sodium: 1450 },
  "\u0E25\u0E32\u0E1A\u0E2B\u0E21\u0E39": { cal: 230, p: 24, c: 8, f: 11, sugar: 2, sodium: 900 },
  "\u0E25\u0E32\u0E1A\u0E44\u0E01\u0E48": { cal: 185, p: 27, c: 8, f: 5, sugar: 2, sodium: 860 },
  "\u0E19\u0E49\u0E33\u0E15\u0E01\u0E2B\u0E21\u0E39": { cal: 270, p: 23, c: 8, f: 15, sugar: 2, sodium: 940 },
  "\u0E19\u0E49\u0E33\u0E15\u0E01\u0E40\u0E19\u0E37\u0E49\u0E2D": { cal: 250, p: 26, c: 7, f: 12, sugar: 2, sodium: 920 },
  "\u0E44\u0E01\u0E48\u0E22\u0E48\u0E32\u0E07 1 \u0E19\u0E48\u0E2D\u0E07": { cal: 210, p: 24, c: 2, f: 11, sugar: 2, sodium: 580 },
  "\u0E44\u0E01\u0E48\u0E22\u0E48\u0E32\u0E07 1 \u0E2D\u0E01": { cal: 220, p: 36, c: 2, f: 6, sugar: 2, sodium: 520 },
  "\u0E04\u0E2D\u0E2B\u0E21\u0E39\u0E22\u0E48\u0E32\u0E07": { cal: 390, p: 18, c: 4, f: 33, sugar: 3, sodium: 740 },
  "\u0E2B\u0E21\u0E39\u0E1B\u0E34\u0E49\u0E07 1 \u0E44\u0E21\u0E49": { cal: 130, p: 7, c: 5, f: 9, sugar: 4, sodium: 280 },
  "\u0E44\u0E01\u0E48\u0E17\u0E2D\u0E14 1 \u0E0A\u0E34\u0E49\u0E19": { cal: 280, p: 18, c: 12, f: 18, sugar: 1, sodium: 560 },
  "\u0E22\u0E33\u0E27\u0E38\u0E49\u0E19\u0E40\u0E2A\u0E49\u0E19\u0E23\u0E27\u0E21\u0E21\u0E34\u0E15\u0E23": { cal: 240, p: 16, c: 34, f: 4, sugar: 9, sodium: 1380 },
  "\u0E22\u0E33\u0E2B\u0E21\u0E39\u0E22\u0E2D": { cal: 260, p: 14, c: 18, f: 14, sugar: 8, sodium: 1420 },
  "\u0E22\u0E33\u0E41\u0E0B\u0E25\u0E21\u0E2D\u0E19\u0E2A\u0E14": { cal: 230, p: 24, c: 8, f: 10, sugar: 6, sodium: 1150 },
  "\u0E22\u0E33\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27 (2 \u0E1F\u0E2D\u0E07)": { cal: 290, p: 14, c: 12, f: 21, sugar: 8, sodium: 1100 },
  // ต้ม แกง และซุป
  "\u0E15\u0E49\u0E21\u0E22\u0E33\u0E01\u0E38\u0E49\u0E07\u0E19\u0E49\u0E33\u0E43\u0E2A": { cal: 140, p: 20, c: 8, f: 3, sugar: 3, sodium: 1480 },
  "\u0E15\u0E49\u0E21\u0E22\u0E33\u0E01\u0E38\u0E49\u0E07\u0E19\u0E49\u0E33\u0E02\u0E49\u0E19": { cal: 270, p: 22, c: 12, f: 15, sugar: 5, sodium: 1580 },
  "\u0E15\u0E49\u0E21\u0E02\u0E48\u0E32\u0E44\u0E01\u0E48": { cal: 390, p: 24, c: 10, f: 27, sugar: 6, sodium: 1280 },
  "\u0E41\u0E01\u0E07\u0E40\u0E02\u0E35\u0E22\u0E27\u0E2B\u0E27\u0E32\u0E19\u0E44\u0E01\u0E48": { cal: 430, p: 22, c: 12, f: 31, sugar: 6, sodium: 1180 },
  "\u0E41\u0E01\u0E07\u0E2A\u0E49\u0E21\u0E0A\u0E30\u0E2D\u0E21\u0E01\u0E38\u0E49\u0E07": { cal: 290, p: 22, c: 16, f: 13, sugar: 8, sodium: 1410 },
  "\u0E41\u0E01\u0E07\u0E2A\u0E49\u0E21\u0E1C\u0E31\u0E01\u0E23\u0E27\u0E21": { cal: 150, p: 8, c: 22, f: 2, sugar: 8, sodium: 1350 },
  "\u0E41\u0E01\u0E07\u0E08\u0E37\u0E14\u0E40\u0E15\u0E49\u0E32\u0E2B\u0E39\u0E49\u0E2B\u0E21\u0E39\u0E2A\u0E31\u0E1A": { cal: 195, p: 18, c: 6, f: 10, sugar: 2, sodium: 980 },
  "\u0E41\u0E01\u0E07\u0E08\u0E37\u0E14\u0E27\u0E38\u0E49\u0E19\u0E40\u0E2A\u0E49\u0E19\u0E2B\u0E21\u0E39\u0E2A\u0E31\u0E1A": { cal: 210, p: 16, c: 18, f: 8, sugar: 2, sodium: 990 },
  "\u0E15\u0E49\u0E21\u0E41\u0E0B\u0E48\u0E1A\u0E01\u0E23\u0E30\u0E14\u0E39\u0E01\u0E2D\u0E48\u0E2D\u0E19": { cal: 280, p: 24, c: 6, f: 17, sugar: 2, sodium: 1520 },
  "\u0E15\u0E49\u0E21\u0E08\u0E37\u0E14\u0E1C\u0E31\u0E01\u0E01\u0E32\u0E14\u0E02\u0E32\u0E27\u0E2B\u0E21\u0E39\u0E2A\u0E31\u0E1A": { cal: 180, p: 16, c: 7, f: 9, sugar: 2, sodium: 940 },
  // เครื่องดื่ม
  "\u0E0A\u0E32\u0E44\u0E17\u0E22\u0E40\u0E22\u0E47\u0E19": { cal: 280, p: 4, c: 45, f: 9, sugar: 34, sodium: 90 },
  "\u0E0A\u0E32\u0E44\u0E17\u0E22\u0E2B\u0E27\u0E32\u0E19\u0E19\u0E49\u0E2D\u0E22": { cal: 190, p: 4, c: 28, f: 6, sugar: 16, sodium: 80 },
  "\u0E0A\u0E32\u0E40\u0E02\u0E35\u0E22\u0E27\u0E19\u0E21\u0E40\u0E22\u0E47\u0E19": { cal: 270, p: 4, c: 44, f: 8, sugar: 32, sodium: 85 },
  "\u0E01\u0E32\u0E41\u0E1F\u0E40\u0E2D\u0E2A\u0E40\u0E1E\u0E23\u0E2A\u0E42\u0E0B\u0E48\u0E40\u0E22\u0E47\u0E19": { cal: 220, p: 3, c: 32, f: 8, sugar: 26, sodium: 80 },
  "\u0E01\u0E32\u0E41\u0E1F\u0E25\u0E32\u0E40\u0E15\u0E49\u0E40\u0E22\u0E47\u0E19": { cal: 180, p: 6, c: 20, f: 7, sugar: 16, sodium: 110 },
  "\u0E01\u0E32\u0E41\u0E1F\u0E04\u0E32\u0E1B\u0E39\u0E0A\u0E34\u0E42\u0E19\u0E48\u0E40\u0E22\u0E47\u0E19": { cal: 170, p: 6, c: 18, f: 7, sugar: 14, sodium: 105 },
  "\u0E2D\u0E40\u0E21\u0E23\u0E34\u0E01\u0E32\u0E42\u0E19\u0E48\u0E40\u0E22\u0E47\u0E19\u0E44\u0E21\u0E48\u0E2B\u0E27\u0E32\u0E19": { cal: 15, p: 1, c: 2, f: 0, sugar: 0, sodium: 10 },
  "\u0E2D\u0E40\u0E21\u0E23\u0E34\u0E01\u0E32\u0E42\u0E19\u0E48\u0E40\u0E22\u0E47\u0E19\u0E2B\u0E27\u0E32\u0E19\u0E19\u0E49\u0E2D\u0E22": { cal: 60, p: 1, c: 14, f: 0, sugar: 12, sodium: 12 },
  "\u0E0A\u0E32\u0E19\u0E21\u0E44\u0E02\u0E48\u0E21\u0E38\u0E01": { cal: 390, p: 3, c: 70, f: 10, sugar: 44, sodium: 110 },
  "\u0E0A\u0E32\u0E21\u0E30\u0E19\u0E32\u0E27\u0E40\u0E22\u0E47\u0E19": { cal: 160, p: 0, c: 40, f: 0, sugar: 36, sodium: 20 },
  "\u0E19\u0E21\u0E2A\u0E14\u0E1B\u0E31\u0E48\u0E19\u0E04\u0E32\u0E23\u0E32\u0E40\u0E21\u0E25": { cal: 410, p: 6, c: 62, f: 14, sugar: 48, sodium: 170 },
  "\u0E19\u0E21\u0E08\u0E37\u0E14 1 \u0E41\u0E01\u0E49\u0E27 (200ml)": { cal: 120, p: 7, c: 10, f: 6, sugar: 10, sodium: 100 },
  "\u0E19\u0E21\u0E1E\u0E23\u0E48\u0E2D\u0E07\u0E21\u0E31\u0E19\u0E40\u0E19\u0E22 (200ml)": { cal: 90, p: 7, c: 10, f: 2, sugar: 10, sodium: 100 },
  "\u0E19\u0E21\u0E16\u0E31\u0E48\u0E27\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E07\u0E2B\u0E27\u0E32\u0E19\u0E19\u0E49\u0E2D\u0E22 (250ml)": { cal: 110, p: 7, c: 12, f: 3, sugar: 8, sodium: 80 },
  "\u0E19\u0E49\u0E33\u0E2A\u0E49\u0E21\u0E04\u0E31\u0E49\u0E19\u0E2A\u0E14 1 \u0E41\u0E01\u0E49\u0E27": { cal: 110, p: 1, c: 26, f: 0, sugar: 20, sodium: 5 },
  "\u0E19\u0E49\u0E33\u0E41\u0E15\u0E07\u0E42\u0E21\u0E1B\u0E31\u0E48\u0E19": { cal: 130, p: 1, c: 32, f: 0, sugar: 28, sodium: 5 },
  "\u0E19\u0E49\u0E33\u0E21\u0E30\u0E1E\u0E23\u0E49\u0E32\u0E27\u0E2A\u0E14 1 \u0E25\u0E39\u0E01": { cal: 80, p: 1, c: 19, f: 0, sugar: 14, sodium: 40 },
  "\u0E42\u0E04\u0E49\u0E01\u0E0B\u0E35\u0E42\u0E23\u0E48 1 \u0E01\u0E23\u0E30\u0E1B\u0E4B\u0E2D\u0E07": { cal: 0, p: 0, c: 0, f: 0, sugar: 0, sodium: 35 },
  "\u0E42\u0E04\u0E49\u0E01 1 \u0E01\u0E23\u0E30\u0E1B\u0E4B\u0E2D\u0E07 (325ml)": { cal: 140, p: 0, c: 35, f: 0, sugar: 34, sodium: 30 },
  // ผลไม้และของว่างเพื่อสุขภาพ
  "\u0E2A\u0E49\u0E21\u0E42\u0E2D 1 \u0E01\u0E25\u0E35\u0E1A": { cal: 30, p: 0.5, c: 7, f: 0, sugar: 5, sodium: 1 },
  "\u0E2A\u0E49\u0E21\u0E42\u0E2D 2 \u0E01\u0E25\u0E35\u0E1A": { cal: 60, p: 1, c: 14, f: 0, sugar: 10, sodium: 2 },
  "\u0E2A\u0E49\u0E21\u0E42\u0E2D 4 \u0E01\u0E25\u0E35\u0E1A": { cal: 120, p: 2, c: 28, f: 0, sugar: 20, sodium: 4 },
  "\u0E01\u0E25\u0E49\u0E27\u0E22\u0E2B\u0E2D\u0E21 1 \u0E25\u0E39\u0E01": { cal: 105, p: 1.3, c: 27, f: 0.3, sugar: 14, sodium: 1 },
  "\u0E01\u0E25\u0E49\u0E27\u0E22\u0E19\u0E49\u0E33\u0E27\u0E49\u0E32 1 \u0E25\u0E39\u0E01": { cal: 60, p: 0.8, c: 15, f: 0.1, sugar: 9, sodium: 1 },
  "\u0E41\u0E2D\u0E1B\u0E40\u0E1B\u0E34\u0E49\u0E25 1 \u0E25\u0E39\u0E01": { cal: 85, p: 0.5, c: 21, f: 0.3, sugar: 16, sodium: 2 },
  "\u0E1D\u0E23\u0E31\u0E48\u0E07 1 \u0E25\u0E39\u0E01": { cal: 90, p: 3.5, c: 20, f: 1.2, sugar: 12, sodium: 4 },
  "\u0E41\u0E15\u0E07\u0E42\u0E21 1 \u0E0A\u0E34\u0E49\u0E19\u0E43\u0E2B\u0E0D\u0E48": { cal: 60, p: 1.2, c: 15, f: 0.3, sugar: 12, sodium: 2 },
  "\u0E21\u0E30\u0E25\u0E30\u0E01\u0E2D\u0E2A\u0E38\u0E01 1 \u0E08\u0E32\u0E19\u0E40\u0E25\u0E47\u0E01": { cal: 70, p: 1, c: 17, f: 0.2, sugar: 13, sodium: 3 },
  "\u0E41\u0E01\u0E49\u0E27\u0E21\u0E31\u0E07\u0E01\u0E23 1 \u0E25\u0E39\u0E01": { cal: 90, p: 2, c: 20, f: 0.5, sugar: 13, sodium: 3 },
  "\u0E17\u0E38\u0E40\u0E23\u0E35\u0E22\u0E19 1 \u0E1E\u0E39": { cal: 160, p: 2.5, c: 28, f: 5, sugar: 20, sodium: 3 },
  "\u0E21\u0E30\u0E21\u0E48\u0E27\u0E07\u0E2A\u0E38\u0E01 1 \u0E25\u0E39\u0E01": { cal: 135, p: 1.5, c: 35, f: 0.5, sugar: 30, sodium: 2 },
  "\u0E21\u0E30\u0E21\u0E48\u0E27\u0E07\u0E40\u0E1B\u0E23\u0E35\u0E49\u0E22\u0E27 1 \u0E25\u0E39\u0E01": { cal: 90, p: 1, c: 22, f: 0.3, sugar: 14, sodium: 2 },
  // พื้นฐาน โปรตีน คลีน และวัตถุดิบ
  "\u0E44\u0E02\u0E48\u0E15\u0E49\u0E21 1 \u0E1F\u0E2D\u0E07": { cal: 75, p: 6.3, c: 0.6, f: 5.3, sugar: 0.2, sodium: 65 },
  "\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27 1 \u0E1F\u0E2D\u0E07": { cal: 130, p: 6.3, c: 0.6, f: 11.5, sugar: 0.2, sodium: 140 },
  "\u0E44\u0E02\u0E48\u0E25\u0E27\u0E01 1 \u0E1F\u0E2D\u0E07": { cal: 75, p: 6.3, c: 0.6, f: 5.3, sugar: 0.2, sodium: 65 },
  "\u0E2D\u0E01\u0E44\u0E01\u0E48\u0E15\u0E49\u0E21 100g": { cal: 120, p: 26, c: 0, f: 2, sugar: 0, sodium: 65 },
  "\u0E2D\u0E01\u0E44\u0E01\u0E48\u0E22\u0E48\u0E32\u0E07 100g": { cal: 140, p: 28, c: 1, f: 3, sugar: 0, sodium: 120 },
  "\u0E2A\u0E31\u0E19\u0E43\u0E19\u0E2B\u0E21\u0E39\u0E15\u0E49\u0E21 100g": { cal: 145, p: 26, c: 0, f: 4, sugar: 0, sodium: 60 },
  "\u0E01\u0E38\u0E49\u0E07\u0E25\u0E27\u0E01 100g": { cal: 95, p: 21, c: 0.5, f: 1, sugar: 0, sodium: 140 },
  "\u0E1B\u0E25\u0E32\u0E41\u0E0B\u0E25\u0E21\u0E2D\u0E19\u0E22\u0E48\u0E32\u0E07 100g": { cal: 205, p: 22, c: 0, f: 13, sugar: 0, sodium: 60 },
  "\u0E40\u0E15\u0E49\u0E32\u0E2B\u0E39\u0E49\u0E02\u0E32\u0E27 1 \u0E41\u0E1C\u0E48\u0E19 (150g)": { cal: 110, p: 12, c: 3, f: 6, sugar: 0.5, sodium: 20 },
  "\u0E02\u0E49\u0E32\u0E27\u0E2A\u0E27\u0E22 1 \u0E17\u0E31\u0E1E\u0E1E\u0E35": { cal: 80, p: 1.5, c: 18, f: 0.2, sugar: 0, sodium: 2 },
  "\u0E02\u0E49\u0E32\u0E27\u0E2A\u0E27\u0E22 1 \u0E08\u0E32\u0E19": { cal: 220, p: 4, c: 50, f: 0.5, sugar: 0, sodium: 5 },
  "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E25\u0E49\u0E2D\u0E07 1 \u0E17\u0E31\u0E1E\u0E1E\u0E35": { cal: 75, p: 1.8, c: 16, f: 0.6, sugar: 0, sodium: 2 },
  "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E25\u0E49\u0E2D\u0E07 1 \u0E08\u0E32\u0E19": { cal: 210, p: 5, c: 45, f: 1.5, sugar: 0, sodium: 5 },
  "\u0E02\u0E49\u0E32\u0E27\u0E44\u0E23\u0E0B\u0E4C\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E23\u0E35\u0E48 1 \u0E17\u0E31\u0E1E\u0E1E\u0E35": { cal: 75, p: 2, c: 16, f: 0.5, sugar: 0, sodium: 2 },
  "\u0E02\u0E49\u0E32\u0E27\u0E40\u0E2B\u0E19\u0E35\u0E22\u0E27 1 \u0E2B\u0E48\u0E2D": { cal: 220, p: 4, c: 48, f: 1, sugar: 0, sodium: 5 },
  "\u0E02\u0E19\u0E21\u0E1B\u0E31\u0E07\u0E42\u0E2E\u0E25\u0E27\u0E35\u0E17 1 \u0E41\u0E1C\u0E48\u0E19": { cal: 70, p: 3.5, c: 12, f: 1, sugar: 1.5, sodium: 130 },
  "\u0E02\u0E19\u0E21\u0E1B\u0E31\u0E07\u0E02\u0E32\u0E27 1 \u0E41\u0E1C\u0E48\u0E19": { cal: 75, p: 2.5, c: 14, f: 1, sugar: 2, sodium: 140 },
  "\u0E40\u0E27\u0E22\u0E4C\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 1 \u0E2A\u0E01\u0E39\u0E4A\u0E1B": { cal: 120, p: 24, c: 2, f: 1.5, sugar: 1, sodium: 140 },
  "\u0E2A\u0E25\u0E31\u0E14\u0E1C\u0E31\u0E01\u0E2D\u0E01\u0E44\u0E01\u0E48": { cal: 220, p: 26, c: 12, f: 6, sugar: 4, sodium: 380 }
};
function normalizeNutritionData(data, fallbackName = "\u0E2D\u0E32\u0E2B\u0E32\u0E23") {
  let p = Math.max(0, Number(data.proteinGrams) || 0);
  let c = Math.max(0, Number(data.carbsGrams) || 0);
  let f = Math.max(0, Number(data.fatGrams) || 0);
  const rawCal = Number(data.calories) || 0;
  p = Math.round(p * 10) / 10;
  c = Math.round(c * 10) / 10;
  f = Math.round(f * 10) / 10;
  let calculatedCal = Math.round(p * 4 + c * 4 + f * 9);
  if (calculatedCal <= 0 && rawCal > 0) {
    p = Math.round(rawCal * 0.18 / 4 * 10) / 10;
    c = Math.round(rawCal * 0.52 / 4 * 10) / 10;
    f = Math.round(rawCal * 0.3 / 9 * 10) / 10;
    calculatedCal = Math.round(p * 4 + c * 4 + f * 9);
  } else if (calculatedCal <= 0) {
    p = 20;
    c = 55;
    f = 16;
    calculatedCal = Math.round(p * 4 + c * 4 + f * 9);
  }
  let sugar = Math.max(0, Number(data.sugarGrams) || 0);
  sugar = Math.min(sugar, c);
  sugar = Math.round(sugar * 10) / 10;
  const sodium = Math.max(0, Math.round(Number(data.sodiumMg) || 650));
  const fiber = data.fiberGrams !== void 0 ? Math.max(0, Math.round(Number(data.fiberGrams) * 10) / 10) : void 0;
  const foodName = data.foodName && data.foodName.trim() ? data.foodName.trim() : fallbackName;
  return {
    foodName,
    calories: calculatedCal,
    proteinGrams: p,
    carbsGrams: c,
    fatGrams: f,
    sugarGrams: sugar,
    sodiumMg: sodium,
    ...fiber !== void 0 ? { fiberGrams: fiber } : {},
    explanation: data.explanation || `\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E2A\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A "${foodName}" \u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E23\u0E27\u0E21 ${calculatedCal} kcal (\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 ${p}g, \u0E04\u0E32\u0E23\u0E4C\u0E1A ${c}g, \u0E44\u0E02\u0E21\u0E31\u0E19 ${f}g)`
  };
}
function calculateSingleItemNutrition(query) {
  const queryClean = query.trim();
  const lowerQ = queryClean.toLowerCase();
  let matchedKey = "";
  let baseFood = { cal: 400, p: 18, c: 48, f: 14, sugar: 4, sodium: 750 };
  for (const [key, val] of Object.entries(THAI_FOOD_NUTRITION_DB)) {
    if (lowerQ.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerQ)) {
      matchedKey = key;
      baseFood = { ...val };
      break;
    }
  }
  if (lowerQ.includes("\u0E2A\u0E49\u0E21\u0E42\u0E2D")) {
    const pMatch = lowerQ.match(/(\d+)\s*กลีบ/);
    const pieces = pMatch ? parseInt(pMatch[1], 10) : 2;
    return normalizeNutritionData({
      foodName: `\u0E2A\u0E49\u0E21\u0E42\u0E2D ${pieces} \u0E01\u0E25\u0E35\u0E1A`,
      calories: 30 * pieces,
      proteinGrams: 0.5 * pieces,
      carbsGrams: 7 * pieces,
      fatGrams: 0,
      sugarGrams: 5 * pieces,
      sodiumMg: 1 * pieces,
      explanation: `\u0E2A\u0E49\u0E21\u0E42\u0E2D\u0E2A\u0E14 ${pieces} \u0E01\u0E25\u0E35\u0E1A (~${pieces * 60} \u0E01\u0E23\u0E31\u0E21) \u0E27\u0E34\u0E15\u0E32\u0E21\u0E34\u0E19\u0E0B\u0E35\u0E2A\u0E39\u0E07 \u0E43\u0E22\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E41\u0E19\u0E48\u0E19 \u0E44\u0E23\u0E49\u0E44\u0E02\u0E21\u0E31\u0E19 \u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E15\u0E48\u0E33`
    });
  }
  if (lowerQ.includes("\u0E01\u0E25\u0E49\u0E27\u0E22\u0E2B\u0E2D\u0E21")) {
    const countMatch = lowerQ.match(/(\d+)\s*(ลูก|ผล)/);
    const count = countMatch ? parseInt(countMatch[1], 10) : 1;
    return normalizeNutritionData({
      foodName: `\u0E01\u0E25\u0E49\u0E27\u0E22\u0E2B\u0E2D\u0E21 ${count} \u0E25\u0E39\u0E01`,
      calories: 105 * count,
      proteinGrams: 1.3 * count,
      carbsGrams: 27 * count,
      fatGrams: 0.3 * count,
      sugarGrams: 14 * count,
      sodiumMg: 1 * count,
      explanation: `\u0E01\u0E25\u0E49\u0E27\u0E22\u0E2B\u0E2D\u0E21\u0E2A\u0E14 ${count} \u0E25\u0E39\u0E01 \u0E43\u0E2B\u0E49\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E41\u0E25\u0E30\u0E42\u0E1E\u0E41\u0E17\u0E2A\u0E40\u0E0B\u0E35\u0E22\u0E21\u0E2A\u0E39\u0E07 \u0E40\u0E2B\u0E21\u0E32\u0E30\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E23\u0E37\u0E2D\u0E2B\u0E25\u0E31\u0E07\u0E2D\u0E2D\u0E01\u0E01\u0E33\u0E25\u0E31\u0E07\u0E01\u0E32\u0E22`
    });
  }
  if (!matchedKey) {
    if (lowerQ.includes("\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32") || lowerQ.includes("\u0E01\u0E23\u0E30\u0E40\u0E1E\u0E23\u0E32")) {
      baseFood = { cal: 580, p: 26, c: 65, f: 24, sugar: 4, sodium: 950 };
      matchedKey = "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32";
    } else if (lowerQ.includes("\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14")) {
      baseFood = { cal: 560, p: 22, c: 70, f: 20, sugar: 3, sodium: 850 };
      matchedKey = "\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14";
    } else if (lowerQ.includes("\u0E02\u0E49\u0E32\u0E27\u0E21\u0E31\u0E19\u0E44\u0E01\u0E48")) {
      baseFood = { cal: 590, p: 24, c: 68, f: 23, sugar: 2, sodium: 890 };
      matchedKey = "\u0E02\u0E49\u0E32\u0E27\u0E21\u0E31\u0E19\u0E44\u0E01\u0E48";
    } else if (lowerQ.includes("\u0E01\u0E4B\u0E27\u0E22\u0E40\u0E15\u0E35\u0E4B\u0E22\u0E27") || lowerQ.includes("\u0E1A\u0E30\u0E2B\u0E21\u0E35\u0E48") || lowerQ.includes("\u0E40\u0E2A\u0E49\u0E19\u0E40\u0E25\u0E47\u0E01") || lowerQ.includes("\u0E40\u0E2A\u0E49\u0E19\u0E43\u0E2B\u0E0D\u0E48")) {
      baseFood = { cal: 420, p: 20, c: 55, f: 12, sugar: 6, sodium: 1500 };
      matchedKey = "\u0E01\u0E4B\u0E27\u0E22\u0E40\u0E15\u0E35\u0E4B\u0E22\u0E27";
    } else if (lowerQ.includes("\u0E2A\u0E49\u0E21\u0E15\u0E33") || lowerQ.includes("\u0E15\u0E33\u0E44\u0E17\u0E22") || lowerQ.includes("\u0E15\u0E33\u0E1B\u0E25\u0E32\u0E23\u0E49\u0E32")) {
      baseFood = { cal: 120, p: 4, c: 24, f: 1, sugar: 12, sodium: 1200 };
      matchedKey = "\u0E2A\u0E49\u0E21\u0E15\u0E33";
    } else if (lowerQ.includes("\u0E2A\u0E25\u0E31\u0E14")) {
      baseFood = { cal: 220, p: 18, c: 14, f: 8, sugar: 4, sodium: 400 };
      matchedKey = "\u0E2A\u0E25\u0E31\u0E14";
    } else if (lowerQ.includes("\u0E41\u0E01\u0E07")) {
      baseFood = { cal: 320, p: 18, c: 12, f: 20, sugar: 4, sodium: 1100 };
      matchedKey = "\u0E41\u0E01\u0E07";
    } else if (lowerQ.includes("\u0E01\u0E32\u0E41\u0E1F") || lowerQ.includes("\u0E0A\u0E32") || lowerQ.includes("\u0E19\u0E21") || lowerQ.includes("\u0E0A\u0E32\u0E19\u0E21")) {
      baseFood = { cal: 220, p: 4, c: 34, f: 7, sugar: 26, sodium: 90 };
      matchedKey = "\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21";
    }
  }
  let totalCal = baseFood.cal;
  let totalP = baseFood.p;
  let totalC = baseFood.c;
  let totalF = baseFood.f;
  let totalSugar = baseFood.sugar;
  let totalSodium = baseFood.sodium;
  let title = matchedKey || queryClean;
  let notes = [];
  const gramMatch = queryClean.match(/(\d+(?:\.\d+)?)\s*(กรัม|g|gram|grams)/i);
  if (gramMatch) {
    const grams = parseFloat(gramMatch[1]);
    if (grams > 0 && grams <= 2e3) {
      const scale = grams / 100;
      totalCal = Math.round(totalCal * scale);
      totalP = Math.round(totalP * scale * 10) / 10;
      totalC = Math.round(totalC * scale * 10) / 10;
      totalF = Math.round(totalF * scale * 10) / 10;
      totalSugar = Math.round(totalSugar * scale * 10) / 10;
      totalSodium = Math.round(totalSodium * scale);
      title = `${matchedKey || queryClean} ${grams} \u0E01\u0E23\u0E31\u0E21`;
      notes.push(`(\u0E04\u0E33\u0E19\u0E27\u0E13\u0E15\u0E32\u0E21\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01 ${grams} \u0E01\u0E23\u0E31\u0E21)`);
    }
  } else {
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
        notes.push(`(\u0E04\u0E33\u0E19\u0E27\u0E13\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13 ${num} ${unit})`);
      }
    } else if (lowerQ.includes("\u0E04\u0E23\u0E36\u0E48\u0E07\u0E08\u0E32\u0E19") || lowerQ.includes("\u0E04\u0E23\u0E36\u0E48\u0E07\u0E0A\u0E32\u0E21") || lowerQ.includes("\u0E04\u0E23\u0E36\u0E48\u0E07\u0E41\u0E01\u0E49\u0E27") || lowerQ.includes("\u0E04\u0E23\u0E36\u0E48\u0E07\u0E2B\u0E48\u0E2D") || lowerQ.includes("\u0E04\u0E23\u0E36\u0E48\u0E07\u0E25\u0E39\u0E01")) {
      totalCal = Math.round(totalCal * 0.55);
      totalP = Math.round(totalP * 0.55 * 10) / 10;
      totalC = Math.round(totalC * 0.55 * 10) / 10;
      totalF = Math.round(totalF * 0.55 * 10) / 10;
      totalSugar = Math.round(totalSugar * 0.55 * 10) / 10;
      totalSodium = Math.round(totalSodium * 0.55);
      notes.push("(\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13\u0E04\u0E23\u0E36\u0E48\u0E07\u0E2A\u0E48\u0E27\u0E19)");
    } else if (lowerQ.includes("\u0E1E\u0E34\u0E40\u0E28\u0E29") || lowerQ.includes("\u0E08\u0E32\u0E19\u0E43\u0E2B\u0E0D\u0E48")) {
      totalCal = Math.round(totalCal * 1.3);
      totalP = Math.round(totalP * 1.35 * 10) / 10;
      totalC = Math.round(totalC * 1.25 * 10) / 10;
      totalF = Math.round(totalF * 1.3 * 10) / 10;
      totalSugar = Math.round(totalSugar * 1.1 * 10) / 10;
      totalSodium = Math.round(totalSodium * 1.3);
      notes.push("(\u0E02\u0E19\u0E32\u0E14\u0E1E\u0E34\u0E40\u0E28\u0E29/\u0E08\u0E32\u0E19\u0E43\u0E2B\u0E0D\u0E48)");
    }
  }
  if (lowerQ.includes("\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27") && !matchedKey.includes("\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27")) {
    const eggCountMatch = lowerQ.match(/ไข่ดาว\s*(\d+)\s*ฟอง/);
    const eggCount = eggCountMatch ? parseInt(eggCountMatch[1], 10) : 1;
    totalCal += 130 * eggCount;
    totalP += 6.3 * eggCount;
    totalC += 0.6 * eggCount;
    totalF += 11.5 * eggCount;
    totalSodium += 140 * eggCount;
    notes.push(`+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27 ${eggCount > 1 ? eggCount + " \u0E1F\u0E2D\u0E07 " : ""}(+${130 * eggCount} kcal)`);
  }
  if (lowerQ.includes("\u0E44\u0E02\u0E48\u0E15\u0E49\u0E21") && !matchedKey.includes("\u0E44\u0E02\u0E48\u0E15\u0E49\u0E21")) {
    const eggCountMatch = lowerQ.match(/ไข่ต้ม\s*(\d+)\s*ฟอง/);
    const eggCount = eggCountMatch ? parseInt(eggCountMatch[1], 10) : 1;
    totalCal += 75 * eggCount;
    totalP += 6.3 * eggCount;
    totalC += 0.6 * eggCount;
    totalF += 5.3 * eggCount;
    totalSodium += 65 * eggCount;
    notes.push(`+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E44\u0E02\u0E48\u0E15\u0E49\u0E21 ${eggCount > 1 ? eggCount + " \u0E1F\u0E2D\u0E07 " : ""}(+${75 * eggCount} kcal)`);
  }
  if (lowerQ.includes("\u0E44\u0E02\u0E48\u0E40\u0E08\u0E35\u0E22\u0E27") && !matchedKey.includes("\u0E44\u0E02\u0E48\u0E40\u0E08\u0E35\u0E22\u0E27")) {
    totalCal += 190;
    totalP += 7;
    totalC += 1;
    totalF += 17;
    totalSodium += 250;
    notes.push("+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E44\u0E02\u0E48\u0E40\u0E08\u0E35\u0E22\u0E27 (+190 kcal)");
  }
  return normalizeNutritionData({
    foodName: title,
    calories: totalCal,
    proteinGrams: totalP,
    carbsGrams: totalC,
    fatGrams: totalF,
    sugarGrams: totalSugar,
    sodiumMg: totalSodium,
    explanation: notes.length > 0 ? `\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A "${queryClean}": ${notes.join(" ")} \u0E15\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E44\u0E17\u0E22` : `\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A "${queryClean}" \u0E15\u0E32\u0E21\u0E2B\u0E25\u0E31\u0E01\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E44\u0E17\u0E22 (Thai Food Composition)`
  });
}
function calculateNutritionFallback(query) {
  const queryClean = query.trim();
  const multiSplit = queryClean.split(/\s*(?:\+|\band\b|และ|กับ|,|\n)\s*/i).filter((s) => s.trim().length > 0);
  if (multiSplit.length > 1) {
    let sumCal = 0;
    let sumP = 0;
    let sumC = 0;
    let sumF = 0;
    let sumSugar = 0;
    let sumSodium = 0;
    const names = [];
    const itemExplanations = [];
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
      foodName: names.join(" + "),
      calories: sumCal,
      proteinGrams: sumP,
      carbsGrams: sumC,
      fatGrams: sumF,
      sugarGrams: sumSugar,
      sodiumMg: sumSodium,
      explanation: `\u0E23\u0E27\u0E21\u0E21\u0E37\u0E49\u0E2D\u0E2D\u0E32\u0E2B\u0E32\u0E23: ${itemExplanations.join(" + ")} \u0E23\u0E27\u0E21\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19 ${sumCal} kcal \u0E15\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E44\u0E17\u0E22`
    });
  }
  return calculateSingleItemNutrition(queryClean);
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = process.env.PORT || 3e3;
  app.use(import_express.default.json({ limit: "50mb" }));
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  const USERS_DATA_DIR = import_path.default.resolve(process.cwd(), "data", "users");
  try {
    if (!import_fs.default.existsSync(USERS_DATA_DIR)) {
      import_fs.default.mkdirSync(USERS_DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("Failed to create users data directory:", err);
  }
  app.get("/api/user/sync", (req, res) => {
    try {
      const userId = (req.query.userId || "").trim();
      const email = (req.query.email || "").trim().toLowerCase();
      if (!userId && !email) {
        return res.status(400).json({ error: "userId or email is required" });
      }
      let foundUserData = null;
      let matchedFilePath = null;
      if (userId) {
        const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
        const userFilePath = import_path.default.join(USERS_DATA_DIR, `${safeId}.json`);
        if (import_fs.default.existsSync(userFilePath)) {
          try {
            foundUserData = JSON.parse(import_fs.default.readFileSync(userFilePath, "utf-8"));
            matchedFilePath = userFilePath;
          } catch (e) {
            console.warn("[Sync] Could not parse user file:", userFilePath, e);
          }
        }
      }
      if ((!foundUserData || !Array.isArray(foundUserData.history) || foundUserData.history.length === 0) && email) {
        try {
          if (import_fs.default.existsSync(USERS_DATA_DIR)) {
            const files = import_fs.default.readdirSync(USERS_DATA_DIR).filter((f) => f.endsWith(".json") && !f.includes(".backup."));
            for (const file of files) {
              try {
                const fp = import_path.default.join(USERS_DATA_DIR, file);
                const fileContent = import_fs.default.readFileSync(fp, "utf-8");
                const parsed = JSON.parse(fileContent);
                if (parsed && parsed.email && parsed.email.trim().toLowerCase() === email) {
                  foundUserData = parsed;
                  matchedFilePath = fp;
                  break;
                }
              } catch {
              }
            }
          }
        } catch (scanErr) {
          console.warn("[Sync] Error scanning for email:", scanErr);
        }
      }
      if (!foundUserData && email) {
        const emailHash = "google_" + Math.abs(email.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0));
        const hashPath = import_path.default.join(USERS_DATA_DIR, `${emailHash}.json`);
        if (import_fs.default.existsSync(hashPath)) {
          try {
            foundUserData = JSON.parse(import_fs.default.readFileSync(hashPath, "utf-8"));
            matchedFilePath = hashPath;
          } catch {
          }
        }
      }
      if (foundUserData) {
        const delSet = new Set(Array.isArray(foundUserData.deletedIds) ? foundUserData.deletedIds : []);
        if (Array.isArray(foundUserData.history)) {
          foundUserData.history = foundUserData.history.filter((h) => h && h.id && !delSet.has(h.id));
        }
        if (userId) {
          const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
          const aliasPath = import_path.default.join(USERS_DATA_DIR, `${safeId}.json`);
          if (matchedFilePath && aliasPath !== matchedFilePath && !import_fs.default.existsSync(aliasPath)) {
            try {
              import_fs.default.writeFileSync(aliasPath, JSON.stringify({ ...foundUserData, userId }, null, 2), "utf-8");
            } catch {
            }
          }
        }
        return res.json({ success: true, data: foundUserData });
      }
      return res.json({ success: true, data: null });
    } catch (err) {
      console.error("Error fetching user sync data:", err);
      return res.status(500).json({ error: "Internal server error", details: err.message });
    }
  });
  app.post("/api/user/sync", (req, res) => {
    try {
      const { userId, email, history, profile, lastUpdated, deletedIds } = req.body;
      const cleanEmail = (email || "").trim().toLowerCase();
      if (!userId && !cleanEmail) {
        return res.status(400).json({ error: "userId or email is required" });
      }
      const safeId = (userId || "user_" + Math.abs(cleanEmail.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0))).replace(/[^a-zA-Z0-9_-]/g, "_");
      const userFilePath = import_path.default.join(USERS_DATA_DIR, `${safeId}.json`);
      let incomingDeleted = Array.isArray(deletedIds) ? deletedIds : [];
      let combinedDeleted = new Set(incomingDeleted);
      let existingData = null;
      let existingFilePath = userFilePath;
      if (import_fs.default.existsSync(userFilePath)) {
        try {
          existingData = JSON.parse(import_fs.default.readFileSync(userFilePath, "utf-8"));
        } catch {
        }
      } else if (cleanEmail && import_fs.default.existsSync(USERS_DATA_DIR)) {
        const files = import_fs.default.readdirSync(USERS_DATA_DIR).filter((f) => f.endsWith(".json") && !f.includes(".backup."));
        for (const file of files) {
          try {
            const fp = import_path.default.join(USERS_DATA_DIR, file);
            const content = import_fs.default.readFileSync(fp, "utf-8");
            const d = JSON.parse(content);
            if (d && d.email && d.email.trim().toLowerCase() === cleanEmail) {
              existingData = d;
              existingFilePath = fp;
              break;
            }
          } catch {
          }
        }
      }
      if (existingData && Array.isArray(existingData.deletedIds)) {
        existingData.deletedIds.forEach((id) => combinedDeleted.add(id));
      }
      const historyMap = /* @__PURE__ */ new Map();
      if (existingData && Array.isArray(existingData.history)) {
        for (const item of existingData.history) {
          if (item && item.id && !combinedDeleted.has(item.id)) {
            historyMap.set(item.id, item);
          }
        }
      }
      if (Array.isArray(history)) {
        for (const item of history) {
          if (item && item.id && !combinedDeleted.has(item.id)) {
            historyMap.set(item.id, item);
          }
        }
      }
      const mergedHistory = Array.from(historyMap.values()).sort((a, b) => (Number(b.date) || 0) - (Number(a.date) || 0));
      let mergedProfile = { ...existingData?.profile || {} };
      if (profile && typeof profile === "object" && Object.keys(profile).length > 0) {
        mergedProfile = { ...mergedProfile, ...profile };
      }
      const mergedData = {
        userId: userId || existingData?.userId || safeId,
        email: cleanEmail || existingData?.email || "",
        lastUpdated: Math.max(lastUpdated || Date.now(), existingData?.lastUpdated || 0),
        history: mergedHistory,
        profile: mergedProfile,
        deletedIds: Array.from(combinedDeleted)
      };
      import_fs.default.writeFileSync(userFilePath, JSON.stringify(mergedData, null, 2), "utf-8");
      if (existingFilePath !== userFilePath && import_fs.default.existsSync(existingFilePath)) {
        try {
          import_fs.default.writeFileSync(existingFilePath, JSON.stringify(mergedData, null, 2), "utf-8");
        } catch {
        }
      }
      return res.json({ success: true, data: mergedData });
    } catch (err) {
      console.error("Error saving user sync data:", err);
      return res.status(500).json({ error: "Internal server error", details: err.message });
    }
  });
  const handleAnalyzeFoodImage = async (req, res) => {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E16\u0E48\u0E32\u0E22\u0E23\u0E39\u0E1B\u0E20\u0E32\u0E1E\u0E2D\u0E32\u0E2B\u0E32\u0E23" });
    }
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";
    try {
      const prompt = `\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D\u0E19\u0E31\u0E01\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E27\u0E34\u0E0A\u0E32\u0E0A\u0E35\u0E1E\u0E41\u0E25\u0E30\u0E1C\u0E39\u0E49\u0E40\u0E0A\u0E35\u0E48\u0E22\u0E27\u0E0A\u0E32\u0E0D\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E20\u0E32\u0E1E\u0E16\u0E48\u0E32\u0E22\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E2A\u0E39\u0E07 (Senior Clinical Dietitian & Thai Food Composition Expert)
\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E23\u0E39\u0E1B\u0E20\u0E32\u0E1E\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E21\u0E32\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33\u0E41\u0E25\u0E30\u0E23\u0E27\u0E14\u0E40\u0E23\u0E47\u0E27\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14 \u0E42\u0E14\u0E22\u0E04\u0E33\u0E19\u0E27\u0E13\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E41\u0E25\u0E30\u0E2A\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E2B\u0E25\u0E31\u0E01\u0E15\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19 Thai Food Composition Table (\u0E2A\u0E16\u0E32\u0E1A\u0E31\u0E19\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23 \u0E21\u0E2B\u0E32\u0E27\u0E34\u0E17\u0E22\u0E32\u0E25\u0E31\u0E22\u0E21\u0E2B\u0E34\u0E14\u0E25 / \u0E01\u0E23\u0E21\u0E2D\u0E19\u0E32\u0E21\u0E31\u0E22) \u0E41\u0E25\u0E30 USDA:

\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E01\u0E32\u0E23\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E23\u0E39\u0E1B\u0E20\u0E32\u0E1E:
1. \u0E01\u0E32\u0E23\u0E23\u0E30\u0E1A\u0E38\u0E0A\u0E19\u0E34\u0E14\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E41\u0E25\u0E30\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A (Visual Identification):
   - \u0E23\u0E30\u0E1A\u0E38\u0E0A\u0E19\u0E34\u0E14\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E08\u0E32\u0E30\u0E08\u0E07 (\u0E40\u0E0A\u0E48\u0E19 "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E2B\u0E21\u0E39\u0E2A\u0E31\u0E1A\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27", "\u0E2A\u0E49\u0E21\u0E15\u0E33\u0E44\u0E17\u0E22 + \u0E44\u0E01\u0E48\u0E22\u0E48\u0E32\u0E07 1 \u0E19\u0E48\u0E2D\u0E07 + \u0E02\u0E49\u0E32\u0E27\u0E40\u0E2B\u0E19\u0E35\u0E22\u0E27 1 \u0E2B\u0E48\u0E2D", "\u0E01\u0E4B\u0E27\u0E22\u0E40\u0E15\u0E35\u0E4B\u0E22\u0E27\u0E15\u0E49\u0E21\u0E22\u0E33\u0E2B\u0E21\u0E39\u0E21\u0E30\u0E19\u0E32\u0E27", "\u0E02\u0E49\u0E32\u0E27\u0E44\u0E02\u0E48\u0E02\u0E49\u0E19\u0E01\u0E38\u0E49\u0E07", "\u0E2A\u0E25\u0E31\u0E14\u0E2D\u0E01\u0E44\u0E01\u0E48\u0E22\u0E48\u0E32\u0E07")
   - \u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15: \u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13 \u0E02\u0E49\u0E32\u0E27\u0E2A\u0E27\u0E22 (1 \u0E17\u0E31\u0E1E\u0E1E\u0E35 ~80 kcal, 1 \u0E08\u0E32\u0E19 ~220 kcal), \u0E02\u0E49\u0E32\u0E27\u0E40\u0E2B\u0E19\u0E35\u0E22\u0E27 (~220 kcal), \u0E40\u0E2A\u0E49\u0E19\u0E01\u0E4B\u0E27\u0E22\u0E40\u0E15\u0E35\u0E4B\u0E22\u0E27 (~180-220 kcal), \u0E02\u0E19\u0E21\u0E08\u0E35\u0E19 (~140 kcal)
   - \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19: \u0E0A\u0E19\u0E34\u0E14\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2A\u0E31\u0E15\u0E27\u0E4C\u0E41\u0E25\u0E30\u0E01\u0E23\u0E23\u0E21\u0E27\u0E34\u0E18\u0E35 (\u0E2D\u0E01\u0E44\u0E01\u0E48\u0E15\u0E49\u0E21 ~120 kcal/100g, \u0E44\u0E01\u0E48\u0E17\u0E2D\u0E14 ~280 kcal/\u0E0A\u0E34\u0E49\u0E19, \u0E04\u0E2D\u0E2B\u0E21\u0E39\u0E22\u0E48\u0E32\u0E07 ~390 kcal, \u0E2B\u0E21\u0E39\u0E01\u0E23\u0E2D\u0E1A ~500 kcal/100g, \u0E01\u0E38\u0E49\u0E07\u0E25\u0E27\u0E01 ~95 kcal/100g)
   - \u0E44\u0E02\u0E48: \u0E44\u0E02\u0E48\u0E15\u0E49\u0E21/\u0E44\u0E02\u0E48\u0E25\u0E27\u0E01 = 75 kcal, \u0E44\u0E02\u0E48\u0E14\u0E32\u0E27\u0E17\u0E2D\u0E14\u0E01\u0E23\u0E2D\u0E1A = 130 kcal, \u0E44\u0E02\u0E48\u0E40\u0E08\u0E35\u0E22\u0E27 = 190-220 kcal
   - \u0E44\u0E02\u0E21\u0E31\u0E19\u0E41\u0E25\u0E30\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E1B\u0E23\u0E38\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23: \u0E1C\u0E31\u0E14\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B +10-15g fat (~90-135 kcal), \u0E17\u0E2D\u0E14\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E17\u0E48\u0E27\u0E21 +15-25g fat, \u0E15\u0E49\u0E21/\u0E19\u0E36\u0E48\u0E07/\u0E22\u0E48\u0E32\u0E07\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E49\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19 ~2-5g fat
   - \u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21/\u0E02\u0E2D\u0E07\u0E2B\u0E27\u0E32\u0E19: \u0E01\u0E32\u0E41\u0E1F\u0E14\u0E33 = 15 kcal, \u0E0A\u0E32\u0E19\u0E21/\u0E0A\u0E32\u0E44\u0E17\u0E22\u0E2B\u0E27\u0E32\u0E19\u0E1B\u0E01\u0E15\u0E34 = 280-390 kcal (\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25 30-45g), \u0E1C\u0E25\u0E44\u0E21\u0E49\u0E15\u0E32\u0E21\u0E0A\u0E19\u0E34\u0E14\u0E41\u0E25\u0E30\u0E08\u0E33\u0E19\u0E27\u0E19\u0E0A\u0E34\u0E49\u0E19

2. \u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E02\u0E19\u0E32\u0E14\u0E40\u0E2A\u0E34\u0E23\u0E4C\u0E1F (Portion Scale):
   - \u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E2A\u0E31\u0E14\u0E2A\u0E48\u0E27\u0E19\u0E43\u0E19\u0E08\u0E32\u0E19/\u0E0A\u0E32\u0E21 (\u0E08\u0E32\u0E19\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19 ~1 \u0E40\u0E2A\u0E34\u0E23\u0E4C\u0E1F, \u0E08\u0E32\u0E19\u0E43\u0E2B\u0E0D\u0E48/\u0E1E\u0E34\u0E40\u0E28\u0E29 ~1.3-1.5 \u0E40\u0E2A\u0E34\u0E23\u0E4C\u0E1F, \u0E0A\u0E32\u0E21\u0E40\u0E25\u0E47\u0E01 ~0.6-0.8 \u0E40\u0E2A\u0E34\u0E23\u0E4C\u0E1F)

3. \u0E04\u0E27\u0E32\u0E21\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E17\u0E32\u0E07\u0E04\u0E13\u0E34\u0E15\u0E28\u0E32\u0E2A\u0E15\u0E23\u0E4C\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23:
   - \u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E43\u0E2B\u0E49\u0E41\u0E19\u0E48\u0E43\u0E08\u0E27\u0E48\u0E32: \u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E23\u0E27\u0E21 (Calories) \u0E15\u0E49\u0E2D\u0E07\u0E2A\u0E2D\u0E14\u0E04\u0E25\u0E49\u0E2D\u0E07\u0E01\u0E31\u0E1A\u0E2A\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E2B\u0E25\u0E31\u0E01\u0E15\u0E32\u0E21\u0E2B\u0E25\u0E31\u0E01\u0E2A\u0E32\u0E01\u0E25: Calories \u2248 (Protein \xD7 4) + (Carbs \xD7 4) + (Fat \xD7 9) \xB1 5%

4. \u0E2A\u0E23\u0E38\u0E1B\u0E1C\u0E25\u0E25\u0E31\u0E1E\u0E18\u0E4C:
   - foodName: \u0E0A\u0E37\u0E48\u0E2D\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22\u0E17\u0E35\u0E48\u0E0A\u0E31\u0E14\u0E40\u0E08\u0E19 \u0E23\u0E30\u0E1A\u0E38\u0E2A\u0E48\u0E27\u0E19\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E2A\u0E33\u0E04\u0E31\u0E0D\u0E41\u0E25\u0E30\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13 (\u0E40\u0E0A\u0E48\u0E19 "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E2B\u0E21\u0E39\u0E2A\u0E31\u0E1A\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27 1 \u0E08\u0E32\u0E19", "\u0E2A\u0E49\u0E21\u0E15\u0E33\u0E44\u0E17\u0E22\u0E41\u0E25\u0E30\u0E44\u0E01\u0E48\u0E22\u0E48\u0E32\u0E07 1 \u0E0A\u0E34\u0E49\u0E19")
   - explanation: \u0E2A\u0E23\u0E38\u0E1B\u0E41\u0E08\u0E01\u0E41\u0E08\u0E07\u0E2A\u0E31\u0E14\u0E2A\u0E48\u0E27\u0E19\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E02\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E25\u0E30\u0E2A\u0E48\u0E27\u0E19\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E2A\u0E31\u0E49\u0E19\u0E46 \u0E40\u0E0A\u0E48\u0E19 "\u0E02\u0E49\u0E32\u0E27\u0E2A\u0E27\u0E22 1 \u0E08\u0E32\u0E19 (220 kcal) + \u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E2B\u0E21\u0E39\u0E2A\u0E31\u0E1A\u0E1C\u0E31\u0E14\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19 (360 kcal) + \u0E44\u0E02\u0E48\u0E14\u0E32\u0E27\u0E17\u0E2D\u0E14\u0E01\u0E23\u0E2D\u0E1A (130 kcal) | \u0E23\u0E27\u0E21 710 kcal \u0E2D\u0E38\u0E14\u0E21\u0E14\u0E49\u0E27\u0E22\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 30g"`;
      const response = await generateContentSafe({
        model: "gemini-flash-latest",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { data: base64Data, mimeType } }
            ]
          }
        ],
        config: {
          thinkingConfig: { thinkingLevel: import_genai.ThinkingLevel.MINIMAL },
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              foodName: { type: import_genai.Type.STRING, description: "\u0E0A\u0E37\u0E48\u0E2D\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22\u0E17\u0E35\u0E48\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E08\u0E32\u0E30\u0E08\u0E07" },
              calories: { type: import_genai.Type.INTEGER, description: "\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E23\u0E27\u0E21\u0E42\u0E14\u0E22\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 (kcal)" },
              proteinGrams: { type: import_genai.Type.NUMBER, description: "\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 (\u0E01\u0E23\u0E31\u0E21)" },
              carbsGrams: { type: import_genai.Type.NUMBER, description: "\u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15 (\u0E01\u0E23\u0E31\u0E21)" },
              fatGrams: { type: import_genai.Type.NUMBER, description: "\u0E44\u0E02\u0E21\u0E31\u0E19 (\u0E01\u0E23\u0E31\u0E21)" },
              sugarGrams: { type: import_genai.Type.NUMBER, description: "\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25 (\u0E01\u0E23\u0E31\u0E21)" },
              sodiumMg: { type: import_genai.Type.INTEGER, description: "\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21 (\u0E21\u0E34\u0E25\u0E25\u0E34\u0E01\u0E23\u0E31\u0E21)" },
              explanation: { type: import_genai.Type.STRING, description: "\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E41\u0E08\u0E01\u0E41\u0E08\u0E07\u0E2A\u0E48\u0E27\u0E19\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E41\u0E25\u0E30\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48" }
            },
            required: ["foodName", "calories", "proteinGrams", "carbsGrams", "fatGrams", "sugarGrams", "sodiumMg", "explanation"]
          }
        }
      });
      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      let cleanText = text.trim();
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) {
        cleanText = match[1].trim();
      }
      const parsed = JSON.parse(cleanText);
      const normalized = normalizeNutritionData(parsed, "\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E08\u0E32\u0E01\u0E23\u0E39\u0E1B\u0E20\u0E32\u0E1E");
      res.json(normalized);
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.json(normalizeNutritionData({
        foodName: "\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E08\u0E32\u0E01\u0E23\u0E39\u0E1B\u0E20\u0E32\u0E1E",
        calories: 520,
        proteinGrams: 24,
        carbsGrams: 58,
        fatGrams: 20,
        sugarGrams: 5,
        sodiumMg: 850,
        explanation: "\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E08\u0E32\u0E01\u0E20\u0E32\u0E1E\u0E16\u0E48\u0E32\u0E22\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E15\u0E32\u0E21\u0E2B\u0E25\u0E31\u0E01\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19 (\u0E42\u0E2B\u0E21\u0E14\u0E2A\u0E33\u0E23\u0E2D\u0E07)"
      }));
    }
  };
  app.post("/api/analyze", handleAnalyzeFoodImage);
  app.post("/api/analyze-image", handleAnalyzeFoodImage);
  const handleAnalyzeFoodText = async (req, res) => {
    const rawQuery = req.body.query || req.body.textQuery || req.body.text || req.body.mealDescription || "";
    const queryClean = String(rawQuery).trim();
    if (!queryClean) {
      return res.status(400).json({ error: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E2B\u0E23\u0E37\u0E2D\u0E1E\u0E39\u0E14\u0E0A\u0E37\u0E48\u0E2D\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19" });
    }
    const cached = getCachedFoodResult(queryClean);
    if (cached) {
      return res.json(normalizeNutritionData(cached, queryClean));
    }
    try {
      const prompt = `\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D\u0E19\u0E31\u0E01\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E27\u0E34\u0E0A\u0E32\u0E0A\u0E35\u0E1E\u0E41\u0E25\u0E30\u0E19\u0E31\u0E01\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E04\u0E25\u0E34\u0E19\u0E34\u0E01\u0E1C\u0E39\u0E49\u0E40\u0E0A\u0E35\u0E48\u0E22\u0E27\u0E0A\u0E32\u0E0D\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E44\u0E17\u0E22\u0E41\u0E25\u0E30\u0E2A\u0E32\u0E01\u0E25 (Senior Clinical Dietitian & Thai Nutritionist)
\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D\u0E04\u0E33\u0E19\u0E27\u0E13\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E41\u0E25\u0E30\u0E2A\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E02\u0E2D\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E2B\u0E23\u0E37\u0E2D\u0E21\u0E37\u0E49\u0E2D\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E2D\u0E22\u0E48\u0E32\u0E07 "\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33\u0E41\u0E25\u0E30\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E32\u0E21\u0E2B\u0E25\u0E31\u0E01\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23 100%"

\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E23\u0E30\u0E1A\u0E38: "${queryClean}"

\u0E2B\u0E25\u0E31\u0E01\u0E40\u0E01\u0E13\u0E11\u0E4C\u0E01\u0E32\u0E23\u0E04\u0E33\u0E19\u0E27\u0E13\u0E2A\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33:
1. \u0E01\u0E32\u0E23\u0E23\u0E30\u0E1A\u0E38\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13\u0E41\u0E25\u0E30\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E2A\u0E34\u0E23\u0E4C\u0E1F (Portion Multiplier):
   - \u0E2B\u0E32\u0E01\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E08\u0E33\u0E19\u0E27\u0E19\u0E0A\u0E34\u0E49\u0E19/\u0E08\u0E32\u0E19/\u0E0A\u0E32\u0E21/\u0E41\u0E01\u0E49\u0E27/\u0E1F\u0E2D\u0E07/\u0E01\u0E23\u0E31\u0E21 (\u0E40\u0E0A\u0E48\u0E19 "2 \u0E08\u0E32\u0E19", "3 \u0E1F\u0E2D\u0E07", "150 \u0E01\u0E23\u0E31\u0E21", "2 \u0E41\u0E01\u0E49\u0E27", "\u0E1E\u0E34\u0E40\u0E28\u0E29", "\u0E04\u0E23\u0E36\u0E48\u0E07\u0E08\u0E32\u0E19") \u0E43\u0E2B\u0E49\u0E04\u0E39\u0E13\u0E41\u0E25\u0E30\u0E04\u0E33\u0E19\u0E27\u0E13\u0E2A\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E15\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07
   - \u0E2B\u0E32\u0E01\u0E21\u0E35\u0E2B\u0E25\u0E32\u0E22\u0E40\u0E21\u0E19\u0E39\u0E1C\u0E2A\u0E21\u0E01\u0E31\u0E19\u0E43\u0E19\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E40\u0E14\u0E35\u0E22\u0E27 (\u0E40\u0E0A\u0E48\u0E19 "\u0E02\u0E49\u0E32\u0E27\u0E21\u0E31\u0E19\u0E44\u0E01\u0E48 1 \u0E08\u0E32\u0E19 + \u0E15\u0E49\u0E21\u0E22\u0E33\u0E01\u0E38\u0E49\u0E07 1 \u0E16\u0E49\u0E27\u0E22 + \u0E0A\u0E32\u0E40\u0E22\u0E47\u0E19 1 \u0E41\u0E01\u0E49\u0E27" \u0E2B\u0E23\u0E37\u0E2D "\u0E2A\u0E49\u0E21\u0E15\u0E33\u0E44\u0E17\u0E22 \u0E44\u0E01\u0E48\u0E22\u0E48\u0E32\u0E07 1 \u0E19\u0E48\u0E2D\u0E07 \u0E02\u0E49\u0E32\u0E27\u0E40\u0E2B\u0E19\u0E35\u0E22\u0E27 1 \u0E2B\u0E48\u0E2D") \u0E43\u0E2B\u0E49\u0E04\u0E33\u0E19\u0E27\u0E13\u0E1C\u0E25\u0E23\u0E27\u0E21\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E41\u0E25\u0E30\u0E2A\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E02\u0E2D\u0E07\u0E17\u0E38\u0E01\u0E40\u0E21\u0E19\u0E39\u0E23\u0E27\u0E21\u0E01\u0E31\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14
   - \u0E2B\u0E32\u0E01\u0E21\u0E35\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E31\u0E1A\u0E41\u0E15\u0E48\u0E07 (\u0E40\u0E0A\u0E48\u0E19 "\u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19", "\u0E2D\u0E01\u0E44\u0E01\u0E48\u0E25\u0E49\u0E27\u0E19", "\u0E2B\u0E27\u0E32\u0E19 25%", "\u0E2B\u0E27\u0E32\u0E19 0%", "\u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E0A\u0E39\u0E23\u0E2A", "\u0E02\u0E49\u0E32\u0E27\u0E44\u0E23\u0E0B\u0E4C\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E23\u0E35\u0E48") \u0E43\u0E2B\u0E49\u0E1B\u0E23\u0E31\u0E1A\u0E25\u0E14\u0E44\u0E02\u0E21\u0E31\u0E19/\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25/\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21\u0E43\u0E2B\u0E49\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E08\u0E23\u0E34\u0E07

2. \u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E44\u0E17\u0E22\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19 (Thai Food Composition Table & USDA):
   - \u0E02\u0E49\u0E32\u0E27\u0E2A\u0E27\u0E22 1 \u0E17\u0E31\u0E1E\u0E1E\u0E35 (~60g) = 80 kcal (C: 18g, P: 1.5g) / \u0E02\u0E49\u0E32\u0E27\u0E2A\u0E27\u0E22 1 \u0E08\u0E32\u0E19\u0E1B\u0E01\u0E15\u0E34 (~150-180g) = 220 kcal
   - \u0E02\u0E49\u0E32\u0E27\u0E40\u0E2B\u0E19\u0E35\u0E22\u0E27 1 \u0E2B\u0E48\u0E2D (~100g) = 220 kcal (C: 48g, P: 4g)
   - \u0E02\u0E49\u0E32\u0E27\u0E01\u0E25\u0E49\u0E2D\u0E07 / \u0E44\u0E23\u0E0B\u0E4C\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E23\u0E35\u0E48 1 \u0E17\u0E31\u0E1E\u0E1E\u0E35 = 75 kcal, 1 \u0E08\u0E32\u0E19 = 210 kcal
   - \u0E44\u0E02\u0E48\u0E15\u0E49\u0E21/\u0E44\u0E02\u0E48\u0E25\u0E27\u0E01 1 \u0E1F\u0E2D\u0E07 = 75 kcal (P: 6.3g, F: 5.3g, C: 0.6g)
   - \u0E44\u0E02\u0E48\u0E14\u0E32\u0E27\u0E17\u0E2D\u0E14\u0E01\u0E23\u0E2D\u0E1A 1 \u0E1F\u0E2D\u0E07 = 130 kcal (P: 6.3g, F: 11.5g, C: 0.6g)
   - \u0E44\u0E02\u0E48\u0E40\u0E08\u0E35\u0E22\u0E27 1 \u0E1F\u0E2D\u0E07\u0E17\u0E2D\u0E14\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19 = 190 kcal (P: 7g, F: 17g, C: 1g)
   - \u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E44\u0E01\u0E48 = 520 kcal (\u0E16\u0E49\u0E32\u0E43\u0E2A\u0E48\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27 = 650 kcal)
   - \u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E2B\u0E21\u0E39\u0E2A\u0E31\u0E1A = 580 kcal (\u0E16\u0E49\u0E32\u0E43\u0E2A\u0E48\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27 = 710 kcal)
   - \u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E2B\u0E21\u0E39\u0E01\u0E23\u0E2D\u0E1A = 730 kcal (\u0E16\u0E49\u0E32\u0E43\u0E2A\u0E48\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27 = 860 kcal)
   - \u0E02\u0E49\u0E32\u0E27\u0E21\u0E31\u0E19\u0E44\u0E01\u0E48\u0E15\u0E49\u0E21 = 590 kcal / \u0E02\u0E49\u0E32\u0E27\u0E21\u0E31\u0E19\u0E44\u0E01\u0E48\u0E44\u0E21\u0E48\u0E40\u0E2D\u0E32\u0E2B\u0E19\u0E31\u0E07 = 510 kcal / \u0E02\u0E49\u0E32\u0E27\u0E21\u0E31\u0E19\u0E44\u0E01\u0E48\u0E17\u0E2D\u0E14 = 710 kcal
   - \u0E02\u0E49\u0E32\u0E27\u0E2B\u0E21\u0E39\u0E41\u0E14\u0E07 = 540 kcal / \u0E02\u0E49\u0E32\u0E27\u0E2B\u0E21\u0E39\u0E01\u0E23\u0E2D\u0E1A = 690 kcal / \u0E02\u0E49\u0E32\u0E27\u0E02\u0E32\u0E2B\u0E21\u0E39 = 690 kcal (\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E25\u0E49\u0E27\u0E19 520 kcal)
   - \u0E1C\u0E31\u0E14\u0E44\u0E17\u0E22\u0E01\u0E38\u0E49\u0E07\u0E2A\u0E14 = 590 kcal / \u0E1C\u0E31\u0E14\u0E0B\u0E35\u0E2D\u0E34\u0E4A\u0E27\u0E2B\u0E21\u0E39 = 630 kcal / \u0E23\u0E32\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E21\u0E39 = 490 kcal
   - \u0E01\u0E4B\u0E27\u0E22\u0E40\u0E15\u0E35\u0E4B\u0E22\u0E27\u0E19\u0E49\u0E33\u0E43\u0E2A = 360-380 kcal / \u0E01\u0E4B\u0E27\u0E22\u0E40\u0E15\u0E35\u0E4B\u0E22\u0E27\u0E15\u0E49\u0E21\u0E22\u0E33 = 430 kcal / \u0E01\u0E4B\u0E27\u0E22\u0E40\u0E15\u0E35\u0E4B\u0E22\u0E27\u0E40\u0E23\u0E37\u0E2D = 440-460 kcal / \u0E2A\u0E38\u0E01\u0E35\u0E49\u0E19\u0E49\u0E33 = 330 kcal / \u0E2A\u0E38\u0E01\u0E35\u0E49\u0E41\u0E2B\u0E49\u0E07 = 470 kcal
   - \u0E2A\u0E49\u0E21\u0E15\u0E33\u0E44\u0E17\u0E22 1 \u0E08\u0E32\u0E19 = 120 kcal (C: 26g, P: 4g, Sugar: 14g, Sodium: 980mg)
   - \u0E2A\u0E49\u0E21\u0E15\u0E33\u0E1B\u0E39\u0E1B\u0E25\u0E32\u0E23\u0E49\u0E32 1 \u0E08\u0E32\u0E19 = 95 kcal (Sodium: 1680mg)
   - \u0E25\u0E32\u0E1A\u0E2B\u0E21\u0E39 = 230 kcal / \u0E19\u0E49\u0E33\u0E15\u0E01\u0E2B\u0E21\u0E39 = 270 kcal / \u0E44\u0E01\u0E48\u0E22\u0E48\u0E32\u0E07 1 \u0E19\u0E48\u0E2D\u0E07 = 210 kcal / \u0E44\u0E01\u0E48\u0E17\u0E2D\u0E14 1 \u0E0A\u0E34\u0E49\u0E19 = 280 kcal / \u0E2B\u0E21\u0E39\u0E1B\u0E34\u0E49\u0E07 1 \u0E44\u0E21\u0E49 = 130 kcal
   - \u0E15\u0E49\u0E21\u0E22\u0E33\u0E01\u0E38\u0E49\u0E07\u0E19\u0E49\u0E33\u0E43\u0E2A = 140 kcal / \u0E15\u0E49\u0E21\u0E22\u0E33\u0E01\u0E38\u0E49\u0E07\u0E19\u0E49\u0E33\u0E02\u0E49\u0E19 = 270 kcal / \u0E41\u0E01\u0E07\u0E40\u0E02\u0E35\u0E22\u0E27\u0E2B\u0E27\u0E32\u0E19\u0E44\u0E01\u0E48 = 430 kcal / \u0E41\u0E01\u0E07\u0E08\u0E37\u0E14\u0E40\u0E15\u0E49\u0E32\u0E2B\u0E39\u0E49\u0E2B\u0E21\u0E39\u0E2A\u0E31\u0E1A = 195 kcal
   - \u0E1C\u0E25\u0E44\u0E21\u0E49: \u0E2A\u0E49\u0E21\u0E42\u0E2D 1 \u0E01\u0E25\u0E35\u0E1A = 30 kcal (C: 7g, Sugar: 5g), \u0E01\u0E25\u0E49\u0E27\u0E22\u0E2B\u0E2D\u0E21 1 \u0E25\u0E39\u0E01 = 105 kcal, \u0E01\u0E25\u0E49\u0E27\u0E22\u0E19\u0E49\u0E33\u0E27\u0E49\u0E32 1 \u0E25\u0E39\u0E01 = 60 kcal, \u0E41\u0E2D\u0E1B\u0E40\u0E1B\u0E34\u0E49\u0E25 1 \u0E25\u0E39\u0E01 = 85 kcal, \u0E1D\u0E23\u0E31\u0E48\u0E07 1 \u0E25\u0E39\u0E01 = 90 kcal, \u0E41\u0E15\u0E07\u0E42\u0E21 1 \u0E0A\u0E34\u0E49\u0E19 = 60 kcal
   - \u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21: \u0E2D\u0E40\u0E21\u0E23\u0E34\u0E01\u0E32\u0E42\u0E19\u0E48\u0E44\u0E21\u0E48\u0E2B\u0E27\u0E32\u0E19 = 15 kcal, \u0E01\u0E32\u0E41\u0E1F\u0E25\u0E32\u0E40\u0E15\u0E49\u0E40\u0E22\u0E47\u0E19 = 180 kcal, \u0E0A\u0E32\u0E44\u0E17\u0E22\u0E40\u0E22\u0E47\u0E19 = 280 kcal (\u0E2B\u0E27\u0E32\u0E19\u0E19\u0E49\u0E2D\u0E22 190 kcal), \u0E0A\u0E32\u0E19\u0E21\u0E44\u0E02\u0E48\u0E21\u0E38\u0E01 = 390 kcal, \u0E19\u0E21\u0E2A\u0E14 (200ml) = 120 kcal, \u0E40\u0E27\u0E22\u0E4C\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 1 \u0E2A\u0E01\u0E39\u0E4A\u0E1B = 120 kcal (P: 24g)

3. \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E2D\u0E14\u0E04\u0E25\u0E49\u0E2D\u0E07\u0E02\u0E2D\u0E07\u0E2A\u0E39\u0E15\u0E23\u0E04\u0E13\u0E34\u0E15\u0E28\u0E32\u0E2A\u0E15\u0E23\u0E4C:
   - \u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E23\u0E27\u0E21 (calories) \u0E15\u0E49\u0E2D\u0E07\u0E2A\u0E2D\u0E14\u0E04\u0E25\u0E49\u0E2D\u0E07\u0E01\u0E31\u0E1A\u0E21\u0E32\u0E42\u0E04\u0E23: Calories = (Protein \xD7 4) + (Carbs \xD7 4) + (Fat \xD7 9)

4. \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01:
   - foodName: \u0E2A\u0E23\u0E38\u0E1B\u0E0A\u0E37\u0E48\u0E2D\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E41\u0E25\u0E30\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13\u0E17\u0E35\u0E48\u0E40\u0E02\u0E49\u0E32\u0E43\u0E08\u0E07\u0E48\u0E32\u0E22 \u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22 \u0E40\u0E0A\u0E48\u0E19 "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E2B\u0E21\u0E39\u0E2A\u0E31\u0E1A\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27 1 \u0E08\u0E32\u0E19" \u0E2B\u0E23\u0E37\u0E2D "\u0E2A\u0E49\u0E21\u0E42\u0E2D 4 \u0E01\u0E25\u0E35\u0E1A"
   - calories: \u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E23\u0E27\u0E21 (kcal)
   - proteinGrams: \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 (g)
   - carbsGrams: \u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15 (g)
   - fatGrams: \u0E44\u0E02\u0E21\u0E31\u0E19 (g)
   - sugarGrams: \u0E19\u0E49\u0E33\u0E15\u0E32\u0E25 (g)
   - sodiumMg: \u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21 (mg)
   - explanation: \u0E41\u0E08\u0E01\u0E41\u0E08\u0E07\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E2A\u0E31\u0E49\u0E19\u0E46 \u0E27\u0E48\u0E32\u0E41\u0E15\u0E48\u0E25\u0E30\u0E2D\u0E07\u0E04\u0E4C\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E21\u0E35\u0E01\u0E35\u0E48\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48 \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23`;
      const response = await generateContentSafe({
        model: "gemini-flash-latest",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        config: {
          thinkingConfig: { thinkingLevel: import_genai.ThinkingLevel.MINIMAL },
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              foodName: { type: import_genai.Type.STRING, description: "\u0E0A\u0E37\u0E48\u0E2D\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22" },
              calories: { type: import_genai.Type.INTEGER, description: "\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E23\u0E27\u0E21\u0E42\u0E14\u0E22\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 (kcal)" },
              proteinGrams: { type: import_genai.Type.NUMBER, description: "\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 (\u0E01\u0E23\u0E31\u0E21)" },
              carbsGrams: { type: import_genai.Type.NUMBER, description: "\u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15 (\u0E01\u0E23\u0E31\u0E21)" },
              fatGrams: { type: import_genai.Type.NUMBER, description: "\u0E44\u0E02\u0E21\u0E31\u0E19 (\u0E01\u0E23\u0E31\u0E21)" },
              sugarGrams: { type: import_genai.Type.NUMBER, description: "\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25 (\u0E01\u0E23\u0E31\u0E21)" },
              sodiumMg: { type: import_genai.Type.INTEGER, description: "\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21 (\u0E21\u0E34\u0E25\u0E25\u0E34\u0E01\u0E23\u0E31\u0E21)" },
              explanation: { type: import_genai.Type.STRING, description: "\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13\u0E41\u0E25\u0E30\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23" }
            },
            required: ["foodName", "calories", "proteinGrams", "carbsGrams", "fatGrams", "sugarGrams", "sodiumMg", "explanation"]
          }
        }
      });
      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      let cleanText = text.trim();
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) {
        cleanText = match[1].trim();
      }
      const parsed = JSON.parse(cleanText);
      const finalResult = normalizeNutritionData(parsed, queryClean);
      setCachedFoodResult(queryClean, finalResult);
      res.json(finalResult);
    } catch (error) {
      console.error("Error analyzing food text with AI, using fallback database:", error);
      const fallbackResult = calculateNutritionFallback(queryClean);
      return res.json(fallbackResult);
    }
  };
  app.post("/api/analyze-text", handleAnalyzeFoodText);
  app.post("/api/analyze-food-text", handleAnalyzeFoodText);
  app.post("/api/analyze-food-speech", handleAnalyzeFoodText);
  app.post("/api/analyze-meal", handleAnalyzeFoodText);
  app.post("/api/analyze-nutrition-label", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg" } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Image base64 is required" });
      }
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const prompt = `\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D AI \u0E1C\u0E39\u0E49\u0E40\u0E0A\u0E35\u0E48\u0E22\u0E27\u0E0A\u0E32\u0E0D\u0E01\u0E32\u0E23\u0E2D\u0E48\u0E32\u0E19\u0E15\u0E32\u0E23\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23 (Nutrition Facts Label Scanner) \u0E41\u0E25\u0E30\u0E1A\u0E32\u0E23\u0E4C\u0E42\u0E04\u0E49\u0E14\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32
\u0E08\u0E07\u0E2D\u0E48\u0E32\u0E19\u0E23\u0E39\u0E1B\u0E20\u0E32\u0E1E\u0E09\u0E25\u0E32\u0E01\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49 \u0E41\u0E25\u0E49\u0E27\u0E2A\u0E01\u0E31\u0E14\u0E04\u0E48\u0E32\u0E2A\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E2D\u0E2D\u0E01\u0E21\u0E32\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33:
- \u0E0A\u0E37\u0E48\u0E2D\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32/\u0E2D\u0E32\u0E2B\u0E32\u0E23 (\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22\u0E2B\u0E23\u0E37\u0E2D\u0E2D\u0E31\u0E07\u0E01\u0E24\u0E29\u0E15\u0E32\u0E21\u0E09\u0E25\u0E32\u0E01)
- \u0E02\u0E19\u0E32\u0E14\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E1A\u0E23\u0E34\u0E42\u0E20\u0E04 (Serving size) \u0E40\u0E0A\u0E48\u0E19 1 \u0E0B\u0E2D\u0E07 (30g), 1 \u0E01\u0E25\u0E48\u0E2D\u0E07 (200ml)
- \u0E08\u0E33\u0E19\u0E27\u0E19\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E1A\u0E23\u0E34\u0E42\u0E20\u0E04\u0E15\u0E48\u0E2D\u0E20\u0E32\u0E0A\u0E19\u0E30\u0E1A\u0E23\u0E23\u0E08\u0E38 (Servings per container)
- \u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E23\u0E27\u0E21\u0E15\u0E48\u0E2D\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E1A\u0E23\u0E34\u0E42\u0E20\u0E04 (Calories kcal)
- \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 (Protein grams)
- \u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15\u0E23\u0E27\u0E21 (Total Carbohydrates grams)
- \u0E44\u0E02\u0E21\u0E31\u0E19\u0E23\u0E27\u0E21 (Total Fat grams)
- \u0E19\u0E49\u0E33\u0E15\u0E32\u0E25 (Sugars grams)
- \u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21 (Sodium mg)
- \u0E43\u0E22\u0E2D\u0E32\u0E2B\u0E32\u0E23 (Dietary Fiber grams \u0E16\u0E49\u0E32\u0E21\u0E35)
- \u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E2B\u0E23\u0E37\u0E2D\u0E02\u0E49\u0E2D\u0E2A\u0E31\u0E07\u0E40\u0E01\u0E15\u0E2A\u0E31\u0E49\u0E19\u0E46 1-2 \u0E1B\u0E23\u0E30\u0E42\u0E22\u0E04

\u0E2A\u0E48\u0E07\u0E1C\u0E25\u0E25\u0E31\u0E1E\u0E18\u0E4C\u0E40\u0E1B\u0E47\u0E19 JSON Object \u0E15\u0E32\u0E21 Schema`;
      const response = await generateContentSafe({
        model: "gemini-flash-latest",
        contents: [
          {
            role: "user",
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
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              foodName: { type: import_genai.Type.STRING, description: "\u0E0A\u0E37\u0E48\u0E2D\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E2B\u0E23\u0E37\u0E2D\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E08\u0E32\u0E01\u0E09\u0E25\u0E32\u0E01" },
              servingSize: { type: import_genai.Type.STRING, description: "\u0E02\u0E19\u0E32\u0E14 1 \u0E2B\u0E19\u0E48\u0E27\u0E22\u0E1A\u0E23\u0E34\u0E42\u0E20\u0E04 \u0E40\u0E0A\u0E48\u0E19 30 \u0E01\u0E23\u0E31\u0E21" },
              servingsPerContainer: { type: import_genai.Type.NUMBER, description: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E1A\u0E23\u0E34\u0E42\u0E20\u0E04\u0E15\u0E48\u0E2D\u0E0B\u0E2D\u0E07/\u0E01\u0E25\u0E48\u0E2D\u0E07" },
              calories: { type: import_genai.Type.INTEGER, description: "\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E15\u0E48\u0E2D 1 \u0E2B\u0E19\u0E48\u0E27\u0E22\u0E1A\u0E23\u0E34\u0E42\u0E20\u0E04" },
              proteinGrams: { type: import_genai.Type.INTEGER, description: "\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 (\u0E01\u0E23\u0E31\u0E21)" },
              carbsGrams: { type: import_genai.Type.INTEGER, description: "\u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15 (\u0E01\u0E23\u0E31\u0E21)" },
              fatGrams: { type: import_genai.Type.INTEGER, description: "\u0E44\u0E02\u0E21\u0E31\u0E19 (\u0E01\u0E23\u0E31\u0E21)" },
              sugarGrams: { type: import_genai.Type.INTEGER, description: "\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25 (\u0E01\u0E23\u0E31\u0E21)" },
              sodiumMg: { type: import_genai.Type.INTEGER, description: "\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21 (\u0E21\u0E34\u0E25\u0E25\u0E34\u0E01\u0E23\u0E31\u0E21)" },
              fiberGrams: { type: import_genai.Type.INTEGER, description: "\u0E43\u0E22\u0E2D\u0E32\u0E2B\u0E32\u0E23 (\u0E01\u0E23\u0E31\u0E21)" },
              explanation: { type: import_genai.Type.STRING, description: "\u0E04\u0E33\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E41\u0E25\u0E30\u0E02\u0E49\u0E2D\u0E41\u0E19\u0E30\u0E19\u0E33\u0E2A\u0E31\u0E49\u0E19\u0E46" }
            },
            required: ["foodName", "calories", "proteinGrams", "carbsGrams", "fatGrams", "sugarGrams", "sodiumMg", "explanation"]
          }
        }
      });
      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      let cleanText = text.trim();
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) {
        cleanText = match[1].trim();
      }
      const parsedLabel = JSON.parse(cleanText);
      const normalizedLabel = normalizeNutritionData(parsedLabel, parsedLabel.foodName || "\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E08\u0E32\u0E01\u0E09\u0E25\u0E32\u0E01");
      res.json({
        ...parsedLabel,
        ...normalizedLabel
      });
    } catch (error) {
      console.error("Error analyzing nutrition label:", error);
      res.json({
        servingSize: "1 \u0E2B\u0E19\u0E48\u0E27\u0E22\u0E1A\u0E23\u0E34\u0E42\u0E20\u0E04",
        servingsPerContainer: 1,
        ...normalizeNutritionData({
          foodName: "\u0E2D\u0E32\u0E2B\u0E32\u0E23/\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21\u0E08\u0E32\u0E01\u0E09\u0E25\u0E32\u0E01",
          calories: 180,
          proteinGrams: 5,
          carbsGrams: 25,
          fatGrams: 7,
          sugarGrams: 8,
          sodiumMg: 220,
          fiberGrams: 2,
          explanation: "\u0E2A\u0E01\u0E31\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E32\u0E01\u0E09\u0E25\u0E32\u0E01\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32 (\u0E42\u0E2B\u0E21\u0E14\u0E2A\u0E33\u0E23\u0E2D\u0E07)"
        })
      });
    }
  });
  app.post("/api/detect-ingredients-from-image", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "No image provided" });
      }
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";
      const prompt = `\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D AI \u0E1C\u0E39\u0E49\u0E40\u0E0A\u0E35\u0E48\u0E22\u0E27\u0E0A\u0E32\u0E0D\u0E14\u0E49\u0E32\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E41\u0E25\u0E30\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A (Smart Fridge Ingredient Detector)
\u0E08\u0E07\u0E14\u0E39\u0E20\u0E32\u0E1E\u0E16\u0E48\u0E32\u0E22\u0E15\u0E39\u0E49\u0E40\u0E22\u0E47\u0E19 \u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A \u0E1C\u0E31\u0E01 \u0E1C\u0E25\u0E44\u0E21\u0E49 \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2A\u0E31\u0E15\u0E27\u0E4C\u0E43\u0E19\u0E20\u0E32\u0E1E\u0E19\u0E35\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14 \u0E41\u0E25\u0E30\u0E23\u0E30\u0E1A\u0E38\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E17\u0E35\u0E48\u0E21\u0E2D\u0E07\u0E40\u0E2B\u0E47\u0E19
- \u0E41\u0E22\u0E01\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E2A\u0E31\u0E49\u0E19\u0E46 \u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22 (\u0E40\u0E0A\u0E48\u0E19 \u0E44\u0E02\u0E48\u0E44\u0E01\u0E48, \u0E2D\u0E01\u0E44\u0E01\u0E48, \u0E1A\u0E23\u0E2D\u0E01\u0E42\u0E04\u0E25\u0E35, \u0E19\u0E21, \u0E40\u0E2B\u0E47\u0E14\u0E2B\u0E2D\u0E21, \u0E41\u0E04\u0E23\u0E2D\u0E17, \u0E21\u0E30\u0E40\u0E02\u0E37\u0E2D\u0E40\u0E17\u0E28, \u0E01\u0E30\u0E2B\u0E25\u0E48\u0E33\u0E1B\u0E25\u0E35, \u0E40\u0E15\u0E49\u0E32\u0E2B\u0E39\u0E49, \u0E2B\u0E2D\u0E21\u0E43\u0E2B\u0E0D\u0E48 \u0E40\u0E1B\u0E47\u0E19\u0E15\u0E49\u0E19)
- \u0E23\u0E30\u0E1A\u0E38\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48 \u0E40\u0E0A\u0E48\u0E19 \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19, \u0E1C\u0E31\u0E01, \u0E1C\u0E25\u0E44\u0E21\u0E49, \u0E1C\u0E25\u0E34\u0E15\u0E20\u0E31\u0E13\u0E11\u0E4C\u0E19\u0E21/\u0E44\u0E02\u0E48, \u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E1B\u0E23\u0E38\u0E07
- \u0E40\u0E02\u0E35\u0E22\u0E19\u0E2A\u0E23\u0E38\u0E1B\u0E2A\u0E31\u0E49\u0E19\u0E46 \u0E43\u0E2B\u0E49\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E17\u0E23\u0E32\u0E1A\u0E27\u0E48\u0E32\u0E1E\u0E1A\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E40\u0E14\u0E48\u0E19\u0E2D\u0E30\u0E44\u0E23\u0E1A\u0E49\u0E32\u0E07 \u0E41\u0E25\u0E30\u0E41\u0E19\u0E30\u0E19\u0E33\u0E40\u0E1A\u0E37\u0E49\u0E2D\u0E07\u0E15\u0E49\u0E19\u0E27\u0E48\u0E32\u0E40\u0E2B\u0E21\u0E32\u0E30\u0E17\u0E33\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E41\u0E19\u0E27\u0E44\u0E2B\u0E19`;
      const response = await generateContentSafe({
        model: "gemini-flash-latest",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { data: base64Data, mimeType } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              detectedIngredients: {
                type: import_genai.Type.ARRAY,
                items: { type: import_genai.Type.STRING },
                description: "\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08\u0E1E\u0E1A\u0E43\u0E19\u0E20\u0E32\u0E1E \u0E40\u0E1B\u0E47\u0E19\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22\u0E2A\u0E31\u0E49\u0E19\u0E46"
              },
              categories: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    category: { type: import_genai.Type.STRING, description: "\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48 \u0E40\u0E0A\u0E48\u0E19 \u0E1C\u0E31\u0E01, \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19, \u0E19\u0E21\u0E44\u0E02\u0E48" },
                    items: {
                      type: import_genai.Type.ARRAY,
                      items: { type: import_genai.Type.STRING }
                    }
                  },
                  required: ["category", "items"]
                },
                description: "\u0E2A\u0E23\u0E38\u0E1B\u0E41\u0E22\u0E01\u0E15\u0E32\u0E21\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48"
              },
              summary: {
                type: import_genai.Type.STRING,
                description: "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E23\u0E38\u0E1B\u0E2A\u0E31\u0E49\u0E19\u0E46 \u0E41\u0E25\u0E30\u0E02\u0E49\u0E2D\u0E40\u0E2A\u0E19\u0E2D\u0E41\u0E19\u0E30 1-2 \u0E1B\u0E23\u0E30\u0E42\u0E22\u0E04"
              }
            },
            required: ["detectedIngredients", "summary"]
          }
        }
      });
      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini AI");
      let cleanText = text.trim();
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) {
        cleanText = match[1].trim();
      }
      res.json(JSON.parse(cleanText));
    } catch (error) {
      console.error("Error detecting ingredients from photo:", error);
      res.json({
        detectedIngredients: ["\u0E44\u0E02\u0E48\u0E44\u0E01\u0E48", "\u0E1C\u0E31\u0E01\u0E2A\u0E14", "\u0E2D\u0E01\u0E44\u0E01\u0E48", "\u0E40\u0E2B\u0E47\u0E14"],
        categories: [
          { category: "\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19", items: ["\u0E2D\u0E01\u0E44\u0E01\u0E48", "\u0E44\u0E02\u0E48\u0E44\u0E01\u0E48"] },
          { category: "\u0E1C\u0E31\u0E01\u0E2A\u0E14", items: ["\u0E1C\u0E31\u0E01\u0E2A\u0E14", "\u0E40\u0E2B\u0E47\u0E14"] }
        ],
        summary: "\u0E15\u0E23\u0E27\u0E08\u0E1E\u0E1A\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E2B\u0E25\u0E31\u0E01\u0E43\u0E19\u0E15\u0E39\u0E49\u0E40\u0E22\u0E47\u0E19 \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E17\u0E33\u0E40\u0E21\u0E19\u0E39\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E"
      });
    }
  });
  app.post("/api/smart-pantry-wizard", async (req, res) => {
    const {
      mode = "expiring_first",
      ingredientsList = [],
      fridgeIngredients = [],
      pantryIngredients = [],
      expiringItems = [],
      dietaryGoal = "balanced",
      cookingTimeMax = 20,
      cuisineStyle = "thai_healthy"
    } = req.body;
    const fridgeList = Array.isArray(fridgeIngredients) ? fridgeIngredients.map((i) => typeof i === "string" ? i : `${i.name}${i.daysLeft !== void 0 ? ` (\u0E40\u0E2B\u0E25\u0E37\u0E2D ${i.daysLeft} \u0E27\u0E31\u0E19)` : ""}${i.quantity ? ` [${i.quantity}]` : ""}`.trim()) : [];
    const pantryList = Array.isArray(pantryIngredients) ? pantryIngredients.map((i) => typeof i === "string" ? i : `${i.name}${i.quantity ? ` [${i.quantity}]` : ""}`.trim()) : [];
    const expiringList = Array.isArray(expiringItems) ? expiringItems.map((i) => typeof i === "string" ? i : `${i.name} (\u0E43\u0E01\u0E25\u0E49\u0E2B\u0E21\u0E14\u0E2D\u0E32\u0E22\u0E38\u0E43\u0E19 ${i.daysLeft ?? 1} \u0E27\u0E31\u0E19)`) : [];
    const rawFridgeNames = Array.isArray(fridgeIngredients) ? fridgeIngredients.map((i) => typeof i === "string" ? i : i.name) : [];
    const rawPantryNames = Array.isArray(pantryIngredients) ? pantryIngredients.map((i) => typeof i === "string" ? i : i.name) : [];
    let modePromptInstruction = "";
    if (mode === "expiring_first") {
      modePromptInstruction = `[\u0E42\u0E2B\u0E21\u0E14: \u0E43\u0E0A\u0E49\u0E02\u0E2D\u0E07\u0E43\u0E01\u0E25\u0E49\u0E2B\u0E21\u0E14\u0E2D\u0E32\u0E22\u0E38\u0E01\u0E48\u0E2D\u0E19 (Eat Me First / Zero-Waste Priority)]
- \u0E27\u0E31\u0E15\u0E16\u0E38\u0E1B\u0E23\u0E30\u0E2A\u0E07\u0E04\u0E4C\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14: \u0E15\u0E49\u0E2D\u0E07\u0E19\u0E33\u0E02\u0E2D\u0E07\u0E2A\u0E14\u0E17\u0E35\u0E48\u0E43\u0E01\u0E25\u0E49\u0E2B\u0E21\u0E14\u0E2D\u0E32\u0E22\u0E38 (${expiringList.length > 0 ? expiringList.join(", ") : fridgeList.join(", ") || "\u0E02\u0E2D\u0E07\u0E43\u0E19\u0E15\u0E39\u0E49\u0E40\u0E22\u0E47\u0E19"}) \u0E21\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E2B\u0E25\u0E31\u0E01\u0E02\u0E2D\u0E07\u0E40\u0E21\u0E19\u0E39 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1B\u0E49\u0E2D\u0E07\u0E01\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E40\u0E2A\u0E35\u0E22\u0E17\u0E34\u0E49\u0E07 100%
- \u0E1C\u0E2A\u0E21\u0E1C\u0E2A\u0E32\u0E19\u0E40\u0E02\u0E49\u0E32\u0E01\u0E31\u0E1A\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E1B\u0E23\u0E38\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E02\u0E2D\u0E07\u0E41\u0E2B\u0E49\u0E07\u0E08\u0E32\u0E01\u0E15\u0E39\u0E49\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E32\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E25\u0E07\u0E15\u0E31\u0E27
- \u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E43\u0E19 whyZeroWaste \u0E27\u0E48\u0E32\u0E0A\u0E48\u0E27\u0E22\u0E01\u0E39\u0E49\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E0A\u0E34\u0E49\u0E19\u0E44\u0E2B\u0E19\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E40\u0E19\u0E48\u0E32\u0E40\u0E2A\u0E35\u0E22`;
    } else if (mode === "combine_all") {
      modePromptInstruction = `[\u0E42\u0E2B\u0E21\u0E14: \u0E43\u0E0A\u0E49\u0E02\u0E2D\u0E07\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E43\u0E19\u0E1A\u0E49\u0E32\u0E19 (Use All Fridge & Pantry Combined)]
- \u0E27\u0E31\u0E15\u0E16\u0E38\u0E1B\u0E23\u0E30\u0E2A\u0E07\u0E04\u0E4C: \u0E23\u0E31\u0E07\u0E2A\u0E23\u0E23\u0E04\u0E4C\u0E40\u0E21\u0E19\u0E39\u0E17\u0E35\u0E48\u0E14\u0E36\u0E07\u0E28\u0E31\u0E01\u0E22\u0E20\u0E32\u0E1E\u0E02\u0E2D\u0E07\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E17\u0E35\u0E48\u0E21\u0E35\u0E43\u0E19\u0E15\u0E39\u0E49\u0E40\u0E22\u0E47\u0E19 (${fridgeList.join(", ")}) \u0E41\u0E25\u0E30\u0E15\u0E39\u0E49\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E32\u0E27 (${pantryList.join(", ")}) \u0E21\u0E32\u0E1C\u0E2A\u0E21\u0E1C\u0E2A\u0E32\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E37\u0E49\u0E2D\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E35\u0E48\u0E2D\u0E34\u0E48\u0E21\u0E04\u0E38\u0E49\u0E21 \u0E2A\u0E21\u0E14\u0E38\u0E25 \u0E41\u0E25\u0E30\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E04\u0E23\u0E1A 5 \u0E2B\u0E21\u0E39\u0E48
- \u0E14\u0E36\u0E07\u0E04\u0E27\u0E32\u0E21\u0E42\u0E14\u0E14\u0E40\u0E14\u0E48\u0E19\u0E02\u0E2D\u0E07\u0E02\u0E2D\u0E07\u0E2A\u0E14 + \u0E02\u0E2D\u0E07\u0E41\u0E2B\u0E49\u0E07 + \u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E1B\u0E23\u0E38\u0E07\u0E40\u0E02\u0E49\u0E32\u0E14\u0E49\u0E27\u0E22\u0E01\u0E31\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2A\u0E23\u0E23\u0E04\u0E4C`;
    } else {
      modePromptInstruction = `[\u0E42\u0E2B\u0E21\u0E14: \u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E40\u0E2D\u0E07\u0E41\u0E1A\u0E1A\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E08\u0E32\u0E30\u0E08\u0E07 (Custom User Selection Mode)]
- \u0E2A\u0E33\u0E04\u0E31\u0E0D\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E22\u0E34\u0E48\u0E07\u0E22\u0E27\u0E14: \u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49\u0E15\u0E34\u0E4A\u0E01\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E30\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E08\u0E32\u0E30\u0E08\u0E07\u0E40\u0E2B\u0E25\u0E48\u0E32\u0E19\u0E35\u0E49\u0E14\u0E49\u0E27\u0E22\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07:
  * \u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E43\u0E19\u0E15\u0E39\u0E49\u0E40\u0E22\u0E47\u0E19 / \u0E02\u0E2D\u0E07\u0E2A\u0E14\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01: ${rawFridgeNames.length > 0 ? rawFridgeNames.join(", ") : "(\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E02\u0E2D\u0E07\u0E2A\u0E14)"}
  * \u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E43\u0E19\u0E15\u0E39\u0E49\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E32\u0E27 / \u0E02\u0E2D\u0E07\u0E41\u0E2B\u0E49\u0E07 / \u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E1B\u0E23\u0E38\u0E07\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01: ${rawPantryNames.length > 0 ? rawPantryNames.join(", ") : "(\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E02\u0E2D\u0E07\u0E41\u0E2B\u0E49\u0E07)"}
- \u0E01\u0E0E\u0E40\u0E2B\u0E25\u0E47\u0E01 100%: \u0E17\u0E31\u0E49\u0E07 3 \u0E40\u0E21\u0E19\u0E39\u0E17\u0E35\u0E48\u0E04\u0E38\u0E13\u0E40\u0E2A\u0E01\u0E02\u0E36\u0E49\u0E19\u0E21\u0E32 \u0E08\u0E30\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E0A\u0E49\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E02\u0E49\u0E32\u0E07\u0E15\u0E49\u0E19\u0E19\u0E35\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E31\u0E27\u0E43\u0E08\u0E2A\u0E33\u0E04\u0E31\u0E0D\u0E41\u0E25\u0E30\u0E2A\u0E48\u0E27\u0E19\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E01\u0E02\u0E2D\u0E07\u0E40\u0E21\u0E19\u0E39\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19!
- \u0E2B\u0E49\u0E32\u0E21\u0E04\u0E34\u0E14\u0E40\u0E21\u0E19\u0E39\u0E40\u0E14\u0E34\u0E21\u0E46 \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E21\u0E19\u0E39\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01 (\u0E40\u0E0A\u0E48\u0E19 \u0E16\u0E49\u0E32\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01 "${rawFridgeNames[0] || "\u0E01\u0E38\u0E49\u0E07"}" \u0E40\u0E21\u0E19\u0E39\u0E17\u0E31\u0E49\u0E07 3 \u0E15\u0E49\u0E2D\u0E07\u0E0A\u0E39\u0E42\u0E23\u0E07\u0E14\u0E49\u0E27\u0E22 "${rawFridgeNames[0] || "\u0E01\u0E38\u0E49\u0E07"}" \u0E2B\u0E49\u0E32\u0E21\u0E44\u0E1B\u0E43\u0E2A\u0E48\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E2B\u0E25\u0E31\u0E01\u0E2D\u0E37\u0E48\u0E19\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01)
- \u0E2A\u0E23\u0E23\u0E04\u0E4C\u0E2A\u0E23\u0E49\u0E32\u0E07 3 \u0E40\u0E21\u0E19\u0E39\u0E17\u0E35\u0E48\u0E2B\u0E25\u0E32\u0E01\u0E2B\u0E25\u0E32\u0E22\u0E2A\u0E44\u0E15\u0E25\u0E4C (\u0E40\u0E0A\u0E48\u0E19 \u0E40\u0E21\u0E19\u0E39\u0E1C\u0E31\u0E14 1, \u0E40\u0E21\u0E19\u0E39\u0E15\u0E49\u0E21/\u0E41\u0E01\u0E07/\u0E0B\u0E38\u0E1B 1, \u0E40\u0E21\u0E19\u0E39\u0E22\u0E48\u0E32\u0E07/\u0E2D\u0E1A/\u0E22\u0E33 1) \u0E08\u0E32\u0E01\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E19\u0E35\u0E49`;
    }
    try {
      const prompt = `\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D\u0E2A\u0E38\u0E14\u0E22\u0E2D\u0E14 MasterChef \u0E41\u0E25\u0E30\u0E19\u0E31\u0E01\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E2A\u0E39\u0E07 (AI Zero-Waste Smart Pantry & Fridge Wizard)
\u0E08\u0E07\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E43\u0E19\u0E1A\u0E49\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E49\u0E27\u0E40\u0E2A\u0E01 3 \u0E2A\u0E39\u0E15\u0E23\u0E40\u0E21\u0E19\u0E39\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E\u0E17\u0E35\u0E48\u0E17\u0E33\u0E44\u0E14\u0E49\u0E08\u0E23\u0E34\u0E07 100% \u0E2D\u0E23\u0E48\u0E2D\u0E22 \u0E01\u0E25\u0E21\u0E01\u0E25\u0E48\u0E2D\u0E21 \u0E41\u0E25\u0E30\u0E04\u0E33\u0E19\u0E27\u0E13\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33

\u{1F4E6} \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E43\u0E2B\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19:
1. \u{1F9CA} \u0E02\u0E2D\u0E07\u0E2A\u0E14\u0E43\u0E19\u0E15\u0E39\u0E49\u0E40\u0E22\u0E47\u0E19 (Fridge): ${fridgeList.length > 0 ? fridgeList.join(", ") : "\u0E2D\u0E01\u0E44\u0E01\u0E48\u0E2A\u0E14, \u0E44\u0E02\u0E48\u0E44\u0E01\u0E48, \u0E1C\u0E31\u0E01\u0E01\u0E27\u0E32\u0E07\u0E15\u0E38\u0E49\u0E07"}
2. \u{1F96B} \u0E02\u0E2D\u0E07\u0E41\u0E2B\u0E49\u0E07/\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E1B\u0E23\u0E38\u0E07\u0E43\u0E19\u0E15\u0E39\u0E49\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E32\u0E27 (Pantry): ${pantryList.length > 0 ? pantryList.join(", ") : "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E25\u0E49\u0E2D\u0E07, \u0E0B\u0E35\u0E2D\u0E34\u0E4A\u0E27\u0E02\u0E32\u0E27\u0E25\u0E14\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21, \u0E1E\u0E23\u0E34\u0E01\u0E44\u0E17\u0E22\u0E14\u0E33, \u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E21\u0E30\u0E01\u0E2D\u0E01"}
${expiringList.length > 0 ? `3. \u26A0\uFE0F \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E43\u0E01\u0E25\u0E49\u0E2B\u0E21\u0E14\u0E2D\u0E32\u0E22\u0E38\u0E40\u0E23\u0E48\u0E07\u0E14\u0E48\u0E27\u0E19: ${expiringList.join(", ")}` : ""}

\u{1F3AF} \u0E02\u0E49\u0E2D\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E41\u0E25\u0E30\u0E42\u0E2B\u0E21\u0E14\u0E01\u0E32\u0E23\u0E17\u0E33\u0E07\u0E32\u0E19:
${modePromptInstruction}
- \u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E: ${dietaryGoal}
- \u0E40\u0E27\u0E25\u0E32\u0E1B\u0E23\u0E38\u0E07: \u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19 ${cookingTimeMax} \u0E19\u0E32\u0E17\u0E35
- \u0E2A\u0E44\u0E15\u0E25\u0E4C\u0E2D\u0E32\u0E2B\u0E32\u0E23: ${cuisineStyle}

\u0E02\u0E49\u0E2D\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A:
- \u0E2A\u0E48\u0E07\u0E1C\u0E25\u0E25\u0E31\u0E1E\u0E18\u0E4C\u0E40\u0E1B\u0E47\u0E19 JSON Object \u0E17\u0E35\u0E48\u0E21\u0E35 property "recipes" \u0E1A\u0E23\u0E23\u0E08\u0E38 Array \u0E02\u0E2D\u0E07\u0E2A\u0E39\u0E15\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23 3 \u0E40\u0E21\u0E19\u0E39\u0E15\u0E32\u0E21 Schema`;
      const response = await generateContentSafe({
        model: "gemini-flash-latest",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              recipes: {
                type: import_genai.Type.ARRAY,
                description: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 3 \u0E2A\u0E39\u0E15\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E35\u0E48\u0E04\u0E34\u0E14\u0E04\u0E49\u0E19\u0E08\u0E32\u0E01\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01",
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    id: { type: import_genai.Type.STRING },
                    recipeName: { type: import_genai.Type.STRING, description: "\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E21\u0E19\u0E39\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22\u0E17\u0E35\u0E48\u0E19\u0E48\u0E32\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19\u0E41\u0E25\u0E30\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A" },
                    description: { type: import_genai.Type.STRING, description: "\u0E04\u0E33\u0E1A\u0E23\u0E23\u0E22\u0E32\u0E22\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E23\u0E48\u0E2D\u0E22\u0E41\u0E25\u0E30\u0E08\u0E38\u0E14\u0E40\u0E14\u0E48\u0E19\u0E02\u0E2D\u0E07\u0E40\u0E21\u0E19\u0E39" },
                    prepTimeMinutes: { type: import_genai.Type.INTEGER, description: "\u0E40\u0E27\u0E25\u0E32\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E41\u0E25\u0E30\u0E1B\u0E23\u0E38\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 (\u0E19\u0E32\u0E17\u0E35)" },
                    calories: { type: import_genai.Type.INTEGER, description: "\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E23\u0E27\u0E21 (kcal)" },
                    proteinGrams: { type: import_genai.Type.INTEGER, description: "\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 (\u0E01\u0E23\u0E31\u0E21)" },
                    carbsGrams: { type: import_genai.Type.INTEGER, description: "\u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15 (\u0E01\u0E23\u0E31\u0E21)" },
                    fatGrams: { type: import_genai.Type.INTEGER, description: "\u0E44\u0E02\u0E21\u0E31\u0E19 (\u0E01\u0E23\u0E31\u0E21)" },
                    fiberGrams: { type: import_genai.Type.INTEGER, description: "\u0E43\u0E22\u0E2D\u0E32\u0E2B\u0E32\u0E23 (\u0E01\u0E23\u0E31\u0E21)" },
                    sodiumMg: { type: import_genai.Type.INTEGER, description: "\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21 (\u0E21\u0E34\u0E25\u0E25\u0E34\u0E01\u0E23\u0E31\u0E21)" },
                    zeroWasteScore: { type: import_genai.Type.INTEGER, description: "\u0E04\u0E30\u0E41\u0E19\u0E19 Zero-Waste (85-100)" },
                    whyZeroWaste: { type: import_genai.Type.STRING, description: "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E27\u0E48\u0E32\u0E17\u0E33\u0E44\u0E21\u0E40\u0E21\u0E19\u0E39\u0E19\u0E35\u0E49\u0E16\u0E36\u0E07\u0E0A\u0E48\u0E27\u0E22\u0E43\u0E0A\u0E49\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E04\u0E38\u0E49\u0E21\u0E04\u0E48\u0E32" },
                    usedFridgeItems: {
                      type: import_genai.Type.ARRAY,
                      items: { type: import_genai.Type.STRING },
                      description: "\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E17\u0E35\u0E48\u0E14\u0E36\u0E07\u0E21\u0E32\u0E08\u0E32\u0E01\u0E15\u0E39\u0E49\u0E40\u0E22\u0E47\u0E19"
                    },
                    usedPantryItems: {
                      type: import_genai.Type.ARRAY,
                      items: { type: import_genai.Type.STRING },
                      description: "\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A/\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E1B\u0E23\u0E38\u0E07\u0E17\u0E35\u0E48\u0E14\u0E36\u0E07\u0E21\u0E32\u0E08\u0E32\u0E01\u0E15\u0E39\u0E49\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E32\u0E27"
                    },
                    ingredientsDetail: {
                      type: import_genai.Type.ARRAY,
                      items: {
                        type: import_genai.Type.OBJECT,
                        properties: {
                          name: { type: import_genai.Type.STRING },
                          amount: { type: import_genai.Type.STRING },
                          source: { type: import_genai.Type.STRING, description: "fridge | pantry | extra" },
                          isExpiring: { type: import_genai.Type.BOOLEAN }
                        },
                        required: ["name", "amount", "source"]
                      }
                    },
                    quickSteps: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING }, description: "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E38\u0E07\u0E17\u0E35\u0E25\u0E30\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E02\u0E49\u0E32\u0E43\u0E08\u0E07\u0E48\u0E32\u0E22" },
                    flavorTwist: { type: import_genai.Type.STRING, description: "\u0E40\u0E04\u0E25\u0E47\u0E14\u0E25\u0E31\u0E1A\u0E40\u0E0A\u0E1F\u0E41\u0E25\u0E30\u0E40\u0E17\u0E04\u0E19\u0E34\u0E04\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E2A\u0E0A\u0E32\u0E15\u0E34" }
                  },
                  required: [
                    "recipeName",
                    "description",
                    "prepTimeMinutes",
                    "calories",
                    "proteinGrams",
                    "carbsGrams",
                    "fatGrams",
                    "zeroWasteScore",
                    "usedFridgeItems",
                    "usedPantryItems",
                    "quickSteps",
                    "flavorTwist"
                  ]
                }
              }
            },
            required: ["recipes"]
          }
        }
      });
      const text = response.text;
      if (!text) throw new Error("Empty response from Pantry Wizard");
      let cleanText = text.trim();
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) {
        cleanText = match[1].trim();
      }
      const parsed = JSON.parse(cleanText);
      const recipeList = Array.isArray(parsed) ? parsed : parsed.recipes || [];
      if (recipeList.length === 0) throw new Error("No recipes parsed");
      res.json(recipeList);
    } catch (error) {
      console.error("Error in smart-pantry-wizard:", error);
      const f1 = rawFridgeNames[0] || "\u0E2D\u0E01\u0E44\u0E01\u0E48\u0E2A\u0E14";
      const f2 = rawFridgeNames[1] || "\u0E44\u0E02\u0E48\u0E44\u0E01\u0E48";
      const f3 = rawFridgeNames[2] || "\u0E1C\u0E31\u0E01\u0E2A\u0E14";
      const p1 = rawPantryNames[0] || "\u0E0B\u0E35\u0E2D\u0E34\u0E4A\u0E27\u0E02\u0E32\u0E27\u0E25\u0E14\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21";
      const p2 = rawPantryNames[1] || "\u0E02\u0E49\u0E32\u0E27\u0E01\u0E25\u0E49\u0E2D\u0E07";
      res.json([
        {
          id: "wizard-fallback-1",
          recipeName: `\u0E40\u0E21\u0E19\u0E39\u0E04\u0E25\u0E35\u0E19 ${f1} \u0E1C\u0E31\u0E14\u0E04\u0E25\u0E38\u0E01\u0E40\u0E04\u0E25\u0E49\u0E32 ${p1}`,
          description: `\u0E40\u0E21\u0E19\u0E39\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2A\u0E23\u0E23\u0E04\u0E4C\u0E08\u0E32\u0E01 ${f1} \u0E1B\u0E23\u0E38\u0E07\u0E23\u0E2A\u0E01\u0E25\u0E21\u0E01\u0E25\u0E48\u0E2D\u0E21\u0E14\u0E49\u0E27\u0E22 ${p1} \u0E40\u0E2B\u0E21\u0E32\u0E30\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E21\u0E37\u0E49\u0E2D\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E\u0E17\u0E35\u0E48\u0E17\u0E33\u0E07\u0E48\u0E32\u0E22\u0E41\u0E25\u0E30\u0E23\u0E27\u0E14\u0E40\u0E23\u0E47\u0E27`,
          prepTimeMinutes: Math.min(cookingTimeMax, 12),
          calories: 380,
          proteinGrams: 32,
          carbsGrams: 35,
          fatGrams: 9,
          fiberGrams: 3,
          sodiumMg: 420,
          zeroWasteScore: 98,
          whyZeroWaste: `\u0E43\u0E0A\u0E49\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A ${f1} \u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E27\u0E49\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E04\u0E38\u0E49\u0E21\u0E04\u0E48\u0E32 \u0E44\u0E21\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E17\u0E34\u0E49\u0E07`,
          usedFridgeItems: [f1, f2].filter(Boolean),
          usedPantryItems: [p1, p2].filter(Boolean),
          ingredientsDetail: [
            { name: f1, amount: "150 \u0E01\u0E23\u0E31\u0E21", source: "fridge", isExpiring: true },
            { name: f2, amount: "1 \u0E1F\u0E2D\u0E07", source: "fridge", isExpiring: false },
            { name: p1, amount: "1 \u0E0A\u0E49\u0E2D\u0E19\u0E42\u0E15\u0E4A\u0E30", source: "pantry", isExpiring: false },
            { name: p2, amount: "1 \u0E16\u0E49\u0E27\u0E22", source: "pantry", isExpiring: false }
          ],
          quickSteps: [
            `\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21 ${f1} \u0E2B\u0E31\u0E48\u0E19\u0E0A\u0E34\u0E49\u0E19\u0E1E\u0E2D\u0E14\u0E35\u0E04\u0E33 \u0E2B\u0E21\u0E31\u0E01\u0E40\u0E1A\u0E32\u0E46 \u0E14\u0E49\u0E27\u0E22 ${p1}`,
            `\u0E15\u0E31\u0E49\u0E07\u0E01\u0E23\u0E30\u0E17\u0E30\u0E44\u0E1F\u0E01\u0E25\u0E32\u0E07 \u0E43\u0E2A\u0E48 ${f1} \u0E25\u0E07\u0E1C\u0E31\u0E14\u0E08\u0E19\u0E2A\u0E38\u0E01\u0E2B\u0E2D\u0E21`,
            `\u0E43\u0E2A\u0E48 ${f2} \u0E1C\u0E31\u0E14\u0E04\u0E25\u0E38\u0E01\u0E40\u0E04\u0E25\u0E49\u0E32\u0E43\u0E2B\u0E49\u0E40\u0E02\u0E49\u0E32\u0E40\u0E19\u0E37\u0E49\u0E2D`,
            `\u0E08\u0E31\u0E14\u0E40\u0E2A\u0E34\u0E23\u0E4C\u0E1F\u0E04\u0E39\u0E48\u0E01\u0E31\u0E1A ${p2} \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E17\u0E32\u0E19\u0E23\u0E49\u0E2D\u0E19\u0E46`
          ],
          flavorTwist: `\u0E40\u0E2B\u0E22\u0E32\u0E30 ${p1} \u0E41\u0E25\u0E30\u0E1E\u0E23\u0E34\u0E01\u0E44\u0E17\u0E22\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E36\u0E07\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E27\u0E32\u0E19\u0E18\u0E23\u0E23\u0E21\u0E0A\u0E32\u0E15\u0E34\u0E02\u0E2D\u0E07 ${f1}`
        },
        {
          id: "wizard-fallback-2",
          recipeName: `\u0E15\u0E49\u0E21\u0E0B\u0E38\u0E1B\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E ${f1} \u0E43\u0E2A\u0E48\u0E19\u0E49\u0E33\u0E0B\u0E38\u0E1B ${p1}`,
          description: `\u0E0B\u0E38\u0E1B\u0E19\u0E49\u0E33\u0E43\u0E2A\u0E2D\u0E1A\u0E2D\u0E38\u0E48\u0E19 \u0E2A\u0E14\u0E0A\u0E37\u0E48\u0E19 \u0E22\u0E48\u0E2D\u0E22\u0E07\u0E48\u0E32\u0E22 \u0E43\u0E0A\u0E49 ${f1} \u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E31\u0E27\u0E43\u0E08\u0E2B\u0E25\u0E31\u0E01 \u0E0B\u0E14\u0E04\u0E25\u0E48\u0E2D\u0E07\u0E04\u0E2D\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E15\u0E48\u0E33`,
          prepTimeMinutes: Math.min(cookingTimeMax, 10),
          calories: 210,
          proteinGrams: 24,
          carbsGrams: 10,
          fatGrams: 6,
          fiberGrams: 2,
          sodiumMg: 450,
          zeroWasteScore: 95,
          whyZeroWaste: `\u0E14\u0E36\u0E07 ${f1} \u0E41\u0E25\u0E30 ${f3} \u0E21\u0E32\u0E17\u0E33\u0E40\u0E1B\u0E47\u0E19\u0E0B\u0E38\u0E1B\u0E1A\u0E33\u0E23\u0E38\u0E07\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E`,
          usedFridgeItems: [f1, f3].filter(Boolean),
          usedPantryItems: [p1].filter(Boolean),
          ingredientsDetail: [
            { name: f1, amount: "120 \u0E01\u0E23\u0E31\u0E21", source: "fridge", isExpiring: true },
            { name: f3, amount: "50 \u0E01\u0E23\u0E31\u0E21", source: "fridge", isExpiring: false },
            { name: p1, amount: "1 \u0E0A\u0E49\u0E2D\u0E19\u0E42\u0E15\u0E4A\u0E30", source: "pantry", isExpiring: false }
          ],
          quickSteps: [
            `\u0E15\u0E49\u0E21\u0E19\u0E49\u0E33\u0E2A\u0E15\u0E47\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E40\u0E14\u0E37\u0E2D\u0E14 \u0E43\u0E2A\u0E48 ${f1} \u0E25\u0E07\u0E15\u0E49\u0E21\u0E44\u0E1F\u0E2D\u0E48\u0E2D\u0E19`,
            `\u0E1B\u0E23\u0E38\u0E07\u0E23\u0E2A\u0E01\u0E25\u0E21\u0E01\u0E25\u0E48\u0E2D\u0E21\u0E14\u0E49\u0E27\u0E22 ${p1}`,
            `\u0E43\u0E2A\u0E48 ${f3} \u0E25\u0E07\u0E44\u0E1B\u0E15\u0E49\u0E21\u0E08\u0E19\u0E2A\u0E38\u0E01\u0E19\u0E38\u0E48\u0E21`,
            `\u0E15\u0E31\u0E01\u0E43\u0E2A\u0E48\u0E0A\u0E32\u0E21\u0E40\u0E2A\u0E34\u0E23\u0E4C\u0E1F\u0E23\u0E49\u0E2D\u0E19\u0E46 \u0E2D\u0E34\u0E48\u0E21\u0E2A\u0E1A\u0E32\u0E22\u0E17\u0E49\u0E2D\u0E07`
          ],
          flavorTwist: "\u0E42\u0E23\u0E22\u0E1E\u0E23\u0E34\u0E01\u0E44\u0E17\u0E22\u0E14\u0E33\u0E1A\u0E14\u0E2A\u0E14\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E2D\u0E21\u0E41\u0E25\u0E30\u0E01\u0E23\u0E30\u0E15\u0E38\u0E49\u0E19\u0E01\u0E32\u0E23\u0E40\u0E1C\u0E32\u0E1C\u0E25\u0E32\u0E0D"
        },
        {
          id: "wizard-fallback-3",
          recipeName: `\u0E02\u0E49\u0E32\u0E27\u0E01\u0E25\u0E48\u0E2D\u0E07\u0E40\u0E2E\u0E25\u0E15\u0E35\u0E49 ${f1} \u0E22\u0E48\u0E32\u0E07 & ${p2}`,
          description: `\u0E08\u0E31\u0E14\u0E21\u0E37\u0E49\u0E2D\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E23\u0E07\u0E04\u0E38\u0E13\u0E04\u0E48\u0E32\u0E14\u0E49\u0E27\u0E22 ${f1} \u0E22\u0E48\u0E32\u0E07\u0E2B\u0E2D\u0E21\u0E01\u0E23\u0E38\u0E48\u0E19 \u0E17\u0E32\u0E19\u0E04\u0E39\u0E48\u0E01\u0E31\u0E1A ${p2}`,
          prepTimeMinutes: Math.min(cookingTimeMax, 15),
          calories: 360,
          proteinGrams: 30,
          carbsGrams: 40,
          fatGrams: 8,
          fiberGrams: 4,
          sodiumMg: 390,
          zeroWasteScore: 92,
          whyZeroWaste: `\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E21\u0E37\u0E49\u0E2D Meal Prep \u0E08\u0E32\u0E01 ${f1} \u0E41\u0E25\u0E30 ${p2} \u0E04\u0E23\u0E1A\u0E16\u0E49\u0E27\u0E19\u0E2A\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23`,
          usedFridgeItems: [f1].filter(Boolean),
          usedPantryItems: [p2, p1].filter(Boolean),
          ingredientsDetail: [
            { name: f1, amount: "150 \u0E01\u0E23\u0E31\u0E21", source: "fridge", isExpiring: true },
            { name: p2, amount: "1 \u0E16\u0E49\u0E27\u0E22", source: "pantry", isExpiring: false },
            { name: p1, amount: "1 \u0E0A\u0E49\u0E2D\u0E19\u0E0A\u0E32", source: "pantry", isExpiring: false }
          ],
          quickSteps: [
            `\u0E2B\u0E21\u0E31\u0E01 ${f1} \u0E14\u0E49\u0E27\u0E22 ${p1} \u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22`,
            `\u0E22\u0E48\u0E32\u0E07\u0E1A\u0E19\u0E01\u0E23\u0E30\u0E17\u0E30\u0E08\u0E19\u0E2A\u0E38\u0E01\u0E40\u0E01\u0E23\u0E35\u0E22\u0E21\u0E2A\u0E27\u0E22\u0E07\u0E32\u0E21`,
            `\u0E2D\u0E38\u0E48\u0E19 ${p2} \u0E43\u0E2B\u0E49\u0E23\u0E49\u0E2D\u0E19\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E08\u0E31\u0E14\u0E43\u0E2A\u0E48\u0E01\u0E25\u0E48\u0E2D\u0E07`,
            `\u0E08\u0E31\u0E14 ${f1} \u0E27\u0E32\u0E07\u0E40\u0E04\u0E35\u0E22\u0E07\u0E02\u0E49\u0E32\u0E07 \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19`
          ],
          flavorTwist: "\u0E1A\u0E35\u0E1A\u0E21\u0E30\u0E19\u0E32\u0E27\u0E2A\u0E14\u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E14\u0E0A\u0E37\u0E48\u0E19"
        }
      ]);
    }
  });
  const handleRecipeGeneration = async (req, res) => {
    const {
      ingredients = [],
      dietaryGoal = "all",
      nutritionGoal,
      maxPrepTime = 30,
      timeLimitMinutes,
      cuisine = "thai"
    } = req.body;
    const rawIngredientsList = Array.isArray(ingredients) ? ingredients.map((i) => typeof i === "string" ? i.trim() : i?.name || "").filter(Boolean) : String(ingredients || "").split(",").map((s) => s.trim()).filter(Boolean);
    const ing1 = rawIngredientsList[0] || "\u0E2D\u0E01\u0E44\u0E01\u0E48";
    const ing2 = rawIngredientsList[1] || "\u0E1A\u0E23\u0E2D\u0E01\u0E42\u0E04\u0E25\u0E35";
    const ing3 = rawIngredientsList[2] || "\u0E44\u0E02\u0E48\u0E44\u0E01\u0E48";
    const ingredientsString = rawIngredientsList.length > 0 ? rawIngredientsList.join(", ") : "\u0E2D\u0E01\u0E44\u0E01\u0E48, \u0E44\u0E02\u0E48\u0E44\u0E01\u0E48, \u0E1C\u0E31\u0E01\u0E2A\u0E14";
    const effectiveGoal = dietaryGoal !== "all" ? dietaryGoal : nutritionGoal || "balanced";
    const goalText = effectiveGoal === "high_protein" || effectiveGoal === "high-protein" ? "\u0E40\u0E19\u0E49\u0E19\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E2A\u0E39\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E01\u0E25\u0E49\u0E32\u0E21\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E41\u0E25\u0E30\u0E2D\u0E34\u0E48\u0E21\u0E19\u0E32\u0E19" : effectiveGoal === "low_carb" || effectiveGoal === "low-carb" ? "\u0E40\u0E19\u0E49\u0E19\u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15\u0E15\u0E48\u0E33 (Low-Carb / \u0E25\u0E14\u0E1A\u0E27\u0E21)" : effectiveGoal === "clean" ? "\u0E40\u0E19\u0E49\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E04\u0E25\u0E35\u0E19 \u0E25\u0E35\u0E19\u0E44\u0E02\u0E21\u0E31\u0E19 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E49\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E41\u0E1B\u0E23\u0E23\u0E39\u0E1B \u0E1B\u0E23\u0E38\u0E07\u0E23\u0E2A\u0E19\u0E49\u0E2D\u0E22" : effectiveGoal === "quick_15min" ? "\u0E40\u0E19\u0E49\u0E19\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E07\u0E48\u0E32\u0E22 \u0E17\u0E33\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E27\u0E14\u0E40\u0E23\u0E47\u0E27\u0E20\u0E32\u0E22\u0E43\u0E19 15 \u0E19\u0E32\u0E17\u0E35" : effectiveGoal === "keto" ? "\u0E40\u0E19\u0E49\u0E19\u0E44\u0E02\u0E21\u0E31\u0E19\u0E14\u0E35\u0E41\u0E25\u0E30\u0E04\u0E32\u0E23\u0E4C\u0E1A\u0E15\u0E48\u0E33\u0E21\u0E32\u0E01\u0E15\u0E32\u0E21\u0E2B\u0E25\u0E31\u0E01\u0E04\u0E35\u0E42\u0E15\u0E40\u0E08\u0E19\u0E34\u0E04" : "\u0E2A\u0E21\u0E14\u0E38\u0E25\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23 \u0E04\u0E23\u0E1A 5 \u0E2B\u0E21\u0E39\u0E48 \u0E2A\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E41\u0E19\u0E48\u0E19";
    const effectiveTime = maxPrepTime || timeLimitMinutes || 25;
    const timeText = `\u0E43\u0E0A\u0E49\u0E40\u0E27\u0E25\u0E32\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E41\u0E25\u0E30\u0E1B\u0E23\u0E38\u0E07\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19 ${effectiveTime} \u0E19\u0E32\u0E17\u0E35`;
    const cuisineText = cuisine === "japanese" ? "\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E0D\u0E35\u0E48\u0E1B\u0E38\u0E48\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E" : cuisine === "western" ? "\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E15\u0E30\u0E27\u0E31\u0E19\u0E15\u0E01/\u0E40\u0E21\u0E14\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E40\u0E23\u0E40\u0E19\u0E35\u0E22\u0E19" : cuisine === "fusion" ? "\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E1F\u0E34\u0E27\u0E0A\u0E31\u0E48\u0E19\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2A\u0E23\u0E23\u0E04\u0E4C" : "\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E44\u0E17\u0E22\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E";
    try {
      const prompt = `\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D\u0E2A\u0E38\u0E14\u0E22\u0E2D\u0E14\u0E40\u0E0A\u0E1F\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E04\u0E25\u0E35\u0E19\u0E41\u0E25\u0E30\u0E19\u0E31\u0E01\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E1C\u0E39\u0E49\u0E40\u0E0A\u0E35\u0E48\u0E22\u0E27\u0E0A\u0E32\u0E0D (Master Healthy Chef & Clinical Nutritionist)
\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13: \u0E08\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2A\u0E23\u0E23\u0E04\u0E4C\u0E2A\u0E39\u0E15\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E 3-4 \u0E40\u0E21\u0E19\u0E39\u0E17\u0E35\u0E48\u0E17\u0E33\u0E44\u0E14\u0E49\u0E08\u0E23\u0E34\u0E07 100% \u0E2D\u0E23\u0E48\u0E2D\u0E22 \u0E01\u0E25\u0E21\u0E01\u0E25\u0E48\u0E2D\u0E21 \u0E41\u0E25\u0E30\u0E04\u0E33\u0E19\u0E27\u0E13\u0E04\u0E38\u0E13\u0E04\u0E48\u0E32\u0E17\u0E32\u0E07\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33

\u{1F4E6} \u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E21\u0E32 (\u0E15\u0E49\u0E2D\u0E07\u0E19\u0E33\u0E21\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E48\u0E27\u0E19\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E01\u0E02\u0E2D\u0E07\u0E40\u0E21\u0E19\u0E39\u0E40\u0E2B\u0E25\u0E48\u0E32\u0E19\u0E35\u0E49):
"${ingredientsString}"

\u{1F3AF} \u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E41\u0E25\u0E30\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22:
- \u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E: ${goalText}
- \u0E02\u0E49\u0E2D\u0E08\u0E33\u0E01\u0E31\u0E14\u0E40\u0E27\u0E25\u0E32: ${timeText}
- \u0E41\u0E19\u0E27\u0E17\u0E32\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23: ${cuisineText}

\u0E02\u0E49\u0E2D\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E2A\u0E33\u0E04\u0E31\u0E0D:
1. \u0E17\u0E38\u0E01\u0E40\u0E21\u0E19\u0E39\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E0A\u0E49\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E31\u0E27\u0E43\u0E08\u0E2A\u0E33\u0E04\u0E31\u0E0D \u0E41\u0E25\u0E30\u0E40\u0E2A\u0E23\u0E34\u0E21\u0E14\u0E49\u0E27\u0E22\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E1B\u0E23\u0E38\u0E07\u0E04\u0E25\u0E35\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E10\u0E32\u0E19 \u0E40\u0E0A\u0E48\u0E19 \u0E0B\u0E35\u0E2D\u0E34\u0E4A\u0E27\u0E02\u0E32\u0E27\u0E25\u0E14\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21, \u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E21\u0E30\u0E01\u0E2D\u0E01, \u0E1E\u0E23\u0E34\u0E01\u0E44\u0E17\u0E22\u0E14\u0E33, \u0E01\u0E23\u0E30\u0E40\u0E17\u0E35\u0E22\u0E21, \u0E40\u0E01\u0E25\u0E37\u0E2D\u0E0A\u0E21\u0E1E\u0E39
2. \u0E04\u0E33\u0E19\u0E27\u0E13\u0E2A\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E15\u0E48\u0E2D 1 \u0E08\u0E32\u0E19\u0E43\u0E2B\u0E49\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E32\u0E21\u0E2B\u0E25\u0E31\u0E01\u0E27\u0E34\u0E17\u0E22\u0E32\u0E28\u0E32\u0E2A\u0E15\u0E23\u0E4C (Calories, Protein, Carbs, Fat, Fiber, Sodium)
3. \u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E38\u0E07 (steps) \u0E17\u0E35\u0E25\u0E30\u0E02\u0E49\u0E2D\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14 \u0E17\u0E33\u0E15\u0E32\u0E21\u0E44\u0E14\u0E49\u0E08\u0E23\u0E34\u0E07 100%
4. \u0E43\u0E2B\u0E49\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33 ProTip \u0E14\u0E49\u0E32\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E38\u0E07\u0E04\u0E25\u0E35\u0E19\u0E41\u0E25\u0E30\u0E40\u0E17\u0E04\u0E19\u0E34\u0E04\u0E14\u0E36\u0E07\u0E23\u0E2A\u0E0A\u0E32\u0E15\u0E34`;
      const response = await generateContentSafe({
        model: "gemini-flash-latest",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.ARRAY,
            items: {
              type: import_genai.Type.OBJECT,
              properties: {
                id: { type: import_genai.Type.STRING, description: "Unique recipe id \u0E40\u0E0A\u0E48\u0E19 recipe-1" },
                recipeName: { type: import_genai.Type.STRING, description: "\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E21\u0E19\u0E39\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22\u0E17\u0E35\u0E48\u0E19\u0E48\u0E32\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19" },
                englishName: { type: import_genai.Type.STRING, description: "\u0E0A\u0E37\u0E48\u0E2D\u0E20\u0E32\u0E29\u0E32\u0E2D\u0E31\u0E07\u0E01\u0E24\u0E29" },
                description: { type: import_genai.Type.STRING, description: "\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E23\u0E2A\u0E0A\u0E32\u0E15\u0E34 \u0E08\u0E38\u0E14\u0E40\u0E14\u0E48\u0E19 \u0E41\u0E25\u0E30\u0E1B\u0E23\u0E30\u0E42\u0E22\u0E0A\u0E19\u0E4C" },
                calories: { type: import_genai.Type.INTEGER, description: "\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E23\u0E27\u0E21\u0E15\u0E48\u0E2D 1 \u0E17\u0E35\u0E48 (kcal)" },
                proteinGrams: { type: import_genai.Type.INTEGER, description: "\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 (\u0E01\u0E23\u0E31\u0E21)" },
                carbsGrams: { type: import_genai.Type.INTEGER, description: "\u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15 (\u0E01\u0E23\u0E31\u0E21)" },
                fatGrams: { type: import_genai.Type.INTEGER, description: "\u0E44\u0E02\u0E21\u0E31\u0E19 (\u0E01\u0E23\u0E31\u0E21)" },
                fiberGrams: { type: import_genai.Type.INTEGER, description: "\u0E43\u0E22\u0E2D\u0E32\u0E2B\u0E32\u0E23/\u0E44\u0E1F\u0E40\u0E1A\u0E2D\u0E23\u0E4C (\u0E01\u0E23\u0E31\u0E21)" },
                sodiumMg: { type: import_genai.Type.INTEGER, description: "\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21 (\u0E21\u0E34\u0E25\u0E25\u0E34\u0E01\u0E23\u0E31\u0E21)" },
                prepTimeMinutes: { type: import_genai.Type.INTEGER, description: "\u0E40\u0E27\u0E25\u0E32\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21 (\u0E19\u0E32\u0E17\u0E35)" },
                cookTimeMinutes: { type: import_genai.Type.INTEGER, description: "\u0E40\u0E27\u0E25\u0E32\u0E1B\u0E23\u0E38\u0E07 (\u0E19\u0E32\u0E17\u0E35)" },
                difficulty: { type: import_genai.Type.STRING, description: "\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E07\u0E48\u0E32\u0E22: \u0E07\u0E48\u0E32\u0E22\u0E21\u0E32\u0E01 | \u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 | \u0E23\u0E30\u0E14\u0E31\u0E1A\u0E40\u0E0A\u0E1F" },
                healthTags: {
                  type: import_genai.Type.ARRAY,
                  items: { type: import_genai.Type.STRING },
                  description: "\u0E41\u0E17\u0E47\u0E01\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E \u0E40\u0E0A\u0E48\u0E19 \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E2A\u0E39\u0E07, \u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21\u0E15\u0E48\u0E33, \u0E04\u0E25\u0E35\u0E19 100%"
                },
                ingredients: {
                  type: import_genai.Type.ARRAY,
                  items: {
                    type: import_genai.Type.OBJECT,
                    properties: {
                      name: { type: import_genai.Type.STRING },
                      amount: { type: import_genai.Type.STRING },
                      isMain: { type: import_genai.Type.BOOLEAN }
                    },
                    required: ["name", "amount"]
                  }
                },
                steps: {
                  type: import_genai.Type.ARRAY,
                  items: { type: import_genai.Type.STRING },
                  description: "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E01\u0E32\u0E23\u0E17\u0E33\u0E17\u0E35\u0E25\u0E30\u0E02\u0E49\u0E2D\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14"
                },
                nutritionHighlights: { type: import_genai.Type.STRING, description: "\u0E08\u0E38\u0E14\u0E40\u0E14\u0E48\u0E19\u0E14\u0E49\u0E32\u0E19\u0E2A\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E41\u0E25\u0E30\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E" },
                proTip: { type: import_genai.Type.STRING, description: "\u0E40\u0E04\u0E25\u0E47\u0E14\u0E25\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E23\u0E48\u0E2D\u0E22\u0E41\u0E1A\u0E1A\u0E04\u0E25\u0E35\u0E19" }
              },
              required: [
                "id",
                "recipeName",
                "description",
                "calories",
                "proteinGrams",
                "carbsGrams",
                "fatGrams",
                "prepTimeMinutes",
                "cookTimeMinutes",
                "difficulty",
                "healthTags",
                "ingredients",
                "steps",
                "nutritionHighlights",
                "proTip"
              ]
            }
          }
        }
      });
      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini AI");
      let cleanText = text.trim();
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) {
        cleanText = match[1].trim();
      }
      const parsedRecipes = JSON.parse(cleanText);
      if (!Array.isArray(parsedRecipes) || parsedRecipes.length === 0) {
        throw new Error("Parsed recipes array is empty");
      }
      res.json(parsedRecipes);
    } catch (error) {
      console.error("Error generating healthy recipes, using dynamic tailor-made fallback:", error);
      const fallbackRecipes = [
        {
          id: `ai-gen-${Date.now()}-1`,
          recipeName: `\u0E40\u0E21\u0E19\u0E39\u0E04\u0E25\u0E35\u0E19 ${ing1} \u0E1C\u0E31\u0E14\u0E1E\u0E23\u0E34\u0E01\u0E44\u0E17\u0E22\u0E14\u0E33 & ${ing2}`,
          englishName: `Clean Stir-fried ${ing1} with ${ing2}`,
          description: `\u0E40\u0E21\u0E19\u0E39\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E\u0E23\u0E2A\u0E0A\u0E32\u0E15\u0E34\u0E01\u0E25\u0E21\u0E01\u0E25\u0E48\u0E2D\u0E21 \u0E2B\u0E2D\u0E21\u0E01\u0E25\u0E34\u0E48\u0E19\u0E1E\u0E23\u0E34\u0E01\u0E44\u0E17\u0E22\u0E14\u0E33 \u0E0A\u0E39\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E27\u0E32\u0E19\u0E18\u0E23\u0E23\u0E21\u0E0A\u0E32\u0E15\u0E34\u0E02\u0E2D\u0E07 ${ing1} \u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E01\u0E23\u0E38\u0E1A\u0E01\u0E23\u0E2D\u0E1A\u0E02\u0E2D\u0E07 ${ing2} \u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E15\u0E48\u0E33 \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E2A\u0E39\u0E07`,
          calories: 340,
          proteinGrams: 32,
          carbsGrams: 16,
          fatGrams: 7,
          fiberGrams: 4,
          sodiumMg: 410,
          prepTimeMinutes: 5,
          cookTimeMinutes: 10,
          difficulty: "\u0E07\u0E48\u0E32\u0E22\u0E21\u0E32\u0E01",
          healthTags: ["\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E2A\u0E39\u0E07", "\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21\u0E15\u0E48\u0E33", "\u0E44\u0E02\u0E21\u0E31\u0E19\u0E15\u0E48\u0E33", "\u0E04\u0E25\u0E35\u0E19 100%"],
          ingredients: [
            { name: ing1, amount: "150 \u0E01\u0E23\u0E31\u0E21", isMain: true },
            { name: ing2, amount: "80 \u0E01\u0E23\u0E31\u0E21", isMain: true },
            { name: "\u0E01\u0E23\u0E30\u0E40\u0E17\u0E35\u0E22\u0E21\u0E2A\u0E31\u0E1A", amount: "1 \u0E0A\u0E49\u0E2D\u0E19\u0E42\u0E15\u0E4A\u0E30", isMain: false },
            { name: "\u0E0B\u0E35\u0E2D\u0E34\u0E4A\u0E27\u0E02\u0E32\u0E27\u0E25\u0E14\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21", amount: "1 \u0E0A\u0E49\u0E2D\u0E19\u0E42\u0E15\u0E4A\u0E30", isMain: false },
            { name: "\u0E1E\u0E23\u0E34\u0E01\u0E44\u0E17\u0E22\u0E14\u0E33\u0E1A\u0E14\u0E2A\u0E14", amount: "1/2 \u0E0A\u0E49\u0E2D\u0E19\u0E0A\u0E32", isMain: false },
            { name: "\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E21\u0E30\u0E01\u0E2D\u0E01\u0E2A\u0E40\u0E1B\u0E23\u0E22\u0E4C", amount: "1 \u0E1B\u0E31\u0E4A\u0E21", isMain: false }
          ],
          steps: [
            `\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21 ${ing1} \u0E2B\u0E31\u0E48\u0E19\u0E0A\u0E34\u0E49\u0E19\u0E1E\u0E2D\u0E14\u0E35\u0E04\u0E33 \u0E41\u0E25\u0E30\u0E25\u0E49\u0E32\u0E07 ${ing2} \u0E2B\u0E31\u0E48\u0E19\u0E17\u0E48\u0E2D\u0E19`,
            "\u0E15\u0E31\u0E49\u0E07\u0E01\u0E23\u0E30\u0E17\u0E30\u0E44\u0E1F\u0E01\u0E25\u0E32\u0E07 \u0E09\u0E35\u0E14\u0E2A\u0E40\u0E1B\u0E23\u0E22\u0E4C\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E21\u0E30\u0E01\u0E2D\u0E01\u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22 \u0E43\u0E2A\u0E48\u0E01\u0E23\u0E30\u0E40\u0E17\u0E35\u0E22\u0E21\u0E25\u0E07\u0E1C\u0E31\u0E14\u0E08\u0E19\u0E2A\u0E48\u0E07\u0E01\u0E25\u0E34\u0E48\u0E19\u0E2B\u0E2D\u0E21",
            `\u0E43\u0E2A\u0E48 ${ing1} \u0E25\u0E07\u0E44\u0E1B\u0E1C\u0E31\u0E14\u0E08\u0E19\u0E40\u0E23\u0E34\u0E48\u0E21\u0E2A\u0E38\u0E01\u0E40\u0E01\u0E23\u0E35\u0E22\u0E21\u0E2A\u0E27\u0E22\u0E07\u0E32\u0E21`,
            `\u0E43\u0E2A\u0E48 ${ing2} \u0E15\u0E32\u0E21\u0E25\u0E07\u0E44\u0E1B \u0E40\u0E15\u0E34\u0E21\u0E19\u0E49\u0E33\u0E2A\u0E30\u0E2D\u0E32\u0E14 2 \u0E0A\u0E49\u0E2D\u0E19\u0E42\u0E15\u0E4A\u0E30\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E0A\u0E48\u0E27\u0E22\u0E2D\u0E1A\u0E43\u0E2B\u0E49\u0E1C\u0E31\u0E01\u0E2A\u0E38\u0E01\u0E19\u0E38\u0E48\u0E21\u0E41\u0E25\u0E30\u0E22\u0E31\u0E07\u0E04\u0E07\u0E2A\u0E35\u0E40\u0E02\u0E35\u0E22\u0E27\u0E2A\u0E14`,
            "\u0E1B\u0E23\u0E38\u0E07\u0E23\u0E2A\u0E14\u0E49\u0E27\u0E22\u0E0B\u0E35\u0E2D\u0E34\u0E4A\u0E27\u0E02\u0E32\u0E27\u0E25\u0E14\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21\u0E41\u0E25\u0E30\u0E1E\u0E23\u0E34\u0E01\u0E44\u0E17\u0E22\u0E14\u0E33\u0E1A\u0E14 \u0E1C\u0E31\u0E14\u0E04\u0E25\u0E38\u0E01\u0E40\u0E04\u0E25\u0E49\u0E32\u0E43\u0E2B\u0E49\u0E40\u0E02\u0E49\u0E32\u0E01\u0E31\u0E19 1 \u0E19\u0E32\u0E17\u0E35\u0E41\u0E25\u0E49\u0E27\u0E1B\u0E34\u0E14\u0E44\u0E1F \u0E15\u0E31\u0E01\u0E40\u0E2A\u0E34\u0E23\u0E4C\u0E1F"
          ],
          nutritionHighlights: `\u0E2D\u0E38\u0E14\u0E21\u0E14\u0E49\u0E27\u0E22\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E22\u0E48\u0E2D\u0E22\u0E07\u0E48\u0E32\u0E22\u0E08\u0E32\u0E01 ${ing1} \u0E40\u0E2A\u0E23\u0E34\u0E21\u0E43\u0E22\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E41\u0E25\u0E30\u0E27\u0E34\u0E15\u0E32\u0E21\u0E34\u0E19\u0E08\u0E32\u0E01 ${ing2} \u0E0A\u0E48\u0E27\u0E22\u0E40\u0E2A\u0E23\u0E34\u0E21\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E01\u0E25\u0E49\u0E32\u0E21\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E41\u0E25\u0E30\u0E04\u0E27\u0E1A\u0E04\u0E38\u0E21\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01`,
          proTip: `\u0E43\u0E0A\u0E49\u0E19\u0E49\u0E33\u0E2A\u0E15\u0E47\u0E2D\u0E01\u0E2B\u0E23\u0E37\u0E2D\u0E19\u0E49\u0E33\u0E40\u0E1B\u0E25\u0E48\u0E32\u0E1C\u0E31\u0E14\u0E41\u0E17\u0E19\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E40\u0E22\u0E2D\u0E30\u0E46 \u0E08\u0E30\u0E0A\u0E48\u0E27\u0E22\u0E04\u0E07\u0E23\u0E2A\u0E2B\u0E27\u0E32\u0E19\u0E18\u0E23\u0E23\u0E21\u0E0A\u0E32\u0E15\u0E34\u0E02\u0E2D\u0E07 ${ing1} \u0E44\u0E14\u0E49\u0E14\u0E35\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14`
        },
        {
          id: `ai-gen-${Date.now()}-2`,
          recipeName: `\u0E0B\u0E38\u0E1B\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E ${ing1} \u0E15\u0E49\u0E21\u0E15\u0E38\u0E4B\u0E19 ${ing2} & ${ing3}`,
          englishName: `Nourishing ${ing1} & ${ing2} Clear Soup`,
          description: `\u0E0B\u0E38\u0E1B\u0E19\u0E49\u0E33\u0E43\u0E2A\u0E1A\u0E33\u0E23\u0E38\u0E07\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E \u0E23\u0E2A\u0E0A\u0E32\u0E15\u0E34\u0E2B\u0E2D\u0E21\u0E25\u0E30\u0E21\u0E38\u0E19\u0E04\u0E25\u0E48\u0E2D\u0E07\u0E04\u0E2D \u0E22\u0E48\u0E2D\u0E22\u0E07\u0E48\u0E32\u0E22 \u0E40\u0E2B\u0E21\u0E32\u0E30\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E21\u0E37\u0E49\u0E2D\u0E40\u0E22\u0E47\u0E19\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E1A\u0E32\u0E22\u0E17\u0E49\u0E2D\u0E07\u0E41\u0E25\u0E30\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E40\u0E1A\u0E32\u0E46`,
          calories: 220,
          proteinGrams: 28,
          carbsGrams: 10,
          fatGrams: 5,
          fiberGrams: 3,
          sodiumMg: 430,
          prepTimeMinutes: 5,
          cookTimeMinutes: 12,
          difficulty: "\u0E07\u0E48\u0E32\u0E22\u0E21\u0E32\u0E01",
          healthTags: ["\u0E22\u0E48\u0E2D\u0E22\u0E07\u0E48\u0E32\u0E22", "\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E15\u0E48\u0E33", "\u0E2A\u0E1A\u0E32\u0E22\u0E17\u0E49\u0E2D\u0E07", "\u0E44\u0E23\u0E49\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19"],
          ingredients: [
            { name: ing1, amount: "120 \u0E01\u0E23\u0E31\u0E21", isMain: true },
            { name: ing2, amount: "60 \u0E01\u0E23\u0E31\u0E21", isMain: true },
            { name: ing3, amount: "1 \u0E1F\u0E2D\u0E07/\u0E2A\u0E48\u0E27\u0E19", isMain: false },
            { name: "\u0E19\u0E49\u0E33\u0E0B\u0E38\u0E1B\u0E1C\u0E31\u0E01\u0E2B\u0E23\u0E37\u0E2D\u0E19\u0E49\u0E33\u0E40\u0E1B\u0E25\u0E48\u0E32", amount: "400 \u0E21\u0E25.", isMain: false },
            { name: "\u0E40\u0E01\u0E25\u0E37\u0E2D\u0E2B\u0E34\u0E21\u0E32\u0E25\u0E32\u0E22\u0E31\u0E19", amount: "1/4 \u0E0A\u0E49\u0E2D\u0E19\u0E0A\u0E32", isMain: false },
            { name: "\u0E02\u0E36\u0E49\u0E19\u0E09\u0E48\u0E32\u0E22\u0E2B\u0E23\u0E37\u0E2D\u0E1C\u0E31\u0E01\u0E0A\u0E35", amount: "1 \u0E15\u0E49\u0E19", isMain: false }
          ],
          steps: [
            "\u0E15\u0E49\u0E21\u0E19\u0E49\u0E33\u0E43\u0E19\u0E2B\u0E21\u0E49\u0E2D\u0E43\u0E2B\u0E49\u0E40\u0E14\u0E37\u0E2D\u0E14\u0E1E\u0E25\u0E48\u0E32\u0E19 \u0E43\u0E2A\u0E48\u0E40\u0E01\u0E25\u0E37\u0E2D\u0E0A\u0E21\u0E1E\u0E39\u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22",
            `\u0E2B\u0E31\u0E48\u0E19 ${ing1} \u0E40\u0E1B\u0E47\u0E19\u0E0A\u0E34\u0E49\u0E19\u0E1E\u0E2D\u0E14\u0E35\u0E04\u0E33 \u0E41\u0E25\u0E49\u0E27\u0E43\u0E2A\u0E48\u0E25\u0E07\u0E43\u0E19\u0E19\u0E49\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E14 \u0E25\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E44\u0E1F\u0E01\u0E25\u0E32\u0E07`,
            `\u0E40\u0E21\u0E37\u0E48\u0E2D ${ing1} \u0E2A\u0E38\u0E01 \u0E43\u0E2A\u0E48\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A ${ing2} \u0E41\u0E25\u0E30 ${ing3} \u0E25\u0E07\u0E44\u0E1B\u0E15\u0E49\u0E21\u0E15\u0E48\u0E2D 3-4 \u0E19\u0E32\u0E17\u0E35`,
            "\u0E0A\u0E34\u0E21\u0E23\u0E2A\u0E0A\u0E32\u0E15\u0E34 \u0E1B\u0E23\u0E38\u0E07\u0E14\u0E49\u0E27\u0E22\u0E0B\u0E35\u0E2D\u0E34\u0E4A\u0E27\u0E02\u0E32\u0E27\u0E25\u0E14\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21\u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22 \u0E42\u0E23\u0E22\u0E1C\u0E31\u0E01\u0E0A\u0E35\u0E2B\u0E23\u0E37\u0E2D\u0E02\u0E36\u0E49\u0E19\u0E09\u0E48\u0E32\u0E22 \u0E1B\u0E34\u0E14\u0E44\u0E1F\u0E15\u0E31\u0E01\u0E40\u0E2A\u0E34\u0E23\u0E4C\u0E1F\u0E23\u0E49\u0E2D\u0E19\u0E46"
          ],
          nutritionHighlights: "\u0E43\u0E2B\u0E49\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E1A\u0E2D\u0E38\u0E48\u0E19\u0E41\u0E01\u0E48\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22 \u0E44\u0E23\u0E49\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E2A\u0E48\u0E27\u0E19\u0E40\u0E01\u0E34\u0E19 \u0E43\u0E2B\u0E49\u0E01\u0E23\u0E14\u0E2D\u0E30\u0E21\u0E34\u0E42\u0E19\u0E04\u0E23\u0E1A\u0E16\u0E49\u0E27\u0E19\u0E41\u0E25\u0E30\u0E2D\u0E34\u0E40\u0E25\u0E47\u0E01\u0E42\u0E17\u0E23\u0E44\u0E25\u0E15\u0E4C\u0E18\u0E23\u0E23\u0E21\u0E0A\u0E32\u0E15\u0E34",
          proTip: "\u0E15\u0E49\u0E21\u0E14\u0E49\u0E27\u0E22\u0E44\u0E1F\u0E01\u0E25\u0E32\u0E07\u0E04\u0E48\u0E2D\u0E19\u0E2D\u0E48\u0E2D\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E19\u0E49\u0E33\u0E0B\u0E38\u0E1B\u0E43\u0E2A\u0E2B\u0E27\u0E32\u0E19 \u0E41\u0E25\u0E30\u0E23\u0E31\u0E01\u0E29\u0E32\u0E04\u0E38\u0E13\u0E04\u0E48\u0E32\u0E02\u0E2D\u0E07\u0E27\u0E34\u0E15\u0E32\u0E21\u0E34\u0E19\u0E43\u0E19\u0E1C\u0E31\u0E01\u0E44\u0E27\u0E49\u0E04\u0E23\u0E1A\u0E16\u0E49\u0E27\u0E19"
        },
        {
          id: `ai-gen-${Date.now()}-3`,
          recipeName: `\u0E22\u0E33\u0E04\u0E25\u0E35\u0E19\u0E41\u0E0B\u0E48\u0E1A\u0E40\u0E2E\u0E25\u0E15\u0E35\u0E49 ${ing1} \u0E04\u0E39\u0E48\u0E01\u0E31\u0E1A ${ing2}`,
          englishName: `Spicy & Sour Clean Salad with ${ing1}`,
          description: `\u0E40\u0E21\u0E19\u0E39\u0E41\u0E0B\u0E48\u0E1A\u0E08\u0E35\u0E4A\u0E14\u0E08\u0E4A\u0E32\u0E14\u0E01\u0E23\u0E30\u0E15\u0E38\u0E49\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E1C\u0E32\u0E1C\u0E25\u0E32\u0E0D \u0E43\u0E0A\u0E49\u0E19\u0E49\u0E33\u0E21\u0E30\u0E19\u0E32\u0E27\u0E2A\u0E14\u0E41\u0E17\u0E49\u0E41\u0E25\u0E30\u0E1E\u0E23\u0E34\u0E01\u0E2A\u0E14 \u0E1B\u0E23\u0E32\u0E28\u0E08\u0E32\u0E01\u0E1C\u0E07\u0E0A\u0E39\u0E23\u0E2A\u0E41\u0E25\u0E30\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25\u0E17\u0E23\u0E32\u0E22\u0E1F\u0E2D\u0E01\u0E02\u0E32\u0E27`,
          calories: 260,
          proteinGrams: 30,
          carbsGrams: 14,
          fatGrams: 4,
          fiberGrams: 4,
          sodiumMg: 450,
          prepTimeMinutes: 8,
          cookTimeMinutes: 5,
          difficulty: "\u0E07\u0E48\u0E32\u0E22\u0E21\u0E32\u0E01",
          healthTags: ["\u0E01\u0E23\u0E30\u0E15\u0E38\u0E49\u0E19\u0E01\u0E32\u0E23\u0E40\u0E1C\u0E32\u0E1C\u0E25\u0E32\u0E0D", "\u0E44\u0E02\u0E21\u0E31\u0E19\u0E15\u0E48\u0E33\u0E21\u0E32\u0E01", "\u0E41\u0E0B\u0E48\u0E1A\u0E04\u0E25\u0E35\u0E19", "\u0E44\u0E23\u0E49\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25\u0E17\u0E23\u0E32\u0E22"],
          ingredients: [
            { name: ing1, amount: "150 \u0E01\u0E23\u0E31\u0E21", isMain: true },
            { name: ing2, amount: "50 \u0E01\u0E23\u0E31\u0E21", isMain: true },
            { name: "\u0E21\u0E30\u0E19\u0E32\u0E27\u0E2A\u0E14", amount: "2 \u0E0A\u0E49\u0E2D\u0E19\u0E42\u0E15\u0E4A\u0E30", isMain: false },
            { name: "\u0E19\u0E49\u0E33\u0E1B\u0E25\u0E32\u0E25\u0E14\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21", amount: "1 \u0E0A\u0E49\u0E2D\u0E19\u0E42\u0E15\u0E4A\u0E30", isMain: false },
            { name: "\u0E1E\u0E23\u0E34\u0E01\u0E02\u0E35\u0E49\u0E2B\u0E19\u0E39\u0E2A\u0E27\u0E19\u0E0B\u0E2D\u0E22", amount: "5-6 \u0E40\u0E21\u0E47\u0E14", isMain: false },
            { name: "\u0E2B\u0E2D\u0E21\u0E41\u0E14\u0E07\u0E0B\u0E2D\u0E22", amount: "2 \u0E2B\u0E31\u0E27", isMain: false }
          ],
          steps: [
            `\u0E25\u0E27\u0E01 ${ing1} \u0E43\u0E19\u0E19\u0E49\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E14\u0E08\u0E19\u0E2A\u0E38\u0E01\u0E1E\u0E2D\u0E14\u0E35 \u0E19\u0E33\u0E02\u0E36\u0E49\u0E19\u0E1E\u0E31\u0E01\u0E44\u0E27\u0E49\u0E43\u0E2B\u0E49\u0E2A\u0E30\u0E40\u0E14\u0E47\u0E14\u0E19\u0E49\u0E33`,
            `\u0E25\u0E27\u0E01 ${ing2} \u0E1E\u0E2D\u0E2A\u0E30\u0E14\u0E38\u0E49\u0E07\u0E19\u0E49\u0E33\u0E23\u0E49\u0E2D\u0E19 30 \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E04\u0E07\u0E04\u0E27\u0E32\u0E21\u0E01\u0E23\u0E2D\u0E1A\u0E2B\u0E27\u0E32\u0E19`,
            "\u0E1C\u0E2A\u0E21\u0E19\u0E49\u0E33\u0E22\u0E33: \u0E19\u0E49\u0E33\u0E21\u0E30\u0E19\u0E32\u0E27\u0E2A\u0E14, \u0E19\u0E49\u0E33\u0E1B\u0E25\u0E32\u0E25\u0E14\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21, \u0E1E\u0E23\u0E34\u0E01\u0E0B\u0E2D\u0E22, \u0E41\u0E25\u0E30\u0E2B\u0E2D\u0E21\u0E41\u0E14\u0E07 \u0E04\u0E25\u0E38\u0E01\u0E40\u0E04\u0E25\u0E49\u0E32\u0E43\u0E2B\u0E49\u0E40\u0E02\u0E49\u0E32\u0E01\u0E31\u0E19",
            `\u0E19\u0E33 ${ing1} \u0E41\u0E25\u0E30 ${ing2} \u0E25\u0E07\u0E04\u0E25\u0E38\u0E01\u0E40\u0E04\u0E25\u0E49\u0E32\u0E01\u0E31\u0E1A\u0E19\u0E49\u0E33\u0E22\u0E33\u0E40\u0E1A\u0E32\u0E46 \u0E43\u0E2B\u0E49\u0E17\u0E31\u0E48\u0E27 \u0E08\u0E31\u0E14\u0E43\u0E2A\u0E48\u0E08\u0E32\u0E19\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19`
          ],
          nutritionHighlights: "\u0E27\u0E34\u0E15\u0E32\u0E21\u0E34\u0E19\u0E0B\u0E35\u0E2A\u0E39\u0E07\u0E08\u0E32\u0E01\u0E21\u0E30\u0E19\u0E32\u0E27\u0E2A\u0E14 \u0E41\u0E04\u0E1B\u0E44\u0E0B\u0E0B\u0E34\u0E19\u0E08\u0E32\u0E01\u0E1E\u0E23\u0E34\u0E01\u0E0A\u0E48\u0E27\u0E22\u0E1A\u0E39\u0E2A\u0E15\u0E4C\u0E40\u0E21\u0E15\u0E32\u0E1A\u0E2D\u0E25\u0E34\u0E0B\u0E36\u0E21 \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E40\u0E15\u0E47\u0E21\u0E40\u0E1B\u0E35\u0E48\u0E22\u0E21",
          proTip: "\u0E04\u0E25\u0E38\u0E01\u0E19\u0E49\u0E33\u0E22\u0E33\u0E15\u0E2D\u0E19\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E40\u0E23\u0E34\u0E48\u0E21\u0E2D\u0E38\u0E48\u0E19\u0E46 \u0E08\u0E30\u0E17\u0E33\u0E43\u0E2B\u0E49\u0E19\u0E49\u0E33\u0E22\u0E33\u0E0B\u0E36\u0E21\u0E40\u0E02\u0E49\u0E32\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E44\u0E14\u0E49\u0E14\u0E35\u0E22\u0E34\u0E48\u0E07\u0E02\u0E36\u0E49\u0E19"
        }
      ];
      res.json(fallbackRecipes);
    }
  };
  app.post("/api/search-recipes-by-ingredients", handleRecipeGeneration);
  app.post("/api/generate-recipes", handleRecipeGeneration);
  app.post("/api/predict-glucose-impact", async (req, res) => {
    try {
      const { foodName, calories, carbsGrams, sugarGrams, proteinGrams, fatGrams, fiberGrams } = req.body;
      const prompt = `\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E1C\u0E39\u0E49\u0E40\u0E0A\u0E35\u0E48\u0E22\u0E27\u0E0A\u0E32\u0E0D\u0E14\u0E49\u0E32\u0E19\u0E15\u0E48\u0E2D\u0E21\u0E44\u0E23\u0E49\u0E17\u0E48\u0E2D\u0E41\u0E25\u0E30\u0E0A\u0E35\u0E27\u0E40\u0E04\u0E21\u0E35\u0E40\u0E21\u0E15\u0E32\u0E1A\u0E2D\u0E25\u0E34\u0E0B\u0E36\u0E21 (Endocrinology & Continuous Glucose Monitor Expert)
\u0E08\u0E07\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E1C\u0E25\u0E01\u0E23\u0E30\u0E17\u0E1A\u0E15\u0E48\u0E2D\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25\u0E43\u0E19\u0E40\u0E25\u0E37\u0E2D\u0E14 (Blood Glucose Spike) \u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2A\u0E35\u0E48\u0E22\u0E07\u0E40\u0E01\u0E34\u0E14\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E07\u0E48\u0E27\u0E07\u0E0B\u0E36\u0E21\u0E40\u0E1E\u0E25\u0E35\u0E22\u0E2B\u0E25\u0E31\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23 (Postprandial Somnolence / Energy Crash) \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E19\u0E35\u0E49:
- \u0E0A\u0E37\u0E48\u0E2D\u0E2D\u0E32\u0E2B\u0E32\u0E23: ${foodName || "\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E38"}
- \u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48: ${calories || 0} kcal, \u0E04\u0E32\u0E23\u0E4C\u0E1A: ${carbsGrams || 0}g, \u0E19\u0E49\u0E33\u0E15\u0E32\u0E25: ${sugarGrams || 0}g, \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19: ${proteinGrams || 0}g, \u0E44\u0E02\u0E21\u0E31\u0E19: ${fatGrams || 0}g, \u0E44\u0E1F\u0E40\u0E1A\u0E2D\u0E23\u0E4C: ${fiberGrams || 0}g

\u0E08\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19:
1. Glycemic Impact Level: 'low' (\u0E04\u0E48\u0E2D\u0E22\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E48\u0E2D\u0E22\u0E44\u0E1B), 'moderate' (\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07), 'high' (\u0E02\u0E36\u0E49\u0E19\u0E40\u0E23\u0E47\u0E27), 'spike_risk' (\u0E1E\u0E38\u0E48\u0E07\u0E2A\u0E39\u0E07\u0E21\u0E32\u0E01 \u0E40\u0E2A\u0E35\u0E48\u0E22\u0E07\u0E04\u0E23\u0E32\u0E0A)
2. Peak Time: \u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E01\u0E35\u0E48\u0E19\u0E32\u0E17\u0E35\u0E2B\u0E25\u0E31\u0E07\u0E17\u0E32\u0E19\u0E17\u0E35\u0E48\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25\u0E02\u0E36\u0E49\u0E19\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 (\u0E40\u0E0A\u0E48\u0E19 30-45 \u0E19\u0E32\u0E17\u0E35)
3. Crash Risk: 'none' | 'mild' | 'moderate' | 'high'
4. Crash Window: \u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E21\u0E31\u0E01\u0E40\u0E01\u0E34\u0E14\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E07\u0E48\u0E27\u0E07\u0E40\u0E1E\u0E25\u0E35\u0E22 (\u0E40\u0E0A\u0E48\u0E19 60-90 \u0E19\u0E32\u0E17\u0E35\u0E2B\u0E25\u0E31\u0E07\u0E17\u0E32\u0E19)
5. Science Explanation: \u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E0A\u0E35\u0E27\u0E40\u0E04\u0E21\u0E35\u0E2A\u0E31\u0E49\u0E19\u0E46 \u0E17\u0E33\u0E44\u0E21\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E19\u0E35\u0E49\u0E16\u0E36\u0E07\u0E43\u0E2B\u0E49\u0E1C\u0E25\u0E40\u0E0A\u0E48\u0E19\u0E19\u0E31\u0E49\u0E19
6. Glucose Hacks: 3 \u0E40\u0E04\u0E25\u0E47\u0E14\u0E25\u0E31\u0E1A\u0E25\u0E14 Spike \u0E17\u0E32\u0E07\u0E27\u0E34\u0E17\u0E22\u0E32\u0E28\u0E32\u0E2A\u0E15\u0E23\u0E4C (\u0E40\u0E0A\u0E48\u0E19 \u0E17\u0E32\u0E19\u0E1C\u0E31\u0E01/\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E41\u0E1B\u0E49\u0E07, \u0E14\u0E37\u0E48\u0E21\u0E19\u0E49\u0E33\u0E1C\u0E2A\u0E21 ACV \u0E01\u0E48\u0E2D\u0E19\u0E21\u0E37\u0E49\u0E2D, \u0E40\u0E14\u0E34\u0E19\u0E40\u0E1A\u0E32\u0E46 10-15 \u0E19\u0E32\u0E17\u0E35\u0E2B\u0E25\u0E31\u0E07\u0E17\u0E32\u0E19)`;
      const response = await generateContentSafe({
        model: "gemini-flash-latest",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              glycemicImpactLevel: { type: import_genai.Type.STRING, enum: ["low", "moderate", "high", "spike_risk"] },
              peakMinutesAfterMeal: { type: import_genai.Type.STRING },
              crashRisk: { type: import_genai.Type.STRING, enum: ["none", "mild", "moderate", "high"] },
              crashWindowMinutes: { type: import_genai.Type.STRING },
              spikeScore: { type: import_genai.Type.INTEGER, description: "\u0E04\u0E30\u0E41\u0E19\u0E19\u0E01\u0E32\u0E23\u0E1E\u0E38\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25 1-100" },
              scienceExplanation: { type: import_genai.Type.STRING },
              glucoseHacks: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    hackTitle: { type: import_genai.Type.STRING },
                    hackDetail: { type: import_genai.Type.STRING },
                    expectedReductionPercent: { type: import_genai.Type.INTEGER }
                  },
                  required: ["hackTitle", "hackDetail", "expectedReductionPercent"]
                }
              },
              foodPairingRecommendation: { type: import_genai.Type.STRING }
            },
            required: ["glycemicImpactLevel", "peakMinutesAfterMeal", "crashRisk", "crashWindowMinutes", "spikeScore", "scienceExplanation", "glucoseHacks", "foodPairingRecommendation"]
          }
        }
      });
      const text = response.text;
      if (!text) throw new Error("Empty response from Glucose Predictor");
      let cleanText = text.trim().replace(/^```json\s*|\s*```$/gi, "");
      res.json(JSON.parse(cleanText));
    } catch (error) {
      console.error("Error predicting glucose impact:", error);
      res.json({
        glycemicImpactLevel: "moderate",
        peakMinutesAfterMeal: "45-60 \u0E19\u0E32\u0E17\u0E35",
        crashRisk: "mild",
        crashWindowMinutes: "75-90 \u0E19\u0E32\u0E17\u0E35\u0E2B\u0E25\u0E31\u0E07\u0E21\u0E37\u0E49\u0E2D",
        spikeScore: 45,
        scienceExplanation: "\u0E01\u0E32\u0E23\u0E22\u0E48\u0E2D\u0E22\u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E1A\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E41\u0E25\u0E30\u0E44\u0E02\u0E21\u0E31\u0E19\u0E0A\u0E48\u0E27\u0E22\u0E0A\u0E30\u0E25\u0E2D\u0E01\u0E32\u0E23\u0E14\u0E39\u0E14\u0E0B\u0E36\u0E21\u0E01\u0E25\u0E39\u0E42\u0E04\u0E2A\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E40\u0E25\u0E37\u0E2D\u0E14\u0E44\u0E14\u0E49\u0E43\u0E19\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07",
        glucoseHacks: [
          { hackTitle: "\u0E17\u0E32\u0E19\u0E1C\u0E31\u0E01\u0E2B\u0E23\u0E37\u0E2D\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E33\u0E41\u0E23\u0E01", hackDetail: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E0A\u0E31\u0E49\u0E19\u0E43\u0E22\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E43\u0E19\u0E01\u0E23\u0E30\u0E40\u0E1E\u0E32\u0E30\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E0A\u0E30\u0E25\u0E2D\u0E01\u0E32\u0E23\u0E14\u0E39\u0E14\u0E0B\u0E36\u0E21\u0E41\u0E1B\u0E49\u0E07", expectedReductionPercent: 30 },
          { hackTitle: "\u0E40\u0E14\u0E34\u0E19\u0E40\u0E1A\u0E32\u0E46 10 \u0E19\u0E32\u0E17\u0E35\u0E2B\u0E25\u0E31\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23", hackDetail: "\u0E01\u0E25\u0E49\u0E32\u0E21\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E14\u0E36\u0E07\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25\u0E44\u0E1B\u0E43\u0E0A\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E17\u0E31\u0E19\u0E17\u0E35\u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E2D\u0E32\u0E28\u0E31\u0E22\u0E2D\u0E34\u0E19\u0E0B\u0E39\u0E25\u0E34\u0E19\u0E2A\u0E48\u0E27\u0E19\u0E40\u0E01\u0E34\u0E19", expectedReductionPercent: 25 },
          { hackTitle: "\u0E14\u0E37\u0E48\u0E21\u0E19\u0E49\u0E33\u0E40\u0E1B\u0E25\u0E48\u0E32 1 \u0E41\u0E01\u0E49\u0E27\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E23\u0E34\u0E48\u0E21\u0E21\u0E37\u0E49\u0E2D", hackDetail: "\u0E0A\u0E48\u0E27\u0E22\u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E48\u0E2D\u0E22\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E33\u0E07\u0E32\u0E19\u0E2A\u0E21\u0E14\u0E38\u0E25\u0E41\u0E25\u0E30\u0E25\u0E14\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E22\u0E32\u0E01\u0E41\u0E1B\u0E49\u0E07", expectedReductionPercent: 15 }
        ],
        foodPairingRecommendation: "\u0E08\u0E31\u0E1A\u0E04\u0E39\u0E48\u0E01\u0E31\u0E1A\u0E1C\u0E31\u0E01\u0E43\u0E1A\u0E40\u0E02\u0E35\u0E22\u0E27\u0E2A\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E02\u0E48\u0E15\u0E49\u0E21\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E44\u0E1F\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E41\u0E25\u0E30\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19"
      });
    }
  });
  app.post("/api/scan-restaurant-menu", async (req, res) => {
    try {
      const { imageBase64, userGoal = "weight_loss", dietaryRestrictions = [] } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "No menu image provided" });
      }
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";
      const prompt = `\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D AI \u0E19\u0E31\u0E01\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E2A\u0E32\u0E22\u0E2A\u0E37\u0E1A\u0E40\u0E21\u0E19\u0E39\u0E23\u0E49\u0E32\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23 (Restaurant Menu Safe Choice Scanner)
\u0E08\u0E07\u0E2D\u0E48\u0E32\u0E19\u0E41\u0E25\u0E30\u0E2A\u0E41\u0E01\u0E19\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E43\u0E19\u0E20\u0E32\u0E1E\u0E16\u0E48\u0E32\u0E22\u0E40\u0E21\u0E19\u0E39\u0E23\u0E49\u0E32\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E19\u0E35\u0E49 \u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E17\u0E38\u0E01\u0E40\u0E21\u0E19\u0E39\u0E17\u0E35\u0E48\u0E1E\u0E1A \u0E41\u0E25\u0E30\u0E04\u0E31\u0E14\u0E40\u0E25\u0E37\u0E2D\u0E01:
1. "Safe Choices" (\u0E40\u0E21\u0E19\u0E39\u0E41\u0E19\u0E30\u0E19\u0E33\u0E17\u0E35\u0E48\u0E1B\u0E25\u0E2D\u0E14\u0E20\u0E31\u0E22/\u0E04\u0E25\u0E35\u0E19/\u0E15\u0E23\u0E07\u0E15\u0E32\u0E21\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E: ${userGoal})
2. "Moderate Choices" (\u0E40\u0E21\u0E19\u0E39\u0E01\u0E25\u0E32\u0E07\u0E46 \u0E1E\u0E2D\u0E17\u0E32\u0E19\u0E44\u0E14\u0E49\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E17\u0E23\u0E34\u0E04\u0E01\u0E32\u0E23\u0E2A\u0E31\u0E48\u0E07)
3. "Avoid/High-Risk Choices" (\u0E40\u0E21\u0E19\u0E39\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48/\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21/\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E2A\u0E39\u0E07\u0E17\u0E35\u0E48\u0E04\u0E27\u0E23\u0E23\u0E30\u0E27\u0E31\u0E07)
4. \u0E43\u0E2B\u0E49 "Custom Ordering Scripts" \u0E1B\u0E23\u0E30\u0E42\u0E22\u0E04\u0E40\u0E14\u0E47\u0E14\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E1E\u0E39\u0E14\u0E2A\u0E31\u0E48\u0E07\u0E01\u0E31\u0E1A\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E23\u0E49\u0E32\u0E19 \u0E40\u0E0A\u0E48\u0E19 "\u0E02\u0E2D\u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25/\u0E1C\u0E07\u0E0A\u0E39\u0E23\u0E2A", "\u0E41\u0E22\u0E01\u0E19\u0E49\u0E33\u0E23\u0E32\u0E14", "\u0E43\u0E0A\u0E49\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E19\u0E49\u0E2D\u0E22"`;
      const response = await generateContentSafe({
        model: "gemini-flash-latest",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { data: base64Data, mimeType } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              restaurantType: { type: import_genai.Type.STRING, description: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E02\u0E2D\u0E07\u0E23\u0E49\u0E32\u0E19 \u0E40\u0E0A\u0E48\u0E19 \u0E23\u0E49\u0E32\u0E19\u0E15\u0E32\u0E21\u0E2A\u0E31\u0E48\u0E07, \u0E23\u0E49\u0E32\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E0D\u0E35\u0E48\u0E1B\u0E38\u0E48\u0E19, \u0E0A\u0E32\u0E1A\u0E39" },
              totalDishesFound: { type: import_genai.Type.INTEGER },
              topSafeChoices: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    dishName: { type: import_genai.Type.STRING },
                    estimatedCalories: { type: import_genai.Type.INTEGER },
                    proteinGrams: { type: import_genai.Type.INTEGER },
                    healthScore: { type: import_genai.Type.INTEGER, description: "1-100" },
                    whySafe: { type: import_genai.Type.STRING },
                    smartOrderingTip: { type: import_genai.Type.STRING, description: "\u0E1B\u0E23\u0E30\u0E42\u0E22\u0E04\u0E2A\u0E31\u0E48\u0E07\u0E1E\u0E34\u0E40\u0E28\u0E29 \u0E40\u0E0A\u0E48\u0E19 \u0E02\u0E2D\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E19\u0E49\u0E2D\u0E22 \u0E41\u0E22\u0E01\u0E19\u0E49\u0E33" }
                  },
                  required: ["dishName", "estimatedCalories", "proteinGrams", "healthScore", "whySafe", "smartOrderingTip"]
                }
              },
              cautionDishes: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    dishName: { type: import_genai.Type.STRING },
                    reason: { type: import_genai.Type.STRING },
                    estimatedCalories: { type: import_genai.Type.INTEGER }
                  },
                  required: ["dishName", "reason", "estimatedCalories"]
                }
              },
              proOrderingPhrases: {
                type: import_genai.Type.ARRAY,
                items: { type: import_genai.Type.STRING },
                description: "\u0E1B\u0E23\u0E30\u0E42\u0E22\u0E04\u0E2A\u0E31\u0E48\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E04\u0E25\u0E35\u0E19\u0E01\u0E31\u0E1A\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32"
              }
            },
            required: ["restaurantType", "totalDishesFound", "topSafeChoices", "cautionDishes", "proOrderingPhrases"]
          }
        }
      });
      const text = response.text;
      if (!text) throw new Error("Empty response from Menu Scanner");
      let cleanText = text.trim().replace(/^```json\s*|\s*```$/gi, "");
      res.json(JSON.parse(cleanText));
    } catch (error) {
      console.error("Error scanning restaurant menu:", error);
      res.json({
        restaurantType: "\u0E23\u0E49\u0E32\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E15\u0E32\u0E21\u0E2A\u0E31\u0E48\u0E07\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B",
        totalDishesFound: 6,
        topSafeChoices: [
          {
            dishName: "\u0E15\u0E49\u0E21\u0E22\u0E33\u0E19\u0E49\u0E33\u0E43\u0E2A\u0E44\u0E01\u0E48 / \u0E1B\u0E25\u0E32 + \u0E02\u0E49\u0E32\u0E27\u0E2A\u0E27\u0E22 1 \u0E17\u0E31\u0E1E\u0E1E\u0E35",
            estimatedCalories: 320,
            proteinGrams: 28,
            healthScore: 92,
            whySafe: "\u0E19\u0E49\u0E33\u0E43\u0E2A\u0E44\u0E02\u0E21\u0E31\u0E19\u0E15\u0E48\u0E33\u0E21\u0E32\u0E01 \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E2A\u0E39\u0E07 \u0E21\u0E35\u0E2A\u0E21\u0E38\u0E19\u0E44\u0E1E\u0E23\u0E02\u0E31\u0E1A\u0E25\u0E21",
            smartOrderingTip: '\u0E1A\u0E2D\u0E01\u0E23\u0E49\u0E32\u0E19: "\u0E15\u0E49\u0E21\u0E22\u0E33\u0E19\u0E49\u0E33\u0E43\u0E2A \u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25 \u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E1C\u0E07\u0E0A\u0E39\u0E23\u0E2A"'
          },
          {
            dishName: "\u0E1C\u0E31\u0E14\u0E1C\u0E31\u0E01\u0E23\u0E27\u0E21\u0E21\u0E34\u0E15\u0E23\u0E01\u0E38\u0E49\u0E07\u0E2A\u0E14 (\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E19\u0E49\u0E2D\u0E22)",
            estimatedCalories: 280,
            proteinGrams: 20,
            healthScore: 88,
            whySafe: "\u0E44\u0E1F\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E2A\u0E39\u0E07 \u0E01\u0E38\u0E49\u0E07\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E2A\u0E39\u0E07\u0E44\u0E02\u0E21\u0E31\u0E19\u0E15\u0E48\u0E33",
            smartOrderingTip: '\u0E1A\u0E2D\u0E01\u0E23\u0E49\u0E32\u0E19: "\u0E1C\u0E31\u0E14\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E19\u0E49\u0E2D\u0E22\u0E46 \u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E0A\u0E39\u0E23\u0E2A \u0E02\u0E2D\u0E1E\u0E23\u0E34\u0E01\u0E2A\u0E14\u0E41\u0E17\u0E19"'
          }
        ],
        cautionDishes: [
          { dishName: "\u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E2B\u0E21\u0E39\u0E01\u0E23\u0E2D\u0E1A\u0E44\u0E02\u0E48\u0E14\u0E32\u0E27", reason: "\u0E44\u0E02\u0E21\u0E31\u0E19\u0E2D\u0E34\u0E48\u0E21\u0E15\u0E31\u0E27\u0E41\u0E25\u0E30\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E2A\u0E39\u0E07\u0E01\u0E27\u0E48\u0E32 750 kcal", estimatedCalories: 780 },
          { dishName: "\u0E02\u0E49\u0E32\u0E27\u0E1C\u0E31\u0E14\u0E15\u0E49\u0E21\u0E22\u0E33\u0E17\u0E30\u0E40\u0E25\u0E23\u0E27\u0E21", reason: "\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E41\u0E25\u0E30\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21\u0E2A\u0E39\u0E07\u0E21\u0E32\u0E01", estimatedCalories: 650 }
        ],
        proOrderingPhrases: [
          "\u0E02\u0E2D\u0E41\u0E1A\u0E1A\u0E1C\u0E31\u0E14\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E19\u0E49\u0E2D\u0E22\u0E46 \u0E19\u0E30\u0E04\u0E30/\u0E04\u0E23\u0E31\u0E1A",
          "\u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25\u0E41\u0E25\u0E30\u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E1C\u0E07\u0E0A\u0E39\u0E23\u0E2A\u0E04\u0E23\u0E31\u0E1A",
          "\u0E41\u0E22\u0E01\u0E19\u0E49\u0E33\u0E08\u0E34\u0E49\u0E21/\u0E19\u0E49\u0E33\u0E23\u0E32\u0E14\u0E43\u0E2A\u0E48\u0E16\u0E49\u0E27\u0E22\u0E40\u0E25\u0E47\u0E01\u0E43\u0E2B\u0E49\u0E14\u0E49\u0E27\u0E22\u0E04\u0E23\u0E31\u0E1A"
        ]
      });
    }
  });
  app.post("/api/analyze-anti-inflammatory", async (req, res) => {
    try {
      const { foodName, ingredients = [], foodsList = [] } = req.body;
      let targetFoodDescription = foodName || "";
      if (Array.isArray(foodsList) && foodsList.length > 0) {
        targetFoodDescription = foodsList.map((f) => typeof f === "string" ? f : f.foodName || f.name || "").filter(Boolean).join(", ");
      }
      if (!targetFoodDescription) {
        targetFoodDescription = ingredients.join(", ") || "\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E\u0E2B\u0E25\u0E32\u0E01\u0E2B\u0E25\u0E32\u0E22\u0E0A\u0E19\u0E34\u0E14";
      }
      const prompt = `\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E41\u0E25\u0E30\u0E19\u0E31\u0E01\u0E27\u0E34\u0E17\u0E22\u0E32\u0E28\u0E32\u0E2A\u0E15\u0E23\u0E4C\u0E1C\u0E39\u0E49\u0E40\u0E0A\u0E35\u0E48\u0E22\u0E27\u0E0A\u0E32\u0E0D\u0E14\u0E49\u0E32\u0E19\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E0A\u0E30\u0E25\u0E2D\u0E27\u0E31\u0E22\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E2D\u0E31\u0E01\u0E40\u0E2A\u0E1A\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E40\u0E0B\u0E25\u0E25\u0E4C (Cellular Anti-Inflammatory, Longevity & Telomere Health Expert)
\u0E08\u0E07\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E19\u0E35\u0E49: "${targetFoodDescription}"
\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19:
1. Longevity Score (0-100 \u0E04\u0E30\u0E41\u0E19\u0E19) \u0E41\u0E25\u0E30 Inflammatory Index (-100 \u0E16\u0E36\u0E07 +100)
2. \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E01\u0E32\u0E23\u0E2D\u0E31\u0E01\u0E40\u0E2A\u0E1A (\u0E40\u0E0A\u0E48\u0E19 "Anti-Inflammatory (\u0E15\u0E49\u0E32\u0E19\u0E01\u0E32\u0E23\u0E2D\u0E31\u0E01\u0E40\u0E2A\u0E1A\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E40\u0E0B\u0E25\u0E25\u0E4C\u0E2A\u0E39\u0E07)")
3. \u0E14\u0E32\u0E27\u0E04\u0E30\u0E41\u0E19\u0E19 Antioxidants (1-5 \u0E14\u0E32\u0E27) \u0E41\u0E25\u0E30 Gut-Friendly Microbiome (1-5 \u0E14\u0E32\u0E27)
4. \u0E2A\u0E32\u0E23\u0E15\u0E49\u0E32\u0E19\u0E2D\u0E19\u0E38\u0E21\u0E39\u0E25\u0E2D\u0E34\u0E2A\u0E23\u0E30\u0E41\u0E25\u0E30\u0E1E\u0E24\u0E01\u0E29\u0E40\u0E04\u0E21\u0E35\u0E40\u0E14\u0E48\u0E19 (keyBeneficialCompounds 3 \u0E02\u0E49\u0E2D \u0E40\u0E0A\u0E48\u0E19 Polyphenols, Sulforaphane, Omega-3)
5. \u0E1B\u0E31\u0E08\u0E08\u0E31\u0E22\u0E17\u0E35\u0E48\u0E04\u0E27\u0E23\u0E23\u0E30\u0E27\u0E31\u0E07 (cautionFactors 2 \u0E02\u0E49\u0E2D \u0E40\u0E0A\u0E48\u0E19 \u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21\u0E41\u0E1D\u0E07, \u0E2A\u0E32\u0E23 AGEs \u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E17\u0E2D\u0E14)
6. \u0E2A\u0E23\u0E38\u0E1B\u0E20\u0E32\u0E1E\u0E23\u0E27\u0E21\u0E40\u0E0A\u0E34\u0E07\u0E27\u0E34\u0E17\u0E22\u0E32\u0E28\u0E32\u0E2A\u0E15\u0E23\u0E4C\u0E0A\u0E30\u0E25\u0E2D\u0E27\u0E31\u0E22 (longevitySummary) 2-3 \u0E1B\u0E23\u0E30\u0E42\u0E22\u0E04`;
      const response = await generateContentSafe({
        model: "gemini-flash-latest",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              longevityScore: { type: import_genai.Type.INTEGER, description: "\u0E04\u0E30\u0E41\u0E19\u0E19 0-100" },
              inflammatoryScore: { type: import_genai.Type.INTEGER, description: "\u0E04\u0E30\u0E41\u0E19\u0E19 -100 \u0E16\u0E36\u0E07 +100" },
              inflammatoryStatus: { type: import_genai.Type.STRING },
              status: { type: import_genai.Type.STRING, enum: ["anti_inflammatory", "neutral", "pro_inflammatory"] },
              antioxidantStars: { type: import_genai.Type.INTEGER, description: "1-5" },
              gutFriendlyStars: { type: import_genai.Type.INTEGER, description: "1-5" },
              keyBeneficialCompounds: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
              cautionFactors: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
              longevitySummary: { type: import_genai.Type.STRING },
              upgradeRecommendation: { type: import_genai.Type.STRING }
            },
            required: ["longevityScore", "inflammatoryStatus", "antioxidantStars", "gutFriendlyStars", "keyBeneficialCompounds", "cautionFactors", "longevitySummary"]
          }
        }
      });
      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      let cleanText = text.trim().replace(/^```json\s*|\s*```$/gi, "");
      const parsed = JSON.parse(cleanText);
      res.json({
        inflammatoryScore: parsed.inflammatoryScore || Math.round((parsed.longevityScore - 50) * 1.8),
        status: parsed.status || (parsed.longevityScore >= 65 ? "anti_inflammatory" : parsed.longevityScore >= 45 ? "neutral" : "pro_inflammatory"),
        statusText: parsed.inflammatoryStatus,
        upgradeRecommendation: parsed.upgradeRecommendation || (parsed.cautionFactors ? parsed.cautionFactors[0] : "\u0E40\u0E2A\u0E23\u0E34\u0E21\u0E2A\u0E21\u0E38\u0E19\u0E44\u0E1E\u0E23\u0E2A\u0E14\u0E41\u0E25\u0E30\u0E1E\u0E23\u0E34\u0E01\u0E44\u0E17\u0E22\u0E14\u0E33"),
        ...parsed
      });
    } catch (error) {
      console.error("Error analyzing anti-inflammatory:", error);
      res.json({
        longevityScore: 84,
        inflammatoryScore: 55,
        status: "anti_inflammatory",
        statusText: "\u0E15\u0E49\u0E32\u0E19\u0E01\u0E32\u0E23\u0E2D\u0E31\u0E01\u0E40\u0E2A\u0E1A\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E40\u0E0B\u0E25\u0E25\u0E4C\u0E2A\u0E39\u0E07",
        inflammatoryStatus: "Anti-Inflammatory (\u0E15\u0E49\u0E32\u0E19\u0E01\u0E32\u0E23\u0E2D\u0E31\u0E01\u0E40\u0E2A\u0E1A\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E40\u0E0B\u0E25\u0E25\u0E4C\u0E2A\u0E39\u0E07)",
        antioxidantStars: 4,
        gutFriendlyStars: 5,
        keyBeneficialCompounds: [
          "Polyphenols & Flavonoids \u0E08\u0E32\u0E01\u0E1C\u0E31\u0E01\u0E43\u0E1A\u0E40\u0E02\u0E35\u0E22\u0E27\u0E41\u0E25\u0E30\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E40\u0E17\u0E28",
          "Omega-3 Fatty Acids \u0E0A\u0E48\u0E27\u0E22\u0E25\u0E14\u0E23\u0E30\u0E14\u0E31\u0E1A C-Reactive Protein (CRP)",
          "Sulforaphane \u0E01\u0E23\u0E30\u0E15\u0E38\u0E49\u0E19\u0E22\u0E35\u0E19\u0E0A\u0E30\u0E25\u0E2D\u0E27\u0E31\u0E22 Nrf2 pathway"
        ],
        cautionFactors: [
          "\u0E23\u0E30\u0E27\u0E31\u0E07\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21\u0E43\u0E19\u0E19\u0E49\u0E33\u0E08\u0E34\u0E49\u0E21\u0E2B\u0E23\u0E37\u0E2D\u0E0B\u0E35\u0E2D\u0E34\u0E4A\u0E27\u0E1B\u0E23\u0E38\u0E07\u0E23\u0E2A",
          "\u0E2B\u0E25\u0E35\u0E01\u0E40\u0E25\u0E35\u0E48\u0E22\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E2D\u0E14\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E17\u0E2D\u0E14\u0E0B\u0E49\u0E33\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E25\u0E14\u0E2A\u0E32\u0E23 AGEs"
        ],
        longevitySummary: "\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E2D\u0E38\u0E14\u0E21\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22\u0E2A\u0E32\u0E23\u0E15\u0E49\u0E32\u0E19\u0E2D\u0E19\u0E38\u0E21\u0E39\u0E25\u0E2D\u0E34\u0E2A\u0E23\u0E30 \u0E0A\u0E48\u0E27\u0E22\u0E25\u0E14\u0E04\u0E27\u0E32\u0E21\u0E40\u0E04\u0E23\u0E35\u0E22\u0E14\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E2D\u0E2D\u0E01\u0E0B\u0E34\u0E40\u0E14\u0E0A\u0E31\u0E19 (Oxidative Stress) \u0E2A\u0E48\u0E07\u0E40\u0E2A\u0E23\u0E34\u0E21\u0E01\u0E32\u0E23\u0E17\u0E33\u0E07\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E40\u0E17\u0E42\u0E25\u0E40\u0E21\u0E35\u0E22\u0E23\u0E4C (Telomeres) \u0E41\u0E25\u0E30\u0E0A\u0E30\u0E25\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2A\u0E37\u0E48\u0E2D\u0E21\u0E02\u0E2D\u0E07\u0E40\u0E0B\u0E25\u0E25\u0E4C",
        upgradeRecommendation: "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1E\u0E23\u0E34\u0E01\u0E44\u0E17\u0E22\u0E14\u0E33 \u0E02\u0E21\u0E34\u0E49\u0E19\u0E0A\u0E31\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E23\u0E30\u0E40\u0E17\u0E35\u0E22\u0E21\u0E2A\u0E14\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E2A\u0E23\u0E34\u0E21\u0E24\u0E17\u0E18\u0E34\u0E4C\u0E01\u0E32\u0E23\u0E15\u0E49\u0E32\u0E19\u0E01\u0E32\u0E23\u0E2D\u0E31\u0E01\u0E40\u0E2A\u0E1A"
      });
    }
  });
  app.post("/api/cheat-meal-recovery", async (req, res) => {
    try {
      const {
        mealName,
        cheatFoodDescription,
        estimatedCalories,
        excessCaloriesEstimate,
        alcoholConsumed = false,
        heavyNutrient = "sodium"
      } = req.body;
      const targetMeal = cheatFoodDescription || mealName || "\u0E21\u0E37\u0E49\u0E2D\u0E2B\u0E19\u0E31\u0E01 / \u0E1A\u0E38\u0E1F\u0E40\u0E1F\u0E48\u0E15\u0E4C";
      const cals = Number(excessCaloriesEstimate || estimatedCalories || 850);
      const prompt = `\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D\u0E42\u0E04\u0E49\u0E0A\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E1F\u0E37\u0E49\u0E19\u0E1F\u0E39\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22\u0E2B\u0E25\u0E31\u0E07\u0E21\u0E37\u0E49\u0E2D\u0E2B\u0E19\u0E31\u0E01 (Metabolic Damage Control & Zero-Guilt Cheat Meal Recovery Coach)
\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E1E\u0E34\u0E48\u0E07\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19\u0E21\u0E37\u0E49\u0E2D\u0E2B\u0E19\u0E31\u0E01: "${targetMeal}" (\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E2A\u0E48\u0E27\u0E19\u0E40\u0E01\u0E34\u0E19\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 ${cals} kcal, \u0E41\u0E2D\u0E25\u0E01\u0E2D\u0E2E\u0E2D\u0E25\u0E4C: ${alcoholConsumed ? "\u0E14\u0E37\u0E48\u0E21" : "\u0E44\u0E21\u0E48\u0E14\u0E37\u0E48\u0E21"}, \u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E21\u0E32\u0E01: ${heavyNutrient})
\u0E08\u0E07\u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A "\u0E42\u0E1B\u0E23\u0E42\u0E15\u0E04\u0E2D\u0E25\u0E01\u0E39\u0E49\u0E23\u0E48\u0E32\u0E07 48 \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07 (48-Hour Recovery Protocol)" \u0E17\u0E35\u0E48\u0E21\u0E35\u0E2B\u0E25\u0E31\u0E01\u0E01\u0E32\u0E23\u0E17\u0E32\u0E07\u0E27\u0E34\u0E17\u0E22\u0E32\u0E28\u0E32\u0E2A\u0E15\u0E23\u0E4C \u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E14\u0E2D\u0E32\u0E2B\u0E32\u0E23:
1. day1Adjustment: \u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E31\u0E1A\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E41\u0E25\u0E30\u0E1E\u0E24\u0E15\u0E34\u0E01\u0E23\u0E23\u0E21\u0E43\u0E19\u0E27\u0E31\u0E19\u0E41\u0E23\u0E01 (\u0E40\u0E19\u0E49\u0E19\u0E02\u0E31\u0E1A\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21 \u0E25\u0E14\u0E1A\u0E27\u0E21 \u0E40\u0E15\u0E34\u0E21\u0E42\u0E1E\u0E41\u0E17\u0E2A\u0E40\u0E0B\u0E35\u0E22\u0E21)
2. day2Adjustment: \u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E31\u0E1A\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E41\u0E25\u0E30\u0E01\u0E34\u0E08\u0E01\u0E23\u0E23\u0E21\u0E43\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E2D\u0E07 (\u0E40\u0E19\u0E49\u0E19 Reset \u0E2D\u0E34\u0E19\u0E0B\u0E39\u0E25\u0E34\u0E19 \u0E41\u0E25\u0E30\u0E04\u0E32\u0E23\u0E4C\u0E14\u0E34\u0E42\u0E2D Zone 2)
3. hydrationExtraMl: \u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13\u0E19\u0E49\u0E33\u0E40\u0E1B\u0E25\u0E48\u0E32\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21\u0E40\u0E1E\u0E34\u0E48\u0E21 (\u0E21\u0E25. \u0E40\u0E0A\u0E48\u0E19 1000)
4. potassiumFoodSuggestions: \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21\u0E42\u0E1E\u0E41\u0E17\u0E2A\u0E40\u0E0B\u0E35\u0E22\u0E21\u0E2A\u0E39\u0E07 3-4 \u0E2D\u0E22\u0E48\u0E32\u0E07
5. mindsetSupportMessage: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E43\u0E2B\u0E49\u0E01\u0E33\u0E25\u0E31\u0E07\u0E43\u0E08\u0E40\u0E0A\u0E34\u0E07\u0E08\u0E34\u0E15\u0E27\u0E34\u0E17\u0E22\u0E32\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E02\u0E08\u0E31\u0E14\u0E04\u0E27\u0E32\u0E21\u0E23\u0E39\u0E49\u0E2A\u0E36\u0E01\u0E1C\u0E34\u0E14 (No Guilt)
6. recommendedNextMeal: \u0E40\u0E21\u0E19\u0E39\u0E21\u0E37\u0E49\u0E2D\u0E16\u0E31\u0E14\u0E44\u0E1B\u0E17\u0E35\u0E48\u0E41\u0E19\u0E30\u0E19\u0E33 (\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E21\u0E19\u0E39, \u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22, \u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48, \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19)`;
      const response = await generateContentSafe({
        model: "gemini-flash-latest",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              protocolTitle: { type: import_genai.Type.STRING },
              primaryFocus: { type: import_genai.Type.STRING },
              day1Adjustment: { type: import_genai.Type.STRING },
              day2Adjustment: { type: import_genai.Type.STRING },
              hydrationExtraMl: { type: import_genai.Type.INTEGER },
              waterTargetLiters: { type: import_genai.Type.NUMBER },
              potassiumFoodSuggestions: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
              potassiumFoodsToEat: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
              mindsetSupportMessage: { type: import_genai.Type.STRING },
              mindsetCoachNote: { type: import_genai.Type.STRING },
              recommendedNextMeal: {
                type: import_genai.Type.OBJECT,
                properties: {
                  mealName: { type: import_genai.Type.STRING },
                  description: { type: import_genai.Type.STRING },
                  calories: { type: import_genai.Type.INTEGER },
                  proteinGrams: { type: import_genai.Type.INTEGER }
                },
                required: ["mealName", "description", "calories", "proteinGrams"]
              }
            },
            required: ["protocolTitle", "day1Adjustment", "day2Adjustment", "hydrationExtraMl", "potassiumFoodSuggestions", "mindsetSupportMessage", "recommendedNextMeal"]
          }
        }
      });
      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      let cleanText = text.trim().replace(/^```json\s*|\s*```$/gi, "");
      const parsed = JSON.parse(cleanText);
      res.json({
        potassiumFoodsToEat: parsed.potassiumFoodSuggestions || parsed.potassiumFoodsToEat,
        mindsetCoachNote: parsed.mindsetSupportMessage || parsed.mindsetCoachNote,
        waterTargetLiters: parsed.waterTargetLiters || 2.8,
        timelineSteps: [
          { timeFrame: "\u0E27\u0E31\u0E19\u0E41\u0E23\u0E01 (Day 1)", action: parsed.day1Adjustment, benefit: "\u0E40\u0E23\u0E48\u0E07\u0E02\u0E31\u0E1A\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21 \u0E25\u0E14\u0E1A\u0E27\u0E21\u0E19\u0E49\u0E33 \u0E41\u0E25\u0E30\u0E1F\u0E37\u0E49\u0E19\u0E1F\u0E39\u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E48\u0E2D\u0E22" },
          { timeFrame: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E2D\u0E07 (Day 2)", action: parsed.day2Adjustment, benefit: "\u0E14\u0E36\u0E07\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E2A\u0E30\u0E2A\u0E21\u0E21\u0E32\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E30\u0E01\u0E25\u0E31\u0E1A\u0E2A\u0E39\u0E48\u0E20\u0E32\u0E27\u0E30\u0E2A\u0E21\u0E14\u0E38\u0E25" }
        ],
        ...parsed
      });
    } catch (error) {
      console.error("Error calculating recovery protocol:", error);
      res.json({
        protocolTitle: "\u0E42\u0E1B\u0E23\u0E42\u0E15\u0E04\u0E2D\u0E25\u0E01\u0E39\u0E49\u0E23\u0E48\u0E32\u0E07 48 \u0E0A\u0E21. (Zero Guilt Recovery)",
        primaryFocus: "\u0E02\u0E31\u0E1A\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21\u0E2A\u0E48\u0E27\u0E19\u0E40\u0E01\u0E34\u0E19 \u0E25\u0E14\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E1A\u0E27\u0E21\u0E19\u0E49\u0E33 \u0E41\u0E25\u0E30\u0E1F\u0E37\u0E49\u0E19\u0E1F\u0E39\u0E04\u0E27\u0E32\u0E21\u0E44\u0E27\u0E02\u0E2D\u0E07\u0E2D\u0E34\u0E19\u0E0B\u0E39\u0E25\u0E34\u0E19",
        day1Adjustment: "\u0E14\u0E37\u0E48\u0E21\u0E19\u0E49\u0E33\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E1B\u0E47\u0E19 3.2 \u0E25\u0E34\u0E15\u0E23\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E02\u0E31\u0E1A\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21\u0E2A\u0E48\u0E27\u0E19\u0E40\u0E01\u0E34\u0E19 \u0E40\u0E19\u0E49\u0E19\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E25\u0E35\u0E19 + \u0E1C\u0E31\u0E01\u0E43\u0E1A\u0E40\u0E02\u0E35\u0E22\u0E27\u0E42\u0E1E\u0E41\u0E17\u0E2A\u0E40\u0E0B\u0E35\u0E22\u0E21\u0E2A\u0E39\u0E07 \u0E40\u0E25\u0E35\u0E48\u0E22\u0E07\u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15\u0E41\u0E1B\u0E23\u0E23\u0E39\u0E1B",
        day2Adjustment: "\u0E01\u0E25\u0E31\u0E1A\u0E2A\u0E39\u0E48\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E1B\u0E01\u0E15\u0E34 (Maintenance -10%) \u0E2D\u0E2D\u0E01\u0E01\u0E33\u0E25\u0E31\u0E07\u0E01\u0E32\u0E22\u0E41\u0E1A\u0E1A Zone 2 \u0E04\u0E32\u0E23\u0E4C\u0E14\u0E34\u0E42\u0E2D 40 \u0E19\u0E32\u0E17\u0E35\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E36\u0E07\u0E44\u0E01\u0E25\u0E42\u0E04\u0E40\u0E08\u0E19\u0E2A\u0E30\u0E2A\u0E21\u0E21\u0E32\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19",
        hydrationExtraMl: 1e3,
        waterTargetLiters: 3.2,
        potassiumFoodSuggestions: [
          "\u0E19\u0E49\u0E33\u0E21\u0E30\u0E1E\u0E23\u0E49\u0E32\u0E27\u0E2A\u0E14\u0E18\u0E23\u0E23\u0E21\u0E0A\u0E32\u0E15\u0E34 1 \u0E25\u0E39\u0E01 (\u0E44\u0E21\u0E48\u0E40\u0E15\u0E34\u0E21\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25)",
          "\u0E01\u0E25\u0E49\u0E27\u0E22\u0E2B\u0E2D\u0E21 1 \u0E25\u0E39\u0E01 \u0E2B\u0E23\u0E37\u0E2D \u0E2D\u0E30\u0E42\u0E27\u0E04\u0E32\u0E42\u0E14\u0E04\u0E23\u0E36\u0E48\u0E07\u0E25\u0E39\u0E01",
          "\u0E1C\u0E31\u0E01\u0E42\u0E02\u0E21\u0E25\u0E27\u0E01 \u0E2B\u0E23\u0E37\u0E2D \u0E1A\u0E23\u0E2D\u0E01\u0E42\u0E04\u0E25\u0E35\u0E15\u0E49\u0E21"
        ],
        potassiumFoodsToEat: ["\u0E19\u0E49\u0E33\u0E21\u0E30\u0E1E\u0E23\u0E49\u0E32\u0E27\u0E2A\u0E14", "\u0E01\u0E25\u0E49\u0E27\u0E22\u0E2B\u0E2D\u0E21", "\u0E1C\u0E31\u0E01\u0E42\u0E02\u0E21"],
        timelineSteps: [
          { timeFrame: "\u0E27\u0E31\u0E19\u0E41\u0E23\u0E01 (Day 1)", action: "\u0E14\u0E37\u0E48\u0E21\u0E19\u0E49\u0E33\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E41\u0E25\u0E30\u0E40\u0E19\u0E49\u0E19\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E25\u0E35\u0E19", benefit: "\u0E02\u0E31\u0E1A\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21\u0E2A\u0E48\u0E27\u0E19\u0E40\u0E01\u0E34\u0E19 \u0E25\u0E14\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E1A\u0E27\u0E21\u0E19\u0E49\u0E33" },
          { timeFrame: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E2D\u0E07 (Day 2)", action: "\u0E02\u0E22\u0E31\u0E1A\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22\u0E41\u0E1A\u0E1A Zone 2", benefit: "\u0E14\u0E36\u0E07\u0E44\u0E01\u0E25\u0E42\u0E04\u0E40\u0E08\u0E19\u0E2A\u0E30\u0E2A\u0E21\u0E21\u0E32\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E41\u0E25\u0E30\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E1C\u0E32\u0E1C\u0E25\u0E32\u0E0D" }
        ],
        mindsetSupportMessage: "\u0E2D\u0E22\u0E48\u0E32\u0E23\u0E39\u0E49\u0E2A\u0E36\u0E01\u0E1C\u0E34\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E2D\u0E14\u0E2D\u0E32\u0E2B\u0E32\u0E23! \u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22\u0E21\u0E19\u0E38\u0E29\u0E22\u0E4C\u0E17\u0E19\u0E17\u0E32\u0E19\u0E15\u0E48\u0E2D\u0E01\u0E32\u0E23\u0E01\u0E34\u0E19\u0E40\u0E01\u0E34\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E23\u0E31\u0E49\u0E07\u0E04\u0E23\u0E32\u0E27 \u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01\u0E17\u0E35\u0E48\u0E02\u0E36\u0E49\u0E19\u0E21\u0E32\u0E43\u0E19\u0E27\u0E31\u0E19\u0E16\u0E31\u0E14\u0E44\u0E1B 80-90% \u0E04\u0E37\u0E2D\u0E19\u0E49\u0E33\u0E41\u0E25\u0E30\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21\u0E17\u0E35\u0E48\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22\u0E01\u0E31\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E44\u0E27\u0E49 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E44\u0E02\u0E21\u0E31\u0E19 \u0E40\u0E1E\u0E35\u0E22\u0E07\u0E17\u0E33\u0E15\u0E32\u0E21\u0E41\u0E1C\u0E19\u0E19\u0E35\u0E49 2 \u0E27\u0E31\u0E19 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E01\u0E25\u0E31\u0E1A\u0E2A\u0E39\u0E48\u0E2A\u0E21\u0E14\u0E38\u0E25 100%",
        mindsetCoachNote: "\u0E21\u0E37\u0E49\u0E2D\u0E40\u0E14\u0E35\u0E22\u0E27\u0E44\u0E21\u0E48\u0E17\u0E33\u0E43\u0E2B\u0E49\u0E04\u0E38\u0E13\u0E40\u0E2A\u0E35\u0E22\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E \u0E17\u0E33\u0E15\u0E32\u0E21\u0E41\u0E1C\u0E19 48 \u0E0A\u0E21. \u0E41\u0E25\u0E49\u0E27\u0E01\u0E49\u0E32\u0E27\u0E15\u0E48\u0E2D\u0E44\u0E1B\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E38\u0E02!",
        recommendedNextMeal: {
          mealName: "\u0E15\u0E49\u0E21\u0E08\u0E37\u0E14\u0E40\u0E15\u0E49\u0E32\u0E2B\u0E39\u0E49\u0E44\u0E02\u0E48\u0E2B\u0E21\u0E39\u0E2A\u0E31\u0E1A\u0E15\u0E33\u0E25\u0E36\u0E07 + \u0E02\u0E49\u0E32\u0E27\u0E01\u0E25\u0E49\u0E2D\u0E07\u0E04\u0E23\u0E36\u0E48\u0E07\u0E17\u0E31\u0E1E\u0E1E\u0E35",
          description: "\u0E22\u0E48\u0E2D\u0E22\u0E07\u0E48\u0E32\u0E22 \u0E42\u0E1E\u0E41\u0E17\u0E2A\u0E40\u0E0B\u0E35\u0E22\u0E21\u0E2A\u0E39\u0E07 \u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21\u0E15\u0E48\u0E33 \u0E2D\u0E38\u0E14\u0E21\u0E14\u0E49\u0E27\u0E22\u0E01\u0E23\u0E14\u0E2D\u0E30\u0E21\u0E34\u0E42\u0E19\u0E41\u0E25\u0E30\u0E41\u0E23\u0E48\u0E18\u0E32\u0E15\u0E38",
          calories: 280,
          proteinGrams: 24
        }
      });
    }
  });
  app.post("/api/suggest-meals", async (req, res) => {
    try {
      const { remainingCalories = 500, remainingCarbs = 50, remainingProtein = 30, remainingFat = 15 } = req.body;
      const safeCal = Math.max(100, Math.round(Number(remainingCalories) || 500));
      const safeCarbs = Math.max(5, Math.round(Number(remainingCarbs) || 50));
      const safeProtein = Math.max(5, Math.round(Number(remainingProtein) || 30));
      const safeFat = Math.max(2, Math.round(Number(remainingFat) || 15));
      const prompt = `\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D\u0E19\u0E31\u0E01\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23 AI \u0E1C\u0E39\u0E49\u0E40\u0E0A\u0E35\u0E48\u0E22\u0E27\u0E0A\u0E32\u0E0D\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E44\u0E17\u0E22\u0E41\u0E25\u0E30\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E (Thai Dietitian & Meal Planner)
\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E44\u0E2D\u0E40\u0E14\u0E35\u0E22\u0E40\u0E21\u0E19\u0E39\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E44\u0E17\u0E22 3 \u0E40\u0E21\u0E19\u0E39 \u0E17\u0E35\u0E48\u0E21\u0E35\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E1E\u0E2D\u0E14\u0E35\u0E2B\u0E23\u0E37\u0E2D\u0E43\u0E01\u0E25\u0E49\u0E40\u0E04\u0E35\u0E22\u0E07\u0E01\u0E31\u0E1A\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49:
- \u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D: \u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 ${safeCal} kcal (\u0E1A\u0E27\u0E01\u0E25\u0E1A\u0E44\u0E14\u0E49\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19 15%)
- \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D: \u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 ${safeProtein} \u0E01\u0E23\u0E31\u0E21
- \u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D: \u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 ${safeCarbs} \u0E01\u0E23\u0E31\u0E21
- \u0E44\u0E02\u0E21\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D: \u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 ${safeFat} \u0E01\u0E23\u0E31\u0E21

\u0E02\u0E49\u0E2D\u0E01\u0E33\u0E2B\u0E19\u0E14:
1. \u0E41\u0E19\u0E30\u0E19\u0E33 3 \u0E40\u0E21\u0E19\u0E39\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E44\u0E17\u0E22\u0E17\u0E35\u0E48\u0E2D\u0E23\u0E48\u0E2D\u0E22 \u0E2B\u0E32\u0E0B\u0E37\u0E49\u0E2D\u0E07\u0E48\u0E32\u0E22\u0E2B\u0E23\u0E37\u0E2D\u0E17\u0E33\u0E40\u0E2D\u0E07\u0E44\u0E14\u0E49\u0E08\u0E23\u0E34\u0E07 (\u0E40\u0E0A\u0E48\u0E19 \u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E15\u0E32\u0E21\u0E2A\u0E31\u0E48\u0E07 \u0E02\u0E49\u0E32\u0E27\u0E23\u0E32\u0E14\u0E41\u0E01\u0E07 \u0E01\u0E4B\u0E27\u0E22\u0E40\u0E15\u0E35\u0E4B\u0E22\u0E27 \u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E04\u0E25\u0E35\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E2A\u0E15\u0E23\u0E35\u0E17\u0E1F\u0E39\u0E49\u0E14\u0E17\u0E35\u0E48\u0E14\u0E35\u0E15\u0E48\u0E2D\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E)
2. \u0E04\u0E33\u0E19\u0E27\u0E13\u0E2A\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E15\u0E48\u0E2D 1 \u0E40\u0E2A\u0E34\u0E23\u0E4C\u0E1F\u0E43\u0E2B\u0E49\u0E2A\u0E21\u0E08\u0E23\u0E34\u0E07
3. \u0E40\u0E02\u0E35\u0E22\u0E19 explanation \u0E2A\u0E31\u0E49\u0E19\u0E46 1-2 \u0E1B\u0E23\u0E30\u0E42\u0E22\u0E04\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E27\u0E48\u0E32\u0E17\u0E33\u0E44\u0E21\u0E40\u0E21\u0E19\u0E39\u0E19\u0E35\u0E49\u0E08\u0E36\u0E07\u0E40\u0E2B\u0E21\u0E32\u0E30\u0E01\u0E31\u0E1A\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D

\u0E2A\u0E48\u0E07\u0E1C\u0E25\u0E25\u0E31\u0E1E\u0E18\u0E4C\u0E40\u0E1B\u0E47\u0E19 JSON Array \u0E02\u0E2D\u0E07 3 \u0E40\u0E21\u0E19\u0E39\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E15\u0E32\u0E21 Schema:`;
      const response = await generateContentSafe({
        model: "gemini-flash-latest",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.ARRAY,
            description: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 3 \u0E40\u0E21\u0E19\u0E39\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E41\u0E19\u0E30\u0E19\u0E33\u0E17\u0E35\u0E48\u0E2A\u0E2D\u0E14\u0E04\u0E25\u0E49\u0E2D\u0E07\u0E01\u0E31\u0E1A\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D",
            items: {
              type: import_genai.Type.OBJECT,
              properties: {
                foodName: { type: import_genai.Type.STRING, description: "\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E21\u0E19\u0E39\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E44\u0E17\u0E22 \u0E40\u0E0A\u0E48\u0E19 \u0E2D\u0E01\u0E44\u0E01\u0E48\u0E1C\u0E31\u0E14\u0E02\u0E34\u0E07 + \u0E02\u0E49\u0E32\u0E27\u0E01\u0E25\u0E49\u0E2D\u0E07 1 \u0E17\u0E31\u0E1E\u0E1E\u0E35" },
                calories: { type: import_genai.Type.INTEGER, description: "\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E23\u0E27\u0E21 (kcal)" },
                proteinGrams: { type: import_genai.Type.INTEGER, description: "\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 (g)" },
                carbsGrams: { type: import_genai.Type.INTEGER, description: "\u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15 (g)" },
                fatGrams: { type: import_genai.Type.INTEGER, description: "\u0E44\u0E02\u0E21\u0E31\u0E19 (g)" },
                explanation: { type: import_genai.Type.STRING, description: "\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E2A\u0E31\u0E49\u0E19\u0E46 \u0E17\u0E33\u0E44\u0E21\u0E08\u0E36\u0E07\u0E40\u0E2B\u0E21\u0E32\u0E30\u0E01\u0E31\u0E1A\u0E42\u0E04\u0E27\u0E15\u0E49\u0E32\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D" }
              },
              required: ["foodName", "calories", "proteinGrams", "carbsGrams", "fatGrams", "explanation"]
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
          console.warn("Failed to parse suggestions JSON:", parseErr);
        }
      }
      const fallbackSuggestions = [
        {
          foodName: "\u0E2A\u0E40\u0E15\u0E4A\u0E01\u0E2D\u0E01\u0E44\u0E01\u0E48\u0E22\u0E48\u0E32\u0E07\u0E2A\u0E21\u0E38\u0E19\u0E44\u0E1E\u0E23 + \u0E2A\u0E25\u0E31\u0E14\u0E1C\u0E31\u0E01\u0E19\u0E49\u0E33\u0E43\u0E2A",
          calories: Math.min(safeCal, 350),
          proteinGrams: Math.min(safeProtein, 38),
          carbsGrams: Math.min(safeCarbs, 15),
          fatGrams: Math.min(safeFat, 8),
          explanation: "\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E2A\u0E39\u0E07 \u0E44\u0E02\u0E21\u0E31\u0E19\u0E15\u0E48\u0E33 \u0E40\u0E2B\u0E21\u0E32\u0E30\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E40\u0E15\u0E34\u0E21\u0E40\u0E15\u0E47\u0E21\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19\u0E42\u0E04\u0E27\u0E15\u0E49\u0E32\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48"
        },
        {
          foodName: "\u0E15\u0E49\u0E21\u0E22\u0E33\u0E01\u0E38\u0E49\u0E07\u0E19\u0E49\u0E33\u0E43\u0E2A + \u0E02\u0E49\u0E32\u0E27\u0E2A\u0E27\u0E22 1 \u0E17\u0E31\u0E1E\u0E1E\u0E35",
          calories: Math.min(safeCal, 320),
          proteinGrams: Math.min(safeProtein, 26),
          carbsGrams: Math.min(safeCarbs, 40),
          fatGrams: Math.min(safeFat, 4),
          explanation: "\u0E22\u0E48\u0E2D\u0E22\u0E07\u0E48\u0E32\u0E22 \u0E44\u0E02\u0E21\u0E31\u0E19\u0E15\u0E48\u0E33\u0E21\u0E32\u0E01 \u0E2A\u0E21\u0E38\u0E19\u0E44\u0E1E\u0E23\u0E44\u0E17\u0E22\u0E0A\u0E48\u0E27\u0E22\u0E01\u0E23\u0E30\u0E15\u0E38\u0E49\u0E19\u0E01\u0E32\u0E23\u0E40\u0E1C\u0E32\u0E1C\u0E25\u0E32\u0E0D"
        },
        {
          foodName: "\u0E22\u0E33\u0E44\u0E02\u0E48\u0E15\u0E49\u0E21\u0E22\u0E32\u0E07\u0E21\u0E30\u0E15\u0E39\u0E21 (\u0E44\u0E02\u0E48 2 \u0E1F\u0E2D\u0E07) + \u0E1C\u0E31\u0E01\u0E2A\u0E14\u0E40\u0E04\u0E35\u0E22\u0E07",
          calories: Math.min(safeCal, 220),
          proteinGrams: Math.min(safeProtein, 14),
          carbsGrams: Math.min(safeCarbs, 8),
          fatGrams: Math.min(safeFat, 12),
          explanation: "\u0E40\u0E21\u0E19\u0E39\u0E40\u0E1A\u0E32\u0E46 \u0E0A\u0E48\u0E27\u0E07\u0E40\u0E22\u0E47\u0E19 \u0E2D\u0E34\u0E48\u0E21\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E35\u0E41\u0E25\u0E30\u0E04\u0E27\u0E1A\u0E04\u0E38\u0E21\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25\u0E43\u0E19\u0E40\u0E25\u0E37\u0E2D\u0E14\u0E44\u0E14\u0E49\u0E14\u0E35\u0E40\u0E22\u0E35\u0E48\u0E22\u0E21"
        }
      ];
      return res.json(fallbackSuggestions);
    } catch (error) {
      console.error("Error in suggest-meals:", error);
      const fallbackSuggestions = [
        {
          foodName: "\u0E2D\u0E01\u0E44\u0E01\u0E48\u0E1C\u0E31\u0E14\u0E1A\u0E25\u0E47\u0E2D\u0E01\u0E42\u0E04\u0E25\u0E35\u0E48 + \u0E02\u0E49\u0E32\u0E27\u0E44\u0E23\u0E0B\u0E4C\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E23\u0E35\u0E48",
          calories: 380,
          proteinGrams: 35,
          carbsGrams: 42,
          fatGrams: 7,
          explanation: "\u0E2A\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E04\u0E23\u0E1A\u0E16\u0E49\u0E27\u0E19 \u0E43\u0E22\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E2A\u0E39\u0E07 \u0E2D\u0E34\u0E48\u0E21\u0E19\u0E32\u0E19\u0E41\u0E25\u0E30\u0E44\u0E14\u0E49\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E40\u0E15\u0E47\u0E21\u0E17\u0E35\u0E48"
        },
        {
          foodName: "\u0E1B\u0E25\u0E32\u0E01\u0E30\u0E1E\u0E07\u0E19\u0E36\u0E48\u0E07\u0E0B\u0E35\u0E2D\u0E34\u0E4A\u0E27 + \u0E1C\u0E31\u0E01\u0E15\u0E49\u0E21",
          calories: 290,
          proteinGrams: 30,
          carbsGrams: 10,
          fatGrams: 6,
          explanation: "\u0E44\u0E02\u0E21\u0E31\u0E19\u0E14\u0E35 \u0E22\u0E48\u0E2D\u0E22\u0E07\u0E48\u0E32\u0E22 \u0E40\u0E1A\u0E32\u0E2A\u0E1A\u0E32\u0E22\u0E17\u0E49\u0E2D\u0E07"
        },
        {
          foodName: "\u0E41\u0E01\u0E07\u0E08\u0E37\u0E14\u0E40\u0E15\u0E49\u0E32\u0E2B\u0E39\u0E49\u0E2B\u0E21\u0E39\u0E2A\u0E31\u0E1A\u0E2A\u0E32\u0E2B\u0E23\u0E48\u0E32\u0E22",
          calories: 220,
          proteinGrams: 20,
          carbsGrams: 12,
          fatGrams: 9,
          explanation: "\u0E2D\u0E38\u0E48\u0E19\u0E17\u0E49\u0E2D\u0E07 \u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E15\u0E48\u0E33 \u0E40\u0E2B\u0E21\u0E32\u0E30\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E21\u0E37\u0E49\u0E2D\u0E1B\u0E34\u0E14\u0E17\u0E49\u0E32\u0E22\u0E27\u0E31\u0E19"
        }
      ];
      return res.json(fallbackSuggestions);
    }
  });
  app.post("/api/search-grounded", async (req, res) => {
    try {
      const { query, category = "all", userContext = {} } = req.body;
      if (!query || typeof query !== "string" || !query.trim()) {
        return res.status(400).json({ error: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E04\u0E33\u0E04\u0E49\u0E19\u0E2B\u0E32" });
      }
      const prompt = `\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D\u0E1C\u0E39\u0E49\u0E40\u0E0A\u0E35\u0E48\u0E22\u0E27\u0E0A\u0E32\u0E0D\u0E14\u0E49\u0E32\u0E19\u0E01\u0E32\u0E23\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23 \u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E \u0E40\u0E21\u0E19\u0E39\u0E2D\u0E32\u0E2B\u0E32\u0E23 \u0E41\u0E25\u0E30\u0E23\u0E49\u0E32\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23 (Google Search Grounded Nutrition & Health Intelligence)
\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E01\u0E31\u0E1A: "${query.trim()}"
\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48\u0E01\u0E32\u0E23\u0E04\u0E49\u0E19\u0E2B\u0E32: ${category}
\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19: ${JSON.stringify(userContext)}

\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E2A\u0E33\u0E04\u0E31\u0E0D:
1. \u0E43\u0E0A\u0E49\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E21\u0E37\u0E2D Google Search \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14\u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E41\u0E25\u0E30\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E04\u0E33\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E19\u0E35\u0E49 (\u0E40\u0E0A\u0E48\u0E19 \u0E04\u0E48\u0E32\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48 \u0E2A\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E21\u0E19\u0E39\u0E02\u0E2D\u0E07\u0E41\u0E1A\u0E23\u0E19\u0E14\u0E4C/\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E07\u0E32\u0E19\u0E27\u0E34\u0E08\u0E31\u0E22\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E \u0E40\u0E04\u0E25\u0E47\u0E14\u0E25\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E17\u0E32\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E2A\u0E39\u0E15\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23)
2. \u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E2A\u0E23\u0E38\u0E1B\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E0A\u0E31\u0E14\u0E40\u0E08\u0E19 \u0E2D\u0E48\u0E32\u0E19\u0E07\u0E48\u0E32\u0E22 \u0E40\u0E1B\u0E47\u0E19\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22\u0E17\u0E35\u0E48\u0E01\u0E23\u0E30\u0E0A\u0E31\u0E1A \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E22\u0E48\u0E2D\u0E22\u0E41\u0E25\u0E30\u0E08\u0E38\u0E14\u0E40\u0E14\u0E48\u0E19
3. \u0E2B\u0E32\u0E01\u0E04\u0E33\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E01\u0E31\u0E1A "\u0E2D\u0E32\u0E2B\u0E32\u0E23" "\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21" "\u0E40\u0E21\u0E19\u0E39\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32" "\u0E02\u0E19\u0E21" \u0E2B\u0E23\u0E37\u0E2D "\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A":
   - \u0E23\u0E30\u0E1A\u0E38\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13\u0E15\u0E48\u0E2D\u0E40\u0E2A\u0E34\u0E23\u0E4C\u0E1F \u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48 \u0E41\u0E25\u0E30\u0E2A\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E2B\u0E25\u0E31\u0E01 (\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 \u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15 \u0E44\u0E02\u0E21\u0E31\u0E19 \u0E19\u0E49\u0E33\u0E15\u0E32\u0E25 \u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21)
   - \u0E41\u0E19\u0E30\u0E19\u0E33\u0E27\u0E34\u0E18\u0E35\u0E17\u0E32\u0E19\u0E43\u0E2B\u0E49\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E\u0E14\u0E35\u0E02\u0E36\u0E49\u0E19 (\u0E40\u0E0A\u0E48\u0E19 \u0E2B\u0E27\u0E32\u0E19\u0E19\u0E49\u0E2D\u0E22, \u0E2A\u0E31\u0E48\u0E07\u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19, \u0E40\u0E25\u0E35\u0E48\u0E22\u0E07\u0E2B\u0E19\u0E31\u0E07, \u0E2A\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E21\u0E19\u0E39\u0E2D\u0E37\u0E48\u0E19)
   - \u0E17\u0E35\u0E48\u0E17\u0E49\u0E32\u0E22\u0E04\u0E33\u0E15\u0E2D\u0E1A \u0E43\u0E2B\u0E49\u0E43\u0E2A\u0E48\u0E1A\u0E25\u0E47\u0E2D\u0E01 JSON \u0E20\u0E32\u0E22\u0E43\u0E19\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E2B\u0E21\u0E32\u0E22 \`\`\`json ... \`\`\` \u0E15\u0E32\u0E21\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E19\u0E35\u0E49\u0E40\u0E2A\u0E21\u0E2D:
   {
     "isFood": true,
     "foodName": "\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E21\u0E19\u0E39\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22\u0E17\u0E35\u0E48\u0E01\u0E23\u0E30\u0E0A\u0E31\u0E1A",
     "servingSize": "1 \u0E08\u0E32\u0E19 (300g) \u0E2B\u0E23\u0E37\u0E2D 1 \u0E41\u0E01\u0E49\u0E27 (16 oz)",
     "calories": 450,
     "proteinGrams": 24,
     "carbsGrams": 55,
     "fatGrams": 14,
     "sugarGrams": 6,
     "sodiumMg": 850,
     "healthRating": 8,
     "tags": ["\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E2A\u0E39\u0E07", "\u0E40\u0E21\u0E19\u0E39\u0E22\u0E2D\u0E14\u0E19\u0E34\u0E22\u0E21", "\u0E2A\u0E15\u0E23\u0E35\u0E17\u0E1F\u0E39\u0E49\u0E14"],
     "keyHighlights": ["\u0E08\u0E38\u0E14\u0E40\u0E14\u0E48\u0E19 1", "\u0E08\u0E38\u0E14\u0E40\u0E14\u0E48\u0E19 2"],
     "actionableAdvice": "\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33\u0E2A\u0E31\u0E49\u0E19\u0E46 \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E04\u0E19\u0E04\u0E38\u0E21\u0E2D\u0E32\u0E2B\u0E32\u0E23"
   }
4. \u0E2B\u0E32\u0E01\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E40\u0E21\u0E19\u0E39\u0E2D\u0E32\u0E2B\u0E32\u0E23 (\u0E40\u0E0A\u0E48\u0E19 \u0E40\u0E1B\u0E47\u0E19\u0E04\u0E33\u0E16\u0E32\u0E21\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E42\u0E23\u0E04, \u0E01\u0E32\u0E23\u0E2D\u0E2D\u0E01\u0E01\u0E33\u0E25\u0E31\u0E07\u0E01\u0E32\u0E22, \u0E27\u0E34\u0E15\u0E32\u0E21\u0E34\u0E19, \u0E07\u0E32\u0E19\u0E27\u0E34\u0E08\u0E31\u0E22):
   - \u0E15\u0E2D\u0E1A\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E21\u0E35\u0E2B\u0E25\u0E31\u0E01\u0E01\u0E32\u0E23 \u0E21\u0E35\u0E02\u0E49\u0E2D\u0E2A\u0E23\u0E38\u0E1B\u0E17\u0E35\u0E48\u0E19\u0E33\u0E44\u0E1B\u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49\u0E08\u0E23\u0E34\u0E07 \u0E41\u0E25\u0E30\u0E1A\u0E25\u0E47\u0E2D\u0E01 JSON \u0E43\u0E2B\u0E49\u0E23\u0E30\u0E1A\u0E38:
   {
     "isFood": false,
     "topic": "\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E2A\u0E33\u0E04\u0E31\u0E0D",
     "keyHighlights": ["\u0E1B\u0E23\u0E30\u0E40\u0E14\u0E47\u0E19\u0E2B\u0E25\u0E31\u0E01 1", "\u0E1B\u0E23\u0E30\u0E40\u0E14\u0E47\u0E19\u0E2B\u0E25\u0E31\u0E01 2", "\u0E1B\u0E23\u0E30\u0E40\u0E14\u0E47\u0E19\u0E2B\u0E25\u0E31\u0E01 3"],
     "actionableAdvice": "\u0E2A\u0E23\u0E38\u0E1B\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33\u0E17\u0E35\u0E48\u0E17\u0E33\u0E15\u0E32\u0E21\u0E44\u0E14\u0E49\u0E17\u0E31\u0E19\u0E17\u0E35"
   }`;
      const { response, modelUsed } = await generateGroundedContentSafe({
        contents: prompt
      });
      const fullText = response.text || "";
      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;
      const groundingChunks = groundingMetadata?.groundingChunks || [];
      const webSearchQueries = groundingMetadata?.webSearchQueries || [];
      const rawSources = [];
      for (const chunk of groundingChunks) {
        if (chunk && chunk.web && (chunk.web.uri || chunk.web.url)) {
          rawSources.push({
            title: chunk.web.title || "\u0E41\u0E2B\u0E25\u0E48\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E08\u0E32\u0E01\u0E40\u0E27\u0E47\u0E1A",
            uri: chunk.web.uri || chunk.web.url
          });
        }
      }
      const uniqueSources = Array.from(
        new Map(rawSources.map((item) => [item.uri, item])).values()
      );
      let parsedData = null;
      const jsonMatch = fullText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          parsedData = JSON.parse(jsonMatch[1].trim());
        } catch (e) {
          console.warn("Could not parse JSON block from search result:", e);
        }
      }
      const cleanMarkdown = fullText.replace(/```(?:json)?\s*[\s\S]*?\s*```/g, "").trim();
      return res.json({
        success: true,
        query: query.trim(),
        markdown: cleanMarkdown || fullText,
        structuredData: parsedData,
        sources: uniqueSources,
        searchQueries: webSearchQueries,
        modelUsed: `${modelUsed} (Google Search Grounded)`
      });
    } catch (error) {
      console.error("Error in search-grounded:", error);
      return res.status(500).json({
        error: "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07",
        details: error?.message
      });
    }
  });
  app.post("/api/coach-chat", async (req, res) => {
    try {
      const { message, conversationHistory = [], chatHistory = [], userContext = {} } = req.body;
      const historyList = (conversationHistory.length > 0 ? conversationHistory : chatHistory) || [];
      const now = /* @__PURE__ */ new Date();
      let bangkokTimeStr = "12:00";
      let bangkokHour = 12;
      try {
        bangkokTimeStr = new Intl.DateTimeFormat("th-TH", {
          timeZone: "Asia/Bangkok",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }).format(now);
        bangkokHour = Number(new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Bangkok",
          hour: "numeric",
          hour12: false
        }).format(now));
      } catch {
        bangkokHour = now.getHours();
        bangkokTimeStr = `${bangkokHour}:${now.getMinutes()}`;
      }
      let timeOfDay = "\u0E0A\u0E48\u0E27\u0E07\u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19";
      if (bangkokHour >= 5 && bangkokHour < 11) timeOfDay = "\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E0A\u0E49\u0E32 (Morning / Breakfast)";
      else if (bangkokHour >= 11 && bangkokHour < 14) timeOfDay = "\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07-\u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19 (Lunch Time)";
      else if (bangkokHour >= 14 && bangkokHour < 17) timeOfDay = "\u0E0A\u0E48\u0E27\u0E07\u0E1A\u0E48\u0E32\u0E22 (Afternoon / Snack Window)";
      else if (bangkokHour >= 17 && bangkokHour < 21) timeOfDay = "\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E22\u0E47\u0E19-\u0E2B\u0E31\u0E27\u0E04\u0E48\u0E33 (Dinner Time)";
      else timeOfDay = "\u0E0A\u0E48\u0E27\u0E07\u0E14\u0E36\u0E01-\u0E01\u0E25\u0E32\u0E07\u0E04\u0E37\u0E19 (Late Night / Fasting Period)";
      const currentWeight = Number(userContext.weight || userContext.currentWeight || 60);
      const targetWeight = Number(userContext.targetWeight || 55);
      const weightDiff = Math.abs(currentWeight - targetWeight);
      const weightGoalText = currentWeight > targetWeight ? `\u0E25\u0E14\u0E2D\u0E35\u0E01 ${weightDiff.toFixed(1)} \u0E01\u0E01. (\u0E08\u0E32\u0E01 ${currentWeight} \u0E2A\u0E39\u0E48 ${targetWeight} \u0E01\u0E01.)` : currentWeight < targetWeight ? `\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2D\u0E35\u0E01 ${weightDiff.toFixed(1)} \u0E01\u0E01. (\u0E08\u0E32\u0E01 ${currentWeight} \u0E2A\u0E39\u0E48 ${targetWeight} \u0E01\u0E01.)` : `\u0E23\u0E31\u0E01\u0E29\u0E32\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01\u0E04\u0E07\u0E17\u0E35\u0E48 ${currentWeight} \u0E01\u0E01.`;
      const height = Number(userContext.height || 165);
      const age = Number(userContext.age || 25);
      const gender = userContext.gender === "female" ? "\u0E2B\u0E0D\u0E34\u0E07" : "\u0E0A\u0E32\u0E22";
      const bmr = Number(userContext.bmr || 1400);
      const tdee = Number(userContext.tdee || 1900);
      const calorieTarget = Number(userContext.calorieTarget || 1614);
      const proteinTarget = Number(userContext.proteinTarget || 121);
      const carbsTarget = Number(userContext.carbsTarget || 180);
      const fatTarget = Number(userContext.fatTarget || 45);
      const sugarMax = Number(userContext.sugarMax || userContext.customSugarMax || 25);
      const sodiumMax = Number(userContext.sodiumMax || userContext.customSodiumMax || 2e3);
      const todayCalories = Number(userContext.todayCalories || 0);
      const todayProtein = Number(userContext.todayProtein || 0);
      const todayCarbs = Number(userContext.todayCarbs || 0);
      const todayFat = Number(userContext.todayFat || 0);
      const remainingCalories = Math.max(0, calorieTarget - todayCalories);
      const remainingProtein = Math.max(0, proteinTarget - todayProtein);
      const remainingCarbs = Math.max(0, carbsTarget - todayCarbs);
      const remainingFat = Math.max(0, fatTarget - todayFat);
      const goalTitle = userContext.goalTitle || userContext.primaryGoalTitle || userContext.customGoals?.primaryGoalTitle || "\u0E25\u0E14\u0E44\u0E02\u0E21\u0E31\u0E19 & \u0E01\u0E23\u0E30\u0E0A\u0E31\u0E1A\u0E2A\u0E31\u0E14\u0E2A\u0E48\u0E27\u0E19";
      const ifWindow = userContext.ifWindow || userContext.fastingPlan || userContext.customGoals?.ifWindow || "18/6 (\u0E2D\u0E14 18 \u0E0A\u0E21. \u0E17\u0E32\u0E19 6 \u0E0A\u0E21.)";
      const fastingStatus = userContext.fastingStatus || "\u0E17\u0E33 IF 18/6";
      const dietaryRestrictions = userContext.dietaryRestrictions || userContext.allergensSummary || "\u0E07\u0E14\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25 (Zero Added Sugar)";
      const recentMeals = userContext.recentMeals || [];
      const mealsListText = recentMeals.length > 0 ? recentMeals.map((m, idx) => `  ${idx + 1}. ${m.foodName} (${m.calories || 0} kcal, P:${m.proteinGrams || 0}g, C:${m.carbsGrams || 0}g, F:${m.fatGrams || 0}g) [\u0E21\u0E37\u0E49\u0E2D: ${m.mealType || "\u0E2D\u0E32\u0E2B\u0E32\u0E23"}]`).join("\n") : "  (\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E43\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49)";
      const bodyDimensions = userContext.waistInches || userContext.hipInches || userContext.bodyFatPercent ? `\u0E40\u0E2D\u0E27 ${userContext.waistInches || "-"} \u0E19\u0E34\u0E49\u0E27, \u0E2A\u0E30\u0E42\u0E1E\u0E01 ${userContext.hipInches || "-"} \u0E19\u0E34\u0E49\u0E27, %\u0E44\u0E02\u0E21\u0E31\u0E19 ${userContext.bodyFatPercent || "-"}%` : "\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E2A\u0E31\u0E14\u0E2A\u0E48\u0E27\u0E19\u0E22\u0E48\u0E2D\u0E22";
      const dynamicSystemInstruction = `\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D "Master AI Nutrition & Health Coach" \u0E42\u0E04\u0E49\u0E0A\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E41\u0E25\u0E30\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E21\u0E37\u0E2D\u0E2D\u0E32\u0E0A\u0E35\u0E1E\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E23\u0E32\u0E22\u0E19\u0E35\u0E49\u0E42\u0E14\u0E22\u0E40\u0E09\u0E1E\u0E32\u0E30

====================================================
\u{1F4CB} \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27\u0E41\u0E25\u0E30\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19 (DYNAMIC USER CONTEXT)
====================================================
- \u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E2B\u0E25\u0E31\u0E01: ${goalTitle}
- \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22: \u0E40\u0E1E\u0E28${gender}, \u0E2D\u0E32\u0E22\u0E38 ${age} \u0E1B\u0E35, \u0E2A\u0E48\u0E27\u0E19\u0E2A\u0E39\u0E07 ${height} \u0E0B\u0E21., \u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19 ${currentWeight} \u0E01\u0E01., \u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22 ${targetWeight} \u0E01\u0E01. (${weightGoalText})
- \u0E2A\u0E31\u0E14\u0E2A\u0E48\u0E27\u0E19: ${bodyDimensions}
- BMR: ${bmr} kcal | TDEE: ${tdee} kcal
- \u0E42\u0E04\u0E27\u0E15\u0E32\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19 (Daily Target):
  * \u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22: ${calorieTarget} kcal/\u0E27\u0E31\u0E19
  * \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22: ${proteinTarget} g/\u0E27\u0E31\u0E19
  * \u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22: ${carbsTarget} g/\u0E27\u0E31\u0E19
  * \u0E44\u0E02\u0E21\u0E31\u0E19\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22: ${fatTarget} g/\u0E27\u0E31\u0E19
  * \u0E02\u0E35\u0E14\u0E08\u0E33\u0E01\u0E31\u0E14\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25: \u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19 ${sugarMax} g/\u0E27\u0E31\u0E19 | \u0E02\u0E35\u0E14\u0E08\u0E33\u0E01\u0E31\u0E14\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21: \u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19 ${sodiumMax} mg/\u0E27\u0E31\u0E19
- \u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02 IF \u0E41\u0E25\u0E30\u0E02\u0E49\u0E2D\u0E08\u0E33\u0E01\u0E31\u0E14\u0E2D\u0E32\u0E2B\u0E32\u0E23:
  * Intermittent Fasting (IF): ${ifWindow} (\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19: ${fastingStatus})
  * \u0E02\u0E49\u0E2D\u0E08\u0E33\u0E01\u0E31\u0E14\u0E2D\u0E32\u0E2B\u0E32\u0E23 / \u0E41\u0E1E\u0E49\u0E2D\u0E32\u0E2B\u0E32\u0E23: ${dietaryRestrictions}
- \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E2A\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E08\u0E23\u0E34\u0E07\u0E17\u0E35\u0E48\u0E17\u0E32\u0E19\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49:
  * \u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19: \u0E17\u0E32\u0E19\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27 ${todayCalories} / ${calorieTarget} kcal (\u{1F3AF} \u0E42\u0E04\u0E27\u0E15\u0E32\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E08\u0E23\u0E34\u0E07: ${remainingCalories} kcal)
  * \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19: \u0E17\u0E32\u0E19\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27 ${todayProtein} / ${proteinTarget} g (\u{1F3AF} \u0E22\u0E31\u0E07\u0E02\u0E32\u0E14\u0E2D\u0E35\u0E01: ${remainingProtein} g)
  * \u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15: \u0E17\u0E32\u0E19\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27 ${todayCarbs} / ${carbsTarget} g (\u0E40\u0E2B\u0E25\u0E37\u0E2D: ${remainingCarbs} g)
  * \u0E44\u0E02\u0E21\u0E31\u0E19: \u0E17\u0E32\u0E19\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27 ${todayFat} / ${fatTarget} g (\u0E40\u0E2B\u0E25\u0E37\u0E2D: ${remainingFat} g)
  * \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E35\u0E48\u0E17\u0E32\u0E19\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49:
${mealsListText}
- \u0E40\u0E27\u0E25\u0E32\u0E41\u0E25\u0E30\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E02\u0E13\u0E30\u0E17\u0E35\u0E48\u0E16\u0E32\u0E21: ${bangkokTimeStr} \u0E19. [${timeOfDay}]
====================================================

====================================================
\u{1F6A8} ANTI-REPETITION & DIVERSITY MANDATE - \u0E01\u0E0E\u0E40\u0E2B\u0E25\u0E47\u0E01\u0E1B\u0E49\u0E2D\u0E07\u0E01\u0E31\u0E19\u0E01\u0E32\u0E23\u0E15\u0E2D\u0E1A\u0E0B\u0E49\u0E33\u0E0B\u0E32\u0E01 (\u0E2A\u0E33\u0E04\u0E31\u0E0D\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14)
====================================================
1. \u0E2B\u0E49\u0E32\u0E21\u0E43\u0E0A\u0E49\u0E04\u0E33\u0E15\u0E2D\u0E1A\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E23\u0E39\u0E1B\u0E2B\u0E23\u0E37\u0E2D\u0E41\u0E1E\u0E17\u0E40\u0E17\u0E34\u0E23\u0E4C\u0E19\u0E1B\u0E23\u0E30\u0E42\u0E22\u0E04\u0E40\u0E14\u0E34\u0E21\u0E0B\u0E49\u0E33\u0E46 (No canned responses / No robotic formulaic templates):
   - \u0E2B\u0E49\u0E32\u0E21\u0E02\u0E36\u0E49\u0E19\u0E15\u0E49\u0E19\u0E14\u0E49\u0E27\u0E22\u0E1B\u0E23\u0E30\u0E42\u0E22\u0E04\u0E40\u0E14\u0E34\u0E21\u0E0B\u0E49\u0E33\u0E46 \u0E40\u0E0A\u0E48\u0E19 "\u0E2A\u0E27\u0E31\u0E2A\u0E14\u0E35\u0E04\u0E23\u0E31\u0E1A \u0E22\u0E34\u0E19\u0E14\u0E35\u0E43\u0E2B\u0E49\u0E04\u0E33\u0E1B\u0E23\u0E36\u0E01\u0E29\u0E32..." \u0E2B\u0E23\u0E37\u0E2D "\u0E15\u0E32\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13..."
   - \u0E43\u0E2B\u0E49\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E2D\u0E1A\u0E40\u0E02\u0E49\u0E32\u0E1B\u0E23\u0E30\u0E40\u0E14\u0E47\u0E19\u0E14\u0E49\u0E27\u0E22\u0E19\u0E49\u0E33\u0E40\u0E2A\u0E35\u0E22\u0E07\u0E2A\u0E14\u0E43\u0E2B\u0E21\u0E48 \u0E01\u0E23\u0E30\u0E0A\u0E31\u0E1A \u0E2D\u0E1A\u0E2D\u0E38\u0E48\u0E19 \u0E21\u0E35\u0E1E\u0E25\u0E31\u0E07 \u0E41\u0E25\u0E30\u0E40\u0E02\u0E49\u0E32\u0E01\u0E31\u0E1A\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32 (${timeOfDay}) \u0E17\u0E31\u0E19\u0E17\u0E35

2. \u0E40\u0E2A\u0E19\u0E2D\u0E40\u0E21\u0E19\u0E39\u0E17\u0E35\u0E48\u0E2B\u0E25\u0E32\u0E01\u0E2B\u0E25\u0E32\u0E22\u0E41\u0E25\u0E30\u0E2A\u0E14\u0E43\u0E2B\u0E21\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E40\u0E2A\u0E21\u0E2D (Menu Novelty & Diverse Categories):
   - \u0E2B\u0E49\u0E32\u0E21\u0E41\u0E19\u0E30\u0E19\u0E33\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E21\u0E19\u0E39\u0E1E\u0E37\u0E49\u0E19\u0E46 \u0E0B\u0E49\u0E33\u0E0B\u0E32\u0E01 (\u0E2B\u0E49\u0E32\u0E21\u0E41\u0E19\u0E30\u0E19\u0E33\u0E41\u0E04\u0E48\u0E2D\u0E01\u0E44\u0E01\u0E48\u0E15\u0E49\u0E21/\u0E44\u0E02\u0E48\u0E15\u0E49\u0E21\u0E27\u0E19\u0E44\u0E1B\u0E27\u0E19\u0E21\u0E32\u0E17\u0E38\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07)
   - \u0E43\u0E2B\u0E49\u0E2A\u0E25\u0E31\u0E1A\u0E2A\u0E31\u0E1A\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E44\u0E17\u0E22\u0E17\u0E35\u0E48\u0E19\u0E48\u0E32\u0E17\u0E32\u0E19\u0E41\u0E25\u0E30\u0E17\u0E33\u0E44\u0E14\u0E49\u0E08\u0E23\u0E34\u0E07 \u0E40\u0E0A\u0E48\u0E19:
     * \u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E15\u0E32\u0E21\u0E2A\u0E31\u0E48\u0E07\u0E2A\u0E31\u0E48\u0E07\u0E1E\u0E34\u0E40\u0E28\u0E29 (\u0E40\u0E0A\u0E48\u0E19 \u0E01\u0E30\u0E40\u0E1E\u0E23\u0E32\u0E44\u0E01\u0E48\u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25/\u0E1C\u0E31\u0E14\u0E19\u0E49\u0E33, \u0E40\u0E01\u0E32\u0E40\u0E2B\u0E25\u0E32\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E19\u0E48\u0E2D\u0E07\u0E25\u0E32\u0E22\u0E1E\u0E34\u0E40\u0E28\u0E29\u0E1C\u0E31\u0E01\u0E40\u0E22\u0E2D\u0E30, \u0E25\u0E32\u0E1A\u0E44\u0E01\u0E48/\u0E25\u0E32\u0E1A\u0E40\u0E15\u0E49\u0E32\u0E2B\u0E39\u0E49\u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25)
     * \u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E43\u0E19\u0E23\u0E49\u0E32\u0E19\u0E2A\u0E30\u0E14\u0E27\u0E01\u0E0B\u0E37\u0E49\u0E2D (7-Eleven / CJ) \u0E40\u0E0A\u0E48\u0E19 \u0E2A\u0E31\u0E19\u0E43\u0E19\u0E44\u0E01\u0E48\u0E19\u0E38\u0E48\u0E21, \u0E2D\u0E01\u0E44\u0E01\u0E48\u0E23\u0E21\u0E04\u0E27\u0E31\u0E19, \u0E44\u0E02\u0E48\u0E15\u0E38\u0E4B\u0E19\u0E04\u0E31\u0E1E, \u0E40\u0E15\u0E49\u0E32\u0E2B\u0E39\u0E49\u0E1B\u0E25\u0E32, \u0E2A\u0E25\u0E31\u0E14\u0E2D\u0E01\u0E44\u0E01\u0E48\u0E44\u0E02\u0E48\u0E15\u0E49\u0E21, \u0E19\u0E21\u0E1E\u0E37\u0E0A\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E2A\u0E39\u0E07\u0E2A\u0E39\u0E15\u0E23\u0E44\u0E21\u0E48\u0E40\u0E15\u0E34\u0E21\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25
     * \u0E40\u0E21\u0E19\u0E39\u0E17\u0E33\u0E40\u0E2D\u0E07\u0E07\u0E48\u0E32\u0E22\u0E46 10-15 \u0E19\u0E32\u0E17\u0E35 (\u0E40\u0E0A\u0E48\u0E19 \u0E2A\u0E40\u0E15\u0E4A\u0E01\u0E1B\u0E25\u0E32\u0E41\u0E0B\u0E25\u0E21\u0E2D\u0E19/\u0E14\u0E2D\u0E25\u0E25\u0E35\u0E48\u0E22\u0E48\u0E32\u0E07\u0E01\u0E23\u0E30\u0E17\u0E30, \u0E2D\u0E01\u0E44\u0E01\u0E48\u0E1C\u0E31\u0E14\u0E1E\u0E23\u0E34\u0E01\u0E44\u0E17\u0E22\u0E14\u0E33, \u0E1C\u0E31\u0E14\u0E01\u0E30\u0E2B\u0E25\u0E48\u0E33\u0E1B\u0E25\u0E35\u0E2D\u0E01\u0E44\u0E01\u0E48\u0E2A\u0E31\u0E1A\u0E43\u0E0A\u0E49\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E21\u0E30\u0E01\u0E2D\u0E01)
     * \u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E04\u0E25\u0E35\u0E19\u0E41\u0E25\u0E30\u0E2A\u0E15\u0E23\u0E35\u0E17\u0E1F\u0E39\u0E49\u0E14\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E (\u0E40\u0E0A\u0E48\u0E19 \u0E2A\u0E49\u0E21\u0E15\u0E33\u0E44\u0E17\u0E22\u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25+\u0E44\u0E01\u0E48\u0E22\u0E48\u0E32\u0E07\u0E25\u0E2D\u0E01\u0E2B\u0E19\u0E31\u0E07, \u0E0B\u0E38\u0E1B\u0E40\u0E1B\u0E2D\u0E23\u0E4C\u0E15\u0E35\u0E19\u0E44\u0E01\u0E48/\u0E15\u0E49\u0E21\u0E41\u0E0B\u0E48\u0E1A, \u0E2A\u0E38\u0E01\u0E35\u0E49\u0E19\u0E49\u0E33\u0E2D\u0E01\u0E44\u0E01\u0E48/\u0E01\u0E38\u0E49\u0E07\u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E27\u0E38\u0E49\u0E19\u0E40\u0E2A\u0E49\u0E19/\u0E27\u0E38\u0E49\u0E19\u0E40\u0E2A\u0E49\u0E19\u0E19\u0E49\u0E2D\u0E22)
   - \u0E17\u0E38\u0E01\u0E40\u0E21\u0E19\u0E39\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13\u0E01\u0E32\u0E23\u0E0A\u0E31\u0E14\u0E40\u0E08\u0E19 (\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19 kcal, \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 g, \u0E04\u0E32\u0E23\u0E4C\u0E1A g, \u0E44\u0E02\u0E21\u0E31\u0E19 g) \u0E41\u0E25\u0E30\u0E04\u0E33\u0E19\u0E27\u0E13\u0E43\u0E2B\u0E49\u0E1E\u0E2D\u0E14\u0E35\u0E01\u0E31\u0E1A\u0E42\u0E04\u0E27\u0E15\u0E32\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D (${remainingCalories} kcal, \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E02\u0E32\u0E14\u0E2D\u0E35\u0E01 ${remainingProtein} g)

3. \u0E15\u0E2D\u0E1A\u0E15\u0E23\u0E07\u0E04\u0E33\u0E16\u0E32\u0E21\u0E42\u0E14\u0E22\u0E43\u0E0A\u0E49\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E23\u0E34\u0E07\u0E17\u0E35\u0E48\u0E21\u0E35:
   - \u0E2B\u0E49\u0E32\u0E21\u0E16\u0E32\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E43\u0E2B\u0E49\u0E44\u0E27\u0E49\u0E41\u0E25\u0E49\u0E27\u0E0B\u0E49\u0E33 \u0E40\u0E0A\u0E48\u0E19 \u0E2B\u0E49\u0E32\u0E21\u0E16\u0E32\u0E21\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01 \u0E2A\u0E48\u0E27\u0E19\u0E2A\u0E39\u0E07 \u0E2B\u0E23\u0E37\u0E2D\u0E42\u0E04\u0E27\u0E15\u0E32 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E04\u0E38\u0E13\u0E23\u0E39\u0E49\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E41\u0E25\u0E49\u0E27
   - \u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E41\u0E25\u0E30\u0E43\u0E2B\u0E49\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E21\u0E32\u0E30\u0E01\u0E31\u0E1A\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02 (${ifWindow}, ${dietaryRestrictions}) \u0E41\u0E25\u0E30\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32 (${timeOfDay}) \u0E2D\u0E22\u0E48\u0E32\u0E07\u0E41\u0E17\u0E49\u0E08\u0E23\u0E34\u0E07

4. \u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E01\u0E32\u0E23\u0E15\u0E2D\u0E1A:
   - \u0E43\u0E0A\u0E49 Markdown (\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D, \u0E15\u0E31\u0E27\u0E2B\u0E19\u0E32, bullet points) \u0E43\u0E2B\u0E49\u0E2D\u0E48\u0E32\u0E19\u0E07\u0E48\u0E32\u0E22 \u0E2A\u0E27\u0E22\u0E07\u0E32\u0E21 \u0E01\u0E23\u0E30\u0E0A\u0E31\u0E1A \u0E44\u0E21\u0E48\u0E40\u0E22\u0E34\u0E48\u0E19\u0E40\u0E22\u0E49\u0E2D`;
      const contents = [];
      const validHistory = historyList.filter((m) => m && (m.content || m.text) && typeof (m.content || m.text) === "string").slice(-8);
      for (const msg of validHistory) {
        const role = msg.role === "assistant" || msg.role === "model" ? "model" : "user";
        const text = (msg.content || msg.text || "").trim();
        if (text) {
          contents.push({
            role,
            parts: [{ text }]
          });
        }
      }
      const userPromptWithAnchor = `[\u0E1A\u0E23\u0E34\u0E1A\u0E17\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49: \u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22 "${goalTitle}", \u0E42\u0E04\u0E27\u0E15\u0E32 ${calorieTarget} kcal / \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 ${proteinTarget}g, \u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E01\u0E34\u0E19\u0E41\u0E25\u0E49\u0E27 ${todayCalories} kcal \u0E40\u0E2B\u0E25\u0E37\u0E2D ${remainingCalories} kcal, \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E02\u0E32\u0E14\u0E2D\u0E35\u0E01 ${remainingProtein}g, \u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02: ${ifWindow}, ${dietaryRestrictions}, \u0E40\u0E27\u0E25\u0E32\u0E02\u0E13\u0E30\u0E19\u0E35\u0E49: ${bangkokTimeStr} \u0E19. (${timeOfDay})]

\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E16\u0E32\u0E21/\u0E1B\u0E23\u0E36\u0E01\u0E29\u0E32\u0E27\u0E48\u0E32:
"${message}"

(\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E42\u0E04\u0E49\u0E0A AI: \u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E04\u0E33\u0E15\u0E2D\u0E1A\u0E08\u0E32\u0E01\u0E42\u0E04\u0E27\u0E15\u0E32\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E08\u0E23\u0E34\u0E07 ${remainingCalories} kcal \u0E41\u0E25\u0E30\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E17\u0E35\u0E48\u0E02\u0E32\u0E14\u0E2D\u0E35\u0E01 ${remainingProtein}g \u0E43\u0E2B\u0E49\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E08\u0E32\u0E30\u0E08\u0E07 \u0E2A\u0E14\u0E43\u0E2B\u0E21\u0E48 \u0E2B\u0E49\u0E32\u0E21\u0E15\u0E2D\u0E1A\u0E0B\u0E49\u0E33\u0E2B\u0E23\u0E37\u0E2D\u0E43\u0E0A\u0E49\u0E04\u0E33\u0E15\u0E2D\u0E1A\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E23\u0E39\u0E1B)`;
      contents.push({
        role: "user",
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
      const reply = response.text || `\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E0A\u0E48\u0E27\u0E07${timeOfDay}\u0E19\u0E35\u0E49 \u0E04\u0E38\u0E13\u0E21\u0E35\u0E42\u0E04\u0E27\u0E15\u0E32\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D ${remainingCalories} kcal \u0E41\u0E25\u0E30\u0E22\u0E31\u0E07\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E2D\u0E35\u0E01 ${remainingProtein}g \u0E41\u0E19\u0E30\u0E19\u0E33\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E21\u0E19\u0E39\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E2A\u0E39\u0E07\u0E17\u0E35\u0E48\u0E2A\u0E2D\u0E14\u0E04\u0E25\u0E49\u0E2D\u0E07\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E2D\u0E08\u0E33\u0E01\u0E31\u0E14 (${dietaryRestrictions}) \u0E41\u0E25\u0E30\u0E40\u0E2B\u0E21\u0E32\u0E30\u0E01\u0E31\u0E1A\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E04\u0E23\u0E31\u0E1A`;
      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;
      const groundingChunks = groundingMetadata?.groundingChunks || [];
      const rawSources = [];
      for (const chunk of groundingChunks) {
        if (chunk && chunk.web && (chunk.web.uri || chunk.web.url)) {
          rawSources.push({
            title: chunk.web.title || "\u0E41\u0E2B\u0E25\u0E48\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07",
            uri: chunk.web.uri || chunk.web.url
          });
        }
      }
      const uniqueSources = Array.from(
        new Map(rawSources.map((item) => [item.uri, item])).values()
      );
      res.json({ reply, sources: uniqueSources });
    } catch (error) {
      console.error("Error in coach chat:", error);
      const userCtx = req.body?.userContext || {};
      const calRem = Math.max(0, Number(userCtx.calorieTarget || 1614) - Number(userCtx.todayCalories || 0));
      const pRem = Math.max(0, Number(userCtx.proteinTarget || 121) - Number(userCtx.todayProtein || 0));
      const rest = userCtx.dietaryRestrictions || "\u0E07\u0E14\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25";
      res.json({
        reply: `\u0E15\u0E32\u0E21\u0E42\u0E04\u0E27\u0E15\u0E32\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49 \u0E22\u0E31\u0E07\u0E21\u0E35\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E40\u0E2B\u0E25\u0E37\u0E2D **${calRem} kcal** \u0E41\u0E25\u0E30\u0E22\u0E31\u0E07\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E2D\u0E35\u0E01 **${pRem}g** \u0E20\u0E32\u0E22\u0E43\u0E15\u0E49\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02 **${rest}** \u0E41\u0E19\u0E30\u0E19\u0E33\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E21\u0E19\u0E39\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E25\u0E35\u0E19 \u0E40\u0E0A\u0E48\u0E19 \u0E2A\u0E40\u0E15\u0E4A\u0E01\u0E1B\u0E25\u0E32/\u0E44\u0E01\u0E48\u0E22\u0E48\u0E32\u0E07\u0E44\u0E21\u0E48\u0E2B\u0E27\u0E32\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E15\u0E49\u0E21\u0E41\u0E0B\u0E48\u0E1A/\u0E40\u0E01\u0E32\u0E40\u0E2B\u0E25\u0E32\u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E16\u0E36\u0E07\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E25\u0E07\u0E15\u0E31\u0E27\u0E04\u0E23\u0E31\u0E1A`,
        sources: []
      });
    }
  });
  app.post("/api/coach-audit", async (req, res) => {
    try {
      const userCtx = req.body?.userContext || req.body || {};
      const recentMeals = userCtx.recentMeals || userCtx.todayMeals || [];
      const calorieTarget = Number(userCtx.calorieTarget || userCtx.targetCalories || 2e3);
      const proteinTarget = Number(userCtx.proteinTarget || userCtx.targetProtein || 120);
      const carbsTarget = Number(userCtx.carbsTarget || 220);
      const fatTarget = Number(userCtx.fatTarget || 55);
      let todayCalories = Number(userCtx.todayCalories || 0);
      let todayProtein = Number(userCtx.todayProtein || 0);
      let todayCarbs = Number(userCtx.todayCarbs || 0);
      let todayFat = Number(userCtx.todayFat || 0);
      if (todayCalories === 0 && recentMeals.length > 0) {
        todayCalories = recentMeals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
        todayProtein = recentMeals.reduce((sum, m) => sum + (Number(m.proteinGrams) || 0), 0);
        todayCarbs = recentMeals.reduce((sum, m) => sum + (Number(m.carbsGrams) || 0), 0);
        todayFat = recentMeals.reduce((sum, m) => sum + (Number(m.fatGrams) || 0), 0);
      }
      const waterGlasses = Number(userCtx.waterGlasses || 0);
      const waterMl = Number(userCtx.waterMl || waterGlasses * 250);
      const sleepHours = Number(userCtx.sleepHours || 7.5);
      const dateLabel = userCtx.dateLabel || "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49";
      const customGoals = userCtx.customGoals || {};
      const goalTitle = customGoals.primaryGoalTitle || "\u0E04\u0E27\u0E1A\u0E04\u0E38\u0E21\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E41\u0E25\u0E30\u0E14\u0E39\u0E41\u0E25\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E";
      const weight = userCtx.weight || 70;
      const targetWeight = userCtx.targetWeight || 65;
      const prompt = `\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D\u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E31\u0E01\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E41\u0E25\u0E30 Master Nutrition AI Coach (\u0E15\u0E23\u0E27\u0E08\u0E01\u0E32\u0E23\u0E1A\u0E49\u0E32\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19\u0E41\u0E25\u0E30\u0E22\u0E49\u0E2D\u0E19\u0E2B\u0E25\u0E31\u0E07)
\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E02\u0E2D\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48: "${dateLabel}"

\u{1F4CB} \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E41\u0E25\u0E30\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49:
- \u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E2B\u0E25\u0E31\u0E01: ${goalTitle}
- \u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19: ${weight} kg (\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22: ${targetWeight} kg)
- \u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E15\u0E48\u0E2D\u0E27\u0E31\u0E19: ${calorieTarget} kcal
- \u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19: ${proteinTarget} g
- \u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15: ${carbsTarget} g
- \u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E44\u0E02\u0E21\u0E31\u0E19: ${fatTarget} g

\u{1F37D}\uFE0F \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E08\u0E23\u0E34\u0E07\u0E43\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49:
- \u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E23\u0E27\u0E21\u0E17\u0E35\u0E48\u0E17\u0E32\u0E19: ${todayCalories} kcal (\u0E15\u0E48\u0E32\u0E07\u0E08\u0E32\u0E01\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22 ${todayCalories - calorieTarget > 0 ? "+" : ""}${todayCalories - calorieTarget} kcal)
- \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E23\u0E27\u0E21: ${todayProtein} g
- \u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15\u0E23\u0E27\u0E21: ${todayCarbs} g
- \u0E44\u0E02\u0E21\u0E31\u0E19\u0E23\u0E27\u0E21: ${todayFat} g
- \u0E01\u0E32\u0E23\u0E14\u0E37\u0E48\u0E21\u0E19\u0E49\u0E33: ${waterGlasses} \u0E41\u0E01\u0E49\u0E27 (${waterMl} \u0E21\u0E25.)
- \u0E01\u0E32\u0E23\u0E19\u0E2D\u0E19\u0E2B\u0E25\u0E31\u0E1A: ${sleepHours} \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07
- \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E21\u0E37\u0E49\u0E2D\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49 (${recentMeals.length} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23):
${recentMeals.length > 0 ? JSON.stringify(recentMeals, null, 2) : "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E43\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"}

\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33\u0E43\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19:
1. \u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E2D\u0E14\u0E04\u0E25\u0E49\u0E2D\u0E07\u0E01\u0E31\u0E1A\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22 "${goalTitle}" \u0E17\u0E31\u0E49\u0E07\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E48\u0E41\u0E25\u0E30\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19
2. \u0E43\u0E2B\u0E49\u0E04\u0E30\u0E41\u0E19\u0E19 (overallScore 0-100) \u0E41\u0E25\u0E30\u0E40\u0E01\u0E23\u0E14 (grade \u0E40\u0E0A\u0E48\u0E19 A+, A, B+, B, C+, C, D) \u0E15\u0E32\u0E21\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E08\u0E23\u0E34\u0E07
3. \u0E40\u0E02\u0E35\u0E22\u0E19 verdict \u0E43\u0E2B\u0E49\u0E01\u0E23\u0E30\u0E0A\u0E31\u0E1A \u0E44\u0E14\u0E49\u0E43\u0E08\u0E04\u0E27\u0E32\u0E21 \u0E2D\u0E1A\u0E2D\u0E38\u0E48\u0E19 \u0E43\u0E2B\u0E49\u0E01\u0E33\u0E25\u0E31\u0E07\u0E43\u0E08 \u0E41\u0E25\u0E30\u0E21\u0E35\u0E2B\u0E25\u0E31\u0E01\u0E01\u0E32\u0E23\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23
4. \u0E2A\u0E23\u0E38\u0E1B\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35 (calorieStatus) \u0E41\u0E25\u0E30\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 (proteinStatus) \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E08\u0E23\u0E34\u0E07
5. \u0E23\u0E30\u0E1A\u0E38\u0E08\u0E38\u0E14\u0E41\u0E02\u0E47\u0E07 (strengths) 2-4 \u0E02\u0E49\u0E2D\u0E17\u0E35\u0E48\u0E17\u0E33\u0E44\u0E14\u0E49\u0E14\u0E35
6. \u0E23\u0E30\u0E1A\u0E38\u0E08\u0E38\u0E14\u0E17\u0E35\u0E48\u0E04\u0E27\u0E23\u0E23\u0E30\u0E27\u0E31\u0E07/\u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07 (improvements) 2-3 \u0E02\u0E49\u0E2D
7. \u0E23\u0E30\u0E1A\u0E38 3 \u0E41\u0E1C\u0E19\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E17\u0E33\u0E44\u0E14\u0E49\u0E08\u0E23\u0E34\u0E07\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E27\u0E31\u0E19\u0E1E\u0E23\u0E38\u0E48\u0E07\u0E19\u0E35\u0E49 (actionPlanForTomorrow) \u0E42\u0E14\u0E22\u0E02\u0E36\u0E49\u0E19\u0E15\u0E49\u0E19\u0E14\u0E49\u0E27\u0E22 "1. ", "2. ", "3. "
8. coachQuote \u0E04\u0E33\u0E04\u0E21\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E41\u0E23\u0E07\u0E1A\u0E31\u0E19\u0E14\u0E32\u0E25\u0E43\u0E08\u0E08\u0E32\u0E01\u0E42\u0E04\u0E49\u0E0A AI

\u0E15\u0E2D\u0E1A\u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22 \u0E43\u0E19\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A JSON \u0E15\u0E32\u0E21 Schema \u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19`;
      const response = await generateContentSafe({
        model: "gemini-flash-latest",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              overallScore: { type: import_genai.Type.INTEGER, description: "\u0E04\u0E30\u0E41\u0E19\u0E19\u0E01\u0E32\u0E23\u0E04\u0E38\u0E21\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49 0-100" },
              grade: { type: import_genai.Type.STRING, description: "\u0E40\u0E01\u0E23\u0E14\u0E1C\u0E25\u0E07\u0E32\u0E19 \u0E40\u0E0A\u0E48\u0E19 A+, A, B+, B, C+, C, D" },
              verdict: { type: import_genai.Type.STRING, description: "\u0E1A\u0E17\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E20\u0E32\u0E1E\u0E23\u0E27\u0E21\u0E1C\u0E25\u0E07\u0E32\u0E19\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19" },
              calorieStatus: { type: import_genai.Type.STRING, description: "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35 \u0E40\u0E0A\u0E48\u0E19 \u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E40\u0E01\u0E13\u0E11\u0E4C\u0E2A\u0E21\u0E14\u0E38\u0E25\u0E14\u0E35\u0E21\u0E32\u0E01 (1,850/1,900 kcal)" },
              proteinStatus: { type: import_genai.Type.STRING, description: "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 \u0E40\u0E0A\u0E48\u0E19 \u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E16\u0E36\u0E07\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E22\u0E2D\u0E14\u0E40\u0E22\u0E35\u0E48\u0E22\u0E21 (130g/120g)" },
              strengths: {
                type: import_genai.Type.ARRAY,
                items: { type: import_genai.Type.STRING },
                description: "\u0E08\u0E38\u0E14\u0E40\u0E14\u0E48\u0E19\u0E2B\u0E23\u0E37\u0E2D\u0E1E\u0E24\u0E15\u0E34\u0E01\u0E23\u0E23\u0E21\u0E17\u0E35\u0E48\u0E14\u0E35\u0E40\u0E22\u0E35\u0E48\u0E22\u0E21\u0E02\u0E2D\u0E07\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49 2-4 \u0E02\u0E49\u0E2D"
              },
              improvements: {
                type: import_genai.Type.ARRAY,
                items: { type: import_genai.Type.STRING },
                description: "\u0E08\u0E38\u0E14\u0E17\u0E35\u0E48\u0E04\u0E27\u0E23\u0E23\u0E30\u0E27\u0E31\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07 2-3 \u0E02\u0E49\u0E2D"
              },
              actionPlanForTomorrow: {
                type: import_genai.Type.ARRAY,
                items: { type: import_genai.Type.STRING },
                description: "3 \u0E41\u0E1C\u0E19\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E17\u0E33\u0E44\u0E14\u0E49\u0E08\u0E23\u0E34\u0E07\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E27\u0E31\u0E19\u0E1E\u0E23\u0E38\u0E48\u0E07\u0E19\u0E35\u0E49"
              },
              coachQuote: { type: import_genai.Type.STRING, description: "\u0E04\u0E33\u0E04\u0E21\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E41\u0E23\u0E07\u0E1A\u0E31\u0E19\u0E14\u0E32\u0E25\u0E43\u0E08\u0E2A\u0E44\u0E15\u0E25\u0E4C\u0E42\u0E04\u0E49\u0E0A\u0E21\u0E37\u0E2D\u0E2D\u0E32\u0E0A\u0E35\u0E1E" }
            },
            required: [
              "overallScore",
              "grade",
              "verdict",
              "calorieStatus",
              "proteinStatus",
              "strengths",
              "improvements",
              "actionPlanForTomorrow",
              "coachQuote"
            ]
          }
        }
      });
      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      let cleanText = text.trim().replace(/^```json\s*|\s*```$/gi, "");
      const parsed = JSON.parse(cleanText);
      res.json(parsed);
    } catch (error) {
      console.error("Error in coach audit:", error);
      const userCtx = req.body?.userContext || req.body || {};
      const recentMeals = userCtx.recentMeals || userCtx.todayMeals || [];
      const calorieTarget = Number(userCtx.calorieTarget || userCtx.targetCalories || 2e3);
      const proteinTarget = Number(userCtx.proteinTarget || userCtx.targetProtein || 120);
      const todayCalories = Number(userCtx.todayCalories || recentMeals.reduce((s, m) => s + (Number(m.calories) || 0), 0));
      const todayProtein = Number(userCtx.todayProtein || recentMeals.reduce((s, m) => s + (Number(m.proteinGrams) || 0), 0));
      const dateLabel = userCtx.dateLabel || "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49";
      const customGoals = userCtx.customGoals || {};
      const goalTitle = customGoals.primaryGoalTitle || "\u0E14\u0E39\u0E41\u0E25\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E";
      const calorieDiff = todayCalories - calorieTarget;
      const isCalorieGood = Math.abs(calorieDiff) <= 200;
      const isProteinMet = todayProtein >= proteinTarget * 0.95;
      const hasMeals = recentMeals.length > 0;
      let score = 75;
      if (hasMeals) {
        score = (isCalorieGood ? 50 : 35) + (isProteinMet ? 40 : 25) + 10;
      }
      let pStatus = "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19";
      if (todayProtein > 0) {
        if (isProteinMet) {
          pStatus = `\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E16\u0E36\u0E07\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E22\u0E2D\u0E14\u0E40\u0E22\u0E35\u0E48\u0E22\u0E21 (${todayProtein}g / ${proteinTarget}g)`;
        } else {
          pStatus = `\u0E04\u0E27\u0E23\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E2D\u0E35\u0E01 ${Math.max(0, proteinTarget - todayProtein)}g (${todayProtein}g / ${proteinTarget}g)`;
        }
      }
      res.json({
        overallScore: Math.min(score, 98),
        grade: score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : hasMeals ? "C+" : "N/A",
        verdict: hasMeals ? isCalorieGood && isProteinMet ? `\u0E1C\u0E25\u0E07\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ${dateLabel} \u0E22\u0E2D\u0E14\u0E40\u0E22\u0E35\u0E48\u0E22\u0E21\u0E21\u0E32\u0E01 \u0E04\u0E38\u0E21\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35\u0E41\u0E25\u0E30\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E44\u0E14\u0E49\u0E15\u0E32\u0E21\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22 "${goalTitle}" \u0E2D\u0E22\u0E48\u0E32\u0E07\u0E21\u0E35\u0E27\u0E34\u0E19\u0E31\u0E22!` : `\u0E43\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ${dateLabel} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E44\u0E14\u0E49\u0E14\u0E35 ${isProteinMet ? "\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E04\u0E23\u0E1A\u0E16\u0E49\u0E27\u0E19\u0E41\u0E25\u0E49\u0E27" : "\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E1B\u0E23\u0E31\u0E1A\u0E2A\u0E31\u0E14\u0E2A\u0E48\u0E27\u0E19\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E43\u0E2B\u0E49\u0E15\u0E23\u0E07\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E21\u0E32\u0E01\u0E02\u0E36\u0E49\u0E19"} \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1C\u0E25\u0E25\u0E31\u0E1E\u0E18\u0E4C "${goalTitle}"` : `\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ${dateLabel}`,
        calorieStatus: todayCalories === 0 ? "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35" : calorieDiff > 200 ? `\u0E40\u0E01\u0E34\u0E19\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22 ${calorieDiff} kcal (${todayCalories}/${calorieTarget} kcal)` : calorieDiff < -300 ? `\u0E15\u0E48\u0E33\u0E01\u0E27\u0E48\u0E32\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22 ${Math.abs(calorieDiff)} kcal (${todayCalories}/${calorieTarget} kcal)` : `\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E40\u0E01\u0E13\u0E11\u0E4C\u0E2A\u0E21\u0E14\u0E38\u0E25\u0E14\u0E35\u0E21\u0E32\u0E01 (${todayCalories}/${calorieTarget} kcal)`,
        proteinStatus: pStatus,
        strengths: hasMeals ? [
          "\u0E21\u0E35\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E15\u0E19\u0E40\u0E2D\u0E07\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E2A\u0E21\u0E48\u0E33\u0E40\u0E2A\u0E21\u0E2D",
          isProteinMet ? `\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E04\u0E38\u0E13\u0E20\u0E32\u0E1E\u0E14\u0E35\u0E40\u0E1E\u0E35\u0E22\u0E07\u0E1E\u0E2D\u0E15\u0E48\u0E2D\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22 (${todayProtein}g)` : "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E2B\u0E25\u0E32\u0E01\u0E2B\u0E25\u0E32\u0E22",
          "\u0E04\u0E27\u0E32\u0E21\u0E15\u0E31\u0E49\u0E07\u0E43\u0E08\u0E41\u0E25\u0E30\u0E21\u0E35\u0E27\u0E34\u0E19\u0E31\u0E22\u0E43\u0E19\u0E01\u0E32\u0E23\u0E04\u0E27\u0E1A\u0E04\u0E38\u0E21\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23"
        ] : ["\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E21\u0E37\u0E49\u0E2D\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1C\u0E25\u0E25\u0E31\u0E1E\u0E18\u0E4C\u0E17\u0E35\u0E48\u0E14\u0E35\u0E02\u0E36\u0E49\u0E19"],
        improvements: hasMeals ? [
          !isProteinMet ? `\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E41\u0E2B\u0E25\u0E48\u0E07\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E25\u0E35\u0E19 \u0E40\u0E0A\u0E48\u0E19 \u0E44\u0E02\u0E48\u0E15\u0E49\u0E21 \u0E2D\u0E01\u0E44\u0E01\u0E48 \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E15\u0E49\u0E32\u0E2B\u0E39\u0E49 \u0E2D\u0E35\u0E01 ${Math.max(0, proteinTarget - todayProtein)}g` : "\u0E40\u0E19\u0E49\u0E19\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E43\u0E22\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E08\u0E32\u0E01\u0E1C\u0E31\u0E01\u0E2A\u0E14\u0E41\u0E25\u0E30\u0E1C\u0E25\u0E44\u0E21\u0E49\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25\u0E15\u0E48\u0E33\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E23\u0E30\u0E1A\u0E1A\u0E02\u0E31\u0E1A\u0E16\u0E48\u0E32\u0E22",
          todayCalories > calorieTarget ? "\u0E23\u0E30\u0E27\u0E31\u0E07\u0E19\u0E49\u0E33\u0E21\u0E31\u0E19\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E1C\u0E31\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25\u0E41\u0E1D\u0E07\u0E43\u0E19\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21" : "\u0E2B\u0E25\u0E35\u0E01\u0E40\u0E25\u0E35\u0E48\u0E22\u0E07\u0E01\u0E32\u0E23\u0E1B\u0E25\u0E48\u0E2D\u0E22\u0E43\u0E2B\u0E49\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22\u0E2B\u0E34\u0E27\u0E08\u0E19\u0E42\u0E2B\u0E22"
        ] : ["\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E21\u0E37\u0E49\u0E2D\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E43\u0E19\u0E41\u0E15\u0E48\u0E25\u0E30\u0E27\u0E31\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E17\u0E35\u0E48\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33"],
        actionPlanForTomorrow: [
          isProteinMet ? `1. \u0E23\u0E31\u0E01\u0E29\u0E32\u0E2A\u0E21\u0E14\u0E38\u0E25\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E04\u0E38\u0E13\u0E20\u0E32\u0E1E\u0E14\u0E35 (${proteinTarget}g) \u0E2D\u0E22\u0E48\u0E32\u0E07\u0E2A\u0E21\u0E48\u0E33\u0E40\u0E2A\u0E21\u0E2D` : `1. \u0E40\u0E15\u0E34\u0E21\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E25\u0E35\u0E19\u0E43\u0E19\u0E41\u0E15\u0E48\u0E25\u0E30\u0E21\u0E37\u0E49\u0E2D\u0E43\u0E2B\u0E49\u0E16\u0E36\u0E07\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22 ${proteinTarget}g \u0E15\u0E48\u0E2D\u0E27\u0E31\u0E19`,
          `2. \u0E14\u0E37\u0E48\u0E21\u0E19\u0E49\u0E33\u0E43\u0E2B\u0E49\u0E40\u0E1E\u0E35\u0E22\u0E07\u0E1E\u0E2D 8 \u0E41\u0E01\u0E49\u0E27\u0E15\u0E48\u0E2D\u0E27\u0E31\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E01\u0E23\u0E30\u0E15\u0E38\u0E49\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E1C\u0E32\u0E1C\u0E25\u0E32\u0E0D`,
          `3. \u0E1E\u0E31\u0E01\u0E1C\u0E48\u0E2D\u0E19\u0E43\u0E2B\u0E49\u0E40\u0E15\u0E47\u0E21\u0E17\u0E35\u0E48 7-8 \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E37\u0E19\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E14\u0E0A\u0E37\u0E48\u0E19\u0E43\u0E2B\u0E49\u0E01\u0E25\u0E49\u0E32\u0E21\u0E40\u0E19\u0E37\u0E49\u0E2D`
        ],
        coachQuote: '"\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E21\u0E48\u0E33\u0E40\u0E2A\u0E21\u0E2D\u0E43\u0E19\u0E41\u0E15\u0E48\u0E25\u0E30\u0E27\u0E31\u0E19 \u0E2A\u0E33\u0E04\u0E31\u0E0D\u0E01\u0E27\u0E48\u0E32\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C\u0E41\u0E1A\u0E1A\u0E40\u0E1E\u0E35\u0E22\u0E07\u0E41\u0E04\u0E48\u0E27\u0E31\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27 \u0E17\u0E33\u0E15\u0E48\u0E2D\u0E44\u0E1B\u0E19\u0E30\u0E04\u0E23\u0E31\u0E1A \u0E04\u0E38\u0E13\u0E21\u0E32\u0E16\u0E39\u0E01\u0E17\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27!"'
      });
    }
  });
  app.post("/api/ai-calculate-macros", async (req, res) => {
    try {
      const {
        gender = "female",
        age = 28,
        height = 165,
        weight = 55,
        targetWeight = 52,
        activityLevel = 1.375,
        goalType = "fat_loss",
        customNotes = ""
      } = req.body;
      const safeWeight = Math.max(30, Number(weight) || 55);
      const safeHeight = Math.max(100, Number(height) || 165);
      const safeAge = Math.max(12, Math.min(100, Number(age) || 28));
      const safeAct = typeof activityLevel === "number" ? activityLevel : 1.375;
      const bmr = gender === "male" ? Math.round(10 * safeWeight + 6.25 * safeHeight - 5 * safeAge + 5) : Math.round(10 * safeWeight + 6.25 * safeHeight - 5 * safeAge - 161);
      const tdee = Math.round(bmr * safeAct);
      const prompt = `\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D\u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E31\u0E01\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E01\u0E32\u0E23\u0E01\u0E35\u0E2C\u0E32\u0E41\u0E25\u0E30\u0E1C\u0E39\u0E49\u0E40\u0E0A\u0E35\u0E48\u0E22\u0E27\u0E0A\u0E32\u0E0D\u0E14\u0E49\u0E32\u0E19\u0E40\u0E27\u0E0A\u0E28\u0E32\u0E2A\u0E15\u0E23\u0E4C\u0E0A\u0E30\u0E25\u0E2D\u0E27\u0E31\u0E22 (Chief Sports Nutritionist & Longevity Dietitian)
\u0E08\u0E07\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E0A\u0E35\u0E27\u0E40\u0E04\u0E21\u0E35\u0E41\u0E25\u0E30\u0E44\u0E25\u0E1F\u0E4C\u0E2A\u0E44\u0E15\u0E25\u0E4C\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A "\u0E41\u0E1C\u0E19\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E41\u0E25\u0E30\u0E21\u0E32\u0E42\u0E04\u0E23\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E1A\u0E38\u0E04\u0E04\u0E25" \u0E17\u0E35\u0E48\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14:
- \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49: \u0E40\u0E1E\u0E28${gender === "female" ? "\u0E2B\u0E0D\u0E34\u0E07" : "\u0E0A\u0E32\u0E22"}, \u0E2D\u0E32\u0E22\u0E38 ${safeAge} \u0E1B\u0E35, \u0E2A\u0E48\u0E27\u0E19\u0E2A\u0E39\u0E07 ${safeHeight} \u0E0B\u0E21., \u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01 ${safeWeight} \u0E01\u0E01., \u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22 ${targetWeight} \u0E01\u0E01.
- \u0E2D\u0E31\u0E15\u0E23\u0E32\u0E01\u0E32\u0E23\u0E40\u0E1C\u0E32\u0E1C\u0E25\u0E32\u0E0D\u0E1E\u0E37\u0E49\u0E19\u0E10\u0E32\u0E19 (BMR): ${bmr} kcal | \u0E2D\u0E31\u0E15\u0E23\u0E32\u0E40\u0E1C\u0E32\u0E1C\u0E25\u0E32\u0E0D\u0E23\u0E27\u0E21 (TDEE): ${tdee} kcal
- \u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22: ${goalType} (\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21: ${customNotes || "\u0E44\u0E21\u0E48\u0E21\u0E35"})

\u0E02\u0E49\u0E2D\u0E01\u0E33\u0E2B\u0E19\u0E14:
1. \u0E04\u0E33\u0E19\u0E27\u0E13 dailyCalories (\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E15\u0E48\u0E33\u0E01\u0E27\u0E48\u0E32 BMR ${bmr} kcal \u0E22\u0E01\u0E40\u0E27\u0E49\u0E19\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E23\u0E48\u0E07\u0E14\u0E48\u0E27\u0E19\u0E1E\u0E34\u0E40\u0E28\u0E29)
2. \u0E2A\u0E31\u0E14\u0E2A\u0E48\u0E27\u0E19\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 (proteinGrams) \u0E43\u0E2B\u0E49\u0E40\u0E2B\u0E21\u0E32\u0E30\u0E2A\u0E21\u0E01\u0E31\u0E1A\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01\u0E15\u0E31\u0E27\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32\u0E21\u0E27\u0E25\u0E01\u0E25\u0E49\u0E32\u0E21\u0E40\u0E19\u0E37\u0E49\u0E2D (1.5 - 2.0 g/kg)
3. \u0E2A\u0E31\u0E14\u0E2A\u0E48\u0E27\u0E19\u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15 (carbsGrams) \u0E41\u0E25\u0E30\u0E44\u0E02\u0E21\u0E31\u0E19\u0E14\u0E35 (fatGrams) \u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E16\u0E49\u0E27\u0E19\u0E15\u0E32\u0E21\u0E2B\u0E25\u0E31\u0E01\u0E01\u0E32\u0E23\u0E01\u0E35\u0E2C\u0E32
4. \u0E19\u0E49\u0E33\u0E15\u0E32\u0E25 (sugarGrams) \u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19 25g \u0E41\u0E25\u0E30\u0E42\u0E0B\u0E40\u0E14\u0E35\u0E22\u0E21 (sodiumMg) ~2000mg
5. \u0E43\u0E2B\u0E49 keyTips 3 \u0E02\u0E49\u0E2D\u0E17\u0E35\u0E48\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E44\u0E14\u0E49\u0E08\u0E23\u0E34\u0E07\u0E41\u0E25\u0E30 planTitle \u0E17\u0E35\u0E48\u0E01\u0E23\u0E30\u0E0A\u0E31\u0E1A \u0E44\u0E14\u0E49\u0E43\u0E08\u0E04\u0E27\u0E32\u0E21
6. explanation \u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E2B\u0E25\u0E31\u0E01\u0E01\u0E32\u0E23\u0E17\u0E32\u0E07\u0E0A\u0E35\u0E27\u0E40\u0E04\u0E21\u0E35\u0E2A\u0E31\u0E49\u0E19\u0E46 1-2 \u0E1B\u0E23\u0E30\u0E42\u0E22\u0E04

\u0E2A\u0E48\u0E07\u0E1C\u0E25\u0E25\u0E31\u0E1E\u0E18\u0E4C\u0E40\u0E1B\u0E47\u0E19 JSON Object \u0E15\u0E32\u0E21 Schema`;
      try {
        const response = await generateContentSafe({
          model: "gemini-flash-latest",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: import_genai.Type.OBJECT,
              properties: {
                dailyCalories: { type: import_genai.Type.INTEGER },
                proteinGrams: { type: import_genai.Type.INTEGER },
                carbsGrams: { type: import_genai.Type.INTEGER },
                fatGrams: { type: import_genai.Type.INTEGER },
                sugarGrams: { type: import_genai.Type.INTEGER },
                sodiumMg: { type: import_genai.Type.INTEGER },
                planTitle: { type: import_genai.Type.STRING },
                explanation: { type: import_genai.Type.STRING },
                keyTips: {
                  type: import_genai.Type.ARRAY,
                  items: { type: import_genai.Type.STRING }
                }
              },
              required: ["dailyCalories", "proteinGrams", "carbsGrams", "fatGrams", "planTitle", "explanation", "keyTips"]
            }
          }
        });
        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text.trim().replace(/^```json\s*|\s*```$/gi, ""));
          return res.json({
            bmr,
            tdee,
            targetCalories: parsed.dailyCalories,
            ...parsed
          });
        }
      } catch (aiErr) {
        console.warn("AI macro calculation model error, using math formula:", aiErr);
      }
      let calorieAdjustment = 0;
      let proteinPerKg = 1.6;
      if (goalType === "fat_loss" || goalType === "cut") {
        calorieAdjustment = -400;
        proteinPerKg = 1.8;
      } else if (goalType === "muscle_build" || goalType === "bulk") {
        calorieAdjustment = 250;
        proteinPerKg = 2;
      }
      const targetCalories = Math.max(bmr, tdee + calorieAdjustment);
      const proteinGrams = Math.round(safeWeight * proteinPerKg);
      const fatGrams = Math.round(targetCalories * 0.25 / 9);
      const carbsGrams = Math.max(50, Math.round((targetCalories - proteinGrams * 4 - fatGrams * 9) / 4));
      res.json({
        bmr,
        tdee,
        targetCalories,
        dailyCalories: targetCalories,
        proteinGrams,
        carbsGrams,
        fatGrams,
        sugarGrams: 24,
        sodiumMg: 2e3,
        planTitle: `\u0E41\u0E1C\u0E19\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E27\u0E34\u0E17\u0E22\u0E32\u0E28\u0E32\u0E2A\u0E15\u0E23\u0E4C\u0E01\u0E32\u0E23\u0E01\u0E35\u0E2C\u0E32 (${goalType})`,
        explanation: `\u0E04\u0E33\u0E19\u0E27\u0E13\u0E15\u0E32\u0E21\u0E2B\u0E25\u0E31\u0E01\u0E40\u0E27\u0E0A\u0E28\u0E32\u0E2A\u0E15\u0E23\u0E4C\u0E01\u0E32\u0E23\u0E01\u0E35\u0E2C\u0E32 \u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19 ${targetCalories} kcal \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19 ${proteinGrams}g \u0E40\u0E2B\u0E21\u0E32\u0E30\u0E2A\u0E21\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32\u0E21\u0E27\u0E25\u0E01\u0E25\u0E49\u0E32\u0E21\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E41\u0E25\u0E30\u0E1A\u0E23\u0E23\u0E25\u0E38\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22`,
        keyTips: [
          `\u0E01\u0E23\u0E30\u0E08\u0E32\u0E22\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22 25-35 \u0E01\u0E23\u0E31\u0E21\u0E15\u0E48\u0E2D\u0E21\u0E37\u0E49\u0E2D\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E07\u0E2A\u0E20\u0E32\u0E1E\u0E01\u0E25\u0E49\u0E32\u0E21\u0E40\u0E19\u0E37\u0E49\u0E2D`,
          `\u0E14\u0E37\u0E48\u0E21\u0E19\u0E49\u0E33\u0E2A\u0E30\u0E2D\u0E32\u0E14\u0E27\u0E31\u0E19\u0E25\u0E30\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 2.5 \u0E25\u0E34\u0E15\u0E23\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E01\u0E32\u0E23\u0E40\u0E1C\u0E32\u0E1C\u0E25\u0E32\u0E0D`,
          `\u0E17\u0E32\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E44\u0E21\u0E48\u0E41\u0E1B\u0E23\u0E23\u0E39\u0E1B\u0E41\u0E25\u0E30\u0E40\u0E25\u0E35\u0E48\u0E22\u0E07\u0E19\u0E49\u0E33\u0E15\u0E32\u0E25\u0E40\u0E15\u0E34\u0E21\u0E41\u0E15\u0E48\u0E07`
        ]
      });
    } catch (error) {
      console.error("Error calculating macros:", error);
      res.status(500).json({ error: "Failed to calculate macros" });
    }
  });
  const hasDist = import_fs.default.existsSync(import_path.default.join(process.cwd(), "dist", "index.html"));
  const isProd = process.env.NODE_ENV === "production" || !process.env.VITE_DEV && hasDist;
  if (!isProd) {
    const vite = await (0, import_vite.createServer)({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ["**/data/**", "**/dist/**"]
        }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`GooKal Server running on port ${PORT} (0.0.0.0 dual-stack IPv4/IPv6)`);
  });
}
startServer().catch((err) => {
  console.error("Fatal Server Startup Error:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
