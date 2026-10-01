export type StorageLocation = 'fridge' | 'pantry' | 'freezer';
export type FoodCategory = 'meat_protein' | 'produce' | 'dairy_eggs' | 'pantry_grains' | 'seasoning' | 'other';

export interface InventoryItem {
  id: string;
  name: string;
  category: FoodCategory;
  storageLocation: StorageLocation;
  quantity: string;
  expiryDate: string; // YYYY-MM-DD
  daysLeft: number;
  addedAt: number;
  note?: string;
}

const INVENTORY_STORAGE_KEY = 'kalguru_unified_inventory_v1';
const LEGACY_FRIDGE_KEY = 'kalguru_fridge_items';
const SHOPPING_STORAGE_KEY = 'kalguru_shopping_list_v1';

export const DEFAULT_INVENTORY_ITEMS: InventoryItem[] = [
  { id: 'inv-1', name: 'อกไก่สดลอกหนัง', category: 'meat_protein', storageLocation: 'fridge', expiryDate: '2026-08-26', daysLeft: 2, quantity: '400 กรัม', addedAt: Date.now() },
  { id: 'inv-2', name: 'ผักกวางตุ้งฮ่องเต้', category: 'produce', storageLocation: 'fridge', expiryDate: '2026-08-25', daysLeft: 1, quantity: '1 กำ', addedAt: Date.now() },
  { id: 'inv-3', name: 'ไข่ไก่สดเบอร์ 2', category: 'dairy_eggs', storageLocation: 'fridge', expiryDate: '2026-09-02', daysLeft: 9, quantity: '8 ฟอง', addedAt: Date.now() },
  { id: 'inv-4', name: 'เต้าหู้ไข่', category: 'meat_protein', storageLocation: 'fridge', expiryDate: '2026-08-27', daysLeft: 3, quantity: '2 หลอด', addedAt: Date.now() },
  { id: 'inv-5', name: 'มะเขือเทศเชอร์รี่', category: 'produce', storageLocation: 'fridge', expiryDate: '2026-08-28', daysLeft: 4, quantity: '1 กล่อง', addedAt: Date.now() },
  { id: 'inv-6', name: 'เห็ดชิเมจิขาว', category: 'produce', storageLocation: 'fridge', expiryDate: '2026-08-26', daysLeft: 2, quantity: '1 แพ็ค', addedAt: Date.now() },
  { id: 'inv-7', name: 'ข้าวกล้องหอมมะลิ', category: 'pantry_grains', storageLocation: 'pantry', expiryDate: '2026-12-31', daysLeft: 120, quantity: '1 ถุง (2 kg)', addedAt: Date.now() },
  { id: 'inv-8', name: 'ข้าวโอ๊ตเต็มเมล็ด (Rolled Oats)', category: 'pantry_grains', storageLocation: 'pantry', expiryDate: '2026-11-15', daysLeft: 80, quantity: '500g', addedAt: Date.now() },
  { id: 'inv-9', name: 'ซีอิ๊วขาวโซเดียมต่ำ', category: 'seasoning', storageLocation: 'pantry', expiryDate: '2027-01-01', daysLeft: 130, quantity: '1 ขวด', addedAt: Date.now() },
  { id: 'inv-10', name: 'น้ำมันมะกอก Extra Virgin', category: 'seasoning', storageLocation: 'pantry', expiryDate: '2027-02-15', daysLeft: 175, quantity: '1 ขวด', addedAt: Date.now() },
  { id: 'inv-11', name: 'พริกไทยดำบดสด', category: 'seasoning', storageLocation: 'pantry', expiryDate: '2027-03-01', daysLeft: 190, quantity: '1 ขวด', addedAt: Date.now() },
  { id: 'inv-12', name: 'แซลมอนแช่แข็ง', category: 'meat_protein', storageLocation: 'freezer', expiryDate: '2026-09-30', daysLeft: 37, quantity: '2 ชิ้น', addedAt: Date.now() }
];

