import React, { useState, useEffect, useRef } from 'react';
import { HealthyRecipe, DietaryGoal, RecipeIngredient } from '../../types/recipe';
import { CURATED_HEALTHY_RECIPES } from '../../utils/curatedRecipes';
import {
  Sparkles,
  Search,
  Plus,
  X,
  Clock,
  Flame,
  ChefHat,
  Heart,
  Bookmark,
  Check,
  Calendar,
  Utensils,
  Share2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  Award,
  Zap,
  Camera,
  Image as ImageIcon,
  Scan,
  RefreshCw,
  CheckCircle2,
  UploadCloud,
  Layers,
  Archive,
  Package,
  ArrowRight,
  Filter,
  CheckCheck,
  Trash2
} from 'lucide-react';
import {
  loadInventory,
  saveInventory,
  addInventoryItem,
  InventoryItem,
  StorageLocation,
  deductIngredientsAfterCooking
} from '../../utils/foodPantryStore';

interface HealthyRecipeSearchProps {
  initialIngredients?: string[];
  onLogMealToDiary?: (mealData: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  }) => void;
  onLogMeal?: (mealData: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  }) => void;
  onToast?: (message: string) => void;
  onBack?: () => void;
  onOpenFridgeManager?: () => void;
}

const POPULAR_INGREDIENTS = [
  'อกไก่',
  'ไข่ไก่',
  'แซลมอน',
  'กุ้ง',
  'สันในหมู',
  'บรอกโคลี',
  'เห็ดหอม',
  'เต้าหู้',
  'ผักโขม',
  'มะเขือเทศ',
  'ข้าวกล้อง',
  'อะโวคาโด',
  'ฟักทอง',
  'ควินัว',
  'ข้าวโอ๊ต'
];

interface DetectedResult {
  detectedIngredients: string[];
  categories?: { category: string; items: string[] }[];
  summary: string;
}

