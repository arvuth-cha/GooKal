export interface RecipeIngredient {
  name: string;
  amount: string;
  isMain?: boolean;
}

export interface HealthyRecipe {
  id: string;
  recipeName: string;
  englishName?: string;
  description: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  sodiumMg?: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: 'ง่ายมาก' | 'ปานกลาง' | 'ระดับเชฟ' | string;
  healthTags: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
  nutritionHighlights: string;
  proTip: string;
  imageUrl?: string;
  isBookmarked?: boolean;
}

export type DietaryGoal = 'all' | 'high_protein' | 'low_carb' | 'clean' | 'quick_15min' | 'keto';
