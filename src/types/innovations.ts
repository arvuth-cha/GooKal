export interface GlucosePredictionResult {
  glycemicLevel: 'low' | 'moderate' | 'high' | 'spike_risk';
  glycemicIndexEstimate: number;
  peakMinutes: number;
  crashRisk: 'none' | 'mild' | 'moderate' | 'high';
  crashWindowText: string;
  scienceExplanation: string;
  glucoseHacks: string[];
  simulatedCurve: { minute: number; glucoseLevel: number }[];
}

export interface RestaurantMenuAnalysisResult {
  detectedRestaurantType: string;
  safeRecommendations: {
    dishName: string;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    safetyBadge: string;
    whyItsSafe: string;
    orderingSecret: string;
  }[];
  dishesToAvoid: string[];
  chefAdvice: string;
}

export interface LongevityAnalysisResult {
  longevityScore: number;
  inflammatoryStatus: string;
  antioxidantStars: number;
  gutFriendlyStars: number;
  keyBeneficialCompounds: string[];
  cautionFactors: string[];
  longevitySummary: string;
}

export interface CheatRecoveryResult {
  protocolTitle: string;
  estimatedWaterWeightKg: number;
  recoveryDurationHours: number;
  immediateStepsTonight: string[];
  dayOneMealStrategy: {
    focus: string;
    recommendedFoods: string[];
    fastingWindow: string;
  };
  sodiumFlushTips: string[];
  mindsetAffirmation: string;
}

export interface CheatMealRecoveryPlan {
  day1Adjustment: string;
  day2Adjustment: string;
  hydrationExtraMl: number;
  potassiumFoodSuggestions: string[];
  mindsetSupportMessage: string;
}

export interface PantryWizardRecipe {
  id?: string;
  recipeName: string;
  description?: string;
  prepTimeMinutes: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  sodiumMg?: number;
  zeroWasteScore: number;
  whyZeroWaste?: string;
  usedFridgeItems?: string[];
  usedPantryItems?: string[];
  ingredientsDetail?: {
    name: string;
    amount: string;
    source: 'fridge' | 'pantry' | 'extra' | string;
    isExpiring?: boolean;
  }[];
  quickSteps: string[];
  flavorTwist: string;
}

export interface FridgeItem {
  id: string;
  name: string;
  category: 'produce' | 'dairy_eggs' | 'meat_protein' | 'leftovers' | 'condiments';
  expiryDate: string; // YYYY-MM-DD
  daysLeft: number;
  quantity: string;
  addedAt: number;
}

export interface MicroHabit {
  id: string;
  title: string;
  category: 'morning' | 'meal' | 'movement' | 'night';
  icon: string;
  points: number;
  completedToday: boolean;
  streak: number;
}

export interface ClinicalBiomarkers {
  fastingGlucose?: number; // mg/dL
  hba1c?: number; // %
  totalCholesterol?: number; // mg/dL
  ldl?: number; // mg/dL
  hdl?: number; // mg/dL
  triglycerides?: number; // mg/dL
  systolicBP?: number; // mmHg
  diastolicBP?: number; // mmHg
  lastUpdated?: number;
}

export interface PlantDiversityItem {
  id: string;
  name: string;
  category: 'veg' | 'fruit' | 'herb_spice' | 'seed_nut' | 'grain' | 'legume';
  dateAdded: string; // YYYY-MM-DD
}