export const loadInventory = (): InventoryItem[] => {
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (raw) {
      const items: InventoryItem[] = JSON.parse(raw);
      // Recalculate daysLeft dynamically based on today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return items.map(item => {
        if (item.expiryDate) {
          const exp = new Date(item.expiryDate);
          exp.setHours(0, 0, 0, 0);
          const diffTime = exp.getTime() - today.getTime();
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return { ...item, daysLeft };
        }
        return item;
      });
    }

    // Check legacy fridge items if available
    const legacy = localStorage.getItem(LEGACY_FRIDGE_KEY);
    if (legacy) {
      const legacyItems = JSON.parse(legacy);
      if (Array.isArray(legacyItems) && legacyItems.length > 0) {
        const converted: InventoryItem[] = legacyItems.map((it: any) => ({
          id: it.id || `inv-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: it.name || 'วัตถุดิบ',
          category: it.category === 'dairy_eggs' ? 'dairy_eggs' : it.category === 'meat_protein' ? 'meat_protein' : 'produce',
          storageLocation: 'fridge',
          quantity: it.quantity || '1 ชิ้น',
          expiryDate: it.expiryDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          daysLeft: it.daysLeft ?? 3,
          addedAt: it.addedAt || Date.now()
        }));
        saveInventory(converted);
        return converted;
      }
    }

    // Default setup
    saveInventory(DEFAULT_INVENTORY_ITEMS);
    return DEFAULT_INVENTORY_ITEMS;
  } catch (e) {
    console.error('Failed to load inventory:', e);
    return DEFAULT_INVENTORY_ITEMS;
  }
};

export const saveInventory = (items: InventoryItem[]): void => {
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
    // Also update legacy key for backward compatibility
    localStorage.setItem(LEGACY_FRIDGE_KEY, JSON.stringify(items.filter(i => i.storageLocation === 'fridge' || i.storageLocation === 'freezer')));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kalguru_inventory_updated', { detail: items }));
    }
  } catch (e) {
    console.error('Failed to save inventory:', e);
  }
};

export const addInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'addedAt'>): InventoryItem => {
  const items = loadInventory();
  const newItem: InventoryItem = {
    ...itemData,
    id: `inv-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    addedAt: Date.now()
  };
  const updated = [newItem, ...items];
  saveInventory(updated);
  return newItem;
};

export const deleteInventoryItem = (id: string): void => {
  const items = loadInventory();
  const updated = items.filter(i => i.id !== id);
  saveInventory(updated);
};

export const getExpiringSoonItems = (daysThreshold = 2): InventoryItem[] => {
  const items = loadInventory();
  return items.filter(i => (i.storageLocation === 'fridge' || i.storageLocation === 'pantry' || i.storageLocation === 'freezer') && i.daysLeft <= daysThreshold);
};

export const getAllAvailableIngredients = (): string[] => {
  const items = loadInventory();
  return Array.from(new Set(items.map(i => i.name.trim()))).filter(Boolean);
};

export const sendItemToGroceryShoppingList = (
  itemName: string, 
  amount: string = '1 หน่วย', 
  category: 'produce' | 'meat' | 'dairy' | 'pantry' | 'other' = 'produce',
  onToast?: (msg: string) => void
): void => {
  try {
    const raw = localStorage.getItem(SHOPPING_STORAGE_KEY);
    const shoppingList: any[] = raw ? JSON.parse(raw) : [];
    
    // Check if already in shopping list
    const exists = shoppingList.find(i => i.name.toLowerCase() === itemName.toLowerCase() && !i.completed);
    if (exists) {
      if (onToast) onToast(`🛒 "${itemName}" มีอยู่ในรายการซื้อของแล้ว`);
      return;
    }

    const newItem = {
      id: `sp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: itemName,
      amount: amount || '1 หน่วย',
      category: category,
      completed: false,
      recipeSource: 'จากคลังตู้เย็น/ตู้กับข้าว'
    };

    const updated = [newItem, ...shoppingList];
    localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kalguru_shopping_updated', { detail: updated }));
    }
    if (onToast) onToast(`🛒 เพิ่ม "${itemName}" เข้าลิสต์จ่ายตลาดเรียบร้อยแล้ว!`);
  } catch (e) {
    console.error('Error adding to grocery list:', e);
  }
};

export const transferCheckedGroceryToInventory = (
  completedItems: { id: string; name: string; amount?: string; category?: string }[],
  onToast?: (msg: string) => void
): number => {
  if (!completedItems || completedItems.length === 0) return 0;

  const currentInventory = loadInventory();
  const newItems: InventoryItem[] = [];

  completedItems.forEach(c => {
    let storageLocation: StorageLocation = 'fridge';
    let foodCategory: FoodCategory = 'produce';
    let defaultDays = 5;

    if (c.category === 'meat') {
      foodCategory = 'meat_protein';
      defaultDays = 3;
      storageLocation = 'fridge';
    } else if (c.category === 'dairy') {
      foodCategory = 'dairy_eggs';
      defaultDays = 10;
      storageLocation = 'fridge';
    } else if (c.category === 'pantry') {
      foodCategory = 'pantry_grains';
      defaultDays = 60;
      storageLocation = 'pantry';
    } else if (c.category === 'produce') {
      foodCategory = 'produce';
      defaultDays = 4;
      storageLocation = 'fridge';
    }

    const expDate = new Date();
    expDate.setDate(expDate.getDate() + defaultDays);

    newItems.push({
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: c.name.trim(),
      category: foodCategory,
      storageLocation: storageLocation,
      quantity: c.amount || '1 หน่วย',
      expiryDate: expDate.toISOString().split('T')[0],
      daysLeft: defaultDays,
      addedAt: Date.now()
    });
  });

  const merged = [...newItems, ...currentInventory];
  saveInventory(merged);

  if (onToast) {
    onToast(`📥 โอนของที่ซื้อแล้ว ${newItems.length} รายการ เข้าตู้เย็น/ตู้กับข้าวเรียบร้อย!`);
  }

  return newItems.length;
};

export const deductIngredientsAfterCooking = (
  usedIngredientNames: string[],
  onToast?: (msg: string) => void
): number => {
  if (!usedIngredientNames || usedIngredientNames.length === 0) return 0;

  const currentInventory = loadInventory();
  let deductedCount = 0;
  
  // Filter out items that match or partially match used ingredients
  const updated = currentInventory.filter(item => {
    const isUsed = usedIngredientNames.some(used => 
      used.toLowerCase().includes(item.name.toLowerCase()) || 
      item.name.toLowerCase().includes(used.toLowerCase())
    );
    if (isUsed) {
      deductedCount++;
      return false; // remove from inventory
    }
    return true;
  });

  if (deductedCount > 0) {
    saveInventory(updated);
    if (onToast) {
      onToast(`🍳 ตัดสต็อกวัตถุดิบในตู้เย็น/ตู้กับข้าวไปแล้ว ${deductedCount} รายการ`);
    }
  }

  return deductedCount;
};
