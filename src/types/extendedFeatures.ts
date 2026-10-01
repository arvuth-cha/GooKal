export interface FastingPlan {
  id: string;
  name: string;
  fastHours: number;
  eatHours: number;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'custom';
}

export interface FastingSession {
  id: string;
  planId: string;
  planName: string;
  startTime: number; // timestamp ms
  targetHours: number;
  endTime?: number; // timestamp ms when completed or stopped
  isActive: boolean;
  notes?: string;
}

export interface WaterLog {
  id: string;
  amountMl: number; // e.g. 250, 500
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
}

export interface WaterDailyGoal {
  targetMl: number; // e.g. 2000 ml
  bottleSizeMl: number; // e.g. 500 ml
}

export interface WeightRecord {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  weightKg: number;
  bodyFatPercent?: number;
  waistInches?: number;
  hipInches?: number;
  notes?: string;
}

export interface CustomMealItem {
  id: string;
  name: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  sugarGrams?: number;
  sodiumMg?: number;
  servingSize: string; // e.g. "1 จาน (300g)" or "1 แก้ว"
  category: 'meal' | 'drink' | 'snack' | 'supplement';
  tags?: string[];
  createdAt: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: string;
  category: 'produce' | 'meat' | 'dairy' | 'pantry' | 'other';
  completed: boolean;
  recipeSource?: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'nutrition' | 'water' | 'fasting' | 'chef';
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
}

export interface DailyMoodLog {
  dateStr: string; // YYYY-MM-DD
  energyLevel: number; // 1 to 5
  bloatingLevel: number; // 1 to 5 (1 = none, 5 = severe)
  fullnessLevel: number; // 1 to 5
  mood: 'great' | 'good' | 'neutral' | 'tired' | 'stressed';
  digestiveStatus: string;
  notes: string;
}

export interface SmartSwapItem {
  originalName: string;
  originalCalories: number;
  swapName: string;
  swapCalories: number;
  caloriesSaved: number;
  category: string;
  reason: string;
  proTip: string;
}

export interface OfflineFoodDatabaseItem {
  id: string;
  name: string;
  category: 'rice_dishes' | 'noodles' | 'curries' | 'drinks' | 'snacks' | 'clean_gym';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  sodium?: number;
  portion: string;
  giLevel: 'low' | 'medium' | 'high';
  tags: string[];
}