export const HealthyRecipeSearch: React.FC<HealthyRecipeSearchProps> = ({
  initialIngredients,
  onLogMealToDiary,
  onLogMeal,
  onToast,
  onBack,
  onOpenFridgeManager
}) => {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(() => {
    if (initialIngredients && initialIngredients.length > 0) {
      return initialIngredients;
    }
    return ['อกไก่', 'บรอกโคลี'];
  });
  const [customInput, setCustomInput] = useState<string>('');
  const [dietaryGoal, setDietaryGoal] = useState<DietaryGoal>('all');
  const [recipes, setRecipes] = useState<HealthyRecipe[]>(CURATED_HEALTHY_RECIPES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedRecipeIds, setExpandedRecipeIds] = useState<string[]>([CURATED_HEALTHY_RECIPES[0]?.id].filter(Boolean) as string[]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('caltrack_bookmarked_recipes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Live Inventory State from Fridge & Pantry
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadInventory());
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'fridge' | 'pantry' | 'expiring'>('all');
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [autoDeductStock, setAutoDeductStock] = useState<boolean>(true);

  // Sync with initialIngredients when changed from parent
  useEffect(() => {
    if (initialIngredients && initialIngredients.length > 0) {
      setSelectedIngredients(initialIngredients);
    }
  }, [initialIngredients]);

  // Listen for inventory updates across the app
  useEffect(() => {
    const handleInvUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setInventory(e.detail);
      } else {
        setInventory(loadInventory());
      }
    };
    window.addEventListener('kalguru_inventory_updated', handleInvUpdate);
    return () => window.removeEventListener('kalguru_inventory_updated', handleInvUpdate);
  }, []);

  // Photo Scan State
  const [isScanningPhoto, setIsScanningPhoto] = useState<boolean>(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [detectedResult, setDetectedResult] = useState<DetectedResult | null>(null);
  const [selectedDetectedItems, setSelectedDetectedItems] = useState<string[]>([]);
  const [showPhotoScanSection, setShowPhotoScanSection] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Log to meal modal state
  const [loggingRecipe, setLoggingRecipe] = useState<HealthyRecipe | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1);

  useEffect(() => {
    try {
      localStorage.setItem('caltrack_bookmarked_recipes', JSON.stringify(bookmarkedIds));
    } catch (e) {
      console.error(e);
    }
  }, [bookmarkedIds]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleProcessImageFile = async (file: File) => {
    try {
      setIsScanningPhoto(true);
      setShowPhotoScanSection(true);
      setDetectedResult(null);

      const compressedBase64 = await compressImage(file);
      setScannedImage(compressedBase64);

      const response = await fetch('/api/detect-ingredients-from-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: compressedBase64 })
      });

      if (!response.ok) {
        throw new Error('Detection failed');
      }

      const data: DetectedResult = await response.json();
      setDetectedResult(data);
      if (Array.isArray(data.detectedIngredients) && data.detectedIngredients.length > 0) {
        setSelectedDetectedItems(data.detectedIngredients);
        if (onToast) {
          onToast(`📸 ตรวจพบ ${data.detectedIngredients.length} วัตถุดิบในภาพของคุณ!`);
        }
      } else {
        if (onToast) onToast('⚠️ ไม่พบวัตถุดิบที่ชัดเจนในภาพ ลองถ่ายใหม่ให้เห็นชัดขึ้นครับ');
      }
    } catch (err: any) {
      console.error('Error scanning ingredients:', err);
      if (onToast) onToast('❌ เกิดข้อผิดพลาดในการสแกนรูปภาพ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsScanningPhoto(false);
    }
  };

  const handleAddSelectedDetectedItems = () => {
    if (selectedDetectedItems.length === 0) return;
    const newItems = selectedDetectedItems.filter(item => !selectedIngredients.includes(item));
    setSelectedIngredients(prev => [...prev, ...newItems]);
    if (onToast) {
      onToast(`✅ เพิ่ม ${newItems.length} วัตถุดิบลงในรายการเรียบร้อย!`);
    }
  };

  const handleSaveDetectedToInventory = (location: StorageLocation = 'fridge') => {
    if (selectedDetectedItems.length === 0) return;
    let addedCount = 0;
    selectedDetectedItems.forEach(name => {
      addInventoryItem({
        name,
        category: location === 'pantry' ? 'pantry_grains' : 'produce',
        storageLocation: location,
        quantity: '1 หน่วย',
        expiryDate: new Date(Date.now() + (location === 'pantry' ? 30 : 5) * 86400000).toISOString().split('T')[0],
        daysLeft: location === 'pantry' ? 30 : 5
      });
      addedCount++;
    });
    setInventory(loadInventory());
    if (onToast) {
      onToast(`📥 บันทึก ${addedCount} วัตถุดิบเข้า${location === 'fridge' ? 'ตู้เย็น' : 'ตู้กับข้าว'}เรียบร้อย!`);
    }
  };

  const handleAddAllDetectedAndSearch = () => {
    if (!detectedResult?.detectedIngredients) return;
    const combined = Array.from(new Set([...selectedIngredients, ...detectedResult.detectedIngredients]));
    setSelectedIngredients(combined);
    if (onToast) {
      onToast(`🚀 เพิ่ม ${detectedResult.detectedIngredients.length} วัตถุดิบและเริ่มคิดค้นสูตรทันที!`);
    }
    // Trigger search
    setTimeout(() => {
      handleSearchAiRecipesWithCustomIngredients(combined);
    }, 100);
  };

  // Inventory Bulk Select Handlers
  const handlePullAllInventory = () => {
    const allNames = Array.from(new Set(inventory.map(i => i.name.trim()))).filter(Boolean);
    if (allNames.length === 0) {
      if (onToast) onToast('⚠️ ยังไม่มีรายการวัตถุดิบในตู้เย็นหรือตู้กับข้าว');
      return;
    }
    setSelectedIngredients(allNames);
    if (onToast) onToast(`📥 ดึงวัตถุดิบทั้งหมด ${allNames.length} รายการจากตู้เย็น & ตู้กับข้าวแล้ว!`);
  };

  const handlePullFridgeItems = () => {
    const fridgeNames = Array.from(new Set(
      inventory
        .filter(i => i.storageLocation === 'fridge' || i.storageLocation === 'freezer')
        .map(i => i.name.trim())
    )).filter(Boolean);

    if (fridgeNames.length === 0) {
      if (onToast) onToast('⚠️ ไม่มีวัตถุดิบในตู้เย็นหรือช่องฟรีซ');
      return;
    }
    setSelectedIngredients(fridgeNames);
    if (onToast) onToast(`❄️ ดึงวัตถุดิบจากตู้เย็น ${fridgeNames.length} รายการแล้ว!`);
  };

  const handlePullPantryItems = () => {
    const pantryNames = Array.from(new Set(
      inventory
        .filter(i => i.storageLocation === 'pantry')
        .map(i => i.name.trim())
    )).filter(Boolean);

    if (pantryNames.length === 0) {
      if (onToast) onToast('⚠️ ไม่มีวัตถุดิบในตู้กับข้าว');
      return;
    }
    setSelectedIngredients(pantryNames);
    if (onToast) onToast(`🧂 ดึงวัตถุดิบจากตู้กับข้าว ${pantryNames.length} รายการแล้ว!`);
  };

  const handlePullExpiringSoonItems = () => {
    const expiringNames = Array.from(new Set(
      inventory
        .filter(i => i.daysLeft <= 2)
        .map(i => i.name.trim())
    )).filter(Boolean);

    if (expiringNames.length === 0) {
      if (onToast) onToast('🎉 ไม่มีวัตถุดิบที่ใกล้หมดอายุในระยะ 2 วันนี้');
      return;
    }
    setSelectedIngredients(expiringNames);
    if (onToast) onToast(`⚠️ ดึงวัตถุดิบใกล้หมดอายุ ${expiringNames.length} รายการ (เมนู Zero-Waste)!`);
  };

  const handleClearSelectedIngredients = () => {
    setSelectedIngredients([]);
    if (onToast) onToast('🧹 ล้างรายการวัตถุดิบที่เลือกทั้งหมดแล้ว');
  };

  const handleToggleInventoryItem = (itemName: string) => {
    const trimmed = itemName.trim();
    if (selectedIngredients.includes(trimmed)) {
      setSelectedIngredients(selectedIngredients.filter(i => i !== trimmed));
    } else {
      setSelectedIngredients([...selectedIngredients, trimmed]);
    }
  };

  const handleAddIngredient = (ing: string) => {
    const trimmed = ing.trim();
    if (!trimmed || selectedIngredients.includes(trimmed)) return;
    setSelectedIngredients([...selectedIngredients, trimmed]);
    setCustomInput('');
  };

  const handleRemoveIngredient = (ing: string) => {
    setSelectedIngredients(selectedIngredients.filter(i => i !== ing));
  };

  const handleToggleBookmark = (id: string) => {
    if (bookmarkedIds.includes(id)) {
      setBookmarkedIds(bookmarkedIds.filter(b => b !== id));
      if (onToast) onToast('ลบออกจากรายการโปรดแล้ว');
    } else {
      setBookmarkedIds([...bookmarkedIds, id]);
      if (onToast) onToast('❤️ บันทึกลงรายการสูตรโปรดเรียบร้อย');
    }
  };

  const handleToggleExpand = (id: string) => {
    setExpandedRecipeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCollapseAll = () => {
    setExpandedRecipeIds([]);
    if (onToast) onToast('ยุบรายละเอียดสูตรอาหารทั้งหมดแล้ว');
  };

  const handleExpandAll = () => {
    setExpandedRecipeIds(recipes.map(r => r.id));
    if (onToast) onToast('ขยายดูวิธีทำทุกสูตรแล้ว');
  };

  const handleSearchAiRecipesWithCustomIngredients = async (targetIngredients: string[]) => {
    if (targetIngredients.length === 0) {
      if (onToast) onToast('⚠️ กรุณาเลือกหรือระบุวัตถุดิบอย่างน้อย 1 อย่าง');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/search-recipes-by-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: targetIngredients,
          dietaryGoal: dietaryGoal === 'all' ? undefined : dietaryGoal,
          maxPrepTime: dietaryGoal === 'quick_15min' ? 15 : 30
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const generatedRecipes: HealthyRecipe[] = await response.json();
      if (Array.isArray(generatedRecipes) && generatedRecipes.length > 0) {
        setRecipes(generatedRecipes);
        setExpandedRecipeIds(generatedRecipes.slice(0, 1).map(r => r.id));
        if (onToast) onToast(`✨ AI คิดค้น ${generatedRecipes.length} สูตรอาหารคลีนให้คุณสำเร็จแล้ว!`);
      } else {
        throw new Error('Invalid recipe data');
      }
    } catch (error) {
      console.error('AI Recipe search failed, using curated matching:', error);
      const matches = CURATED_HEALTHY_RECIPES.filter(r =>
        r.ingredients.some(ing =>
          targetIngredients.some(sel => ing.name.toLowerCase().includes(sel.toLowerCase()))
        )
      );
      if (matches.length > 0) {
        setRecipes(matches);
        setExpandedRecipeIds(matches.slice(0, 1).map(r => r.id));
      } else {
        setRecipes(CURATED_HEALTHY_RECIPES);
        setExpandedRecipeIds(CURATED_HEALTHY_RECIPES.slice(0, 1).map(r => r.id));
      }
      if (onToast) onToast('⚡ โหลดสูตรอาหารสุขภาพพร้อมคุณค่าทางโภชนาการเรียบร้อย');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchAiRecipes = () => {
    handleSearchAiRecipesWithCustomIngredients(selectedIngredients);
  };

  const handleConfirmLogMeal = () => {
    if (!loggingRecipe) return;

    const mealData = {
      name: `${loggingRecipe.recipeName} (${portionMultiplier} ที่)`,
      calories: Math.round(loggingRecipe.calories * portionMultiplier),
      protein: Math.round(loggingRecipe.proteinGrams * portionMultiplier),
      carbs: Math.round(loggingRecipe.carbsGrams * portionMultiplier),
      fat: Math.round(loggingRecipe.fatGrams * portionMultiplier),
      mealType: selectedMealType
    };

    const logHandler = onLogMeal || onLogMealToDiary;
    if (logHandler) {
      logHandler(mealData);
    }

    // Auto deduct used ingredients from inventory if enabled
    if (autoDeductStock && loggingRecipe.ingredients && loggingRecipe.ingredients.length > 0) {
      const usedNames = loggingRecipe.ingredients.map(i => i.name);
      deductIngredientsAfterCooking(usedNames, onToast);
      setInventory(loadInventory());
    }

    if (onToast) {
      onToast(`🍽️ บันทึก "${loggingRecipe.recipeName}" (${mealData.calories} kcal) ลงมื้ออาหารเรียบร้อย!`);
    }
    setLoggingRecipe(null);
  };

  // Filtered inventory items
  const fridgeItems = inventory.filter(i => i.storageLocation === 'fridge' || i.storageLocation === 'freezer');
  const pantryItems = inventory.filter(i => i.storageLocation === 'pantry');
  const expiringItems = inventory.filter(i => i.daysLeft <= 2);

  const displayedInventory = inventory.filter(item => {
    // Filter by tab
    if (inventoryFilter === 'fridge' && item.storageLocation !== 'fridge' && item.storageLocation !== 'freezer') return false;
    if (inventoryFilter === 'pantry' && item.storageLocation !== 'pantry') return false;
    if (inventoryFilter === 'expiring' && item.daysLeft > 2) return false;

    // Filter by search
    if (inventorySearch.trim()) {
      return item.name.toLowerCase().includes(inventorySearch.trim().toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-all cursor-pointer"
          >
            ← กลับไปแดชบอร์ด
          </button>
        )}
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wide">
            <Sparkles size={14} className="text-yellow-300 animate-spin-slow" />
            <span>AI Smart Recipe & Nutrition Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            ค้นหาสูตรอาหารคลีน จากวัตถุดิบในตู้เย็น
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
            เลือกวัตถุดิบที่คุณมี AI จะสร้างสรรค์เมนูสุขภาพที่คำนวณแคลอรี่ โปรตีน คาร์บ ไขมัน พร้อมวิธีทำละเอียด และกดบันทึกลงสมุดบันทึกอาหารได้ใน 1 คลิก!
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:block text-emerald-200/30">
          <ChefHat size={120} strokeWidth={1.2} />
        </div>
      </div>

      {/* Hidden File Inputs for Camera and Gallery */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleProcessImageFile(file);
          if (cameraInputRef.current) cameraInputRef.current.value = '';
        }}
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleProcessImageFile(file);
          if (galleryInputRef.current) galleryInputRef.current.value = '';
        }}
      />

      {/* AI Smart Fridge Photo Scanner Box */}
      <div 
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file && file.type.startsWith('image/')) {
            handleProcessImageFile(file);
          }
        }}
        className={`bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white rounded-3xl p-5 sm:p-6 border transition-all space-y-4 ${
          isDragOver ? 'border-emerald-500 ring-2 ring-emerald-400 bg-emerald-50' : 'border-emerald-100/90 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/20">
              <Camera size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-neutral-900 text-base">
                  สแกนตู้เย็น & ถ่ายรูปวัตถุดิบ (AI Fridge Scan)
                </h3>
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ใหม่
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium mt-0.5 leading-relaxed">
                ถ่ายรูปตู้เย็นหรือวัตถุดิบที่มี AI จะตรวจจับและเพิ่มลงรายการให้คุณโดยอัตโนมัติ ไม่ต้องพิมพ์เอง
              </p>
            </div>
          </div>

          {/* Trigger Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isScanningPhoto}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Camera size={15} />
              <span>ถ่ายรูปวัตถุดิบ</span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isScanningPhoto}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-neutral-50 active:scale-95 text-neutral-700 text-xs font-bold border border-neutral-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <ImageIcon size={15} className="text-emerald-600" />
              <span>เลือกจากอัลบั้ม</span>
            </button>
          </div>
        </div>

        {/* Drag & Drop or Active Scanner State */}
        {showPhotoScanSection && (
          <div className="pt-2 border-t border-emerald-100/80 space-y-4 animate-in fade-in slide-in-from-top-2">
            {/* Loading / Scanning indicator */}
            {isScanningPhoto && (
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-emerald-200 flex flex-col items-center justify-center gap-3 text-center shadow-sm">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                  {scannedImage ? (
                    <img src={scannedImage} alt="Scanning" className="w-full h-full object-cover opacity-60" />
                  ) : (
                    <Scan size={28} className="text-emerald-600 animate-pulse" />
                  )}
                  <div className="absolute inset-0 bg-emerald-500/20 animate-pulse" />
                  <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 shadow-md shadow-emerald-400 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-extrabold text-neutral-900 text-sm flex items-center justify-center gap-2">
                    <Sparkles size={16} className="text-emerald-600 animate-spin" />
                    <span>AI กำลังวิเคราะห์และตรวจจับวัตถุดิบจากภาพ...</span>
                  </h4>
                  <p className="text-xs text-neutral-500 font-medium mt-1">
                    ระบบกำลังแยกแยะ ผัก เนื้อสัตว์ และวัตถุดิบทั้งหมดที่มีในตู้เย็น
                  </p>
                </div>
              </div>
            )}

            {/* Detected Result Box */}
            {!isScanningPhoto && detectedResult && (
              <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {scannedImage && (
                      <img
                        src={scannedImage}
                        alt="Scanned Preview"
                        className="w-14 h-14 rounded-xl object-cover border border-neutral-200 shrink-0"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <h4 className="font-extrabold text-neutral-900 text-sm">
                          ตรวจพบ {detectedResult.detectedIngredients.length} วัตถุดิบ
                        </h4>
                      </div>
                      <p className="text-xs text-neutral-600 font-medium mt-0.5 leading-relaxed">
                        {detectedResult.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw size={13} />
                      <span>ถ่ายใหม่</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPhotoScanSection(false)}
                      className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                      title="ปิด"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Categorized Breakdown if available */}
                {detectedResult.categories && detectedResult.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
                    {detectedResult.categories.map((cat, idx) => (
                      <div key={idx} className="bg-neutral-50 px-2.5 py-1 rounded-xl border border-neutral-100 text-[11px] font-medium text-neutral-600 flex items-center gap-1.5">
                        <span className="font-bold text-neutral-800">{cat.category}:</span>
                        <span>{cat.items.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Detected Ingredients Selection Pills */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-neutral-700 block">
                    เลือกวัตถุดิบที่ต้องการเพิ่มลงรายการ:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {detectedResult.detectedIngredients.map((item) => {
                      const isChecked = selectedDetectedItems.includes(item);
                      const isAlreadyAdded = selectedIngredients.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setSelectedDetectedItems(selectedDetectedItems.filter(i => i !== item));
                            } else {
                              setSelectedDetectedItems([...selectedDetectedItems, item]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isAlreadyAdded
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                              : isChecked
                              ? 'bg-emerald-600 text-white font-bold shadow-xs'
                              : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 border border-transparent'
                          }`}
                        >
                          {isChecked || isAlreadyAdded ? <Check size={13} strokeWidth={2.5} /> : <Plus size={13} />}
                          <span>{item}</span>
                          {isAlreadyAdded && <span className="text-[10px] opacity-80">(มีแล้ว)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions for detected ingredients */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={handleAddSelectedDetectedItems}
                    disabled={selectedDetectedItems.length === 0}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>เพิ่มรายการที่เลือก ({selectedDetectedItems.length}) ลงในวัตถุดิบ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveDetectedToInventory('fridge')}
                    disabled={selectedDetectedItems.length === 0}
                    className="bg-sky-600 hover:bg-sky-700 active:scale-98 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    title="บันทึกลงตู้เย็น"
                  >
                    <span>❄️ บันทึกเข้าตู้เย็น</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveDetectedToInventory('pantry')}
                    disabled={selectedDetectedItems.length === 0}
                    className="bg-amber-600 hover:bg-amber-700 active:scale-98 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    title="บันทึกเข้าตู้กับข้าว"
                  >
                    <span>🧂 เข้าตู้กับข้าว</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddAllDetectedAndSearch}
                    className="bg-neutral-900 hover:bg-neutral-800 active:scale-98 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Sparkles size={14} className="text-yellow-300" />
                    <span>เพิ่ม & คิดสูตรทันที</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LIVE FRIDGE & PANTRY INTEGRATION CARD */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
              <Package size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-neutral-900 text-base">
                  วัตถุดิบในตู้เย็น & ตู้กับข้าวของคุณ
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                  มี {inventory.length} ชนิด
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium">
                ดึงข้อมูลจริงจากตู้เย็น & ตู้กับข้าว มาใช้คิดสูตรอาหารคลีนได้ทันที
              </p>
            </div>
          </div>

          {/* Quick Bulk Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handlePullAllInventory}
              disabled={inventory.length === 0}
              className="bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCheck size={14} />
              <span>ดึงทั้งหมด ({inventory.length})</span>
            </button>
            <button
              type="button"
              onClick={handlePullFridgeItems}
              disabled={fridgeItems.length === 0}
              className="bg-sky-600 hover:bg-sky-700 active:scale-98 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span>❄️ ตู้เย็น ({fridgeItems.length})</span>
            </button>
            <button
              type="button"
              onClick={handlePullPantryItems}
              disabled={pantryItems.length === 0}
              className="bg-amber-600 hover:bg-amber-700 active:scale-98 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span>🧂 ตู้กับข้าว ({pantryItems.length})</span>
            </button>
            {expiringItems.length > 0 && (
              <button
                type="button"
                onClick={handlePullExpiringSoonItems}
                className="bg-rose-600 hover:bg-rose-700 active:scale-98 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <span>⚠️ ใกล้หมดอายุ ({expiringItems.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleClearSelectedIngredients}
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-600 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="ล้างวัตถุดิบที่เลือก"
            >
              <Trash2 size={13} />
              <span>ล้าง</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap gap-1 bg-neutral-100 p-1 rounded-2xl">
            {[
              { id: 'all', label: `ทั้งหมด (${inventory.length})` },
              { id: 'fridge', label: `❄️ ตู้เย็น & ฟรีซ (${fridgeItems.length})` },
              { id: 'pantry', label: `🧂 ตู้กับข้าว (${pantryItems.length})` },
              { id: 'expiring', label: `⚠️ ใกล้หมดอายุ (${expiringItems.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInventoryFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inventoryFilter === tab.id
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="ค้นหาของในตู้..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Inventory Items Interactive Grid */}
        <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-200/80">
          {displayedInventory.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <Package size={28} className="mx-auto text-neutral-400" />
              <p className="text-xs text-neutral-500 font-medium">
                {inventorySearch ? 'ไม่พบวัตถุดิบที่ตรงกับคำค้นหา' : 'ไม่มีรายการในหมวดหมู่นี้'}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {displayedInventory.map(item => {
                const isSelected = selectedIngredients.includes(item.name.trim());
                const isExpiringSoon = item.daysLeft <= 2;
                const locationIcon = item.storageLocation === 'freezer' ? '🧊' : item.storageLocation === 'pantry' ? '🧂' : '❄️';
                
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleInventoryItem(item.name)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200 shadow-2xs'
                    }`}
                  >
                    <span className="text-sm shrink-0">{locationIcon}</span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">{item.name}</span>
                        {item.quantity && (
                          <span className={`text-[10px] ${isSelected ? 'text-emerald-200' : 'text-neutral-400'}`}>
                            ({item.quantity})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px]">
                        {isExpiringSoon ? (
                          <span className={`font-bold ${isSelected ? 'text-amber-200' : 'text-rose-600'}`}>
                            ⚠️ {item.daysLeft <= 0 ? 'หมดอายุวันนี้' : `เหลือ ${item.daysLeft} วัน`}
                          </span>
                        ) : (
                          <span className={`${isSelected ? 'text-emerald-100' : 'text-neutral-400'}`}>
                            เหลือ {item.daysLeft} วัน
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-lg ml-1 flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-emerald-800 text-white' : 'bg-neutral-100 text-neutral-400'
                    }`}>
                      {isSelected ? <Check size={13} strokeWidth={2.5} /> : <Plus size={13} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ingredient Selector Card */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm space-y-5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-neutral-800 font-bold text-sm">
              1. วัตถุดิบที่เลือกสำหรับคิดค้นสูตร ({selectedIngredients.length} รายการ):
            </label>
            {selectedIngredients.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelectedIngredients}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
              >
                ล้างทั้งหมด
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 min-h-12 p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 items-center">
            {selectedIngredients.length === 0 ? (
              <span className="text-xs text-neutral-400 font-medium">
                ยังไม่ได้เลือกวัตถุดิบ (คลิกเลือกจากคลังตู้เย็น/ตู้กับข้าวด้านบน หรือพิมพ์ชื่อวัตถุดิบด้านล่าง)
              </span>
            ) : (
              selectedIngredients.map((ing) => (
                <span
                  key={ing}
                  className="inline-flex items-center gap-1 bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs animate-in fade-in zoom-in-95 duration-150"
                >
                  <span>{ing}</span>
                  <button
                    onClick={() => handleRemoveIngredient(ing)}
                    className="hover:bg-emerald-800 rounded-full p-0.5 transition-colors cursor-pointer"
                    title="ลบวัตถุดิบ"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Custom Input & Popular Pills */}
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="พิมพ์วัตถุดิบเพิ่มเติม เช่น สันในไก่, เห็ดเข็มทอง, ข้าวโอ๊ต..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddIngredient(customInput);
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <button
              onClick={() => handleAddIngredient(customInput)}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Plus size={15} />
              <span>เพิ่ม</span>
            </button>
          </div>

          <div>
            <span className="text-[11px] font-bold text-neutral-400 mb-1.5 block">
              วัตถุดิบยอดนิยม (คลิกเพื่อเลือกทันที):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_INGREDIENTS.map((item) => {
                const isSelected = selectedIngredients.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => {
                      if (isSelected) {
                        handleRemoveIngredient(item);
                      } else {
                        handleAddIngredient(item);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border border-transparent'
                    }`}
                  >
                    {isSelected ? `✓ ${item}` : `+ ${item}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dietary Goal Filters */}
        <div>
          <label className="block text-neutral-800 font-bold text-sm mb-2">
            2. สไตล์และเป้าหมายสุขภาพ (Dietary Goal):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-bold">
            {[
              { id: 'all', label: '🥗 ทุกสไตล์', desc: 'สมดุลโภชนาการ' },
              { id: 'high_protein', label: '🥩 โปรตีนสูง', desc: 'เน้นสร้างกล้าม' },
              { id: 'low_carb', label: '🌾 คาร์บต่ำ', desc: 'ลดบวม/คุมแป้ง' },
              { id: 'clean', label: '🌿 คลีน/ลีนไขมัน', desc: 'ไม่ใช้น้ำมัน' },
              { id: 'quick_15min', label: '⚡ ทำด่วน 15 นาที', desc: 'ประหยัดเวลา' },
              { id: 'keto', label: '🥑 คีโตเจนิค', desc: 'ไขมันดีสูง' }
            ].map((goal) => (
              <button
                key={goal.id}
                onClick={() => setDietaryGoal(goal.id as DietaryGoal)}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  dietaryGoal === goal.id
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
              >
                <div className="font-bold text-xs">{goal.label}</div>
                <div className={`text-[10px] mt-0.5 ${dietaryGoal === goal.id ? 'text-emerald-100' : 'text-neutral-400'}`}>
                  {goal.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Search Button */}
        <div className="pt-2">
          <button
            onClick={handleSearchAiRecipes}
            disabled={isLoading || selectedIngredients.length === 0}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>AI กำลังวิเคราะห์สูตรอาหารและคำนวณสารอาหาร...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} className="text-yellow-300" />
                <span>ค้นหาสูตรอาหารและคำนวณโภชนาการ (Generate Recipes)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recipes Result List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Utensils size={18} className="text-emerald-600" />
            <h3 className="font-extrabold text-neutral-900 text-base">
              สูตรอาหารแนะนำ ({recipes.length} เมนู)
            </h3>
            <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              เปิดอยู่ {expandedRecipeIds.length}/{recipes.length}
            </span>
          </div>

          {/* Quick Collapse / Expand All controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-600 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="ยุบรายละเอียดทุกสูตร"
            >
              <ChevronUp size={14} />
              <span>ยุบทั้งหมด</span>
            </button>
            <button
              type="button"
              onClick={handleExpandAll}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 active:scale-95 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="ขยายดูวิธีทำทุกสูตร"
            >
              <ChevronDown size={14} />
              <span>ขยายทั้งหมด</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {recipes.map((recipe) => {
            const isExpanded = expandedRecipeIds.includes(recipe.id);
            const isBookmarked = bookmarkedIds.includes(recipe.id);

            return (
              <div
                key={recipe.id}
                className="bg-white rounded-3xl border border-neutral-100 shadow-xs hover:border-emerald-200 transition-all overflow-hidden"
              >
                {/* Main Recipe Header */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div 
                      onClick={() => handleToggleExpand(recipe.id)}
                      className="space-y-1 flex-1 cursor-pointer group"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-extrabold text-neutral-900 text-base sm:text-lg group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                          <span>{recipe.recipeName}</span>
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-emerald-600 transition-transform" />
                          ) : (
                            <ChevronDown size={16} className="text-neutral-400 group-hover:text-emerald-600 transition-transform" />
                          )}
                        </h4>
                        <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                          {recipe.difficulty}
                        </span>
                      </div>
                      {recipe.englishName && (
                        <p className="text-xs text-neutral-400 font-medium">
                          {recipe.englishName}
                        </p>
                      )}
                      <p className="text-xs text-neutral-600 leading-relaxed pt-1">
                        {recipe.description}
                      </p>
                    </div>

                    {/* Bookmark & Log & Expand Toggle Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleBookmark(recipe.id)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                          isBookmarked
                            ? 'bg-rose-50 text-rose-500 border-rose-200 shadow-xs'
                            : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-500 border-neutral-200'
                        }`}
                        title={isBookmarked ? 'ลบออกจากรายการโปรด' : 'บันทึกเป็นสูตรโปรด'}
                      >
                        <Heart size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
                      </button>

                      <button
                        onClick={() => setLoggingRecipe(recipe)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>บันทึกลงมื้ออาหาร</span>
                      </button>
                    </div>
                  </div>

                  {/* Macro Badges Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-2">
                    <div className="bg-orange-50/80 p-2.5 rounded-2xl border border-orange-100 text-center">
                      <span className="block text-[10px] font-bold text-orange-600">พลังงาน</span>
                      <span className="font-extrabold text-orange-950 text-sm sm:text-base">
                        {recipe.calories}
                      </span>
                      <span className="text-[10px] text-orange-600 block">kcal</span>
                    </div>

                    <div className="bg-red-50/80 p-2.5 rounded-2xl border border-red-100 text-center">
                      <span className="block text-[10px] font-bold text-red-600">โปรตีน</span>
                      <span className="font-extrabold text-red-950 text-sm sm:text-base">
                        {recipe.proteinGrams}g
                      </span>
                      <span className="text-[10px] text-red-600 block">Protein</span>
                    </div>

                    <div className="bg-amber-50/80 p-2.5 rounded-2xl border border-amber-100 text-center">
                      <span className="block text-[10px] font-bold text-amber-800">คาร์บ</span>
                      <span className="font-extrabold text-amber-950 text-sm sm:text-base">
                        {recipe.carbsGrams}g
                      </span>
                      <span className="text-[10px] text-amber-800 block">Carbs</span>
                    </div>

                    <div className="bg-sky-50/80 p-2.5 rounded-2xl border border-sky-100 text-center">
                      <span className="block text-[10px] font-bold text-sky-800">ไขมัน</span>
                      <span className="font-extrabold text-sky-950 text-sm sm:text-base">
                        {recipe.fatGrams}g
                      </span>
                      <span className="text-[10px] text-sky-800 block">Fat</span>
                    </div>

                    <div className="col-span-4 sm:col-span-1 bg-emerald-50/80 p-2.5 rounded-2xl border border-emerald-100 text-center flex sm:flex-col items-center justify-between sm:justify-center">
                      <span className="text-[10px] font-bold text-emerald-800">เวลาทำ</span>
                      <span className="font-extrabold text-emerald-950 text-sm sm:text-base">
                        {recipe.prepTimeMinutes + recipe.cookTimeMinutes} นาที
                      </span>
                      <span className="text-[10px] text-emerald-800 hidden sm:block">Total Time</span>
                    </div>
                  </div>

                  {/* Health Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {recipe.healthTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-neutral-100 text-neutral-700 font-semibold px-2.5 py-0.5 rounded-lg"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Expand / Collapse Button */}
                  <button
                    onClick={() => handleToggleExpand(recipe.id)}
                    className={`w-full py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isExpanded
                        ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                        : 'bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80'
                    }`}
                  >
                    <span>{isExpanded ? 'ยุบสูตรนี้ (ซ่อนวิธีทำและวัตถุดิบ)' : 'ดูวิธีทำและรายการวัตถุดิบทั้งหมด (ขยาย)'}</span>
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="border-t border-neutral-100 bg-neutral-50/60 p-5 sm:p-6 space-y-5 animate-in fade-in duration-200">
                    {/* Ingredients Checklist */}
                    <div>
                      <h5 className="font-extrabold text-xs text-neutral-900 mb-2.5 flex items-center gap-1.5">
                        <Utensils size={14} className="text-emerald-600" />
                        <span>วัตถุดิบและสัดส่วน (Ingredients):</span>
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {recipe.ingredients.map((ing, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-2.5 rounded-xl border border-neutral-200/80 flex items-center justify-between text-xs"
                          >
                            <span className="font-semibold text-neutral-800">{ing.name}</span>
                            <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                              {ing.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step by Step Cooking Guide */}
                    <div>
                      <h5 className="font-extrabold text-xs text-neutral-900 mb-2.5 flex items-center gap-1.5">
                        <ChefHat size={14} className="text-emerald-600" />
                        <span>ขั้นตอนการทำ (Instructions):</span>
                      </h5>
                      <div className="space-y-2">
                        {recipe.steps.map((step, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded-xl border border-neutral-200/80 flex items-start gap-2.5 text-xs text-neutral-800 leading-relaxed"
                          >
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="flex-1 font-medium">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Nutrition Highlights & Pro Tip */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200/80 text-xs space-y-1">
                        <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <TrendingUp size={14} className="text-emerald-600" />
                          <span>คุณค่าทางโภชนาการ</span>
                        </div>
                        <p className="text-emerald-900 text-[11px] leading-relaxed">
                          {recipe.nutritionHighlights}
                        </p>
                      </div>

                      <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200/80 text-xs space-y-1">
                        <div className="font-bold text-amber-950 flex items-center gap-1.5">
                          <Zap size={14} className="text-amber-600" />
                          <span>ทริคการปรุงเพื่อสุขภาพ (Chef's Tip)</span>
                        </div>
                        <p className="text-amber-900 text-[11px] leading-relaxed">
                          {recipe.proTip}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Log Meal To Diary Modal */}
      {loggingRecipe && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-neutral-100">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Utensils size={18} className="text-emerald-600" />
                <h3 className="font-extrabold text-base text-neutral-900">
                  บันทึกลงมื้ออาหารวันนี้
                </h3>
              </div>
              <button
                onClick={() => setLoggingRecipe(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div>
              <h4 className="font-extrabold text-neutral-900 text-sm">
                {loggingRecipe.recipeName}
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                เลือกประเภทมื้ออาหารและจำนวนที่รับประทาน
              </p>
            </div>

            {/* Meal Type Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-700">มื้ออาหาร:</label>
              <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                {[
                  { id: 'breakfast', label: '🌅 เช้า' },
                  { id: 'lunch', label: '☀️ เที่ยง' },
                  { id: 'dinner', label: '🌙 เย็น' },
                  { id: 'snack', label: '🍪 ว่าง' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMealType(m.id as any)}
                    className={`py-2 rounded-xl border transition-all cursor-pointer ${
                      selectedMealType === m.id
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Portion Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-700">
                จำนวนเสิร์ฟ (Portion): <span className="text-emerald-600 font-extrabold">{portionMultiplier} จาน/เสิร์ฟ</span>
              </label>
              <div className="flex gap-2">
                {[0.5, 1, 1.5, 2].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPortionMultiplier(p)}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      portionMultiplier === p
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    {p} เสิร์ฟ
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Macros Preview */}
            <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-medium">พลังงานรวมที่ได้รับ:</span>
                <span className="font-extrabold text-orange-600 text-sm">
                  {Math.round(loggingRecipe.calories * portionMultiplier)} kcal
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
                <div className="bg-white p-1.5 rounded-lg border border-neutral-100">
                  <span className="text-red-600 block">โปรตีน</span>
                  <span className="text-neutral-800">{Math.round(loggingRecipe.proteinGrams * portionMultiplier)}g</span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-neutral-100">
                  <span className="text-amber-800 block">คาร์บ</span>
                  <span className="text-neutral-800">{Math.round(loggingRecipe.carbsGrams * portionMultiplier)}g</span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-neutral-100">
                  <span className="text-sky-800 block">ไขมัน</span>
                  <span className="text-neutral-800">{Math.round(loggingRecipe.fatGrams * portionMultiplier)}g</span>
                </div>
              </div>
            </div>

            {/* Auto Deduct Inventory Stock Option */}
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={15} className="text-emerald-700 shrink-0" />
                <span className="text-xs font-semibold text-emerald-950">
                  ตัดสต็อกวัตถุดิบออกจากตู้เย็น/ตู้กับข้าวอัตโนมัติ
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoDeductStock}
                onChange={(e) => setAutoDeductStock(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setLoggingRecipe(null)}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmLogMeal}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check size={15} />
                <span>ยืนยันบันทึก</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
